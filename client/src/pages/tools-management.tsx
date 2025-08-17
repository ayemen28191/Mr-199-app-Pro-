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
  Move
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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

  // Set up floating action button
  useEffect(() => {
    console.log('🔧 تفعيل الزر العائم لإدارة الأدوات...');
    const handleAddTool = () => {
      console.log('🔄 فتح نموذج إضافة الأدوات...');
      setIsAddDialogOpen(true);
    };
    
    setFloatingAction(handleAddTool, "إضافة أداة جديدة");
    
    return () => {
      setFloatingAction(null);
    };
  }, [setFloatingAction]);

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<ToolCategory[]>({
    queryKey: ['/api/tool-categories'],
  });

  // Build filters for tools query
  const toolFilters = {
    ...(selectedCategory && selectedCategory !== 'all' && { categoryId: selectedCategory }),
    ...(selectedStatus && selectedStatus !== 'all' && { status: selectedStatus }),
    ...(selectedCondition && selectedCondition !== 'all' && { condition: selectedCondition }),
    ...(searchTerm && { searchTerm: searchTerm }),
  };

  // Fetch tools with filters  
  const toolsQueryKey = ['/api/tools'];
  const toolsQueryParams = new URLSearchParams();
  
  if (selectedCategory && selectedCategory !== 'all') {
    toolsQueryParams.append('categoryId', selectedCategory);
  }
  if (selectedStatus && selectedStatus !== 'all') {
    toolsQueryParams.append('status', selectedStatus);
  }
  if (selectedCondition && selectedCondition !== 'all') {
    toolsQueryParams.append('condition', selectedCondition);
  }
  if (searchTerm) {
    toolsQueryParams.append('searchTerm', searchTerm);
  }
  
  const toolsUrl = toolsQueryParams.toString() 
    ? `/api/tools?${toolsQueryParams.toString()}`
    : '/api/tools';
    
  const { data: tools = [], isLoading: toolsLoading } = useQuery<Tool[]>({
    queryKey: [toolsUrl],
  });

  // Calculate statistics
  const stats = {
    total: tools.length,
    available: tools.filter(tool => tool.status === 'available').length,
    inUse: tools.filter(tool => tool.status === 'in_use').length,
    maintenance: tools.filter(tool => tool.status === 'maintenance').length,
  };

  // Status color and text mapping
  const getStatusInfo = (status: string) => {
    const statusMap = {
      available: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', text: 'متاح' },
      in_use: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', text: 'قيد الاستخدام' },
      maintenance: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', text: 'صيانة' },
      damaged: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', text: 'معطل' },
      retired: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', text: 'متقاعد' },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.available;
  };

  // Condition color and text mapping
  const getConditionInfo = (condition: string) => {
    const conditionMap = {
      excellent: { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', text: 'ممتاز' },
      good: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', text: 'جيد' },
      fair: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', text: 'مقبول' },
      poor: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', text: 'ضعيف' },
      damaged: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', text: 'معطل' },
    };
    return conditionMap[condition as keyof typeof conditionMap] || conditionMap.good;
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSelectedCondition('all');
  };

  // Handle tool actions
  const handleToolView = (toolId: string) => {
    setSelectedToolId(toolId);
    setIsDetailsDialogOpen(true);
  };

  const handleToolEdit = (toolId: string) => {
    setSelectedToolId(toolId);
    setIsEditDialogOpen(true);
  };

  const handleToolMovements = (toolId: string, toolName: string) => {
    setSelectedToolId(toolId);
    setSelectedToolName(toolName);
    setIsMovementsDialogOpen(true);
  };

  const handleQrScan = (data: any) => {
    if (data.valid && data.tool) {
      setSelectedToolId(data.tool.id);
      setIsDetailsDialogOpen(true);
    }
  };

  // Tool card component
  const ToolCard: React.FC<{ tool: Tool }> = ({ tool }) => {
    const category = categories.find(cat => cat.id === tool.categoryId);
    const statusInfo = getStatusInfo(tool.status);
    const conditionInfo = getConditionInfo(tool.condition);
    
    return (
      <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer" data-testid={`tool-card-${tool.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1" onClick={() => handleToolView(tool.id)}>
              <CardTitle className="text-lg font-semibold text-right" data-testid={`tool-name-${tool.id}`}>
                {tool.name}
              </CardTitle>
              {tool.description && (
                <p className="text-sm text-muted-foreground mt-1 text-right" data-testid={`tool-description-${tool.id}`}>
                  {tool.description}
                </p>
              )}
            </div>
            <div className="flex gap-2 mr-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsQrScannerOpen(true);
                }}
                data-testid={`qr-button-${tool.id}`}
              >
                <QrCode className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleToolView(tool.id);
                }}
                data-testid={`view-button-${tool.id}`}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleToolEdit(tool.id);
                }}
                data-testid={`settings-button-${tool.id}`}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleToolMovements(tool.id, tool.name);
                }}
                data-testid={`movements-button-${tool.id}`}
              >
                <Move className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Category and SKU */}
            <div className="flex justify-between items-center text-sm">
              <div className="text-right">
                {category && (
                  <Badge variant="outline" className="text-xs" data-testid={`tool-category-${tool.id}`}>
                    {category.name}
                  </Badge>
                )}
              </div>
              <div className="text-left">
                {tool.sku && (
                  <span className="text-xs text-muted-foreground" data-testid={`tool-sku-${tool.id}`}>
                    {tool.sku}
                  </span>
                )}
              </div>
            </div>

            {/* Status and Condition */}
            <div className="flex justify-between items-center">
              <div>
                <Badge className={`text-xs ${statusInfo.color}`} data-testid={`tool-status-${tool.id}`}>
                  {statusInfo.text}
                </Badge>
              </div>
              <div>
                <Badge className={`text-xs ${conditionInfo.color}`} data-testid={`tool-condition-${tool.id}`}>
                  {conditionInfo.text}
                </Badge>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span data-testid={`tool-location-${tool.id}`}>
                {tool.locationType}{tool.locationId && ` - ${tool.locationId}`}
              </span>
            </div>

            {/* Purchase info */}
            {tool.purchasePrice && (
              <div className="text-sm text-muted-foreground text-right">
                السعر: {tool.purchasePrice.toLocaleString()} ريال
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-6" dir="rtl">
      {/* Enhanced Header with Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              إدارة الأدوات والمعدات
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              نظام شامل لتتبع وإدارة الأدوات والمعدات في المشاريع
            </p>
          </div>
          
          <div className="flex gap-2">
            <ToolsNotificationSystem />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsQrScannerOpen(true)}
              className="flex items-center gap-2"
            >
              <QrCode className="h-4 w-4" />
              ماسح QR
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
          <Button
            variant={currentView === 'tools' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('tools')}
            className="rounded-none border-b-2 border-transparent data-[active=true]:border-blue-500 px-4 py-2"
          >
            <Package className="h-4 w-4 ml-1" />
            إدارة الأدوات
          </Button>
          <Button
            variant={currentView === 'locations' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('locations')}
            className="rounded-none border-b-2 border-transparent data-[active=true]:border-blue-500 px-4 py-2"
          >
            <MapPin className="h-4 w-4 ml-1" />
            تتبع المواقع
          </Button>
        </div>
      </div>

      {/* Content based on current view */}
      {currentView === 'locations' ? (
        <ProjectLocationTracking />
      ) : (
        <>
          {/* Statistics Cards - Using Unified Component */}
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
              damaged: 0,
              maintenanceOverdue: 0
            }}
          />

          {/* Action Buttons Bar */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex gap-2 flex-wrap justify-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsCategoriesDialogOpen(true)}
                >
                  <Folder className="h-4 w-4 ml-1" />
                  إدارة التصنيفات
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsReportsDialogOpen(true)}
                >
                  <BarChart3 className="h-4 w-4 ml-1" />
                  التقارير
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsPurchaseIntegrationOpen(true)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                >
                  <Package className="h-4 w-4 ml-1" />
                  تكامل المشتريات
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsMaintenanceScheduleOpen(true)}
                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                >
                  <Settings className="h-4 w-4 ml-1" />
                  جدولة الصيانة
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tools Grid/List */}
          <div className="space-y-4">
            {toolsLoading || categoriesLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span className="text-muted-foreground">جاري تحميل الأدوات...</span>
                </div>
              </div>
            ) : tools.length === 0 ? (
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
                        onClick={() => setIsAddDialogOpen(true)}
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
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "space-y-4"
              }>
                {tools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Dialogs */}
      <AddToolDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
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
      
      {/* Phase 3: New Advanced Features */}
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