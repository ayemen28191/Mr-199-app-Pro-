import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Calendar, Filter, CheckCircle2, FileSpreadsheet, Printer, User, Building2 } from 'lucide-react';

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

export default function WorkerFilterReport() {
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

  // جلب جميع العمال
  const { data: workers = [], isLoading: workersLoading } = useQuery<Worker[]>({
    queryKey: ['/api/workers'],
    enabled: true
  });

  console.log('🔍 العمال المحملين:', workers.length, 'عمال متاحين');
  console.log('📋 أسماء العمال:', workers.slice(0, 5).map(w => w.name));

  // إعدادات افتراضية للتواريخ
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
    if (!dateFrom) setDateFrom(firstOfMonth);
    if (!dateTo) setDateTo(today);
  }, []);

  const handleProjectSelection = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjects(prev => [...prev, projectId]);
    } else {
      setSelectedProjects(prev => prev.filter(id => id !== projectId));
    }
    setSelectedWorkers([]); // إعادة تعيين العمال عند تغيير المشروع
  };

  const handleWorkerSelection = (workerId: string, checked: boolean) => {
    if (checked) {
      setSelectedWorkers(prev => [...prev, workerId]);
    } else {
      setSelectedWorkers(prev => prev.filter(id => id !== workerId));
    }
  };

  const handleSelectAllWorkers = () => {
    if (selectedWorkers.length === workers.length) {
      setSelectedWorkers([]);
    } else {
      setSelectedWorkers(workers.map(w => w.id));
    }
  };

  const generateReport = () => {
    console.log('🚀 إنشاء تقرير العمال');
    console.log('📊 المشاريع المحددة:', selectedProjects.length);
    console.log('👥 العمال المحددين:', selectedWorkers.length);
    console.log('📅 النطاق الزمني:', { من: dateFrom, إلى: dateTo });
    
    if (workers.length === 0) {
      alert('لا توجد عمال متاحين لإنشاء التقرير');
      return;
    }
    
    setReportGenerated(true);
  };

  const selectedWorkersData = workers.filter(w => selectedWorkers.includes(w.id));
  const totalDailyWages = selectedWorkersData.reduce((sum, w) => sum + Number(w.dailyWage || 0), 0);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="bg-purple-600 p-2 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            تقرير تصفية العمال
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {workers.length} عامل متاح
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* عرض حالة التحميل */}
          {workersLoading && (
            <div className="text-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">جاري تحميل العمال...</p>
            </div>
          )}

          {/* رسالة نجاح التحميل */}
          {!workersLoading && workers.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-green-800 dark:text-green-300 font-medium">
                  تم تحميل {workers.length} عامل بنجاح
                </span>
              </div>
            </div>
          )}

          {/* اختيار النطاق الزمني */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">تاريخ البداية</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">تاريخ النهاية</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* اختيار المشاريع */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              اختيار المشاريع ({selectedProjects.length} محدد)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center space-x-2 rtl:space-x-reverse p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <Checkbox
                    id={`project-${project.id}`}
                    checked={selectedProjects.includes(project.id)}
                    onCheckedChange={(checked) => handleProjectSelection(project.id, checked as boolean)}
                  />
                  <label htmlFor={`project-${project.id}`} className="flex-1 cursor-pointer">
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {project.status === 'active' ? '🟢 نشط' : '🔴 غير نشط'}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* اختيار العمال */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                اختيار العمال ({selectedWorkers.length} محدد)
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllWorkers}
                className="flex items-center gap-2"
              >
                {selectedWorkers.length === workers.length ? 'إلغاء الكل' : 'تحديد الكل'}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {workers.map((worker) => (
                <div key={worker.id} className="flex items-center space-x-2 rtl:space-x-reverse p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <Checkbox
                    id={`worker-${worker.id}`}
                    checked={selectedWorkers.includes(worker.id)}
                    onCheckedChange={(checked) => handleWorkerSelection(worker.id, checked as boolean)}
                  />
                  <label htmlFor={`worker-${worker.id}`} className="flex-1 cursor-pointer">
                    <div className="font-medium">{worker.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {worker.type} - {Number(worker.dailyWage || 0).toLocaleString()} ريال/يوم
                    </div>
                    <div className="text-xs">
                      {worker.isActive ? '✅ نشط' : '⏸️ غير نشط'}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* إحصائيات سريعة */}
          {selectedWorkers.length > 0 && (
            <Card className="bg-purple-50 dark:bg-purple-900/20">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3">إحصائيات العمال المحددين</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{selectedWorkers.length}</div>
                    <div className="text-sm text-muted-foreground">إجمالي العمال</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {selectedWorkersData.filter(w => w.isActive).length}
                    </div>
                    <div className="text-sm text-muted-foreground">العمال النشطين</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {totalDailyWages.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">مجموع الأجور اليومية</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">
                      {new Set(selectedWorkersData.map(w => w.type)).size}
                    </div>
                    <div className="text-sm text-muted-foreground">أنواع العمل</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* أزرار العمل */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={generateReport}
              disabled={workers.length === 0}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            >
              <Filter className="h-4 w-4" />
              إنشاء تقرير التصفية
            </Button>

            {reportGenerated && (
              <>
                <Button variant="outline" className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  تصدير Excel
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  طباعة
                </Button>
              </>
            )}
          </div>

          {/* عرض التقرير */}
          {reportGenerated && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-center">
                  تقرير شامل للعمال المحددين مع الأجور والأدوار المهنية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="border border-gray-300 dark:border-gray-600 p-3 text-right">م</th>
                        <th className="border border-gray-300 dark:border-gray-600 p-3 text-right">اسم العامل</th>
                        <th className="border border-gray-300 dark:border-gray-600 p-3 text-right">نوع العمل</th>
                        <th className="border border-gray-300 dark:border-gray-600 p-3 text-right">الأجر اليومي</th>
                        <th className="border border-gray-300 dark:border-gray-600 p-3 text-right">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedWorkersData.length > 0 ? (
                        selectedWorkersData.map((worker, index) => (
                          <tr key={worker.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="border border-gray-300 dark:border-gray-600 p-3">{index + 1}</td>
                            <td className="border border-gray-300 dark:border-gray-600 p-3 font-medium">{worker.name}</td>
                            <td className="border border-gray-300 dark:border-gray-600 p-3">{worker.type}</td>
                            <td className="border border-gray-300 dark:border-gray-600 p-3">
                              {Number(worker.dailyWage || 0).toLocaleString()} ريال
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-3">
                              <Badge variant={worker.isActive ? "default" : "secondary"}>
                                {worker.isActive ? "نشط" : "غير نشط"}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="border border-gray-300 dark:border-gray-600 p-8 text-center text-muted-foreground">
                            يرجى تحديد العمال لعرض التقرير
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {selectedWorkersData.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold mb-2">ملخص التقرير:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>إجمالي العمال: <span className="font-bold">{selectedWorkersData.length}</span></div>
                      <div>العمال النشطين: <span className="font-bold">{selectedWorkersData.filter(w => w.isActive).length}</span></div>
                      <div>مجموع الأجور: <span className="font-bold">{totalDailyWages.toLocaleString()} ريال</span></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}