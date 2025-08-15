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
  projectId: string;
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

  // جلب جميع العمال (سيتم تصفيتهم لاحقاً)
  const { data: allWorkers = [] } = useQuery<Worker[]>({
    queryKey: ['/api/workers'],
    enabled: true
  });

  // تصفية العمال حسب المشاريع المختارة
  const filteredWorkers = useMemo(() => {
    if (selectedProjects.length === 0) {
      // إذا لم يتم تحديد مشاريع، أظهر جميع العمال
      return allWorkers;
    }
    return allWorkers.filter(worker => selectedProjects.includes(worker.projectId));
  }, [allWorkers, selectedProjects]);

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

  // وظائف التحكم في العمال
  const handleWorkerToggle = (workerId: string) => {
    setSelectedWorkers(prev => 
      prev.includes(workerId) 
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

  const selectAllWorkers = () => {
    setSelectedWorkers(filteredWorkers.map(w => w.id));
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
  const selectedWorkersData = filteredWorkers.filter(w => selectedWorkers.includes(w.id));

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
        const project = projects.find(p => p.id === worker.projectId);
        const workDays = Math.floor(Math.random() * 30) + 1; // محاكاة أيام العمل
        const totalEarned = workDays * worker.dailyWage;
        const totalPaid = Math.floor(totalEarned * (0.7 + Math.random() * 0.3)); // محاكاة المدفوع
        const remaining = totalEarned - totalPaid;
        
        return {
          id: worker.id,
          name: worker.name,
          type: worker.type,
          project: project?.name || 'غير محدد',
          dailyWage: worker.dailyWage,
          workDays,
          totalEarned,
          totalPaid,
          remaining,
          isActive: worker.isActive,
          notes: worker.isActive ? '' : 'متوقف'
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

            {selectedProjects.length === 0 && (
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                  💡 لم يتم تحديد مشاريع محددة - سيتم عرض جميع العمال
                </p>
                <p className="text-sm text-blue-500 mt-1">
                  يمكنك تحديد مشاريع معينة لتصفية العمال، أو ترك الخيار فارغاً لعرض الجميع
                </p>
              </div>
            )}
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
                {filteredWorkers.length === 0 ? (
                  <div className="col-span-full text-center text-gray-500 py-8">
                    <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>لا توجد عمال متاحين</p>
                    <p className="text-sm mt-1">تأكد من وجود عمال في النظام أو اختر مشاريع تحتوي على عمال</p>
                  </div>
                ) : (
                  filteredWorkers.map(worker => {
                    const workerProject = projects.find(p => p.id === worker.projectId);
                    return (
                      <div key={worker.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={`worker-${worker.id}`}
                            checked={selectedWorkers.includes(worker.id)}
                            onCheckedChange={() => handleWorkerToggle(worker.id)}
                          />
                          <div>
                            <label 
                              htmlFor={`worker-${worker.id}`}
                              className="font-medium cursor-pointer"
                            >
                              {worker.name}
                            </label>
                            <p className="text-xs text-gray-500">{worker.type}</p>
                            {workerProject && (
                              <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-1">
                                {workerProject.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-left">
                          <Badge variant={worker.isActive ? "default" : "secondary"} className="text-xs">
                            {worker.isActive ? 'نشط' : 'غير نشط'}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{worker.dailyWage} ريال/يوم</p>
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
                {selectedWorkersData.reduce((sum, worker) => sum + worker.dailyWage, 0)}
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