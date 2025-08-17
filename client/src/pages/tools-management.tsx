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
  BarChart3
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
  const { data: tools = [], isLoading: toolsLoading } = useQuery<Tool[]>({
    queryKey: ['/api/tools', Object.values(toolFilters).join('-')],
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

      {/* Filters and Search - Enhanced Professional Design */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5" />
              البحث والفلترة
            </CardTitle>
            <div className="flex gap-2">
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="ابحث عن الأدوات حسب الاسم، الوصف، SKU أو الرقم التسلسلي..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="search-input"
              />
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600" data-testid="category-filter">
                  <SelectValue placeholder="اختر التصنيف" />
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

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600" data-testid="status-filter">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="available">متاح</SelectItem>
                  <SelectItem value="in_use">قيد الاستخدام</SelectItem>
                  <SelectItem value="maintenance">صيانة</SelectItem>
                  <SelectItem value="damaged">معطل</SelectItem>
                  <SelectItem value="retired">متقاعد</SelectItem>
                </SelectContent>
              </Select>

              {/* Condition Filter */}
              <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600" data-testid="condition-filter">
                  <SelectValue placeholder="اختر الجودة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الجودات</SelectItem>
                  <SelectItem value="excellent">ممتاز</SelectItem>
                  <SelectItem value="good">جيد</SelectItem>
                  <SelectItem value="fair">مقبول</SelectItem>
                  <SelectItem value="poor">ضعيف</SelectItem>
                  <SelectItem value="damaged">معطل</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters and View Mode */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex-1 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  data-testid="clear-filters-button"
                >
                  <X className="h-4 w-4 mr-1" />
                  مسح
                </Button>
                <div className="flex border border-gray-200 dark:border-gray-600 rounded-md overflow-hidden">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-none border-0"
                    data-testid="grid-view-button"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-none border-0 border-r border-gray-200 dark:border-gray-600"
                    data-testid="list-view-button"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
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
    </div>
  );
};

export default ToolsManagementPage;