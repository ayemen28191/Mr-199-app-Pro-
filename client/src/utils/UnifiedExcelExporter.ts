import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ExcelColumn {
  key: string;
  label: string;
  type?: 'text' | 'currency' | 'date' | 'number' | 'center';
  width?: number;
}

interface ExcelSummary {
  title: string;
  items: {
    label: string;
    value: number | string;
    type?: 'currency' | 'text';
  }[];
}

interface UnifiedExcelExportOptions {
  title: string;
  fileName: string;
  projectName?: string;
  dateFrom?: string;
  dateTo?: string;
  reportDate?: string;
  data: any[];
  columns: ExcelColumn[];
  summary?: ExcelSummary[];
  finalBalance?: {
    label: string;
    value: number;
    type?: 'positive' | 'negative' | 'neutral';
  };
  companyInfo?: {
    name: string;
    address?: string;
    phone?: string;
  };
}

export class UnifiedExcelExporter {
  private workbook: ExcelJS.Workbook;
  private worksheet: ExcelJS.Worksheet;
  private currentRow: number = 1;

  constructor(private options: UnifiedExcelExportOptions) {
    this.workbook = new ExcelJS.Workbook();
    this.worksheet = this.workbook.addWorksheet(this.options.title);
    this.setupWorksheet();
  }

  private setupWorksheet() {
    // إعدادات عامة للورقة
    this.worksheet.properties.defaultRowHeight = 25;
    this.worksheet.properties.defaultColWidth = 15;
    this.worksheet.views = [{ rightToLeft: true }];
  }

  private addTitle() {
    const companyInfo = this.options.companyInfo || {
      name: "شركة المباني الذكية والإنشاءات الهندسية",
      address: "اليمن - صنعاء",
      phone: "+967 1 234567"
    };

    // عنوان الشركة
    this.worksheet.mergeCells(`A${this.currentRow}:${this.getColumnLetter(this.options.columns.length + 1)}${this.currentRow}`);
    const companyCell = this.worksheet.getCell(`A${this.currentRow}`);
    companyCell.value = companyInfo.name;
    companyCell.font = { size: 16, bold: true, name: 'Arial' };
    companyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    companyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E3F2FD' } };
    this.addBorders(companyCell);
    this.currentRow++;

    // عنوان التقرير
    this.worksheet.mergeCells(`A${this.currentRow}:${this.getColumnLetter(this.options.columns.length + 1)}${this.currentRow}`);
    const titleCell = this.worksheet.getCell(`A${this.currentRow}`);
    titleCell.value = this.options.title;
    titleCell.font = { size: 14, bold: true, name: 'Arial' };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8F9FA' } };
    this.addBorders(titleCell);
    this.currentRow++;

    // اسم المشروع
    if (this.options.projectName) {
      this.worksheet.mergeCells(`A${this.currentRow}:${this.getColumnLetter(this.options.columns.length + 1)}${this.currentRow}`);
      const projectCell = this.worksheet.getCell(`A${this.currentRow}`);
      projectCell.value = this.options.projectName;
      projectCell.font = { size: 12, bold: true, name: 'Arial' };
      projectCell.alignment = { horizontal: 'center', vertical: 'middle' };
      this.addBorders(projectCell);
      this.currentRow++;
    }

    // معلومات إضافية
    this.worksheet.mergeCells(`A${this.currentRow}:${this.getColumnLetter(this.options.columns.length + 1)}${this.currentRow}`);
    const infoCell = this.worksheet.getCell(`A${this.currentRow}`);
    const infoText = [
      `الهاتف: ${companyInfo.phone}`,
      `العنوان: ${companyInfo.address}`,
      `تاريخ التقرير: ${formatDate(this.options.reportDate || new Date().toISOString())}`
    ].join(' | ');
    infoCell.value = infoText;
    infoCell.font = { size: 10, name: 'Arial' };
    infoCell.alignment = { horizontal: 'center', vertical: 'middle' };
    this.addBorders(infoCell);
    this.currentRow++;

    // فترة التقرير
    if (this.options.dateFrom || this.options.dateTo) {
      this.worksheet.mergeCells(`A${this.currentRow}:${this.getColumnLetter(this.options.columns.length + 1)}${this.currentRow}`);
      const periodCell = this.worksheet.getCell(`A${this.currentRow}`);
      let periodText = 'فترة التقرير: ';
      if (this.options.dateFrom) periodText += `من ${formatDate(this.options.dateFrom)}`;
      if (this.options.dateTo) periodText += ` إلى ${formatDate(this.options.dateTo)}`;
      periodCell.value = periodText;
      periodCell.font = { size: 10, name: 'Arial' };
      periodCell.alignment = { horizontal: 'center', vertical: 'middle' };
      this.addBorders(periodCell);
      this.currentRow++;
    }

    // صف فارغ
    this.currentRow++;
  }

  private addHeaders() {
    // رقم تسلسلي
    const numberHeaderCell = this.worksheet.getCell(`A${this.currentRow}`);
    numberHeaderCell.value = 'م';
    this.formatHeaderCell(numberHeaderCell);
    this.worksheet.getColumn('A').width = 8;

    // رؤوس الأعمدة
    this.options.columns.forEach((column, index) => {
      const columnLetter = this.getColumnLetter(index + 2);
      const headerCell = this.worksheet.getCell(`${columnLetter}${this.currentRow}`);
      headerCell.value = column.label;
      this.formatHeaderCell(headerCell);
      
      // تحديد عرض العمود
      const width = column.width || this.getDefaultColumnWidth(column.type);
      this.worksheet.getColumn(columnLetter).width = width;
    });

    this.currentRow++;
  }

  private addData() {
    this.options.data.forEach((row, index) => {
      // رقم تسلسلي
      const numberCell = this.worksheet.getCell(`A${this.currentRow}`);
      numberCell.value = index + 1;
      this.formatDataCell(numberCell, 'number');

      // بيانات الأعمدة
      this.options.columns.forEach((column, colIndex) => {
        const columnLetter = this.getColumnLetter(colIndex + 2);
        const dataCell = this.worksheet.getCell(`${columnLetter}${this.currentRow}`);
        const value = this.formatCellValue(row[column.key], column.type);
        dataCell.value = value;
        this.formatDataCell(dataCell, column.type);
      });

      this.currentRow++;
    });
  }

  private addSummary() {
    if (!this.options.summary || this.options.summary.length === 0) return;

    // صف فارغ
    this.currentRow++;

    this.options.summary.forEach((section, sectionIndex) => {
      // عنوان القسم
      this.worksheet.mergeCells(`A${this.currentRow}:${this.getColumnLetter(this.options.columns.length + 1)}${this.currentRow}`);
      const sectionTitleCell = this.worksheet.getCell(`A${this.currentRow}`);
      sectionTitleCell.value = section.title;
      sectionTitleCell.font = { size: 12, bold: true, name: 'Arial' };
      sectionTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sectionTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3CD' } };
      this.addBorders(sectionTitleCell);
      this.currentRow++;

      // عناصر القسم
      section.items.forEach(item => {
        const labelCell = this.worksheet.getCell(`A${this.currentRow}`);
        labelCell.value = item.label;
        labelCell.font = { size: 11, bold: true, name: 'Arial' };
        labelCell.alignment = { horizontal: 'right', vertical: 'middle' };
        this.addBorders(labelCell);

        const valueCell = this.worksheet.getCell(`B${this.currentRow}`);
        valueCell.value = item.type === 'currency' 
          ? formatCurrency(Number(item.value) || 0)
          : item.value;
        valueCell.font = { size: 11, bold: true, name: 'Arial' };
        valueCell.alignment = { horizontal: 'left', vertical: 'middle' };
        this.addBorders(valueCell);

        // دمج الخلايا المتبقية
        if (this.options.columns && this.options.columns.length > 1) {
          this.worksheet.mergeCells(`C${this.currentRow}:${this.getColumnLetter(this.options.columns.length + 1)}${this.currentRow}`);
        }

        this.currentRow++;
      });

      // صف فارغ بين الأقسام
      if (this.options.summary && sectionIndex < this.options.summary.length - 1) {
        this.currentRow++;
      }
    });
  }

  private addFinalBalance() {
    if (!this.options.finalBalance) return;

    // صف فارغ
    this.currentRow++;

    // الرصيد النهائي
    this.worksheet.mergeCells(`A${this.currentRow}:${this.getColumnLetter(this.options.columns.length + 1)}${this.currentRow}`);
    const balanceCell = this.worksheet.getCell(`A${this.currentRow}`);
    balanceCell.value = `${this.options.finalBalance.label}: ${formatCurrency(this.options.finalBalance.value)}`;
    balanceCell.font = { size: 14, bold: true, name: 'Arial' };
    balanceCell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    const balanceColor = this.options.finalBalance.type === 'positive' ? 'D4EDDA' : 
                        this.options.finalBalance.type === 'negative' ? 'F8D7DA' : 'E3F2FD';
    balanceCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: balanceColor } };
    this.addBorders(balanceCell);
  }

  private formatHeaderCell(cell: ExcelJS.Cell) {
    cell.font = { size: 11, bold: true, name: 'Arial' };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E3F2FD' } };
    this.addBorders(cell);
  }

  private formatDataCell(cell: ExcelJS.Cell, type?: string) {
    cell.font = { size: 10, name: 'Arial' };
    cell.alignment = { 
      horizontal: type === 'currency' || type === 'number' ? 'left' : 'right', 
      vertical: 'middle' 
    };
    this.addBorders(cell);
  }

  private addBorders(cell: ExcelJS.Cell) {
    cell.border = {
      top: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } }
    };
  }

  private formatCellValue(value: any, type?: string): any {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'currency':
        return formatCurrency(Number(value) || 0);
      case 'date':
        return formatDate(value);
      case 'number':
        return Number(value).toLocaleString('en-US');
      default:
        return String(value);
    }
  }

  private getColumnLetter(columnNumber: number): string {
    let result = '';
    while (columnNumber > 0) {
      columnNumber--;
      result = String.fromCharCode(65 + (columnNumber % 26)) + result;
      columnNumber = Math.floor(columnNumber / 26);
    }
    return result;
  }

  private getDefaultColumnWidth(type?: string): number {
    switch (type) {
      case 'currency':
        return 18;
      case 'date':
        return 15;
      case 'number':
        return 12;
      default:
        return 25;
    }
  }

  async export(): Promise<void> {
    try {
      // إضافة جميع عناصر التقرير
      this.addTitle();
      this.addHeaders();
      this.addData();
      this.addSummary();
      this.addFinalBalance();

      // تصدير الملف
      const buffer = await this.workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const fileName = `${this.options.fileName}_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(blob, fileName);
      
      console.log('✅ تم تصدير الملف بنجاح:', fileName);
    } catch (error) {
      console.error('❌ خطأ في تصدير الملف:', error);
      throw error;
    }
  }
}

// دالة مساعدة للتصدير السريع
export const exportToUnifiedExcel = async (options: UnifiedExcelExportOptions) => {
  const exporter = new UnifiedExcelExporter(options);
  await exporter.export();
};