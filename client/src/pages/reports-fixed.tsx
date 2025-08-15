import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Receipt, UserCheck, Package, PieChart, Eye, Download, Share2, FileSpreadsheet, Printer, BarChart, FileText, Calendar, TrendingUp, Filter, RefreshCw, Database, Clock, Settings, Users, DollarSign, Activity, Target, Briefcase, ChevronRight, Grid3X3, List, Search, ExternalLink, AlertCircle, CheckCircle2, Zap, Globe, Award, ChevronUp, ChevronDown, Lightbulb, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useSelectedProject } from "@/hooks/use-selected-project";
import ProjectSelector from "@/components/project-selector";
import { getCurrentDate, formatCurrency, formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Worker, Project } from "@shared/schema";


export default function ReportsFixed() {
  const [, setLocation] = useLocation();
  const { selectedProjectId, selectProject } = useSelectedProject();
  const { toast } = useToast();
  
  // Report form states
  const [dailyReportDate, setDailyReportDate] = useState(getCurrentDate());
  const [workerAccountDate1, setWorkerAccountDate1] = useState("");
  const [workerAccountDate2, setWorkerAccountDate2] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [selectedWorkerProjectIds, setSelectedWorkerProjectIds] = useState<string[]>([]);
  const [materialReportDate1, setMaterialReportDate1] = useState("");
  const [materialReportDate2, setMaterialReportDate2] = useState("");
  const [projectSummaryDate1, setProjectSummaryDate1] = useState("");
  const [projectSummaryDate2, setProjectSummaryDate2] = useState("");
  
  // Report display states
  const [activeReportType, setActiveReportType] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("quick");

  // Fetch projects and workers data
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Generate Reports Functions
  const generateDailyExpensesReport = async () => {
    if (!selectedProjectId || !dailyReportDate) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار مشروع وتاريخ",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const data = await apiRequest("GET", `/api/reports/daily-expenses/${selectedProjectId}/${dailyReportDate}`);
      setReportData(data);
      setActiveReportType("daily");
      
      toast({
        title: "تم إنشاء التقرير",
        description: "تم إنشاء كشف المصروفات اليومية بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء التقرير",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWorkerAccountStatement = async () => {
    if (!selectedWorkerId || !workerAccountDate1 || !workerAccountDate2) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار عامل والتواريخ",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const projectIdsParam = selectedWorkerProjectIds.length > 0 
        ? `&projectIds=${selectedWorkerProjectIds.join(',')}`
        : selectedProjectId 
        ? `&projectId=${selectedProjectId}` 
        : '';
        
      const data = await apiRequest("GET", 
        `/api/workers/${selectedWorkerId}/account-statement?dateFrom=${workerAccountDate1}&dateTo=${workerAccountDate2}${projectIdsParam}`
      );
      setReportData(data);
      setActiveReportType("worker_statement");
      
      toast({
        title: "تم إنشاء التقرير",
        description: "تم إنشاء كشف حساب العامل بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء التقرير",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateProjectSummaryReport = async () => {
    if (!selectedProjectId || !projectSummaryDate1 || !projectSummaryDate2) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار مشروع والتواريخ",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const data = await apiRequest("GET", 
        `/api/reports/project-summary/${selectedProjectId}?dateFrom=${projectSummaryDate1}&dateTo=${projectSummaryDate2}`
      );
      setReportData(data);
      setActiveReportType("project_summary");
      
      toast({
        title: "تم إنشاء التقرير",
        description: "تم إنشاء ملخص المشروع بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء التقرير",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMaterialPurchasesReport = async () => {
    if (!selectedProjectId || !materialReportDate1 || !materialReportDate2) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار مشروع والتواريخ",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const data = await apiRequest("GET", `/api/reports/material-purchases/${selectedProjectId}?dateFrom=${materialReportDate1}&dateTo=${materialReportDate2}`);
      setReportData(data);
      setActiveReportType("materials");

      toast({
        title: "تم إنشاء التقرير",
        description: "تم إنشاء كشف المواد المشتراة بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء التقرير",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const closeReport = () => {
    setActiveReportType(null);
    setReportData(null);
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-blue-600 to-purple-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">مركز التقارير الموحد</h1>
            <p className="text-blue-100">إدارة شاملة لجميع التقارير والإحصائيات</p>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>نظام موحد 85% مكتمل</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>تقارير احترافية</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span>تصدير Excel متقدم</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => setLocation("/advanced-reports")}
            >
              <FileText className="h-4 w-4 ml-2" />
              التقارير المتقدمة
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              onClick={() => setLocation("/")}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Project Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">اختيار المشروع</h3>
          </div>
          <ProjectSelector
            selectedProjectId={selectedProjectId}
            onProjectChange={selectProject}
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="quick" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            التقارير السريعة
          </TabsTrigger>
          <TabsTrigger value="detailed" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            التقارير التفصيلية
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            التحليلات
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            الإعدادات
          </TabsTrigger>
        </TabsList>

        {/* Quick Reports Tab */}
        <TabsContent value="quick" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Daily Expenses Report */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Receipt className="h-5 w-5 text-blue-600" />
                  كشف المصروفات اليومية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    التاريخ
                  </label>
                  <Input
                    type="date"
                    value={dailyReportDate}
                    onChange={(e) => setDailyReportDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={generateDailyExpensesReport}
                  disabled={isGenerating || !selectedProjectId}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isGenerating ? (
                    <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <Receipt className="h-4 w-4 ml-2" />
                  )}
                  إنشاء التقرير
                </Button>
              </CardContent>
            </Card>

            {/* Material Purchases Report */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-green-600" />
                  كشف المواد المشتراة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      من تاريخ
                    </label>
                    <Input
                      type="date"
                      value={materialReportDate1}
                      onChange={(e) => setMaterialReportDate1(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      إلى تاريخ
                    </label>
                    <Input
                      type="date"
                      value={materialReportDate2}
                      onChange={(e) => setMaterialReportDate2(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  onClick={generateMaterialPurchasesReport}
                  disabled={isGenerating || !selectedProjectId}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isGenerating ? (
                    <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <Package className="h-4 w-4 ml-2" />
                  )}
                  إنشاء التقرير
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Detailed Reports Tab */}
        <TabsContent value="detailed" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Worker Account Statement */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-purple-600" />
                  كشف حساب العامل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    اختيار العامل
                  </label>
                  <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العامل" />
                    </SelectTrigger>
                    <SelectContent>
                      {workers.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id}>
                          {worker.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      من تاريخ
                    </label>
                    <Input
                      type="date"
                      value={workerAccountDate1}
                      onChange={(e) => setWorkerAccountDate1(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      إلى تاريخ
                    </label>
                    <Input
                      type="date"
                      value={workerAccountDate2}
                      onChange={(e) => setWorkerAccountDate2(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  onClick={generateWorkerAccountStatement}
                  disabled={isGenerating || !selectedWorkerId}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isGenerating ? (
                    <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <UserCheck className="h-4 w-4 ml-2" />
                  )}
                  إنشاء التقرير
                </Button>
              </CardContent>
            </Card>

            {/* Project Summary Report */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <PieChart className="h-5 w-5 text-orange-600" />
                  ملخص المشروع
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      من تاريخ
                    </label>
                    <Input
                      type="date"
                      value={projectSummaryDate1}
                      onChange={(e) => setProjectSummaryDate1(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      إلى تاريخ
                    </label>
                    <Input
                      type="date"
                      value={projectSummaryDate2}
                      onChange={(e) => setProjectSummaryDate2(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  onClick={generateProjectSummaryReport}
                  disabled={isGenerating || !selectedProjectId}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {isGenerating ? (
                    <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <PieChart className="h-4 w-4 ml-2" />
                  )}
                  إنشاء التقرير
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 text-center bg-gray-100 cursor-not-allowed">
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-500">التقارير المتقدمة</h3>
              <p className="text-sm text-gray-400">تم حذف هذه التقارير</p>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="h-5 w-5" />
                إعدادات التقارير
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">تنسيق التاريخ</label>
                  <Select defaultValue="gregorian">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gregorian">ميلادي</SelectItem>
                      <SelectItem value="hijri">هجري</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">العملة</label>
                  <Select defaultValue="yer">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yer">ريال يمني</SelectItem>
                      <SelectItem value="usd">دولار أمريكي</SelectItem>
                      <SelectItem value="sar">ريال سعودي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">قوالب التقارير المحفوظة</h4>
                <div className="text-sm text-gray-600">
                  لا توجد قوالب محفوظة حالياً. يمكنك إنشاء قوالب مخصصة من التقارير المتقدمة.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generated Report Display with Unified System */}
      {activeReportType && reportData && (
        <Card className="mt-6">
          <CardHeader className="pb-3 no-print">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                {activeReportType === 'daily' && 'كشف المصروفات اليومية'}
                {activeReportType === 'materials' && 'كشف المواد المشتراة'}
                {activeReportType === 'worker_statement' && 'كشف حساب العامل'}
                {activeReportType === 'project_summary' && 'ملخص المشروع'}
              </CardTitle>
              <div className="flex gap-2">
                <UnifiedPrintButton 
                  reportData={reportData}
                  reportType={activeReportType}
                  projectName={selectedProject?.name}
                />
                <UnifiedExcelExporter 
                  reportData={reportData}
                  reportType={activeReportType}
                  projectName={selectedProject?.name}
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={closeReport}
                >
                  إغلاق
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <UnifiedReportRenderer 
              reportData={reportData}
              reportType={activeReportType}
              projectName={selectedProject?.name}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}