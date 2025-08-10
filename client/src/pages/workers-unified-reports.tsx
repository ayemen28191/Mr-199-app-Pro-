import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useSelectedProject } from "@/hooks/use-selected-project";
import { 
  Users, FileText, Download, RefreshCw, Filter, User, DollarSign, UserCheck, Printer, 
  Calendar, Clock, Building2, Phone, MapPin, CheckSquare, X
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate, getCurrentDate } from "@/lib/utils";
import { EnhancedWorkerAccountStatement } from "@/components/EnhancedWorkerAccountStatementFixed";
import type { Worker, Project } from "@shared/schema";
import * as XLSX from 'xlsx';

export default function WorkersUnifiedReports() {
  const { selectedProjectId } = useSelectedProject();
  const { toast } = useToast();
  
  // States for report modes
  const [reportMode, setReportMode] = useState<'single' | 'multiple'>('single');
  
  // Single worker states
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [singleWorkerProjectIds, setSingleWorkerProjectIds] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState(getCurrentDate());
  const [showWorkerStatement, setShowWorkerStatement] = useState(false);
  
  // Multiple workers states
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Fetch data
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedWorker = workers.find(w => w.id === selectedWorkerId);

  // Toggle worker selection for multiple mode
  const toggleWorkerSelection = (workerId: string) => {
    setSelectedWorkerIds(prev => 
      prev.includes(workerId) 
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

  // Toggle project selection
  const toggleProjectSelection = (projectId: string, mode: 'single' | 'multiple') => {
    if (mode === 'single') {
      setSingleWorkerProjectIds(prev => 
        prev.includes(projectId) 
          ? prev.filter(id => id !== projectId)
          : [...prev, projectId]
      );
    } else {
      setSelectedProjectIds(prev => 
        prev.includes(projectId) 
          ? prev.filter(id => id !== projectId)
          : [...prev, projectId]
      );
    }
  };

  // Generate single worker account statement
  const generateSingleWorkerStatement = async () => {
    if (!selectedWorkerId || !dateFrom || !dateTo) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى اختيار العامل والتواريخ",
        variant: "destructive",
      });
      return;
    }

    if (singleWorkerProjectIds.length === 0) {
      toast({
        title: "لم يتم تحديد مشاريع",
        description: "يرجى تحديد مشروع واحد على الأقل لإنشاء كشف الحساب",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // إنشاء URL مع فلترة المشاريع للعامل الواحد
      let url = `/api/workers/${selectedWorkerId}/account-statement?dateFrom=${dateFrom}&dateTo=${dateTo}`;
      
      // إضافة فلترة المشاريع - استخدام projectIds للمشاريع المتعددة
      url += `&projectIds=${singleWorkerProjectIds.join(',')}`;

      console.log('🔍 جاري جمع بيانات كشف الحساب:', url);

      const response = await apiRequest(url, 'GET');
      
      if (response) {
        console.log('✅ تم جمع بيانات كشف الحساب:', response);
        setReportData([response]);
        setShowWorkerStatement(true);
        
        toast({
          title: "تم إنشاء كشف الحساب",
          description: `كشف حساب العامل ${response.worker?.name}`,
        });
      } else {
        toast({
          title: "لا توجد بيانات",
          description: "لم يتم العثور على بيانات للعامل في الفترة المحددة",
          variant: "destructive",
        });
      }
      
    } catch (error: any) {
      console.error('خطأ في إنشاء كشف حساب العامل:', error);
      toast({
        title: "خطأ في إنشاء كشف الحساب",
        description: error?.message || "حدث خطأ أثناء جمع بيانات العامل",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  // Generate multiple workers report  
  const generateMultipleWorkersReport = async () => {
    if (selectedWorkerIds.length === 0 || !dateFrom || !dateTo) {
      toast({
        title: "بيانات ناقصة", 
        description: "يرجى اختيار العمال والتواريخ",
        variant: "destructive",
      });
      return;
    }

    if (selectedProjectIds.length === 0) {
      toast({
        title: "لم يتم تحديد مشاريع",
        description: "يرجى تحديد مشروع واحد على الأقل لإنشاء التقرير",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // جمع البيانات من جميع العمال المحددين
      const allAttendanceData: any[] = [];
      
      console.log('🔍 جاري جمع بيانات العمال المتعددين:', { selectedWorkerIds, selectedProjectIds });
      
      for (const workerId of selectedWorkerIds) {
        // إنشاء URL مع فلترة المشاريع
        let url = `/api/workers/${workerId}/account-statement?dateFrom=${dateFrom}&dateTo=${dateTo}`;
        
        // إضافة فلترة المشاريع - استخدام projectIds للمشاريع المتعددة
        url += `&projectIds=${selectedProjectIds.join(',')}`;

        console.log(`🔍 جمع بيانات العامل ${workerId}:`, url);

        const response = await apiRequest(url, 'GET');
        
        if (response && response.attendance) {
          allAttendanceData.push(...response.attendance.map((att: any) => ({
            ...att,
            workerName: response.worker?.name || '',
            workerType: response.worker?.type || '',
            workerDailyWage: response.worker?.dailyWage || 0,
            projectName: att.project?.name || ''
          })));
        }
      }

      console.log('✅ تم جمع جميع البيانات:', { totalRecords: allAttendanceData.length });

      if (allAttendanceData.length === 0) {
        toast({
          title: "لا توجد بيانات",
          description: "لم يتم العثور على بيانات حضور للعمال المحددين في الفترة المحددة",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      setReportData(allAttendanceData);
      setShowResults(true);
      
      toast({
        title: "تم إنشاء التقرير",
        description: `تم جمع بيانات ${allAttendanceData.length} سجل حضور من ${selectedWorkerIds.length} عامل`,
      });
      
    } catch (error: any) {
      console.error('خطأ في إنشاء تقرير العمال:', error);
      toast({
        title: "خطأ في إنشاء التقرير",
        description: error?.message || "حدث خطأ أثناء جمع بيانات العمال",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  // Export to Excel - Single Worker
  const exportSingleWorkerToExcel = () => {
    if (!reportData || reportData.length === 0) {
      toast({
        title: "لا توجد بيانات للتصدير",
        variant: "destructive",
      });
      return;
    }

    const data = reportData[0];
    const worker = data.worker;
    const attendance = data.attendance || [];
    const transfers = data.transfers || [];

    // إعداد البيانات للإكسل
    const workbook = XLSX.utils.book_new();

    // ورقة كشف الحساب
    const accountData = [
      ['كشف حساب العامل'],
      [''],
      ['اسم العامل:', worker?.name || ''],
      ['نوع العامل:', worker?.type || ''],
      ['الأجر اليومي:', formatCurrency(worker?.dailyWage || 0)],
      ['من تاريخ:', formatDate(dateFrom)],
      ['إلى تاريخ:', formatDate(dateTo)],
      [''],
      ['تفاصيل الحضور:'],
      ['التاريخ', 'المشروع', 'الأيام', 'الوصف', 'الأجر المستحق', 'المبلغ المدفوع', 'نوع الدفع', 'ملاحظات'],
      ...attendance.map((att: any) => [
        formatDate(att.date),
        att.project?.name || '',
        att.workDays,
        att.workDescription || '',
        formatCurrency(att.dailyWage * att.workDays),
        formatCurrency(att.paidAmount || 0),
        att.paymentType || '',
        att.notes || ''
      ]),
      [''],
      ['تحويلات للأهل:'],
      ['التاريخ', 'المبلغ', 'رقم التحويل', 'اسم المرسل', 'اسم المستلم', 'رقم المستلم', 'طريقة التحويل', 'ملاحظات'],
      ...transfers.map((transfer: any) => [
        formatDate(transfer.date),
        formatCurrency(transfer.amount),
        transfer.transferNumber || '',
        transfer.senderName || '',
        transfer.recipientName || '',
        transfer.recipientPhone || '',
        transfer.transferMethod || '',
        transfer.notes || ''
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(accountData);
    
    // تنسيق الخلايا
    worksheet['!cols'] = [
      { width: 12 }, { width: 15 }, { width: 8 }, { width: 20 }, 
      { width: 12 }, { width: 12 }, { width: 12 }, { width: 20 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'كشف حساب العامل');

    // حفظ الملف
    const fileName = `كشف_حساب_${worker?.name || 'عامل'}_${formatDate(dateFrom)}_${formatDate(dateTo)}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "تم تصدير كشف الحساب",
      description: `تم حفظ الملف: ${fileName}`,
    });
  };

  // Export to Excel - Multiple Workers
  const exportMultipleWorkersToExcel = () => {
    if (!reportData || reportData.length === 0) {
      toast({
        title: "لا توجد بيانات للتصدير",
        variant: "destructive",
      });
      return;
    }

    const workbook = XLSX.utils.book_new();

    // ورقة التقرير الموحد
    const reportDataForExcel = [
      ['تقرير تصفية العمال الموحد'],
      [''],
      ['من تاريخ:', formatDate(dateFrom)],
      ['إلى تاريخ:', formatDate(dateTo)],
      ['عدد العمال:', selectedWorkerIds.length],
      ['عدد المشاريع:', selectedProjectIds.length || 'جميع المشاريع'],
      [''],
      ['تفاصيل الحضور:'],
      ['العامل', 'نوع العامل', 'الأجر اليومي', 'التاريخ', 'المشروع', 'الأيام', 'الوصف', 'الأجر المستحق', 'المبلغ المدفوع', 'نوع الدفع', 'ملاحظات'],
      ...reportData.map((row: any) => [
        row.workerName,
        row.workerType,
        formatCurrency(row.workerDailyWage),
        formatDate(row.date),
        row.projectName,
        row.workDays,
        row.workDescription || '',
        formatCurrency(row.dailyWage * row.workDays),
        formatCurrency(row.paidAmount || 0),
        row.paymentType || '',
        row.notes || ''
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(reportDataForExcel);
    
    // تنسيق الخلايا
    worksheet['!cols'] = [
      { width: 15 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 15 }, 
      { width: 8 }, { width: 20 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 20 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'تقرير العمال');

    // حفظ الملف
    const fileName = `تقرير_تصفية_العمال_${formatDate(dateFrom)}_${formatDate(dateTo)}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "تم تصدير التقرير",
      description: `تم حفظ الملف: ${fileName}`,
    });
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="border-t-4 border-t-blue-500 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <CardTitle className="text-2xl font-bold text-center text-blue-800 dark:text-blue-200 flex items-center justify-center gap-3">
              <Users className="h-8 w-8" />
              تقارير العمال الموحدة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            
            {/* Report Mode Selection */}
            <div className="mb-6">
              <Label className="text-base font-semibold mb-3 block">اختر نوع التقرير:</Label>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setReportMode('single');
                    setShowWorkerStatement(false);
                    setShowResults(false);
                  }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${
                    reportMode === 'single'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
                  }`}
                >
                  <User className="h-5 w-5" />
                  كشف حساب العامل الواحد
                </button>
                <button
                  onClick={() => {
                    setReportMode('multiple');
                    setShowWorkerStatement(false);
                    setShowResults(false);
                  }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${
                    reportMode === 'multiple'
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  تقرير تصفية العمال
                </button>
              </div>
            </div>

            {/* Date Range Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="dateFrom" className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  من تاريخ
                </Label>
                <Input
                  type="date"
                  id="dateFrom"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="border-2 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="dateTo" className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  إلى تاريخ
                </Label>
                <Input
                  type="date"
                  id="dateTo"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border-2 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Single Worker Mode */}
            {reportMode === 'single' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Worker Selection */}
                  <div>
                    <Label className="flex items-center gap-2 mb-3 text-base font-semibold">
                      <User className="h-5 w-5 text-green-500" />
                      اختيار العامل
                    </Label>
                    <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                      <SelectTrigger className="border-2 focus:border-green-500">
                        <SelectValue placeholder="اختر العامل..." />
                      </SelectTrigger>
                      <SelectContent>
                        {workers.map((worker) => (
                          <SelectItem key={worker.id} value={worker.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{worker.name}</span>
                              <Badge variant="secondary" className="mr-2">
                                {worker.type}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Project Selection for Single Worker */}
                  <div>
                    <Label className="flex items-center gap-2 mb-3 text-base font-semibold">
                      <Building2 className="h-5 w-5 text-purple-500" />
                      اختيار المشاريع (اختياري)
                    </Label>
                    <div className="border rounded-lg p-4 max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Checkbox
                          id="select-all-single"
                          checked={singleWorkerProjectIds.length === projects.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSingleWorkerProjectIds(projects.map(p => p.id));
                            } else {
                              setSingleWorkerProjectIds([]);
                            }
                          }}
                        />
                        <Label htmlFor="select-all-single" className="font-medium text-blue-600">
                          تحديد جميع المشاريع ({projects.length})
                        </Label>
                      </div>
                      <div className="space-y-2">
                        {projects.map((project) => (
                          <div key={project.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`single-project-${project.id}`}
                              checked={singleWorkerProjectIds.includes(project.id)}
                              onCheckedChange={() => toggleProjectSelection(project.id, 'single')}
                            />
                            <Label htmlFor={`single-project-${project.id}`} className="flex-1">
                              {project.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {singleWorkerProjectIds.length === 0 && (
                        <p className="text-sm text-gray-500 mt-2">
                          * إذا لم تحدد أي مشروع، سيتم عرض جميع المشاريع
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Generate Button for Single Worker */}
                <div className="flex justify-center">
                  <Button
                    onClick={generateSingleWorkerStatement}
                    disabled={isGenerating || !selectedWorkerId || !dateFrom || !dateTo}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        جاري إنشاء كشف الحساب...
                      </>
                    ) : (
                      <>
                        <FileText className="h-5 w-5 mr-2" />
                        إنشاء كشف حساب العامل
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Multiple Workers Mode */}
            {reportMode === 'multiple' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Workers Selection */}
                  <div>
                    <Label className="flex items-center gap-2 mb-3 text-base font-semibold">
                      <Users className="h-5 w-5 text-blue-500" />
                      اختيار العمال
                    </Label>
                    <div className="border rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Checkbox
                          id="select-all-workers"
                          checked={selectedWorkerIds.length === workers.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedWorkerIds(workers.map(w => w.id));
                            } else {
                              setSelectedWorkerIds([]);
                            }
                          }}
                        />
                        <Label htmlFor="select-all-workers" className="font-medium text-blue-600">
                          تحديد جميع العمال ({workers.length})
                        </Label>
                      </div>
                      <div className="space-y-2">
                        {workers.map((worker) => (
                          <div key={worker.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`worker-${worker.id}`}
                              checked={selectedWorkerIds.includes(worker.id)}
                              onCheckedChange={() => toggleWorkerSelection(worker.id)}
                            />
                            <Label htmlFor={`worker-${worker.id}`} className="flex-1 flex items-center justify-between">
                              <span>{worker.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {worker.type}
                              </Badge>
                            </Label>
                          </div>
                        ))}
                      </div>
                      {selectedWorkerIds.length > 0 && (
                        <p className="text-sm text-green-600 mt-2">
                          تم تحديد {selectedWorkerIds.length} عامل
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Projects Selection for Multiple Workers */}
                  <div>
                    <Label className="flex items-center gap-2 mb-3 text-base font-semibold">
                      <Building2 className="h-5 w-5 text-purple-500" />
                      اختيار المشاريع (اختياري)
                    </Label>
                    <div className="border rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Checkbox
                          id="select-all-multiple"
                          checked={selectedProjectIds.length === projects.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProjectIds(projects.map(p => p.id));
                            } else {
                              setSelectedProjectIds([]);
                            }
                          }}
                        />
                        <Label htmlFor="select-all-multiple" className="font-medium text-purple-600">
                          تحديد جميع المشاريع ({projects.length})
                        </Label>
                      </div>
                      <div className="space-y-2">
                        {projects.map((project) => (
                          <div key={project.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`multiple-project-${project.id}`}
                              checked={selectedProjectIds.includes(project.id)}
                              onCheckedChange={() => toggleProjectSelection(project.id, 'multiple')}
                            />
                            <Label htmlFor={`multiple-project-${project.id}`} className="flex-1">
                              {project.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {selectedProjectIds.length === 0 && (
                        <p className="text-sm text-gray-500 mt-2">
                          * إذا لم تحدد أي مشروع، سيتم عرض جميع المشاريع
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Generate Button for Multiple Workers */}
                <div className="flex justify-center">
                  <Button
                    onClick={generateMultipleWorkersReport}
                    disabled={isGenerating || selectedWorkerIds.length === 0 || !dateFrom || !dateTo}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        جاري إنشاء التقرير...
                      </>
                    ) : (
                      <>
                        <Filter className="h-5 w-5 mr-2" />
                        إنشاء تقرير تصفية العمال
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Single Worker Statement Display */}
        {showWorkerStatement && reportData.length > 0 && reportMode === 'single' && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-green-800 dark:text-green-200">
                  كشف حساب العامل: {selectedWorker?.name}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={exportSingleWorkerToExcel}
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    تصدير إكسل
                  </Button>
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    طباعة
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <EnhancedWorkerAccountStatement
                data={reportData[0]}
                selectedProject={selectedProject || { id: '', name: 'جميع المشاريع' }}
                workerId={selectedWorkerId}
                dateFrom={dateFrom}
                dateTo={dateTo}
              />
            </CardContent>
          </Card>
        )}

        {/* Multiple Workers Report Display */}
        {showResults && reportData.length > 0 && reportMode === 'multiple' && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-blue-800 dark:text-blue-200">
                  تقرير تصفية العمال ({reportData.length} سجل)
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={exportMultipleWorkersToExcel}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    تصدير إكسل
                  </Button>
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    طباعة
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800">
                      <TableHead className="text-right font-bold">العامل</TableHead>
                      <TableHead className="text-right font-bold">النوع</TableHead>
                      <TableHead className="text-right font-bold">الأجر اليومي</TableHead>
                      <TableHead className="text-right font-bold">التاريخ</TableHead>
                      <TableHead className="text-right font-bold">المشروع</TableHead>
                      <TableHead className="text-right font-bold">الأيام</TableHead>
                      <TableHead className="text-right font-bold">الوصف</TableHead>
                      <TableHead className="text-right font-bold">المستحق</TableHead>
                      <TableHead className="text-right font-bold">المدفوع</TableHead>
                      <TableHead className="text-right font-bold">نوع الدفع</TableHead>
                      <TableHead className="text-right font-bold">ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((row, index) => (
                      <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell className="font-medium">{row.workerName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.workerType}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(row.workerDailyWage)}</TableCell>
                        <TableCell>{formatDate(row.date)}</TableCell>
                        <TableCell className="font-medium">{row.projectName}</TableCell>
                        <TableCell className="text-center">{row.workDays}</TableCell>
                        <TableCell>{row.workDescription || '-'}</TableCell>
                        <TableCell className="font-bold text-blue-600">
                          {formatCurrency(row.dailyWage * row.workDays)}
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          {formatCurrency(row.paidAmount || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.paymentType === 'full' ? 'default' : 'secondary'}>
                            {row.paymentType === 'full' ? 'كامل' : 
                             row.paymentType === 'partial' ? 'جزئي' : 
                             row.paymentType === 'none' ? 'لم يُدفع' : row.paymentType}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-bold mb-4">ملخص التقرير:</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {reportData.reduce((sum, row) => sum + row.workDays, 0)}
                    </div>
                    <div className="text-sm text-gray-600">إجمالي أيام العمل</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(reportData.reduce((sum, row) => sum + (row.dailyWage * row.workDays), 0))}
                    </div>
                    <div className="text-sm text-gray-600">إجمالي المستحق</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(reportData.reduce((sum, row) => sum + (row.paidAmount || 0), 0))}
                    </div>
                    <div className="text-sm text-gray-600">إجمالي المدفوع</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(reportData.reduce((sum, row) => sum + (row.dailyWage * row.workDays) - (row.paidAmount || 0), 0))}
                    </div>
                    <div className="text-sm text-gray-600">المبلغ المتبقي</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}