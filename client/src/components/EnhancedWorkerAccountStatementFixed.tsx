// كشف حساب العامل الاحترافي المحسن - تصميم مضغوط لصفحة A4 واحدة
// يحتوي على جميع البيانات المطلوبة في تخطيط مدروس وأنيق

import { FileSpreadsheet, Printer, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '@/styles/unified-print-styles.css';

// واجهة خصائص المكون
interface EnhancedWorkerAccountStatementProps {
  data: any;
  selectedProject: any;
  workerId: string;
  dateFrom: string;
  dateTo: string;
}

export const EnhancedWorkerAccountStatement = ({ 
  data, 
  selectedProject, 
  workerId, 
  dateFrom, 
  dateTo 
}: EnhancedWorkerAccountStatementProps) => {
  
  // دالة تنسيق العملة - تنسيق إنجليزي
  const formatCurrency = (amount: number) => {
    const validAmount = isNaN(amount) || amount === null || amount === undefined ? 0 : Number(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(validAmount) + ' YER';
  };

  // دالة تنسيق التاريخ - تنسيق إنجليزي
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // دالة تنسيق اليوم - أسماء عربية
  const formatDay = (dateStr: string) => {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[new Date(dateStr).getDay()];
  };

  // استخراج البيانات
  const {
    worker = {},
    attendance = [],
    transfers = [],
    summary = {},
    projectsInfo = []
  } = data || {};
  
  console.log('🔍 بيانات العامل في المكون:', {
    worker,
    workerName: worker.name,
    workerType: worker.type,
    dailyWage: worker.dailyWage,
    attendanceCount: attendance.length,
    selectedProject: selectedProject?.name,
    dataStructure: data
  });

  // حساب الإحصائيات المحدثة
  const totalWorkDays = attendance.reduce((sum: number, record: any) => sum + (Number(record.workDays) || 1), 0);
  const totalWorkHours = attendance.reduce((sum: number, record: any) => {
    if (record.startTime && record.endTime) {
      const start = new Date(`2000-01-01T${record.startTime}`);
      const end = new Date(`2000-01-01T${record.endTime}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return sum + (hours > 0 ? hours : 8);
    }
    return sum + 8; // افتراض 8 ساعات
  }, 0);
  const totalEarned = attendance.reduce((sum: number, record: any) => {
    const dailyWage = Number(record.dailyWage) || 0;
    const workDays = Number(record.workDays) || 1;
    return sum + (dailyWage * workDays);
  }, 0);
  const totalPaid = attendance.reduce((sum: number, record: any) => sum + (Number(record.paidAmount) || 0), 0);
  const totalRemaining = totalEarned - totalPaid;
  const totalTransferred = transfers.reduce((sum: number, transfer: any) => sum + (Number(transfer.amount) || 0), 0);
  const currentBalance = totalPaid - totalTransferred;
  const workingDays = attendance.length;

  // دالة التصدير إلى Excel المحسنة والاحترافية
  const exportToExcel = async () => {
    try {
      console.log('🎯 بدء تصدير كشف حساب العامل إلى Excel...');
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Worker Account Statement');

      // إعداد اتجاه الكتابة من اليمين لليسار
      worksheet.views = [{ rightToLeft: true }];

      // رأس الشركة - بنفس تصميم المعاينة
      worksheet.mergeCells('A1:J1');
      const companyCell = worksheet.getCell('A1');
      companyCell.value = 'شركة التميز لمقاولات والاستثمارات الهندسية';
      companyCell.font = { name: 'Arial Unicode MS', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      companyCell.alignment = { horizontal: 'center', vertical: 'middle' };
      companyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563eb' } };

      // عنوان التقرير
      worksheet.addRow([]);
      worksheet.mergeCells('A3:J3');
      const titleCell = worksheet.getCell('A3');
      titleCell.value = 'كشف حساب العامل التفصيلي والشامل';
      titleCell.font = { name: 'Arial Unicode MS', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e40af' } };

      // معلومات العامل
      worksheet.addRow([]);
      const infoRow = worksheet.addRow(['اسم العامل:', worker.name || 'غير محدد', '', 'نوع العامل:', worker.type || 'غير محدد', '', 'الأجر اليومي:', formatCurrency(Number(worker.dailyWage) || 0), '', '']);
      infoRow.font = { name: 'Arial Unicode MS', size: 11, bold: true };

      worksheet.addRow([]);

      // رؤوس جدول الحضور - بنفس تصميم المعاينة
      const headers = ['م', 'التاريخ', 'اليوم', 'وصف العمل', 'الساعات', 'المبلغ المستحق', 'المبلغ المستلم', 'المتبقي', 'الحالة', 'ملاحظات'];
      const headerRow = worksheet.addRow(headers);
      
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Arial Unicode MS', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3b82f6' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });

      // بيانات الحضور مع نفس التنسيق
      let totalEarnedExcel = 0;
      let totalPaidExcel = 0;
      
      attendance.forEach((record: any, index: number) => {
        const dailyWage = Number(record.dailyWage) || Number(worker?.dailyWage) || 0;
        const workDays = Number(record.workDays) || 1;
        const earned = dailyWage * workDays;
        const paid = Number(record.paidAmount) || 0;
        const remaining = earned - paid;
        const status = paid >= earned ? 'مدفوع كامل' : paid > 0 ? 'مدفوع جزئي' : 'غير مدفوع';
        
        totalEarnedExcel += earned;
        totalPaidExcel += paid;

        const dataRow = worksheet.addRow([
          index + 1,
          formatDate(record.date),
          record.dayName || new Date(record.date).toLocaleDateString('ar', { weekday: 'long' }),
          record.workDescription || 'عمل بناء وفقاً لمتطلبات المشروع',
          record.workHours || '8 ساعات',
          formatCurrency(earned),
          formatCurrency(paid),
          formatCurrency(remaining),
          status,
          record.notes || '-'
        ]);

        dataRow.eachCell((cell, colNumber) => {
          cell.font = { name: 'Arial Unicode MS', size: 9 };
          cell.alignment = { 
            horizontal: colNumber === 4 || colNumber === 10 ? 'right' : 'center', 
            vertical: 'middle' 
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
          if (index % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
          }
        });
      });

      // صف الإجماليات
      const totalRow = worksheet.addRow([
        'الإجماليات', '', '', '', '',
        formatCurrency(totalEarnedExcel),
        formatCurrency(totalPaidExcel),
        formatCurrency(totalEarnedExcel - totalPaidExcel),
        '', ''
      ]);

      // تنسيق صف الإجماليات
      totalRow.eachCell((cell) => {
        cell.font = { name: 'Arial Unicode MS', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'medium', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });

      // ضبط عرض الأعمدة
      worksheet.columns = [
        { width: 5 },   // #
        { width: 12 },  // التاريخ
        { width: 10 },  // اليوم
        { width: 25 },  // وصف العمل
        { width: 10 },  // الساعات
        { width: 15 },  // المستحق
        { width: 15 },  // المستلم
        { width: 12 },  // المتبقي
        { width: 12 },  // الحالة
        { width: 20 }   // ملاحظات
      ];

      // إعداد الطباعة
      worksheet.pageSetup = {
        paperSize: 9, // A4
        orientation: 'portrait',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.7, right: 0.7,
          top: 0.75, bottom: 0.75,
          header: 0.3, footer: 0.3
        }
      };

      // تجميد الرؤوس
      worksheet.views = [
        { 
          rightToLeft: true,
          state: 'frozen', 
          xSplit: 0, 
          ySplit: 8
        }
      ];

      // تصدير الملف
      const buffer = await workbook.xlsx.writeBuffer();
      const workerName = (worker.name || 'Unknown').replace(/[\\/:*?"<>|]/g, '_');
      const fromDate = dateFrom.replace(/[\\/:*?"<>|]/g, '_');
      const toDate = dateTo.replace(/[\\/:*?"<>|]/g, '_');
      const fileName = `Worker_Account_Statement_${workerName}_${fromDate}_to_${toDate}.xlsx`;
      
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      saveAs(blob, fileName);
      
      console.log('✅ Excel file exported successfully');
      
    } catch (error) {
      console.error('❌ Error exporting to Excel:', error);
      alert('❌ Error occurred while exporting to Excel. Please try again.');
    }
  };

  // دالة تصدير PDF الاحترافية
  const exportToPDF = async () => {
    try {
      console.log('📄 بدء تصدير ملف PDF...');
      
      const element = document.getElementById('enhanced-worker-account-statement');
      if (!element) {
        alert('❌ لم يتم العثور على محتوى التقرير');
        return;
      }

      // إخفاء أزرار التحكم مؤقتاً
      const controlButtons = document.querySelector('.no-print');
      if (controlButtons) {
        (controlButtons as HTMLElement).style.display = 'none';
      }

      // التقاط لقطة للشاشة بجودة عالية
      const canvas = await html2canvas(element, {
        scale: 2, // جودة عالية
        useCORS: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      // إظهار أزرار التحكم مرة أخرى
      if (controlButtons) {
        (controlButtons as HTMLElement).style.display = 'flex';
      }

      // إنشاء PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // عرض A4 بالملليمتر
      const pageHeight = 297; // ارتفاع A4 بالملليمتر
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // إضافة الصفحة الأولى
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // إضافة صفحات إضافية إذا لزم الأمر
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // تسمية الملف
      const workerName = (worker.name || 'Unknown').replace(/[\\/:*?"<>|]/g, '_');
      const fromDate = dateFrom.replace(/[\\/:*?"<>|]/g, '_');
      const toDate = dateTo.replace(/[\\/:*?"<>|]/g, '_');
      const fileName = `Worker_Account_Statement_${workerName}_${fromDate}_to_${toDate}.pdf`;

      // حفظ الملف
      pdf.save(fileName);
      
      console.log('✅ تم تصدير ملف PDF بنجاح');
      
    } catch (error) {
      console.error('❌ خطأ في تصدير PDF:', error);
      alert('❌ حدث خطأ أثناء تصدير ملف PDF. يرجى المحاولة مرة أخرى.');
    }
  };

  // دالة الطباعة المبسطة والفعالة - حل نهائي لمشكلة الطباعة الفارغة
  const handlePrint = () => {
    try {
      console.log('🖨️ بدء عملية الطباعة...');
      
      // التحقق من وجود المحتوى
      const printContent = document.getElementById('enhanced-worker-account-statement');
      if (!printContent) {
        alert('❌ لم يتم العثور على محتوى الطباعة');
        return;
      }

      // إخفاء أزرار التحكم مؤقتاً
      const controlButtons = document.querySelector('.no-print');
      const originalDisplay = controlButtons ? (controlButtons as HTMLElement).style.display : '';
      if (controlButtons) {
        (controlButtons as HTMLElement).style.display = 'none';
      }

      // إضافة CSS للطباعة بشكل مؤقت
      const printStyles = document.createElement('style');
      printStyles.id = 'temp-print-styles';
      printStyles.innerHTML = `
        @media print {
          .no-print { display: none !important; }
          body { 
            font-family: Arial, sans-serif !important;
            direction: rtl !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
          }
          @page { 
            size: A4 portrait; 
            margin: 10mm; 
          }
          table { 
            border-collapse: collapse !important; 
            width: 100% !important;
          }
          th, td { 
            border: 1px solid #000 !important; 
            padding: 2mm !important; 
            text-align: center !important;
          }
          .enhanced-worker-statement-print {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 5mm !important;
          }
        }
      `;
      document.head.appendChild(printStyles);

      // تنفيذ الطباعة مباشرة
      window.print();
      
      // تنظيف بعد الطباعة
      setTimeout(() => {
        // إزالة CSS المؤقت
        const tempStyles = document.getElementById('temp-print-styles');
        if (tempStyles) {
          tempStyles.remove();
        }
        
        // إعادة إظهار أزرار التحكم
        if (controlButtons) {
          (controlButtons as HTMLElement).style.display = originalDisplay;
        }
        
        console.log('✅ تمت عملية الطباعة بنجاح');
      }, 1000);
      
    } catch (error) {
      console.error('❌ خطأ في الطباعة:', error);
      alert('❌ حدث خطأ أثناء الطباعة. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div style={{ direction: 'rtl' }}>
      {/* أزرار التحكم تمت إزالتها لمنع التكرار - الأزرار موجودة في الصفحة الرئيسية */}

      <div 
        id="enhanced-worker-account-statement" 
        className="enhanced-worker-statement-print bg-white print-preview-content"
        style={{
          direction: 'rtl',
          width: '100%',
          maxWidth: '210mm',
          margin: '0 auto',
          padding: '8mm',
          fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
          fontSize: '11px',
          lineHeight: '1.4',
          color: '#1a1a1a',
          background: 'white',
          pageBreakAfter: 'avoid',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          transform: 'scale(1)',
          transformOrigin: 'top center'
        }}
      >
        
        {/* رأسية مهنية مضغوطة ومحسنة */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3mm',
          borderBottom: '1px solid #1e40af',
          paddingBottom: '2mm'
        }}>
          <h1 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#1e40af',
            margin: '0 0 2mm 0',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
          }}>
            شركة الفتيني للمقاولات والاستشارات الهندسية
          </h1>
          <h2 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            margin: '0 0 2mm 0'
          }}>
            كشف حساب العامل التفصيلي والشامل
          </h2>
          <p style={{
            fontSize: '7px',
            color: '#6b7280',
            margin: '0'
          }}>
            الفترة: من {formatDate(dateFrom)} إلى {formatDate(dateTo)} | تاريخ الكشف: {formatDate(new Date().toISOString().split('T')[0])}
          </p>
        </div>

        {/* معلومات أساسية مضغوطة */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '3mm',
          marginBottom: '3mm',
          padding: '2mm',
          backgroundColor: '#f0f7ff',
          border: '1px solid #2563eb',
          borderRadius: '2mm',
          fontSize: '10px'
        }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: '1mm' }}><strong>👤 العامل:</strong> {worker?.name || 'غير محدد'}</div>
            <div style={{ marginBottom: '1mm' }}><strong>🛠️ المهنة:</strong> {worker?.type || 'عامل'}</div>
            <div><strong>💰 الأجر اليومي:</strong> {worker?.dailyWage ? formatCurrency(Number(worker.dailyWage)) : 'غير محدد'}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '1mm' }}><strong>🏗️ المشروع:</strong></div>
            <div style={{ marginBottom: '1mm', color: '#1e40af', fontWeight: 'bold' }}>{selectedProject?.name || 'غير محدد'}</div>
            <div><strong>📅 الفترة:</strong> {formatDate(dateFrom)} - {formatDate(dateTo)}</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '1mm' }}><strong>💵 إجمالي المستحق:</strong> <span style={{ color: '#059669', fontWeight: 'bold' }}>{formatCurrency(totalEarned)}</span></div>
            <div style={{ marginBottom: '1mm' }}><strong>💸 إجمالي المدفوع:</strong> <span style={{ color: '#dc2626', fontWeight: 'bold' }}>{formatCurrency(totalPaid)}</span></div>
            <div><strong>⚖️ الرصيد المتبقي:</strong> <span style={{ color: totalRemaining <= 0 ? '#059669' : '#dc2626', fontWeight: 'bold' }}>{formatCurrency(totalRemaining)}</span></div>
          </div>
        </div>

        {/* جدول الحضور المفصل - احترافي ومضغوط ومحسن */}
        <div style={{ marginBottom: '2mm' }}>
          <h3 style={{
            fontSize: '9px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '1mm',
            textAlign: 'center',
            padding: '1.5mm',
            backgroundColor: '#3b82f6',
            borderRadius: '1mm 1mm 0 0'
          }}>
            سجل الحضور والأجور التفصيلي
          </h3>
          
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '9px',
            border: '1px solid #d1d5db'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#3b82f6', color: 'white' }}>
                <th style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontWeight: 'bold', width: '3%', fontSize: '7px' }}>م</th>
                <th style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontWeight: 'bold', width: '8%', fontSize: '7px' }}>التاريخ</th>
                <th style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontWeight: 'bold', width: '6%', fontSize: '7px' }}>اليوم</th>
                <th style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontWeight: 'bold', width: '12%', fontSize: '7px' }}>اسم المشروع</th>
                <th style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontWeight: 'bold', width: '18%', fontSize: '7px' }}>وصف العمل</th>
                <th style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontWeight: 'bold', width: '8%', fontSize: '7px' }}>ساعات العمل</th>
                <th style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontWeight: 'bold', width: '6%', fontSize: '7px' }}>عدد أيام العمل</th>
                <th style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontWeight: 'bold', width: '10%', fontSize: '7px' }}>المستحق</th>
                <th style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontWeight: 'bold', width: '10%', fontSize: '7px' }}>المبلغ المستلم</th>
                <th style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontWeight: 'bold', width: '10%', fontSize: '7px' }}>المتبقي</th>
                <th style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontWeight: 'bold', width: '9%', fontSize: '7px' }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record: any, index: number) => {
                const dailyWageAmount = Number(record.dailyWage) || 0;
                const paidAmount = Number(record.paidAmount) || 0;
                const workDays = Number(record.workDays) || 1;
                const totalDue = dailyWageAmount * workDays;
                const remaining = totalDue - paidAmount;
                const status = paidAmount >= totalDue ? 'مدفوع كاملاً' : 
                            paidAmount > 0 ? 'مدفوع جزئياً' : 'غير مدفوع';
                const statusColor = paidAmount >= totalDue ? '#059669' : 
                                  paidAmount > 0 ? '#d97706' : '#dc2626';
                
                return (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                    <td style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontSize: '7px' }}>{index + 1}</td>
                    <td style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontSize: '7px' }}>{formatDate(record.date)}</td>
                    <td style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontSize: '7px' }}>{formatDay(record.date)}</td>
                    <td style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontSize: '7px' }}>
                      {record.project?.name || selectedProject?.name || 'غير محدد'}
                    </td>
                    <td style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'right', fontSize: '7px' }}>
                      {record.workDescription || 'عمل يومي حسب متطلبات المشروع'}
                    </td>
                    <td style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontSize: '7px' }}>
                      {record.startTime && record.endTime ? `${record.startTime}-${record.endTime}` : '8س'}
                    </td>
                    <td style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontSize: '7px', fontWeight: 'bold' }}>
                      {workDays}
                    </td>
                    <td style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontWeight: 'bold', color: '#000000', fontSize: '7px' }}>
                      {formatCurrency(totalDue)}
                    </td>
                    <td style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontWeight: 'bold', color: '#dc2626', fontSize: '7px' }}>
                      {formatCurrency(paidAmount)}
                    </td>
                    <td style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontWeight: 'bold', color: remaining < 0 ? '#dc2626' : '#059669', fontSize: '7px' }}>
                      {formatCurrency(remaining)}
                    </td>
                    <td style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontWeight: 'bold', color: statusColor, fontSize: '7px' }}>
                      {status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#10b981', color: 'white' }}>
                <td colSpan={5} style={{ border: '2px solid #059669', padding: '1.5mm', textAlign: 'center', fontWeight: 'bold', fontSize: '8px' }}>
                  الإجماليات
                </td>
                <td style={{ border: '2px solid #059669', padding: '1.5mm', textAlign: 'center', fontWeight: 'bold', fontSize: '8px' }}>
                  {Math.round(totalWorkHours)}س
                </td>
                <td style={{ border: '2px solid #059669', padding: '1.5mm', textAlign: 'center', fontWeight: 'bold', fontSize: '8px' }}>
                  {totalWorkDays}
                </td>
                <td style={{ border: '2px solid #059669', padding: '1.5mm', textAlign: 'center', fontWeight: 'bold', color: '#000000', fontSize: '8px' }}>
                  {formatCurrency(totalEarned)}
                </td>
                <td style={{ border: '2px solid #059669', padding: '1.5mm', textAlign: 'center', fontWeight: 'bold', color: '#dc2626', fontSize: '8px' }}>
                  {formatCurrency(totalPaid)}
                </td>
                <td style={{ border: '2px solid #059669', padding: '1.5mm', textAlign: 'center', fontWeight: 'bold', color: totalRemaining < 0 ? '#dc2626' : '#059669', fontSize: '8px' }}>
                  {formatCurrency(totalRemaining)}
                </td>
                <td style={{ border: '2px solid #059669', padding: '1.5mm', textAlign: 'center', fontWeight: 'bold', fontSize: '8px' }}>
                  {totalEarned > 0 ? Math.round((totalPaid / totalEarned) * 100) + '%' : '0%'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* جدول الحوالات إذا كان موجود */}
        {transfers.length > 0 && (
          <div style={{ marginBottom: '4mm' }}>
            <h3 style={{
              fontSize: '10px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '2mm',
              textAlign: 'center',
              padding: '2mm',
              backgroundColor: '#dc2626',
              borderRadius: '2mm 2mm 0 0'
            }}>
              الحولات
            </h3>
            
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '8px',
              border: '1px solid #d1d5db'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#fee2e2' }}>
                  <th style={{ border: '1px solid #d1d5db', padding: '2mm', textAlign: 'center', fontWeight: 'bold' }}>التاريخ</th>
                  <th style={{ border: '1px solid #d1d5db', padding: '2mm', textAlign: 'center', fontWeight: 'bold' }}>المبلغ</th>
                  <th style={{ border: '1px solid #d1d5db', padding: '2mm', textAlign: 'center', fontWeight: 'bold' }}>رقم التحويل</th>
                  <th style={{ border: '1px solid #d1d5db', padding: '2mm', textAlign: 'center', fontWeight: 'bold' }}>المستلم</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((transfer: any, index: number) => (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#fef2f2' }}>
                    <td style={{ border: '1px solid #d1d5db', padding: '1.5mm', textAlign: 'center' }}>
                      {formatDate(transfer.transferDate)}
                    </td>
                    <td style={{ border: '1px solid #d1d5db', padding: '1.5mm', textAlign: 'center', fontWeight: 'bold', color: '#dc2626' }}>
                      {formatCurrency(Number(transfer.amount))}
                    </td>
                    <td style={{ border: '1px solid #d1d5db', padding: '1.5mm', textAlign: 'center' }}>
                      {transfer.transferNumber || 'غير محدد'}
                    </td>
                    <td style={{ border: '1px solid #d1d5db', padding: '1.5mm', textAlign: 'center' }}>
                      {transfer.recipientName || 'غير محدد'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#dc2626', color: 'white' }}>
                  <td style={{ border: '2px solid #b91c1c', padding: '2mm', textAlign: 'center', fontWeight: 'bold' }}>
                    إجمالي الحولات
                  </td>
                  <td style={{ border: '2px solid #b91c1c', padding: '2mm', textAlign: 'center', fontWeight: 'bold' }}>
                    {formatCurrency(totalTransferred)}
                  </td>
                  <td colSpan={2} style={{ border: '2px solid #b91c1c', padding: '2mm', textAlign: 'center', fontWeight: 'bold' }}>
                    {transfers.length} تحويل
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* الملخص النهائي - مضغوط */}
        <div style={{
          marginTop: '2mm',
          padding: '2mm',
          backgroundColor: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '1mm'
        }}>
          <h3 style={{ 
            fontSize: '9px', 
            fontWeight: 'bold', 
            color: '#0c4a6e', 
            textAlign: 'center', 
            marginBottom: '1mm' 
          }}>
            الملخص المالي النهائي
          </h3>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '2mm',
            fontSize: '8px'
          }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <strong>إجمالي المستحقات:</strong> <span style={{ color: '#059669' }}>{formatCurrency(totalEarned)}</span>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <strong>إجمالي المبالغ المستلم:</strong> <span style={{ color: '#059669' }}>{formatCurrency(totalPaid)}</span>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <strong>إجمالي المتبقي في الرصيد:</strong> <span style={{ color: currentBalance >= 0 ? '#059669' : '#dc2626', fontWeight: 'bold' }}>{formatCurrency(currentBalance)}</span>
            </div>
            {totalTransferred > 0 && (
              <div style={{ flex: 1, textAlign: 'center' }}>
                <strong>إجمالي الحولات:</strong> <span style={{ color: '#dc2626' }}>{formatCurrency(totalTransferred)}</span>
              </div>
            )}
          </div>
        </div>

{/* نظام التوقيعات الذكي - يتكيف مع عدد الصفحات */}
        {(() => {
          // حساب عدد السجلات التقريبي في الصفحة الواحدة
          const recordsPerPage = 25; // عدد السجلات التي تتسع في الصفحة الواحدة
          const totalRecords = attendance.length + (transfers.length > 0 ? transfers.length + 2 : 0); // +2 للعنوان والإجماليات
          const willSpanMultiplePages = totalRecords > recordsPerPage;
          
          if (!willSpanMultiplePages) {
            // التوقيعات للصفحة الواحدة
            return (
              <div style={{
                marginTop: '4mm',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '4mm',
                fontSize: '8px'
              }}>
                <div style={{
                  flex: 1,
                  padding: '2mm',
                  border: '1px solid #d1d5db',
                  borderRadius: '1mm',
                  backgroundColor: '#f9fafb',
                  textAlign: 'center'
                }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '3mm' }}>توقيع العامل</p>
                  <div style={{ height: '6mm', borderBottom: '1px solid #6b7280', margin: '0 2mm' }}></div>
                  <p style={{ marginTop: '1mm', fontSize: '7px', color: '#6b7280' }}>التاريخ: ___________</p>
                </div>
                <div style={{
                  flex: 1,
                  padding: '2mm',
                  border: '1px solid #d1d5db',
                  borderRadius: '1mm',
                  backgroundColor: '#f9fafb',
                  textAlign: 'center'
                }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '3mm' }}>توقيع المهندس المشرف</p>
                  <div style={{ height: '6mm', borderBottom: '1px solid #6b7280', margin: '0 2mm' }}></div>
                  <p style={{ marginTop: '1mm', fontSize: '7px', color: '#6b7280' }}>التاريخ: ___________</p>
                </div>
              </div>
            );
          } else {
            // توقيعات للصفحات المتعددة - توقيع في نهاية كل صفحة
            return (
              <>
                {/* توقيع نهاية الصفحة الأولى */}
                <div style={{
                  marginTop: '2mm',
                  pageBreakAfter: 'always',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  fontSize: '7px',
                  color: '#6b7280'
                }}>
                  <div style={{
                    padding: '1mm',
                    border: '1px solid #e5e7eb',
                    borderRadius: '1mm',
                    backgroundColor: '#f9fafb',
                    textAlign: 'center',
                    width: '40%'
                  }}>
                    <p style={{ margin: '0 0 2mm 0', fontWeight: 'bold' }}>توقيع المهندس المشرف (صفحة 1)</p>
                    <div style={{ height: '4mm', borderBottom: '1px solid #d1d5db' }}></div>
                  </div>
                </div>
                
                {/* توقيعات نهاية التقرير - الصفحة الأخيرة */}
                <div style={{
                  marginTop: '4mm',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '4mm',
                  fontSize: '8px'
                }}>
                  <div style={{
                    flex: 1,
                    padding: '2mm',
                    border: '1px solid #d1d5db',
                    borderRadius: '1mm',
                    backgroundColor: '#f9fafb',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '3mm' }}>توقيع العامل</p>
                    <div style={{ height: '6mm', borderBottom: '1px solid #6b7280', margin: '0 2mm' }}></div>
                    <p style={{ marginTop: '1mm', fontSize: '7px', color: '#6b7280' }}>التاريخ: ___________</p>
                  </div>
                  <div style={{
                    flex: 1,
                    padding: '2mm',
                    border: '1px solid #d1d5db',
                    borderRadius: '1mm',
                    backgroundColor: '#f9fafb',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '3mm' }}>توقيع المهندس المشرف النهائي</p>
                    <div style={{ height: '6mm', borderBottom: '1px solid #6b7280', margin: '0 2mm' }}></div>
                    <p style={{ marginTop: '1mm', fontSize: '7px', color: '#6b7280' }}>التاريخ: ___________</p>
                  </div>
                </div>
              </>
            );
          }
        })()}

        {/* تذييل مهني مضغوط */}
        <div style={{
          marginTop: '2mm',
          textAlign: 'center',
          fontSize: '6px',
          color: '#6b7280',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '1mm'
        }}>
          <p style={{margin: '0'}}>نظام إدارة المشاريع الإنشائية | للاستفسارات والمراجعات يرجى التواصل مع قسم المحاسبة</p>
        </div>
      </div>
    </div>
  );
};