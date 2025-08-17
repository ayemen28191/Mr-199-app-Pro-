import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { Project } from '@shared/schema';

interface SimplifiedDailyExportProps {
  selectedProject: Project | null;
  dateFrom: string;
  dateTo: string;
}

// مكون مُبسط لتصدير المصروفات اليومية بدون تعقيدات
export default function SimplifiedDailyExport({ 
  selectedProject, 
  dateFrom, 
  dateTo 
}: SimplifiedDailyExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToSimpleExcel = async () => {
    if (!selectedProject || !dateFrom || !dateTo) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب اختيار مشروع وتواريخ صحيحة",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    console.log('🚀 بدء التصدير المبسط...');

    try {
      // إنشاء workbook بسيط
      const workbook = new ExcelJS.Workbook();
      
      // تطبيق إعدادات أساسية فقط
      workbook.creator = 'نظام الادارة';
      workbook.created = new Date();

      const startDate = new Date(dateFrom);
      const endDate = new Date(dateTo);
      let processedDays = 0;

      // معالجة كل يوم بشكل منفصل
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        
        try {
          console.log(`📅 معالجة يوم: ${dateStr}`);
          
          const response = await fetch(`/api/reports/daily-expenses/${selectedProject.id}/${dateStr}`, {
            timeout: 5000 // timeout قصير
          } as any);
          
          if (!response.ok) {
            console.log(`⚠️ لا توجد بيانات لتاريخ: ${dateStr}`);
            continue;
          }

          const dayData = await response.json();
          
          if (!dayData || Object.keys(dayData).length === 0) {
            console.log(`📭 لا توجد مصروفات لتاريخ: ${dateStr}`);
            continue;
          }

          // إنشاء worksheet بسيط لليوم
          await createSimpleDaySheet(workbook, dayData, dateStr);
          processedDays++;

        } catch (dayError: any) {
          console.error(`❌ خطأ في معالجة يوم ${dateStr}:`, dayError.message);
          // نتجاهل أخطاء الأيام الفردية ونكمل
        }

        // استراحة صغيرة بين الطلبات
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (processedDays === 0) {
        toast({
          title: "لا توجد بيانات",
          description: "لم توجد أي مصروفات في الفترة المحددة",
          variant: "destructive"
        });
        return;
      }

      // تصدير الملف بطريقة آمنة
      console.log(`📊 إنشاء ملف Excel لـ ${processedDays} أيام...`);
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const fileName = `تقرير_مبسط_${selectedProject.name.replace(/[\\/:*?"<>|]/g, '-')}_${dateFrom.replace(/-/g, '_')}_إلى_${dateTo.replace(/-/g, '_')}.xlsx`;
      
      saveAs(blob, fileName);
      
      toast({
        title: "✅ تم التصدير بنجاح",
        description: `تم تصدير ${processedDays} يوم من البيانات`,
      });
      
      console.log(`✅ انتهى التصدير بنجاح: ${fileName}`);

    } catch (error: any) {
      console.error('❌ خطأ في التصدير المبسط:', error);
      toast({
        title: "خطأ في التصدير",
        description: `فشل التصدير: ${error.message || 'خطأ غير محدد'}`,
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
      <h3 className="text-lg font-bold text-blue-800">التصدير المبسط (تجريبي)</h3>
      <p className="text-sm text-blue-600">
        نسخة مبسطة من التصدير لتجنب مشاكل التعطل
      </p>
      
      <Button 
        onClick={exportToSimpleExcel}
        disabled={isExporting || !selectedProject}
        className="w-full"
        variant="outline"
      >
        {isExporting ? 'جاري التصدير المبسط...' : 'تصدير مبسط إلى Excel'}
      </Button>
    </div>
  );
}

// دالة إنشاء worksheet مبسط لليوم الواحد
async function createSimpleDaySheet(workbook: ExcelJS.Workbook, dayData: any, dateStr: string) {
  const worksheet = workbook.addWorksheet(`يوم_${dateStr}`, {
    rightToLeft: true
  });

  // رأس مبسط
  const headers = ['المبلغ', 'النوع', 'الملاحظات'];
  const headerRow = worksheet.addRow(headers);
  
  // تنسيق الرأس بسيط وآمن
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 12, bold: true };
    cell.alignment = { horizontal: 'center' };
    try {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    } catch {
      // تجاهل أخطاء التلوين
    }
  });

  let totalAmount = 0;

  // إضافة صفوف البيانات بشكل مبسط
  try {
    // أجور العمال
    if (dayData.workerPayments && dayData.workerPayments.length > 0) {
      dayData.workerPayments.forEach((payment: any) => {
        const amount = payment.amount || 0;
        totalAmount += amount;
        worksheet.addRow([amount, 'أجور عمال', payment.workerName || 'عامل']);
      });
    }

    // النقليات
    if (dayData.transportExpenses && dayData.transportExpenses.length > 0) {
      dayData.transportExpenses.forEach((transport: any) => {
        const amount = transport.amount || 0;
        totalAmount += amount;
        worksheet.addRow([amount, 'نقليات', transport.description || 'نقل']);
      });
    }

    // النثريات والمصاريف المتنوعة
    if (dayData.miscellaneousExpenses && dayData.miscellaneousExpenses.length > 0) {
      dayData.miscellaneousExpenses.forEach((misc: any) => {
        const amount = misc.amount || 0;
        totalAmount += amount;
        worksheet.addRow([amount, 'نثريات', misc.description || 'مصروف متنوع']);
      });
    }

  } catch (dataError: any) {
    console.warn(`⚠️ خطأ في معالجة بيانات ${dateStr}:`, dataError.message);
  }

  // إضافة صف المجموع
  const totalRow = worksheet.addRow([totalAmount, 'المجموع', '']);
  totalRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 11, bold: true };
  });

  // تعديل عرض الأعمدة
  worksheet.getColumn(1).width = 15; // المبلغ
  worksheet.getColumn(2).width = 20; // النوع  
  worksheet.getColumn(3).width = 30; // الملاحظات

  console.log(`✅ تم إنشاء صفحة ${dateStr} بإجمالي ${totalAmount}`);
}