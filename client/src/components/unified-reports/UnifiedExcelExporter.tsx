import React from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { formatCurrency, formatDate } from '@/lib/utils';

interface UnifiedExcelExporterProps {
  reportData: any;
  reportType: string;
  projectName?: string;
}

export const UnifiedExcelExporter: React.FC<UnifiedExcelExporterProps> = ({
  reportData,
  reportType,
  projectName
}) => {

  const exportDailyExpenses = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('كشف المصروفات اليومية');

    // تعيين خصائص الورقة
    worksheet.properties.defaultRowHeight = 20;

    // العنوان الرئيسي
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'كشف المصروفات اليومية';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // اسم المشروع
    if (projectName) {
      worksheet.mergeCells('A2:E2');
      const projectCell = worksheet.getCell('A2');
      projectCell.value = projectName;
      projectCell.font = { size: 14, bold: true };
      projectCell.alignment = { horizontal: 'center' };
    }

    // التاريخ
    worksheet.mergeCells('A3:E3');
    const dateCell = worksheet.getCell('A3');
    dateCell.value = `التاريخ: ${formatDate(reportData.summary?.date)}`;
    dateCell.font = { size: 12 };
    dateCell.alignment = { horizontal: 'center' };

    // رؤوس الأعمدة
    const headers = ['الرقم', 'النوع', 'الوصف', 'المبلغ', 'تاريخ الدفع'];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E3F2FD' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // بيانات المصروفات
    reportData.expenses?.forEach((expense: any, index: number) => {
      const row = worksheet.addRow([
        index + 1,
        expense.type,
        expense.description,
        expense.amount,
        formatDate(expense.payment_date)
      ]);

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // تنسيق خاص للمبلغ
      row.getCell(4).numFmt = '#,##0.00';
    });

    // صف الإجمالي
    const totalRow = worksheet.addRow([
      '', '', 'إجمالي المصروفات:', reportData.summary?.total || 0, ''
    ]);
    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'BBDEFB' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    totalRow.getCell(4).numFmt = '#,##0.00';

    // تعديل عرض الأعمدة
    worksheet.columns = [
      { width: 8 },   // الرقم
      { width: 15 },  // النوع
      { width: 30 },  // الوصف
      { width: 15 },  // المبلغ
      { width: 15 }   // التاريخ
    ];

    // حفظ الملف
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `كشف_المصروفات_اليومية_${formatDate(reportData.summary?.date)}.xlsx`);
  };

  const exportWorkerStatement = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('كشف حساب العامل');

    worksheet.properties.defaultRowHeight = 20;

    // العنوان الرئيسي
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'كشف حساب العامل';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // اسم العامل
    worksheet.mergeCells('A2:E2');
    const workerCell = worksheet.getCell('A2');
    workerCell.value = `العامل: ${reportData.worker?.name}`;
    workerCell.font = { size: 14, bold: true };
    workerCell.alignment = { horizontal: 'center' };

    // الفترة
    worksheet.mergeCells('A3:E3');
    const periodCell = worksheet.getCell('A3');
    periodCell.value = `الفترة: ${formatDate(reportData.summary?.dateFrom)} - ${formatDate(reportData.summary?.dateTo)}`;
    periodCell.font = { size: 12 };
    periodCell.alignment = { horizontal: 'center' };

    // رؤوس الأعمدة
    const headers = ['التاريخ', 'الوصف', 'المستحق', 'المدفوع', 'الرصيد'];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3E5F5' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // بيانات المعاملات
    reportData.transactions?.forEach((transaction: any) => {
      const row = worksheet.addRow([
        formatDate(transaction.date),
        transaction.description,
        transaction.credit || '',
        transaction.debit || '',
        transaction.balance
      ]);

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // تنسيق الأرقام
      [3, 4, 5].forEach(col => {
        const cell = row.getCell(col);
        if (cell.value && typeof cell.value === 'number') {
          cell.numFmt = '#,##0.00';
        }
      });
    });

    // صف الرصيد النهائي
    const finalRow = worksheet.addRow([
      '', '', '', 'الرصيد النهائي:', reportData.summary?.finalBalance || 0
    ]);
    finalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E1BEE7' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    finalRow.getCell(5).numFmt = '#,##0.00';

    // تعديل عرض الأعمدة
    worksheet.columns = [
      { width: 12 },  // التاريخ
      { width: 25 },  // الوصف
      { width: 12 },  // المستحق
      { width: 12 },  // المدفوع
      { width: 12 }   // الرصيد
    ];

    // حفظ الملف
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `كشف_حساب_${reportData.worker?.name}_${formatDate(reportData.summary?.dateFrom)}.xlsx`);
  };

  const exportMaterials = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('كشف المواد المشتراة');

    worksheet.properties.defaultRowHeight = 20;

    // العنوان الرئيسي
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'كشف المواد المشتراة';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // اسم المشروع
    if (projectName) {
      worksheet.mergeCells('A2:E2');
      const projectCell = worksheet.getCell('A2');
      projectCell.value = projectName;
      projectCell.font = { size: 14, bold: true };
      projectCell.alignment = { horizontal: 'center' };
    }

    // الفترة
    worksheet.mergeCells('A3:E3');
    const periodCell = worksheet.getCell('A3');
    periodCell.value = `الفترة: ${formatDate(reportData.summary?.dateFrom)} - ${formatDate(reportData.summary?.dateTo)}`;
    periodCell.font = { size: 12 };
    periodCell.alignment = { horizontal: 'center' };

    // رؤوس الأعمدة
    const headers = ['المادة', 'الكمية', 'السعر', 'المورد', 'التاريخ'];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5E8' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // بيانات المواد
    reportData.materials?.forEach((material: any) => {
      const row = worksheet.addRow([
        material.description,
        material.quantity || '',
        material.amount,
        material.supplier || '',
        formatDate(material.payment_date)
      ]);

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // تنسيق السعر
      row.getCell(3).numFmt = '#,##0.00';
    });

    // صف الإجمالي
    const totalRow = worksheet.addRow([
      '', '', reportData.summary?.total || 0, 'إجمالي المواد:', ''
    ]);
    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C8E6C9' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    totalRow.getCell(3).numFmt = '#,##0.00';

    // تعديل عرض الأعمدة
    worksheet.columns = [
      { width: 25 },  // المادة
      { width: 10 },  // الكمية
      { width: 15 },  // السعر
      { width: 20 },  // المورد
      { width: 12 }   // التاريخ
    ];

    // حفظ الملف
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `كشف_المواد_المشتراة_${projectName}_${formatDate(reportData.summary?.dateFrom)}.xlsx`);
  };

  const exportProjectSummary = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('ملخص المشروع');

    worksheet.properties.defaultRowHeight = 20;

    // العنوان الرئيسي
    worksheet.mergeCells('A1:D1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'ملخص المشروع';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // اسم المشروع
    if (projectName) {
      worksheet.mergeCells('A2:D2');
      const projectCell = worksheet.getCell('A2');
      projectCell.value = projectName;
      projectCell.font = { size: 14, bold: true };
      projectCell.alignment = { horizontal: 'center' };
    }

    // الفترة
    worksheet.mergeCells('A3:D3');
    const periodCell = worksheet.getCell('A3');
    periodCell.value = `الفترة: ${formatDate(reportData.summary?.dateFrom)} - ${formatDate(reportData.summary?.dateTo)}`;
    periodCell.font = { size: 12 };
    periodCell.alignment = { horizontal: 'center' };

    // قسم الإيرادات
    worksheet.addRow(['الإيرادات', '', '', '']);
    worksheet.addRow(['تحويلات العهدة', reportData.summary?.totalTrustTransfers || 0, '', '']);
    worksheet.addRow(['تحويلات واردة', reportData.summary?.totalIncomingTransfers || 0, '', '']);
    worksheet.addRow(['إجمالي الإيرادات', reportData.summary?.totalIncome || 0, '', '']);

    // فراغ
    worksheet.addRow(['', '', '', '']);

    // قسم المصروفات
    worksheet.addRow(['المصروفات', '', '', '']);
    worksheet.addRow(['أجور العمال', reportData.summary?.totalWages || 0, '', '']);
    worksheet.addRow(['مشتريات المواد', reportData.summary?.totalMaterials || 0, '', '']);
    worksheet.addRow(['النقل', reportData.summary?.totalTransportation || 0, '', '']);
    worksheet.addRow(['مصاريف متنوعة', reportData.summary?.totalMiscellaneous || 0, '', '']);
    worksheet.addRow(['إجمالي المصروفات', reportData.summary?.totalExpenses || 0, '', '']);

    // فراغ
    worksheet.addRow(['', '', '', '']);

    // الرصيد النهائي
    const finalBalance = (reportData.summary?.totalIncome || 0) - (reportData.summary?.totalExpenses || 0);
    worksheet.addRow(['الرصيد النهائي', finalBalance, '', '']);

    // تنسيق الخلايا
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 3) {
        row.eachCell((cell, colNumber) => {
          if (colNumber === 1) {
            cell.font = { bold: true };
          }
          if (colNumber === 2 && typeof cell.value === 'number') {
            cell.numFmt = '#,##0.00';
          }
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });

    // تعديل عرض الأعمدة
    worksheet.columns = [
      { width: 20 },  // البند
      { width: 15 },  // المبلغ
      { width: 10 },  
      { width: 10 }
    ];

    // حفظ الملف
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `ملخص_المشروع_${projectName}_${formatDate(reportData.summary?.dateFrom)}.xlsx`);
  };

  const handleExport = async () => {
    try {
      switch (reportType) {
        case 'daily':
          await exportDailyExpenses();
          break;
        case 'worker_statement':
          await exportWorkerStatement();
          break;
        case 'materials':
          await exportMaterials();
          break;
        case 'project_summary':
          await exportProjectSummary();
          break;
        default:
          console.warn('نوع التقرير غير مدعوم للتصدير');
      }
    } catch (error) {
      console.error('خطأ في تصدير Excel:', error);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="flex items-center gap-2"
    >
      <FileSpreadsheet className="h-4 w-4" />
      تصدير Excel
    </Button>
  );
};