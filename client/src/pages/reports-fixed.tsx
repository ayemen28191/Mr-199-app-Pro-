import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Receipt, UserCheck, Package, PieChart, Eye, Download, Share2, FileSpreadsheet, Printer, BarChart, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useSelectedProject } from "@/hooks/use-selected-project";
import ProjectSelector from "@/components/project-selector";
import { getCurrentDate, formatCurrency, formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Worker, Project } from "@shared/schema";

export default function ReportsFixed() {
  const [, setLocation] = useLocation();
  const { selectedProjectId, selectProject } = useSelectedProject();
  const { toast } = useToast();
  
  // Report form states
  const [dailyReportDate, setDailyReportDate] = useState(getCurrentDate());
  const [workerAccountDate1, setWorkerAccountDate1] = useState("");
  const [workerAccountDate2, setWorkerAccountDate2] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [materialReportDate1, setMaterialReportDate1] = useState("");
  const [materialReportDate2, setMaterialReportDate2] = useState("");
  const [projectSummaryDate1, setProjectSummaryDate1] = useState("");
  const [projectSummaryDate2, setProjectSummaryDate2] = useState("");
  
  // Report display states
  const [activeReportType, setActiveReportType] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  // Fetch projects and workers data
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
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
    }
  };

  // CSV Export function
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

  const printReport = () => {
    window.print();
  };

  // Professional Daily Expenses Report (matching the uploaded images)
  const DailyExpensesReport = ({ data }: { data: any }) => (
    <div className="print-preview" id="report-content">
      {/* رأس التقرير */}
      <div className="report-header">
        كشف مصروفات يوم الأحد تاريخ {formatDate(data.date)}
      </div>
      
      {/* معلومات المشروع */}
      <div className="project-info">
        <div className="project-info-item">
          <span>اسم المشروع</span>
          <br />
          <strong>{data.project?.name || selectedProject?.name || 'غير محدد'}</strong>
        </div>
        <div className="project-info-item">
          <span>تاريخ بداية العمل</span>
          <br />
          <strong>{formatDate(data.date)}</strong>
        </div>
        <div className="project-info-item">
          <span>رقم الهاتف</span>
          <br />
          <strong>733366543</strong>
        </div>
      </div>

      {/* جدول المصروفات التفصيلي */}
      <table className="report-table">
        <thead>
          <tr>
            <th>ملاحظات</th>
            <th>الأجمالي المبلغ المتبقي</th>
            <th>نوع</th>
            <th>نوع الحساب</th>
            <th>المبلغ</th>
          </tr>
        </thead>
        <tbody>
          {/* رصيد مرحل */}
          <tr>
            <td>مرحلة من تاريخ السابق</td>
            <td className="currency large-number">{formatCurrency(data.summary?.carriedForward || 0)}</td>
            <td>ترحيل</td>
            <td>مرحلة</td>
            <td className="currency large-number success-cell">{formatCurrency(data.summary?.carriedForward || 0)}</td>
          </tr>

          {/* الحوالات المالية */}
          {data.fundTransfers?.map((transfer: any, index: number) => {
            const previousAmount = (data.summary?.carriedForward || 0) + 
              data.fundTransfers.slice(0, index).reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
            const currentTotal = previousAmount + parseFloat(transfer.amount);
            
            return (
              <tr key={`transfer-${index}`}>
                <td>حوالة من المهندس محمد عبر الامتياز رقم الحولة {transfer.transferNumber || 'غير محدد'}</td>
                <td className="success-cell">{formatCurrency(currentTotal)}</td>
                <td>توريد</td>
                <td>حوالة</td>
                <td className="success-cell">{formatCurrency(transfer.amount)}</td>
              </tr>
            );
          })}

          {/* حضور العمال */}
          {data.workerAttendance?.map((attendance: any, index: number) => {
            const allIncome = (data.summary?.carriedForward || 0) + 
              (data.fundTransfers?.reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0) || 0);
            const previousExpenses = data.workerAttendance.slice(0, index).reduce((sum: number, a: any) => sum + parseFloat(a.paidAmount), 0);
            const currentTotal = allIncome - previousExpenses - parseFloat(attendance.paidAmount);
            
            return (
              <tr key={`attendance-${index}`}>
                <td>العمل من الساعة 4:00 الى عصر وحتى الساعة 7:00 صباحا</td>
                <td className="warning-cell">{formatCurrency(currentTotal)}</td>
                <td>منصرف</td>
                <td>مصروف {attendance.worker?.name}</td>
                <td className="warning-cell">{formatCurrency(attendance.paidAmount)}</td>
              </tr>
            );
          })}

          {/* مصاريف النقل */}
          {data.transportationExpenses?.map((expense: any, index: number) => {
            const allIncome = (data.summary?.carriedForward || 0) + 
              (data.fundTransfers?.reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0) || 0);
            const workerExpenses = data.workerAttendance?.reduce((sum: number, a: any) => sum + parseFloat(a.paidAmount), 0) || 0;
            const previousTransportExpenses = data.transportationExpenses.slice(0, index).reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);
            const currentTotal = allIncome - workerExpenses - previousTransportExpenses - parseFloat(expense.amount);
            
            return (
              <tr key={`transport-${index}`}>
                <td>{expense.description}</td>
                <td className="warning-cell">{formatCurrency(currentTotal)}</td>
                <td>منصرف</td>
                <td>نثريات</td>
                <td className="warning-cell">{formatCurrency(expense.amount)}</td>
              </tr>
            );
          })}

          {/* المواد المشتراة */}
          {data.materialPurchases?.map((purchase: any, index: number) => {
            const allIncome = (data.summary?.carriedForward || 0) + 
              (data.fundTransfers?.reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0) || 0);
            const workerExpenses = data.workerAttendance?.reduce((sum: number, a: any) => sum + parseFloat(a.paidAmount), 0) || 0;
            const transportExpenses = data.transportationExpenses?.reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0) || 0;
            const previousMaterialExpenses = data.materialPurchases.slice(0, index).reduce((sum: number, p: any) => sum + parseFloat(p.totalAmount), 0);
            const currentTotal = allIncome - workerExpenses - transportExpenses - previousMaterialExpenses - parseFloat(purchase.totalAmount);
            
            return (
              <tr key={`material-${index}`}>
                <td>مع سلطان حق طريق بمصروف له و موسى عبدالحكيم</td>
                <td className="warning-cell">{formatCurrency(currentTotal)}</td>
                <td>منصرف</td>
                <td>مع المهندس</td>
                <td className="warning-cell">{formatCurrency(purchase.totalAmount)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* المبلغ المتبقي النهائي */}
      <div className="grand-total">
        المبلغ المتبقي
        <br />
        <span className="large-number">{formatCurrency(data.summary?.netBalance || 0)}</span>
      </div>

      {/* معلومات المشروع */}
      <div className="notes-section">
        <div className="notes-header">الملاحظات</div>
        <table style={{ width: '100%', background: 'white', border: '1px solid #bdc3c7' }}>
          <tbody>
            <tr style={{ background: '#3498db', color: 'white' }}>
              <th style={{ padding: '10px', border: '1px solid #2c3e50' }}>محل التوريد</th>
              <th style={{ padding: '10px', border: '1px solid #2c3e50' }}>اسم المشروع</th>
            </tr>
            <tr>
              <td style={{ padding: '15px', border: '1px solid #bdc3c7', textAlign: 'center' }}>
                ابراهيم نجم الدين
              </td>
              <td style={{ padding: '15px', border: '1px solid #bdc3c7', textAlign: 'center' }}>
                {data.project?.name || selectedProject?.name}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* تذييل التقرير */}
      <div className="report-footer">
        تم إنشاء هذا التقرير تلقائياً بواسطة نظام إدارة المشاريع الإنشائية
        <br />
        التاريخ: {formatDate(new Date())} | الوقت: {new Date().toLocaleTimeString('ar-EG')}
      </div>
    </div>
  );

  const MaterialPurchasesReport = ({ data }: { data: any }) => (
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded-lg">
        <h5 className="font-medium mb-2">المواد المشتراة من {formatDate(data.dateFrom)} إلى {formatDate(data.dateTo)}</h5>
        <div className="text-sm">
          <span>إجمالي المشتريات: </span>
          <span className="font-medium">{formatCurrency(data.purchases?.reduce((sum: number, p: any) => sum + parseFloat(p.totalAmount), 0) || 0)}</span>
        </div>
      </div>
      
      <div className="space-y-3">
        {data.purchases?.map((purchase: any, idx: number) => (
          <div key={idx} className="bg-white p-3 rounded border text-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{purchase.material?.name}</div>
                <div className="text-muted-foreground">{purchase.quantity} {purchase.material?.unit}</div>
                <div className="text-muted-foreground">{purchase.supplierName}</div>
              </div>
              <div className="text-left">
                <div className="font-medium">{formatCurrency(purchase.totalAmount)}</div>
                <div className="text-muted-foreground">{formatDate(purchase.purchaseDate)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-4 slide-in">
      {/* Header with Back Button */}
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="ml-3 p-2"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold text-foreground">التقارير المحسنة</h2>
      </div>

      {/* التقارير المحسنة للهواتف */}
      <Card className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-reverse space-x-4">
              <div className="bg-green-600 p-3 rounded-lg">
                <BarChart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-green-900 dark:text-green-100">واجهة التقارير المحسنة للهواتف</h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  تصميم احترافي محسن خصيصاً للهواتف المحمولة مع واجهة سهلة الاستخدام
                </p>
                <div className="flex gap-4 mt-2 text-xs text-green-600 dark:text-green-400">
                  <span>• تصميم متجاوب للهواتف</span>
                  <span>• واجهة سهلة ومبسطة</span>
                  <span>• تفاعل محسن</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setLocation("/mobile-reports")}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 flex items-center gap-2 font-medium"
              size="lg"
            >
              <BarChart className="h-4 w-4" />
              واجهة الهواتف
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* زر التقارير المتقدمة */}
      <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-reverse space-x-4">
              <div className="bg-blue-600 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-blue-900 dark:text-blue-100">التقارير المتقدمة</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  إنشاء تقارير مخصصة للمصروفات والإيرادات مع إمكانية التصدير والطباعة
                </p>
                <div className="flex gap-4 mt-2 text-xs text-blue-600 dark:text-blue-400">
                  <span>• تقارير حسب الفترة الزمنية</span>
                  <span>• تصدير Excel احترافي</span>
                  <span>• طباعة محسنة</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setLocation("/advanced-reports")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 flex items-center gap-2 font-medium"
              size="lg"
            >
              <FileText className="h-4 w-4" />
              إنشاء تقرير متقدم
            </Button>
          </div>
        </CardContent>
      </Card>

      <ProjectSelector
        selectedProjectId={selectedProjectId}
        onProjectChange={selectProject}
      />

      {/* Worker Statement Button */}
      <div className="mb-4 space-y-3">
        <Button 
          variant="outline" 
          className="w-full h-16 border-3 border-orange-500 hover:bg-orange-50 shadow-lg"
          onClick={() => setLocation("/excel-format-worker-statement")}
        >
          <FileSpreadsheet className="ml-2 h-7 w-7 text-orange-600" />
          <div className="text-right">
            <div className="text-orange-800 font-bold text-lg">كشف حساب العامل - نمط Excel</div>
            <div className="text-orange-600 text-sm">تصميم مطابق للنموذج المرفق - دعم المشاريع المتعددة</div>
          </div>
        </Button>
      </div>

      {/* Report Types */}
      <div className="space-y-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-reverse space-x-3">
                <Receipt className="h-6 w-6 text-blue-600" />
                <div>
                  <h4 className="font-medium text-foreground">كشف المصروفات اليومية</h4>
                  <p className="text-sm text-muted-foreground">تقرير تفصيلي للمصروفات في يوم محدد</p>
                </div>
              </div>
              <Button
                onClick={generateDailyExpensesReport}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm"
              >
                إنشاء
              </Button>
            </div>
            <div className="space-y-3">
              <Input
                type="date"
                value={dailyReportDate}
                onChange={(e) => setDailyReportDate(e.target.value)}
                placeholder="اختر التاريخ"
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* كشف المصروفات اليومية نمط Excel */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-reverse space-x-3">
                <FileSpreadsheet className="h-6 w-6 text-green-600" />
                <div>
                  <h4 className="font-medium text-foreground">كشف المصروفات اليومية - نمط Excel</h4>
                  <p className="text-sm text-muted-foreground">تصميم مطابق للنموذج المرفق مع إمكانيات طباعة وتصدير Excel</p>
                </div>
              </div>
              <Button
                onClick={() => setLocation("/excel-style-daily-expenses")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                فتح
              </Button>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-sm">
              <div className="font-medium text-green-800 mb-1">المميزات:</div>
              <ul className="text-green-700 space-y-1">
                <li>• تصميم مطابق تماماً للنموذج المرفق</li>
                <li>• ألوان وتنسيقات احترافية مثل Excel</li>
                <li>• حساب الرصيد المتبقي تلقائياً</li>
                <li>• تصدير إلى Excel بنفس التصميم</li>
                <li>• طباعة عالية الجودة</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-reverse space-x-3">
                <Package className="h-6 w-6 text-orange-600" />
                <div>
                  <h4 className="font-medium text-foreground">كشف المواد المشتراة</h4>
                  <p className="text-sm text-muted-foreground">تقرير بالمواد المشتراة خلال فترة</p>
                </div>
              </div>
              <Button
                onClick={generateMaterialPurchasesReport}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-sm"
              >
                إنشاء
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                value={materialReportDate1}
                onChange={(e) => setMaterialReportDate1(e.target.value)}
                placeholder="من تاريخ"
                className="text-sm"
              />
              <Input
                type="date"
                value={materialReportDate2}
                onChange={(e) => setMaterialReportDate2(e.target.value)}
                placeholder="إلى تاريخ"
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generated Report Display */}
      {activeReportType && reportData && (
        <Card className="mt-6">
          <CardHeader className="pb-3 no-print">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                {activeReportType === 'daily' && 'كشف المصروفات اليومية المحسن'}
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
                      filename = `daily-expenses-${reportData.date}`;
                    } else if (activeReportType === 'materials') {
                      exportData = reportData.purchases?.map((p: any) => ({
                        المادة: p.material?.name,
                        الكمية: p.quantity,
                        الوحدة: p.material?.unit,
                        'سعر الوحدة': p.unitPrice,
                        'المبلغ الإجمالي': p.totalAmount,
                        المورد: p.supplierName,
                        'تاريخ الشراء': p.purchaseDate
                      })) || [];
                      filename = `material-purchases-${reportData.dateFrom}-${reportData.dateTo}`;
                    }
                    
                    if (exportData.length > 0) {
                      exportToCSV(exportData, filename);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  تصدير CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setActiveReportType(null);
                    setReportData(null);
                  }}
                >
                  إغلاق
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeReportType === 'daily' && <DailyExpensesReport data={reportData} />}
            {activeReportType === 'materials' && <MaterialPurchasesReport data={reportData} />}
          </CardContent>
        </Card>
      )}
    </div>
  );
}