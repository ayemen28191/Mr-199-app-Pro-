import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, FileText, Calendar, Download, ArrowLeft, Filter, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "wouter";
import {
  addReportHeader,
  addReportFooter,
  formatDataTable,
  formatTotalsRow,
  saveExcelFile,
  formatCurrency,
  formatDate
} from "@/components/excel-export-utils";
import type { Supplier, MaterialPurchase, Project } from "@shared/schema";

export default function SupplierReportPage() {
  const [location, setLocation] = useLocation();
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [purchaseTypeFilter, setPurchaseTypeFilter] = useState<string>("all");

  // Extract supplier ID from URL query params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const supplierParam = urlParams.get('supplier');
    if (supplierParam) {
      setSelectedSupplierId(supplierParam);
    }
  }, []);

  // Get suppliers list
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  // Get projects list
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Get purchases for the selected supplier
  const { data: purchases = [], isLoading: isLoadingPurchases } = useQuery<MaterialPurchase[]>({
    queryKey: ["/api/suppliers", selectedSupplierId, "purchases", { 
      projectIds: selectedProjectIds.length > 0 ? selectedProjectIds : undefined,
      dateFrom, 
      dateTo, 
      purchaseType: purchaseTypeFilter === "all" ? undefined : purchaseTypeFilter 
    }],
    enabled: !!selectedSupplierId,
  });

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
  const selectedProjects = selectedProjectIds.length > 0 
    ? projects.filter(p => selectedProjectIds.includes(p.id))
    : [];

  // Calculate totals
  const totals = purchases.reduce((acc, purchase) => {
    acc.totalAmount += parseFloat(purchase.totalAmount);
    acc.paidAmount += parseFloat(purchase.paidAmount || "0");
    acc.remainingAmount += parseFloat(purchase.remainingAmount || "0");
    return acc;
  }, { totalAmount: 0, paidAmount: 0, remainingAmount: 0 });

  const formatCurrencyDisplay = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('ar-SA') + " ر.ي";
  };

  const getPurchaseTypeVariant = (purchaseType: string) => {
    return purchaseType === "نقد" ? "default" : purchaseType === "أجل" ? "secondary" : "outline";
  };

  // Handle project selection
  const handleProjectToggle = (projectId: string) => {
    setSelectedProjectIds(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };

  const exportToExcel = async () => {
    if (!selectedSupplier || purchases.length === 0) return;

    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('كشف حساب المورد', {
        views: [{ rightToLeft: true }]
      });

      // معلومات إضافية للتقرير
      const projectsText = selectedProjects.length > 0 
        ? selectedProjects.map(p => p.name).join(' - ')
        : 'جميع المشاريع';
      
      const additionalInfo = [
        `اسم المورد: ${selectedSupplier.name}`,
        `الشخص المسؤول: ${selectedSupplier.contactPerson || '-'}`,
        `رقم الهاتف: ${selectedSupplier.phone || '-'}`,
        `المشاريع المحددة: ${projectsText}`,
        `الفترة الزمنية: ${dateFrom || 'من البداية'} إلى ${dateTo || 'حتى الآن'}`
      ];

      // إضافة رأس التقرير الموحد
      const startRow = addReportHeader(
        worksheet,
        'كشف حساب المورد',
        `تقرير مفصل لحساب المورد: ${selectedSupplier.name}`,
        additionalInfo
      );

      // عناوين الأعمدة
      const headers = ['التاريخ', 'رقم الفاتورة', 'المشروع', 'المادة', 'الكمية', 'سعر الوحدة', 'المبلغ الإجمالي', 'نوع الشراء', 'المدفوع', 'المتبقي'];
      const headerRow = worksheet.addRow(headers);
      const headerRowIndex = startRow;

      // بيانات المشتريات
      purchases.forEach(purchase => {
        const projectName = projects.find(p => p.id === purchase.projectId)?.name || 'مشروع غير محدد';
        worksheet.addRow([
          formatDate(purchase.invoiceDate),
          purchase.invoiceNumber || '-',
          projectName,
          purchase.materialId,
          purchase.quantity,
          formatCurrency(purchase.unitPrice),
          formatCurrency(purchase.totalAmount),
          purchase.purchaseType,
          formatCurrency(purchase.paidAmount || '0'),
          formatCurrency(purchase.remainingAmount || '0')
        ]);
      });

      const dataEndRow = startRow + purchases.length;

      // صف المجموع
      worksheet.addRow([]);
      const totalsRowData = ['المجموع الإجمالي', '', '', '', '', '', formatCurrency(totals.totalAmount), '', formatCurrency(totals.paidAmount), formatCurrency(totals.remainingAmount)];
      const totalsRow = worksheet.addRow(totalsRowData);
      const totalsRowIndex = dataEndRow + 2;

      // تنسيق الجدول
      formatDataTable(worksheet, headerRowIndex, startRow + 1, dataEndRow, headers.length);
      formatTotalsRow(worksheet, totalsRowIndex);

      // إضافة الذيل
      addReportFooter(worksheet, totalsRowIndex + 3);

      // حفظ الملف
      const fileName = `كشف-حساب-${selectedSupplier.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`;
      saveExcelFile(workbook, fileName);

    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('حدث خطأ في تصدير الملف');
    }
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setLocation("/suppliers")}>
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة للموردين
          </Button>
          <div>
            <h1 className="text-3xl font-bold">كشف حساب المورد</h1>
            <p className="text-muted-foreground">
              تقرير مفصل لمشتريات المورد والمديونيات
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={printReport} variant="outline">
            <FileText className="w-4 h-4 ml-2" />
            طباعة
          </Button>
          <Button onClick={exportToExcel} disabled={!selectedSupplierId || purchases.length === 0}>
            <Download className="w-4 h-4 ml-2" />
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            فلاتر التقرير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>المورد *</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المورد" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>المشاريع (اختيار متعدد)</Label>
              <Card className="p-3">
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {projects.map((project) => (
                      <div 
                        key={project.id} 
                        className="flex items-center gap-2 hover:bg-accent hover:text-accent-foreground p-2 rounded cursor-pointer"
                        onClick={() => handleProjectToggle(project.id)}
                      >
                        {selectedProjectIds.includes(project.id) ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                        <span className="text-sm">{project.name}</span>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm">لا توجد مشاريع متاحة</p>
                    )}
                  </div>
                </ScrollArea>
                <div className="mt-2 text-xs text-muted-foreground">
                  {selectedProjectIds.length === 0 ? 'جميع المشاريع' : `${selectedProjectIds.length} مشروع محدد`}
                </div>
              </Card>
            </div>

            <div className="space-y-2">
              <Label>من تاريخ</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>إلى تاريخ</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>نوع الشراء</Label>
              <Select value={purchaseTypeFilter} onValueChange={setPurchaseTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="نوع الشراء" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="نقد">نقد</SelectItem>
                  <SelectItem value="أجل">أجل</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {selectedSupplier && (
        <>
          {/* Supplier Info */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">كشف حساب المورد</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="font-semibold">اسم المورد:</Label>
                    <span>{selectedSupplier.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label className="font-semibold">الشخص المسؤول:</Label>
                    <span>{selectedSupplier.contactPerson || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label className="font-semibold">رقم الهاتف:</Label>
                    <span>{selectedSupplier.phone || "-"}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="font-semibold">المشاريع المحددة:</Label>
                    <span>
                      {selectedProjects.length > 0 
                        ? (selectedProjects.length === 1 
                          ? selectedProjects[0].name 
                          : `${selectedProjects.length} مشروع محدد`)
                        : "جميع المشاريع"
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <Label className="font-semibold">الفترة:</Label>
                    <span>{`${dateFrom || 'من البداية'} - ${dateTo || 'حتى الآن'}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label className="font-semibold">تاريخ التقرير:</Label>
                    <span>{formatDate(new Date().toISOString().split('T')[0])}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-gray-600">إجمالي المشتريات</p>
                <p className="text-2xl font-bold">{formatCurrencyDisplay(totals.totalAmount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-gray-600">المدفوع</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrencyDisplay(totals.paidAmount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-gray-600">المتبقي</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrencyDisplay(totals.remainingAmount)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Purchases Table */}
          <Card>
            <CardContent className="p-6">
              {isLoadingPurchases ? (
                <div className="text-center py-8">جاري تحميل البيانات...</div>
              ) : purchases.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">لا توجد مشتريات للمورد في الفترة المحددة</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center font-semibold">التاريخ</TableHead>
                        <TableHead className="text-center font-semibold">رقم الفاتورة</TableHead>
                        <TableHead className="text-center font-semibold">المشروع</TableHead>
                        <TableHead className="text-center font-semibold">المادة</TableHead>
                        <TableHead className="text-center font-semibold">الكمية</TableHead>
                        <TableHead className="text-center font-semibold">سعر الوحدة</TableHead>
                        <TableHead className="text-center font-semibold">المبلغ الإجمالي</TableHead>
                        <TableHead className="text-center font-semibold">نوع الشراء</TableHead>
                        <TableHead className="text-center font-semibold">المدفوع</TableHead>
                        <TableHead className="text-center font-semibold">المتبقي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases.map((purchase) => {
                        const projectName = projects.find(p => p.id === purchase.projectId)?.name || 'مشروع غير محدد';
                        return (
                          <TableRow key={purchase.id} className="hover:bg-muted/50">
                            <TableCell className="text-center">{formatDate(purchase.invoiceDate)}</TableCell>
                            <TableCell className="text-center">{purchase.invoiceNumber || "-"}</TableCell>
                            <TableCell className="text-center">
                              <span className="text-xs bg-muted px-2 py-1 rounded">{projectName}</span>
                            </TableCell>
                            <TableCell className="text-center">{purchase.materialId}</TableCell>
                            <TableCell className="text-center">{purchase.quantity}</TableCell>
                            <TableCell className="text-center">{formatCurrencyDisplay(purchase.unitPrice)}</TableCell>
                            <TableCell className="text-center font-medium">
                              {formatCurrencyDisplay(purchase.totalAmount)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={getPurchaseTypeVariant(purchase.purchaseType)}>
                                {purchase.purchaseType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-green-600 font-medium">
                              {formatCurrencyDisplay(purchase.paidAmount || "0")}
                            </TableCell>
                            <TableCell className="text-center text-red-600 font-medium">
                              {formatCurrencyDisplay(purchase.remainingAmount || "0")}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  <Separator className="my-4" />

                  {/* Totals Row */}
                  <div className="bg-muted/30 p-4 rounded-lg border-t-2">
                    <Table>
                      <TableBody>
                        <TableRow className="font-bold text-lg">
                          <TableCell className="text-center">المجموع الإجمالي</TableCell>
                          <TableCell className="text-center">-</TableCell>
                          <TableCell className="text-center">-</TableCell>
                          <TableCell className="text-center">-</TableCell>
                          <TableCell className="text-center">-</TableCell>
                          <TableCell className="text-center">-</TableCell>
                          <TableCell className="text-center font-bold">{formatCurrencyDisplay(totals.totalAmount)}</TableCell>
                          <TableCell className="text-center">-</TableCell>
                          <TableCell className="text-center text-green-600 font-bold">{formatCurrencyDisplay(totals.paidAmount)}</TableCell>
                          <TableCell className="text-center text-red-600 font-bold">{formatCurrencyDisplay(totals.remainingAmount)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!selectedSupplierId && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">اختر مورداً لإنشاء التقرير</h3>
            <p className="text-gray-500">
              اختر مورداً من القائمة أعلاه لعرض كشف حسابه التفصيلي
            </p>
          </CardContent>
        </Card>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            margin: 0.5in;
            size: A4;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          body {
            -webkit-print-color-adjust: exact;
          }
          
          .container {
            max-width: none !important;
            padding: 0 !important;
          }
        }
        
        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .overflow-x-auto {
            -webkit-overflow-scrolling: touch;
          }
          
          .container {
            padding: 0.5rem !important;
          }
          
          table {
            font-size: 0.875rem;
          }
          
          th, td {
            padding: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}