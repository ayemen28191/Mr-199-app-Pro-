import { FileText } from 'lucide-react';

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
    carriedForward = 0
  } = data || {};

  // Debug logging
  console.log('🔍 ProfessionalDailyReport Data Debug:', {
    data,
    fundTransfers,
    workerAttendance,
    materialPurchases,
    transportationExpenses,
    carriedForward
  });

  const totalIncome = fundTransfers.reduce((sum: number, transfer: any) => {
    const amount = Number(transfer.amount) || 0;
    return sum + amount;
  }, 0);

  const totalWorkerCosts = workerAttendance.reduce((sum: number, attendance: any) => {
    const amount = Number(attendance.paidAmount) || 0;
    console.log('Worker attendance:', attendance, 'Amount:', amount);
    return sum + amount;
  }, 0);

  const totalMaterialCosts = materialPurchases.reduce((sum: number, purchase: any) => {
    const amount = Number(purchase.totalAmount) || 0;
    return sum + amount;
  }, 0);

  const totalTransportCosts = transportationExpenses.reduce((sum: number, expense: any) => {
    const amount = Number(expense.amount) || 0;
    console.log('Transport expense:', expense, 'Amount:', amount);
    return sum + amount;
  }, 0);

  const totalExpenses = totalWorkerCosts + totalMaterialCosts + totalTransportCosts;
  const remainingBalance = (carriedForward + totalIncome) - totalExpenses;

  console.log('📊 Calculated totals:', {
    totalIncome,
    totalWorkerCosts,
    totalMaterialCosts,
    totalTransportCosts,
    totalExpenses,
    remainingBalance
  });

  return (
    <div 
      id="professional-daily-report" 
      className="print-content bg-white" 
      style={{
        direction: 'rtl',
        width: '21cm',
        minHeight: '29.7cm',
        maxHeight: '29.7cm',
        overflow: 'hidden',
        pageBreakAfter: 'avoid',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      
      {/* Professional Header - Full Width */}
      <div className="professional-gradient preserve-color text-white" style={{padding: '10px 15px', margin: '0'}}>
        <div className="flex items-center justify-between">
          <div style={{width: '70px', height: '70px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
            <div style={{fontSize: '24px', fontWeight: 'bold', lineHeight: '1'}}>{new Date(selectedDate).getDate()}</div>
            <div style={{fontSize: '10px', opacity: '0.9'}}>{new Date(selectedDate).toLocaleDateString('en-US', {month: 'short'})}</div>
          </div>
          <div className="text-center flex-1" style={{margin: '0 20px'}}>
            <h1 style={{fontSize: '28px', fontWeight: 'bold', margin: '0', lineHeight: '1.2'}}>كشف المصروفات اليومية</h1>
            <p style={{fontSize: '16px', margin: '4px 0', opacity: '0.95'}}>مشروع: {selectedProject?.name || 'غير محدد'}</p>
            <p style={{fontSize: '14px', margin: '0', opacity: '0.85'}}>التاريخ: {formatDate(selectedDate)}</p>
          </div>
          <div style={{width: '70px', height: '70px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{fontSize: '11px', fontWeight: 'bold', textAlign: 'center'}}>رقم<br/>الكشف<br/>{Math.floor(Math.random() * 9999)}</div>
          </div>
        </div>
      </div>

      {/* Main Content - Maximize Space Usage */}
      <div style={{padding: '12px 15px', flex: '1', display: 'flex', flexDirection: 'column'}}>
        
        {/* Main Financial Summary Table */}
        <table className="w-full border-collapse" style={{fontSize: '13px', lineHeight: '1.6', marginBottom: '15px', border: '2px solid #1e40af'}}>
          <thead>
            <tr className="professional-gradient preserve-color" style={{color: '#1e293b'}}>
              <th style={{padding: '12px 8px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #cbd5e1', width: '8%', minHeight: '45px'}}>م.</th>
              <th style={{padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', border: '1px solid #cbd5e1', width: '40%', minHeight: '45px'}}>البيان والوصف</th>
              <th style={{padding: '12px 8px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #cbd5e1', width: '12%', minHeight: '45px'}}>العدد</th>
              <th style={{padding: '12px 8px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #cbd5e1', width: '18%', minHeight: '45px'}}>متوسط السعر</th>
              <th style={{padding: '12px 8px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #cbd5e1', width: '22%', minHeight: '45px'}}>إجمالي المبلغ (ر.ي)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{backgroundColor: '#f0f9ff', minHeight: '40px'}}>
              <td style={{padding: '10px 8px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: '600', minHeight: '40px'}}>01</td>
              <td style={{padding: '10px 8px', textAlign: 'right', border: '1px solid #e2e8f0', fontWeight: '500', minHeight: '40px'}}>الرصيد المرحل من اليوم السابق</td>
              <td style={{padding: '10px 8px', textAlign: 'center', border: '1px solid #e2e8f0', minHeight: '40px'}}>1</td>
              <td style={{padding: '10px 8px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: '600', color: '#0ea5e9', minHeight: '40px'}}>{formatCurrency(carriedForward)}</td>
              <td style={{padding: '10px 8px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#0ea5e9', fontSize: '14px', minHeight: '40px'}}>{formatCurrency(carriedForward)}</td>
            </tr>
            <tr style={{backgroundColor: '#f0fdf4', minHeight: '40px'}}>
              <td style={{padding: '10px 8px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: '600', minHeight: '40px'}}>02</td>
              <td style={{padding: '10px 8px', textAlign: 'right', border: '1px solid #e2e8f0', fontWeight: '500', minHeight: '40px'}}>تحويلات العهدة والإيرادات النقدية</td>
              <td style={{padding: '10px 8px', textAlign: 'center', border: '1px solid #e2e8f0', minHeight: '40px'}}>{fundTransfers.length}</td>
              <td style={{padding: '10px 8px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: '600', color: '#16a34a', minHeight: '40px'}}>{fundTransfers.length > 0 ? formatCurrency(Math.round(totalIncome / fundTransfers.length)) : '0 ر.ي'}</td>
              <td style={{padding: '10px 8px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#16a34a', fontSize: '14px', minHeight: '40px'}}>{formatCurrency(totalIncome)}</td>
            </tr>
            <tr style={{backgroundColor: '#fef3c7', borderTop: '2px solid #f59e0b', minHeight: '45px'}}>
              <td colSpan={4} style={{padding: '12px 8px', textAlign: 'right', border: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '15px', color: '#92400e', minHeight: '45px'}}>إجمالي الأموال المتاحة لليوم:</td>
              <td style={{padding: '12px 8px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#92400e', fontSize: '16px', backgroundColor: '#fbbf24', minHeight: '45px'}}>{formatCurrency(totalIncome + carriedForward)}</td>
            </tr>
            <tr style={{backgroundColor: '#fef2f2', minHeight: '40px'}}>
              <td style={{padding: '10px 8px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: '600', minHeight: '40px'}}>03</td>
              <td style={{padding: '10px 8px', textAlign: 'right', border: '1px solid #e2e8f0', fontWeight: '500', minHeight: '40px'}}>أجور العمال والحضور اليومي</td>
              <td style={{padding: '10px 8px', textAlign: 'center', border: '1px solid #e2e8f0', minHeight: '40px'}}>{workerAttendance.length}</td>
              <td style={{padding: '10px 8px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: '600', color: '#dc2626', minHeight: '40px'}}>{workerAttendance.length > 0 ? formatCurrency(Math.round(totalWorkerCosts / workerAttendance.length)) : '0 ر.ي'}</td>
              <td style={{padding: '10px 8px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#dc2626', fontSize: '14px', minHeight: '40px'}}>{formatCurrency(totalWorkerCosts)}</td>
            </tr>
            <tr style={{backgroundColor: '#ffffff', minHeight: '40px'}}>
              <td style={{padding: '10px 8px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: '600', minHeight: '40px'}}>04</td>
              <td style={{padding: '10px 8px', textAlign: 'right', border: '1px solid #e2e8f0', fontWeight: '500', minHeight: '40px'}}>مشتريات المواد والمعدات</td>
              <td style={{padding: '10px 8px', textAlign: 'center', border: '1px solid #e2e8f0', minHeight: '40px'}}>{materialPurchases.length}</td>
              <td style={{padding: '10px 8px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: '600', color: '#dc2626', minHeight: '40px'}}>{materialPurchases.length > 0 ? formatCurrency(Math.round(totalMaterialCosts / materialPurchases.length)) : '0 ر.ي'}</td>
              <td style={{padding: '10px 8px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#dc2626', fontSize: '14px', minHeight: '40px'}}>{formatCurrency(totalMaterialCosts)}</td>
            </tr>
            <tr style={{backgroundColor: '#fef2f2', minHeight: '40px'}}>
              <td style={{padding: '10px 8px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: '600', minHeight: '40px'}}>05</td>
              <td style={{padding: '10px 8px', textAlign: 'right', border: '1px solid #e2e8f0', fontWeight: '500', minHeight: '40px'}}>مصاريف النقل والتشغيل</td>
              <td style={{padding: '10px 8px', textAlign: 'center', border: '1px solid #e2e8f0', minHeight: '40px'}}>{transportationExpenses.length}</td>
              <td style={{padding: '10px 8px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: '600', color: '#dc2626', minHeight: '40px'}}>{transportationExpenses.length > 0 ? formatCurrency(Math.round(totalTransportCosts / transportationExpenses.length)) : '0 ر.ي'}</td>
              <td style={{padding: '10px 8px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#dc2626', fontSize: '14px', minHeight: '40px'}}>{formatCurrency(totalTransportCosts)}</td>
            </tr>
            <tr style={{backgroundColor: '#fee2e2', borderTop: '2px solid #dc2626', minHeight: '45px'}}>
              <td colSpan={4} style={{padding: '12px 8px', textAlign: 'right', border: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '15px', color: '#991b1b', minHeight: '45px'}}>إجمالي المصروفات اليومية:</td>
              <td style={{padding: '12px 8px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#991b1b', fontSize: '16px', backgroundColor: '#fca5a5', minHeight: '45px'}}>{formatCurrency(totalExpenses)}</td>
            </tr>
            <tr style={{backgroundColor: '#1e40af', color: 'white', minHeight: '50px'}}>
              <td colSpan={4} style={{padding: '15px 8px', textAlign: 'right', border: '1px solid #1e40af', fontWeight: 'bold', fontSize: '17px', minHeight: '50px'}}>الرصيد المتبقي في نهاية اليوم:</td>
              <td style={{padding: '15px 8px', textAlign: 'center', border: '1px solid #1e40af', fontWeight: 'bold', fontSize: '19px', minHeight: '50px'}}>{formatCurrency(remainingBalance)}</td>
            </tr>
          </tbody>
        </table>

        {/* Detailed Breakdown Section - Using Remaining Space */}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px', fontSize: '11px'}}>
          
          {/* Left Column - Fund Transfers & Workers */}
          <div>
            {fundTransfers.length > 0 && (
              <div style={{marginBottom: '12px'}}>
                <div className="professional-gradient" style={{padding: '6px 10px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px 4px 0 0', color: '#1e293b'}}>
                  تفاصيل التحويلات النقدية ({fundTransfers.length})
                </div>
                <table className="w-full border-collapse" style={{fontSize: '10px', border: '1px solid #e2e8f0'}}>
                  <thead>
                    <tr style={{backgroundColor: '#f8fafc', minHeight: '32px'}}>
                      <th style={{padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '9px', minHeight: '32px'}}>م</th>
                      <th style={{padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'right', fontSize: '9px', minHeight: '32px'}}>اسم المرسل</th>
                      <th style={{padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '9px', minHeight: '32px'}}>المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fundTransfers.slice(0, 5).map((transfer: any, index: number) => (
                      <tr key={index} style={{backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc', minHeight: '28px'}}>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', minHeight: '28px'}}>{index + 1}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'right', minHeight: '28px'}}>{transfer.senderName}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold', minHeight: '28px'}}>{formatCurrency(transfer.amount)}</td>
                      </tr>
                    ))}
                    {fundTransfers.length > 5 && (
                      <tr><td colSpan={3} style={{padding: '4px 6px', textAlign: 'center', fontSize: '9px', color: '#6b7280', fontStyle: 'italic', minHeight: '24px'}}>...و {fundTransfers.length - 5} تحويلات أخرى</td></tr>
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

          {/* Right Column - Materials & Transportation */}
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

            {transportationExpenses.length > 0 && (
              <div>
                <div className="professional-gradient" style={{padding: '6px 10px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px 4px 0 0', color: '#1e293b'}}>
                  تفاصيل مصاريف النقل ({transportationExpenses.length})
                </div>
                <table className="w-full border-collapse" style={{fontSize: '10px', border: '1px solid #e2e8f0'}}>
                  <thead>
                    <tr style={{backgroundColor: '#f8fafc', minHeight: '32px'}}>
                      <th style={{padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '9px', minHeight: '32px'}}>م</th>
                      <th style={{padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'right', fontSize: '9px', minHeight: '32px'}}>الوصف</th>
                      <th style={{padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '9px', minHeight: '32px'}}>المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transportationExpenses.slice(0, 5).map((expense: any, index: number) => (
                      <tr key={index} style={{backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc', minHeight: '28px'}}>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', minHeight: '28px'}}>{index + 1}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'right', minHeight: '28px'}}>{expense.description}</td>
                        <td style={{padding: '4px 6px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold', minHeight: '28px'}}>{formatCurrency(expense.amount)}</td>
                      </tr>
                    ))}
                    {transportationExpenses.length > 5 && (
                      <tr><td colSpan={3} style={{padding: '4px 6px', textAlign: 'center', fontSize: '9px', color: '#6b7280', fontStyle: 'italic', minHeight: '24px'}}>...و {transportationExpenses.length - 5} مصاريف أخرى</td></tr>
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
              <div><strong>إجمالي العمليات:</strong> {(fundTransfers.length + workerAttendance.length + materialPurchases.length + transportationExpenses.length)}</div>
              <div><strong>عدد العمال الحاضرين:</strong> {workerAttendance.filter((a: any) => a.isPresent).length}</div>
              <div><strong>عدد المشتريات:</strong> {materialPurchases.length}</div>
            </div>
            <div style={{textAlign: 'center'}}>
              <div style={{borderBottom: '2px solid #374151', width: '140px', marginBottom: '5px'}}></div>
              <div style={{fontSize: '11px', fontWeight: 'bold'}}>توقيع المسؤول المالي</div>
              <div style={{fontSize: '9px', color: '#6b7280', marginTop: '2px'}}>Financial Manager Signature</div>
            </div>
          </div>
          
          <div className="professional-gradient preserve-color text-white" style={{padding: '10px 15px', textAlign: 'center', fontSize: '12px', borderRadius: '6px'}}>
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