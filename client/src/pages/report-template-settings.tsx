import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Save, Palette, FileText, Settings, RefreshCw, Eye, Download, Upload, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { UnifiedExcelExporter } from "@/components/unified-excel-exporter";
import { ProfessionalExcelExporter, type EnhancedExcelData } from "@/components/professional-excel-exporter";
import type { ReportTemplate, InsertReportTemplate } from "@shared/schema";

export default function ReportTemplateSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب القالب الحالي
  const { data: template, isLoading } = useQuery({
    queryKey: ['/api/report-templates/active'],
    queryFn: () => apiRequest('GET', '/api/report-templates/active') as Promise<ReportTemplate>,
  });

  // حالات إضافية للتحكم المتقدم
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'basic' | 'professional'>('professional');
  
  // وظيفة معاينة القالب
  const previewTemplate = async () => {
    try {
      const sampleData: EnhancedExcelData = {
        title: formData.headerSubtitle || 'تقرير تجريبي',
        headers: ['#', 'البيان', 'المبلغ', 'التاريخ', 'الملاحظات'],
        rows: [
          [1, 'عهدة نقدية', 50000, '2025-08-10', 'تحويل من المكتب الرئيسي'],
          [2, 'أجور عمال', 15000, '2025-08-10', 'أجور يوم 10/8'],
          [3, 'مواد إنشائية', 8500, '2025-08-10', 'أسمنت وحديد'],
        ],
        summary: [
          { label: 'إجمالي الدخل', value: 50000 },
          { label: 'إجمالي المصاريف', value: 23500 },
          { label: 'الرصيد المتبقي', value: 26500 },
        ],
        metadata: {
          reportType: 'تقرير مالي يومي',
          dateRange: '10/8/2025',
          projectName: 'مشروع تجريبي',
          generatedBy: 'نظام إدارة المشاريع'
        }
      };

      const exporter = selectedTemplate === 'professional' 
        ? new ProfessionalExcelExporter(formData as ReportTemplate)
        : new UnifiedExcelExporter(formData as ReportTemplate);

      if (selectedTemplate === 'professional') {
        await (exporter as ProfessionalExcelExporter).exportToExcel(sampleData, 'معاينة_قالب_احترافي');
      } else {
        await (exporter as UnifiedExcelExporter).exportToExcel({
          headers: sampleData.headers,
          rows: sampleData.rows,
          title: sampleData.title,
          summary: sampleData.summary
        }, 'معاينة_قالب_أساسي');
      }

      toast({
        title: "تم تصدير المعاينة",
        description: "تم تصدير ملف Excel تجريبي للمعاينة",
      });
    } catch (error) {
      console.error('Error previewing template:', error);
      toast({
        title: "خطأ في المعاينة",
        description: "حدث خطأ أثناء إنشاء المعاينة",
        variant: "destructive",
      });
    }
  };

  // حالة النموذج
  const [formData, setFormData] = useState<Partial<InsertReportTemplate>>({
    templateName: 'default',
    headerTitle: 'نظام إدارة مشاريع البناء',
    headerSubtitle: 'تقرير مالي',
    companyName: 'شركة البناء والتطوير',
    companyAddress: 'صنعاء - اليمن',
    companyPhone: '+967 1 234567',
    companyEmail: 'info@company.com',
    footerText: 'تم إنشاء هذا التقرير بواسطة نظام إدارة المشاريع',
    footerContact: 'للاستفسار: info@company.com | +967 1 234567',
    primaryColor: '#1f2937',
    secondaryColor: '#3b82f6',
    accentColor: '#10b981',
    textColor: '#1f2937',
    backgroundColor: '#ffffff',
    fontSize: 11,
    fontFamily: 'Arial',
    pageOrientation: 'portrait',
    pageSize: 'A4',
    margins: { top: 1, bottom: 1, left: 0.75, right: 0.75 },
    showHeader: true,
    showFooter: true,
    showLogo: true,
    showDate: true,
    showPageNumbers: true,
    isActive: true,
  });

  // تحديث النموذج عند جلب البيانات
  useEffect(() => {
    if (template) {
      setFormData({
        ...template,
        margins: template.margins || { top: 1, bottom: 1, left: 0.75, right: 0.75 }
      });
    }
  }, [template]);

  // حفظ الإعدادات
  const saveTemplateMutation = useMutation({
    mutationFn: (data: InsertReportTemplate) =>
      template?.id 
        ? apiRequest('PUT', `/api/report-templates/${template.id}`, data)
        : apiRequest('POST', '/api/report-templates', data),
    onSuccess: () => {
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ إعدادات قالب التقرير بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/report-templates'] });
    },
    onError: (error) => {
      console.error('Error saving template:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ إعدادات القالب",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveTemplateMutation.mutate(formData as InsertReportTemplate);
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateMargins = (margin: string, value: number) => {
    const currentMargins = (formData.margins && typeof formData.margins === 'object') 
      ? formData.margins as Record<string, number>
      : { top: 1, bottom: 1, left: 0.75, right: 0.75 };
    
    setFormData(prev => ({
      ...prev,
      margins: { ...currentMargins, [margin]: value }
    }));
  };

  const resetToDefaults = () => {
    setFormData({
      templateName: 'default',
      headerTitle: 'نظام إدارة مشاريع البناء',
      headerSubtitle: 'تقرير مالي',
      companyName: 'شركة البناء والتطوير',
      companyAddress: 'صنعاء - اليمن',
      companyPhone: '+967 1 234567',
      companyEmail: 'info@company.com',
      footerText: 'تم إنشاء هذا التقرير بواسطة نظام إدارة المشاريع',
      footerContact: 'للاستفسار: info@company.com | +967 1 234567',
      primaryColor: '#1f2937',
      secondaryColor: '#3b82f6',
      accentColor: '#10b981',
      textColor: '#1f2937',
      backgroundColor: '#ffffff',
      fontSize: 11,
      fontFamily: 'Arial',
      pageOrientation: 'portrait',
      pageSize: 'A4',
      margins: { top: 1, bottom: 1, left: 0.75, right: 0.75 },
      showHeader: true,
      showFooter: true,
      showLogo: true,
      showDate: true,
      showPageNumbers: true,
      isActive: true,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">جاري تحميل إعدادات القالب...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* رأس الصفحة */}
        {/* Header المحسن */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/reports" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowRight className="h-4 w-4 rotate-180" />
              العودة للتقارير
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إعدادات قوالب التقارير</h1>
            <p className="text-sm text-muted-foreground mt-1">تخصيص تصميم وشكل التقارير الاحترافية</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={selectedTemplate === 'professional' ? 'default' : 'outline'}>
              قالب {selectedTemplate === 'professional' ? 'احترافي' : 'أساسي'}
            </Badge>
          </div>
        </div>

        {/* شريط التحكم العلوي */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">نوع القالب</Label>
                  <Select value={selectedTemplate} onValueChange={(value: 'basic' | 'professional') => setSelectedTemplate(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          قالب أساسي
                        </div>
                      </SelectItem>
                      <SelectItem value="professional">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          قالب احترافي
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={previewTemplate}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  معاينة
                </Button>
                
                <Button
                  onClick={resetToDefaults}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  إعادة تعيين
                </Button>
                
                <Button
                  type="submit"
                  disabled={saveTemplateMutation.isPending}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  form="template-form"
                >
                  <Save className="h-4 w-4" />
                  {saveTemplateMutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <form id="template-form" onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="header" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="header" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                الرأس والشركة
              </TabsTrigger>
              <TabsTrigger value="colors" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                الألوان والتصميم
              </TabsTrigger>
              <TabsTrigger value="layout" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                التخطيط والصفحة
              </TabsTrigger>
              <TabsTrigger value="footer" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                الذيل والإعدادات
              </TabsTrigger>
            </TabsList>

            {/* تبويب الرأس والشركة */}
            <TabsContent value="header" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات الرأس</CardTitle>
                  <CardDescription>تخصيص رأس التقرير ومعلومات الشركة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="headerTitle">عنوان التقرير الرئيسي</Label>
                      <Input
                        id="headerTitle"
                        value={formData.headerTitle || ''}
                        onChange={(e) => updateFormData('headerTitle', e.target.value)}
                        placeholder="نظام إدارة مشاريع البناء"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="headerSubtitle">العنوان الفرعي</Label>
                      <Input
                        id="headerSubtitle"
                        value={formData.headerSubtitle || ''}
                        onChange={(e) => updateFormData('headerSubtitle', e.target.value)}
                        placeholder="تقرير مالي"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">اسم الشركة</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName || ''}
                        onChange={(e) => updateFormData('companyName', e.target.value)}
                        placeholder="شركة البناء والتطوير"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="companyAddress">عنوان الشركة</Label>
                      <Input
                        id="companyAddress"
                        value={formData.companyAddress || ''}
                        onChange={(e) => updateFormData('companyAddress', e.target.value)}
                        placeholder="صنعاء - اليمن"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyPhone">رقم الهاتف</Label>
                      <Input
                        id="companyPhone"
                        value={formData.companyPhone || ''}
                        onChange={(e) => updateFormData('companyPhone', e.target.value)}
                        placeholder="+967 1 234567"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">البريد الإلكتروني</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={formData.companyEmail || ''}
                        onChange={(e) => updateFormData('companyEmail', e.target.value)}
                        placeholder="info@company.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* تبويب الألوان والتصميم */}
            <TabsContent value="colors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>الألوان والخطوط</CardTitle>
                  <CardDescription>تخصيص نظام الألوان وخصائص النص</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">اللون الأساسي</Label>
                      <div className="flex items-center space-x-reverse space-x-2">
                        <input
                          type="color"
                          id="primaryColor"
                          value={formData.primaryColor || '#1f2937'}
                          onChange={(e) => updateFormData('primaryColor', e.target.value)}
                          className="w-12 h-10 rounded border"
                        />
                        <Input
                          value={formData.primaryColor || '#1f2937'}
                          onChange={(e) => updateFormData('primaryColor', e.target.value)}
                          placeholder="#1f2937"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">اللون الثانوي</Label>
                      <div className="flex items-center space-x-reverse space-x-2">
                        <input
                          type="color"
                          id="secondaryColor"
                          value={formData.secondaryColor || '#3b82f6'}
                          onChange={(e) => updateFormData('secondaryColor', e.target.value)}
                          className="w-12 h-10 rounded border"
                        />
                        <Input
                          value={formData.secondaryColor || '#3b82f6'}
                          onChange={(e) => updateFormData('secondaryColor', e.target.value)}
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="accentColor">اللون المميز</Label>
                      <div className="flex items-center space-x-reverse space-x-2">
                        <input
                          type="color"
                          id="accentColor"
                          value={formData.accentColor || '#10b981'}
                          onChange={(e) => updateFormData('accentColor', e.target.value)}
                          className="w-12 h-10 rounded border"
                        />
                        <Input
                          value={formData.accentColor || '#10b981'}
                          onChange={(e) => updateFormData('accentColor', e.target.value)}
                          placeholder="#10b981"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fontFamily">نوع الخط</Label>
                      <Select
                        value={formData.fontFamily || 'Arial'}
                        onValueChange={(value) => updateFormData('fontFamily', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          <SelectItem value="Calibri">Calibri</SelectItem>
                          <SelectItem value="Tahoma">Tahoma</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fontSize">حجم الخط</Label>
                      <Input
                        id="fontSize"
                        type="number"
                        min="8"
                        max="18"
                        value={formData.fontSize || 11}
                        onChange={(e) => updateFormData('fontSize', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* تبويب التخطيط والصفحة */}
            <TabsContent value="layout" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات الصفحة</CardTitle>
                  <CardDescription>تخصيص تخطيط وهوامش الصفحة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pageSize">حجم الصفحة</Label>
                      <Select
                        value={formData.pageSize || 'A4'}
                        onValueChange={(value) => updateFormData('pageSize', value)}
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
                      <Label htmlFor="pageOrientation">اتجاه الصفحة</Label>
                      <Select
                        value={formData.pageOrientation || 'portrait'}
                        onValueChange={(value) => updateFormData('pageOrientation', value)}
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
                    <Label>هوامش الصفحة (بالإنش)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="marginTop">الأعلى</Label>
                        <Input
                          id="marginTop"
                          type="number"
                          step="0.25"
                          min="0.25"
                          max="2"
                          value={(formData.margins && typeof formData.margins === 'object' && 'top' in formData.margins) ? formData.margins.top as number : 1}
                          onChange={(e) => updateMargins('top', parseFloat(e.target.value))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="marginBottom">الأسفل</Label>
                        <Input
                          id="marginBottom"
                          type="number"
                          step="0.25"
                          min="0.25"
                          max="2"
                          value={(formData.margins && typeof formData.margins === 'object' && 'bottom' in formData.margins) ? formData.margins.bottom as number : 1}
                          onChange={(e) => updateMargins('bottom', parseFloat(e.target.value))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="marginLeft">اليسار</Label>
                        <Input
                          id="marginLeft"
                          type="number"
                          step="0.25"
                          min="0.25"
                          max="2"
                          value={(formData.margins && typeof formData.margins === 'object' && 'left' in formData.margins) ? formData.margins.left as number : 0.75}
                          onChange={(e) => updateMargins('left', parseFloat(e.target.value))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="marginRight">اليمين</Label>
                        <Input
                          id="marginRight"
                          type="number"
                          step="0.25"
                          min="0.25"
                          max="2"
                          value={(formData.margins && typeof formData.margins === 'object' && 'right' in formData.margins) ? formData.margins.right as number : 0.75}
                          onChange={(e) => updateMargins('right', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* تبويب الذيل والإعدادات */}
            <TabsContent value="footer" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات الذيل</CardTitle>
                  <CardDescription>تخصيص نص الذيل وإعدادات العرض</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="footerText">نص الذيل</Label>
                      <Textarea
                        id="footerText"
                        value={formData.footerText || ''}
                        onChange={(e) => updateFormData('footerText', e.target.value)}
                        placeholder="تم إنشاء هذا التقرير بواسطة نظام إدارة المشاريع"
                        rows={2}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="footerContact">معلومات الاتصال</Label>
                      <Textarea
                        id="footerContact"
                        value={formData.footerContact || ''}
                        onChange={(e) => updateFormData('footerContact', e.target.value)}
                        placeholder="للاستفسار: info@company.com | +967 1 234567"
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="flex items-center justify-between space-x-reverse space-x-2">
                      <Label htmlFor="showHeader" className="text-sm font-medium">
                        إظهار الرأس
                      </Label>
                      <Switch
                        id="showHeader"
                        checked={formData.showHeader || false}
                        onCheckedChange={(checked) => updateFormData('showHeader', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between space-x-reverse space-x-2">
                      <Label htmlFor="showFooter" className="text-sm font-medium">
                        إظهار الذيل
                      </Label>
                      <Switch
                        id="showFooter"
                        checked={formData.showFooter || false}
                        onCheckedChange={(checked) => updateFormData('showFooter', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between space-x-reverse space-x-2">
                      <Label htmlFor="showDate" className="text-sm font-medium">
                        إظهار التاريخ
                      </Label>
                      <Switch
                        id="showDate"
                        checked={formData.showDate || false}
                        onCheckedChange={(checked) => updateFormData('showDate', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between space-x-reverse space-x-2">
                      <Label htmlFor="showPageNumbers" className="text-sm font-medium">
                        أرقام الصفحات
                      </Label>
                      <Switch
                        id="showPageNumbers"
                        checked={formData.showPageNumbers || false}
                        onCheckedChange={(checked) => updateFormData('showPageNumbers', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between space-x-reverse space-x-2">
                      <Label htmlFor="showLogo" className="text-sm font-medium">
                        إظهار الشعار
                      </Label>
                      <Switch
                        id="showLogo"
                        checked={formData.showLogo || false}
                        onCheckedChange={(checked) => updateFormData('showLogo', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between space-x-reverse space-x-2">
                      <Label htmlFor="isActive" className="text-sm font-medium">
                        القالب نشط
                      </Label>
                      <Switch
                        id="isActive"
                        checked={formData.isActive || false}
                        onCheckedChange={(checked) => updateFormData('isActive', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </div>
  );
}