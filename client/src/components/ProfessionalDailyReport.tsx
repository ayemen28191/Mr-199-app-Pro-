import { FileText, Building2, Calendar, User, FileSpreadsheet } from 'lucide-react';

interface ProfessionalDailyReportProps {
  data: any;
  selectedProject: any;
  selectedDate: string;
}

export const ProfessionalDailyReport = ({ data, selectedProject, selectedDate }: ProfessionalDailyReportProps) => {
  const formatCurrency = (amount: number) => {
    const validAmount = isNaN(amount) || amount === null || amount === undefined ? 0 : Number(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(validAmount) + ' ر.ي';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const {
    fundTransfers = [],
    workerAttendance = [],
    materialPurchases = [],
    transportationExpenses = [],
    incomingProjectTransfers = [],
    outgoingProjectTransfers = [],
    totalIncomingTransfers = 0,
    totalOutgoingTransfers = 0,
    summary = {}
  } = data || {};

  const carriedForward = summary.carriedForward || 0;



  const totalFundTransfersAmount = fundTransfers.reduce((sum: number, transfer: any) => {
    const amount = Number(transfer.amount) || 0;
    return sum + amount;
  }, 0);

  // حساب إجمالي الواردات (تحويلات العهدة + ترحيل الأموال الواردة)
  const totalIncome = totalFundTransfersAmount + totalIncomingTransfers;

  const totalWorkerCosts = workerAttendance.reduce((sum: number, attendance: any) => {
    const amount = Number(attendance.paidAmount) || 0;
    return sum + amount;
  }, 0);

  const totalMaterialCosts = materialPurchases.reduce((sum: number, purchase: any) => {
    const amount = Number(purchase.totalAmount) || 0;
    return sum + amount;
  }, 0);

  const totalTransportCosts = transportationExpenses.reduce((sum: number, expense: any) => {
    const amount = Number(expense.amount) || 0;
    return sum + amount;
  }, 0);

  const totalExpenses = totalWorkerCosts + totalMaterialCosts + totalTransportCosts + totalOutgoingTransfers;
  const remainingBalance = (carriedForward + totalIncome) - totalExpenses;

  return (
    <div 
      id="professional-daily-report" 
      className="print-content bg-white enhanced-daily-report prevent-large-numbers" 
      style={{
        direction: 'rtl',
        width: '100%',
        minHeight: '100vh',
        margin: '0',
        padding: '8mm',
        pageBreakAfter: 'avoid',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        lineHeight: '1.3',
        zoom: '1.0',
        transform: 'scale(1.0)',
        transformOrigin: 'top right'
      }}
    >
      
      {/* Enhanced Professional Header */}
      <div className="enhanced-header preserve-color" style={{padding: '15mm 0', margin: '0 0 8mm 0', border: '3px solid #1e40af', borderRadius: '8px'}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 15mm'}}>
          <div className="date-badge" style={{width: '80px', height: '90px', background: 'linear-gradient(135deg, #3b82f6, #1e40af)', color: 'white', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'}}>
            <div style={{fontSize: '32px', fontWeight: 'bold', lineHeight: '1'}}>{new Date(selectedDate).getDate()}</div>
            <div style={{fontSize: '12px', opacity: '0.9', marginTop: '4px'}}>{new Date(selectedDate).toLocaleDateString('ar-SA', {month: 'long'})}</div>
            <div style={{fontSize: '10px', opacity: '0.8'}}>{new Date(selectedDate).getFullYear()}</div>
          </div>
          <div className="text-center flex-1" style={{margin: '0 20px'}}>
            <h1 style={{fontSize: '36px', fontWeight: 'bold', margin: '8px 0', color: '#1e40af', textShadow: '2px 2px 4px rgba(0,0,0,0.1)'}}>كشف المصروفات اليومية التفصيلي</h1>
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', marginTop: '12px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '8px 16px', borderRadius: '20px', border: '2px solid #e2e8f0'}}>
                <Building2 style={{width: '20px', height: '20px', color: '#64748b'}} />
                <span style={{fontSize: '16px', fontWeight: '600', color: '#1e293b'}}>مشروع: {selectedProject?.name || 'غير محدد'}</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '8px 16px', borderRadius: '20px', border: '2px solid #e2e8f0'}}>
                <Calendar style={{width: '20px', height: '20px', color: '#64748b'}} />
                <span style={{fontSize: '16px', fontWeight: '600', color: '#1e293b'}}>التاريخ: {formatDate(selectedDate)}</span>
              </div>
            </div>
          </div>
          <div className="report-badge" style={{width: '80px', height: '90px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'}}>
            <FileSpreadsheet style={{width: '24px', height: '24px', marginBottom: '6px'}} />
            <div style={{fontSize: '12px', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.2'}}>كشف رقم</div>
            <div style={{fontSize: '16px', fontWeight: 'bold'}}>{selectedProject?.id?.slice(-4) || '0001'}</div>
          </div>
        </div>
      </div>

      {/* Enhanced Main Content */}
      <div style={{padding: '0 5mm', flex: '1', display: 'flex', flexDirection: 'column', gap: '8mm'}}>
        
        {/* Enhanced Financial Summary Table */}
        <table className="enhanced-summary-table" style={{width: '100%', borderCollapse: 'collapse', fontSize: '18px', lineHeight: '1.5', marginBottom: '8mm', border: '3px solid #1e40af', borderRadius: '8px', overflow: 'hidden'}}>
          <thead>
            <tr className="enhanced-header-row preserve-color" style={{background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: '#ffffff', height: '80px'}}>
              <th style={{padding: '20px 15px', textAlign: 'center', fontWeight: 'bold', border: '2px solid #1e3a8a', width: '10%', fontSize: '22px'}}>رقم التسلسل</th>
              <th style={{padding: '20px 25px', textAlign: 'right', fontWeight: 'bold', border: '2px solid #1e3a8a', width: '45%', fontSize: '22px'}}>البيان والوصف التفصيلي الشامل للعمليات المالية</th>
              <th style={{padding: '20px 15px', textAlign: 'center', fontWeight: 'bold', border: '2px solid #1e3a8a', width: '15%', fontSize: '22px'}}>عدد العمليات</th>
              <th style={{padding: '20px 25px', textAlign: 'center', fontWeight: 'bold', border: '2px solid #1e3a8a', width: '30%', fontSize: '22px'}}>إجمالي المبلغ بالريال اليمني</th>
            </tr>
          </thead>
          <tbody>
            <tr className="balance-row" style={{background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', minHeight: '70px', borderBottom: '2px solid #3b82f6'}}>
              <td style={{padding: '20px 15px', textAlign: 'center', border: '2px solid #3b82f6', fontWeight: '700', fontSize: '22px', color: '#1e40af'}}>01</td>
              <td style={{padding: '20px 25px', textAlign: 'right', border: '2px solid #3b82f6', fontWeight: '600', fontSize: '20px', color: '#1e40af'}}>الرصيد المرحل من اليوم السابق (النقدية المتوفرة في الصندوق)</td>
              <td style={{padding: '20px 15px', textAlign: 'center', border: '2px solid #3b82f6', fontSize: '20px', fontWeight: '600', color: '#64748b'}}>1</td>
              <td style={{padding: '20px 25px', textAlign: 'center', border: '2px solid #3b82f6', fontWeight: 'bold', color: '#0f766e', fontSize: '24px', background: 'linear-gradient(135deg, #a7f3d0, #6ee7b7)'}}>{formatCurrency(carriedForward)}</td>
            </tr>
            <tr className="income-row" style={{background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', minHeight: '70px', borderBottom: '2px solid #16a34a'}}>
              <td style={{padding: '20px 15px', textAlign: 'center', border: '2px solid #16a34a', fontWeight: '700', fontSize: '22px', color: '#15803d'}}>02</td>
              <td style={{padding: '20px 25px', textAlign: 'right', border: '2px solid #16a34a', fontWeight: '600', fontSize: '20px', color: '#15803d'}}>تحويلات العهدة والإيرادات النقدية المستلمة خلال اليوم الحالي</td>
              <td style={{padding: '20px 15px', textAlign: 'center', border: '2px solid #16a34a', fontSize: '20px', fontWeight: '600', color: '#64748b'}}>{fundTransfers.length}</td>
              <td style={{padding: '20px 25px', textAlign: 'center', border: '2px solid #16a34a', fontWeight: 'bold', color: '#047857', fontSize: '24px', background: 'linear-gradient(135deg, #86efac, #4ade80)'}}>{formatCurrency(totalFundTransfersAmount)}</td>
            </tr>
            <tr className="income-row" style={{background: 'linear-gradient(135deg, #ddd6fe, #c4b5fd)', minHeight: '70px', borderBottom: '2px solid #7c3aed'}}>
              <td style={{padding: '20px 15px', textAlign: 'center', border: '2px solid #7c3aed', fontWeight: '700', fontSize: '22px', color: '#6b21a8'}}>03</td>
              <td style={{padding: '20px 25px', textAlign: 'right', border: '2px solid #7c3aed', fontWeight: '600', fontSize: '20px', color: '#6b21a8'}}>أموال مرحلة واردة من مشاريع أخرى (ترحيل الأموال بين المشاريع)</td>
              <td style={{padding: '20px 15px', textAlign: 'center', border: '2px solid #7c3aed', fontSize: '20px', fontWeight: '600', color: '#64748b'}}>{incomingProjectTransfers.length}</td>
              <td style={{padding: '20px 25px', textAlign: 'center', border: '2px solid #7c3aed', fontWeight: 'bold', color: '#5b21b6', fontSize: '24px', background: 'linear-gradient(135deg, #c4b5fd, #a78bfa)'}}>{formatCurrency(totalIncomingTransfers)}</td>
            </tr>
            <tr className="total-available-row" style={{background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderTop: '3px solid #f59e0b', borderBottom: '3px solid #f59e0b', minHeight: '80px'}}>
              <td colSpan={3} style={{padding: '25px 25px', textAlign: 'right', border: '2px solid #f59e0b', fontWeight: 'bold', fontSize: '24px', color: '#92400e'}}>إجمالي الأموال المتاحة للصرف خلال اليوم (الرصيد المرحل + الإيرادات المستلمة):</td>
              <td style={{padding: '25px 25px', textAlign: 'center', border: '2px solid #f59e0b', fontWeight: 'bold', color: '#92400e', fontSize: '28px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', textShadow: '1px 1px 2px rgba(0,0,0,0.2)'}}>{formatCurrency(totalIncome + carriedForward)}</td>
            </tr>
            <tr className="expense-row" style={{background: 'linear-gradient(135deg, #fee2e2, #fecaca)', minHeight: '70px', borderBottom: '2px solid #dc2626'}}>
              <td style={{padding: '20px 15px', textAlign: 'center', border: '2px solid #dc2626', fontWeight: '700', fontSize: '22px', color: '#dc2626'}}>04</td>
              <td style={{padding: '20px 25px', textAlign: 'right', border: '2px solid #dc2626', fontWeight: '600', fontSize: '20px', color: '#dc2626'}}>أجور العمال والحضور اليومي (مصروفات العمالة والأجور)</td>
              <td style={{padding: '20px 15px', textAlign: 'center', border: '2px solid #dc2626', fontSize: '20px', fontWeight: '600', color: '#64748b'}}>{workerAttendance.length}</td>
              <td style={{padding: '20px 25px', textAlign: 'center', border: '2px solid #dc2626', fontWeight: 'bold', color: '#991b1b', fontSize: '24px', background: 'linear-gradient(135deg, #fca5a5, #f87171)'}}>{formatCurrency(totalWorkerCosts)}</td>
            </tr>
            <tr className="expense-row" style={{background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', minHeight: '70px', borderBottom: '2px solid #dc2626'}}>
              <td style={{padding: '20px 15px', textAlign: 'center', border: '2px solid #dc2626', fontWeight: '700', fontSize: '22px', color: '#dc2626'}}>05</td>
              <td style={{padding: '20px 25px', textAlign: 'right', border: '2px solid #dc2626', fontWeight: '600', fontSize: '20px', color: '#dc2626'}}>مشتريات المواد والمعدات والأدوات الإنشائية (مصروفات المواد)</td>
              <td style={{padding: '20px 15px', textAlign: 'center', border: '2px solid #dc2626', fontSize: '20px', fontWeight: '600', color: '#64748b'}}>{materialPurchases.length}</td>
              <td style={{padding: '20px 25px', textAlign: 'center', border: '2px solid #dc2626', fontWeight: 'bold', color: '#991b1b', fontSize: '24px', background: 'linear-gradient(135deg, #fca5a5, #f87171)'}}>{formatCurrency(totalMaterialCosts)}</td>
            </tr>
            <tr className="expense-row" style={{background: 'linear-gradient(135deg, #fee2e2, #fecaca)', minHeight: '70px', borderBottom: '2px solid #dc2626'}}>
              <td style={{padding: '20px 15px', textAlign: 'center', border: '2px solid #dc2626', fontWeight: '700', fontSize: '22px', color: '#dc2626'}}>06</td>
              <td style={{padding: '20px 25px', textAlign: 'right', border: '2px solid #dc2626', fontWeight: '600', fontSize: '20px', color: '#dc2626'}}>مصاريف النقل والتشغيل والمواصلات اليومية (مصروفات التشغيل)</td>
              <td style={{padding: '20px 15px', textAlign: 'center', border: '2px solid #dc2626', fontSize: '20px', fontWeight: '600', color: '#64748b'}}>{transportationExpenses.length}</td>
              <td style={{padding: '20px 25px', textAlign: 'center', border: '2px solid #dc2626', fontWeight: 'bold', color: '#991b1b', fontSize: '24px', background: 'linear-gradient(135deg, #fca5a5, #f87171)'}}>{formatCurrency(totalTransportCosts)}</td>
            </tr>
            <tr className="expense-row" style={{background: 'linear-gradient(135deg, #fed7d7, #f56565)', minHeight: '70px', borderBottom: '2px solid #e53e3e'}}>
              <td style={{padding: '20px 15px', textAlign: 'center', border: '2px solid #e53e3e', fontWeight: '700', fontSize: '22px', color: '#742a2a'}}>07</td>
              <td style={{padding: '20px 25px', textAlign: 'right', border: '2px solid #e53e3e', fontWeight: '600', fontSize: '20px', color: '#742a2a'}}>أموال مرحلة صادرة إلى مشاريع أخرى (ترحيل الأموال بين المشاريع)</td>
              <td style={{padding: '20px 15px', textAlign: 'center', border: '2px solid #e53e3e', fontSize: '20px', fontWeight: '600', color: '#64748b'}}>{outgoingProjectTransfers.length}</td>
              <td style={{padding: '20px 25px', textAlign: 'center', border: '2px solid #e53e3e', fontWeight: 'bold', color: '#9b2c2c', fontSize: '24px', background: 'linear-gradient(135deg, #fc8181, #f56565)'}}>{formatCurrency(totalOutgoingTransfers)}</td>
            </tr>
            <tr className="total-expenses-row" style={{background: 'linear-gradient(135deg, #fee2e2, #fca5a5)', borderTop: '3px solid #dc2626', borderBottom: '3px solid #dc2626', minHeight: '80px'}}>
              <td colSpan={3} style={{padding: '25px 25px', textAlign: 'right', border: '2px solid #dc2626', fontWeight: 'bold', fontSize: '24px', color: '#991b1b'}}>إجمالي المصروفات اليومية والنقديات المصروفة (جميع المصروفات):</td>
              <td style={{padding: '25px 25px', textAlign: 'center', border: '2px solid #dc2626', fontWeight: 'bold', color: '#991b1b', fontSize: '28px', background: 'linear-gradient(135deg, #f87171, #dc2626)', textShadow: '1px 1px 2px rgba(0,0,0,0.2)'}}>{formatCurrency(totalExpenses)}</td>
            </tr>
            <tr className="final-balance-row" style={{background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: 'white', minHeight: '90px', border: '4px solid #1e40af'}}>
              <td colSpan={3} style={{padding: '30px 25px', textAlign: 'right', border: '2px solid #1e3a8a', fontWeight: 'bold', fontSize: '26px', textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>الرصيد النهائي المتبقي في نهاية اليوم (صافي النقدية المتبقية في الصندوق):</td>
              <td style={{padding: '30px 25px', textAlign: 'center', border: '2px solid #1e3a8a', fontWeight: 'bold', fontSize: '32px', textShadow: '2px 2px 4px rgba(0,0,0,0.3)', background: remainingBalance >= 0 ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)'}}>{formatCurrency(remainingBalance)}</td>
            </tr>
          </tbody>
        </table>

        {/* Enhanced Detailed Breakdown Section */}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8mm', marginBottom: '8mm', fontSize: '14px'}}>
          
          {/* Left Column - Fund Transfers & Workers & Incoming Project Transfers */}
          <div>
            {(fundTransfers.length > 0 || incomingProjectTransfers.length > 0) && (
              <div style={{marginBottom: '12px'}}>
                <div className="professional-gradient" style={{padding: '6px 10px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px 4px 0 0', color: '#1e293b'}}>
                  تفاصيل العهدة والأموال الواردة ({fundTransfers.length + incomingProjectTransfers.length})
                </div>
                <table className="w-full border-collapse" style={{fontSize: '10px', border: '1px solid #e2e8f0'}}>
                  <thead>
                    <tr style={{backgroundColor: '#f8fafc', minHeight: '32px'}}>
                      <th style={{padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '9px', minHeight: '32px'}}>م</th>
                      <th style={{padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'right', fontSize: '9px', minHeight: '32px'}}>المصدر</th>
                      <th style={{padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '9px', minHeight: '32px'}}>التاريخ</th>
                      <th style={{padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '9px', minHeight: '32px'}}>رقم الحوالة</th>
                      <th style={{padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '9px', minHeight: '32px'}}>المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fundTransfers.slice(0, 2).map((transfer: any, index: number) => (
                      <tr key={`fund-${index}`} style={{backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc', minHeight: '28px'}}>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', minHeight: '28px'}}>{index + 1}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'right', minHeight: '28px'}}>{transfer.senderName}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '8px', color: '#059669', minHeight: '28px'}}>{formatDate(transfer.date || selectedDate)}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '8px', color: '#059669', minHeight: '28px'}}>{transfer.id?.slice(-6).toUpperCase() || 'عهدة'}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold', minHeight: '28px', color: '#059669'}}>{formatCurrency(transfer.amount)}</td>
                      </tr>
                    ))}
                    {incomingProjectTransfers.slice(0, 2).map((transfer: any, index: number) => (
                      <tr key={`incoming-${index}`} style={{backgroundColor: (fundTransfers.length + index) % 2 === 0 ? '#ffffff' : '#f8fafc', minHeight: '28px'}}>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', minHeight: '28px'}}>{fundTransfers.length + index + 1}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'right', minHeight: '28px'}}>{transfer.fromProjectName || `مشروع ${transfer.fromProjectId}`}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '8px', color: '#7c3aed', minHeight: '28px'}}>{formatDate(transfer.transferDate)}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '8px', color: '#7c3aed', minHeight: '28px'}}>{transfer.transferReference || 'غير محدد'}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold', minHeight: '28px', color: '#7c3aed'}}>{formatCurrency(transfer.amount)}</td>
                      </tr>
                    ))}
                    {(fundTransfers.length + incomingProjectTransfers.length) > 4 && (
                      <tr><td colSpan={5} style={{padding: '4px 6px', textAlign: 'center', fontSize: '9px', color: '#6b7280', fontStyle: 'italic', minHeight: '24px'}}>...و {(fundTransfers.length + incomingProjectTransfers.length) - 4} عمليات أخرى</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {workerAttendance.length > 0 && (
              <div>
                <div className="professional-gradient" style={{padding: '6px 10px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px 4px 0 0', color: '#1e293b'}}>
                  تفاصيل حضور العمال ({workerAttendance.length})
                </div>
                <table className="w-full border-collapse" style={{fontSize: '10px', border: '1px solid #e2e8f0'}}>
                  <thead>
                    <tr style={{backgroundColor: '#f8fafc', minHeight: '32px'}}>
                      <th style={{padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '9px', minHeight: '32px'}}>م</th>
                      <th style={{padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'right', fontSize: '9px', minHeight: '32px'}}>اسم العامل</th>
                      <th style={{padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '9px', minHeight: '32px'}}>الأجر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workerAttendance.map((attendance: any, index: number) => (
                      <tr key={index} style={{backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc', minHeight: '28px'}}>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', minHeight: '28px'}}>{index + 1}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'right', minHeight: '28px'}}>{attendance.worker?.name || 'غير محدد'}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold', minHeight: '28px'}}>{formatCurrency(attendance.paidAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column - Materials & Transportation & Outgoing Project Transfers */}
          <div>
            {materialPurchases.length > 0 && (
              <div style={{marginBottom: '12px'}}>
                <div className="professional-gradient" style={{padding: '6px 10px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px 4px 0 0', color: '#1e293b'}}>
                  تفاصيل مشتريات المواد ({materialPurchases.length})
                </div>
                <table className="w-full border-collapse" style={{fontSize: '10px', border: '1px solid #e2e8f0'}}>
                  <thead>
                    <tr style={{backgroundColor: '#f8fafc', minHeight: '32px'}}>
                      <th style={{padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '9px', minHeight: '32px'}}>م</th>
                      <th style={{padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'right', fontSize: '9px', minHeight: '32px'}}>اسم المادة</th>
                      <th style={{padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '9px', minHeight: '32px'}}>التكلفة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialPurchases.slice(0, 5).map((purchase: any, index: number) => (
                      <tr key={index} style={{backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc', minHeight: '28px'}}>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', minHeight: '28px'}}>{index + 1}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'right', minHeight: '28px'}}>{purchase.material?.name || 'غير محدد'}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold', minHeight: '28px'}}>{formatCurrency(purchase.totalAmount)}</td>
                      </tr>
                    ))}
                    {materialPurchases.length > 5 && (
                      <tr><td colSpan={3} style={{padding: '4px 6px', textAlign: 'center', fontSize: '9px', color: '#6b7280', fontStyle: 'italic', minHeight: '24px'}}>...و {materialPurchases.length - 5} مواد أخرى</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {(transportationExpenses.length > 0 || outgoingProjectTransfers.length > 0) && (
              <div>
                <div className="professional-gradient" style={{padding: '6px 10px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px 4px 0 0', color: '#1e293b'}}>
                  تفاصيل المصروفات والأموال الصادرة ({transportationExpenses.length + outgoingProjectTransfers.length})
                </div>
                <table className="w-full border-collapse" style={{fontSize: '10px', border: '1px solid #e2e8f0'}}>
                  <thead>
                    <tr style={{backgroundColor: '#f8fafc', minHeight: '32px'}}>
                      <th style={{padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '9px', minHeight: '32px'}}>م</th>
                      <th style={{padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'right', fontSize: '9px', minHeight: '32px'}}>الوصف</th>
                      <th style={{padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '9px', minHeight: '32px'}}>التاريخ</th>
                      <th style={{padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '9px', minHeight: '32px'}}>رقم الحوالة</th>
                      <th style={{padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '9px', minHeight: '32px'}}>المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transportationExpenses.slice(0, 2).map((expense: any, index: number) => (
                      <tr key={`transport-${index}`} style={{backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc', minHeight: '28px'}}>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', minHeight: '28px'}}>{index + 1}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'right', minHeight: '28px'}}>{expense.description}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '8px', color: '#dc2626', minHeight: '28px'}}>{formatDate(expense.date || selectedDate)}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '8px', color: '#dc2626', minHeight: '28px'}}>{expense.id?.slice(-6).toUpperCase() || 'نقل'}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold', minHeight: '28px', color: '#dc2626'}}>{formatCurrency(expense.amount)}</td>
                      </tr>
                    ))}
                    {outgoingProjectTransfers.slice(0, 2).map((transfer: any, index: number) => (
                      <tr key={`outgoing-${index}`} style={{backgroundColor: (transportationExpenses.length + index) % 2 === 0 ? '#ffffff' : '#f8fafc', minHeight: '28px'}}>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', minHeight: '28px'}}>{transportationExpenses.length + index + 1}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'right', minHeight: '28px'}}>ترحيل إلى {transfer.toProjectName || `مشروع ${transfer.toProjectId}`}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '8px', color: '#e53e3e', minHeight: '28px'}}>{formatDate(transfer.transferDate)}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '8px', color: '#e53e3e', minHeight: '28px'}}>{transfer.transferReference || 'غير محدد'}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold', minHeight: '28px', color: '#e53e3e'}}>{formatCurrency(transfer.amount)}</td>
                      </tr>
                    ))}
                    {(transportationExpenses.length + outgoingProjectTransfers.length) > 4 && (
                      <tr><td colSpan={5} style={{padding: '4px 6px', textAlign: 'center', fontSize: '9px', color: '#6b7280', fontStyle: 'italic', minHeight: '24px'}}>...و {(transportationExpenses.length + outgoingProjectTransfers.length) - 4} عمليات أخرى</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Professional Footer - Banking & Signature */}
        <div style={{marginTop: 'auto', paddingTop: '15px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '12px', padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px'}}>
            <div style={{display: 'flex', gap: '30px', alignItems: 'center'}}>
              <div><strong>إجمالي العمليات:</strong> {(fundTransfers.length + incomingProjectTransfers.length + workerAttendance.length + materialPurchases.length + transportationExpenses.length + outgoingProjectTransfers.length)}</div>
              <div><strong>عدد العمال الحاضرين:</strong> {workerAttendance.filter((a: any) => a.isPresent).length}</div>
              <div><strong>عدد المشتريات:</strong> {materialPurchases.length}</div>
            </div>
            <div style={{textAlign: 'center'}}>
              <div style={{borderBottom: '2px solid #374151', width: '140px', marginBottom: '5px'}}></div>
              <div style={{fontSize: '11px', fontWeight: 'bold'}}>توقيع المسؤول المالي</div>
              <div style={{fontSize: '9px', color: '#6b7280', marginTop: '2px'}}>Financial Manager Signature</div>
            </div>
          </div>
          
          <div className="professional-gradient preserve-color" style={{padding: '10px 15px', textAlign: 'center', fontSize: '12px', borderRadius: '6px', color: '#000000'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{fontWeight: 'bold'}}>نظام إدارة مشاريع البناء العربي</span>
              <span>المشروع: {selectedProject?.name || 'غير محدد'} | الحالة: {selectedProject?.status === 'active' ? 'نشط' : 'متوقف'}</span>
              <span>تاريخ الطباعة: {new Date().toLocaleDateString('en-US')} - {new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};