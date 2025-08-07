import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Printer, FileSpreadsheet, User, Building2, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSelectedProject } from "@/hooks/use-selected-project";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate, getCurrentDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { EnhancedWorkerAccountStatement } from "@/components/EnhancedWorkerAccountStatement";
import type { Worker, Project, WorkerAttendance, WorkerTransfer } from "@shared/schema";
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import "@/components/print-fix-large-numbers.css";

interface WorkerStatementData {
  worker: Worker;
  project: Project;
  attendance: WorkerAttendance[];
  transfers: WorkerTransfer[];
}

export default function EnhancedWorkerStatement() {
  const { selectedProjectId } = useSelectedProject();
  const { toast } = useToast();
  
  // Form states
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState(getCurrentDate());
  const [statementData, setStatementData] = useState<WorkerStatementData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch data
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedWorker = workers.find(w => w.id === selectedWorkerId);

  // Generate statement
  const generateStatement = useCallback(async () => {
    if (!selectedProjectId) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار مشروع أولاً",
        variant: "destructive",
      });
      return;
    }

    if (!selectedWorkerId) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار عامل",
        variant: "destructive",
      });
      return;
    }

    if (!dateFrom || !dateTo) {
      toast({
        title: "تنبيه", 
        description: "يرجى تحديد فترة الكشف",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Fetch worker attendance data for the period
      const attendanceResponse = await apiRequest(
        'GET',
        `/api/worker-attendance-filter?workerId=${selectedWorkerId}&dateFrom=${dateFrom}&dateTo=${dateTo}`
      );

      // Fetch worker transfers data for the period
      const transfersResponse = await apiRequest(
        'GET',
        `/api/workers/${selectedWorkerId}/transfers?projectId=${selectedProjectId}&dateFrom=${dateFrom}&dateTo=${dateTo}`
      );

      const attendance: WorkerAttendance[] = attendanceResponse || [];
      const transfers: WorkerTransfer[] = Array.isArray(transfersResponse) ? transfersResponse : [];
      
      if (attendance.length === 0) {
        toast({
          title: "تنبيه",
          description: "لا توجد بيانات حضور للعامل في الفترة المحددة",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      const worker = workers.find(w => w.id === selectedWorkerId);
      const project = projects.find(p => p.id === selectedProjectId);

      if (!worker || !project) {
        toast({
          title: "خطأ",
          description: "خطأ في جلب بيانات العامل أو المشروع",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      setStatementData({
        worker: {
          ...worker,
          dailyWage: Number(worker.dailyWage)
        },
        project,
        attendance: attendance.map(record => ({
          ...record,
          workDays: Number(record.workDays),
          dailyWage: Number(record.dailyWage),
          paidAmount: Number(record.paidAmount)
        })),
        transfers: transfers.map(transfer => ({
          ...transfer,
          date: transfer.transferDate,
          amount: Number(transfer.amount)
        }))
      });

      toast({
        title: "تم بنجاح",
        description: `تم إنشاء كشف حساب العامل ${worker.name}`,
      });

    } catch (error) {
      console.error("Error generating worker statement:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء الكشف",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedProjectId, selectedWorkerId, dateFrom, dateTo, toast, workers, projects]);

  // Print statement
  const printStatement = useCallback(() => {
    if (!statementData) {
      toast({
        title: "تنبيه",
        description: "يرجى إنشاء الكشف أولاً",
        variant: "destructive",
      });
      return;
    }

    window.print();
  }, [statementData, toast]);

  // Export to Excel
  const exportToExcel = useCallback(async () => {
    if (!statementData) {
      toast({
        title: "تنبيه",
        description: "يرجى إنشاء الكشف أولاً",
        variant: "destructive",
      });
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('كشف حساب العامل');

      // إعداد طباعة محسن وإصلاح مشكلة الأرقام الكبيرة
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
        verticalCentered: false
      };

      // إعداد اتجاه الكتابة من اليمين لليسار مع تثبيت التكبير
      worksheet.views = [{ 
        rightToLeft: true,
        showGridLines: true,
        showRowColHeaders: true,
        zoomScale: 100, // إصلاح: تثبيت التكبير على 100% لمنع ظهور الأرقام الكبيرة
        state: 'normal'
      }];

      // Add header
      worksheet.mergeCells('A1:L3');
      const headerCell = worksheet.getCell('A1');
      headerCell.value = `شركة الحاج عبدالرحمن علي الجهني وأولاده\nكشف حساب العامل الشامل والتفصيلي\nالفترة: من ${formatDate(dateFrom)} إلى ${formatDate(dateTo)}`;
      headerCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      headerCell.font = { bold: true, size: 14 };
      headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };

      // Worker and Project Info
      let currentRow = 5;
      worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = 'بيانات العامل';
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E5F5' } };

      worksheet.mergeCells(`E${currentRow}:H${currentRow}`);
      worksheet.getCell(`E${currentRow}`).value = 'بيانات المشروع';
      worksheet.getCell(`E${currentRow}`).font = { bold: true };
      worksheet.getCell(`E${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E5F5' } };

      currentRow++;
      worksheet.getCell(`A${currentRow}`).value = 'الاسم:';
      worksheet.getCell(`B${currentRow}`).value = statementData.worker.name;
      worksheet.getCell(`C${currentRow}`).value = 'المهنة:';
      worksheet.getCell(`D${currentRow}`).value = statementData.worker.type;
      worksheet.getCell(`E${currentRow}`).value = 'اسم المشروع:';
      worksheet.getCell(`F${currentRow}`).value = statementData.project.name;
      worksheet.getCell(`G${currentRow}`).value = 'الأجر اليومي:';
      worksheet.getCell(`H${currentRow}`).value = formatCurrency(Number(statementData.worker.dailyWage));

      // Summary calculations
      const totalWorkDays = statementData.attendance.reduce((sum, record) => sum + (Number(record.workDays) || 0), 0);
      const totalAmountDue = statementData.attendance.reduce((sum, record) => 
        sum + (Number(record.dailyWage) * Number(record.workDays)), 0);
      const totalAmountReceived = statementData.attendance.reduce((sum, record) => 
        sum + (Number(record.paidAmount) || 0), 0);
      const totalTransferred = statementData.transfers.reduce((sum, transfer) => sum + Number(transfer.amount), 0);
      const remainingAmount = totalAmountDue - totalAmountReceived;
      // الرصيد الصحيح للعامل = المستحق - المدفوع - المحول للأهل
      const workerCurrentBalance = totalAmountDue - totalAmountReceived - totalTransferred;

      // Financial Summary
      currentRow += 2;
      worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = 'الملخص المالي';
      worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
      worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E8' } };
      worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };

      currentRow++;
      const summaryData = [
        ['إجمالي المستحق', formatCurrency(totalAmountDue), 'إجمالي المستلم', formatCurrency(totalAmountReceived)],
        ['إجمالي المحول', formatCurrency(totalTransferred), 'المتبقي في الذمة', formatCurrency(remainingAmount)],
        ['الرصيد الحالي للعامل', formatCurrency(workerCurrentBalance), 'إجمالي أيام العمل', `${totalWorkDays.toFixed(1)} يوم`]
      ];

      summaryData.forEach(row => {
        worksheet.addRow(row);
        currentRow++;
      });

      // Attendance table
      currentRow += 2;
      worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = 'سجل الحضور والعمل التفصيلي';
      worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
      worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4EC' } };
      worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };

      currentRow++;
      const headers = ['م', 'التاريخ', 'أيام العمل', 'من الساعة', 'إلى الساعة', 'وصف العمل', 
                      'الأجر المستحق', 'المبلغ المدفوع', 'المتبقي', 'نوع الدفع', 'ملاحظات'];
      worksheet.addRow(headers);
      const headerRow = worksheet.getRow(currentRow);
      headerRow.font = { bold: true };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB0BEC5' } };
      currentRow++;

      // Add attendance data
      statementData.attendance.forEach((record, index) => {
        const amountDue = Number(record.dailyWage) * Number(record.workDays);
        const remaining = amountDue - (Number(record.paidAmount) || 0);
        const paymentTypeText = record.paymentType === 'full' ? 'كامل' : 
                               record.paymentType === 'partial' ? 'جزئي' : 'آجل';

        worksheet.addRow([
          index + 1,
          formatDate(record.date),
          Number(record.workDays).toFixed(1),
          record.startTime || '-',
          record.endTime || '-',
          record.workDescription || '-',
          formatCurrency(amountDue),
          formatCurrency(Number(record.paidAmount) || 0),
          formatCurrency(remaining),
          paymentTypeText,
          '' // notes - removing since it doesn't exist in schema
        ]);
        currentRow++;
      });

      // Add totals row
      worksheet.addRow([
        'الإجماليات', '', totalWorkDays.toFixed(1), '', '', '',
        formatCurrency(totalAmountDue), formatCurrency(totalAmountReceived),
        formatCurrency(remainingAmount), '', ''
      ]);
      const totalsRow = worksheet.getRow(currentRow);
      totalsRow.font = { bold: true };
      totalsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };

      // Add transfers table if any
      if (statementData.transfers.length > 0) {
        currentRow += 3;
        worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = 'سجل الحوالات المرسلة';
        worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
        worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4EC' } };
        worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };

        currentRow++;
        const transferHeaders = ['م', 'التاريخ', 'المبلغ', 'رقم الحوالة', 'المرسل', 'المستلم', 'هاتف المستلم', 'طريقة التحويل', 'ملاحظات'];
        worksheet.addRow(transferHeaders);
        const transferHeaderRow = worksheet.getRow(currentRow);
        transferHeaderRow.font = { bold: true };
        transferHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB0BEC5' } };
        currentRow++;

        statementData.transfers.forEach((transfer, index) => {
          const methodText = transfer.transferMethod === 'hawaleh' ? 'حوالة' : 
                            transfer.transferMethod === 'bank' ? 'بنك' : 'نقداً';
          
          worksheet.addRow([
            index + 1,
            formatDate(transfer.transferDate),
            formatCurrency(Number(transfer.amount)),
            transfer.transferNumber,
            transfer.senderName,
            transfer.recipientName,
            transfer.recipientPhone,
            methodText,
            transfer.notes || '-'
          ]);
          currentRow++;
        });

        // Add transfers total
        worksheet.addRow(['إجمالي الحوالات', '', formatCurrency(totalTransferred), '', '', '', '', '', '']);
        const transferTotalsRow = worksheet.getRow(currentRow);
        transferTotalsRow.font = { bold: true };
        transferTotalsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
      }

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = 15;
      });

      // Generate and save file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileName = `كشف_حساب_العامل_${statementData.worker.name}_${dateFrom}_${dateTo}.xlsx`;
      saveAs(blob, fileName);

      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير كشف حساب العامل ${statementData.worker.name} إلى Excel`,
      });

    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تصدير الكشف",
        variant: "destructive",
      });
    }
  }, [statementData, dateFrom, dateTo, toast]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">كشف حساب العامل الشامل</h1>
          <p className="text-muted-foreground">إنشاء كشف حساب تفصيلي شامل للعامل</p>
        </div>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            إعدادات الكشف
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Project Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                المشروع
              </Label>
              <Select value={selectedProjectId || ""} disabled>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المشروع" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Worker Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                العامل
              </Label>
              <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر العامل" />
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

            {/* Date From */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                من تاريخ
              </Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                إلى تاريخ
              </Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={generateStatement}
              disabled={isGenerating || !selectedProjectId || !selectedWorkerId || !dateFrom || !dateTo}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              {isGenerating ? "جاري الإنشاء..." : "إنشاء الكشف"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statement Results */}
      {statementData && (
        <Card className="print-preview">
          <CardHeader className="print:hidden">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                كشف حساب العامل - {statementData.worker.name}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportToExcel}>
                  <FileSpreadsheet className="h-4 w-4 ml-2" />
                  تصدير Excel
                </Button>
                <Button variant="outline" size="sm" onClick={printStatement}>
                  <Printer className="h-4 w-4 ml-2" />
                  طباعة
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <EnhancedWorkerAccountStatement
              worker={statementData.worker}
              project={statementData.project}
              attendance={statementData.attendance}
              transfers={statementData.transfers}
              dateFrom={dateFrom}
              dateTo={dateTo}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}