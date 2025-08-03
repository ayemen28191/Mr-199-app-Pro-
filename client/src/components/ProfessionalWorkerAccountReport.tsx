import { FileText, Building2, Calendar, User, FileSpreadsheet, Phone, MapPin, Banknote } from 'lucide-react';

interface ProfessionalWorkerAccountReportProps {
  data: any;
  selectedProject: any;
  workerId: string;
  dateFrom: string;
  dateTo: string;
}

export const ProfessionalWorkerAccountReport = ({ 
  data, 
  selectedProject, 
  workerId, 
  dateFrom, 
  dateTo 
}: ProfessionalWorkerAccountReportProps) => {
  const formatCurrency = (amount: number) => {
    const validAmount = isNaN(amount) || amount === null || amount === undefined ? 0 : Number(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(validAmount) + ' ر.ي';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const {
    worker = {},
    attendance = [],
    transfers = [],
    summary = {}
  } = data || {};

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

  return (
    <div 
      id="professional-worker-account-report" 
      className="print-content bg-white enhanced-worker-account-report" 
      style={{
        direction: 'rtl',
        width: '100%',
        minHeight: '100vh',
        margin: '0',
        padding: '4mm',
        pageBreakAfter: 'avoid',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        lineHeight: '1.3'
      }}
    >
      
      {/* Enhanced Professional Header */}
      <div className="enhanced-header preserve-color" style={{padding: '12mm 0', margin: '0 0 6mm 0', border: '3px solid #7c3aed', borderRadius: '8px'}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12mm'}}>
          <div className="worker-info-badge" style={{width: '120px', height: '100px', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', color: 'white', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'}}>
            <User style={{width: '28px', height: '28px', marginBottom: '8px'}} />
            <div style={{fontSize: '14px', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.2'}}>كشف حساب</div>
            <div style={{fontSize: '12px', opacity: '0.9', marginTop: '2px'}}>العامل</div>
          </div>
          <div className="text-center flex-1" style={{margin: '0 20px'}}>
            <h1 style={{fontSize: '32px', fontWeight: 'bold', margin: '6px 0', color: '#7c3aed', textShadow: '2px 2px 4px rgba(0,0,0,0.1)'}}>كشف حساب العامل التفصيلي والشامل</h1>
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '25px', marginTop: '10px', flexWrap: 'wrap'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '8px 16px', borderRadius: '20px', border: '2px solid #e2e8f0'}}>
                <Building2 style={{width: '18px', height: '18px', color: '#64748b'}} />
                <span style={{fontSize: '15px', fontWeight: '600', color: '#1e293b'}}>مشروع: {selectedProject?.name || 'غير محدد'}</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '8px 16px', borderRadius: '20px', border: '2px solid #e2e8f0'}}>
                <User style={{width: '18px', height: '18px', color: '#64748b'}} />
                <span style={{fontSize: '15px', fontWeight: '600', color: '#1e293b'}}>العامل: {worker.name || 'غير محدد'}</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '8px 16px', borderRadius: '20px', border: '2px solid #e2e8f0'}}>
                <Calendar style={{width: '18px', height: '18px', color: '#64748b'}} />
                <span style={{fontSize: '15px', fontWeight: '600', color: '#1e293b'}}>من {formatDate(dateFrom)} إلى {formatDate(dateTo)}</span>
              </div>
            </div>
          </div>
          <div className="report-badge" style={{width: '120px', height: '100px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'}}>
            <FileSpreadsheet style={{width: '24px', height: '24px', marginBottom: '6px'}} />
            <div style={{fontSize: '12px', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.2'}}>تقرير رقم</div>
            <div style={{fontSize: '16px', fontWeight: 'bold'}}>{workerId?.slice(-4) || '0001'}</div>
          </div>
        </div>
      </div>

      {/* Worker Information Panel */}
      <div style={{display: 'flex', gap: '6mm', marginBottom: '6mm'}}>
        <div style={{flex: '1', background: 'linear-gradient(135deg, #ddd6fe, #c4b5fd)', padding: '15px', borderRadius: '8px', border: '2px solid #7c3aed'}}>
          <h3 style={{fontSize: '18px', fontWeight: 'bold', color: '#5b21b6', marginBottom: '10px', textAlign: 'center'}}>بيانات العامل الأساسية</h3>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '16px'}}>
            <div><strong>الاسم:</strong> {worker.name || 'غير محدد'}</div>
            <div><strong>النوع:</strong> {worker.type || 'غير محدد'}</div>
            <div><strong>الراتب اليومي:</strong> {formatCurrency(Number(worker.dailyWage) || 0)}</div>
            <div><strong>الوظيفة:</strong> {worker.type || 'عامل'}</div>
          </div>
        </div>
        <div style={{flex: '1', background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', padding: '15px', borderRadius: '8px', border: '2px solid #10b981'}}>
          <h3 style={{fontSize: '18px', fontWeight: 'bold', color: '#047857', marginBottom: '10px', textAlign: 'center'}}>الملخص المالي الإجمالي</h3>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '16px'}}>
            <div><strong>إجمالي المكتسب:</strong> <span style={{color: '#059669', fontWeight: 'bold'}}>{formatCurrency(totalEarned)}</span></div>
            <div><strong>إجمالي المدفوع:</strong> <span style={{color: '#0d9488', fontWeight: 'bold'}}>{formatCurrency(totalPaid)}</span></div>
            <div><strong>إجمالي المحول:</strong> <span style={{color: '#dc2626', fontWeight: 'bold'}}>{formatCurrency(totalTransferred)}</span></div>
            <div><strong>الرصيد الحالي:</strong> <span style={{color: currentBalance >= 0 ? '#059669' : '#dc2626', fontWeight: 'bold', fontSize: '18px'}}>{formatCurrency(currentBalance)}</span></div>
          </div>
        </div>
      </div>

      {/* Enhanced Attendance Records Table */}
      <div style={{marginBottom: '8mm'}}>
        <h2 style={{fontSize: '22px', fontWeight: 'bold', color: '#1e40af', marginBottom: '8px', textAlign: 'center', background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', padding: '10px', borderRadius: '8px', border: '2px solid #1e40af'}}>سجل الحضور والأجور التفصيلي</h2>
        <table className="enhanced-summary-table" style={{width: '100%', borderCollapse: 'collapse', fontSize: '16px', lineHeight: '1.4', border: '3px solid #1e40af', borderRadius: '8px', overflow: 'hidden'}}>
          <thead>
            <tr className="enhanced-header-row preserve-color" style={{background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: '#ffffff', height: '70px'}}>
              <th style={{padding: '15px 10px', textAlign: 'center', fontWeight: 'bold', border: '2px solid #1e3a8a', width: '8%', fontSize: '18px'}}>م</th>
              <th style={{padding: '15px 15px', textAlign: 'center', fontWeight: 'bold', border: '2px solid #1e3a8a', width: '15%', fontSize: '18px'}}>التاريخ الميلادي</th>
              <th style={{padding: '15px 20px', textAlign: 'right', fontWeight: 'bold', border: '2px solid #1e3a8a', width: '27%', fontSize: '18px'}}>وصف العمل المنجز والمهام اليومية</th>
              <th style={{padding: '15px 10px', textAlign: 'center', fontWeight: 'bold', border: '2px solid #1e3a8a', width: '12%', fontSize: '18px'}}>ساعات العمل</th>
              <th style={{padding: '15px 15px', textAlign: 'center', fontWeight: 'bold', border: '2px solid #1e3a8a', width: '18%', fontSize: '18px'}}>الأجر اليومي المستحق</th>
              <th style={{padding: '15px 15px', textAlign: 'center', fontWeight: 'bold', border: '2px solid #1e3a8a', width: '20%', fontSize: '18px'}}>المبلغ المدفوع فعلياً</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((record: any, index: number) => (
              <tr key={record.id || index} style={{background: index % 2 === 0 ? '#f8fafc' : 'white', minHeight: '60px', borderBottom: '1px solid #cbd5e1'}}>
                <td style={{padding: '15px 10px', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: 'bold', fontSize: '16px', color: '#475569'}}>{index + 1}</td>
                <td style={{padding: '15px 10px', textAlign: 'center', border: '1px solid #cbd5e1', fontSize: '15px', color: '#1e293b', fontWeight: '600'}}>{formatDate(record.date)}</td>
                <td style={{padding: '15px 15px', textAlign: 'right', border: '1px solid #cbd5e1', fontSize: '15px', color: '#374151', lineHeight: '1.4'}}>{record.workDescription || 'عمل يومي'}</td>
                <td style={{padding: '15px 10px', textAlign: 'center', border: '1px solid #cbd5e1', fontSize: '15px', color: '#6b7280', fontWeight: 'bold'}}>
                  {record.startTime && record.endTime ? `${record.startTime} - ${record.endTime}` : '8 ساعات'}
                </td>
                <td style={{padding: '15px 15px', textAlign: 'center', border: '1px solid #cbd5e1', fontSize: '16px', color: '#059669', fontWeight: 'bold', background: '#f0fdf4'}}>{formatCurrency(Number(record.dailyWage) || 0)}</td>
                <td style={{padding: '15px 15px', textAlign: 'center', border: '1px solid #cbd5e1', fontSize: '16px', color: '#0d9488', fontWeight: 'bold', background: '#f0fdfa'}}>{formatCurrency(Number(record.paidAmount) || 0)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', height: '60px'}}>
              <td colSpan={4} style={{padding: '15px', textAlign: 'center', border: '2px solid #047857', fontWeight: 'bold', fontSize: '18px'}}>إجمالي الأجور والمدفوعات</td>
              <td style={{padding: '15px', textAlign: 'center', border: '2px solid #047857', fontWeight: 'bold', fontSize: '18px'}}>{formatCurrency(totalEarned)}</td>
              <td style={{padding: '15px', textAlign: 'center', border: '2px solid #047857', fontWeight: 'bold', fontSize: '18px'}}>{formatCurrency(totalPaid)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Enhanced Transfers Table */}
      {transfers && transfers.length > 0 && (
        <div style={{marginBottom: '8mm'}}>
          <h2 style={{fontSize: '22px', fontWeight: 'bold', color: '#dc2626', marginBottom: '8px', textAlign: 'center', background: 'linear-gradient(135deg, #fee2e2, #fecaca)', padding: '10px', borderRadius: '8px', border: '2px solid #dc2626'}}>سجل الحوالات المرسلة للأهل</h2>
          <table className="enhanced-summary-table" style={{width: '100%', borderCollapse: 'collapse', fontSize: '16px', lineHeight: '1.4', border: '3px solid #dc2626', borderRadius: '8px', overflow: 'hidden'}}>
            <thead>
              <tr className="enhanced-header-row preserve-color" style={{background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: '#ffffff', height: '70px'}}>
                <th style={{padding: '15px 10px', textAlign: 'center', fontWeight: 'bold', border: '2px solid #b91c1c', width: '8%', fontSize: '18px'}}>م</th>
                <th style={{padding: '15px 15px', textAlign: 'center', fontWeight: 'bold', border: '2px solid #b91c1c', width: '15%', fontSize: '18px'}}>تاريخ الحوالة</th>
                <th style={{padding: '15px 20px', textAlign: 'right', fontWeight: 'bold', border: '2px solid #b91c1c', width: '25%', fontSize: '18px'}}>اسم المستلم وتفاصيل الاستلام</th>
                <th style={{padding: '15px 15px', textAlign: 'center', fontWeight: 'bold', border: '2px solid #b91c1c', width: '15%', fontSize: '18px'}}>طريقة التحويل</th>
                <th style={{padding: '15px 15px', textAlign: 'center', fontWeight: 'bold', border: '2px solid #b91c1c', width: '15%', fontSize: '18px'}}>رقم الحوالة</th>
                <th style={{padding: '15px 15px', textAlign: 'center', fontWeight: 'bold', border: '2px solid #b91c1c', width: '22%', fontSize: '18px'}}>مبلغ الحوالة بالريال اليمني</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((transfer: any, index: number) => (
                <tr key={transfer.id || index} style={{background: index % 2 === 0 ? '#fef2f2' : 'white', minHeight: '60px', borderBottom: '1px solid #fca5a5'}}>
                  <td style={{padding: '15px 10px', textAlign: 'center', border: '1px solid #fca5a5', fontWeight: 'bold', fontSize: '16px', color: '#7f1d1d'}}>{index + 1}</td>
                  <td style={{padding: '15px 10px', textAlign: 'center', border: '1px solid #fca5a5', fontSize: '15px', color: '#991b1b', fontWeight: '600'}}>{formatDate(transfer.transferDate)}</td>
                  <td style={{padding: '15px 15px', textAlign: 'right', border: '1px solid #fca5a5', fontSize: '15px', color: '#7f1d1d', lineHeight: '1.4'}}>
                    <div><strong>{transfer.recipientName}</strong></div>
                    {transfer.recipientPhone && <div style={{fontSize: '13px', color: '#991b1b'}}>هاتف: {transfer.recipientPhone}</div>}
                  </td>
                  <td style={{padding: '15px 10px', textAlign: 'center', border: '1px solid #fca5a5', fontSize: '15px', color: '#7f1d1d', fontWeight: 'bold'}}>
                    {transfer.transferMethod === 'hawaleh' ? 'حوالة' : 'تحويل'}
                  </td>
                  <td style={{padding: '15px 10px', textAlign: 'center', border: '1px solid #fca5a5', fontSize: '15px', color: '#991b1b', fontWeight: 'bold'}}>{transfer.transferNumber || '-'}</td>
                  <td style={{padding: '15px 15px', textAlign: 'center', border: '1px solid #fca5a5', fontSize: '16px', color: '#dc2626', fontWeight: 'bold', background: '#fef2f2'}}>{formatCurrency(Number(transfer.amount) || 0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: 'white', height: '60px'}}>
                <td colSpan={5} style={{padding: '15px', textAlign: 'center', border: '2px solid #7f1d1d', fontWeight: 'bold', fontSize: '18px'}}>إجمالي الحوالات المرسلة</td>
                <td style={{padding: '15px', textAlign: 'center', border: '2px solid #7f1d1d', fontWeight: 'bold', fontSize: '18px'}}>{formatCurrency(totalTransferred)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Enhanced Final Summary */}
      <div style={{background: 'linear-gradient(135deg, #fef3c7, #fde68a)', padding: '20px', borderRadius: '12px', border: '3px solid #f59e0b', marginTop: '8mm'}}>
        <h2 style={{fontSize: '24px', fontWeight: 'bold', color: '#92400e', textAlign: 'center', marginBottom: '15px'}}>الملخص النهائي والرصيد الإجمالي</h2>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', fontSize: '18px'}}>
          <div style={{background: '#ecfdf5', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '2px solid #10b981'}}>
            <div style={{fontSize: '16px', color: '#047857', marginBottom: '5px'}}>إجمالي المكتسب</div>
            <div style={{fontSize: '22px', fontWeight: 'bold', color: '#059669'}}>{formatCurrency(totalEarned)}</div>
          </div>
          <div style={{background: '#f0fdfa', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '2px solid #0d9488'}}>
            <div style={{fontSize: '16px', color: '#0f766e', marginBottom: '5px'}}>إجمالي المدفوع</div>
            <div style={{fontSize: '22px', fontWeight: 'bold', color: '#0d9488'}}>{formatCurrency(totalPaid)}</div>
          </div>
          <div style={{background: '#fef2f2', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '2px solid #dc2626'}}>
            <div style={{fontSize: '16px', color: '#991b1b', marginBottom: '5px'}}>إجمالي المحول</div>
            <div style={{fontSize: '22px', fontWeight: 'bold', color: '#dc2626'}}>{formatCurrency(totalTransferred)}</div>
          </div>
        </div>
        <div style={{marginTop: '20px', padding: '20px', background: currentBalance >= 0 ? '#ecfdf5' : '#fef2f2', borderRadius: '10px', textAlign: 'center', border: `3px solid ${currentBalance >= 0 ? '#10b981' : '#dc2626'}`}}>
          <div style={{fontSize: '20px', color: currentBalance >= 0 ? '#047857' : '#991b1b', marginBottom: '8px'}}>الرصيد النهائي للعامل</div>
          <div style={{fontSize: '32px', fontWeight: 'bold', color: currentBalance >= 0 ? '#059669' : '#dc2626'}}>{formatCurrency(currentBalance)}</div>
          <div style={{fontSize: '14px', color: '#6b7280', marginTop: '5px', fontStyle: 'italic'}}>
            {currentBalance >= 0 ? 'للعامل مبلغ مستحق' : 'العامل مدين بمبلغ'}
          </div>
        </div>
      </div>

      {/* Report Footer */}
      <div style={{marginTop: '15mm', padding: '10px', borderTop: '2px solid #9ca3af', textAlign: 'center', fontSize: '12px', color: '#6b7280'}}>
        <p>تم إنشاء هذا التقرير بتاريخ {formatDate(new Date().toISOString().split('T')[0])} | نظام إدارة المشاريع الإنشائية</p>
        <p style={{marginTop: '5px'}}>كشف حساب العامل - {worker.name} | المشروع: {selectedProject?.name}</p>
      </div>
    </div>
  );
};