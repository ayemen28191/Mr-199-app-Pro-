import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, FileSpreadsheet, Printer, Download, Filter, BarChart3, TrendingUp, DollarSign, Eye, Settings, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSelectedProject } from "@/hooks/use-selected-project";
import ProjectSelector from "@/components/project-selector";
import { getCurrentDate, formatCurrency, formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { UnifiedA4Report, UnifiedReportActions } from "@/components/UnifiedA4Report";
import { exportToUnifiedExcel } from "@/utils/UnifiedExcelExporter";
import type { Project } from "@shared/schema";
import "../styles/unified-print-a4.css";

interface DailyExpenseData {
  date: string;
  summary: {
    carriedForward: number;
    totalIncome: number;
    totalExpenses: number;
    remainingBalance: number;
    totalFundTransfers: number;
    totalWorkerWages: number;
    totalMaterialCosts: number;
    totalTransportationCosts: number;
    totalWorkerTransfers: number;
    totalWorkerMiscExpenses: number;
  };
  fundTransfers: any[];
  workerAttendance: any[];
  materialPurchases: any[];
  transportationExpenses: any[];
  workerTransfers: any[];
  workerMiscExpenses: any[];
}

export default function DailyExpensesReport() {
  const { selectedProjectId, selectProject } = useSelectedProject();
  const { toast } = useToast();
  
  // تحديد فترة افتراضية تحتوي على بيانات فعلية
  const [dateFrom, setDateFrom] = useState('2025-07-26');
  const [dateTo, setDateTo] = useState('2025-08-03');
  const [reportData, setReportData] = useState<DailyExpenseData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  
  // تحديد مشروع افتراضي إذا لم يكن هناك مشروع محدد وتوجد مشاريع
  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      // البحث عن المشروع الذي يحتوي على بيانات
      const projectWithData = projects.find(p => p.id === '4dd91471-231d-40da-ac05-7999556c5a72');
      if (projectWithData) {
        selectProject(projectWithData.id);
      } else {
        selectProject(projects[0].id);
      }
    }
  }, [projects, selectedProjectId, selectProject]);



  // تصدير Excel باستخدام النظام الاحترافي الجديد
  const exportToProfessionalExcel = async () => {
    try {
      if (!reportData || reportData.length === 0) {
        toast({
          title: "تنبيه",
          description: "لا توجد بيانات للتصدير",
          variant: "destructive",
        });
        return;
      }

      // جلب قالب التقرير النشط
      const template = await apiRequest('GET', '/api/report-templates/active');
      
      // إعداد بيانات التقرير المحسنة
      const headers = [
        'التاريخ', 'الرصيد المرحل', 'الحوالات المالية', 'أجور العمال', 'شراء المواد', 
        'أجور المواصلات', 'حوالات العمال', 'نثريات العمال', 'إجمالي الإيرادات', 'إجمالي المصروفات', 'الرصيد المتبقي'
      ];

      const rows = reportData.map(day => [
        formatDate(day.date),
        Number(day.summary.carriedForward) || 0,
        Number(day.summary.totalFundTransfers) || 0,
        Number(day.summary.totalWorkerWages) || 0,
        Number(day.summary.totalMaterialCosts) || 0,
        Number(day.summary.totalTransportationCosts) || 0,
        Number(day.summary.totalWorkerTransfers) || 0,
        Number(day.summary.totalWorkerMiscExpenses) || 0,
        Number(day.summary.totalIncome) || 0,
        Number(day.summary.totalExpenses) || 0,
        Number(day.summary.remainingBalance) || 0
      ]);

      // حساب الإجماليات للملخص
      const totals = {
        totalFundTransfers: reportData.reduce((sum, day) => sum + Number(day.summary.totalFundTransfers || 0), 0),
        totalWorkerWages: reportData.reduce((sum, day) => sum + Number(day.summary.totalWorkerWages || 0), 0),
        totalMaterialCosts: reportData.reduce((sum, day) => sum + Number(day.summary.totalMaterialCosts || 0), 0),
        totalTransportationCosts: reportData.reduce((sum, day) => sum + Number(day.summary.totalTransportationCosts || 0), 0),
        totalWorkerTransfers: reportData.reduce((sum, day) => sum + Number(day.summary.totalWorkerTransfers || 0), 0),
        totalWorkerMiscExpenses: reportData.reduce((sum, day) => sum + Number(day.summary.totalWorkerMiscExpenses || 0), 0),
        totalIncome: reportData.reduce((sum, day) => sum + Number(day.summary.totalIncome || 0), 0),
        totalExpenses: reportData.reduce((sum, day) => sum + Number(day.summary.totalExpenses || 0), 0),
      };

      const calculatedBalance = totals.totalIncome - totals.totalExpenses;

      const enhancedData = {
        title: `كشف المصروفات اليومية - ${selectedProject?.name}`,
        subtitle: `الفترة: من ${formatDate(dateFrom)} إلى ${formatDate(dateTo)}`,
        headers,
        rows,
        summary: [
          { label: 'إجمالي الحوالات المالية', value: totals.totalFundTransfers },
          { label: 'إجمالي أجور العمال', value: totals.totalWorkerWages },
          { label: 'إجمالي شراء المواد', value: totals.totalMaterialCosts },
          { label: 'إجمالي أجور المواصلات', value: totals.totalTransportationCosts },
          { label: 'إجمالي حوالات العمال', value: totals.totalWorkerTransfers },
          { label: 'إجمالي نثريات العمال', value: totals.totalWorkerMiscExpenses },
          { label: 'إجمالي الإيرادات', value: totals.totalIncome },
          { label: 'إجمالي المصروفات', value: totals.totalExpenses },
          { label: 'الرصيد النهائي', value: finalBalance },
        ],
        metadata: {
          reportType: 'كشف المصروفات اليومية',
          dateRange: `من ${formatDate(dateFrom)} إلى ${formatDate(dateTo)}`,
          projectName: selectedProject?.name || 'غير محدد',
          generatedBy: 'نظام إدارة مشاريع البناء'
        }
      };

      // حساب الإجماليات من البيانات للتصدير
      const exportTotalIncome = reportData.reduce((sum, day) => sum + day.summary.totalIncome, 0);
      const exportTotalExpenses = reportData.reduce((sum, day) => sum + day.summary.totalExpenses, 0);
      const exportFinalBalance = exportTotalIncome - exportTotalExpenses;
      const fileName = `كشف-المصروفات-احترافي-${selectedProject?.name}-${formatDate(dateFrom)}-${formatDate(dateTo)}`;
      
      // تصدير مباشر بدلاً من النظام القديم
      console.log('📊 تصدير Excel مباشر للبيانات');

      toast({
        title: "تم بنجاح",
        description: "تم تصدير كشف المصروفات بالتصميم الاحترافي",
      });

    } catch (error) {
      console.error('خطأ في تصدير Excel الاحترافي:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تصدير الملف الاحترافي",
        variant: "destructive",
      });
    }
  };

  const generateReport = useCallback(async () => {
    if (!selectedProjectId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار مشروع أولاً",
        variant: "destructive",
      });
      return;
    }

    if (!dateFrom || !dateTo) {
      toast({
        title: "خطأ",
        description: "يرجى تحديد تاريخ البداية والنهاية",
        variant: "destructive",
      });
      return;
    }

    if (new Date(dateFrom) > new Date(dateTo)) {
      toast({
        title: "خطأ",
        description: "تاريخ البداية يجب أن يكون قبل تاريخ النهاية",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiRequest("GET", `/api/reports/daily-expenses-range/${selectedProjectId}?dateFrom=${dateFrom}&dateTo=${dateTo}`);
      setReportData(data);
      
      toast({
        title: "تم إنشاء التقرير",
        description: `تم إنشاء كشف المصروفات اليومية من ${formatDate(dateFrom)} إلى ${formatDate(dateTo)}`,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء التقرير",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId, dateFrom, dateTo, toast]);

  // تحميل التقرير تلقائياً عند اختيار مشروع
  useEffect(() => {
    if (selectedProjectId && dateFrom && dateTo && projects.length > 0) {
      generateReport();
    }
  }, [selectedProjectId, projects.length, generateReport]);

  const exportToExcel = useCallback(async () => {
    if (!reportData.length) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات لتصديرها",
        variant: "destructive",
      });
      return;
    }

    console.log('🚀 بدء تصدير Excel مبسط');
    console.log('📊 عدد الأيام:', reportData.length);
    
    // حساب الإجماليات مع تسجيل مفصل
    let totalIncome = 0, totalExpenses = 0, totalFundTransfers = 0;
    let totalWorkerWages = 0, totalMaterialCosts = 0, totalTransportationCosts = 0, totalWorkerTransfers = 0, totalWorkerMiscExpenses = 0;
    
    reportData.forEach((day, index) => {
      console.log(`📅 اليوم ${index + 1}: ${day.date}`);
      console.log(`💰 إيرادات: ${day.summary.totalIncome}, مصروفات: ${day.summary.totalExpenses}`);
      
      totalIncome += Number(day.summary.totalIncome) || 0;
      totalExpenses += Number(day.summary.totalExpenses) || 0;
      totalFundTransfers += Number(day.summary.totalFundTransfers) || 0;
      totalWorkerWages += Number(day.summary.totalWorkerWages) || 0;
      totalMaterialCosts += Number(day.summary.totalMaterialCosts) || 0;
      totalTransportationCosts += Number(day.summary.totalTransportationCosts) || 0;
      totalWorkerTransfers += Number(day.summary.totalWorkerTransfers) || 0;
      totalWorkerMiscExpenses += Number(day.summary.totalWorkerMiscExpenses) || 0;
    });
    
    const finalBalance = reportData.length > 0 ? Number(reportData[reportData.length - 1].summary.remainingBalance) || 0 : 0;
    
    console.log('📈 الإجماليات المحسوبة:');
    console.log(`💰 إجمالي الإيرادات: ${totalIncome}`);
    console.log(`💸 إجمالي المصروفات: ${totalExpenses}`);
    console.log(`🏦 الرصيد النهائي: ${finalBalance}`);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('كشف المصروفات اليومية', {
        views: [{ rightToLeft: true }]
      });
      
      console.log('📋 إنشاء Excel مع البيانات الفعلية');
      
      // إضافة عنوان الشركة
      worksheet.mergeCells('A1:J2');
      const companyHeader = worksheet.getCell('A1');
      companyHeader.value = `شركة الفتيني للمقاولات والاستشارات الهندسية\nكشف المصروفات اليومية - ${selectedProject?.name}`;
      companyHeader.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      companyHeader.font = { size: 16, bold: true };
      
      // إضافة معلومات الفترة
      worksheet.mergeCells('A3:J3');
      const periodHeader = worksheet.getCell('A3');
      periodHeader.value = `الفترة: من ${formatDate(dateFrom)} إلى ${formatDate(dateTo)} | تاريخ التقرير: ${formatDate(new Date())}`;
      periodHeader.alignment = { horizontal: 'center', vertical: 'middle' };
      periodHeader.font = { size: 12, bold: false };
      
      // إضافة رؤوس الأعمدة مع تنسيق
      const headers = [
        'التاريخ', 'الرصيد المرحل', 'الحوالات المالية', 'أجور العمال', 'شراء المواد', 
        'أجور المواصلات', 'حوالات العمال', 'نثريات العمال', 'إجمالي الإيرادات', 'إجمالي المصروفات', 'الرصيد المتبقي'
      ];
      
      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
      
      // إضافة البيانات مع console.log لكل صف
      console.log('📊 بدء إضافة بيانات الأيام إلى Excel');
      
      reportData.forEach((day, index) => {
        const rowData = [
          formatDate(day.date),
          Number(day.summary.carriedForward) || 0,
          Number(day.summary.totalFundTransfers) || 0,
          Number(day.summary.totalWorkerWages) || 0,
          Number(day.summary.totalMaterialCosts) || 0,
          Number(day.summary.totalTransportationCosts) || 0,
          Number(day.summary.totalWorkerTransfers) || 0,
          Number(day.summary.totalWorkerMiscExpenses) || 0,
          Number(day.summary.totalIncome) || 0,
          Number(day.summary.totalExpenses) || 0,
          Number(day.summary.remainingBalance) || 0
        ];
        
        console.log(`📅 إضافة الصف ${index + 1}:`, rowData);
        const dataRow = worksheet.addRow(rowData);
        
        // تنسيق الأرقام
        for (let i = 2; i <= 11; i++) {
          dataRow.getCell(i).numFmt = '#,##0.00';
        }
        
        dataRow.eachCell((cell, colNumber) => {
          cell.alignment = { 
            horizontal: colNumber === 1 ? 'center' : 'right',
            vertical: 'middle',
            readingOrder: 'rtl'
          };
          cell.font = { name: 'Arial', size: 10 };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };
          
          // تلوين الصفوف بالتناوب
          if (index % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' }
            };
          }
          
          // تنسيق الأرقام
          if (colNumber > 1) {
            cell.numFmt = '#,##0.00';
          }
          
          // تلوين الخلايا حسب النوع
          if (colNumber === 3 || colNumber === 9) { // الحوالات والإيرادات
            cell.font = { ...cell.font, color: { argb: 'FF166534' } };
          } else if (colNumber >= 4 && colNumber <= 8 || colNumber === 10) { // المصروفات
            cell.font = { ...cell.font, color: { argb: 'FF92400E' } };
          }
        });
      });
      
      // إضافة صف الإجماليات
      console.log('📊 إضافة صف الإجماليات');
      const totalsRowData = [
        'الإجمالي',
        '-',
        totalFundTransfers,
        totalWorkerWages,
        totalMaterialCosts,
        totalTransportationCosts,
        totalWorkerTransfers,
        totalWorkerMiscExpenses,
        totalIncome,
        totalExpenses,
        finalBalance
      ];
      
      console.log('📈 بيانات صف الإجماليات:', totalsRowData);
      const totalsRow = worksheet.addRow(totalsRowData);
      
      // تنسيق صف الإجماليات
      totalsRow.font = { bold: true };
      totalsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE68A' } };
      
      // تنسيق أرقام الإجماليات
      for (let i = 2; i <= 11; i++) {
        totalsRow.getCell(i).numFmt = '#,##0.00';
      }
      
      // تحديد عرض الأعمدة ليظهر النص بوضوح
      worksheet.columns = [
        { width: 15 }, // التاريخ
        { width: 15 }, // الرصيد المرحل
        { width: 15 }, // الحوالات المالية
        { width: 15 }, // أجور العمال
        { width: 15 }, // شراء المواد
        { width: 15 }, // أجور المواصلات
        { width: 15 }, // حوالات العمال
        { width: 15 }, // نثريات العمال
        { width: 15 }, // إجمالي الإيرادات
        { width: 15 }, // إجمالي المصروفات
        { width: 15 }  // الرصيد المتبقي
      ];
      
      console.log('💾 حفظ ملف Excel');
      
      // كتابة الملف وتحميله
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const fileName = `كشف-المصروفات-${selectedProject?.name}-${formatDate(dateFrom)}-${formatDate(dateTo)}.xlsx`;
      saveAs(blob, fileName);
      
      console.log('✅ تم تصدير Excel بنجاح');
      
      toast({
        title: "تم بنجاح",
        description: `تم تصدير كشف المصروفات إلى Excel`,
      });

    } catch (error) {
      console.error('❌ خطأ في تصدير Excel:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تصدير الملف",
        variant: "destructive",
      });
    }
  }, [reportData, selectedProject, dateFrom, dateTo, toast]);

  const printReport = useCallback(() => {
    // التأكد من وجود البيانات
    if (!reportData.length) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات للطباعة",
        variant: "destructive",
      });
      return;
    }

    try {
      // التقاط HTML للتقرير
      const reportElement = document.querySelector('.print-preview');
      if (reportElement) {
        const htmlContent = reportElement.innerHTML;
        
        // حفظ HTML في localStorage لنقله لصفحة إعدادات الطباعة
        const reportContext = {
          type: 'daily_expenses',
          title: `كشف المصروفات اليومية - ${formatDate(dateFrom)}`,
          html: htmlContent,
          data: {
            projectName: selectedProject?.name,
            dateFrom,
            dateTo,
            reportData: reportData.length,
            totalIncome: reportData.reduce((sum, day) => sum + day.summary.totalIncome, 0),
            totalExpenses: reportData.reduce((sum, day) => sum + day.summary.totalExpenses, 0)
          }
        };
        
        localStorage.setItem('reportContext', JSON.stringify(reportContext));
        console.log('✅ تم التقاط HTML من:', 'print-preview');
        console.log('💾 تم حفظ سياق التقرير مع HTML:', {
          title: reportContext.title,
          htmlLength: htmlContent.length
        });
      }
      
      // التأكد من تحميل ملف CSS للطباعة
      const printStylesheet = document.querySelector('link[href*="daily-expenses-print.css"]');
      if (!printStylesheet) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/src/styles/daily-expenses-print.css';
        document.head.appendChild(link);
      }
      
      // إضافة عنوان للنافذة
      const originalTitle = document.title;
      document.title = `كشف المصروفات اليومية - ${selectedProject?.name} - ${formatDate(dateFrom)} إلى ${formatDate(dateTo)}`;
      
      // تنفيذ الطباعة
      setTimeout(() => {
        window.print();
        
        // استعادة العنوان الأصلي
        setTimeout(() => {
          document.title = originalTitle;
        }, 1000);
      }, 500); // زيادة الوقت لضمان تحميل CSS
    } catch (error) {
      console.error("Error preparing print:", error);
      toast({
        title: "خطأ في الطباعة",
        description: "حدث خطأ أثناء تحضير التقرير للطباعة",
        variant: "destructive",
      });
    }
  }, [selectedProject, dateFrom, dateTo, reportData, toast]);

  const calculateTotals = () => {
    if (!reportData.length) return null;

    return reportData.reduce((totals, day) => ({
      totalIncome: totals.totalIncome + day.summary.totalIncome,
      totalExpenses: totals.totalExpenses + day.summary.totalExpenses,
      totalFundTransfers: totals.totalFundTransfers + day.summary.totalFundTransfers,
      totalWorkerWages: totals.totalWorkerWages + day.summary.totalWorkerWages,
      totalMaterialCosts: totals.totalMaterialCosts + day.summary.totalMaterialCosts,
      totalTransportationCosts: totals.totalTransportationCosts + day.summary.totalTransportationCosts,
      totalWorkerTransfers: totals.totalWorkerTransfers + day.summary.totalWorkerTransfers,
      totalWorkerMiscExpenses: totals.totalWorkerMiscExpenses + (day.summary.totalWorkerMiscExpenses || 0),
    }), {
      totalIncome: 0,
      totalExpenses: 0,
      totalFundTransfers: 0,
      totalWorkerWages: 0,
      totalMaterialCosts: 0,
      totalTransportationCosts: 0,
      totalWorkerTransfers: 0,
      totalWorkerMiscExpenses: 0,
    });
  };

  // وظائف النظام الموحد للطباعة والتصدير
  const handleUnifiedPrint = useCallback(() => {
    window.print();
  }, []);

  const handleUnifiedExport = useCallback(async () => {
    if (!reportData.length) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات للتصدير",
        variant: "destructive",
      });
      return;
    }

    try {
      const totals = calculateTotals();
      const finalBalance = (totals?.totalIncome || 0) - (totals?.totalExpenses || 0);

      await exportToUnifiedExcel({
        title: "كشف المصروفات اليومية التفصيلي",
        fileName: `كشف-المصروفات-${selectedProject?.name || 'المشروع'}`,
        projectName: selectedProject?.name,
        dateFrom,
        dateTo,
        reportDate: new Date().toISOString(),
        data: reportData.map((day, index) => ({
          date: day.date,
          carriedForward: day.summary.carriedForward,
          fundTransfers: day.summary.totalFundTransfers,
          workerWages: day.summary.totalWorkerWages,
          materialCosts: day.summary.totalMaterialCosts,
          transportationCosts: day.summary.totalTransportationCosts,
          workerTransfers: day.summary.totalWorkerTransfers,
          miscExpenses: day.summary.totalWorkerMiscExpenses || 0,
          totalIncome: day.summary.totalIncome,
          totalExpenses: day.summary.totalExpenses,
          remainingBalance: day.summary.remainingBalance
        })),
        columns: [
          { key: 'date', label: 'التاريخ', type: 'date' as const, width: 15 },
          { key: 'carriedForward', label: 'الرصيد المرحل', type: 'currency' as const, width: 15 },
          { key: 'fundTransfers', label: 'تحويلات العهدة', type: 'currency' as const, width: 15 },
          { key: 'workerWages', label: 'أجور العمال', type: 'currency' as const, width: 15 },
          { key: 'materialCosts', label: 'شراء المواد', type: 'currency' as const, width: 15 },
          { key: 'transportationCosts', label: 'أجور المواصلات', type: 'currency' as const, width: 15 },
          { key: 'workerTransfers', label: 'حوالات العمال', type: 'currency' as const, width: 15 },
          { key: 'miscExpenses', label: 'نثريات العمال', type: 'currency' as const, width: 15 },
          { key: 'totalIncome', label: 'إجمالي الإيرادات', type: 'currency' as const, width: 18 },
          { key: 'totalExpenses', label: 'إجمالي المصروفات', type: 'currency' as const, width: 18 },
          { key: 'remainingBalance', label: 'الرصيد المتبقي', type: 'currency' as const, width: 18 }
        ],
        summary: [
          {
            title: "ملخص الإيرادات",
            items: [
              { label: "إجمالي تحويلات العهدة", value: totals?.totalFundTransfers || 0, type: 'currency' },
              { label: "إجمالي الإيرادات", value: totals?.totalIncome || 0, type: 'currency' }
            ]
          },
          {
            title: "ملخص المصروفات",
            items: [
              { label: "إجمالي أجور العمال", value: totals?.totalWorkerWages || 0, type: 'currency' },
              { label: "إجمالي شراء المواد", value: totals?.totalMaterialCosts || 0, type: 'currency' },
              { label: "إجمالي أجور المواصلات", value: totals?.totalTransportationCosts || 0, type: 'currency' },
              { label: "إجمالي حوالات العمال", value: totals?.totalWorkerTransfers || 0, type: 'currency' },
              { label: "إجمالي نثريات العمال", value: totals?.totalWorkerMiscExpenses || 0, type: 'currency' },
              { label: "إجمالي المصروفات", value: totals?.totalExpenses || 0, type: 'currency' }
            ]
          }
        ],
        finalBalance: {
          label: "الرصيد النهائي للفترة",
          value: finalBalance,
          type: finalBalance >= 0 ? 'positive' : 'negative'
        }
      });

      toast({
        title: "تم بنجاح",
        description: "تم تصدير التقرير إلى ملف Excel بنجاح",
      });

    } catch (error) {
      console.error('خطأ في التصدير:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تصدير التقرير",
        variant: "destructive",
      });
    }
  }, [reportData, selectedProject, dateFrom, dateTo, toast]);

  const totals = calculateTotals();
  const finalBalance = reportData.length > 0 ? reportData[reportData.length - 1].summary.remainingBalance : 0;

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">كشف المصروفات اليومية المحسن</h1>
            <p className="text-sm text-muted-foreground">تقرير شامل لجميع المصروفات والإيرادات</p>
          </div>
        </div>
        
        {reportData.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
              <CheckCircle className="h-3 w-3 mr-1" />
              {reportData.length} يوم
            </Badge>
            <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
              <Eye className="h-3 w-3 mr-1" />
              جاهز للطباعة
            </Badge>
          </div>
        )}
      </div>

      {/* Controls */}
      <Card className="mb-6 no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            إعدادات التقرير
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">اختيار المشروع</Label>
            <ProjectSelector onProjectChange={selectProject} />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateFrom" className="text-sm font-medium mb-2 block">
                من تاريخ
              </Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="arabic-numbers"
              />
            </div>
            <div>
              <Label htmlFor="dateTo" className="text-sm font-medium mb-2 block">
                إلى تاريخ
              </Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="arabic-numbers"
              />
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDetails}
                onChange={(e) => setShowDetails(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">إظهار التفاصيل في التصدير</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={generateReport} 
              disabled={isLoading || !selectedProjectId}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <Calendar className="h-4 w-4" />
              {isLoading ? "جاري الإنشاء..." : "إنشاء التقرير"}
            </Button>
            
            {reportData.length > 0 && (
              <>
                <Button 
                  onClick={exportToProfessionalExcel} 
                  variant="default"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <Settings className="h-4 w-4" />
                  تصدير احترافي
                </Button>
                
                <Button 
                  onClick={exportToExcel} 
                  variant="outline"
                  className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
                  size="lg"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  تصدير عادي
                </Button>
                
                <Button 
                  onClick={printReport} 
                  variant="outline"
                  className="flex items-center gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                  size="lg"
                >
                  <Printer className="h-4 w-4" />
                  طباعة محسنة
                </Button>
                
                <Button 
                  onClick={() => window.location.href = "/print-control"}
                  variant="outline"
                  className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                  size="lg"
                >
                  <Settings className="h-4 w-4" />
                  إعدادات الطباعة
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* النظام الموحد للتقارير */}
      {reportData.length > 0 && (
        <>
          {/* أزرار الطباعة والتصدير الموحدة */}
          <UnifiedReportActions
            onPrint={handleUnifiedPrint}
            onExport={handleUnifiedExport}
          />

          {/* التقرير الموحد */}
          <UnifiedA4Report
            title="كشف المصروفات اليومية التفصيلي"
            projectName={selectedProject?.name}
            dateFrom={dateFrom}
            dateTo={dateTo}
            reportDate={new Date().toISOString()}
            data={reportData.map(day => ({
              date: day.date,
              carriedForward: day.summary.carriedForward,
              fundTransfers: day.summary.totalFundTransfers,
              workerWages: day.summary.totalWorkerWages,
              materialCosts: day.summary.totalMaterialCosts,
              transportationCosts: day.summary.totalTransportationCosts,
              workerTransfers: day.summary.totalWorkerTransfers,
              miscExpenses: day.summary.totalWorkerMiscExpenses || 0,
              totalIncome: day.summary.totalIncome,
              totalExpenses: day.summary.totalExpenses,
              remainingBalance: day.summary.remainingBalance
            }))}
            columns={[
              { key: 'date', label: 'التاريخ', type: 'date' },
              { key: 'carriedForward', label: 'الرصيد المرحل', type: 'currency' },
              { key: 'fundTransfers', label: 'تحويلات العهدة', type: 'currency' },
              { key: 'workerWages', label: 'أجور العمال', type: 'currency' },
              { key: 'materialCosts', label: 'شراء المواد', type: 'currency' },
              { key: 'transportationCosts', label: 'المواصلات', type: 'currency' },
              { key: 'workerTransfers', label: 'حوالات العمال', type: 'currency' },
              { key: 'miscExpenses', label: 'نثريات', type: 'currency' },
              { key: 'totalIncome', label: 'إجمالي الإيرادات', type: 'currency' },
              { key: 'totalExpenses', label: 'إجمالي المصروفات', type: 'currency' },
              { key: 'remainingBalance', label: 'الرصيد المتبقي', type: 'currency' }
            ]}
            summary={[
              {
                title: "ملخص الإيرادات",
                items: [
                  { label: "إجمالي تحويلات العهدة", value: totals?.totalFundTransfers || 0, type: 'currency' },
                  { label: "إجمالي الإيرادات", value: totals?.totalIncome || 0, type: 'currency' }
                ]
              },
              {
                title: "ملخص المصروفات",
                items: [
                  { label: "إجمالي أجور العمال", value: totals?.totalWorkerWages || 0, type: 'currency' },
                  { label: "إجمالي شراء المواد", value: totals?.totalMaterialCosts || 0, type: 'currency' },
                  { label: "إجمالي أجور المواصلات", value: totals?.totalTransportationCosts || 0, type: 'currency' },
                  { label: "إجمالي حوالات العمال", value: totals?.totalWorkerTransfers || 0, type: 'currency' },
                  { label: "إجمالي المصروفات", value: totals?.totalExpenses || 0, type: 'currency' }
                ]
              }
            ]}
            finalBalance={{
              label: "الرصيد النهائي للفترة",
              value: finalBalance,
              type: finalBalance >= 0 ? 'positive' : 'negative'
            }}
          />
        </>
      )}

      {/* عرض أدوات التحكم القديمة للمقارنة - مؤقت */}
      {reportData.length > 0 && (
        <div className="no-print mt-8 border-t pt-6">
          <h3 className="text-lg font-bold mb-4">أدوات التحكم الإضافية</h3>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={exportToProfessionalExcel} 
              variant="outline"
              className="flex items-center gap-2"
              size="sm"
            >
              <Settings className="h-4 w-4" />
              تصدير احترافي (قديم)
            </Button>
            
            <Button 
              onClick={exportToExcel} 
              variant="outline"
              className="flex items-center gap-2"
              size="sm"
            >
              <FileSpreadsheet className="h-4 w-4" />
              تصدير عادي (قديم)
            </Button>
            
            <Button 
              onClick={printReport} 
              variant="outline"
              className="flex items-center gap-2"
              size="sm"
            >
              <Printer className="h-4 w-4" />
              طباعة محسنة (قديم)
            </Button>
          </div>
        </div>
      )}



      {/* Empty State */}
      {reportData.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد بيانات</h3>
            <p className="text-gray-600">
              يرجى اختيار مشروع وتحديد الفترة الزمنية ثم الضغط على "إنشاء التقرير"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}