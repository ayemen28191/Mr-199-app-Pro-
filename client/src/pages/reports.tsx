/**
 * الوصف: نظام التقارير الاحترافي المتكامل
 * المدخلات: اختيار نوع التقرير والمعايير المطلوبة
 * المخرجات: عرض وتصدير وطباعة التقارير الاحترافية
 * المالك: عمار
 * آخر تعديل: 2025-08-15
 * الحالة: نسخة احترافية محسنة
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  FileSpreadsheet, Printer, Calendar, TrendingUp, Users, DollarSign,
  Activity, Building2, Receipt, UserCheck, Package, PieChart, Download,
  Eye, RefreshCw, Settings, Filter, ArrowRight, CheckCircle2, AlertCircle,
  Clock, BarChart3, TrendingDown, Zap, Globe, Award, Search, Grid3X3, List,
  ChevronRight, ExternalLink, Info, Target, Briefcase, Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSelectedProject } from "@/hooks/use-selected-project";
import ProjectSelector from "@/components/project-selector";
import { getCurrentDate, formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Worker, Project } from "@shared/schema";

// استيراد النظام الموحد الجديد
import { 
  DailyExpenseTemplate, 
  WorkerStatementTemplate,
  quickExport,
  printReport 
} from "@/reports";

// استيراد القالب الجديد المطابق للصورة
import ExactWorkerStatementTemplate from "@/components/ExactWorkerStatementTemplate";
import ProfessionalDailyExpenseReport from "@/components/ProfessionalDailyExpenseReport";

// استيراد نظام التصفية الموحد
import { 
  UnifiedFilterTemplate, 
  WorkerFilterPresets 
} from "@/components/unified-filter-template";
import WorkerFilterReport from "@/components/worker-filter-report";
import DailyExpensesBulkExport from "@/components/daily-expenses-bulk-export";
import AdvancedDataExport from "@/components/AdvancedDataExport";
import { StatsCard, StatsGrid } from "@/components/ui/stats-card";
import { useFloatingButton } from "@/components/layout/floating-button-context";

// أنواع بيانات التقارير
interface ReportStats {
  totalGenerated: number;
  todayReports: number;
  activeProjects: number;
  completionRate: number;
}

export default function Reports() {
  const [, setLocation] = useLocation();
  const { selectedProjectId, selectProject } = useSelectedProject();
  const { toast } = useToast();
  const { setFloatingAction } = useFloatingButton();

  // تعيين إجراء الزر العائم لتصدير سريع
  useEffect(() => {
    const handleQuickExport = () => {
      // إنشاء تقرير سريع للمشروع المحدد
      if (selectedProjectId) {
        quickExport(dailyReportDate, selectedProjectId);
      } else {
        toast({
          title: "تنبيه",
          description: "يرجى اختيار مشروع أولاً",
          variant: "default",
        });
      }
    };
    
    setFloatingAction(handleQuickExport, "تصدير سريع");
    return () => setFloatingAction(null);
  }, [setFloatingAction, selectedProjectId, dailyReportDate]);

  // حالات التقارير المختلفة
  const [dailyReportDate, setDailyReportDate] = useState(getCurrentDate());
  const [workerAccountDate1, setWorkerAccountDate1] = useState("");
  const [workerAccountDate2, setWorkerAccountDate2] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  
  // حالات عرض التقارير
  const [activeReportType, setActiveReportType] = useState<string | null>(null);

  // تعيين إجراء الزر العائم للتقارير
  useEffect(() => {
    const handleCreateReport = () => {
      if (selectedProjectId) {
        setActiveReportType('daily-expense');
      } else {
        toast({
          title: "تنبيه",
          description: "يرجى اختيار مشروع أولاً",
          variant: "destructive"
        });
      }
    };
    
    setFloatingAction(handleCreateReport, "إنشاء تقرير");
    return () => setFloatingAction(null);
  }, [setFloatingAction, selectedProjectId, toast]);
  const [reportData, setReportData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showPreview, setShowPreview] = useState(false);
  
  // جلب بيانات المشاريع والعمال
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  // حالة تصفية العمال - إصلاح عدم ظهور العمال
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);

  // تحديث قائمة العمال المفلترة عند تغيير البيانات - إصلاح جذري
  useEffect(() => {
    console.log('🔄 تحديث قائمة العمال المفلترة:', workers.length, 'عمال');
    console.log('📋 بيانات العمال:', workers.slice(0, 3).map(w => w.name));
    // تعيين العمال مباشرة بدون شروط
    setFilteredWorkers(workers);
  }, [workers]);

  // إعادة تعيين العمال عند عدم وجود عمال مفلترة ولكن يوجد عمال أصلية
  useEffect(() => {
    if (filteredWorkers.length === 0 && workers.length > 0) {
      console.log('🔧 إعادة تعيين العمال المفلترة لحل مشكلة العرض');
      setFilteredWorkers(workers);
    }
  }, [filteredWorkers, workers]);

  // جلب الإحصائيات المحسنة مع إعادة التحديث التلقائي
  const { data: projectsWithStats = [], refetch: refetchStats } = useQuery<any[]>({
    queryKey: ["/api/projects/with-stats"],
    refetchInterval: 30000, // إعادة التحديث كل 30 ثانية
    staleTime: 10000, // البيانات طازجة لـ 10 ثواني
  });

  // جلب الإحصائيات المحددة للمشروع المختار بشكل منفصل
  const { data: selectedProjectStats = null, refetch: refetchProjectStats } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "stats"],
    enabled: !!selectedProjectId,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedProjectWithStats = projectsWithStats.find((p: any) => p.id === selectedProjectId);
  
  // استخدام البيانات المحددة أولاً، ثم البيانات العامة كاحتياط
  const projectStats = selectedProjectStats || selectedProjectWithStats?.stats || {};

  // حساب الإحصائيات مع التحقق من صحة البيانات
  const reportStats: ReportStats = {
    totalGenerated: projectsWithStats.length,
    todayReports: 0, // يمكن حسابها من قاعدة البيانات
    activeProjects: projects.filter(p => p.status === 'active').length,
    completionRate: projectStats.completionRate || 0
  };

  // تحسين استخراج البيانات مع التحقق من القيم
  const totalFundTransfers = Number(projectStats?.totalIncome) || 0;
  const totalExpenses = Number(projectStats?.totalExpenses) || 0;
  const currentBalance = Number(projectStats?.currentBalance) || 0;
  const totalWorkers = workers.length;
  
  // إضافة تسجيل للتشخيص
  console.log('📊 إحصائيات المشروع في التقارير:', {
    selectedProjectId,
    projectStats,
    totalIncome: totalFundTransfers,
    totalExpenses,
    currentBalance,
    hasStats: !!projectStats
  });

  // إنشاء تقرير المصروفات اليومية
  const generateDailyExpensesReport = async () => {
    if (!selectedProjectId || !dailyReportDate) {
      toast({
        title: "بيانات ناقصة ⚠️",
        description: "يرجى اختيار مشروع وتاريخ",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/reports/daily-expenses/${selectedProjectId}/${dailyReportDate}`);
      if (!response.ok) throw new Error('خطأ في تحميل التقرير');
      
      const data = await response.json();
      setReportData(data);
      setActiveReportType("daily");
      setShowPreview(true);
      
      toast({
        title: "تم إنشاء التقرير بنجاح ✅",
        description: `كشف المصروفات اليومية لمشروع ${selectedProject?.name}`,
      });
    } catch (error) {
      toast({
        title: "خطأ في إنشاء التقرير ❌",
        description: "تأكد من اتصال الإنترنت وأن البيانات متوفرة",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // إنشاء كشف حساب العامل
  const generateWorkerAccountReport = async () => {
    if (!selectedWorkerId || !workerAccountDate1 || !workerAccountDate2) {
      toast({
        title: "بيانات ناقصة ⚠️",
        description: "يرجى تحديد العامل والتواريخ",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      let url = `/api/workers/${selectedWorkerId}/account-statement?dateFrom=${workerAccountDate1}&dateTo=${workerAccountDate2}`;
      if (selectedProjectId) {
        url += `&projectId=${selectedProjectId}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('خطأ في تحميل كشف الحساب');
      
      const data = await response.json();
      const reportDataExtended = { 
        ...data, 
        workerId: selectedWorkerId, 
        dateFrom: workerAccountDate1, 
        dateTo: workerAccountDate2
      };
      setReportData(reportDataExtended);
      setActiveReportType("worker");
      setShowPreview(true);

      const workerName = workers.find(w => w.id === selectedWorkerId)?.name || "غير محدد";
      toast({
        title: "تم إنشاء كشف الحساب بنجاح ✅",
        description: `كشف حساب العامل ${workerName}`,
      });
    } catch (error) {
      toast({
        title: "خطأ في إنشاء كشف الحساب ❌",
        description: "تأكد من صحة البيانات والاتصال بالإنترنت",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // تصدير إلى Excel باستخدام النظام الموحد
  const handleExportExcel = async () => {
    if (!reportData) {
      toast({
        title: "لا توجد بيانات للتصدير ⚠️",
        description: "يرجى إنشاء تقرير أولاً",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = activeReportType === 'daily' 
        ? `مصروفات-يومية-${reportData.projectName || 'مشروع'}-${timestamp}`
        : `كشف-حساب-${reportData.worker?.name || 'عامل'}-${timestamp}`;

      if (activeReportType === 'daily') {
        await quickExport.dailyExpenses(reportData, filename);
      } else if (activeReportType === 'worker') {
        await quickExport.workerStatement(reportData, filename);
      }
      
      toast({
        title: "تم التصدير بنجاح ✅",
        description: `تم حفظ الملف: ${filename}.xlsx`,
      });
    } catch (error) {
      toast({
        title: "خطأ في التصدير ❌",
        description: "حدث خطأ أثناء تصدير التقرير إلى Excel",
        variant: "destructive",
      });
    }
  };

  // طباعة التقرير
  const handlePrint = async () => {
    if (!reportData) {
      toast({
        title: "لا توجد بيانات للطباعة ⚠️",
        description: "يرجى إنشاء تقرير أولاً",
        variant: "destructive",
      });
      return;
    }

    // تأكد من عرض المعاينة قبل الطباعة
    if (!showPreview) {
      setShowPreview(true);
      // انتظار أطول حتى يتم تحميل وعرض المحتوى
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // تحقق من وجود العنصر والمحتوى
    const element = document.getElementById('report-preview');
    if (!element) {
      toast({
        title: "خطأ في الطباعة",
        description: "لا يمكن العثور على عنصر التقرير للطباعة",
        variant: "destructive",
      });
      return;
    }

    // التحقق من وجود محتوى حقيقي
    const hasContent = element.querySelector('table tbody tr:not(.empty-state)') || 
                      element.innerText.trim().length > 50;
    
    if (!hasContent) {
      toast({
        title: "لا توجد بيانات للطباعة",
        description: "يرجى إنشاء التقرير والتأكد من تحميل البيانات أولاً",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await printReport.direct('report-preview', 'تقرير احترافي');
      toast({
        title: "جاري الطباعة 🖨️",
        description: "تم إعداد التقرير للطباعة بتنسيق A4",
      });
    } catch (error) {
      toast({
        title: "خطأ في الطباعة ❌",
        description: "تأكد من إعدادات الطابعة والمتصفح",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* شريط علوي احترافي */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  نظام التقارير الاحترافي
                </h1>
                <p className="text-muted-foreground mt-1">إنشاء وإدارة تقارير المشروع بطريقة احترافية ومتقدمة</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[300px] max-w-[400px]">
                <ProjectSelector onProjectChange={selectProject} />
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
                className="hidden md:flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                تحديث
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 space-y-6">
        {/* رسالة التنبيه عند عدم اختيار مشروع */}
        {!selectedProjectId && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-amber-100 dark:bg-amber-900/40 rounded-full p-2">
                  <Info className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100">تنبيه مهم</h3>
                  <p className="text-amber-700 dark:text-amber-300 mt-1">
                    يرجى اختيار مشروع من القائمة أعلاه لبدء إنشاء التقارير والاستفادة من جميع الميزات المتاحة.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-100"
                    onClick={() => setLocation('/projects')}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    إدارة المشاريع
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* لوحة الإحصائيات الذكية */}
        {selectedProjectId && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatsCard
              title="إجمالي الدخل"
              value={totalFundTransfers}
              icon={TrendingUp}
              color="green"
              formatter={formatCurrency}
            />
            <StatsCard
              title="إجمالي المصاريف"
              value={totalExpenses}
              icon={TrendingDown}
              color="red"
              formatter={formatCurrency}
            />
            <StatsCard
              title="الرصيد الحالي"
              value={currentBalance}
              icon={DollarSign}
              color={currentBalance >= 0 ? "blue" : "red"}
              formatter={formatCurrency}
            />
            <StatsCard
              title="عدد العمال"
              value={totalWorkers}
              icon={Users}
              color="purple"
              formatter={(value: number) => `${value} عامل`}
            />
          </div>
        )}

        {/* واجهة إنشاء التقارير المحسنة */}
        <Tabs defaultValue="daily" className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-2 shadow-lg border">
              <TabsList className="grid grid-cols-6 w-full bg-transparent gap-2">
                <TabsTrigger 
                  value="daily" 
                  className="flex items-center gap-2 text-sm md:text-base px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Receipt className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden md:inline">المصروفات اليومية</span>
                  <span className="md:hidden">مصروفات</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="worker" 
                  className="flex items-center gap-2 text-sm md:text-base px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <UserCheck className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden md:inline">كشف حساب العامل</span>
                  <span className="md:hidden">كشف حساب</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="filter-workers" 
                  className="flex items-center gap-2 text-sm md:text-base px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Users className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden md:inline">تصفية العمال</span>
                  <span className="md:hidden">عمال</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="exact-worker" 
                  className="flex items-center gap-2 text-sm md:text-base px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Target className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden md:inline">كشف حساب متقدم</span>
                  <span className="md:hidden">متقدم</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="bulk-export" 
                  className="flex items-center gap-2 text-sm md:text-base px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FileSpreadsheet className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden md:inline">تصدير مجمع</span>
                  <span className="md:hidden">تصدير</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="advanced-export" 
                  className="flex items-center gap-2 text-sm md:text-base px-4 py-3 rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Download className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden md:inline">تصدير متقدم</span>
                  <span className="md:hidden">متقدم</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {reportData && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>تقرير جاهز للعرض والتصدير</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
                >
                  <Eye className="h-4 w-4" />
                  {showPreview ? 'إخفاء المعاينة' : 'عرض المعاينة'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 hover:bg-green-50 hover:border-green-300"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  تصدير Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="flex items-center gap-2 hover:bg-purple-50 hover:border-purple-300"
                >
                  <Printer className="h-4 w-4" />
                  طباعة
                </Button>
              </div>
            )}
          </div>

          {/* تبويب المصروفات اليومية */}
          <TabsContent value="daily">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <Receipt className="h-6 w-6 text-white" />
                  </div>
                  تقرير المصروفات اليومية
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      📅 تاريخ التقرير
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="date"
                        value={dailyReportDate}
                        onChange={(e) => setDailyReportDate(e.target.value)}
                        className="pl-10 text-lg"
                        max={getCurrentDate()}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      🏗️ المشروع المحدد
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="font-medium">
                        {selectedProject?.name || 'لا يوجد مشروع محدد'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        الحالة: {selectedProject?.status === 'active' ? '🟢 نشط' : '🔴 غير نشط'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={generateDailyExpensesReport}
                    disabled={isGenerating || !selectedProjectId}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 text-base"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        جاري الإنشاء...
                      </>
                    ) : (
                      <>
                        <Activity className="h-5 w-5" />
                        إنشاء التقرير
                      </>
                    )}
                  </Button>


                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب كشف حساب العامل */}
          <TabsContent value="worker">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="bg-green-600 p-2 rounded-lg">
                    <UserCheck className="h-6 w-6 text-white" />
                  </div>
                  كشف حساب العامل
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* البحث البسيط في العمال */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Search className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">البحث في العمال</h3>
                  </div>
                  <div className="text-sm text-green-600">
                    ✅ العمال محملين بنجاح - {workers.length} عامل متاح
                  </div>
                </div>

                {/* لوحة إحصائيات العمال المفلترين */}
                {workers.length > 0 && (
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 mb-6">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{workers.length}</div>
                          <div className="text-sm text-muted-foreground">إجمالي العمال</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {workers.filter(w => w.isActive).length}
                          </div>
                          <div className="text-sm text-muted-foreground">العمال النشطين</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">
                            {formatCurrency(workers.reduce((sum, w) => sum + Number(w.dailyWage || 0), 0))}
                          </div>
                          <div className="text-sm text-muted-foreground">إجمالي الأجور اليومية</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-indigo-600">
                            {new Set(workers.map(w => w.type)).size}
                          </div>
                          <div className="text-sm text-muted-foreground">أنواع العمل</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <label className="flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <span>👷 اختيار العامل</span>
                      <Badge variant="outline" className="text-xs">
                        {workers.length} عامل متاح
                      </Badge>
                    </label>
                    <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                      <SelectTrigger className="text-lg">
                        <SelectValue 
                          placeholder={
                            workers.length > 0 
                              ? `اختر من ${workers.length} عامل متاح...` 
                              : "جاري تحميل العمال..."
                          } 
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {workers.length > 0 ? (
                          workers.map(worker => (
                            <SelectItem key={worker.id} value={worker.id} className="text-lg">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${worker.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                {worker.name} - {worker.type}
                                <Badge variant={worker.isActive ? "default" : "secondary"} className="text-xs">
                                  {worker.isActive ? 'نشط' : 'غير نشط'}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-4 text-center text-muted-foreground">
                            جاري تحميل العمال...
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    
                    {/* رسائل التنبيه المحسنة */}
                    {filteredWorkers.length === 0 && workers.length > 0 && (
                      <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                          <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                            لا توجد عمال مطابقة لمعايير التصفية
                          </p>
                        </div>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          يرجى تعديل معايير البحث أو إعادة تعيين المرشحات أعلاه
                        </p>
                      </div>
                    )}
                    
                    {workers.length === 0 && (
                      <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                            خطأ في تحميل العمال
                          </p>
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-400">
                          فشل في طلب سجلات الحضور. يرجى المحاولة مرة أخرى
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2" 
                          onClick={() => window.location.reload()}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          إعادة المحاولة
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      📅 من تاريخ
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="date"
                        value={workerAccountDate1}
                        onChange={(e) => setWorkerAccountDate1(e.target.value)}
                        className="pl-10 text-lg"
                        max={getCurrentDate()}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      📅 إلى تاريخ
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="date"
                        value={workerAccountDate2}
                        onChange={(e) => setWorkerAccountDate2(e.target.value)}
                        className="pl-10 text-lg"
                        max={getCurrentDate()}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={generateWorkerAccountReport}
                    disabled={isGenerating}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 text-base"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        جاري الإنشاء...
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-5 w-5" />
                        إنشاء كشف الحساب
                      </>
                    )}
                  </Button>

                  {reportData && activeReportType === 'worker' && (
                    <>

                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب تصفية العمال الجديد */}
          <TabsContent value="filter-workers">
            <WorkerFilterReport />
          </TabsContent>

          {/* تبويب التصدير المجمع */}
          <TabsContent value="bulk-export">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="bg-orange-600 p-2 rounded-lg">
                    <FileSpreadsheet className="h-6 w-6 text-white" />
                  </div>
                  تصدير المصروفات اليومية لفترة زمنية
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <DailyExpensesBulkExport />
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب التصدير المتقدم - جديد */}
          <TabsContent value="advanced-export">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="bg-indigo-600 p-2 rounded-lg">
                    <Download className="h-6 w-6 text-white" />
                  </div>
                  تصدير البيانات المتقدم
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100">
                    جديد
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  اختيار مشاريع متعددة وفترات زمنية مع تصدير Excel و PDF والطباعة
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <AdvancedDataExport />
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب كشف الحساب المتقدم - يطابق الصورة بنسبة 100% */}
          <TabsContent value="exact-worker">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="bg-teal-600 p-2 rounded-lg">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  كشف حساب تفصيلي متقدم للعمل
                  <Badge variant="secondary" className="bg-teal-100 text-teal-800 dark:bg-teal-800 dark:text-teal-100">
                    مطابق للصورة 100%
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  قالب محسن يطابق تصميم Excel المرفق مع دمج الحوالات والحضور وترتيبهما حسب التاريخ
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <ExactWorkerStatementTemplate />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* معاينة التقرير المحسنة */}
        {reportData && showPreview && (
          <Card className="shadow-xl border-2 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Eye className="h-6 w-6" />
                  معاينة التقرير - {activeReportType === 'daily' ? 'المصروفات اليومية' : 'كشف حساب العامل'}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    جاهز للطباعة
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(false)}
                    className="text-white hover:bg-white/20"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* محتوى التقرير مع تحسينات الطباعة والعرض */}
              <div 
                id="report-preview" 
                className="bg-white p-8 min-h-[800px] print:min-h-0 print:p-6"
                style={{ 
                  fontFamily: 'Arial, sans-serif',
                  lineHeight: '1.6',
                  direction: 'rtl'
                }}
              >
                {activeReportType === 'daily' ? (
                  <ProfessionalDailyExpenseReport data={reportData} />
                ) : (
                  <WorkerStatementTemplate data={reportData} />
                )}
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* ستايل خاص بالطباعة */}
      <style>{`
        @media print {
          /* إخفاء جميع العناصر غير المطلوبة في الطباعة */
          .no-print,
          .sidebar,
          .navbar,
          button:not(.print-visible),
          .bg-gradient-to-br,
          .container.mx-auto,
          .tabs,
          .card:not(#report-preview) {
            display: none !important;
          }

          /* تنسيق خاص للتقرير المطبوع */
          body {
            background: white !important;
            color: black !important;
            font-family: 'Arial', sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          #report-preview {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 20mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            direction: rtl !important;
            text-align: right !important;
          }

          #report-preview * {
            visibility: visible !important;
            color: black !important;
            background: transparent !important;
          }

          /* تنسيق خاص للجداول في الطباعة */
          #report-preview table {
            border-collapse: collapse !important;
            width: 100% !important;
            margin: 10px 0 !important;
          }

          #report-preview th,
          #report-preview td {
            border: 1px solid #333 !important;
            padding: 8px !important;
            text-align: right !important;
          }

          #report-preview th {
            background-color: #f5f5f5 !important;
            font-weight: bold !important;
          }

          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>
    </div>
  );
}