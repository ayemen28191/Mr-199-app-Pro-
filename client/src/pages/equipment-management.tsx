import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Wrench, Truck, ArrowUpDown, PenTool, Settings, Eye, MapPin, Calendar, DollarSign, Activity, MoreVertical, Edit, Trash2, Image, X, Heart, FileSpreadsheet, FileText, Printer, Download, BarChart3 } from "lucide-react";
import { StatsCard, StatsGrid } from "@/components/ui/stats-card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useFloatingButton } from "@/components/layout/floating-button-context";
import { AddEquipmentDialog } from "@/components/equipment/add-equipment-dialog";
import { EquipmentDetailsDialog } from "@/components/equipment/equipment-details-dialog";
import { TransferEquipmentDialog } from "@/components/equipment/transfer-equipment-dialog";
import { Equipment } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import { saveAs } from 'file-saver';
import { useToast } from "@/hooks/use-toast";

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
  
  // States for Equipment Reports Section
  const [showReportsSection, setShowReportsSection] = useState(false);
  const [reportProjectFilter, setReportProjectFilter] = useState("all");
  const [reportStatusFilter, setReportStatusFilter] = useState("all");
  const [reportTypeFilter, setReportTypeFilter] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  const queryClient = useQueryClient();
  const { setFloatingAction } = useFloatingButton();
  const { toast } = useToast();

  // تعيين إجراء الزر العائم لإضافة معدة جديدة
  useEffect(() => {
    const handleAddEquipment = () => setShowAddDialog(true);
    setFloatingAction(handleAddEquipment, "إضافة معدة جديدة");
    return () => setFloatingAction(null);
  }, [setFloatingAction]);

  // جلب المعدات مع الفلاتر - محسن للأداء العالي
  const { data: equipment = [], isLoading, refetch } = useQuery({
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
    // تحسين للتحديث الفوري بعد النقل
    staleTime: 0, // تحديث فوري
    gcTime: 5 * 60 * 1000, // الاحتفاظ بالبيانات لـ 5 دقائق
    refetchOnWindowFocus: true, // إعادة تحميل عند التركيز
    refetchOnMount: true // إعادة تحميل عند التحميل
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

  // Functions for Equipment Reports
  const getFilteredEquipmentForReport = () => {
    return equipment.filter((item: Equipment) => {
      const matchesProject = reportProjectFilter === "all" || 
        (reportProjectFilter === "warehouse" && !item.currentProjectId) ||
        item.currentProjectId === reportProjectFilter;
      
      const matchesStatus = reportStatusFilter === "all" || item.status === reportStatusFilter;
      const matchesType = reportTypeFilter === "all" || item.type === reportTypeFilter;
      
      return matchesProject && matchesStatus && matchesType;
    });
  };

  const exportEquipmentToExcel = async () => {
    const filteredEquipment = getFilteredEquipmentForReport();
    
    if (filteredEquipment.length === 0) {
      toast({
        title: "لا توجد معدات للتصدير",
        description: "يرجى التأكد من الفلاتر المحددة",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsExporting(true);
      
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('كشف المعدات');
      
      // Set RTL direction
      worksheet.views = [{ rightToLeft: true }];
      
      // Define columns
      worksheet.columns = [
        { header: 'الكود', key: 'code', width: 15 },
        { header: 'اسم المعدة', key: 'name', width: 25 },
        { header: 'النوع', key: 'type', width: 15 },
        { header: 'الحالة', key: 'status', width: 15 },
        { header: 'الموقع', key: 'location', width: 25 },
        { header: 'سعر الشراء', key: 'price', width: 15 },
        { header: 'تاريخ الشراء', key: 'purchaseDate', width: 15 },
        { header: 'الوصف', key: 'description', width: 30 }
      ];

      // Style the header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

      // Add data rows
      filteredEquipment.forEach((item: Equipment) => {
        const projectName = item.currentProjectId 
          ? projects.find((p: any) => p.id === item.currentProjectId)?.name || 'مشروع غير معروف'
          : 'المستودع';
        
        worksheet.addRow({
          code: item.code,
          name: item.name,
          type: item.type === 'construction' ? 'إنشائية' : 
                item.type === 'transport' ? 'نقل' : 
                item.type === 'tool' ? 'أداة' : item.type,
          status: getStatusText(item.status),
          location: projectName,
          price: item.purchasePrice ? `${formatCurrency(Number(item.purchasePrice))}` : 'غير محدد',
          purchaseDate: item.purchaseDate ? formatDate(item.purchaseDate) : 'غير محدد',
          description: item.description || 'غير محدد'
        });
      });

      // Add borders and styling to all cells
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          
          if (rowNumber > 1) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
        });
      });

      // Add summary section
      const summaryStartRow = worksheet.rowCount + 3;
      worksheet.addRow([]);
      worksheet.addRow([]);
      worksheet.addRow(['ملخص المعدات', '', '', '', '', '', '', '']);
      
      const summaryHeaderRow = worksheet.getRow(summaryStartRow);
      summaryHeaderRow.font = { bold: true, size: 14 };
      summaryHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      
      worksheet.addRow(['إجمالي المعدات', filteredEquipment.length, '', '', '', '', '', '']);
      worksheet.addRow(['المعدات النشطة', filteredEquipment.filter((e: Equipment) => e.status === 'active').length, '', '', '', '', '', '']);
      worksheet.addRow(['في الصيانة', filteredEquipment.filter((e: Equipment) => e.status === 'maintenance').length, '', '', '', '', '', '']);
      worksheet.addRow(['خارج الخدمة', filteredEquipment.filter((e: Equipment) => e.status === 'out_of_service').length, '', '', '', '', '', '']);

      // Generate filename
      const projectName = reportProjectFilter === "all" ? "جميع_المشاريع" : 
                         reportProjectFilter === "warehouse" ? "المستودع" :
                         projects.find((p: any) => p.id === reportProjectFilter)?.name || "مشروع_محدد";
      
      const filename = `كشف_المعدات_${projectName}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Save file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      saveAs(blob, filename);
      
      toast({
        title: "تم تصدير كشف المعدات بنجاح",
        description: `تم حفظ الملف: ${filename}`
      });
      
    } catch (error) {
      console.error('خطأ في تصدير Excel:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير كشف المعدات",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportEquipmentToPDF = async () => {
    const filteredEquipment = getFilteredEquipmentForReport();
    
    if (filteredEquipment.length === 0) {
      toast({
        title: "لا توجد معدات للتصدير",
        description: "يرجى التأكد من الفلاتر المحددة",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsExporting(true);
      
      // Create print content
      const projectName = reportProjectFilter === "all" ? "جميع المشاريع" : 
                         reportProjectFilter === "warehouse" ? "المستودع" :
                         projects.find((p: any) => p.id === reportProjectFilter)?.name || "مشروع محدد";
      
      const printContent = `
        <html dir="rtl">
          <head>
            <meta charset="UTF-8">
            <title>كشف المعدات - ${projectName}</title>
            <style>
              body { font-family: 'Arial', sans-serif; margin: 20px; direction: rtl; }
              .header { text-align: center; margin-bottom: 30px; }
              .header h1 { color: #1f2937; margin-bottom: 10px; }
              .header p { color: #6b7280; margin: 5px 0; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #d1d5db; padding: 8px; text-align: center; }
              th { background-color: #2563eb; color: white; font-weight: bold; }
              tr:nth-child(even) { background-color: #f9fafb; }
              .summary { margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 8px; }
              .summary h3 { margin-top: 0; color: #1f2937; }
              .summary-item { display: inline-block; margin: 5px 15px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>كشف المعدات</h1>
              <p>المشروع: ${projectName}</p>
              <p>تاريخ التقرير: ${formatDate(new Date().toISOString().split('T')[0])}</p>
              <p>إجمالي المعدات: ${filteredEquipment.length}</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>الكود</th>
                  <th>اسم المعدة</th>
                  <th>النوع</th>
                  <th>الحالة</th>
                  <th>الموقع</th>
                  <th>سعر الشراء</th>
                  <th>تاريخ الشراء</th>
                </tr>
              </thead>
              <tbody>
                ${filteredEquipment.map((item: Equipment) => {
                  const projectName = item.currentProjectId 
                    ? projects.find((p: any) => p.id === item.currentProjectId)?.name || 'مشروع غير معروف'
                    : 'المستودع';
                  
                  return `
                    <tr>
                      <td>${item.code}</td>
                      <td>${item.name}</td>
                      <td>${item.type === 'construction' ? 'إنشائية' : 
                           item.type === 'transport' ? 'نقل' : 
                           item.type === 'tool' ? 'أداة' : item.type}</td>
                      <td>${getStatusText(item.status)}</td>
                      <td>${projectName}</td>
                      <td>${item.purchasePrice ? formatCurrency(Number(item.purchasePrice)) : 'غير محدد'}</td>
                      <td>${item.purchaseDate ? formatDate(item.purchaseDate) : 'غير محدد'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            
            <div class="summary">
              <h3>ملخص المعدات</h3>
              <div class="summary-item"><strong>إجمالي المعدات:</strong> ${filteredEquipment.length}</div>
              <div class="summary-item"><strong>المعدات النشطة:</strong> ${filteredEquipment.filter((e: Equipment) => e.status === 'active').length}</div>
              <div class="summary-item"><strong>في الصيانة:</strong> ${filteredEquipment.filter((e: Equipment) => e.status === 'maintenance').length}</div>
              <div class="summary-item"><strong>خارج الخدمة:</strong> ${filteredEquipment.filter((e: Equipment) => e.status === 'out_of_service').length}</div>
            </div>
          </body>
        </html>
      `;

      // Open print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        };
        
        toast({
          title: "جاري فتح نافذة الطباعة",
          description: "اختر 'حفظ كـ PDF' من خيارات الطباعة"
        });
      }
      
    } catch (error) {
      console.error('خطأ في تصدير PDF:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير كشف المعدات",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
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

      {/* Equipment Reports Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              كشوفات المعدات
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReportsSection(!showReportsSection)}
              className="flex items-center gap-2"
              data-testid="button-toggle-reports"
            >
              {showReportsSection ? 'إخفاء' : 'عرض'} الكشوفات
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        {showReportsSection && (
          <CardContent className="space-y-4">
            {/* Report Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">فلترة حسب المشروع</label>
                <Select value={reportProjectFilter} onValueChange={setReportProjectFilter}>
                  <SelectTrigger data-testid="select-report-project-filter" className="h-9 text-sm">
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="h-3 w-3 text-gray-500 shrink-0" />
                      <SelectValue placeholder="اختر المشروع" />
                    </div>
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">فلترة حسب الحالة</label>
                <Select value={reportStatusFilter} onValueChange={setReportStatusFilter}>
                  <SelectTrigger data-testid="select-report-status-filter" className="h-9 text-sm">
                    <div className="flex items-center gap-2 truncate">
                      <Activity className="h-3 w-3 text-gray-500 shrink-0" />
                      <SelectValue placeholder="اختر الحالة" />
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
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">فلترة حسب النوع</label>
                <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
                  <SelectTrigger data-testid="select-report-type-filter" className="h-9 text-sm">
                    <div className="flex items-center gap-2 truncate">
                      <Wrench className="h-3 w-3 text-gray-500 shrink-0" />
                      <SelectValue placeholder="اختر النوع" />
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
              </div>
            </div>

            {/* Report Preview */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">معاينة الكشف</h4>
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  {getFilteredEquipmentForReport().length} معدة
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-4">
                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {getFilteredEquipmentForReport().length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">إجمالي المعدات</div>
                </div>
                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {getFilteredEquipmentForReport().filter((e: Equipment) => e.status === 'active').length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">نشطة</div>
                </div>
                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {getFilteredEquipmentForReport().filter((e: Equipment) => e.status === 'maintenance').length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">صيانة</div>
                </div>
                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {getFilteredEquipmentForReport().filter((e: Equipment) => e.status === 'out_of_service').length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">خارج الخدمة</div>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={exportEquipmentToExcel}
                  disabled={isExporting || getFilteredEquipmentForReport().length === 0}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-export-excel"
                >
                  {isExporting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <FileSpreadsheet className="h-4 w-4" />
                  )}
                  تصدير Excel
                </Button>

                <Button
                  onClick={exportEquipmentToPDF}
                  disabled={isExporting || getFilteredEquipmentForReport().length === 0}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                  data-testid="button-export-pdf"
                >
                  {isExporting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  تصدير PDF
                </Button>

                <Button
                  onClick={() => {
                    const filteredEquipment = getFilteredEquipmentForReport();
                    if (filteredEquipment.length === 0) {
                      toast({
                        title: "لا توجد معدات للطباعة",
                        description: "يرجى التأكد من الفلاتر المحددة",
                        variant: "destructive"
                      });
                      return;
                    }
                    exportEquipmentToPDF();
                  }}
                  variant="outline"
                  disabled={isExporting}
                  className="flex items-center gap-2"
                  data-testid="button-print-report"
                >
                  <Printer className="h-4 w-4" />
                  طباعة
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

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
                      {item.imageUrl && item.imageUrl.trim() !== '' ? (
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