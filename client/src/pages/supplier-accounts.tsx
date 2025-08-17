import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Filter, FileText, Calendar, Calculator, Download, Search, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { StatsCard, StatsGrid } from "@/components/ui/stats-card";
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

  // إزالة الزر العائم من هذه الصفحة لأن التصدير متاح في الواجهة
  useEffect(() => {
    setFloatingAction(null);
    return () => setFloatingAction(null);
  }, [setFloatingAction]);

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
        purchase.purchaseType,
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
    <div className="container mx-auto p-4 space-y-4" dir="rtl">
      {/* فلاتر البحث - تصميم مضغوط */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            فلاتر البحث
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">المورد</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger className="h-8">
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

            <div className="space-y-1">
              <Label className="text-xs">من تاريخ</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-8"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">إلى تاريخ</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-8"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">نوع الدفع</Label>
              <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="نوع الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="نقد">نقد</SelectItem>
                  <SelectItem value="أجل">أجل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs invisible">إجراءات</Label>
              <Button
                onClick={exportToExcel}
                disabled={!selectedSupplierId || purchases.length === 0}
                size="sm"
                className="w-full h-8"
              >
                <Download className="w-3 h-3 ml-1" />
                تصدير
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* معلومات المورد - تصميم مضغوط */}
      {selectedSupplier && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              معلومات المورد
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <Label className="text-xs text-gray-600">اسم المورد</Label>
                <p className="font-medium text-sm">{selectedSupplier.name}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">الشخص المسؤول</Label>
                <p className="font-medium text-sm">{selectedSupplier.contactPerson || "-"}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">رقم الهاتف</Label>
                <p className="font-medium text-sm">{selectedSupplier.phone || "-"}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">إجمالي المديونية</Label>
                <p className="font-medium text-red-600 text-sm">
                  {formatCurrency(selectedSupplier.totalDebt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* إحصائيات الحساب - تصميم موحد ومضغوط */}
      {selectedSupplierId && purchases.length > 0 && (
        <StatsGrid>
          <StatsCard
            title="إجمالي المشتريات"
            value={formatCurrency(totals.totalAmount)}
            icon={DollarSign}
            color="blue"
          />
          <StatsCard
            title="المدفوع"
            value={formatCurrency(totals.paidAmount)}
            icon={TrendingUp}
            color="green"
          />
          <StatsCard
            title="المتبقي"
            value={formatCurrency(totals.remainingAmount)}
            icon={TrendingDown}
            color="red"
          />
        </StatsGrid>
      )}

      {/* جدول المشتريات - تصميم مضغوط */}
      {selectedSupplierId && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              تفاصيل المشتريات
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoadingPurchases ? (
              <div className="text-center py-6 text-sm">جاري تحميل البيانات...</div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-6">
                <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">لا توجد مشتريات للمورد المحدد</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="h-8">
                      <TableHead className="text-xs py-2">التاريخ</TableHead>
                      <TableHead className="text-xs py-2">رقم الفاتورة</TableHead>
                      <TableHead className="text-xs py-2">المادة</TableHead>
                      <TableHead className="text-xs py-2">الكمية</TableHead>
                      <TableHead className="text-xs py-2">سعر الوحدة</TableHead>
                      <TableHead className="text-xs py-2">المبلغ الإجمالي</TableHead>
                      <TableHead className="text-xs py-2">نوع الدفع</TableHead>
                      <TableHead className="text-xs py-2">المدفوع</TableHead>
                      <TableHead className="text-xs py-2">المتبقي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase.id} className="h-8">
                        <TableCell className="text-xs py-1">{formatDate(purchase.invoiceDate)}</TableCell>
                        <TableCell className="text-xs py-1">{purchase.invoiceNumber || "-"}</TableCell>
                        <TableCell className="text-xs py-1">{purchase.materialId}</TableCell>
                        <TableCell className="text-xs py-1">{purchase.quantity}</TableCell>
                        <TableCell className="text-xs py-1">{formatCurrency(purchase.unitPrice)}</TableCell>
                        <TableCell className="font-medium text-xs py-1">
                          {formatCurrency(purchase.totalAmount)}
                        </TableCell>
                        <TableCell className="py-1">
                          <Badge variant={getPaymentTypeVariant(purchase.purchaseType)} className="text-xs h-5">
                            {purchase.purchaseType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-green-600 text-xs py-1">
                          {formatCurrency(purchase.paidAmount || "0")}
                        </TableCell>
                        <TableCell className="text-red-600 text-xs py-1">
                          {formatCurrency(purchase.remainingAmount || "0")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Separator className="my-3" />
                
                {/* صف المجاميع - مضغوط */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="grid grid-cols-9 gap-2 text-xs font-medium">
                    <div className="col-span-5 text-right">المجموع الإجمالي:</div>
                    <div className="text-right">{formatCurrency(totals.totalAmount)}</div>
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

      {/* حالة فارغة - مضغوطة */}
      {!selectedSupplierId && (
        <Card>
          <CardContent className="text-center py-8">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold mb-1">اختر مورداً لعرض كشف الحساب</h3>
            <p className="text-gray-500 text-sm">
              اختر مورداً من القائمة أعلاه لعرض تفاصيل حسابه ومشترياته
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}