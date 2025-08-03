// مكون كشف حساب العامل المحسن للطباعة المهنية
// يعرض تفاصيل شاملة لحساب العامل مع تنسيق احترافي للطباعة

import { FileText, Building2, Calendar, User, FileSpreadsheet, Phone, MapPin, Banknote } from 'lucide-react';
import './worker-account-print.css';

// واجهة خصائص المكون - تحدد البيانات المطلوبة للتقرير
interface ProfessionalWorkerAccountReportProps {
  data: any;              // بيانات العامل الشاملة (الحضور، الحوالات، الملخص)
  selectedProject: any;   // بيانات المشروع المحدد
  workerId: string;       // معرف العامل الفريد
  dateFrom: string;       // تاريخ بداية التقرير
  dateTo: string;         // تاريخ نهاية التقرير
}

export const ProfessionalWorkerAccountReport = ({ 
  data, 
  selectedProject, 
  workerId, 
  dateFrom, 
  dateTo 
}: ProfessionalWorkerAccountReportProps) => {
  
  // دالة تنسيق العملة - تحويل الأرقام إلى صيغة مالية مقروءة بالريال اليمني
  const formatCurrency = (amount: number) => {
    const validAmount = isNaN(amount) || amount === null || amount === undefined ? 0 : Number(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(validAmount) + ' ر.ي';
  };

  // دالة تنسيق التاريخ - تحويل التاريخ إلى صيغة مقروءة بالإنجليزية
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // استخراج البيانات من المعاملات مع قيم افتراضية آمنة
  const {
    worker = {},          // بيانات العامل الأساسية
    attendance = [],      // سجل الحضور والغياب
    transfers = [],       // سجل الحوالات المرسلة
    summary = {}          // ملخص الحساب
  } = data || {};



  // حساب إجمالي الأجور المكتسبة - مجموع جميع الأجور اليومية
  const totalEarned = attendance.reduce((sum: number, record: any) => {
    const amount = Number(record.dailyWage) || 0;
    return sum + amount;
  }, 0);

  // حساب إجمالي المبالغ المدفوعة - مجموع ما تم دفعه فعلياً للعامل
  const totalPaid = attendance.reduce((sum: number, record: any) => {
    const amount = Number(record.paidAmount) || 0;
    return sum + amount;
  }, 0);

  // حساب إجمالي الحوالات المرسلة - مجموع المبالغ المحولة للأهل
  const totalTransferred = transfers.reduce((sum: number, transfer: any) => {
    const amount = Number(transfer.amount) || 0;
    return sum + amount;
  }, 0);

  // حساب الرصيد الحالي - الفرق بين المدفوع والمحول
  const currentBalance = totalPaid - totalTransferred;

  // حساب المبلغ المتبقي في ذمة الشركة - الفرق بين المكتسب والمدفوع
  const remainingDue = totalEarned - totalPaid;

  return (
    <div 
      id="professional-worker-account-report" 
      className="print-content bg-white enhanced-worker-account-report" 
      style={{
        direction: 'rtl',
        width: '100%',
        minHeight: '100vh',
        margin: '0',
        padding: '2mm',
        pageBreakAfter: 'avoid',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        lineHeight: '1.4'
      }}
    >
      
      {/* Compact Professional Header */}
      <div className="enhanced-header preserve-color" style={{padding: '3mm 0', margin: '0 0 2mm 0', border: '3px solid #7c3aed', borderRadius: '8px', background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)'}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8mm'}}>
          {/* Left Section - Main Title */}
          <div style={{flex: '2', textAlign: 'center'}}>
            <h1 style={{fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#7c3aed', textShadow: '1px 1px 2px rgba(0,0,0,0.1)'}}>كشف حساب العامل التفصيلي والشامل</h1>
          </div>
          
          {/* Right Section - Report Info & Year */}
          <div style={{display: 'flex', alignItems: 'center', gap: '8mm'}}>
            <div style={{textAlign: 'center', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: '8px 12px', borderRadius: '8px', minWidth: '80px'}}>
              <div style={{fontSize: '20px', fontWeight: 'bold', lineHeight: '1'}}>2025</div>
            </div>
            <div style={{textAlign: 'center', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '8px 12px', borderRadius: '8px', minWidth: '100px'}}>
              <div style={{fontSize: '12px', marginBottom: '2px'}}>تقرير رقم</div>
              <div style={{fontSize: '16px', fontWeight: 'bold'}}>{workerId?.slice(-4) || 'a076'}</div>
            </div>
          </div>
        </div>
        
        {/* Compact Info Row */}
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '8px', padding: '0 8mm', flexWrap: 'wrap'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', padding: '4px 12px', borderRadius: '15px', border: '1px solid #d1d5db', fontSize: '14px'}}>
            <Building2 style={{width: '14px', height: '14px', color: '#6b7280'}} />
            <span style={{fontWeight: '600', color: '#374151'}}>مشروع: {selectedProject?.name || 'غير محدد'}</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', padding: '4px 12px', borderRadius: '15px', border: '1px solid #d1d5db', fontSize: '14px'}}>
            <Calendar style={{width: '14px', height: '14px', color: '#6b7280'}} />
            <span style={{fontWeight: '600', color: '#374151'}}>من {formatDate(dateFrom)} إلى {formatDate(dateTo)}</span>
          </div>
        </div>
      </div>

      {/* Compact Worker Information in Single Row */}
      <div style={{display: 'flex', gap: '2mm', marginBottom: '3mm', background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)', padding: '8px', borderRadius: '8px', border: '2px solid #9ca3af'}}>
        <div style={{flex: '1', background: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db'}}>
          <h3 style={{fontSize: '16px', fontWeight: 'bold', color: '#374151', marginBottom: '6px', textAlign: 'center', background: '#f9fafb', padding: '4px', borderRadius: '4px'}}>بيانات العامل الأساسية</h3>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '14px'}}>
            <div><strong>الاسم:</strong> {worker.name || 'غير محدد'}</div>
            <div><strong>النوع:</strong> {worker.type || 'غير محدد'}</div>
            <div><strong>الراتب اليومي:</strong> {formatCurrency(Number(worker.dailyWage) || 0)}</div>
            <div><strong>الوظيفة:</strong> {worker.type || 'عامل'}</div>
          </div>
        </div>
        <div style={{flex: '1', background: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db'}}>
          <h3 style={{fontSize: '16px', fontWeight: 'bold', color: '#047857', marginBottom: '6px', textAlign: 'center', background: '#f0fdf4', padding: '4px', borderRadius: '4px'}}>الملخص المالي الإجمالي</h3>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '14px'}}>
            <div><strong>إجمالي المكتسب:</strong> <span style={{color: '#059669', fontWeight: 'bold'}}>{formatCurrency(totalEarned)}</span></div>
            <div><strong>إجمالي المدفوع:</strong> <span style={{color: '#0d9488', fontWeight: 'bold'}}>{formatCurrency(totalPaid)}</span></div>
            <div><strong>إجمالي المحول:</strong> <span style={{color: '#dc2626', fontWeight: 'bold'}}>{formatCurrency(totalTransferred)}</span></div>
            <div><strong>الرصيد الحالي:</strong> <span style={{color: currentBalance >= 0 ? '#059669' : '#dc2626', fontWeight: 'bold'}}>{formatCurrency(currentBalance)}</span></div>
          </div>
        </div>
      </div>

      {/* جدول سجل الحضور والأجور التفصيلي - محسن للطباعة المهنية */}
      <div style={{marginBottom: '5mm'}}>
        {/* عنوان قسم الحضور - ملون ومنسق بشكل احترافي */}
        <h2 style={{
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#1e40af', 
          marginBottom: '6px', 
          textAlign: 'center', 
          background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', 
          padding: '8px', 
          borderRadius: '8px', 
          border: '2px solid #1e40af'
        }}>
          سجل الحضور والأجور التفصيلي
        </h2>
        
        {/* الجدول الرئيسي - مصمم للطباعة مع كسر الصفحات المحسن */}
        <table 
          className="enhanced-summary-table print-table" 
          style={{
            width: '100%', 
            borderCollapse: 'collapse', 
            fontSize: '18px', 
            lineHeight: '1.4', 
            border: '3px solid #1e40af', 
            borderRadius: '8px', 
            overflow: 'hidden'
          }}
        >
          {/* رأس الجدول - يتكرر في كل صفحة عند الطباعة */}
          <thead className="print-header-repeat">
            <tr className="enhanced-header-row preserve-color" style={{
              background: 'linear-gradient(135deg, #1e40af, #3b82f6)', 
              color: '#ffffff', 
              height: '75px'
            }}>
              {/* عمود الرقم التسلسلي */}
              <th style={{
                padding: '12px 8px', 
                textAlign: 'center', 
                fontWeight: 'bold', 
                border: '2px solid #1e3a8a', 
                width: '8%', 
                fontSize: '20px'
              }}>
                م
              </th>
              
              {/* عمود التاريخ الميلادي */}
              <th style={{
                padding: '12px 12px', 
                textAlign: 'center', 
                fontWeight: 'bold', 
                border: '2px solid #1e3a8a', 
                width: '15%', 
                fontSize: '20px'
              }}>
                التاريخ الميلادي
              </th>
              
              {/* عمود وصف العمل - الأوسع لاستيعاب التفاصيل */}
              <th style={{
                padding: '12px 15px', 
                textAlign: 'right', 
                fontWeight: 'bold', 
                border: '2px solid #1e3a8a', 
                width: '27%', 
                fontSize: '20px'
              }}>
                وصف العمل المنجز والمهام اليومية
              </th>
              
              {/* عمود ساعات العمل */}
              <th style={{
                padding: '12px 8px', 
                textAlign: 'center', 
                fontWeight: 'bold', 
                border: '2px solid #1e3a8a', 
                width: '12%', 
                fontSize: '20px'
              }}>
                ساعات العمل
              </th>
              
              {/* عمود الأجر المستحق */}
              <th style={{
                padding: '12px 12px', 
                textAlign: 'center', 
                fontWeight: 'bold', 
                border: '2px solid #1e3a8a', 
                width: '18%', 
                fontSize: '20px'
              }}>
                الأجر اليومي المستحق
              </th>
              
              {/* عمود المبلغ المدفوع */}
              <th style={{
                padding: '12px 12px', 
                textAlign: 'center', 
                fontWeight: 'bold', 
                border: '2px solid #1e3a8a', 
                width: '20%', 
                fontSize: '20px'
              }}>
                المبلغ المدفوع فعلياً
              </th>
            </tr>
          </thead>
          
          {/* محتوى الجدول - بيانات الحضور اليومي */}
          <tbody>
            {attendance.map((record: any, index: number) => (
              <tr 
                key={record.id || index} 
                className="print-row-break-avoid" 
                style={{
                  background: index % 2 === 0 ? '#f8fafc' : 'white', 
                  minHeight: '65px', 
                  borderBottom: '1px solid #cbd5e1'
                }}
              >
                {/* رقم تسلسلي */}
                <td style={{
                  padding: '12px 8px', 
                  textAlign: 'center', 
                  border: '1px solid #cbd5e1', 
                  fontWeight: 'bold', 
                  fontSize: '18px', 
                  color: '#475569'
                }}>
                  {index + 1}
                </td>
                
                {/* التاريخ منسق */}
                <td style={{
                  padding: '12px 8px', 
                  textAlign: 'center', 
                  border: '1px solid #cbd5e1', 
                  fontSize: '17px', 
                  color: '#1e293b', 
                  fontWeight: '600'
                }}>
                  {formatDate(record.date)}
                </td>
                
                {/* وصف العمل مع تجاوز السطر للنصوص الطويلة */}
                <td style={{
                  padding: '12px 12px', 
                  textAlign: 'right', 
                  border: '1px solid #cbd5e1', 
                  fontSize: '17px', 
                  color: '#374151', 
                  lineHeight: '1.4',
                  wordWrap: 'break-word'
                }}>
                  {record.workDescription || 'عمل يومي عادي حسب متطلبات المشروع'}
                </td>
                
                {/* ساعات العمل مع عرض مرن */}
                <td style={{
                  padding: '12px 8px', 
                  textAlign: 'center', 
                  border: '1px solid #cbd5e1', 
                  fontSize: '17px', 
                  color: '#6b7280', 
                  fontWeight: 'bold'
                }}>
                  {record.startTime && record.endTime ? 
                    `${record.startTime} - ${record.endTime}` : 
                    '8 ساعات'
                  }
                </td>
                
                {/* الأجر المستحق بلون أخضر */}
                <td style={{
                  padding: '12px 12px', 
                  textAlign: 'center', 
                  border: '1px solid #cbd5e1', 
                  fontSize: '18px', 
                  color: '#059669', 
                  fontWeight: 'bold', 
                  background: '#f0fdf4'
                }}>
                  {formatCurrency(Number(record.dailyWage) || 0)}
                </td>
                
                {/* المبلغ المدفوع بلون مميز */}
                <td style={{
                  padding: '12px 12px', 
                  textAlign: 'center', 
                  border: '1px solid #cbd5e1', 
                  fontSize: '18px', 
                  color: '#0d9488', 
                  fontWeight: 'bold', 
                  background: '#f0fdfa'
                }}>
                  {formatCurrency(Number(record.paidAmount) || 0)}
                </td>
              </tr>
            ))}
          </tbody>
          
          {/* ذيل الجدول - الإجماليات */}
          <tfoot className="print-footer-repeat">
            <tr style={{
              background: 'linear-gradient(135deg, #10b981, #059669)', 
              color: 'white', 
              height: '65px'
            }}>
              <td 
                colSpan={4} 
                style={{
                  padding: '12px', 
                  textAlign: 'center', 
                  border: '2px solid #047857', 
                  fontWeight: 'bold', 
                  fontSize: '20px'
                }}
              >
                إجمالي الأجور والمدفوعات
              </td>
              <td style={{
                padding: '12px', 
                textAlign: 'center', 
                border: '2px solid #047857', 
                fontWeight: 'bold', 
                fontSize: '20px'
              }}>
                {formatCurrency(totalEarned)}
              </td>
              <td style={{
                padding: '12px', 
                textAlign: 'center', 
                border: '2px solid #047857', 
                fontWeight: 'bold', 
                fontSize: '20px'
              }}>
                {formatCurrency(totalPaid)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Enhanced Transfers Table */}
      {transfers && transfers.length > 0 && (
        <div style={{marginBottom: '5mm'}}>
          <h2 style={{fontSize: '24px', fontWeight: 'bold', color: '#dc2626', marginBottom: '6px', textAlign: 'center', background: 'linear-gradient(135deg, #fee2e2, #fecaca)', padding: '8px', borderRadius: '8px', border: '2px solid #dc2626'}}>سجل الحوالات المرسلة للأهل</h2>
          <table className="enhanced-summary-table" style={{width: '100%', borderCollapse: 'collapse', fontSize: '18px', lineHeight: '1.4', border: '3px solid #dc2626', borderRadius: '8px', overflow: 'hidden'}}>
            <thead>
              <tr className="enhanced-header-row preserve-color" style={{background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: '#ffffff', height: '75px'}}>
                <th style={{padding: '12px 8px', textAlign: 'center', fontWeight: 'bold', border: '2px solid #b91c1c', width: '8%', fontSize: '20px'}}>م</th>
                <th style={{padding: '12px 12px', textAlign: 'center', fontWeight: 'bold', border: '2px solid #b91c1c', width: '15%', fontSize: '20px'}}>تاريخ الحوالة</th>
                <th style={{padding: '12px 15px', textAlign: 'right', fontWeight: 'bold', border: '2px solid #b91c1c', width: '25%', fontSize: '20px'}}>اسم المستلم وتفاصيل الاستلام</th>
                <th style={{padding: '12px 12px', textAlign: 'center', fontWeight: 'bold', border: '2px solid #b91c1c', width: '15%', fontSize: '20px'}}>طريقة التحويل</th>
                <th style={{padding: '12px 12px', textAlign: 'center', fontWeight: 'bold', border: '2px solid #b91c1c', width: '15%', fontSize: '20px'}}>رقم الحوالة</th>
                <th style={{padding: '12px 12px', textAlign: 'center', fontWeight: 'bold', border: '2px solid #b91c1c', width: '22%', fontSize: '20px'}}>مبلغ الحوالة بالريال اليمني</th>
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

      {/* الملخص المالي النهائي المحسن - محسن للطباعة الاحترافية */}
      <div className="final-summary-container" style={{
        background: 'linear-gradient(135deg, #fef3c7, #fde68a)', 
        padding: '15px', 
        borderRadius: '12px', 
        border: '3px solid #f59e0b', 
        marginTop: '4mm'
      }}>
        {/* عنوان الملخص النهائي */}
        <h2 style={{
          fontSize: '26px', 
          fontWeight: 'bold', 
          color: '#92400e', 
          textAlign: 'center', 
          marginBottom: '12px'
        }}>
          الملخص المالي النهائي والحساب الشامل
        </h2>
        
        {/* شبكة البيانات المالية الأساسية */}
        <div style={{
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr 1fr', 
          gap: '12px', 
          fontSize: '20px',
          marginBottom: '15px'
        }}>
          {/* إجمالي المكتسب */}
          <div style={{
            background: '#ecfdf5', 
            padding: '12px', 
            borderRadius: '8px', 
            textAlign: 'center', 
            border: '2px solid #10b981'
          }}>
            <div style={{fontSize: '16px', color: '#047857', marginBottom: '6px'}}>إجمالي المكتسب</div>
            <div style={{fontSize: '22px', fontWeight: 'bold', color: '#059669'}}>{formatCurrency(totalEarned)}</div>
          </div>
          
          {/* إجمالي المدفوع */}
          <div style={{
            background: '#f0fdfa', 
            padding: '12px', 
            borderRadius: '8px', 
            textAlign: 'center', 
            border: '2px solid #0d9488'
          }}>
            <div style={{fontSize: '16px', color: '#0f766e', marginBottom: '6px'}}>إجمالي المدفوع</div>
            <div style={{fontSize: '22px', fontWeight: 'bold', color: '#0d9488'}}>{formatCurrency(totalPaid)}</div>
          </div>
          
          {/* المتبقي في ذمة الشركة */}
          <div style={{
            background: remainingDue > 0 ? '#fff7ed' : '#f0fdf4', 
            padding: '12px', 
            borderRadius: '8px', 
            textAlign: 'center', 
            border: `2px solid ${remainingDue > 0 ? '#ea580c' : '#10b981'}`
          }}>
            <div style={{fontSize: '16px', color: remainingDue > 0 ? '#c2410c' : '#047857', marginBottom: '6px'}}>
              المتبقي في ذمة الشركة
            </div>
            <div style={{fontSize: '22px', fontWeight: 'bold', color: remainingDue > 0 ? '#ea580c' : '#059669'}}>
              {formatCurrency(remainingDue)}
            </div>
          </div>
          
          {/* إجمالي المحول */}
          <div style={{
            background: '#fef2f2', 
            padding: '12px', 
            borderRadius: '8px', 
            textAlign: 'center', 
            border: '2px solid #dc2626'
          }}>
            <div style={{fontSize: '16px', color: '#991b1b', marginBottom: '6px'}}>إجمالي المحول للأهل</div>
            <div style={{fontSize: '22px', fontWeight: 'bold', color: '#dc2626'}}>{formatCurrency(totalTransferred)}</div>
          </div>
        </div>
        
        {/* الرصيد النهائي في صندوق منفصل */}
        <div style={{
          marginTop: '15px', 
          padding: '15px', 
          background: currentBalance >= 0 ? '#ecfdf5' : '#fef2f2', 
          borderRadius: '10px', 
          textAlign: 'center', 
          border: `3px solid ${currentBalance >= 0 ? '#10b981' : '#dc2626'}`
        }}>
          <div style={{
            fontSize: '22px', 
            color: currentBalance >= 0 ? '#047857' : '#991b1b', 
            marginBottom: '8px'
          }}>
            الرصيد النهائي الحالي للعامل
          </div>
          <div style={{
            fontSize: '36px', 
            fontWeight: 'bold', 
            color: currentBalance >= 0 ? '#059669' : '#dc2626'
          }}>
            {formatCurrency(currentBalance)}
          </div>
          <div style={{
            fontSize: '16px', 
            color: '#6b7280', 
            marginTop: '6px', 
            fontStyle: 'italic'
          }}>
            {currentBalance >= 0 ? 
              'رصيد إيجابي - للعامل مبلغ مستحق' : 
              'رصيد سالب - العامل مدين بمبلغ للشركة'
            }
          </div>
        </div>
        
        {/* ملاحظة توضيحية */}
        <div style={{
          marginTop: '12px', 
          padding: '10px', 
          background: '#f3f4f6', 
          borderRadius: '6px', 
          fontSize: '14px', 
          color: '#4b5563',
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          📊 الرصيد النهائي = (إجمالي المدفوع - إجمالي المحول للأهل) | 
          المتبقي في الذمة = (إجمالي المكتسب - إجمالي المدفوع)
        </div>
      </div>

      {/* تذييل التقرير المحسن - معلومات النظام والطباعة */}
      <div className="report-footer" style={{
        marginTop: '8mm', 
        padding: '12px', 
        borderTop: '2px solid #9ca3af', 
        background: '#f9fafb',
        borderRadius: '6px',
        textAlign: 'center', 
        fontSize: '14px', 
        color: '#6b7280'
      }}>
        {/* معلومات التقرير الأساسية */}
        <div style={{marginBottom: '8px', fontSize: '15px', fontWeight: '600', color: '#374151'}}>
          📋 كشف حساب العامل التفصيلي والشامل
        </div>
        
        {/* تفاصيل العامل والمشروع */}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '8px'}}>
          <div style={{textAlign: 'right'}}>
            <span style={{fontWeight: '600'}}>اسم العامل:</span> {worker.name || 'غير محدد'}
          </div>
          <div style={{textAlign: 'left'}}>
            <span style={{fontWeight: '600'}}>المشروع:</span> {selectedProject?.name || 'غير محدد'}
          </div>
        </div>
        
        {/* معلومات التاريخ والنظام */}
        <div style={{fontSize: '13px', color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: '8px'}}>
          <div>تم إنشاء هذا التقرير بتاريخ: {formatDate(new Date().toISOString().split('T')[0])}</div>
          <div style={{marginTop: '2px'}}>
            نظام إدارة المشاريع الإنشائية المتطور | فترة التقرير: {formatDate(dateFrom)} - {formatDate(dateTo)}
          </div>
          <div style={{marginTop: '2px', fontSize: '12px', fontStyle: 'italic'}}>
            تقرير محسن للطباعة الاحترافية مع دعم الصفحات المتعددة والألوان عالية الجودة
          </div>
        </div>
      </div>
    </div>
  );
};