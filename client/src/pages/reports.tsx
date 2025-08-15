import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowRight, Receipt, UserCheck, Package, PieChart, Eye, Download, Share2, 
  FileSpreadsheet, Printer, Calendar, TrendingUp, Filter, RefreshCw,
  BarChart3, Database, Clock, Settings, Users, DollarSign, FileText,
  Activity, Target, Briefcase, ChevronRight, Grid3X3, List, Search,
  ExternalLink, AlertCircle, CheckCircle2, Zap, Globe, Award, ChevronUp, ChevronDown,
  Lightbulb, Info
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

import { EnhancedWorkerAccountStatement } from "@/components/EnhancedWorkerAccountStatementFixed";

import { AdvancedProgressIndicator, useProgressSteps, type ProgressStep } from "@/components/AdvancedProgressIndicator";
import { EnhancedErrorDisplay, FieldValidationDisplay, transformValidationErrors } from "@/components/EnhancedErrorDisplay";





export default function Reports() {
  const [, setLocation] = useLocation();
  const { selectedProjectId, selectProject } = useSelectedProject();
  const { toast } = useToast();

  // Fetch real statistics data
  const { data: projectsWithStats = [] } = useQuery<any[]>({
    queryKey: ["/api/projects/with-stats"],
  });

  // Fetch active report template for Excel export
  const { data: activeTemplate } = useQuery({
    queryKey: ["/api/report-templates/active"],
  });
  
  // Report form states
  const [dailyReportDate, setDailyReportDate] = useState(getCurrentDate());
  const [workerAccountDate1, setWorkerAccountDate1] = useState("");
  const [workerAccountDate2, setWorkerAccountDate2] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [selectedWorkerProjectIds, setSelectedWorkerProjectIds] = useState<string[]>([]);
  const [materialReportDate1, setMaterialReportDate1] = useState("");
  const [materialReportDate2, setMaterialReportDate2] = useState("");
  const [projectSummaryDate1, setProjectSummaryDate1] = useState("");
  const [projectSummaryDate2, setProjectSummaryDate2] = useState("");
  
  // Workers Settlement Report states
  const [settlementDateFrom, setSettlementDateFrom] = useState("");
  const [settlementDateTo, setSettlementDateTo] = useState("");
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [selectedSettlementProjectIds, setSelectedSettlementProjectIds] = useState<string[]>([]);
  const [settlementReportData, setSettlementReportData] = useState<any>(null);
  const [showSettlementForm, setShowSettlementForm] = useState(false);
  
  // Enhanced validation and progress tracking
  const [settlementErrors, setSettlementErrors] = useState<any[]>([]);
  
  // Header collapsible state
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  
  // Progress steps للمؤشر المتقدم المحسن
  const initialProgressSteps: ProgressStep[] = [
    {
      id: 'validate',
      title: 'التحقق من صحة البيانات',
      description: 'فحص المشاريع المحددة، التواريخ، والعمال المختارين للتأكد من صحة البيانات',
      status: 'pending',
      estimatedTime: 3
    },
    {
      id: 'fetch-data',
      title: 'استخراج البيانات من قاعدة البيانات',
      description: 'جلب سجلات الحضور، الأجور، التحويلات، والمدفوعات للعمال المحددين',
      status: 'pending',
      estimatedTime: 12
    },
    {
      id: 'calculate',
      title: 'معالجة وحساب المبالغ المالية',
      description: 'حساب الأجور المستحقة، المبالغ المدفوعة، الأرصدة المتبقية، وحوالات العمال',
      status: 'pending',
      estimatedTime: 8
    },
    {
      id: 'generate-report',
      title: 'إنشاء التقرير وتنسيقه',
      description: 'تجميع البيانات وإنشاء التقرير النهائي مع الجداول والإحصائيات',
      status: 'pending',
      estimatedTime: 5
    },
    {
      id: 'finalize',
      title: 'إنهاء المعالجة وعرض النتائج',
      description: 'حفظ التقرير وإعداده للعرض والطباعة والتصدير',
      status: 'pending', 
      estimatedTime: 2
    }
  ];
  
  const {
    steps: progressSteps,
    currentStepId,
    startStep,
    completeStep,
    errorStep,
    resetSteps
  } = useProgressSteps(initialProgressSteps);
  
  // Report display states
  const [activeReportType, setActiveReportType] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch projects and workers data
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Helper functions (getCurrentDate and formatCurrency imported from lib/utils)

  // Calculate real statistics
  const totalActiveProjects = projects.filter(p => p.status === 'active').length;
  const totalWorkers = workers.length;
  
  // Calculate statistics for selected project only
  const selectedProjectWithStats = projectsWithStats.find((p: any) => p.id === selectedProjectId);
  const selectedProjectStats = selectedProjectWithStats?.stats || {};
  
  const totalFundTransfers = selectedProjectStats.totalIncome || 0;
  const totalExpenses = selectedProjectStats.totalExpenses || 0;
  const totalReportsGenerated = selectedProjectStats.daysWithData || 0;
  const currentBalance = selectedProjectStats.currentBalance || 0;

  // Generate Reports Functions
  const generateDailyExpensesReport = async (reportType: string = "daily") => {
    if (!selectedProjectId || !dailyReportDate) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار مشروع وتاريخ",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const data = await apiRequest("GET", `/api/reports/daily-expenses/${selectedProjectId}/${dailyReportDate}`);
      setReportData(data);
      setActiveReportType(reportType);
      
      // حفظ بيانات التقرير في localStorage للاستخدام في إعدادات الطباعة
      setTimeout(() => {
        // محاولة التقاط HTML المُولّد
        let reportHTML = '';
        const reportElements = [
          document.getElementById('professional-report-content'),
          document.getElementById('daily-report-content'),
          document.querySelector('[data-report-content="daily_expenses"]'),
          document.querySelector('[data-report-content]'),
          document.querySelector('.daily-report-container'),
          document.querySelector('.professional-report-container')
        ];
        
        for (const element of reportElements) {
          if (element && element.innerHTML.trim()) {
            reportHTML = element.outerHTML;
            console.log('✅ تم التقاط HTML من:', element.id || element.className);
            break;
          }
        }
        
        const reportContext = {
          type: reportType === 'professional' ? 'daily_expenses' : 'daily_expenses',
          data: data,
          html: reportHTML,
          title: `كشف المصروفات اليومية - ${dailyReportDate}`,
          timestamp: Date.now(),
          hasRealData: true,
          projectName: selectedProject?.name || 'مشروع غير محدد',
          reportDate: dailyReportDate
        };
        localStorage.setItem('printReportContext', JSON.stringify(reportContext));
        console.log('💾 تم حفظ سياق التقرير مع HTML:', {
          title: reportContext.title,
          htmlLength: reportHTML.length
        });
      }, 500);
      
      toast({
        title: "تم إنشاء التقرير",
        description: `تم إنشاء كشف المصروفات ${reportType === 'professional' ? 'الاحترافي' : 'العادي'} بنجاح`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء التقرير",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWorkerAccountReport = async () => {
    if (!selectedWorkerId || !workerAccountDate1 || !workerAccountDate2) {
      let missingFields = [];
      if (!selectedWorkerId) missingFields.push("العامل");
      if (!workerAccountDate1) missingFields.push("تاريخ البداية");
      if (!workerAccountDate2) missingFields.push("تاريخ النهاية");
      
      toast({
        title: "بيانات ناقصة",
        description: `يرجى تحديد: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // إنشاء URL مع فلترة المشاريع
      let url = `/api/workers/${selectedWorkerId}/account-statement?dateFrom=${workerAccountDate1}&dateTo=${workerAccountDate2}`;
      
      // إضافة فلترة المشاريع إذا تم تحديدها، وإلا استخدام المشروع المحدد حالياً
      if (selectedWorkerProjectIds.length > 0) {
        // إضافة المشاريع المحددة
        const projectsQuery = selectedWorkerProjectIds.map(id => `projectIds=${id}`).join('&');
        url += `&${projectsQuery}`;
      } else if (selectedProjectId) {
        // إذا لم يتم تحديد مشاريع، استخدم المشروع المحدد حالياً
        url += `&projectId=${selectedProjectId}`;
      }
      
      const data = await apiRequest("GET", url);
      const reportDataExtended = { 
        ...data, 
        workerId: selectedWorkerId, 
        dateFrom: workerAccountDate1, 
        dateTo: workerAccountDate2,
        filteredProjects: selectedWorkerProjectIds.length > 0 ? 
          projects.filter(p => selectedWorkerProjectIds.includes(p.id)).map(p => p.name).join(', ') :
          'جميع المشاريع'
      };
      setReportData(reportDataExtended);
      setActiveReportType("worker");

      // حفظ بيانات التقرير في localStorage للاستخدام في إعدادات الطباعة
      setTimeout(() => {
        const worker = workers.find(w => w.id === selectedWorkerId);
        
        // محاولة التقاط HTML المُولّد
        let reportHTML = '';
        const reportElements = [
          document.querySelector('[data-report-content] .enhanced-worker-account-report'),
          document.querySelector('.enhanced-worker-account-report'),
          document.querySelector('.worker-statement-preview'),
          document.querySelector('[data-report-content]'),
          document.querySelector('.print-content')
        ];
        
        for (const element of reportElements) {
          if (element && element.innerHTML.trim()) {
            reportHTML = element.outerHTML;
            console.log('✅ تم التقاط HTML لكشف العامل من:', element.className);
            break;
          }
        }
        
        const reportContext = {
          type: 'worker_statement',
          data: reportDataExtended,
          html: reportHTML,
          title: `كشف حساب العامل - ${worker?.name || 'غير محدد'} (${workerAccountDate1} إلى ${workerAccountDate2})`,
          timestamp: Date.now(),
          hasRealData: true,
          projectName: selectedProject?.name || 'مشروع غير محدد',
          reportDate: `${workerAccountDate1} إلى ${workerAccountDate2}`,
          workerInfo: worker
        };
        localStorage.setItem('printReportContext', JSON.stringify(reportContext));
        console.log('💾 تم حفظ سياق كشف حساب العامل مع HTML:', {
          title: reportContext.title,
          htmlLength: reportHTML.length
        });
      }, 500);

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
    } finally {
      setIsGenerating(false);
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

    setIsGenerating(true);
    try {
      const data = await apiRequest("GET", `/api/reports/material-purchases/${selectedProjectId}?dateFrom=${materialReportDate1}&dateTo=${materialReportDate2}`);
      setReportData(data);
      setActiveReportType("materials");

      // حفظ بيانات التقرير في localStorage للاستخدام في إعدادات الطباعة
      setTimeout(() => {
        // محاولة التقاط HTML المُولّد
        let reportHTML = '';
        const reportElements = [
          document.querySelector('[data-report-content]'),
          document.querySelector('.material-purchases-report'),
          document.querySelector('.report-content'),
          document.querySelector('table')
        ];
        
        for (const element of reportElements) {
          if (element && element.innerHTML.trim()) {
            reportHTML = element.outerHTML;
            console.log('✅ تم التقاط HTML لتقرير المواد من:', element.className || element.tagName);
            break;
          }
        }
        
        const reportContext = {
          type: 'material_purchases',
          data: data,
          html: reportHTML,
          title: `تقرير مشتريات المواد (${materialReportDate1} إلى ${materialReportDate2})`,
          timestamp: Date.now(),
          hasRealData: true,
          projectName: selectedProject?.name || 'مشروع غير محدد',
          reportDate: `${materialReportDate1} إلى ${materialReportDate2}`
        };
        localStorage.setItem('printReportContext', JSON.stringify(reportContext));
        console.log('💾 تم حفظ سياق تقرير مشتريات المواد مع HTML:', {
          title: reportContext.title,
          htmlLength: reportHTML.length
        });
      }, 500);

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
      setIsGenerating(false);
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

    setIsGenerating(true);
    try {
      const data = await apiRequest("GET", `/api/reports/project-summary/${selectedProjectId}?dateFrom=${projectSummaryDate1}&dateTo=${projectSummaryDate2}`);
      setReportData(data);
      setActiveReportType("project");

      // حفظ بيانات التقرير في localStorage للاستخدام في إعدادات الطباعة
      setTimeout(() => {
        // محاولة التقاط HTML المُولّد
        let reportHTML = '';
        const reportElements = [
          document.querySelector('[data-report-content]'),
          document.querySelector('.project-summary-report'),
          document.querySelector('.advanced-report-content'),
          document.querySelector('.report-content'),
          document.querySelector('table')
        ];
        
        for (const element of reportElements) {
          if (element && element.innerHTML.trim()) {
            reportHTML = element.outerHTML;
            console.log('✅ تم التقاط HTML لملخص المشروع من:', element.className || element.tagName);
            break;
          }
        }
        
        const reportContext = {
          type: 'advanced_reports',
          data: data,
          html: reportHTML,
          title: `ملخص المشروع (${projectSummaryDate1} إلى ${projectSummaryDate2})`,
          timestamp: Date.now(),
          hasRealData: true,
          projectName: selectedProject?.name || 'مشروع غير محدد',
          reportDate: `${projectSummaryDate1} إلى ${projectSummaryDate2}`
        };
        localStorage.setItem('printReportContext', JSON.stringify(reportContext));
        console.log('💾 تم حفظ سياق ملخص المشروع مع HTML:', {
          title: reportContext.title,
          htmlLength: reportHTML.length
        });
      }, 500);

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
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWorkersSettlementReport = async () => {
    // إعادة تعيين الأخطاء والمؤشرات
    setSettlementErrors([]);
    resetSteps();
    
    // الخطوة 1: التحقق من البيانات
    startStep('validate');
    
    // تحديد المشاريع: إما المحددة يدوياً أو المشروع الحالي كافتراضي
    const projectIdsToUse = selectedSettlementProjectIds.length > 0 
      ? selectedSettlementProjectIds 
      : (selectedProjectId ? [selectedProjectId] : []);
    
    // إنشاء كائن البيانات للتحقق
    const formData = {
      projectIds: projectIdsToUse,
      dateFrom: settlementDateFrom || undefined,
      dateTo: settlementDateTo || undefined,
      workerIds: selectedWorkerIds
    };
    
    // تنفيذ التحقق الأساسي
    if (!projectIdsToUse.length) {
      errorStep('validate');
      setSettlementErrors([{
        field: 'projectIds',
        message: 'يجب اختيار مشروع واحد على الأقل',
        type: 'error'
      }]);
      
      toast({
        title: "خطأ في البيانات المدخلة",
        description: "يجب اختيار مشروع واحد على الأقل",
        variant: "destructive",
      });
      return;
    }
    
    // إكمال خطوة التحقق
    completeStep('validate');

    setIsGenerating(true);
    
    try {
      // الخطوة 2: جلب البيانات
      startStep('fetch-data');
      
      // بناء URL مع المعاملات
      let url = `/api/reports/workers-settlement`;
      const params = new URLSearchParams();
      
      // إضافة معرفات المشاريع
      params.append('projectIds', projectIdsToUse.join(','));
      
      if (settlementDateFrom) {
        params.append('dateFrom', settlementDateFrom);
      }
      if (settlementDateTo) {
        params.append('dateTo', settlementDateTo);
      }
      if (selectedWorkerIds.length > 0) {
        params.append('workerIds', selectedWorkerIds.join(','));
      }
      
      url += `?${params.toString()}`;

      console.log('📈 طلب تقرير تصفية العمال:', url);

      // تأخير طفيف لمحاكاة وقت الجلب
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const data = await apiRequest("GET", url);
      completeStep('fetch-data');
      
      // الخطوة 3: حساب الأرصدة
      startStep('calculate');
      await new Promise(resolve => setTimeout(resolve, 800));
      completeStep('calculate');
      
      // الخطوة 4: إنشاء التقرير
      startStep('generate-report');
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      setSettlementReportData(data);
      setActiveReportType("workers_settlement");
      completeStep('generate-report');

      // الخطوة 5: إنهاء المعالجة
      startStep('finalize');
      
      // حفظ بيانات التقرير في localStorage للاستخدام في إعدادات الطباعة
      setTimeout(() => {
        const projectNames = data.projects?.map((p: any) => p.name).join(', ') || 'مشاريع غير محددة';
        const reportContext = {
          type: 'workers_settlement',
          data: data,
          html: '', // سيتم إضافته عند الحاجة
          title: `تقرير تصفية العمال - ${projectNames}`,
          timestamp: Date.now(),
          hasRealData: true,
          projectName: projectNames,
          reportDate: settlementDateFrom && settlementDateTo ? 
            `${settlementDateFrom} إلى ${settlementDateTo}` : 'جميع الفترات'
        };
        localStorage.setItem('printReportContext', JSON.stringify(reportContext));
        console.log('💾 تم حفظ سياق تقرير تصفية العمال:', {
          title: reportContext.title,
          workersCount: data.workers?.length || 0
        });
      }, 300);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      completeStep('finalize');

      // مسح الأخطاء عند النجاح
      setSettlementErrors([]);

      toast({
        title: "تم إنشاء التقرير بنجاح! 🎉",
        description: `تم إنشاء تقرير لـ ${data.workers?.length || 0} عامل عبر ${data.projects?.length || 0} مشروع`,
      });
    } catch (error) {
      // تحديد الخطوة التي فشلت
      if (currentStepId) {
        errorStep(currentStepId);
      }
      
      console.error('❌ خطأ في إنشاء تقرير تصفية العمال:', error);
      
      // إنشاء رسالة خطأ مفصلة
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'حدث خطأ غير متوقع';
        
      const enhancedError = [{
        id: 'api-error',
        title: 'خطأ في الاتصال مع الخادم',
        message: errorMessage,
        type: 'error' as const,
        suggestion: 'تحقق من اتصال الإنترنت وحاول مرة أخرى. إذا استمر الخطأ، تواصل مع الدعم التقني.',
        action: {
          label: 'إعادة المحاولة',
          onClick: () => generateWorkersSettlementReport()
        },
        code: 'API_ERROR',
        timestamp: Date.now()
      }];
      
      setSettlementErrors(enhancedError);
      
      toast({
        title: "خطأ في إنشاء التقرير",
        description: "حدث خطأ أثناء إنشاء التقرير. راجع التفاصيل أدناه.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // تصدير احترافي جديد محسن
  const exportToProfessionalExcel = async (data: any, filename: string) => {
    if (!data) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات للتصدير",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // إنشاء مُصدّر Excel الاحترافي مع القالب النشط
      const exporter = new (UnifiedExcelExporter as any)(activeTemplate || {});
      
      // تحويل البيانات للنظام الاحترافي
      const enhancedData = await convertDataToEnhanced(data, activeReportType || 'daily');
      
      await exporter.exportToExcel(enhancedData, `${filename}-احترافي`);
      
      toast({
        title: "تم التصدير الاحترافي",
        description: "تم تصدير التقرير بالتصميم الاحترافي المحسن",
      });
    } catch (error) {
      console.error('خطأ في التصدير الاحترافي:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التصدير الاحترافي",
        variant: "destructive",
      });
    }
  };

  // دالة تصدير Excel البسيطة والفعالة
  const exportToExcel = async (data: any, filename: string) => {
    if (!data) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات للتصدير",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('📊 بدء تصدير التقرير إلى Excel:', { activeReportType, filename });
      
      // استيراد ExcelJS بشكل ديناميكي
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('التقرير');

      // إعداد الصفحة باللغة العربية مع تصحيح التشفير
      worksheet.views = [{ rightToLeft: true }];
      worksheet.pageSetup = {
        paperSize: 9, // A4
        orientation: 'landscape',
        margins: { left: 0.7, right: 0.7, top: 0.7, bottom: 0.7, header: 0.3, footer: 0.3 }
      };
      
      // إعداد خصائص المصنف للغة العربية
      workbook.creator = 'نظام إدارة البناء';
      workbook.lastModifiedBy = 'نظام إدارة البناء';
      workbook.created = new Date();
      workbook.modified = new Date();

      let currentRow = 1;

      // العنوان الرئيسي
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      const titleCell = worksheet.getCell(`A${currentRow}`);
      titleCell.value = getReportTitle(activeReportType || 'general');
      titleCell.font = { name: 'Arial Unicode MS', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A90E2' } };
      worksheet.getRow(currentRow).height = 35;
      currentRow += 2;

      // معلومات أساسية
      const projectInfoCell = worksheet.getCell(`A${currentRow}`);
      projectInfoCell.value = 'المشروع:';
      projectInfoCell.font = { name: 'Arial Unicode MS', bold: true };
      
      const projectNameCell = worksheet.getCell(`B${currentRow}`);
      projectNameCell.value = selectedProject?.name || 'جميع المشاريع';
      projectNameCell.font = { name: 'Arial Unicode MS' };
      
      const dateInfoCell = worksheet.getCell(`D${currentRow}`);
      dateInfoCell.value = 'تاريخ الإنشاء:';
      dateInfoCell.font = { name: 'Arial Unicode MS', bold: true };
      
      const dateValueCell = worksheet.getCell(`E${currentRow}`);
      dateValueCell.value = new Date().toLocaleDateString('ar-EG');
      dateValueCell.font = { name: 'Arial Unicode MS' };
      
      currentRow += 2;

      // تصدير البيانات حسب نوع التقرير
      if (activeReportType === 'daily' || activeReportType === 'professional') {
        await exportDailyReportData(data, worksheet, currentRow);
      } else if (activeReportType === 'worker') {
        await exportWorkerReportData(data, worksheet, currentRow);
      } else if (activeReportType === 'project') {
        await exportProjectReportData(data, worksheet, currentRow);
      } else {
        await exportGenericReportData(data, worksheet, currentRow);
      }

      // تصدير الملف مع التشفير الصحيح
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' 
      });
      
      // تحسين عملية التحميل لتجنب المشاكل
      const timestamp = new Date().toISOString().split('T')[0];
      const downloadName = `${filename}-${timestamp}.xlsx`;
      
      // تحميل الملف باستخدام المتصفحات الحديثة
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.download = downloadName;
      link.setAttribute('download', downloadName);
      document.body.appendChild(link);
      link.click();
      
      // تنظيف الذاكرة
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast({
        title: "تم التصدير",
        description: "تم تصدير التقرير إلى Excel بنجاح",
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

  // دالة مساعدة للحصول على عنوان التقرير
  const getReportTitle = (type: string) => {
    switch (type) {
      case 'daily': return 'تقرير المصروفات اليومية';
      case 'professional': return 'التقرير المحترف للمصروفات';
      case 'worker': return 'كشف حساب العامل';
      case 'project': return 'ملخص المشروع';
      case 'material': return 'تقرير مشتريات المواد';
      default: return 'تقرير عام';
    }
  };

  // دوال التصدير المختلفة
  const exportDailyReportData = async (data: any, worksheet: any, startRow: number) => {
    let currentRow = startRow;
    
    // رؤوس الجدول
    const headers = ['البيان', 'النوع', 'المبلغ', 'التاريخ', 'المشروع', 'ملاحظات'];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = header;
      cell.font = { name: 'Arial Unicode MS', size: 12, bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } };
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    currentRow++;

    // جمع جميع المعاملات
    const allTransactions: any[] = [];
    
    if (data.fundTransfers) {
      data.fundTransfers.forEach((t: any) => {
        allTransactions.push({
          description: t.description || 'تحويل عهدة',
          type: 'تحويل عهدة',
          amount: t.amount || 0,
          date: t.date || '',
          project: t.project_name || '',
          notes: t.notes || ''
        });
      });
    }

    if (data.workerAttendance) {
      data.workerAttendance.forEach((w: any) => {
        allTransactions.push({
          description: w.worker_name || 'عامل',
          type: 'أجور عمال',
          amount: w.total_amount || 0,
          date: w.expense_date || '',
          project: w.project_name || '',
          notes: w.notes || ''
        });
      });
    }

    if (data.materialPurchases) {
      data.materialPurchases.forEach((m: any) => {
        allTransactions.push({
          description: m.description || 'مشتريات',
          type: 'مشتريات مواد',
          amount: m.amount || 0,
          date: m.expense_date || '',
          project: m.project_name || '',
          notes: m.notes || ''
        });
      });
    }

    if (data.transportationExpenses) {
      data.transportationExpenses.forEach((t: any) => {
        allTransactions.push({
          description: t.description || 'نقل',
          type: 'نقل',
          amount: t.amount || 0,
          date: t.expense_date || '',
          project: t.project_name || '',
          notes: t.notes || ''
        });
      });
    }

    // إضافة البيانات إلى الجدول
    allTransactions.forEach((transaction) => {
      worksheet.getCell(currentRow, 1).value = transaction.description;
      worksheet.getCell(currentRow, 2).value = transaction.type;
      worksheet.getCell(currentRow, 3).value = transaction.amount;
      worksheet.getCell(currentRow, 4).value = transaction.date;
      worksheet.getCell(currentRow, 5).value = transaction.project;
      worksheet.getCell(currentRow, 6).value = transaction.notes;
      
      // تنسيق الخلايا
      for (let col = 1; col <= 6; col++) {
        const cell = worksheet.getCell(currentRow, col);
        cell.font = { name: 'Arial Unicode MS', size: 11 };
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (col === 3) { // عمود المبلغ
          cell.numFmt = '#,##0.00';
        }
      }
      currentRow++;
    });

    // الملخص
    currentRow += 2;
    const summaryTitleCell = worksheet.getCell(currentRow, 1);
    summaryTitleCell.value = 'الملخص:';
    summaryTitleCell.font = { name: 'Arial Unicode MS', bold: true, size: 14 };
    currentRow++;

    const incomeCell = worksheet.getCell(currentRow, 1);
    incomeCell.value = 'إجمالي الدخل:';
    incomeCell.font = { name: 'Arial Unicode MS', bold: true };
    const incomeValueCell = worksheet.getCell(currentRow, 2);
    incomeValueCell.value = data.totalIncome || 0;
    incomeValueCell.numFmt = '#,##0.00';
    incomeValueCell.font = { name: 'Arial Unicode MS' };
    currentRow++;

    const expensesCell = worksheet.getCell(currentRow, 1);
    expensesCell.value = 'إجمالي المصاريف:';
    expensesCell.font = { name: 'Arial Unicode MS', bold: true };
    const expensesValueCell = worksheet.getCell(currentRow, 2);
    expensesValueCell.value = data.totalExpenses || 0;
    expensesValueCell.numFmt = '#,##0.00';
    expensesValueCell.font = { name: 'Arial Unicode MS' };
    currentRow++;

    const balanceCell = worksheet.getCell(currentRow, 1);
    balanceCell.value = 'الرصيد النهائي:';
    balanceCell.font = { name: 'Arial Unicode MS', bold: true };
    const balanceValueCell = worksheet.getCell(currentRow, 2);
    balanceValueCell.value = (data.totalIncome || 0) - (data.totalExpenses || 0);
    balanceValueCell.numFmt = '#,##0.00';
    balanceValueCell.font = { name: 'Arial Unicode MS', bold: true, color: { argb: 'FF008000' } };
  };

  const exportWorkerReportData = async (data: any, worksheet: any, startRow: number) => {
    let currentRow = startRow;
    
    // معلومات العامل
    worksheet.getCell(currentRow, 1).value = 'اسم العامل:';
    worksheet.getCell(currentRow, 2).value = data.worker?.name || 'غير محدد';
    worksheet.getCell(currentRow, 4).value = 'من تاريخ:';
    worksheet.getCell(currentRow, 5).value = data.dateFrom || '';
    currentRow++;
    
    worksheet.getCell(currentRow, 4).value = 'إلى تاريخ:';
    worksheet.getCell(currentRow, 5).value = data.dateTo || '';
    currentRow += 2;

    // رؤوس الجدول
    const headers = ['التاريخ', 'المشروع', 'الوصف', 'المستحق', 'المدفوع', 'الرصيد'];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } };
    });
    currentRow++;

    // إضافة المعاملات
    if (data.transactions) {
      data.transactions.forEach((transaction: any) => {
        worksheet.getCell(currentRow, 1).value = transaction.date || '';
        worksheet.getCell(currentRow, 2).value = transaction.project_name || '';
        worksheet.getCell(currentRow, 3).value = transaction.description || '';
        worksheet.getCell(currentRow, 4).value = transaction.earned || 0;
        worksheet.getCell(currentRow, 5).value = transaction.paid || 0;
        worksheet.getCell(currentRow, 6).value = transaction.balance || 0;
        currentRow++;
      });
    }
  };

  const exportProjectReportData = async (data: any, worksheet: any, startRow: number) => {
    let currentRow = startRow;
    
    // معلومات المشروع
    worksheet.getCell(currentRow, 1).value = 'ملخص المشروع:';
    worksheet.getCell(currentRow, 1).font = { bold: true, size: 14 };
    currentRow += 2;

    worksheet.getCell(currentRow, 1).value = 'إجمالي الدخل:';
    worksheet.getCell(currentRow, 2).value = data.totalIncome || 0;
    currentRow++;

    worksheet.getCell(currentRow, 1).value = 'إجمالي المصاريف:';
    worksheet.getCell(currentRow, 2).value = data.totalExpenses || 0;
    currentRow++;

    worksheet.getCell(currentRow, 1).value = 'الرصيد النهائي:';
    worksheet.getCell(currentRow, 2).value = (data.totalIncome || 0) - (data.totalExpenses || 0);
    worksheet.getCell(currentRow, 2).font = { bold: true };
  };

  const exportGenericReportData = async (data: any, worksheet: any, startRow: number) => {
    worksheet.getCell(startRow, 1).value = 'البيانات العامة:';
    worksheet.getCell(startRow + 1, 1).value = JSON.stringify(data, null, 2);
  };

  // دالة تحويل البيانات للنظام الاحترافي
  const convertDataToEnhanced = async (data: any, reportType: string): Promise<any> => {
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    
    switch (reportType) {
      case 'daily':
      case 'professional':
        return {
          title: `التقرير اليومي - ${selectedProject?.name || 'غير محدد'}`,
          subtitle: `تاريخ التقرير: ${formatDate(new Date())}`,
          headers: ['البند', 'المبلغ', 'الملاحظات'],
          rows: [
            ['تحويلات العهدة', data.trustTransfers || 0, ''],
            ['أجور العمال', data.totalWages || 0, ''],
            ['المشتريات', data.totalPurchases || 0, ''],
            ['النقل', data.transportation || 0, ''],
            ['مصاريف متنوعة', data.miscellaneous || 0, ''],
            ['المهندسين', data.engineers || 0, ''],
          ],
          summary: [
            { label: 'إجمالي الإيرادات', value: (data.trustTransfers || 0) },
            { label: 'إجمالي المصروفات', value: (data.totalWages || 0) + (data.totalPurchases || 0) + (data.transportation || 0) + (data.miscellaneous || 0) + (data.engineers || 0) },
            { label: 'الرصيد النهائي', value: (data.trustTransfers || 0) - ((data.totalWages || 0) + (data.totalPurchases || 0) + (data.transportation || 0) + (data.miscellaneous || 0) + (data.engineers || 0)) }
          ],
          metadata: {
            reportType: 'تقرير يومي',
            projectName: selectedProject?.name || 'غير محدد',
            generatedBy: 'نظام إدارة مشاريع البناء'
          }
        };
        
      case 'worker':
        return {
          title: `كشف حساب العامل`,
          subtitle: `من ${formatDate(new Date())} إلى ${formatDate(new Date())}`,
          headers: ['التاريخ', 'المشروع', 'ساعات العمل', 'الأجر اليومي', 'المبلغ المستحق', 'المبلغ المدفوع', 'الرصيد'],
          rows: data.map((record: any) => [
            formatDate(record.date),
            record.project?.name || 'غير محدد',
            record.hoursWorked || 0,
            record.dailyWage || 0,
            record.amountOwed || 0,
            record.paidAmount || 0,
            record.balance || 0
          ]),
          summary: [
            { label: 'إجمالي الساعات', value: data.reduce((sum: number, record: any) => sum + (record.hoursWorked || 0), 0) },
            { label: 'إجمالي المستحق', value: data.reduce((sum: number, record: any) => sum + (record.amountOwed || 0), 0) },
            { label: 'إجمالي المدفوع', value: data.reduce((sum: number, record: any) => sum + (record.paidAmount || 0), 0) },
            { label: 'الرصيد النهائي', value: data.reduce((sum: number, record: any) => sum + (record.balance || 0), 0) }
          ],
          metadata: {
            reportType: 'كشف حساب عامل',
            generatedBy: 'نظام إدارة مشاريع البناء'
          }
        };

      case 'workers_settlement':
        return {
          title: `كشف تسوية العمال`,
          subtitle: `تقرير شامل لأرصدة العمال`,
          headers: ['اسم العامل', 'نوع العامل', 'إجمالي المستحق', 'إجمالي المدفوع', 'حوالات الأهل', 'الرصيد النهائي'],
          rows: data.map((worker: any) => [
            worker.name,
            worker.type || 'عامل',
            worker.totalOwed || 0,
            worker.totalPaid || 0,
            worker.totalTransfers || 0,
            worker.finalBalance || 0
          ]),
          summary: [
            { label: 'عدد العمال', value: data.length },
            { label: 'إجمالي المستحق', value: data.reduce((sum: number, worker: any) => sum + (worker.totalOwed || 0), 0) },
            { label: 'إجمالي المدفوع', value: data.reduce((sum: number, worker: any) => sum + (worker.totalPaid || 0), 0) },
            { label: 'إجمالي الحوالات', value: data.reduce((sum: number, worker: any) => sum + (worker.totalTransfers || 0), 0) },
            { label: 'إجمالي الأرصدة', value: data.reduce((sum: number, worker: any) => sum + (worker.finalBalance || 0), 0) }
          ],
          metadata: {
            reportType: 'كشف تسوية العمال',
            generatedBy: 'نظام إدارة مشاريع البناء'
          }
        };

      default:
        return {
          title: 'تقرير عام',
          subtitle: `تاريخ الإنشاء: ${formatDate(new Date())}`,
          headers: ['البيان', 'القيمة'],
          rows: Object.entries(data).map(([key, value]) => [key, value as string | number]),
          metadata: {
            reportType: 'تقرير عام',
            generatedBy: 'نظام إدارة مشاريع البناء'
          }
        };
    }
  };

  // دوال التصدير الجديدة باستخدام إعدادات القوالب المحدثة
  const exportDailyReportWithTemplate = async (exporter: any, data: any, filename: string) => {
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    
    const excelData = {
      headers: ['البند', 'المبلغ', 'الملاحظات'],
      rows: [
        ['تحويلات العهدة', formatCurrency(data.trustTransfers || 0), ''],
        ['أجور العمال', formatCurrency(data.totalWages || 0), ''],
        ['المشتريات', formatCurrency(data.totalPurchases || 0), ''],
        ['النقل', formatCurrency(data.transportation || 0), ''],
        ['مصاريف متنوعة', formatCurrency(data.miscellaneous || 0), ''],
        ['المهندسين', formatCurrency(data.engineers || 0), ''],
      ],
      title: `التقرير اليومي - ${selectedProject?.name || 'غير محدد'}`,
      subtitle: `التاريخ: ${dailyReportDate}`,
      summary: [
        { label: 'إجمالي الدخل', value: formatCurrency(data.totalIncome || 0) },
        { label: 'إجمالي المصاريف', value: formatCurrency(data.totalExpenses || 0) },
        { label: 'الرصيد', value: formatCurrency((data.totalIncome || 0) - (data.totalExpenses || 0)) }
      ]
    };

    await exporter.exportToExcel(excelData, filename);
  };

  const exportWorkerReportWithTemplate = async (exporter: any, data: any, filename: string) => {
    const worker = workers.find(w => w.id === selectedWorkerId);
    
    const excelData = {
      headers: ['التاريخ', 'الحضور', 'الأجر المستحق', 'المبلغ المدفوع', 'المتبقي'],
      rows: data.attendance?.map((record: any) => [
        formatDate(record.date),
        record.present ? 'حاضر' : 'غائب',
        formatCurrency(record.dailyWage || 0),
        formatCurrency(record.paidAmount || 0),
        formatCurrency((record.dailyWage || 0) - (record.paidAmount || 0))
      ]) || [],
      title: `كشف حساب العامل - ${worker?.name || 'غير محدد'}`,
      subtitle: `الفترة: ${workerAccountDate1} إلى ${workerAccountDate2}`,
      summary: [
        { label: 'إجمالي الأجور المستحقة', value: formatCurrency(data.totalEarned || 0) },
        { label: 'إجمالي المدفوع', value: formatCurrency(data.totalPaid || 0) },
        { label: 'الرصيد المتبقي', value: formatCurrency((data.totalEarned || 0) - (data.totalPaid || 0)) }
      ]
    };

    await exporter.exportToExcel(excelData, filename);
  };

  const exportWorkersSettlementWithTemplate = async (exporter: any, data: any, filename: string) => {
    const excelData = {
      headers: ['العامل', 'أيام العمل', 'إجمالي المستحق', 'إجمالي المدفوع', 'حوالات الأهل', 'الرصيد النهائي'],
      rows: data.workers?.map((worker: any) => [
        worker.worker_name,
        worker.total_work_days.toFixed(1),
        formatCurrency(worker.total_earned),
        formatCurrency(worker.total_paid),
        formatCurrency(worker.family_transfers),
        formatCurrency(worker.final_balance)
      ]) || [],
      title: 'تقرير تصفية العمال',
      subtitle: `${data.projects?.map((p: any) => p.name).join(', ') || 'مشاريع متعددة'}`,
      summary: [
        { label: 'إجمالي العمال', value: data.totals?.total_workers || 0 },
        { label: 'إجمالي أيام العمل', value: data.totals?.total_work_days?.toFixed(1) || '0' },
        { label: 'إجمالي المستحق', value: formatCurrency(data.totals?.total_earned || 0) },
        { label: 'إجمالي المدفوع', value: formatCurrency(data.totals?.total_paid || 0) },
        { label: 'الرصيد الإجمالي', value: formatCurrency(data.totals?.total_final_balance || 0) }
      ]
    };

    await exporter.exportToExcel(excelData, filename);
  };

  const exportGenericDataWithTemplate = async (exporter: any, data: any, filename: string) => {
    // تصدير عام للبيانات الأخرى
    const excelData = {
      headers: Object.keys(data).length > 0 ? Object.keys(data) : ['البيانات'],
      rows: [Object.values(data)],
      title: 'تقرير عام',
      subtitle: `تاريخ الإنشاء: ${new Date().toLocaleDateString('ar')}`
    };

    await exporter.exportToExcel(excelData, filename);
  };

  const exportDailyReportToExcel = async (data: any, filename: string) => {
    try {
      console.log('🔍 Starting Excel export with data:', data);
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('التقرير اليومي');

    // إعداد طباعة A4 محسن مع رأس وتذييل - إصلاح مشكلة الأرقام الكبيرة
    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      scale: 100, // تثبيت المقياس على 100% لمنع ظهور الأرقام الكبيرة
      margins: {
        left: 0.5, right: 0.5, top: 1.0, bottom: 1.0,
        header: 0.5, footer: 0.5
      },
      showGridLines: true,
      horizontalCentered: true,
      verticalCentered: false,
      printTitlesRow: '5:5' // تكرار رأس الجدول في كل صفحة
    };

    // إعداد اتجاه الكتابة من اليمين لليسار وتحسين العرض - إصلاح مشكلة التكبير
    worksheet.views = [{ 
      rightToLeft: true,
      showGridLines: true,
      showRowColHeaders: true,
      zoomScale: 100, // إصلاح: تثبيت التكبير على 100% لمنع ظهور الأرقام الكبيرة عند الطباعة
      state: 'normal'
    }];

    // رأس وتذييل الصفحة بتنسيق أفضل للطباعة
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    console.log('📊 Selected project for Excel:', selectedProject);
    console.log('📅 Report date for Excel:', dailyReportDate);
    
    // إعداد رأس وتذييل بسيط وواضح للطباعة
    
    // ضبط خصائص المصنف للعربية وإعدادات الطباعة المحسنة
    workbook.creator = 'نظام إدارة مشاريع البناء';
    workbook.lastModifiedBy = 'تصدير Excel';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // إعدادات إضافية للطباعة المحسنة
    workbook.calcProperties = {
      fullCalcOnLoad: true
    };
    
    // خصائص العرض المحسنة للطباعة
    workbook.views = [{
      x: 0, y: 0, width: 10000, height: 20000,
      firstSheet: 0, activeTab: 0, visibility: 'visible'
    }];

    // العنوان الرئيسي المحسن للطباعة
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'كشف المصروفات اليومية التفصيلي والشامل';
    titleCell.font = { 
      name: 'Arial', 
      size: 16, 
      bold: true, 
      color: { argb: 'FF000000' }
    };
    titleCell.alignment = { 
      horizontal: 'center', 
      vertical: 'middle', 
      wrapText: true
    };
    titleCell.fill = { 
      type: 'pattern', 
      pattern: 'solid', 
      fgColor: { argb: 'FFE8F4FD' }
    };
    titleCell.border = {
      top: { style: 'thick', color: { argb: 'FF1e40af' } },
      left: { style: 'thick', color: { argb: 'FF1e40af' } },
      bottom: { style: 'thick', color: { argb: 'FF1e40af' } },
      right: { style: 'thick', color: { argb: 'FF1e40af' } }
    };
    worksheet.getRow(1).height = 30;

    // معلومات المشروع والتاريخ محسنة للطباعة
    worksheet.mergeCells('A3:E3');
    const projectInfoCell = worksheet.getCell('A3');
    projectInfoCell.value = `المشروع: ${selectedProject?.name || 'غير محدد'}`;
    projectInfoCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF000000' } };
    projectInfoCell.alignment = { horizontal: 'right', vertical: 'middle' };
    projectInfoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
    projectInfoCell.border = {
      top: { style: 'thin', color: { argb: 'FF666666' } },
      left: { style: 'thin', color: { argb: 'FF666666' } },
      bottom: { style: 'thin', color: { argb: 'FF666666' } },
      right: { style: 'thin', color: { argb: 'FF666666' } }
    };

    worksheet.mergeCells('F3:I3');
    const dateInfoCell = worksheet.getCell('F3');
    dateInfoCell.value = `التاريخ: ${formatDate(dailyReportDate)} | رقم الكشف: ${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    dateInfoCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF000000' } };
    dateInfoCell.alignment = { horizontal: 'left', vertical: 'middle' };
    dateInfoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
    dateInfoCell.border = {
      top: { style: 'thin', color: { argb: 'FF666666' } },
      left: { style: 'thin', color: { argb: 'FF666666' } },
      bottom: { style: 'thin', color: { argb: 'FF666666' } },
      right: { style: 'thin', color: { argb: 'FF666666' } }
    };
    worksheet.getRow(3).height = 22;

    let currentRow = 5;

    // جدول العهدة والواردات المحسن
    if (data.fundTransfers && data.fundTransfers.length > 0) {
      // عنوان جدول العهدة
      worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
      const custodyHeader = worksheet.getCell(`A${currentRow}`);
      custodyHeader.value = 'جدول العهدة والواردات';
      custodyHeader.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF000000' } };
      custodyHeader.alignment = { horizontal: 'center', vertical: 'middle' };
      custodyHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
      custodyHeader.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF000000' } }
      };
      worksheet.getRow(currentRow).height = 30;
      currentRow++;

      // رؤوس جدول العهدة المحسنة
      const custodyHeaders = ['رقم', 'المبلغ (ر.ي)', 'اسم المرسل', 'رقم الحوالة', 'نوع التحويل', 'التاريخ', 'ملاحظات'];
      custodyHeaders.forEach((header, index) => {
        const cell = worksheet.getCell(currentRow, index + 1);
        cell.value = header;
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF000000' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } }, 
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } }, 
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });
      worksheet.getRow(currentRow).height = 25;
      currentRow++;

      // بيانات العهدة مع التنسيق المحسن
      data.fundTransfers.forEach((transfer: any, index: number) => {
        const row = worksheet.getRow(currentRow);
        
        row.getCell(1).value = index + 1;
        row.getCell(2).value = Number(transfer.amount) || 0;
        row.getCell(3).value = transfer.senderName || 'غير محدد';
        row.getCell(4).value = transfer.transferNumber || '-';
        row.getCell(5).value = transfer.transferType || 'نقدي';
        row.getCell(6).value = formatDate(transfer.transferDate || dailyReportDate);
        row.getCell(7).value = transfer.notes || '-';
        
        // تنسيق الخلايا المحسن
        for (let i = 1; i <= 7; i++) {
          const cell = row.getCell(i);
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
          if (i === 2) cell.numFmt = '#,##0.00'; // تنسيق الأرقام مع عشريين
          if (i % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf0f9ff' } };
          }
        }
        worksheet.getRow(currentRow).height = 20;
        currentRow++;
      });

      // إجمالي العهدة المحسن
      const totalCustodyRow = worksheet.getRow(currentRow);
      const totalCustodyAmount = data.fundTransfers.reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
      
      worksheet.mergeCells(`A${currentRow}:A${currentRow}`);
      totalCustodyRow.getCell(1).value = '📊';
      totalCustodyRow.getCell(2).value = totalCustodyAmount;
      worksheet.mergeCells(`C${currentRow}:G${currentRow}`);
      totalCustodyRow.getCell(3).value = '🔸 إجمالي العهدة والواردات';
      
      [1, 2, 3].forEach(i => {
        const cell = totalCustodyRow.getCell(i);
        cell.font = { name: 'Arial', size: 12, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfef3c7' } };
        cell.border = {
          top: { style: 'medium' }, left: { style: 'medium' },
          bottom: { style: 'medium' }, right: { style: 'medium' }
        };
      });
      totalCustodyRow.getCell(2).numFmt = '#,##0.00';
      worksheet.getRow(currentRow).height = 25;
      currentRow += 3;
    }

    // جدول المصروفات المحسن والشامل
    if ((data.workerAttendance && data.workerAttendance.length > 0) || 
        (data.materialPurchases && data.materialPurchases.length > 0) ||
        (data.transportationExpenses && data.transportationExpenses.length > 0)) {
      
      // عنوان جدول المصروفات
      worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
      const expensesHeader = worksheet.getCell(`A${currentRow}`);
      expensesHeader.value = '💸 جدول المصروفات التفصيلي';
      expensesHeader.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      expensesHeader.alignment = { horizontal: 'center', vertical: 'middle' };
      expensesHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFdc2626' } };
      worksheet.getRow(currentRow).height = 30;
      currentRow++;

      // رؤوس جدول المصروفات المحسنة
      const expenseHeaders = ['رقم', 'المبلغ (ر.ي)', 'اسم العامل/المادة', 'المهنة/النوع', 'الوصف', 'المورد', 'الكمية', 'تاريخ الصرف', 'ملاحظات'];
      expenseHeaders.forEach((header, index) => {
        const cell = worksheet.getCell(currentRow, index + 1);
        cell.value = header;
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFef4444' } };
        cell.border = {
          top: { style: 'medium' }, left: { style: 'medium' },
          bottom: { style: 'medium' }, right: { style: 'medium' }
        };
      });
      worksheet.getRow(currentRow).height = 30;
      currentRow++;

      let expenseNumber = 1;

      // أجور العمال المحسنة
      if (data.workerAttendance && data.workerAttendance.length > 0) {
        // قسم فرعي للعمال
        worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
        const workerSectionCell = worksheet.getCell(`A${currentRow}`);
        workerSectionCell.value = '👷‍♂️ أجور العمال والموظفين';
        workerSectionCell.font = { name: 'Arial', size: 12, bold: true };
        workerSectionCell.alignment = { horizontal: 'center', vertical: 'middle' };
        workerSectionCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfbbf24' } };
        worksheet.getRow(currentRow).height = 30;
        currentRow++;

        data.workerAttendance.forEach((attendance: any) => {
          const row = worksheet.getRow(currentRow);
          
          row.getCell(1).value = expenseNumber++;
          row.getCell(2).value = Number(attendance.paidAmount) || 0;
          row.getCell(3).value = attendance.workerName || attendance.worker?.name || 'عامل غير محدد';
          row.getCell(4).value = attendance.workerType || attendance.worker?.type || 'عامل';
          row.getCell(5).value = `${attendance.workDescription || 'عمل يومي'} | ساعات: ${attendance.workHours || 8} | أيام: ${attendance.workDays || 1}`;
          row.getCell(6).value = 'إدارة المشروع';
          row.getCell(7).value = `${attendance.workHours || 8} ساعة / ${attendance.workDays || 1} يوم`;
          row.getCell(8).value = formatDate(attendance.date || dailyReportDate);
          row.getCell(9).value = attendance.notes || '';
          
          // تنسيق خلايا العمال
          for (let i = 1; i <= 9; i++) {
            const cell = row.getCell(i);
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
              top: { style: 'thin' }, left: { style: 'thin' },
              bottom: { style: 'thin' }, right: { style: 'thin' }
            };
            if (i === 2) cell.numFmt = '#,##0.00';
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfef9e7' } };
          }
          worksheet.getRow(currentRow).height = 35; // زيادة ارتفاع الصف
          currentRow++;
        });
      }

      // مشتريات المواد المحسنة
      if (data.materialPurchases && data.materialPurchases.length > 0) {
        // قسم فرعي للمواد
        worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
        const materialSectionCell = worksheet.getCell(`A${currentRow}`);
        materialSectionCell.value = '🧱 مشتريات المواد والأدوات';
        materialSectionCell.font = { name: 'Arial', size: 12, bold: true };
        materialSectionCell.alignment = { horizontal: 'center', vertical: 'middle' };
        materialSectionCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8b5cf6' } };
        worksheet.getRow(currentRow).height = 30;
        currentRow++;

        data.materialPurchases.forEach((purchase: any) => {
          const row = worksheet.getRow(currentRow);
          
          row.getCell(1).value = expenseNumber++;
          row.getCell(2).value = Number(purchase.totalAmount) || 0;
          row.getCell(3).value = purchase.materialName || purchase.material?.name || 'مادة غير محددة';
          row.getCell(4).value = purchase.category || purchase.material?.category || 'مواد بناء';
          row.getCell(5).value = `${purchase.description || `شراء ${purchase.materialName || 'مادة'}`} | وحدة: ${purchase.unitPrice ? formatCurrency(purchase.unitPrice) : 'غير محدد'}`;
          row.getCell(6).value = purchase.supplierName || purchase.supplier?.name || 'مورد غير محدد';
          row.getCell(7).value = `${purchase.quantity || 0} ${purchase.unit || purchase.material?.unit || 'وحدة'}`;
          row.getCell(8).value = formatDate(purchase.purchaseDate || purchase.invoiceDate || dailyReportDate);
          row.getCell(9).value = `${purchase.notes || 'مشتريات'} | فاتورة: ${purchase.invoiceNumber || 'غير محدد'}`;
          
          // تنسيق خلايا المواد
          for (let i = 1; i <= 9; i++) {
            const cell = row.getCell(i);
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
              top: { style: 'thin' }, left: { style: 'thin' },
              bottom: { style: 'thin' }, right: { style: 'thin' }
            };
            if (i === 2) cell.numFmt = '#,##0.00';
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf3e8ff' } };
          }
          worksheet.getRow(currentRow).height = 35; // زيادة ارتفاع الصف
          currentRow++;
        });
      }

      // مصاريف النقل والمواصلات المحسنة
      if (data.transportationExpenses && data.transportationExpenses.length > 0) {
        // قسم فرعي للنقل  
        worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
        const transportSectionCell = worksheet.getCell(`A${currentRow}`);
        transportSectionCell.value = '🚛 مصاريف النقل والمواصلات';
        transportSectionCell.font = { name: 'Arial', size: 12, bold: true };
        transportSectionCell.alignment = { horizontal: 'center', vertical: 'middle' };
        transportSectionCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF06b6d4' } };
        worksheet.getRow(currentRow).height = 30;
        currentRow++;

        data.transportationExpenses.forEach((expense: any) => {
          const row = worksheet.getRow(currentRow);
          
          row.getCell(1).value = expenseNumber++;
          row.getCell(2).value = Number(expense.amount) || 0;
          row.getCell(3).value = expense.description || 'نقل ومواصلات';
          row.getCell(4).value = 'مواصلات';
          row.getCell(5).value = `${expense.description || 'نقل مواد أو عمال'}${expense.notes ? ' | ملاحظات: ' + expense.notes : ''}`;
          row.getCell(6).value = 'شركة نقل';
          row.getCell(7).value = '-';
          row.getCell(8).value = formatDate(expense.date || dailyReportDate);
          row.getCell(9).value = expense.notes || 'مصاريف نقل';
          
          // تنسيق خلايا النقل
          for (let i = 1; i <= 9; i++) {
            const cell = row.getCell(i);
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
              top: { style: 'thin' }, left: { style: 'thin' },
              bottom: { style: 'thin' }, right: { style: 'thin' }
            };
            if (i === 2) cell.numFmt = '#,##0.00';
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFecfeff' } };
          }
          worksheet.getRow(currentRow).height = 35; // زيادة ارتفاع الصف
          currentRow++;
        });
      }

      // التحويلات الصادرة لمشاريع أخرى المحسنة
      if (data.outgoingProjectTransfers && data.outgoingProjectTransfers.length > 0) {
        // قسم فرعي للتحويلات الصادرة
        worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
        const outgoingTransferSectionCell = worksheet.getCell(`A${currentRow}`);
        outgoingTransferSectionCell.value = '🔄 تحويلات صادرة لمشاريع أخرى';
        outgoingTransferSectionCell.font = { name: 'Arial', size: 12, bold: true };
        outgoingTransferSectionCell.alignment = { horizontal: 'center', vertical: 'middle' };
        outgoingTransferSectionCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFdc2626' } };
        worksheet.getRow(currentRow).height = 30;
        currentRow++;

        data.outgoingProjectTransfers.forEach((transfer: any) => {
          const row = worksheet.getRow(currentRow);
          
          row.getCell(1).value = expenseNumber++;
          row.getCell(2).value = Number(transfer.amount) || 0;
          row.getCell(3).value = transfer.toProjectName || transfer.projectName || 'مشروع غير محدد';
          row.getCell(4).value = 'تحويل مشروع';
          row.getCell(5).value = `تحويل أموال إلى مشروع: ${transfer.toProjectName || transfer.projectName || 'مشروع غير محدد'}${transfer.description ? ' | ' + transfer.description : ''}`;
          row.getCell(6).value = transfer.transferredBy || 'إدارة المشروع';
          row.getCell(7).value = '1 تحويل';
          row.getCell(8).value = formatDate(transfer.transferDate || dailyReportDate);
          row.getCell(9).value = `${transfer.transferNotes || transfer.notes || 'تحويل لمشروع'} | رقم المرجع: ${transfer.transferReference || transfer.transferNumber || 'غير محدد'}`;
          
          // تنسيق خلايا التحويلات الصادرة
          for (let i = 1; i <= 9; i++) {
            const cell = row.getCell(i);
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
              top: { style: 'thin' }, left: { style: 'thin' },
              bottom: { style: 'thin' }, right: { style: 'thin' }
            };
            if (i === 2) cell.numFmt = '#,##0.00';
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfce7e7' } };
          }
          worksheet.getRow(currentRow).height = 35; // زيادة ارتفاع الصف
          currentRow++;
        });
      }

      // نثريات العمال المحسنة - الإضافة الجديدة
      if (data.workerMiscExpenses && data.workerMiscExpenses.length > 0) {
        // قسم فرعي لنثريات العمال
        worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
        const miscExpensesSectionCell = worksheet.getCell(`A${currentRow}`);
        miscExpensesSectionCell.value = '💰 نثريات العمال';
        miscExpensesSectionCell.font = { name: 'Arial', size: 12, bold: true };
        miscExpensesSectionCell.alignment = { horizontal: 'center', vertical: 'middle' };
        miscExpensesSectionCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFa855f7' } };
        worksheet.getRow(currentRow).height = 30;
        currentRow++;

        data.workerMiscExpenses.forEach((expense: any) => {
          const row = worksheet.getRow(currentRow);
          
          row.getCell(1).value = expenseNumber++;
          row.getCell(2).value = Number(expense.amount) || 0;
          row.getCell(3).value = expense.workerName || expense.worker?.name || 'عامل غير محدد';
          row.getCell(4).value = 'نثريات';
          row.getCell(5).value = expense.description || 'نثريات متنوعة للعامل';
          row.getCell(6).value = 'إدارة المشروع';
          row.getCell(7).value = '-';
          row.getCell(8).value = formatDate(expense.date || dailyReportDate);
          row.getCell(9).value = expense.notes || 'نثريات عامل';
          
          // تنسيق خلايا نثريات العمال
          for (let i = 1; i <= 9; i++) {
            const cell = row.getCell(i);
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
              top: { style: 'thin' }, left: { style: 'thin' },
              bottom: { style: 'thin' }, right: { style: 'thin' }
            };
            if (i === 2) cell.numFmt = '#,##0.00';
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf3e8ff' } };
          }
          worksheet.getRow(currentRow).height = 35; // زيادة ارتفاع الصف
          currentRow++;
        });
      }

      // إجمالي المصروفات المحسن
      const totalExpenses = (data.workerAttendance?.reduce((sum: number, a: any) => sum + (Number(a.paidAmount) || 0), 0) || 0) +
                           (data.materialPurchases?.reduce((sum: number, p: any) => sum + (Number(p.totalAmount) || 0), 0) || 0) +
                           (data.transportationExpenses?.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0) || 0) +
                           (data.outgoingProjectTransfers?.reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0) || 0) +
                           (data.workerMiscExpenses?.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0) || 0);
      
      const totalExpensesRow = worksheet.getRow(currentRow);
      worksheet.mergeCells(`A${currentRow}:A${currentRow}`);
      totalExpensesRow.getCell(1).value = '💰';
      totalExpensesRow.getCell(2).value = totalExpenses;
      worksheet.mergeCells(`C${currentRow}:I${currentRow}`);
      totalExpensesRow.getCell(3).value = '🔸 إجمالي المصروفات اليومية';
      
      [1, 2, 3].forEach(i => {
        const cell = totalExpensesRow.getCell(i);
        cell.font = { name: 'Arial', size: 12, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFffe4e6' } };
        cell.border = {
          top: { style: 'medium' }, left: { style: 'medium' },
          bottom: { style: 'medium' }, right: { style: 'medium' }
        };
      });
      totalExpensesRow.getCell(2).numFmt = '#,##0.00';
      worksheet.getRow(currentRow).height = 25;
      currentRow += 3;
    }

    // الملخص المالي الشامل والمحسن
    const summaryStartRow = currentRow;
    worksheet.mergeCells(`A${summaryStartRow}:I${summaryStartRow}`);
    const summaryHeader = worksheet.getCell(`A${summaryStartRow}`);
    summaryHeader.value = 'الملخص المالي الشامل والنهائي';
    summaryHeader.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF000000' } };
    summaryHeader.alignment = { horizontal: 'center', vertical: 'middle' };
    summaryHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    summaryHeader.border = {
      top: { style: 'medium', color: { argb: 'FF000000' } },
      left: { style: 'medium', color: { argb: 'FF000000' } },
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'medium', color: { argb: 'FF000000' } }
    };
    worksheet.getRow(summaryStartRow).height = 35;
    currentRow++;

    // حسابات الملخص المالي المصححة
    const carriedForward = Number(data.carriedForward) || Number(data.summary?.carriedForward) || 0;
    const totalFundTransfers = (data.fundTransfers?.reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0) || 0);
    const totalIncomingTransfers = Number(data.totalIncomingTransfers) || 0;
    const totalIncome = carriedForward + totalFundTransfers + totalIncomingTransfers;
    
    const totalWorkerCosts = (data.workerAttendance?.reduce((sum: number, a: any) => sum + (Number(a.paidAmount) || 0), 0) || 0);
    const totalMaterialCosts = (data.materialPurchases?.reduce((sum: number, p: any) => sum + (Number(p.totalAmount) || 0), 0) || 0);
    const totalTransportCosts = (data.transportationExpenses?.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0) || 0);
    const totalWorkerMiscCosts = (data.workerMiscExpenses?.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0) || 0);
    const totalOutgoingTransfers = Number(data.totalOutgoingTransfers) || Number(data.totalTransferCosts) || 0;
    const totalExpensesFinal = totalWorkerCosts + totalMaterialCosts + totalTransportCosts + totalWorkerMiscCosts + totalOutgoingTransfers;
    
    const remainingBalance = totalIncome - totalExpensesFinal;

    // عرض تفاصيل الملخص بتنسيق مناسب للطباعة
    const summaryItems = [
      { label: 'الرصيد المرحل من اليوم السابق', value: carriedForward, type: 'income' },
      { label: 'تحويلات العهدة', value: totalFundTransfers, type: 'income' },
      { label: 'تحويلات واردة من مشاريع أخرى', value: totalIncomingTransfers, type: 'income' },
      { label: 'إجمالي الواردات', value: totalIncome, type: 'total-income' },
      { label: 'أجور العمال والموظفين', value: totalWorkerCosts, type: 'expense' },
      { label: 'مشتريات المواد والأدوات', value: totalMaterialCosts, type: 'expense' },
      { label: 'مصاريف النقل والمواصلات', value: totalTransportCosts, type: 'expense' },
      { label: 'نثريات العمال', value: totalWorkerMiscCosts, type: 'expense' },
      { label: 'تحويلات صادرة لمشاريع أخرى', value: totalOutgoingTransfers, type: 'expense' },
      { label: 'إجمالي المصروفات', value: totalExpensesFinal, type: 'total-expense' },
      { label: 'الرصيد المتبقي النهائي', value: remainingBalance, type: 'balance' }
    ];

    summaryItems.forEach((item, index) => {
      const row = worksheet.getRow(currentRow);
      
      worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
      row.getCell(1).value = item.label;
      worksheet.mergeCells(`H${currentRow}:I${currentRow}`);
      row.getCell(8).value = item.value;
      
      // تنسيق حسب نوع البيان - ألوان مناسبة للطباعة
      let bgColor = 'FFFFFFFF'; // أبيض
      if (item.type === 'income') bgColor = 'FFF5F5F5'; // رمادي فاتح
      else if (item.type === 'total-income') bgColor = 'FFE8E8E8'; // رمادي متوسط
      else if (item.type === 'expense') bgColor = 'FFF5F5F5'; // رمادي فاتح
      else if (item.type === 'total-expense') bgColor = 'FFE8E8E8'; // رمادي متوسط
      else if (item.type === 'balance') {
        bgColor = 'FFD8D8D8'; // رمادي أغمق للرصيد
      }
      
      [1, 8].forEach(i => {
        const cell = row.getCell(i);
        cell.font = { 
          name: 'Arial', 
          size: item.type.includes('total') || item.type === 'balance' ? 14 : 12, 
          bold: item.type.includes('total') || item.type === 'balance' 
        };
        cell.alignment = { horizontal: i === 1 ? 'right' : 'center', vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } }, 
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } }, 
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
        // تحسين تنسيق الأرقام لمنع ظهور الأرقام الكبيرة
        if (i === 8) {
          cell.numFmt = '#,##0.00';
          cell.alignment = { 
            horizontal: 'center', 
            vertical: 'middle',
            shrinkToFit: true, // تقليل حجم النص ليناسب الخلية
            wrapText: false
          };
        }
      });
      
      worksheet.getRow(currentRow).height = item.type.includes('total') || item.type === 'balance' ? 30 : 25;
      currentRow++;
    });

    // تذييل التقرير
    currentRow += 2;
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
    const footerCell = worksheet.getCell(`A${currentRow}`);
    footerCell.value = `تم إنشاء هذا التقرير بواسطة نظام إدارة مشاريع البناء | ${formatDate(new Date().toISOString().split('T')[0])} | ${new Date().toLocaleTimeString('en-GB', { hour12: false })}`;
    footerCell.font = { name: 'Arial', size: 10, italic: true };
    footerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    footerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf1f5f9' } };

    // ضبط عرض الأعمدة المحسن لاستغلال مساحة A4 بشكل أمثل
    worksheet.columns = [
      { width: 6 },   // رقم - مضغوط
      { width: 12 },  // المبلغ - مناسب للأرقام
      { width: 18 },  // الاسم - مناسب للأسماء العربية
      { width: 12 },  // المهنة/النوع - مضغوط
      { width: 30 },  // الوصف - موسع للنصوص الطويلة
      { width: 16 },  // المورد - مناسب
      { width: 10 },  // الكمية - مضغوط
      { width: 11 },  // التاريخ - مناسب للتواريخ
      { width: 25 }   // ملاحظات - موسع للملاحظات الطويلة
    ];

    // تطبيق التفاف النص على جميع الخلايا
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (!cell.alignment) cell.alignment = {};
        cell.alignment.wrapText = true;
      });
    });

    // حفظ الملف
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `تقرير-مصروفات-يومي-${selectedProject?.name || 'مشروع'}-${dailyReportDate}.xlsx`;
    link.click();
    
    } catch (error) {
      console.error('خطأ في تصدير Excel:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير التقرير إلى Excel",
        variant: "destructive",
      });
      throw error;
    }
  };

  const exportWorkerReportToExcel = async (data: any, filename: string) => {
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('كشف حساب العامل');

      // إعداد طباعة A4 احترافي محسن للغاية مع تحديد دقيق لمنطقة الطباعة
      worksheet.pageSetup = {
        paperSize: 9, // A4
        orientation: 'portrait',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        scale: 85, // تقليل المقياس لاستيعاب المزيد من البيانات
        margins: {
          left: 0.3, right: 0.3, top: 0.5, bottom: 0.5,
          header: 0.3, footer: 0.3
        },
        showGridLines: true,
        horizontalCentered: true,
        verticalCentered: false,
        printTitlesRow: '8:8' // تكرار رأس الجدول في كل صفحة
        // سنحدد منطقة الطباعة لاحقاً بناءً على البيانات الفعلية
      };

      // إعداد اتجاه الكتابة من اليمين لليسار مع تحسينات العرض
      worksheet.views = [{ 
        rightToLeft: true,
        showGridLines: true,
        showRowColHeaders: true,
        zoomScale: 85, // تقليل التكبير لعرض أفضل
        state: 'normal',
        showRuler: true
      }];

      // خصائص المصنف المحسنة
      workbook.creator = 'نظام إدارة مشاريع البناء المتطور';
      workbook.lastModifiedBy = 'كشف حساب العامل الاحترافي';
      workbook.created = new Date();
      workbook.modified = new Date();
      workbook.calcProperties = { fullCalcOnLoad: true };

      // استخراج البيانات
      const {
        worker = {},
        attendance = [],
        transfers = [],
        summary = {}
      } = data || {};

      // البحث عن بيانات العامل الفعلية
      const actualWorker = workers.find(w => w.id === data.workerId) || worker;
      const selectedProject = projects.find(p => p.id === selectedProjectId);

      // حساب الإحصائيات مع استخدام البيانات الحقيقية من قاعدة البيانات
      const calculateEarnedWage = (record: any) => {
        // استخدام الأجر الفعلي المحسوب من قاعدة البيانات
        return Number(record.actualWage) || Number(record.dailyWage) || 0;
      };

      const totalWorkingDays = attendance.reduce((sum: number, record: any) => sum + (Number(record.workDays) || 0), 0);
      const totalEarned = attendance.reduce((sum: number, record: any) => sum + calculateEarnedWage(record), 0);
      const totalPaid = attendance.reduce((sum: number, record: any) => sum + (Number(record.paidAmount) || 0), 0);
      const totalTransferred = transfers.reduce((sum: number, transfer: any) => sum + (Number(transfer.amount) || 0), 0);
      const currentBalance = totalPaid - totalTransferred;
      const remainingDue = totalEarned - totalPaid;

      // دالة تنسيق التاريخ بالإنجليزية
      const formatDateEN = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      // دالة تنسيق العملة بالأرقام الإنجليزية
      const formatCurrencyEN = (amount: number) => {
        const validAmount = isNaN(amount) || amount === null || amount === undefined ? 0 : Number(amount);
        return new Intl.NumberFormat('en-US', {
          style: 'decimal',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(validAmount) + ' YER';
      };

      // العنوان الرئيسي الاحترافي مع شعار
      worksheet.mergeCells('A1:L1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = '🏗️ كشف حساب العامل التفصيلي والشامل | نظام إدارة مشاريع البناء المتطور';
      titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      titleCell.fill = { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: 'FF1e40af' }
      };
      titleCell.border = {
        top: { style: 'thick', color: { argb: 'FF1e40af' } },
        left: { style: 'thick', color: { argb: 'FF1e40af' } },
        bottom: { style: 'thick', color: { argb: 'FF1e40af' } },
        right: { style: 'thick', color: { argb: 'FF1e40af' } }
      };
      worksheet.getRow(1).height = 35;

      // صف فاصل بسيط
      worksheet.getRow(2).height = 5;

      // هيدر معلومات العامل والمشروع المحسن (صف واحد مضغوط)
      worksheet.mergeCells('A3:L3');
      const headerInfoCell = worksheet.getCell('A3');
      headerInfoCell.value = 'بيانات العامل والمشروع الأساسية';
      headerInfoCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF374151' } };
      headerInfoCell.alignment = { horizontal: 'center', vertical: 'middle' };
      headerInfoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFe5e7eb' } };
      headerInfoCell.border = {
        top: { style: 'medium' }, left: { style: 'medium' },
        bottom: { style: 'medium' }, right: { style: 'medium' }
      };
      worksheet.getRow(3).height = 22;

      // معلومات العامل والمشروع في تخطيط مضغوط احترافي
      // الصف الأول: اسم العامل ومهنته والمشروع
      worksheet.getCell('A4').value = '👤 العامل:';
      worksheet.getCell('A4').font = { name: 'Arial', size: 10, bold: true };
      worksheet.getCell('A4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf3f4f6' } };
      
      worksheet.mergeCells('B4:C4');
      worksheet.getCell('B4').value = actualWorker.name || 'غير محدد';
      worksheet.getCell('B4').font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1f2937' } };
      worksheet.getCell('B4').alignment = { horizontal: 'center', vertical: 'middle' };

      worksheet.getCell('D4').value = '🛠️ المهنة:';
      worksheet.getCell('D4').font = { name: 'Arial', size: 10, bold: true };
      worksheet.getCell('D4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf3f4f6' } };
      
      worksheet.mergeCells('E4:F4');
      worksheet.getCell('E4').value = actualWorker.type || 'عامل';
      worksheet.getCell('E4').font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1f2937' } };
      worksheet.getCell('E4').alignment = { horizontal: 'center', vertical: 'middle' };

      worksheet.getCell('G4').value = '🏗️ المشروع:';
      worksheet.getCell('G4').font = { name: 'Arial', size: 10, bold: true };
      worksheet.getCell('G4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf3f4f6' } };
      
      worksheet.mergeCells('H4:L4');
      worksheet.getCell('H4').value = selectedProject?.name || 'غير محدد';
      worksheet.getCell('H4').font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1f2937' } };
      worksheet.getCell('H4').alignment = { horizontal: 'center', vertical: 'middle' };

      // الصف الثاني: الأجر اليومي والفترة وتاريخ الإصدار
      worksheet.getCell('A5').value = '💰 الأجر/يوم:';
      worksheet.getCell('A5').font = { name: 'Arial', size: 10, bold: true };
      worksheet.getCell('A5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfef3c7' } };
      
      worksheet.mergeCells('B5:C5');
      worksheet.getCell('B5').value = Number(actualWorker.dailyWage || 0).toLocaleString('en-US') + ' YER';
      worksheet.getCell('B5').font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF92400e' } };
      worksheet.getCell('B5').alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell('B5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfef3c7' } };

      worksheet.getCell('D5').value = '📅 الفترة:';
      worksheet.getCell('D5').font = { name: 'Arial', size: 10, bold: true };
      worksheet.getCell('D5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFdbeafe' } };
      
      worksheet.mergeCells('E5:H5');
      worksheet.getCell('E5').value = `${formatDateEN(data.dateFrom)} - ${formatDateEN(data.dateTo)}`;
      worksheet.getCell('E5').font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1e40af' } };
      worksheet.getCell('E5').alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell('E5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFdbeafe' } };

      worksheet.getCell('I5').value = '📋 تاريخ الإصدار:';
      worksheet.getCell('I5').font = { name: 'Arial', size: 10, bold: true };
      worksheet.getCell('I5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf0fdf4' } };
      
      worksheet.mergeCells('J5:L5');
      worksheet.getCell('J5').value = formatDateEN(new Date().toISOString().split('T')[0]);
      worksheet.getCell('J5').font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF059669' } };
      worksheet.getCell('J5').alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell('J5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf0fdf4' } };

      // إضافة حدود لجميع خلايا المعلومات
      for (let row = 4; row <= 5; row++) {
        for (let col = 1; col <= 12; col++) {
          const cell = worksheet.getCell(row, col);
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
          if (!cell.alignment) cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      }
      worksheet.getRow(4).height = 20;
      worksheet.getRow(5).height = 20;

      // فاصل قبل الجدول
      worksheet.getRow(6).height = 8;

      // عنوان قسم الحضور
      worksheet.mergeCells('A7:L7');
      const attendanceHeaderCell = worksheet.getCell('A7');
      attendanceHeaderCell.value = '📋 سجل الحضور والأجور التفصيلي';
      attendanceHeaderCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
      attendanceHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
      attendanceHeaderCell.fill = { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: 'FF059669' }
      };
      attendanceHeaderCell.border = {
        top: { style: 'thick' }, left: { style: 'thick' },
        bottom: { style: 'thick' }, right: { style: 'thick' }
      };
      worksheet.getRow(7).height = 25;

      // رؤوس جدول الحضور المحسنة والاحترافية مع رموز
      const headers = [
        { text: '#', icon: '🔢' },
        { text: 'التاريخ', icon: '📅' },
        { text: 'اليوم', icon: '📆' },
        { text: 'وصف العمل', icon: '⚒️' },
        { text: 'عدد الأيام', icon: '🗓️' },
        { text: 'ساعات العمل', icon: '⏰' },
        { text: 'الأجر المستحق', icon: '💰' },
        { text: 'المدفوع', icon: '✅' },
        { text: 'المتبقي', icon: '⏳' },
        { text: 'الحالة', icon: '📊' },
        { text: 'الكفاءة', icon: '⭐' },
        { text: 'ملاحظات', icon: '📝' }
      ];
      
      const headerRow = worksheet.getRow(8);
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = `${header.icon} ${header.text}`;
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        
        // ألوان متدرجة للرؤوس
        let bgColor = 'FF3b82f6';
        if (index < 3) bgColor = 'FF1e40af'; // الأعمدة الأساسية
        else if (index < 6) bgColor = 'FF3b82f6'; // أعمدة العمل
        else if (index < 9) bgColor = 'FF059669'; // الأعمدة المالية
        else bgColor = 'FFdc2626'; // أعمدة الحالة
        
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = {
          top: { style: 'medium' }, left: { style: 'thin' },
          bottom: { style: 'medium' }, right: { style: 'thin' }
        };
      });
      worksheet.getRow(8).height = 32;

      // بيانات الحضور الاحترافية المحسنة مع البيانات الحقيقية من قاعدة البيانات
      attendance.forEach((record: any, index: number) => {
        const row = worksheet.getRow(9 + index);
        // استخدام البيانات الحقيقية من قاعدة البيانات
        const workingDays = Number(record.workDays) || 1;
        const earnedWage = Number(record.actualWage) || 0;
        const paidAmount = Number(record.paidAmount) || 0;
        const remaining = earnedWage - paidAmount;
        
        // تحديد حالة الدفع مع رموز
        let status = '❌ غير مدفوع';
        let statusIcon = '❌';
        if (paidAmount >= earnedWage) {
          status = '✅ مدفوع كاملاً';
          statusIcon = '✅';
        } else if (paidAmount > 0) {
          status = '⚠️ مدفوع جزئياً';
          statusIcon = '⚠️';
        }

        // تحديد وصف الأيام مع رموز
        let daysDescription = workingDays.toString();
        let daysIcon = '📅';
        if (workingDays === 1) {
          daysDescription = '1.00 (يوم كامل)';
          daysIcon = '🟢';
        } else if (workingDays === 0.5) {
          daysDescription = '0.50 (نصف يوم)';
          daysIcon = '🟡';
        } else if (workingDays === 0.25) {
          daysDescription = '0.25 (ربع يوم)';
          daysIcon = '🟠';
        } else if (workingDays === 0.75) {
          daysDescription = '0.75 (ثلاثة أرباع)';
          daysIcon = '🔵';
        } else if (workingDays > 1) {
          daysDescription = `${workingDays.toFixed(2)} (عمل إضافي)`;
          daysIcon = '🔥';
        }

        // حساب كفاءة الأداء
        let efficiency = 'متوسط';
        let efficiencyIcon = '⭐';
        if (workingDays >= 1) {
          efficiency = 'ممتاز';
          efficiencyIcon = '🌟';
        } else if (workingDays >= 0.75) {
          efficiency = 'جيد جداً';
          efficiencyIcon = '✨';
        } else if (workingDays >= 0.5) {
          efficiency = 'جيد';
          efficiencyIcon = '⭐';
        } else {
          efficiency = 'ضعيف';
          efficiencyIcon = '❗';
        }

        // إعداد البيانات المفصلة
        row.getCell(1).value = index + 1;
        row.getCell(2).value = formatDateEN(record.date);
        row.getCell(3).value = new Date(record.date).toLocaleDateString('en-GB', { weekday: 'short' });
        // تحسين عرض وصف العمل مع التفاف النص
        const workDescCell = row.getCell(4);
        workDescCell.value = record.workDescription || 'عمل يومي حسب متطلبات المشروع';
        workDescCell.alignment = { 
          horizontal: 'right', 
          vertical: 'top', 
          wrapText: true,
          shrinkToFit: false
        };
        row.getCell(5).value = `${daysIcon} ${daysDescription}`;
        row.getCell(6).value = record.startTime && record.endTime ? 
          `${record.startTime}-${record.endTime}` : '8:00-16:00 (8ساعات)';
        row.getCell(7).value = Number(earnedWage.toFixed(0));
        row.getCell(8).value = Number(paidAmount.toFixed(0));
        row.getCell(9).value = Number(remaining.toFixed(0));
        row.getCell(10).value = status;
        row.getCell(11).value = `${efficiencyIcon} ${efficiency}`;
        row.getCell(12).value = record.notes || 
          (remaining > 0 ? 'يوجد مستحقات' : remaining < 0 ? 'دفع زائد' : 'مسوى');

        // تنسيق الخلايا المحسن
        for (let i = 1; i <= 12; i++) {
          const cell = row.getCell(i);
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFe5e7eb' } }, 
            left: { style: 'thin', color: { argb: 'FFe5e7eb' } },
            bottom: { style: 'thin', color: { argb: 'FFe5e7eb' } }, 
            right: { style: 'thin', color: { argb: 'FFe5e7eb' } }
          };
          
          // تنسيق الأرقام المالية
          if ([7, 8, 9].includes(i)) {
            cell.numFmt = '#,##0';
            cell.font = { name: 'Arial', size: 10, bold: true };
          } else {
            cell.font = { name: 'Arial', size: 9 };
          }
          
          // ألوان متطورة حسب الحالة والأداء
          let bgColor = index % 2 === 0 ? 'FFfafbfc' : 'FFFFFFFF';
          
          // ألوان خاصة للحالات المختلفة
          if (i === 10) { // عمود الحالة
            if (status.includes('مدفوع كاملاً')) bgColor = 'FFdcfce7';
            else if (status.includes('مدفوع جزئياً')) bgColor = 'FFfef3c7';
            else bgColor = 'FFfecaca';
          } else if (i === 11) { // عمود الكفاءة
            if (efficiency === 'ممتاز') bgColor = 'FFdcfce7';
            else if (efficiency === 'جيد جداً') bgColor = 'FFdbeafe';
            else if (efficiency === 'جيد') bgColor = 'FFfef3c7';
            else bgColor = 'FFfecaca';
          } else if ([7, 8, 9].includes(i)) { // الأعمدة المالية
            if (i === 9 && remaining > 0) bgColor = 'FFfef3c7'; // متبقي
            else if (i === 9 && remaining <= 0) bgColor = 'FFdcfce7'; // مسوى
            else if (i === 7) bgColor = 'FFe0f2fe'; // الأجر المستحق
            else if (i === 8) bgColor = 'FFf0fdf4'; // المدفوع
          } else if (i === 5) { // عمود عدد الأيام
            if (workingDays >= 1) bgColor = 'FFdcfce7';
            else if (workingDays >= 0.75) bgColor = 'FFdbeafe';
            else if (workingDays >= 0.5) bgColor = 'FFfef3c7';
            else bgColor = 'FFfecaca';
          }
          
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        }
        
        // تحديد ارتفاع الصف بناءً على طول وصف العمل
        const workDescription = record.workDescription || 'عمل يومي حسب متطلبات المشروع';
        let rowHeight = 30; // ارتفاع أساسي
        if (workDescription.length > 80) {
          rowHeight = 45; // للنصوص الطويلة جداً
        } else if (workDescription.length > 50) {
          rowHeight = 38; // للنصوص الطويلة
        } else if (workDescription.length > 30) {
          rowHeight = 32; // للنصوص المتوسطة
        }
        
        worksheet.getRow(9 + index).height = rowHeight;
      });

      let currentRow = 9 + attendance.length + 1;

      // صف الإجمالي الاحترافي المحسن مع إحصائيات شاملة
      worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
      const totalHeaderCell = worksheet.getCell(`A${currentRow}`);
      totalHeaderCell.value = '📊 الإجمالي والإحصائيات الشاملة';
      totalHeaderCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      totalHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
      totalHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366f1' } };
      totalHeaderCell.border = {
        top: { style: 'thick' }, left: { style: 'thick' },
        bottom: { style: 'thick' }, right: { style: 'thick' }
      };
      worksheet.getRow(currentRow).height = 25;
      currentRow++;

      // صف الإجمالي مع تفاصيل محسنة
      const totalRow = worksheet.getRow(currentRow);
      
      // حساب الكفاءة العامة
      const averageEfficiency = totalWorkingDays / attendance.length;
      let overallEfficiency = 'متوسط';
      if (averageEfficiency >= 0.9) overallEfficiency = 'ممتاز';
      else if (averageEfficiency >= 0.75) overallEfficiency = 'جيد جداً';
      else if (averageEfficiency >= 0.6) overallEfficiency = 'جيد';
      else overallEfficiency = 'يحتاج تحسين';

      // تحديد الحالة المالية الإجمالية
      let financialStatus = '';
      if (remainingDue > 0) financialStatus = '💸 يوجد مستحقات';
      else if (remainingDue < 0) financialStatus = '💰 دفع زائد';
      else financialStatus = '✅ مسوى بالكامل';

      totalRow.getCell(1).value = '📋 TOTAL';
      totalRow.getCell(2).value = `${attendance.length} يوم عمل`;
      totalRow.getCell(3).value = 'الفترة الكاملة';
      totalRow.getCell(4).value = 'مجموع الأعمال المنجزة';
      totalRow.getCell(5).value = `🗓️ ${Number(totalWorkingDays.toFixed(2))} يوم`;
      totalRow.getCell(6).value = `⏰ ${attendance.length * 8} ساعة`;
      totalRow.getCell(7).value = Number(totalEarned.toFixed(0));
      totalRow.getCell(8).value = Number(totalPaid.toFixed(0));
      totalRow.getCell(9).value = Number(remainingDue.toFixed(0));
      totalRow.getCell(10).value = financialStatus;
      totalRow.getCell(11).value = `⭐ ${overallEfficiency}`;
      totalRow.getCell(12).value = `المعدل: ${(averageEfficiency * 100).toFixed(1)}%`;

      for (let i = 1; i <= 12; i++) {
        const cell = totalRow.getCell(i);
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        
        // ألوان مختلفة للخلايا المختلفة
        let bgColor = 'FF6366f1';
        if ([7, 8, 9].includes(i)) bgColor = 'FF059669'; // الأعمدة المالية
        else if ([5, 6].includes(i)) bgColor = 'FF3b82f6'; // أعمدة الوقت
        else if ([10, 11, 12].includes(i)) bgColor = 'FFdc2626'; // أعمدة الحالة
        
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = {
          top: { style: 'medium' }, left: { style: 'medium' },
          bottom: { style: 'medium' }, right: { style: 'medium' }
        };
        
        if ([7, 8, 9].includes(i)) {
          cell.numFmt = '#,##0';
        }
      }
      worksheet.getRow(currentRow).height = 28;
      currentRow += 3;

      // جدول الحوالات إذا وجدت
      if (transfers && transfers.length > 0) {
        // عنوان قسم الحوالات
        worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
        const transferHeaderCell = worksheet.getCell(`A${currentRow}`);
        transferHeaderCell.value = 'سجل الحوالات المرسلة للأهل';
        transferHeaderCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
        transferHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
        transferHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFdc2626' } };
        transferHeaderCell.border = {
          top: { style: 'thick' }, left: { style: 'thick' },
          bottom: { style: 'thick' }, right: { style: 'thick' }
        };
        worksheet.getRow(currentRow).height = 25;
        currentRow++;

        // رؤوس جدول الحوالات
        const transferHeaders = ['م', 'تاريخ الحوالة', 'اسم المستلم', 'رقم الهاتف', 'طريقة التحويل', 'رقم الحوالة', 'مبلغ الحوالة'];
        const transferHeaderRow = worksheet.getRow(currentRow);
        transferHeaders.forEach((header, index) => {
          const cell = transferHeaderRow.getCell(index + 1);
          cell.value = header;
          cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFef4444' } };
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
        });
        worksheet.getRow(currentRow).height = 25;
        currentRow++;

        // بيانات الحوالات
        transfers.forEach((transfer: any, index: number) => {
          const row = worksheet.getRow(currentRow);
          
          row.getCell(1).value = index + 1;
          row.getCell(2).value = formatDateEN(transfer.transferDate);
          row.getCell(3).value = transfer.recipientName || 'غير محدد';
          row.getCell(4).value = transfer.recipientPhone || '-';
          row.getCell(5).value = transfer.transferMethod === 'hawaleh' ? 'حوالة' : 'تحويل';
          row.getCell(6).value = transfer.transferNumber || '-';
          row.getCell(7).value = Number(transfer.amount) || 0;

          for (let i = 1; i <= 7; i++) {
            const cell = row.getCell(i);
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
              top: { style: 'thin' }, left: { style: 'thin' },
              bottom: { style: 'thin' }, right: { style: 'thin' }
            };
            if (i === 7) cell.numFmt = '#,##0';
            cell.fill = { 
              type: 'pattern', 
              pattern: 'solid', 
              fgColor: { argb: index % 2 === 0 ? 'FFfef2f2' : 'FFFFFFFF' } 
            };
          }
          worksheet.getRow(currentRow).height = 22;
          currentRow++;
        });

        // إجمالي الحوالات
        const transferTotalRow = worksheet.getRow(currentRow);
        worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
        transferTotalRow.getCell(1).value = 'إجمالي الحوالات المرسلة';
        transferTotalRow.getCell(7).value = Number(totalTransferred.toFixed(0));

        for (let i = 1; i <= 7; i++) {
          const cell = transferTotalRow.getCell(i);
          cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFdc2626' } };
          cell.border = {
            top: { style: 'medium' }, left: { style: 'medium' },
            bottom: { style: 'medium' }, right: { style: 'medium' }
          };
          if (i === 7) cell.numFmt = '#,##0';
        }
        worksheet.getRow(currentRow).height = 25;
        currentRow += 2;
      }

      // الملخص المالي النهائي
      worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
      const summaryHeaderCell = worksheet.getCell(`A${currentRow}`);
      summaryHeaderCell.value = 'الملخص المالي النهائي والحساب الشامل';
      summaryHeaderCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      summaryHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
      summaryHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf59e0b' } };
      summaryHeaderCell.border = {
        top: { style: 'thick' }, left: { style: 'thick' },
        bottom: { style: 'thick' }, right: { style: 'thick' }
      };
      worksheet.getRow(currentRow).height = 25;
      currentRow++;

      // تفاصيل الملخص المالي
      const summaryItems = [
        { label: 'إجمالي عدد أيام العمل', value: totalWorkingDays.toFixed(2) + ' يوم', numValue: totalWorkingDays },
        { label: 'إجمالي الأجور المكتسبة', value: formatCurrencyEN(totalEarned), numValue: totalEarned },
        { label: 'إجمالي المبالغ المدفوعة', value: formatCurrencyEN(totalPaid), numValue: totalPaid },
        { label: 'المتبقي في ذمة الشركة', value: formatCurrencyEN(remainingDue), numValue: remainingDue },
        { label: 'إجمالي الحوالات المرسلة', value: formatCurrencyEN(totalTransferred), numValue: totalTransferred },
        { label: 'الرصيد النهائي للعامل', value: formatCurrencyEN(currentBalance), numValue: currentBalance }
      ];

      summaryItems.forEach((item, index) => {
        const row = worksheet.getRow(currentRow);
        
        worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
        row.getCell(1).value = item.label;
        worksheet.mergeCells(`I${currentRow}:J${currentRow}`);
        row.getCell(9).value = typeof item.numValue === 'number' ? item.numValue : item.value;
        
        // تنسيق حسب نوع البيان
        let bgColor = 'FFF8FAFC';
        if (item.label.includes('الرصيد النهائي')) {
          bgColor = item.numValue >= 0 ? 'FFE8F5E8' : 'FFFFE8E8';
        } else if (item.label.includes('المتبقي في ذمة')) {
          bgColor = item.numValue > 0 ? 'FFFFF3CD' : 'FFE8F5E8';
        }
        
        [1, 9].forEach(i => {
          const cell = row.getCell(i);
          cell.font = { name: 'Arial', size: 12, bold: true };
          cell.alignment = { horizontal: i === 1 ? 'right' : 'center', vertical: 'middle' };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
          if (i === 9 && typeof item.numValue === 'number' && item.label !== 'إجمالي عدد أيام العمل') {
            cell.numFmt = '#,##0';
          }
        });
        
        worksheet.getRow(currentRow).height = 22;
        currentRow++;
      });

      // تذييل التقرير الاحترافي المحسن
      currentRow += 2;
      
      // خط فاصل أنيق
      worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
      const separatorCell = worksheet.getCell(`A${currentRow}`);
      separatorCell.value = '━'.repeat(80);
      separatorCell.font = { name: 'Arial', size: 8, color: { argb: 'FF6b7280' } };
      separatorCell.alignment = { horizontal: 'center', vertical: 'middle' };
      separatorCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf9fafb' } };
      worksheet.getRow(currentRow).height = 8;
      currentRow++;

      // تذييل معلومات النظام المدمج
      worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
      const footerCell = worksheet.getCell(`A${currentRow}`);
      footerCell.value = `🏗️ نظام إدارة مشاريع البناء المتطور | ${formatDateEN(new Date().toISOString().split('T')[0])} ${new Date().toLocaleTimeString('en-GB', { hour12: false })} | تقرير احترافي A4`;
      footerCell.font = { name: 'Arial', size: 8, italic: true, color: { argb: 'FF6b7280' } };
      footerCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      footerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf8fafc' } };
      footerCell.border = {
        top: { style: 'thin', color: { argb: 'FFe5e7eb' } },
        left: { style: 'thin', color: { argb: 'FFe5e7eb' } },
        bottom: { style: 'thin', color: { argb: 'FFe5e7eb' } },
        right: { style: 'thin', color: { argb: 'FFe5e7eb' } }
      };
      worksheet.getRow(currentRow).height = 20;

      // ضبط عرض الأعمدة الاحترافي المحسن لاستغلال A4 بكامل طاقته
      worksheet.columns = [
        { width: 4 },   // # - مضغوط جداً
        { width: 9 },   // التاريخ - مضغوط للتواريخ
        { width: 6 },   // اليوم - مضغوط جداً
        { width: 32 },  // وصف العمل - موسع جداً للنصوص الطويلة
        { width: 10 },  // عدد الأيام - مناسب للأرقام والوصف
        { width: 11 },  // ساعات العمل - مناسب
        { width: 9 },   // الأجر المستحق - مضغوط للأرقام
        { width: 9 },   // المدفوع - مضغوط للأرقام
        { width: 9 },   // المتبقي - مضغوط للأرقام
        { width: 10 },  // الحالة - مناسب للحالات
        { width: 8 },   // الكفاءة - مضغوط
        { width: 16 }   // ملاحظات - متوسط للملاحظات
      ];

      // تطبيق التفاف النص على جميع الخلايا
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          if (!cell.alignment) cell.alignment = {};
          cell.alignment.wrapText = true;
        });
      });

      // تحديد منطقة الطباعة بناءً على البيانات الفعلية لمنع الصفحات الفارغة
      const lastDataRow = currentRow - 1; // آخر صف يحتوي على بيانات
      worksheet.pageSetup.printArea = `A1:L${lastDataRow}`;
      
      // تنظيف أي صفوف فارغة قد تسبب صفحات إضافية
      const maxRows = Math.max(1, lastDataRow);
      
      // ضبط خصائص الطباعة لمنع الصفحات الإضافية
      worksheet.pageSetup.printArea = `A1:L${maxRows}`;
      worksheet.pageSetup.horizontalCentered = true;
      worksheet.pageSetup.verticalCentered = false;

      // حفظ الملف
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const workerName = actualWorker.name || 'عامل';
      const projectName = selectedProject?.name || 'مشروع';
      link.download = `كشف-حساب-${workerName}-${projectName}-${data.dateFrom}-الى-${data.dateTo}.xlsx`;
      link.click();
      
    } catch (error) {
      console.error('خطأ في تصدير Excel لكشف العامل:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير كشف حساب العامل إلى Excel",
        variant: "destructive",
      });
      throw error;
    }
  };

  const exportWorkersSettlementToExcel = async (data: any, filename: string) => {
    try {
      console.log('🔍 بدء تصدير تقرير تصفية العمال إلى Excel:', data);
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('تقرير تصفية العمال');

      // إعداد الصفحة والخصائص
      worksheet.pageSetup = {
        paperSize: 9, // A4
        orientation: 'landscape', // أفقي لتناسب الجدول العريض
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        scale: 100,
        margins: { left: 0.5, right: 0.5, top: 1.0, bottom: 1.0, header: 0.5, footer: 0.5 },
        showGridLines: true,
        horizontalCentered: true,
        verticalCentered: false
      };

      worksheet.views = [{ 
        rightToLeft: true,
        showGridLines: true,
        zoomScale: 100,
        state: 'normal'
      }];

      // العنوان الرئيسي
      worksheet.mergeCells('A1:H1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'تقرير تصفية العمال الشامل';
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF000000' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F4FD' } };
      titleCell.border = {
        top: { style: 'thick', color: { argb: 'FF0891b2' } },
        left: { style: 'thick', color: { argb: 'FF0891b2' } },
        bottom: { style: 'thick', color: { argb: 'FF0891b2' } },
        right: { style: 'thick', color: { argb: 'FF0891b2' } }
      };
      worksheet.getRow(1).height = 30;

      // معلومات المشاريع والتاريخ
      worksheet.mergeCells('A3:D3');
      const projectCell = worksheet.getCell('A3');
      const projectNames = data.projects?.length > 1 
        ? `المشاريع (${data.projects.length}): ${data.projects.map((p: any) => p.name).join(', ')}`
        : `المشروع: ${data.projects?.[0]?.name || 'غير محدد'}`;
      projectCell.value = projectNames;
      projectCell.font = { name: 'Arial', size: 12, bold: true };
      projectCell.alignment = { horizontal: 'right' };
      projectCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };

      worksheet.mergeCells('E3:H3');
      const dateCell = worksheet.getCell('E3');
      const dateInfo = data.filters?.dateFrom && data.filters?.dateTo 
        ? `الفترة: ${formatDate(data.filters.dateFrom)} - ${formatDate(data.filters.dateTo)}`
        : `تاريخ الإنشاء: ${formatDate(data.generated_at)}`;
      dateCell.value = dateInfo;
      dateCell.font = { name: 'Arial', size: 12, bold: true };
      dateCell.alignment = { horizontal: 'left' };
      dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
      worksheet.getRow(3).height = 22;

      let currentRow = 5;

      // رأس الجدول
      const headers = [
        { text: '#', width: 5 },
        { text: 'اسم العامل', width: 20 },
        { text: 'نوع العامل', width: 15 },
        { text: 'إجمالي الأيام', width: 12 },
        { text: 'الاستحقاقات', width: 15 },
        { text: 'المدفوعات', width: 15 },
        { text: 'التحويلات', width: 15 },
        { text: 'الرصيد النهائي', width: 18 }
      ];

      headers.forEach((header, index) => {
        const cell = worksheet.getCell(currentRow, index + 1);
        cell.value = header.text;
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891b2' } };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF000000' } },
          left: { style: 'medium', color: { argb: 'FF000000' } },
          bottom: { style: 'medium', color: { argb: 'FF000000' } },
          right: { style: 'medium', color: { argb: 'FF000000' } }
        };
        worksheet.getColumn(index + 1).width = header.width;
      });
      worksheet.getRow(currentRow).height = 25;
      currentRow++;

      // بيانات العمال
      if (data.workers && data.workers.length > 0) {
        data.workers.forEach((worker: any, index: number) => {
          const isNegativeBalance = worker.final_balance < 0;
          const rowColor = isNegativeBalance ? 'FFFEF2F2' : (index % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC');

          const rowData = [
            index + 1,
            worker.worker_name,
            worker.worker_type,
            parseFloat(worker.total_work_days).toFixed(1),
            parseFloat(worker.total_earned).toFixed(2),
            parseFloat(worker.total_paid).toFixed(2),
            parseFloat(worker.total_transfers).toFixed(2),
            parseFloat(worker.final_balance).toFixed(2)
          ];

          rowData.forEach((value, colIndex) => {
            const cell = worksheet.getCell(currentRow, colIndex + 1);
            cell.value = value;
            cell.font = { 
              name: 'Arial', 
              size: 10, 
              bold: colIndex === 0 || colIndex === 1, // رقم التسلسل واسم العامل بخط عريض
              color: { argb: isNegativeBalance && colIndex === 7 ? 'FFDC2626' : 'FF000000' }
            };
            cell.alignment = { 
              horizontal: colIndex === 1 || colIndex === 2 ? 'right' : 'center',
              vertical: 'middle' 
            };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowColor } };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
              left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
              bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
              right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
            };

            // تنسيق خاص للأرقام المالية
            if (colIndex >= 4 && colIndex <= 7) {
              cell.numFmt = '#,##0.00"ر.ي"';
            }
          });
          worksheet.getRow(currentRow).height = 20;
          currentRow++;
        });
      }

      // صف الإجماليات
      const totalsRow = [
        '',
        `الإجمالي (${data.totals?.total_workers || 0} عامل)`,
        '',
        parseFloat(data.totals?.total_work_days || 0).toFixed(1),
        parseFloat(data.totals?.total_earned || 0).toFixed(2),
        parseFloat(data.totals?.total_paid || 0).toFixed(2),
        parseFloat(data.totals?.total_transfers || 0).toFixed(2),
        parseFloat(data.totals?.final_balance || 0).toFixed(2)
      ];

      worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
      totalsRow.forEach((value, colIndex) => {
        if (colIndex === 0) {
          const cell = worksheet.getCell(currentRow, 2); // الخلية المدموجة
          cell.value = totalsRow[1];
          cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0f766e' } };
        } else if (colIndex >= 3) {
          const cell = worksheet.getCell(currentRow, colIndex + 1);
          cell.value = value;
          cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0f766e' } };
          
          if (colIndex >= 4) {
            cell.numFmt = '#,##0.00"ر.ي"';
          }
        }
        
        // إضافة حدود لجميع الخلايا
        for (let i = 1; i <= 8; i++) {
          const cell = worksheet.getCell(currentRow, i);
          cell.border = {
            top: { style: 'thick', color: { argb: 'FF000000' } },
            left: { style: 'thick', color: { argb: 'FF000000' } },
            bottom: { style: 'thick', color: { argb: 'FF000000' } },
            right: { style: 'thick', color: { argb: 'FF000000' } }
          };
        }
      });
      worksheet.getRow(currentRow).height = 25;

      // ملاحظات أسفل الجدول
      currentRow += 2;
      worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
      const notesCell = worksheet.getCell(`A${currentRow}`);
      notesCell.value = '📋 ملاحظة: الأرقام الحمراء تشير إلى وجود رصيد سلبي (مديونية) للعامل';
      notesCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF6B7280' } };
      notesCell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // حفظ الملف
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // تحميل الملف
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ تم تصدير تقرير تصفية العمال إلى Excel بنجاح');
    } catch (error) {
      console.error('❌ خطأ في تصدير تقرير تصفية العمال:', error);
      throw error;
    }
  };

  const exportGenericDataToExcel = async (data: any, filename: string) => {
    // دالة تصدير عامة للبيانات الأخرى
    console.log('تصدير البيانات العامة قيد التطوير');
  };

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
      console.error('خطئ في التصدير:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تصدير التقرير",
        variant: "destructive",
      });
    }
  };

  const printReport = () => {
    try {
      console.log('🖨️ بدء عملية الطباعة للتقرير:', activeReportType);
      
      // إضافة CSS خاص بالطباعة
      const printStyle = document.createElement('style');
      printStyle.id = 'print-report-styles';
      printStyle.innerHTML = `
        @media print {
          /* إخفاء كل شيء عدا المحتوى */
          body * {
            visibility: hidden !important;
          }
          
          /* إظهار محتوى التقرير فقط */
          [data-report-content],
          [data-report-content] *,
          .print-content,
          .print-content *,
          .professional-report-container,
          .professional-report-container *,
          .enhanced-worker-account-report,
          .enhanced-worker-account-report *,
          .daily-report-container,
          .daily-report-container *,
          #workers-settlement-report,
          #workers-settlement-report * {
            visibility: visible !important;
          }
          
          /* تموضع المحتوى */
          [data-report-content],
          .print-content,
          .professional-report-container,
          .enhanced-worker-account-report,
          .daily-report-container,
          #workers-settlement-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 10mm !important;
            background: white !important;
            color: black !important;
            direction: rtl !important;
            font-family: Arial, sans-serif !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
          }
          
          /* تنسيق الجداول المحسن للطباعة */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 8mm 0 !important;
            font-size: 14px !important;
            min-width: 100% !important;
          }
          
          th, td {
            border: 2px solid #000 !important;
            padding: 4mm !important;
            text-align: center !important;
            font-size: 14px !important;
            color: #000 !important;
            background: white !important;
            white-space: nowrap !important;
            overflow: visible !important;
            word-wrap: break-word !important;
          }
          
          th {
            background: #e5e5e5 !important;
            font-weight: bold !important;
            font-size: 15px !important;
            color: #000 !important;
          }
          
          /* تحسين ترويسة الجدول */
          thead tr {
            background: #d0d0d0 !important;
          }
          
          /* صفوف بديلة */
          tbody tr:nth-child(even) {
            background: #f8f8f8 !important;
          }
          
          tbody tr:nth-child(odd) {
            background: white !important;
          }
          
          /* تنسيق العناوين المحسن */
          h1, h2, h3 {
            color: #000 !important;
            margin: 8mm 0 4mm 0 !important;
            break-after: avoid !important;
            font-size: 18px !important;
            font-weight: bold !important;
            text-align: center !important;
          }
          
          h1 {
            font-size: 22px !important;
            border-bottom: 3px solid #000 !important;
            padding-bottom: 2mm !important;
          }
          
          h2 {
            font-size: 18px !important;
            color: #333 !important;
          }
          
          /* معلومات المشروع والتاريخ */
          .project-info {
            font-size: 16px !important;
            margin: 5mm 0 !important;
            border: 1px solid #000 !important;
            padding: 3mm !important;
            background: #f5f5f5 !important;
          }
          
          /* إخفاء الأزرار */
          .no-print,
          button,
          .btn,
          [class*="button"] {
            display: none !important;
          }
          
          /* إعدادات الصفحة المحسنة */
          @page {
            size: A4 landscape;
            margin: 15mm 10mm;
          }
          
          /* تحسين النصوص العربية */
          * {
            font-family: 'Arial', 'Tahoma', sans-serif !important;
          }
          
          /* تحسين التباعد والتخطيط */
          .report-section {
            margin: 5mm 0 !important;
            page-break-inside: avoid !important;
          }
          
          /* تأكيد اتجاه RTL */
          [dir="rtl"], 
          [data-report-content] {
            direction: rtl !important;
            text-align: right !important;
          }
          
          /* إخفاء عناصر التفاعل */
          .interactive,
          .hover-effect,
          .transition,
          .shadow {
            display: none !important;
          }
        }
      `;
      
      document.head.appendChild(printStyle);
      
      // تأخير قصير للسماح للـ CSS بالتطبيق
      setTimeout(() => {
        window.print();
        
        // إزالة الـ CSS بعد الطباعة
        setTimeout(() => {
          const existingStyle = document.getElementById('print-report-styles');
          if (existingStyle) {
            existingStyle.remove();
          }
        }, 1000);
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

  // Render Daily Expenses Report
  const renderDailyExpensesReport = (data: any) => {
    if (!data) return null;

    const {
      fundTransfers = [],
      workerAttendance = [],
      materialPurchases = [],
      transportationExpenses = [],
      workerTransfers = [],
      carriedForward = 0,
      totalFundTransfers = 0,
      totalWorkerCosts = 0,
      totalMaterialCosts = 0,
      totalTransportCosts = 0,
      totalTransferCosts = 0,
      totalExpenses = 0,
      totalIncome = 0,
      remainingBalance = 0
    } = data;

    const selectedProject = projects.find(p => p.id === selectedProjectId);

    return (
      <div className="print-content invoice-preview daily-report-container bg-white w-full" dir="rtl" style={{margin: 0, padding: 0}} data-report-content="daily-expenses">
        {/* Compact Professional Header */}
        <div className="relative professional-gradient print-header text-white preserve-color" style={{padding: '20px 15px'}}>
          <div className="flex justify-between items-center">
            {/* Company Info - Compact */}
            <div className="flex items-center gap-3">
              <div className="company-logo w-12 h-12 bg-white bg-opacity-20 rounded flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">نظام إدارة البناء</h1>
                <p className="text-cyan-100 text-xs">Building Management System</p>
              </div>
            </div>
            
            {/* Invoice Title */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">كشف مصروفات</h2>
              <p className="text-cyan-100 text-xs">DAILY EXPENSE REPORT</p>
            </div>

            {/* Project Info - Compact */}
            <div className="text-left text-sm">
              <div>
                <span className="text-cyan-100">رقم الكشف:</span>
                <p className="font-bold">{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</p>
              </div>
              <div>
                <span className="text-cyan-100">التاريخ:</span>
                <p className="font-bold">{formatDate(dailyReportDate)}</p>
              </div>
            </div>
          </div>

          {/* Project Name Row */}
          <div className="mt-4 text-center">
            <p className="font-bold text-lg">المشروع: {selectedProject?.name || 'غير محدد'}</p>
          </div>
        </div>

        {/* Main Content - Single Page Layout */}
        <div style={{padding: '5px 3px'}}>
          {/* Main Summary Table - Compact */}
          <table className="invoice-table w-full border-collapse" style={{fontSize: '10px', lineHeight: '1.1', pageBreakInside: 'avoid'}}>
            <thead>
              <tr className="professional-gradient preserve-color text-white">
                <th className="px-1 py-1 text-center font-bold border border-white" style={{width: '5%'}}>م.</th>
                <th className="px-2 py-1 text-right font-bold border border-white" style={{width: '50%'}}>وصف البند</th>
                <th className="px-1 py-1 text-center font-bold border border-white" style={{width: '15%'}}>السعر</th>
                <th className="px-1 py-1 text-center font-bold border border-white" style={{width: '10%'}}>الكمية</th>
                <th className="px-1 py-1 text-center font-bold border border-white" style={{width: '20%'}}>المجموع</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr className="odd:bg-gray-50 even:bg-white">
                <td className="px-1 py-1 text-center font-medium border">01</td>
                <td className="px-2 py-1 text-right border">الرصيد المرحل من اليوم السابق</td>
                <td className="px-1 py-1 text-center font-bold border">{formatCurrency(carriedForward)}</td>
                <td className="px-1 py-1 text-center border">1</td>
                <td className="px-1 py-1 text-center font-bold border">{formatCurrency(carriedForward)}</td>
              </tr>
              <tr className="odd:bg-gray-50 even:bg-white">
                <td className="px-1 py-1 text-center font-medium border">02</td>
                <td className="px-2 py-1 text-right border">تحويلات العهدة</td>
                <td className="px-1 py-1 text-center font-bold border">{formatCurrency(totalIncome)}</td>
                <td className="px-1 py-1 text-center border">{fundTransfers.length}</td>
                <td className="px-1 py-1 text-center font-bold border">{formatCurrency(totalIncome)}</td>
              </tr>
              {/* إضافة صف ترحيل الأموال الواردة */}
              {data.incomingProjectTransfers && data.incomingProjectTransfers.length > 0 && (
                <tr className="odd:bg-gray-50 even:bg-white">
                  <td className="px-1 py-1 text-center font-medium border">02أ</td>
                  <td className="px-2 py-1 text-right border">ترحيل أموال واردة من مشاريع أخرى</td>
                  <td className="px-1 py-1 text-center font-bold border">{formatCurrency(data.totalIncomingTransfers || 0)}</td>
                  <td className="px-1 py-1 text-center border">{data.incomingProjectTransfers.length}</td>
                  <td className="px-1 py-1 text-center font-bold border">{formatCurrency(data.totalIncomingTransfers || 0)}</td>
                </tr>
              )}
              {/* إضافة صف ترحيل الأموال الصادرة */}
              {data.outgoingProjectTransfers && data.outgoingProjectTransfers.length > 0 && (
                <tr className="odd:bg-gray-50 even:bg-white" style={{color: 'red'}}>
                  <td className="px-1 py-1 text-center font-medium border">02ب</td>
                  <td className="px-2 py-1 text-right border">ترحيل أموال صادرة إلى مشاريع أخرى</td>
                  <td className="px-1 py-1 text-center font-bold border">{formatCurrency(data.totalOutgoingTransfers || 0)}</td>
                  <td className="px-1 py-1 text-center border">{data.outgoingProjectTransfers.length}</td>
                  <td className="px-1 py-1 text-center font-bold border">{formatCurrency(data.totalOutgoingTransfers || 0)}</td>
                </tr>
              )}
              <tr className="odd:bg-gray-50 even:bg-white">
                <td className="px-1 py-1 text-center font-medium border">03</td>
                <td className="px-2 py-1 text-right border">أجور العمال</td>
                <td className="px-1 py-1 text-center font-bold border">{formatCurrency(totalWorkerCosts)}</td>
                <td className="px-1 py-1 text-center border">{workerAttendance.length}</td>
                <td className="px-1 py-1 text-center font-bold border">{formatCurrency(totalWorkerCosts)}</td>
              </tr>
              <tr className="odd:bg-gray-50 even:bg-white">
                <td className="px-1 py-1 text-center font-medium border">04</td>
                <td className="px-2 py-1 text-right border">مشتريات المواد</td>
                <td className="px-1 py-1 text-center font-bold border">{formatCurrency(totalMaterialCosts)}</td>
                <td className="px-1 py-1 text-center border">{materialPurchases.length}</td>
                <td className="px-1 py-1 text-center font-bold border">{formatCurrency(totalMaterialCosts)}</td>
              </tr>
              <tr className="odd:bg-gray-50 even:bg-white">
                <td className="px-1 py-1 text-center font-medium border">05</td>
                <td className="px-2 py-1 text-right border">مصاريف النقل والتشغيل</td>
                <td className="px-1 py-1 text-center font-bold border">{formatCurrency(totalTransportCosts)}</td>
                <td className="px-1 py-1 text-center border">{transportationExpenses.length}</td>
                <td className="px-1 py-1 text-center font-bold border">{formatCurrency(totalTransportCosts)}</td>
              </tr>
            </tbody>
          </table>



          {/* Ultra Compact Summary - One Line */}
          <div className="flex justify-between items-center mt-2 text-xs" style={{padding: '2px 0'}}>
            <span>المجموع الفرعي: <strong>{formatCurrency(totalIncome + carriedForward)}</strong></span>
            <span>المصروفات: <strong>{formatCurrency(totalExpenses)}</strong></span>
            <span className="professional-gradient text-white px-3 py-1 rounded preserve-color font-bold">
              الرصيد النهائي: {formatCurrency(remainingBalance)}
            </span>
          </div>

          {/* Ultra Compact Footer with Payment & Signature */}
          <div className="flex justify-between items-center mt-3" style={{fontSize: '9px'}}>
            <div className="flex gap-4">
              <span>حساب: 000000000</span>
              <span>البنك المحلي</span>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-400 w-20 mb-1"></div>
              <span>توقيع المسؤول</span>
            </div>
          </div>

          {/* Minimal Footer */}
          <div className="professional-gradient preserve-color text-white p-1 text-center mt-2" style={{fontSize: '9px'}}>
            <span className="font-bold">نظام إدارة المشاريع الهندسية والإنشائية - الهاتف / العنوان / الموقع</span>
          </div>
        </div>
      </div>
    );
  };

  // Placeholder functions for other report types
  const renderWorkerAccountReport = (data: any) => {
    if (!data || !selectedProject) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600">لا توجد بيانات لعرض التقرير</p>
        </div>
      );
    }

    return (
      <div className="print-preview worker-statement-preview" data-report-content="worker-statement">
        <EnhancedWorkerAccountStatement
          data={data}
          selectedProject={selectedProject}
          workerId={data.workerId}
          dateFrom={data.dateFrom}
          dateTo={data.dateTo}
        />
      </div>
    );
  };

  const renderMaterialPurchasesReport = (data: any) => (
    <div className="text-center py-8">
      <p className="text-gray-600">تقرير مشتريات المواد - قيد التطوير</p>
    </div>
  );

  const renderProjectSummaryReport = (data: any) => {
    if (!data || !data.project) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600">لا توجد بيانات لعرض التقرير</p>
        </div>
      );
    }

    const { project, summary, details, dateFrom, dateTo } = data;
    
    return (
      <div className="project-summary-report print-preview" data-report-content="project-summary">
        {/* رأس التقرير */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-2xl mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <PieChart className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">ملخص المشروع المالي</h2>
                <p className="text-purple-100">{project.name}</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-purple-100 text-sm">الفترة المالية</p>
              <p className="font-bold">{formatDate(dateFrom)} - {formatDate(dateTo)}</p>
            </div>
          </div>
        </div>

        {/* الإحصائيات الرئيسية */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* إجمالي الإيرادات */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium mb-1">إجمالي الإيرادات</p>
                  <p className="text-3xl font-bold text-green-900">{formatCurrency(summary.totalIncome)}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 text-sm">تحويلات العهدة</span>
                  </div>
                </div>
                <div className="p-4 bg-green-500/10 rounded-2xl">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* إجمالي المصروفات */}
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium mb-1">إجمالي المصروفات</p>
                  <p className="text-3xl font-bold text-red-900">{formatCurrency(summary.totalExpenses)}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Target className="h-4 w-4 text-red-500" />
                    <span className="text-red-600 text-sm">جميع التكاليف</span>
                  </div>
                </div>
                <div className="p-4 bg-red-500/10 rounded-2xl">
                  <Receipt className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الرصيد الصافي */}
          <Card className={`bg-gradient-to-br ${summary.netBalance >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${summary.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'} text-sm font-medium mb-1`}>الرصيد الصافي</p>
                  <p className={`text-3xl font-bold ${summary.netBalance >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>{formatCurrency(summary.netBalance)}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {summary.netBalance >= 0 ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                    )}
                    <span className={`${summary.netBalance >= 0 ? 'text-green-600' : 'text-orange-600'} text-sm`}>
                      {summary.netBalance >= 0 ? 'ربح' : 'عجز'}
                    </span>
                  </div>
                </div>
                <div className={`p-4 ${summary.netBalance >= 0 ? 'bg-blue-500/10' : 'bg-orange-500/10'} rounded-2xl`}>
                  <BarChart3 className={`h-8 w-8 ${summary.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* تفصيل المصروفات */}
        <Card className="mb-8">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Grid3X3 className="h-6 w-6" />
              تفصيل المصروفات حسب الفئة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* تكاليف العمال */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-6 w-6 text-indigo-600" />
                  <span className="text-2xl font-bold text-indigo-900">{formatCurrency(summary.totalWorkerCosts)}</span>
                </div>
                <p className="text-indigo-700 text-sm font-medium">أجور العمال</p>
                <p className="text-indigo-500 text-xs mt-1">{details.workerAttendance?.length || 0} سجل حضور</p>
              </div>

              {/* تكاليف المواد */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <Package className="h-6 w-6 text-amber-600" />
                  <span className="text-2xl font-bold text-amber-900">{formatCurrency(summary.totalMaterialCosts)}</span>
                </div>
                <p className="text-amber-700 text-sm font-medium">مشتريات المواد</p>
                <p className="text-amber-500 text-xs mt-1">{details.materialPurchases?.filter((p: any) => p.purchaseType === "نقد").length || 0} مشترى نقدي</p>
              </div>

              {/* مصاريف النقل */}
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-xl border border-teal-200">
                <div className="flex items-center justify-between mb-2">
                  <ExternalLink className="h-6 w-6 text-teal-600" />
                  <span className="text-2xl font-bold text-teal-900">{formatCurrency(summary.totalTransportCosts)}</span>
                </div>
                <p className="text-teal-700 text-sm font-medium">النقل والتشغيل</p>
                <p className="text-teal-500 text-xs mt-1">{details.transportationExpenses?.length || 0} مصروف نقل</p>
              </div>

              {/* تحويلات العمال */}
              <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-4 rounded-xl border border-rose-200">
                <div className="flex items-center justify-between mb-2">
                  <Share2 className="h-6 w-6 text-rose-600" />
                  <span className="text-2xl font-bold text-rose-900">{formatCurrency(summary.totalTransferCosts)}</span>
                </div>
                <p className="text-rose-700 text-sm font-medium">حوالات العمال</p>
                <p className="text-rose-500 text-xs mt-1">{details.workerTransfers?.length || 0} حوالة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* تفاصيل إضافية */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* تحويلات العهدة */}
          <Card>
            <CardHeader className="bg-green-50 border-b">
              <CardTitle className="text-lg font-bold text-green-800 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                تحويلات العهدة ({details.fundTransfers?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {details.fundTransfers?.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {details.fundTransfers.slice(0, 5).map((transfer: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm">{transfer.senderName || 'غير محدد'}</p>
                        <p className="text-xs text-gray-500">{formatDate(transfer.transferDate)}</p>
                      </div>
                      <span className="font-bold text-green-600">{formatCurrency(transfer.amount)}</span>
                    </div>
                  ))}
                  {details.fundTransfers.length > 5 && (
                    <p className="text-center text-gray-500 text-sm">...و {details.fundTransfers.length - 5} تحويل آخر</p>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">لا توجد تحويلات في هذه الفترة</p>
              )}
            </CardContent>
          </Card>

          {/* ملخص الأداء */}
          <Card>
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="text-lg font-bold text-blue-800 flex items-center gap-2">
                <Target className="h-5 w-5" />
                مؤشرات الأداء
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">نسبة المصروفات للإيرادات</span>
                  <span className="font-bold">{summary.totalIncome > 0 ? ((summary.totalExpenses / summary.totalIncome) * 100).toFixed(1) : '0'}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">متوسط التكلفة اليومية</span>
                  <span className="font-bold">{formatCurrency(summary.totalExpenses / Math.max(1, Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24))))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">نسبة أجور العمال</span>
                  <span className="font-bold">{summary.totalExpenses > 0 ? ((summary.totalWorkerCosts / summary.totalExpenses) * 100).toFixed(1) : '0'}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">نسبة تكاليف المواد</span>
                  <span className="font-bold">{summary.totalExpenses > 0 ? ((summary.totalMaterialCosts / summary.totalExpenses) * 100).toFixed(1) : '0'}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* أزرار التصدير والطباعة */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 no-print">
          <Button
            onClick={() => {
              const excelData = {
                project: project.name,
                dateFrom,
                dateTo,
                summary,
                details
              };
              exportToProfessionalExcel(excelData, `ملخص-المشروع-${project.name}-${dateFrom}-${dateTo}`);
            }}
            className="bg-green-600 hover:bg-green-700 text-white transition-all duration-200"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            تصدير احترافي Excel
          </Button>
          <Button
            onClick={() => window.print()}
            className="bg-gray-600 hover:bg-gray-700 text-white transition-all duration-200"
          >
            <Printer className="h-4 w-4 mr-2" />
            طباعة
          </Button>
        </div>

        {/* تذييل التقرير */}
        <div className="mt-8 text-center text-xs border-t border-gray-200 pt-4">
          <p className="text-gray-600">تم إنشاء هذا التقرير بواسطة نظام إدارة مشاريع البناء</p>
          <p className="text-gray-500">تاريخ الإنشاء: {new Date().toLocaleDateString('ar')} - {new Date().toLocaleTimeString('ar')}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="mobile-reports-container mobile-smooth-scroll">
      {/* Collapsible Compact Header */}
      <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white shadow-2xl transition-all duration-300">
        <div className="container mx-auto px-4">
          {!isHeaderCollapsed ? (
            // Full Header
            <div className="py-4 sm:py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-full">
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold">مركز التقارير التنفيذية</h1>
                    <p className="text-blue-200 text-xs sm:text-sm">التقارير المتقدمة وتحليل البيانات المالية</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsHeaderCollapsed(true)}
                  className="text-white hover:bg-white/10 p-2"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Project Selector */}
              <div className="mt-3 p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                <div className="flex items-center gap-3 flex-col sm:flex-row">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-300" />
                    <span className="text-blue-200 font-medium text-sm">المشروع النشط:</span>
                  </div>
                  <div className="flex-1 w-full sm:w-auto">
                    <ProjectSelector 
                      selectedProjectId={selectedProjectId}
                      onProjectChange={selectProject} 
                      variant="compact"
                      showHeader={false}
                    />
                  </div>
                  {selectedProject && (
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-yellow-300" />
                      <span className="text-yellow-300 font-medium text-sm">
                        {selectedProject.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Collapsed Header
            <div className="py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm font-medium">التقارير</span>
                  {selectedProject && (
                    <>
                      <span className="text-blue-200">•</span>
                      <span className="text-blue-200 text-sm">{selectedProject.name}</span>
                    </>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsHeaderCollapsed(false)}
                  className="text-white hover:bg-white/10 p-1"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile-optimized Main Content */}
      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Mobile-optimized Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg rounded-xl p-1 sm:p-2 border-0 mobile-glass-effect">
            <TabsTrigger 
              value="dashboard" 
              className="mobile-tab-trigger data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-xs sm:text-lg font-medium py-2 sm:py-3 rounded-lg transition-all duration-300"
            >
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">لوحة المعلومات</span>
              <span className="sm:hidden">المعلومات</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="mobile-tab-trigger data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white text-xs sm:text-lg font-medium py-2 sm:py-3 rounded-lg transition-all duration-300"
            >
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">التقارير المتقدمة</span>
              <span className="sm:hidden">التقارير</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="mobile-tab-trigger data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white text-xs sm:text-lg font-medium py-2 sm:py-3 rounded-lg transition-all duration-300"
            >
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">التحليلات والإحصائيات</span>
              <span className="sm:hidden">التحليلات</span>
            </TabsTrigger>
          </TabsList>

          {/* Mobile-optimized Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-4 sm:mt-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
              {/* Mobile-optimized KPI Cards */}
              <Card className="mobile-card group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-gradient-to-br from-blue-50 to-blue-100 border-0 overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-xs sm:text-sm font-medium mb-1">التقارير المُنشأة</p>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-900">{totalReportsGenerated}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                        <span className="text-green-600 text-xs sm:text-sm font-medium">هذا الشهر</span>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 bg-blue-500/10 rounded-2xl group-hover:bg-blue-500/20 transition-colors duration-300">
                      <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mobile-card group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-gradient-to-br from-green-50 to-green-100 border-0 overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-xs sm:text-sm font-medium mb-1">المشاريع النشطة</p>
                      <p className="text-2xl sm:text-3xl font-bold text-green-900">{totalActiveProjects}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                        <span className="text-green-600 text-xs sm:text-sm font-medium">قيد التنفيذ</span>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 bg-green-500/10 rounded-2xl group-hover:bg-green-500/20 transition-colors duration-300">
                      <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mobile-card group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-gradient-to-br from-purple-50 to-purple-100 border-0 overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-xs sm:text-sm font-medium mb-1">إجمالي التحويلات</p>
                      <p className="text-2xl sm:text-3xl font-bold text-purple-900">{totalFundTransfers.toLocaleString()}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                        <span className="text-purple-600 text-xs sm:text-sm font-medium">ر.ي</span>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 bg-purple-500/10 rounded-2xl group-hover:bg-purple-500/20 transition-colors duration-300">
                      <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mobile-card group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-gradient-to-br from-orange-50 to-orange-100 border-0 overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 text-xs sm:text-sm font-medium mb-1">إجمالي المصروفات</p>
                      <p className="text-2xl sm:text-3xl font-bold text-orange-900">{totalExpenses.toLocaleString()}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                        <span className="text-red-600 text-xs sm:text-sm font-medium">ر.ي</span>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 bg-orange-500/10 rounded-2xl group-hover:bg-orange-500/20 transition-colors duration-300">
                      <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* البطاقة الرابعة - الرصيد الحالي */}
              <Card className="mobile-card group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-gradient-to-br from-cyan-50 to-cyan-100 border-0 overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-cyan-600 text-xs sm:text-sm font-medium mb-1">الرصيد الحالي</p>
                      <p className={`text-2xl sm:text-3xl font-bold ${currentBalance >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                        {currentBalance.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-500" />
                        <span className="text-cyan-600 text-xs sm:text-sm font-medium">ر.ي</span>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 bg-cyan-500/10 rounded-2xl group-hover:bg-cyan-500/20 transition-colors duration-300">
                      <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile-optimized Quick Actions */}
            <Card className="mobile-card bg-white shadow-xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                  <Zap className="h-6 w-6 sm:h-7 sm:w-7" />
                  الإجراءات السريعة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <Button 
                    className="mobile-touch-target mobile-action-button h-14 sm:h-16 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium text-base sm:text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
                    onClick={() => setActiveTab('reports')}
                  >
                    <Receipt className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                    كشف يومي
                  </Button>
                  <Button 
                    className="mobile-touch-target mobile-action-button h-14 sm:h-16 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium text-base sm:text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
                    onClick={() => setActiveTab('reports')}
                  >
                    <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                    حساب عامل
                  </Button>
                  <Button 
                    className="mobile-touch-target mobile-action-button h-14 sm:h-16 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium text-base sm:text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
                    onClick={() => setActiveTab('reports')}
                  >
                    <Package className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                    كشف المواد
                  </Button>
                  <Button 
                    className="mobile-touch-target mobile-action-button h-14 sm:h-16 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium text-base sm:text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
                    onClick={() => setActiveTab('analytics')}
                  >
                    <PieChart className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                    ملخص مشروع
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Daily Expenses Report */}
              <Card className="group hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-blue-50 to-blue-100 border-0 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Receipt className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">كشف المصروفات اليومية</h3>
                      <p className="text-blue-100">عرض تفصيلي لمصروفات يوم محدد مع الحوالات والأرصدة</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      التاريخ المطلوب
                    </label>
                    <Input
                      type="date"
                      value={dailyReportDate}
                      onChange={(e) => setDailyReportDate(e.target.value)}
                      className="h-12 text-lg border-2 border-blue-200 focus:border-blue-500 rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button 
                      onClick={() => generateDailyExpensesReport("daily")}
                      disabled={isGenerating}
                      className="h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium text-base rounded-xl transform hover:scale-105 transition-all duration-300"
                    >
                      {isGenerating ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4 mr-2" />
                      )}
                      عادي
                    </Button>
                    <Button 
                      onClick={() => generateDailyExpensesReport("professional")}
                      disabled={isGenerating}
                      className="h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium text-base rounded-xl transform hover:scale-105 transition-all duration-300"
                    >
                      {isGenerating ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Printer className="h-4 w-4 mr-2" />
                      )}
                      احترافي
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Worker Account Report */}
              <Card className="group hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-green-50 to-green-100 border-0 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <UserCheck className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">كشف حساب عامل</h3>
                      <p className="text-green-100">تقرير مفصل لحساب عامل محدد لفترة زمنية</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      اختيار العامل
                      {!selectedWorkerId && <span className="text-red-500 text-xs">*مطلوب</span>}
                    </label>
                    <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                      <SelectTrigger className={`h-12 text-lg border-2 ${!selectedWorkerId ? 'border-red-200' : 'border-green-200'} focus:border-green-500 rounded-xl`}>
                        <SelectValue placeholder="اختر العامل..." />
                      </SelectTrigger>
                      <SelectContent>
                        {workers.map((worker) => (
                          <SelectItem key={worker.id} value={worker.id}>
                            {worker.name} - {worker.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      المشاريع المطلوبة (اختياري - إذا لم تحدد سيتم عرض جميع المشاريع)
                    </label>
                    <div className="max-h-32 overflow-y-auto border-2 border-green-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          id="all-projects"
                          checked={selectedWorkerProjectIds.length === 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedWorkerProjectIds([]);
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="all-projects" className="text-sm font-medium text-gray-700 mr-2">
                          جميع المشاريع
                        </label>
                      </div>
                      {projects.map((project) => (
                        <div key={project.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`project-${project.id}`}
                            checked={selectedWorkerProjectIds.includes(project.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedWorkerProjectIds(prev => [...prev, project.id]);
                              } else {
                                setSelectedWorkerProjectIds(prev => prev.filter(id => id !== project.id));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor={`project-${project.id}`} className="text-sm text-gray-600 mr-2">
                            {project.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        من تاريخ
                        {!workerAccountDate1 && <span className="text-red-500 text-xs">*مطلوب</span>}
                      </label>
                      <Input
                        type="date"
                        value={workerAccountDate1}
                        onChange={(e) => setWorkerAccountDate1(e.target.value)}
                        className={`h-12 border-2 ${!workerAccountDate1 ? 'border-red-200' : 'border-green-200'} focus:border-green-500 rounded-xl`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        إلى تاريخ
                        {!workerAccountDate2 && <span className="text-red-500 text-xs">*مطلوب</span>}
                      </label>
                      <Input
                        type="date"
                        value={workerAccountDate2}
                        onChange={(e) => setWorkerAccountDate2(e.target.value)}
                        className={`h-12 border-2 ${!workerAccountDate2 ? 'border-red-200' : 'border-green-200'} focus:border-green-500 rounded-xl`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <Button 
                      onClick={generateWorkerAccountReport}
                      disabled={isGenerating}
                      className="h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium text-base rounded-xl transform hover:scale-105 transition-all duration-300"
                    >
                      {isGenerating ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      إنشاء التقرير
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Material Purchases Report */}
              <Card className="group hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-orange-50 to-orange-100 border-0 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Package className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">كشف المواد المشتراة</h3>
                      <p className="text-orange-100">تقرير شامل للمواد والتوريدات مع التفاصيل المالية</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">من تاريخ</label>
                      <Input
                        type="date"
                        value={materialReportDate1}
                        onChange={(e) => setMaterialReportDate1(e.target.value)}
                        className="h-12 border-2 border-orange-200 focus:border-orange-500 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">إلى تاريخ</label>
                      <Input
                        type="date"
                        value={materialReportDate2}
                        onChange={(e) => setMaterialReportDate2(e.target.value)}
                        className="h-12 border-2 border-orange-200 focus:border-orange-500 rounded-xl"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={generateMaterialPurchasesReport}
                    disabled={isGenerating}
                    className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium text-lg rounded-xl transform hover:scale-105 transition-all duration-300"
                  >
                    {isGenerating ? (
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Eye className="h-5 w-5 mr-2" />
                    )}
                    إنشاء التقرير
                  </Button>
                </CardContent>
              </Card>

              {/* Workers Filter Report */}
              <Card className="group hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-teal-50 to-teal-100 border-0 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Users className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">تقرير تصفية العمال</h3>
                      <p className="text-teal-100">تقرير شامل للعمال المحددين مع الأيام والأجور والمتبقي</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  {!showSettlementForm ? (
                    <div className="text-center p-4 bg-teal-50 rounded-xl border-2 border-teal-200">
                      <p className="text-teal-700 font-medium mb-3">تقرير متقدم لتصفية العمال</p>
                      <p className="text-sm text-teal-600 mb-4">يتيح لك اختيار العمال وفترة زمنية لإنشاء تقرير شامل يحتوي على الأجور اليومية، عدد الأيام، المبالغ المستحقة والمستلمة، والمتبقي لكل عامل</p>
                      <Button 
                        onClick={() => setShowSettlementForm(true)}
                        className="w-full h-12 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-medium text-lg rounded-xl transform hover:scale-105 transition-all duration-300"
                      >
                        <Users className="h-5 w-5 mr-2" />
                        إنشاء تقرير تصفية العمال
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* عرض الأخطاء والتحذيرات */}
                      {settlementErrors.length > 0 && (
                        <EnhancedErrorDisplay
                          errors={settlementErrors}
                          className="mb-4"
                          onDismiss={(errorId) => {
                            setSettlementErrors(prev => prev.filter(e => e.id !== errorId));
                          }}
                        />
                      )}

                      {/* مؤشر التقدم المحسن مع معلومات إضافية */}
                      {isGenerating && (
                        <div className="mb-6">
                          <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-4 rounded-xl border border-blue-200 mb-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-blue-500 rounded-full">
                                <Zap className="h-5 w-5 text-white animate-pulse" />
                              </div>
                              <div>
                                <h4 className="font-bold text-blue-900">جاري إنشاء تقرير تصفية العمال</h4>
                                <p className="text-sm text-blue-700">يتم معالجة البيانات وحساب الأرصدة للعمال المحددين</p>
                              </div>
                            </div>
                            <AdvancedProgressIndicator
                              steps={progressSteps}
                              currentStepId={currentStepId}
                              showTimeEstimate={true}
                            />
                            <div className="mt-3 p-2 bg-white/70 rounded-lg">
                              <div className="flex items-center justify-between text-xs text-blue-600">
                                <span>💡 نصيحة: التقرير يشمل جميع البيانات المالية والأرصدة</span>
                                <span>🕐 الوقت المتبقي تقريبي</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Workers Settlement Report Form */}
                      <div className="bg-teal-50 p-4 rounded-xl border border-teal-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-teal-800">إعداد تقرير تصفية العمال</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowSettlementForm(false);
                              setSettlementReportData(null);
                              setSettlementErrors([]);
                              resetSteps();
                            }}
                            className="text-teal-600 hover:text-teal-800"
                          >
                            إغلاق
                          </Button>
                        </div>
                        
                        {/* اختيار المشاريع */}
                        <div className="space-y-2 mb-4">
                          <label className="text-sm font-medium text-teal-700">اختيار المشاريع (مطلوب)</label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-teal-200 rounded-md p-2">
                            {projects.map((project) => (
                              <label key={project.id} className="flex items-center space-x-2 space-x-reverse text-sm">
                                <input
                                  type="checkbox"
                                  checked={selectedSettlementProjectIds.includes(project.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedSettlementProjectIds([...selectedSettlementProjectIds, project.id]);
                                    } else {
                                      setSelectedSettlementProjectIds(selectedSettlementProjectIds.filter(id => id !== project.id));
                                    }
                                  }}
                                  className="text-teal-600"
                                />
                                <span className="text-teal-700 text-xs">{project.name}</span>
                              </label>
                            ))}
                          </div>
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-teal-600">
                              إذا لم تختر مشاريع محددة، سيتم استخدام المشروع المحدد حالياً في الأعلى
                              {selectedProjectId && !selectedSettlementProjectIds.length && ` (المشروع الحالي: ${selectedProject?.name})`}
                            </p>
                            {selectedSettlementProjectIds.length > 5 && (
                              <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                                  <span className="text-sm font-medium text-yellow-800">تحذير من الأداء</span>
                                </div>
                                <p className="text-xs text-yellow-700">
                                  اختيار أكثر من 5 مشاريع قد يجعل التقرير أبطأ. الوقت المتوقع: {Math.ceil(selectedSettlementProjectIds.length * 2)} ثانية إضافية.
                                </p>
                                <p className="text-xs text-yellow-600 mt-1">
                                  💡 اقتراح: قسّم التقرير إلى مجموعات أصغر (3-4 مشاريع) للحصول على أداء أفضل.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* اختيار التواريخ مع نصائح ذكية */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-teal-600" />
                            <label className="text-sm font-medium text-teal-700">فترة التقرير</label>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-teal-600">من تاريخ (اختياري)</label>
                              <Input
                                type="date"
                                value={settlementDateFrom}
                                onChange={(e) => setSettlementDateFrom(e.target.value)}
                                className="h-12 border-2 border-teal-200 focus:border-teal-500 rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-teal-600">إلى تاريخ (اختياري)</label>
                              <Input
                                type="date"
                                value={settlementDateTo}
                                onChange={(e) => setSettlementDateTo(e.target.value)}
                                className="h-12 border-2 border-teal-200 focus:border-teal-500 rounded-xl"
                              />
                            </div>
                          </div>
                          <div className="p-2 bg-teal-50 rounded-lg border border-teal-100">
                            <div className="flex items-start gap-2">
                              <Lightbulb className="h-4 w-4 text-teal-500 mt-0.5 flex-shrink-0" />
                              <div className="text-xs text-teal-700">
                                <p className="font-medium mb-1">نصائح لاختيار الفترة:</p>
                                <ul className="space-y-1 text-xs">
                                  <li>• اتركهما فارغين لشمول جميع السجلات</li>
                                  <li>• اختر فترة محددة لتقرير مفصل</li>
                                  <li>• الفترات الطويلة تحتاج وقت أكثر للمعالجة</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          {/* معلومات التواريخ والتحذيرات */}
                          <div className="space-y-1">
                            {!settlementDateFrom && !settlementDateTo && (
                              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                                ℹ️ سيتم إنشاء التقرير لجميع الفترات المتاحة. يمكنك تحديد فترة معينة لتقرير أكثر تركيز.
                              </div>
                            )}
                            
                            {settlementDateFrom && settlementDateTo && (() => {
                              const fromDate = new Date(settlementDateFrom);
                              const toDate = new Date(settlementDateTo);
                              const today = new Date();
                              const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
                              
                              if (fromDate > toDate) {
                                return (
                                  <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                    ❌ تاريخ البداية يجب أن يكون أقل من تاريخ النهاية.
                                  </div>
                                );
                              }
                              
                              if (fromDate > today || toDate > today) {
                                return (
                                  <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                    ❌ لا يمكن اختيار تواريخ في المستقبل.
                                  </div>
                                );
                              }
                              
                              if (daysDiff > 365) {
                                return (
                                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                                    ⚠️ الفترة المحددة طويلة ({daysDiff} يوم). التقارير الطويلة قد تستغرق وقت أطول في الإنشاء.
                                  </div>
                                );
                              }
                              
                              if (daysDiff > 30) {
                                return (
                                  <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                                    ℹ️ سيتم إنشاء تقرير لفترة {daysDiff} يوم.
                                  </div>
                                );
                              }
                              
                              return null;
                            })()}
                          </div>
                        </div>
                        
                        {/* اختيار العمال مع تحسينات */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-2 justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-teal-600" />
                              <label className="text-sm font-medium text-teal-700">اختيار العمال</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedWorkerIds(workers.map(w => w.id))}
                                className="text-xs border-teal-200 text-teal-700 hover:bg-teal-50"
                              >
                                تحديد الكل
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedWorkerIds([])}
                                className="text-xs border-teal-200 text-teal-700 hover:bg-teal-50"
                              >
                                إلغاء التحديد
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border-2 border-teal-200 rounded-xl p-3 bg-teal-50/30">
                            {workers.map((worker) => (
                              <label key={worker.id} className="flex items-center space-x-2 space-x-reverse text-sm hover:bg-white/70 p-2 rounded-lg transition-colors cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedWorkerIds.includes(worker.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedWorkerIds([...selectedWorkerIds, worker.id]);
                                    } else {
                                      setSelectedWorkerIds(selectedWorkerIds.filter(id => id !== worker.id));
                                    }
                                  }}
                                  className="text-teal-600 focus:ring-teal-500 rounded"
                                />
                                <span className="text-teal-700 text-xs font-medium">{worker.name}</span>
                              </label>
                            ))}
                          </div>
                          <div className="space-y-2">
                            <div className="p-2 bg-teal-50 rounded-lg border border-teal-100">
                              <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-teal-500 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-teal-700">
                                  <p className="font-medium mb-1">معلومات الاختيار:</p>
                                  <ul className="space-y-1 text-xs">
                                    <li>• محدد حالياً: {selectedWorkerIds.length} من {workers.length} عامل</li>
                                    <li>• اتركه فارغاً لشمول جميع العمال في المشاريع</li>
                                    <li>• العمال المحددون سيظهرون في التقرير فقط</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                            {selectedWorkerIds.length > 20 && (
                              <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                                  <span className="text-sm font-medium text-yellow-800">تحذير من التعقيد</span>
                                </div>
                                <p className="text-xs text-yellow-700">
                                  اختيار أكثر من 20 عامل قد يجعل التقرير معقد ويستغرق وقت أطول. الوقت المتوقع: {Math.ceil(selectedWorkerIds.length * 0.5)} ثانية إضافية.
                                </p>
                                <p className="text-xs text-yellow-600 mt-1">
                                  💡 اقتراح: اتركه فارغاً لعرض جميع العمال، أو قلل العدد لأقل من 20 عامل.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <Button
                            onClick={generateWorkersSettlementReport}
                            disabled={isGenerating}
                            className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
                          >
                            {isGenerating ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Receipt className="h-4 w-4 mr-2" />
                            )}
                            إنشاء التقرير
                          </Button>
                        </div>
                      </div>
                      
                      {/* Settlement Report Display */}
                      {settlementReportData && (
                        <div 
                          id="workers-settlement-report" 
                          className="print-content bg-white rounded-xl border border-teal-200 overflow-hidden"
                          data-report-content="workers-settlement"
                          dir="rtl"
                          style={{
                            fontFamily: 'Arial, sans-serif',
                            fontSize: '14px',
                            lineHeight: '1.4'
                          }}
                        >
                          {/* رأس التقرير مع الأزرار */}
                          <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-4 text-white preserve-color">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                              <div className="text-center md:text-right flex-1">
                                <h1 className="text-xl font-bold mb-2">تقرير تصفية العمال الشامل</h1>
                                <h2 className="text-lg font-semibold">
                                  {settlementReportData.projects?.length > 1 
                                    ? `${settlementReportData.projects.length} مشاريع` 
                                    : settlementReportData.projects?.[0]?.name || 'غير محدد'
                                  }
                                </h2>
                                <div className="mt-2 text-sm">
                                  <p>تاريخ الإنشاء: {formatDate(settlementReportData.generated_at)}</p>
                                  {settlementReportData.filters?.dateFrom && settlementReportData.filters?.dateTo && (
                                    <p>الفترة: {formatDate(settlementReportData.filters.dateFrom)} - {formatDate(settlementReportData.filters.dateTo)}</p>
                                  )}
                                </div>
                                {settlementReportData.projects?.length > 1 && (
                                  <p className="text-xs mt-2">
                                    المشاريع: {settlementReportData.projects.map((p: any) => p.name).join(', ')}
                                  </p>
                                )}
                              </div>
                              
                              {/* أزرار التحكم - مخفية عند الطباعة */}
                              <div className="flex flex-col sm:flex-row gap-2 print:hidden">
                                <Button
                                  onClick={() => {
                                    const projectNames = settlementReportData.projects?.map((p: any) => p.name).join('_') || 'مشاريع';
                                    const fileName = `تصفية-عمال-${projectNames}-${getCurrentDate()}`;
                                    exportWorkersSettlementToExcel(settlementReportData, fileName);
                                  }}
                                  className="bg-white hover:bg-gray-100 text-teal-600 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium shadow-md"
                                >
                                  <Download className="h-4 w-4 ml-1 sm:mr-2" />
                                  <span className="hidden sm:inline">تصدير Excel</span>
                                  <span className="sm:hidden">Excel</span>
                                </Button>
                                <Button
                                  onClick={printReport}
                                  className="bg-white hover:bg-gray-100 text-teal-600 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium shadow-md"
                                >
                                  <Printer className="h-4 w-4 ml-1 sm:mr-2" />
                                  <span className="hidden sm:inline">طباعة</span>
                                  <span className="sm:hidden">طباعة</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-6">
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse border border-black" style={{ borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr className="bg-gray-100">
                                    <th className="border border-black p-2 text-right text-sm font-bold" style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>#</th>
                                    <th className="border border-black p-2 text-right text-sm font-bold" style={{ border: '1px solid black', padding: '8px', textAlign: 'right' }}>اسم العامل</th>
                                    <th className="border border-black p-2 text-right text-sm font-bold" style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>نوع العامل</th>
                                    <th className="border border-black p-2 text-right text-sm font-bold" style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>إجمالي الأيام</th>
                                    <th className="border border-black p-2 text-right text-sm font-bold" style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>الاستحقاقات</th>
                                    <th className="border border-black p-2 text-right text-sm font-bold" style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>المدفوعات</th>
                                    <th className="border border-black p-2 text-right text-sm font-bold" style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>التحويلات</th>
                                    <th className="border border-black p-2 text-right text-sm font-bold" style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>الرصيد النهائي</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {settlementReportData.workers.map((worker: any, index: number) => (
                                    <tr key={worker.worker_id} className={`${worker.final_balance < 0 ? 'bg-red-50' : index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                      <td className="border border-black p-2 text-sm text-center" style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{index + 1}</td>
                                      <td className="border border-black p-2 text-sm font-medium" style={{ border: '1px solid black', padding: '8px', textAlign: 'right' }}>{worker.worker_name}</td>
                                      <td className="border border-black p-2 text-sm" style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{worker.worker_type}</td>
                                      <td className="border border-black p-2 text-sm text-center" style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{worker.total_work_days.toFixed(1)}</td>
                                      <td className="border border-black p-2 text-sm text-center font-medium" style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{formatCurrency(worker.total_earned)}</td>
                                      <td className="border border-black p-2 text-sm text-center" style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{formatCurrency(worker.total_paid)}</td>
                                      <td className="border border-black p-2 text-sm text-center" style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{formatCurrency(worker.total_transfers)}</td>
                                      <td className={`border border-black p-2 text-sm text-center font-bold`} style={{ border: '1px solid black', padding: '8px', textAlign: 'center', color: worker.final_balance >= 0 ? '#059669' : '#dc2626' }}>
                                        {formatCurrency(worker.final_balance)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-gray-200 font-bold">
                                    <td colSpan={3} className="border border-black p-2 text-sm text-center font-bold" style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>الإجمالي ({settlementReportData.totals.total_workers} عامل)</td>
                                    <td className="border border-black p-2 text-sm text-center font-bold" style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{settlementReportData.totals.total_work_days.toFixed(1)}</td>
                                    <td className="border border-black p-2 text-sm text-center font-bold" style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{formatCurrency(settlementReportData.totals.total_earned)}</td>
                                    <td className="border border-black p-2 text-sm text-center font-bold" style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{formatCurrency(settlementReportData.totals.total_paid)}</td>
                                    <td className="border border-black p-2 text-sm text-center font-bold" style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{formatCurrency(settlementReportData.totals.total_transfers)}</td>
                                    <td className={`border border-black p-2 text-sm text-center font-bold`} style={{ border: '1px solid black', padding: '8px', textAlign: 'center', color: settlementReportData.totals.final_balance >= 0 ? '#059669' : '#dc2626' }}>
                                      {formatCurrency(settlementReportData.totals.final_balance)}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                            
                            {/* ملخص إحصائي للطباعة */}
                            <div className="mt-6 border-t-2 border-gray-300 pt-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <strong>إجمالي العمال:</strong> {settlementReportData.totals.total_workers}
                                </div>
                                <div>
                                  <strong>إجمالي أيام العمل:</strong> {settlementReportData.totals.total_work_days.toFixed(1)}
                                </div>
                                <div>
                                  <strong>متوسط أيام العمل للعامل:</strong> {(settlementReportData.totals.total_work_days / settlementReportData.totals.total_workers).toFixed(1)}
                                </div>
                                <div>
                                  <strong>متوسط الأجر للعامل:</strong> {formatCurrency(settlementReportData.totals.total_earned / settlementReportData.totals.total_workers)}
                                </div>
                              </div>
                            </div>
                            
                            {/* تذييل التقرير */}
                            <div className="mt-6 text-center text-xs border-t border-gray-200 pt-2">
                              <p>تم إنشاء هذا التقرير بواسطة نظام إدارة مشاريع البناء</p>
                              <p>تاريخ الطباعة: {new Date().toLocaleDateString('ar')} - {new Date().toLocaleTimeString('ar')}</p>
                            </div>
                            
                            {/* الأزرار مخفية في الطباعة - تم نقلها للرأس */}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Project Summary Report */}
              <Card className="group hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-purple-50 to-purple-100 border-0 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <PieChart className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">ملخص المشروع</h3>
                      <p className="text-purple-100">تقرير شامل ومفصل للمشروع مع الإحصائيات والمؤشرات</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">من تاريخ</label>
                      <Input
                        type="date"
                        value={projectSummaryDate1}
                        onChange={(e) => setProjectSummaryDate1(e.target.value)}
                        className="h-12 border-2 border-purple-200 focus:border-purple-500 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">إلى تاريخ</label>
                      <Input
                        type="date"
                        value={projectSummaryDate2}
                        onChange={(e) => setProjectSummaryDate2(e.target.value)}
                        className="h-12 border-2 border-purple-200 focus:border-purple-500 rounded-xl"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={generateProjectSummaryReport}
                    disabled={isGenerating}
                    className="w-full h-12 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium text-lg rounded-xl transform hover:scale-105 transition-all duration-300"
                  >
                    {isGenerating ? (
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Eye className="h-5 w-5 mr-2" />
                    )}
                    إنشاء التقرير
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-8">
            <Card className="bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
                <CardTitle className="text-3xl font-bold flex items-center gap-4">
                  <Activity className="h-10 w-10" />
                  التحليلات المتقدمة والإحصائيات التفصيلية
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="text-center py-12">
                  <Database className="h-24 w-24 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-700 mb-4">قريباً: تحليلات متقدمة</h3>
                  <p className="text-gray-500 text-lg">
                    ستتوفر قريباً ميزات التحليل المتقدم مع الرسوم البيانية التفاعلية والإحصائيات المفصلة
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Report Display Area */}
        {reportData && activeReportType && (
          <Card className="mt-8 bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2 md:gap-3">
                  <FileSpreadsheet className="h-6 w-6 md:h-7 md:w-7 flex-shrink-0" />
                  <span>نتائج التقرير</span>
                </CardTitle>
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <Button
                    onClick={() => {
                      const fileName = `تقرير-${activeReportType}-${selectedProject?.name || 'عام'}-${getCurrentDate()}`;
                      exportToExcel(reportData, fileName);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 md:px-6 py-2 rounded-xl transition-all duration-200 text-sm md:text-base flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4 flex-shrink-0" />
                    <span>تصدير Excel</span>
                  </Button>
                  <Button
                    onClick={printReport}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 sm:px-4 md:px-6 py-2 rounded-xl transition-all duration-200 text-sm md:text-base flex items-center justify-center gap-2"
                  >
                    <Printer className="h-4 w-4 flex-shrink-0" />
                    <span>طباعة</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8" data-report-content>
              {activeReportType === 'daily' && (
                <div id="daily-report-content" data-report-content="daily_expenses">
                  {renderDailyExpensesReport(reportData)}
                </div>
              )}
              {activeReportType === 'professional' && (
                <div id="professional-report-content" className="professional-report-container" data-report-content="daily_expenses">
                  <div className="text-center text-gray-600 py-8">
                    تم حذف هذا النوع من التقارير
                  </div>
                </div>
              )}
              {activeReportType === 'worker' && renderWorkerAccountReport(reportData)}
              {activeReportType === 'material' && renderMaterialPurchasesReport(reportData)}
              {activeReportType === 'project' && (
                <div id="project-summary-content" data-report-content="project_summary">
                  {renderProjectSummaryReport(reportData)}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}