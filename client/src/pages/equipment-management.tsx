import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Wrench, Truck, ArrowUpDown, PenTool, Settings, Eye, MapPin, Calendar, DollarSign, Activity, MoreVertical, Edit, Trash2 } from "lucide-react";
import { StatsCard, StatsGrid } from "@/components/ui/stats-card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useFloatingButton } from "@/components/layout/floating-button-context";
import { AddEquipmentDialog } from "@/components/equipment/add-equipment-dialog";
import { EquipmentDetailsDialog } from "@/components/equipment/equipment-details-dialog";
import { TransferEquipmentDialog } from "@/components/equipment/transfer-equipment-dialog";
import { Equipment } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";

export function EquipmentManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  const queryClient = useQueryClient();
  const { setFloatingAction } = useFloatingButton();

  // تعيين إجراء الزر العائم لإضافة معدة جديدة
  useEffect(() => {
    const handleAddEquipment = () => setShowAddDialog(true);
    setFloatingAction(handleAddEquipment, "إضافة معدة جديدة");
    return () => setFloatingAction(null);
  }, [setFloatingAction]);

  // جلب المعدات مع الفلاتر
  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ['equipment', searchTerm, statusFilter, typeFilter, projectFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('searchTerm', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (projectFilter !== 'all' && projectFilter !== 'warehouse') {
        params.append('projectId', projectFilter);
      } else if (projectFilter === 'warehouse') {
        params.append('projectId', '');
      }
      
      const response = await fetch(`/api/equipment?${params}`);
      if (!response.ok) throw new Error('فشل في جلب المعدات');
      return response.json();
    }
  });

  // جلب المشاريع لقائمة الفلاتر
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('فشل في جلب المشاريع');
      return response.json();
    }
  });

  const handleEquipmentClick = (item: Equipment) => {
    setSelectedEquipment(item);
    setShowDetailsDialog(true);
  };

  const handleTransferClick = (item: Equipment, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEquipment(item);
    setShowTransferDialog(true);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      'maintenance': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      'out_of_service': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      'inactive': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const getStatusBorderColor = (status: string) => {
    const colors = {
      'active': 'border-r-green-500 bg-gradient-to-r from-green-50 to-white dark:from-green-950 dark:to-gray-900',
      'maintenance': 'border-r-yellow-500 bg-gradient-to-r from-yellow-50 to-white dark:from-yellow-950 dark:to-gray-900',
      'out_of_service': 'border-r-red-500 bg-gradient-to-r from-red-50 to-white dark:from-red-950 dark:to-gray-900',
      'inactive': 'border-r-gray-500 bg-gradient-to-r from-gray-50 to-white dark:from-gray-950 dark:to-gray-900'
    };
    return colors[status as keyof typeof colors] || 'border-r-blue-500';
  };

  const getTypeBackgroundColor = (type: string | null) => {
    const colors = {
      'إنشائية': 'bg-gradient-to-br from-blue-500 to-blue-600',
      'نقل': 'bg-gradient-to-br from-green-500 to-green-600',
      'أداة': 'bg-gradient-to-br from-purple-500 to-purple-600',
      'construction': 'bg-gradient-to-br from-blue-500 to-blue-600',
      'transport': 'bg-gradient-to-br from-green-500 to-green-600',
      'tool': 'bg-gradient-to-br from-purple-500 to-purple-600'
    };
    return colors[type as keyof typeof colors] || 'bg-gradient-to-br from-gray-500 to-gray-600';
  };

  const getStatusText = (status: string) => {
    const texts = {
      'active': 'نشط',
      'maintenance': 'صيانة',
      'out_of_service': 'خارج الخدمة',
      'inactive': 'غير نشط'
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getTypeIcon = (type: string | null) => {
    const icons = {
      'construction': <Wrench className="h-5 w-5" />,
      'transport': <Truck className="h-5 w-5" />,
      'tool': <PenTool className="h-5 w-5" />,
      'إنشائية': <Wrench className="h-5 w-5" />,
      'نقل': <Truck className="h-5 w-5" />,
      'أداة': <PenTool className="h-5 w-5" />
    };
    return icons[type as keyof typeof icons] || <Wrench className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">جاري تحميل المعدات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">إدارة المعدات</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            إدارة وتتبع المعدات والأدوات في المشاريع
          </p>
        </div>
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2"
          data-testid="button-add-equipment"
        >
          <Plus className="h-4 w-4" />
          إضافة معدة
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6 border-r-4 border-r-blue-500">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white dark:from-blue-950 dark:to-gray-900">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-500" />
            البحث والفلاتر
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Search className="h-4 w-4" />
                البحث
              </label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث بالاسم أو الكود..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                  data-testid="input-search-equipment"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                الحالة
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter" className="transition-all duration-200 hover:border-blue-300">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="maintenance">صيانة</SelectItem>
                  <SelectItem value="out_of_service">خارج الخدمة</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                النوع
              </label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger data-testid="select-type-filter" className="transition-all duration-200 hover:border-blue-300">
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="إنشائية">إنشائية</SelectItem>
                  <SelectItem value="نقل">نقل</SelectItem>
                  <SelectItem value="أداة">أداة</SelectItem>
                  <SelectItem value="construction">إنشائية</SelectItem>
                  <SelectItem value="transport">نقل</SelectItem>
                  <SelectItem value="tool">أداة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                المشروع
              </label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger data-testid="select-project-filter" className="transition-all duration-200 hover:border-blue-300">
                  <SelectValue placeholder="اختر المشروع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المواقع</SelectItem>
                  <SelectItem value="warehouse">المستودع</SelectItem>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <StatsGrid className="mb-6">
        <StatsCard
          title="إجمالي المعدات"
          value={equipment.length}
          icon={Wrench}
          trend={{ value: 0, isPositive: true }}
          className="border-r-4 border-r-blue-500"
          data-testid="stats-total-equipment"
        />
        <StatsCard
          title="نشطة"
          value={equipment.filter(e => e.status === 'active').length}
          icon={Activity}
          trend={{ value: 0, isPositive: true }}
          className="border-r-4 border-r-green-500 bg-gradient-to-r from-green-50 to-white dark:from-green-950 dark:to-gray-900"
          data-testid="stats-active-equipment"
        />
        <StatsCard
          title="في الصيانة"
          value={equipment.filter(e => e.status === 'maintenance').length}
          icon={Settings}
          trend={{ value: 0, isPositive: true }}
          className="border-r-4 border-r-yellow-500 bg-gradient-to-r from-yellow-50 to-white dark:from-yellow-950 dark:to-gray-900"
          data-testid="stats-maintenance-equipment"
        />
        <StatsCard
          title="خارج الخدمة"
          value={equipment.filter(e => e.status === 'out_of_service').length}
          icon={Truck}
          trend={{ value: 0, isPositive: false }}
          className="border-r-4 border-r-red-500 bg-gradient-to-r from-red-50 to-white dark:from-red-950 dark:to-gray-900"
          data-testid="stats-out-of-service-equipment"
        />
      </StatsGrid>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipment.map((item: Equipment) => (
          <Card 
            key={item.id} 
            className={`transition-all duration-300 hover:shadow-lg border-r-4 cursor-pointer ${getStatusBorderColor(item.status)}`}
            onClick={() => handleEquipmentClick(item)}
            data-testid={`card-equipment-${item.id}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${getTypeBackgroundColor(item.type)}`}>
                    {getTypeIcon(item.type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100" data-testid={`text-equipment-name-${item.id}`}>
                      {item.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(item.status)} data-testid={`badge-status-${item.id}`}>
                        {getStatusText(item.status)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.code}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={(e) => {e.stopPropagation(); handleEquipmentClick(item);}}>
                      <Eye className="mr-2 h-4 w-4" />
                      عرض التفاصيل
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {e.stopPropagation(); handleTransferClick(item, e);}}>
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                      نقل المعدة
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={(e) => {e.stopPropagation(); /* handleDeleteClick */}}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      حذف المعدة
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Location Info Card */}
                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-100 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <MapPin className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs text-green-700 dark:text-green-300 font-medium">الموقع الحالي</span>
                  </div>
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100 mt-1" data-testid={`text-location-${item.id}`}>
                    {item.currentProjectId 
                      ? projects.find(p => p.id === item.currentProjectId)?.name || 'مشروع غير معروف'
                      : 'المستودع'
                    }
                  </p>
                </div>

                {/* Purchase Info */}
                {(item.purchaseDate || item.purchasePrice) && (
                  <div className="grid grid-cols-2 gap-3">
                    {item.purchaseDate && (
                      <div className="p-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center gap-1 mb-1">
                          <Calendar className="h-3 w-3 text-blue-500" />
                          <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">تاريخ الشراء</span>
                        </div>
                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">{formatDate(item.purchaseDate)}</p>
                      </div>
                    )}
                    {item.purchasePrice && (
                      <div className="p-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
                        <div className="flex items-center gap-1 mb-1">
                          <DollarSign className="h-3 w-3 text-amber-500" />
                          <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">السعر</span>
                        </div>
                        <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">{formatCurrency(Number(item.purchasePrice))}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                {item.description && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">و</span>
                      </div>
                      <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">الوصف</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2" data-testid={`text-description-${item.id}`}>
                      {item.description}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {e.stopPropagation(); handleEquipmentClick(item);}}
                    className="flex-1 bg-white hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-gray-700 border-blue-200 hover:border-blue-300 transition-all duration-200"
                    data-testid={`button-details-${item.id}`}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    التفاصيل
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={(e) => {e.stopPropagation(); handleTransferClick(item, e);}}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                    data-testid={`button-transfer-${item.id}`}
                  >
                    <ArrowUpDown className="h-4 w-4 mr-1" />
                    نقل
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {equipment.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              لا توجد معدات
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || projectFilter !== 'all'
                ? 'لم يتم العثور على معدات تطابق معايير البحث.'
                : 'لم يتم إضافة أي معدات بعد. ابدأ بإضافة معدة جديدة.'
              }
            </p>
            {!(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || projectFilter !== 'all') && (
              <Button 
                onClick={() => setShowAddDialog(true)}
                data-testid="button-add-first-equipment"
              >
                إضافة معدة
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <AddEquipmentDialog 
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        projects={projects}
      />

      <EquipmentDetailsDialog
        equipment={selectedEquipment}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        projects={projects}
      />

      <TransferEquipmentDialog
        equipment={selectedEquipment}
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        projects={projects}
      />
    </div>
  );
}