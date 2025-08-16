import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, 
  Filter, 
  FileSpreadsheet, 
  Printer, 
  Search,
  Building2,
  Calendar,
  TrendingUp,
  DollarSign,
  UserCheck,
  Download
} from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');

  // جلب المشاريع والعمال
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: true
  });

  const { data: workers = [], isLoading: workersLoading } = useQuery<Worker[]>({
    queryKey: ['/api/workers'],
    enabled: true
  });

  // إعداد التواريخ الافتراضية
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    setDateFrom(startOfMonth);
    setDateTo(today);
  }, []);

  // فلترة العمال حسب البحث
  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedWorkersData = filteredWorkers.filter(w => selectedWorkers.includes(w.id));
  const totalDailyWages = selectedWorkersData.reduce((sum, w) => sum + Number(w.dailyWage || 0), 0);
  const activeWorkers = selectedWorkersData.filter(w => w.isActive).length;

  const handleWorkerSelection = (workerId: string, checked: boolean) => {
    if (checked) {
      setSelectedWorkers(prev => [...prev, workerId]);
    } else {
      setSelectedWorkers(prev => prev.filter(id => id !== workerId));
    }
  };

  const handleSelectAll = () => {
    if (selectedWorkers.length === filteredWorkers.length) {
      setSelectedWorkers([]);
    } else {
      setSelectedWorkers(filteredWorkers.map(w => w.id));
    }
  };

  const generateReport = () => {
    if (selectedWorkers.length === 0) {
      alert('يرجى تحديد عامل واحد على الأقل');
      return;
    }
    setReportGenerated(true);
  };

  if (workersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-lg font-medium text-gray-700">جاري تحميل بيانات العمال...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* عنوان القسم */}
      <div className="text-center border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">تقرير تصفية العمال</h1>
        <p className="text-lg text-gray-600">تقرير شامل للعمال المحددين مع الأجور والأدوار المهنية</p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <Badge variant="secondary" className="px-4 py-2 text-sm">
            <Users className="h-4 w-4 mr-2" />
            {workers.length} عامل متاح
          </Badge>
          <Badge variant="outline" className="px-4 py-2 text-sm">
            <Building2 className="h-4 w-4 mr-2" />
            {projects.length} مشروع
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* قسم الفلاتر */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3">
                <Filter className="h-5 w-5" />
                فلاتر التقرير
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* النطاق الزمني */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  النطاق الزمني
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">من تاريخ</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">إلى تاريخ</label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* البحث في العمال */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  البحث في العمال
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ابحث بالاسم أو نوع العمل..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* إحصائيات سريعة */}
              {selectedWorkers.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-gray-900">الإحصائيات</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{selectedWorkers.length}</div>
                      <div className="text-gray-600">عامل محدد</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{activeWorkers}</div>
                      <div className="text-gray-600">نشط</div>
                    </div>
                    <div className="text-center col-span-2">
                      <div className="text-xl font-bold text-indigo-600">{totalDailyWages.toLocaleString()}</div>
                      <div className="text-gray-600">مجموع الأجور اليومية (ريال)</div>
                    </div>
                  </div>
                </div>
              )}

              {/* أزرار العمل */}
              <div className="space-y-3">
                <Button
                  onClick={generateReport}
                  disabled={selectedWorkers.length === 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3"
                  size="lg"
                >
                  <Filter className="h-5 w-5 mr-2" />
                  إنشاء التقرير
                </Button>

                {reportGenerated && (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Printer className="h-4 w-4 mr-2" />
                      طباعة
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* قائمة العمال */}
        <div className="xl:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <Users className="h-5 w-5" />
                  قائمة العمال ({filteredWorkers.length})
                </CardTitle>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  {selectedWorkers.length === filteredWorkers.length ? 'إلغاء الكل' : 'تحديد الكل'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {filteredWorkers.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredWorkers.map((worker) => (
                      <div key={worker.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4 rtl:space-x-reverse">
                          <Checkbox
                            id={`worker-${worker.id}`}
                            checked={selectedWorkers.includes(worker.id)}
                            onCheckedChange={(checked) => handleWorkerSelection(worker.id, checked as boolean)}
                            className="h-5 w-5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{worker.name}</h3>
                                <p className="text-sm text-gray-600">{worker.type}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600">
                                  {Number(worker.dailyWage || 0).toLocaleString()} ريال
                                </div>
                                <div className="text-sm text-gray-500">أجر يومي</div>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-3">
                              <Badge variant={worker.isActive ? "default" : "secondary"} className="text-xs">
                                {worker.isActive ? "✅ نشط" : "⏸️ غير نشط"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg text-gray-600">لا توجد عمال متطابقين مع البحث</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* عرض التقرير */}
      {reportGenerated && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
            <CardTitle className="text-center text-xl">
              تقرير شامل للعمال المحددين مع الأجور والأدوار المهنية
            </CardTitle>
            <div className="text-center text-sm opacity-90">
              تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')} | الفترة: {dateFrom} إلى {dateTo}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 border-b">م</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 border-b">اسم العامل</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 border-b">نوع العمل</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 border-b">الأجر اليومي</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 border-b">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedWorkersData.map((worker, index) => (
                    <tr key={worker.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{worker.type}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-green-600">
                          {Number(worker.dailyWage || 0).toLocaleString()} ريال
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={worker.isActive ? "default" : "secondary"} className="text-xs">
                          {worker.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-sm font-bold text-gray-900">
                      الإجمالي ({selectedWorkersData.length} عامل)
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">
                      {totalDailyWages.toLocaleString()} ريال
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                      {activeWorkers} عامل نشط
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* ملخص احترافي */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 m-6 rounded-lg">
              <h4 className="text-lg font-bold text-gray-900 mb-4">ملخص التقرير</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{selectedWorkersData.length}</div>
                  <div className="text-sm text-gray-600">إجمالي العمال</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{activeWorkers}</div>
                  <div className="text-sm text-gray-600">العمال النشطين</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mx-auto mb-2">
                    <DollarSign className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{totalDailyWages.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">مجموع الأجور (ريال)</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{new Set(selectedWorkersData.map(w => w.type)).size}</div>
                  <div className="text-sm text-gray-600">أنواع العمل</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}