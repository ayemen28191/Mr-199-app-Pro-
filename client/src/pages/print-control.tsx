// صفحة التحكم الشامل في طباعة الكشوف
// نظام متقدم للتحكم في جميع جوانب التنسيق والطباعة

import React, { useState, useEffect } from 'react';
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
  Monitor
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from '@/lib/queryClient';
import ReportRenderer from '@/components/print-preview/ReportRenderer';

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
  const [currentSettings, setCurrentSettings] = useState<PrintSettings>(defaultSettings as PrintSettings);
  const [selectedSettingsId, setSelectedSettingsId] = useState<string>('');
  const [previewMode, setPreviewMode] = useState<'screen' | 'print'>('screen');
  const { toast } = useToast();

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

  // دالة تحديث الإعدادات
  const updateSetting = (key: keyof PrintSettings, value: any) => {
    setCurrentSettings(prev => ({
      ...prev,
      [key]: value
    }));
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
        .no-print { display: none !important; }
        
        body {
          font-family: ${currentSettings.fontFamily}, Arial, sans-serif !important;
          font-size: ${currentSettings.fontSize}px !important;
          color: #000 !important;
          background: white !important;
          direction: rtl !important;
        }
        
        #dynamic-print-preview {
          display: block !important;
          position: static !important;
          width: 100% !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          overflow: visible !important;
        }
        
        .print-header {
          ${currentSettings.showHeader ? '' : 'display: none !important;'}
          background: ${currentSettings.headerBackgroundColor} !important;
          color: ${currentSettings.headerTextColor} !important;
          font-size: ${currentSettings.headerFontSize}px !important;
          padding: 5mm !important;
          margin-bottom: 3mm !important;
          text-align: center !important;
        }
        
        .print-table {
          ${currentSettings.showAttendanceTable ? '' : 'display: none !important;'}
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 3mm 0 !important;
          font-size: ${currentSettings.tableFontSize}px !important;
        }
        
        .print-table th {
          background: ${currentSettings.tableHeaderColor} !important;
          color: white !important;
          border: ${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor} !important;
          padding: ${currentSettings.tableCellPadding}mm !important;
          text-align: center !important;
          font-weight: bold !important;
        }
        
        .print-table td {
          border: ${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor} !important;
          padding: ${currentSettings.tableCellPadding}mm !important;
          text-align: center !important;
        }
        
        .print-table tr:nth-child(even) td {
          background: ${currentSettings.tableRowEvenColor} !important;
        }
        
        .print-table tr:nth-child(odd) td {
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

  // دالة الطباعة
  const handlePrint = () => {
    applyPrintCSS();
    setTimeout(() => {
      window.print();
    }, 100);
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
        name: `إعداد ${reportLabel}`,
        id: undefined
      } as PrintSettings);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl" style={{ direction: 'rtl' }}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-center mb-2 flex items-center justify-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          نظام التحكم الشامل في طباعة الكشوف
        </h1>
        <p className="text-gray-600 text-center">
          تحكم كامل في جميع جوانب التنسيق والطباعة مع معاينة فورية
        </p>
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
                      <Label>الهامش العلوي (مم)</Label>
                      <Slider
                        value={[currentSettings.marginTop]}
                        onValueChange={([value]) => updateSetting('marginTop', value)}
                        max={50}
                        min={5}
                        step={1}
                        className="mt-2"
                      />
                      <div className="text-sm text-gray-500 mt-1">{currentSettings.marginTop} مم</div>
                    </div>
                    
                    <div>
                      <Label>الهامش السفلي (مم)</Label>
                      <Slider
                        value={[currentSettings.marginBottom]}
                        onValueChange={([value]) => updateSetting('marginBottom', value)}
                        max={50}
                        min={5}
                        step={1}
                        className="mt-2"
                      />
                      <div className="text-sm text-gray-500 mt-1">{currentSettings.marginBottom} مم</div>
                    </div>
                    
                    <div>
                      <Label>الهامش الأيمن (مم)</Label>
                      <Slider
                        value={[currentSettings.marginRight]}
                        onValueChange={([value]) => updateSetting('marginRight', value)}
                        max={50}
                        min={5}
                        step={1}
                        className="mt-2"
                      />
                      <div className="text-sm text-gray-500 mt-1">{currentSettings.marginRight} مم</div>
                    </div>
                    
                    <div>
                      <Label>الهامش الأيسر (مم)</Label>
                      <Slider
                        value={[currentSettings.marginLeft]}
                        onValueChange={([value]) => updateSetting('marginLeft', value)}
                        max={50}
                        min={5}
                        step={1}
                        className="mt-2"
                      />
                      <div className="text-sm text-gray-500 mt-1">{currentSettings.marginLeft} مم</div>
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
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>حجم الخط العام</Label>
                      <Slider
                        value={[currentSettings.fontSize]}
                        onValueChange={([value]) => updateSetting('fontSize', value)}
                        max={20}
                        min={8}
                        step={1}
                        className="mt-2"
                      />
                      <div className="text-sm text-gray-500 mt-1">{currentSettings.fontSize}px</div>
                    </div>
                    
                    <div>
                      <Label>حجم خط العناوين</Label>
                      <Slider
                        value={[currentSettings.headerFontSize]}
                        onValueChange={([value]) => updateSetting('headerFontSize', value)}
                        max={24}
                        min={12}
                        step={1}
                        className="mt-2"
                      />
                      <div className="text-sm text-gray-500 mt-1">{currentSettings.headerFontSize}px</div>
                    </div>
                    
                    <div>
                      <Label>حجم خط الجدول</Label>
                      <Slider
                        value={[currentSettings.tableFontSize]}
                        onValueChange={([value]) => updateSetting('tableFontSize', value)}
                        max={16}
                        min={6}
                        step={1}
                        className="mt-2"
                      />
                      <div className="text-sm text-gray-500 mt-1">{currentSettings.tableFontSize}px</div>
                    </div>
                  </div>
                </TabsContent>

                {/* تبويب الألوان */}
                <TabsContent value="colors" className="space-y-4">
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
                        />
                      </div>
                    </div>
                    
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
                      <Label>لون الحدود</Label>
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
              
              <Button onClick={handlePrint} className="w-full bg-green-600 hover:bg-green-700">
                <Printer className="h-4 w-4 mr-2" />
                طباعة فورية
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setCurrentSettings({...defaultSettings, id: undefined} as PrintSettings)}
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
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            معاينة مباشرة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            id="dynamic-print-preview"
            className={`${previewMode === 'print' ? 'print-preview-mode' : ''}`}
            style={{
              fontFamily: currentSettings.fontFamily,
              fontSize: `${currentSettings.fontSize}px`,
              direction: 'rtl'
            }}
          >
            {/* عرض التقرير الحقيقي حسب النوع المحدد */}
            <ReportRenderer 
              reportType={currentSettings.reportType}
              className="border rounded-lg"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}