// مكون كشف حساب العامل المضغوط - مصمم خصيصاً لصفحة واحدة
import '@/styles/unified-print.css';

interface CompactWorkerAccountReportProps {
  data: any;
  selectedProject: any;
  workerId: string;
  dateFrom: string;
  dateTo: string;
}

export const CompactWorkerAccountReport = ({ 
  data, 
  selectedProject, 
  workerId, 
  dateFrom, 
  dateTo 
}: CompactWorkerAccountReportProps) => {
  
  const formatCurrency = (amount: number) => {
    const validAmount = isNaN(amount) || amount === null || amount === undefined ? 0 : Number(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(validAmount) + ' ر.ي';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const {
    worker = {},
    attendance = [],
    transfers = [],
    summary = {}
  } = data || {};

  // الحسابات
  const totalEarned = attendance.reduce((sum: number, record: any) => {
    const amount = Number(record.dailyWage) || 0;
    return sum + amount;
  }, 0);

  const totalPaid = attendance.reduce((sum: number, record: any) => {
    const amount = Number(record.paidAmount) || 0;
    return sum + amount;
  }, 0);

  const totalTransferred = transfers.reduce((sum: number, transfer: any) => {
    const amount = Number(transfer.amount) || 0;
    return sum + amount;
  }, 0);

  const currentBalance = totalPaid - totalTransferred;
  const remainingDue = totalEarned - totalPaid;

  return (
    <div className="compact-worker-report">
      {/* رأس التقرير */}
      <div className="report-header">
        <div className="report-title">كشف حساب العامل</div>
        <div className="report-subtitle">{worker.name || 'غير محدد'}</div>
        <div className="report-subtitle">{formatDate(dateFrom)} إلى {formatDate(dateTo)}</div>
      </div>

      {/* معلومات العامل والمشروع */}
      <div className="worker-project-info">
        <div className="info-section">
          <div className="info-label">معلومات العامل</div>
          <div>الاسم: {worker.name || 'غير محدد'}</div>
          <div>النوع: {worker.type || 'غير محدد'}</div>
          <div>الأجر اليومي: {formatCurrency(worker.dailyWage || 0)}</div>
        </div>
        <div className="info-section">
          <div className="info-label">معلومات المشروع</div>
          <div>المشروع: {selectedProject?.name || 'غير محدد'}</div>
          <div>الموقع: {selectedProject?.location || 'غير محدد'}</div>
          <div>تاريخ التقرير: {formatDate(new Date().toISOString().split('T')[0])}</div>
        </div>
      </div>

      {/* جدول المعاملات المضغوط */}
      <table className="transactions-table">
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>النوع</th>
            <th>الوصف</th>
            <th>المبلغ</th>
            <th>الرصيد</th>
          </tr>
        </thead>
        <tbody>
          {attendance.slice(0, 15).map((record: any, index: number) => (
            <tr key={index}>
              <td>{formatDate(record.date)}</td>
              <td>{record.status === 'present' ? 'حضور' : 'غياب'}</td>
              <td>أجر يومي</td>
              <td>{formatCurrency(record.dailyWage || 0)}</td>
              <td>{formatCurrency(record.paidAmount || 0)}</td>
            </tr>
          ))}
          {transfers.slice(0, 5).map((transfer: any, index: number) => (
            <tr key={`transfer-${index}`}>
              <td>{formatDate(transfer.date)}</td>
              <td>حوالة</td>
              <td>حوالة إلى {transfer.recipientName}</td>
              <td>-{formatCurrency(transfer.amount || 0)}</td>
              <td>-</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* الملخص المالي */}
      <div className="financial-summary">
        <div className="summary-card">
          <div className="summary-label">إجمالي المكتسب</div>
          <div className="summary-value">{formatCurrency(totalEarned)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">إجمالي المدفوع</div>
          <div className="summary-value">{formatCurrency(totalPaid)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">إجمالي الحوالات</div>
          <div className="summary-value">{formatCurrency(totalTransferred)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">الرصيد الحالي</div>
          <div className="summary-value">{formatCurrency(currentBalance)}</div>
        </div>
      </div>

      {/* الرقم النهائي */}
      <div className="final-balance">
        <div className="final-balance-label">المتبقي في ذمة الشركة</div>
        <div className="final-balance-value">{formatCurrency(remainingDue)}</div>
      </div>

      {/* التذييل */}
      <div className="report-footer">
        <div className="footer-left">
          <div>تاريخ التقرير: {formatDate(new Date().toISOString().split('T')[0])}</div>
          <div>نظام إدارة المشاريع الإنشائية</div>
        </div>
        <div className="footer-center">
          <div className="signature-line"></div>
          <div>توقيع المسؤول</div>
        </div>
        <div className="footer-right">
          <div>الهاتف: [رقم الهاتف]</div>
          <div>العنوان: [العنوان]</div>
        </div>
      </div>
    </div>
  );
};