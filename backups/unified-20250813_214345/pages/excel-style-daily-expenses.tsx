import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, FileSpreadsheet, Printer, Download } from "lucide-react";
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
  projectId: string;
  summary: {
    carriedForward: number;
    totalFundTransfers: number;
    totalWorkerCosts: number;
    totalMaterialCosts: number;
    totalTransportCosts: number;
    totalTransferCosts: number;
    totalIncome: number;
    totalExpenses: number;
    remainingBalance: number;
  };
  fundTransfers: any[];
  workerAttendance: any[];
  materialPurchases: any[];
  transportationExpenses: any[];
  workerTransfers: any[];
}

interface TransactionRow {
  id: string;
  accountType: string;
  operationType: string;
  amount: number;
  balanceAfter: number;
  notes: string;
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

  // تحويل البيانات إلى معاملات مرتبة
  const generateTransactions = useCallback((): TransactionRow[] => {
    if (!reportData) return [];

    const transactions: TransactionRow[] = [];
    let runningBalance = reportData.summary.carriedForward;

    // 1. مرحلة من اليوم السابق
    if (reportData.summary.carriedForward > 0) {
      transactions.push({
        id: 'carried-forward',
        accountType: 'مرحلة',
        operationType: 'ترجيل',
        amount: reportData.summary.carriedForward,
        balanceAfter: runningBalance,
        notes: `مرحلة من تاريخ ${new Date(new Date(reportData.date).getTime() - 24*60*60*1000).toLocaleDateString('en-GB')}`
      });
    }

    // 2. الحوالات (توريد)
    reportData.fundTransfers.forEach(transfer => {
      runningBalance += parseFloat(transfer.amount);
      transactions.push({
        id: transfer.id,
        accountType: 'حولة',
        operationType: 'توريد',
        amount: parseFloat(transfer.amount),
        balanceAfter: runningBalance,
        notes: `حوالة من ${transfer.senderName} - رقم الحوالة ${transfer.transferNumber}`
      });
    });

    // 3. مصروفات العمال (منصرف)
    reportData.workerAttendance.forEach(attendance => {
      if (attendance.paidAmount > 0) {
        runningBalance -= parseFloat(attendance.paidAmount);
        const workDays = parseFloat(attendance.workDays || '1');
        transactions.push({
          id: attendance.id,
          accountType: `مصروف ${attendance.worker?.name || 'عامل'}`,
          operationType: 'منصرف',
          amount: parseFloat(attendance.paidAmount),
          balanceAfter: runningBalance,
          notes: `العمل من الساعة ${attendance.startTime} إلى عصر وحتى الساعة ${attendance.endTime} صباحاً - ${workDays} يوم`
        });
      }
    });

    // 4. مصروفات النقليات (منصرف)
    reportData.transportationExpenses.forEach(expense => {
      runningBalance -= parseFloat(expense.amount);
      transactions.push({
        id: expense.id,
        accountType: 'نقليات',
        operationType: 'منصرف',
        amount: parseFloat(expense.amount),
        balanceAfter: runningBalance,
        notes: expense.description || 'مصروف نقليات'
      });
    });

    // 5. حوالات العمال للأهل (منصرف)
    reportData.workerTransfers.forEach(transfer => {
      runningBalance -= parseFloat(transfer.amount);
      transactions.push({
        id: transfer.id,
        accountType: `حوالة ${transfer.worker?.name || 'عامل'}`,
        operationType: 'منصرف',
        amount: parseFloat(transfer.amount),
        balanceAfter: runningBalance,
        notes: `حوالة إلى ${transfer.recipientName} - ${transfer.transferMethod}`
      });
    });

    return transactions;
  }, [reportData]);

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
        <FileSpreadsheet className="h-6 w-6 text-primary" />
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
          <div className="modern-excel-header">
            <h2>كشف مصروفات يوم الأحد تاريخ {formatDate(selectedDate)}</h2>
          </div>

          {/* Main Table - New Layout */}
          <div className="modern-excel-container">
            <table className="modern-excel-table">
              <thead>
                <tr className="modern-header-row">
                  <th className="col-amount">المبلغ</th>
                  <th className="col-account-type">نوع الحساب</th>
                  <th className="col-total-balance">الإجمالي المبلغ المتبقي</th>
                  <th className="col-notes">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let runningBalance = reportData.summary?.carriedForward || 0;
                  const rows = [];
                  
                  // الرصيد المرحل
                  if ((reportData.summary?.carriedForward || 0) !== 0) {
                    rows.push(
                      <tr key="carried-forward" className="modern-income-row">
                        <td className="amount-cell">{formatCurrency(reportData.summary?.carriedForward || 0)}</td>
                        <td>مرحل</td>
                        <td className="balance-cell">{formatCurrency(runningBalance)}</td>
                        <td className="notes-cell">مرحل من تاريخ {formatDate(new Date(new Date(selectedDate).getTime() - 24*60*60*1000))}</td>
                      </tr>
                    );
                  }

                  // الحوالات المالية
                  reportData.fundTransfers?.forEach((transfer, index) => {
                    runningBalance += parseFloat(transfer.amount);
                    rows.push(
                      <tr key={`transfer-${index}`} className="modern-income-row">
                        <td className="amount-cell">{formatCurrency(parseFloat(transfer.amount))}</td>
                        <td>حوالة</td>
                        <td className="balance-cell">{formatCurrency(runningBalance)}</td>
                        <td className="notes-cell">الحوالة من {transfer.senderName} باسم {transfer.recipientName || 'المهندس المسؤول'} تاريخ {formatDate(transfer.transferDate)}</td>
                      </tr>
                    );
                  });

                  // أجور العمال
                  reportData.workerAttendance?.forEach((attendance, index) => {
                    runningBalance -= parseFloat(attendance.paidAmount);
                    const workerType = attendance.worker?.name?.includes('سلطان') ? 'مصروف المهندس' : 
                                     attendance.worker?.name?.includes('مؤيد') ? 'مصروف مؤيد' : 
                                     attendance.worker?.name?.includes('عبدالله') ? 'مصروف عبدالله عمر' :
                                     `مصروف ${attendance.worker?.name}`;
                    
                    rows.push(
                      <tr key={`worker-${index}`} className="modern-expense-row">
                        <td className="amount-cell">{formatCurrency(parseFloat(attendance.paidAmount))}</td>
                        <td>{workerType}</td>
                        <td className="balance-cell">{formatCurrency(runningBalance)}</td>
                        <td className="notes-cell">{attendance.workDescription || `العمل ${attendance.workDays} أيام العمل ${attendance.hoursWorked || 8} ساعات`}</td>
                      </tr>
                    );
                  });

                  // أجور المواصلات والتنقلات
                  reportData.transportationExpenses?.forEach((expense, index) => {
                    runningBalance -= parseFloat(expense.amount);
                    rows.push(
                      <tr key={`transport-${index}`} className="modern-expense-row">
                        <td className="amount-cell">{formatCurrency(parseFloat(expense.amount))}</td>
                        <td>نقليات</td>
                        <td className="balance-cell">{formatCurrency(runningBalance)}</td>
                        <td className="notes-cell">{expense.description} - {expense.worker?.name || ''}</td>
                      </tr>
                    );
                  });

                  // حوالات العمال
                  reportData.workerTransfers?.forEach((transfer, index) => {
                    runningBalance -= parseFloat(transfer.amount);
                    rows.push(
                      <tr key={`worker-transfer-${index}`} className="modern-expense-row">
                        <td className="amount-cell">{formatCurrency(parseFloat(transfer.amount))}</td>
                        <td>نقليات العمال</td>
                        <td className="balance-cell">{formatCurrency(runningBalance)}</td>
                        <td className="notes-cell">حق {transfer.worker?.name} بترول مع {transfer.recipientName}</td>
                      </tr>
                    );
                  });

                  // المشتريات
                  reportData.materialPurchases?.forEach((purchase, index) => {
                    // خصم المشتريات النقدية فقط من الرصيد - المشتريات الآجلة تظهر بدون خصم
                    if (purchase.purchaseType === "نقد") {
                      runningBalance -= parseFloat(purchase.totalAmount);
                    }
                    
                    const isCashPurchase = purchase.purchaseType === "نقد";
                    const rowClass = isCashPurchase ? "modern-expense-row" : "modern-deferred-row";
                    const paymentTypeIcon = isCashPurchase ? "💵" : "⏰";
                    const paymentTypeText = isCashPurchase ? "نقد" : "آجل";
                    
                    rows.push(
                      <tr key={`material-${index}`} className={rowClass}>
                        <td className="amount-cell">{formatCurrency(parseFloat(purchase.totalAmount))}</td>
                        <td>مشتريات {paymentTypeIcon} {paymentTypeText}</td>
                        <td className="balance-cell">{formatCurrency(runningBalance)}</td>
                        <td className="notes-cell">
                          شراء {purchase.material?.name} من {purchase.supplierName}
                          {!isCashPurchase && " (آجل - لا يؤثر على الرصيد)"}
                        </td>
                      </tr>
                    );
                  });

                  return rows;
                })()}
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
            <FileSpreadsheet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
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