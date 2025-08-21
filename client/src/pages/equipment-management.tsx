import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Wrench, Truck, ArrowUpDown, PenTool, Settings, Eye, MapPin, Calendar, DollarSign, Activity, MoreVertical, Edit, Trash2, Image, X, Heart } from "lucide-react";
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
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);

  const queryClient = useQueryClient();
  const { setFloatingAction } = useFloatingButton();

  // تعيين إجراء الزر العائم لإضافة معدة جديدة
  useEffect(() => {
    const handleAddEquipment = () => setShowAddDialog(true);
    setFloatingAction(handleAddEquipment, "إضافة معدة جديدة");
    return () => setFloatingAction(null);
  }, [setFloatingAction]);

  // جلب المعدات مع الفلاتر - محسن للأداء العالي
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
    },
    // تحسين الأداء للعمليات السريعة
    staleTime: 30 * 1000, // البيانات تعتبر محدثة لمدة 30 ثانية
    gcTime: 5 * 60 * 1000, // الاحتفاظ بالبيانات لـ 5 دقائق
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  // جلب المشاريع لقائمة الفلاتر - محسن للأداء العالي
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('فشل في جلب المشاريع');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // البيانات طازجة لـ 5 دقائق
    gcTime: 15 * 60 * 1000, // الاحتفاظ بالبيانات لـ 15 دقيقة
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const handleEquipmentClick = (item: Equipment) => {
    setSelectedEquipment(item);
    setShowEquipmentModal(true);
  };

  const handleTransferClick = (item: Equipment, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedEquipment(item);
    setShowTransferDialog(true);
  };

  const handleEditClick = (item: Equipment, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedEquipment(item);
    setShowDetailsDialog(true);
  };

  const handleDeleteClick = (item: Equipment, e?: React.MouseEvent) => {
    e?.stopPropagation();
    // Add delete logic here
    console.log('Delete equipment:', item.name);
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

  // إضافة تصحيح لمراقبة البيانات
  console.log('🔧 بيانات المعدات في Frontend:', { equipment, count: equipment?.length, isLoading });

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">


      {/* Search and Filters - Compact Version */}
      <div className="mb-4 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="البحث بالاسم أو الكود..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 h-10 text-sm border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            data-testid="input-search-equipment"
          />
        </div>
        
        {/* Compact Filters */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger data-testid="select-status-filter" className="h-9 text-xs border-gray-200">
              <div className="flex items-center gap-1 truncate">
                <Activity className="h-3 w-3 text-gray-500 shrink-0" />
                <SelectValue placeholder="الحالة" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="maintenance">صيانة</SelectItem>
              <SelectItem value="out_of_service">خارج الخدمة</SelectItem>
              <SelectItem value="inactive">غير نشط</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger data-testid="select-type-filter" className="h-9 text-xs border-gray-200">
              <div className="flex items-center gap-1 truncate">
                <Wrench className="h-3 w-3 text-gray-500 shrink-0" />
                <SelectValue placeholder="النوع" />
              </div>
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

          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger data-testid="select-project-filter" className="h-9 text-xs border-gray-200">
              <div className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 text-gray-500 shrink-0" />
                <SelectValue placeholder="المشروع" />
              </div>
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

      {/* Statistics */}
      <StatsGrid className="mb-6">
        <StatsCard
          title="إجمالي المعدات"
          value={equipment.length}
          icon={Wrench}
          className="border-r-4 border-r-blue-500"
          data-testid="stats-total-equipment"
        />
        <StatsCard
          title="نشطة"
          value={equipment.filter((e: Equipment) => e.status === 'active').length}
          icon={Activity}
          className="border-r-4 border-r-green-500 bg-gradient-to-r from-green-50 to-white dark:from-green-950 dark:to-gray-900"
          data-testid="stats-active-equipment"
        />
        <StatsCard
          title="في الصيانة"
          value={equipment.filter((e: Equipment) => e.status === 'maintenance').length}
          icon={Settings}
          className="border-r-4 border-r-yellow-500 bg-gradient-to-r from-yellow-50 to-white dark:from-yellow-950 dark:to-gray-900"
          data-testid="stats-maintenance-equipment"
        />
        <StatsCard
          title="خارج الخدمة"
          value={equipment.filter((e: Equipment) => e.status === 'out_of_service').length}
          icon={Truck}
          className="border-r-4 border-r-red-500 bg-gradient-to-r from-red-50 to-white dark:from-red-950 dark:to-gray-900"
          data-testid="stats-out-of-service-equipment"
        />
      </StatsGrid>

      {/* Equipment List - Restaurant Style */}
      <div className="space-y-4">
        {equipment.length === 0 ? (
          <Card className="p-8 text-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
            <div className="text-gray-400 mb-4">
              <Wrench className="h-16 w-16 mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              لا توجد معدات
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              لم يتم العثور على أي معدات تطابق الفلاتر المحددة
            </p>
            <Button onClick={() => setShowAddDialog(true)} className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6">
              <Plus className="h-4 w-4 mr-2" />
              إضافة معدة جديدة
            </Button>
          </Card>
        ) : (
          equipment.map((item: Equipment) => (
            <Card 
              key={item.id}
              className="bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
              onClick={() => handleEquipmentClick(item)}
              data-testid={`card-equipment-${item.id}`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Equipment Image */}
                    <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
                      {item.imageUrl && item.imageUrl.trim() !== '' && !item.imageUrl.startsWith('data:') ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onLoad={() => console.log('تم تحميل صورة المعدة بنجاح:', item.name)}
                          onError={(e) => {
                            console.error('فشل في تحميل صورة المعدة:', item.imageUrl);
                            const target = e.target as HTMLImageElement;
                            const parent = target.parentElement!;
                            parent.innerHTML = `<div class="${getTypeBackgroundColor(item.type).replace('bg-gradient-to-br', 'bg-gradient-to-br')} w-full h-full flex items-center justify-center text-white"><span class="text-xl">${getTypeIcon(item.type)}</span></div>`;
                          }}
                        />
                      ) : item.imageUrl && item.imageUrl.startsWith('data:') ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onLoad={() => console.log('تم تحميل صورة المعدة (base64) بنجاح:', item.name)}
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center text-white ${getTypeBackgroundColor(item.type)}`}>
                          {getTypeIcon(item.type)}
                        </div>
                      )}
                    </div>

                    {/* Equipment Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1" data-testid={`text-equipment-name-${item.id}`}>
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`text-xs ${getStatusColor(item.status)}`} data-testid={`badge-status-${item.id}`}>
                          {getStatusText(item.status)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.code}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate" data-testid={`text-location-${item.id}`}>
                          {item.currentProjectId 
                            ? projects.find((p: any) => p.id === item.currentProjectId)?.name || 'مشروع غير معروف'
                            : 'المستودع'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex flex-col items-end gap-2">
                    {item.purchasePrice && (
                      <div className="text-left">
                        <div className="text-sm text-gray-500 dark:text-gray-400">السعر</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(Number(item.purchasePrice))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTransferClick(item, e);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full px-4 py-2 text-sm font-medium"
                        data-testid={`button-transfer-${item.id}`}
                      >
                        نقل المعدة
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>


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

      {/* Equipment Detail Modal - Restaurant Style */}
      <Dialog open={showEquipmentModal} onOpenChange={setShowEquipmentModal}>
        <DialogContent className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
          {selectedEquipment && (
            <div className="relative">
              {/* Close Button */}
              <button
                onClick={() => setShowEquipmentModal(false)}
                className="absolute top-4 right-4 z-10 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Equipment Image */}
              <div className="relative h-64 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {selectedEquipment.imageUrl && selectedEquipment.imageUrl.trim() !== '' ? (
                  <img 
                    src={selectedEquipment.imageUrl}
                    alt={selectedEquipment.name}
                    className="w-full h-full object-cover"
                    onLoad={() => console.log('تم تحميل صورة المعدة في النافذة بنجاح:', selectedEquipment.name)}
                    onError={(e) => {
                      console.error('فشل في تحميل صورة المعدة في النافذة:', selectedEquipment.imageUrl);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement!;
                      parent.innerHTML = `<div class="${getTypeBackgroundColor(selectedEquipment.type).replace('bg-gradient-to-br', 'bg-gradient-to-br')} w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl"><span>${getTypeIcon(selectedEquipment.type)}</span></div>`;
                    }}
                  />
                ) : (
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl ${getTypeBackgroundColor(selectedEquipment.type)}`}>
                    {getTypeIcon(selectedEquipment.type)}
                  </div>
                )}
              </div>

              {/* Equipment Details */}
              <div className="p-6 space-y-4">
                {/* Name and Status */}
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {selectedEquipment.name}
                  </h2>
                  <div className="flex items-center justify-center gap-2">
                    <Badge className={`text-xs ${getStatusColor(selectedEquipment.status)}`}>
                      {getStatusText(selectedEquipment.status)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedEquipment.code}
                    </Badge>
                  </div>
                </div>

                {/* Price Display */}
                {selectedEquipment.purchasePrice && (
                  <div className="text-center bg-orange-100 dark:bg-orange-900/20 rounded-lg p-3">
                    <div className="text-sm text-orange-600 dark:text-orange-400 mb-1">السعر</div>
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {formatCurrency(Number(selectedEquipment.purchasePrice))}
                    </div>
                  </div>
                )}

                {/* Location Info */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">الموقع الحالي</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedEquipment.currentProjectId 
                          ? projects.find((p: any) => p.id === selectedEquipment.currentProjectId)?.name || 'مشروع غير معروف'
                          : 'المستودع'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedEquipment.description && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">الوصف</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedEquipment.description}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={() => {
                      setShowEquipmentModal(false);
                      handleEditClick(selectedEquipment);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full py-3 font-medium text-sm"
                  >
                    تعديل
                  </Button>
                  <Button
                    onClick={() => {
                      setShowEquipmentModal(false);
                      handleDeleteClick(selectedEquipment);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full py-3 font-medium text-sm"
                  >
                    حذف
                  </Button>
                  <Button
                    onClick={() => {
                      setShowEquipmentModal(false);
                      handleTransferClick(selectedEquipment);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full py-3 font-medium text-sm"
                  >
                    نقل
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* نافذة عرض الصورة بالحجم الكامل */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              data-testid="button-close-image"
            >
              <X size={24} />
            </button>
            <img 
              src={enlargedImage} 
              alt="صورة المعدة بالحجم الكامل"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}