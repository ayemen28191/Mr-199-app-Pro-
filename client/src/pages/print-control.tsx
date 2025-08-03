// صفحة التحكم الشامل في طباعة الكشوف
// نظام متقدم للتحكم في جميع جوانب التنسيق والطباعة

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from "wouter";
import { usePrintSettings } from '@/hooks/usePrintSettings';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { 
  Printer, 
  Settings, 
  Palette, 
  Layout, 
  Type, 
  Grid3x3, 
  Eye, 
  Save, 
  Download,
  Upload,
  RotateCcw,
  Copy,
  Trash2,
  Plus,
  FileText,
  Monitor,
  ArrowLeft,
  Zap
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from '@/lib/queryClient';
import ReportRenderer from '@/components/print-preview/ReportRenderer';
import { PrintButton } from '@/components/PrintButton';

// استيراد النوع الصحيح من schema
import type { PrintSettings as DBPrintSettings, InsertPrintSettings } from '@shared/schema';

interface PrintSettings extends Omit<DBPrintSettings, 'marginTop' | 'marginBottom' | 'marginLeft' | 'marginRight' | 'tableColumnWidths' | 'createdAt' | 'updatedAt'> {
  // تحويل الهوامش من decimal (string) إلى number للواجهة
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  tableColumnWidths?: number[];
}

const defaultSettings: Omit<PrintSettings, 'id'> = {
  reportType: 'worker_statement',
  name: 'إعداد جديد',
  pageSize: 'A4',
  pageOrientation: 'portrait',
  marginTop: 15,
  marginBottom: 15,
  marginLeft: 15,
  marginRight: 15,
  fontFamily: 'Arial',
  fontSize: 12,
  headerFontSize: 16,
  tableFontSize: 10,
  headerBackgroundColor: '#1e40af',
  headerTextColor: '#ffffff',
  tableHeaderColor: '#1e40af',
  tableRowEvenColor: '#ffffff',
  tableRowOddColor: '#f9fafb',
  tableBorderColor: '#000000',
  tableBorderWidth: 1,
  tableCellPadding: 3,
  tableColumnWidths: [8, 12, 10, 30, 12, 15, 15, 12],
  showHeader: true,
  showLogo: true,
  showProjectInfo: true,
  showWorkerInfo: true,
  showAttendanceTable: true,
  showTransfersTable: true,
  showSummary: true,
  showSignatures: true,
  isDefault: false,
  isActive: true,
  userId: null,
};

export default function PrintControlPage() {
  const [, setLocation] = useLocation();
  const [currentSettings, setCurrentSettings] = useState<PrintSettings>(defaultSettings as PrintSettings);
  const [selectedSettingsId, setSelectedSettingsId] = useState<string>('');
  const [previewMode, setPreviewMode] = useState<'screen' | 'print'>('screen');
  const [reportContext, setReportContext] = useState<any>(null);
  const { toast } = useToast();

  // استقبال بيانات التقرير من localStorage عند تحميل الصفحة
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const withData = urlParams.get('withData');
    const reportTypeParam = urlParams.get('reportType');
    
    console.log('🔄 تحميل صفحة إعدادات الطباعة:', { withData, reportTypeParam });
    
    if (withData === 'true') {
      try {
        const storedContext = localStorage.getItem('printReportContext');
        if (storedContext) {
          const context = JSON.parse(storedContext);
          console.log('📥 استقبال سياق التقرير:', context);
          
          setReportContext(context);
          
          // تحديث نوع التقرير من البيانات المرسلة
          if (context.type && context.type !== currentSettings.reportType) {
            setCurrentSettings(prev => ({
              ...prev,
              reportType: context.type
            }));
            console.log('🔄 تحديث نوع التقرير إلى:', context.type);
          }
          
          // تحديث عنوان الإعداد ليطابق التقرير
          if (context.title) {
            setCurrentSettings(prev => ({
              ...prev,
              name: `إعدادات طباعة - ${context.title}`
            }));
          }
          
          toast({
            title: "تم استقبال التقرير بنجاح",
            description: `تم تحميل بيانات ${context.title || 'التقرير'} للمعاينة والتخصيص`,
          });
        } else {
          console.warn('⚠️ لم يتم العثور على بيانات التقرير في localStorage');
          toast({
            title: "تنبيه",
            description: "لم يتم العثور على بيانات التقرير. يرجى العودة لصفحة التقارير وإنشاء تقرير أولاً",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('❌ خطأ في استقبال بيانات التقرير:', error);
        toast({
          title: "خطأ في استقبال البيانات",
          description: "حدث خطأ أثناء تحميل بيانات التقرير",
          variant: "destructive"
        });
      }
    } else if (reportTypeParam) {
      // إذا كان هناك نوع تقرير محدد في URL
      setCurrentSettings(prev => ({
        ...prev,
        reportType: reportTypeParam
      }));
      console.log('🔄 تحديث نوع التقرير من URL:', reportTypeParam);
    }
  }, []);

  // تطبيق إعدادات الطباعة على التقرير المنقول - النظام الموحد
  const applySettingsToReport = useCallback(() => {
    if (!reportContext?.html || !currentSettings) return;
    
    // تطبيق النظام الموحد للطباعة مع الفئات المحسنة
    const reportElements = document.querySelectorAll('.report-preview, .print-content');
    reportElements.forEach(element => {
      element.classList.add('print-show', 'content-visibility-fix');
    });
    
    // إنشاء CSS مخصص وتطبيقه على التقرير المنقول
    const styleId = 'transferred-report-styles';
    const existingStyle = document.getElementById(styleId);
    
    if (existingStyle) {
      existingStyle.remove();
    }

    const customCSS = `
      /* تطبيق الخط الأساسي */
      .report-preview, .report-preview * {
        font-family: ${currentSettings.fontFamily} !important;
        font-size: ${currentSettings.fontSize}px !important;
        direction: rtl !important;
      }
      
      /* العناوين */
      .report-preview h1, 
      .report-preview h2, 
      .report-preview h3,
      .report-preview .report-title,
      .report-preview .main-title {
        font-size: ${currentSettings.headerFontSize}px !important;
        color: ${currentSettings.headerTextColor} !important;
        font-weight: bold !important;
      }
      
      /* الجداول */
      .report-preview table {
        font-size: ${currentSettings.tableFontSize}px !important;
        border-collapse: collapse !important;
        width: 100% !important;
        border: ${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor} !important;
      }
      
      .report-preview table th {
        background-color: ${currentSettings.tableHeaderColor} !important;
        color: ${currentSettings.headerTextColor} !important;
        padding: ${currentSettings.tableCellPadding}px !important;
        border: ${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor} !important;
        font-weight: bold !important;
      }
      
      .report-preview table td {
        padding: ${currentSettings.tableCellPadding}px !important;
        border: ${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor} !important;
      }
      
      .report-preview table tbody tr:nth-child(even) {
        background-color: ${currentSettings.tableRowEvenColor} !important;
      }
      
      .report-preview table tbody tr:nth-child(odd) {
        background-color: ${currentSettings.tableRowOddColor} !important;
      }
      
      /* النصوص العامة */
      .report-preview p,
      .report-preview div,
      .report-preview span {
        font-size: ${currentSettings.fontSize}px !important;
        line-height: 1.4 !important;
      }
      
      /* إعدادات الطباعة */
      @media print {
        .report-preview {
          margin: ${currentSettings.marginTop}mm ${currentSettings.marginRight}mm ${currentSettings.marginBottom}mm ${currentSettings.marginLeft}mm !important;
          print-color-adjust: exact !important;
          -webkit-print-color-adjust: exact !important;
        }
        
        .report-preview * {
          print-color-adjust: exact !important;
          -webkit-print-color-adjust: exact !important;
        }
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = customCSS;
    document.head.appendChild(styleElement);
    
    // فرض إعادة عرض المحتوى
    setTimeout(() => {
      const previewElement = document.querySelector('.report-preview') as HTMLElement;
      if (previewElement) {
        previewElement.style.display = 'none';
        previewElement.offsetHeight; // trigger reflow
        previewElement.style.display = '';
      }
    }, 100);
  }, [currentSettings, reportContext?.html]);

  useEffect(() => {
    applySettingsToReport();
  }, [applySettingsToReport]);

  // جلب الإعدادات المحفوظة
  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
  });

  const { data: workers } = useQuery({
    queryKey: ['/api/workers'],
  });

  // جلب إعدادات الطباعة المحفوظة مع تصفية حسب نوع التقرير
  const { data: savedSettingsList = [], refetch: refetchSettings } = useQuery<DBPrintSettings[]>({
    queryKey: ['/api/print-settings', currentSettings.reportType],
    queryFn: ({ queryKey }) => {
      const [, reportType] = queryKey;
      return apiRequest('GET', `/api/print-settings?reportType=${reportType || ''}`);
    },
  });

  // طفرة لحفظ الإعدادات
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<InsertPrintSettings & { id?: string }>) => {
      if (settings.id) {
        return apiRequest('PUT', `/api/print-settings/${settings.id}`, settings);
      } else {
        return apiRequest('POST', '/api/print-settings', settings);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/print-settings'] });
      toast({
        title: "✅ تم الحفظ",
        description: "تم حفظ الإعدادات بنجاح",
      });
    },
    onError: (error: any) => {
      console.error('Save settings error:', error);
      toast({
        title: "❌ خطأ",
        description: error?.message || "فشل في حفظ الإعدادات",
      });
    }
  });

  // طفرة لحذف الإعدادات
  const deleteSettingsMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/print-settings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/print-settings'] });
      toast({
        title: "✅ تم الحذف",
        description: "تم حذف الإعدادات بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "❌ خطأ",
        description: "فشل في حذف الإعدادات",
      });
    }
  });

  // دالة تحديث الإعدادات مع التطبيق الفوري
  const updateSetting = (key: keyof PrintSettings, value: any) => {
    setCurrentSettings(prev => ({
      ...prev,
      [key]: value
    }));
    // تطبيق الإعدادات فوراً عند تغييرها
    setTimeout(() => applySettingsToReport(), 50);
  };

  // دالة حفظ الإعدادات
  const saveSettings = () => {
    // التأكد من وجود اسم للإعداد
    if (!currentSettings.name || currentSettings.name.trim() === '') {
      toast({
        title: "❌ خطأ في البيانات",
        description: "يجب إدخال اسم للإعداد",
      });
      return;
    }

    const settingsToSave: Partial<InsertPrintSettings & { id?: string }> = {
      reportType: currentSettings.reportType,
      name: currentSettings.name.trim(),
      pageSize: currentSettings.pageSize,
      pageOrientation: currentSettings.pageOrientation,
      marginTop: currentSettings.marginTop.toString(),
      marginBottom: currentSettings.marginBottom.toString(),
      marginLeft: currentSettings.marginLeft.toString(),
      marginRight: currentSettings.marginRight.toString(),
      fontFamily: currentSettings.fontFamily,
      fontSize: Number(currentSettings.fontSize),
      headerFontSize: Number(currentSettings.headerFontSize),
      tableFontSize: Number(currentSettings.tableFontSize),
      headerBackgroundColor: currentSettings.headerBackgroundColor,
      headerTextColor: currentSettings.headerTextColor,
      tableHeaderColor: currentSettings.tableHeaderColor,
      tableRowEvenColor: currentSettings.tableRowEvenColor,
      tableRowOddColor: currentSettings.tableRowOddColor,
      tableBorderColor: currentSettings.tableBorderColor,
      tableBorderWidth: Number(currentSettings.tableBorderWidth),
      tableCellPadding: Number(currentSettings.tableCellPadding),
      tableColumnWidths: Array.isArray(currentSettings.tableColumnWidths) 
        ? JSON.stringify(currentSettings.tableColumnWidths)
        : currentSettings.tableColumnWidths || "[8,12,10,30,12,15,15,12]",
      showHeader: Boolean(currentSettings.showHeader),
      showLogo: Boolean(currentSettings.showLogo),
      showProjectInfo: Boolean(currentSettings.showProjectInfo),
      showWorkerInfo: Boolean(currentSettings.showWorkerInfo),
      showAttendanceTable: Boolean(currentSettings.showAttendanceTable),
      showTransfersTable: Boolean(currentSettings.showTransfersTable),
      showSummary: Boolean(currentSettings.showSummary),
      showSignatures: Boolean(currentSettings.showSignatures),
      isDefault: Boolean(currentSettings.isDefault),
      isActive: Boolean(currentSettings.isActive),
      id: selectedSettingsId || undefined
    };
    
    console.log('Saving settings:', settingsToSave);
    saveSettingsMutation.mutate(settingsToSave);
  };

  // دالة تحميل إعدادات محفوظة
  const loadSettings = (settingsId: string) => {
    const settings = savedSettingsList.find((s) => s.id === settingsId);
    if (settings) {
      // تحويل البيانات المحملة للنسق الصحيح
      const formattedSettings: PrintSettings = {
        ...settings,
        marginTop: parseFloat(settings.marginTop),
        marginBottom: parseFloat(settings.marginBottom),
        marginLeft: parseFloat(settings.marginLeft),
        marginRight: parseFloat(settings.marginRight),
        tableColumnWidths: typeof settings.tableColumnWidths === 'string' 
          ? JSON.parse(settings.tableColumnWidths)
          : (settings.tableColumnWidths as any) || [8, 12, 10, 30, 12, 15, 15, 12]
      };
      
      setCurrentSettings(formattedSettings);
      setSelectedSettingsId(settingsId);
      // تطبيق الإعدادات المحملة على التقرير
      setTimeout(() => applySettingsToReport(), 100);
      toast({
        title: "📂 تم التحميل",
        description: `تم تحميل إعدادات: ${settings.name}`,
      });
    }
  };

  // دالة إنشاء CSS للطباعة
  const generatePrintCSS = () => {
    return `
      @page {
        size: ${currentSettings.pageSize} ${currentSettings.pageOrientation};
        margin: ${currentSettings.marginTop}mm ${currentSettings.marginRight}mm ${currentSettings.marginBottom}mm ${currentSettings.marginLeft}mm;
      }
      
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .no-print, 
        nav, 
        .sidebar, 
        header, 
        footer,
        .card:not(.print-content),
        button,
        .btn {
          display: none !important;
        }
        
        html, body {
          font-family: ${currentSettings.fontFamily}, Arial, sans-serif !important;
          font-size: ${currentSettings.fontSize}px !important;
          color: #000 !important;
          background: white !important;
          direction: rtl !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: auto !important;
        }
        
        #dynamic-print-preview,
        .report-renderer,
        .print-preview-mode {
          display: block !important;
          position: static !important;
          width: 100% !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          overflow: visible !important;
          box-shadow: none !important;
          border: none !important;
        }
        
        .print-header {
          ${currentSettings.showHeader ? '' : 'display: none !important;'}
          background: ${currentSettings.headerBackgroundColor} !important;
          color: ${currentSettings.headerTextColor} !important;
          font-size: ${currentSettings.headerFontSize}px !important;
          padding: 5mm !important;
          margin: 0 0 5mm 0 !important;
          text-align: center !important;
          -webkit-print-color-adjust: exact !important;
          break-inside: avoid !important;
        }
        
        .print-table,
        table {
          ${currentSettings.showAttendanceTable ? '' : 'display: none !important;'}
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 3mm 0 !important;
          font-size: ${currentSettings.tableFontSize}px !important;
          break-inside: auto !important;
          page-break-inside: auto !important;
        }
        
        .print-table th,
        table th {
          background: ${currentSettings.tableHeaderColor} !important;
          color: white !important;
          border: ${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor} !important;
          padding: ${currentSettings.tableCellPadding}mm !important;
          text-align: center !important;
          font-weight: bold !important;
          -webkit-print-color-adjust: exact !important;
          break-inside: avoid !important;
        }
        
        .print-table td,
        table td {
          border: ${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor} !important;
          padding: ${currentSettings.tableCellPadding}mm !important;
          text-align: center !important;
          -webkit-print-color-adjust: exact !important;
        }
        
        .print-table tbody tr:nth-child(even) td,
        table tbody tr:nth-child(even) td {
          background: ${currentSettings.tableRowEvenColor} !important;
        }
        
        .print-table tbody tr:nth-child(odd) td,
        table tbody tr:nth-child(odd) td {
          background: ${currentSettings.tableRowOddColor} !important;
        }
        
        .project-info {
          ${currentSettings.showProjectInfo ? '' : 'display: none !important;'}
        }
        
        .worker-info {
          ${currentSettings.showWorkerInfo ? '' : 'display: none !important;'}
        }
        
        .transfers-table {
          ${currentSettings.showTransfersTable ? '' : 'display: none !important;'}
        }
        
        .summary-section {
          ${currentSettings.showSummary ? '' : 'display: none !important;'}
        }
        
        .signatures-section {
          ${currentSettings.showSignatures ? '' : 'display: none !important;'}
        }

        /* إخفاء جميع عناصر الواجهة غير المطلوبة للطباعة */
        .card-header,
        .card-title,
        .sidebar,
        .navigation,
        .controls,
        .settings-panel,
        .tabs,
        .tab-content:not(.print-content),
        .form-group,
        .input-group,
        .dropdown,
        .tooltip,
        .modal,
        .overlay {
          display: none !important;
        }

        /* تحسين عرض المحتوى */
        .report-renderer,
        .worker-statement-preview,
        .supplier-statement-preview,
        .daily-expenses-preview,
        .material-purchases-preview,
        .advanced-reports-preview {
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
          box-shadow: none !important;
          background: white !important;
          width: 100% !important;
        }

        /* تحسين عرض العناصر المعلوماتية */
        .project-info,
        .worker-info,
        .supplier-info,
        .date-info {
          margin: 0 0 5mm 0 !important;
          padding: 2mm !important;
          border: 1px solid #ddd !important;
          background: #f9f9f9 !important;
          -webkit-print-color-adjust: exact !important;
        }

        /* تحسين عرض الملخصات */
        .summary-section {
          margin: 5mm 0 0 0 !important;
          padding: 3mm !important;
          border: 1px solid #ddd !important;
          background: #f5f5f5 !important;
          -webkit-print-color-adjust: exact !important;
        }
      }
    `;
  };

  // دالة إدراج CSS في الصفحة
  const applyPrintCSS = () => {
    // إزالة CSS السابق
    const existingStyle = document.getElementById('dynamic-print-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // إضافة CSS الجديد
    const style = document.createElement('style');
    style.id = 'dynamic-print-styles';
    style.textContent = generatePrintCSS();
    document.head.appendChild(style);
  };

  // تطبيق CSS عند تغيير الإعدادات
  useEffect(() => {
    applyPrintCSS();
  }, [currentSettings]);

  // دالة الطباعة المحسنة
  const handlePrint = () => {
    console.log('Starting print process...');
    
    // تطبيق CSS الطباعة
    applyPrintCSS();
    
    // العثور على عنصر المعاينة
    const previewElement = document.getElementById('dynamic-print-preview');
    if (!previewElement) {
      console.error('Preview element not found');
      toast({
        title: "خطأ في الطباعة",
        description: "لم يتم العثور على عنصر المعاينة",
        variant: "destructive"
      });
      return;
    }

    console.log('Preview element found:', previewElement);
    console.log('Preview content:', previewElement.innerHTML.substring(0, 200));

    // التأكد من وجود المحتوى
    if (!previewElement.innerHTML.trim()) {
      console.error('Preview element is empty');
      toast({
        title: "خطأ في الطباعة",
        description: "المعاينة فارغة. يرجى اختيار نوع تقرير صالح",
        variant: "destructive"
      });
      return;
    }

    // تطبيق كلاس الطباعة وبدء الطباعة
    document.body.classList.add('print-mode');
    
    toast({
      title: "جاري الطباعة...",
      description: "سيتم فتح نافذة الطباعة قريباً"
    });

    setTimeout(() => {
      window.print();
      // إزالة كلاس الطباعة بعد الطباعة
      document.body.classList.remove('print-mode');
    }, 300);
  };

  // دالة تصدير الإعدادات
  const exportSettings = () => {
    const dataStr = JSON.stringify(currentSettings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `print_settings_${currentSettings.name}.json`;
    link.click();
  };

  // قائمة أنواع التقارير المتاحة
  const reportTypes = [
    {
      value: 'worker_statement',
      label: 'كشف حساب العامل الشامل',
      description: 'كشف تفصيلي بجميع المعاملات والحضور'
    },
    {
      value: 'supplier_statement',
      label: 'كشف حساب المورد',
      description: 'تقرير مديونية ومشتريات المورد'
    },
    {
      value: 'daily_expenses',
      label: 'تقرير المصروفات اليومية',
      description: 'كشف مفصل بمصروفات اليوم'
    },
    {
      value: 'material_purchases',
      label: 'تقرير مشتريات المواد',
      description: 'كشف بجميع مشتريات المواد'
    },
    {
      value: 'advanced_reports',
      label: 'التقارير المتقدمة',
      description: 'تقارير شاملة مع إحصائيات متطورة'
    }
  ];

  // دالة لتحديث نوع التقرير وتحميل الإعدادات المناسبة
  const changeReportType = (newReportType: string) => {
    updateSetting('reportType', newReportType);
    
    // البحث عن إعدادات افتراضية لهذا النوع من التقارير
    const defaultForType = savedSettingsList.find(
      (setting) => setting.reportType === newReportType && setting.isDefault
    );
    
    if (defaultForType) {
      loadSettings(defaultForType.id);
    } else {
      // إعدادات افتراضية بسيطة لهذا النوع
      const reportLabel = reportTypes.find(r => r.value === newReportType)?.label || 'جديد';
      setCurrentSettings({
        ...defaultSettings,
        reportType: newReportType,
        name: `إعداد ${reportLabel}`
      } as any);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl" style={{ direction: 'rtl' }}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            onClick={() => setLocation('/reports')}
            variant="ghost"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة للتقارير
          </Button>
          
          <Button
            onClick={() => setLocation('/advanced-print-control')}
            variant="outline"
            className="flex items-center gap-2 border-purple-500 text-purple-600 hover:bg-purple-50"
          >
            <Zap className="h-4 w-4" />
            الإصدار المتقدم
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-2 flex items-center justify-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          نظام التحكم الشامل في طباعة الكشوف
        </h1>
        <p className="text-gray-600 text-center">
          تحكم كامل في جميع جوانب التنسيق والطباعة مع معاينة فورية
        </p>
        {reportContext && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center mt-4">
            <p className="text-blue-700 font-medium">
              📋 تم استقبال تقرير: {reportContext.title}
            </p>
            <p className="text-blue-600 text-sm mt-1">
              يمكنك الآن تخصيص إعدادات الطباعة ومعاينة التقرير مع بياناته الحقيقية
            </p>
          </div>
        )}
      </div>

      {/* قسم اختيار نوع التقرير */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            نوع التقرير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((report) => (
              <div
                key={report.value}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  currentSettings.reportType === report.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => changeReportType(report.value)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      currentSettings.reportType === report.value
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300'
                    }`}
                  />
                  <h3 className="font-medium">{report.label}</h3>
                </div>
                <p className="text-sm text-gray-600">{report.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* لوحة التحكم */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                لوحة التحكم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="page" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="page">الصفحة</TabsTrigger>
                  <TabsTrigger value="fonts">الخطوط</TabsTrigger>
                  <TabsTrigger value="colors">الألوان</TabsTrigger>
                  <TabsTrigger value="table">الجدول</TabsTrigger>
                  <TabsTrigger value="elements">العناصر</TabsTrigger>
                </TabsList>

                {/* تبويب إعدادات الصفحة */}
                <TabsContent value="page" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>حجم الصفحة</Label>
                      <Select
                        value={currentSettings.pageSize}
                        onValueChange={(value) => updateSetting('pageSize', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A4">A4</SelectItem>
                          <SelectItem value="A3">A3</SelectItem>
                          <SelectItem value="Letter">Letter</SelectItem>
                          <SelectItem value="Legal">Legal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>اتجاه الصفحة</Label>
                      <Select
                        value={currentSettings.pageOrientation}
                        onValueChange={(value) => updateSetting('pageOrientation', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">عمودي</SelectItem>
                          <SelectItem value="landscape">أفقي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center justify-between">
                        الهامش العلوي (مم)
                        <span className="text-sm font-normal bg-blue-100 px-2 py-1 rounded">{currentSettings.marginTop} مم</span>
                      </Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Slider
                          value={[currentSettings.marginTop]}
                          onValueChange={([value]) => updateSetting('marginTop', value)}
                          max={50}
                          min={5}
                          step={1}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={currentSettings.marginTop}
                          onChange={(e) => updateSetting('marginTop', Number(e.target.value))}
                          className="w-16 text-center"
                          min={5}
                          max={50}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="flex items-center justify-between">
                        الهامش السفلي (مم)
                        <span className="text-sm font-normal bg-blue-100 px-2 py-1 rounded">{currentSettings.marginBottom} مم</span>
                      </Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Slider
                          value={[currentSettings.marginBottom]}
                          onValueChange={([value]) => updateSetting('marginBottom', value)}
                          max={50}
                          min={5}
                          step={1}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={currentSettings.marginBottom}
                          onChange={(e) => updateSetting('marginBottom', Number(e.target.value))}
                          className="w-16 text-center"
                          min={5}
                          max={50}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="flex items-center justify-between">
                        الهامش الأيمن (مم)
                        <span className="text-sm font-normal bg-blue-100 px-2 py-1 rounded">{currentSettings.marginRight} مم</span>
                      </Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Slider
                          value={[currentSettings.marginRight]}
                          onValueChange={([value]) => updateSetting('marginRight', value)}
                          max={50}
                          min={5}
                          step={1}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={currentSettings.marginRight}
                          onChange={(e) => updateSetting('marginRight', Number(e.target.value))}
                          className="w-16 text-center"
                          min={5}
                          max={50}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="flex items-center justify-between">
                        الهامش الأيسر (مم)
                        <span className="text-sm font-normal bg-blue-100 px-2 py-1 rounded">{currentSettings.marginLeft} مم</span>
                      </Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Slider
                          value={[currentSettings.marginLeft]}
                          onValueChange={([value]) => updateSetting('marginLeft', value)}
                          max={50}
                          min={5}
                          step={1}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={currentSettings.marginLeft}
                          onChange={(e) => updateSetting('marginLeft', Number(e.target.value))}
                          className="w-16 text-center"
                          min={5}
                          max={50}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* إعدادات إضافية للصفحة */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id="auto-margins"
                        checked={currentSettings.marginTop === currentSettings.marginBottom && currentSettings.marginLeft === currentSettings.marginRight}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const avgMargin = Math.round((currentSettings.marginTop + currentSettings.marginBottom + currentSettings.marginLeft + currentSettings.marginRight) / 4);
                            updateSetting('marginTop', avgMargin);
                            updateSetting('marginBottom', avgMargin);
                            updateSetting('marginLeft', avgMargin);
                            updateSetting('marginRight', avgMargin);
                          }
                        }}
                      />
                      <Label htmlFor="auto-margins">توحيد جميع الهوامش</Label>
                    </div>
                  </div>
                </TabsContent>

                {/* تبويب إعدادات الخطوط */}
                <TabsContent value="fonts" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>نوع الخط</Label>
                      <Select
                        value={currentSettings.fontFamily}
                        onValueChange={(value) => updateSetting('fontFamily', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Verdana">Verdana</SelectItem>
                          <SelectItem value="Tahoma">Tahoma</SelectItem>
                          <SelectItem value="Calibri">Calibri</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>معاينة الخط</Label>
                      <div className="p-3 border rounded-lg bg-gray-50" style={{ fontFamily: currentSettings.fontFamily, fontSize: '14px' }}>
                        نموذج النص بالخط المحدد - Sample Text 123
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="flex items-center justify-between">
                        حجم الخط العام
                        <span className="text-sm font-normal bg-green-100 px-2 py-1 rounded">{currentSettings.fontSize}px</span>
                      </Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Slider
                          value={[currentSettings.fontSize]}
                          onValueChange={([value]) => updateSetting('fontSize', value)}
                          max={20}
                          min={8}
                          step={1}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={currentSettings.fontSize}
                          onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
                          className="w-16 text-center"
                          min={8}
                          max={20}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="flex items-center justify-between">
                        حجم خط العناوين
                        <span className="text-sm font-normal bg-green-100 px-2 py-1 rounded">{currentSettings.headerFontSize}px</span>
                      </Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Slider
                          value={[currentSettings.headerFontSize]}
                          onValueChange={([value]) => updateSetting('headerFontSize', value)}
                          max={28}
                          min={12}
                          step={1}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={currentSettings.headerFontSize}
                          onChange={(e) => updateSetting('headerFontSize', Number(e.target.value))}
                          className="w-16 text-center"
                          min={12}
                          max={28}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="flex items-center justify-between">
                        حجم خط الجدول
                        <span className="text-sm font-normal bg-green-100 px-2 py-1 rounded">{currentSettings.tableFontSize}px</span>
                      </Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Slider
                          value={[currentSettings.tableFontSize]}
                          onValueChange={([value]) => updateSetting('tableFontSize', value)}
                          max={16}
                          min={6}
                          step={1}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={currentSettings.tableFontSize}
                          onChange={(e) => updateSetting('tableFontSize', Number(e.target.value))}
                          className="w-16 text-center"
                          min={6}
                          max={16}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* تبويب الألوان */}
                <TabsContent value="colors" className="space-y-4">
                  {/* ألوان الرأسية */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      ألوان الرأسية والعناوين
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>لون خلفية الرأسية</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            type="color"
                            value={currentSettings.headerBackgroundColor}
                            onChange={(e) => updateSetting('headerBackgroundColor', e.target.value)}
                            className="w-16 h-10"
                          />
                          <Input
                            value={currentSettings.headerBackgroundColor}
                            onChange={(e) => updateSetting('headerBackgroundColor', e.target.value)}
                            className="flex-1"
                            placeholder="#1e40af"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>لون نص الرأسية</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            type="color"
                            value={currentSettings.headerTextColor}
                            onChange={(e) => updateSetting('headerTextColor', e.target.value)}
                            className="w-16 h-10"
                          />
                          <Input
                            value={currentSettings.headerTextColor}
                            onChange={(e) => updateSetting('headerTextColor', e.target.value)}
                            className="flex-1"
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* ألوان الجدول */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Grid3x3 className="h-4 w-4" />
                      ألوان الجدول
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>لون رأس الجدول</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            type="color"
                            value={currentSettings.tableHeaderColor}
                            onChange={(e) => updateSetting('tableHeaderColor', e.target.value)}
                            className="w-16 h-10"
                          />
                          <Input
                            value={currentSettings.tableHeaderColor}
                            onChange={(e) => updateSetting('tableHeaderColor', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>لون حدود الجدول</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            type="color"
                            value={currentSettings.tableBorderColor}
                            onChange={(e) => updateSetting('tableBorderColor', e.target.value)}
                            className="w-16 h-10"
                          />
                          <Input
                            value={currentSettings.tableBorderColor}
                            onChange={(e) => updateSetting('tableBorderColor', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>لون الصفوف الزوجية</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            type="color"
                            value={currentSettings.tableRowEvenColor}
                            onChange={(e) => updateSetting('tableRowEvenColor', e.target.value)}
                            className="w-16 h-10"
                          />
                          <Input
                            value={currentSettings.tableRowEvenColor}
                            onChange={(e) => updateSetting('tableRowEvenColor', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>لون الصفوف الفردية</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            type="color"
                            value={currentSettings.tableRowOddColor}
                            onChange={(e) => updateSetting('tableRowOddColor', e.target.value)}
                            className="w-16 h-10"
                          />
                          <Input
                            value={currentSettings.tableRowOddColor}
                            onChange={(e) => updateSetting('tableRowOddColor', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* نماذج ألوان جاهزة */}
                  <div>
                    <h4 className="font-medium mb-3">نماذج ألوان جاهزة</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { name: 'أزرق كلاسيكي', header: '#1e40af', text: '#ffffff', table: '#1e40af', even: '#ffffff', odd: '#f0f9ff', border: '#1e40af' },
                        { name: 'أخضر طبيعي', header: '#15803d', text: '#ffffff', table: '#15803d', even: '#ffffff', odd: '#f0fdf4', border: '#15803d' },
                        { name: 'رمادي احترافي', header: '#374151', text: '#ffffff', table: '#374151', even: '#ffffff', odd: '#f9fafb', border: '#374151' },
                        { name: 'بني دافئ', header: '#92400e', text: '#ffffff', table: '#92400e', even: '#ffffff', odd: '#fef3c7', border: '#92400e' }
                      ].map((theme, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            updateSetting('headerBackgroundColor', theme.header);
                            updateSetting('headerTextColor', theme.text);
                            updateSetting('tableHeaderColor', theme.table);
                            updateSetting('tableRowEvenColor', theme.even);
                            updateSetting('tableRowOddColor', theme.odd);
                            updateSetting('tableBorderColor', theme.border);
                          }}
                          className="p-2 h-auto flex flex-col items-center gap-1"
                        >
                          <div className="flex gap-1">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.header }}></div>
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.even }}></div>
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.odd }}></div>
                          </div>
                          <span className="text-xs">{theme.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* تبويب إعدادات الجدول */}
                <TabsContent value="table" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>سماكة الحدود</Label>
                      <Slider
                        value={[currentSettings.tableBorderWidth]}
                        onValueChange={([value]) => updateSetting('tableBorderWidth', value)}
                        max={5}
                        min={0}
                        step={1}
                        className="mt-2"
                      />
                      <div className="text-sm text-gray-500 mt-1">{currentSettings.tableBorderWidth}px</div>
                    </div>
                    
                    <div>
                      <Label>حشو الخلايا (مم)</Label>
                      <Slider
                        value={[currentSettings.tableCellPadding]}
                        onValueChange={([value]) => updateSetting('tableCellPadding', value)}
                        max={10}
                        min={1}
                        step={0.5}
                        className="mt-2"
                      />
                      <div className="text-sm text-gray-500 mt-1">{currentSettings.tableCellPadding} مم</div>
                    </div>
                  </div>
                </TabsContent>

                {/* تبويب العناصر المرئية */}
                <TabsContent value="elements" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'showHeader', label: 'عرض الرأسية' },
                      { key: 'showLogo', label: 'عرض الشعار' },
                      { key: 'showProjectInfo', label: 'معلومات المشروع' },
                      { key: 'showWorkerInfo', label: 'معلومات العامل' },
                      { key: 'showAttendanceTable', label: 'جدول الحضور' },
                      { key: 'showTransfersTable', label: 'جدول الحوالات' },
                      { key: 'showSummary', label: 'الملخص المالي' },
                      { key: 'showSignatures', label: 'التوقيعات' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <Label>{label}</Label>
                        <Switch
                          checked={currentSettings[key as keyof PrintSettings] as boolean}
                          onCheckedChange={(checked) => updateSetting(key as keyof PrintSettings, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* المعاينة وأدوات التحكم */}
        <div className="space-y-4">
          {/* أدوات التحكم السريع */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                إدارة الإعدادات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>اسم الإعداد</Label>
                <Input
                  value={currentSettings.name}
                  onChange={(e) => updateSetting('name', e.target.value)}
                  placeholder="اسم الإعداد"
                  className="mt-1"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={currentSettings.isDefault}
                    onCheckedChange={(checked) => updateSetting('isDefault', checked)}
                  />
                  <Label className="text-sm">تعيين كإعداد افتراضي لهذا النوع</Label>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={saveSettings} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    حفظ
                  </Button>
                  <Button variant="outline" onClick={exportSettings}>
                    <Download className="h-4 w-4 mr-2" />
                    تصدير
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>الإعدادات المحفوظة لـ {reportTypes.find(r => r.value === currentSettings.reportType)?.label}</Label>
                {savedSettingsList.length === 0 ? (
                  <p className="text-sm text-gray-500 p-3 border rounded-lg">
                    لا توجد إعدادات محفوظة لهذا النوع من التقارير
                  </p>
                ) : (
                  savedSettingsList.map((settings: any) => (
                    <div key={settings.id} className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => loadSettings(settings.id)}
                      >
                        {settings.name} {settings.isDefault && '(افتراضي)'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteSettingsMutation.mutate(settings.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* أزرار التحكم */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                طباعة ومعاينة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={() => setPreviewMode('screen')}
                  variant={previewMode === 'screen' ? 'default' : 'outline'}
                  className="flex-1"
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  شاشة
                </Button>
                <Button
                  onClick={() => setPreviewMode('print')}
                  variant={previewMode === 'print' ? 'default' : 'outline'}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  طباعة
                </Button>
              </div>
              
              <PrintButton 
                reportType={currentSettings.reportType}
                printSettings={currentSettings}
                className="w-full bg-green-600 hover:bg-green-700"
                variant="default"
              >
                طباعة مع الإعدادات المخصصة
              </PrintButton>
              
              <Button 
                variant="outline" 
                onClick={() => setCurrentSettings({...defaultSettings} as any)}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                إعادة تعيين
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* معاينة الكشف */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              معاينة مباشرة
              {reportContext?.title && (
                <span className="text-sm text-blue-600 font-normal">
                  • {reportContext.title}
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm">
              {reportContext?.hasRealData && (
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                  بيانات حقيقية
                </span>
              )}
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                {previewMode === 'print' ? 'وضع الطباعة' : 'وضع الشاشة'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            id="dynamic-print-preview"
            className={`report-preview-container ${previewMode === 'print' ? 'print-preview-mode' : ''}`}
            style={{
              fontFamily: currentSettings.fontFamily,
              fontSize: `${currentSettings.fontSize}px`,
              direction: 'rtl',
              backgroundColor: previewMode === 'print' ? '#ffffff' : '#fafafa',
              border: previewMode === 'print' ? '1px solid #e5e7eb' : 'none',
              borderRadius: '8px',
              padding: '20px',
              minHeight: '400px'
            }}
          >
            {/* عرض التقرير الحقيقي المنقول أو التقرير المُولّد حسب النوع المحدد */}
            {reportContext?.html ? (
              <div>
                {/* رسالة تأكيد استقبال البيانات */}
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                  ✅ تم استقبال التقرير من صفحة التقارير • 
                  آخر تحديث: {new Date(reportContext.timestamp || Date.now()).toLocaleString('ar-SA')}
                </div>
                
                {/* عرض التقرير المنقول مع تطبيق الإعدادات */}
                <div 
                  className="report-preview print-content"
                  dangerouslySetInnerHTML={{ __html: reportContext.html }}
                />
              </div>
            ) : reportContext?.data ? (
              <div>
                {/* رسالة تأكيد وجود البيانات */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
                  📊 تم استقبال بيانات التقرير • سيتم عرضها باستخدام المُولّد الافتراضي
                </div>
                
                {/* عرض تقرير مُولّد من البيانات */}
                <ReportRenderer 
                  reportType={currentSettings.reportType}
                  printSettings={currentSettings}
                  reportData={reportContext.data}
                />
              </div>
            ) : (
              <div>
                {/* رسالة عدم وجود بيانات */}
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                  ⚠️ لا توجد بيانات تقرير • يُعرض نموذج افتراضي
                </div>
                
                {/* عرض نموذج افتراضي */}
                <ReportRenderer 
                  reportType={currentSettings.reportType}
                  printSettings={currentSettings}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}