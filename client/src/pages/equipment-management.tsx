import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Wrench, Truck, ArrowUpDown, PenTool } from "lucide-react";
import { AddEquipmentDialog } from "@/components/equipment/add-equipment-dialog";
import { EquipmentDetailsDialog } from "@/components/equipment/equipment-details-dialog";
import { TransferEquipmentDialog } from "@/components/equipment/transfer-equipment-dialog";
import { Equipment } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

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

  const getStatusText = (status: string) => {
    const texts = {
      'active': 'نشط',
      'maintenance': 'صيانة',
      'out_of_service': 'خارج الخدمة',
      'inactive': 'غير نشط'
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      'construction': <Wrench className="h-4 w-4" />,
      'transport': <Truck className="h-4 w-4" />,
      'tool': <PenTool className="h-4 w-4" />
    };
    return icons[type as keyof typeof icons] || <Wrench className="h-4 w-4" />;
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

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">البحث والفلاتر</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في المعدات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
                data-testid="input-search-equipment"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="حالة المعدة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="maintenance">صيانة</SelectItem>
                <SelectItem value="out_of_service">خارج الخدمة</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger data-testid="select-type-filter">
                <SelectValue placeholder="نوع المعدة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="construction">إنشائية</SelectItem>
                <SelectItem value="transport">نقل</SelectItem>
                <SelectItem value="tool">أداة</SelectItem>
              </SelectContent>
            </Select>

            {/* Project Filter */}
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger data-testid="select-project-filter">
                <SelectValue placeholder="المشروع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المشاريع</SelectItem>
                <SelectItem value="warehouse">المستودع</SelectItem>
                {projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي المعدات</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-total-equipment">
                  {equipment.length}
                </p>
              </div>
              <Wrench className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">نشطة</p>
                <p className="text-2xl font-bold text-green-600" data-testid="text-active-equipment">
                  {equipment.filter(e => e.status === 'active').length}
                </p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">في الصيانة</p>
                <p className="text-2xl font-bold text-yellow-600" data-testid="text-maintenance-equipment">
                  {equipment.filter(e => e.status === 'maintenance').length}
                </p>
              </div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">خارج الخدمة</p>
                <p className="text-2xl font-bold text-red-600" data-testid="text-out-of-service-equipment">
                  {equipment.filter(e => e.status === 'out_of_service').length}
                </p>
              </div>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipment.map((item: Equipment) => (
          <Card 
            key={item.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleEquipmentClick(item)}
            data-testid={`card-equipment-${item.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getTypeIcon(item.type)}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100" data-testid={`text-equipment-name-${item.id}`}>
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400" data-testid={`text-equipment-code-${item.id}`}>
                      {item.code}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => handleTransferClick(item, e)}
                  className="p-1 h-8 w-8"
                  data-testid={`button-transfer-${item.id}`}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">الحالة:</span>
                  <Badge className={getStatusColor(item.status)} data-testid={`badge-status-${item.id}`}>
                    {getStatusText(item.status)}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">الموقع:</span>
                  <span className="text-sm font-medium" data-testid={`text-location-${item.id}`}>
                    {item.currentProjectId 
                      ? projects.find(p => p.id === item.currentProjectId)?.name || 'مشروع غير معروف'
                      : 'المستودع'
                    }
                  </span>
                </div>

                {item.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2" data-testid={`text-description-${item.id}`}>
                    {item.description.substring(0, 100)}
                    {item.description.length > 100 && '...'}
                  </p>
                )}
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