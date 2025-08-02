import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowRight, 
  Receipt, 
  Package, 
  FileText, 
  Eye, 
  Download, 
  Printer, 
  Filter,
  Calendar,
  Building2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Menu,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSelectedProject } from "@/hooks/use-selected-project";
import ProjectSelector from "@/components/project-selector";
import { getCurrentDate, formatCurrency, formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Worker, Project } from "@shared/schema";

export default function MobileReports() {
  const [, setLocation] = useLocation();
  const { selectedProjectId, selectProject } = useSelectedProject();
  const { toast } = useToast();
  
  // Mobile UI states
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  
  // Report form states
  const [dailyReportDate, setDailyReportDate] = useState(getCurrentDate());
  const [materialReportDate1, setMaterialReportDate1] = useState("");
  const [materialReportDate2, setMaterialReportDate2] = useState("");
  
  // Report display states
  const [activeReportType, setActiveReportType] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch projects data
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Generate Reports Functions
  const generateDailyExpensesReport = async () => {
    if (!selectedProjectId || !dailyReportDate) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار مشروع وتاريخ",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest("GET", `/api/reports/daily-expenses/${selectedProjectId}/${dailyReportDate}`);
      setReportData(data);
      setActiveReportType("daily");
      
      toast({
        title: "تم إنشاء التقرير",
        description: "تم إنشاء كشف المصروفات اليومية بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء التقرير",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMaterialPurchasesReport = async () => {
    if (!selectedProjectId || !materialReportDate1 || !materialReportDate2) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار مشروع والتواريخ",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest("GET", `/api/reports/material-purchases/${selectedProjectId}?dateFrom=${materialReportDate1}&dateTo=${materialReportDate2}`);
      setReportData(data);
      setActiveReportType("materials");

      toast({
        title: "تم إنشاء التقرير",
        description: "تم إنشاء كشف المواد المشتراة بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء التقرير",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    window.print();
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  // Mobile Optimized Report Components
  const MobileDailyExpensesReport = ({ data }: { data: any }) => (
    <div className="space-y-4 pb-20">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-blue-900 mb-2">
              كشف مصروفات يوم {formatDate(data.date)}
            </h3>
            <div className="text-sm text-blue-700">
              {data.project?.name || selectedProject?.name}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mobile-slide-in">
        <Card className="mobile-card mobile-card-gradient-green">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-green-600 mb-1">إجمالي الإيرادات</div>
                <div className="text-lg mobile-amount-display text-green-800">
                  {formatCurrency((data.summary?.carriedForward || 0) + 
                    (data.fundTransfers?.reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0) || 0))}
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="mobile-card mobile-card-gradient-red">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-red-600 mb-1">إجمالي المصروفات</div>
                <div className="text-lg mobile-amount-display text-red-800">
                  {formatCurrency(data.summary?.totalExpenses || 0)}
                </div>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Net Balance */}
      <Card className="mobile-card mobile-card-gradient-purple mobile-slide-in">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-purple-600 mb-1">المبلغ المتبقي</div>
              <div className="text-2xl mobile-amount-display text-purple-800">
                {formatCurrency(data.summary?.netBalance || 0)}
              </div>
            </div>
            <DollarSign className="h-10 w-10 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <div className="space-y-3">
        {/* Fund Transfers */}
        {data.fundTransfers?.map((transfer: any, index: number) => (
          <Card key={`transfer-${index}`} className="mobile-card mobile-card-gradient-green mobile-slide-in">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="mobile-badge bg-green-100 text-green-700 border-green-300">
                      حوالة مالية
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">
                    حوالة من المهندس محمد عبر الامتياز
                  </div>
                  <div className="text-xs text-muted-foreground">
                    رقم الحوالة: {transfer.transferNumber || 'غير محدد'}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-lg mobile-amount-display text-green-600">
                    {formatCurrency(transfer.amount)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(transfer.transferDate)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Worker Attendance */}
        {data.workerAttendance?.map((attendance: any, index: number) => (
          <Card key={`attendance-${index}`} className="border-orange-200">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      أجور عمال
                    </Badge>
                  </div>
                  <div className="text-sm font-medium mb-1">
                    {attendance.worker?.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    العمل من الساعة 4:00 صباحاً حتى 7:00 مساءً
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold text-orange-600">
                    -{formatCurrency(attendance.paidAmount)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(attendance.date)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Transportation Expenses */}
        {data.transportationExpenses?.map((expense: any, index: number) => (
          <Card key={`transport-${index}`} className="border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      نثريات
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {expense.description}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold text-blue-600">
                    -{formatCurrency(expense.amount)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(expense.date)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Material Purchases */}
        {data.materialPurchases?.map((purchase: any, index: number) => (
          <Card key={`material-${index}`} className="border-purple-200">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      مواد
                    </Badge>
                  </div>
                  <div className="text-sm font-medium mb-1">
                    {purchase.material?.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    الكمية: {purchase.quantity} {purchase.material?.unit}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold text-purple-600">
                    -{formatCurrency(purchase.totalAmount)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(purchase.purchaseDate)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const MobileMaterialPurchasesReport = ({ data }: { data: any }) => (
    <div className="space-y-4 pb-20">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
        <CardContent className="p-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-orange-900 mb-2">
              كشف المواد المشتراة
            </h3>
            <div className="text-sm text-orange-700">
              من {formatDate(data.dateFrom)} إلى {formatDate(data.dateTo)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-green-600 mb-1">إجمالي المشتريات</div>
              <div className="text-2xl font-bold text-green-800">
                {formatCurrency(data.purchases?.reduce((sum: number, p: any) => sum + parseFloat(p.totalAmount), 0) || 0)}
              </div>
            </div>
            <Package className="h-10 w-10 text-green-600" />
          </div>
        </CardContent>
      </Card>

      {/* Purchases List */}
      <div className="space-y-3">
        {data.purchases?.map((purchase: any, idx: number) => (
          <Card key={idx} className="border-orange-200">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-orange-900 mb-2">
                    {purchase.material?.name}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">الكمية:</span>
                      <span className="font-medium">{purchase.quantity} {purchase.material?.unit}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">المورد:</span>
                      <span className="font-medium">{purchase.supplierName}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">التاريخ:</span>
                      <span className="font-medium">{formatDate(purchase.purchaseDate)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left ml-3">
                  <div className="text-lg font-bold text-orange-600">
                    {formatCurrency(purchase.totalAmount)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mobile-reports-container mobile-smooth-scroll">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 mobile-sticky-header">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="mobile-touch-target mobile-focus-visible"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          
          <h1 className="text-lg font-bold text-center flex-1 mobile-fade-in">
            مركز التقارير التنفيذية
          </h1>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="mobile-touch-target mobile-focus-visible"
          >
            {isFiltersOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Project Selector - Always Visible */}
        <div className="px-4 pb-4">
          <ProjectSelector
            selectedProjectId={selectedProjectId}
            onProjectChange={selectProject}
          />
        </div>
      </div>

      {/* Filters Panel */}
      {isFiltersOpen && (
        <div className="bg-white border-b shadow-sm">
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              أدوات التصفية والتحكم
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setLocation("/advanced-reports")}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                تقارير متقدمة
              </Button>
              <Button
                onClick={() => setLocation("/excel-style-daily-expenses")}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Receipt className="h-4 w-4" />
                نمط Excel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Quick Stats Card */}
        {selectedProject && (
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8" />
                <div>
                  <div className="font-bold text-lg">{selectedProject.name}</div>
                  <div className="text-blue-100 text-sm">المشروع المحدد حالياً</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Types */}
        <div className="space-y-3">
          {/* Daily Expenses Report */}
          <Card className="overflow-hidden">
            <CardHeader 
              className="pb-3 cursor-pointer"
              onClick={() => setExpandedCard(expandedCard === 'daily' ? null : 'daily')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Receipt className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">كشف المصروفات اليومية</CardTitle>
                    <p className="text-sm text-muted-foreground">تقرير تفصيلي للمصروفات في يوم محدد</p>
                  </div>
                </div>
                {expandedCard === 'daily' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
            
            {expandedCard === 'daily' && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">التاريخ</label>
                    <div className="relative">
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={dailyReportDate}
                        onChange={(e) => setDailyReportDate(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={generateDailyExpensesReport}
                    disabled={loading || !selectedProjectId}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? "جاري الإنشاء..." : "إنشاء التقرير"}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Material Purchases Report */}
          <Card className="overflow-hidden">
            <CardHeader 
              className="pb-3 cursor-pointer"
              onClick={() => setExpandedCard(expandedCard === 'materials' ? null : 'materials')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Package className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">كشف المواد المشتراة</CardTitle>
                    <p className="text-sm text-muted-foreground">تقرير بالمواد المشتراة خلال فترة</p>
                  </div>
                </div>
                {expandedCard === 'materials' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
            
            {expandedCard === 'materials' && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">من تاريخ</label>
                      <Input
                        type="date"
                        value={materialReportDate1}
                        onChange={(e) => setMaterialReportDate1(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">إلى تاريخ</label>
                      <Input
                        type="date"
                        value={materialReportDate2}
                        onChange={(e) => setMaterialReportDate2(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={generateMaterialPurchasesReport}
                    disabled={loading || !selectedProjectId}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {loading ? "جاري الإنشاء..." : "إنشاء التقرير"}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Generated Report Display */}
        {activeReportType && reportData && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="h-5 w-5 text-primary" />
                  {activeReportType === 'daily' && 'كشف المصروفات اليومية'}
                  {activeReportType === 'materials' && 'كشف المواد المشتراة'}
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={printReport}
                    className="flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    طباعة
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      let exportData: any[] = [];
                      let filename = '';
                      
                      if (activeReportType === 'daily') {
                        exportData = [
                          ...reportData.fundTransfers?.map((t: any) => ({
                            نوع: 'حوالة مالية',
                            المرسل: t.senderName,
                            المبلغ: t.amount,
                            التاريخ: t.transferDate
                          })) || [],
                          ...reportData.workerAttendance?.map((a: any) => ({
                            نوع: 'حضور عامل',
                            العامل: a.worker?.name,
                            المبلغ: a.paidAmount,
                            التاريخ: a.date
                          })) || []
                        ];
                        filename = `daily-expenses-${dailyReportDate}`;
                      } else if (activeReportType === 'materials') {
                        exportData = reportData.purchases?.map((p: any) => ({
                          المادة: p.material?.name,
                          الكمية: p.quantity,
                          الوحدة: p.material?.unit,
                          المورد: p.supplierName,
                          المبلغ: p.totalAmount,
                          التاريخ: p.purchaseDate
                        })) || [];
                        filename = `material-purchases-${materialReportDate1}-${materialReportDate2}`;
                      }
                      
                      exportToCSV(exportData, filename);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    تصدير CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {activeReportType === 'daily' && <MobileDailyExpensesReport data={reportData} />}
              {activeReportType === 'materials' && <MobileMaterialPurchasesReport data={reportData} />}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            body, html {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
            
            .no-print {
              display: none !important;
            }
            
            .print-container {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 10mm !important;
              box-shadow: none !important;
              border: none !important;
              background: white !important;
            }
          }
        `}
      </style>
    </div>
  );
}