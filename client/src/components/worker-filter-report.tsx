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
  RefreshCw
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
    <div className="space-y-4">
      {/* شريط الفلاتر المضغوط */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فلاتر التقرير
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* الصف الأول - التواريخ واختيار المشروع */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">من تاريخ</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">إلى تاريخ</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">اختيار المشروع</label>
              <Select value={selectedProjectIds[0] || 'all'} onValueChange={handleProjectChange}>
                <SelectTrigger className="h-9">
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
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">البحث</label>
              <div className="relative">
                <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="بحث بالاسم أو الوظيفة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-8"
                />
              </div>
            </div>
          </div>

          {/* الصف الثاني - الإحصائيات والأزرار */}
          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{filteredWorkers.length}</span>
                <span className="text-gray-600">عامل متاح</span>
              </div>
              {selectedWorkers.length > 0 && (
                <>
                  <div className="text-green-600">
                    <span className="font-bold">{selectedWorkers.length}</span> محدد
                  </div>
                  <div className="text-indigo-600">
                    <span className="font-bold">{totalDailyWages.toLocaleString()}</span> ريال/يوم
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <RefreshCw className="h-4 w-4 mr-1" />
                مسح
              </Button>
              <Button 
                onClick={generateReport} 
                disabled={selectedWorkers.length === 0}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Filter className="h-4 w-4 mr-1" />
                إنشاء التقرير
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة العمال المضغوطة */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              قائمة العمال ({filteredWorkers.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedWorkers.length === filteredWorkers.length ? 'إلغاء الكل' : 'تحديد الكل'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="w-10 px-3 py-2 text-right text-xs font-medium text-gray-600"></th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">العامل</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">الوظيفة</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">الأجر اليومي</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredWorkers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <Checkbox
                        checked={selectedWorkers.includes(worker.id)}
                        onCheckedChange={(checked) => handleWorkerSelection(worker.id, checked as boolean)}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-sm text-gray-900">{worker.name}</div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">{worker.type}</td>
                    <td className="px-3 py-2">
                      <span className="font-medium text-sm text-green-600">
                        {Number(worker.dailyWage || 0).toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500 mr-1">ريال</span>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={worker.isActive ? "default" : "secondary"} className="text-xs px-2 py-0">
                        {worker.isActive ? "نشط" : "غير نشط"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredWorkers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>لا توجد عمال متطابقين مع الفلاتر</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* التقرير المضغوط */}
      {reportGenerated && (
        <Card>
          <CardHeader className="bg-green-600 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                تقرير العمال المحددين ({selectedWorkersData.length} عامل)
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Excel
                </Button>
                <Button variant="secondary" size="sm">
                  <Printer className="h-4 w-4 mr-1" />
                  طباعة
                </Button>
              </div>
            </div>
            <div className="text-sm opacity-90">
              الفترة: {dateFrom} إلى {dateTo} | 
              المشروع: {selectedProjectIds.length > 0 ? 
                projects.find(p => p.id === selectedProjectIds[0])?.name || 'غير محدد' : 
                'جميع المشاريع'
              }
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* ملخص مضغوط */}
            <div className="bg-gray-50 px-4 py-3 border-b">
              <div className="grid grid-cols-4 gap-4 text-center text-sm">
                <div>
                  <div className="text-lg font-bold text-gray-900">{selectedWorkersData.length}</div>
                  <div className="text-xs text-gray-600">إجمالي العمال</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">{activeWorkers}</div>
                  <div className="text-xs text-gray-600">العمال النشطين</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">{totalDailyWages.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">مجموع الأجور (ريال)</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-indigo-600">
                    {new Set(selectedWorkersData.map(w => w.type)).size}
                  </div>
                  <div className="text-xs text-gray-600">أنواع العمل</div>
                </div>
              </div>
            </div>

            {/* جدول مضغوط */}
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">م</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">اسم العامل</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">الوظيفة</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">الأجر اليومي</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedWorkersData.map((worker, index) => (
                    <tr key={worker.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-3 py-2 text-sm font-medium text-gray-900">{worker.name}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">{worker.type}</td>
                      <td className="px-3 py-2 text-sm font-medium text-green-600">
                        {Number(worker.dailyWage || 0).toLocaleString()} ريال
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={worker.isActive ? "default" : "secondary"} className="text-xs">
                          {worker.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}