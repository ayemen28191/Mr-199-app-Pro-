import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Filter, FileText, Calendar, Calculator, Download, Search } from "lucide-react";
import { useFloatingButton } from "@/components/layout/floating-button-context";
import { useEffect } from "react";
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
import type { Supplier, MaterialPurchase } from "@shared/schema";

export default function SupplierAccountsPage() {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("all");
  const { setFloatingAction } = useFloatingButton();

  // Get suppliers list
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  // Get supplier account statement
  const { data: accountStatement, isLoading: isLoadingStatement } = useQuery({
    queryKey: ["/api/suppliers", selectedSupplierId, "account", { dateFrom, dateTo, paymentType: paymentTypeFilter }],
    enabled: !!selectedSupplierId,
  });

  // Get purchases for the selected supplier
  const { data: purchases = [], isLoading: isLoadingPurchases } = useQuery<MaterialPurchase[]>({
    queryKey: ["/api/suppliers", selectedSupplierId, "purchases", { dateFrom, dateTo, paymentType: paymentTypeFilter }],
    enabled: !!selectedSupplierId,
  });

  // تعيين إجراء الزر العائم للتصدير
  useEffect(() => {
    const handleExportData = () => {
      if (selectedSupplierId && purchases.length > 0) {
        exportToExcel();
      }
    };
    
    setFloatingAction(handleExportData, "تصدير البيانات");
    return () => setFloatingAction(null);
  }, [setFloatingAction, selectedSupplierId, purchases]);

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

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
    return paymentType === "نقد" ? "default" : "secondary";
  };

  const exportToExcel = () => {
    if (!selectedSupplier || purchases.length === 0) return;

    const data = [
      ["كشف حساب المورد", "", "", "", ""],
      ["اسم المورد:", selectedSupplier.name, "", "", ""],
      ["رقم الهاتف:", selectedSupplier.phone || "-", "", "", ""],
      ["العنوان:", selectedSupplier.address || "-", "", "", ""],
      ["", "", "", "", ""],
      ["التاريخ", "رقم الفاتورة", "المادة", "الكمية", "المبلغ الإجمالي", "نوع الدفع", "المدفوع", "المتبقي"],
      ...purchases.map(purchase => [
        formatDate(purchase.invoiceDate),
        purchase.invoiceNumber || "-",
        purchase.materialId, // يجب ربطه بجدول المواد لإظهار الاسم
        purchase.quantity,
        formatCurrency(purchase.totalAmount),
        purchase.paymentType,
        formatCurrency(purchase.paidAmount || "0"),
        formatCurrency(purchase.remainingAmount || "0")
      ]),
      ["", "", "", "", "", "", "", ""],
      ["المجموع", "", "", "", formatCurrency(totals.totalAmount), "", formatCurrency(totals.paidAmount), formatCurrency(totals.remainingAmount)]
    ];

    // تحويل البيانات إلى CSV للتحميل
    const csvContent = data.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `كشف-حساب-${selectedSupplier.name}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            فلاتر البحث
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>المورد</Label>
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

            <div className="space-y-2">
              <Label className="invisible">إجراءات</Label>
              <div className="flex gap-2">
                <Button
                  onClick={exportToExcel}
                  disabled={!selectedSupplierId || purchases.length === 0}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 ml-2" />
                  تصدير
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Info */}
      {selectedSupplier && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              معلومات المورد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm text-gray-600">اسم المورد</Label>
                <p className="font-medium">{selectedSupplier.name}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">الشخص المسؤول</Label>
                <p className="font-medium">{selectedSupplier.contactPerson || "-"}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">رقم الهاتف</Label>
                <p className="font-medium">{selectedSupplier.phone || "-"}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">إجمالي المديونية</Label>
                <p className="font-medium text-red-600">
                  {formatCurrency(selectedSupplier.totalDebt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {selectedSupplierId && purchases.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي المشتريات</p>
                  <p className="text-2xl font-bold">{formatCurrency(totals.totalAmount)}</p>
                </div>
                <Calculator className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">المدفوع</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.paidAmount)}</p>
                </div>
                <Calculator className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">المتبقي</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.remainingAmount)}</p>
                </div>
                <Calculator className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Purchases Table */}
      {selectedSupplierId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              تفاصيل المشتريات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPurchases ? (
              <div className="text-center py-8">جاري تحميل البيانات...</div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد مشتريات للمورد المحدد</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>المادة</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>سعر الوحدة</TableHead>
                      <TableHead>المبلغ الإجمالي</TableHead>
                      <TableHead>نوع الدفع</TableHead>
                      <TableHead>المدفوع</TableHead>
                      <TableHead>المتبقي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>{formatDate(purchase.invoiceDate)}</TableCell>
                        <TableCell>{purchase.invoiceNumber || "-"}</TableCell>
                        <TableCell>{purchase.materialId}</TableCell>
                        <TableCell>{purchase.quantity}</TableCell>
                        <TableCell>{formatCurrency(purchase.unitPrice)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(purchase.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPaymentTypeVariant(purchase.paymentType)}>
                            {purchase.paymentType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-green-600">
                          {formatCurrency(purchase.paidAmount || "0")}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {formatCurrency(purchase.remainingAmount || "0")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Separator className="my-4" />
                
                {/* Totals Row */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-9 gap-4 text-sm font-medium">
                    <div className="col-span-5 text-left">المجموع الإجمالي:</div>
                    <div className="text-left">{formatCurrency(totals.totalAmount)}</div>
                    <div></div>
                    <div className="text-green-600">{formatCurrency(totals.paidAmount)}</div>
                    <div className="text-red-600">{formatCurrency(totals.remainingAmount)}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!selectedSupplierId && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">اختر مورداً لعرض كشف الحساب</h3>
            <p className="text-gray-500">
              اختر مورداً من القائمة أعلاه لعرض تفاصيل حسابه ومشترياته
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}