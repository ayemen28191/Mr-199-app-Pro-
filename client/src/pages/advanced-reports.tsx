import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, FileText, Download, Printer, Filter, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'exceljs';
import { saveAs } from 'file-saver';
import { useLocation } from 'wouter';

interface Project {
  id: string;
  name: string;
}

interface ReportFilters {
  projectId: string;
  reportType: 'expenses' | 'income';
  dateFrom: string;
  dateTo: string;
}

interface ExpenseRecord {
  id: string;
  projectId: string;
  date: string;
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  vendor?: string;
  notes?: string;
  type: string;
}

interface IncomeRecord {
  id: string;
  projectId: string;
  date: string;
  transferNumber: string;
  senderName: string;
  transferType: string;
  amount: number;
  notes?: string;
}

interface ReportData {
  expenses?: ExpenseRecord[];
  income?: IncomeRecord[];
  totals: {
    categoryTotals?: Record<string, number>;
    totalAmount: number;
  };
}

const AdvancedReports = () => {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState<ReportFilters>({
    projectId: '',
    reportType: 'expenses',
    dateFrom: '',
    dateTo: '',
  });

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // جلب قائمة المشاريع
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const handleGenerateReport = async () => {
    if (!filters.projectId || !filters.dateFrom || !filters.dateTo) {
      alert('يرجى تحديد جميع الحقول المطلوبة');
      return;
    }
    
    setIsGenerating(true);
    try {
      const params = new URLSearchParams({
        projectId: filters.projectId,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        reportType: filters.reportType
      });

      console.log('🔍 جلب التقرير مع المعاملات:', params.toString());
      
      const response = await fetch(`/api/reports/advanced?${params}`);
      console.log('📡 حالة الاستجابة:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ خطأ في API:', errorText);
        throw new Error(`خطأ HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('📊 بيانات التقرير المستلمة:', data);
      
      setReportData(data);
      alert('تم إنشاء التقرير بنجاح!');
      
    } catch (error) {
      console.error('❌ خطأ في جلب التقرير:', error);
      alert(`حدث خطأ أثناء إنشاء التقرير: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ar });
  };

  const getDayName = (dateString: string) => {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[new Date(dateString).getDay()];
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    if (!reportData) return;

    const selectedProject = projects.find(p => p.id === filters.projectId);
    const projectName = selectedProject?.name || 'غير محدد';

    const workbook = new XLSX.Workbook();
    const worksheet = workbook.addWorksheet('التقرير');

    let fileName = '';

    if (filters.reportType === 'expenses') {
      fileName = `تقرير_المصروفات_${projectName}_${filters.dateFrom}_${filters.dateTo}.xlsx`;
      
      // عنوان التقرير
      worksheet.addRow(['تقرير المصروفات']);
      worksheet.addRow(['المشروع:', projectName]);
      worksheet.addRow(['الفترة:', `من ${formatDate(filters.dateFrom)} إلى ${formatDate(filters.dateTo)}`]);
      worksheet.addRow(['تاريخ التقرير:', formatDate(new Date().toISOString())]);
      worksheet.addRow([]); // سطر فارغ
      
      // رؤوس الأعمدة
      worksheet.addRow(['التاريخ', 'اليوم', 'الفئة', 'الفئة الفرعية', 'الوصف', 'المبلغ', 'المورد', 'ملاحظات']);

      // البيانات
      reportData.expenses?.forEach(expense => {
        worksheet.addRow([
          formatDate(expense.date),
          getDayName(expense.date),
          expense.category,
          expense.subcategory || '',
          expense.description,
          expense.amount,
          expense.vendor || '',
          expense.notes || ''
        ]);
      });

      // إضافة الإجماليات
      worksheet.addRow([]); // سطر فارغ
      worksheet.addRow(['الإجماليات حسب الفئة:']);
      
      if (reportData.totals.categoryTotals) {
        Object.entries(reportData.totals.categoryTotals).forEach(([category, total]) => {
          worksheet.addRow([category, '', '', '', '', total]);
        });
      }

      worksheet.addRow([]); // سطر فارغ
      worksheet.addRow(['الإجمالي العام:', '', '', '', '', reportData.totals.totalAmount]);

    } else {
      fileName = `تقرير_الدخل_${projectName}_${filters.dateFrom}_${filters.dateTo}.xlsx`;
      
      // عنوان التقرير
      worksheet.addRow(['تقرير الدخل']);
      worksheet.addRow(['المشروع:', projectName]);
      worksheet.addRow(['الفترة:', `من ${formatDate(filters.dateFrom)} إلى ${formatDate(filters.dateTo)}`]);
      worksheet.addRow(['تاريخ التقرير:', formatDate(new Date().toISOString())]);
      worksheet.addRow([]); // سطر فارغ
      
      // رؤوس الأعمدة
      worksheet.addRow(['التاريخ', 'رقم الحوالة', 'اسم المرسل', 'نوع الحوالة', 'المبلغ', 'ملاحظات']);

      // البيانات
      reportData.income?.forEach(income => {
        worksheet.addRow([
          formatDate(income.date),
          income.transferNumber,
          income.senderName,
          income.transferType,
          income.amount,
          income.notes || ''
        ]);
      });

      worksheet.addRow([]); // سطر فارغ
      worksheet.addRow(['الإجمالي العام:', '', '', '', reportData.totals.totalAmount]);
    }

    // تصدير الملف
    const buffer = await workbook.xlsx.writeBuffer();
    const data = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, fileName);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/reports')}
          className="p-2"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">التقارير المتقدمة</h1>
          <p className="text-muted-foreground mt-1">إنشاء تقارير مخصصة للمصروفات والإيرادات</p>
        </div>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            مرشحات التقرير
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* اختيار المشروع */}
            <div className="space-y-2">
              <Label htmlFor="project">المشروع</Label>
              <Select 
                value={filters.projectId} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المشروع" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* نوع التقرير */}
            <div className="space-y-2">
              <Label htmlFor="reportType">نوع التقرير</Label>
              <Select 
                value={filters.reportType} 
                onValueChange={(value: 'expenses' | 'income') => setFilters(prev => ({ ...prev, reportType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع التقرير" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expenses">المصروفات</SelectItem>
                  <SelectItem value="income">الإيرادات</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* من تاريخ */}
            <div className="space-y-2">
              <Label htmlFor="dateFrom">من تاريخ</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>

            {/* إلى تاريخ */}
            <div className="space-y-2">
              <Label htmlFor="dateTo">إلى تاريخ</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleGenerateReport} 
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  جاري إنشاء التقرير...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  إنشاء التقرير
                </>
              )}
            </Button>

            {reportData && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleExportExcel}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  تصدير Excel
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handlePrint}
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  طباعة
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Display */}
      {reportData && (
        <Card>
          <CardHeader className="no-print">
            <CardTitle>
              {filters.reportType === 'expenses' ? 'تقرير المصروفات' : 'تقرير الإيرادات'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Project and Date Info */}
            <div className="mb-6 print:mb-4">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold">
                  {filters.reportType === 'expenses' ? 'تقرير المصروفات المفصل' : 'تقرير الإيرادات المفصل'}
                </h2>
                <p className="text-muted-foreground">
                  المشروع: {projects.find(p => p.id === filters.projectId)?.name}
                </p>
                <p className="text-muted-foreground">
                  الفترة: من {formatDate(filters.dateFrom)} إلى {formatDate(filters.dateTo)}
                </p>
              </div>
            </div>

            {/* Expenses Report */}
            {filters.reportType === 'expenses' && reportData.expenses && (
              <div className="space-y-6">
                {/* Data Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="border border-gray-300 p-2 text-right">التاريخ</th>
                        <th className="border border-gray-300 p-2 text-right">اليوم</th>
                        <th className="border border-gray-300 p-2 text-right">الفئة</th>
                        <th className="border border-gray-300 p-2 text-right">الفئة الفرعية</th>
                        <th className="border border-gray-300 p-2 text-right">الوصف</th>
                        <th className="border border-gray-300 p-2 text-right">المبلغ</th>
                        <th className="border border-gray-300 p-2 text-right">المورد</th>
                        <th className="border border-gray-300 p-2 text-right">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.expenses.map((expense, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="border border-gray-300 p-2">{formatDate(expense.date)}</td>
                          <td className="border border-gray-300 p-2">{getDayName(expense.date)}</td>
                          <td className="border border-gray-300 p-2">{expense.category}</td>
                          <td className="border border-gray-300 p-2">{expense.subcategory || '-'}</td>
                          <td className="border border-gray-300 p-2">{expense.description}</td>
                          <td className="border border-gray-300 p-2 font-bold text-red-600">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="border border-gray-300 p-2">{expense.vendor || '-'}</td>
                          <td className="border border-gray-300 p-2">{expense.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Category Totals */}
                {reportData.totals.categoryTotals && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold">الإجماليات حسب الفئة</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(reportData.totals.categoryTotals).map(([category, total]) => (
                        <div key={category} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                          <div className="text-sm text-muted-foreground">{category}</div>
                          <div className="text-xl font-bold text-red-600">{formatCurrency(total)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grand Total */}
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="text-center">
                    <div className="text-lg text-red-700 dark:text-red-300">إجمالي المصروفات</div>
                    <div className="text-3xl font-bold text-red-600">{formatCurrency(reportData.totals.totalAmount)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Income Report */}
            {filters.reportType === 'income' && reportData.income && (
              <div className="space-y-6">
                {/* Data Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="border border-gray-300 p-2 text-right">التاريخ</th>
                        <th className="border border-gray-300 p-2 text-right">رقم الحوالة</th>
                        <th className="border border-gray-300 p-2 text-right">اسم المرسل</th>
                        <th className="border border-gray-300 p-2 text-right">نوع الحوالة</th>
                        <th className="border border-gray-300 p-2 text-right">المبلغ</th>
                        <th className="border border-gray-300 p-2 text-right">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.income.map((income, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="border border-gray-300 p-2">{formatDate(income.date)}</td>
                          <td className="border border-gray-300 p-2">{income.transferNumber}</td>
                          <td className="border border-gray-300 p-2">{income.senderName}</td>
                          <td className="border border-gray-300 p-2">{income.transferType}</td>
                          <td className="border border-gray-300 p-2 font-bold text-green-600">
                            {formatCurrency(income.amount)}
                          </td>
                          <td className="border border-gray-300 p-2">{income.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Grand Total */}
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-center">
                    <div className="text-lg text-green-700 dark:text-green-300">إجمالي الإيرادات</div>
                    <div className="text-3xl font-bold text-green-600">{formatCurrency(reportData.totals.totalAmount)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-muted-foreground print:text-black">
              <p>تم إنشاء هذا التقرير تلقائياً بواسطة نظام إدارة المشاريع الإنشائية</p>
              <p>التاريخ: {formatDate(new Date().toISOString())} | الوقت: {new Date().toLocaleTimeString('ar-EG')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data Message */}
      {!reportData && !isGenerating && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">لا يوجد تقرير</h3>
            <p className="text-muted-foreground">اختر المعايير المطلوبة وانقر على "إنشاء التقرير" لعرض البيانات</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedReports;