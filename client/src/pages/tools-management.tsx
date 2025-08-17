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
import EnhancedSearchFilter from '@/components/tools/enhanced-search-filter';
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

  // Tool Card Component
  const ToolCard: React.FC<{ tool: Tool }> = ({ tool }) => {
    const category = categories.find(c => c.id === tool.categoryId);
    
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`tool-card-${tool.id}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{tool.name}</CardTitle>
            <div className="flex gap-2">
              <Badge variant={getStatusBadgeVariant(tool.status)}>
                {tool.status === 'available' ? 'متاح' :
                 tool.status === 'in_use' ? 'مستخدم' :
                 tool.status === 'maintenance' ? 'صيانة' :
                 tool.status === 'damaged' ? 'معطل' : 'متقاعد'}
              </Badge>
              <Badge variant={getConditionBadgeVariant(tool.condition)}>
                {tool.condition === 'excellent' ? 'ممتاز' :
                 tool.condition === 'good' ? 'جيد' :
                 tool.condition === 'fair' ? 'مقبول' :
                 tool.condition === 'poor' ? 'ضعيف' : 'معطل'}
              </Badge>
            </div>
          </div>
          {tool.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{tool.description}</p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-3">
          {category && (
            <div className="flex items-center gap-2 text-sm">
              <Folder className="h-4 w-4 text-gray-400" />
              <span>{category.name}</span>
            </div>
          )}
          
          {tool.sku && (
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-gray-400" />
              <span>رقم الصنف: {tool.sku}</span>
            </div>
          )}
          
          {tool.serialNumber && (
            <div className="flex items-center gap-2 text-sm">
              <Settings className="h-4 w-4 text-gray-400" />
              <span>الرقم التسلسلي: {tool.serialNumber}</span>
            </div>
          )}
          
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedToolId(tool.id);
                setIsDetailsDialogOpen(true);
              }}
              data-testid={`view-tool-${tool.id}`}
            >
              <Eye className="h-3 w-3 mr-1" />
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
              data-testid={`move-tool-${tool.id}`}
            >
              <Move className="h-3 w-3 mr-1" />
              نقل
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* Mobile-First Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        {/* Top Bar */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ToolsNotificationSystem />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsQrScannerOpen(true)}
              className="flex items-center gap-2 text-xs"
            >
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">ماسح QR</span>
            </Button>
          </div>
        </div>

        {/* Navigation Tabs - Mobile Optimized */}
        <div className="px-4">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              onClick={() => setCurrentView('tools')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 border-b-2 ${
                currentView === 'tools' 
                  ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="h-4 w-4 ml-2" />
              الأدوات
            </Button>
            <Button
              variant="ghost"
              onClick={() => setCurrentView('locations')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 border-b-2 ${
                currentView === 'locations' 
                  ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MapPin className="h-4 w-4 ml-2" />
              المواقع
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Content based on current view */}
        {currentView === 'locations' ? (
          <ProjectLocationTracking />
        ) : (
          <>
            {/* Statistics Cards - Mobile Optimized */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard
                title="إجمالي الأدوات"
                value={stats.total}
                icon={Package}
                color="blue"
                data-testid="total-tools-stat"
              />
              <StatsCard
                title="متاح"
                value={stats.available}
                icon={CheckCircle}
                color="green"
                data-testid="available-tools-stat"
              />
              <StatsCard
                title="قيد الاستخدام"
                value={stats.inUse}
                icon={Wrench}
                color="orange"
                data-testid="in-use-tools-stat"
              />
              <StatsCard
                title="صيانة"
                value={stats.maintenance}
                icon={AlertTriangle}
                color="red"
                data-testid="maintenance-tools-stat"
              />
            </div>

            {/* Enhanced Search Filter Component */}
            <EnhancedSearchFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              selectedCondition={selectedCondition}
              onConditionChange={setSelectedCondition}
              categories={categories}
              onClearFilters={clearFilters}
              toolStats={{
                total: stats.total,
                available: stats.available,
                inUse: stats.inUse,
                maintenance: stats.maintenance,
                damaged: stats.damaged,
                maintenanceOverdue: 0
              }}
            />

            {/* Action Buttons - Mobile Optimized */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsCategoriesDialogOpen(true)}
                className="flex items-center justify-center gap-2"
              >
                <Folder className="h-4 w-4" />
                <span className="hidden sm:inline">إدارة التصنيفات</span>
                <span className="sm:hidden">التصنيفات</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsReportsDialogOpen(true)}
                className="flex items-center justify-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">التقارير</span>
                <span className="sm:hidden">تقارير</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsPurchaseIntegrationOpen(true)}
                className="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">تكامل المشتريات</span>
                <span className="sm:hidden">مشتريات</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsMaintenanceScheduleOpen(true)}
                className="flex items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">جدولة الصيانة</span>
                <span className="sm:hidden">صيانة</span>
              </Button>
            </div>

            {/* Tools Grid/List */}
            <div className="space-y-4">
              {toolsLoading || categoriesLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span className="text-muted-foreground">جاري تحميل الأدوات...</span>
                  </div>
                </div>
              ) : filteredTools.length === 0 ? (
                <Card className="py-12">
                  <CardContent className="text-center space-y-4">
                    <div className="flex justify-center">
                      <Package className="h-16 w-16 text-gray-400 mb-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        لا توجد أدوات
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                        {searchTerm || (selectedCategory && selectedCategory !== 'all') || (selectedStatus && selectedStatus !== 'all') || (selectedCondition && selectedCondition !== 'all')
                          ? 'لا توجد أدوات تطابق المعايير المحددة'
                          : 'لم يتم إضافة أي أدوات بعد'}
                      </p>
                      {!searchTerm && selectedCategory === 'all' && selectedStatus === 'all' && selectedCondition === 'all' && (
                        <Button 
                          onClick={() => setIsAddToolDialogOpen(true)}
                          className="bg-primary hover:bg-primary/90"
                          data-testid="add-first-tool-button"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          إضافة أول أداة
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              )}
            </div>
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