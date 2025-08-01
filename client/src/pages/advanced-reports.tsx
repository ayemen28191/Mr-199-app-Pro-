import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, FileText, Download, Printer, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'exceljs';
import { saveAs } from 'file-saver';

interface Project {
  id: string;
  name: string;
}

interface ReportData {
  expenses: ExpenseRecord[];
  income: IncomeRecord[];
  totals: {
    totalAmount: number;
    categoryTotals: Record<string, number>;
  };
}

interface ExpenseRecord {
  id: string;
  projectName: string;
  date: string;
  day: string;
  category: string;
  subcategory: string;
  description: string;
  amount: number;
  vendor?: string;
  notes?: string;
}

interface IncomeRecord {
  id: string;
  projectName: string;
  date: string;
  transferNumber: string;
  senderName: string;
  transferType: string;
  amount: number;
  notes?: string;
}

const AdvancedReports = () => {
  const [filters, setFilters] = useState({
    projectId: '',
    reportType: 'expenses', // 'expenses' or 'income'
    dateFrom: '',
    dateTo: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);

  // جلب قائمة المشاريع
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // جلب بيانات التقرير
  const { data: reportData, refetch: generateReport, isFetching } = useQuery<ReportData>({
    queryKey: ['/api/reports/advanced', filters],
    enabled: false, // لا نجلب البيانات تلقائياً
  });

  const handleGenerateReport = async () => {
    if (!filters.projectId || !filters.dateFrom || !filters.dateTo) {
      alert('يرجى تحديد جميع الحقول المطلوبة');
      return;
    }
    
    setIsGenerating(true);
    await generateReport();
    setIsGenerating(false);
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
      reportData.expenses.forEach(expense => {
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
      
      Object.entries(reportData.totals.categoryTotals).forEach(([category, total]) => {
        worksheet.addRow([category, '', '', '', '', total]);
      });

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
      reportData.income.forEach(income => {
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

  const renderExpensesTable = () => {
    if (!reportData?.expenses.length) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          لا توجد مصروفات في الفترة المحددة
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* جدول المصروفات */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-semibold">التاريخ</TableHead>
                <TableHead className="text-right font-semibold">اليوم</TableHead>
                <TableHead className="text-right font-semibold">الفئة</TableHead>
                <TableHead className="text-right font-semibold">الفئة الفرعية</TableHead>
                <TableHead className="text-right font-semibold">الوصف</TableHead>
                <TableHead className="text-right font-semibold">المبلغ</TableHead>
                <TableHead className="text-right font-semibold">المورد</TableHead>
                <TableHead className="text-right font-semibold">ملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.expenses.map((expense) => (
                <TableRow key={expense.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{formatDate(expense.date)}</TableCell>
                  <TableCell>{getDayName(expense.date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {expense.subcategory || '-'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={expense.description}>
                    {expense.description}
                  </TableCell>
                  <TableCell className="font-semibold text-red-600 arabic-numbers">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {expense.vendor || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {expense.notes || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* ملخص الإجماليات */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ملخص الإجماليات حسب الفئة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(reportData.totals.categoryTotals).map(([category, total]) => (
                <div key={category} className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <div className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                    {category}
                  </div>
                  <div className="text-lg font-bold text-red-800 dark:text-red-300 arabic-numbers">
                    {formatCurrency(total)}
                  </div>
                </div>
              ))}
            </div>
            
            <Separator className="my-4" />
            
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">إجمالي المصروفات:</span>
                <span className="text-xl font-bold text-red-600 arabic-numbers">
                  {formatCurrency(reportData.totals.totalAmount)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderIncomeTable = () => {
    if (!reportData?.income.length) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          لا توجد إيرادات في الفترة المحددة
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* جدول الإيرادات */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-semibold">التاريخ</TableHead>
                <TableHead className="text-right font-semibold">رقم الحوالة</TableHead>
                <TableHead className="text-right font-semibold">اسم المرسل</TableHead>
                <TableHead className="text-right font-semibold">نوع الحوالة</TableHead>
                <TableHead className="text-right font-semibold">المبلغ</TableHead>
                <TableHead className="text-right font-semibold">ملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.income.map((income) => (
                <TableRow key={income.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{formatDate(income.date)}</TableCell>
                  <TableCell className="font-mono text-sm bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                    {income.transferNumber}
                  </TableCell>
                  <TableCell className="font-medium">{income.senderName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                      {income.transferType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-green-600 arabic-numbers">
                    {formatCurrency(income.amount)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {income.notes || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* إجمالي الإيرادات */}
        <Card>
          <CardContent className="pt-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">إجمالي الإيرادات:</span>
                <span className="text-xl font-bold text-green-600 arabic-numbers">
                  {formatCurrency(reportData.totals.totalAmount)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const selectedProject = projects.find(p => p.id === filters.projectId);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">التقارير المتقدمة</h1>
          <p className="text-muted-foreground mt-1">إنشاء تقارير مفصلة للمصروفات والإيرادات</p>
        </div>
      </div>

      {/* نموذج المرشحات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            معايير التقرير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">المشروع</Label>
              <Select value={filters.projectId} onValueChange={(value) => setFilters(prev => ({ ...prev, projectId: value }))}>
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

            <div className="space-y-2">
              <Label htmlFor="reportType">نوع التقرير</Label>
              <Select value={filters.reportType} onValueChange={(value) => setFilters(prev => ({ ...prev, reportType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expenses">المصروفات</SelectItem>
                  <SelectItem value="income">الإيرادات</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">من تاريخ</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>

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

          <div className="mt-6 flex gap-3">
            <Button 
              onClick={handleGenerateReport} 
              disabled={isGenerating || isFetching}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              {isGenerating || isFetching ? 'جاري إنشاء التقرير...' : 'إنشاء التقرير'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* عرض التقرير */}
      {reportData && (
        <Card>
          <CardHeader className="print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">
                  تقرير {filters.reportType === 'expenses' ? 'المصروفات' : 'الإيرادات'}
                </CardTitle>
                <div className="text-sm text-muted-foreground mt-1">
                  <span>المشروع: {selectedProject?.name}</span>
                  <span className="mx-2">•</span>
                  <span>الفترة: من {formatDate(filters.dateFrom)} إلى {formatDate(filters.dateTo)}</span>
                  <span className="mx-2">•</span>
                  <span>تاريخ التقرير: {formatDate(new Date().toISOString())}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                  <Printer className="h-4 w-4" />
                  طباعة
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2">
                  <Download className="h-4 w-4" />
                  تصدير Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* عنوان للطباعة */}
            <div className="hidden print:block mb-6 text-center border-b pb-4">
              <h1 className="text-2xl font-bold mb-2">
                تقرير {filters.reportType === 'expenses' ? 'المصروفات' : 'الإيرادات'}
              </h1>
              <div className="text-sm text-muted-foreground">
                <div>المشروع: {selectedProject?.name}</div>
                <div>الفترة: من {formatDate(filters.dateFrom)} إلى {formatDate(filters.dateTo)}</div>
                <div>تاريخ التقرير: {formatDate(new Date().toISOString())}</div>
              </div>
            </div>

            {filters.reportType === 'expenses' ? renderExpensesTable() : renderIncomeTable()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedReports;