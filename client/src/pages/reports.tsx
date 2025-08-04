import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowRight, Receipt, UserCheck, Package, PieChart, Eye, Download, Share2, 
  FileSpreadsheet, Printer, Calendar, TrendingUp, Filter, RefreshCw,
  BarChart3, Database, Clock, Settings, Users, DollarSign, FileText,
  Activity, Target, Briefcase, ChevronRight, Grid3X3, List, Search,
  ExternalLink, AlertCircle, CheckCircle2, Zap, Globe, Award
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
import { ProfessionalDailyReport } from "@/components/ProfessionalDailyReport";
import { ProfessionalWorkerAccountReport } from "@/components/ProfessionalWorkerAccountReport";
import { CompactWorkerAccountReport } from "@/components/CompactWorkerAccountReport";
import { EnhancedWorkerAccountStatement } from "@/components/EnhancedWorkerAccountStatementFixed";
import { PrintButton } from "@/components/PrintButton";
import { PrintSettingsButton } from "@/components/PrintSettingsButton";
import { printWithSettings, usePrintSettings } from "@/hooks/usePrintSettings";
import "@/components/print-styles.css";
import "@/components/invoice-print-styles.css";
import "@/components/professional-report-print.css";
import "@/components/enhanced-worker-statement-print.css";

export default function Reports() {
  const [, setLocation] = useLocation();
  const { selectedProjectId, selectProject } = useSelectedProject();
  const { toast } = useToast();

  // Fetch real statistics data
  const { data: projectsWithStats = [] } = useQuery<any[]>({
    queryKey: ["/api/projects/with-stats"],
  });
  
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

  // Calculate real statistics
  const totalActiveProjects = projects.filter(p => p.status === 'active').length;
  const totalWorkers = workers.length;
  
  // Calculate statistics for selected project only
  const selectedProjectWithStats = projectsWithStats.find((p: any) => p.id === selectedProjectId);
  const selectedProjectStats = selectedProjectWithStats?.stats || {};
  
  const totalFundTransfers = selectedProjectStats.totalFundTransfers || 0;
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
      const data = await apiRequest("GET", `/api/workers/${selectedWorkerId}/account-statement?projectId=${selectedProjectId}&dateFrom=${workerAccountDate1}&dateTo=${workerAccountDate2}`);
      const reportDataExtended = { ...data, workerId: selectedWorkerId, dateFrom: workerAccountDate1, dateTo: workerAccountDate2 };
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
      setActiveReportType("summary");

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
      // تحديد نوع التقرير بناءً على التقرير النشط
      let reportType = 'daily_expenses'; // افتراضي
      if (activeReportType === 'daily') reportType = 'daily_expenses';
      else if (activeReportType === 'professional') reportType = 'daily_expenses';
      else if (activeReportType === 'worker') reportType = 'worker_statement';
      else if (activeReportType === 'material') reportType = 'material_purchases';
      else if (activeReportType === 'project') reportType = 'project_summary';

      // استخدام دالة الطباعة مع الإعدادات المحفوظة
      printWithSettings(reportType, 500);
      
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

  const renderProjectSummaryReport = (data: any) => (
    <div className="text-center py-8">
      <p className="text-gray-600">تقرير ملخص المشروع - قيد التطوير</p>
    </div>
  );

  return (
    <div className="mobile-reports-container mobile-smooth-scroll">
      {/* Mobile-optimized Premium Header */}
      <div className="sticky top-0 z-50 mobile-sticky-header bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white shadow-2xl">
        <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-8">
          <div className="flex items-center justify-center flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-4 flex-col sm:flex-row text-center sm:text-right">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
                  <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mobile-fade-in">
                    مركز التقارير التنفيذية
                  </h1>
                  <p className="text-blue-200 text-sm sm:text-lg">
                    التقارير المتقدمة وتحليل البيانات المالية
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-start">
                <Badge className="mobile-badge bg-green-500/20 text-green-300 border-green-400/30">
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  نظام نشط
                </Badge>
                <Badge className="mobile-badge bg-orange-500/20 text-orange-300 border-orange-400/30">
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  محدث اليوم
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Project Selector تحت مربع العرض */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
            <div className="flex items-center gap-3 sm:gap-4 flex-col sm:flex-row">
              <div className="flex items-center gap-2 text-center sm:text-right">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300" />
                <span className="text-blue-200 font-medium text-sm sm:text-base">المشروع النشط:</span>
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
                  <Award className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-300" />
                  <span className="text-yellow-300 font-medium text-sm sm:text-base">
                    {selectedProject.name}
                  </span>
                </div>
              )}
            </div>
          </div>
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
                            {worker.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      مضغوط بسيط
                    </Button>
                    <Button 
                      onClick={generateWorkerAccountReport}
                      disabled={isGenerating}
                      className="h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium text-base rounded-xl transform hover:scale-105 transition-all duration-300"
                    >
                      {isGenerating ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                      )}
                      احترافي محسن
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
                  <div className="text-center p-4 bg-teal-50 rounded-xl border-2 border-teal-200">
                    <p className="text-teal-700 font-medium mb-3">تقرير متقدم لتصفية العمال</p>
                    <p className="text-sm text-teal-600 mb-4">يتيح لك اختيار العمال وفترة زمنية لإنشاء تقرير شامل يحتوي على الأجور اليومية، عدد الأيام، المبالغ المستحقة والمستلمة، والمتبقي لكل عامل</p>
                    <Button 
                      onClick={() => setLocation('/workers-filter-report')}
                      className="w-full h-12 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-medium text-lg rounded-xl transform hover:scale-105 transition-all duration-300"
                    >
                      <Users className="h-5 w-5 mr-2" />
                      إنشاء تقرير تصفية العمال
                    </Button>
                  </div>
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
            <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <FileSpreadsheet className="h-7 w-7" />
                  نتائج التقرير
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => exportToCSV([reportData], `report-${activeReportType}`)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    تصدير Excel
                  </Button>
                  <Button
                    onClick={() => {
                      // Save report context for advanced print control
                      const printContext = {
                        type: activeReportType === 'daily' ? 'daily_expenses' : 
                              activeReportType === 'professional' ? 'daily_expenses' :
                              activeReportType === 'worker' ? 'worker_statement' :
                              activeReportType === 'material' ? 'material_purchases' : 'daily_expenses',
                        title: `تقرير ${activeReportType === 'daily' ? 'المصاريف اليومية' :
                                        activeReportType === 'professional' ? 'المصاريف المهنية' :
                                        activeReportType === 'worker' ? 'حساب العامل' :
                                        activeReportType === 'material' ? 'المواد والمشتريات' : 'التقرير'}`,
                        data: reportData,
                        projectInfo: selectedProject
                      };
                      localStorage.setItem('printReportContext', JSON.stringify(printContext));
                      setLocation('/advanced-print-control?withData=true');
                    }}
                    variant="outline"
                    className="border-purple-500 text-purple-600 hover:bg-purple-50 px-6 py-2 rounded-xl"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    تحكم متقدم
                  </Button>
                  <PrintSettingsButton
                    reportType={activeReportType === 'daily' ? 'daily_expenses' : 
                               activeReportType === 'professional' ? 'daily_expenses' :
                               activeReportType === 'worker' ? 'worker_statement' :
                               activeReportType === 'material' ? 'material_purchases' : 'daily_expenses'}
                    className="px-6 py-2 rounded-xl"
                    variant="outline"
                    reportData={reportData}
                    reportTitle={`تقرير ${activeReportType === 'daily' ? 'المصاريف اليومية' :
                                        activeReportType === 'professional' ? 'المصاريف المهنية' :
                                        activeReportType === 'worker' ? 'حساب العامل' :
                                        activeReportType === 'material' ? 'المواد والمشتريات' : 'التقرير'}`}
                  />
                  <Button
                    onClick={printReport}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    طباعة
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
                  <ProfessionalDailyReport 
                    data={reportData}
                    selectedProject={selectedProject}
                    selectedDate={dailyReportDate}
                  />
                </div>
              )}
              {activeReportType === 'worker' && renderWorkerAccountReport(reportData)}
              {activeReportType === 'material' && renderMaterialPurchasesReport(reportData)}
              {activeReportType === 'project' && renderProjectSummaryReport(reportData)}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}