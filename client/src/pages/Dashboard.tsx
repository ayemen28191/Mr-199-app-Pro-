import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Palette, Type, Columns, FileText, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { ExportSettings, InsertExportSettings } from '@shared/schema';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, label }) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium">{label}</Label>
    <div className="flex items-center space-x-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
      />
      <Input
        value={value.toUpperCase()}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-sm"
        placeholder="#000000"
      />
    </div>
  </div>
);

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // حالة الإعدادات المحلية
  const [localSettings, setLocalSettings] = useState<Partial<ExportSettings> | null>(null);
  
  // جلب الإعدادات الحالية
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['/api/export-settings'],
    select: (data: ExportSettings[]) => data.find(s => s.isDefault) || data[0] || null,
  });

  // عرض الأخطاء في حالة فشل جلب الإعدادات
  React.useEffect(() => {
    if (error) {
      toast({
        title: "❌ خطأ في جلب الإعدادات",
        description: "حدث خطأ أثناء جلب إعدادات التصدير. سيتم استخدام الإعدادات الافتراضية.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // mutation لحفظ الإعدادات
  const saveSettingsMutation = useMutation({
    mutationFn: (data: Partial<InsertExportSettings>) => 
      settings?.id 
        ? apiRequest(`/api/export-settings/${settings.id}`, { method: 'PUT', body: data })
        : apiRequest('/api/export-settings', { method: 'POST', body: { ...data, isDefault: true } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/export-settings'] });
      toast({
        title: "✅ تم الحفظ بنجاح",
        description: "تم حفظ إعدادات التصدير بنجاح",
      });
      setLocalSettings(null);
    },
    onError: () => {
      toast({
        title: "❌ خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive",
      });
    },
  });

  // دالة لتحديث الإعدادات المحلية
  const updateSetting = (key: keyof ExportSettings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // دالة لإعادة تعيين الإعدادات
  const resetSettings = () => {
    setLocalSettings(null);
  };

  // دالة للحفظ
  const handleSave = () => {
    if (!localSettings || Object.keys(localSettings).length === 0) {
      toast({
        title: "⚠️ لا توجد تغييرات",
        description: "لم يتم إجراء أي تغييرات لحفظها",
      });
      return;
    }
    saveSettingsMutation.mutate(localSettings);
  };

  // الحصول على القيم الحالية (الإعدادات المحفوظة + التغييرات المحلية)
  const getCurrentValue = (key: keyof ExportSettings) => {
    return localSettings?.[key] ?? settings?.[key];
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">جاري تحميل لوحة التحكم...</div>
      </div>
    );
  }

  const hasChanges = localSettings && Object.keys(localSettings).length > 0;

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8" />
            لوحة التحكم
          </h1>
          <p className="text-muted-foreground mt-2">
            إدارة إعدادات التصدير وتخصيص مظهر التقارير
          </p>
        </div>
        
        {/* أزرار الحفظ والإعادة */}
        <div className="flex gap-2">
          {hasChanges && (
            <>
              <Button
                variant="outline"
                onClick={resetSettings}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                إعادة تعيين
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveSettingsMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saveSettingsMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* مؤشر التغييرات */}
      {hasChanges && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">تغييرات غير محفوظة</Badge>
              <span className="text-sm text-muted-foreground">
                لديك {Object.keys(localSettings).length} تغيير غير محفوظ
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* تبويبات الإعدادات */}
      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            الألوان
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            النصوص
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Columns className="w-4 h-4" />
            التخطيط
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            المحتوى
          </TabsTrigger>
        </TabsList>

        {/* تبويب الألوان */}
        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الألوان</CardTitle>
              <CardDescription>
                تخصيص ألوان الجداول والعناصر في تقارير التصدير
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ColorPicker
                  label="لون خلفية الرأس"
                  value={getCurrentValue('headerBackgroundColor') || '#F3F4F6'}
                  onChange={(value) => updateSetting('headerBackgroundColor', value)}
                />
                <ColorPicker
                  label="لون نص الرأس"
                  value={getCurrentValue('headerTextColor') || '#000000'}
                  onChange={(value) => updateSetting('headerTextColor', value)}
                />
                <ColorPicker
                  label="لون خلفية رأس الجدول"
                  value={getCurrentValue('tableHeaderBackgroundColor') || '#3B82F6'}
                  onChange={(value) => updateSetting('tableHeaderBackgroundColor', value)}
                />
                <ColorPicker
                  label="لون نص رأس الجدول"
                  value={getCurrentValue('tableHeaderTextColor') || '#FFFFFF'}
                  onChange={(value) => updateSetting('tableHeaderTextColor', value)}
                />
                <ColorPicker
                  label="لون صفوف التحويلات"
                  value={getCurrentValue('transferRowColor') || '#B8E6B8'}
                  onChange={(value) => updateSetting('transferRowColor', value)}
                />
                <ColorPicker
                  label="لون صفوف العمال"
                  value={getCurrentValue('workerRowColor') || '#E6F3FF'}
                  onChange={(value) => updateSetting('workerRowColor', value)}
                />
                <ColorPicker
                  label="لون الصفوف الزوجية"
                  value={getCurrentValue('evenRowColor') || '#F9FAFB'}
                  onChange={(value) => updateSetting('evenRowColor', value)}
                />
                <ColorPicker
                  label="لون الصفوف الفردية"
                  value={getCurrentValue('oddRowColor') || '#FFFFFF'}
                  onChange={(value) => updateSetting('oddRowColor', value)}
                />
                <ColorPicker
                  label="لون الحدود"
                  value={getCurrentValue('borderColor') || '#000000'}
                  onChange={(value) => updateSetting('borderColor', value)}
                />
                <ColorPicker
                  label="لون الرصيد السالب"
                  value={getCurrentValue('negativeBalanceColor') || '#EF4444'}
                  onChange={(value) => updateSetting('negativeBalanceColor', value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب النصوص */}
        <TabsContent value="text" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات النصوص</CardTitle>
              <CardDescription>
                تخصيص النصوص الثابتة وعناوين الأعمدة في التقارير
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>اسم الشركة</Label>
                  <Input
                    value={getCurrentValue('companyName') || ''}
                    onChange={(e) => updateSetting('companyName', e.target.value)}
                    placeholder="شركة الفتحي للمقاولات والاستشارات الهندسية"
                  />
                </div>
                <div className="space-y-2">
                  <Label>عنوان التقرير</Label>
                  <Input
                    value={getCurrentValue('reportTitle') || ''}
                    onChange={(e) => updateSetting('reportTitle', e.target.value)}
                    placeholder="كشف حساب المشروع"
                  />
                </div>
                <div className="space-y-2">
                  <Label>تسمية التاريخ</Label>
                  <Input
                    value={getCurrentValue('dateLabel') || ''}
                    onChange={(e) => updateSetting('dateLabel', e.target.value)}
                    placeholder="التاريخ:"
                  />
                </div>
                <div className="space-y-2">
                  <Label>تسمية المشروع</Label>
                  <Input
                    value={getCurrentValue('projectLabel') || ''}
                    onChange={(e) => updateSetting('projectLabel', e.target.value)}
                    placeholder="المشروع:"
                  />
                </div>
                <div className="space-y-2">
                  <Label>تسمية تاريخ الطباعة</Label>
                  <Input
                    value={getCurrentValue('printDateLabel') || ''}
                    onChange={(e) => updateSetting('printDateLabel', e.target.value)}
                    placeholder="تاريخ الطباعة:"
                  />
                </div>
                <div className="space-y-2">
                  <Label>وحدة العملة</Label>
                  <Input
                    value={getCurrentValue('currencyUnit') || ''}
                    onChange={(e) => updateSetting('currencyUnit', e.target.value)}
                    placeholder="ريال"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">عناوين الأعمدة</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>عمود الرقم المسلسل</Label>
                    <Input
                      value={getCurrentValue('serialColumnHeader') || ''}
                      onChange={(e) => updateSetting('serialColumnHeader', e.target.value)}
                      placeholder="م"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>عمود التاريخ</Label>
                    <Input
                      value={getCurrentValue('dateColumnHeader') || ''}
                      onChange={(e) => updateSetting('dateColumnHeader', e.target.value)}
                      placeholder="التاريخ"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>عمود اسم الحساب</Label>
                    <Input
                      value={getCurrentValue('accountColumnHeader') || ''}
                      onChange={(e) => updateSetting('accountColumnHeader', e.target.value)}
                      placeholder="اسم الحساب"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>عمود الدائن</Label>
                    <Input
                      value={getCurrentValue('creditColumnHeader') || ''}
                      onChange={(e) => updateSetting('creditColumnHeader', e.target.value)}
                      placeholder="دائن"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>عمود المدين</Label>
                    <Input
                      value={getCurrentValue('debitColumnHeader') || ''}
                      onChange={(e) => updateSetting('debitColumnHeader', e.target.value)}
                      placeholder="مدين"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>عمود الرصيد</Label>
                    <Input
                      value={getCurrentValue('balanceColumnHeader') || ''}
                      onChange={(e) => updateSetting('balanceColumnHeader', e.target.value)}
                      placeholder="الرصيد"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>عمود البيان</Label>
                    <Input
                      value={getCurrentValue('notesColumnHeader') || ''}
                      onChange={(e) => updateSetting('notesColumnHeader', e.target.value)}
                      placeholder="البيان"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب التخطيط */}
        <TabsContent value="layout" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات التخطيط</CardTitle>
              <CardDescription>
                تخصيص أبعاد الأعمدة والصفوف وإعدادات الخط
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">أعرض الأعمدة (بالبكسل)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>عرض عمود الرقم المسلسل</Label>
                    <Input
                      type="number"
                      value={getCurrentValue('serialColumnWidth') || 40}
                      onChange={(e) => updateSetting('serialColumnWidth', parseInt(e.target.value))}
                      min="20"
                      max="200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>عرض عمود التاريخ</Label>
                    <Input
                      type="number"
                      value={getCurrentValue('dateColumnWidth') || 80}
                      onChange={(e) => updateSetting('dateColumnWidth', parseInt(e.target.value))}
                      min="50"
                      max="300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>عرض عمود اسم الحساب</Label>
                    <Input
                      type="number"
                      value={getCurrentValue('accountColumnWidth') || 200}
                      onChange={(e) => updateSetting('accountColumnWidth', parseInt(e.target.value))}
                      min="100"
                      max="500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>عرض عمود الدائن</Label>
                    <Input
                      type="number"
                      value={getCurrentValue('creditColumnWidth') || 80}
                      onChange={(e) => updateSetting('creditColumnWidth', parseInt(e.target.value))}
                      min="50"
                      max="200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>عرض عمود المدين</Label>
                    <Input
                      type="number"
                      value={getCurrentValue('debitColumnWidth') || 80}
                      onChange={(e) => updateSetting('debitColumnWidth', parseInt(e.target.value))}
                      min="50"
                      max="200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>عرض عمود الرصيد</Label>
                    <Input
                      type="number"
                      value={getCurrentValue('balanceColumnWidth') || 80}
                      onChange={(e) => updateSetting('balanceColumnWidth', parseInt(e.target.value))}
                      min="50"
                      max="200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>عرض عمود البيان</Label>
                    <Input
                      type="number"
                      value={getCurrentValue('notesColumnWidth') || 250}
                      onChange={(e) => updateSetting('notesColumnWidth', parseInt(e.target.value))}
                      min="100"
                      max="500"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">إعدادات الصفوف</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={getCurrentValue('autoRowHeight') || true}
                        onCheckedChange={(checked) => updateSetting('autoRowHeight', checked)}
                      />
                      <Label>ارتفاع تلقائي للصفوف</Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>الحد الأدنى لارتفاع الصف</Label>
                    <Input
                      type="number"
                      value={getCurrentValue('minRowHeight') || 18}
                      onChange={(e) => updateSetting('minRowHeight', parseInt(e.target.value))}
                      min="15"
                      max="50"
                      disabled={getCurrentValue('autoRowHeight')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الحد الأقصى لارتفاع الصف</Label>
                    <Input
                      type="number"
                      value={getCurrentValue('maxRowHeight') || 100}
                      onChange={(e) => updateSetting('maxRowHeight', parseInt(e.target.value))}
                      min="50"
                      max="200"
                      disabled={getCurrentValue('autoRowHeight')}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">إعدادات الخط</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>نوع الخط</Label>
                    <Input
                      value={getCurrentValue('fontFamily') || 'Arial Unicode MS'}
                      onChange={(e) => updateSetting('fontFamily', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>حجم الخط العام</Label>
                    <Input
                      type="number"
                      value={getCurrentValue('fontSize') || 10}
                      onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                      min="8"
                      max="20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>حجم خط الرأس</Label>
                    <Input
                      type="number"
                      value={getCurrentValue('headerFontSize') || 12}
                      onChange={(e) => updateSetting('headerFontSize', parseInt(e.target.value))}
                      min="10"
                      max="24"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>حجم خط الجدول</Label>
                    <Input
                      type="number"
                      value={getCurrentValue('tableFontSize') || 10}
                      onChange={(e) => updateSetting('tableFontSize', parseInt(e.target.value))}
                      min="8"
                      max="16"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب المحتوى */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات المحتوى</CardTitle>
              <CardDescription>
                إعدادات إضافية للنص والتنسيق
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={getCurrentValue('enableTextWrapping') || true}
                      onCheckedChange={(checked) => updateSetting('enableTextWrapping', checked)}
                    />
                    <Label>تفعيل التفاف النص</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>سماكة الحدود</Label>
                  <Input
                    type="number"
                    value={getCurrentValue('borderWidth') || 1}
                    onChange={(e) => updateSetting('borderWidth', parseInt(e.target.value))}
                    min="1"
                    max="5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}