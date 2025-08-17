/**
 * الوصف: صفحة إعدادات التصدير والطباعة المحسنة
 * المدخلات: تخصيص إعدادات التصدير والطباعة
 * المخرجات: حفظ الإعدادات وتطبيقها على التقارير
 * المالك: عمار
 * آخر تعديل: 2025-08-17
 * الحالة: نسخة محسنة
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, RefreshCw, Settings, Palette, Type, Layout, Eye } from "lucide-react";
import type { ExportSettings, InsertExportSettings } from "@shared/schema";

export default function ReportTemplateSettingsEnhanced() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // حالات النموذج
  const [formData, setFormData] = useState<Partial<InsertExportSettings>>({
    name: 'إعدادات افتراضية',
    isDefault: false,
    headerBackgroundColor: '#F3F4F6',
    headerTextColor: '#000000',
    tableHeaderBackgroundColor: '#3B82F6',
    tableHeaderTextColor: '#FFFFFF',
    transferRowColor: '#B8E6B8',
    workerRowColor: '#E6F3FF',
    evenRowColor: '#F9FAFB',
    oddRowColor: '#FFFFFF',
    borderColor: '#000000',
    negativeBalanceColor: '#EF4444',
    companyName: 'شركة الفتحي للمقاولات والاستشارات الهندسية',
    reportTitle: 'كشف حساب المشروع',
    dateLabel: 'التاريخ:',
    projectLabel: 'المشروع:',
    printDateLabel: 'تاريخ الطباعة:',
    serialColumnHeader: 'م',
    dateColumnHeader: 'التاريخ',
    accountColumnHeader: 'اسم الحساب',
    creditColumnHeader: 'دائن',
    debitColumnHeader: 'مدين',
    balanceColumnHeader: 'الرصيد',
    notesColumnHeader: 'البيان',
    currencyUnit: 'ريال',
    serialColumnWidth: 40,
    dateColumnWidth: 80,
    accountColumnWidth: 200,
    creditColumnWidth: 80,
    debitColumnWidth: 80,
    balanceColumnWidth: 80,
    notesColumnWidth: 250,
    autoRowHeight: true,
    minRowHeight: 18,
    maxRowHeight: 100,
    fontFamily: 'Arial Unicode MS',
    fontSize: 10,
    headerFontSize: 12,
    tableFontSize: 10,
    enableTextWrapping: true,
    borderWidth: 1,
  });

  // جلب الإعدادات الحالية
  const { data: settings, isLoading } = useQuery<ExportSettings[]>({
    queryKey: ["/api/export-settings"],
  });

  // جلب الإعدادات الافتراضية
  useEffect(() => {
    if (settings && settings.length > 0) {
      const defaultSetting = settings.find(s => s.isDefault) || settings[0];
      setFormData(defaultSetting);
    }
  }, [settings]);

  // طفرة الحفظ
  const saveMutation = useMutation({
    mutationFn: async (data: InsertExportSettings) => {
      const response = await fetch("/api/export-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "خطأ في حفظ الإعدادات");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/export-settings"] });
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ إعدادات التصدير بنجاح",
      });
    },
    onError: (error: Error) => {
      console.error("خطأ في حفظ الإعدادات:", error);
      toast({
        title: "خطأ في الحفظ",
        description: error.message || "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive",
      });
    },
  });

  // طفرة التحديث
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertExportSettings> & { id: string }) => {
      const { id, ...updateData } = data;
      const response = await fetch(`/api/export-settings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "خطأ في تحديث الإعدادات");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/export-settings"] });
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث إعدادات التصدير بنجاح",
      });
    },
    onError: (error: Error) => {
      console.error("خطأ في تحديث الإعدادات:", error);
      toast({
        title: "خطأ في التحديث",
        description: error.message || "حدث خطأ أثناء تحديث الإعدادات",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!formData.name?.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم الإعدادات",
        variant: "destructive",
      });
      return;
    }

    if (settings && settings.length > 0) {
      // تحديث الإعدادات الافتراضية الموجودة
      const defaultSetting = settings.find(s => s.isDefault) || settings[0];
      if (defaultSetting) {
        updateMutation.mutate({ ...formData, id: defaultSetting.id });
      } else {
        saveMutation.mutate(formData as InsertExportSettings);
      }
    } else {
      // إنشاء إعدادات جديدة
      saveMutation.mutate(formData as InsertExportSettings);
    }
  };

  const handleInputChange = (field: keyof InsertExportSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl" dir="rtl">
        <Card className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>جاري تحميل الإعدادات...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            عودة
          </Button>
          <div>
            <h1 className="text-2xl font-bold">إدارة إعدادات التصدير والطباعة</h1>
            <p className="text-muted-foreground">تخصيص النصوص والألوان وإعدادات التقارير</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Settings className="h-3 w-3" />
            تعديل متقدم
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="colors" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            الألوان
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            النصوص
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            التخطيط
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            المعاينة
          </TabsTrigger>
        </TabsList>

        {/* إعدادات الألوان */}
        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الألوان</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="headerBg">لون خلفية الرأس</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="headerBg"
                      type="color"
                      value={formData.headerBackgroundColor}
                      onChange={(e) => handleInputChange('headerBackgroundColor', e.target.value)}
                      className="h-10 w-16"
                    />
                    <Input
                      value={formData.headerBackgroundColor}
                      onChange={(e) => handleInputChange('headerBackgroundColor', e.target.value)}
                      className="flex-1"
                      placeholder="#F3F4F6"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headerText">لون نص الرأس</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="headerText"
                      type="color"
                      value={formData.headerTextColor}
                      onChange={(e) => handleInputChange('headerTextColor', e.target.value)}
                      className="h-10 w-16"
                    />
                    <Input
                      value={formData.headerTextColor}
                      onChange={(e) => handleInputChange('headerTextColor', e.target.value)}
                      className="flex-1"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tableHeaderBg">لون خلفية عناوين الجدول</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="tableHeaderBg"
                      type="color"
                      value={formData.tableHeaderBackgroundColor}
                      onChange={(e) => handleInputChange('tableHeaderBackgroundColor', e.target.value)}
                      className="h-10 w-16"
                    />
                    <Input
                      value={formData.tableHeaderBackgroundColor}
                      onChange={(e) => handleInputChange('tableHeaderBackgroundColor', e.target.value)}
                      className="flex-1"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tableHeaderText">لون نص عناوين الجدول</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="tableHeaderText"
                      type="color"
                      value={formData.tableHeaderTextColor}
                      onChange={(e) => handleInputChange('tableHeaderTextColor', e.target.value)}
                      className="h-10 w-16"
                    />
                    <Input
                      value={formData.tableHeaderTextColor}
                      onChange={(e) => handleInputChange('tableHeaderTextColor', e.target.value)}
                      className="flex-1"
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transferRow">لون صفوف التحويلات</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="transferRow"
                      type="color"
                      value={formData.transferRowColor}
                      onChange={(e) => handleInputChange('transferRowColor', e.target.value)}
                      className="h-10 w-16"
                    />
                    <Input
                      value={formData.transferRowColor}
                      onChange={(e) => handleInputChange('transferRowColor', e.target.value)}
                      className="flex-1"
                      placeholder="#B8E6B8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workerRow">لون صفوف العمال</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="workerRow"
                      type="color"
                      value={formData.workerRowColor}
                      onChange={(e) => handleInputChange('workerRowColor', e.target.value)}
                      className="h-10 w-16"
                    />
                    <Input
                      value={formData.workerRowColor}
                      onChange={(e) => handleInputChange('workerRowColor', e.target.value)}
                      className="flex-1"
                      placeholder="#E6F3FF"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* إعدادات النصوص */}
        <TabsContent value="text">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات النصوص والعناوين</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="settingsName">اسم الإعدادات</Label>
                  <Input
                    id="settingsName"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="اسم مجموعة الإعدادات"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">اسم الشركة</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="اسم الشركة"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reportTitle">عنوان التقرير</Label>
                  <Input
                    id="reportTitle"
                    value={formData.reportTitle}
                    onChange={(e) => handleInputChange('reportTitle', e.target.value)}
                    placeholder="عنوان التقرير"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currencyUnit">وحدة العملة</Label>
                  <Input
                    id="currencyUnit"
                    value={formData.currencyUnit}
                    onChange={(e) => handleInputChange('currencyUnit', e.target.value)}
                    placeholder="ريال"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serialHeader">عنوان عمود الرقم المسلسل</Label>
                  <Input
                    id="serialHeader"
                    value={formData.serialColumnHeader}
                    onChange={(e) => handleInputChange('serialColumnHeader', e.target.value)}
                    placeholder="م"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateHeader">عنوان عمود التاريخ</Label>
                  <Input
                    id="dateHeader"
                    value={formData.dateColumnHeader}
                    onChange={(e) => handleInputChange('dateColumnHeader', e.target.value)}
                    placeholder="التاريخ"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountHeader">عنوان عمود الحساب</Label>
                  <Input
                    id="accountHeader"
                    value={formData.accountColumnHeader}
                    onChange={(e) => handleInputChange('accountColumnHeader', e.target.value)}
                    placeholder="اسم الحساب"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creditHeader">عنوان عمود الدائن</Label>
                  <Input
                    id="creditHeader"
                    value={formData.creditColumnHeader}
                    onChange={(e) => handleInputChange('creditColumnHeader', e.target.value)}
                    placeholder="دائن"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="debitHeader">عنوان عمود المدين</Label>
                  <Input
                    id="debitHeader"
                    value={formData.debitColumnHeader}
                    onChange={(e) => handleInputChange('debitColumnHeader', e.target.value)}
                    placeholder="مدين"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="balanceHeader">عنوان عمود الرصيد</Label>
                  <Input
                    id="balanceHeader"
                    value={formData.balanceColumnHeader}
                    onChange={(e) => handleInputChange('balanceColumnHeader', e.target.value)}
                    placeholder="الرصيد"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* إعدادات التخطيط */}
        <TabsContent value="layout">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات التخطيط والخطوط</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fontFamily">نوع الخط</Label>
                  <Select value={formData.fontFamily} onValueChange={(value) => handleInputChange('fontFamily', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الخط" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arial Unicode MS">Arial Unicode MS</SelectItem>
                      <SelectItem value="Tahoma">Tahoma</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Calibri">Calibri</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fontSize">حجم الخط الأساسي</Label>
                  <Input
                    id="fontSize"
                    type="number"
                    min="8"
                    max="16"
                    value={formData.fontSize}
                    onChange={(e) => handleInputChange('fontSize', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headerFontSize">حجم خط الرأس</Label>
                  <Input
                    id="headerFontSize"
                    type="number"
                    min="10"
                    max="20"
                    value={formData.headerFontSize}
                    onChange={(e) => handleInputChange('headerFontSize', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tableFontSize">حجم خط الجدول</Label>
                  <Input
                    id="tableFontSize"
                    type="number"
                    min="8"
                    max="14"
                    value={formData.tableFontSize}
                    onChange={(e) => handleInputChange('tableFontSize', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="borderWidth">عرض الحدود</Label>
                  <Input
                    id="borderWidth"
                    type="number"
                    min="0"
                    max="3"
                    value={formData.borderWidth}
                    onChange={(e) => handleInputChange('borderWidth', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>تفعيل تلقائي لارتفاع الصفوف</Label>
                    <p className="text-sm text-muted-foreground">
                      يسمح بتعديل ارتفاع الصفوف تلقائياً حسب المحتوى
                    </p>
                  </div>
                  <Switch
                    checked={formData.autoRowHeight}
                    onCheckedChange={(checked) => handleInputChange('autoRowHeight', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>تفعيل التفاف النص</Label>
                    <p className="text-sm text-muted-foreground">
                      يسمح بالتفاف النص داخل الخلايا
                    </p>
                  </div>
                  <Switch
                    checked={formData.enableTextWrapping}
                    onCheckedChange={(checked) => handleInputChange('enableTextWrapping', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>إعدادات افتراضية</Label>
                    <p className="text-sm text-muted-foreground">
                      تعيين هذه الإعدادات كافتراضية لجميع التقارير
                    </p>
                  </div>
                  <Switch
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => handleInputChange('isDefault', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* المعاينة */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>معاينة التصميم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-white">
                <div 
                  className="text-center p-3 rounded-t-lg"
                  style={{ 
                    backgroundColor: formData.headerBackgroundColor,
                    color: formData.headerTextColor,
                    fontSize: `${formData.headerFontSize}px`,
                    fontFamily: formData.fontFamily
                  }}
                >
                  <h3 className="font-bold">{formData.companyName}</h3>
                  <p className="mt-1">{formData.reportTitle}</p>
                </div>
                
                <div className="mt-4">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ 
                        backgroundColor: formData.tableHeaderBackgroundColor,
                        color: formData.tableHeaderTextColor,
                        fontSize: `${formData.tableFontSize}px`,
                        fontFamily: formData.fontFamily
                      }}>
                        <th className="border p-2 text-center">{formData.serialColumnHeader}</th>
                        <th className="border p-2">{formData.dateColumnHeader}</th>
                        <th className="border p-2">{formData.accountColumnHeader}</th>
                        <th className="border p-2">{formData.creditColumnHeader}</th>
                        <th className="border p-2">{formData.debitColumnHeader}</th>
                        <th className="border p-2">{formData.balanceColumnHeader}</th>
                      </tr>
                    </thead>
                    <tbody style={{ 
                      fontSize: `${formData.tableFontSize}px`,
                      fontFamily: formData.fontFamily
                    }}>
                      <tr style={{ backgroundColor: formData.transferRowColor }}>
                        <td className="border p-2 text-center">1</td>
                        <td className="border p-2">2025-08-17</td>
                        <td className="border p-2">تحويل عهدة</td>
                        <td className="border p-2 text-center">10,000 {formData.currencyUnit}</td>
                        <td className="border p-2 text-center">-</td>
                        <td className="border p-2 text-center">10,000 {formData.currencyUnit}</td>
                      </tr>
                      <tr style={{ backgroundColor: formData.workerRowColor }}>
                        <td className="border p-2 text-center">2</td>
                        <td className="border p-2">2025-08-17</td>
                        <td className="border p-2">أجور عمال</td>
                        <td className="border p-2 text-center">-</td>
                        <td className="border p-2 text-center">5,000 {formData.currencyUnit}</td>
                        <td className="border p-2 text-center">5,000 {formData.currencyUnit}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* أزرار الحفظ */}
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={() => setLocation("/")}>
          إلغاء
        </Button>
        <Button 
          onClick={handleSave}
          disabled={saveMutation.isPending || updateMutation.isPending}
          className="flex items-center gap-2"
        >
          {(saveMutation.isPending || updateMutation.isPending) ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          حفظ الإعدادات
        </Button>
      </div>
    </div>
  );
}