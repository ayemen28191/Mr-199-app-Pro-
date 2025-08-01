import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, FileSpreadsheet, Printer, Download, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSelectedProject } from "@/hooks/use-selected-project";
import ProjectSelector from "@/components/project-selector";
import { getCurrentDate, formatCurrency, formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { Project } from "@shared/schema";

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
  };
  fundTransfers: any[];
  workerAttendance: any[];
  materialPurchases: any[];
  transportationExpenses: any[];
  workerTransfers: any[];
}

export default function ExcelStyleDailyExpenses() {
  const { selectedProjectId, selectProject } = useSelectedProject();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [reportData, setReportData] = useState<DailyExpenseData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const generateReport = useCallback(async () => {
    if (!selectedProjectId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار مشروع أولاً",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDate) {
      toast({
        title: "خطأ",
        description: "يرجى تحديد التاريخ",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiRequest("GET", `/api/reports/daily-expenses/${selectedProjectId}/${selectedDate}`);
      setReportData(data);
      
      toast({
        title: "تم إنشاء التقرير",
        description: `تم إنشاء كشف المصروفات ليوم ${formatDate(selectedDate)}`,
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
  }, [selectedProjectId, selectedDate, toast]);

  const exportToExcel = useCallback(async () => {
    if (!reportData) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات لتصديرها",
        variant: "destructive",
      });
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('كشف المصروفات اليومية');
      
      // إعداد اتجاه الكتابة من اليمين لليسار
      worksheet.views = [{ rightToLeft: true }];
      
      // إضافة عنوان التقرير
      worksheet.mergeCells('A1:E1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `كشف مصروفات يوم الأحد تاريخ ${formatDate(selectedDate)}`;
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.font = { bold: true, size: 14 };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '87CEEB' }
      };
      
      // إضافة رؤوس الجدول
      const headerRow = worksheet.getRow(2);
      headerRow.values = ['المبلغ', 'نوع الحساب', 'نوع', 'الإجمالي المبلغ المتبقي', 'ملاحظات'];
      headerRow.font = { bold: true };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '87CEEB' }
      };
      
      let currentRow = 3;
      let runningBalance = reportData.summary?.carriedForward || 0;
      
      // إضافة الرصيد المرحل
      if ((reportData.summary?.carriedForward || 0) !== 0) {
        const balanceRow = worksheet.getRow(currentRow);
        balanceRow.values = [
          reportData.summary?.carriedForward || 0,
          'مرحلة',
          'توريد',
          reportData.summary?.carriedForward || 0,
          'رصيد مرحل من اليوم السابق'
        ];
        balanceRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'C8E6C9' }
        };
        currentRow++;
      }
      
      // إضافة الحوالات المالية
      reportData.fundTransfers?.forEach((transfer) => {
        runningBalance += parseFloat(transfer.amount);
        const row = worksheet.getRow(currentRow);
        row.values = [
          parseFloat(transfer.amount),
          'حوالة',
          'توريد',
          runningBalance,
          `حوالة من ${transfer.senderName} عبر ${transfer.transferType} رقم ${transfer.transferNumber}`
        ];
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'C8E6C9' }
        };
        currentRow++;
      });
      
      // إضافة أجور العمال
      reportData.workerAttendance?.forEach((attendance) => {
        runningBalance -= parseFloat(attendance.paidAmount);
        const row = worksheet.getRow(currentRow);
        row.values = [
          parseFloat(attendance.paidAmount),
          `مع ${attendance.worker?.name}`,
          'منصرف',
          runningBalance,
          `${attendance.workDescription || 'عمل يومي'}`
        ];
        currentRow++;
      });
      
      // إضافة شراء المواد
      reportData.materialPurchases?.forEach((purchase) => {
        runningBalance -= parseFloat(purchase.totalAmount);
        const row = worksheet.getRow(currentRow);
        row.values = [
          parseFloat(purchase.totalAmount),
          `شراء ${purchase.material?.name}`,
          'منصرف',
          runningBalance,
          `${purchase.quantity} ${purchase.material?.unit} من ${purchase.supplierName}`
        ];
        currentRow++;
      });
      
      // إضافة أجور المواصلات
      reportData.transportationExpenses?.forEach((expense) => {
        runningBalance -= parseFloat(expense.amount);
        const row = worksheet.getRow(currentRow);
        row.values = [
          parseFloat(expense.amount),
          'نقليات',
          'منصرف',
          runningBalance,
          `${expense.description} - ${expense.worker?.name || ''}`
        ];
        currentRow++;
      });
      
      // إضافة حوالات العمال
      reportData.workerTransfers?.forEach((transfer) => {
        runningBalance -= parseFloat(transfer.amount);
        const row = worksheet.getRow(currentRow);
        row.values = [
          parseFloat(transfer.amount),
          'نقليات',
          'منصرف',
          runningBalance,
          `حوالة ${transfer.worker?.name} إلى ${transfer.recipientName} عبر ${transfer.transferMethod}`
        ];
        currentRow++;
      });
      
      // إضافة صف المبلغ المتبقي
      currentRow++;
      worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
      const totalLabelCell = worksheet.getCell(`A${currentRow}`);
      totalLabelCell.value = 'المبلغ المتبقي';
      totalLabelCell.alignment = { horizontal: 'center', vertical: 'middle' };
      totalLabelCell.font = { bold: true };
      totalLabelCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '87CEEB' }
      };
      
      currentRow++;
      worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
      const totalValueCell = worksheet.getCell(`A${currentRow}`);
      totalValueCell.value = reportData.summary?.remainingBalance || 0;
      totalValueCell.alignment = { horizontal: 'center', vertical: 'middle' };
      totalValueCell.font = { bold: true, size: 16 };
      totalValueCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFB74D' }
      };
      
      // إضافة معلومات المشروع في الأسفل
      currentRow += 3;
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      const projectLabelCell = worksheet.getCell(`A${currentRow}`);
      projectLabelCell.value = 'اسم المشروع';
      projectLabelCell.alignment = { horizontal: 'center', vertical: 'middle' };
      projectLabelCell.font = { bold: true };
      projectLabelCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '87CEEB' }
      };
      
      const projectLocationCell = worksheet.getCell(`C${currentRow}`);
      projectLocationCell.value = 'محل التوريد';
      projectLocationCell.alignment = { horizontal: 'center', vertical: 'middle' };
      projectLocationCell.font = { bold: true };
      projectLocationCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '87CEEB' }
      };
      
      const projectNotesCell = worksheet.getCell(`D${currentRow}`);
      projectNotesCell.value = 'الملاحظات';
      projectNotesCell.alignment = { horizontal: 'center', vertical: 'middle' };
      projectNotesCell.font = { bold: true };
      projectNotesCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '87CEEB' }
      };
      
      currentRow++;
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      const projectNameCell = worksheet.getCell(`A${currentRow}`);
      projectNameCell.value = selectedProject?.name || '';
      projectNameCell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // تنسيق الأعمدة
      worksheet.columns = [
        { width: 15 }, // المبلغ
        { width: 20 }, // نوع الحساب
        { width: 15 }, // نوع
        { width: 20 }, // الإجمالي المبلغ المتبقي
        { width: 40 }  // ملاحظات
      ];
      
      // إضافة حدود للجدول
      for (let row = 2; row <= currentRow; row++) {
        for (let col = 1; col <= 5; col++) {
          const cell = worksheet.getCell(row, col);
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
      }
      
      // حفظ الملف
      const fileName = `كشف_مصروفات_يومية_${selectedProject?.name}_${selectedDate}.xlsx`;
      workbook.xlsx.writeBuffer().then(buffer => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, fileName);
      });
      
      toast({
        title: "تم التصدير",
        description: "تم تصدير التقرير إلى ملف Excel بنجاح",
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تصدير التقرير",
        variant: "destructive",
      });
    }
  }, [reportData, selectedProject, selectedDate, toast]);

  const printReport = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="ml-3 p-2"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">كشف المصروفات اليومية - نمط Excel</h1>
      </div>

      {/* Controls */}
      <Card className="mb-6 no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            إعدادات التقرير
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">اختيار المشروع</Label>
            <ProjectSelector onProjectChange={selectProject} />
          </div>

          {/* Date Selection */}
          <div>
            <Label htmlFor="selectedDate" className="text-sm font-medium mb-2 block">
              التاريخ
            </Label>
            <Input
              id="selectedDate"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="arabic-numbers max-w-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={generateReport} 
              disabled={isLoading || !selectedProjectId}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              {isLoading ? "جاري الإنشاء..." : "إنشاء التقرير"}
            </Button>
            
            {reportData && (
              <>
                <Button 
                  onClick={exportToExcel} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  تصدير Excel
                </Button>
                
                <Button 
                  onClick={printReport} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  طباعة
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Display */}
      {reportData && (
        <div className="excel-style-report print-preview">
          {/* Report Header */}
          <div className="excel-header">
            <h2>كشف مصروفات يوم الأحد تاريخ {formatDate(selectedDate)}</h2>
          </div>

          {/* Main Table */}
          <div className="excel-table-container">
            <table className="excel-table">
              <thead>
                <tr className="excel-header-row">
                  <th>المبلغ</th>
                  <th>نوع الحساب</th>
                  <th>نوع</th>
                  <th>الأجمالي المبلغ المتبقي</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {/* الرصيد المرحل */}
                {reportData.summary?.carriedForward !== 0 && (
                  <tr className="excel-income-row">
                    <td className="excel-amount">{formatCurrency(reportData.summary?.carriedForward || 0)}</td>
                    <td>مرحلة</td>
                    <td>توريد</td>
                    <td className="excel-balance">{formatCurrency(reportData.summary?.carriedForward || 0)}</td>
                    <td>رصيد مرحل من اليوم السابق</td>
                  </tr>
                )}

                {/* الحوالات المالية */}
                {reportData.fundTransfers?.map((transfer, index) => {
                  const previousAmount = (reportData.summary?.carriedForward || 0) + 
                    reportData.fundTransfers.slice(0, index).reduce((sum, t) => sum + parseFloat(t.amount), 0);
                  const currentBalance = previousAmount + parseFloat(transfer.amount);
                  
                  return (
                    <tr key={`transfer-${index}`} className="excel-income-row">
                      <td className="excel-amount">{formatCurrency(parseFloat(transfer.amount))}</td>
                      <td>حوالة</td>
                      <td>توريد</td>
                      <td className="excel-balance">{formatCurrency(currentBalance)}</td>
                      <td>حوالة من {transfer.senderName} عبر {transfer.transferType} رقم {transfer.transferNumber}</td>
                    </tr>
                  );
                })}

                {/* أجور العمال */}
                {reportData.workerAttendance?.map((attendance, index) => {
                  const previousIncome = (reportData.summary?.carriedForward || 0) + (reportData.summary?.totalFundTransfers || 0);
                  const previousExpenses = reportData.workerAttendance.slice(0, index).reduce((sum, a) => sum + parseFloat(a.paidAmount), 0);
                  const currentBalance = previousIncome - previousExpenses - parseFloat(attendance.paidAmount);
                  
                  return (
                    <tr key={`worker-${index}`} className="excel-expense-row">
                      <td className="excel-amount">{formatCurrency(parseFloat(attendance.paidAmount))}</td>
                      <td>مع {attendance.worker?.name}</td>
                      <td>منصرف</td>
                      <td className="excel-balance">{formatCurrency(currentBalance)}</td>
                      <td>{attendance.workDescription || 'عمل يومي'}</td>
                    </tr>
                  );
                })}

                {/* شراء المواد */}
                {reportData.materialPurchases?.map((purchase, index) => {
                  const runningBalance = reportData.summary?.remainingBalance || 0; // سيتم حساب هذا بدقة أكثر
                  
                  return (
                    <tr key={`material-${index}`} className="excel-expense-row">
                      <td className="excel-amount">{formatCurrency(parseFloat(purchase.totalAmount))}</td>
                      <td>شراء {purchase.material?.name}</td>
                      <td>منصرف</td>
                      <td className="excel-balance">{formatCurrency(runningBalance)}</td>
                      <td>{purchase.quantity} {purchase.material?.unit} من {purchase.supplierName}</td>
                    </tr>
                  );
                })}

                {/* أجور المواصلات */}
                {reportData.transportationExpenses?.map((expense, index) => {
                  return (
                    <tr key={`transport-${index}`} className="excel-expense-row">
                      <td className="excel-amount">{formatCurrency(parseFloat(expense.amount))}</td>
                      <td>نقليات</td>
                      <td>منصرف</td>
                      <td className="excel-balance">0</td>
                      <td>{expense.description} - {expense.worker?.name || ''}</td>
                    </tr>
                  );
                })}

                {/* حوالات العمال */}
                {reportData.workerTransfers?.map((transfer, index) => {
                  return (
                    <tr key={`worker-transfer-${index}`} className="excel-expense-row">
                      <td className="excel-amount">{formatCurrency(parseFloat(transfer.amount))}</td>
                      <td>نقليات</td>
                      <td>منصرف</td>
                      <td className="excel-balance">0</td>
                      <td>حوالة {transfer.worker?.name} إلى {transfer.recipientName} عبر {transfer.transferMethod}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* المبلغ المتبقي */}
          <div className="excel-total-section">
            <div className="excel-total-label">المبلغ المتبقي</div>
            <div className="excel-total-amount">{formatCurrency(reportData.summary?.remainingBalance || 0)}</div>
          </div>

          {/* Project Information */}
          <div className="excel-project-section">
            <table className="excel-project-table">
              <thead>
                <tr className="excel-header-row">
                  <th colSpan={2}>اسم المشروع</th>
                  <th>محل التوريد</th>
                  <th>الملاحظات</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={2}>{selectedProject?.name || ''}</td>
                  <td>موقع المشروع</td>
                  <td>تقرير مصروفات يومية</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!reportData && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد بيانات</h3>
            <p className="text-gray-600">
              يرجى اختيار مشروع وتحديد التاريخ ثم الضغط على "إنشاء التقرير"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}