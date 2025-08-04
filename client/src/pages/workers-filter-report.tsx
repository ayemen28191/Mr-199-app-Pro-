import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Users, Briefcase, FileText, Download, Eye, RefreshCw, Filter, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Worker {
  id: string;
  name: string;
  type: string;
  dailyWage: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
}

interface WorkerAttendance {
  id: string;
  workerId: string;
  projectId: string;
  date: string;
  hoursWorked: number;
  dailyWage: string;
  paidAmount: string;
  notes?: string;
  worker?: Worker;
  project?: Project;
}

const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

export default function WorkersFilterReport() {
  const { toast } = useToast();
  
  // States
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reportData, setReportData] = useState<WorkerAttendance[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Fetch data
  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const generateReport = async () => {
    if (!selectedWorkerId || !dateFrom || !dateTo) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى اختيار العامل والتواريخ",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // إنشاء URL مع فلترة المشاريع
      let url = `/api/workers/${selectedWorkerId}/account-statement?dateFrom=${dateFrom}&dateTo=${dateTo}`;
      
      // إضافة فلترة المشاريع إذا تم تحديدها
      if (selectedProjectIds.length > 0) {
        const projectsQuery = selectedProjectIds.map(id => `projectIds=${id}`).join('&');
        url += `&${projectsQuery}`;
      }
      
      const data = await apiRequest("GET", url);
      
      // إضافة معلومات العمال والمشاريع للحضور
      const attendanceWithDetails = await Promise.all(
        (data.attendance || []).map(async (attendance: WorkerAttendance) => {
          const worker = workers.find(w => w.id === attendance.workerId);
          const project = projects.find(p => p.id === attendance.projectId);
          return {
            ...attendance,
            worker,
            project
          };
        })
      );
      
      setReportData(attendanceWithDetails);
      setShowResults(true);
      
      toast({
        title: "تم إنشاء التقرير",
        description: `تم العثور على ${attendanceWithDetails.length} سجل حضور`,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء التقرير",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToExcel = () => {
    if (reportData.length === 0) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات للتصدير",
        variant: "destructive",
      });
      return;
    }
    
    // تحويل البيانات إلى CSV
    const headers = ["التاريخ", "العامل", "المشروع", "ساعات العمل", "الأجر اليومي", "المبلغ المدفوع", "الملاحظات"];
    const csvData = [
      headers.join(','),
      ...reportData.map(row => [
        row.date,
        row.worker?.name || 'غير محدد',
        row.project?.name || 'غير محدد',
        row.hoursWorked,
        parseFloat(row.dailyWage).toLocaleString(),
        parseFloat(row.paidAmount).toLocaleString(),
        row.notes || ''
      ].map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // إنشاء ملف وتحميله
    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    
    const selectedWorker = workers.find(w => w.id === selectedWorkerId);
    const projectNames = selectedProjectIds.length > 0 
      ? projects.filter(p => selectedProjectIds.includes(p.id)).map(p => p.name).join('-')
      : 'جميع-المشاريع';
    
    link.download = `تقرير-العامل-${selectedWorker?.name || 'غير-محدد'}-${projectNames}-${dateFrom}-إلى-${dateTo}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "تم التصدير",
      description: "تم تصدير التقرير بنجاح",
    });
  };

  const resetForm = () => {
    setSelectedWorkerId("");
    setSelectedProjectIds([]);
    setDateFrom("");
    setDateTo("");
    setReportData([]);
    setShowResults(false);
  };

  // حساب الإجماليات
  const totalHours = reportData.reduce((sum, record) => sum + record.hoursWorked, 0);
  const totalAmount = reportData.reduce((sum, record) => sum + parseFloat(record.paidAmount), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
            تصفية العمال حسب المشاريع
          </h1>
          <p className="text-slate-600 text-lg">
            تقرير مفصل لحضور العمال في مشاريع محددة
          </p>
        </div>

        {/* Filter Form */}
        <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <Filter className="h-7 w-7" />
              فلترة التقرير
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Worker Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  اختيار العامل
                  <span className="text-red-500">*</span>
                </label>
                <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                  <SelectTrigger className="h-12 text-lg border-2 border-blue-200 focus:border-blue-500 rounded-xl">
                    <SelectValue placeholder="اختر العامل..." />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.name} - {worker.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    من تاريخ
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-12 border-2 border-blue-200 focus:border-blue-500 rounded-xl"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    إلى تاريخ
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-12 border-2 border-blue-200 focus:border-blue-500 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Projects Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                المشاريع المطلوبة (اختياري - إذا لم تحدد سيتم عرض جميع المشاريع)
              </label>
              <div className="max-h-40 overflow-y-auto border-2 border-blue-200 rounded-xl p-4 space-y-3 bg-gray-50">
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    id="all-projects"
                    checked={selectedProjectIds.length === 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProjectIds([]);
                      }
                    }}
                    className="rounded border-gray-300 w-4 h-4"
                  />
                  <label htmlFor="all-projects" className="text-sm font-medium text-gray-700 mr-2">
                    جميع المشاريع
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center space-x-2 p-2 hover:bg-white rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        id={`project-${project.id}`}
                        checked={selectedProjectIds.includes(project.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProjectIds(prev => [...prev, project.id]);
                          } else {
                            setSelectedProjectIds(prev => prev.filter(id => id !== project.id));
                          }
                        }}
                        className="rounded border-gray-300 w-4 h-4"
                      />
                      <label htmlFor={`project-${project.id}`} className="text-sm text-gray-600 mr-2">
                        {project.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Button 
                onClick={generateReport}
                disabled={isGenerating}
                className="flex-1 min-w-[200px] h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium text-lg rounded-xl transform hover:scale-105 transition-all duration-300"
              >
                {isGenerating ? (
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Search className="h-5 w-5 mr-2" />
                )}
                إنشاء التقرير
              </Button>
              
              {showResults && (
                <>
                  <Button 
                    onClick={exportToExcel}
                    className="flex-1 min-w-[200px] h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium text-lg rounded-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    تصدير إلى Excel
                  </Button>
                  
                  <Button 
                    onClick={resetForm}
                    variant="outline"
                    className="min-w-[150px] h-12 border-2 border-gray-300 text-gray-700 font-medium text-lg rounded-xl hover:bg-gray-50"
                  >
                    إعادة تعيين
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {showResults && (
          <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <FileText className="h-7 w-7" />
                  نتائج التقرير
                </CardTitle>
                <div className="text-green-100">
                  <span className="text-sm">عدد السجلات: </span>
                  <span className="text-xl font-bold">{reportData.length}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {reportData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <FileText className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-600 mb-2">لا توجد بيانات</h3>
                  <p className="text-gray-500">لم يتم العثور على سجلات حضور للفلترة المحددة</p>
                </div>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4 text-center">
                        <h3 className="text-sm font-medium text-blue-600 mb-1">إجمالي الساعات</h3>
                        <p className="text-2xl font-bold text-blue-800">{totalHours.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4 text-center">
                        <h3 className="text-sm font-medium text-green-600 mb-1">إجمالي المبلغ</h3>
                        <p className="text-2xl font-bold text-green-800">{totalAmount.toLocaleString()} ر.ي</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-4 text-center">
                        <h3 className="text-sm font-medium text-purple-600 mb-1">عدد الأيام</h3>
                        <p className="text-2xl font-bold text-purple-800">{reportData.length}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Data Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-right font-bold">التاريخ</TableHead>
                          <TableHead className="text-right font-bold">العامل</TableHead>
                          <TableHead className="text-right font-bold">المشروع</TableHead>
                          <TableHead className="text-right font-bold">ساعات العمل</TableHead>
                          <TableHead className="text-right font-bold">الأجر اليومي</TableHead>
                          <TableHead className="text-right font-bold">المبلغ المدفوع</TableHead>
                          <TableHead className="text-right font-bold">الملاحظات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.map((record) => (
                          <TableRow key={record.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{record.date}</TableCell>
                            <TableCell>{record.worker?.name || 'غير محدد'}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                {record.project?.name || 'غير محدد'}
                              </span>
                            </TableCell>
                            <TableCell className="text-center font-medium">{record.hoursWorked}</TableCell>
                            <TableCell className="text-green-600 font-medium">
                              {parseFloat(record.dailyWage).toLocaleString()} ر.ي
                            </TableCell>
                            <TableCell className="text-green-700 font-bold">
                              {parseFloat(record.paidAmount).toLocaleString()} ر.ي
                            </TableCell>
                            <TableCell className="text-gray-600 text-sm">
                              {record.notes || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}