import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Receipt, UserCheck, Package, PieChart, Eye, Download, Share2, FileSpreadsheet, Printer } from "lucide-react";
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

export default function Reports() {
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

  const generateWorkerAccountReport = async () => {
    if (!selectedWorkerId || !workerAccountDate1 || !workerAccountDate2) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار عامل والتواريخ",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = await apiRequest("GET", `/api/workers/${selectedWorkerId}/account-statement?projectId=${selectedProjectId}&dateFrom=${workerAccountDate1}&dateTo=${workerAccountDate2}`);
      setReportData({ ...data, workerId: selectedWorkerId, dateFrom: workerAccountDate1, dateTo: workerAccountDate2 });
      setActiveReportType("worker");

      toast({
        title: "تم إنشاء التقرير",
        description: "تم إنشاء كشف حساب العامل بنجاح",
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

  const generateProjectSummaryReport = async () => {
    if (!selectedProjectId || !projectSummaryDate1 || !projectSummaryDate2) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار مشروع والتواريخ",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = await apiRequest("GET", `/api/reports/project-summary/${selectedProjectId}?dateFrom=${projectSummaryDate1}&dateTo=${projectSummaryDate2}`);
      setReportData(data);
      setActiveReportType("summary");

      toast({
        title: "تم إنشاء التقرير",
        description: "تم إنشاء ملخص المشروع بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء التقرير",
        variant: "destructive",
      });
    }
  };

  // Export Functions
  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات للتصدير",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const headers = Object.keys(data[0]);
      // إضافة BOM للتعامل مع النصوص العربية بشكل صحيح
      const csvContent = [
        '\uFEFF' + headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // تحويل القيم إلى نص وإضافة علامات التنصيص للقيم التي تحتوي على فواصل
            return typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n')) 
              ? `"${String(value).replace(/"/g, '""')}"` 
              : String(value);
          }).join(',')
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "تم التصدير",
        description: "تم تصدير التقرير بنجاح",
      });
    } catch (error) {
      console.error('خطأ في التصدير:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تصدير التقرير",
        variant: "destructive",
      });
    }
  };

  const printReport = () => {
    try {
      // تطبيق تنسيقات الطباعة
      document.body.classList.add('printing');
      
      // إخفاء عناصر الواجهة غير المطلوبة للطباعة
      const elementsToHide = document.querySelectorAll('.no-print, nav, .sidebar, .header-controls, .print\\:hidden');
      const originalStyles: { element: HTMLElement; display: string }[] = [];
      
      elementsToHide.forEach((el) => {
        const element = el as HTMLElement;
        originalStyles.push({
          element: element,
          display: element.style.display
        });
        element.style.display = 'none';
      });
      
      // تأخير قصير للتأكد من تطبيق التنسيقات
      setTimeout(() => {
        window.print();
        
        // استعادة العناصر المخفية بعد الطباعة
        setTimeout(() => {
          originalStyles.forEach(({ element, display }) => {
            element.style.display = display;
          });
          document.body.classList.remove('printing');
        }, 100);
      }, 100);
      
    } catch (error) {
      console.error('خطأ في الطباعة:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الطباعة",
        variant: "destructive",
      });
    }
  };

  const reportTypes = [
    {
      icon: Receipt,
      title: "كشف المصروفات اليومية",
      description: "عرض مصروفات يوم محدد",
      color: "bg-primary",
      hoverColor: "hover:bg-primary/90",
      textColor: "text-primary-foreground",
      form: (
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            value={dailyReportDate}
            onChange={(e) => setDailyReportDate(e.target.value)}
            className="text-sm"
          />
          <div className="text-sm p-2 bg-muted rounded border">
            {selectedProject?.name || "لم يتم اختيار مشروع"}
          </div>
        </div>
      ),
      onGenerate: generateDailyExpensesReport,
    },
    {
      icon: UserCheck,
      title: "كشف حساب عامل",
      description: "حساب عامل لفترة محددة",
      color: "bg-secondary",
      hoverColor: "hover:bg-secondary/90",
      textColor: "text-secondary-foreground",
      form: (
        <div className="space-y-2">
          <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="اختر العامل..." />
            </SelectTrigger>
            <SelectContent>
              {workers.map((worker) => (
                <SelectItem key={worker.id} value={worker.id}>
                  {worker.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              value={workerAccountDate1}
              onChange={(e) => setWorkerAccountDate1(e.target.value)}
              placeholder="من تاريخ"
              className="text-sm"
            />
            <Input
              type="date"
              value={workerAccountDate2}
              onChange={(e) => setWorkerAccountDate2(e.target.value)}
              placeholder="إلى تاريخ"
              className="text-sm"
            />
          </div>
        </div>
      ),
      onGenerate: generateWorkerAccountReport,
    },
    {
      icon: Package,
      title: "كشف المواد المشتراة",
      description: "تقرير المواد والتوريدات",
      color: "bg-success",
      hoverColor: "hover:bg-success/90",
      textColor: "text-success-foreground",
      form: (
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
      ),
      onGenerate: generateMaterialPurchasesReport,
    },
    {
      icon: PieChart,
      title: "ملخص المشروع",
      description: "تقرير شامل للمشروع",
      color: "bg-purple-600",
      hoverColor: "hover:bg-purple-700",
      textColor: "text-white",
      form: (
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            value={projectSummaryDate1}
            onChange={(e) => setProjectSummaryDate1(e.target.value)}
            placeholder="من تاريخ"
            className="text-sm"
          />
          <Input
            type="date"
            value={projectSummaryDate2}
            onChange={(e) => setProjectSummaryDate2(e.target.value)}
            placeholder="إلى تاريخ"
            className="text-sm"
          />
        </div>
      ),
      onGenerate: generateProjectSummaryReport,
    },
  ];

  // Report Display Components
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
          <strong>{data.project?.name || 'غير محدد'}</strong>
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

      {/* ملخص اليوم */}
      <div className="bg-muted p-4 rounded-lg">
        <h5 className="font-medium mb-2">ملخص يوم {formatDate(data.date)}</h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span>إجمالي الحوالات: </span>
            <span className="font-medium">{formatCurrency(data.fundTransfers?.reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0) || 0)}</span>
          </div>
          <div>
            <span>مصروفات العمال: </span>
            <span className="font-medium">{formatCurrency(data.workerAttendance?.reduce((sum: number, a: any) => sum + parseFloat(a.paidAmount), 0) || 0)}</span>
          </div>
          <div>
            <span>شراء المواد: </span>
            <span className="font-medium">{formatCurrency(data.materialPurchases?.reduce((sum: number, p: any) => sum + parseFloat(p.totalAmount), 0) || 0)}</span>
          </div>
          <div>
            <span>مصاريف النقل: </span>
            <span className="font-medium">{formatCurrency(data.transportationExpenses?.reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0) || 0)}</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
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
                  <td>حوالة من المهندس محمد عبر الامتياز رقم الحولة {transfer.transferNumber}</td>
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
            <tr style={{ background: '#3498db', color: 'white' }}>
              <th style={{ padding: '10px', border: '1px solid #2c3e50' }}>محل التوريد</th>
              <th style={{ padding: '10px', border: '1px solid #2c3e50' }}>اسم المشروع</th>
            </tr>
            <tr>
              <td style={{ padding: '15px', border: '1px solid #bdc3c7', textAlign: 'center' }}>
                ابراهيم نجم الدين
              </td>
              <td style={{ padding: '15px', border: '1px solid #bdc3c7', textAlign: 'center' }}>
                {data.project?.name}
              </td>
            </tr>
          </table>
        </div>

        {/* تذييل التقرير */}
        <div className="report-footer">
          تم إنشاء هذا التقرير تلقائياً بواسطة نظام إدارة المشاريع الإنشائية
          <br />
          التاريخ: {formatDate(new Date())} | الوقت: {new Date().toLocaleTimeString('ar-EG')}
        </div>
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

  const ProjectSummaryReport = ({ data }: { data: any }) => (
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded-lg">
        <h5 className="font-medium mb-2">ملخص {data.project?.name}</h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span>إجمالي الدخل: </span>
            <span className="font-bold text-green-600">{formatCurrency(data.summary?.totalIncome || 0)}</span>
          </div>
          <div>
            <span>إجمالي المصروفات: </span>
            <span className="font-bold text-red-600">{formatCurrency(data.summary?.totalExpenses || 0)}</span>
          </div>
          <div className="col-span-2">
            <span>الرصيد الصافي: </span>
            <span className={`font-bold ${(data.summary?.netBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.summary?.netBalance || 0)}
            </span>
          </div>
        </div>
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
        <h2 className="text-xl font-bold text-foreground">التقارير</h2>
      </div>

      <ProjectSelector
        selectedProjectId={selectedProjectId}
        onProjectChange={selectProject}
      />

      {/* Report Types */}
      <div className="space-y-3">
        {reportTypes.map((report, index) => {
          const Icon = report.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-reverse space-x-3">
                    <Icon className={`h-6 w-6 ${report.color.replace('bg-', 'text-')}`} />
                    <div>
                      <h4 className="font-medium text-foreground">{report.title}</h4>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                  </div>
                  <Button
                    onClick={report.onGenerate}
                    className={`${report.color} ${report.hoverColor} ${report.textColor} px-4 py-2 text-sm`}
                  >
                    إنشاء
                  </Button>
                </div>
                {report.form}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Generated Report Display */}
      {activeReportType && reportData && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                {activeReportType === 'daily' && 'كشف المصروفات اليومية'}
                {activeReportType === 'worker' && 'كشف حساب العامل'}
                {activeReportType === 'materials' && 'كشف المواد المشتراة'}
                {activeReportType === 'summary' && 'ملخص المشروع'}
              </CardTitle>
              <div className="flex gap-2 no-print">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={printReport}
                  className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-700 transition-colors"
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
                  className="flex items-center gap-2 hover:bg-green-50 hover:text-green-700 transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  تصدير Excel
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setActiveReportType(null);
                    setReportData(null);
                  }}
                  className="hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                  إغلاق
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeReportType === 'daily' && <DailyExpensesReport data={reportData} />}
            {activeReportType === 'worker' && (
              <div className="text-center py-8 text-muted-foreground">
                عذراً، تقرير حساب العامل غير متوفر حالياً
              </div>
            )}
            {activeReportType === 'materials' && <MaterialPurchasesReport data={reportData} />}
            {activeReportType === 'summary' && <ProjectSummaryReport data={reportData} />}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
