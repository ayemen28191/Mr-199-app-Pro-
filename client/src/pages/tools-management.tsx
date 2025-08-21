import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  ShoppingCart,
  Edit,
  Trash2,
  MoreVertical,
  Building,
  Archive,
  Brain,
  TrendingUp,
  Lightbulb,
  Zap
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatsCard, StatsGrid } from '@/components/ui/stats-card';
import { useFloatingButton } from '@/components/layout/floating-button-context';

import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import AddToolDialog from '@/components/tools/add-tool-dialog';
import ToolDetailsDialog from '@/components/tools/tool-details-dialog';
import EditToolDialog from '@/components/tools/edit-tool-dialog';
import QrScanner from '@/components/tools/qr-scanner';
import ToolMovementsDialog from '@/components/tools/tool-movements-dialog';
import ToolCategoriesDialog from '@/components/tools/tool-categories-dialog';
import ToolsReportsDialog from '@/components/tools/tools-reports-dialog';
import { PurchaseIntegrationDialog } from '@/components/tools/PurchaseIntegrationDialog';
import { MaintenanceScheduleDialog } from '@/components/tools/MaintenanceScheduleDialog';

import AdvancedNotificationSystem from '@/components/tools/advanced-notification-system';
import ProjectLocationTracking from '@/components/tools/project-location-tracking';
import AdvancedAnalyticsDashboard from '@/components/tools/advanced-analytics-dashboard';
import PredictiveMaintenanceSystem from '@/components/tools/predictive-maintenance-system';
import IntelligentRecommendationsEngine from '@/components/tools/intelligent-recommendations-engine';
import SmartPerformanceOptimizer from '@/components/tools/smart-performance-optimizer';

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
  projectId?: string; // إضافة المشروع المرتبط
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [toolToDelete, setToolToDelete] = useState<Tool | null>(null);
  const [isAnalyticsDashboardOpen, setIsAnalyticsDashboardOpen] = useState(false);
  const [isPredictiveMaintenanceOpen, setIsPredictiveMaintenanceOpen] = useState(false);
  const [isRecommendationsEngineOpen, setIsRecommendationsEngineOpen] = useState(false);
  const [isPerformanceOptimizerOpen, setIsPerformanceOptimizerOpen] = useState(false);

  const { setFloatingAction } = useFloatingButton();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
  
  // Fetch projects for mapping names
  const { data: projects = [] } = useQuery<{id: string, name: string}[]>({
    queryKey: ['/api/projects'],
    staleTime: 60000,
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

  // Calculate statistics - Use original tools array for total stats
  const stats = useMemo(() => {
    if (!tools || tools.length === 0) {
      console.log('⚠️ أدوات فارغة أو غير محملة:', { toolsLength: tools?.length, tools });
      return {
        total: 0,
        available: 0,
        inUse: 0,
        maintenance: 0,
        damaged: 0,
      };
    }
    
    console.log('📊 حساب الإحصائيات للأدوات:', { toolsCount: tools.length });
    
    return {
      total: tools.length, // إجمالي الأدوات في النظام
      available: tools.filter(t => t.status === 'available').length,
      inUse: tools.filter(t => t.status === 'in_use').length,
      maintenance: tools.filter(t => t.status === 'maintenance').length,
      damaged: tools.filter(t => t.status === 'damaged').length,
    };
  }, [tools]);

  // Filtered statistics for display context
  const filteredStats = {
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

  // Delete tool mutation
  const deleteToolMutation = useMutation({
    mutationFn: async (toolId: string) => {
      return apiRequest(`/api/tools/${toolId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tools'] });
      toast({
        title: 'تم حذف الأداة بنجاح',
        description: `تم حذف ${toolToDelete?.name} من النظام`,
      });
      setToolToDelete(null);
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في حذف الأداة',
        description: error.message || 'حدث خطأ أثناء حذف الأداة',
        variant: 'destructive',
      });
    },
  });

  // Handle delete tool
  const handleDeleteTool = (tool: Tool) => {
    setToolToDelete(tool);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (toolToDelete) {
      deleteToolMutation.mutate(toolToDelete.id);
    }
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

  // Enhanced Tool Card Component
  const ToolCard: React.FC<{ tool: Tool }> = ({ tool }) => {
    const category = categories.find(c => c.id === tool.categoryId);
    
    // Get status color and icon
    const getStatusDisplay = (status: string) => {
      switch (status) {
        case 'available': return { color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle, text: 'متاح' };
        case 'in_use': return { color: 'text-blue-600 bg-blue-50 border-blue-200', icon: Settings, text: 'مستخدم' };
        case 'maintenance': return { color: 'text-orange-600 bg-orange-50 border-orange-200', icon: Wrench, text: 'صيانة' };
        case 'damaged': return { color: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle, text: 'معطل' };
        case 'retired': return { color: 'text-gray-600 bg-gray-50 border-gray-200', icon: Archive, text: 'متقاعد' };
        default: return { color: 'text-gray-600 bg-gray-50 border-gray-200', icon: Package, text: 'غير محدد' };
      }
    };
    
    const statusDisplay = getStatusDisplay(tool.status);
    const StatusIcon = statusDisplay.icon;
    
    return (
      <Card className={`hover:shadow-lg transition-all duration-300 group shadow-sm border-2 ${
        tool.status === 'available' ? 'border-green-200 hover:border-green-300' :
        tool.status === 'in_use' ? 'border-blue-200 hover:border-blue-300' :
        tool.status === 'maintenance' ? 'border-orange-200 hover:border-orange-300' :
        tool.status === 'damaged' ? 'border-red-200 hover:border-red-300' :
        'border-gray-200 hover:border-gray-300'
      } relative overflow-hidden`} data-testid={`tool-card-${tool.id}`}>
        
        {/* Status indicator bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${
          tool.status === 'available' ? 'bg-green-500' :
          tool.status === 'in_use' ? 'bg-blue-500' :
          tool.status === 'maintenance' ? 'bg-orange-500' :
          tool.status === 'damaged' ? 'bg-red-500' : 'bg-gray-500'
        }`}></div>
        
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Tool Icon */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusDisplay.color} border`}>
                <StatusIcon className="h-5 w-5" />
              </div>
              
              {/* Tool Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base truncate text-gray-900 dark:text-gray-100 mb-1">
                  {tool.name}
                </h3>
                {category && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {category.name}
                  </p>
                )}
                {tool.sku && (
                  <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                    <Package className="h-3 w-3 ml-1" />
                    <span className="truncate font-mono">{tool.sku}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid={`tool-actions-${tool.id}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem 
                  onClick={() => {
                    setSelectedToolId(tool.id);
                    setIsDetailsDialogOpen(true);
                  }}
                  data-testid={`view-details-${tool.id}`}
                >
                  <Eye className="h-4 w-4 ml-2" />
                  عرض التفاصيل
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setSelectedToolId(tool.id);
                    setIsEditDialogOpen(true);
                  }}
                  data-testid={`edit-tool-${tool.id}`}
                >
                  <Edit className="h-4 w-4 ml-2" />
                  تعديل
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setSelectedToolId(tool.id);
                    setSelectedToolName(tool.name);
                    setIsMovementsDialogOpen(true);
                  }}
                  data-testid={`move-tool-${tool.id}`}
                >
                  <Move className="h-4 w-4 ml-2" />
                  نقل
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleDeleteTool(tool)}
                  className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                  data-testid={`delete-tool-${tool.id}`}
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Key Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Status */}
            <div className="flex items-center gap-2">
              <Badge className={`${statusDisplay.color} border text-xs px-2 py-1`}>
                {statusDisplay.text}
              </Badge>
            </div>
            
            {/* Condition */}
            <div className="flex items-center gap-1 justify-end">
              <span className={`w-2 h-2 rounded-full ${
                tool.condition === 'excellent' ? 'bg-green-500' :
                tool.condition === 'good' ? 'bg-blue-500' :
                tool.condition === 'fair' ? 'bg-yellow-500' :
                tool.condition === 'poor' ? 'bg-orange-500' : 'bg-red-500'
              }`}></span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {tool.condition === 'excellent' ? 'ممتاز' :
                 tool.condition === 'good' ? 'جيد' :
                 tool.condition === 'fair' ? 'مقبول' :
                 tool.condition === 'poor' ? 'ضعيف' : 'معطل'}
              </span>
            </div>
            
            {/* Price */}
            {tool.purchasePrice && (
              <div className="col-span-1">
                <div className="text-sm font-bold text-green-600 dark:text-green-400">
                  {tool.purchasePrice.toLocaleString('en-US')} ر.ي
                </div>
                <div className="text-xs text-gray-500">سعر الشراء</div>
              </div>
            )}
            
            {/* Location */}
            <div className="col-span-1 text-left">
              <div className="flex items-center gap-1 justify-end">
                <MapPin className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-20">
                  {tool.locationType || 'غير محدد'}
                </span>
              </div>
              <div className="text-xs text-gray-500 text-left">الموقع الحالي</div>
            </div>
          </div>

          {/* Current Project Info */}
          {tool.projectId && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 mb-3">
              <div className="flex items-center gap-2">
                <Building className="h-3 w-3 text-blue-600" />
                <span className="text-xs font-medium text-blue-800 dark:text-blue-200 truncate">
                  {projects.find(p => p.id === tool.projectId)?.name || 'مشروع غير محدد'}
                </span>
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                المشروع المرتبط
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedToolId(tool.id);
                setIsDetailsDialogOpen(true);
              }}
              className="h-8 text-xs hover:bg-gray-50 flex items-center gap-1"
              data-testid={`quick-view-${tool.id}`}
            >
              <Eye className="h-3 w-3" />
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
              className="h-8 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 flex items-center gap-1"
              data-testid={`quick-move-${tool.id}`}
            >
              <Move className="h-3 w-3" />
              نقل
            </Button>
          </div>
          
          {/* Edit & Delete Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedToolId(tool.id);
                setIsEditDialogOpen(true);
              }}
              className="h-8 text-xs hover:bg-green-50 text-green-600 border-green-200 flex items-center gap-1"
              data-testid={`quick-edit-${tool.id}`}
            >
              <Edit className="h-3 w-3" />
              تعديل
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDeleteTool(tool)}
              className="h-8 text-xs hover:bg-red-50 text-red-600 border-red-200 flex items-center gap-1"
              data-testid={`quick-delete-${tool.id}`}
            >
              <Trash2 className="h-3 w-3" />
              حذف
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* Mobile-Friendly Top Action Bar */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-3 py-3">
        {/* Top Row - Main Tabs */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* View Toggle - Mobile Responsive */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-full sm:w-auto">
            <Button
              size="sm"
              variant={currentView === 'tools' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('tools')}
              className="h-8 px-3 text-sm flex-1 sm:flex-none"
              data-testid="tab-tools"
            >
              <Package className="h-4 w-4 ml-1" />
              جميع الأدوات
            </Button>
            <Button
              size="sm"
              variant={currentView === 'locations' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('locations')}
              className="h-8 px-3 text-sm flex-1 sm:flex-none"
              data-testid="tab-locations"
            >
              <MapPin className="h-4 w-4 ml-1" />
              تتبع المواقع
            </Button>
          </div>
        </div>

        {/* Bottom Row - Quick Actions for Mobile */}
        <div className="flex items-center justify-between gap-2">
          {/* Left Side - QR Scanner */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsQrScannerOpen(true)}
              className="h-8 px-3 text-sm"
              data-testid="button-qr-scanner"
            >
              <QrCode className="h-4 w-4 ml-1" />
              مسح QR
            </Button>
          </div>

          {/* Right Side - Notification System */}
          <div className="flex items-center">
            <AdvancedNotificationSystem />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-2 sm:p-3 space-y-3">
        {currentView === 'locations' ? (
          <ProjectLocationTracking />
        ) : (
          <>
            {/* الإحصائيات الموحدة للأدوات */}
            <StatsGrid>
              <StatsCard 
                title="إجمالي الأدوات" 
                value={stats.total} 
                icon={Package}
                color="blue"
                trend={{ value: 0, isPositive: true }}
                data-testid="stat-total"
              />
              <StatsCard 
                title="متاح للاستخدام" 
                value={stats.available} 
                icon={CheckCircle}
                color="green"
                trend={{ value: 0, isPositive: true }}
                data-testid="stat-available"
              />
              <StatsCard 
                title="قيد الاستخدام" 
                value={stats.inUse} 
                icon={Settings}
                color="orange"
                trend={{ value: 0, isPositive: true }}
                data-testid="stat-in-use"
              />
              <StatsCard 
                title="يحتاج صيانة" 
                value={stats.maintenance + stats.damaged} 
                icon={AlertTriangle}
                color="red"
                trend={{ value: 0, isPositive: false }}
                data-testid="stat-maintenance"
              />
            </StatsGrid>

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
                
                {/* Mobile-Optimized Filters */}
                <div className="space-y-2">
                  {/* First Row - Category and Status */}
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="h-10 text-sm" data-testid="filter-category">
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
                      <SelectTrigger className="h-10 text-sm" data-testid="filter-status">
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
                  </div>

                  {/* Second Row - Condition Filter */}
                  <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                    <SelectTrigger className="h-10 text-sm w-full" data-testid="filter-condition">
                      <SelectValue placeholder="حالة الجودة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع مستويات الجودة</SelectItem>
                      <SelectItem value="excellent">ممتاز</SelectItem>
                      <SelectItem value="good">جيد</SelectItem>
                      <SelectItem value="fair">مقبول</SelectItem>
                      <SelectItem value="poor">ضعيف</SelectItem>
                      <SelectItem value="damaged">تالف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Essential Action Buttons - Mobile Optimized */}
                <div className="space-y-3">
                  {/* Primary Actions Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsCategoriesDialogOpen(true)}
                      className="h-9 text-sm"
                      data-testid="button-categories"
                    >
                      <Folder className="h-4 w-4 ml-1" />
                      التصنيفات
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsReportsDialogOpen(true)}
                      className="h-9 text-sm"
                      data-testid="button-reports"
                    >
                      <BarChart3 className="h-4 w-4 ml-1" />
                      التقارير
                    </Button>
                  </div>

                  {/* Smart AI Features Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsAnalyticsDashboardOpen(true)}
                      className="h-9 text-sm bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
                      data-testid="button-analytics"
                    >
                      <TrendingUp className="h-4 w-4 ml-1" />
                      تحليلات ذكية
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsPredictiveMaintenanceOpen(true)}
                      className="h-9 text-sm bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400"
                      data-testid="button-predictive"
                    >
                      <Brain className="h-4 w-4 ml-1" />
                      صيانة ذكية
                    </Button>
                  </div>

                  {/* Additional Tools - Collapsible for Mobile */}
                  <details className="group">
                    <summary className="flex items-center justify-center cursor-pointer p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-600 dark:text-gray-400">
                      <span>أدوات إضافية</span>
                      <span className="mr-2 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsRecommendationsEngineOpen(true)}
                        className="h-9 text-sm bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                        data-testid="button-recommendations"
                      >
                        <Lightbulb className="h-4 w-4 ml-1" />
                        توصيات ذكية
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsPerformanceOptimizerOpen(true)}
                        className="h-9 text-sm bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400"
                        data-testid="button-optimizer"
                      >
                        <Zap className="h-4 w-4 ml-1" />
                        محسن الأداء
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsPurchaseIntegrationOpen(true)}
                        className="h-9 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                        data-testid="button-purchases"
                      >
                        <ShoppingCart className="h-4 w-4 ml-1" />
                        المشتريات
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsMaintenanceScheduleOpen(true)}
                        className="h-9 text-sm bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800"
                        data-testid="button-maintenance"
                      >
                        <Settings className="h-4 w-4 ml-1" />
                        جدولة الصيانة
                      </Button>
                    </div>
                  </details>
                </div>

                {/* Clear Filters */}
                {(searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedCondition !== 'all') && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearFilters}
                    className="w-full h-6 sm:h-7 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                    data-testid="button-clear-filters"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
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
      
      <AdvancedAnalyticsDashboard
        open={isAnalyticsDashboardOpen}
        onOpenChange={setIsAnalyticsDashboardOpen}
      />
      
      <PredictiveMaintenanceSystem
        open={isPredictiveMaintenanceOpen}
        onOpenChange={setIsPredictiveMaintenanceOpen}
      />
      
      <IntelligentRecommendationsEngine
        open={isRecommendationsEngineOpen}
        onOpenChange={setIsRecommendationsEngineOpen}
      />
      
      <SmartPerformanceOptimizer
        open={isPerformanceOptimizerOpen}
        onOpenChange={setIsPerformanceOptimizerOpen}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              تأكيد حذف الأداة
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف الأداة "{toolToDelete?.name}"؟ 
              <br />
              <span className="text-red-600 font-medium">
                لا يمكن التراجع عن هذا الإجراء وستفقد جميع البيانات المرتبطة بهذه الأداة.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              onClick={() => setIsDeleteDialogOpen(false)}
              data-testid="cancel-delete"
            >
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteToolMutation.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              data-testid="confirm-delete"
            >
              {deleteToolMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                  جاري الحذف...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف الأداة
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ToolsManagementPage;