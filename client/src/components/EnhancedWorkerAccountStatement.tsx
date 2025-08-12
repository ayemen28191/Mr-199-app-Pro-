// كشف حساب العامل الشامل والمحسن
// يعرض جميع البيانات المطلوبة: اسم العامل، المشروع، التواريخ، المبالغ، الأيام، الساعات والإجماليات

import React from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import '@/styles/unified-print.css';

interface WorkerAttendanceRecord {
  id: string;
  date: string;
  workDays: number;
  startTime: string;
  endTime: string;
  workDescription: string;
  dailyWage: number;
  paidAmount: number;
  paymentType: string;
  notes?: string;
}

interface WorkerTransferRecord {
  id: string;
  transferDate: string;
  amount: number;
  transferNumber: string;
  senderName: string;
  recipientName: string;
  recipientPhone: string;
  transferMethod: string;
  notes?: string;
}

interface EnhancedWorkerAccountStatementProps {
  data: {
    worker: {
      id: string;
      name: string;
      type: string;
      dailyWage: number;
      phone?: string;
      address?: string;
    };
    project?: {
      id: string;
      name: string;
      location?: string;
    };
    attendance: WorkerAttendanceRecord[];
    transfers: WorkerTransferRecord[];
    summary?: any;
  };
  dateFrom: string;
  dateTo: string;
}

export const EnhancedWorkerAccountStatement: React.FC<EnhancedWorkerAccountStatementProps> = ({
  data,
  dateFrom,
  dateTo
}) => {
  const { worker, project, attendance, transfers } = data;
  
  // حساب الإجماليات
  const totalWorkDays = (attendance || []).reduce((sum, record) => sum + (record.workDays || 0), 0);
  const totalWorkHours = (attendance || []).reduce((sum, record) => {
    if (record.startTime && record.endTime) {
      const start = new Date(`2000-01-01T${record.startTime}`);
      const end = new Date(`2000-01-01T${record.endTime}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return sum + (hours > 0 ? hours : 0);
    }
    return sum + 8; // افتراض 8 ساعات إذا لم تكن الأوقات متوفرة
  }, 0);
  
  const totalAmountDue = (attendance || []).reduce((sum, record) => sum + (record.dailyWage * record.workDays), 0);
  const totalAmountReceived = (attendance || []).reduce((sum, record) => sum + (record.paidAmount || 0), 0);
  const totalTransferred = (transfers || []).reduce((sum, transfer) => sum + transfer.amount, 0);
  const remainingAmount = totalAmountDue - totalAmountReceived;
  // الرصيد الصحيح للعامل = المستحق - المدفوع - المحول للأهل
  const workerCurrentBalance = totalAmountDue - totalAmountReceived - totalTransferred;

  return (
    <div id="enhanced-worker-account-statement" className="enhanced-worker-statement">
      {/* رأس المستند */}
      <div className="statement-header">
        <div className="company-header">
          <h1 className="company-name">شركة الفتيني للمقاولات والاستشارات الهندسية</h1>
          <h2 className="statement-title">كشف حساب العامل الشامل والتفصيلي</h2>
          <div className="statement-period">
            الفترة: من {formatDate(dateFrom)} إلى {formatDate(dateTo)} | تاريخ الكشف: {formatDate(new Date().toISOString().split('T')[0])}
          </div>
        </div>
      </div>

      {/* بيانات العامل */}
      <div className="worker-info-section">
        <h3 className="section-title">بيانات العامل</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">الاسم:</span>
            <span className="info-value">{worker.name}</span>
          </div>
          <div className="info-item">
            <span className="info-label">المهنة:</span>
            <span className="info-value">{worker.type}</span>
          </div>
          <div className="info-item">
            <span className="info-label">الأجر اليومي:</span>
            <span className="info-value">{formatCurrency(worker.dailyWage)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">الهاتف:</span>
            <span className="info-value">{worker.phone || 'غير محدد'}</span>
          </div>
        </div>
      </div>

      {/* بيانات المشروع */}
      <div className="project-info-section">
        <h3 className="section-title">بيانات المشروع</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">اسم المشروع:</span>
            <span className="info-value">{project?.name || 'متعدد المشاريع'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">الموقع:</span>
            <span className="info-value">{project?.location || 'غير محدد'}</span>
          </div>
        </div>
      </div>

      {/* الملخص المالي */}
      <div className="financial-summary">
        <h3 className="section-title">الملخص المالي</h3>
        <div className="summary-grid">
          <div className="summary-item earned">
            <span className="summary-label">إجمالي المستحق</span>
            <span className="summary-value">{formatCurrency(totalAmountDue)}</span>
          </div>
          <div className="summary-item received">
            <span className="summary-label">إجمالي المستلم</span>
            <span className="summary-value">{formatCurrency(totalAmountReceived)}</span>
          </div>
          <div className="summary-item transferred">
            <span className="summary-label">إجمالي المحول</span>
            <span className="summary-value">{formatCurrency(totalTransferred)}</span>
          </div>
          <div className="summary-item remaining">
            <span className="summary-label">المتبقي في الذمة</span>
            <span className="summary-value">{formatCurrency(remainingAmount)}</span>
          </div>
          <div className="summary-item balance">
            <span className="summary-label">الرصيد الحالي للعامل</span>
            <span className="summary-value">{formatCurrency(workerCurrentBalance)}</span>
          </div>
          <div className="summary-item days">
            <span className="summary-label">إجمالي أيام العمل</span>
            <span className="summary-value">{(totalWorkDays || 0).toFixed(1)} يوم</span>
          </div>
          <div className="summary-item hours">
            <span className="summary-label">إجمالي ساعات العمل</span>
            <span className="summary-value">{(totalWorkHours || 0).toFixed(1)} ساعة</span>
          </div>
          <div className="summary-item avg">
            <span className="summary-label">متوسط الساعات اليومية</span>
            <span className="summary-value">{(totalWorkDays || 0) > 0 ? ((totalWorkHours || 0) / totalWorkDays).toFixed(1) : '0'} ساعة</span>
          </div>
        </div>
      </div>

      {/* جدول تفاصيل الحضور والعمل */}
      <div className="attendance-section">
        <h3 className="section-title">سجل الحضور والعمل التفصيلي</h3>
        <table className="attendance-table">
          <thead>
            <tr>
              <th>م</th>
              <th>التاريخ</th>
              <th>أيام العمل</th>
              <th>من الساعة</th>
              <th>إلى الساعة</th>
              <th>ساعات العمل</th>
              <th>وصف العمل</th>
              <th>الأجر المستحق</th>
              <th>المبلغ المدفوع</th>
              <th>المتبقي</th>
              <th>نوع الدفع</th>
              <th>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((record, index) => {
              const workHours = record.startTime && record.endTime ? 
                (() => {
                  const start = new Date(`2000-01-01T${record.startTime}`);
                  const end = new Date(`2000-01-01T${record.endTime}`);
                  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                  return hours > 0 ? hours : 8;
                })() : 8;
              
              const amountDue = record.dailyWage * record.workDays;
              const remaining = amountDue - (record.paidAmount || 0);
              
              return (
                <tr key={record.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                  <td>{index + 1}</td>
                  <td>{formatDate(record.date)}</td>
                  <td>{record.workDays.toFixed(1)}</td>
                  <td>{record.startTime || '-'}</td>
                  <td>{record.endTime || '-'}</td>
                  <td>{workHours.toFixed(1)}</td>
                  <td className="work-description">{record.workDescription || '-'}</td>
                  <td className="amount-due" style={{ color: '#000' }}>{formatCurrency(amountDue)}</td>
                  <td className="amount-paid" style={{ color: '#dc2626' }}>{formatCurrency(record.paidAmount || 0)}</td>
                  <td className={`amount-remaining ${remaining > 0 ? 'positive' : remaining < 0 ? 'negative' : 'zero'}`} style={{ color: remaining < 0 ? '#dc2626' : '#16a34a' }}>
                    {formatCurrency(remaining)}
                  </td>
                  <td>{record.paymentType === 'full' ? 'كامل' : record.paymentType === 'partial' ? 'جزئي' : 'آجل'}</td>
                  <td className="notes">{record.notes || '-'}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <td colSpan={2}><strong>الإجماليات</strong></td>
              <td><strong>{totalWorkDays.toFixed(1)}</strong></td>
              <td colSpan={2}>-</td>
              <td><strong>{totalWorkHours.toFixed(1)}</strong></td>
              <td>-</td>
              <td className="total-due" style={{ color: '#000' }}><strong>{formatCurrency(totalAmountDue)}</strong></td>
              <td className="total-paid" style={{ color: '#dc2626' }}><strong>{formatCurrency(totalAmountReceived)}</strong></td>
              <td className={`total-remaining ${remainingAmount > 0 ? 'positive' : remainingAmount < 0 ? 'negative' : 'zero'}`} style={{ color: remainingAmount < 0 ? '#dc2626' : '#16a34a' }}>
                <strong>{formatCurrency(remainingAmount)}</strong>
              </td>
              <td colSpan={2}>-</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* جدول الحوالات المرسلة */}
      {transfers.length > 0 && (
        <div className="transfers-section">
          <h3 className="section-title">سجل الحوالات المرسلة</h3>
          <table className="transfers-table">
            <thead>
              <tr>
                <th>م</th>
                <th>التاريخ</th>
                <th>المبلغ</th>
                <th>رقم الحوالة</th>
                <th>المرسل</th>
                <th>المستلم</th>
                <th>هاتف المستلم</th>
                <th>طريقة التحويل</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((transfer, index) => (
                <tr key={transfer.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                  <td>{index + 1}</td>
                  <td>{formatDate(transfer.transferDate)}</td>
                  <td className="transfer-amount">{formatCurrency(transfer.amount)}</td>
                  <td>{transfer.transferNumber}</td>
                  <td>{transfer.senderName}</td>
                  <td>{transfer.recipientName}</td>
                  <td>{transfer.recipientPhone}</td>
                  <td>{transfer.transferMethod === 'hawaleh' ? 'حوالة' : transfer.transferMethod === 'bank' ? 'بنك' : 'نقداً'}</td>
                  <td className="notes">{transfer.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="totals-row">
                <td colSpan={2}><strong>إجمالي الحوالات</strong></td>
                <td className="total-transferred"><strong>{formatCurrency(totalTransferred)}</strong></td>
                <td colSpan={6}>-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* تذييل الكشف */}
      <div className="statement-footer">
        <div className="signatures-section">
          <div className="signature-box">
            <div className="signature-label">توقيع العامل</div>
            <div className="signature-line"></div>
            <div className="signature-name">{worker.name}</div>
          </div>
          <div className="signature-box">
            <div className="signature-label">توقيع المحاسب</div>
            <div className="signature-line"></div>
            <div className="signature-name">المحاسب المختص</div>
          </div>
          <div className="signature-box">
            <div className="signature-label">توقيع الإدارة</div>
            <div className="signature-line"></div>
            <div className="signature-name">الإدارة العامة</div>
          </div>
        </div>
        
        <div className="footer-info">
          <div className="generation-info">
            تم إنشاء هذا الكشف آلياً بواسطة نظام إدارة مشاريع البناء | 
            التاريخ: {new Date().toLocaleDateString('ar-EG')} | 
            الوقت: {new Date().toLocaleTimeString('ar-EG')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedWorkerAccountStatement;