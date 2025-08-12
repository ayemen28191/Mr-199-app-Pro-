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
import { EnhancedWorkerAccountStatement } from "@/components/EnhancedWorkerAccountStatement";
import type { Worker, Project } from "@shared/schema";
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import "@/styles/unified-print.css";

export default function WorkersUnifiedReportsFixed() {
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

    const projectsToUse = singleWorkerProjectIds.length > 0 ? singleWorkerProjectIds : projects.map(p => p.id);

    setIsGenerating(true);
    try {
      let url = `/api/workers/${selectedWorkerId}/account-statement?dateFrom=${dateFrom}&dateTo=${dateTo}`;
      url += `&projectIds=${projectsToUse.join(',')}`;

      const response = await apiRequest('GET', url);
      
      if (response) {
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

  // Generate multiple workers report (Workers Clearance Report) 
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
      // جمع البيانات من جميع العمال المحددين وتنظيمها حسب التنسيق المطلوب
      const workersData: any[] = [];
      
      for (const workerId of selectedWorkerIds) {
        let url = `/api/workers/${workerId}/account-statement?dateFrom=${dateFrom}&dateTo=${dateTo}`;
        url += `&projectIds=${selectedProjectIds.join(',')}`;

        const response = await apiRequest('GET', url);
        
        if (response && response.worker) {
          // تجميع البيانات حسب المشروع لكل عامل
          const workerProjects = new Map();
          
          // معالجة بيانات الحضور
          if (response.attendance && response.attendance.length > 0) {
            response.attendance.forEach((att: any) => {
              const projectKey = att.project?.id || 'unknown';
              if (!workerProjects.has(projectKey)) {
                workerProjects.set(projectKey, {
                  projectName: att.project?.name || 'مشروع غير محدد',
                  totalDays: 0,
                  totalHours: 0,
                  totalAmountDue: 0,
                  totalAmountReceived: 0,
                  transfers: []
                });
              }
              
              const project = workerProjects.get(projectKey);
              project.totalDays += att.workDays || 0;
              
              // حساب ساعات العمل
              if (att.startTime && att.endTime) {
                const start = new Date(`2000-01-01T${att.startTime}`);
                const end = new Date(`2000-01-01T${att.endTime}`);
                const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                project.totalHours += hours > 0 ? hours : 8;
              } else {
                project.totalHours += 8;
              }
              
              project.totalAmountDue += (att.dailyWage || 0) * (att.workDays || 0);
              project.totalAmountReceived += att.paidAmount || 0;
            });
          }
          
          // معالجة بيانات التحويلات
          if (response.transfers && response.transfers.length > 0) {
            response.transfers.forEach((transfer: any) => {
              // إضافة التحويلات للمشروع الأول (أو يمكن ربطها بمشروع محدد)
              const firstProject = workerProjects.values().next().value;
              if (firstProject) {
                firstProject.transfers.push(transfer);
              }
            });
          }
          
          // إنشاء صفوف البيانات للعامل
          const workerRows: any[] = [];
          let isFirstProject = true;
          
          workerProjects.forEach((projectData, projectId) => {
            // صف المشروع
            const projectRow = {
              rowType: 'project',
              workerName: isFirstProject ? response.worker.name : '',
              workerType: isFirstProject ? response.worker.type : '',
              projectName: projectData.projectName,
              totalDays: projectData.totalDays,
              totalHours: projectData.totalHours,
              dailyWage: response.worker.dailyWage || 0,
              totalAmountDue: projectData.totalAmountDue,
              totalAmountReceived: projectData.totalAmountReceived,
              remainingAmount: projectData.totalAmountDue - projectData.totalAmountReceived
            };
            workerRows.push(projectRow);
            
            // صفوف التحويلات تحت كل مشروع
            projectData.transfers.forEach((transfer: any) => {
              const transferRow = {
                rowType: 'transfer',
                workerName: '',
                workerType: 'حوالة',
                projectName: projectData.projectName,
                totalDays: 0,
                totalHours: 0,
                dailyWage: response.worker.dailyWage || 0, // إضافة الأجر اليومي للعامل في صف الحوالة
                totalAmountDue: 0,
                totalAmountReceived: transfer.amount,
                remainingAmount: -transfer.amount,
                transferDetails: {
                  amount: transfer.amount,
                  recipientName: transfer.recipientName,
                  transferNumber: transfer.transferNumber,
                  date: transfer.transferDate
                }
              };
              workerRows.push(transferRow);
            });
            
            isFirstProject = false;
          });
          
          workersData.push(...workerRows);
        }
      }

      if (workersData.length === 0) {
        toast({
          title: "لا توجد بيانات",
          description: "لم يتم العثور على بيانات للعمال المحددين في الفترة المحددة",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      setReportData(workersData);
      setShowResults(true);
      
      toast({
        title: "تم إنشاء تقرير التصفية",
        description: `تم جمع بيانات ${selectedWorkerIds.length} عامل بتنسيق التصفية المطلوب`,
      });
      
    } catch (error: any) {
      console.error('خطأ في إنشاء تقرير التصفية:', error);
      toast({
        title: "خطأ في إنشاء التقرير",
        description: error?.message || "حدث خطأ أثناء جمع بيانات العمال",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  // Enhanced Excel Export for Workers Clearance Report
  const exportMultipleWorkersToExcel = async () => {
    if (!reportData || reportData.length === 0) {
      toast({
        title: "لا توجد بيانات للتصدير",
        variant: "destructive",
      });
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('تقرير تصفية العمال', {
        pageSetup: {
          paperSize: 9, // A4
          orientation: 'landscape',
          fitToPage: true,
          margins: { left: 0.25, right: 0.25, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
        }
      });

      // تعيين عرض الأعمدة
      worksheet.columns = [
        { width: 5 },   // م
        { width: 15 },  // الاسم
        { width: 10 },  // المهنة
        { width: 20 },  // اسم المشروع
        { width: 8 },   // الأجر اليومي
        { width: 8 },   // أيام العمل
        { width: 10 },  // إجمالي الساعات
        { width: 12 },  // المبلغ المستحق
        { width: 12 },  // المبلغ المستلم
        { width: 12 },  // المتبقي
        { width: 15 }   // ملاحظات
      ];

      let currentRow = 1;

      // رأس الشركة
      worksheet.mergeCells(currentRow, 1, currentRow, 11);
      const headerCell = worksheet.getCell(currentRow, 1);
      headerCell.value = 'شركة الفتيني للمقاولات والاستشارات الهندسية';
      headerCell.font = { name: 'Arial', size: 16, bold: true };
      headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
      headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
      headerCell.font = { ...headerCell.font, color: { argb: 'FFFFFFFF' } };
      currentRow++;

      // عنوان التقرير
      worksheet.mergeCells(currentRow, 1, currentRow, 11);
      const titleCell = worksheet.getCell(currentRow, 1);
      titleCell.value = 'كشف تصفية العمال';
      titleCell.font = { name: 'Arial', size: 14, bold: true };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      currentRow++;

      // فترة التقرير
      worksheet.mergeCells(currentRow, 1, currentRow, 11);
      const periodCell = worksheet.getCell(currentRow, 1);
      periodCell.value = `للفترة من ${formatDate(dateFrom)} إلى ${formatDate(dateTo)}`;
      periodCell.font = { name: 'Arial', size: 12 };
      periodCell.alignment = { horizontal: 'center', vertical: 'middle' };
      currentRow += 2;

      // إحصائيات
      const totalWorkers = selectedWorkerIds.length;
      const totalProjects = selectedProjectIds.length;
      const totalDays = reportData.filter(row => row.rowType === 'project').reduce((sum, row) => sum + row.totalDays, 0);
      const totalAmount = reportData.filter(row => row.rowType === 'project').reduce((sum, row) => sum + row.totalAmountDue, 0);

      worksheet.mergeCells(currentRow, 1, currentRow, 2);
      worksheet.getCell(currentRow, 1).value = `عدد العمال: ${totalWorkers}`;
      worksheet.getCell(currentRow, 1).font = { bold: true };
      
      worksheet.mergeCells(currentRow, 3, currentRow, 4);
      worksheet.getCell(currentRow, 3).value = `عدد المشاريع: ${totalProjects}`;
      worksheet.getCell(currentRow, 3).font = { bold: true };
      
      worksheet.mergeCells(currentRow, 5, currentRow, 6);
      worksheet.getCell(currentRow, 5).value = `إجمالي أيام العمل: ${totalDays.toFixed(2)}`;
      worksheet.getCell(currentRow, 5).font = { bold: true };
      
      worksheet.mergeCells(currentRow, 7, currentRow, 11);
      worksheet.getCell(currentRow, 7).value = `إجمالي المبلغ المستحق: ${formatCurrency(totalAmount)}`;
      worksheet.getCell(currentRow, 7).font = { bold: true };
      currentRow += 2;

      // رؤوس الأعمدة
      const headers = ['م', 'الاسم', 'المهنة', 'اسم المشروع', 'الأجر اليومي', 'أيام العمل', 'إجمالي الساعات', 'المبلغ المستحق', 'المبلغ المستلم', 'المتبقي', 'ملاحظات'];
      headers.forEach((header, index) => {
        const cell = worksheet.getCell(currentRow, index + 1);
        cell.value = header;
        cell.font = { name: 'Arial', size: 11, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        cell.font = { ...cell.font, color: { argb: 'FFFFFFFF' } };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      currentRow++;

      // بيانات العمال
      let rowNumber = 1;
      reportData.forEach((row, index) => {
        if (row.rowType === 'project') {
          // صف المشروع
          worksheet.getCell(currentRow, 1).value = rowNumber++;
          worksheet.getCell(currentRow, 2).value = row.workerName || '';
          worksheet.getCell(currentRow, 3).value = row.workerType || '';
          worksheet.getCell(currentRow, 4).value = row.projectName || '';
          worksheet.getCell(currentRow, 5).value = formatCurrency(row.dailyWage);
          worksheet.getCell(currentRow, 6).value = row.totalDays.toFixed(1);
          worksheet.getCell(currentRow, 7).value = row.totalHours.toFixed(1);
          worksheet.getCell(currentRow, 8).value = formatCurrency(row.totalAmountDue);
          worksheet.getCell(currentRow, 9).value = formatCurrency(row.totalAmountReceived);
          worksheet.getCell(currentRow, 10).value = formatCurrency(row.remainingAmount);
          worksheet.getCell(currentRow, 11).value = '';
        } else if (row.rowType === 'transfer') {
          // صف التحويل
          worksheet.getCell(currentRow, 1).value = '';
          worksheet.getCell(currentRow, 2).value = '';
          worksheet.getCell(currentRow, 3).value = 'حوالة';
          worksheet.getCell(currentRow, 4).value = row.projectName || '';
          worksheet.getCell(currentRow, 5).value = '';
          worksheet.getCell(currentRow, 6).value = '';
          worksheet.getCell(currentRow, 7).value = '';
          worksheet.getCell(currentRow, 8).value = '';
          worksheet.getCell(currentRow, 9).value = formatCurrency(row.transferDetails?.amount || 0);
          worksheet.getCell(currentRow, 10).value = formatCurrency(-(row.transferDetails?.amount || 0));
          worksheet.getCell(currentRow, 11).value = `تحويل لـ ${row.transferDetails?.recipientName || ''} - رقم: ${row.transferDetails?.transferNumber || ''}`;
          
          // تلوين صف التحويل
          for (let col = 1; col <= 11; col++) {
            const cell = worksheet.getCell(currentRow, col);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0E0' } };
          }
        }

        // إضافة حدود للجميع
        for (let col = 1; col <= 11; col++) {
          const cell = worksheet.getCell(currentRow, col);
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
        
        currentRow++;
      });

      // صف الإجماليات
      currentRow++;
      for (let col = 1; col <= 11; col++) {
        const cell = worksheet.getCell(currentRow, col);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } };
        cell.font = { name: 'Arial', size: 11, bold: true };
        cell.border = {
          top: { style: 'thick' },
          left: { style: 'thin' },
          bottom: { style: 'thick' },
          right: { style: 'thin' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      worksheet.getCell(currentRow, 4).value = 'الإجماليات';
      worksheet.getCell(currentRow, 6).value = totalDays.toFixed(1);
      
      const totalHours = reportData.filter(row => row.rowType === 'project').reduce((sum, row) => sum + row.totalHours, 0);
      worksheet.getCell(currentRow, 7).value = totalHours.toFixed(1);
      
      const totalReceived = reportData.reduce((sum, row) => sum + row.totalAmountReceived, 0);
      const totalRemaining = reportData.filter(row => row.rowType === 'project').reduce((sum, row) => sum + row.remainingAmount, 0);
      
      worksheet.getCell(currentRow, 8).value = formatCurrency(totalAmount);
      worksheet.getCell(currentRow, 9).value = formatCurrency(totalReceived);
      worksheet.getCell(currentRow, 10).value = formatCurrency(totalRemaining);

      // الملخص النهائي
      currentRow += 3;
      worksheet.mergeCells(currentRow, 1, currentRow, 11);
      const summaryTitleCell = worksheet.getCell(currentRow, 1);
      summaryTitleCell.value = 'الملخص النهائي';
      summaryTitleCell.font = { name: 'Arial', size: 14, bold: true };
      summaryTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      summaryTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB0C4DE' } };
      currentRow += 2;

      // ملخص المبالغ بألوان مميزة
      const summaryData = [
        { label: 'إجمالي المبلغ المستحق:', value: totalAmount, color: 'FF4472C4' },
        { label: 'إجمالي المبلغ المستلم:', value: totalReceived, color: 'FF70AD47' },
        { label: 'إجمالي المبلغ المتبقي:', value: totalRemaining, color: 'FFFF6B6B' }
      ];

      summaryData.forEach((item, index) => {
        const labelCol = 3 + (index * 3);
        const valueCol = labelCol + 1;
        
        worksheet.getCell(currentRow, labelCol).value = item.label;
        worksheet.getCell(currentRow, labelCol).font = { bold: true };
        worksheet.getCell(currentRow, labelCol).alignment = { horizontal: 'right' };
        
        worksheet.getCell(currentRow, valueCol).value = formatCurrency(item.value);
        worksheet.getCell(currentRow, valueCol).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getCell(currentRow, valueCol).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.color } };
        worksheet.getCell(currentRow, valueCol).alignment = { horizontal: 'center' };
      });

      // صفوف التوقيع
      currentRow += 4;
      const signatures = ['مدير المشروع', 'المهندس', 'المدير العام'];
      signatures.forEach((title, index) => {
        const col = 2 + (index * 3);
        worksheet.getCell(currentRow, col).value = title;
        worksheet.getCell(currentRow, col).font = { bold: true };
        worksheet.getCell(currentRow, col).alignment = { horizontal: 'center' };
        
        // خط التوقيع
        worksheet.getCell(currentRow + 2, col).value = '________________________';
        worksheet.getCell(currentRow + 2, col).alignment = { horizontal: 'center' };
      });

      // تذييل التقرير
      currentRow += 5;
      worksheet.mergeCells(currentRow, 1, currentRow, 11);
      const footerCell = worksheet.getCell(currentRow, 1);
      footerCell.value = `تم إنشاء هذا التقرير آلياً بواسطة نظام إدارة مشاريع البناء - ${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG')}`;
      footerCell.font = { name: 'Arial', size: 10, italic: true };
      footerCell.alignment = { horizontal: 'center' };

      // حفظ الملف
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `تقرير_تصفية_العمال_${formatDate(dateFrom)}_${formatDate(dateTo)}.xlsx`);

      toast({
        title: "تم تصدير التقرير بنجاح",
        description: "تم حفظ ملف Excel بتنسيق التصفية المطلوب",
      });

    } catch (error) {
      console.error('خطأ في تصدير Excel:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء إنشاء ملف Excel",
        variant: "destructive",
      });
    }
  };

  // Print report
  const printReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white p-4 print:p-0" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center print:hidden">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">تقارير العمال الموحدة</h1>
          </div>
          <p className="text-gray-600">إنشاء كشوف حسابات العمال الفردية وتقارير التصفية الجماعية</p>
        </div>

        {/* Mode Selection */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              نوع التقرير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={reportMode === 'single' ? "default" : "outline"}
                onClick={() => {
                  setReportMode('single');
                  setShowResults(false);
                  setShowWorkerStatement(false);
                }}
                className="h-20 flex flex-col gap-2"
              >
                <User className="h-6 w-6" />
                <span>كشف حساب عامل واحد</span>
              </Button>
              <Button
                variant={reportMode === 'multiple' ? "default" : "outline"}
                onClick={() => {
                  setReportMode('multiple');
                  setShowResults(false);
                  setShowWorkerStatement(false);
                }}
                className="h-20 flex flex-col gap-2"
              >
                <Users className="h-6 w-6" />
                <span>تقرير تصفية العمال</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Date Range Selection */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              فترة التقرير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateFrom">من تاريخ</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dateTo">إلى تاريخ</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Single Worker Mode */}
        {reportMode === 'single' && (
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                اختيار العامل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>العامل</Label>
                <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العامل" />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.map(worker => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.name} - {worker.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>المشاريع (اختياري - سيتم اختيار جميع المشاريع إذا لم تحدد)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {projects.map(project => (
                    <div key={project.id} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox 
                        id={`single-project-${project.id}`}
                        checked={singleWorkerProjectIds.includes(project.id)}
                        onCheckedChange={() => toggleProjectSelection(project.id, 'single')}
                      />
                      <Label htmlFor={`single-project-${project.id}`} className="text-sm">
                        {project.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={generateSingleWorkerStatement}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    جاري إنشاء كشف الحساب...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    إنشاء كشف حساب العامل
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Multiple Workers Mode */}
        {reportMode === 'multiple' && (
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                اختيار العمال والمشاريع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>العمال</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                  {workers.map(worker => (
                    <div key={worker.id} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox 
                        id={`worker-${worker.id}`}
                        checked={selectedWorkerIds.includes(worker.id)}
                        onCheckedChange={() => toggleWorkerSelection(worker.id)}
                      />
                      <Label htmlFor={`worker-${worker.id}`} className="text-sm">
                        {worker.name} - {worker.type}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedWorkerIds.length > 0 && (
                  <Badge variant="secondary" className="mt-2">
                    تم اختيار {selectedWorkerIds.length} عامل
                  </Badge>
                )}
              </div>

              <div>
                <Label>المشاريع</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {projects.map(project => (
                    <div key={project.id} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox 
                        id={`multiple-project-${project.id}`}
                        checked={selectedProjectIds.includes(project.id)}
                        onCheckedChange={() => toggleProjectSelection(project.id, 'multiple')}
                      />
                      <Label htmlFor={`multiple-project-${project.id}`} className="text-sm">
                        {project.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedProjectIds.length > 0 && (
                  <Badge variant="secondary" className="mt-2">
                    تم اختيار {selectedProjectIds.length} مشروع
                  </Badge>
                )}
              </div>

              <Button 
                onClick={generateMultipleWorkersReport}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    جاري إنشاء تقرير التصفية...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    إنشاء تقرير تصفية العمال
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Single Worker Statement Results */}
        {showWorkerStatement && reportData.length > 0 && (
          <Card>
            <CardHeader className="print:hidden">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  كشف حساب العامل: {reportData[0]?.worker?.name}
                </CardTitle>
                <div className="flex gap-2">
                  <Button onClick={printReport} size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    طباعة
                  </Button>
                  <Button onClick={() => exportMultipleWorkersToExcel()} size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    تصدير Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <EnhancedWorkerAccountStatement 
                data={reportData[0]}
                dateFrom={dateFrom}
                dateTo={dateTo}
              />
            </CardContent>
          </Card>
        )}

        {/* Multiple Workers Results - Workers Clearance Report */}
        {showResults && reportData.length > 0 && reportMode === 'multiple' && (
          <Card>
            <CardHeader className="print:hidden">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  تقرير تصفية العمال
                </CardTitle>
                <div className="flex gap-2">
                  <Button onClick={printReport} size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    طباعة
                  </Button>
                  <Button onClick={exportMultipleWorkersToExcel} size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    تصدير Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="worker-clearance-report print:m-0">
                {/* Header */}
                <div className="text-center mb-6 print:mb-4">
                  <h1 className="text-2xl font-bold text-blue-600 print:text-black print:text-xl">
                    شركة الفتيني للمقاولات والاستشارات الهندسية
                  </h1>
                  <h2 className="text-xl font-semibold mt-2 print:text-lg">كشف تصفية العمال</h2>
                  <p className="text-gray-600 print:text-black mt-1">
                    للفترة من {formatDate(dateFrom)} إلى {formatDate(dateTo)}
                  </p>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-4 gap-4 mb-6 print:mb-4 print:grid-cols-4 print:gap-2">
                  <div className="text-center p-2 bg-blue-50 print:bg-white print:border">
                    <div className="text-lg font-bold text-blue-600 print:text-black print:text-base">
                      {selectedWorkerIds.length}
                    </div>
                    <div className="text-sm text-gray-600 print:text-black print:text-xs">عدد العمال</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 print:bg-white print:border">
                    <div className="text-lg font-bold text-green-600 print:text-black print:text-base">
                      {selectedProjectIds.length}
                    </div>
                    <div className="text-sm text-gray-600 print:text-black print:text-xs">عدد المشاريع</div>
                  </div>
                  <div className="text-center p-2 bg-orange-50 print:bg-white print:border">
                    <div className="text-lg font-bold text-orange-600 print:text-black print:text-base">
                      {(Number(reportData.filter(row => row.rowType === 'project').reduce((sum, row) => sum + (row.totalDays || 0), 0)) || 0).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600 print:text-black print:text-xs">إجمالي أيام العمل</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 print:bg-white print:border">
                    <div className="text-lg font-bold text-purple-600 print:text-black print:text-base">
                      {(Number(reportData.filter(row => row.rowType === 'project').reduce((sum, row) => sum + (row.totalHours || 0), 0)) || 0).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600 print:text-black print:text-xs">إجمالي الساعات</div>
                  </div>
                </div>

                {/* Main Table */}
                <div className="overflow-x-auto print:overflow-visible">
                  <Table className="min-w-full border-collapse border print:text-xs">
                    <TableHeader>
                      <TableRow className="bg-blue-600 print:bg-gray-200">
                        <TableHead className="text-white print:text-black border text-center print:text-xs">م</TableHead>
                        <TableHead className="text-white print:text-black border text-center print:text-xs">الاسم</TableHead>
                        <TableHead className="text-white print:text-black border text-center print:text-xs">المهنة</TableHead>
                        <TableHead className="text-white print:text-black border text-center print:text-xs">اسم المشروع</TableHead>
                        <TableHead className="text-white print:text-black border text-center print:text-xs">الأجر اليومي</TableHead>
                        <TableHead className="text-white print:text-black border text-center print:text-xs">أيام العمل</TableHead>
                        <TableHead className="text-white print:text-black border text-center print:text-xs">إجمالي الساعات</TableHead>
                        <TableHead className="text-white print:text-black border text-center print:text-xs">المبلغ المستحق</TableHead>
                        <TableHead className="text-white print:text-black border text-center print:text-xs">المبلغ المستلم</TableHead>
                        <TableHead className="text-white print:text-black border text-center print:text-xs">المتبقي</TableHead>
                        <TableHead className="text-white print:text-black border text-center print:text-xs">ملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((row, index) => (
                        <TableRow 
                          key={index} 
                          className={row.rowType === 'transfer' ? 'bg-red-50 print:bg-gray-100' : 'hover:bg-gray-50 print:hover:bg-white'}
                        >
                          <TableCell className="border text-center print:text-xs">
                            {row.rowType === 'project' ? (reportData.slice(0, index + 1).filter(r => r.rowType === 'project').length) : ''}
                          </TableCell>
                          <TableCell className="border text-center print:text-xs">
                            {row.workerName}
                          </TableCell>
                          <TableCell className="border text-center print:text-xs">
                            {row.workerType}
                          </TableCell>
                          <TableCell className="border text-center print:text-xs">
                            {row.projectName}
                          </TableCell>
                          <TableCell className="border text-center print:text-xs">
                            {row.rowType === 'project' ? formatCurrency(row.dailyWage) : ''}
                          </TableCell>
                          <TableCell className="border text-center print:text-xs">
                            {row.rowType === 'project' ? row.totalDays.toFixed(1) : ''}
                          </TableCell>
                          <TableCell className="border text-center print:text-xs">
                            {row.rowType === 'project' ? row.totalHours.toFixed(1) : ''}
                          </TableCell>
                          <TableCell className="border text-center print:text-xs">
                            {row.rowType === 'project' ? formatCurrency(row.totalAmountDue) : ''}
                          </TableCell>
                          <TableCell className="border text-center print:text-xs">
                            {formatCurrency(row.totalAmountReceived)}
                          </TableCell>
                          <TableCell className="border text-center print:text-xs">
                            {formatCurrency(row.remainingAmount)}
                          </TableCell>
                          <TableCell className="border text-center print:text-xs">
                            {row.rowType === 'transfer' && row.transferDetails ? 
                              `تحويل لـ ${row.transferDetails.recipientName} - رقم: ${row.transferDetails.transferNumber}` : 
                              ''
                            }
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Totals Row */}
                      <TableRow className="bg-green-500 print:bg-gray-300 font-bold">
                        <TableCell className="border text-center text-white print:text-black print:text-xs" colSpan={4}>
                          الإجماليات
                        </TableCell>
                        <TableCell className="border text-center text-white print:text-black print:text-xs">
                          {/* Average daily wage can be calculated if needed */}
                        </TableCell>
                        <TableCell className="border text-center text-white print:text-black print:text-xs">
                          {(Number(reportData.filter(row => row.rowType === 'project').reduce((sum, row) => sum + (row.totalDays || 0), 0)) || 0).toFixed(1)}
                        </TableCell>
                        <TableCell className="border text-center text-white print:text-black print:text-xs">
                          {(Number(reportData.filter(row => row.rowType === 'project').reduce((sum, row) => sum + (row.totalHours || 0), 0)) || 0).toFixed(1)}
                        </TableCell>
                        <TableCell className="border text-center text-white print:text-black print:text-xs">
                          {formatCurrency(reportData.filter(row => row.rowType === 'project').reduce((sum, row) => sum + (row.totalAmountDue || 0), 0))}
                        </TableCell>
                        <TableCell className="border text-center text-white print:text-black print:text-xs">
                          {formatCurrency(reportData.reduce((sum, row) => sum + (row.totalAmountReceived || 0), 0))}
                        </TableCell>
                        <TableCell className="border text-center text-white print:text-black print:text-xs">
                          {formatCurrency(reportData.reduce((sum, row) => sum + (row.remainingAmount || 0), 0))}
                        </TableCell>
                        <TableCell className="border text-center text-white print:text-black print:text-xs"></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Final Summary */}
                <div className="mt-8 print:mt-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800 print:text-black print:text-base">الملخص النهائي</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
                    <div className="summary-item text-center p-4 print:p-2 bg-blue-100 print:bg-white print:border rounded-lg">
                      <div className="font-bold text-blue-600 print:text-black text-lg print:text-base">
                        {formatCurrency(reportData.filter(row => row.rowType === 'project').reduce((sum, row) => sum + (row.totalAmountDue || 0), 0))}
                      </div>
                      <div className="text-gray-600 print:text-black font-medium print:text-xs">إجمالي المبلغ المستحق</div>
                    </div>
                    <div className="summary-item text-center p-4 print:p-2 bg-green-100 print:bg-white print:border rounded-lg">
                      <div className="font-bold text-green-600 print:text-black text-lg print:text-base">
                        {formatCurrency(reportData.reduce((sum, row) => sum + (row.totalAmountReceived || 0), 0))}
                      </div>
                      <div className="text-gray-600 print:text-black font-medium print:text-xs">إجمالي المبلغ المستلم</div>
                    </div>
                    <div className="summary-item text-center p-4 print:p-2 bg-red-100 print:bg-white print:border rounded-lg">
                      <div className="font-bold text-red-600 print:text-black text-lg print:text-base">
                        {formatCurrency(reportData.reduce((sum, row) => sum + (row.remainingAmount || 0), 0))}
                      </div>
                      <div className="text-gray-600 print:text-black font-medium print:text-xs">إجمالي المبلغ المتبقي</div>
                    </div>
                  </div>
                </div>

                {/* Signature Section */}
                <div className="mt-8 pt-4 border-t-2 border-gray-200 print:mt-4 print:pt-2">
                  <div className="grid grid-cols-3 gap-8 text-center print:grid-cols-3 print:gap-4">
                    <div className="space-y-4 print:space-y-2">
                      <div className="font-semibold text-gray-700 print:text-xs print:text-black">مدير المشروع</div>
                      <div className="border-t border-gray-400 pt-2 print:pt-1">
                        <div className="text-sm text-gray-600 print:text-xs print:text-black">________________________</div>
                      </div>
                    </div>
                    <div className="space-y-4 print:space-y-2">
                      <div className="font-semibold text-gray-700 print:text-xs print:text-black">المهندس</div>
                      <div className="border-t border-gray-400 pt-2 print:pt-1">
                        <div className="text-sm text-gray-600 print:text-xs print:text-black">________________________</div>
                      </div>
                    </div>
                    <div className="space-y-4 print:space-y-2">
                      <div className="font-semibold text-gray-700 print:text-xs print:text-black">المدير العام</div>
                      <div className="border-t border-gray-400 pt-2 print:pt-1">
                        <div className="text-sm text-gray-600 print:text-xs print:text-black">________________________</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center text-sm text-gray-500 print:text-xs print:text-black print:mt-4">
                  تم إنشاء هذا التقرير آلياً بواسطة نظام إدارة مشاريع البناء - {new Date().toLocaleDateString('ar-EG')} - {new Date().toLocaleTimeString('ar-EG')}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}