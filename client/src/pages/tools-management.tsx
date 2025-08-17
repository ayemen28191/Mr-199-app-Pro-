import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, Grid, List, Settings, QrCode, Wrench, Package, MapPin, Eye } from 'lucide-react';

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useToast } from '@/hooks/use-toast';

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
  specifications: Record<string, any>;
  images: string[];
  manuals: string[];
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

  const { toast } = useToast();

  // Fetch tool categories
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
    queryKey: ['/api/tools', toolFilters],
  });

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

  // Tool card component
  const ToolCard: React.FC<{ tool: Tool }> = ({ tool }) => {
    const category = categories.find(cat => cat.id === tool.categoryId);
    const statusInfo = getStatusInfo(tool.status);
    const conditionInfo = getConditionInfo(tool.condition);
    
    return (
      <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer" data-testid={`tool-card-${tool.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
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
              {tool.qrCode && (
                <Button variant="ghost" size="sm" data-testid={`qr-button-${tool.id}`}>
                  <QrCode className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" data-testid={`view-button-${tool.id}`}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" data-testid={`settings-button-${tool.id}`}>
                <Settings className="h-4 w-4" />
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
                  <span className="text-muted-foreground" data-testid={`tool-sku-${tool.id}`}>
                    SKU: {tool.sku}
                  </span>
                )}
              </div>
            </div>

            {/* Status and Condition */}
            <div className="flex justify-between items-center">
              <Badge className={statusInfo.color} data-testid={`tool-status-${tool.id}`}>
                {statusInfo.text}
              </Badge>
              <Badge className={conditionInfo.color} data-testid={`tool-condition-${tool.id}`}>
                {conditionInfo.text}
              </Badge>
            </div>

            {/* Price and Location */}
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span data-testid={`tool-location-${tool.id}`}>{tool.locationType}</span>
              </div>
              {tool.purchasePrice && (
                <div className="text-left" data-testid={`tool-price-${tool.id}`}>
                  {tool.purchasePrice.toLocaleString('ar-SA')} ر.س
                </div>
              )}
            </div>

            {/* Maintenance info */}
            {tool.nextMaintenanceDate && (
              <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                <Wrench className="h-3 w-3" />
                <span data-testid={`tool-maintenance-${tool.id}`}>
                  صيانة مقررة: {new Date(tool.nextMaintenanceDate).toLocaleDateString('ar-SA')}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Statistics calculations
  const totalTools = tools.length;
  const availableTools = tools.filter(t => t.status === 'available').length;
  const inUseTools = tools.filter(t => t.status === 'in_use').length;
  const maintenanceTools = tools.filter(t => t.status === 'maintenance').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="page-title">
            إدارة الأدوات والمعدات
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1" data-testid="page-description">
            إدارة شاملة للأدوات والمعدات مع تتبع الحالة والصيانة
          </p>
        </div>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="gap-2"
          data-testid="add-tool-button"
        >
          <Plus className="h-4 w-4" />
          إضافة أداة جديدة
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="stat-total-tools">
          <CardContent className="flex items-center p-6">
            <div className="text-center mx-auto">
              <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{totalTools}</div>
              <p className="text-xs text-muted-foreground">إجمالي الأدوات</p>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-available-tools">
          <CardContent className="flex items-center p-6">
            <div className="text-center mx-auto">
              <Package className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{availableTools}</div>
              <p className="text-xs text-muted-foreground">أدوات متاحة</p>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-in-use-tools">
          <CardContent className="flex items-center p-6">
            <div className="text-center mx-auto">
              <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{inUseTools}</div>
              <p className="text-xs text-muted-foreground">قيد الاستخدام</p>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-maintenance-tools">
          <CardContent className="flex items-center p-6">
            <div className="text-center mx-auto">
              <Wrench className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{maintenanceTools}</div>
              <p className="text-xs text-muted-foreground">تحتاج صيانة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث في الأدوات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                  data-testid="search-input"
                />
              </div>
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]" data-testid="category-filter">
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
              <SelectTrigger className="w-[150px]" data-testid="status-filter">
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
              <SelectTrigger className="w-[150px]" data-testid="condition-filter">
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

            {/* View Mode Toggle */}
            <div className="flex gap-1 border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                data-testid="grid-view-button"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                data-testid="list-view-button"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Clear Filters */}
            <Button variant="outline" onClick={clearFilters} data-testid="clear-filters-button">
              <Filter className="h-4 w-4 ml-2" />
              مسح المرشحات
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tools Grid/List */}
      {toolsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {tools.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Package className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  لا توجد أدوات
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                  {searchTerm || (selectedCategory && selectedCategory !== 'all') || (selectedStatus && selectedStatus !== 'all') || (selectedCondition && selectedCondition !== 'all')
                    ? 'لا توجد أدوات تطابق المعايير المحددة'
                    : 'لم يتم إضافة أي أدوات بعد'}
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)} data-testid="empty-state-add-button">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة أداة جديدة
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
                : 'space-y-4'
            }>
              {tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Tool Dialog - Placeholder for now */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة أداة جديدة</DialogTitle>
            <DialogDescription>
              أضف أداة أو معدة جديدة إلى النظام مع جميع التفاصيل المطلوبة
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-muted-foreground">
              سيتم تطوير نموذج إضافة الأدوات في الخطوة التالية...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ToolsManagementPage;