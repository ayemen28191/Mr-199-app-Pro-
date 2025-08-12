// مكون تصدير Excel الموحد - مبسط وقوي
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ExcelData {
  [key: string]: any;
}

interface UnifiedExcelExporterProps {
  data: ExcelData;
  fileName: string;
  reportType: 'worker_statement' | 'daily_expenses' | 'project_summary';
  disabled?: boolean;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function UnifiedExcelExporter({
  data,
  fileName,
  reportType,
  disabled = false,
  className = "",
  variant = "outline"
}: UnifiedExcelExporterProps) {

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('التقرير');

      // إعداد الأعمدة حسب نوع التقرير
      if (reportType === 'worker_statement') {
        await exportWorkerStatement(worksheet, data);
      } else if (reportType === 'daily_expenses') {
        await exportDailyExpenses(worksheet, data);
      } else if (reportType === 'project_summary') {
        await exportProjectSummary(worksheet, data);
      }

      // حفظ الملف
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${fileName}.xlsx`);
      
    } catch (error) {
      console.error('خطأ في تصدير Excel:', error);
    }
  };

  const exportWorkerStatement = async (worksheet: ExcelJS.Worksheet, data: ExcelData) => {
    const { worker, attendance = [], transfers = [] } = data;

    // عنوان التقرير
    worksheet.addRow(['كشف حساب العامل']);
    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // معلومات العامل
    worksheet.addRow([]);
    worksheet.addRow(['معلومات العامل']);
    worksheet.addRow(['الاسم', worker?.name || 'غير محدد']);
    worksheet.addRow(['النوع', worker?.type || 'غير محدد']);
    worksheet.addRow(['الأجر اليومي', formatCurrency(Number(worker?.dailyWage || 0))]);
    worksheet.addRow([]);

    // رؤوس جدول الحضور
    worksheet.addRow(['التاريخ', 'أيام العمل', 'الأجر المستحق', 'المبلغ المدفوع', 'ملاحظات']);
    const headerRow = worksheet.lastRow;
    if (headerRow) {
      headerRow.font = { bold: true };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
    }

    // بيانات الحضور
    attendance.forEach((record: any) => {
      worksheet.addRow([
        formatDate(record.date),
        record.workDays || 1,
        formatCurrency(Number(record.dailyWage) * Number(record.workDays || 1)),
        formatCurrency(Number(record.paidAmount || 0)),
        record.notes || '-'
      ]);
    });

    // جدول التحويلات
    if (transfers.length > 0) {
      worksheet.addRow([]);
      worksheet.addRow(['حوالات الأهل']);
      worksheet.addRow(['التاريخ', 'المبلغ', 'اسم المستلم', 'رقم الهاتف', 'طريقة التحويل']);
      
      transfers.forEach((transfer: any) => {
        worksheet.addRow([
          formatDate(transfer.transferDate),
          formatCurrency(Number(transfer.amount)),
          transfer.recipientName,
          transfer.recipientPhone || '-',
          transfer.transferMethod
        ]);
      });
    }

    // ضبط عرض الأعمدة
    worksheet.columns = [
      { width: 15 },
      { width: 12 },
      { width: 15 },
      { width: 15 },
      { width: 20 }
    ];
  };

  const exportDailyExpenses = async (worksheet: ExcelJS.Worksheet, data: ExcelData) => {
    const { expenses = [], summary = {} } = data;

    // عنوان التقرير
    worksheet.addRow(['التقرير اليومي للمصاريف']);
    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    // رؤوس الجدول
    worksheet.addRow(['النوع', 'الوصف', 'المبلغ', 'ملاحظات']);
    const headerRow = worksheet.lastRow;
    if (headerRow) {
      headerRow.font = { bold: true };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
    }

    // بيانات المصاريف
    expenses.forEach((expense: any) => {
      worksheet.addRow([
        expense.category,
        expense.description,
        formatCurrency(Number(expense.amount)),
        expense.notes || '-'
      ]);
    });

    // الملخص
    worksheet.addRow([]);
    worksheet.addRow(['ملخص المصاريف']);
    worksheet.addRow(['أجور العمال', formatCurrency(Number(summary.labor || 0))]);
    worksheet.addRow(['مصاريف متنوعة', formatCurrency(Number(summary.pettyExpenses || 0))]);
    worksheet.addRow(['مشتريات المواد', formatCurrency(Number(summary.materials || 0))]);
    worksheet.addRow(['الإجمالي', formatCurrency(Number(summary.total || 0))]);

    // ضبط عرض الأعمدة
    worksheet.columns = [
      { width: 15 },
      { width: 25 },
      { width: 15 },
      { width: 20 }
    ];
  };

  const exportProjectSummary = async (worksheet: ExcelJS.Worksheet, data: ExcelData) => {
    // تنفيذ تصدير ملخص المشروع
    worksheet.addRow(['ملخص المشروع']);
    worksheet.mergeCells('A1:C1');
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // إضافة البيانات
    Object.entries(data).forEach(([key, value]) => {
      worksheet.addRow([key, String(value)]);
    });

    worksheet.columns = [
      { width: 20 },
      { width: 15 },
      { width: 15 }
    ];
  };

  return (
    <Button
      onClick={exportToExcel}
      disabled={disabled}
      variant={variant}
      className={`no-print ${className}`}
      data-testid="button-export-excel"
    >
      <FileSpreadsheet className="w-4 h-4 ml-2" />
      تصدير Excel
    </Button>
  );
}

export default UnifiedExcelExporter;