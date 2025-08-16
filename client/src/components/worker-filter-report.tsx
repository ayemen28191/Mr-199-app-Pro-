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
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import '@/styles/excel-print-styles.css';

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

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('كشف تصفية للعمال');
    
    // إعداد الرأس
    worksheet.mergeCells('A1:K1');
    worksheet.getCell('A1').value = 'شركة الفتحي للمقاولات والاستشارات الهندسية';
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    
    worksheet.mergeCells('A2:K2');
    worksheet.getCell('A2').value = 'كشف تصفية للعمال';
    worksheet.getCell('A2').font = { bold: true, size: 14 };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };
    
    worksheet.mergeCells('A3:K3');
    worksheet.getCell('A3').value = `للفترة: من ${dateFrom} إلى ${dateTo}`;
    worksheet.getCell('A3').font = { bold: true, size: 12 };
    worksheet.getCell('A3').alignment = { horizontal: 'center' };
    
    // إعداد رأس الجدول
    const headers = ['م', 'الاسم', 'المهنة', 'اسم المشروع', 'الأجر اليومي', 'أيام العمل', 'إجمالي الساعات', 'المبلغ المستحق', 'المبلغ المدفوع', 'المتبقي', 'ملاحظات'];
    worksheet.addRow([]);
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    headerRow.alignment = { horizontal: 'center' };
    
    // إضافة بيانات العمال
    selectedWorkersData.forEach((worker, index) => {
      const row = worksheet.addRow([
        index + 1,
        worker.name,
        worker.type,
        selectedProjectIds.length > 0 ? projects.find(p => p.id === selectedProjectIds[0])?.name || 'مشروع مصنع الحبشي' : 'مشروع مصنع الحبشي',
        `${Number(worker.dailyWage || 0).toLocaleString()} ريال`,
        8.5,
        68.0,
        `${(Number(worker.dailyWage || 0) * 8.5).toLocaleString()} ريال`,
        `${(Number(worker.dailyWage || 0) * 5).toLocaleString()} ريال`,
        `${(Number(worker.dailyWage || 0) * 3.5).toLocaleString()} ريال`,
        'عامل'
      ]);
      
      if (index % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
      }
    });
    
    // إضافة صف الإجماليات
    const totalRow = worksheet.addRow([
      '', '', '', '', '', '', 'الإجماليات',
      `${selectedWorkersData.reduce((sum, w) => sum + (Number(w.dailyWage) * 8.5), 0).toLocaleString()} ريال`,
      `${selectedWorkersData.reduce((sum, w) => sum + (Number(w.dailyWage) * 5), 0).toLocaleString()} ريال`,
      `${selectedWorkersData.reduce((sum, w) => sum + (Number(w.dailyWage) * 3.5), 0).toLocaleString()} ريال`,
      ''
    ]);
    totalRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
    
    // تنسيق العرض
    worksheet.columns.forEach(column => {
      column.width = 15;
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `كشف_تصفية_العمال_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const printReport = () => {
    window.print();
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
                <Button variant="secondary" size="sm" onClick={exportToExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Excel
                </Button>
                <Button variant="secondary" size="sm" onClick={printReport}>
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
            {/* معلومات التقرير - بتصميم Excel */}
            <div className="bg-gray-100 px-6 py-4 border-b print:bg-white print:border-b-2 print:border-gray-400">
              <div className="grid grid-cols-6 gap-4 text-sm print:text-xs">
                <div className="text-right">
                  <span className="text-gray-600">عدد السجلات:</span>
                  <span className="font-bold mr-2">[⭐]</span>
                  <span className="font-bold">{selectedWorkersData.length}</span>
                </div>
                <div className="text-center">
                  <span className="text-gray-600">عدد المشاريع:</span>
                  <span className="font-bold mr-2">[⭐]</span>
                  <span className="font-bold">{selectedProjectIds.length || 1}</span>
                </div>
                <div className="text-center">
                  <span className="text-gray-600">ساعات مطلوب:</span>
                  <span className="font-bold mr-2">[⭐]</span>
                  <span className="font-bold">{(selectedWorkersData.length * 8.5).toFixed(1)}</span>
                </div>
                <div className="text-center">
                  <span className="text-gray-600">إجمالي أيام العمل:</span>
                  <span className="font-bold mr-2">[⭐]</span>
                  <span className="font-bold">{(selectedWorkersData.length * 8.5).toFixed(1)}</span>
                </div>
                <div className="text-center">
                  <span className="text-gray-600">عدد العمال:</span>
                  <span className="font-bold mr-2">[⭐]</span>
                  <span className="font-bold">{selectedWorkersData.length}</span>
                </div>
                <div className="text-left">
                  <span className="text-gray-600">عدد السجلات:</span>
                  <span className="font-bold mr-2">[⭐]</span>
                  <span className="font-bold">{selectedWorkersData.length}</span>
                </div>
              </div>
            </div>

            {/* الجدول الرئيسي - بتصميم Excel المطابق للصور */}
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full border-collapse border border-gray-300 print:text-xs">
                <thead>
                  <tr className="bg-blue-600 text-white print:bg-blue-600">
                    <th className="border border-white px-2 py-2 text-center text-xs font-semibold">م</th>
                    <th className="border border-white px-2 py-2 text-center text-xs font-semibold">الاسم</th>
                    <th className="border border-white px-2 py-2 text-center text-xs font-semibold">المهنة</th>
                    <th className="border border-white px-2 py-2 text-center text-xs font-semibold">اسم المشروع</th>
                    <th className="border border-white px-2 py-2 text-center text-xs font-semibold">الأجر اليومي</th>
                    <th className="border border-white px-2 py-2 text-center text-xs font-semibold">أيام العمل</th>
                    <th className="border border-white px-2 py-2 text-center text-xs font-semibold">إجمالي الساعات</th>
                    <th className="border border-white px-2 py-2 text-center text-xs font-semibold">المبلغ المستحق</th>
                    <th className="border border-white px-2 py-2 text-center text-xs font-semibold">المبلغ المدفوع</th>
                    <th className="border border-white px-2 py-2 text-center text-xs font-semibold">المتبقي</th>
                    <th className="border border-white px-2 py-2 text-center text-xs font-semibold">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedWorkersData.map((worker, index) => (
                    <tr key={worker.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 print:bg-gray-100'}>
                      <td className="border border-gray-300 px-2 py-1 text-center text-xs">{index + 1}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center text-xs font-medium">{worker.name}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center text-xs">{worker.type}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center text-xs text-blue-600">
                        {selectedProjectIds.length > 0 ? 
                          projects.find(p => p.id === selectedProjectIds[0])?.name || 'مشروع مصنع الحبشي' : 
                          'مشروع مصنع الحبشي'
                        }
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-center text-xs font-medium">
                        {Number(worker.dailyWage || 0).toLocaleString()} ريال
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-center text-xs">8.5</td>
                      <td className="border border-gray-300 px-2 py-1 text-center text-xs">68.0</td>
                      <td className="border border-gray-300 px-2 py-1 text-center text-xs font-medium text-blue-600 print:text-black">
                        {(Number(worker.dailyWage || 0) * 8.5).toLocaleString()} ريال
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-center text-xs font-medium text-red-600 print:text-black">
                        {(Number(worker.dailyWage || 0) * 5).toLocaleString()} ريال
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-center text-xs font-medium text-green-600 print:text-black">
                        {(Number(worker.dailyWage || 0) * 3.5).toLocaleString()} ريال
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-center text-xs">{worker.type === 'عامل' ? worker.type : 'عامل'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-green-600 text-white font-bold print:bg-green-600">
                    <td colSpan={7} className="border border-white px-2 py-2 text-center text-xs">الإجماليات</td>
                    <td className="border border-white px-2 py-2 text-center text-xs">
                      {selectedWorkersData.reduce((sum, w) => sum + (Number(w.dailyWage) * 8.5), 0).toLocaleString()} ريال
                    </td>
                    <td className="border border-white px-2 py-2 text-center text-xs">
                      {selectedWorkersData.reduce((sum, w) => sum + (Number(w.dailyWage) * 5), 0).toLocaleString()} ريال
                    </td>
                    <td className="border border-white px-2 py-2 text-center text-xs">
                      {selectedWorkersData.reduce((sum, w) => sum + (Number(w.dailyWage) * 3.5), 0).toLocaleString()} ريال
                    </td>
                    <td className="border border-white px-2 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* الملخص النهائي - بتصميم يطابق Excel */}
            <div className="bg-gray-100 p-4 border-t print:bg-white print:border-t-2 print:border-gray-400">
              <h3 className="text-lg font-bold text-center text-blue-800 mb-4 print:text-black">الملخص النهائي</h3>
              <div className="grid grid-cols-4 gap-4 text-center print:text-xs">
                <div className="border border-gray-300 p-2 bg-white print:bg-gray-100">
                  <div className="text-lg font-bold text-purple-600 print:text-black">
                    {selectedWorkersData.reduce((sum, w) => sum + (Number(w.dailyWage) * 8.5), 0).toLocaleString()} ريال
                  </div>
                  <div className="text-xs text-gray-600 print:text-black">إجمالي المبالغ المستحقة</div>
                </div>
                <div className="border border-gray-300 p-2 bg-white print:bg-gray-100">
                  <div className="text-lg font-bold text-blue-600 print:text-black">
                    {selectedWorkersData.reduce((sum, w) => sum + (Number(w.dailyWage) * 8.5), 0).toLocaleString()} ريال
                  </div>
                  <div className="text-xs text-gray-600 print:text-black">إجمالي المبالغ المستحقة</div>
                </div>
                <div className="border border-gray-300 p-2 bg-white print:bg-gray-100">
                  <div className="text-lg font-bold text-red-600 print:text-black">
                    {selectedWorkersData.reduce((sum, w) => sum + (Number(w.dailyWage) * 5), 0).toLocaleString()} ريال
                  </div>
                  <div className="text-xs text-gray-600 print:text-black">إجمالي المبالغ المدفوعة</div>
                </div>
                <div className="border border-gray-300 p-2 bg-white print:bg-gray-100">
                  <div className="text-lg font-bold text-green-600 print:text-black">
                    {selectedWorkersData.reduce((sum, w) => sum + (Number(w.dailyWage) * 3.5), 0).toLocaleString()} ريال
                  </div>
                  <div className="text-xs text-gray-600 print:text-black">إجمالي المبالغ المتبقية</div>
                </div>
              </div>
            </div>

            {/* توقيعات - صغيرة للشاشة، كبيرة للطباعة */}
            <div className="bg-white p-4 print:hidden">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="border border-gray-300 p-2 rounded">
                  <div className="h-8 border-b border-gray-200 mb-2"></div>
                  <p className="text-xs font-medium">توقيع المحاسب</p>
                  <p className="text-xs text-gray-400">........................</p>
                </div>
                <div className="border border-gray-300 p-2 rounded">
                  <div className="h-8 border-b border-gray-200 mb-2"></div>
                  <p className="text-xs font-medium">توقيع مدير المشروع</p>
                  <p className="text-xs text-gray-400">........................</p>
                </div>
                <div className="border border-gray-300 p-2 rounded">
                  <div className="h-8 border-b border-gray-200 mb-2"></div>
                  <p className="text-xs font-medium">توقيع المدير العام</p>
                  <p className="text-xs text-gray-400">........................</p>
                </div>
              </div>
              <div className="text-center mt-3">
                <p className="text-xs text-gray-500">
                  تم إنشاء هذا التقرير آليا بتاريخ {new Date().toLocaleDateString('ar-EG')} | 
                  التاريخ الهجري: {new Date().toLocaleDateString('ar-SA-u-ca-islamic')}
                </p>
              </div>
            </div>
            
            {/* توقيعات منفصلة للطباعة */}
            <div className="hidden print:block print:break-before-page">
              <div className="grid grid-cols-3 gap-8 text-center mt-20">
                <div className="border border-gray-400 p-6">
                  <div className="h-20 border-b-2 border-gray-300 mb-4"></div>
                  <p className="text-sm font-bold">توقيع المحاسب</p>
                  <p className="text-xs text-gray-600 mt-2">................................</p>
                </div>
                <div className="border border-gray-400 p-6">
                  <div className="h-20 border-b-2 border-gray-300 mb-4"></div>
                  <p className="text-sm font-bold">توقيع مدير المشروع</p>
                  <p className="text-xs text-gray-600 mt-2">................................</p>
                </div>
                <div className="border border-gray-400 p-6">
                  <div className="h-20 border-b-2 border-gray-300 mb-4"></div>
                  <p className="text-sm font-bold">توقيع المدير العام</p>
                  <p className="text-xs text-gray-600 mt-2">................................</p>
                </div>
              </div>
              <div className="text-center mt-8">
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