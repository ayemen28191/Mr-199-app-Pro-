import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface PrintSettings {
  reportType: string;
  name: string;
  pageSize: string;
  pageOrientation: string;
  marginTop: string;
  marginBottom: string;
  marginLeft: string;
  marginRight: string;
  fontFamily: string;
  fontSize: number;
  headerFontSize: number;
  tableFontSize: number;
  headerBackgroundColor: string;
  headerTextColor: string;
  tableHeaderColor: string;
  tableRowEvenColor: string;
  tableRowOddColor: string;
  tableBorderColor: string;
  tableBorderWidth: number;
  tableCellPadding: number;
  tableColumnWidths: string;
  showHeader: boolean;
  showLogo: boolean;
  showProjectInfo: boolean;
  showWorkerInfo: boolean;
  showAttendanceTable: boolean;
  showTransfersTable: boolean;
  showSummary: boolean;
  showSignatures: boolean;
  isDefault: boolean;
  isActive: boolean;
}

/**
 * Hook للحصول على إعدادات الطباعة الافتراضية لنوع تقرير معين
 * @param reportType نوع التقرير
 * @returns إعدادات الطباعة الافتراضية أو null
 */
export function usePrintSettings(reportType: string) {
  const { data: allSettings = [] } = useQuery<PrintSettings[]>({
    queryKey: ['/api/print-settings', reportType],
    queryFn: () => apiRequest('GET', `/api/print-settings?reportType=${reportType}`),
    enabled: !!reportType,
  });

  // البحث عن الإعداد الافتراضي
  const defaultSettings = allSettings.find(settings => settings.isDefault && settings.isActive);
  
  return {
    settings: defaultSettings || null,
    allSettings,
    isLoading: false
  };
}

/**
 * دالة لتطبيق إعدادات CSS للطباعة
 * @param settings إعدادات الطباعة
 * @returns CSS كنص
 */
export function generatePrintCSS(settings: PrintSettings): string {
  if (!settings) return '';

  const tableColumnWidths = JSON.parse(settings.tableColumnWidths || '[10,20,15,25,15,15]');
  
  return `
    @media print {
      @page {
        size: ${settings.pageSize} ${settings.pageOrientation};
        margin: ${settings.marginTop}mm ${settings.marginRight}mm ${settings.marginBottom}mm ${settings.marginLeft}mm;
      }
      
      body {
        font-family: ${settings.fontFamily}, Arial, sans-serif;
        font-size: ${settings.fontSize}px;
        color: #000;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .print-header {
        ${settings.showHeader ? 'display: block;' : 'display: none;'}
        font-size: ${settings.headerFontSize}px;
        background-color: ${settings.headerBackgroundColor};
        color: ${settings.headerTextColor};
        padding: 10px;
        margin-bottom: 20px;
        text-align: center;
        font-weight: bold;
      }
      
      .print-logo {
        ${settings.showLogo ? 'display: block;' : 'display: none;'}
      }
      
      .project-info {
        ${settings.showProjectInfo ? 'display: block;' : 'display: none;'}
      }
      
      .worker-info {
        ${settings.showWorkerInfo ? 'display: block;' : 'display: none;'}
      }
      
      .attendance-table {
        ${settings.showAttendanceTable ? 'display: table;' : 'display: none;'}
      }
      
      .transfers-table {
        ${settings.showTransfersTable ? 'display: table;' : 'display: none;'}
      }
      
      .summary-section {
        ${settings.showSummary ? 'display: block;' : 'display: none;'}
      }
      
      .signatures-section {
        ${settings.showSignatures ? 'display: block;' : 'display: none;'}
      }
      
      table {
        font-size: ${settings.tableFontSize}px;
        border-collapse: collapse;
        width: 100%;
        border: ${settings.tableBorderWidth}px solid ${settings.tableBorderColor};
      }
      
      th {
        background-color: ${settings.tableHeaderColor} !important;
        color: white !important;
        padding: ${settings.tableCellPadding}px;
        border: ${settings.tableBorderWidth}px solid ${settings.tableBorderColor};
        text-align: center;
        font-weight: bold;
      }
      
      td {
        padding: ${settings.tableCellPadding}px;
        border: ${settings.tableBorderWidth}px solid ${settings.tableBorderColor};
        text-align: center;
      }
      
      tr:nth-child(even) {
        background-color: ${settings.tableRowEvenColor} !important;
      }
      
      tr:nth-child(odd) {
        background-color: ${settings.tableRowOddColor} !important;
      }
      
      ${tableColumnWidths.map((width: number, index: number) => `
        table th:nth-child(${index + 1}),
        table td:nth-child(${index + 1}) {
          width: ${width}%;
        }
      `).join('')}
      
      /* إخفاء عناصر الواجهة */
      .no-print,
      .btn,
      button,
      input,
      select,
      textarea,
      .sidebar,
      .navbar,
      .header-controls,
      .page-controls {
        display: none !important;
      }
      
      /* تحسين النصوص العربية */
      * {
        direction: rtl;
        text-align: right;
      }
      
      .text-center {
        text-align: center !important;
      }
      
      .text-left {
        text-align: left !important;
      }
    }
  `;
}

/**
 * دالة لتطبيق إعدادات الطباعة على صفحة
 * @param reportType نوع التقرير
 * @param customSettings إعدادات مخصصة (اختيارية)
 */
export function applyPrintSettings(reportType: string, customSettings?: PrintSettings) {
  // إزالة أي CSS طباعة سابق
  const existingStyle = document.getElementById('dynamic-print-styles');
  if (existingStyle) {
    existingStyle.remove();
  }

  // إنشاء عنصر style جديد
  const styleElement = document.createElement('style');
  styleElement.id = 'dynamic-print-styles';
  styleElement.type = 'text/css';

  // إذا تم توفير إعدادات مخصصة، استخدمها
  if (customSettings) {
    styleElement.innerHTML = generatePrintCSS(customSettings);
    document.head.appendChild(styleElement);
    return;
  }

  // البحث عن الإعدادات الافتراضية
  apiRequest('GET', `/api/print-settings?reportType=${reportType}`)
    .then((settings: PrintSettings[]) => {
      const defaultSettings = settings.find(s => s.isDefault && s.isActive);
      if (defaultSettings) {
        styleElement.innerHTML = generatePrintCSS(defaultSettings);
        document.head.appendChild(styleElement);
      }
    })
    .catch(error => {
      console.error('Error loading print settings:', error);
    });
}

/**
 * دالة للطباعة مع تطبيق الإعدادات تلقائياً
 * @param reportType نوع التقرير
 * @param delay تأخير قبل الطباعة (ميلي ثانية)
 */
export function printWithSettings(reportType: string, delay: number = 500) {
  applyPrintSettings(reportType);
  
  setTimeout(() => {
    window.print();
  }, delay);
}

export default usePrintSettings;