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
          <div 
            id="live-report-preview"
            dangerouslySetInnerHTML={{ __html: reportContext.html }}
            style={{
              fontFamily: currentSettings.fontFamily,
              fontSize: `${currentSettings.fontSize}px`,
              direction: 'rtl',
              '--header-bg-color': currentSettings.headerBackgroundColor,
              '--header-text-color': currentSettings.headerTextColor,
              '--table-header-color': currentSettings.tableHeaderColor,
              '--table-even-row': currentSettings.tableRowEvenColor,
              '--table-odd-row': currentSettings.tableRowOddColor,
              '--table-border-color': currentSettings.tableBorderColor,
              '--table-border-width': `${currentSettings.tableBorderWidth}px`,
              '--table-padding': `${currentSettings.tableCellPadding}px`,
              '--font-size': `${currentSettings.fontSize}px`,
              '--header-font-size': `${currentSettings.headerFontSize}px`,
              '--table-font-size': `${currentSettings.tableFontSize}px`
            } as React.CSSProperties}
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
          
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              طباعة
            </Button>
            <Button onClick={saveSettings} variant="outline" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              حفظ الإعدادات
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
                <Select 
                  value={selectedSettingsId} 
                  onValueChange={loadSettings}
                >
                  <SelectTrigger>
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
              </div>
            </CardContent>
          </Card>

          {/* إعدادات سريعة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                الإعدادات الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="space-y-3">
                <Label>حجم الخط: {currentSettings.fontSize}px</Label>
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
                <Label>حجم خط العنوان: {currentSettings.headerFontSize}px</Label>
                <Slider
                  value={[currentSettings.headerFontSize]}
                  onValueChange={([value]) => updateSetting('headerFontSize', value)}
                  min={12}
                  max={28}
                  step={1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* قسم المعاينة المباشرة */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                المعاينة المباشرة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-gray-50 min-h-[500px] overflow-auto">
                {renderReportPreview()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}