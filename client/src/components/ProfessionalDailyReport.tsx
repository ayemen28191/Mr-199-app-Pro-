import { FileText } from 'lucide-react';

interface ProfessionalDailyReportProps {
  data: any;
  selectedProject: any;
  selectedDate: string;
}

export const ProfessionalDailyReport = ({ data, selectedProject, selectedDate }: ProfessionalDailyReportProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' ر.ي';
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
    fundTransfers = [],
    workerAttendance = [],
    materialPurchases = [],
    transportationExpenses = [],
    carriedForward = 0
  } = data || {};

  const totalIncome = fundTransfers.reduce((sum: number, transfer: any) => sum + (transfer.amount || 0), 0);
  const totalWorkerCosts = workerAttendance.reduce((sum: number, attendance: any) => sum + (attendance.paidAmount || 0), 0);
  const totalMaterialCosts = materialPurchases.reduce((sum: number, purchase: any) => sum + (purchase.totalAmount || 0), 0);
  const totalTransportCosts = transportationExpenses.reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0);
  const totalExpenses = totalWorkerCosts + totalMaterialCosts + totalTransportCosts;
  const remainingBalance = (carriedForward + totalIncome) - totalExpenses;

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
            <div style={{fontSize: '10px', opacity: '0.9'}}>{new Date(selectedDate).toLocaleDateString('ar-SA', {month: 'short'})}</div>
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
        <table className="w-full border-collapse" style={{fontSize: '12px', lineHeight: '1.4', marginBottom: '12px', border: '2px solid #1e40af'}}>
          <thead>
            <tr className="professional-gradient preserve-color text-white">
              <th style={{padding: '8px', textAlign: 'center', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.3)', width: '8%'}}>م.</th>
              <th style={{padding: '8px', textAlign: 'right', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.3)', width: '40%'}}>البيان والوصف</th>
              <th style={{padding: '8px', textAlign: 'center', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.3)', width: '12%'}}>العدد</th>
              <th style={{padding: '8px', textAlign: 'center', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.3)', width: '18%'}}>متوسط السعر</th>
              <th style={{padding: '8px', textAlign: 'center', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.3)', width: '22%'}}>إجمالي المبلغ (ر.ي)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{backgroundColor: '#f0f9ff'}}>
              <td style={{padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: '600'}}>01</td>
              <td style={{padding: '6px', textAlign: 'right', border: '1px solid #e2e8f0', fontWeight: '500'}}>الرصيد المرحل من اليوم السابق</td>
              <td style={{padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0'}}>1</td>
              <td style={{padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: '600', color: '#0ea5e9'}}>{formatCurrency(carriedForward)}</td>
              <td style={{padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#0ea5e9', fontSize: '13px'}}>{formatCurrency(carriedForward)}</td>
            </tr>
            <tr style={{backgroundColor: '#f0fdf4'}}>
              <td style={{padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: '600'}}>02</td>
              <td style={{padding: '6px', textAlign: 'right', border: '1px solid #e2e8f0', fontWeight: '500'}}>تحويلات العهدة والإيرادات النقدية</td>
              <td style={{padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0'}}>{fundTransfers.length}</td>
              <td style={{padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: '600', color: '#16a34a'}}>{fundTransfers.length > 0 ? formatCurrency(Math.round(totalIncome / fundTransfers.length)) : '0 ر.ي'}</td>
              <td style={{padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#16a34a', fontSize: '13px'}}>{formatCurrency(totalIncome)}</td>
            </tr>
            <tr style={{backgroundColor: '#fef3c7', borderTop: '2px solid #f59e0b'}}>
              <td colSpan={4} style={{padding: '8px', textAlign: 'right', border: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '14px', color: '#92400e'}}>إجمالي الأموال المتاحة لليوم:</td>
              <td style={{padding: '8px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#92400e', fontSize: '15px', backgroundColor: '#fbbf24'}}>{formatCurrency(totalIncome + carriedForward)}</td>
            </tr>
            <tr style={{backgroundColor: '#fef2f2'}}>
              <td style={{padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: '600'}}>03</td>
              <td style={{padding: '6px', textAlign: 'right', border: '1px solid #e2e8f0', fontWeight: '500'}}>أجور العمال والحضور اليومي</td>
              <td style={{padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0'}}>{workerAttendance.length}</td>
              <td style={{padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: '600', color: '#dc2626'}}>{workerAttendance.length > 0 ? formatCurrency(Math.round(totalWorkerCosts / workerAttendance.length)) : '0 ر.ي'}</td>
              <td style={{padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#dc2626', fontSize: '13px'}}>{formatCurrency(totalWorkerCosts)}</td>
            </tr>
            <tr style={{backgroundColor: '#ffffff'}}>
              <td style={{padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: '600'}}>04</td>
              <td style={{padding: '6px', textAlign: 'right', border: '1px solid #e2e8f0', fontWeight: '500'}}>مشتريات المواد والمعدات</td>
              <td style={{padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0'}}>{materialPurchases.length}</td>
              <td style={{padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: '600', color: '#dc2626'}}>{materialPurchases.length > 0 ? formatCurrency(Math.round(totalMaterialCosts / materialPurchases.length)) : '0 ر.ي'}</td>
              <td style={{padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#dc2626', fontSize: '13px'}}>{formatCurrency(totalMaterialCosts)}</td>
            </tr>
            <tr style={{backgroundColor: '#fef2f2'}}>
              <td style={{padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: '600'}}>05</td>
              <td style={{padding: '6px', textAlign: 'right', border: '1px solid #e2e8f0', fontWeight: '500'}}>مصاريف النقل والتشغيل</td>
              <td style={{padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0'}}>{transportationExpenses.length}</td>
              <td style={{padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: '600', color: '#dc2626'}}>{transportationExpenses.length > 0 ? formatCurrency(Math.round(totalTransportCosts / transportationExpenses.length)) : '0 ر.ي'}</td>
              <td style={{padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#dc2626', fontSize: '13px'}}>{formatCurrency(totalTransportCosts)}</td>
            </tr>
            <tr style={{backgroundColor: '#fee2e2', borderTop: '2px solid #dc2626'}}>
              <td colSpan={4} style={{padding: '8px', textAlign: 'right', border: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '14px', color: '#991b1b'}}>إجمالي المصروفات اليومية:</td>
              <td style={{padding: '8px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 'bold', color: '#991b1b', fontSize: '15px', backgroundColor: '#fca5a5'}}>{formatCurrency(totalExpenses)}</td>
            </tr>
            <tr style={{backgroundColor: '#1e40af', color: 'white'}}>
              <td colSpan={4} style={{padding: '10px', textAlign: 'right', border: '1px solid #1e40af', fontWeight: 'bold', fontSize: '16px'}}>الرصيد المتبقي في نهاية اليوم:</td>
              <td style={{padding: '10px', textAlign: 'center', border: '1px solid #1e40af', fontWeight: 'bold', fontSize: '18px'}}>{formatCurrency(remainingBalance)}</td>
            </tr>
          </tbody>
        </table>

        {/* Detailed Breakdown Section - Using Remaining Space */}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', fontSize: '10px'}}>
          
          {/* Left Column - Fund Transfers & Workers */}
          <div>
            {fundTransfers.length > 0 && (
              <div style={{marginBottom: '10px'}}>
                <div className="professional-gradient text-white" style={{padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px 4px 0 0'}}>
                  تفاصيل التحويلات النقدية ({fundTransfers.length})
                </div>
                <table className="w-full border-collapse" style={{fontSize: '9px', border: '1px solid #e2e8f0'}}>
                  <thead>
                    <tr style={{backgroundColor: '#f8fafc'}}>
                      <th style={{padding: '3px 5px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '8px'}}>م</th>
                      <th style={{padding: '3px 5px', border: '1px solid #e2e8f0', textAlign: 'right', fontSize: '8px'}}>اسم المرسل</th>
                      <th style={{padding: '3px 5px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '8px'}}>المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fundTransfers.slice(0, 5).map((transfer: any, index: number) => (
                      <tr key={index} style={{backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc'}}>
                        <td style={{padding: '2px 4px', border: '1px solid #e2e8f0', textAlign: 'center'}}>{index + 1}</td>
                        <td style={{padding: '2px 4px', border: '1px solid #e2e8f0', textAlign: 'right'}}>{transfer.senderName}</td>
                        <td style={{padding: '2px 4px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold'}}>{formatCurrency(transfer.amount)}</td>
                      </tr>
                    ))}
                    {fundTransfers.length > 5 && (
                      <tr><td colSpan={3} style={{padding: '2px 4px', textAlign: 'center', fontSize: '8px', color: '#6b7280', fontStyle: 'italic'}}>...و {fundTransfers.length - 5} تحويلات أخرى</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {workerAttendance.length > 0 && (
              <div>
                <div className="professional-gradient text-white" style={{padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px 4px 0 0'}}>
                  تفاصيل حضور العمال ({workerAttendance.length})
                </div>
                <table className="w-full border-collapse" style={{fontSize: '9px', border: '1px solid #e2e8f0'}}>
                  <thead>
                    <tr style={{backgroundColor: '#f8fafc'}}>
                      <th style={{padding: '3px 5px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '8px'}}>م</th>
                      <th style={{padding: '3px 5px', border: '1px solid #e2e8f0', textAlign: 'right', fontSize: '8px'}}>اسم العامل</th>
                      <th style={{padding: '3px 5px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '8px'}}>الأجر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workerAttendance.slice(0, 5).map((attendance: any, index: number) => (
                      <tr key={index} style={{backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc'}}>
                        <td style={{padding: '2px 4px', border: '1px solid #e2e8f0', textAlign: 'center'}}>{index + 1}</td>
                        <td style={{padding: '2px 4px', border: '1px solid #e2e8f0', textAlign: 'right'}}>{attendance.worker?.name || 'غير محدد'}</td>
                        <td style={{padding: '2px 4px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold'}}>{formatCurrency(attendance.paidAmount)}</td>
                      </tr>
                    ))}
                    {workerAttendance.length > 5 && (
                      <tr><td colSpan={3} style={{padding: '2px 4px', textAlign: 'center', fontSize: '8px', color: '#6b7280', fontStyle: 'italic'}}>...و {workerAttendance.length - 5} عمال آخرين</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column - Materials & Transportation */}
          <div>
            {materialPurchases.length > 0 && (
              <div style={{marginBottom: '10px'}}>
                <div className="professional-gradient text-white" style={{padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px 4px 0 0'}}>
                  تفاصيل مشتريات المواد ({materialPurchases.length})
                </div>
                <table className="w-full border-collapse" style={{fontSize: '9px', border: '1px solid #e2e8f0'}}>
                  <thead>
                    <tr style={{backgroundColor: '#f8fafc'}}>
                      <th style={{padding: '3px 5px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '8px'}}>م</th>
                      <th style={{padding: '3px 5px', border: '1px solid #e2e8f0', textAlign: 'right', fontSize: '8px'}}>اسم المادة</th>
                      <th style={{padding: '3px 5px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '8px'}}>التكلفة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialPurchases.slice(0, 5).map((purchase: any, index: number) => (
                      <tr key={index} style={{backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc'}}>
                        <td style={{padding: '2px 4px', border: '1px solid #e2e8f0', textAlign: 'center'}}>{index + 1}</td>
                        <td style={{padding: '2px 4px', border: '1px solid #e2e8f0', textAlign: 'right'}}>{purchase.material?.name || 'غير محدد'}</td>
                        <td style={{padding: '2px 4px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold'}}>{formatCurrency(purchase.totalAmount)}</td>
                      </tr>
                    ))}
                    {materialPurchases.length > 5 && (
                      <tr><td colSpan={3} style={{padding: '2px 4px', textAlign: 'center', fontSize: '8px', color: '#6b7280', fontStyle: 'italic'}}>...و {materialPurchases.length - 5} مواد أخرى</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {transportationExpenses.length > 0 && (
              <div>
                <div className="professional-gradient text-white" style={{padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px 4px 0 0'}}>
                  تفاصيل مصاريف النقل ({transportationExpenses.length})
                </div>
                <table className="w-full border-collapse" style={{fontSize: '9px', border: '1px solid #e2e8f0'}}>
                  <thead>
                    <tr style={{backgroundColor: '#f8fafc'}}>
                      <th style={{padding: '3px 5px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '8px'}}>م</th>
                      <th style={{padding: '3px 5px', border: '1px solid #e2e8f0', textAlign: 'right', fontSize: '8px'}}>الوصف</th>
                      <th style={{padding: '3px 5px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '8px'}}>المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transportationExpenses.slice(0, 5).map((expense: any, index: number) => (
                      <tr key={index} style={{backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc'}}>
                        <td style={{padding: '2px 4px', border: '1px solid #e2e8f0', textAlign: 'center'}}>{index + 1}</td>
                        <td style={{padding: '2px 4px', border: '1px solid #e2e8f0', textAlign: 'right'}}>{expense.description}</td>
                        <td style={{padding: '2px 4px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold'}}>{formatCurrency(expense.amount)}</td>
                      </tr>
                    ))}
                    {transportationExpenses.length > 5 && (
                      <tr><td colSpan={3} style={{padding: '2px 4px', textAlign: 'center', fontSize: '8px', color: '#6b7280', fontStyle: 'italic'}}>...و {transportationExpenses.length - 5} مصاريف أخرى</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Professional Footer - Banking & Signature */}
        <div style={{marginTop: 'auto', paddingTop: '12px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '11px', padding: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px'}}>
            <div style={{display: 'flex', gap: '25px', alignItems: 'center'}}>
              <div><strong>رقم الحساب البنكي:</strong> 1234567890123456</div>
              <div><strong>اسم البنك:</strong> البنك المحلي للتنمية والتسليف</div>
              <div><strong>IBAN:</strong> SA0312345678901234567890</div>
            </div>
            <div style={{textAlign: 'center'}}>
              <div style={{borderBottom: '2px solid #374151', width: '140px', marginBottom: '5px'}}></div>
              <div style={{fontSize: '10px', fontWeight: 'bold'}}>توقيع المسؤول المالي</div>
              <div style={{fontSize: '8px', color: '#6b7280', marginTop: '2px'}}>Financial Manager Signature</div>
            </div>
          </div>
          
          <div className="professional-gradient preserve-color text-white" style={{padding: '8px 15px', textAlign: 'center', fontSize: '11px', borderRadius: '6px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{fontWeight: 'bold'}}>نظام إدارة المشاريع الهندسية والإنشائية</span>
              <span>الهاتف: +967-123-456-789 | البريد: info@construction.ye</span>
              <span>تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')} - {new Date().toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'})}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};