/**
 * الوصف: صفحة التقارير المحدثة مع النظام الموحد
 * المدخلات: اختيار نوع التقرير والمعايير المطلوبة
 * المخرجات: عرض وتصدير وطباعة التقارير
 * المالك: عمار
 * آخر تعديل: 2025-08-15
 * الحالة: نشط - نسخة مبسطة ومحسنة
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  FileSpreadsheet, Printer, Calendar, TrendingUp, Users, DollarSign,
  Activity, Building2, Receipt, UserCheck, Package, PieChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useSelectedProject } from "@/hooks/use-selected-project";
import ProjectSelector from "@/components/project-selector";
import { getCurrentDate, formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Worker, Project } from "@shared/schema";

// استيراد النظام الموحد الجديد
import { 
  DailyExpenseTemplate, 
  WorkerStatementTemplate,
  quickExport,
  printReport 
} from "@/reports";

export default function ReportsSimplified() {
  const [, setLocation] = useLocation();
  const { selectedProjectId } = useSelectedProject();
  const { toast } = useToast();

  // Report form states
  const [dailyReportDate, setDailyReportDate] = useState(getCurrentDate());
  const [workerAccountDate1, setWorkerAccountDate1] = useState("");
  const [workerAccountDate2, setWorkerAccountDate2] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  
  // Report display states
  const [activeReportType, setActiveReportType] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch projects and workers data
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  // Fetch statistics
  const { data: projectsWithStats = [] } = useQuery<any[]>({
    queryKey: ["/api/projects/with-stats"],
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedProjectWithStats = projectsWithStats.find((p: any) => p.id === selectedProjectId);
  const selectedProjectStats = selectedProjectWithStats?.stats || {};

  // Calculate statistics
  const totalActiveProjects = projects.filter(p => p.status === 'active').length;
  const totalWorkers = workers.length;
  const totalFundTransfers = selectedProjectStats.totalIncome || 0;
  const totalExpenses = selectedProjectStats.totalExpenses || 0;
  const currentBalance = selectedProjectStats.currentBalance || 0;

  // Generate Daily Expenses Report
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
      const response = await fetch(`/api/reports/daily-expenses/${selectedProjectId}/${dailyReportDate}`);
      if (!response.ok) throw new Error('Failed to fetch report');
      
      const data = await response.json();
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

  // Generate Worker Account Report
  const generateWorkerAccountReport = async () => {
    if (!selectedWorkerId || !workerAccountDate1 || !workerAccountDate2) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى تحديد العامل والتواريخ",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      let url = `/api/workers/${selectedWorkerId}/account-statement?dateFrom=${workerAccountDate1}&dateTo=${workerAccountDate2}`;
      if (selectedProjectId) {
        url += `&projectId=${selectedProjectId}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch report');
      
      const data = await response.json();
      const reportDataExtended = { 
        ...data, 
        workerId: selectedWorkerId, 
        dateFrom: workerAccountDate1, 
        dateTo: workerAccountDate2
      };
      setReportData(reportDataExtended);
      setActiveReportType("worker");

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

  // Export functions using unified system
  const handleExportExcel = async () => {
    if (!reportData) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات للتصدير",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const filename = activeReportType === 'daily' 
        ? `مصروفات-يومية-${reportData.projectName}-${reportData.date}`
        : `كشف-حساب-${reportData.worker?.name}-${reportData.dateFrom}`;

      if (activeReportType === 'daily') {
        await quickExport.dailyExpenses(reportData, filename);
      } else if (activeReportType === 'worker') {
        await quickExport.workerStatement(reportData, filename);
      }
      
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير التقرير إلى Excel",
      });
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير التقرير",
        variant: "destructive",
      });
    }
  };

  const handlePrint = async () => {
    if (!reportData) return;
    
    try {
      await printReport.direct('report-content', 'تقرير');
      toast({
        title: "تم إرسال للطباعة",
        description: "تم إعداد التقرير للطباعة",
      });
    } catch (error) {
      toast({
        title: "خطأ في الطباعة",
        description: "حدث خطأ أثناء إعداد الطباعة",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">التقارير</h1>
              <p className="text-muted-foreground">إنشاء وإدارة تقارير المشروع</p>
            </div>
            <ProjectSelector onProjectChange={() => {}} />
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 space-y-6">
        {/* Statistics Dashboard */}
        {selectedProjectId && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Building2 className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">إجمالي الدخل</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalFundTransfers)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">إجمالي المصاريف</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">الرصيد الحالي</p>
                    <p className={`text-2xl font-bold ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(currentBalance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">عدد العمال</p>
                    <p className="text-2xl font-bold text-purple-600">{totalWorkers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports Generation */}
        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              المصروفات اليومية
            </TabsTrigger>
            <TabsTrigger value="worker" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              كشف حساب العامل
            </TabsTrigger>
          </TabsList>

          {/* Daily Expenses Tab */}
          <TabsContent value="daily">
            <Card>
              <CardHeader>
                <CardTitle>تقرير المصروفات اليومية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">التاريخ</label>
                    <Input
                      type="date"
                      value={dailyReportDate}
                      onChange={(e) => setDailyReportDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={generateDailyExpensesReport}
                    disabled={isGenerating || !selectedProjectId}
                    className="flex items-center gap-2"
                  >
                    <Activity className="h-4 w-4" />
                    {isGenerating ? 'جاري الإنشاء...' : 'إنشاء التقرير'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Worker Account Tab */}
          <TabsContent value="worker">
            <Card>
              <CardHeader>
                <CardTitle>كشف حساب العامل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">العامل</label>
                    <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر العامل" />
                      </SelectTrigger>
                      <SelectContent>
                        {workers.map(worker => (
                          <SelectItem key={worker.id} value={worker.id}>
                            {worker.name} - {worker.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">من تاريخ</label>
                    <Input
                      type="date"
                      value={workerAccountDate1}
                      onChange={(e) => setWorkerAccountDate1(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">إلى تاريخ</label>
                    <Input
                      type="date"
                      value={workerAccountDate2}
                      onChange={(e) => setWorkerAccountDate2(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={generateWorkerAccountReport}
                    disabled={isGenerating}
                    className="flex items-center gap-2"
                  >
                    <UserCheck className="h-4 w-4" />
                    {isGenerating ? 'جاري الإنشاء...' : 'إنشاء التقرير'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Report Display */}
        {reportData && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {activeReportType === 'daily' ? 'كشف المصروفات اليومية' : 'كشف حساب العامل'}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    تصدير Excel
                  </Button>
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    طباعة
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div id="report-content">
                {activeReportType === 'daily' ? (
                  <DailyExpenseTemplate data={reportData} />
                ) : (
                  <WorkerStatementTemplate data={reportData} />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}