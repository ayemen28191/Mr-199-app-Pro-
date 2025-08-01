import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, FileSpreadsheet, Printer, Download, Filter, BarChart3, TrendingUp, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSelectedProject } from "@/hooks/use-selected-project";
import ProjectSelector from "@/components/project-selector";
import { getCurrentDate, formatCurrency, formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { Project } from "@shared/schema";

interface DailyExpenseData {
  date: string;
  summary: {
    carriedForward: number;
    totalIncome: number;
    totalExpenses: number;
    remainingBalance: number;
    totalFundTransfers: number;
    totalWorkerWages: number;
    totalMaterialCosts: number;
    totalTransportationCosts: number;
    totalWorkerTransfers: number;
  };
  fundTransfers: any[];
  workerAttendance: any[];
  materialPurchases: any[];
  transportationExpenses: any[];
  workerTransfers: any[];
}

export default function DailyExpensesReport() {
  const { selectedProjectId, selectProject } = useSelectedProject();
  const { toast } = useToast();
  
  const [dateFrom, setDateFrom] = useState(getCurrentDate());
  const [dateTo, setDateTo] = useState(getCurrentDate());
  const [reportData, setReportData] = useState<DailyExpenseData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const generateReport = useCallback(async () => {
    if (!selectedProjectId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار مشروع أولاً",
        variant: "destructive",
      });
      return;
    }

    if (!dateFrom || !dateTo) {
      toast({
        title: "خطأ",
        description: "يرجى تحديد تاريخ البداية والنهاية",
        variant: "destructive",
      });
      return;
    }

    if (new Date(dateFrom) > new Date(dateTo)) {
      toast({
        title: "خطأ",
        description: "تاريخ البداية يجب أن يكون قبل تاريخ النهاية",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiRequest("GET", `/api/reports/daily-expenses-range/${selectedProjectId}?dateFrom=${dateFrom}&dateTo=${dateTo}`);
      setReportData(data);
      
      toast({
        title: "تم إنشاء التقرير",
        description: `تم إنشاء كشف المصروفات اليومية من ${formatDate(dateFrom)} إلى ${formatDate(dateTo)}`,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء التقرير",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId, dateFrom, dateTo, toast]);

  const exportToExcel = useCallback(() => {
    if (!reportData.length) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات لتصديرها",
        variant: "destructive",
      });
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      
      // ورقة الملخص
      const summarySheet = workbook.addWorksheet('ملخص المصروفات');
      
      // إضافة العناوين
      summarySheet.addRow([
        'التاريخ', 'الرصيد المرحل', 'إجمالي الإيرادات', 'إجمالي المصروفات', 
        'الرصيد المتبقي', 'الحوالات المالية', 'أجور العمال', 'شراء المواد', 
        'أجور المواصلات', 'حوالات العمال'
      ]);
      
      // إضافة البيانات
      reportData.forEach(day => {
        summarySheet.addRow([
          formatDate(day.date),
          day.summary.carriedForward.toFixed(2),
          day.summary.totalIncome.toFixed(2),
          day.summary.totalExpenses.toFixed(2),
          day.summary.remainingBalance.toFixed(2),
          day.summary.totalFundTransfers.toFixed(2),
          day.summary.totalWorkerWages.toFixed(2),
          day.summary.totalMaterialCosts.toFixed(2),
          day.summary.totalTransportationCosts.toFixed(2),
          day.summary.totalWorkerTransfers.toFixed(2)
        ]);
      });

      // ورقة التفاصيل
      if (showDetails) {
        const detailsData: any[] = [];
        
        reportData.forEach(day => {
          // الحوالات المالية
          day.fundTransfers.forEach(transfer => {
            detailsData.push({
              'التاريخ': formatDate(day.date),
              'النوع': 'حوالة مالية',
              'الوصف': `حوالة رقم ${transfer.transferNumber}`,
              'المرسل': transfer.senderName,
              'المبلغ': parseFloat(transfer.amount).toFixed(2),
              'طريقة التحويل': transfer.transferType,
              'ملاحظات': transfer.notes || ''
            });
          });

          // حضور العمال
          day.workerAttendance.forEach(attendance => {
            detailsData.push({
              'التاريخ': formatDate(day.date),
              'النوع': 'أجر عامل',
              'الوصف': `${attendance.worker?.name} - ${attendance.workDescription}`,
              'المرسل': '',
              'المبلغ': parseFloat(attendance.paidAmount).toFixed(2),
              'طريقة التحويل': attendance.paymentType,
              'ملاحظات': `أيام العمل: ${attendance.workDays}`
            });
          });

          // شراء المواد
          day.materialPurchases.forEach(purchase => {
            detailsData.push({
              'التاريخ': formatDate(day.date),
              'النوع': 'شراء مواد',
              'الوصف': `${purchase.material?.name} - ${purchase.quantity} ${purchase.material?.unit}`,
              'المرسل': purchase.supplierName,
              'المبلغ': parseFloat(purchase.totalAmount).toFixed(2),
              'طريقة التحويل': purchase.purchaseType,
              'ملاحظات': purchase.notes || ''
            });
          });

          // أجور المواصلات
          day.transportationExpenses.forEach(expense => {
            detailsData.push({
              'التاريخ': formatDate(day.date),
              'النوع': 'أجور مواصلات',
              'الوصف': expense.description,
              'المرسل': expense.worker?.name || '',
              'المبلغ': parseFloat(expense.amount).toFixed(2),
              'طريقة التحويل': 'نقد',
              'ملاحظات': expense.notes || ''
            });
          });

          // حوالات العمال
          day.workerTransfers.forEach(transfer => {
            detailsData.push({
              'التاريخ': formatDate(day.date),
              'النوع': 'حوالة عامل',
              'الوصف': `حوالة من ${transfer.worker?.name} إلى ${transfer.recipientName}`,
              'المرسل': transfer.senderName,
              'المبلغ': parseFloat(transfer.amount).toFixed(2),
              'طريقة التحويل': transfer.transferMethod,
              'ملاحظات': transfer.notes || ''
            });
          });
        });

        const detailsSheet = workbook.addWorksheet('تفاصيل المصروفات');
        
        // إضافة العناوين للتفاصيل
        detailsSheet.addRow([
          'التاريخ', 'النوع', 'الوصف', 'المرسل', 'المبلغ', 'طريقة التحويل', 'ملاحظات'
        ]);
        
        // إضافة البيانات التفصيلية
        detailsData.forEach(item => {
          detailsSheet.addRow([
            item['التاريخ'],
            item['النوع'],
            item['الوصف'],
            item['المرسل'],
            item['المبلغ'],
            item['طريقة التحويل'],
            item['ملاحظات']
          ]);
        });
      }

      // حفظ الملف
      const fileName = `كشف_المصروفات_اليومية_${selectedProject?.name}_${dateFrom}_${dateTo}.xlsx`;
      workbook.xlsx.writeBuffer().then(buffer => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, fileName);
      });
      
      toast({
        title: "تم التصدير",
        description: "تم تصدير التقرير إلى ملف Excel بنجاح",
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تصدير التقرير",
        variant: "destructive",
      });
    }
  }, [reportData, showDetails, selectedProject, dateFrom, dateTo, toast]);

  const printReport = useCallback(() => {
    window.print();
  }, []);

  const calculateTotals = () => {
    if (!reportData.length) return null;

    return reportData.reduce((totals, day) => ({
      totalIncome: totals.totalIncome + day.summary.totalIncome,
      totalExpenses: totals.totalExpenses + day.summary.totalExpenses,
      totalFundTransfers: totals.totalFundTransfers + day.summary.totalFundTransfers,
      totalWorkerWages: totals.totalWorkerWages + day.summary.totalWorkerWages,
      totalMaterialCosts: totals.totalMaterialCosts + day.summary.totalMaterialCosts,
      totalTransportationCosts: totals.totalTransportationCosts + day.summary.totalTransportationCosts,
      totalWorkerTransfers: totals.totalWorkerTransfers + day.summary.totalWorkerTransfers,
    }), {
      totalIncome: 0,
      totalExpenses: 0,
      totalFundTransfers: 0,
      totalWorkerWages: 0,
      totalMaterialCosts: 0,
      totalTransportationCosts: 0,
      totalWorkerTransfers: 0,
    });
  };

  const totals = calculateTotals();
  const finalBalance = reportData.length > 0 ? reportData[reportData.length - 1].summary.remainingBalance : 0;

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">كشف المصروفات اليومية المحسن</h1>
      </div>

      {/* Controls */}
      <Card className="mb-6 no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            إعدادات التقرير
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">اختيار المشروع</Label>
            <ProjectSelector onProjectChange={selectProject} />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateFrom" className="text-sm font-medium mb-2 block">
                من تاريخ
              </Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="arabic-numbers"
              />
            </div>
            <div>
              <Label htmlFor="dateTo" className="text-sm font-medium mb-2 block">
                إلى تاريخ
              </Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="arabic-numbers"
              />
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDetails}
                onChange={(e) => setShowDetails(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">إظهار التفاصيل في التصدير</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={generateReport} 
              disabled={isLoading || !selectedProjectId}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              {isLoading ? "جاري الإنشاء..." : "إنشاء التقرير"}
            </Button>
            
            {reportData.length > 0 && (
              <>
                <Button 
                  onClick={exportToExcel} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  تصدير Excel
                </Button>
                
                <Button 
                  onClick={printReport} 
                  variant="outline"
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
      {reportData.length > 0 && (
        <div className="print-preview">
          {/* Report Header */}
          <div className="report-header">
            <h2>كشف المصروفات اليومية التفصيلي</h2>
            <div className="text-sm opacity-90 mt-2">
              {selectedProject?.name} | من {formatDate(dateFrom)} إلى {formatDate(dateTo)}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 no-print">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(totals?.totalIncome || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
                    <p className="text-lg font-bold text-red-600">
                      {formatCurrency(totals?.totalExpenses || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">الرصيد النهائي</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(finalBalance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">عدد الأيام</p>
                    <p className="text-lg font-bold text-purple-600">
                      {reportData.length} يوم
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Reports Table */}
          <div className="overflow-x-auto">
            <table className="report-table w-full">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>الرصيد المرحل</th>
                  <th>الحوالات المالية</th>
                  <th>أجور العمال</th>
                  <th>شراء المواد</th>
                  <th>أجور المواصلات</th>
                  <th>حوالات العمال</th>
                  <th>إجمالي الإيرادات</th>
                  <th>إجمالي المصروفات</th>
                  <th>الرصيد المتبقي</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((day, index) => (
                  <tr key={day.date} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                    <td className="font-medium">{formatDate(day.date)}</td>
                    <td className="currency">{formatCurrency(day.summary.carriedForward)}</td>
                    <td className="currency success-cell">{formatCurrency(day.summary.totalFundTransfers)}</td>
                    <td className="currency warning-cell">{formatCurrency(day.summary.totalWorkerWages)}</td>
                    <td className="currency warning-cell">{formatCurrency(day.summary.totalMaterialCosts)}</td>
                    <td className="currency warning-cell">{formatCurrency(day.summary.totalTransportationCosts)}</td>
                    <td className="currency warning-cell">{formatCurrency(day.summary.totalWorkerTransfers)}</td>
                    <td className="currency font-bold success-cell">{formatCurrency(day.summary.totalIncome)}</td>
                    <td className="currency font-bold warning-cell">{formatCurrency(day.summary.totalExpenses)}</td>
                    <td className="currency font-bold">{formatCurrency(day.summary.remainingBalance)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50 font-bold">
                  <td>الإجمالي</td>
                  <td>-</td>
                  <td className="currency">{formatCurrency(totals?.totalFundTransfers || 0)}</td>
                  <td className="currency">{formatCurrency(totals?.totalWorkerWages || 0)}</td>
                  <td className="currency">{formatCurrency(totals?.totalMaterialCosts || 0)}</td>
                  <td className="currency">{formatCurrency(totals?.totalTransportationCosts || 0)}</td>
                  <td className="currency">{formatCurrency(totals?.totalWorkerTransfers || 0)}</td>
                  <td className="currency success-cell">{formatCurrency(totals?.totalIncome || 0)}</td>
                  <td className="currency warning-cell">{formatCurrency(totals?.totalExpenses || 0)}</td>
                  <td className="currency">{formatCurrency(finalBalance)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Report Footer */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>تم إنشاء هذا التقرير في {formatDate(getCurrentDate())}</p>
            <p>نظام إدارة مشاريع البناء - {selectedProject?.name}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {reportData.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد بيانات</h3>
            <p className="text-gray-600">
              يرجى اختيار مشروع وتحديد الفترة الزمنية ثم الضغط على "إنشاء التقرير"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}