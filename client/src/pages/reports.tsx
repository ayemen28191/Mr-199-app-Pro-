import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowRight, Receipt, UserCheck, Package, PieChart, Eye, Download, Share2, 
  FileSpreadsheet, Printer, Calendar, TrendingUp, Filter, RefreshCw,
  BarChart3, Database, Clock, Settings, Users, DollarSign, FileText,
  Activity, Target, Briefcase, ChevronRight, Grid3X3, List, Search,
  ExternalLink, AlertCircle, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('quick-reports');
  const [isGenerating, setIsGenerating] = useState(false);

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

  const quickStats = [
    {
      title: "التقارير المُنشأة اليوم",
      value: "12",
      change: "+23%",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: "up"
    },
    {
      title: "المشاريع النشطة",
      value: projects.filter(p => p.status === 'active').length.toString(),
      change: "+5%",
      icon: Briefcase,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: "up"
    },
    {
      title: "إجمالي المصروفات",
      value: "298,200",
      change: "+12%",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: "up"
    },
    {
      title: "العمال النشطين",
      value: workers.length.toString(),
      change: "+8%",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      trend: "up"
    }
  ];

  const reportTypes = [
    {
      id: 'daily-expenses',
      icon: Receipt,
      title: "كشف المصروفات اليومية",
      description: "عرض تفصيلي لمصروفات يوم محدد مع الحوالات والأرصدة",
      category: "مالية",
      complexity: "بسيط",
      estimatedTime: "2-3 دقائق",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
      textColor: "text-white",
      form: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">التاريخ المطلوب</label>
              <Input
                type="date"
                value={dailyReportDate}
                onChange={(e) => setDailyReportDate(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">المشروع</label>
              <div className="p-3 bg-gray-50 rounded-lg border text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gray-500" />
                  {selectedProject?.name || "لم يتم اختيار مشروع"}
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      onGenerate: generateDailyExpensesReport,
    },
    {
      id: 'worker-account',
      icon: UserCheck,
      title: "كشف حساب عامل",
      description: "تقرير مفصل لحساب عامل محدد لفترة زمنية",
      category: "موارد بشرية",
      complexity: "متوسط",
      estimatedTime: "3-5 دقائق",
      color: "bg-gradient-to-br from-green-500 to-green-600",
      hoverColor: "hover:from-green-600 hover:to-green-700",
      textColor: "text-white",
      form: (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">اختيار العامل</label>
            <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="اختر العامل..." />
              </SelectTrigger>
              <SelectContent>
                {workers.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {worker.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">من تاريخ</label>
              <Input
                type="date"
                value={workerAccountDate1}
                onChange={(e) => setWorkerAccountDate1(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">إلى تاريخ</label>
              <Input
                type="date"
                value={workerAccountDate2}
                onChange={(e) => setWorkerAccountDate2(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
        </div>
      ),
      onGenerate: generateWorkerAccountReport,
    },
    {
      id: 'material-purchases',
      icon: Package,
      title: "كشف المواد المشتراة",
      description: "تقرير شامل للمواد والتوريدات مع التفاصيل المالية",
      category: "مواد",
      complexity: "متوسط",
      estimatedTime: "4-6 دقائق",
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      hoverColor: "hover:from-orange-600 hover:to-orange-700",
      textColor: "text-white",
      form: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">من تاريخ</label>
              <Input
                type="date"
                value={materialReportDate1}
                onChange={(e) => setMaterialReportDate1(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">إلى تاريخ</label>
              <Input
                type="date"
                value={materialReportDate2}
                onChange={(e) => setMaterialReportDate2(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">المشروع</label>
            <div className="p-3 bg-gray-50 rounded-lg border text-sm font-medium">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                {selectedProject?.name || "لم يتم اختيار مشروع"}
              </div>
            </div>
          </div>
        </div>
      ),
      onGenerate: generateMaterialPurchasesReport,
    },
    {
      id: 'project-summary',
      icon: PieChart,
      title: "ملخص المشروع",
      description: "تقرير شامل ومفصل للمشروع مع الإحصائيات والمؤشرات",
      category: "إحصائيات",
      complexity: "متقدم",
      estimatedTime: "5-8 دقائق",
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      hoverColor: "hover:from-purple-600 hover:to-purple-700",
      textColor: "text-white",
      form: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">من تاريخ</label>
              <Input
                type="date"
                value={projectSummaryDate1}
                onChange={(e) => setProjectSummaryDate1(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">إلى تاريخ</label>
              <Input
                type="date"
                value={projectSummaryDate2}
                onChange={(e) => setProjectSummaryDate2(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">المشروع</label>
            <div className="p-3 bg-gray-50 rounded-lg border text-sm font-medium">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-gray-500" />
                {selectedProject?.name || "لم يتم اختيار مشروع"}
              </div>
            </div>
          </div>
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
                <div className="text-xs text-muted-foreground mt-1">
                  {purchase.supplierName} • {formatDate(purchase.purchaseDate)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{formatCurrency(purchase.totalAmount)}</div>
                <div className="text-xs text-muted-foreground">{formatCurrency(purchase.unitPrice)}/وحدة</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ProjectSummaryReport = ({ data }: { data: any }) => (
    <div className="space-y-6">
      <div className="bg-muted p-4 rounded-lg">
        <h5 className="font-medium mb-3">ملخص المشروع من {formatDate(data.dateFrom)} إلى {formatDate(data.dateTo)}</h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span>إجمالي الإيرادات: </span>
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
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">مركز التقارير والتحليلات</h1>
                <p className="text-gray-600 mt-1">إدارة وإنشاء التقارير المالية والإدارية المتقدمة</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                إعدادات
              </Button>
              <Button variant="outline" onClick={() => setLocation("/")} className="gap-2">
                <ArrowRight className="h-4 w-4" />
                العودة للرئيسية
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                        <Badge variant={stat.trend === 'up' ? 'default' : 'secondary'} className="text-xs">
                          {stat.change}
                        </Badge>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <IconComponent className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Project Selector */}
        <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">اختيار المشروع</h3>
                <p className="text-sm text-gray-600">يرجى اختيار المشروع لإنشاء التقارير</p>
              </div>
              <div className="min-w-[300px]">
                <ProjectSelector 
                  selectedProjectId={selectedProjectId} 
                  onProjectChange={selectProject} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="quick-reports" className="gap-2">
                <Activity className="h-4 w-4" />
                التقارير السريعة
              </TabsTrigger>
              <TabsTrigger value="advanced-reports" className="gap-2">
                <Database className="h-4 w-4" />
                التقارير المتقدمة
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                آخر تحديث: {new Date().toLocaleTimeString('ar-EG')}
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                تحديث
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    {viewMode === 'grid' ? <Grid3X3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
                    العرض
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setViewMode('grid')}>
                    <Grid3X3 className="h-4 w-4 mr-2" />
                    عرض شبكي
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewMode('list')}>
                    <List className="h-4 w-4 mr-2" />
                    عرض قائمة
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <TabsContent value="quick-reports" className="space-y-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reportTypes.map((reportType, index) => {
                  const IconComponent = reportType.icon;
                  return (
                    <Card key={reportType.id} className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                      {/* Header */}
                      <div className={`${reportType.color} ${reportType.hoverColor} ${reportType.textColor} p-6 transition-all duration-300`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                              <IconComponent className="h-7 w-7" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold mb-1">{reportType.title}</h3>
                              <p className="text-sm opacity-90 leading-relaxed">{reportType.description}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 opacity-70 group-hover:translate-x-1 transition-transform" />
                        </div>
                        
                        <div className="flex items-center gap-4 mt-4">
                          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                            {reportType.category}
                          </Badge>
                          <Badge variant="outline" className="bg-white/10 text-white border-white/30">
                            {reportType.complexity}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs opacity-75">
                            <Clock className="h-3 w-3" />
                            {reportType.estimatedTime}
                          </div>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <CardContent className="p-6 bg-white">
                        <div className="space-y-6">
                          {reportType.form}
                          
                          <div className="flex items-center gap-3">
                            <Button 
                              onClick={() => {
                                setIsGenerating(true);
                                reportType.onGenerate();
                                setTimeout(() => setIsGenerating(false), 2000);
                              }}
                              disabled={isGenerating}
                              className="flex-1 h-12 text-base font-semibold gap-2 shadow-lg hover:shadow-xl transition-all"
                            >
                              {isGenerating ? (
                                <RefreshCw className="h-5 w-5 animate-spin" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                              {isGenerating ? 'جاري الإنشاء...' : 'إنشاء التقرير'}
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="lg" className="px-4">
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem>
                                  <Calendar className="h-4 w-4 mr-2" />
                                  جدولة التقرير
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Share2 className="h-4 w-4 mr-2" />
                                  مشاركة النموذج
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  فتح في نافذة جديدة
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                      
                      {/* Status Indicator */}
                      <div className="absolute top-4 right-4">
                        {selectedProjectId ? (
                          <CheckCircle2 className="h-5 w-5 text-white opacity-80" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-white opacity-80" />
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {reportTypes.map((reportType, index) => {
                  const IconComponent = reportType.icon;
                  return (
                    <Card key={reportType.id} className="hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${reportType.color.replace('bg-gradient-to-br from-', 'bg-').replace(' to-' + reportType.color.split(' to-')[1], '')}/10`}>
                              <IconComponent className="h-6 w-6 text-gray-700" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{reportType.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{reportType.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">{reportType.category}</Badge>
                                <Badge variant="outline" className="text-xs">{reportType.complexity}</Badge>
                              </div>
                            </div>
                          </div>
                          <Button onClick={reportType.onGenerate} className="gap-2">
                            <Eye className="h-4 w-4" />
                            إنشاء
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="advanced-reports" className="space-y-6">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="max-w-md mx-auto">
                  <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
                    <Database className="h-8 w-8 text-gray-600 mx-auto mt-1" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">التقارير المتقدمة</h3>
                  <p className="text-gray-600 mb-6">
                    ستتوفر قريباً مجموعة من التقارير المتقدمة والتحليلات التفصيلية
                  </p>
                  <Button variant="outline" disabled>
                    قريباً
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Generated Report Display */}
        {activeReportType && reportData && (
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">
                      {activeReportType === 'daily' && 'كشف المصروفات اليومية'}
                      {activeReportType === 'worker' && 'كشف حساب العامل'}
                      {activeReportType === 'materials' && 'كشف المواد المشتراة'}
                      {activeReportType === 'summary' && 'ملخص المشروع'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      تم إنشاؤه في {new Date().toLocaleString('ar-EG')}
                    </div>
                  </div>
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
            <CardContent className="p-6">
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
    </div>
  );
}