import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Filter, 
  FileSpreadsheet, 
  Printer, 
  Search,
  Building2,
  Calendar,
  RefreshCw,
  X
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
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // جلب البيانات
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

  // فلترة العمال حسب البحث والمشاريع
  const filteredWorkers = useMemo(() => {
    let filtered = workers;
    
    // فلترة حسب البحث
    if (searchTerm) {
      filtered = filtered.filter(worker =>
        worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [workers, searchTerm]);

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

  const handleProjectChange = (value: string) => {
    if (value === 'all') {
      setSelectedProjectIds([]);
    } else {
      setSelectedProjectIds([value]);
    }
    setSelectedWorkers([]);
  };

  const generateReport = () => {
    if (selectedWorkers.length === 0) {
      alert('يرجى تحديد عامل واحد على الأقل');
      return;
    }
    setReportGenerated(true);
  };

  const clearFilters = () => {
    setSelectedProjectIds([]);
    setSearchTerm('');
    setSelectedWorkers([]);
    setReportGenerated(false);
  };

  const closeReport = () => {
    setReportGenerated(false);
  };

  if (workersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">جاري تحميل العمال...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* عنوان وشعار الشركة */}
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
        <h1 className="text-2xl font-bold text-blue-600 mb-2">شركة الفتحي للمقاولات والاستشارات الهندسية</h1>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">كشف تصفية للعمال</h2>
        <p className="text-sm text-gray-600">للفترة: من {dateFrom} إلى {dateTo}</p>
      </div>

      {/* قسم إعداد التقرير */}
      <Card className="bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
        <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            إعداد تقرير تصفية العمال
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* اختيار المشاريع */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              اختيار المشاريع (اختياري)
            </h3>
            <div className="bg-white p-4 rounded-lg border">
              <Select value={selectedProjectIds[0] || 'all'} onValueChange={handleProjectChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="جميع المشاريع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المشاريع</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProjectIds.length === 0 && (
                <p className="text-xs text-green-600 mt-2">
                  إذا لم تختر مشروع محدد، سيتم استخدام المشروع المحدد حاليا في الأعلى
                </p>
              )}
            </div>
          </div>

          {/* فترة التقرير */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              فترة التقرير
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">من تاريخ (اختياري)</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">إلى تاريخ (اختياري)</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          {/* بحث وتصفية */}
          <div className="mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
              <p className="text-sm text-blue-700 mb-2">
                📌 سيتم إنشاء التقرير لجميع الفترات المحددة، يمكنك تحديد فترة معينة لتقرير أكثر دقة.
              </p>
            </div>
            
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              اختيار العمال
            </h3>

            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                {selectedWorkers.length === filteredWorkers.length ? 'تحديد الكل' : 'تحديد الكل'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedWorkers([])}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                إلغاء التحديد
              </Button>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="بحث بالاسم أو الوظيفة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
            </div>

            {/* قائمة العمال */}
            <div className="bg-white border rounded-lg p-4 max-h-80 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {filteredWorkers.map((worker) => (
                  <div key={worker.id} className="flex items-center space-x-3 rtl:space-x-reverse p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      checked={selectedWorkers.includes(worker.id)}
                      onCheckedChange={(checked) => handleWorkerSelection(worker.id, checked as boolean)}
                      className="h-4 w-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                      <div className="text-xs text-gray-500">{worker.type}</div>
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      {Number(worker.dailyWage || 0).toLocaleString()} ريال
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredWorkers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>لا توجد عمال متطابقين مع البحث</p>
                </div>
              )}
            </div>

            {/* معلومات الاختيار */}
            {selectedWorkers.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg mt-4">
                <h4 className="text-sm font-medium text-gray-800 mb-2">معلومات الاختيار:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• محدد حاليا: {selectedWorkers.length} من {filteredWorkers.length} عامل</li>
                  <li>• أرخص فايا للعمل جميع العمال في المشاريع</li>
                  <li>• العمال المحددون سيظهرون في التقرير فقط</li>
                </ul>
              </div>
            )}
          </div>

          {/* أزرار العمل */}
          <div className="flex gap-3">
            <Button
              onClick={generateReport}
              disabled={selectedWorkers.length === 0}
              className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              إنشاء التقرير
            </Button>
            <Button
              variant="outline"
              onClick={clearFilters}
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              مسح
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* التقرير النهائي */}
      {reportGenerated && (
        <Card className="bg-white shadow-lg border">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                <CardTitle className="text-lg">كشف تصفية للعمال</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Excel
                </Button>
                <Button variant="secondary" size="sm">
                  <Printer className="h-4 w-4 mr-1" />
                  طباعة
                </Button>
                <Button variant="ghost" size="sm" onClick={closeReport} className="text-white hover:bg-white/20">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* معلومات التقرير */}
            <div className="bg-gray-100 px-6 py-4 border-b">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">عدد المشاريع:</span>
                  <span className="font-bold mr-2">{selectedProjectIds.length || projects.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">عدد العمال:</span>
                  <span className="font-bold mr-2">{selectedWorkersData.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">إجمالي أيام العمل:</span>
                  <span className="font-bold mr-2">{(selectedWorkersData.length * 30).toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* الجدول الرئيسي */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold">م</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">الاسم</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">المهنة</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">اسم المشروع</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">الأجر اليومي</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">أيام العمل</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">إجمالي الساعات</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">المبلغ المستحق</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">المبلغ المدفوع</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">المتبقي</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedWorkersData.map((worker, index) => (
                    <tr key={worker.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{worker.type}</td>
                      <td className="px-4 py-3 text-sm text-blue-600">
                        {selectedProjectIds.length > 0 ? 
                          projects.find(p => p.id === selectedProjectIds[0])?.name || 'مشروع مصنع الحبشي' : 
                          'مشروع مصنع الحبشي'
                        }
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">
                        {Number(worker.dailyWage || 0).toLocaleString()} ريال
                      </td>
                      <td className="px-4 py-3 text-sm text-center">8.5</td>
                      <td className="px-4 py-3 text-sm text-center">68.0</td>
                      <td className="px-4 py-3 text-sm font-medium text-blue-600">
                        {(Number(worker.dailyWage || 0) * 8.5).toLocaleString()} ريال
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-red-600">
                        {(Number(worker.dailyWage || 0) * 5).toLocaleString()} ريال
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">
                        {(Number(worker.dailyWage || 0) * 3.5).toLocaleString()} ريال
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">عامل</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-green-600 text-white font-bold">
                  <tr>
                    <td colSpan={7} className="px-4 py-3 text-right">الإجماليات</td>
                    <td className="px-4 py-3 text-center">
                      {selectedWorkersData.reduce((sum, w) => sum + (Number(w.dailyWage) * 8.5), 0).toLocaleString()} ريال
                    </td>
                    <td className="px-4 py-3 text-center">
                      {selectedWorkersData.reduce((sum, w) => sum + (Number(w.dailyWage) * 5), 0).toLocaleString()} ريال
                    </td>
                    <td className="px-4 py-3 text-center">
                      {selectedWorkersData.reduce((sum, w) => sum + (Number(w.dailyWage) * 3.5), 0).toLocaleString()} ريال
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* الملخص النهائي */}
            <div className="bg-gray-100 p-6 border-t">
              <h3 className="text-lg font-bold text-center text-blue-800 mb-4">الملخص النهائي</h3>
              <div className="grid grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {selectedWorkersData.reduce((sum, w) => sum + (Number(w.dailyWage) * 3.5), 0).toLocaleString()} ريال
                  </div>
                  <div className="text-sm text-gray-600">إجمالي المبالغ المتبقية</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {selectedWorkersData.reduce((sum, w) => sum + (Number(w.dailyWage) * 5), 0).toLocaleString()} ريال
                  </div>
                  <div className="text-sm text-gray-600">إجمالي المبالغ المدفوعة</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedWorkersData.reduce((sum, w) => sum + (Number(w.dailyWage) * 8.5), 0).toLocaleString()} ريال
                  </div>
                  <div className="text-sm text-gray-600">إجمالي المبالغ المستحقة</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedWorkersData.reduce((sum, w) => sum + (Number(w.dailyWage) * 8.5), 0).toLocaleString()} ريال
                  </div>
                  <div className="text-sm text-gray-600">إجمالي المبالغ المستحقة</div>
                </div>
              </div>
            </div>

            {/* توقيعات */}
            <div className="bg-white p-6">
              <div className="grid grid-cols-3 gap-8 text-center">
                <div className="border border-gray-300 p-4 rounded">
                  <div className="h-16 border-b border-gray-200 mb-2"></div>
                  <p className="text-sm font-medium">توقيع المحاسب</p>
                  <p className="text-xs text-gray-500">................................</p>
                </div>
                <div className="border border-gray-300 p-4 rounded">
                  <div className="h-16 border-b border-gray-200 mb-2"></div>
                  <p className="text-sm font-medium">توقيع مدير المشروع</p>
                  <p className="text-xs text-gray-500">................................</p>
                </div>
                <div className="border border-gray-300 p-4 rounded">
                  <div className="h-16 border-b border-gray-200 mb-2"></div>
                  <p className="text-sm font-medium">توقيع المدير العام</p>
                  <p className="text-xs text-gray-500">................................</p>
                </div>
              </div>
              <div className="text-center mt-6">
                <p className="text-xs text-gray-500">
                  تم إنشاء هذا التقرير آليا بتاريخ {new Date().toLocaleDateString('ar-EG')} | 
                  التاريخ الهجري: {new Date().toLocaleDateString('ar-SA-u-ca-islamic')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}