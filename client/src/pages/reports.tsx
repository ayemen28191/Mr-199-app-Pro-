import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowRight, Receipt, UserCheck, Package, PieChart, Eye, Download, Share2, 
  FileSpreadsheet, Printer, Calendar, TrendingUp, Filter, RefreshCw,
  BarChart3, Database, Clock, Settings, Users, DollarSign, FileText,
  Activity, Target, Briefcase, ChevronRight, Grid3X3, List, Search,
  ExternalLink, AlertCircle, CheckCircle2, Zap, Globe, Award
} from "lucide-react";
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
import "@/components/print-styles.css";

export default function Reports() {
  const [, setLocation] = useLocation();
  const { selectedProjectId, selectProject } = useSelectedProject();
  const { toast } = useToast();

  // Fetch real statistics data
  const { data: projectsWithStats = [] } = useQuery<any[]>({
    queryKey: ["/api/projects/with-stats"],
  });
  
  // Report form states
  const [dailyReportDate, setDailyReportDate] = useState(getCurrentDate());
  const [workerAccountDate1, setWorkerAccountDate1] = useState("");
  const [workerAccountDate2, setWorkerAccountDate2] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [materialReportDate1, setMaterialReportDate1] = useState("");
  const [materialReportDate2, setMaterialReportDate2] = useState("");
  const [projectSummaryDate1, setProjectSummaryDate1] = useState("");
  const [projectSummaryDate2, setProjectSummaryDate2] = useState("");
  
  // Report display states
  const [activeReportType, setActiveReportType] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch projects and workers data
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Calculate real statistics
  const totalActiveProjects = projects.filter(p => p.status === 'active').length;
  const totalWorkers = workers.length;
  
  // Calculate statistics for selected project only
  const selectedProjectWithStats = projectsWithStats.find((p: any) => p.id === selectedProjectId);
  const selectedProjectStats = selectedProjectWithStats?.stats || {};
  
  const totalFundTransfers = selectedProjectStats.totalFundTransfers || 0;
  const totalExpenses = selectedProjectStats.totalExpenses || 0;
  const totalReportsGenerated = selectedProjectStats.daysWithData || 0;
  const currentBalance = selectedProjectStats.currentBalance || 0;

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

  const generateWorkerAccountReport = async () => {
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
      const data = await apiRequest("GET", `/api/workers/${selectedWorkerId}/account-statement?projectId=${selectedProjectId}&dateFrom=${workerAccountDate1}&dateTo=${workerAccountDate2}`);
      setReportData({ ...data, workerId: selectedWorkerId, dateFrom: workerAccountDate1, dateTo: workerAccountDate2 });
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
      const data = await apiRequest("GET", `/api/reports/project-summary/${selectedProjectId}?dateFrom=${projectSummaryDate1}&dateTo=${projectSummaryDate2}`);
      setReportData(data);
      setActiveReportType("summary");

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

  // Export Functions
  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات للتصدير",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const headers = Object.keys(data[0]);
      // إضافة BOM للتعامل مع النصوص العربية بشكل صحيح
      const csvContent = [
        '\uFEFF' + headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // تحويل القيم إلى نص وإضافة علامات التنصيص للقيم التي تحتوي على فواصل
            return typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n')) 
              ? `"${String(value).replace(/"/g, '""')}"` 
              : String(value);
          }).join(',')
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "تم التصدير",
        description: "تم تصدير التقرير بنجاح",
      });
    } catch (error) {
      console.error('خطئ في التصدير:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تصدير التقرير",
        variant: "destructive",
      });
    }
  };

  const printReport = () => {
    try {
      // تطبيق تنسيقات الطباعة
      document.body.classList.add('printing');
      
      // إخفاء عناصر الواجهة غير المطلوبة للطباعة
      const elementsToHide = document.querySelectorAll('.no-print, nav, .sidebar, .header-controls, .print\\:hidden');
      const originalStyles: { element: HTMLElement; display: string }[] = [];
      
      elementsToHide.forEach((el) => {
        const element = el as HTMLElement;
        originalStyles.push({
          element: element,
          display: element.style.display
        });
        element.style.display = 'none';
      });
      
      // تأخير قصير للتأكد من تطبيق التنسيقات
      setTimeout(() => {
        window.print();
        
        // استعادة العناصر المخفية بعد الطباعة
        setTimeout(() => {
          originalStyles.forEach(({ element, display }) => {
            element.style.display = display;
          });
          document.body.classList.remove('printing');
        }, 100);
      }, 100);
      
    } catch (error) {
      console.error('خطأ في الطباعة:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الطباعة",
        variant: "destructive",
      });
    }
  };

  // Render Daily Expenses Report
  const renderDailyExpensesReport = (data: any) => {
    if (!data) return null;

    const {
      fundTransfers = [],
      workerAttendance = [],
      materialPurchases = [],
      transportationExpenses = [],
      workerTransfers = [],
      carriedForward = 0,
      totalFundTransfers = 0,
      totalWorkerCosts = 0,
      totalMaterialCosts = 0,
      totalTransportCosts = 0,
      totalTransferCosts = 0,
      totalExpenses = 0,
      totalIncome = 0,
      remainingBalance = 0
    } = data;

    const selectedProject = projects.find(p => p.id === selectedProjectId);

    return (
      <div className="print-content bg-white min-h-screen" dir="rtl">
        {/* Professional Header with Wave Design */}
        <div className="relative bg-gradient-to-r from-cyan-500 to-blue-600 text-white overflow-hidden">
          {/* Wave shape at bottom */}
          <div className="absolute bottom-0 left-0 w-full h-16">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,120 C150,80 350,40 600,60 C850,80 1050,100 1200,80 L1200,120 Z" fill="white"></path>
            </svg>
          </div>
          
          <div className="relative px-8 py-12">
            <div className="flex justify-between items-start mb-8">
              {/* Company Logo and Name */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">نظام إدارة المشاريع</h1>
                  <p className="text-cyan-100 text-sm">المشاريع الهندسية والإنشائية</p>
                </div>
              </div>
              
              {/* Invoice Title */}
              <div className="text-left">
                <h2 className="text-4xl font-bold text-white mb-2">كشف المصروفات</h2>
                <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-sm mb-1">رقم الكشف: {Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</p>
                  <p className="text-sm">التاريخ: {formatDate(dailyReportDate)}</p>
                </div>
              </div>
            </div>

            {/* Project Information */}
            <div className="bg-white bg-opacity-10 rounded-lg p-6 backdrop-blur-sm">
              <h3 className="text-lg font-bold mb-3">معلومات المشروع:</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-cyan-100 text-sm">اسم المشروع</p>
                  <p className="font-semibold">{selectedProject?.name || 'غير محدد'}</p>
                </div>
                <div>
                  <p className="text-cyan-100 text-sm">تاريخ التقرير</p>
                  <p className="font-semibold">{formatDate(dailyReportDate)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-8 py-8">
          {/* Financial Summary Table */}
          <div className="mb-8">
            <table className="w-full border-collapse shadow-lg rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                  <th className="px-6 py-4 text-right font-bold">البيان</th>
                  <th className="px-6 py-4 text-center font-bold">المبلغ (ر.ي)</th>
                  <th className="px-6 py-4 text-center font-bold">النوع</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">الرصيد المرحل من اليوم السابق</td>
                  <td className="px-6 py-4 text-center font-bold text-blue-600">{formatCurrency(carriedForward)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">رصيد مرحل</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">إجمالي الواردات (تحويلات العهدة)</td>
                  <td className="px-6 py-4 text-center font-bold text-green-600">{formatCurrency(totalIncome)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">دخل</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">إجمالي المصروفات</td>
                  <td className="px-6 py-4 text-center font-bold text-red-600">{formatCurrency(totalExpenses)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">مصروف</span>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                  <td className="px-6 py-4 font-bold text-lg">الرصيد النهائي</td>
                  <td className="px-6 py-4 text-center font-bold text-xl">{formatCurrency(remainingBalance)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-4 py-2 rounded-full font-bold ${remainingBalance >= 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                      {remainingBalance >= 0 ? 'فائض' : 'عجز'}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Fund Transfers */}
          {fundTransfers.length > 0 && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-t-lg">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  تحويلات العهدة ({fundTransfers.length})
                </h3>
              </div>
              <div className="overflow-x-auto shadow-lg">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-green-50">
                      <th className="border border-green-200 px-4 py-3 text-right font-semibold text-green-800">م.</th>
                      <th className="border border-green-200 px-4 py-3 text-right font-semibold text-green-800">رقم الحوالة</th>
                      <th className="border border-green-200 px-4 py-3 text-right font-semibold text-green-800">المرسل</th>
                      <th className="border border-green-200 px-4 py-3 text-center font-semibold text-green-800">المبلغ (ر.ي)</th>
                      <th className="border border-green-200 px-4 py-3 text-right font-semibold text-green-800">الملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {fundTransfers.map((transfer: any, index: number) => (
                      <tr key={index} className="hover:bg-green-25 border-b border-green-100">
                        <td className="border border-green-200 px-4 py-3 text-center font-medium">{index + 1}</td>
                        <td className="border border-green-200 px-4 py-3">{transfer.transferNumber}</td>
                        <td className="border border-green-200 px-4 py-3">{transfer.senderName}</td>
                        <td className="border border-green-200 px-4 py-3 text-center font-bold text-green-600">
                          {formatCurrency(transfer.amount)}
                        </td>
                        <td className="border border-green-200 px-4 py-3">{transfer.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-green-100">
                      <td colSpan={3} className="border border-green-200 px-4 py-3 text-right font-bold text-green-800">
                        إجمالي التحويلات:
                      </td>
                      <td className="border border-green-200 px-4 py-3 text-center font-bold text-green-800">
                        {formatCurrency(totalFundTransfers)}
                      </td>
                      <td className="border border-green-200 px-4 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Worker Attendance */}
          {workerAttendance.length > 0 && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-t-lg">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  حضور العمال ({workerAttendance.length})
                </h3>
              </div>
              <div className="overflow-x-auto shadow-lg">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="border border-blue-200 px-4 py-3 text-right font-semibold text-blue-800">م.</th>
                      <th className="border border-blue-200 px-4 py-3 text-right font-semibold text-blue-800">اسم العامل</th>
                      <th className="border border-blue-200 px-4 py-3 text-right font-semibold text-blue-800">نوع العمل</th>
                      <th className="border border-blue-200 px-4 py-3 text-center font-semibold text-blue-800">ساعات العمل</th>
                      <th className="border border-blue-200 px-4 py-3 text-center font-semibold text-blue-800">المبلغ (ر.ي)</th>
                      <th className="border border-blue-200 px-4 py-3 text-right font-semibold text-blue-800">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {workerAttendance.map((attendance: any, index: number) => (
                      <tr key={index} className="hover:bg-blue-25 border-b border-blue-100">
                        <td className="border border-blue-200 px-4 py-3 text-center font-medium">{index + 1}</td>
                        <td className="border border-blue-200 px-4 py-3">{attendance.worker?.name || 'غير محدد'}</td>
                        <td className="border border-blue-200 px-4 py-3">{attendance.worker?.type || 'غير محدد'}</td>
                        <td className="border border-blue-200 px-4 py-3 text-center">{attendance.hoursWorked}</td>
                        <td className="border border-blue-200 px-4 py-3 text-center font-bold text-red-600">
                          {formatCurrency(attendance.paidAmount)}
                        </td>
                        <td className="border border-blue-200 px-4 py-3">{attendance.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-blue-100">
                      <td colSpan={4} className="border border-blue-200 px-4 py-3 text-right font-bold text-blue-800">
                        إجمالي أجور العمال:
                      </td>
                      <td className="border border-blue-200 px-4 py-3 text-center font-bold text-blue-800">
                        {formatCurrency(totalWorkerCosts)}
                      </td>
                      <td className="border border-blue-200 px-4 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Material Purchases */}
          {materialPurchases.length > 0 && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white p-4 rounded-t-lg">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  مشتريات المواد ({materialPurchases.length})
                </h3>
              </div>
              <div className="overflow-x-auto shadow-lg">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-orange-50">
                      <th className="border border-orange-200 px-4 py-3 text-right font-semibold text-orange-800">م.</th>
                      <th className="border border-orange-200 px-4 py-3 text-right font-semibold text-orange-800">المادة</th>
                      <th className="border border-orange-200 px-4 py-3 text-center font-semibold text-orange-800">الكمية</th>
                      <th className="border border-orange-200 px-4 py-3 text-center font-semibold text-orange-800">سعر الوحدة</th>
                      <th className="border border-orange-200 px-4 py-3 text-center font-semibold text-orange-800">المبلغ الإجمالي</th>
                      <th className="border border-orange-200 px-4 py-3 text-right font-semibold text-orange-800">المورد</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {materialPurchases.map((purchase: any, index: number) => (
                      <tr key={index} className="hover:bg-orange-25 border-b border-orange-100">
                        <td className="border border-orange-200 px-4 py-3 text-center font-medium">{index + 1}</td>
                        <td className="border border-orange-200 px-4 py-3">{purchase.material?.name || 'غير محدد'}</td>
                        <td className="border border-orange-200 px-4 py-3 text-center">{purchase.quantity} {purchase.material?.unit || ''}</td>
                        <td className="border border-orange-200 px-4 py-3 text-center">{formatCurrency(purchase.unitPrice)}</td>
                        <td className="border border-orange-200 px-4 py-3 text-center font-bold text-red-600">
                          {formatCurrency(purchase.totalAmount)}
                        </td>
                        <td className="border border-orange-200 px-4 py-3">{purchase.supplierName || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-orange-100">
                      <td colSpan={4} className="border border-orange-200 px-4 py-3 text-right font-bold text-orange-800">
                        إجمالي قيمة المواد:
                      </td>
                      <td className="border border-orange-200 px-4 py-3 text-center font-bold text-orange-800">
                        {formatCurrency(totalMaterialCosts)}
                      </td>
                      <td className="border border-orange-200 px-4 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Transportation Expenses */}
          {transportationExpenses.length > 0 && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-purple-500 to-violet-600 text-white p-4 rounded-t-lg">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  مصاريف النقل ({transportationExpenses.length})
                </h3>
              </div>
              <div className="overflow-x-auto shadow-lg">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-purple-50">
                      <th className="border border-purple-200 px-4 py-3 text-right font-semibold text-purple-800">م.</th>
                      <th className="border border-purple-200 px-4 py-3 text-right font-semibold text-purple-800">الوصف</th>
                      <th className="border border-purple-200 px-4 py-3 text-right font-semibold text-purple-800">العامل</th>
                      <th className="border border-purple-200 px-4 py-3 text-center font-semibold text-purple-800">المبلغ (ر.ي)</th>
                      <th className="border border-purple-200 px-4 py-3 text-right font-semibold text-purple-800">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {transportationExpenses.map((expense: any, index: number) => (
                      <tr key={index} className="hover:bg-purple-25 border-b border-purple-100">
                        <td className="border border-purple-200 px-4 py-3 text-center font-medium">{index + 1}</td>
                        <td className="border border-purple-200 px-4 py-3">{expense.description}</td>
                        <td className="border border-purple-200 px-4 py-3">{expense.worker?.name || '-'}</td>
                        <td className="border border-purple-200 px-4 py-3 text-center font-bold text-red-600">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="border border-purple-200 px-4 py-3">{expense.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-purple-100">
                      <td colSpan={3} className="border border-purple-200 px-4 py-3 text-right font-bold text-purple-800">
                        إجمالي مصاريف النقل:
                      </td>
                      <td className="border border-purple-200 px-4 py-3 text-center font-bold text-purple-800">
                        {formatCurrency(totalTransportCosts)}
                      </td>
                      <td className="border border-purple-200 px-4 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Professional Footer */}
          <div className="mt-12 pt-8 border-t-4 border-gradient-to-r from-cyan-500 to-blue-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Signature Section */}
              <div>
                <h4 className="font-bold text-gray-800 mb-4">التوقيع والاعتماد:</h4>
                <div className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">مُعد التقرير:</p>
                      <div className="border-b-2 border-gray-300 h-8"></div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">مراجع التقرير:</p>
                      <div className="border-b-2 border-gray-300 h-8"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Report Information */}
              <div>
                <h4 className="font-bold text-gray-800 mb-4">معلومات التقرير:</h4>
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-6 rounded-lg border border-cyan-200">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">رقم التقرير:</span>
                      <span className="font-semibold">RPT-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">تاريخ الإنشاء:</span>
                      <span className="font-semibold">{new Date().toLocaleDateString('ar-YE')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">وقت الإنشاء:</span>
                      <span className="font-semibold">{new Date().toLocaleTimeString('ar-YE')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">النظام:</span>
                      <span className="font-semibold">نظام إدارة المشاريع v2.0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="mt-8 text-center py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg">
              <p className="font-bold">نظام إدارة المشاريع - الحلول المتكاملة لإدارة المشاريع الهندسية</p>
              <p className="text-sm text-cyan-100 mt-1">تم إنشاء هذا التقرير تلقائياً بواسطة النظام</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Placeholder functions for other report types
  const renderWorkerAccountReport = (data: any) => (
    <div className="text-center py-8">
      <p className="text-gray-600">تقرير حساب العامل - قيد التطوير</p>
    </div>
  );

  const renderMaterialPurchasesReport = (data: any) => (
    <div className="text-center py-8">
      <p className="text-gray-600">تقرير مشتريات المواد - قيد التطوير</p>
    </div>
  );

  const renderProjectSummaryReport = (data: any) => (
    <div className="text-center py-8">
      <p className="text-gray-600">تقرير ملخص المشروع - قيد التطوير</p>
    </div>
  );

  return (
    <div className="mobile-reports-container mobile-smooth-scroll">
      {/* Mobile-optimized Premium Header */}
      <div className="sticky top-0 z-50 mobile-sticky-header bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white shadow-2xl">
        <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-8">
          <div className="flex items-center justify-center flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-4 flex-col sm:flex-row text-center sm:text-right">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
                  <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mobile-fade-in">
                    مركز التقارير التنفيذية
                  </h1>
                  <p className="text-blue-200 text-sm sm:text-lg">
                    التقارير المتقدمة وتحليل البيانات المالية
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-start">
                <Badge className="mobile-badge bg-green-500/20 text-green-300 border-green-400/30">
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  نظام نشط
                </Badge>
                <Badge className="mobile-badge bg-orange-500/20 text-orange-300 border-orange-400/30">
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  محدث اليوم
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Project Selector تحت مربع العرض */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
            <div className="flex items-center gap-3 sm:gap-4 flex-col sm:flex-row">
              <div className="flex items-center gap-2 text-center sm:text-right">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300" />
                <span className="text-blue-200 font-medium text-sm sm:text-base">المشروع النشط:</span>
              </div>
              <div className="flex-1 w-full sm:w-auto">
                <ProjectSelector 
                  selectedProjectId={selectedProjectId}
                  onProjectChange={selectProject} 
                  variant="compact"
                  showHeader={false}
                />
              </div>
              {selectedProject && (
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-300" />
                  <span className="text-yellow-300 font-medium text-sm sm:text-base">
                    {selectedProject.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-optimized Main Content */}
      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Mobile-optimized Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg rounded-xl p-1 sm:p-2 border-0 mobile-glass-effect">
            <TabsTrigger 
              value="dashboard" 
              className="mobile-tab-trigger data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-xs sm:text-lg font-medium py-2 sm:py-3 rounded-lg transition-all duration-300"
            >
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">لوحة المعلومات</span>
              <span className="sm:hidden">المعلومات</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="mobile-tab-trigger data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white text-xs sm:text-lg font-medium py-2 sm:py-3 rounded-lg transition-all duration-300"
            >
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">التقارير المتقدمة</span>
              <span className="sm:hidden">التقارير</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="mobile-tab-trigger data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white text-xs sm:text-lg font-medium py-2 sm:py-3 rounded-lg transition-all duration-300"
            >
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">التحليلات والإحصائيات</span>
              <span className="sm:hidden">التحليلات</span>
            </TabsTrigger>
          </TabsList>

          {/* Mobile-optimized Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-4 sm:mt-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
              {/* Mobile-optimized KPI Cards */}
              <Card className="mobile-card group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-gradient-to-br from-blue-50 to-blue-100 border-0 overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-xs sm:text-sm font-medium mb-1">التقارير المُنشأة</p>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-900">{totalReportsGenerated}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                        <span className="text-green-600 text-xs sm:text-sm font-medium">هذا الشهر</span>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 bg-blue-500/10 rounded-2xl group-hover:bg-blue-500/20 transition-colors duration-300">
                      <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mobile-card group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-gradient-to-br from-green-50 to-green-100 border-0 overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-xs sm:text-sm font-medium mb-1">المشاريع النشطة</p>
                      <p className="text-2xl sm:text-3xl font-bold text-green-900">{totalActiveProjects}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                        <span className="text-green-600 text-xs sm:text-sm font-medium">قيد التنفيذ</span>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 bg-green-500/10 rounded-2xl group-hover:bg-green-500/20 transition-colors duration-300">
                      <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mobile-card group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-gradient-to-br from-purple-50 to-purple-100 border-0 overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-xs sm:text-sm font-medium mb-1">إجمالي التحويلات</p>
                      <p className="text-2xl sm:text-3xl font-bold text-purple-900">{totalFundTransfers.toLocaleString()}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                        <span className="text-purple-600 text-xs sm:text-sm font-medium">ر.ي</span>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 bg-purple-500/10 rounded-2xl group-hover:bg-purple-500/20 transition-colors duration-300">
                      <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mobile-card group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-gradient-to-br from-orange-50 to-orange-100 border-0 overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 text-xs sm:text-sm font-medium mb-1">إجمالي المصروفات</p>
                      <p className="text-2xl sm:text-3xl font-bold text-orange-900">{totalExpenses.toLocaleString()}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                        <span className="text-red-600 text-xs sm:text-sm font-medium">ر.ي</span>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 bg-orange-500/10 rounded-2xl group-hover:bg-orange-500/20 transition-colors duration-300">
                      <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* البطاقة الرابعة - الرصيد الحالي */}
              <Card className="mobile-card group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-gradient-to-br from-cyan-50 to-cyan-100 border-0 overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-cyan-600 text-xs sm:text-sm font-medium mb-1">الرصيد الحالي</p>
                      <p className={`text-2xl sm:text-3xl font-bold ${currentBalance >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                        {currentBalance.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-500" />
                        <span className="text-cyan-600 text-xs sm:text-sm font-medium">ر.ي</span>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 bg-cyan-500/10 rounded-2xl group-hover:bg-cyan-500/20 transition-colors duration-300">
                      <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile-optimized Quick Actions */}
            <Card className="mobile-card bg-white shadow-xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                  <Zap className="h-6 w-6 sm:h-7 sm:w-7" />
                  الإجراءات السريعة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <Button 
                    className="mobile-touch-target mobile-action-button h-14 sm:h-16 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium text-base sm:text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
                    onClick={() => setActiveTab('reports')}
                  >
                    <Receipt className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                    كشف يومي
                  </Button>
                  <Button 
                    className="mobile-touch-target mobile-action-button h-14 sm:h-16 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium text-base sm:text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
                    onClick={() => setActiveTab('reports')}
                  >
                    <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                    حساب عامل
                  </Button>
                  <Button 
                    className="mobile-touch-target mobile-action-button h-14 sm:h-16 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium text-base sm:text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
                    onClick={() => setActiveTab('reports')}
                  >
                    <Package className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                    كشف المواد
                  </Button>
                  <Button 
                    className="mobile-touch-target mobile-action-button h-14 sm:h-16 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium text-base sm:text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
                    onClick={() => setActiveTab('analytics')}
                  >
                    <PieChart className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                    ملخص مشروع
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Daily Expenses Report */}
              <Card className="group hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-blue-50 to-blue-100 border-0 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Receipt className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">كشف المصروفات اليومية</h3>
                      <p className="text-blue-100">عرض تفصيلي لمصروفات يوم محدد مع الحوالات والأرصدة</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      التاريخ المطلوب
                    </label>
                    <Input
                      type="date"
                      value={dailyReportDate}
                      onChange={(e) => setDailyReportDate(e.target.value)}
                      className="h-12 text-lg border-2 border-blue-200 focus:border-blue-500 rounded-xl"
                    />
                  </div>
                  <Button 
                    onClick={generateDailyExpensesReport}
                    disabled={isGenerating}
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium text-lg rounded-xl transform hover:scale-105 transition-all duration-300"
                  >
                    {isGenerating ? (
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Eye className="h-5 w-5 mr-2" />
                    )}
                    إنشاء التقرير
                  </Button>
                </CardContent>
              </Card>

              {/* Worker Account Report */}
              <Card className="group hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-green-50 to-green-100 border-0 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <UserCheck className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">كشف حساب عامل</h3>
                      <p className="text-green-100">تقرير مفصل لحساب عامل محدد لفترة زمنية</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      اختيار العامل
                    </label>
                    <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                      <SelectTrigger className="h-12 text-lg border-2 border-green-200 focus:border-green-500 rounded-xl">
                        <SelectValue placeholder="اختر العامل..." />
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
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">من تاريخ</label>
                      <Input
                        type="date"
                        value={workerAccountDate1}
                        onChange={(e) => setWorkerAccountDate1(e.target.value)}
                        className="h-12 border-2 border-green-200 focus:border-green-500 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">إلى تاريخ</label>
                      <Input
                        type="date"
                        value={workerAccountDate2}
                        onChange={(e) => setWorkerAccountDate2(e.target.value)}
                        className="h-12 border-2 border-green-200 focus:border-green-500 rounded-xl"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={generateWorkerAccountReport}
                    disabled={isGenerating}
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium text-lg rounded-xl transform hover:scale-105 transition-all duration-300"
                  >
                    {isGenerating ? (
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Eye className="h-5 w-5 mr-2" />
                    )}
                    إنشاء التقرير
                  </Button>
                </CardContent>
              </Card>

              {/* Material Purchases Report */}
              <Card className="group hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-orange-50 to-orange-100 border-0 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Package className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">كشف المواد المشتراة</h3>
                      <p className="text-orange-100">تقرير شامل للمواد والتوريدات مع التفاصيل المالية</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">من تاريخ</label>
                      <Input
                        type="date"
                        value={materialReportDate1}
                        onChange={(e) => setMaterialReportDate1(e.target.value)}
                        className="h-12 border-2 border-orange-200 focus:border-orange-500 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">إلى تاريخ</label>
                      <Input
                        type="date"
                        value={materialReportDate2}
                        onChange={(e) => setMaterialReportDate2(e.target.value)}
                        className="h-12 border-2 border-orange-200 focus:border-orange-500 rounded-xl"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={generateMaterialPurchasesReport}
                    disabled={isGenerating}
                    className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium text-lg rounded-xl transform hover:scale-105 transition-all duration-300"
                  >
                    {isGenerating ? (
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Eye className="h-5 w-5 mr-2" />
                    )}
                    إنشاء التقرير
                  </Button>
                </CardContent>
              </Card>

              {/* Project Summary Report */}
              <Card className="group hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-purple-50 to-purple-100 border-0 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <PieChart className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">ملخص المشروع</h3>
                      <p className="text-purple-100">تقرير شامل ومفصل للمشروع مع الإحصائيات والمؤشرات</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">من تاريخ</label>
                      <Input
                        type="date"
                        value={projectSummaryDate1}
                        onChange={(e) => setProjectSummaryDate1(e.target.value)}
                        className="h-12 border-2 border-purple-200 focus:border-purple-500 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">إلى تاريخ</label>
                      <Input
                        type="date"
                        value={projectSummaryDate2}
                        onChange={(e) => setProjectSummaryDate2(e.target.value)}
                        className="h-12 border-2 border-purple-200 focus:border-purple-500 rounded-xl"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={generateProjectSummaryReport}
                    disabled={isGenerating}
                    className="w-full h-12 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium text-lg rounded-xl transform hover:scale-105 transition-all duration-300"
                  >
                    {isGenerating ? (
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Eye className="h-5 w-5 mr-2" />
                    )}
                    إنشاء التقرير
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-8">
            <Card className="bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
                <CardTitle className="text-3xl font-bold flex items-center gap-4">
                  <Activity className="h-10 w-10" />
                  التحليلات المتقدمة والإحصائيات التفصيلية
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="text-center py-12">
                  <Database className="h-24 w-24 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-700 mb-4">قريباً: تحليلات متقدمة</h3>
                  <p className="text-gray-500 text-lg">
                    ستتوفر قريباً ميزات التحليل المتقدم مع الرسوم البيانية التفاعلية والإحصائيات المفصلة
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Report Display Area */}
        {reportData && activeReportType && (
          <Card className="mt-8 bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <FileSpreadsheet className="h-7 w-7" />
                  نتائج التقرير
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => exportToCSV([reportData], `report-${activeReportType}`)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    تصدير Excel
                  </Button>
                  <Button
                    onClick={printReport}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    طباعة
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {activeReportType === 'daily' && renderDailyExpensesReport(reportData)}
              {activeReportType === 'worker' && renderWorkerAccountReport(reportData)}
              {activeReportType === 'material' && renderMaterialPurchasesReport(reportData)}
              {activeReportType === 'project' && renderProjectSummaryReport(reportData)}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}