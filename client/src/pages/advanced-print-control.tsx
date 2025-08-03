// صفحة التحكم المتقدم في طباعة الكشوف - النسخة المبسطة والعملية
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { 
  Printer, Settings, Palette, Layout, Type, Grid3x3, Eye, Save, 
  Download, Upload, RotateCcw, Copy, Trash2, Plus, FileText, 
  Monitor, ArrowLeft
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useLocation } from "wouter";
import { printWithSettings } from '@/hooks/usePrintSettings';
import type { PrintSettings as DBPrintSettings, InsertPrintSettings } from '@shared/schema';

interface PrintSettings extends Omit<DBPrintSettings, 'marginTop' | 'marginBottom' | 'marginLeft' | 'marginRight' | 'tableColumnWidths' | 'createdAt' | 'updatedAt'> {
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

export default function AdvancedPrintControl() {
  const [, setLocation] = useLocation();
  const [currentSettings, setCurrentSettings] = useState<PrintSettings>(defaultSettings as PrintSettings);
  const [selectedSettingsId, setSelectedSettingsId] = useState<string>('');
  const [reportContext, setReportContext] = useState<any>(null);
  const { toast } = useToast();

  // استقبال بيانات التقرير من localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const withData = urlParams.get('withData');
    const reportTypeParam = urlParams.get('reportType');
    
    if (withData === 'true') {
      try {
        const storedContext = localStorage.getItem('printReportContext');
        if (storedContext) {
          const context = JSON.parse(storedContext);
          setReportContext(context);
          
          if (context.type && context.type !== currentSettings.reportType) {
            setCurrentSettings(prev => ({
              ...prev,
              reportType: context.type
            }));
          }
          
          toast({
            title: "تم استقبال التقرير",
            description: `تم تحميل بيانات ${context.title} للمعاينة والتخصيص`,
          });
        }
      } catch (error) {
        console.error('خطأ في استقبال بيانات التقرير:', error);
        toast({
          title: "خطأ",
          description: "فشل في تحميل بيانات التقرير",
        });
      }
    } else if (reportTypeParam) {
      setCurrentSettings(prev => ({
        ...prev,
        reportType: reportTypeParam
      }));
    }
  }, []);

  // جلب الإعدادات المحفوظة
  const { data: savedSettingsList = [], refetch: refetchSettings } = useQuery<DBPrintSettings[]>({
    queryKey: ['/api/print-settings', currentSettings.reportType],
    queryFn: ({ queryKey }) => {
      const [, reportType] = queryKey;
      return apiRequest('GET', `/api/print-settings?reportType=${reportType || ''}`);
    },
  });

  // وظائف التحكم الاحترافية
  const exportSettings = () => {
    const settingsToExport = {
      ...currentSettings,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(settingsToExport, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `print-settings-${currentSettings.reportType}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "تم التصدير بنجاح",
      description: "تم تصدير الإعدادات إلى ملف JSON",
    });
  };

  const importSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const imported = JSON.parse(e.target?.result as string);
            // إزالة الحقول غير المطلوبة
            const { id, exportDate, version, createdAt, updatedAt, ...settingsToImport } = imported;
            setCurrentSettings({ ...currentSettings, ...settingsToImport });
            toast({
              title: "تم الاستيراد بنجاح",
              description: "تم تحميل الإعدادات من الملف المحدد",
            });
          } catch (error) {
            toast({
              title: "خطأ في الاستيراد",
              description: "فشل في قراءة ملف الإعدادات",
              variant: "destructive"
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const resetSettings = () => {
    setCurrentSettings(defaultSettings as PrintSettings);
    toast({
      title: "تم إعادة التعيين",
      description: "تم إعادة جميع الإعدادات إلى القيم الافتراضية",
    });
  };

  const duplicateSettings = () => {
    const duplicatedSettings = {
      ...currentSettings,
      name: `${currentSettings.name} - نسخة`,
      id: undefined // إزالة ID لإنشاء إعداد جديد
    };
    setCurrentSettings(duplicatedSettings as PrintSettings);
    toast({
      title: "تم النسخ",
      description: "تم إنشاء نسخة من الإعداد الحالي",
    });
  };

  // طفرة لحذف الإعدادات
  const deleteSettingsMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/print-settings/${id}`);
    },
    onSuccess: () => {
      refetchSettings();
      setSelectedSettingsId('');
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف الإعداد المحدد",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في الحذف",
        description: "فشل في حذف الإعداد",
        variant: "destructive"
      });
    }
  });

  const deleteSetting = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الإعداد؟')) {
      deleteSettingsMutation.mutate(id);
    }
  };

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
        title: "تم الحفظ",
        description: "تم حفظ الإعدادات بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error?.message || "فشل في حفظ الإعدادات",
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
    if (!currentSettings.name || currentSettings.name.trim() === '') {
      toast({
        title: "خطأ في البيانات",
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
      tableColumnWidths: JSON.stringify(currentSettings.tableColumnWidths || []),
      showHeader: currentSettings.showHeader,
      showLogo: currentSettings.showLogo,
      showProjectInfo: currentSettings.showProjectInfo,
      showWorkerInfo: currentSettings.showWorkerInfo,
      showAttendanceTable: currentSettings.showAttendanceTable,
      showTransfersTable: currentSettings.showTransfersTable,
      showSummary: currentSettings.showSummary,
      showSignatures: currentSettings.showSignatures,
      isDefault: currentSettings.isDefault,
      isActive: currentSettings.isActive,
      userId: currentSettings.userId,
    };

    if (selectedSettingsId) {
      settingsToSave.id = selectedSettingsId;
    }

    saveSettingsMutation.mutate(settingsToSave);
  };

  // دالة تحميل الإعدادات المحفوظة
  const loadSettings = (settingsId: string) => {
    const settings = savedSettingsList.find(s => s.id === settingsId);
    if (settings) {
      const formattedSettings: PrintSettings = {
        ...settings,
        marginTop: Number(settings.marginTop),
        marginBottom: Number(settings.marginBottom),
        marginLeft: Number(settings.marginLeft),
        marginRight: Number(settings.marginRight),
        tableColumnWidths: typeof settings.tableColumnWidths === 'string'
          ? JSON.parse(settings.tableColumnWidths)
          : (settings.tableColumnWidths as any) || [8, 12, 10, 30, 12, 15, 15, 12]
      };
      
      setCurrentSettings(formattedSettings);
      setSelectedSettingsId(settingsId);
      toast({
        title: "تم التحميل",
        description: `تم تحميل إعدادات: ${settings.name}`,
      });
    }
  };

  // دالة الطباعة
  const handlePrint = () => {
    const printContent = document.getElementById('live-report-preview');
    if (printContent) {
      printContent.classList.add('print-content', 'report-preview');
    }
    printWithSettings(currentSettings.reportType, 500);
  };

  // دالة عرض التقرير الحقيقي مع الإعدادات
  const renderReportPreview = () => {
    if (!reportContext) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium">لا توجد بيانات للمعاينة</p>
          <p className="text-sm mt-2">قم بإنشاء تقرير من صفحة التقارير أولاً</p>
        </div>
      );
    }

    console.log('🔍 عرض معاينة التقرير:', reportContext);

    // إذا كان هناك HTML محفوظ من التقرير الأصلي، اعرضه
    if (reportContext.html && reportContext.html.trim()) {
      return (
        <div className="bg-white border rounded-lg overflow-hidden report-html-preview" style={{ direction: 'rtl' }}>
          <style dangerouslySetInnerHTML={{
            __html: `
              .report-html-preview .print-content,
              .report-html-preview .report-preview,
              .report-html-preview .professional-report-container,
              .report-html-preview .daily-report-container {
                font-family: ${currentSettings.fontFamily} !important;
                font-size: ${currentSettings.fontSize}px !important;
                direction: rtl !important;
              }
              .report-html-preview .print-header,
              .report-html-preview h1,
              .report-html-preview h2 {
                background-color: ${currentSettings.headerBackgroundColor} !important;
                color: ${currentSettings.headerTextColor} !important;
                font-size: ${currentSettings.headerFontSize}px !important;
              }
              .report-html-preview table {
                border-color: ${currentSettings.tableBorderColor} !important;
                font-size: ${currentSettings.tableFontSize}px !important;
              }
              .report-html-preview th {
                background-color: ${currentSettings.tableHeaderColor} !important;
                color: ${currentSettings.headerTextColor} !important;
                padding: ${currentSettings.tableCellPadding}px !important;
                border: ${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor} !important;
              }
              .report-html-preview td {
                padding: ${currentSettings.tableCellPadding}px !important;
                border: ${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor} !important;
              }
              .report-html-preview tr:nth-child(even) {
                background-color: ${currentSettings.tableRowEvenColor} !important;
              }
              .report-html-preview tr:nth-child(odd) {
                background-color: ${currentSettings.tableRowOddColor} !important;
              }
              @media print {
                .report-html-preview .print-content,
                .report-html-preview .report-preview {
                  font-family: ${currentSettings.fontFamily} !important;
                  font-size: ${currentSettings.fontSize}px !important;
                }
              }
            `
          }} />
          <div 
            id="live-report-preview"
            dangerouslySetInnerHTML={{ __html: reportContext.html }}
            style={{
              fontFamily: currentSettings.fontFamily,
              fontSize: `${currentSettings.fontSize}px`,
              direction: 'rtl'
            }}
          />
        </div>
      );
    }

    // إذا لم يكن هناك HTML، اعرض رسالة تفصيلية
    return (
      <div className="text-center py-8 bg-yellow-50 rounded-lg border-2 border-dashed border-yellow-300">
        <FileText className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
        <p className="text-yellow-700 font-medium text-lg">تم استقبال التقرير بنجاح</p>
        <p className="text-yellow-600 text-sm mt-2">العنوان: {reportContext.title}</p>
        <p className="text-yellow-600 text-sm">النوع: {reportContext.type}</p>
        <div className="mt-4 p-3 bg-yellow-100 rounded">
          <p className="text-yellow-800 text-xs">محتوى HTML: {reportContext.html?.length || 0} حرف</p>
          <p className="text-yellow-800 text-xs">البيانات: {reportContext.data ? 'متوفرة' : 'غير متوفرة'}</p>
        </div>
      </div>
    );
  };

  // أنواع التقارير المتاحة
  const reportTypes = [
    { value: 'worker_statement', label: 'كشف حساب العامل', icon: <FileText className="h-4 w-4" /> },
    { value: 'supplier_statement', label: 'كشف حساب المورد', icon: <FileText className="h-4 w-4" /> },
    { value: 'daily_expenses', label: 'المصروفات اليومية', icon: <FileText className="h-4 w-4" /> },
    { value: 'material_purchases', label: 'مشتريات المواد', icon: <FileText className="h-4 w-4" /> },
    { value: 'advanced_reports', label: 'التقارير المتقدمة', icon: <FileText className="h-4 w-4" /> }
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl" style={{ direction: 'rtl' }}>
      {/* الرأسية */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => setLocation('/reports')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة للتقارير
          </Button>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              طباعة
            </Button>
            <Button onClick={saveSettings} variant="outline" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              حفظ الإعدادات
            </Button>
            <Button onClick={exportSettings} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              تصدير
            </Button>
            <Button onClick={importSettings} variant="outline" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              استيراد
            </Button>
            <Button onClick={resetSettings} variant="outline" className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              إعادة تعيين
            </Button>
            <Button onClick={duplicateSettings} variant="outline" className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              نسخ الإعداد
            </Button>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            نظام التحكم الشامل في طباعة الكشوف
          </h1>
          <p className="text-gray-600">تحكم كامل في تنسيق وطباعة جميع أنواع التقارير</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* قسم الإعدادات */}
        <div className="space-y-6">
          {/* إدارة الإعدادات المحفوظة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                إدارة الإعدادات المحفوظة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>نوع التقرير</Label>
                <Select 
                  value={currentSettings.reportType} 
                  onValueChange={(value) => updateSetting('reportType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع التقرير" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {type.icon}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>اسم الإعداد</Label>
                <Input
                  value={currentSettings.name}
                  onChange={(e) => updateSetting('name', e.target.value)}
                  placeholder="أدخل اسماً للإعداد"
                />
              </div>

              <div className="space-y-2">
                <Label>الإعدادات المحفوظة</Label>
                <div className="flex gap-2">
                  <Select 
                    value={selectedSettingsId} 
                    onValueChange={loadSettings}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="اختر إعداداً محفوظاً" />
                    </SelectTrigger>
                    <SelectContent>
                      {savedSettingsList.map(setting => (
                        <SelectItem key={setting.id} value={setting.id}>
                          {setting.name} ({setting.reportType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSettingsId && (
                    <Button 
                      onClick={() => deleteSetting(selectedSettingsId)} 
                      variant="outline" 
                      size="sm"
                      className="px-3"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* أزرار التحكم السريع */}
              <div className="flex gap-2 pt-2">
                <Button onClick={saveSettings} size="sm" className="flex-1">
                  <Save className="h-4 w-4 mr-1" />
                  حفظ
                </Button>
                <Button onClick={exportSettings} variant="outline" size="sm" className="flex-1">
                  <Download className="h-4 w-4 mr-1" />
                  تصدير
                </Button>
                <Button onClick={importSettings} variant="outline" size="sm" className="flex-1">
                  <Upload className="h-4 w-4 mr-1" />
                  استيراد
                </Button>
                <Button onClick={resetSettings} variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* لوحة التحكم المتقدم */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                لوحة التحكم المتقدم
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
                    <div className="space-y-2">
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

                    <div className="space-y-2">
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

                  {/* إعدادات الهوامش */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label>الهامش العلوي: {currentSettings.marginTop}مم</Label>
                      <Slider
                        value={[currentSettings.marginTop]}
                        onValueChange={([value]) => updateSetting('marginTop', value)}
                        min={5}
                        max={50}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label>الهامش السفلي: {currentSettings.marginBottom}مم</Label>
                      <Slider
                        value={[currentSettings.marginBottom]}
                        onValueChange={([value]) => updateSetting('marginBottom', value)}
                        min={5}
                        max={50}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label>الهامش الأيمن: {currentSettings.marginRight}مم</Label>
                      <Slider
                        value={[currentSettings.marginRight]}
                        onValueChange={([value]) => updateSetting('marginRight', value)}
                        min={5}
                        max={50}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label>الهامش الأيسر: {currentSettings.marginLeft}مم</Label>
                      <Slider
                        value={[currentSettings.marginLeft]}
                        onValueChange={([value]) => updateSetting('marginLeft', value)}
                        min={5}
                        max={50}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* تبويب الخطوط */}
                <TabsContent value="fonts" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
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
                          <SelectItem value="Tahoma">Tahoma</SelectItem>
                          <SelectItem value="Calibri">Calibri</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>معاينة الخط</Label>
                      <div className="p-3 border rounded-lg bg-gray-50" style={{ fontFamily: currentSettings.fontFamily }}>
                        نموذج النص بالخط المحدد - Sample Text 123
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-3">
                      <Label>حجم الخط العام: {currentSettings.fontSize}px</Label>
                      <Slider
                        value={[currentSettings.fontSize]}
                        onValueChange={([value]) => updateSetting('fontSize', value)}
                        min={8}
                        max={20}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label>حجم خط العناوين: {currentSettings.headerFontSize}px</Label>
                      <Slider
                        value={[currentSettings.headerFontSize]}
                        onValueChange={([value]) => updateSetting('headerFontSize', value)}
                        min={12}
                        max={28}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label>حجم خط الجدول: {currentSettings.tableFontSize}px</Label>
                      <Slider
                        value={[currentSettings.tableFontSize]}
                        onValueChange={([value]) => updateSetting('tableFontSize', value)}
                        min={6}
                        max={16}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* تبويب الألوان */}
                <TabsContent value="colors" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>لون خلفية الرأسية</Label>
                      <Input
                        type="color"
                        value={currentSettings.headerBackgroundColor}
                        onChange={(e) => updateSetting('headerBackgroundColor', e.target.value)}
                        className="h-10"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>لون نص الرأسية</Label>
                      <Input
                        type="color"
                        value={currentSettings.headerTextColor}
                        onChange={(e) => updateSetting('headerTextColor', e.target.value)}
                        className="h-10"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>لون رأس الجدول</Label>
                      <Input
                        type="color"
                        value={currentSettings.tableHeaderColor}
                        onChange={(e) => updateSetting('tableHeaderColor', e.target.value)}
                        className="h-10"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>لون حدود الجدول</Label>
                      <Input
                        type="color"
                        value={currentSettings.tableBorderColor}
                        onChange={(e) => updateSetting('tableBorderColor', e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* تبويب الجدول */}
                <TabsContent value="table" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label>سمك حدود الجدول: {currentSettings.tableBorderWidth}px</Label>
                      <Slider
                        value={[currentSettings.tableBorderWidth]}
                        onValueChange={([value]) => updateSetting('tableBorderWidth', value)}
                        min={0}
                        max={5}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label>حشو الخلايا: {currentSettings.tableCellPadding}مم</Label>
                      <Slider
                        value={[currentSettings.tableCellPadding]}
                        onValueChange={([value]) => updateSetting('tableCellPadding', value)}
                        min={1}
                        max={10}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>لون الصفوف الزوجية</Label>
                      <Input
                        type="color"
                        value={currentSettings.tableRowEvenColor}
                        onChange={(e) => updateSetting('tableRowEvenColor', e.target.value)}
                        className="h-10"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>لون الصفوف الفردية</Label>
                      <Input
                        type="color"
                        value={currentSettings.tableRowOddColor}
                        onChange={(e) => updateSetting('tableRowOddColor', e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* تبويب العناصر */}
                <TabsContent value="elements" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id="show-header"
                        checked={currentSettings.showHeader}
                        onCheckedChange={(checked) => updateSetting('showHeader', checked)}
                      />
                      <Label htmlFor="show-header">إظهار الرأسية</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id="show-logo"
                        checked={currentSettings.showLogo}
                        onCheckedChange={(checked) => updateSetting('showLogo', checked)}
                      />
                      <Label htmlFor="show-logo">إظهار الشعار</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id="show-project-info"
                        checked={currentSettings.showProjectInfo}
                        onCheckedChange={(checked) => updateSetting('showProjectInfo', checked)}
                      />
                      <Label htmlFor="show-project-info">إظهار معلومات المشروع</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id="show-worker-info"
                        checked={currentSettings.showWorkerInfo}
                        onCheckedChange={(checked) => updateSetting('showWorkerInfo', checked)}
                      />
                      <Label htmlFor="show-worker-info">إظهار معلومات العامل</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id="show-attendance"
                        checked={currentSettings.showAttendanceTable}
                        onCheckedChange={(checked) => updateSetting('showAttendanceTable', checked)}
                      />
                      <Label htmlFor="show-attendance">إظهار جدول الحضور</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id="show-transfers"
                        checked={currentSettings.showTransfersTable}
                        onCheckedChange={(checked) => updateSetting('showTransfersTable', checked)}
                      />
                      <Label htmlFor="show-transfers">إظهار جدول الحوالات</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id="show-summary"
                        checked={currentSettings.showSummary}
                        onCheckedChange={(checked) => updateSetting('showSummary', checked)}
                      />
                      <Label htmlFor="show-summary">إظهار الملخص</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id="show-signatures"
                        checked={currentSettings.showSignatures}
                        onCheckedChange={(checked) => updateSetting('showSignatures', checked)}
                      />
                      <Label htmlFor="show-signatures">إظهار التوقيعات</Label>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* قسم المعاينة المباشرة */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  المعاينة المباشرة
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    تحديث
                  </Button>
                  <Button 
                    onClick={() => {
                      const previewElement = document.getElementById('live-report-preview');
                      if (previewElement) {
                        window.print();
                      }
                    }} 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Printer className="h-3 w-3" />
                    معاينة الطباعة
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-white min-h-[500px] overflow-auto shadow-inner">
                {renderReportPreview()}
              </div>
              
              {/* إحصائيات سريعة عن المعاينة */}
              {reportContext && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-blue-800">العنوان</div>
                      <div className="text-blue-600 truncate" title={reportContext.title}>
                        {reportContext.title}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-blue-800">النوع</div>
                      <div className="text-blue-600">{reportContext.type}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-blue-800">حجم المحتوى</div>
                      <div className="text-blue-600">
                        {reportContext.html ? `${Math.round(reportContext.html.length / 1024)} KB` : '0 KB'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-blue-800">الخط المطبق</div>
                      <div className="text-blue-600">{currentSettings.fontFamily} {currentSettings.fontSize}px</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}