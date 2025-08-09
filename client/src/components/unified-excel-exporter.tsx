import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { ReportTemplate } from '@shared/schema';

export interface ExcelData {
  headers: string[];
  rows: (string | number)[][];
  title?: string;
  subtitle?: string;
  summary?: { label: string; value: string | number }[];
}

export class UnifiedExcelExporter {
  private template: ReportTemplate;

  constructor(template?: ReportTemplate) {
    // قالب افتراضي إذا لم يتم توفير قالب
    this.template = template || {
      id: 'default',
      templateName: 'default',
      headerTitle: 'نظام إدارة مشاريع البناء',
      headerSubtitle: 'تقرير مالي',
      companyName: 'شركة البناء والتطوير',
      companyAddress: 'صنعاء - اليمن',
      companyPhone: '+967 1 234567',
      companyEmail: 'info@company.com',
      footerText: 'تم إنشاء هذا التقرير بواسطة نظام إدارة المشاريع',
      footerContact: 'للاستفسار: info@company.com | +967 1 234567',
      primaryColor: '#1f2937',
      secondaryColor: '#3b82f6',
      accentColor: '#10b981',
      textColor: '#1f2937',
      backgroundColor: '#ffffff',
      fontSize: 11,
      fontFamily: 'Arial',
      logoUrl: null,
      pageOrientation: 'portrait',
      pageSize: 'A4',
      margins: { top: 1, bottom: 1, left: 0.75, right: 0.75 },
      showHeader: true,
      showFooter: true,
      showLogo: true,
      showDate: true,
      showPageNumbers: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async exportToExcel(data: ExcelData, filename: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('التقرير', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: this.template.pageOrientation as 'portrait' | 'landscape',
        margins: {
          left: this.template.margins?.left || 0.75,
          right: this.template.margins?.right || 0.75,
          top: this.template.margins?.top || 1,
          bottom: this.template.margins?.bottom || 1,
          header: 0.3,
          footer: 0.3,
        },
      },
      properties: {
        rightToLeft: true,
      },
    });

    let currentRow = 1;

    // إضافة الرأس
    if (this.template.showHeader) {
      currentRow = this.addHeader(worksheet, currentRow, data);
    }

    // إضافة مسافة
    currentRow += 2;

    // إضافة جدول البيانات
    currentRow = this.addDataTable(worksheet, currentRow, data);

    // إضافة الملخص إذا وُجد
    if (data.summary && data.summary.length > 0) {
      currentRow += 2;
      currentRow = this.addSummary(worksheet, currentRow, data.summary);
    }

    // إضافة الذيل
    if (this.template.showFooter) {
      this.addFooter(worksheet, currentRow + 3);
    }

    // تطبيق تنسيق عام
    this.applyGlobalFormatting(worksheet);

    // تصدير الملف
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    saveAs(blob, `${filename}.xlsx`);
  }

  private addHeader(worksheet: ExcelJS.Worksheet, startRow: number, data: ExcelData): number {
    let currentRow = startRow;

    // عنوان رئيسي
    const titleCell = worksheet.getCell(currentRow, 1);
    titleCell.value = this.template.headerTitle;
    titleCell.font = {
      name: this.template.fontFamily,
      size: this.template.fontSize + 4,
      bold: true,
      color: { argb: this.template.primaryColor.replace('#', 'FF') },
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    // دمج خلايا العنوان
    const lastCol = Math.max(data.headers.length, 6);
    worksheet.mergeCells(currentRow, 1, currentRow, lastCol);
    currentRow++;

    // اسم الشركة
    const companyCell = worksheet.getCell(currentRow, 1);
    companyCell.value = this.template.companyName;
    companyCell.font = {
      name: this.template.fontFamily,
      size: this.template.fontSize + 2,
      bold: true,
      color: { argb: this.template.secondaryColor.replace('#', 'FF') },
    };
    companyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells(currentRow, 1, currentRow, lastCol);
    currentRow++;

    // عنوان فرعي
    if (data.title) {
      const subtitleCell = worksheet.getCell(currentRow, 1);
      subtitleCell.value = data.title;
      subtitleCell.font = {
        name: this.template.fontFamily,
        size: this.template.fontSize + 1,
        bold: true,
      };
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.mergeCells(currentRow, 1, currentRow, lastCol);
      currentRow++;
    }

    // معلومات إضافية
    const infoRow = worksheet.getRow(currentRow);
    infoRow.getCell(1).value = `العنوان: ${this.template.companyAddress}`;
    infoRow.getCell(Math.ceil(lastCol/2)).value = `الهاتف: ${this.template.companyPhone}`;
    infoRow.font = { name: this.template.fontFamily, size: this.template.fontSize - 1 };
    currentRow++;

    // تاريخ التقرير
    if (this.template.showDate) {
      const dateRow = worksheet.getRow(currentRow);
      dateRow.getCell(1).value = `تاريخ التقرير: ${new Date().toLocaleDateString('ar-YE')}`;
      dateRow.font = { name: this.template.fontFamily, size: this.template.fontSize - 1 };
      currentRow++;
    }

    return currentRow;
  }

  private addDataTable(worksheet: ExcelJS.Worksheet, startRow: number, data: ExcelData): number {
    let currentRow = startRow;

    // إضافة رؤوس الجدول
    const headerRow = worksheet.getRow(currentRow);
    data.headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = {
        name: this.template.fontFamily,
        size: this.template.fontSize,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: this.template.primaryColor.replace('#', 'FF') },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    currentRow++;

    // إضافة بيانات الجدول
    data.rows.forEach((row, rowIndex) => {
      const dataRow = worksheet.getRow(currentRow);
      row.forEach((cellValue, colIndex) => {
        const cell = dataRow.getCell(colIndex + 1);
        cell.value = cellValue;
        cell.font = {
          name: this.template.fontFamily,
          size: this.template.fontSize,
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        // تلوين الصفوف بالتناوب
        if (rowIndex % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8F9FA' },
          };
        }
      });
      currentRow++;
    });

    return currentRow;
  }

  private addSummary(worksheet: ExcelJS.Worksheet, startRow: number, summary: { label: string; value: string | number }[]): number {
    let currentRow = startRow;

    // عنوان الملخص
    const summaryTitleCell = worksheet.getCell(currentRow, 1);
    summaryTitleCell.value = 'ملخص التقرير';
    summaryTitleCell.font = {
      name: this.template.fontFamily,
      size: this.template.fontSize + 1,
      bold: true,
      color: { argb: this.template.accentColor.replace('#', 'FF') },
    };
    summaryTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells(currentRow, 1, currentRow, 4);
    currentRow++;

    // بيانات الملخص
    summary.forEach((item) => {
      const summaryRow = worksheet.getRow(currentRow);
      
      // المسمى
      const labelCell = summaryRow.getCell(1);
      labelCell.value = item.label;
      labelCell.font = {
        name: this.template.fontFamily,
        size: this.template.fontSize,
        bold: true,
      };
      labelCell.alignment = { horizontal: 'right', vertical: 'middle' };
      labelCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      // القيمة
      const valueCell = summaryRow.getCell(2);
      valueCell.value = item.value;
      valueCell.font = {
        name: this.template.fontFamily,
        size: this.template.fontSize,
        bold: true,
        color: { argb: this.template.secondaryColor.replace('#', 'FF') },
      };
      valueCell.alignment = { horizontal: 'center', vertical: 'middle' };
      valueCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      currentRow++;
    });

    return currentRow;
  }

  private addFooter(worksheet: ExcelJS.Worksheet, row: number): void {
    // نص الذيل
    const footerCell = worksheet.getCell(row, 1);
    footerCell.value = this.template.footerText;
    footerCell.font = {
      name: this.template.fontFamily,
      size: this.template.fontSize - 2,
      italic: true,
    };
    footerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells(row, 1, row, 6);

    // معلومات الاتصال
    const contactCell = worksheet.getCell(row + 1, 1);
    contactCell.value = this.template.footerContact;
    contactCell.font = {
      name: this.template.fontFamily,
      size: this.template.fontSize - 2,
    };
    contactCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells(row + 1, 1, row + 1, 6);
  }

  private applyGlobalFormatting(worksheet: ExcelJS.Worksheet): void {
    // ضبط عرض الأعمدة تلقائياً
    worksheet.columns.forEach((column) => {
      if (column && column.values) {
        let maxLength = 0;
        column.values.forEach((value) => {
          if (value) {
            const length = value.toString().length;
            if (length > maxLength) {
              maxLength = length;
            }
          }
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      }
    });

    // ضبط ارتفاع الصفوف
    worksheet.eachRow((row) => {
      row.height = 20;
    });
  }
}