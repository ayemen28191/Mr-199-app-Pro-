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

interface PrintSettings {
  id?: string;
  reportType: string;
  name: string;
  
  // إعدادات الصفحة
  pageSize: string;
  pageOrientation: string;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  
  // إعدادات الخطوط
  fontFamily: string;
  fontSize: number;
  headerFontSize: number;
  tableFontSize: number;
  
  // إعدادات الألوان
  headerBackgroundColor: string;
  headerTextColor: string;
  tableHeaderColor: string;
  tableRowEvenColor: string;
  tableRowOddColor: string;
  tableBorderColor: string;
  
  // إعدادات الجدول
  tableBorderWidth: number;
  tableCellPadding: number;
  tableColumnWidths?: number[];
  
  // إعدادات العناصر المرئية
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
  isPublic?: boolean;
}

const defaultSettings: PrintSettings = {
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
  isPublic: false,
};

export default function PrintControlPage() {
  const [currentSettings, setCurrentSettings] = useState<PrintSettings>(defaultSettings);
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

  // جلب إعدادات الطباعة المحفوظة
  const { data: savedSettingsList = [], refetch: refetchSettings } = useQuery({
    queryKey: ['/api/print-settings'],
  });

  // طفرة لحفظ الإعدادات
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<PrintSettings>) => {
      if (settings.id) {
        return apiRequest(`/api/print-settings/${settings.id}`, 'PUT', settings);
      } else {
        return apiRequest('/api/print-settings', 'POST', settings);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/print-settings'] });
      toast({
        title: "✅ تم الحفظ",
        description: "تم حفظ الإعدادات بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "❌ خطأ",
        description: "فشل في حفظ الإعدادات",
      });
    }
  });

  // طفرة لحذف الإعدادات
  const deleteSettingsMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/print-settings/${id}`, 'DELETE');
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
    const settingsToSave = {
      ...currentSettings,
      id: selectedSettingsId || undefined,
      // تحويل الهوامش إلى strings مع التنسيق الصحيح
      marginTop: currentSettings.marginTop.toString(),
      marginBottom: currentSettings.marginBottom.toString(),
      marginLeft: currentSettings.marginLeft.toString(),
      marginRight: currentSettings.marginRight.toString(),
      // التأكد من tableColumnWidths كـ string
      tableColumnWidths: Array.isArray(currentSettings.tableColumnWidths) 
        ? JSON.stringify(currentSettings.tableColumnWidths)
        : currentSettings.tableColumnWidths
    };
    
    saveSettingsMutation.mutate(settingsToSave);
  };

  // دالة تحميل إعدادات محفوظة
  const loadSettings = (settingsId: string) => {
    const settings = savedSettingsList.find((s: any) => s.id === settingsId);
    if (settings) {
      // تحويل البيانات المحملة للنسق الصحيح
      const formattedSettings = {
        ...settings,
        marginTop: parseFloat(settings.marginTop),
        marginBottom: parseFloat(settings.marginBottom),
        marginLeft: parseFloat(settings.marginLeft),
        marginRight: parseFloat(settings.marginRight),
        tableColumnWidths: typeof settings.tableColumnWidths === 'string' 
          ? JSON.parse(settings.tableColumnWidths)
          : settings.tableColumnWidths
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
              
              <Separator />
              
              <div className="space-y-2">
                <Label>الإعدادات المحفوظة</Label>
                {savedSettingsList.map((settings: any) => (
                  <div key={settings.id} className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => loadSettings(settings.id)}
                    >
                      {settings.name}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteSettingsMutation.mutate(settings.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
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
                onClick={() => setCurrentSettings(defaultSettings)}
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
            className={`border rounded-lg p-4 bg-white ${previewMode === 'print' ? 'print-preview-mode' : ''}`}
            style={{
              fontFamily: currentSettings.fontFamily,
              fontSize: `${currentSettings.fontSize}px`,
              direction: 'rtl'
            }}
          >
            {/* المحتوى التجريبي للمعاينة */}
            {currentSettings.showHeader && (
              <div 
                className="print-header mb-4 p-4 rounded text-center"
                style={{
                  backgroundColor: currentSettings.headerBackgroundColor,
                  color: currentSettings.headerTextColor,
                  fontSize: `${currentSettings.headerFontSize}px`
                }}
              >
                <h1>كشف حساب العامل التفصيلي والشامل</h1>
                <p>تقرير حضور العمال ومستحقاتهم المالية</p>
              </div>
            )}

            {currentSettings.showProjectInfo && (
              <div className="project-info mb-4 p-3 bg-gray-50 rounded">
                <h3 className="font-bold mb-2">معلومات المشروع</h3>
                <p>اسم المشروع: مشروع تجريبي</p>
                <p>الفترة: من 2025-08-01 إلى 2025-08-03</p>
              </div>
            )}

            {currentSettings.showWorkerInfo && (
              <div className="worker-info mb-4 p-3 bg-blue-50 rounded">
                <h3 className="font-bold mb-2">معلومات العامل</h3>
                <p>الاسم: عامل تجريبي</p>
                <p>النوع: معلم</p>
                <p>الأجر اليومي: 15,000 ر.ي</p>
              </div>
            )}

            {currentSettings.showAttendanceTable && (
              <table 
                className="print-table w-full mb-4"
                style={{
                  fontSize: `${currentSettings.tableFontSize}px`,
                  borderCollapse: 'collapse'
                }}
              >
                <thead>
                  <tr>
                    <th 
                      style={{
                        backgroundColor: currentSettings.tableHeaderColor,
                        color: 'white',
                        border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}`,
                        padding: `${currentSettings.tableCellPadding}mm`
                      }}
                    >
                      م
                    </th>
                    <th 
                      style={{
                        backgroundColor: currentSettings.tableHeaderColor,
                        color: 'white',
                        border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}`,
                        padding: `${currentSettings.tableCellPadding}mm`
                      }}
                    >
                      التاريخ
                    </th>
                    <th 
                      style={{
                        backgroundColor: currentSettings.tableHeaderColor,
                        color: 'white',
                        border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}`,
                        padding: `${currentSettings.tableCellPadding}mm`
                      }}
                    >
                      وصف العمل
                    </th>
                    <th 
                      style={{
                        backgroundColor: currentSettings.tableHeaderColor,
                        color: 'white',
                        border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}`,
                        padding: `${currentSettings.tableCellPadding}mm`
                      }}
                    >
                      المستحق
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td 
                      style={{
                        backgroundColor: currentSettings.tableRowEvenColor,
                        border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}`,
                        padding: `${currentSettings.tableCellPadding}mm`,
                        textAlign: 'center'
                      }}
                    >
                      1
                    </td>
                    <td 
                      style={{
                        backgroundColor: currentSettings.tableRowEvenColor,
                        border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}`,
                        padding: `${currentSettings.tableCellPadding}mm`,
                        textAlign: 'center'
                      }}
                    >
                      2025-08-01
                    </td>
                    <td 
                      style={{
                        backgroundColor: currentSettings.tableRowEvenColor,
                        border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}`,
                        padding: `${currentSettings.tableCellPadding}mm`,
                        textAlign: 'center'
                      }}
                    >
                      أعمال البناء والتشطيب
                    </td>
                    <td 
                      style={{
                        backgroundColor: currentSettings.tableRowEvenColor,
                        border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}`,
                        padding: `${currentSettings.tableCellPadding}mm`,
                        textAlign: 'center'
                      }}
                    >
                      15,000 ر.ي
                    </td>
                  </tr>
                  <tr>
                    <td 
                      style={{
                        backgroundColor: currentSettings.tableRowOddColor,
                        border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}`,
                        padding: `${currentSettings.tableCellPadding}mm`,
                        textAlign: 'center'
                      }}
                    >
                      2
                    </td>
                    <td 
                      style={{
                        backgroundColor: currentSettings.tableRowOddColor,
                        border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}`,
                        padding: `${currentSettings.tableCellPadding}mm`,
                        textAlign: 'center'
                      }}
                    >
                      2025-08-02
                    </td>
                    <td 
                      style={{
                        backgroundColor: currentSettings.tableRowOddColor,
                        border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}`,
                        padding: `${currentSettings.tableCellPadding}mm`,
                        textAlign: 'center'
                      }}
                    >
                      أعمال الدهان والتركيب
                    </td>
                    <td 
                      style={{
                        backgroundColor: currentSettings.tableRowOddColor,
                        border: `${currentSettings.tableBorderWidth}px solid ${currentSettings.tableBorderColor}`,
                        padding: `${currentSettings.tableCellPadding}mm`,
                        textAlign: 'center'
                      }}
                    >
                      15,000 ر.ي
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {currentSettings.showSummary && (
              <div className="summary-section p-4 bg-green-50 rounded">
                <h3 className="font-bold mb-2">الملخص المالي</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>إجمالي المستحق: 30,000 ر.ي</div>
                  <div>إجمالي المدفوع: 20,000 ر.ي</div>
                  <div>الرصيد المتبقي: 10,000 ر.ي</div>
                  <div>عدد أيام العمل: 2</div>
                </div>
              </div>
            )}

            {currentSettings.showSignatures && (
              <div className="signatures-section mt-6 pt-4 border-t">
                <div className="grid grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="border-b border-gray-400 mb-2 pb-8"></div>
                    <p>توقيع العامل</p>
                  </div>
                  <div>
                    <div className="border-b border-gray-400 mb-2 pb-8"></div>
                    <p>توقيع المسؤول</p>
                  </div>
                  <div>
                    <div className="border-b border-gray-400 mb-2 pb-8"></div>
                    <p>ختم الشركة</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}