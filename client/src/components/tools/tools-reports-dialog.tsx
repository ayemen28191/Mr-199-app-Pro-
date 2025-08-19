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
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-6xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
            تقارير وإحصائيات الأدوات
          </DialogTitle>
          <DialogDescription className="text-sm">
            تقارير شاملة وتحليلات ذكية لإدارة الأدوات والمعدات
          </DialogDescription>
        </DialogHeader>

        {/* Filters - Mobile Responsive */}
        <div className="flex flex-col gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg sm:grid sm:grid-cols-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">الفترة:</span>
            </div>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">آخر 7 أيام</SelectItem>
                <SelectItem value="30">آخر 30 يوم</SelectItem>
                <SelectItem value="90">آخر 3 أشهر</SelectItem>
                <SelectItem value="365">آخر سنة</SelectItem>
                <SelectItem value="all">جميع الفترات</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">التصنيف:</span>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التصنيفات</SelectItem>
                {categoriesStats.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" className="w-full sm:w-auto sm:mr-auto">
            <RefreshCw className="h-4 w-4 ml-1" />
            تحديث
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-muted/30 p-1 rounded-lg mb-4 sm:mb-6 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm font-medium py-3 px-2 flex-col gap-1 lg:flex-row lg:gap-2" data-testid="tab-overview">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-[10px] sm:text-xs lg:text-sm">نظرة عامة</span>
            </TabsTrigger>
            <TabsTrigger value="usage" className="text-xs sm:text-sm font-medium py-3 px-2 flex-col gap-1 lg:flex-row lg:gap-2" data-testid="tab-usage">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-[10px] sm:text-xs lg:text-sm">الاستخدام</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="text-xs sm:text-sm font-medium py-3 px-2 flex-col gap-1 lg:flex-row lg:gap-2 col-span-2 lg:col-span-1" data-testid="tab-maintenance">
              <Wrench className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-[10px] sm:text-xs lg:text-sm">الصيانة</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-xs sm:text-sm font-medium py-3 px-2 flex-col gap-1 lg:flex-row lg:gap-2 col-span-2 lg:col-span-1" data-testid="tab-categories">
              <Package className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-[10px] sm:text-xs lg:text-sm">التصنيفات</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Statistics Cards - Mobile Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatsCard
                title="إجمالي الأدوات"
                value={toolsStats?.totalTools || 0}
                icon={Package}
                color="blue"
              />
              <StatsCard
                title="متاح"
                value={toolsStats?.availableTools || 0}
                icon={CheckCircle}
                color="green"
              />
              <StatsCard
                title="قيد الاستخدام"
                value={toolsStats?.inUseTools || 0}
                icon={Wrench}
                color="orange"
              />
              <StatsCard
                title="صيانة ومعطل"
                value={(toolsStats?.maintenanceTools || 0) + (toolsStats?.damagedTools || 0)}
                icon={AlertTriangle}
                color="red"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Financial Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    النظرة المالية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">القيمة الإجمالية:</span>
                    <span className="font-bold text-lg">
                      {toolsStats?.totalValue?.toLocaleString('en-US') || 0} ريال
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">متوسط قيمة الأداة:</span>
                    <span className="font-medium">
                      {toolsStats && toolsStats.totalTools > 0 
                        ? Math.round(toolsStats.totalValue / toolsStats.totalTools).toLocaleString('en-US')
                        : 0} ريال
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">عدد التصنيفات:</span>
                    <span className="font-medium">{toolsStats?.categoriesCount || 0}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    نظرة عامة على الاستخدام
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">معدل الاستخدام:</span>
                    <span className="font-bold text-lg">
                      {toolsStats?.averageUsage || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">أدوات عالية الاستخدام:</span>
                    <span className="font-medium">
                      {usageReport.filter(tool => tool.usageCount > 10).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">أدوات غير مستخدمة:</span>
                    <span className="font-medium">
                      {usageReport.filter(tool => tool.usageCount === 0).length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => downloadReport('overview')} className="w-full sm:w-auto" data-testid="button-export-overview">
                <Download className="h-4 w-4 ml-1" />
                <span className="hidden sm:inline">تصدير النظرة العامة</span>
                <span className="sm:hidden">تصدير عام</span>
              </Button>
              <Button variant="outline" onClick={() => downloadReport('detailed')} className="w-full sm:w-auto" data-testid="button-export-detailed">
                <FileText className="h-4 w-4 ml-1" />
                <span className="hidden sm:inline">تقرير مفصل</span>
                <span className="sm:hidden">تقرير مفصل</span>
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
                                  {tool.lastUsed ? new Date(tool.lastUsed).toLocaleDateString('ar-SA') : 'لم يستخدم'}
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
                                    {tool.lastUsed ? new Date(tool.lastUsed).toLocaleDateString('ar-SA') : 'لم يستخدم'}
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
                            
                            {/* Mobile Layout - 2 columns */}
                            <div className="grid grid-cols-2 gap-3 sm:hidden">
                              <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <p className="text-lg font-bold text-primary">{category.toolCount}</p>
                                <p className="text-xs text-muted-foreground">عدد الأدوات</p>
                              </div>
                              <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <p className="text-lg font-bold text-green-600">
                                  {category.totalValue ? Math.round(category.totalValue/1000) + 'ك' : 0}
                                </p>
                                <p className="text-xs text-muted-foreground">القيمة (ألف ريال)</p>
                              </div>
                              <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <p className={`text-sm font-bold ${getConditionColor(category.averageCondition)}`}>
                                  {category.averageCondition === 'excellent' ? 'ممتاز' :
                                   category.averageCondition === 'good' ? 'جيد' :
                                   category.averageCondition === 'fair' ? 'مقبول' :
                                   category.averageCondition === 'poor' ? 'ضعيف' : 'معطل'}
                                </p>
                                <p className="text-xs text-muted-foreground">متوسط الحالة</p>
                              </div>
                              <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs font-bold text-muted-foreground truncate" title={category.mostUsedTool || 'غير محدد'}>
                                  {category.mostUsedTool || 'غير محدد'}
                                </p>
                                <p className="text-xs text-muted-foreground">الأكثر استخداماً</p>
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
                                <p className="text-sm text-muted-foreground">القيمة الإجمالية (ريال)</p>
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
      </DialogContent>
    </Dialog>
  );
};

export default ToolsReportsDialog;