/**
 * مكون تصدير تقرير المصروفات اليومية لفترة زمنية
 * كل يوم في ورقة منفصلة في ملف Excel واحد
 * المالك: عمار
 * التاريخ: 2025-08-16
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSelectedProject } from '@/hooks/use-selected-project';
import { 
  FileSpreadsheet, 
  Calendar, 
  Download, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Camera
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import type { Project } from '@shared/schema';

interface DailyExpenseData {
  date: string;
  projectName: string;
  projectId: string;
  totalIncome: number;
  totalExpenses: number;
  remainingBalance: number;
  carriedForward: number;
  transferFromProject?: string;
  fundTransfers: any[];
  workerAttendance: any[];
  materialPurchases: any[];
  transportationExpenses: any[];
  workerTransfers: any[];
  miscExpenses: any[];
  supplierPayments?: any[];
}

export default function DailyExpensesBulkExport() {
  const { selectedProjectId } = useSelectedProject();
  const { toast } = useToast();
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });

  // جلب بيانات المشاريع
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // دالة تنسيق العملة (أرقام إنجليزية)
  const formatCurrency = (amount: number) => {
    return `${Number(amount).toLocaleString('en-US', { useGrouping: true })} ريال`;
  };

  // دالة تنسيق الأرقام (إنجليزية)
  const formatNumber = (num: number) => {
    return Number(num).toLocaleString('en-US', { useGrouping: true });
  };

  // دالة تنسيق التاريخ (بالإنجليزية)
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB');
  };

  // دالة جلب بيانات المصروفات اليومية لفترة
  const fetchDailyExpensesForPeriod = async (projectId: string, fromDate: string, toDate: string) => {
    const expenses: DailyExpenseData[] = [];
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    
    console.log(`📅 جلب المصروفات اليومية من ${fromDate} إلى ${toDate} للمشروع ${projectId}`);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      try {
        const response = await fetch(`/api/reports/daily-expenses/${projectId}/${dateStr}`);
        if (response.ok) {
          const data = await response.json();
          if (data && Object.keys(data).length > 0) {
            expenses.push({
              ...data,
              date: dateStr,
              projectName: selectedProject?.name || 'مشروع غير محدد'
            });
          }
        }
        
        // تحديث progress
        const current = Math.ceil((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const total = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        setExportProgress({ current, total });
        
      } catch (error) {
        console.error(`خطأ في جلب بيانات ${dateStr}:`, error);
      }
    }
    
    return expenses;
  };

  // دالة إنشاء ورقة Excel ليوم واحد
  const createDayWorksheet = (workbook: ExcelJS.Workbook, dayData: DailyExpenseData) => {
    const worksheetName = `${formatDate(dayData.date)}`.replace(/\//g, '-');
    const worksheet = workbook.addWorksheet(worksheetName);
    
    // إعداد اتجاه النص من اليمين لليسار
    worksheet.views = [{ rightToLeft: true }];

    // رأس الشركة المحسّن
    worksheet.mergeCells('A1:G1');
    const companyCell = worksheet.getCell('A1');
    companyCell.value = 'شركة الفتيني للمقاولات والاستشارات الهندسية';
    companyCell.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
    companyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    companyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e3a8a' } };
    worksheet.getRow(1).height = 35;

    // عنوان التقرير المحسّن
    worksheet.addRow([]);
    worksheet.mergeCells('A2:G2');
    const titleCell = worksheet.getCell('A2');
    titleCell.value = `تقرير المصروفات اليومية - ${formatDate(dayData.date)}`;
    titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3b82f6' } };
    worksheet.getRow(2).height = 28;

    // معلومات إضافية
    worksheet.addRow([]);
    worksheet.mergeCells('A3:D3');
    const infoCell = worksheet.getCell('A3');
    const currentTime = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Riyadh' });
    infoCell.value = `تاريخ الإنتاج: ${currentTime} | نظام إدارة المشاريع`;
    infoCell.font = { name: 'Calibri', size: 10, color: { argb: 'FF64748b' } };
    infoCell.alignment = { horizontal: 'left', vertical: 'middle' };

    // معلومات المشروع
    worksheet.addRow([]);
    worksheet.addRow(['اسم المشروع:', dayData.projectName, '', 'التاريخ:', formatDate(dayData.date)]);
    
    worksheet.addRow([]);

    // ملخص الحسابات
    const summaryHeaders = ['البيان', 'المبلغ'];
    const summaryHeaderRow = worksheet.addRow(summaryHeaders);
    summaryHeaderRow.eachCell((cell) => {
      cell.font = { name: 'Arial Unicode MS', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3b82f6' } };
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' }
      };
    });

    // بيانات الملخص
    const summaryData = [
      [`الرصيد المرحل من مشروع ${dayData.transferFromProject || 'غير محدد'}`, formatCurrency(dayData.carriedForward || 0)],
      ['إجمالي الدخل', formatCurrency((dayData.totalIncome || 0) + (dayData.carriedForward || 0))],
      ['إجمالي المصاريف', formatCurrency(dayData.totalExpenses || 0)],
      ['الرصيد المتبقي', formatCurrency(dayData.remainingBalance || 0)]
    ];

    summaryData.forEach((row, index) => {
      const dataRow = worksheet.addRow(row);
      dataRow.eachCell((cell) => {
        cell.font = { name: 'Arial Unicode MS', size: 10 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' }
        };
        if (index % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      });
    });

    worksheet.addRow([]);

    // تفاصيل المصروفات إذا كانت موجودة
    if (dayData.workerAttendance && dayData.workerAttendance.length > 0) {
      worksheet.addRow(['تفاصيل أجور العمال:']);
      const workersHeaders = ['اسم العامل', 'نوع العامل', 'عدد أيام العمل', 'ساعات العمل', 'الأجر المستحق', 'الأجر المدفوع', 'ملاحظات'];
      const workersHeaderRow = worksheet.addRow(workersHeaders);
      
      workersHeaderRow.eachCell((cell) => {
        cell.font = { name: 'Arial Unicode MS', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' }
        };
      });

      dayData.workerAttendance.forEach((worker: any, index: number) => {
        const workerRow = worksheet.addRow([
          worker.workerName || worker.worker?.name || 'غير محدد',
          worker.workerTypeName || worker.workerType?.name || worker.workerType || 'غير محدد',
          formatNumber(worker.workDays || worker.daysWorked || 1),
          formatNumber(worker.hoursWorked || worker.workHours || 8),
          formatCurrency(worker.actualWage || worker.totalWage || 0),
          formatCurrency(worker.paidAmount || worker.amountPaid || 0),
          worker.notes || worker.remarks || ''
        ]);
        
        if (index % 2 === 0) {
          workerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
          });
        }
      });
      
      worksheet.addRow([]);
    }

    // مشتريات المواد
    if (dayData.materialPurchases && dayData.materialPurchases.length > 0) {
      worksheet.addRow(['مشتريات المواد:']);
      const materialsHeaders = ['اسم المادة', 'الكمية', 'سعر الوحدة', 'إجمالي المبلغ', 'المورد'];
      const materialsHeaderRow = worksheet.addRow(materialsHeaders);
      
      materialsHeaderRow.eachCell((cell) => {
        cell.font = { name: 'Arial Unicode MS', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf59e0b' } };
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' }
        };
      });

      dayData.materialPurchases.forEach((material: any, index: number) => {
        const materialRow = worksheet.addRow([
          material.materialName || material.material?.name || 'غير محدد',
          formatNumber(material.quantity || 0),
          formatCurrency(material.unitPrice || material.pricePerUnit || 0),
          formatCurrency(material.totalAmount || material.totalCost || 0),
          material.supplierName || material.supplier?.name || 'غير محدد'
        ]);
        
        if (index % 2 === 0) {
          materialRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
          });
        }
      });
      
      worksheet.addRow([]);
    }

    // تعديل عرض الأعمدة
    worksheet.columns = [
      { width: 25 }, { width: 20 }, { width: 15 }, 
      { width: 15 }, { width: 15 }, { width: 15 }, { width: 30 }
    ];

    // إضافة مصاريف النقل إذا كانت موجودة
    if (dayData.transportationExpenses && dayData.transportationExpenses.length > 0) {
      worksheet.addRow(['مصاريف النقل والمواصلات:']);
      const transportHeaders = ['نوع المصروف', 'المبلغ', 'الوجهة/التفاصيل', 'ملاحظات'];
      const transportHeaderRow = worksheet.addRow(transportHeaders);
      
      transportHeaderRow.eachCell((cell) => {
        cell.font = { name: 'Arial Unicode MS', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFdc2626' } };
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' }
        };
      });

      dayData.transportationExpenses.forEach((transport: any, index: number) => {
        const transportRow = worksheet.addRow([
          transport.expenseType || transport.type || 'غير محدد',
          formatCurrency(transport.amount || transport.totalAmount || 0),
          transport.destination || transport.details || 'غير محدد',
          transport.notes || transport.remarks || ''
        ]);
        
        if (index % 2 === 0) {
          transportRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
          });
        }
      });
      
      worksheet.addRow([]);
    }

    // إضافة مدفوعات الموردين إذا كانت موجودة
    if (dayData.supplierPayments && dayData.supplierPayments.length > 0) {
      worksheet.addRow(['مدفوعات الموردين:']);
      const supplierHeaders = ['اسم المورد', 'المبلغ المدفوع', 'طريقة الدفع', 'رقم الإيصال', 'ملاحظات'];
      const supplierHeaderRow = worksheet.addRow(supplierHeaders);
      
      supplierHeaderRow.eachCell((cell) => {
        cell.font = { name: 'Arial Unicode MS', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7c3aed' } };
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' }
        };
      });

      dayData.supplierPayments.forEach((payment: any, index: number) => {
        const paymentRow = worksheet.addRow([
          payment.supplierName || payment.supplier?.name || 'غير محدد',
          formatCurrency(payment.amount || payment.paidAmount || 0),
          payment.paymentMethod || payment.method || 'غير محدد',
          payment.receiptNumber || payment.invoiceNumber || '',
          payment.notes || payment.remarks || ''
        ]);
        
        if (index % 2 === 0) {
          paymentRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
          });
        }
      });
      
      worksheet.addRow([]);
    }

    // إضافة الحوالات والتحويلات إذا كانت موجودة
    if (dayData.fundTransfers && dayData.fundTransfers.length > 0) {
      worksheet.addRow(['الحوالات والتحويلات المالية:']);
      const transferHeaders = ['نوع التحويل', 'المبلغ', 'من/إلى', 'طريقة التحويل', 'ملاحظات'];
      const transferHeaderRow = worksheet.addRow(transferHeaders);
      
      transferHeaderRow.eachCell((cell) => {
        cell.font = { name: 'Arial Unicode MS', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891b2' } };
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' }
        };
      });

      dayData.fundTransfers.forEach((transfer: any, index: number) => {
        const transferRow = worksheet.addRow([
          transfer.type || transfer.transferType || 'غير محدد',
          formatCurrency(transfer.amount || 0),
          transfer.fromTo || transfer.description || 'غير محدد',
          transfer.method || transfer.paymentMethod || 'غير محدد',
          transfer.notes || transfer.remarks || ''
        ]);
        
        if (index % 2 === 0) {
          transferRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
          });
        }
      });
      
      worksheet.addRow([]);
    }

    // إعداد الطباعة
    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      margins: {
        left: 0.7, right: 0.7,
        top: 0.75, bottom: 0.75,
        header: 0.3, footer: 0.3
      }
    };

    return worksheet;
  };

  // دالة تحميل صورة المعاينة
  const downloadComponentImage = async () => {
    try {
      console.log('📸 بدء تحميل صورة معاينة تصدير المصروفات المجمعة...');
      
      const element = document.getElementById('bulk-export-component');
      if (!element) {
        alert('❌ لم يتم العثور على محتوى المعاينة');
        return;
      }

      // التقاط الصورة
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2, // جودة عالية
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      // تحويل إلى صورة وتحميلها
      const imgData = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const projectName = selectedProject?.name?.replace(/[\\/:*?"<>|]/g, '-') || 'مشروع';
      link.download = `معاينة_تصدير_المصروفات_المجمعة_${projectName}.png`;
      link.href = imgData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('✅ تم تحميل صورة المعاينة بنجاح');
      
    } catch (error) {
      console.error('❌ خطأ في تحميل الصورة:', error);
      alert('❌ حدث خطأ أثناء تحميل صورة المعاينة. يرجى المحاولة مرة أخرى.');
    }
  };

  // دالة التصدير الرئيسية
  const handleBulkExport = async () => {
    if (!selectedProjectId) {
      toast({
        title: "يرجى تحديد المشروع",
        description: "يجب تحديد مشروع لتصدير المصروفات",
        variant: "destructive"
      });
      return;
    }

    if (!dateFrom || !dateTo) {
      toast({
        title: "يرجى تحديد الفترة الزمنية",
        description: "يجب تحديد تاريخ البداية والنهاية",
        variant: "destructive"
      });
      return;
    }

    if (new Date(dateFrom) > new Date(dateTo)) {
      toast({
        title: "خطأ في التواريخ",
        description: "تاريخ البداية يجب أن يكون قبل تاريخ النهاية",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    setExportProgress({ current: 0, total: 0 });

    try {
      console.log('🚀 بدء تصدير المصروفات اليومية المجمعة...');
      
      // جلب البيانات
      const dailyExpenses = await fetchDailyExpensesForPeriod(selectedProjectId, dateFrom, dateTo);
      
      if (dailyExpenses.length === 0) {
        toast({
          title: "لا توجد بيانات",
          description: "لا توجد مصروفات في الفترة المحددة",
          variant: "destructive"
        });
        return;
      }

      console.log(`📊 تم جلب ${dailyExpenses.length} يوم من البيانات`);

      // إنشاء ملف Excel
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'شركة الفتيني للمقاولات والاستشارات الهندسية';
      workbook.created = new Date();

      // إنشاء ورقة لكل يوم
      dailyExpenses.forEach((dayData) => {
        createDayWorksheet(workbook, dayData);
      });

      // تصدير الملف
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const projectName = selectedProject?.name?.replace(/[\\/:*?"<>|]/g, '-') || 'مشروع';
      const fileName = `تقرير_المصروفات_اليومية_${projectName}_من_${dateFrom}_إلى_${dateTo}.xlsx`;
      saveAs(blob, fileName);

      console.log('📄 تفاصيل الملف المُصدّر:');
      console.log(`   📁 اسم الملف: ${fileName}`);
      console.log(`   📊 عدد الأوراق: ${dailyExpenses.length}`);
      console.log(`   📋 البيانات المُضمّنة:`);

      toast({
        title: "تم التصدير بنجاح! 🎉",
        description: `تم تصدير ${dailyExpenses.length} يوم من المصروفات اليومية`,
      });

      console.log('✅ تم إنتهاء التصدير بنجاح');

    } catch (error) {
      console.error('❌ خطأ في التصدير:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير المصروفات اليومية",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
      setExportProgress({ current: 0, total: 0 });
    }
  };

  // إعداد التواريخ الافتراضية
  React.useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (!dateTo) setDateTo(today);
    if (!dateFrom) setDateFrom(weekAgo);
  }, []);

  return (
    <Card className="w-full" id="bulk-export-component">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            تصدير المصروفات اليومية لفترة زمنية
          </CardTitle>
          <Button 
            onClick={downloadComponentImage}
            variant="secondary" 
            size="sm" 
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Camera className="h-4 w-4 mr-1" />
            تحميل صورة
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* تنبيه توضيحي */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">كيفية الاستخدام</h3>
          </div>
          <p className="text-sm text-blue-700 mt-2">
            سيتم إنشاء ملف Excel واحد يحتوي على ورقة منفصلة لكل يوم في الفترة المحددة.
            كل ورقة تحتوي على تفاصيل المصروفات اليومية لذلك اليوم.
          </p>
        </div>

        {/* معلومات المشروع */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">المشروع المحدد:</h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {selectedProject?.name || 'لم يتم تحديد مشروع'}
            </Badge>
            {selectedProject?.status && (
              <Badge variant={selectedProject.status === 'active' ? 'default' : 'secondary'}>
                {selectedProject.status === 'active' ? 'نشط' : selectedProject.status}
              </Badge>
            )}
          </div>
        </div>

        {/* اختيار الفترة الزمنية */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="dateFrom" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              من تاريخ
            </Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dateTo" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              إلى تاريخ
            </Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Progress Bar */}
        {isExporting && exportProgress.total > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>جاري المعالجة...</span>
              <span>{exportProgress.current} من {exportProgress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* زر التصدير */}
        <div className="flex justify-center">
          <Button
            onClick={handleBulkExport}
            disabled={isExporting || !selectedProjectId}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                تصدير إلى Excel
              </>
            )}
          </Button>
        </div>

        {/* معلومات إضافية */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold text-green-800">ما سيتم تضمينه في التقرير:</h4>
          </div>
          <ul className="text-sm text-green-700 mt-2 space-y-1">
            <li>• ملخص الدخل والمصاريف لكل يوم (أرقام وتواريخ إنجليزية)</li>
            <li>• تفاصيل أجور العمال مع أيام وساعات العمل</li>
            <li>• مشتريات المواد والأدوات مع تفاصيل الموردين</li>
            <li>• مصاريف النقل والمواصلات</li>
            <li>• مدفوعات الموردين وطرق الدفع</li>
            <li>• الحوالات والتحويلات المالية</li>
            <li>• الرصيد المرحل من المشاريع الأخرى</li>
            <li>• جميع البيانات حقيقية من قاعدة البيانات</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}