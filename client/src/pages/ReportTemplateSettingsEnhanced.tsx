import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowRight, Save, Palette, FileText, Settings, RefreshCw, 
  Smartphone, Monitor, Eye, Download, Upload, Plus, Trash2,
  Copy, CheckCircle2, AlertCircle, Layout, Type, Grid3x3,
  Home, Building, Phone, Mail, Calendar, User, Target,
  Sparkles, Zap, Globe, Award, ChevronDown, ChevronUp,
  Play, Pause, RotateCcw, Info, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { ReportTemplate, InsertReportTemplate } from "@shared/schema";

// نوع آمن للهوامش
interface SafeMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// قيم الهوامش الافتراضية
const defaultMargins: SafeMargins = { top: 1, bottom: 1, left: 0.75, right: 0.75 };

export default function ReportTemplateSettingsEnhanced() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState("header");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));

  // مراقبة تغيير حجم الشاشة
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // جلب القالب الحالي
  const { data: template, isLoading, error } = useQuery({
    queryKey: ['/api/report-templates/active'],
    queryFn: () => apiRequest('GET', '/api/report-templates/active') as Promise<ReportTemplate>,
  });

  // حالة النموذج مع معالجة آمنة للهوامش
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
    margins: defaultMargins,
    showHeader: true,
    showFooter: true,
    showLogo: true,
    showDate: true,
    showPageNumbers: true,
    isActive: true,
  });

  // معالجة آمنة للهوامش
  const safeMargins: SafeMargins = formData.margins && typeof formData.margins === 'object' 
    ? { ...defaultMargins, ...formData.margins }
    : defaultMargins;

  // تحديث النموذج عند جلب البيانات
  useEffect(() => {
    if (template) {
      const safeTemplate = {
        ...template,
        margins: template.margins && typeof template.margins === 'object' 
          ? { ...defaultMargins, ...template.margins }
          : defaultMargins
      };
      setFormData(safeTemplate);
    }
  }, [template]);

  // حفظ الإعدادات
  const saveTemplateMutation = useMutation({
    mutationFn: (data: InsertReportTemplate) => {
      const dataToSave = {
        ...data,
        margins: safeMargins
      };
      return template?.id 
        ? apiRequest('PUT', `/api/report-templates/${template.id}`, dataToSave)
        : apiRequest('POST', '/api/report-templates', dataToSave);
    },
    onSuccess: () => {
      toast({
        title: "✅ تم الحفظ بنجاح",
        description: "تم حفظ إعدادات قالب التقرير بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/report-templates'] });
    },
    onError: (error) => {
      console.error('Error saving template:', error);
      toast({
        title: "❌ خطأ في الحفظ",
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

  const updateMargins = (margin: keyof SafeMargins, value: number) => {
    setFormData(prev => ({
      ...prev,
      margins: { ...safeMargins, [margin]: value }
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
      margins: defaultMargins,
      showHeader: true,
      showFooter: true,
      showLogo: true,
      showDate: true,
      showPageNumbers: true,
      isActive: true,
    });
    toast({
      title: "🔄 تم إعادة التعيين",
      description: "تم إعادة جميع الإعدادات إلى القيم الافتراضية",
    });
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // حالة التحميل
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">جاري تحميل إعدادات القالب</h3>
                <p className="text-sm text-muted-foreground">يرجى الانتظار...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // حالة الخطأ
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md border-destructive">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-destructive">خطأ في تحميل البيانات</h3>
                <p className="text-sm text-muted-foreground">حدث خطأ أثناء تحميل إعدادات القالب</p>
                <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
                  <RefreshCw className="w-4 h-4 ml-2" />
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      {/* شريط التنقل العلوي - محسن للهواتف */}
      <div className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-reverse space-x-3">
              <Link href="/reports">
                <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-800">
                  <ArrowRight className="ml-2 h-4 w-4" />
                  {isMobile ? "عودة" : "العودة للتقارير"}
                </Button>
              </Link>
              
              <div className="hidden sm:block w-px h-6 bg-slate-300 dark:bg-slate-600" />
              
              <div>
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-l from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  {isMobile ? "قوالب التقارير" : "إعدادات قالب التقارير"}
                </h1>
                {!isMobile && (
                  <p className="text-sm text-muted-foreground">تخصيص تصميم وشكل تقارير الإكسل المُصدَّرة</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-reverse space-x-2">
              {/* زر المعاينة */}
              <Button
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                variant={isPreviewMode ? "default" : "outline"}
                size="sm"
                className="hidden sm:flex"
              >
                <Eye className="h-4 w-4 ml-1" />
                معاينة
              </Button>
              
              {/* زر إعادة التعيين */}
              <Button
                onClick={resetToDefaults}
                variant="outline"
                size="sm"
                className="hidden sm:flex"
              >
                <RefreshCw className="h-4 w-4 ml-1" />
                {isMobile ? "إعادة" : "إعادة تعيين"}
              </Button>
              
              {/* زر الحفظ */}
              <Button
                onClick={handleSubmit}
                disabled={saveTemplateMutation.isPending}
                className="bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                size="sm"
              >
                <Save className="h-4 w-4 ml-1" />
                {saveTemplateMutation.isPending ? "جاري..." : (isMobile ? "حفظ" : "حفظ الإعدادات")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* شريط الحالة والإرشادات */}
        <Alert className="bg-gradient-to-l from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <Sparkles className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>نصيحة:</strong> جميع التغييرات يتم تطبيقها فوراً على تقارير الإكسل المُصدَّرة. 
            {!isMobile && " يمكنك استخدام معاينة مباشرة لرؤية النتائج."}
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* التبويبات الرئيسية */}
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="w-full"
          >
            {/* قائمة التبويبات - محسنة للهواتف */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-1">
              <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} bg-slate-50 dark:bg-slate-800`}>
                <TabsTrigger 
                  value="header" 
                  className="flex items-center gap-1 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
                >
                  <Building className="h-3 w-3 sm:h-4 sm:w-4" />
                  {isMobile ? "الشركة" : "الرأس والشركة"}
                </TabsTrigger>
                <TabsTrigger 
                  value="colors" 
                  className="flex items-center gap-1 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
                >
                  <Palette className="h-3 w-3 sm:h-4 sm:w-4" />
                  {isMobile ? "الألوان" : "الألوان والتصميم"}
                </TabsTrigger>
                {!isMobile && (
                  <>
                    <TabsTrigger 
                      value="layout" 
                      className="flex items-center gap-1 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
                    >
                      <Layout className="h-4 w-4" />
                      التخطيط والصفحة
                    </TabsTrigger>
                    <TabsTrigger 
                      value="footer" 
                      className="flex items-center gap-1 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
                    >
                      <FileText className="h-4 w-4" />
                      الذيل والإعدادات
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
            </div>

            {/* محتوى تبويب الرأس والشركة */}
            <TabsContent value="header" className="space-y-6 mt-6">
              <div className="grid gap-6">
                {/* إعدادات الرأس الأساسية */}
                <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">إعدادات الرأس</CardTitle>
                          <CardDescription>تخصيص رأس التقرير ومعلومات الشركة</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* العناوين الأساسية */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="headerTitle" className="text-sm font-medium flex items-center gap-2">
                          <Target className="h-3 w-3" />
                          عنوان التقرير الرئيسي
                        </Label>
                        <Input
                          id="headerTitle"
                          value={formData.headerTitle || ''}
                          onChange={(e) => updateFormData('headerTitle', e.target.value)}
                          placeholder="نظام إدارة مشاريع البناء"
                          className="border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="headerSubtitle" className="text-sm font-medium flex items-center gap-2">
                          <Type className="h-3 w-3" />
                          العنوان الفرعي
                        </Label>
                        <Input
                          id="headerSubtitle"
                          value={formData.headerSubtitle || ''}
                          onChange={(e) => updateFormData('headerSubtitle', e.target.value)}
                          placeholder="تقرير مالي"
                          className="border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                        />
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* معلومات الشركة */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        معلومات الشركة
                      </h4>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="companyName" className="text-sm font-medium">اسم الشركة</Label>
                          <Input
                            id="companyName"
                            value={formData.companyName || ''}
                            onChange={(e) => updateFormData('companyName', e.target.value)}
                            placeholder="شركة البناء والتطوير"
                            className="border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="companyAddress" className="text-sm font-medium flex items-center gap-2">
                            <Home className="h-3 w-3" />
                            عنوان الشركة
                          </Label>
                          <Input
                            id="companyAddress"
                            value={formData.companyAddress || ''}
                            onChange={(e) => updateFormData('companyAddress', e.target.value)}
                            placeholder="صنعاء - اليمن"
                            className="border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="companyPhone" className="text-sm font-medium flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            رقم الهاتف
                          </Label>
                          <Input
                            id="companyPhone"
                            value={formData.companyPhone || ''}
                            onChange={(e) => updateFormData('companyPhone', e.target.value)}
                            placeholder="+967 1 234567"
                            className="border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="companyEmail" className="text-sm font-medium flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            البريد الإلكتروني
                          </Label>
                          <Input
                            id="companyEmail"
                            type="email"
                            value={formData.companyEmail || ''}
                            onChange={(e) => updateFormData('companyEmail', e.target.value)}
                            placeholder="info@company.com"
                            className="border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* إعدادات الذيل */}
                <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                        <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">إعدادات الذيل</CardTitle>
                        <CardDescription>تخصيص نص الذيل ومعلومات الاتصال</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="footerText" className="text-sm font-medium">نص الذيل الرئيسي</Label>
                      <Textarea
                        id="footerText"
                        value={formData.footerText || ''}
                        onChange={(e) => updateFormData('footerText', e.target.value)}
                        placeholder="تم إنشاء هذا التقرير بواسطة نظام إدارة المشاريع"
                        rows={2}
                        className="border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="footerContact" className="text-sm font-medium">معلومات الاتصال</Label>
                      <Input
                        id="footerContact"
                        value={formData.footerContact || ''}
                        onChange={(e) => updateFormData('footerContact', e.target.value)}
                        placeholder="للاستفسار: info@company.com | +967 1 234567"
                        className="border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* محتوى تبويب الألوان والتصميم */}
            <TabsContent value="colors" className="space-y-6 mt-6">
              <div className="grid gap-6">
                {/* نظام الألوان */}
                <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-lg">
                        <Palette className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">نظام الألوان</CardTitle>
                        <CardDescription>اختر الألوان الأساسية للتقرير</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* اللون الأساسي */}
                      <div className="space-y-3">
                        <Label htmlFor="primaryColor" className="text-sm font-medium">اللون الأساسي</Label>
                        <div className="flex items-center space-x-reverse space-x-3">
                          <input
                            type="color"
                            id="primaryColor"
                            value={formData.primaryColor || '#1f2937'}
                            onChange={(e) => updateFormData('primaryColor', e.target.value)}
                            className="w-12 h-12 rounded-lg border-2 border-slate-300 dark:border-slate-600 cursor-pointer"
                          />
                          <Input
                            value={formData.primaryColor || '#1f2937'}
                            onChange={(e) => updateFormData('primaryColor', e.target.value)}
                            placeholder="#1f2937"
                            className="font-mono text-sm border-slate-300 dark:border-slate-600"
                          />
                        </div>
                        <div 
                          className="h-8 rounded-md border"
                          style={{ backgroundColor: formData.primaryColor || '#1f2937' }}
                        ></div>
                      </div>
                      
                      {/* اللون الثانوي */}
                      <div className="space-y-3">
                        <Label htmlFor="secondaryColor" className="text-sm font-medium">اللون الثانوي</Label>
                        <div className="flex items-center space-x-reverse space-x-3">
                          <input
                            type="color"
                            id="secondaryColor"
                            value={formData.secondaryColor || '#3b82f6'}
                            onChange={(e) => updateFormData('secondaryColor', e.target.value)}
                            className="w-12 h-12 rounded-lg border-2 border-slate-300 dark:border-slate-600 cursor-pointer"
                          />
                          <Input
                            value={formData.secondaryColor || '#3b82f6'}
                            onChange={(e) => updateFormData('secondaryColor', e.target.value)}
                            placeholder="#3b82f6"
                            className="font-mono text-sm border-slate-300 dark:border-slate-600"
                          />
                        </div>
                        <div 
                          className="h-8 rounded-md border"
                          style={{ backgroundColor: formData.secondaryColor || '#3b82f6' }}
                        ></div>
                      </div>
                      
                      {/* لون التمييز */}
                      <div className="space-y-3">
                        <Label htmlFor="accentColor" className="text-sm font-medium">لون التمييز</Label>
                        <div className="flex items-center space-x-reverse space-x-3">
                          <input
                            type="color"
                            id="accentColor"
                            value={formData.accentColor || '#10b981'}
                            onChange={(e) => updateFormData('accentColor', e.target.value)}
                            className="w-12 h-12 rounded-lg border-2 border-slate-300 dark:border-slate-600 cursor-pointer"
                          />
                          <Input
                            value={formData.accentColor || '#10b981'}
                            onChange={(e) => updateFormData('accentColor', e.target.value)}
                            placeholder="#10b981"
                            className="font-mono text-sm border-slate-300 dark:border-slate-600"
                          />
                        </div>
                        <div 
                          className="h-8 rounded-md border"
                          style={{ backgroundColor: formData.accentColor || '#10b981' }}
                        ></div>
                      </div>
                    </div>

                    <Separator />

                    {/* ألوان النص والخلفية */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="textColor" className="text-sm font-medium">لون النص</Label>
                        <div className="flex items-center space-x-reverse space-x-3">
                          <input
                            type="color"
                            id="textColor"
                            value={formData.textColor || '#1f2937'}
                            onChange={(e) => updateFormData('textColor', e.target.value)}
                            className="w-12 h-12 rounded-lg border-2 border-slate-300 dark:border-slate-600 cursor-pointer"
                          />
                          <Input
                            value={formData.textColor || '#1f2937'}
                            onChange={(e) => updateFormData('textColor', e.target.value)}
                            placeholder="#1f2937"
                            className="font-mono text-sm border-slate-300 dark:border-slate-600"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="backgroundColor" className="text-sm font-medium">لون الخلفية</Label>
                        <div className="flex items-center space-x-reverse space-x-3">
                          <input
                            type="color"
                            id="backgroundColor"
                            value={formData.backgroundColor || '#ffffff'}
                            onChange={(e) => updateFormData('backgroundColor', e.target.value)}
                            className="w-12 h-12 rounded-lg border-2 border-slate-300 dark:border-slate-600 cursor-pointer"
                          />
                          <Input
                            value={formData.backgroundColor || '#ffffff'}
                            onChange={(e) => updateFormData('backgroundColor', e.target.value)}
                            placeholder="#ffffff"
                            className="font-mono text-sm border-slate-300 dark:border-slate-600"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* إعدادات الخطوط */}
                <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                        <Type className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">إعدادات الخطوط</CardTitle>
                        <CardDescription>اختر نوع وحجم الخط المناسب</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* نوع الخط */}
                      <div className="space-y-3">
                        <Label htmlFor="fontFamily" className="text-sm font-medium">نوع الخط</Label>
                        <Select 
                          value={formData.fontFamily || 'Arial'} 
                          onValueChange={(value) => updateFormData('fontFamily', value)}
                        >
                          <SelectTrigger className="border-slate-300 dark:border-slate-600">
                            <SelectValue placeholder="اختر نوع الخط" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Calibri">Calibri</SelectItem>
                            <SelectItem value="Tahoma">Tahoma</SelectItem>
                            <SelectItem value="Verdana">Verdana</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* حجم الخط */}
                      <div className="space-y-3">
                        <Label htmlFor="fontSize" className="text-sm font-medium">
                          حجم الخط: {formData.fontSize || 11}px
                        </Label>
                        <Slider
                          value={[formData.fontSize || 11]}
                          onValueChange={(value) => updateFormData('fontSize', value[0])}
                          min={8}
                          max={20}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>8px</span>
                          <span>14px</span>
                          <span>20px</span>
                        </div>
                      </div>
                    </div>

                    {/* معاينة الخط */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-2">معاينة الخط:</p>
                      <p 
                        style={{ 
                          fontFamily: formData.fontFamily || 'Arial',
                          fontSize: `${formData.fontSize || 11}px`,
                          color: formData.textColor || '#1f2937'
                        }}
                        className="text-right"
                      >
                        نموذج نص بالخط المحدد - {formData.fontFamily || 'Arial'} - {formData.fontSize || 11}px
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* محتوى تبويبات إضافية للأجهزة الكبيرة */}
            {!isMobile && (
              <>
                {/* تبويب التخطيط والصفحة */}
                <TabsContent value="layout" className="space-y-6 mt-6">
                  <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-700">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                          <Layout className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">إعدادات الصفحة</CardTitle>
                          <CardDescription>تخصيص حجم الصفحة والهوامش</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* إعدادات الصفحة الأساسية */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label htmlFor="pageSize" className="text-sm font-medium">حجم الصفحة</Label>
                          <Select 
                            value={formData.pageSize || 'A4'} 
                            onValueChange={(value) => updateFormData('pageSize', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر حجم الصفحة" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A4">A4</SelectItem>
                              <SelectItem value="A3">A3</SelectItem>
                              <SelectItem value="Letter">Letter</SelectItem>
                              <SelectItem value="Legal">Legal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="pageOrientation" className="text-sm font-medium">اتجاه الصفحة</Label>
                          <Select 
                            value={formData.pageOrientation || 'portrait'} 
                            onValueChange={(value) => updateFormData('pageOrientation', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر اتجاه الصفحة" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="portrait">عمودي</SelectItem>
                              <SelectItem value="landscape">أفقي</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Separator />

                      {/* إعدادات الهوامش */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">الهوامش (بالسنتيمتر)</h4>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="marginTop" className="text-sm">الهامش العلوي: {safeMargins.top}cm</Label>
                            <Slider
                              value={[safeMargins.top]}
                              onValueChange={(value) => updateMargins('top', value[0])}
                              min={0.5}
                              max={3}
                              step={0.25}
                              className="w-full"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="marginBottom" className="text-sm">الهامش السفلي: {safeMargins.bottom}cm</Label>
                            <Slider
                              value={[safeMargins.bottom]}
                              onValueChange={(value) => updateMargins('bottom', value[0])}
                              min={0.5}
                              max={3}
                              step={0.25}
                              className="w-full"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="marginLeft" className="text-sm">الهامش الأيسر: {safeMargins.left}cm</Label>
                            <Slider
                              value={[safeMargins.left]}
                              onValueChange={(value) => updateMargins('left', value[0])}
                              min={0.5}
                              max={3}
                              step={0.25}
                              className="w-full"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="marginRight" className="text-sm">الهامش الأيمن: {safeMargins.right}cm</Label>
                            <Slider
                              value={[safeMargins.right]}
                              onValueChange={(value) => updateMargins('right', value[0])}
                              min={0.5}
                              max={3}
                              step={0.25}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* تبويب الذيل والإعدادات */}
                <TabsContent value="footer" className="space-y-6 mt-6">
                  <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-700">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                          <Settings className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">إعدادات العرض</CardTitle>
                          <CardDescription>تحكم في العناصر المعروضة في التقرير</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* مفاتيح التبديل */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="space-y-1">
                            <Label htmlFor="showHeader" className="text-sm font-medium">عرض الرأس</Label>
                            <p className="text-xs text-muted-foreground">عرض رأس التقرير</p>
                          </div>
                          <Switch
                            id="showHeader"
                            checked={formData.showHeader || false}
                            onCheckedChange={(checked) => updateFormData('showHeader', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="space-y-1">
                            <Label htmlFor="showFooter" className="text-sm font-medium">عرض الذيل</Label>
                            <p className="text-xs text-muted-foreground">عرض ذيل التقرير</p>
                          </div>
                          <Switch
                            id="showFooter"
                            checked={formData.showFooter || false}
                            onCheckedChange={(checked) => updateFormData('showFooter', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="space-y-1">
                            <Label htmlFor="showLogo" className="text-sm font-medium">عرض الشعار</Label>
                            <p className="text-xs text-muted-foreground">عرض شعار الشركة</p>
                          </div>
                          <Switch
                            id="showLogo"
                            checked={formData.showLogo || false}
                            onCheckedChange={(checked) => updateFormData('showLogo', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="space-y-1">
                            <Label htmlFor="showDate" className="text-sm font-medium">عرض التاريخ</Label>
                            <p className="text-xs text-muted-foreground">عرض تاريخ التقرير</p>
                          </div>
                          <Switch
                            id="showDate"
                            checked={formData.showDate || false}
                            onCheckedChange={(checked) => updateFormData('showDate', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="space-y-1">
                            <Label htmlFor="showPageNumbers" className="text-sm font-medium">ترقيم الصفحات</Label>
                            <p className="text-xs text-muted-foreground">عرض أرقام الصفحات</p>
                          </div>
                          <Switch
                            id="showPageNumbers"
                            checked={formData.showPageNumbers || false}
                            onCheckedChange={(checked) => updateFormData('showPageNumbers', checked)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>
        </form>
      </div>

      {/* شريط الحفظ السفلي للهواتف */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Button
              onClick={resetToDefaults}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 ml-1" />
              إعادة تعيين
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={saveTemplateMutation.isPending}
              className="flex-2 bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              size="sm"
            >
              <Save className="h-4 w-4 ml-1" />
              {saveTemplateMutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </Button>
          </div>
        </div>
      )}

      {/* مساحة إضافية في الأسفل للهواتف */}
      {isMobile && <div className="h-20"></div>}
    </div>
  );
}