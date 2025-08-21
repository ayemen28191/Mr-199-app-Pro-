import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  FileText, 
  Download, 
  Filter, 
  Calendar, 
  Package, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Wrench,
  MapPin,
  DollarSign,
  Clock,
  Search,
  RefreshCw
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatsCard } from '@/components/ui/stats-card';

import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Types
interface ToolsReportsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ToolsStats {
  totalTools: number;
  availableTools: number;
  inUseTools: number;
  maintenanceTools: number;
  damagedTools: number;
  totalValue: number;
  averageUsage: number;
  categoriesCount: number;
}

interface CategoryStats {
  id: string;
  name: string;
  toolCount: number;
  totalValue: number;
  averageCondition: string;
  mostUsedTool?: string;
}

interface ToolUsageReport {
  id: string;
  name: string;
  category: string;
  usageCount: number;
  lastUsed: string;
  condition: string;
  location: string;
  status: string;
}

interface MaintenanceReport {
  id: string;
  toolName: string;
  lastMaintenance: string;
  nextMaintenance: string;
  overdue: boolean;
  daysOverdue?: number;
  maintenanceType: string;
}

const ToolsReportsDialog: React.FC<ToolsReportsDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { toast } = useToast();

  // Fetch tools statistics
  const { data: toolsStats, isLoading: statsLoading } = useQuery<ToolsStats>({
    queryKey: ['/api/tools/stats', selectedPeriod],
    enabled: open,
  });

  // Fetch categories statistics
  const { data: categoriesStats = [], isLoading: categoriesLoading } = useQuery<CategoryStats[]>({
    queryKey: ['/api/tools/categories-stats', selectedPeriod],
    enabled: open,
  });

  // Fetch usage report
  const { data: usageReport = [], isLoading: usageLoading } = useQuery<ToolUsageReport[]>({
    queryKey: ['/api/tools/usage-report', selectedPeriod, selectedCategory],
    enabled: open,
  });

  // Fetch maintenance report
  const { data: maintenanceReport = [], isLoading: maintenanceLoading } = useQuery<MaintenanceReport[]>({
    queryKey: ['/api/tools/maintenance-report'],
    enabled: open,
  });

  // Filter usage report
  const filteredUsageReport = usageReport.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate and download report
  const downloadReport = async (reportType: string) => {
    try {
      const response = await fetch(`/api/tools/export-report?type=${reportType}&period=${selectedPeriod}&category=${selectedCategory}`);
      
      if (!response.ok) {
        throw new Error('فشل في تصدير التقرير');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `تقرير_الأدوات_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'تم تصدير التقرير بنجاح',
        description: 'تم تحميل ملف التقرير',
      });
    } catch (error) {
      toast({
        title: 'خطأ في تصدير التقرير',
        description: 'حدث خطأ أثناء تصدير التقرير',
        variant: 'destructive',
      });
    }
  };

  // Get status info
  const getStatusInfo = (status: string) => {
    const statusMap = {
      available: { color: 'text-green-600', text: 'متاح', icon: CheckCircle },
      in_use: { color: 'text-blue-600', text: 'قيد الاستخدام', icon: Wrench },
      maintenance: { color: 'text-yellow-600', text: 'صيانة', icon: Clock },
      damaged: { color: 'text-red-600', text: 'معطل', icon: AlertTriangle },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.available;
  };

  const getConditionColor = (condition: string) => {
    const conditionMap = {
      excellent: 'text-emerald-600',
      good: 'text-green-600',
      fair: 'text-yellow-600',
      poor: 'text-orange-600',
      damaged: 'text-red-600',
    };
    return conditionMap[condition as keyof typeof conditionMap] || 'text-gray-600';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[98vw] max-w-7xl h-[95vh] overflow-hidden flex flex-col p-0" dir="rtl">
        {/* Header احترافي مضغوط */}
        <DialogHeader className="flex-shrink-0 px-6 py-3 border-b bg-gradient-to-l from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                  <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    تقارير وإحصائيات الأدوات
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-600 dark:text-gray-400">
                    لوحة تحكم شاملة متقدمة
                  </DialogDescription>
                </div>
              </div>
            </div>
            
            {/* فلاتر سريعة في الهيدر */}
            <div className="flex items-center gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 أيام</SelectItem>
                  <SelectItem value="30">30 يوم</SelectItem>
                  <SelectItem value="90">3 أشهر</SelectItem>
                  <SelectItem value="365">سنة</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue placeholder="التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل التصنيفات</SelectItem>
                  {categoriesStats.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* محتوى الصفحة */}
        <div className="flex-1 overflow-auto p-4">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {/* تبويبات مضغوطة احترافية */}
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg mb-3 h-9">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-1.5 text-xs font-medium py-1.5 px-2 h-8 rounded-md transition-all" 
              data-testid="tab-overview"
            >
              <BarChart3 className="h-3 w-3" />
              <span>عامة</span>
            </TabsTrigger>
            <TabsTrigger 
              value="usage" 
              className="flex items-center gap-1.5 text-xs font-medium py-1.5 px-2 h-8 rounded-md transition-all" 
              data-testid="tab-usage"
            >
              <TrendingUp className="h-3 w-3" />
              <span>استخدام</span>
            </TabsTrigger>
            <TabsTrigger 
              value="maintenance" 
              className="flex items-center gap-1.5 text-xs font-medium py-1.5 px-2 h-8 rounded-md transition-all" 
              data-testid="tab-maintenance"
            >
              <Wrench className="h-3 w-3" />
              <span>صيانة</span>
            </TabsTrigger>
            <TabsTrigger 
              value="categories" 
              className="flex items-center gap-1.5 text-xs font-medium py-1.5 px-2 h-8 rounded-md transition-all" 
              data-testid="tab-categories"
            >
              <Package className="h-3 w-3" />
              <span>تصنيفات</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - احترافي مضغوط */}
          <TabsContent value="overview" className="flex-1 overflow-auto space-y-3">
            {/* الإحصائيات الرئيسية - مضغوطة */}
            <div className="bg-gradient-to-l from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 rounded-lg p-3">
              {/* صف أول */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي الأدوات</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {toolsStats?.totalTools || 0}
                      </p>
                    </div>
                    <Package className="h-6 w-6 text-blue-500 opacity-25" />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">متاح للعمل</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {toolsStats?.availableTools || 0}
                      </p>
                    </div>
                    <CheckCircle className="h-6 w-6 text-green-500 opacity-25" />
                  </div>
                </div>
              </div>
              
              {/* صف ثاني */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">قيد الاستخدام</p>
                      <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        {toolsStats?.inUseTools || 0}
                      </p>
                    </div>
                    <Wrench className="h-6 w-6 text-orange-500 opacity-25" />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">صيانة ومعطل</p>
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">
                        {(toolsStats?.maintenanceTools || 0) + (toolsStats?.damagedTools || 0)}
                      </p>
                    </div>
                    <AlertTriangle className="h-6 w-6 text-red-500 opacity-25" />
                  </div>
                </div>
              </div>
            </div>

            {/* معلومات إضافية مضغوطة */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-3 w-3 text-green-600" />
                  <span className="text-xs font-medium">إجمالي القيمة</span>
                </div>
                <p className="text-sm font-bold">
                  {(toolsStats?.totalValue || 0).toLocaleString('en-US')} <span className="text-xs text-gray-500">ر.ي</span>
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-medium">معدل الاستخدام</span>
                </div>
                <p className="text-sm font-bold">
                  {toolsStats?.averageUsage || 0}<span className="text-xs text-gray-500">%</span>
                </p>
              </div>
            </div>

            {/* تفاصيل سريعة */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">عالي الاستخدام</p>
                  <p className="text-sm font-bold text-blue-600">
                    {usageReport.filter(tool => tool.usageCount > 10).length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">غير مستخدم</p>
                  <p className="text-sm font-bold text-red-600">
                    {usageReport.filter(tool => tool.usageCount === 0).length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">التصنيفات</p>
                  <p className="text-sm font-bold text-purple-600">
                    {toolsStats?.categoriesCount || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* إجراءات سريعة */}
            <div className="flex gap-2">
              <Button 
                onClick={() => downloadReport('overview')} 
                size="sm" 
                className="flex-1 h-7 text-xs"
                data-testid="button-export-overview"
              >
                <Download className="h-3 w-3 ml-1" />
                تصدير عام
              </Button>
              <Button 
                variant="outline" 
                onClick={() => downloadReport('detailed')} 
                size="sm" 
                className="flex-1 h-7 text-xs"
                data-testid="button-export-detailed"
              >
                <FileText className="h-3 w-3 ml-1" />
                تقرير مفصل
              </Button>
            </div>
          </TabsContent>

          {/* Usage Report Tab */}
          <TabsContent value="usage" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث في الأدوات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 w-full"
                  data-testid="input-search-tools"
                />
              </div>
              <Button onClick={() => downloadReport('usage')} className="w-full sm:w-auto" data-testid="button-export-usage">
                <Download className="h-4 w-4 ml-1" />
                <span className="hidden sm:inline">تصدير تقرير الاستخدام</span>
                <span className="sm:hidden">تصدير التقرير</span>
              </Button>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>تقرير استخدام الأدوات</span>
                  <Badge variant="outline" className="mr-auto text-xs">
                    {filteredUsageReport.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usageLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 animate-pulse text-gray-400 mx-auto mb-4" />
                      <p className="text-muted-foreground">جاري تحميل التقرير...</p>
                    </div>
                  </div>
                ) : filteredUsageReport.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا توجد بيانات</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? 'لا توجد أدوات تطابق البحث' : 'لا توجد بيانات استخدام في الفترة المحددة'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">اسم الأداة</TableHead>
                            <TableHead className="text-right">التصنيف</TableHead>
                            <TableHead className="text-right">عدد مرات الاستخدام</TableHead>
                            <TableHead className="text-right">آخر استخدام</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="text-right">الموقع</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsageReport.map((tool) => {
                            const statusInfo = getStatusInfo(tool.status);
                            const StatusIcon = statusInfo.icon;
                            return (
                              <TableRow key={tool.id}>
                                <TableCell className="font-medium">{tool.name}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{tool.category}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={tool.usageCount > 10 ? "default" : tool.usageCount > 5 ? "secondary" : "outline"}
                                  >
                                    {tool.usageCount}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {tool.lastUsed ? new Date(tool.lastUsed).toLocaleDateString('en-GB') : 'لم يستخدم'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                                    <span className={`text-sm ${statusInfo.color}`}>
                                      {statusInfo.text}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {tool.location}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {filteredUsageReport.map((tool) => {
                        const statusInfo = getStatusInfo(tool.status);
                        const StatusIcon = statusInfo.icon;
                        return (
                          <Card key={tool.id} className="p-3 sm:p-4 shadow-sm" data-testid={`card-tool-${tool.id}`}>
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-sm sm:text-base mb-1 truncate" title={tool.name}>{tool.name}</h3>
                                  <Badge variant="outline" className="text-xs">{tool.category}</Badge>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <Badge 
                                    variant={tool.usageCount > 10 ? "default" : tool.usageCount > 5 ? "secondary" : "outline"}
                                    className="text-xs whitespace-nowrap"
                                  >
                                    {tool.usageCount} مرة
                                  </Badge>
                                  <div className="flex items-center gap-1">
                                    <StatusIcon className={`h-3 w-3 ${statusInfo.color}`} />
                                    <span className={`text-xs ${statusInfo.color}`}>
                                      {statusInfo.text}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground text-xs">آخر استخدام:</span>
                                  <span className="font-medium text-xs">
                                    {tool.lastUsed ? new Date(tool.lastUsed).toLocaleDateString('en-GB') : 'لم يستخدم'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground text-xs">الموقع:</span>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span className="font-medium text-xs">{tool.location}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Report Tab */}
          <TabsContent value="maintenance" className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              <h3 className="text-lg font-semibold">تقرير الصيانة والمتابعة</h3>
              <Button onClick={() => downloadReport('maintenance')} className="w-full sm:w-auto" data-testid="button-export-maintenance">
                <Download className="h-4 w-4 ml-1" />
                <span className="hidden sm:inline">تصدير تقرير الصيانة</span>
                <span className="sm:hidden">تصدير التقرير</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard
                title="أدوات تحتاج صيانة"
                value={maintenanceReport.filter(item => item.overdue).length}
                icon={AlertTriangle}
                color="red"
              />
              <StatsCard
                title="صيانة مجدولة"
                value={maintenanceReport.filter(item => !item.overdue).length}
                icon={Clock}
                color="orange"
              />
              <StatsCard
                title="إجمالي أدوات الصيانة"
                value={maintenanceReport.length}
                icon={Wrench}
                color="blue"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  جدول الصيانة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {maintenanceLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <Wrench className="h-12 w-12 animate-pulse text-gray-400 mx-auto mb-4" />
                      <p className="text-muted-foreground">جاري تحميل بيانات الصيانة...</p>
                    </div>
                  </div>
                ) : maintenanceReport.length === 0 ? (
                  <div className="text-center py-12">
                    <Wrench className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا توجد جدولة صيانة</h3>
                    <p className="text-muted-foreground">لا توجد أدوات مجدولة للصيانة</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">اسم الأداة</TableHead>
                            <TableHead className="text-right">آخر صيانة</TableHead>
                            <TableHead className="text-right">الصيانة القادمة</TableHead>
                            <TableHead className="text-right">نوع الصيانة</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {maintenanceReport.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.toolName}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {item.lastMaintenance ? new Date(item.lastMaintenance).toLocaleDateString('ar-SA') : 'لا توجد'}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {new Date(item.nextMaintenance).toLocaleDateString('ar-SA')}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{item.maintenanceType}</Badge>
                              </TableCell>
                              <TableCell>
                                {item.overdue ? (
                                  <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                    <AlertTriangle className="h-3 w-3" />
                                    متأخر {item.daysOverdue} يوم
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                    <CheckCircle className="h-3 w-3" />
                                    مجدول
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {maintenanceReport.map((item) => (
                        <Card key={item.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <h3 className="font-medium text-base">{item.toolName}</h3>
                              {item.overdue ? (
                                <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                                  <AlertTriangle className="h-3 w-3" />
                                  متأخر {item.daysOverdue} يوم
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                                  <CheckCircle className="h-3 w-3" />
                                  مجدول
                                </Badge>
                              )}
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">آخر صيانة:</span>
                                <span className="font-medium">
                                  {item.lastMaintenance ? new Date(item.lastMaintenance).toLocaleDateString('ar-SA') : 'لا توجد'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">الصيانة القادمة:</span>
                                <span className="font-medium">
                                  {new Date(item.nextMaintenance).toLocaleDateString('ar-SA')}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">نوع الصيانة:</span>
                                <Badge variant="outline" className="text-xs">{item.maintenanceType}</Badge>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Analysis Tab */}
          <TabsContent value="categories" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              <h3 className="text-lg font-semibold">تحليل التصنيفات</h3>
              <Button onClick={() => downloadReport('categories')} className="w-full sm:w-auto" data-testid="button-export-categories">
                <Download className="h-4 w-4 ml-1" />
                <span className="hidden sm:inline">تصدير تحليل التصنيفات</span>
                <span className="sm:hidden">تصدير التحليل</span>
              </Button>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                  إحصائيات التصنيفات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoriesLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <Package className="h-12 w-12 animate-pulse text-gray-400 mx-auto mb-4" />
                      <p className="text-muted-foreground">جاري تحميل تحليل التصنيفات...</p>
                    </div>
                  </div>
                ) : categoriesStats.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا توجد تصنيفات</h3>
                    <p className="text-muted-foreground">لا توجد تصنيفات للتحليل</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {categoriesStats.map((category) => (
                      <Card key={category.id} className="shadow-sm" data-testid={`card-category-${category.id}`}>
                        <CardContent className="p-3 sm:p-4">
                          <div>
                            <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">{category.name}</h4>
                            
                            {/* Mobile Layout - Improved 2x2 grid */}
                            <div className="grid grid-cols-2 gap-3 sm:hidden">
                              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{category.toolCount}</p>
                                <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">عدد الأدوات</p>
                              </div>
                              <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                  {category.totalValue ? (category.totalValue >= 1000 ? Math.round(category.totalValue/1000) + 'ك' : category.totalValue.toLocaleString('en-US')) : '0'}
                                </p>
                                <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">القيمة (ر.ي)</p>
                              </div>
                              <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                <p className={`text-sm font-bold ${getConditionColor(category.averageCondition)}`}>
                                  {category.averageCondition === 'excellent' ? 'ممتاز' :
                                   category.averageCondition === 'good' ? 'جيد' :
                                   category.averageCondition === 'fair' ? 'مقبول' :
                                   category.averageCondition === 'poor' ? 'ضعيف' : 'معطل'}
                                </p>
                                <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">متوسط الحالة</p>
                              </div>
                              <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 truncate" title={category.mostUsedTool || 'لا يوجد'}>
                                  {category.mostUsedTool || 'لا يوجد'}
                                </p>
                                <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">الأكثر استخداماً</p>
                              </div>
                            </div>
                            
                            {/* Desktop/Tablet Layout - 4 columns */}
                            <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-4 bg-muted/30 rounded-lg">
                                <p className="text-2xl font-bold text-primary">{category.toolCount}</p>
                                <p className="text-sm text-muted-foreground">عدد الأدوات</p>
                              </div>
                              <div className="text-center p-4 bg-muted/30 rounded-lg">
                                <p className="text-2xl font-bold text-green-600">
                                  {category.totalValue?.toLocaleString('en-US') || 0}
                                </p>
                                <p className="text-sm text-muted-foreground">القيمة الإجمالية (ر.ي)</p>
                              </div>
                              <div className="text-center p-4 bg-muted/30 rounded-lg">
                                <p className={`text-2xl font-bold ${getConditionColor(category.averageCondition)}`}>
                                  {category.averageCondition === 'excellent' ? 'ممتاز' :
                                   category.averageCondition === 'good' ? 'جيد' :
                                   category.averageCondition === 'fair' ? 'مقبول' :
                                   category.averageCondition === 'poor' ? 'ضعيف' : 'معطل'}
                                </p>
                                <p className="text-sm text-muted-foreground">متوسط الحالة</p>
                              </div>
                              <div className="text-center p-4 bg-muted/30 rounded-lg">
                                <p className="text-sm font-medium text-muted-foreground">الأكثر استخداماً:</p>
                                <p className="text-sm font-bold">
                                  {category.mostUsedTool || 'غير محدد'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ToolsReportsDialog;