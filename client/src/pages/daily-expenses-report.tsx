import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, FileSpreadsheet, Printer, Download, Filter, BarChart3, TrendingUp, DollarSign, Eye, Settings, CheckCircle } from "lucide-react";
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
import "../styles/daily-expenses-print.css";

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

  const exportToExcel = useCallback(async () => {
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
      
      // ورقة الملخص المحسنة
      const summarySheet = workbook.addWorksheet('ملخص المصروفات', {
        properties: { tabColor: { argb: 'FF3B82F6' } }
      });
      
      // إضافة العنوان الرئيسي
      summarySheet.mergeCells('A1:J3');
      const titleCell = summarySheet.getCell('A1');
      titleCell.value = `كشف المصروفات اليومية التفصيلي\n${selectedProject?.name}\nمن ${formatDate(dateFrom)} إلى ${formatDate(dateTo)}`;
      titleCell.alignment = { 
        horizontal: 'center', 
        vertical: 'middle', 
        wrapText: true,
        readingOrder: 'rtl'
      };
      titleCell.font = { 
        name: 'Arial', 
        size: 16, 
        bold: true, 
        color: { argb: 'FF1E40AF' } 
      };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0F2FE' }
      };
      titleCell.border = {
        top: { style: 'thick', color: { argb: 'FF3B82F6' } },
        left: { style: 'thick', color: { argb: 'FF3B82F6' } },
        bottom: { style: 'thick', color: { argb: 'FF3B82F6' } },
        right: { style: 'thick', color: { argb: 'FF3B82F6' } }
      };
      
      // تحديد ارتفاع الصفوف
      summarySheet.getRow(1).height = 30;
      summarySheet.getRow(2).height = 30;
      summarySheet.getRow(3).height = 30;
      summarySheet.getRow(5).height = 25;
      
      // إضافة رؤوس الأعمدة
      const headerRow = summarySheet.addRow([
        'التاريخ', 'الرصيد المرحل', 'الحوالات المالية', 'أجور العمال', 'شراء المواد', 
        'أجور المواصلات', 'حوالات العمال', 'إجمالي الإيرادات', 'إجمالي المصروفات', 'الرصيد المتبقي'
      ]);
      headerRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF3B82F6' }
        };
        cell.alignment = { 
          horizontal: 'center', 
          vertical: 'middle',
          readingOrder: 'rtl'
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });
      
      // إضافة البيانات مع التنسيق
      reportData.forEach((day, index) => {
        const dataRow = summarySheet.addRow([
          formatDate(day.date),
          day.summary.carriedForward,
          day.summary.totalFundTransfers,
          day.summary.totalWorkerWages,
          day.summary.totalMaterialCosts,
          day.summary.totalTransportationCosts,
          day.summary.totalWorkerTransfers,
          day.summary.totalIncome,
          day.summary.totalExpenses,
          day.summary.remainingBalance
        ]);
        
        dataRow.eachCell((cell, colNumber) => {
          cell.alignment = { 
            horizontal: colNumber === 1 ? 'center' : 'right',
            vertical: 'middle',
            readingOrder: 'rtl'
          };
          cell.font = { name: 'Arial', size: 10 };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };
          
          // تلوين الصفوف بالتناوب
          if (index % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' }
            };
          }
          
          // تنسيق الأرقام
          if (colNumber > 1) {
            cell.numFmt = '#,##0.00';
          }
          
          // تلوين الخلايا حسب النوع
          if (colNumber === 3 || colNumber === 8) { // الحوالات والإيرادات
            cell.font = { ...cell.font, color: { argb: 'FF166534' } };
          } else if (colNumber >= 4 && colNumber <= 7 || colNumber === 9) { // المصروفات
            cell.font = { ...cell.font, color: { argb: 'FF92400E' } };
          }
        });
      });
      
      // إضافة صف الإجماليات
      const totalsRow = summarySheet.addRow([
        'الإجمالي',
        '-',
        totals?.totalFundTransfers || 0,
        totals?.totalWorkerWages || 0,
        totals?.totalMaterialCosts || 0,
        totals?.totalTransportationCosts || 0,
        totals?.totalWorkerTransfers || 0,
        totals?.totalIncome || 0,
        totals?.totalExpenses || 0,
        finalBalance
      ]);
      
      totalsRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 11, bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0F2FE' }
        };
        cell.alignment = { 
          horizontal: colNumber === 1 ? 'center' : 'right',
          vertical: 'middle',
          readingOrder: 'rtl'
        };
        cell.border = {
          top: { style: 'thick', color: { argb: 'FF3B82F6' } },
          left: { style: 'thin', color: { argb: 'FF3B82F6' } },
          bottom: { style: 'thick', color: { argb: 'FF3B82F6' } },
          right: { style: 'thin', color: { argb: 'FF3B82F6' } }
        };
        
        if (colNumber > 2) {
          cell.numFmt = '#,##0.00';
        }
      });
      
      // تحديد عرض الأعمدة
      summarySheet.columns = [
        { width: 15 }, // التاريخ
        { width: 12 }, // الرصيد المرحل
        { width: 14 }, // الحوالات المالية
        { width: 12 }, // أجور العمال
        { width: 12 }, // شراء المواد
        { width: 14 }, // أجور المواصلات
        { width: 12 }, // حوالات العمال
        { width: 14 }, // إجمالي الإيرادات
        { width: 14 }, // إجمالي المصروفات
        { width: 14 }  // الرصيد المتبقي
      ];

      // ورقة التفاصيل المحسنة
      if (showDetails) {
        const detailsSheet = workbook.addWorksheet('تفاصيل المصروفات', {
          properties: { tabColor: { argb: 'FF10B981' } }
        });
        
        // إضافة العنوان الرئيسي للتفاصيل
        detailsSheet.mergeCells('A1:G3');
        const detailTitleCell = detailsSheet.getCell('A1');
        detailTitleCell.value = `تفاصيل المصروفات اليومية\n${selectedProject?.name}\nمن ${formatDate(dateFrom)} إلى ${formatDate(dateTo)}`;
        detailTitleCell.alignment = { 
          horizontal: 'center', 
          vertical: 'middle', 
          wrapText: true,
          readingOrder: 'rtl'
        };
        detailTitleCell.font = { 
          name: 'Arial', 
          size: 16, 
          bold: true, 
          color: { argb: 'FF065F46' } 
        };
        detailTitleCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD1FAE5' }
        };
        detailTitleCell.border = {
          top: { style: 'thick', color: { argb: 'FF10B981' } },
          left: { style: 'thick', color: { argb: 'FF10B981' } },
          bottom: { style: 'thick', color: { argb: 'FF10B981' } },
          right: { style: 'thick', color: { argb: 'FF10B981' } }
        };
        
        // تحديد ارتفاع الصفوف للتفاصيل
        detailsSheet.getRow(1).height = 30;
        detailsSheet.getRow(2).height = 30;
        detailsSheet.getRow(3).height = 30;
        detailsSheet.getRow(5).height = 25;
        
        // إضافة رؤوس الأعمدة للتفاصيل
        const detailHeaderRow = detailsSheet.addRow([
          'التاريخ', 'النوع', 'الوصف', 'المرسل/المورد', 'المبلغ', 'طريقة الدفع', 'ملاحظات'
        ]);
        detailHeaderRow.eachCell((cell, colNumber) => {
          cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF10B981' }
          };
          cell.alignment = { 
            horizontal: 'center', 
            vertical: 'middle',
            readingOrder: 'rtl'
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
        });
        
        // إضافة البيانات التفصيلية مع التنسيق
        let rowIndex = 0;
        reportData.forEach(day => {
          // الحوالات المالية
          day.fundTransfers.forEach(transfer => {
            const detailRow = detailsSheet.addRow([
              formatDate(day.date),
              'حوالة مالية',
              `حوالة رقم ${transfer.transferNumber}`,
              transfer.senderName,
              parseFloat(transfer.amount),
              transfer.transferType,
              transfer.notes || ''
            ]);
            formatDetailRow(detailRow, rowIndex, 'income');
            rowIndex++;
          });

          // حضور العمال
          day.workerAttendance.forEach(attendance => {
            const detailRow = detailsSheet.addRow([
              formatDate(day.date),
              'أجر عامل',
              `${attendance.worker?.name} - ${attendance.workDescription}`,
              `أيام العمل: ${attendance.workDays}`,
              parseFloat(attendance.paidAmount),
              attendance.paymentType,
              attendance.notes || ''
            ]);
            formatDetailRow(detailRow, rowIndex, 'expense');
            rowIndex++;
          });

          // شراء المواد
          day.materialPurchases.forEach(purchase => {
            const detailRow = detailsSheet.addRow([
              formatDate(day.date),
              'شراء مواد',
              `${purchase.material?.name} - ${purchase.quantity} ${purchase.material?.unit}`,
              purchase.supplierName,
              parseFloat(purchase.totalAmount),
              purchase.purchaseType,
              purchase.notes || ''
            ]);
            formatDetailRow(detailRow, rowIndex, 'expense');
            rowIndex++;
          });

          // أجور المواصلات
          day.transportationExpenses.forEach(expense => {
            const detailRow = detailsSheet.addRow([
              formatDate(day.date),
              'أجور مواصلات',
              expense.description,
              expense.worker?.name || '',
              parseFloat(expense.amount),
              'نقد',
              expense.notes || ''
            ]);
            formatDetailRow(detailRow, rowIndex, 'expense');
            rowIndex++;
          });

          // حوالات العمال
          day.workerTransfers.forEach(transfer => {
            const detailRow = detailsSheet.addRow([
              formatDate(day.date),
              'حوالة عامل',
              `حوالة من ${transfer.worker?.name} إلى ${transfer.recipientName}`,
              transfer.senderName,
              parseFloat(transfer.amount),
              transfer.transferMethod,
              transfer.notes || ''
            ]);
            formatDetailRow(detailRow, rowIndex, 'expense');
            rowIndex++;
          });
        });
        
        // تحديد عرض الأعمدة للتفاصيل
        detailsSheet.columns = [
          { width: 12 }, // التاريخ
          { width: 15 }, // النوع
          { width: 30 }, // الوصف
          { width: 20 }, // المرسل/المورد
          { width: 12 }, // المبلغ
          { width: 12 }, // طريقة الدفع
          { width: 25 }  // ملاحظات
        ];
      }
      
      // دالة مساعدة لتنسيق صفوف التفاصيل
      const formatDetailRow = (row: any, index: number, type: 'income' | 'expense') => {
        row.eachCell((cell: any, colNumber: number) => {
          cell.alignment = { 
            horizontal: colNumber === 5 ? 'right' : colNumber === 1 ? 'center' : 'right',
            vertical: 'middle',
            readingOrder: 'rtl'
          };
          cell.font = { name: 'Arial', size: 9 };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };
          
          // تلوين الصفوف بالتناوب
          if (index % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: type === 'income' ? 'FFF0FDF4' : 'FFFEF7ED' }
            };
          }
          
          // تنسيق الأرقام
          if (colNumber === 5) {
            cell.numFmt = '#,##0.00';
            cell.font = { ...cell.font, color: { argb: type === 'income' ? 'FF166534' : 'FF92400E' } };
          }
        });
      };

      // حفظ الملف مع اسم محسن
      const projectName = selectedProject?.name?.replace(/[^\w\s-]/gi, '') || 'مشروع';
      const fileName = `كشف_المصروفات_اليومية_${projectName}_${dateFrom}_${dateTo}.xlsx`;
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      saveAs(blob, fileName);
      
      toast({
        title: "✅ تم التصدير بنجاح",
        description: `تم تصدير كشف المصروفات إلى ملف Excel بتصميم احترافي${showDetails ? ' مع التفاصيل' : ''}`,
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "❌ خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير التقرير. يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  }, [reportData, showDetails, selectedProject, dateFrom, dateTo, toast]);

  const printReport = useCallback(() => {
    // التأكد من تحميل ملف CSS للطباعة
    const printStylesheet = document.querySelector('link[href*="daily-expenses-print.css"]');
    if (!printStylesheet) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/src/styles/daily-expenses-print.css';
      document.head.appendChild(link);
    }
    
    // إضافة عنوان للنافذة
    const originalTitle = document.title;
    document.title = `كشف المصروفات اليومية - ${selectedProject?.name} - ${formatDate(dateFrom)} إلى ${formatDate(dateTo)}`;
    
    // تنفيذ الطباعة
    setTimeout(() => {
      window.print();
      
      // استعادة العنوان الأصلي
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }, 100);
  }, [selectedProject, dateFrom, dateTo]);

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
      <div className="flex items-center justify-between mb-6 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">كشف المصروفات اليومية المحسن</h1>
            <p className="text-sm text-muted-foreground">تقرير شامل لجميع المصروفات والإيرادات</p>
          </div>
        </div>
        
        {reportData.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
              <CheckCircle className="h-3 w-3 mr-1" />
              {reportData.length} يوم
            </Badge>
            <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
              <Eye className="h-3 w-3 mr-1" />
              جاهز للطباعة
            </Badge>
          </div>
        )}
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
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <Calendar className="h-4 w-4" />
              {isLoading ? "جاري الإنشاء..." : "إنشاء التقرير"}
            </Button>
            
            {reportData.length > 0 && (
              <>
                <Button 
                  onClick={exportToExcel} 
                  variant="outline"
                  className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
                  size="lg"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  تصدير Excel احترافي
                </Button>
                
                <Button 
                  onClick={printReport} 
                  variant="outline"
                  className="flex items-center gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                  size="lg"
                >
                  <Printer className="h-4 w-4" />
                  طباعة محسنة
                </Button>
                
                <Button 
                  onClick={() => window.location.href = "/print-control"}
                  variant="outline"
                  className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                  size="lg"
                >
                  <Settings className="h-4 w-4" />
                  إعدادات الطباعة
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
          <div className="report-header bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg mb-6 border border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">كشف المصروفات اليومية التفصيلي</h2>
              <div className="text-lg text-blue-700 dark:text-blue-300 font-medium">
                مشروع: <span className="font-bold">{selectedProject?.name}</span>
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                الفترة: من {formatDate(dateFrom)} إلى {formatDate(dateTo)}
              </div>
              <div className="text-xs text-blue-500 dark:text-blue-500 mt-2">
                تم إنشاؤه في {formatDate(getCurrentDate())} - نظام إدارة مشاريع البناء
              </div>
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
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <table className="report-table w-full bg-white dark:bg-gray-800">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="px-4 py-3 text-center font-semibold">التاريخ</th>
                  <th className="px-4 py-3 text-center font-semibold">الرصيد المرحل</th>
                  <th className="px-4 py-3 text-center font-semibold text-green-100">الحوالات المالية</th>
                  <th className="px-4 py-3 text-center font-semibold text-orange-100">أجور العمال</th>
                  <th className="px-4 py-3 text-center font-semibold text-orange-100">شراء المواد</th>
                  <th className="px-4 py-3 text-center font-semibold text-orange-100">أجور المواصلات</th>
                  <th className="px-4 py-3 text-center font-semibold text-orange-100">حوالات العمال</th>
                  <th className="px-4 py-3 text-center font-semibold text-green-100">إجمالي الإيرادات</th>
                  <th className="px-4 py-3 text-center font-semibold text-red-100">إجمالي المصروفات</th>
                  <th className="px-4 py-3 text-center font-semibold text-blue-100">الرصيد المتبقي</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((day, index) => (
                  <tr 
                    key={day.date} 
                    className={`
                      ${index % 2 === 0 ? "bg-gray-50 dark:bg-gray-900/30" : "bg-white dark:bg-gray-800"} 
                      hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200
                    `}
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100 date-cell text-center border-b border-gray-200 dark:border-gray-700">
                      {formatDate(day.date)}
                    </td>
                    <td className="px-4 py-3 currency text-gray-700 dark:text-gray-300 text-center border-b border-gray-200 dark:border-gray-700">
                      {formatCurrency(day.summary.carriedForward)}
                    </td>
                    <td className="px-4 py-3 currency text-green-700 dark:text-green-400 font-medium text-center border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
                      {formatCurrency(day.summary.totalFundTransfers)}
                    </td>
                    <td className="px-4 py-3 currency text-orange-700 dark:text-orange-400 font-medium text-center border-b border-gray-200 dark:border-gray-700 bg-orange-50 dark:bg-orange-900/20">
                      {formatCurrency(day.summary.totalWorkerWages)}
                    </td>
                    <td className="px-4 py-3 currency text-orange-700 dark:text-orange-400 font-medium text-center border-b border-gray-200 dark:border-gray-700 bg-orange-50 dark:bg-orange-900/20">
                      {formatCurrency(day.summary.totalMaterialCosts)}
                    </td>
                    <td className="px-4 py-3 currency text-orange-700 dark:text-orange-400 font-medium text-center border-b border-gray-200 dark:border-gray-700 bg-orange-50 dark:bg-orange-900/20">
                      {formatCurrency(day.summary.totalTransportationCosts)}
                    </td>
                    <td className="px-4 py-3 currency text-orange-700 dark:text-orange-400 font-medium text-center border-b border-gray-200 dark:border-gray-700 bg-orange-50 dark:bg-orange-900/20">
                      {formatCurrency(day.summary.totalWorkerTransfers)}
                    </td>
                    <td className="px-4 py-3 currency font-bold text-green-800 dark:text-green-300 text-center border-b border-gray-200 dark:border-gray-700 bg-green-100 dark:bg-green-900/30">
                      {formatCurrency(day.summary.totalIncome)}
                    </td>
                    <td className="px-4 py-3 currency font-bold text-red-800 dark:text-red-300 text-center border-b border-gray-200 dark:border-gray-700 bg-red-100 dark:bg-red-900/30">
                      {formatCurrency(day.summary.totalExpenses)}
                    </td>
                    <td className={`
                      px-4 py-3 currency font-bold text-center border-b border-gray-200 dark:border-gray-700
                      ${day.summary.remainingBalance >= 0 
                        ? 'text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30' 
                        : 'text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-900/30'
                      }
                    `}>
                      {formatCurrency(day.summary.remainingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-lg">
                  <td className="px-4 py-4 text-center font-bold border-t-2 border-blue-500">الإجمالي</td>
                  <td className="px-4 py-4 text-center border-t-2 border-blue-500">-</td>
                  <td className="px-4 py-4 currency text-center border-t-2 border-blue-500 text-green-200">
                    {formatCurrency(totals?.totalFundTransfers || 0)}
                  </td>
                  <td className="px-4 py-4 currency text-center border-t-2 border-blue-500 text-orange-200">
                    {formatCurrency(totals?.totalWorkerWages || 0)}
                  </td>
                  <td className="px-4 py-4 currency text-center border-t-2 border-blue-500 text-orange-200">
                    {formatCurrency(totals?.totalMaterialCosts || 0)}
                  </td>
                  <td className="px-4 py-4 currency text-center border-t-2 border-blue-500 text-orange-200">
                    {formatCurrency(totals?.totalTransportationCosts || 0)}
                  </td>
                  <td className="px-4 py-4 currency text-center border-t-2 border-blue-500 text-orange-200">
                    {formatCurrency(totals?.totalWorkerTransfers || 0)}
                  </td>
                  <td className="px-4 py-4 currency text-center border-t-2 border-blue-500 text-green-200 font-extrabold">
                    {formatCurrency(totals?.totalIncome || 0)}
                  </td>
                  <td className="px-4 py-4 currency text-center border-t-2 border-blue-500 text-red-200 font-extrabold">
                    {formatCurrency(totals?.totalExpenses || 0)}
                  </td>
                  <td className={`
                    px-4 py-4 currency text-center border-t-2 border-blue-500 font-extrabold text-xl
                    ${finalBalance >= 0 ? 'text-yellow-200' : 'text-red-200'}
                  `}>
                    {formatCurrency(finalBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Report Footer */}
          <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border-t-4 border-blue-500">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  تم إنشاء هذا التقرير بنجاح في {formatDate(getCurrentDate())}
                </p>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                نظام إدارة مشاريع البناء الاحترافي - مشروع: {selectedProject?.name}
              </p>
              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-500">
                <span>✅ بيانات حقيقية من النظام</span>
                <span>📊 تقرير تفاعلي</span>
                <span>🖨️ جاهز للطباعة</span>
                <span>📈 تصدير Excel احترافي</span>
              </div>
            </div>
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