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
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import "@/styles/unified-print.css";

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
          console.log(`📋 بيانات العامل ${workerId}:`, response);
          allAttendanceData.push(...response.attendance.map((att: any) => ({
            ...att,
            workerId: workerId,
            workerName: response.worker?.name || '',
            workerType: response.worker?.type || '',
            workerPhone: response.worker?.phone || '',
            workerDailyWage: response.worker?.dailyWage || 0,
            projectName: att.project?.name || 'غير محدد',
            projectId: att.projectId || '',
            date: att.date,
            workDays: att.workDays || 0,
            totalWorkHours: att.totalWorkHours || att.workDays * 8,
            paidAmount: att.paidAmount || 0,
            totalTransferred: att.totalTransferred || 0,
            dailyWage: att.dailyWage || response.worker?.dailyWage || 0
          })));
          
          // إضافة بيانات الحوالات إذا وُجدت - كصفوف منفصلة مع الاحتفاظ بمعلومات العامل
          if (response.transfers && response.transfers.length > 0) {
            response.transfers.forEach((transfer: any) => {
              allAttendanceData.push({
                workerId: workerId,
                workerName: response.worker?.name || '',
                workerType: response.worker?.type || '', // الاحتفاظ بمهنة العامل الأصلية
                workerPhone: response.worker?.phone || '',
                workerDailyWage: response.worker?.dailyWage || 0,
                projectName: transfer.projectName || 'حوالة للأهل',
                projectId: transfer.projectId || '',
                date: transfer.transferDate || transfer.date,
                workDays: 0,
                totalWorkHours: 0,
                paidAmount: 0,
                totalTransferred: transfer.amount || 0,
                dailyWage: response.worker?.dailyWage || 0, // استخدام أجر العامل الأصلي
                transferDetails: transfer.description || 'حوالة للأهل',
                isTransfer: true // علامة للتمييز بين الحضور والحوالة
              });
            });
          }
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

    // استخدام ExcelJS لتنسيق أفضل
    const workbook = new ExcelJS.Workbook();

    // حساب الإحصائيات
    const totalWorkDays = reportData.reduce((sum, row) => sum + parseFloat(row.workDays || 0), 0);
    const totalAmountDue = reportData.reduce((sum, row) => sum + (parseFloat(row.dailyWage || 0) * parseFloat(row.workDays || 0)), 0);
    const totalPaidAmount = reportData.reduce((sum, row) => sum + parseFloat(row.paidAmount || 0), 0);
    const totalRemaining = totalAmountDue - totalPaidAmount;

    // تعريف نوع ملخص العامل
    interface WorkerSummary {
      workerId: string;
      workerName: string;
      workerType: string;
      phone: string;
      projects: Set<string>;
      dailyWage: number;
      totalWorkDays: number;
      totalWorkHours: number;
      totalAmountDue: number;
      totalPaidAmount: number;
      totalTransferred: number;
    }

    // تجميع البيانات حسب العامل لتصدير الإكسل مع الحقول الجديدة
    const workerSummary: Record<string, WorkerSummary> = reportData.reduce((acc, row) => {
      const workerId = row.workerId;
      if (!acc[workerId]) {
        acc[workerId] = {
          workerId: workerId,
          workerName: row.workerName,
          workerType: row.workerType,
          phone: row.phone,
          projects: new Set<string>(),
          dailyWage: parseFloat(row.dailyWage || 0),
          totalWorkDays: 0,
          totalWorkHours: 0,
          totalAmountDue: 0,
          totalPaidAmount: 0,
          totalTransferred: 0,
        };
      }
      if (row.projectName) {
        acc[workerId].projects.add(row.projectName);
      }
      acc[workerId].totalWorkDays += parseFloat(row.workDays || 0);
      acc[workerId].totalWorkHours += parseFloat(row.totalWorkHours || 0);
      acc[workerId].totalAmountDue += (parseFloat(row.dailyWage || 0) * parseFloat(row.workDays || 0));
      acc[workerId].totalPaidAmount += parseFloat(row.paidAmount || 0);
      acc[workerId].totalTransferred += parseFloat(row.totalTransferred || 0);
      return acc;
    }, {} as Record<string, WorkerSummary>);

    const summaryArray: WorkerSummary[] = Object.values(workerSummary);

    // ورقة التقرير بتصميم احترافي يطابق الكشف المطبوع
    const reportDataForExcel = [
      // رأس الشركة
      ['شركة الفتيني للمقاولات والاستشارات الهندسية'],
      ['كشف تصفية العمال'],
      [''],
      // معلومات التقرير
      ['معلومات التقرير:'],
      ['الفترة:', `من ${formatDate(dateFrom)} إلى ${formatDate(dateTo)}`],
      ['تاريخ إنشاء التقرير:', new Date().toLocaleDateString('ar-EG')],
      ['عدد العمال المحددين:', selectedWorkerIds.length],
      ['عدد المشاريع:', selectedProjectIds.length || 'جميع المشاريع'],
      ['إجمالي السجلات:', summaryArray.length],
      [''],
      // ملخص الإحصائيات المحدث
      ['ملخص الإحصائيات المالية:'],
      ['عدد العمال:', summaryArray.length],
      ['إجمالي أيام العمل:', totalWorkDays.toFixed(1)],
      ['إجمالي الساعات:', reportData.reduce((sum, row) => sum + parseFloat(row.totalWorkHours || 0), 0).toFixed(1)],
      ['إجمالي المبلغ المستحق:', formatCurrency(totalAmountDue)],
      ['إجمالي المبلغ المستلم:', formatCurrency(totalPaidAmount)],
      ['إجمالي المبلغ المحول:', formatCurrency(reportData.reduce((sum, row) => sum + parseFloat(row.totalTransferred || 0), 0))],
      ['المتبقي بعد الخصم:', formatCurrency(reportData.reduce((sum, row) => sum + (parseFloat(row.dailyWage || 0) * parseFloat(row.workDays || 0)) - parseFloat(row.paidAmount || 0) - parseFloat(row.totalTransferred || 0), 0))],
      ['متوسط الساعات اليومية:', reportData.reduce((sum, row) => sum + parseFloat(row.workDays || 0), 0) > 0 
        ? (reportData.reduce((sum, row) => sum + parseFloat(row.totalWorkHours || 0), 0) / reportData.reduce((sum, row) => sum + parseFloat(row.workDays || 0), 0)).toFixed(1)
        : '0'],
      [''],
      // عنوان الجدول المحدث
      ['كشف التصفية الجماعي للعمال:'],
      ['م', 'الاسم والرقم', 'المهنة', 'اسم المشروع', 'الأجر اليومي', 'أيام العمل', 'إجمالي الساعات', 'المبلغ المستحق', 'المبلغ المستلم', 'المبلغ المحول', 'المتبقي بعد الخصم'],
      // بيانات العمال المجمعة مع الحقول الجديدة
      ...summaryArray.map((worker: any, index: number) => [
        index + 1,
        `${worker.workerName}${worker.phone ? ' - ' + worker.phone : ''}`,
        worker.workerType,
        Array.from(worker.projects).join('، ') || 'غير محدد',
        formatCurrency(worker.dailyWage),
        worker.totalWorkDays.toFixed(1),
        worker.totalWorkHours.toFixed(1),
        formatCurrency(worker.totalAmountDue),
        formatCurrency(worker.totalPaidAmount),
        formatCurrency(worker.totalTransferred),
        formatCurrency(worker.totalAmountDue - worker.totalPaidAmount - worker.totalTransferred)
      ]),
      [''],
      // صف الإجماليات المحدث
      ['', '', '', 'الإجمالي العام:', '', 
       totalWorkDays.toFixed(1), 
       reportData.reduce((sum, row) => sum + parseFloat(row.totalWorkHours || 0), 0).toFixed(1),
       formatCurrency(totalAmountDue), 
       formatCurrency(totalPaidAmount), 
       formatCurrency(reportData.reduce((sum, row) => sum + parseFloat(row.totalTransferred || 0), 0)),
       formatCurrency(reportData.reduce((sum, row) => sum + (parseFloat(row.dailyWage || 0) * parseFloat(row.workDays || 0)) - parseFloat(row.paidAmount || 0) - parseFloat(row.totalTransferred || 0), 0))
      ],
      [''],
      // تذييل التقرير
      ['تم إنشاء هذا التقرير آلياً بواسطة نظام إدارة مشاريع البناء'],
      [`التاريخ والوقت: ${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG')}`],
      ['']
    ];

    const worksheet = workbook.addWorksheet('تقرير تصفية العمال');

    // إضافة عنوان الشركة مع RTL
    worksheet.mergeCells('A1:K1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'شركة الفتيني للمقاولات والاستشارات الهندسية';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: "rtl" as any };
    titleCell.border = {
      top: { style: 'thick', color: { argb: 'FF000000' } },
      left: { style: 'thick', color: { argb: 'FF000000' } },
      bottom: { style: 'thick', color: { argb: 'FF000000' } },
      right: { style: 'thick', color: { argb: 'FF000000' } }
    };

    // إضافة عنوان التقرير مع RTL
    worksheet.mergeCells('A2:K2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = `كشف تصفية العمال - الفترة: من ${formatDate(dateFrom)} إلى ${formatDate(dateTo)}`;
    subtitleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: "rtl" as any };
    subtitleCell.border = {
      top: { style: 'thick', color: { argb: 'FF000000' } },
      left: { style: 'thick', color: { argb: 'FF000000' } },
      bottom: { style: 'thick', color: { argb: 'FF000000' } },
      right: { style: 'thick', color: { argb: 'FF000000' } }
    };

    // إضافة صف فارغ
    worksheet.addRow([]);

    // إضافة العناوين مع التنسيق
    const headers = ['م', 'الاسم والرقم', 'المهنة', 'اسم المشروع', 'الأجر اليومي', 'أيام العمل', 'إجمالي الساعات', 'المبلغ المستحق', 'المبلغ المستلم', 'المتبقي', 'ملاحظات'];
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 30;
    headerRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: "rtl" as any };
      cell.border = {
        top: { style: 'thick', color: { argb: 'FF000000' } },
        left: { style: 'thick', color: { argb: 'FF000000' } },
        bottom: { style: 'thick', color: { argb: 'FF000000' } },
        right: { style: 'thick', color: { argb: 'FF000000' } }
      };
    });

    // إضافة بيانات العمال
    summaryArray.forEach((worker, index) => {
      const remainingAfterDeductions = worker.totalAmountDue - worker.totalPaidAmount - worker.totalTransferred;
      
      const dataRow = worksheet.addRow([
        index + 1,
        `${worker.workerName}${worker.phone ? ' - ' + worker.phone : ''}`,
        worker.workerType,
        Array.from(worker.projects).join('، ') || 'غير محدد',
        worker.dailyWage,
        worker.totalWorkDays.toFixed(1),
        worker.totalWorkHours.toFixed(1),
        worker.totalAmountDue,
        worker.totalPaidAmount,
        remainingAfterDeductions,
        '-'
      ]);

      dataRow.height = 25;
      dataRow.eachCell((cell, colNumber) => {
        cell.font = { size: 11 };
        cell.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: "rtl" as any };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };

        // تلوين الخلايا بألوان متناوبة
        if (index % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
        }

        // محاذاة النصوص من اليمين للأعمدة النصية
        if (colNumber === 2 || colNumber === 3 || colNumber === 4 || colNumber === 11) {
          cell.alignment = { horizontal: 'right', vertical: 'middle', readingOrder: "rtl" as any };
        }

        // تنسيق الأرقام
        if (colNumber >= 5 && colNumber <= 10) {
          cell.numFmt = '#,##0.00';
        }
      });
    });

    // إضافة صف الإجماليات
    const totalRow = worksheet.addRow([
      '', '', '', '', 'الإجماليات',
      totalWorkDays.toFixed(1),
      reportData.reduce((sum, row) => sum + parseFloat(row.totalWorkHours || 0), 0).toFixed(1),
      totalAmountDue,
      totalPaidAmount,
      reportData.reduce((sum, row) => sum + (row.totalAmountDue - row.totalPaidAmount - row.totalTransferred), 0),
      ''
    ]);

    totalRow.height = 30;
    totalRow.eachCell((cell) => {
      cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: "rtl" as any };
      cell.border = {
        top: { style: 'thick', color: { argb: 'FF000000' } },
        left: { style: 'thick', color: { argb: 'FF000000' } },
        bottom: { style: 'thick', color: { argb: 'FF000000' } },
        right: { style: 'thick', color: { argb: 'FF000000' } }
      };
    });

    // إضافة الملخص المالي
    worksheet.addRow([]);
    worksheet.addRow([]);
    const lastRowAfterEmpty = worksheet.lastRow;
    const financialSummaryStart = lastRowAfterEmpty ? lastRowAfterEmpty.number + 1 : 10;
    
    // عنوان الملخص المالي
    worksheet.mergeCells(`A${financialSummaryStart}:K${financialSummaryStart}`);
    const financialTitle = worksheet.getCell(`A${financialSummaryStart}`);
    financialTitle.value = 'الملخص المالي الشامل';
    financialTitle.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    financialTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } };
    financialTitle.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: "rtl" as any };
    financialTitle.border = {
      top: { style: 'thick', color: { argb: 'FF000000' } },
      left: { style: 'thick', color: { argb: 'FF000000' } },
      bottom: { style: 'thick', color: { argb: 'FF000000' } },
      right: { style: 'thick', color: { argb: 'FF000000' } }
    };

    // بيانات الملخص المالي
    const summaryData = [
      ['إجمالي العمال:', summaryArray.length],
      ['إجمالي أيام العمل:', totalWorkDays.toFixed(1)],
      ['إجمالي الساعات:', reportData.reduce((sum, row) => sum + parseFloat(row.totalWorkHours || 0), 0).toFixed(1)],
      ['إجمالي المبالغ المستحقة:', formatCurrency(totalAmountDue)],
      ['إجمالي المبالغ المستلمة:', formatCurrency(totalPaidAmount)],
      ['إجمالي الحوالات:', formatCurrency(reportData.reduce((sum, row) => sum + parseFloat(row.totalTransferred || 0), 0))],
      ['المبلغ المتبقي الإجمالي:', formatCurrency(reportData.reduce((sum, row) => sum + (parseFloat(row.dailyWage || 0) * parseFloat(row.workDays || 0)) - parseFloat(row.paidAmount || 0) - parseFloat(row.totalTransferred || 0), 0))]
    ];

    summaryData.forEach((row, index) => {
      const summaryRow = worksheet.addRow(['', '', row[0], row[1], '', '', '', '', '', '', '']);
      summaryRow.getCell(3).font = { bold: true };
      summaryRow.getCell(4).font = { bold: true };
      summaryRow.eachCell(cell => {
        cell.alignment = { horizontal: 'right', readingOrder: "rtl" as any };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });
    });

    // إضافة التوقيعات
    worksheet.addRow([]);
    worksheet.addRow([]);
    const lastRowBeforeSignature = worksheet.lastRow;
    const signatureStart = lastRowBeforeSignature ? lastRowBeforeSignature.number + 1 : 20;
    
    // صف التوقيعات
    const signatureRow = worksheet.addRow(['', '', 'توقيع المحاسب:', '', '', '', 'توقيع المدير المالي:', '', '', '', 'اعتماد الإدارة:']);
    signatureRow.height = 40;
    signatureRow.eachCell(cell => {
      cell.font = { bold: true, size: 12 };
      cell.alignment = { horizontal: 'center', vertical: 'bottom', readingOrder: "rtl" as any };
      cell.border = {
        top: { style: 'thick', color: { argb: 'FF000000' } },
        bottom: { style: 'thick', color: { argb: 'FF000000' } }
      };
    });

    // صف فارغ للتوقيعات
    const emptySignatureRow = worksheet.addRow(['', '', '', '', '', '', '', '', '', '', '']);
    emptySignatureRow.height = 30;
    emptySignatureRow.eachCell(cell => {
      cell.border = {
        bottom: { style: 'thick', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    // تعديل عرض الأعمدة واتجاه النص من اليمين
    worksheet.columns = [
      { width: 8 },   // م
      { width: 25 },  // الاسم والرقم
      { width: 15 },  // المهنة
      { width: 20 },  // اسم المشروع
      { width: 15 },  // الأجر اليومي
      { width: 12 },  // أيام العمل
      { width: 15 },  // إجمالي الساعات
      { width: 18 },  // المبلغ المستحق
      { width: 18 },  // المبلغ المستلم
      { width: 15 },  // المتبقي
      { width: 25 }   // ملاحظات
    ];

    // تطبيق اتجاه RTL على جميع الخلايا
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (!cell.alignment) cell.alignment = {};
        cell.alignment.readingOrder = "rtl" as any; // RTL
        if (!cell.alignment.horizontal) {
          cell.alignment.horizontal = 'right';
        }
      });
    });

    // حفظ الملف
    const fileName = `تقرير_تصفية_العمال_${formatDate(dateFrom)}_${formatDate(dateTo)}.xlsx`;
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, fileName);
      
      toast({
        title: "تم تصدير التقرير",
        description: `تم حفظ الملف: ${fileName}`,
      });
    });
  };

  // Print function for multiple workers
  const handlePrint = () => {
    if (reportMode === 'multiple') {
      const printContent = document.getElementById('enhanced-workers-unified-statement');
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
              <div id="enhanced-workers-unified-statement" className="print:p-0 print:m-0 bg-white text-black">
                
                {/* Header Section - طبق الأصل من التصميم */}
                <div className="text-center mb-4 print:mb-2">
                  <div className="bg-blue-600 text-white p-4 print:p-3 border-2 border-blue-700 company-header">
                    <h1 className="text-xl font-bold print:text-base company-name">شركة الفتيني للمقاولات والاستشارات الهندسية</h1>
                    <h2 className="text-lg font-bold print:text-sm statement-title">كشف تصفية العمال</h2>
                    <p className="text-sm print:text-xs statement-period mt-1">
                      الفترة: من {formatDate(dateFrom)} إلى {formatDate(dateTo)}
                    </p>
                  </div>
                </div>

                {/* Quick Stats Bar - شريط الإحصائيات السريعة */}
                <div className="mb-4 print:mb-2 border-b border-gray-300 pb-2 px-4 print:px-2">
                  <div className="flex justify-between items-center text-sm print:text-xs">
                    <div className="flex items-center gap-4">
                      <span>عدد العمال: <strong>{(() => {
                        const workerSummary = reportData.reduce((acc, row) => {
                          acc.add(row.workerId);
                          return acc;
                        }, new Set());
                        return workerSummary.size;
                      })()}</strong></span>
                      <span>عدد المشاريع: <strong>{(() => {
                        const projectSummary = reportData.reduce((acc, row) => {
                          if (row.projectName) acc.add(row.projectName);
                          return acc;
                        }, new Set());
                        return projectSummary.size;
                      })()}</strong></span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span>إجمالي أيام العمل: <strong>{reportData.reduce((sum, row) => sum + parseFloat(row.workDays || 0), 0).toFixed(1)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Main Table Header - عنوان الجدول بالشريط الأزرق */}
                <div className="bg-blue-600 text-white p-2 print:p-1 text-center font-bold section-title">
                  <h3 className="text-base print:text-sm">كشف التصفية للعمال</h3>
                </div>

                {/* Main Table - جدول العمال */}
                <div className="px-2 print:px-1">
                  <div className="overflow-x-auto">
                    <Table className="w-full border-collapse border border-gray-400 print:border-gray-400 text-sm print:text-xs enhanced-table">
                      <TableHeader>
                        <TableRow className="bg-blue-600 text-white print:bg-blue-600 print:text-black">
                          <TableHead className="border border-gray-400 p-2 print:p-1 text-center font-bold print:text-xs text-white print:text-black">م</TableHead>
                          <TableHead className="border border-gray-400 p-2 print:p-1 text-center font-bold print:text-xs text-white print:text-black">الاسم والرقم</TableHead>
                          <TableHead className="border border-gray-400 p-2 print:p-1 text-center font-bold print:text-xs text-white print:text-black">المهنة</TableHead>
                          <TableHead className="border border-gray-400 p-2 print:p-1 text-center font-bold print:text-xs text-white print:text-black">اسم المشروع</TableHead>
                          <TableHead className="border border-gray-400 p-2 print:p-1 text-center font-bold print:text-xs text-white print:text-black">الأجر اليومي</TableHead>
                          <TableHead className="border border-gray-400 p-2 print:p-1 text-center font-bold print:text-xs text-white print:text-black">أيام العمل</TableHead>
                          <TableHead className="border border-gray-400 p-2 print:p-1 text-center font-bold print:text-xs text-white print:text-black">إجمالي الساعات</TableHead>
                          <TableHead className="border border-gray-400 p-2 print:p-1 text-center font-bold print:text-xs text-white print:text-black">المبلغ المستحق</TableHead>
                          <TableHead className="border border-gray-400 p-2 print:p-1 text-center font-bold print:text-xs text-white print:text-black">المبلغ المستلم</TableHead>
                          <TableHead className="border border-gray-400 p-2 print:p-1 text-center font-bold print:text-xs text-white print:text-black">المتبقي</TableHead>
                          <TableHead className="border border-gray-400 p-2 print:p-1 text-center font-bold print:text-xs text-white print:text-black">ملاحظات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          console.log('🔍 البيانات الخام المستلمة:', reportData);
                          
                          // عدم فلترة البيانات - نريد الاحتفاظ بجميع الصفوف شاملة الحوالات
                          const filteredReportData = reportData;

                          console.log('🔍 البيانات بعد الفلترة:', filteredReportData);

                          // تجميع البيانات حسب العامل - إجمالي واحد لكل عامل
                          const workerSummary = filteredReportData.reduce((acc, row) => {
                            const workerId = row.workerId;
                            if (!acc[workerId]) {
                              acc[workerId] = {
                                workerId: workerId,
                                workerName: row.workerName || 'غير معروف',
                                workerType: row.workerType || 'غير محدد',
                                phone: row.workerPhone || row.phone || '',
                                projects: new Set(),
                                dailyWage: parseFloat(row.dailyWage || row.workerDailyWage || 0),
                                totalWorkDays: 0,
                                totalWorkHours: 0,
                                totalAmountDue: 0,
                                totalPaidAmount: 0,
                                totalTransferred: 0
                              };
                            }
                            
                            // إضافة اسم المشروع
                            if (row.projectName && row.projectName !== 'غير محدد' && row.projectName !== 'حوالة للأهل') {
                              acc[workerId].projects.add(row.projectName);
                            }
                            
                            // جمع بيانات العمل
                            if (row.workDays && parseFloat(row.workDays) > 0) {
                              acc[workerId].totalWorkDays += parseFloat(row.workDays || 0);
                              acc[workerId].totalWorkHours += parseFloat(row.totalWorkHours || (parseFloat(row.workDays || 0) * 8));
                              const amountDue = parseFloat(row.dailyWage || row.workerDailyWage || 0) * parseFloat(row.workDays || 0);
                              acc[workerId].totalAmountDue += amountDue;
                              acc[workerId].totalPaidAmount += parseFloat(row.paidAmount || 0);
                            }

                            // جمع الحوالات
                            const transferAmount = parseFloat(row.totalTransferred || 0);
                            if (transferAmount > 0) {
                              acc[workerId].totalTransferred += transferAmount;
                            }
                            
                            return acc;
                          }, {});

                          const summaryArray = Object.values(workerSummary);
                          
                          const allWorkerRows = [];
                          
                          // إضافة صفوف العمال
                          summaryArray.forEach((worker: any, index: number) => {
                            const projectNames = Array.from(worker.projects).join('، ');
                            const remainingAfterDeductions = worker.totalAmountDue - worker.totalPaidAmount - worker.totalTransferred;
                            const rowIndex = index + 1;
                            
                            allWorkerRows.push(
                              <TableRow key={`worker-${worker.workerId}`} className={`${rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'} dark:bg-gray-800 print:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700`}>
                                <TableCell className="text-center align-middle border print:border-gray-400 print:py-1 print:text-xs font-medium">
                                  {rowIndex}
                                </TableCell>
                                <TableCell className="text-right align-middle border print:border-gray-400 print:py-1 print:text-xs">
                                  <div className="font-semibold">{worker.workerName}</div>
                                  {worker.phone && <div className="text-sm text-gray-600 print:text-xs">{worker.phone}</div>}
                                </TableCell>
                                <TableCell className="text-center align-middle border print:border-gray-400 print:py-1 print:text-xs">
                                  <span className="print:hidden"><Badge variant="outline">{worker.workerType}</Badge></span>
                                  <span className="hidden print:inline">{worker.workerType}</span>
                                </TableCell>
                                <TableCell className="text-right align-middle border print:border-gray-400 print:py-1 print:text-xs">
                                  <div className="text-sm">{projectNames || 'غير محدد'}</div>
                                </TableCell>
                                <TableCell className="text-center align-middle border print:border-gray-400 print:py-1 print:text-xs">
                                  {formatCurrency(worker.dailyWage)}
                                </TableCell>
                                <TableCell className="text-center align-middle border print:border-gray-400 print:py-1 print:text-xs font-bold text-blue-600 print:text-black">
                                  {worker.totalWorkDays.toFixed(1)}
                                </TableCell>
                                <TableCell className="text-center align-middle border print:border-gray-400 print:py-1 print:text-xs font-bold text-teal-600 print:text-black">
                                  {worker.totalWorkHours.toFixed(1)}
                                </TableCell>
                                <TableCell className="font-bold text-green-600 text-center align-middle border print:border-gray-400 print:py-1 print:text-xs print:text-black">
                                  {formatCurrency(worker.totalAmountDue)}
                                </TableCell>
                                <TableCell className="font-bold text-blue-600 text-center align-middle border print:border-gray-400 print:py-1 print:text-xs print:text-black">
                                  {formatCurrency(worker.totalPaidAmount)}
                                </TableCell>
                                <TableCell className={`font-bold text-center align-middle border print:border-gray-400 print:py-1 print:text-xs print:text-black ${remainingAfterDeductions > 0 ? 'text-orange-600' : remainingAfterDeductions < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                  {formatCurrency(remainingAfterDeductions)}
                                </TableCell>
                                <TableCell className="text-center align-middle border print:border-gray-400 print:py-1 print:text-xs">
                                  {worker.totalTransferred > 0 ? 
                                    <div className="text-sm text-red-600 font-medium print:text-xs">
                                      حوالة: {formatCurrency(worker.totalTransferred)}
                                    </div>
                                  : '-'}
                                </TableCell>
                              </TableRow>
                            );
                          });
                          
                          // حساب الإجماليات
                          const totalWorkDays = summaryArray.reduce((sum: number, worker: any) => sum + worker.totalWorkDays, 0);
                          const totalWorkHours = summaryArray.reduce((sum: number, worker: any) => sum + worker.totalWorkHours, 0);
                          const totalAmountDue = summaryArray.reduce((sum: number, worker: any) => sum + worker.totalAmountDue, 0);
                          const totalPaidAmount = summaryArray.reduce((sum: number, worker: any) => sum + worker.totalPaidAmount, 0);
                          const totalTransferred = summaryArray.reduce((sum: number, worker: any) => sum + worker.totalTransferred, 0);
                          const totalRemaining = totalAmountDue - totalPaidAmount - totalTransferred;

                          // إضافة صف الإجماليات
                          allWorkerRows.push(
                            <TableRow key="totals" className="bg-green-600 text-white print:bg-green-600 print:text-black border-t-2 border-green-500 print:border-green-600">
                              <TableCell className="font-bold text-center align-middle border print:border-gray-400 print:py-1 print:text-xs text-white print:text-black" colSpan={5}>
                                الإجماليات
                              </TableCell>
                              <TableCell className="font-bold text-center align-middle border print:border-gray-400 print:py-1 print:text-xs text-white print:text-black">
                                {totalWorkDays.toFixed(1)}
                              </TableCell>
                              <TableCell className="font-bold text-center align-middle border print:border-gray-400 print:py-1 print:text-xs text-white print:text-black">
                                {totalWorkHours.toFixed(1)}
                              </TableCell>
                              <TableCell className="font-bold text-center align-middle border print:border-gray-400 print:py-1 print:text-xs text-white print:text-black">
                                {formatCurrency(totalAmountDue)}
                              </TableCell>
                              <TableCell className="font-bold text-center align-middle border print:border-gray-400 print:py-1 print:text-xs text-white print:text-black">
                                {formatCurrency(totalPaidAmount)}
                              </TableCell>
                              <TableCell className="font-bold text-center align-middle border print:border-gray-400 print:py-1 print:text-xs text-white print:text-black">
                                {formatCurrency(totalRemaining)}
                              </TableCell>
                              <TableCell className="font-bold text-center align-middle border print:border-gray-400 print:py-1 print:text-xs text-white print:text-black">
                                {totalTransferred > 0 ? formatCurrency(totalTransferred) : '-'}
                              </TableCell>
                            </TableRow>
                          );
                          
                          return allWorkerRows;
                        })()}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Summary Section - الملخص النهائي */}
                  <div className="mt-6 print:mt-4 px-4 print:px-2">
                    <div className="bg-blue-100 dark:bg-blue-900 print:bg-blue-100 border border-blue-300 rounded-lg p-4 print:p-2 summary-section">
                      <h3 className="text-center font-bold text-lg print:text-base mb-3 print:mb-2 text-blue-800 print:text-black">الملخص النهائي</h3>
                      <div className="grid grid-cols-4 gap-4 print:gap-2 text-center text-sm print:text-xs">
                        <div className="summary-item">
                          <div className="font-bold text-green-600 print:text-black text-lg print:text-base">
                            {formatCurrency(reportData.reduce((sum, row) => sum + (parseFloat(row.dailyWage || 0) * parseFloat(row.workDays || 0)), 0))}
                          </div>
                          <div className="text-gray-600 print:text-black font-medium">إجمالي المبلغ المستحق:</div>
                        </div>
                        <div className="summary-item">
                          <div className="font-bold text-red-600 print:text-black text-lg print:text-base">
                            {formatCurrency(reportData.reduce((sum, row) => sum + parseFloat(row.totalTransferred || 0), 0))}
                          </div>
                          <div className="text-gray-600 print:text-black font-medium">إجمالي المبلغ المحول:</div>
                        </div>
                        <div className="summary-item">
                          <div className="font-bold text-blue-600 print:text-black text-lg print:text-base">
                            {formatCurrency(reportData.reduce((sum, row) => sum + parseFloat(row.paidAmount || 0), 0))}
                          </div>
                          <div className="text-gray-600 print:text-black font-medium">إجمالي المبلغ المستلم:</div>
                        </div>
                        <div className="summary-item">
                          <div className="font-bold text-orange-600 print:text-black text-lg print:text-base">
                            {formatCurrency(reportData.reduce((sum, row) => sum + (parseFloat(row.dailyWage || 0) * parseFloat(row.workDays || 0)) - parseFloat(row.paidAmount || 0) - parseFloat(row.totalTransferred || 0), 0))}
                          </div>
                          <div className="text-gray-600 print:text-black font-medium">إجمالي المبلغ المتبقي:</div>
                        </div>
                      </div>
                    </div>
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