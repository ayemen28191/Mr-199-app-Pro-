import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Calendar, Filter, CheckCircle2, FileSpreadsheet, Printer, User, Building2 } from 'lucide-react';
import WorkerFilterTemplate, { type WorkerFilterData } from '@/reports/templates/worker-filter-template';

interface Project {
  id: string;
  name: string;
  status: string;
}

interface Worker {
  id: string;
  name: string;
  type: string;
  dailyWage: number;
  isActive: boolean;
}

interface WorkerAttendanceRecord {
  id: string;
  workerId: string;
  workerName: string;
  workerType: string;
  projectId: string;
  projectName: string;
  date: string;
  dailyWage: number;
  actualWage: number;
  paidAmount: number;
  remainingAmount: number;
  isPresent: boolean;
  workDays: number;
}

interface WorkerFilterReportProps {
  // لا نحتاج selectedProjectId لأن المكون مستقل
}

export default function WorkerFilterReport({}: WorkerFilterReportProps) {
  // State للتحكم في الفلاتر
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [reportGenerated, setReportGenerated] = useState(false);

  // جلب المشاريع
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: true
  });

  // جلب سجلات حضور العمال للمشاريع المحددة
  const { data: workerAttendanceRecords = [], isLoading: workersLoading, error: workersError } = useQuery<WorkerAttendanceRecord[]>({
    queryKey: ['/api/worker-attendance', 'with-project-details', selectedProjects],
    enabled: selectedProjects.length > 0,
    queryFn: async () => {
      if (selectedProjects.length === 0) return [];
      const projectIds = selectedProjects.join(',');
      const response = await fetch(`/api/worker-attendance/by-projects?projectIds=${projectIds}&dateFrom=${dateFrom}&dateTo=${dateTo}`);
      if (!response.ok) throw new Error('فشل في جلب سجلات الحضور');
      return response.json();
    }
  });

  // رسائل تشخيصية
  console.log('🔍 حالة جلب سجلات الحضور:', { 
    attendanceRecords: workerAttendanceRecords.length, 
    selectedProjects: selectedProjects.length,
    isLoading: workersLoading, 
    hasError: !!workersError,
    error: workersError 
  });

  // معالجة سجلات الحضور لعرضها
  const filteredWorkers = useMemo(() => {
    console.log('🔍 معالجة سجلات الحضور:', { 
      recordsCount: workerAttendanceRecords.length, 
      selectedProjectsCount: selectedProjects.length
    });
    
    if (workerAttendanceRecords.length === 0) {
      return [];
    }

    // تجميع البيانات حسب العامل والمشروع
    const workerProjectMap = new Map<string, any>();
    
    workerAttendanceRecords.forEach(record => {
      const key = `${record.workerId}-${record.projectId}`;
      if (!workerProjectMap.has(key)) {
        workerProjectMap.set(key, {
          workerId: record.workerId,
          workerName: record.workerName,
          workerType: record.workerType,
          projectId: record.projectId,
          projectName: record.projectName,
          totalEarned: 0,
          totalPaid: 0,
          totalRemaining: 0,
          workDays: 0,
          dailyWage: record.dailyWage
        });
      }
      
      const entry = workerProjectMap.get(key);
      entry.totalEarned += Number(record.actualWage) || 0;
      entry.totalPaid += Number(record.paidAmount) || 0;
      entry.totalRemaining += Number(record.remainingAmount) || 0;
      entry.workDays += Number(record.workDays) || 0;
    });
    
    return Array.from(workerProjectMap.values());
  }, [workerAttendanceRecords, selectedProjects, dateFrom, dateTo]);

  // تعيين التاريخ الافتراضي
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  }, []);

  // لا نعتمد على المشروع المحدد عالمياً - المستخدم يختار بنفسه

  // وظائف التحكم في المشاريع
  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
    setSelectedWorkers([]); // إعادة تعيين العمال المختارين
  };

  const selectAllProjects = () => {
    setSelectedProjects(projects.map(p => p.id));
    setSelectedWorkers([]);
  };

  const clearProjectSelection = () => {
    setSelectedProjects([]);
    setSelectedWorkers([]);
  };

  // وظائف التحكم في العمال (نستخدم مفتاح مركب للعامل-المشروع)
  const handleWorkerToggle = (workerProjectKey: string) => {
    setSelectedWorkers(prev => 
      prev.includes(workerProjectKey) 
        ? prev.filter(id => id !== workerProjectKey)
        : [...prev, workerProjectKey]
    );
  };

  const selectAllWorkers = () => {
    setSelectedWorkers(filteredWorkers.map(w => `${w.workerId}-${w.projectId}`));
  };

  const clearWorkerSelection = () => {
    setSelectedWorkers([]);
  };

  // إنشاء التقرير
  const generateReport = () => {
    if (filteredWorkers.length === 0) {
      alert('لا توجد عمال متاحين لإنشاء التقرير');
      return;
    }
    
    // إنشاء التقرير حتى لو لم تكن هناك تواريخ محددة
    setReportGenerated(true);
  };

  // إحصائيات الاختيار
  const selectedProjectsData = projects.filter(p => selectedProjects.includes(p.id));
  const selectedWorkersData = filteredWorkers.filter(w => selectedWorkers.includes(`${w.workerId}-${w.projectId}`));

  // إنشاء بيانات التقرير للعرض
  const generateReportData = (): WorkerFilterData => {
    return {
      companyName: 'شركة الفتني للمقاولات والاستشارات الهندسية',
      reportTitle: 'كشف تصفية العمال',
      dateRange: {
        from: dateFrom || '2025-01-01',
        to: dateTo || new Date().toISOString().split('T')[0]
      },
      projectCount: selectedProjectsData.length,
      workerCount: selectedWorkersData.length,
      totalDailyWages: selectedWorkersData.reduce((sum, w) => sum + w.dailyWage, 0),
      workers: selectedWorkersData.map(worker => {
        return {
          id: `${worker.workerId}-${worker.projectId}`,
          name: worker.workerName,
          type: worker.workerType,
          project: worker.projectName,
          dailyWage: worker.dailyWage,
          workDays: worker.workDays,
          totalEarned: worker.totalEarned,
          totalPaid: worker.totalPaid,
          remaining: worker.totalRemaining,
          isActive: true, // العمال الذين لديهم سجلات حضور
          notes: ''
        };
      }),
      totals: {
        totalRemaining: 0,
        totalPaid: 0,
        totalEarned: 0,
        totalWorkDays: 0,
        averageDailyWage: selectedWorkersData.length > 0 
          ? Math.round(selectedWorkersData.reduce((sum, w) => sum + w.dailyWage, 0) / selectedWorkersData.length)
          : 0
      }
    };
  };

  // حساب الإجماليات
  const reportData = generateReportData();
  if (reportData.workers.length > 0) {
    reportData.totals = {
      totalEarned: reportData.workers.reduce((sum, w) => sum + w.totalEarned, 0),
      totalPaid: reportData.workers.reduce((sum, w) => sum + w.totalPaid, 0),
      totalRemaining: reportData.workers.reduce((sum, w) => sum + w.remaining, 0),
      totalWorkDays: reportData.workers.reduce((sum, w) => sum + w.workDays, 0),
      averageDailyWage: reportData.totalDailyWages / reportData.workers.length || 0
    };
  }

  // وظائف التصدير
  const handleExportExcel = () => {
    console.log('تصدير Excel للعمال المفلترين');
    // سيتم إضافة منطق التصدير لاحقاً
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* عنوان التقرير */}
      <Card className="shadow-lg border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="bg-green-600 p-3 rounded-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-green-800 dark:text-green-200">تقرير تصفية العمال</h2>
              <p className="text-sm text-green-600 dark:text-green-400 font-normal mt-1">
                تقرير شامل للعمال المحددين مع الأجور والأدوار المهنية
              </p>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* إعداد تقرير تصفية العمال */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardTitle className="flex items-center gap-3">
            <Filter className="h-6 w-6 text-blue-600" />
            إعداد تقرير تصفية العمال
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          {/* اختيار المشاريع (مطلوب) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                <Building2 className="inline h-5 w-5 mr-2" />
                اختيار المشاريع (مطلوب)
              </label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={selectAllProjects}
                  disabled={projects.length === 0}
                >
                  تحديد الكل
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearProjectSelection}
                >
                  إلغاء التحديد
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg min-h-[120px]">
              {projects.length === 0 ? (
                <div className="col-span-full text-center text-gray-500 py-8">
                  <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>لا توجد مشاريع متاحة</p>
                </div>
              ) : (
                projects.map(project => (
                  <div key={project.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`project-${project.id}`}
                      checked={selectedProjects.includes(project.id)}
                      onCheckedChange={() => handleProjectToggle(project.id)}
                    />
                    <label 
                      htmlFor={`project-${project.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {project.name}
                    </label>
                  </div>
                ))
              )}
            </div>

            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
              <p className="text-blue-600 dark:text-blue-400 font-medium">
                📋 سيتم عرض العمال الذين عملوا في المشاريع المحددة فقط
              </p>
              <p className="text-sm text-blue-500 mt-1">
                اختر المشاريع أولاً لعرض العمال المتاحين
              </p>
            </div>
          </div>

          {/* فترة التقرير */}
          <div className="space-y-4">
            <label className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              <Calendar className="inline h-5 w-5 mr-2" />
              فترة التقرير
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">من تاريخ (اختياري)</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">إلى تاريخ (اختياري)</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="text-lg"
                />
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 mt-1">💡</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-semibold">نصائح لاختيار الفترة:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>اتركها فارغة لشمول جميع السجلات</li>
                    <li>اختر فترة محددة لتقرير معين</li>
                    <li>الفترات الطويلة تحتاج وقت أكثر للمعالجة</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* اختيار العمال */}
          {
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  <User className="inline h-5 w-5 mr-2" />
                  اختيار العمال ({filteredWorkers.length} متاح)
                </label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={selectAllWorkers}
                    disabled={filteredWorkers.length === 0}
                  >
                    تحديد الكل ({filteredWorkers.length})
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearWorkerSelection}
                  >
                    إلغاء التحديد
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg min-h-[200px] max-h-[400px] overflow-y-auto">
                {workersLoading ? (
                  <div className="col-span-full text-center text-blue-500 py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p>جاري تحميل العمال...</p>
                  </div>
                ) : workersError ? (
                  <div className="col-span-full text-center text-red-500 py-8">
                    <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>خطأ في تحميل العمال</p>
                    <p className="text-sm mt-1">{workersError.message}</p>
                  </div>
                ) : filteredWorkers.length === 0 ? (
                  <div className="col-span-full text-center text-gray-500 py-8">
                    <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>لا توجد عمال متاحين</p>
                    <p className="text-sm mt-1">سجلات الحضور: {workerAttendanceRecords.length} | مفلتر: {filteredWorkers.length}</p>
                    <p className="text-sm mt-1">اختر المشاريع والتواريخ لعرض العمال الذين عملوا فيها</p>
                  </div>
                ) : (
                  filteredWorkers.map(worker => {
                    const workerKey = `${worker.workerId}-${worker.projectId}`;
                    return (
                      <div key={workerKey} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={`worker-${workerKey}`}
                            checked={selectedWorkers.includes(workerKey)}
                            onCheckedChange={() => handleWorkerToggle(workerKey)}
                          />
                          <div className="flex-1">
                            <label 
                              htmlFor={`worker-${workerKey}`}
                              className="font-medium cursor-pointer text-lg"
                            >
                              {worker.workerName}
                            </label>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{worker.workerType}</p>
                            <div className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded mt-1 text-xs">
                              <span className="text-blue-700 dark:text-blue-300 font-medium">{worker.projectName}</span>
                            </div>
                            <div className="flex gap-4 mt-2 text-xs">
                              <span className="text-black font-medium">المستحق: {worker.totalEarned.toLocaleString('en')} YER</span>
                              <span className="text-red-600 font-medium">المستلم: {worker.totalPaid.toLocaleString('en')} YER</span>
                              <span className="text-green-600 font-medium">المتبقي: {worker.totalRemaining.toLocaleString('en')} YER</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-left">
                          <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                            {worker.workDays.toLocaleString('en')} أيام
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{worker.dailyWage.toLocaleString('en')} YER/يوم</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          }

          {/* معلومات الاختيار */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{selectedProjectsData.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">مشروع محدد</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{selectedWorkersData.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">عامل محدد</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {selectedWorkersData.reduce((sum, worker) => sum + worker.dailyWage, 0).toLocaleString('en')} YER
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">إجمالي الأجور اليومية</div>
            </div>
          </div>

          {/* زر إنشاء التقرير */}
          <div className="flex justify-center">
            <Button
              onClick={generateReport}
              disabled={filteredWorkers.length === 0}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 text-lg"
              size="lg"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              إنشاء التقرير
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* عرض التقرير بالقالب الجديد */}
      {reportGenerated && (
        <Card className="shadow-lg border-2 border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6" />
                تقرير تصفية العمال
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleExportExcel}
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  تصدير Excel
                </Button>
                <Button
                  onClick={handlePrintReport}
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  طباعة
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div 
              id="worker-filter-report-preview" 
              className="bg-white"
            >
              <WorkerFilterTemplate data={reportData} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}