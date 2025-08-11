import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useSelectedProject } from "@/hooks/use-selected-project";
import { 
  Users, FileText, Download, RefreshCw, Filter, User, DollarSign, UserCheck, Printer, 
  Calendar, Clock, Building2, Phone, MapPin, CheckSquare, X
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate, getCurrentDate } from "@/lib/utils";
import { EnhancedWorkerAccountStatement } from "@/components/EnhancedWorkerAccountStatementFixed";
import type { Worker, Project } from "@shared/schema";
import * as XLSX from 'xlsx';

export default function WorkersUnifiedReports() {
  const { selectedProjectId } = useSelectedProject();
  const { toast } = useToast();
  
  // States for report modes
  const [reportMode, setReportMode] = useState<'single' | 'multiple'>('single');
  
  // Single worker states
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [singleWorkerProjectIds, setSingleWorkerProjectIds] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState(getCurrentDate());
  const [showWorkerStatement, setShowWorkerStatement] = useState(false);
  
  // Multiple workers states
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Fetch data
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedWorker = workers.find(w => w.id === selectedWorkerId);

  // Toggle worker selection for multiple mode
  const toggleWorkerSelection = (workerId: string) => {
    setSelectedWorkerIds(prev => 
      prev.includes(workerId) 
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

  // Toggle project selection
  const toggleProjectSelection = (projectId: string, mode: 'single' | 'multiple') => {
    if (mode === 'single') {
      setSingleWorkerProjectIds(prev => 
        prev.includes(projectId) 
          ? prev.filter(id => id !== projectId)
          : [...prev, projectId]
      );
    } else {
      setSelectedProjectIds(prev => 
        prev.includes(projectId) 
          ? prev.filter(id => id !== projectId)
          : [...prev, projectId]
      );
    }
  };

  // Generate single worker account statement
  const generateSingleWorkerStatement = async () => {
    if (!selectedWorkerId || !dateFrom || !dateTo) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى اختيار العامل والتواريخ",
        variant: "destructive",
      });
      return;
    }

    // إذا لم يتم تحديد مشاريع، استخدم جميع المشاريع
    const projectsToUse = singleWorkerProjectIds.length > 0 ? singleWorkerProjectIds : projects.map(p => p.id);

    setIsGenerating(true);
    try {
      // إنشاء URL مع فلترة المشاريع للعامل الواحد
      let url = `/api/workers/${selectedWorkerId}/account-statement?dateFrom=${dateFrom}&dateTo=${dateTo}`;
      
      // إضافة فلترة المشاريع - استخدام projectIds للمشاريع المتعددة
      url += `&projectIds=${projectsToUse.join(',')}`;

      console.log('🔍 جاري جمع بيانات كشف الحساب:', url);

      const response = await apiRequest('GET', url);
      
      if (response) {
        console.log('✅ تم جمع بيانات كشف الحساب:', response);
        console.log('🔍 تفاصيل البيانات المستلمة:', {
          hasWorker: !!response.worker,
          workerName: response.worker?.name,
          attendanceCount: response.attendance?.length || 0,
          transfersCount: response.transfers?.length || 0,
          summary: response.summary
        });
        
        setReportData([response]);
        setShowWorkerStatement(true);
        
        toast({
          title: "تم إنشاء كشف الحساب بنجاح ✅",
          description: `كشف حساب العامل ${response.worker?.name || 'غير محدد'}`,
        });
      } else {
        toast({
          title: "لا توجد بيانات",
          description: "لم يتم العثور على بيانات للعامل في الفترة المحددة",
          variant: "destructive",
        });
      }
      
    } catch (error: any) {
      console.error('خطأ في إنشاء كشف حساب العامل:', error);
      toast({
        title: "خطأ في إنشاء كشف الحساب",
        description: error?.message || "حدث خطأ أثناء جمع بيانات العامل",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  // Generate multiple workers report  
  const generateMultipleWorkersReport = async () => {
    if (selectedWorkerIds.length === 0 || !dateFrom || !dateTo) {
      toast({
        title: "بيانات ناقصة", 
        description: "يرجى اختيار العمال والتواريخ",
        variant: "destructive",
      });
      return;
    }

    if (selectedProjectIds.length === 0) {
      toast({
        title: "لم يتم تحديد مشاريع",
        description: "يرجى تحديد مشروع واحد على الأقل لإنشاء التقرير",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // جمع البيانات من جميع العمال المحددين
      const allAttendanceData: any[] = [];
      
      console.log('🔍 جاري جمع بيانات العمال المتعددين:', { selectedWorkerIds, selectedProjectIds });
      
      for (const workerId of selectedWorkerIds) {
        // إنشاء URL مع فلترة المشاريع
        let url = `/api/workers/${workerId}/account-statement?dateFrom=${dateFrom}&dateTo=${dateTo}`;
        
        // إضافة فلترة المشاريع - استخدام projectIds للمشاريع المتعددة
        url += `&projectIds=${selectedProjectIds.join(',')}`;

        console.log(`🔍 جمع بيانات العامل ${workerId}:`, url);

        const response = await apiRequest('GET', url);
        
        if (response && response.attendance) {
          allAttendanceData.push(...response.attendance.map((att: any) => ({
            ...att,
            workerName: response.worker?.name || '',
            workerType: response.worker?.type || '',
            workerDailyWage: response.worker?.dailyWage || 0,
            projectName: att.project?.name || ''
          })));
        }
      }

      console.log('✅ تم جمع جميع البيانات:', { totalRecords: allAttendanceData.length });

      if (allAttendanceData.length === 0) {
        toast({
          title: "لا توجد بيانات",
          description: "لم يتم العثور على بيانات حضور للعمال المحددين في الفترة المحددة",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      setReportData(allAttendanceData);
      setShowResults(true);
      
      toast({
        title: "تم إنشاء التقرير",
        description: `تم جمع بيانات ${allAttendanceData.length} سجل حضور من ${selectedWorkerIds.length} عامل`,
      });
      
    } catch (error: any) {
      console.error('خطأ في إنشاء تقرير العمال:', error);
      toast({
        title: "خطأ في إنشاء التقرير",
        description: error?.message || "حدث خطأ أثناء جمع بيانات العمال",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  // Export to Excel - Single Worker
  const exportSingleWorkerToExcel = () => {
    if (!reportData || reportData.length === 0) {
      toast({
        title: "لا توجد بيانات للتصدير",
        variant: "destructive",
      });
      return;
    }

    const data = reportData[0];
    const worker = data.worker;
    const attendance = data.attendance || [];
    const transfers = data.transfers || [];

    // حساب الإحصائيات المالية
    const totalWorkDays = attendance.reduce((sum: number, record: any) => sum + record.workDays, 0);
    const totalWorkHours = attendance.reduce((sum: number, record: any) => {
      if (record.startTime && record.endTime) {
        const start = new Date(`2000-01-01T${record.startTime}`);
        const end = new Date(`2000-01-01T${record.endTime}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return sum + (hours > 0 ? hours : 8);
      }
      return sum + 8;
    }, 0);
    const totalAmountDue = attendance.reduce((sum: number, record: any) => sum + (record.dailyWage * record.workDays), 0);
    const totalAmountReceived = attendance.reduce((sum: number, record: any) => sum + (record.paidAmount || 0), 0);
    const totalTransferred = transfers.reduce((sum: number, transfer: any) => sum + transfer.amount, 0);
    const remainingAmount = totalAmountDue - totalAmountReceived;
    const workerCurrentBalance = totalAmountDue - totalAmountReceived - totalTransferred;

    // إعداد البيانات للإكسل
    const workbook = XLSX.utils.book_new();

    // بيانات كشف الحساب بتصميم احترافي يطابق الكشف المطبوع
    const accountData = [
      // رأس الشركة
      ['شركة الفتيني للمقاولات والاستشارات الهندسية'],
      ['كشف حساب العامل الشامل والتفصيلي'],
      [''],
      // معلومات العامل والفترة
      ['معلومات العامل:'],
      ['اسم العامل:', worker?.name || ''],
      ['نوع العامل:', worker?.type || ''],
      ['رقم الهاتف:', worker?.phone || '-'],
      ['العنوان:', worker?.address || '-'],
      ['الأجر اليومي:', formatCurrency(worker?.dailyWage || 0)],
      [''],
      ['فترة التقرير:'],
      ['من تاريخ:', formatDate(dateFrom)],
      ['إلى تاريخ:', formatDate(dateTo)],
      ['تاريخ إنشاء الكشف:', new Date().toLocaleDateString('ar-EG')],
      [''],
      // ملخص مالي
      ['الملخص المالي:'],
      ['إجمالي أيام العمل:', totalWorkDays],
      ['إجمالي ساعات العمل:', totalWorkHours.toFixed(1)],
      ['إجمالي المبلغ المستحق:', formatCurrency(totalAmountDue)],
      ['إجمالي المبلغ المستلم:', formatCurrency(totalAmountReceived)],
      ['إجمالي التحويلات للأهل:', formatCurrency(totalTransferred)],
      ['المبلغ المتبقي (قبل التحويلات):', formatCurrency(remainingAmount)],
      ['الرصيد النهائي للعامل:', formatCurrency(workerCurrentBalance)],
      [''],
      // جدول تفاصيل الحضور
      ['تفاصيل الحضور:'],
      ['م', 'التاريخ', 'اسم المشروع', 'عدد الأيام', 'من الساعة', 'إلى الساعة', 'ساعات العمل', 'وصف العمل', 'الأجر المستحق', 'المبلغ المدفوع', 'المتبقي', 'نوع الدفع', 'ملاحظات'],
      // بيانات الحضور
      ...attendance.map((att: any, index: number) => {
        const workHours = att.startTime && att.endTime ? 
          (() => {
            const start = new Date(`2000-01-01T${att.startTime}`);
            const end = new Date(`2000-01-01T${att.endTime}`);
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            return hours > 0 ? hours.toFixed(1) : '8.0';
          })() : '8.0';
        
        const amountDue = att.dailyWage * att.workDays;
        const remaining = amountDue - (att.paidAmount || 0);
        
        return [
          index + 1,
          formatDate(att.date),
          att.project?.name || '-',
          att.workDays.toFixed(1),
          att.startTime || '-',
          att.endTime || '-',
          workHours,
          att.workDescription || '-',
          formatCurrency(amountDue),
          formatCurrency(att.paidAmount || 0),
          formatCurrency(remaining),
          att.paymentType === 'full' ? 'كامل' : att.paymentType === 'partial' ? 'جزئي' : att.paymentType === 'none' ? 'لم يُدفع' : (att.paymentType || '-'),
          att.notes || '-'
        ];
      }),
      [''],
      // صف الإجماليات
      ['', '', '', totalWorkDays.toFixed(1), '', '', totalWorkHours.toFixed(1), 'الإجماليات:', formatCurrency(totalAmountDue), formatCurrency(totalAmountReceived), formatCurrency(remainingAmount), '', ''],
      [''],
    ];

    // إضافة تحويلات الأهل إذا وجدت
    if (transfers && transfers.length > 0) {
      accountData.push(
        ['تحويلات الأهل:'],
        ['م', 'التاريخ', 'المبلغ', 'رقم التحويل', 'اسم المرسل', 'اسم المستلم', 'رقم المستلم', 'طريقة التحويل', 'ملاحظات'],
        ...transfers.map((transfer: any, index: number) => [
          index + 1,
          formatDate(transfer.date),
          formatCurrency(transfer.amount),
          transfer.transferNumber || '-',
          transfer.senderName || '-',
          transfer.recipientName || '-',
          transfer.recipientPhone || '-',
          transfer.transferMethod === 'hawaleh' ? 'حوالة' : transfer.transferMethod === 'bank' ? 'بنك' : 'نقداً',
          transfer.notes || '-'
        ]),
        [''],
        ['', 'إجمالي التحويلات:', formatCurrency(totalTransferred), '', '', '', '', '', ''],
        ['']
      );
    }

    // تذييل الكشف
    accountData.push(
      ['تم إنشاء هذا الكشف آلياً بواسطة نظام إدارة مشاريع البناء'],
      [`التاريخ والوقت: ${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG')}`]
    );

    const worksheet = XLSX.utils.aoa_to_sheet(accountData);
    
    // تنسيق عرض الأعمدة
    worksheet['!cols'] = [
      { width: 5 },   // م
      { width: 12 },  // التاريخ
      { width: 20 },  // اسم المشروع
      { width: 8 },   // عدد الأيام
      { width: 10 },  // من الساعة
      { width: 10 },  // إلى الساعة
      { width: 10 },  // ساعات العمل
      { width: 25 },  // وصف العمل
      { width: 12 },  // الأجر المستحق
      { width: 12 },  // المبلغ المدفوع
      { width: 12 },  // المتبقي
      { width: 12 },  // نوع الدفع
      { width: 20 }   // ملاحظات
    ];

    // تنسيق الخلايا (تحديد النطاقات المدمجة للعناوين)
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }, // عنوان الشركة
      { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } }, // عنوان الكشف
    ];
    worksheet['!merges'] = merges;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'كشف حساب العامل');

    // حفظ الملف
    const fileName = `كشف_حساب_${worker?.name || 'عامل'}_${formatDate(dateFrom)}_${formatDate(dateTo)}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "تم تصدير كشف الحساب",
      description: `تم حفظ الملف: ${fileName}`,
    });
  };

  // Export to Excel - Multiple Workers
  const exportMultipleWorkersToExcel = () => {
    if (!reportData || reportData.length === 0) {
      toast({
        title: "لا توجد بيانات للتصدير",
        variant: "destructive",
      });
      return;
    }

    const workbook = XLSX.utils.book_new();

    // حساب الإحصائيات
    const totalWorkDays = reportData.reduce((sum, row) => sum + row.workDays, 0);
    const totalAmountDue = reportData.reduce((sum, row) => sum + (row.dailyWage * row.workDays), 0);
    const totalPaidAmount = reportData.reduce((sum, row) => sum + (row.paidAmount || 0), 0);
    const totalRemaining = totalAmountDue - totalPaidAmount;

    // ورقة التقرير بتصميم احترافي يطابق الكشف المطبوع
    const reportDataForExcel = [
      // رأس الشركة
      ['شركة الفتيني للمقاولات والاستشارات الهندسية'],
      ['تقرير تصفية العمال الموحد والتفصيلي'],
      [''],
      // معلومات التقرير
      ['معلومات التقرير:'],
      ['الفترة:', `من ${formatDate(dateFrom)} إلى ${formatDate(dateTo)}`],
      ['تاريخ إنشاء التقرير:', new Date().toLocaleDateString('ar-EG')],
      ['عدد العمال المحددين:', selectedWorkerIds.length],
      ['عدد المشاريع:', selectedProjectIds.length || 'جميع المشاريع'],
      ['إجمالي السجلات:', reportData.length],
      [''],
      // ملخص الإحصائيات
      ['ملخص الإحصائيات المالية:'],
      ['إجمالي أيام العمل:', totalWorkDays],
      ['إجمالي المبلغ المستحق:', formatCurrency(totalAmountDue)],
      ['إجمالي المبلغ المدفوع:', formatCurrency(totalPaidAmount)],
      ['إجمالي المبلغ المتبقي:', formatCurrency(totalRemaining)],
      [''],
      // عنوان الجدول
      ['تفاصيل حضور العمال:'],
      ['م', 'اسم العامل', 'نوع العامل', 'الأجر اليومي', 'التاريخ', 'اسم المشروع', 'عدد الأيام', 'وصف العمل', 'الأجر المستحق', 'المبلغ المدفوع', 'المبلغ المتبقي', 'نوع الدفع', 'ملاحظات'],
      // بيانات العمال مع ترقيم
      ...reportData.map((row: any, index: number) => [
        index + 1,
        row.workerName,
        row.workerType,
        formatCurrency(row.workerDailyWage),
        formatDate(row.date),
        row.projectName,
        row.workDays,
        row.workDescription || '-',
        formatCurrency(row.dailyWage * row.workDays),
        formatCurrency(row.paidAmount || 0),
        formatCurrency((row.dailyWage * row.workDays) - (row.paidAmount || 0)),
        row.paymentType === 'full' ? 'كامل' : row.paymentType === 'partial' ? 'جزئي' : row.paymentType === 'none' ? 'لم يُدفع' : (row.paymentType || '-'),
        row.notes || '-'
      ]),
      [''],
      // صف الإجماليات
      ['', '', '', '', '', '', 'الإجماليات:', totalWorkDays, formatCurrency(totalAmountDue), formatCurrency(totalPaidAmount), formatCurrency(totalRemaining), '', ''],
      [''],
      // تذييل التقرير
      ['تم إنشاء هذا التقرير آلياً بواسطة نظام إدارة مشاريع البناء'],
      [`التاريخ والوقت: ${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG')}`],
      ['']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(reportDataForExcel);
    
    // تنسيق عرض الأعمدة
    worksheet['!cols'] = [
      { width: 5 },   // م
      { width: 18 },  // اسم العامل
      { width: 12 },  // نوع العامل
      { width: 12 },  // الأجر اليومي
      { width: 12 },  // التاريخ
      { width: 20 },  // اسم المشروع
      { width: 8 },   // عدد الأيام
      { width: 25 },  // وصف العمل
      { width: 12 },  // الأجر المستحق
      { width: 12 },  // المبلغ المدفوع
      { width: 12 },  // المبلغ المتبقي
      { width: 12 },  // نوع الدفع
      { width: 20 }   // ملاحظات
    ];

    // تنسيق الخلايا (تحديد النطاقات المدمجة للعناوين)
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }, // عنوان الشركة
      { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } }, // عنوان التقرير
    ];
    worksheet['!merges'] = merges;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'تقرير العمال');

    // حفظ الملف
    const fileName = `تقرير_تصفية_العمال_${formatDate(dateFrom)}_${formatDate(dateTo)}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "تم تصدير التقرير",
      description: `تم حفظ الملف: ${fileName}`,
    });
  };

  // Print function for multiple workers
  const handlePrint = () => {
    if (reportMode === 'multiple') {
      const printContent = document.getElementById('printable-multiple-workers');
      if (printContent) {
        const originalContent = document.body.innerHTML;
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload(); // إعادة تحميل لاستعادة الحالة الأصلية
      }
    } else {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="border-t-4 border-t-blue-500 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <CardTitle className="text-2xl font-bold text-center text-blue-800 dark:text-blue-200 flex items-center justify-center gap-3">
              <Users className="h-8 w-8" />
              تقارير العمال الموحدة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            
            {/* Report Mode Selection */}
            <div className="mb-6">
              <Label className="text-base font-semibold mb-3 block">اختر نوع التقرير:</Label>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setReportMode('single');
                    setShowWorkerStatement(false);
                    setShowResults(false);
                  }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${
                    reportMode === 'single'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
                  }`}
                >
                  <User className="h-5 w-5" />
                  كشف حساب العامل الواحد
                </button>
                <button
                  onClick={() => {
                    setReportMode('multiple');
                    setShowWorkerStatement(false);
                    setShowResults(false);
                  }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${
                    reportMode === 'multiple'
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  تقرير تصفية العمال
                </button>
              </div>
            </div>

            {/* Date Range Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="dateFrom" className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  من تاريخ
                </Label>
                <Input
                  type="date"
                  id="dateFrom"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="border-2 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="dateTo" className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  إلى تاريخ
                </Label>
                <Input
                  type="date"
                  id="dateTo"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border-2 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Single Worker Mode */}
            {reportMode === 'single' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Worker Selection */}
                  <div>
                    <Label className="flex items-center gap-2 mb-3 text-base font-semibold">
                      <User className="h-5 w-5 text-green-500" />
                      اختيار العامل
                    </Label>
                    <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                      <SelectTrigger className="border-2 focus:border-green-500">
                        <SelectValue placeholder="اختر العامل..." />
                      </SelectTrigger>
                      <SelectContent>
                        {workers.map((worker) => (
                          <SelectItem key={worker.id} value={worker.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{worker.name}</span>
                              <Badge variant="secondary" className="mr-2">
                                {worker.type}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Project Selection for Single Worker */}
                  <div>
                    <Label className="flex items-center gap-2 mb-3 text-base font-semibold">
                      <Building2 className="h-5 w-5 text-purple-500" />
                      اختيار المشاريع (اختياري)
                    </Label>
                    <div className="border rounded-lg p-4 max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Checkbox
                          id="select-all-single"
                          checked={singleWorkerProjectIds.length === projects.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSingleWorkerProjectIds(projects.map(p => p.id));
                            } else {
                              setSingleWorkerProjectIds([]);
                            }
                          }}
                        />
                        <Label htmlFor="select-all-single" className="font-medium text-blue-600">
                          تحديد جميع المشاريع ({projects.length})
                        </Label>
                      </div>
                      <div className="space-y-2">
                        {projects.map((project) => (
                          <div key={project.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`single-project-${project.id}`}
                              checked={singleWorkerProjectIds.includes(project.id)}
                              onCheckedChange={() => toggleProjectSelection(project.id, 'single')}
                            />
                            <Label htmlFor={`single-project-${project.id}`} className="flex-1">
                              {project.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {singleWorkerProjectIds.length === 0 && (
                        <p className="text-sm text-gray-500 mt-2">
                          * إذا لم تحدد أي مشروع، سيتم عرض جميع المشاريع
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Generate Button for Single Worker */}
                <div className="flex justify-center">
                  <Button
                    onClick={generateSingleWorkerStatement}
                    disabled={isGenerating || !selectedWorkerId || !dateFrom || !dateTo}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        جاري إنشاء كشف الحساب...
                      </>
                    ) : (
                      <>
                        <FileText className="h-5 w-5 mr-2" />
                        إنشاء كشف حساب العامل
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Multiple Workers Mode */}
            {reportMode === 'multiple' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Workers Selection */}
                  <div>
                    <Label className="flex items-center gap-2 mb-3 text-base font-semibold">
                      <Users className="h-5 w-5 text-blue-500" />
                      اختيار العمال
                    </Label>
                    <div className="border rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Checkbox
                          id="select-all-workers"
                          checked={selectedWorkerIds.length === workers.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedWorkerIds(workers.map(w => w.id));
                            } else {
                              setSelectedWorkerIds([]);
                            }
                          }}
                        />
                        <Label htmlFor="select-all-workers" className="font-medium text-blue-600">
                          تحديد جميع العمال ({workers.length})
                        </Label>
                      </div>
                      <div className="space-y-2">
                        {workers.map((worker) => (
                          <div key={worker.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`worker-${worker.id}`}
                              checked={selectedWorkerIds.includes(worker.id)}
                              onCheckedChange={() => toggleWorkerSelection(worker.id)}
                            />
                            <Label htmlFor={`worker-${worker.id}`} className="flex-1 flex items-center justify-between">
                              <span>{worker.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {worker.type}
                              </Badge>
                            </Label>
                          </div>
                        ))}
                      </div>
                      {selectedWorkerIds.length > 0 && (
                        <p className="text-sm text-green-600 mt-2">
                          تم تحديد {selectedWorkerIds.length} عامل
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Projects Selection for Multiple Workers */}
                  <div>
                    <Label className="flex items-center gap-2 mb-3 text-base font-semibold">
                      <Building2 className="h-5 w-5 text-purple-500" />
                      اختيار المشاريع (اختياري)
                    </Label>
                    <div className="border rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Checkbox
                          id="select-all-multiple"
                          checked={selectedProjectIds.length === projects.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProjectIds(projects.map(p => p.id));
                            } else {
                              setSelectedProjectIds([]);
                            }
                          }}
                        />
                        <Label htmlFor="select-all-multiple" className="font-medium text-purple-600">
                          تحديد جميع المشاريع ({projects.length})
                        </Label>
                      </div>
                      <div className="space-y-2">
                        {projects.map((project) => (
                          <div key={project.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`multiple-project-${project.id}`}
                              checked={selectedProjectIds.includes(project.id)}
                              onCheckedChange={() => toggleProjectSelection(project.id, 'multiple')}
                            />
                            <Label htmlFor={`multiple-project-${project.id}`} className="flex-1">
                              {project.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {selectedProjectIds.length === 0 && (
                        <p className="text-sm text-gray-500 mt-2">
                          * إذا لم تحدد أي مشروع، سيتم عرض جميع المشاريع
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Generate Button for Multiple Workers */}
                <div className="flex justify-center">
                  <Button
                    onClick={generateMultipleWorkersReport}
                    disabled={isGenerating || selectedWorkerIds.length === 0 || !dateFrom || !dateTo}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        جاري إنشاء التقرير...
                      </>
                    ) : (
                      <>
                        <Filter className="h-5 w-5 mr-2" />
                        إنشاء تقرير تصفية العمال
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Single Worker Statement Display */}
        {showWorkerStatement && reportData.length > 0 && reportMode === 'single' && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-green-800 dark:text-green-200">
                  كشف حساب العامل: {selectedWorker?.name}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <EnhancedWorkerAccountStatement
                data={reportData[0]}
                selectedProject={{
                  id: singleWorkerProjectIds.length === 1 ? singleWorkerProjectIds[0] : '',
                  name: singleWorkerProjectIds.length === 0 ? 'جميع المشاريع' :
                        singleWorkerProjectIds.length === 1 ? 
                        projects.find(p => p.id === singleWorkerProjectIds[0])?.name || 'غير محدد' :
                        `${singleWorkerProjectIds.length} مشاريع محددة`
                }}
                workerId={selectedWorkerId}
                dateFrom={dateFrom}
                dateTo={dateTo}
              />
            </CardContent>
          </Card>
        )}

        {/* Multiple Workers Report Display */}
        {showResults && reportData.length > 0 && reportMode === 'multiple' && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-blue-800 dark:text-blue-200">
                  تقرير تصفية العمال ({reportData.length} سجل)
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={exportMultipleWorkersToExcel}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    تصدير إكسل
                  </Button>
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    طباعة
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div id="printable-multiple-workers" className="print:p-0 print:m-0">
                
                {/* Company Header - Same as Individual Worker Statement */}
                <div className="company-header bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 print:bg-blue-600 print:text-black print:border print:border-gray-400">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2 print:text-lg">شركة الفتيني للمقاولات والاستشارات الهندسية</h1>
                    <p className="text-lg opacity-90 print:text-sm">تقرير تصفية العمال المتعددين</p>
                    <div className="mt-3 text-sm print:text-xs">
                      <p>الفترة من {formatDate(dateFrom)} إلى {formatDate(dateTo)}</p>
                      <p>المشاريع: {selectedProjectIds.length === 0 ? 'جميع المشاريع' : 
                        selectedProjectIds.length === projects.length ? 'جميع المشاريع' :
                        selectedProjectIds.map(id => projects.find(p => p.id === id)?.name).join(' - ')
                      }</p>
                    </div>
                  </div>
                </div>

                {/* Financial Summary - Same style as Individual Worker */}
                <div className="financial-summary bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 print:bg-gray-100 print:border-b print:border-gray-400">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center print:grid-cols-4 print:gap-2">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow print:bg-transparent print:shadow-none print:border print:border-gray-300 print:p-2">
                      <div className="text-lg font-bold text-blue-600 print:text-sm">
                        {reportData.reduce((sum, row) => sum + row.workDays, 0)}
                      </div>
                      <div className="text-xs text-gray-600 print:text-xs">إجمالي أيام العمل</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow print:bg-transparent print:shadow-none print:border print:border-gray-300 print:p-2">
                      <div className="text-lg font-bold text-green-600 print:text-sm">
                        {formatCurrency(reportData.reduce((sum, row) => sum + (row.dailyWage * row.workDays), 0))}
                      </div>
                      <div className="text-xs text-gray-600 print:text-xs">إجمالي المستحق</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow print:bg-transparent print:shadow-none print:border print:border-gray-300 print:p-2">
                      <div className="text-lg font-bold text-purple-600 print:text-sm">
                        {formatCurrency(reportData.reduce((sum, row) => sum + (row.paidAmount || 0), 0))}
                      </div>
                      <div className="text-xs text-gray-600 print:text-xs">إجمالي المدفوع</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow print:bg-transparent print:shadow-none print:border print:border-gray-300 print:p-2">
                      <div className="text-lg font-bold text-orange-600 print:text-sm">
                        {formatCurrency(reportData.reduce((sum, row) => sum + (row.dailyWage * row.workDays) - (row.paidAmount || 0), 0))}
                      </div>
                      <div className="text-xs text-gray-600 print:text-xs">المبلغ المتبقي</div>
                    </div>
                  </div>
                </div>

                {/* Workers Details Table */}
                <div className="p-6 print:p-4">
                  <div className="overflow-x-auto">
                    <Table className="w-full print:text-xs">
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-800 print:bg-gray-200 print:border print:border-gray-400">
                          <TableHead className="text-center font-bold align-middle border print:border-gray-400 print:py-1 print:text-xs">العامل</TableHead>
                          <TableHead className="text-center font-bold align-middle border print:border-gray-400 print:py-1 print:text-xs">النوع</TableHead>
                          <TableHead className="text-center font-bold align-middle border print:border-gray-400 print:py-1 print:text-xs">الأجر اليومي</TableHead>
                          <TableHead className="text-center font-bold align-middle border print:border-gray-400 print:py-1 print:text-xs">التاريخ</TableHead>
                          <TableHead className="text-center font-bold align-middle border print:border-gray-400 print:py-1 print:text-xs">المشروع</TableHead>
                          <TableHead className="text-center font-bold align-middle border print:border-gray-400 print:py-1 print:text-xs">الأيام</TableHead>
                          <TableHead className="text-center font-bold align-middle border print:border-gray-400 print:py-1 print:text-xs">المستحق</TableHead>
                          <TableHead className="text-center font-bold align-middle border print:border-gray-400 print:py-1 print:text-xs">المدفوع</TableHead>
                          <TableHead className="text-center font-bold align-middle border print:border-gray-400 print:py-1 print:text-xs">المتبقي</TableHead>
                          <TableHead className="text-center font-bold align-middle border print:border-gray-400 print:py-1 print:text-xs screen-only">نوع الدفع</TableHead>
                          <TableHead className="text-center font-bold align-middle border print:border-gray-400 print:py-1 print:text-xs screen-only">ملاحظات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.map((row, index) => {
                          const remainingAmount = (row.dailyWage * row.workDays) - (row.paidAmount || 0);
                          return (
                            <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800 print:border print:border-gray-300">
                              <TableCell className="font-medium text-center align-middle border print:border-gray-300 print:py-1 print:text-xs">{row.workerName}</TableCell>
                              <TableCell className="text-center align-middle border print:border-gray-300 print:py-1 print:text-xs">
                                <span className="print:hidden"><Badge variant="outline">{row.workerType}</Badge></span>
                                <span className="hidden print:inline">{row.workerType}</span>
                              </TableCell>
                              <TableCell className="text-center align-middle border print:border-gray-300 print:py-1 print:text-xs">{formatCurrency(row.workerDailyWage)}</TableCell>
                              <TableCell className="text-center align-middle border print:border-gray-300 print:py-1 print:text-xs">{formatDate(row.date)}</TableCell>
                              <TableCell className="font-medium text-center align-middle border print:border-gray-300 print:py-1 print:text-xs">{row.projectName}</TableCell>
                              <TableCell className="text-center align-middle border print:border-gray-300 print:py-1 print:text-xs">{row.workDays}</TableCell>
                              <TableCell className="font-bold text-blue-600 text-center align-middle border print:border-gray-300 print:py-1 print:text-xs print:text-black">
                                {formatCurrency(row.dailyWage * row.workDays)}
                              </TableCell>
                              <TableCell className="font-bold text-green-600 text-center align-middle border print:border-gray-300 print:py-1 print:text-xs print:text-black">
                                {formatCurrency(row.paidAmount || 0)}
                              </TableCell>
                              <TableCell className={`font-bold text-center align-middle border print:border-gray-300 print:py-1 print:text-xs print:text-black ${remainingAmount > 0 ? 'text-orange-600' : remainingAmount < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                {formatCurrency(remainingAmount)}
                              </TableCell>
                              <TableCell className="text-center align-middle border print:border-gray-300 print:py-1 print:text-xs screen-only">
                                <Badge variant={row.paymentType === 'full' ? 'default' : 'secondary'}>
                                  {row.paymentType === 'full' ? 'كامل' : 
                                   row.paymentType === 'partial' ? 'جزئي' : 
                                   row.paymentType === 'none' ? 'لم يُدفع' : row.paymentType}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center align-middle border print:border-gray-300 print:py-1 print:text-xs screen-only">{row.notes || '-'}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Footer - Same as Individual Worker Statement */}
                  <div className="footer mt-6 pt-4 border-t-2 border-gray-200 print:mt-4 print:pt-2">
                    <div className="grid grid-cols-3 gap-4 text-center print:grid-cols-3 print:gap-8">
                      <div className="space-y-2 print:space-y-4">
                        <div className="font-semibold text-gray-700 print:text-xs">إعداد:</div>
                        <div className="border-t border-gray-400 pt-1 print:pt-2">
                          <div className="text-sm text-gray-600 print:text-xs">المحاسب</div>
                        </div>
                      </div>
                      <div className="space-y-2 print:space-y-4">
                        <div className="font-semibold text-gray-700 print:text-xs">مراجعة:</div>
                        <div className="border-t border-gray-400 pt-1 print:pt-2">
                          <div className="text-sm text-gray-600 print:text-xs">مدير المشروع</div>
                        </div>
                      </div>
                      <div className="space-y-2 print:space-y-4">
                        <div className="font-semibold text-gray-700 print:text-xs">اعتماد:</div>
                        <div className="border-t border-gray-400 pt-1 print:pt-2">
                          <div className="text-sm text-gray-600 print:text-xs">المدير العام</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}