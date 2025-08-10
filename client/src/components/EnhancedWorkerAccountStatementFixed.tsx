// كشف حساب العامل الاحترافي المحسن - تصميم مضغوط لصفحة A4 واحدة
// يحتوي على جميع البيانات المطلوبة في تخطيط مدروس وأنيق

import { FileSpreadsheet, Printer } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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

  // دالة تنسيق اليوم - أسماء إنجليزية
  const formatDay = (dateStr: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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

  // دالة التصدير إلى Excel المحسنة والاحترافية
  const exportToExcel = async () => {
    try {
      console.log('🎯 بدء تصدير كشف حساب العامل إلى Excel...');
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Worker Account Statement');

      // إعداد اتجاه الكتابة من اليمين لليسار
      worksheet.views = [{ rightToLeft: true }];

      // إضافة العنوان الرئيسي
      worksheet.mergeCells('A1:H1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'AL-HAJ ABDULRAHMAN ALI AL-JAHNI & SONS COMPANY';
      titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e40af' } };

      // العنوان الفرعي
      worksheet.mergeCells('A2:H2');
      const subtitleCell = worksheet.getCell('A2');
      subtitleCell.value = 'Worker Account Statement - Detailed Report';
      subtitleCell.font = { name: 'Arial', size: 12, bold: true };
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFe0f2fe' } };

      // معلومات العامل والمشروع
      worksheet.getCell('A4').value = 'Worker Name:';
      worksheet.getCell('B4').value = worker.name || 'Not Specified';
      worksheet.getCell('D4').value = 'Project:';
      worksheet.getCell('E4').value = selectedProject?.name || 'All Projects';

      worksheet.getCell('A5').value = 'Worker Type:';
      worksheet.getCell('B5').value = worker.type || 'Worker';
      worksheet.getCell('D5').value = 'Period:';
      worksheet.getCell('E5').value = `${formatDate(dateFrom)} - ${formatDate(dateTo)}`;

      worksheet.getCell('A6').value = 'Daily Wage:';
      const dailyWageValue = Number(worker.dailyWage) || 0;
      worksheet.getCell('B6').value = dailyWageValue;
      worksheet.getCell('B6').numFmt = '#,##0 "YER"';
      
      worksheet.getCell('D6').value = 'Report Date:';
      const todayDate = new Date();
      worksheet.getCell('E6').value = todayDate;
      worksheet.getCell('E6').numFmt = 'dd/mm/yyyy';

      // رؤوس جدول الحضور
      const headers = ['#', 'Date', 'Day', 'Work Description', 'Hours', 'Amount Due', 'Amount Paid', 'Status'];
      const headerRow = worksheet.getRow(8);
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3b82f6' } };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // بيانات الحضور
      attendance.forEach((record: any, index: number) => {
        const row = worksheet.getRow(9 + index);
        const dailyWageAmount = Number(record.dailyWage) || 0;
        const paidAmount = Number(record.paidAmount) || 0;
        const status = paidAmount >= dailyWageAmount ? 'Fully Paid' : 
                      paidAmount > 0 ? 'Partially Paid' : 'Unpaid';
        
        row.getCell(1).value = index + 1;
        
        const recordDate = new Date(record.date);
        row.getCell(2).value = recordDate;
        row.getCell(2).numFmt = 'dd/mm/yyyy';
        
        row.getCell(3).value = formatDay(record.date);
        row.getCell(4).value = record.workDescription || 'Daily construction work as per project requirements';
        row.getCell(5).value = record.startTime && record.endTime ? 
          `${record.startTime}-${record.endTime}` : '8 hours';
        
        row.getCell(6).value = dailyWageAmount;
        row.getCell(6).numFmt = '#,##0 "YER"';
        
        row.getCell(7).value = paidAmount;
        row.getCell(7).numFmt = '#,##0 "YER"';
        
        row.getCell(8).value = status;

        // تنسيق الصف
        row.eachCell((cell, colNumber) => {
          cell.alignment = { 
            horizontal: colNumber === 4 ? 'left' : 'center', 
            vertical: 'middle' 
          };
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
      const totalRowIndex = 9 + attendance.length;
      const totalRow = worksheet.getRow(totalRowIndex);
      totalRow.getCell(1).value = 'TOTALS';
      worksheet.mergeCells(`A${totalRowIndex}:E${totalRowIndex}`);
      
      totalRow.getCell(6).value = totalEarned;
      totalRow.getCell(6).numFmt = '#,##0 "YER"';
      totalRow.getCell(7).value = totalPaid;
      totalRow.getCell(7).numFmt = '#,##0 "YER"';
      
      const paymentPercentage = totalEarned > 0 ? ((totalPaid / totalEarned) * 100) : 0;
      totalRow.getCell(8).value = paymentPercentage / 100;
      totalRow.getCell(8).numFmt = '0.0%';

      // تنسيق صف الإجماليات
      totalRow.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10b981' } };
        cell.border = {
          top: { style: 'medium' },
          left: { style: 'thin' },
          bottom: { style: 'medium' },
          right: { style: 'thin' }
        };
      });

      // الملخص المالي
      const summaryStartRow = totalRowIndex + 2;
      
      worksheet.mergeCells(`A${summaryStartRow}:B${summaryStartRow}`);
      const summaryTitleCell = worksheet.getCell(`A${summaryStartRow}`);
      summaryTitleCell.value = 'FINANCIAL SUMMARY';
      summaryTitleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      summaryTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      summaryTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };

      const summaryItems = [
        ['Total Earned:', totalEarned],
        ['Total Paid:', totalPaid],
        ['Total Transferred to Family:', totalTransferred],
        ['Current Balance:', currentBalance],
        ['Amount Due:', remainingDue]
      ];

      summaryItems.forEach((item, index) => {
        const rowIndex = summaryStartRow + 1 + index;
        worksheet.getCell(`A${rowIndex}`).value = item[0];
        worksheet.getCell(`A${rowIndex}`).font = { name: 'Arial', size: 10, bold: true };
        
        worksheet.getCell(`B${rowIndex}`).value = item[1];
        worksheet.getCell(`B${rowIndex}`).numFmt = '#,##0 "YER"';
        worksheet.getCell(`B${rowIndex}`).font = { name: 'Arial', size: 10, bold: true };
        
        if (index === 3) { // Current Balance
          const balanceColor = (item[1] as number) >= 0 ? 'FF059669' : 'FFdc2626';
          worksheet.getCell(`B${rowIndex}`).font = { 
            ...worksheet.getCell(`B${rowIndex}`).font, 
            color: { argb: balanceColor } 
          };
        }
      });

      // إضافة جدول التحويلات إذا كان هناك تحويلات
      if (transfers.length > 0) {
        const transfersStartRow = summaryStartRow + summaryItems.length + 3;
        
        worksheet.mergeCells(`D${transfersStartRow}:F${transfersStartRow}`);
        const transfersTitleCell = worksheet.getCell(`D${transfersStartRow}`);
        transfersTitleCell.value = 'MONEY TRANSFERS';
        transfersTitleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
        transfersTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        transfersTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFdc2626' } };

        const transferHeaders = ['Date', 'Amount', 'Transfer #'];
        const transferHeaderRow = worksheet.getRow(transfersStartRow + 1);
        transferHeaders.forEach((header, index) => {
          const cell = transferHeaderRow.getCell(index + 4);
          cell.value = header;
          cell.font = { name: 'Arial', size: 10, bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfee2e2' } };
        });

        transfers.forEach((transfer: any, index: number) => {
          const row = worksheet.getRow(transfersStartRow + 2 + index);
          const transferDate = new Date(transfer.transferDate);
          row.getCell(4).value = transferDate;
          row.getCell(4).numFmt = 'dd/mm/yyyy';
          
          row.getCell(5).value = Number(transfer.amount);
          row.getCell(5).numFmt = '#,##0 "YER"';
          
          row.getCell(6).value = transfer.transferNumber || 'N/A';
        });
      }

      // ضبط عرض الأعمدة
      worksheet.columns = [
        { width: 6 },   // #
        { width: 12 },  // Date
        { width: 12 },  // Day
        { width: 40 },  // Work Description
        { width: 15 },  // Hours
        { width: 15 },  // Amount Due
        { width: 15 },  // Amount Paid
        { width: 18 }   // Status
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

  // دالة الطباعة المحسنة 
  const handlePrint = () => {
    try {
      console.log('🖨️ Starting print process...');
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Could not open print window. Please allow pop-ups for this site.');
        return;
      }

      const printContent = document.getElementById('enhanced-worker-account-statement');
      if (!printContent) {
        alert('Print content not found');
        return;
      }

      const printHTML = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Worker Account Statement - ${worker.name || 'Unknown'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Cairo', 'Arial', sans-serif;
              direction: rtl;
              background: white;
              color: #1f2937;
              line-height: 1.6;
              font-size: 12px;
            }
            
            @media print {
              body { font-size: 11px; }
              .no-print { display: none !important; }
              .print-break { page-break-after: always; }
              h1, h2, h3 { page-break-after: avoid; }
              .statement-header { margin-bottom: 15px; }
              .financial-summary { margin-top: 20px; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              td, th { page-break-inside: avoid; }
            }
            
            @page {
              size: A4;
              margin: 0.8cm 0.6cm;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(printHTML);
      printWindow.document.close();
      
      console.log('✅ Print prepared successfully');
    } catch (error) {
      console.error('❌ Print error:', error);
      alert('Error occurred while printing. Please try again.');
    }
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
          padding: '4mm',
          fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
          fontSize: '10px',
          lineHeight: '1.3',
          color: '#1a1a1a',
          background: 'white',
          pageBreakAfter: 'avoid'
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
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#1e40af',
            margin: '0 0 1mm 0'
          }}>
            شركة الحاج عبدالرحمن علي الجهني وأولاده
          </h1>
          <h2 style={{
            fontSize: '10px',
            fontWeight: '600',
            color: '#374151',
            margin: '0 0 1mm 0'
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

        {/* بيانات العامل والمشروع - تخطيط مضغوط ومحسن */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '2mm',
          marginBottom: '3mm',
          padding: '2mm',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '1mm',
          fontSize: '8px'
        }}>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <strong>العامل:</strong> {worker.name || 'غير محدد'} | <strong>المهنة:</strong> {worker.type || 'عامل'} | <strong>الأجر:</strong> {formatCurrency(Number(worker.dailyWage) || 0)}
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <strong>المشروع:</strong> {selectedProject?.name || 'جميع المشاريع'} | <strong>أيام العمل:</strong> {workingDays}
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <strong>المستحق:</strong> <span style={{ color: '#dc2626' }}>{formatCurrency(totalEarned)}</span> | <strong>الرصيد:</strong> <span style={{ color: currentBalance >= 0 ? '#059669' : '#dc2626' }}>{formatCurrency(currentBalance)}</span>
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
            fontSize: '8px',
            border: '1px solid #d1d5db'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ border: '1px solid #d1d5db', padding: '1.5mm', textAlign: 'center', fontWeight: 'bold', width: '6%' }}>م</th>
                <th style={{ border: '1px solid #d1d5db', padding: '1.5mm', textAlign: 'center', fontWeight: 'bold', width: '12%' }}>التاريخ</th>
                <th style={{ border: '1px solid #d1d5db', padding: '1.5mm', textAlign: 'center', fontWeight: 'bold', width: '10%' }}>اليوم</th>
                <th style={{ border: '1px solid #d1d5db', padding: '1.5mm', textAlign: 'center', fontWeight: 'bold', width: '30%' }}>وصف العمل</th>
                <th style={{ border: '1px solid #d1d5db', padding: '1.5mm', textAlign: 'center', fontWeight: 'bold', width: '12%' }}>الساعات</th>
                <th style={{ border: '1px solid #d1d5db', padding: '1.5mm', textAlign: 'center', fontWeight: 'bold', width: '12%' }}>المستحق</th>
                <th style={{ border: '1px solid #d1d5db', padding: '1.5mm', textAlign: 'center', fontWeight: 'bold', width: '12%' }}>المدفوع</th>
                <th style={{ border: '1px solid #d1d5db', padding: '1.5mm', textAlign: 'center', fontWeight: 'bold', width: '11%' }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record: any, index: number) => {
                const dailyWageAmount = Number(record.dailyWage) || 0;
                const paidAmount = Number(record.paidAmount) || 0;
                const status = paidAmount >= dailyWageAmount ? 'مدفوع كاملاً' : 
                            paidAmount > 0 ? 'مدفوع جزئياً' : 'غير مدفوع';
                const statusColor = paidAmount >= dailyWageAmount ? '#059669' : 
                                  paidAmount > 0 ? '#d97706' : '#dc2626';
                
                return (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                    <td style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontSize: '7px' }}>{index + 1}</td>
                    <td style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontSize: '7px' }}>{formatDate(record.date)}</td>
                    <td style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontSize: '7px' }}>{formatDay(record.date)}</td>
                    <td style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'right', fontSize: '7px' }}>
                      {record.workDescription || 'عمل يومي حسب متطلبات المشروع'}
                    </td>
                    <td style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontSize: '7px' }}>
                      {record.startTime && record.endTime ? `${record.startTime}-${record.endTime}` : '8س'}
                    </td>
                    <td style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontWeight: 'bold', fontSize: '7px' }}>
                      {formatCurrency(dailyWageAmount)}
                    </td>
                    <td style={{ border: '1px solid #d1d5db', padding: '1mm', textAlign: 'center', fontWeight: 'bold', color: '#059669', fontSize: '7px' }}>
                      {formatCurrency(paidAmount)}
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
                  {formatCurrency(totalEarned)}
                </td>
                <td style={{ border: '2px solid #059669', padding: '1.5mm', textAlign: 'center', fontWeight: 'bold', fontSize: '8px' }}>
                  {formatCurrency(totalPaid)}
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
              سجل التحويلات للأهل
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
                    إجمالي المحول
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
              <strong>المكتسب:</strong> <span style={{ color: '#059669' }}>{formatCurrency(totalEarned)}</span>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <strong>المدفوع:</strong> <span style={{ color: '#059669' }}>{formatCurrency(totalPaid)}</span>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <strong>الرصيد:</strong> <span style={{ color: currentBalance >= 0 ? '#059669' : '#dc2626', fontWeight: 'bold' }}>{formatCurrency(currentBalance)}</span>
            </div>
            {totalTransferred > 0 && (
              <div style={{ flex: 1, textAlign: 'center' }}>
                <strong>محول للأهل:</strong> <span style={{ color: '#dc2626' }}>{formatCurrency(totalTransferred)}</span>
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
                  <p style={{ fontWeight: 'bold', marginBottom: '3mm' }}>توقيع المحاسب</p>
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
                    <p style={{ margin: '0 0 2mm 0', fontWeight: 'bold' }}>توقيع المحاسب (صفحة 1)</p>
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
                    <p style={{ fontWeight: 'bold', marginBottom: '3mm' }}>توقيع المحاسب النهائي</p>
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