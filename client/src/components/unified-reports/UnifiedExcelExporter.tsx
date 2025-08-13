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
      
      // إعداد المصنف للغة العربية وترميز UTF-8
      workbook.creator = 'نظام إدارة البناء';
      workbook.lastModifiedBy = 'نظام إدارة البناء';
      workbook.created = new Date();
      workbook.modified = new Date();
      
      // تم التحديث لاستخدام مخطط التقارير الموحد - 13 أغسطس 2025
      const worksheet = workbook.addWorksheet('التقرير', {
        views: [{ rightToLeft: true, zoomScale: 100 }],
        pageSetup: {
          paperSize: 9, // A4
          orientation: 'portrait',
          scale: 100,
          margins: { left: 0.75, right: 0.75, top: 1.0, bottom: 1.0, header: 0.5, footer: 0.5 }
        }
      });

      // إعداد الأعمدة حسب نوع التقرير
      if (reportType === 'worker_statement') {
        await exportWorkerStatement(worksheet, data);
      } else if (reportType === 'daily_expenses') {
        await exportDailyExpenses(worksheet, data);
      } else if (reportType === 'project_summary') {
        await exportProjectSummary(worksheet, data);
      }

      // حفظ الملف مع التشفير الصحيح
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' 
      });
      
      // استخدام رابط تحميل مباشر لتجنب مشاكل التصدير
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('خطأ في تصدير Excel:', error);
      alert('حدث خطأ في تصدير الملف. يرجى المحاولة مرة أخرى.');
    }
  };

  const exportWorkerStatement = async (worksheet: ExcelJS.Worksheet, data: ExcelData) => {
    const { worker, attendance = [], transfers = [] } = data;

    // إعداد الاتجاه من اليمين لليسار
    worksheet.views = [{ rightToLeft: true }];

    // رأس الشركة مع التصميم المطابق للمعاينة
    worksheet.addRow(['شركة التميز لمقاولات والاستثمارات الهندسية']);
    worksheet.mergeCells('A1:J1');
    const companyCell = worksheet.getCell('A1');
    companyCell.font = { name: 'Arial Unicode MS', size: 16, bold: true };
    companyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    companyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563eb' } };
    companyCell.font = { ...companyCell.font, color: { argb: 'FFFFFFFF' } };

    // معلومات العامل والمشروع
    worksheet.addRow([]);
    worksheet.addRow(['كشف حساب العامل التفصيلي والشامل']);
    worksheet.mergeCells('A3:J3');
    const titleCell = worksheet.getCell('A3');
    titleCell.font = { name: 'Arial Unicode MS', size: 14, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e40af' } };
    titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };

    worksheet.addRow([]);
    
    // معلومات أساسية
    const infoRow = worksheet.addRow(['اسم العامل:', worker?.name || 'غير محدد', '', 'نوع العامل:', worker?.type || 'غير محدد', '', 'الأجر اليومي:', formatCurrency(Number(worker?.dailyWage || 0)), '', '']);
    infoRow.font = { name: 'Arial Unicode MS', size: 11, bold: true };

    worksheet.addRow([]);

    // رؤوس جدول الحضور - بنفس تصميم المعاينة
    const headers = ['#', 'التاريخ', 'اليوم', 'وصف العمل', 'الساعات', 'المبلغ المستحق', 'المبلغ المستلم', 'المتبقي', 'الحالة', 'ملاحظات'];
    const headerRow = worksheet.addRow(headers);
    
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial Unicode MS', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3b82f6' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    // بيانات الحضور مع نفس التنسيق
    let totalEarned = 0;
    let totalPaid = 0;
    
    attendance.forEach((record: any, index: number) => {
      const dailyWage = Number(record.dailyWage) || Number(worker?.dailyWage) || 0;
      const workDays = Number(record.workDays) || 1;
      const earned = dailyWage * workDays;
      const paid = Number(record.paidAmount) || 0;
      const remaining = earned - paid;
      const status = paid >= earned ? 'مدفوع كامل' : paid > 0 ? 'مدفوع جزئي' : 'غير مدفوع';
      
      totalEarned += earned;
      totalPaid += paid;

      const dataRow = worksheet.addRow([
        index + 1,
        formatDate(record.date),
        record.dayName || new Date(record.date).toLocaleDateString('ar', { weekday: 'long' }),
        record.workDescription || 'عمل بناء وفقاً لمتطلبات المشروع',
        record.workHours || '8 ساعات',
        formatCurrency(earned),
        formatCurrency(paid),
        formatCurrency(remaining),
        status,
        record.notes || '-'
      ]);

      dataRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial Unicode MS', size: 9 };
        cell.alignment = { 
          horizontal: colNumber === 4 || colNumber === 10 ? 'right' : 'center', 
          vertical: 'middle' 
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
        if (index % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      });
    });

    // صف الإجماليات
    const totalRow = worksheet.addRow([
      'الإجماليات', '', '', '', '',
      formatCurrency(totalEarned),
      formatCurrency(totalPaid),
      formatCurrency(totalEarned - totalPaid),
      '', ''
    ]);
    
    totalRow.eachCell((cell) => {
      cell.font = { name: 'Arial Unicode MS', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    // جدول التحويلات
    if (transfers.length > 0) {
      worksheet.addRow([]);
      const transfersHeaderRow = worksheet.addRow(['حوالات الأهل', '', '', '', '', '', '', '', '', '']);
      worksheet.mergeCells(worksheet.lastRow!.number, 1, worksheet.lastRow!.number, 10);
      transfersHeaderRow.getCell(1).font = { name: 'Arial Unicode MS', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      transfersHeaderRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      transfersHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFdc2626' } };

      const transferHeaders = ['التاريخ', 'المبلغ', 'اسم المستلم', 'رقم الهاتف', 'طريقة التحويل', '', '', '', '', ''];
      const transferHeaderRow = worksheet.addRow(transferHeaders);
      
      transferHeaderRow.eachCell((cell, index) => {
        if (index <= 5) {
          cell.font = { name: 'Arial Unicode MS', size: 10, bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf3f4f6' } };
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
        }
      });
      
      transfers.forEach((transfer: any) => {
        const transferRow = worksheet.addRow([
          formatDate(transfer.transferDate),
          formatCurrency(Number(transfer.amount)),
          transfer.recipientName,
          transfer.recipientPhone || '-',
          transfer.transferMethod,
          '', '', '', '', ''
        ]);
        
        transferRow.eachCell((cell, index) => {
          if (index <= 5) {
            cell.font = { name: 'Arial Unicode MS', size: 9 };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
              top: { style: 'thin' }, left: { style: 'thin' },
              bottom: { style: 'thin' }, right: { style: 'thin' }
            };
          }
        });
      });
    }

    // ضبط عرض الأعمدة
    worksheet.columns = [
      { width: 5 },   // #
      { width: 12 },  // التاريخ
      { width: 10 },  // اليوم
      { width: 25 },  // وصف العمل
      { width: 10 },  // الساعات
      { width: 15 },  // المستحق
      { width: 15 },  // المستلم
      { width: 12 },  // المتبقي
      { width: 12 },  // الحالة
      { width: 20 }   // ملاحظات
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