// كشف حساب العامل الاحترافي المحسن - تصميم مضغوط لصفحة A4 واحدة
// يحتوي على جميع البيانات المطلوبة في تخطيط مدروس وأنيق

import { FileText, Building2, Calendar, User, Phone, MapPin, Banknote, Clock, CheckCircle, AlertCircle, TrendingUp, Calculator, Download, FileSpreadsheet, Printer } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import './enhanced-worker-statement-print.css';

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
  
  // دالة تنسيق العملة
  const formatCurrency = (amount: number) => {
    const validAmount = isNaN(amount) || amount === null || amount === undefined ? 0 : Number(amount);
    return new Intl.NumberFormat('ar-YE', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(validAmount) + ' ر.ي';
  };

  // دالة تنسيق التاريخ
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-YE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // دالة تنسيق اليوم
  const formatDay = (dateStr: string) => {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[new Date(dateStr).getDay()];
  };

  // استخراج البيانات
  const {
    worker = {},
    attendance = [],
    transfers = [],
    summary = {}
  } = data || {};

  // حساب الإحصائيات
  const totalEarned = attendance.reduce((sum: number, record: any) => sum + (Number(record.dailyWage) || 0), 0);
  const totalPaid = attendance.reduce((sum: number, record: any) => sum + (Number(record.paidAmount) || 0), 0);
  const totalTransferred = transfers.reduce((sum: number, transfer: any) => sum + (Number(transfer.amount) || 0), 0);
  const currentBalance = totalPaid - totalTransferred;
  const remainingDue = totalEarned - totalPaid;
  const workingDays = attendance.length;
  const totalHours = attendance.reduce((sum: number, record: any) => {
    if (record.startTime && record.endTime) {
      const start = new Date(`2000-01-01T${record.startTime}`);
      const end = new Date(`2000-01-01T${record.endTime}`);
      return sum + ((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    }
    return sum + 8; // افتراض 8 ساعات
  }, 0);

  // دالة التصدير إلى Excel
  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('كشف حساب العامل');

      // إعداد اتجاه الكتابة من اليمين لليسار
      worksheet.views = [{ rightToLeft: true }];

      // إضافة العنوان الرئيسي
      worksheet.mergeCells('A1:H1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'كشف حساب العامل التفصيلي والشامل';
      titleCell.font = { name: 'Arial', size: 16, bold: true };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e40af' } };
      titleCell.font.color = { argb: 'FFFFFFFF' };

      // معلومات المشروع والعامل
      worksheet.getCell('A3').value = 'اسم العامل:';
      worksheet.getCell('B3').value = worker.name || 'غير محدد';
      worksheet.getCell('D3').value = 'المشروع:';
      worksheet.getCell('E3').value = selectedProject?.name || 'غير محدد';

      worksheet.getCell('A4').value = 'نوع العامل:';
      worksheet.getCell('B4').value = worker.type || 'عامل';
      worksheet.getCell('D4').value = 'الفترة:';
      worksheet.getCell('E4').value = `${formatDate(dateFrom)} - ${formatDate(dateTo)}`;

      worksheet.getCell('A5').value = 'الأجر اليومي:';
      worksheet.getCell('B5').value = formatCurrency(Number(worker.dailyWage) || 0);
      worksheet.getCell('D5').value = 'تاريخ الإصدار:';
      worksheet.getCell('E5').value = formatDate(new Date().toISOString().split('T')[0]);

      // رؤوس جدول الحضور
      const headers = ['م', 'التاريخ', 'اليوم', 'وصف العمل', 'الساعات', 'الأجر المستحق', 'المبلغ المدفوع', 'الحالة'];
      const headerRow = worksheet.getRow(7);
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { name: 'Arial', size: 11, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3b82f6' } };
        cell.font.color = { argb: 'FFFFFFFF' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // بيانات الحضور
      attendance.forEach((record: any, index: number) => {
        const row = worksheet.getRow(8 + index);
        const status = Number(record.paidAmount) >= Number(record.dailyWage) ? 'مدفوع كاملاً' : 'مدفوع جزئياً';
        
        row.getCell(1).value = index + 1;
        row.getCell(2).value = formatDate(record.date);
        row.getCell(3).value = formatDay(record.date);
        row.getCell(4).value = record.workDescription || 'عمل يومي حسب متطلبات المشروع';
        row.getCell(5).value = record.startTime && record.endTime ? `${record.startTime}-${record.endTime}` : '8 ساعات';
        row.getCell(6).value = Number(record.dailyWage) || 0;
        row.getCell(7).value = Number(record.paidAmount) || 0;
        row.getCell(8).value = status;

        // تنسيق الصف
        row.eachCell((cell) => {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          if (index % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
          }
        });
      });

      // صف الإجماليات
      const totalRowIndex = 8 + attendance.length;
      const totalRow = worksheet.getRow(totalRowIndex);
      totalRow.getCell(1).value = 'الإجماليات';
      worksheet.mergeCells(`A${totalRowIndex}:E${totalRowIndex}`);
      totalRow.getCell(6).value = totalEarned;
      totalRow.getCell(7).value = totalPaid;
      totalRow.getCell(8).value = `${((totalPaid / totalEarned) * 100).toFixed(0)}%`;

      // تنسيق صف الإجماليات
      totalRow.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 11, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10b981' } };
        cell.font.color = { argb: 'FFFFFFFF' };
        cell.border = {
          top: { style: 'medium' },
          left: { style: 'thin' },
          bottom: { style: 'medium' },
          right: { style: 'thin' }
        };
      });

      // الملخص المالي
      const summaryStartRow = totalRowIndex + 3;
      worksheet.getCell(`A${summaryStartRow}`).value = 'الملخص المالي';
      worksheet.mergeCells(`A${summaryStartRow}:B${summaryStartRow}`);
      worksheet.getCell(`A${summaryStartRow}`).font = { name: 'Arial', size: 14, bold: true };
      worksheet.getCell(`A${summaryStartRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
      worksheet.getCell(`A${summaryStartRow}`).font.color = { argb: 'FFFFFFFF' };

      worksheet.getCell(`A${summaryStartRow + 1}`).value = 'إجمالي المكتسب:';
      worksheet.getCell(`B${summaryStartRow + 1}`).value = totalEarned;
      worksheet.getCell(`A${summaryStartRow + 2}`).value = 'إجمالي المدفوع:';
      worksheet.getCell(`B${summaryStartRow + 2}`).value = totalPaid;
      worksheet.getCell(`A${summaryStartRow + 3}`).value = 'إجمالي المحول:';
      worksheet.getCell(`B${summaryStartRow + 3}`).value = totalTransferred;
      worksheet.getCell(`A${summaryStartRow + 4}`).value = 'الرصيد النهائي:';
      worksheet.getCell(`B${summaryStartRow + 4}`).value = currentBalance;

      // ضبط عرض الأعمدة
      worksheet.columns = [
        { width: 8 },   // م
        { width: 12 },  // التاريخ
        { width: 10 },  // اليوم
        { width: 30 },  // وصف العمل
        { width: 12 },  // الساعات
        { width: 15 },  // الأجر المستحق
        { width: 15 },  // المبلغ المدفوع
        { width: 12 }   // الحالة
      ];

      // إنشاء الملف وتحميله
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileName = `كشف_حساب_العامل_${worker.name || 'غير_محدد'}_${formatDate(dateFrom)}_${formatDate(dateTo)}.xlsx`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('خطأ في تصدير Excel:', error);
      alert('حدث خطأ أثناء تصدير الملف');
    }
  };

  // دالة الطباعة
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ direction: 'rtl' }}>
      {/* أزرار التحكم - تخفى عند الطباعة */}
      <div className="no-print" style={{ 
        marginBottom: '20px', 
        display: 'flex', 
        gap: '10px', 
        justifyContent: 'center'
      }}>
        <Button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
        >
          <Printer className="h-4 w-4 mr-2" />
          طباعة الكشف
        </Button>
        <Button
          onClick={exportToExcel}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          تصدير إلى Excel
        </Button>
      </div>

      <div 
        id="enhanced-worker-account-statement" 
        className="enhanced-worker-statement-print bg-white"
        style={{
          direction: 'rtl',
          width: '210mm',
          minHeight: '297mm',
          margin: '0 auto',
          padding: '8mm',
          fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
          fontSize: '9px',
          lineHeight: '1.2',
          color: '#1a1a1a',
          background: 'white',
          pageBreakAfter: 'avoid'
        }}
      >
        
        {/* الرأسية الرئيسية - مضغوطة ومهنية */}
        <div className="statement-header" style={{
          marginBottom: '4mm',
          border: '2px solid #1e40af',
          borderRadius: '6px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          padding: '4mm'
        }}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <div style={{flex: '3', textAlign: 'center'}}>
              <h1 style={{
                fontSize: '16px', 
                fontWeight: 'bold', 
                margin: '0 0 2px 0', 
                color: '#1e40af',
                textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
              }}>
                كشــف حســاب العامــل التفصيلــي والشامــل
              </h1>
              <p style={{fontSize: '8px', color: '#64748b', margin: '0'}}>تقرير مالي شامل لفترة العمل المحددة</p>
            </div>
            <div style={{display: 'flex', gap: '6px'}}>
              <div style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                color: 'white', 
                padding: '4px 8px', 
                borderRadius: '4px',
                textAlign: 'center',
                minWidth: '40px'
              }}>
                <div style={{fontSize: '12px', fontWeight: 'bold'}}>2025</div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #10b981, #059669)', 
                color: 'white', 
                padding: '4px 8px', 
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{fontSize: '7px'}}>رقم</div>
                <div style={{fontSize: '10px', fontWeight: 'bold'}}>{workerId?.slice(-4) || 'A001'}</div>
              </div>
            </div>
          </div>

          {/* معلومات سريعة */}
          <div style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '3mm',
            gap: '2mm'
          }}>
            <div style={{
              flex: '1',
              background: 'white',
              padding: '2mm',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              textAlign: 'center'
            }}>
              <div style={{fontSize: '7px', color: '#6b7280', marginBottom: '1px'}}>المشروع</div>
              <div style={{fontSize: '9px', fontWeight: 'bold', color: '#374151'}}>{selectedProject?.name || 'غير محدد'}</div>
            </div>
            <div style={{
              flex: '1',
              background: 'white',
              padding: '2mm',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              textAlign: 'center'
            }}>
              <div style={{fontSize: '7px', color: '#6b7280', marginBottom: '1px'}}>فترة التقرير</div>
              <div style={{fontSize: '9px', fontWeight: 'bold', color: '#374151'}}>{formatDate(dateFrom)} - {formatDate(dateTo)}</div>
            </div>
            <div style={{
              flex: '1',
              background: 'white',
              padding: '2mm',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              textAlign: 'center'
            }}>
              <div style={{fontSize: '7px', color: '#6b7280', marginBottom: '1px'}}>تاريخ الإصدار</div>
              <div style={{fontSize: '9px', fontWeight: 'bold', color: '#374151'}}>{formatDate(new Date().toISOString().split('T')[0])}</div>
            </div>
          </div>
        </div>

        {/* قسم البيانات الأساسية والملخص - في صف واحد */}
        <div style={{display: 'flex', gap: '3mm', marginBottom: '4mm'}}>
          
          {/* بيانات العامل */}
          <div style={{
            flex: '1',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            padding: '3mm',
            borderRadius: '6px',
            border: '1px solid #0ea5e9'
          }}>
            <h3 style={{
              fontSize: '11px', 
              fontWeight: 'bold', 
              color: '#0c4a6e', 
              margin: '0 0 2mm 0',
              textAlign: 'center',
              padding: '1mm',
              background: 'rgba(14, 165, 233, 0.1)',
              borderRadius: '3px'
            }}>
              بيانات العامل
            </h3>
            <div style={{fontSize: '8px', lineHeight: '1.3'}}>
              <div style={{marginBottom: '1mm', display: 'flex', justifyContent: 'space-between'}}>
                <strong>الاسم:</strong> 
                <span>{worker.name || 'غير محدد'}</span>
              </div>
              <div style={{marginBottom: '1mm', display: 'flex', justifyContent: 'space-between'}}>
                <strong>النوع:</strong> 
                <span style={{
                  background: worker.type === 'معلم' ? '#dcfce7' : '#f1f5f9',
                  color: worker.type === 'معلم' ? '#166534' : '#334155',
                  padding: '1px 4px',
                  borderRadius: '2px',
                  fontSize: '7px'
                }}>{worker.type || 'عامل'}</span>
              </div>
              <div style={{marginBottom: '1mm', display: 'flex', justifyContent: 'space-between'}}>
                <strong>الأجر اليومي:</strong> 
                <span style={{color: '#059669', fontWeight: 'bold'}}>{formatCurrency(Number(worker.dailyWage) || 0)}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <strong>معرف العامل:</strong> 
                <span style={{fontSize: '7px', color: '#6b7280'}}>{workerId?.slice(-8) || 'غير محدد'}</span>
              </div>
            </div>
          </div>

          {/* الملخص المالي */}
          <div style={{
            flex: '1',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            padding: '3mm',
            borderRadius: '6px',
            border: '1px solid #22c55e'
          }}>
            <h3 style={{
              fontSize: '11px', 
              fontWeight: 'bold', 
              color: '#15803d', 
              margin: '0 0 2mm 0',
              textAlign: 'center',
              padding: '1mm',
              background: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '3px'
            }}>
              الملخص المالي
            </h3>
            <div style={{fontSize: '8px', lineHeight: '1.3'}}>
              <div style={{marginBottom: '1mm', display: 'flex', justifyContent: 'space-between'}}>
                <strong>إجمالي المكتسب:</strong>
                <span style={{color: '#059669', fontWeight: 'bold'}}>{formatCurrency(totalEarned)}</span>
              </div>
              <div style={{marginBottom: '1mm', display: 'flex', justifyContent: 'space-between'}}>
                <strong>إجمالي المدفوع:</strong>
                <span style={{color: '#0d9488', fontWeight: 'bold'}}>{formatCurrency(totalPaid)}</span>
              </div>
              <div style={{marginBottom: '1mm', display: 'flex', justifyContent: 'space-between'}}>
                <strong>إجمالي المحول:</strong>
                <span style={{color: '#dc2626', fontWeight: 'bold'}}>{formatCurrency(totalTransferred)}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', padding: '1mm', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '2px'}}>
                <strong>الرصيد النهائي:</strong>
                <span style={{color: currentBalance >= 0 ? '#059669' : '#dc2626', fontWeight: 'bold'}}>{formatCurrency(currentBalance)}</span>
              </div>
            </div>
          </div>

          {/* الإحصائيات */}
          <div style={{
            flex: '1',
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            padding: '3mm',
            borderRadius: '6px',
            border: '1px solid #f59e0b'
          }}>
            <h3 style={{
              fontSize: '11px', 
              fontWeight: 'bold', 
              color: '#92400e', 
              margin: '0 0 2mm 0',
              textAlign: 'center',
              padding: '1mm',
              background: 'rgba(245, 158, 11, 0.1)',
              borderRadius: '3px'
            }}>
              إحصائيات العمل
            </h3>
            <div style={{fontSize: '8px', lineHeight: '1.3'}}>
              <div style={{marginBottom: '1mm', display: 'flex', justifyContent: 'space-between'}}>
                <strong>أيام العمل:</strong>
                <span style={{color: '#92400e', fontWeight: 'bold'}}>{workingDays} يوم</span>
              </div>
              <div style={{marginBottom: '1mm', display: 'flex', justifyContent: 'space-between'}}>
                <strong>إجمالي الساعات:</strong>
                <span style={{color: '#92400e', fontWeight: 'bold'}}>{totalHours.toFixed(1)} ساعة</span>
              </div>
              <div style={{marginBottom: '1mm', display: 'flex', justifyContent: 'space-between'}}>
                <strong>متوسط يومي:</strong>
                <span style={{color: '#92400e', fontWeight: 'bold'}}>{workingDays > 0 ? (totalHours / workingDays).toFixed(1) : '0'} س/ي</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <strong>المديونية:</strong>
                <span style={{color: remainingDue > 0 ? '#dc2626' : '#059669', fontWeight: 'bold'}}>{formatCurrency(Math.abs(remainingDue))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* جدول الحضور المضغوط */}
        <div style={{marginBottom: '4mm'}}>
          <h2 style={{
            fontSize: '12px', 
            fontWeight: 'bold', 
            color: '#1e40af', 
            margin: '0 0 2mm 0',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
            padding: '2mm',
            borderRadius: '4px',
            border: '1px solid #1e40af'
          }}>
            سجل الحضور والأجور التفصيلي
          </h2>
          
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '7px',
            border: '1px solid #1e40af'
          }}>
            <thead>
              <tr style={{
                background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                color: 'white',
                height: '6mm'
              }}>
                <th style={{padding: '1mm', border: '1px solid #1e3a8a', width: '5%', fontSize: '8px'}}>م</th>
                <th style={{padding: '1mm', border: '1px solid #1e3a8a', width: '12%', fontSize: '8px'}}>التاريخ</th>
                <th style={{padding: '1mm', border: '1px solid #1e3a8a', width: '8%', fontSize: '8px'}}>اليوم</th>
                <th style={{padding: '1mm', border: '1px solid #1e3a8a', width: '30%', fontSize: '8px'}}>وصف العمل</th>
                <th style={{padding: '1mm', border: '1px solid #1e3a8a', width: '12%', fontSize: '8px'}}>الساعات</th>
                <th style={{padding: '1mm', border: '1px solid #1e3a8a', width: '12%', fontSize: '8px'}}>الأجر المستحق</th>
                <th style={{padding: '1mm', border: '1px solid #1e3a8a', width: '12%', fontSize: '8px'}}>المبلغ المدفوع</th>
                <th style={{padding: '1mm', border: '1px solid #1e3a8a', width: '9%', fontSize: '8px'}}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record: any, index: number) => (
                <tr key={record.id || index} style={{
                  background: index % 2 === 0 ? '#f8fafc' : 'white',
                  height: '5mm'
                }}>
                  <td style={{padding: '1mm', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold'}}>
                    {index + 1}
                  </td>
                  <td style={{padding: '1mm', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '6px'}}>
                    {formatDate(record.date)}
                  </td>
                  <td style={{padding: '1mm', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '6px'}}>
                    {formatDay(record.date)}
                  </td>
                  <td style={{padding: '1mm', border: '1px solid #cbd5e1', textAlign: 'right', fontSize: '6px', lineHeight: '1.2'}}>
                    {record.workDescription || 'عمل يومي حسب متطلبات المشروع'}
                  </td>
                  <td style={{padding: '1mm', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '6px'}}>
                    {record.startTime && record.endTime ? `${record.startTime}-${record.endTime}` : '8س'}
                  </td>
                  <td style={{padding: '1mm', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '6px', color: '#059669', fontWeight: 'bold'}}>
                    {formatCurrency(Number(record.dailyWage) || 0)}
                  </td>
                  <td style={{padding: '1mm', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '6px', color: '#0d9488', fontWeight: 'bold'}}>
                    {formatCurrency(Number(record.paidAmount) || 0)}
                  </td>
                  <td style={{padding: '1mm', border: '1px solid #cbd5e1', textAlign: 'center'}}>
                    {Number(record.paidAmount) >= Number(record.dailyWage) ? 
                      <div style={{color: '#059669', fontSize: '6px'}}>✓ مدفوع</div> : 
                      <div style={{color: '#dc2626', fontSize: '6px'}}>⚠ جزئي</div>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                height: '6mm'
              }}>
                <td colSpan={5} style={{padding: '1mm', border: '1px solid #047857', textAlign: 'center', fontWeight: 'bold', fontSize: '8px'}}>
                  الإجماليات
                </td>
                <td style={{padding: '1mm', border: '1px solid #047857', textAlign: 'center', fontWeight: 'bold', fontSize: '8px'}}>
                  {formatCurrency(totalEarned)}
                </td>
                <td style={{padding: '1mm', border: '1px solid #047857', textAlign: 'center', fontWeight: 'bold', fontSize: '8px'}}>
                  {formatCurrency(totalPaid)}
                </td>
                <td style={{padding: '1mm', border: '1px solid #047857', textAlign: 'center', fontWeight: 'bold', fontSize: '7px'}}>
                  {((totalPaid / totalEarned) * 100).toFixed(0)}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* قسم الحوالات إذا وجدت */}
        {transfers.length > 0 && (
          <div style={{marginBottom: '4mm'}}>
            <h3 style={{
              fontSize: '11px', 
              fontWeight: 'bold', 
              color: '#dc2626', 
              margin: '0 0 2mm 0',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #fef2f2, #fecaca)',
              padding: '2mm',
              borderRadius: '4px',
              border: '1px solid #dc2626'
            }}>
              سجل الحوالات المرسلة
            </h3>
            
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '7px',
              border: '1px solid #dc2626'
            }}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                  color: 'white',
                  height: '5mm'
                }}>
                  <th style={{padding: '1mm', border: '1px solid #b91c1c', width: '8%'}}>م</th>
                  <th style={{padding: '1mm', border: '1px solid #b91c1c', width: '15%'}}>التاريخ</th>
                  <th style={{padding: '1mm', border: '1px solid #b91c1c', width: '40%'}}>المستفيد</th>
                  <th style={{padding: '1mm', border: '1px solid #b91c1c', width: '15%'}}>المبلغ</th>
                  <th style={{padding: '1mm', border: '1px solid #b91c1c', width: '22%'}}>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((transfer: any, index: number) => (
                  <tr key={transfer.id || index} style={{
                    background: index % 2 === 0 ? '#fef2f2' : 'white',
                    height: '4mm'
                  }}>
                    <td style={{padding: '1mm', border: '1px solid #fecaca', textAlign: 'center', fontWeight: 'bold'}}>
                      {index + 1}
                    </td>
                    <td style={{padding: '1mm', border: '1px solid #fecaca', textAlign: 'center', fontSize: '6px'}}>
                      {formatDate(transfer.date)}
                    </td>
                    <td style={{padding: '1mm', border: '1px solid #fecaca', textAlign: 'right', fontSize: '6px'}}>
                      {transfer.recipientName || 'غير محدد'}
                    </td>
                    <td style={{padding: '1mm', border: '1px solid #fecaca', textAlign: 'center', fontSize: '6px', color: '#dc2626', fontWeight: 'bold'}}>
                      {formatCurrency(Number(transfer.amount) || 0)}
                    </td>
                    <td style={{padding: '1mm', border: '1px solid #fecaca', textAlign: 'right', fontSize: '6px'}}>
                      {transfer.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{
                  background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                  color: 'white',
                  height: '5mm'
                }}>
                  <td colSpan={3} style={{padding: '1mm', border: '1px solid #b91c1c', textAlign: 'center', fontWeight: 'bold', fontSize: '8px'}}>
                    إجمالي الحوالات المرسلة
                  </td>
                  <td style={{padding: '1mm', border: '1px solid #b91c1c', textAlign: 'center', fontWeight: 'bold', fontSize: '8px'}}>
                    {formatCurrency(totalTransferred)}
                  </td>
                  <td style={{padding: '1mm', border: '1px solid #b91c1c', textAlign: 'center', fontSize: '7px'}}>
                    {transfers.length} حوالة
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* الملخص النهائي والتوقيعات */}
        <div style={{
          marginTop: 'auto',
          background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
          padding: '3mm',
          borderRadius: '6px',
          border: '1px solid #64748b'
        }}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2mm'}}>
            
            {/* الملخص النهائي */}
            <div style={{flex: '2', paddingLeft: '2mm'}}>
              <h4 style={{fontSize: '10px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 1mm 0'}}>الملخص النهائي للحساب</h4>
              <div style={{fontSize: '8px', lineHeight: '1.4'}}>
                <div style={{marginBottom: '1mm', display: 'flex', justifyContent: 'space-between'}}>
                  <span>إجمالي الأجور المستحقة:</span>
                  <strong style={{color: '#059669'}}>{formatCurrency(totalEarned)}</strong>
                </div>
                <div style={{marginBottom: '1mm', display: 'flex', justifyContent: 'space-between'}}>
                  <span>إجمالي المبالغ المدفوعة:</span>
                  <strong style={{color: '#0d9488'}}>{formatCurrency(totalPaid)}</strong>
                </div>
                <div style={{marginBottom: '1mm', display: 'flex', justifyContent: 'space-between'}}>
                  <span>إجمالي الحوالات المرسلة:</span>
                  <strong style={{color: '#dc2626'}}>{formatCurrency(totalTransferred)}</strong>
                </div>
                <div style={{
                  padding: '1mm',
                  background: currentBalance >= 0 ? '#f0fdf4' : '#fef2f2',
                  borderRadius: '3px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  border: currentBalance >= 0 ? '1px solid #22c55e' : '1px solid #ef4444'
                }}>
                  <span style={{fontWeight: 'bold'}}>الرصيد النهائي:</span>
                  <strong style={{color: currentBalance >= 0 ? '#059669' : '#dc2626', fontSize: '9px'}}>
                    {formatCurrency(Math.abs(currentBalance))} {currentBalance >= 0 ? '(رصيد موجب)' : '(رصيد سالب)'}
                  </strong>
                </div>
              </div>
            </div>

            {/* قسم التوقيعات */}
            <div style={{flex: '1'}}>
              <h4 style={{fontSize: '10px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 2mm 0', textAlign: 'center'}}>التوقيعات والاعتماد</h4>
              <div style={{fontSize: '7px', textAlign: 'center'}}>
                <div style={{marginBottom: '3mm', border: '1px solid #d1d5db', padding: '2mm', borderRadius: '3px', background: 'white'}}>
                  <div style={{marginBottom: '2mm'}}>توقيع العامل</div>
                  <div style={{height: '8mm', borderBottom: '1px solid #9ca3af'}}></div>
                  <div style={{marginTop: '1mm', fontSize: '6px', color: '#6b7280'}}>التاريخ: ___________</div>
                </div>
                <div style={{border: '1px solid #d1d5db', padding: '2mm', borderRadius: '3px', background: 'white'}}>
                  <div style={{marginBottom: '2mm'}}>توقيع المحاسب</div>
                  <div style={{height: '8mm', borderBottom: '1px solid #9ca3af'}}></div>
                  <div style={{marginTop: '1mm', fontSize: '6px', color: '#6b7280'}}>التاريخ: ___________</div>
                </div>
              </div>
            </div>
          </div>

          {/* تذييل التقرير */}
          <div style={{
            textAlign: 'center',
            fontSize: '6px',
            color: '#6b7280',
            marginTop: '2mm',
            paddingTop: '1mm',
            borderTop: '1px solid #d1d5db'
          }}>
            <p style={{margin: '0'}}>تم إنشاء هذا التقرير آلياً بواسطة نظام إدارة المشاريع الإنشائية • جميع الأرقام بالريال اليمني</p>
            <p style={{margin: '1mm 0 0 0'}}>للاستفسارات والمراجعات يرجى التواصل مع قسم المحاسبة</p>
          </div>
        </div>
      </div>
    </div>
  );
};