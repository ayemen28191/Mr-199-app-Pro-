// مكون التقارير الموحد - نظام شامل لجميع التقارير
import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, FileSpreadsheet, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import '@/styles/unified-print.css';

interface ReportHeader {
  title: string;
  subtitle?: string;
  projectName?: string;
  workerName?: string;
  dateRange?: string;
}

interface ReportData {
  [key: string]: any;
}

interface UnifiedReportRendererProps {
  type: 'worker_statement' | 'daily_expenses' | 'project_summary' | 'supplier_statement';
  header: ReportHeader;
  data: ReportData;
  onPrint?: () => void;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
}

export const UnifiedReportRenderer: React.FC<UnifiedReportRendererProps> = ({
  type,
  header,
  data,
  onPrint,
  onExportExcel,
  onExportPDF
}) => {
  
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const renderWorkerStatement = () => {
    const { worker, attendance = [], transfers = [] } = data;
    
    // حساب الإجماليات
    const totalEarned = attendance.reduce((sum: number, record: any) => {
      return sum + (Number(record.dailyWage) * Number(record.workDays || 1));
    }, 0);
    
    const totalPaid = attendance.reduce((sum: number, record: any) => {
      return sum + Number(record.paidAmount || 0);
    }, 0);
    
    const totalTransferred = transfers.reduce((sum: number, transfer: any) => {
      return sum + Number(transfer.amount || 0);
    }, 0);
    
    const workerBalance = totalEarned - totalPaid - totalTransferred;

    return (
      <div className="worker-statement-content">
        {/* معلومات العامل */}
        <div className="worker-info">
          <div className="info-section">
            <div className="info-label">معلومات العامل</div>
            <div>الاسم: {worker?.name || 'غير محدد'}</div>
            <div>النوع: {worker?.type || 'غير محدد'}</div>
            <div>الأجر اليومي: {formatCurrency(Number(worker?.dailyWage || 0))}</div>
          </div>
          <div className="info-section">
            <div className="info-label">فترة التقرير</div>
            <div className="date-range">{header.dateRange}</div>
          </div>
        </div>

        {/* جدول الحضور */}
        {attendance.length > 0 && (
          <div className="no-break">
            <h3>سجل الحضور والأجور</h3>
            <table>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>أيام العمل</th>
                  <th>الأجر المستحق</th>
                  <th>المبلغ المدفوع</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record: any, index: number) => (
                  <tr key={index}>
                    <td>{formatDate(record.date)}</td>
                    <td>{record.workDays || 1}</td>
                    <td className="currency">{formatCurrency(Number(record.dailyWage) * Number(record.workDays || 1))}</td>
                    <td className="currency">{formatCurrency(Number(record.paidAmount || 0))}</td>
                    <td>{record.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* جدول التحويلات */}
        {transfers.length > 0 && (
          <div className="no-break">
            <h3>حوالات الأهل</h3>
            <table>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>المبلغ</th>
                  <th>اسم المستلم</th>
                  <th>رقم الهاتف</th>
                  <th>طريقة التحويل</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((transfer: any, index: number) => (
                  <tr key={index}>
                    <td>{formatDate(transfer.transferDate || transfer.date)}</td>
                    <td className="currency">{formatCurrency(Number(transfer.amount))}</td>
                    <td>{transfer.recipientName}</td>
                    <td>{transfer.recipientPhone || '-'}</td>
                    <td>{transfer.transferMethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* الملخص المالي */}
        <div className="summary-card">
          <h3>الملخص المالي</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span>إجمالي المستحق:</span>
              <span className="currency">{formatCurrency(totalEarned)}</span>
            </div>
            <div className="summary-item">
              <span>إجمالي المدفوع:</span>
              <span className="currency">{formatCurrency(totalPaid)}</span>
            </div>
            <div className="summary-item">
              <span>إجمالي المحول:</span>
              <span className="currency">{formatCurrency(totalTransferred)}</span>
            </div>
            <div className="total-amount">
              الرصيد الحالي: {formatCurrency(workerBalance)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDailyExpenses = () => {
    const { expenses = [], summary = {} } = data;
    
    return (
      <div className="daily-expenses-content">
        {/* جدول المصاريف */}
        {expenses.length > 0 && (
          <div className="no-break">
            <h3>مصاريف اليوم</h3>
            <table>
              <thead>
                <tr>
                  <th>النوع</th>
                  <th>الوصف</th>
                  <th>المبلغ</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense: any, index: number) => (
                  <tr key={index}>
                    <td>{expense.category}</td>
                    <td>{expense.description}</td>
                    <td className="currency">{formatCurrency(Number(expense.amount))}</td>
                    <td>{expense.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ملخص المصاريف */}
        <div className="summary-card">
          <h3>ملخص مصاريف اليوم</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span>أجور العمال:</span>
              <span className="currency">{formatCurrency(Number(summary.labor || 0))}</span>
            </div>
            <div className="summary-item">
              <span>مصاريف متنوعة:</span>
              <span className="currency">{formatCurrency(Number(summary.pettyExpenses || 0))}</span>
            </div>
            <div className="summary-item">
              <span>مشتريات المواد:</span>
              <span className="currency">{formatCurrency(Number(summary.materials || 0))}</span>
            </div>
            <div className="total-amount">
              إجمالي مصاريف اليوم: {formatCurrency(Number(summary.total || 0))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (type) {
      case 'worker_statement':
        return renderWorkerStatement();
      case 'daily_expenses':
        return renderDailyExpenses();
      default:
        return <div>نوع التقرير غير مدعوم</div>;
    }
  };

  return (
    <div className="unified-report-container">
      {/* أزرار التحكم */}
      <div className="no-print report-controls">
        <div className="flex gap-2 mb-4">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="w-4 h-4 ml-2" />
            طباعة
          </Button>
          {onExportExcel && (
            <Button onClick={onExportExcel} variant="outline" size="sm">
              <FileSpreadsheet className="w-4 h-4 ml-2" />
              تصدير Excel
            </Button>
          )}
          {onExportPDF && (
            <Button onClick={onExportPDF} variant="outline" size="sm">
              <Download className="w-4 h-4 ml-2" />
              تصدير PDF
            </Button>
          )}
        </div>
      </div>

      {/* محتوى التقرير */}
      <div className="print-content">
        {/* رأس التقرير */}
        <div className="report-header">
          <h1>{header.title}</h1>
          {header.subtitle && <p className="subtitle">{header.subtitle}</p>}
          {header.projectName && (
            <div className="project-info">
              <div className="info-section">
                <div className="info-label">المشروع</div>
                <div>{header.projectName}</div>
              </div>
            </div>
          )}
        </div>

        {/* محتوى التقرير */}
        {renderContent()}

        {/* التوقيعات */}
        <div className="signature-section">
          <div className="signature-box">
            <div className="signature-line"></div>
            <div>توقيع المسؤول</div>
          </div>
          <div className="signature-box">
            <div className="signature-line"></div>
            <div>توقيع المحاسب</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedReportRenderer;