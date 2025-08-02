import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, FileText, Calendar, Download, ArrowLeft, Filter } from "lucide-react";
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
import { useLocation } from "wouter";
// تم استيراد مكتبة التصدير مسبقاً في package.json
import type { Supplier, MaterialPurchase } from "@shared/schema";

export default function SupplierReportPage() {
  const [location, setLocation] = useLocation();
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("all");

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
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Get purchases for the selected supplier
  const { data: purchases = [], isLoading: isLoadingPurchases } = useQuery<MaterialPurchase[]>({
    queryKey: ["/api/suppliers", selectedSupplierId, "purchases", { 
      projectId: selectedProjectId, 
      dateFrom, 
      dateTo, 
      paymentType: paymentTypeFilter === "all" ? undefined : paymentTypeFilter 
    }],
    enabled: !!selectedSupplierId,
  });

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
  const selectedProject = projects.find((p: any) => p.id === selectedProjectId);

  // Calculate totals
  const totals = purchases.reduce((acc, purchase) => {
    acc.totalAmount += parseFloat(purchase.totalAmount);
    acc.paidAmount += parseFloat(purchase.paidAmount || "0");
    acc.remainingAmount += parseFloat(purchase.remainingAmount || "0");
    return acc;
  }, { totalAmount: 0, paidAmount: 0, remainingAmount: 0 });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB');
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('en-GB') + " ر.ي";
  };

  const getPaymentTypeVariant = (paymentType: string) => {
    return paymentType === "نقد" ? "default" : paymentType === "أجل" ? "secondary" : "outline";
  };

  const exportToExcel = async () => {
    if (!selectedSupplier || purchases.length === 0) return;

    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('كشف حساب المورد');

      // عنوان التقرير
      worksheet.addRow(['كشف حساب المورد']);
      worksheet.addRow([]);
      
      // معلومات المورد
      worksheet.addRow(['اسم المورد:', selectedSupplier.name]);
      worksheet.addRow(['رقم الهاتف:', selectedSupplier.phone || '-']);
      worksheet.addRow(['العنوان:', selectedSupplier.address || '-']);
      worksheet.addRow(['المشروع:', selectedProject?.name || 'جميع المشاريع']);
      worksheet.addRow(['الفترة:', `${dateFrom || 'من البداية'} - ${dateTo || 'حتى الآن'}`]);
      worksheet.addRow([]);

      // عناوين الأعمدة
      const headers = ['التاريخ', 'رقم الفاتورة', 'المادة', 'الكمية', 'سعر الوحدة', 'المبلغ الإجمالي', 'نوع الدفع', 'المدفوع', 'المتبقي'];
      worksheet.addRow(headers);

      // بيانات المشتريات
      purchases.forEach(purchase => {
        worksheet.addRow([
          formatDate(purchase.invoiceDate),
          purchase.invoiceNumber || '-',
          purchase.materialId,
          purchase.quantity,
          formatCurrency(purchase.unitPrice),
          formatCurrency(purchase.totalAmount),
          purchase.paymentType,
          formatCurrency(purchase.paidAmount || '0'),
          formatCurrency(purchase.remainingAmount || '0')
        ]);
      });

      // المجموع
      worksheet.addRow([]);
      worksheet.addRow(['المجموع', '', '', '', '', formatCurrency(totals.totalAmount), '', formatCurrency(totals.paidAmount), formatCurrency(totals.remainingAmount)]);

      // حفظ الملف
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileName = `كشف-حساب-${selectedSupplier.name}-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
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

            <div className="space-y-2">
              <Label>المشروع</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المشاريع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع المشاريع</SelectItem>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label>نوع الدفع</Label>
              <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="نوع الدفع" />
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
                    <Label className="font-semibold">المشروع:</Label>
                    <span>{selectedProject?.name || "جميع المشاريع"}</span>
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
                <p className="text-2xl font-bold">{formatCurrency(totals.totalAmount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-gray-600">المدفوع</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.paidAmount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-gray-600">المتبقي</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.remainingAmount)}</p>
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">التاريخ</TableHead>
                        <TableHead className="text-center">رقم الفاتورة</TableHead>
                        <TableHead className="text-center">المادة</TableHead>
                        <TableHead className="text-center">الكمية</TableHead>
                        <TableHead className="text-center">سعر الوحدة</TableHead>
                        <TableHead className="text-center">المبلغ الإجمالي</TableHead>
                        <TableHead className="text-center">نوع الدفع</TableHead>
                        <TableHead className="text-center">المدفوع</TableHead>
                        <TableHead className="text-center">المتبقي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell className="text-center">{formatDate(purchase.invoiceDate)}</TableCell>
                          <TableCell className="text-center">{purchase.invoiceNumber || "-"}</TableCell>
                          <TableCell className="text-center">{purchase.materialId}</TableCell>
                          <TableCell className="text-center">{purchase.quantity}</TableCell>
                          <TableCell className="text-center">{formatCurrency(purchase.unitPrice)}</TableCell>
                          <TableCell className="text-center font-medium">
                            {formatCurrency(purchase.totalAmount)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={getPaymentTypeVariant(purchase.paymentType)}>
                              {purchase.paymentType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-green-600">
                            {formatCurrency(purchase.paidAmount || "0")}
                          </TableCell>
                          <TableCell className="text-center text-red-600">
                            {formatCurrency(purchase.remainingAmount || "0")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <Separator className="my-4" />

                  {/* Totals Row */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Table>
                      <TableBody>
                        <TableRow className="font-bold text-lg">
                          <TableCell className="text-center">المجموع الإجمالي</TableCell>
                          <TableCell className="text-center">-</TableCell>
                          <TableCell className="text-center">-</TableCell>
                          <TableCell className="text-center">-</TableCell>
                          <TableCell className="text-center">-</TableCell>
                          <TableCell className="text-center">{formatCurrency(totals.totalAmount)}</TableCell>
                          <TableCell className="text-center">-</TableCell>
                          <TableCell className="text-center text-green-600">{formatCurrency(totals.paidAmount)}</TableCell>
                          <TableCell className="text-center text-red-600">{formatCurrency(totals.remainingAmount)}</TableCell>
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
      <style jsx>{`
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
      `}</style>
    </div>
  );
}