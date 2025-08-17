import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Settings, 
  QrCode, 
  Wrench, 
  Package, 
  MapPin, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  X,
  RefreshCw,
  Folder,
  BarChart3,
  Move,
  ShoppingCart
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatsCard } from '@/components/ui/stats-card';
import { useFloatingButton } from '@/components/layout/floating-button-context';

import { useToast } from '@/hooks/use-toast';
import AddToolDialog from '@/components/tools/add-tool-dialog';
import ToolDetailsDialog from '@/components/tools/tool-details-dialog';
import EditToolDialog from '@/components/tools/edit-tool-dialog';
import QrScanner from '@/components/tools/qr-scanner';
import ToolMovementsDialog from '@/components/tools/tool-movements-dialog';
import ToolCategoriesDialog from '@/components/tools/tool-categories-dialog';
import ToolsReportsDialog from '@/components/tools/tools-reports-dialog';
import { PurchaseIntegrationDialog } from '@/components/tools/PurchaseIntegrationDialog';
import { MaintenanceScheduleDialog } from '@/components/tools/MaintenanceScheduleDialog';

import ToolsNotificationSystem from '@/components/tools/tools-notification-system';
import ProjectLocationTracking from '@/components/tools/project-location-tracking';

// Types from schema
interface ToolCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Tool {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  sku?: string;
  serialNumber?: string;
  barcode?: string;
  qrCode?: string;
  unit: string;
  purchasePrice?: number;
  currentValue?: number;
  depreciationRate?: number;
  purchaseDate?: string;
  warrantyExpiry?: string;
  maintenanceInterval?: number;
  nextMaintenanceDate?: string;
  status: 'available' | 'in_use' | 'maintenance' | 'damaged' | 'retired';
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  locationType: string;
  locationId?: string;
  specifications?: any;
  images?: string[];
  manuals?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ToolsManagementPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddToolDialogOpen, setIsAddToolDialogOpen] = useState(false);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isMovementsDialogOpen, setIsMovementsDialogOpen] = useState(false);
  const [selectedToolName, setSelectedToolName] = useState<string>('');
  const [isCategoriesDialogOpen, setIsCategoriesDialogOpen] = useState(false);
  const [isReportsDialogOpen, setIsReportsDialogOpen] = useState(false);
  const [isPurchaseIntegrationOpen, setIsPurchaseIntegrationOpen] = useState(false);
  const [isMaintenanceScheduleOpen, setIsMaintenanceScheduleOpen] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>('');
  const [currentView, setCurrentView] = useState<'tools' | 'locations'>('tools');

  const { setFloatingAction } = useFloatingButton();
  const { toast } = useToast();

  // Set up floating action button
  useEffect(() => {
    console.log('🔧 تفعيل الزر العائم لإدارة الأدوات...');
    const handleAddTool = () => {
      console.log('🔄 فتح نموذج إضافة الأدوات...');
      setIsAddToolDialogOpen(true);
    };
    
    setFloatingAction(handleAddTool, "إضافة أداة جديدة");
    
    return () => {
      setFloatingAction(null);
    };
  }, [setFloatingAction]);

  // Fetch tools from API
  const { data: tools = [], isLoading: toolsLoading, error: toolsError } = useQuery<Tool[]>({
    queryKey: ['/api/tools'],
  });

  // Fetch tool categories from API
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery<ToolCategory[]>({
    queryKey: ['/api/tool-categories'],
  });

  // Filter tools based on current criteria
  const filteredTools = tools.filter(tool => {
    const matchesSearch = !searchTerm || 
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || tool.categoryId === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || tool.status === selectedStatus;
    const matchesCondition = selectedCondition === 'all' || tool.condition === selectedCondition;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesCondition;
  });

  // Calculate statistics
  const stats = {
    total: filteredTools.length,
    available: filteredTools.filter(t => t.status === 'available').length,
    inUse: filteredTools.filter(t => t.status === 'in_use').length,
    maintenance: filteredTools.filter(t => t.status === 'maintenance').length,
    damaged: filteredTools.filter(t => t.status === 'damaged').length,
  };

  // Handle QR scan result
  const handleQrScan = (result: string) => {
    const tool = tools.find(t => t.qrCode === result || t.barcode === result);
    if (tool) {
      setSelectedToolId(tool.id);
      setIsDetailsDialogOpen(true);
      toast({
        title: "تم العثور على الأداة",
        description: `تم فتح تفاصيل ${tool.name}`,
      });
    } else {
      toast({
        title: "لم يتم العثور على الأداة",
        description: "لا توجد أداة مطابقة لهذا الرمز",
        variant: "destructive",
      });
    }
    setIsQrScannerOpen(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSelectedCondition('all');
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'available': return 'default';
      case 'in_use': return 'secondary';
      case 'maintenance': return 'destructive';
      case 'damaged': return 'destructive';
      case 'retired': return 'outline';
      default: return 'outline';
    }
  };

  // Get condition badge variant
  const getConditionBadgeVariant = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'fair': return 'outline';
      case 'poor': return 'destructive';
      case 'damaged': return 'destructive';
      default: return 'outline';
    }
  };

  // Compact Tool Card Component
  const ToolCard: React.FC<{ tool: Tool }> = ({ tool }) => {
    const category = categories.find(c => c.id === tool.categoryId);
    
    return (
      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500" data-testid={`tool-card-${tool.id}`}>
        <CardContent className="p-4">
          {/* Header Row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate text-gray-900 dark:text-gray-100">
                {tool.name}
              </h3>
              {category && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {category.name}
                </p>
              )}
            </div>
            <Badge 
              variant={getStatusBadgeVariant(tool.status)} 
              className="text-xs h-5 px-2 ml-2"
            >
              {tool.status === 'available' ? 'متاح' :
               tool.status === 'in_use' ? 'مستخدم' :
               tool.status === 'maintenance' ? 'صيانة' :
               tool.status === 'damaged' ? 'معطل' : 'متقاعد'}
            </Badge>
          </div>

          {/* Info Row */}
          <div className="space-y-2 mb-3">
            {tool.sku && (
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <Package className="h-3 w-3 ml-1" />
                <span className="truncate">{tool.sku}</span>
              </div>
            )}
            {tool.purchasePrice && (
              <div className="flex items-center text-xs font-medium text-green-600 dark:text-green-400">
                <span>{tool.purchasePrice.toLocaleString()} ر.س</span>
              </div>
            )}
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              <span className={`w-2 h-2 rounded-full ml-1 ${
                tool.condition === 'excellent' ? 'bg-green-500' :
                tool.condition === 'good' ? 'bg-blue-500' :
                tool.condition === 'fair' ? 'bg-yellow-500' :
                tool.condition === 'poor' ? 'bg-orange-500' : 'bg-red-500'
              }`}></span>
              <span>
                {tool.condition === 'excellent' ? 'ممتاز' :
                 tool.condition === 'good' ? 'جيد' :
                 tool.condition === 'fair' ? 'مقبول' :
                 tool.condition === 'poor' ? 'ضعيف' : 'معطل'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedToolId(tool.id);
                setIsDetailsDialogOpen(true);
              }}
              className="flex-1 h-7 text-xs"
              data-testid={`view-tool-${tool.id}`}
            >
              <Eye className="h-3 w-3 ml-1" />
              عرض
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedToolId(tool.id);
                setSelectedToolName(tool.name);
                setIsMovementsDialogOpen(true);
              }}
              className="flex-1 h-7 text-xs"
              data-testid={`move-tool-${tool.id}`}
            >
              <Move className="h-3 w-3 ml-1" />
              نقل
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* Compact Top Action Bar */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between gap-2">
          {/* View Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <Button
              size="sm"
              variant={currentView === 'tools' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('tools')}
              className="h-7 px-3 text-xs"
            >
              <Package className="h-3 w-3 ml-1" />
              الأدوات
            </Button>
            <Button
              size="sm"
              variant={currentView === 'locations' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('locations')}
              className="h-7 px-3 text-xs"
            >
              <MapPin className="h-3 w-3 ml-1" />
              المواقع
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            <ToolsNotificationSystem />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsQrScannerOpen(true)}
              className="h-7 px-2"
            >
              <QrCode className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 space-y-3">
        {currentView === 'locations' ? (
          <ProjectLocationTracking />
        ) : (
          <>
            {/* Compact Stats Row */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center shadow-sm border">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">المجموع</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center shadow-sm border">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">{stats.available}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">متاح</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center shadow-sm border">
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{stats.inUse}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">مستخدم</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center shadow-sm border">
                <div className="text-lg font-bold text-red-600 dark:text-red-400">{stats.maintenance}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">صيانة</div>
              </div>
            </div>

            {/* Search & Filters in One Card */}
            <Card className="shadow-sm">
              <CardContent className="p-3 space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="البحث عن الأدوات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 h-9 text-sm"
                    data-testid="search-tools"
                  />
                </div>
                
                {/* Filters Row */}
                <div className="grid grid-cols-3 gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع التصنيفات</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="available">متاح</SelectItem>
                      <SelectItem value="in_use">قيد الاستخدام</SelectItem>
                      <SelectItem value="maintenance">صيانة</SelectItem>
                      <SelectItem value="damaged">تالف</SelectItem>
                      <SelectItem value="retired">متقاعد</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="الجودة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المستويات</SelectItem>
                      <SelectItem value="excellent">ممتاز</SelectItem>
                      <SelectItem value="good">جيد</SelectItem>
                      <SelectItem value="fair">مقبول</SelectItem>
                      <SelectItem value="poor">ضعيف</SelectItem>
                      <SelectItem value="damaged">تالف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsCategoriesDialogOpen(true)}
                    className="h-8 text-xs"
                  >
                    <Folder className="h-3 w-3 ml-1" />
                    التصنيفات
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsReportsDialogOpen(true)}
                    className="h-8 text-xs"
                  >
                    <BarChart3 className="h-3 w-3 ml-1" />
                    التقارير
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsPurchaseIntegrationOpen(true)}
                    className="h-8 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                  >
                    <ShoppingCart className="h-3 w-3 ml-1" />
                    المشتريات
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsMaintenanceScheduleOpen(true)}
                    className="h-8 text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                  >
                    <Settings className="h-3 w-3 ml-1" />
                    الصيانة
                  </Button>
                </div>

                {/* Clear Filters */}
                {(searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedCondition !== 'all') && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearFilters}
                    className="w-full h-7 text-xs text-gray-500"
                  >
                    <X className="h-3 w-3 ml-1" />
                    مسح الفلاتر
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Tools Grid */}
            {toolsLoading || categoriesLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">جاري التحميل...</span>
                </div>
              </div>
            ) : filteredTools.length === 0 ? (
              <Card className="py-8">
                <CardContent className="text-center space-y-3">
                  <Package className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      لا توجد أدوات
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedCondition !== 'all'
                        ? 'لا توجد أدوات تطابق المعايير'
                        : 'لم يتم إضافة أي أدوات بعد'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <AddToolDialog 
        open={isAddToolDialogOpen} 
        onOpenChange={setIsAddToolDialogOpen}
      />
      
      {selectedToolId && (
        <ToolDetailsDialog
          toolId={selectedToolId}
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          onEdit={() => {
            setIsDetailsDialogOpen(false);
            setIsEditDialogOpen(true);
          }}
        />
      )}
      
      {selectedToolId && (
        <EditToolDialog
          toolId={selectedToolId}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={() => {
            setIsEditDialogOpen(false);
            setIsDetailsDialogOpen(true);
          }}
        />
      )}
      
      <QrScanner
        open={isQrScannerOpen}
        onOpenChange={setIsQrScannerOpen}
        onScanResult={handleQrScan}
      />
      
      {selectedToolId && selectedToolName && (
        <ToolMovementsDialog
          toolId={selectedToolId}
          toolName={selectedToolName}
          open={isMovementsDialogOpen}
          onOpenChange={setIsMovementsDialogOpen}
        />
      )}
      
      <ToolCategoriesDialog
        open={isCategoriesDialogOpen}
        onOpenChange={setIsCategoriesDialogOpen}
      />
      
      <ToolsReportsDialog
        open={isReportsDialogOpen}
        onOpenChange={setIsReportsDialogOpen}
      />
      
      <PurchaseIntegrationDialog
        isOpen={isPurchaseIntegrationOpen}
        onClose={() => setIsPurchaseIntegrationOpen(false)}
        purchaseId={selectedPurchaseId}
        purchaseName="فاتورة المشتريات"
      />
      
      <MaintenanceScheduleDialog
        isOpen={isMaintenanceScheduleOpen}
        onClose={() => setIsMaintenanceScheduleOpen(false)}
        toolId={selectedToolId || undefined}
      />
    </div>
  );
};

export default ToolsManagementPage;