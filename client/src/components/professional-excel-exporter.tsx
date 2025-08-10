import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { ReportTemplate } from '@shared/schema';

export interface EnhancedExcelData {
  headers: string[];
  rows: (string | number)[][];
  title?: string;
  subtitle?: string;
  summary?: { label: string; value: string | number }[];
  metadata?: {
    reportType: string;
    dateRange?: string;
    projectName?: string;
    generatedBy?: string;
  };
}

export class ProfessionalExcelExporter {
  private template: ReportTemplate;

  constructor(template?: ReportTemplate) {
    // قالب افتراضي محسن إذا لم يتم توفير قالب
    this.template = template || {
      id: 'default',
      templateName: 'احترافي',
      headerTitle: 'نظام إدارة مشاريع البناء',
      headerSubtitle: 'تقرير مالي شامل',
      companyName: 'شركة البناء والتطوير المحدودة',
      companyAddress: 'ص.ب: 12345 - صنعاء - الجمهورية اليمنية',
      companyPhone: '+967 1 234567 | +967 770 123456',
      companyEmail: 'info@construction.com.ye',
      footerText: 'تم إنشاء هذا التقرير بواسطة نظام إدارة المشاريع المتقدم',
      footerContact: 'للاستفسار والدعم الفني: support@construction.com.ye | +967 1 234567',
      primaryColor: '#1e3a8a',
      secondaryColor: '#3b82f6',
      accentColor: '#059669',
      textColor: '#1f2937',
      backgroundColor: '#ffffff',
      fontSize: 11,
      fontFamily: 'Calibri',
      logoUrl: null,
      pageOrientation: 'portrait',
      pageSize: 'A4',
      margins: { top: 1.5, bottom: 1.5, left: 1, right: 1 },
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

  async exportToExcel(data: EnhancedExcelData, filename: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    
    // إعداد خصائص المصنف
    workbook.creator = this.template.companyName || 'نظام إدارة المشاريع';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();
    
    const worksheet = workbook.addWorksheet('التقرير', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: this.template.pageOrientation as 'portrait' | 'landscape',
        fitToPage: true,
        fitToHeight: 0,
        fitToWidth: 1,
        margins: {
          left: this.getMarginValue('left'),
          right: this.getMarginValue('right'),
          top: this.getMarginValue('top'),
          bottom: this.getMarginValue('bottom'),
          header: 0.5,
          footer: 0.5,
        },
        printTitlesRow: '1:5', // تثبيت الصفوف العلوية عند الطباعة
      },
      views: [{
        rightToLeft: true,
        showGridLines: false,
        zoomScale: 100,
      }],
    });

    let currentRow = 1;

    // إضافة الرأس المحسن
    if (this.template.showHeader) {
      currentRow = this.addEnhancedHeader(worksheet, currentRow, data);
    }

    // إضافة مسافة
    currentRow += 3;

    // إضافة معلومات التقرير إذا وُجدت
    if (data.metadata) {
      currentRow = this.addReportMetadata(worksheet, currentRow, data.metadata);
      currentRow += 2;
    }

    // إضافة جدول البيانات المحسن
    currentRow = this.addEnhancedDataTable(worksheet, currentRow, data);

    // إضافة الملخص المحسن إذا وُجد
    if (data.summary && data.summary.length > 0) {
      currentRow += 3;
      currentRow = this.addEnhancedSummary(worksheet, currentRow, data.summary);
    }

    // إضافة الذيل المحسن
    if (this.template.showFooter) {
      this.addEnhancedFooter(worksheet, currentRow + 4);
    }

    // تطبيق التنسيق الشامل المحسن
    this.applyEnhancedFormatting(worksheet, data.headers.length);

    // إضافة حماية للورقة (اختيارية)
    worksheet.protect('', {
      selectLockedCells: true,
      selectUnlockedCells: true,
    });

    // تصدير الملف
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const currentDate = new Date().toLocaleDateString('ar-YE');
    const finalFilename = `${filename}_${currentDate}`;
    
    saveAs(blob, `${finalFilename}.xlsx`);
  }

  private getMarginValue(margin: string): number {
    if (this.template.margins && typeof this.template.margins === 'object' && margin in this.template.margins) {
      return this.template.margins[margin as keyof typeof this.template.margins] as number;
    }
    const defaults = { top: 1.5, bottom: 1.5, left: 1, right: 1 };
    return defaults[margin as keyof typeof defaults];
  }

  private addEnhancedHeader(worksheet: ExcelJS.Worksheet, startRow: number, data: EnhancedExcelData): number {
    let currentRow = startRow;
    const maxCols = Math.max(data.headers.length, 8);

    // شريط علوي ملون
    const topBorderRow = worksheet.getRow(currentRow);
    topBorderRow.height = 8;
    for (let i = 1; i <= maxCols; i++) {
      const cell = topBorderRow.getCell(i);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: this.template.primaryColor.replace('#', 'FF') },
      };
    }
    currentRow++;

    // عنوان رئيسي مع خلفية متدرجة
    const titleRow = worksheet.getRow(currentRow);
    titleRow.height = 35;
    const titleCell = titleRow.getCell(1);
    titleCell.value = this.template.headerTitle;
    titleCell.font = {
      name: this.template.fontFamily,
      size: this.template.fontSize + 6,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    titleCell.alignment = { 
      horizontal: 'center', 
      vertical: 'middle' 
    };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: this.template.primaryColor.replace('#', 'FF') },
    };
    
    worksheet.mergeCells(currentRow, 1, currentRow, maxCols);
    currentRow++;

    // اسم الشركة
    const companyRow = worksheet.getRow(currentRow);
    companyRow.height = 25;
    const companyCell = companyRow.getCell(1);
    companyCell.value = this.template.companyName;
    companyCell.font = {
      name: this.template.fontFamily,
      size: this.template.fontSize + 3,
      bold: true,
      color: { argb: this.template.secondaryColor.replace('#', 'FF') },
    };
    companyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    companyCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8FAFC' },
    };
    worksheet.mergeCells(currentRow, 1, currentRow, maxCols);
    currentRow++;

    // معلومات الاتصال في صف واحد
    const contactRow = worksheet.getRow(currentRow);
    contactRow.height = 20;
    
    const addressCell = contactRow.getCell(1);
    addressCell.value = `📍 ${this.template.companyAddress}`;
    addressCell.font = {
      name: this.template.fontFamily,
      size: this.template.fontSize - 1,
      color: { argb: this.template.textColor.replace('#', 'FF') },
    };
    addressCell.alignment = { horizontal: 'right', vertical: 'middle' };
    
    const phoneCell = contactRow.getCell(Math.ceil(maxCols/2));
    phoneCell.value = `📞 ${this.template.companyPhone}`;
    phoneCell.font = {
      name: this.template.fontFamily,
      size: this.template.fontSize - 1,
      color: { argb: this.template.textColor.replace('#', 'FF') },
    };
    phoneCell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    const emailCell = contactRow.getCell(maxCols);
    emailCell.value = `📧 ${this.template.companyEmail}`;
    emailCell.font = {
      name: this.template.fontFamily,
      size: this.template.fontSize - 1,
      color: { argb: this.template.textColor.replace('#', 'FF') },
    };
    emailCell.alignment = { horizontal: 'left', vertical: 'middle' };
    currentRow++;

    // عنوان التقرير
    if (data.title) {
      const reportTitleRow = worksheet.getRow(currentRow);
      reportTitleRow.height = 30;
      const reportTitleCell = reportTitleRow.getCell(1);
      reportTitleCell.value = data.title;
      reportTitleCell.font = {
        name: this.template.fontFamily,
        size: this.template.fontSize + 2,
        bold: true,
        color: { argb: this.template.accentColor.replace('#', 'FF') },
      };
      reportTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      reportTitleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0FDF4' },
      };
      worksheet.mergeCells(currentRow, 1, currentRow, maxCols);
      currentRow++;
    }

    // تاريخ التقرير
    if (this.template.showDate) {
      const dateRow = worksheet.getRow(currentRow);
      dateRow.height = 18;
      const dateCell = dateRow.getCell(1);
      dateCell.value = `📅 تاريخ التقرير: ${new Date().toLocaleDateString('ar-YE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`;
      dateCell.font = {
        name: this.template.fontFamily,
        size: this.template.fontSize - 1,
        italic: true,
        color: { argb: this.template.textColor.replace('#', 'FF') },
      };
      dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.mergeCells(currentRow, 1, currentRow, maxCols);
      currentRow++;
    }

    return currentRow;
  }

  private addReportMetadata(worksheet: ExcelJS.Worksheet, startRow: number, metadata: any): number {
    let currentRow = startRow;
    
    const metadataRow = worksheet.getRow(currentRow);
    metadataRow.height = 20;
    
    let colIndex = 1;
    if (metadata.projectName) {
      const projectCell = metadataRow.getCell(colIndex);
      projectCell.value = `المشروع: ${metadata.projectName}`;
      projectCell.font = {
        name: this.template.fontFamily,
        size: this.template.fontSize,
        bold: true,
      };
      colIndex += 3;
    }
    
    if (metadata.dateRange) {
      const dateRangeCell = metadataRow.getCell(colIndex);
      dateRangeCell.value = `الفترة: ${metadata.dateRange}`;
      dateRangeCell.font = {
        name: this.template.fontFamily,
        size: this.template.fontSize,
        bold: true,
      };
      colIndex += 3;
    }
    
    if (metadata.reportType) {
      const typeCell = metadataRow.getCell(colIndex);
      typeCell.value = `النوع: ${metadata.reportType}`;
      typeCell.font = {
        name: this.template.fontFamily,
        size: this.template.fontSize,
        bold: true,
      };
    }
    
    currentRow++;
    return currentRow;
  }

  private addEnhancedDataTable(worksheet: ExcelJS.Worksheet, startRow: number, data: EnhancedExcelData): number {
    let currentRow = startRow;

    // إضافة رؤوس الجدول المحسنة
    const headerRow = worksheet.getRow(currentRow);
    headerRow.height = 25;
    
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
      cell.alignment = { 
        horizontal: 'center', 
        vertical: 'middle',
        wrapText: true 
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF000000' } },
      };
    });
    currentRow++;

    // إضافة بيانات الجدول مع تنسيق محسن
    data.rows.forEach((row, rowIndex) => {
      const dataRow = worksheet.getRow(currentRow);
      dataRow.height = 20;
      
      row.forEach((cellValue, colIndex) => {
        const cell = dataRow.getCell(colIndex + 1);
        cell.value = cellValue;
        cell.font = {
          name: this.template.fontFamily,
          size: this.template.fontSize,
        };
        cell.alignment = { 
          horizontal: 'center', 
          vertical: 'middle',
          wrapText: true 
        };
        
        // حدود الخلايا
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };

        // تلوين الصفوف بالتناوب مع ألوان محسنة
        if (rowIndex % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFCFCFD' },
          };
        } else {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF1F5F9' },
          };
        }
        
        // تنسيق خاص للأرقام
        if (typeof cellValue === 'number') {
          cell.numFmt = '#,##0.00';
          cell.font = {
            ...cell.font,
            color: { argb: this.template.accentColor.replace('#', 'FF') },
            bold: true,
          };
        }
      });
      currentRow++;
    });

    return currentRow;
  }

  private addEnhancedSummary(worksheet: ExcelJS.Worksheet, startRow: number, summary: { label: string; value: string | number }[]): number {
    let currentRow = startRow;

    // عنوان الملخص مع تصميم محسن
    const summaryTitleRow = worksheet.getRow(currentRow);
    summaryTitleRow.height = 30;
    const summaryTitleCell = summaryTitleRow.getCell(1);
    summaryTitleCell.value = '📊 ملخص التقرير';
    summaryTitleCell.font = {
      name: this.template.fontFamily,
      size: this.template.fontSize + 2,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    summaryTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    summaryTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: this.template.accentColor.replace('#', 'FF') },
    };
    worksheet.mergeCells(currentRow, 1, currentRow, 4);
    currentRow++;

    // بيانات الملخص في تخطيط محسن
    summary.forEach((item, index) => {
      const summaryRow = worksheet.getRow(currentRow);
      summaryRow.height = 22;
      
      // المسمى
      const labelCell = summaryRow.getCell(1);
      labelCell.value = item.label;
      labelCell.font = {
        name: this.template.fontFamily,
        size: this.template.fontSize,
        bold: true,
        color: { argb: this.template.textColor.replace('#', 'FF') },
      };
      labelCell.alignment = { horizontal: 'right', vertical: 'middle' };
      labelCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' },
      };
      labelCell.border = {
        top: { style: 'thin' },
        left: { style: 'medium' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      // القيمة
      const valueCell = summaryRow.getCell(2);
      valueCell.value = item.value;
      valueCell.font = {
        name: this.template.fontFamily,
        size: this.template.fontSize + 1,
        bold: true,
        color: { argb: this.template.secondaryColor.replace('#', 'FF') },
      };
      valueCell.alignment = { horizontal: 'center', vertical: 'middle' };
      valueCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFFFF' },
      };
      valueCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'medium' },
      };
      
      if (typeof item.value === 'number') {
        valueCell.numFmt = '#,##0.00 "ر.ي"';
      }

      currentRow++;
    });

    return currentRow;
  }

  private addEnhancedFooter(worksheet: ExcelJS.Worksheet, row: number): void {
    // خط فاصل
    const separatorRow = worksheet.getRow(row);
    separatorRow.height = 5;
    for (let i = 1; i <= 8; i++) {
      const cell = separatorRow.getCell(i);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: this.template.primaryColor.replace('#', 'FF') },
      };
    }

    // نص الذيل
    const footerRow = worksheet.getRow(row + 1);
    footerRow.height = 20;
    const footerCell = footerRow.getCell(1);
    footerCell.value = this.template.footerText;
    footerCell.font = {
      name: this.template.fontFamily,
      size: this.template.fontSize - 1,
      italic: true,
      color: { argb: this.template.textColor.replace('#', 'FF') },
    };
    footerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells(row + 1, 1, row + 1, 8);

    // معلومات الاتصال
    const contactRow = worksheet.getRow(row + 2);
    contactRow.height = 18;
    const contactCell = contactRow.getCell(1);
    contactCell.value = this.template.footerContact;
    contactCell.font = {
      name: this.template.fontFamily,
      size: this.template.fontSize - 2,
      color: { argb: this.template.textColor.replace('#', 'FF') },
    };
    contactCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells(row + 2, 1, row + 2, 8);
  }

  private applyEnhancedFormatting(worksheet: ExcelJS.Worksheet, columnCount: number): void {
    // ضبط عرض الأعمدة تلقائياً مع حد أدنى وأقصى
    worksheet.columns.forEach((column, index) => {
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
        
        // تحديد عرض مناسب مع حدود
        const calculatedWidth = Math.min(Math.max(maxLength + 2, 12), 40);
        column.width = calculatedWidth;
      }
    });

    // تطبيق تجميد للصفوف العلوية
    worksheet.views = [{
      rightToLeft: true,
      showGridLines: false,
      zoomScale: 90,
      state: 'frozen',
      ySplit: 6, // تجميد أول 6 صفوف
    }];

    // إضافة معلومات إضافية للطباعة
    if (this.template.showPageNumbers) {
      worksheet.headerFooter.oddFooter = '&C&P من &N';
      worksheet.headerFooter.evenFooter = '&C&P من &N';
    }
  }
}