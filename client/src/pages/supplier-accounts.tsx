import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Building2, 
  Filter, 
  FileText, 
  Download, 
  Search, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users,
  Package,
  CreditCard,
  AlertCircle,
  Calendar,
  Phone,
  MapPin,
  Eye,
  RefreshCw,
  ShoppingCart,
  Receipt,
  Wallet
} from "lucide-react";
import { StatsCard, StatsGrid } from "@/components/ui/stats-card";
import { useFloatingButton } from "@/components/layout/floating-button-context";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Supplier, MaterialPurchase, Project } from "@shared/schema";

interface SupplierAccountSummary {
  totalPurchases: number;
  totalPaid: number;
  totalRemaining: number;
  purchaseCount: number;
}

export default function SupplierAccountsPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { setFloatingAction } = useFloatingButton();

  // إزالة الزر العائم
  useEffect(() => {
    setFloatingAction(null);
    return () => setFloatingAction(null);
  }, [setFloatingAction]);

  // جلب قائمة المشاريع
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // جلب قائمة الموردين
  const { data: suppliers = [], isLoading: isLoadingSuppliers, error: suppliersError } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });

  // جلب نطاق التواريخ المتاحة في قاعدة البيانات
  const { data: dateRange } = useQuery<{ minDate: string; maxDate: string }>({
    queryKey: ["/api/material-purchases/date-range"],
    staleTime: 300000, // 5 minutes
  });

  // فلترة الموردين حسب البحث
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // جلب بيانات المشتريات للمورد المحدد
  const { data: purchases = [], isLoading: isLoadingPurchases } = useQuery<MaterialPurchase[]>({
    queryKey: ["/api/material-purchases", selectedProjectId, selectedSupplierId, dateFrom, dateTo, paymentTypeFilter],
    queryFn: async () => {
      if (!selectedSupplierId) return [];
      
      const params = new URLSearchParams();
      params.append('supplierId', selectedSupplierId);
      if (selectedProjectId && selectedProjectId !== 'all') params.append('projectId', selectedProjectId);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (paymentTypeFilter && paymentTypeFilter !== 'all') params.append('purchaseType', paymentTypeFilter);
      
      console.log('🔍 طلب مشتريات المورد:', { selectedSupplierId, selectedProjectId, dateFrom, dateTo, paymentTypeFilter });
      
      const response = await fetch(`/api/material-purchases?${params.toString()}`);
      if (!response.ok) {
        console.error('خطأ في جلب المشتريات:', response.status, response.statusText);
        return [];
      }
      const allPurchases = await response.json();
      
      console.log('📊 تم جلب المشتريات:', allPurchases.length);
      
      // إضافة الحقول المفقودة للتوافق مع النوع MaterialPurchase
      return allPurchases.map((purchase: any) => ({
        ...purchase,
        paidAmount: purchase.paidAmount || "0",
        remainingAmount: purchase.remainingAmount || "0"
      }));
    },
    enabled: !!selectedSupplierId,
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  });

  // إزالة الطلب للإحصائيات المركبة والاعتماد على الحسابات المحلية

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // حساب الإجماليات
  const totals = purchases.reduce((acc, purchase) => {
    acc.totalAmount += parseFloat(purchase.totalAmount);
    acc.paidAmount += parseFloat(purchase.paidAmount || "0");
    acc.remainingAmount += parseFloat(purchase.remainingAmount || "0");
    return acc;
  }, { totalAmount: 0, paidAmount: 0, remainingAmount: 0 });

  // حساب الإحصائيات العامة
  const overallStats = {
    totalSuppliers: suppliers.length,
    totalDebt: suppliers.reduce((sum, supplier) => sum + parseFloat(supplier.totalDebt), 0),
    activeSuppliers: suppliers.filter(s => parseFloat(s.totalDebt) > 0).length,
    totalPurchases: purchases.length
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('ar-YE') + " ريال";
  };

  const getPaymentStatusBadge = (purchaseType: string, remainingAmount: string) => {
    const remaining = parseFloat(remainingAmount || "0");
    if (remaining === 0) {
      return <Badge variant="default" className="bg-green-100 text-green-800 text-xs">مسدد</Badge>;
    }
    if (purchaseType === "نقد") {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">نقد</Badge>;
    }
    return <Badge variant="destructive" className="text-xs">مؤجل</Badge>;
  };

  const exportToExcel = () => {
    if (!selectedSupplier || purchases.length === 0) return;

    const data = [
      ["تقرير حسابات الموردين - شركة الفتحي للمقاولات والاستشارات الهندسية"],
      [""],
      ["معلومات المورد"],
      ["اسم المورد:", selectedSupplier.name],
      ["الشخص المسؤول:", selectedSupplier.contactPerson || "-"],
      ["رقم الهاتف:", selectedSupplier.phone || "-"],
      ["العنوان:", selectedSupplier.address || "-"],
      [""],
      selectedProject ? ["المشروع:", selectedProject.name] : [],
      dateFrom || dateTo ? ["الفترة:", `من ${dateFrom || 'البداية'} إلى ${dateTo || 'النهاية'}`] : [],
      [""],
      ["تفاصيل المشتريات"],
      ["التاريخ", "رقم الفاتورة", "المادة", "الكمية", "سعر الوحدة", "المبلغ الإجمالي", "نوع الدفع", "المدفوع", "المتبقي", "الحالة"],
      ...purchases.map(purchase => [
        formatDate(purchase.invoiceDate),
        purchase.invoiceNumber || "-",
        purchase.materialId,
        purchase.quantity,
        formatCurrency(purchase.unitPrice),
        formatCurrency(purchase.totalAmount),
        purchase.purchaseType,
        formatCurrency(purchase.paidAmount || "0"),
        formatCurrency(purchase.remainingAmount || "0"),
        parseFloat(purchase.remainingAmount || "0") === 0 ? "مسدد" : "مؤجل"
      ]),
      [""],
      ["ملخص الحساب"],
      ["إجمالي المشتريات:", formatCurrency(totals.totalAmount)],
      ["إجمالي المدفوع:", formatCurrency(totals.paidAmount)],
      ["إجمالي المتبقي:", formatCurrency(totals.remainingAmount)],
      ["عدد الفواتير:", purchases.length.toString()]
    ];

    const csvContent = data.map(row => row.join(",")).join("\n");
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `حساب-المورد-${selectedSupplier.name}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const resetFilters = () => {
    setSelectedProjectId("all");
    setSelectedSupplierId("");
    setDateFrom("");
    setDateTo("");
    setPaymentTypeFilter("all");
    setSearchTerm("");
  };

  // تحديد التواريخ تلقائياً عند اختيار مورد
  useEffect(() => {
    if (selectedSupplierId && dateRange) {
      setDateFrom(dateRange.minDate);
      setDateTo(dateRange.maxDate);
    }
  }, [selectedSupplierId, dateRange]);

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">

      {/* الإحصائيات العامة */}
      <StatsGrid>
        <StatsCard
          title="إجمالي الموردين"
          value={overallStats.totalSuppliers.toString()}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="الموردين النشطين"
          value={overallStats.activeSuppliers.toString()}
          icon={Building2}
          color="green"
        />
        <StatsCard
          title="إجمالي المديونية"
          value={formatCurrency(overallStats.totalDebt)}
          icon={CreditCard}
          color="red"
        />
        <StatsCard
          title="إجمالي المشتريات"
          value={overallStats.totalPurchases.toString()}
          icon={Package}
          color="orange"
        />
      </StatsGrid>

      {/* فلاتر البحث */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              فلاتر البحث والتصفية
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetFilters}
              className="text-xs"
            >
              <RefreshCw className="w-4 h-4 ml-1" />
              إعادة تعيين
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* البحث في الموردين */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">البحث في الموردين</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="ابحث باسم المورد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {/* اختيار المورد */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">المورد</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingSuppliers ? "جاري التحميل..." : "اختر المورد"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingSuppliers ? (
                    <SelectItem value="loading" disabled>جاري تحميل الموردين...</SelectItem>
                  ) : filteredSuppliers.length === 0 ? (
                    <SelectItem value="empty" disabled>لا توجد موردين متاحين</SelectItem>
                  ) : (
                    filteredSuppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                        {parseFloat(supplier.totalDebt) > 0 && ` - ${formatCurrency(supplier.totalDebt)}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* اختيار المشروع */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">المشروع (اختياري)</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المشاريع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المشاريع</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* نوع الدفع */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">نوع الدفع</Label>
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

            {/* تاريخ البداية */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">من تاريخ</Label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {/* تاريخ النهاية */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">إلى تاريخ</Label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {/* زر التصدير */}
            <div className="space-y-2">
              <Label className="text-sm font-medium invisible">إجراءات</Label>
              <Button
                onClick={exportToExcel}
                disabled={!selectedSupplierId || purchases.length === 0}
                className="w-full"
              >
                <Download className="w-4 h-4 ml-2" />
                تصدير التقرير
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* معلومات المورد المحدد */}
      {selectedSupplier && (
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              معلومات المورد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="w-4 h-4" />
                  اسم المورد
                </div>
                <p className="font-semibold text-lg">{selectedSupplier.name}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  الشخص المسؤول
                </div>
                <p className="font-medium">{selectedSupplier.contactPerson || "غير محدد"}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  رقم الهاتف
                </div>
                <p className="font-medium">{selectedSupplier.phone || "غير محدد"}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Wallet className="w-4 h-4" />
                  إجمالي المديونية
                </div>
                <p className="font-bold text-red-600 text-lg">
                  {formatCurrency(selectedSupplier.totalDebt)}
                </p>
              </div>
            </div>

            {selectedSupplier.address && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <MapPin className="w-4 h-4" />
                  العنوان
                </div>
                <p className="text-gray-800">{selectedSupplier.address}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* إحصائيات الحساب المحدد */}
      {selectedSupplierId && (
        <StatsGrid>
          <StatsCard
            title="إجمالي المشتريات"
            value={formatCurrency(totals.totalAmount)}
            icon={ShoppingCart}
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
          <StatsCard
            title="عدد الفواتير"
            value={purchases.length.toString()}
            icon={Receipt}
            color="orange"
          />
        </StatsGrid>
      )}

      {/* تفاصيل المشتريات */}
      {selectedSupplierId && (
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              تفاصيل المشتريات
              {selectedProject && (
                <Badge variant="outline" className="mr-2">
                  {selectedProject.name}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPurchases ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">جاري تحميل البيانات...</p>
              </div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">لا توجد مشتريات للمورد المحدد</p>
                <p className="text-gray-400">جرب تغيير فلاتر البحث أو التواريخ</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* عرض البطاقات المضغوطة */}
                <div className="grid gap-3">
                  {purchases.map((purchase, index) => (
                    <div 
                      key={purchase.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* الصف الأول: التاريخ ورقم الفاتورة والحالة */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatDate(purchase.invoiceDate)}
                            </span>
                          </div>
                          {purchase.invoiceNumber && (
                            <div className="flex items-center gap-2 mt-1">
                              <Receipt className="w-4 h-4 text-gray-500" />
                              <span className="text-xs text-gray-600">
                                فاتورة: {purchase.invoiceNumber}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getPaymentStatusBadge(purchase.purchaseType, purchase.remainingAmount || "0")}
                          <Badge 
                            variant={purchase.purchaseType === "نقد" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {purchase.purchaseType}
                          </Badge>
                        </div>
                      </div>

                      {/* الصف الثاني: معلومات المادة */}
                      <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-md">
                        <Package className="w-4 h-4 text-blue-500" />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">
                            {(purchase as any).material?.name || purchase.materialId}
                          </span>
                          <div className="text-xs text-gray-600 mt-1">
                            الكمية: {purchase.quantity} | سعر الوحدة: {formatCurrency(purchase.unitPrice)}
                          </div>
                        </div>
                      </div>

                      {/* الصف الثالث: المبالغ المالية */}
                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">المبلغ الإجمالي</div>
                          <div className="text-sm font-bold text-blue-600">
                            {formatCurrency(purchase.totalAmount)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">المدفوع</div>
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(purchase.paidAmount || "0")}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">المتبقي</div>
                          <div className="text-sm font-bold text-red-600">
                            {formatCurrency(purchase.remainingAmount || "0")}
                          </div>
                        </div>
                      </div>

                      {/* ملاحظات إضافية إذا وجدت */}
                      {purchase.notes && (
                        <div className="mt-3 pt-2 border-t border-gray-100">
                          <div className="text-xs text-gray-500 mb-1">ملاحظات:</div>
                          <div className="text-xs text-gray-700 bg-yellow-50 p-2 rounded">
                            {purchase.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* ملخص الإجماليات - محسن للهواتف */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 mt-4">
                  <h3 className="text-base font-bold text-blue-900 mb-3 text-center flex items-center justify-center gap-2">
                    <Wallet className="w-5 h-5" />
                    ملخص الحساب
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                      <p className="text-xs text-gray-600">إجمالي المشتريات</p>
                      <p className="text-base font-bold text-blue-600">{formatCurrency(totals.totalAmount)}</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                      <p className="text-xs text-gray-600">عدد الفواتير</p>
                      <p className="text-base font-bold text-gray-800">{purchases.length}</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                      <p className="text-xs text-gray-600">إجمالي المدفوع</p>
                      <p className="text-base font-bold text-green-600">{formatCurrency(totals.paidAmount)}</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                      <p className="text-xs text-gray-600">إجمالي المتبقي</p>
                      <p className="text-base font-bold text-red-600">{formatCurrency(totals.remainingAmount)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* حالة فارغة عندما لا يوجد مورد محدد */}
      {!selectedSupplierId && (
        <Card className="shadow-sm">
          <CardContent className="text-center py-12">
            <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">اختر مورداً لعرض حسابه</h3>
            <p className="text-gray-500 mb-6">
              استخدم فلاتر البحث أعلاه لاختيار مورد وعرض تفاصيل حسابه ومشترياته
            </p>
            {isLoadingSuppliers ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500">جاري تحميل الموردين...</p>
              </div>
            ) : suppliers.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  لا يوجد موردين مسجلين في النظام. يرجى إضافة الموردين أولاً من صفحة إدارة الموردين.
                </AlertDescription>
              </Alert>
            ) : suppliersError ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  حدث خطأ في تحميل بيانات الموردين. يرجى تحديث الصفحة أو المحاولة مرة أخرى.
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}