import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Printer, Download, Building2, User, Calendar, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import '@/styles/print-reports.css';

interface Worker {
  id: string;
  name: string;
  type: string;
  dailyWage: string;
  projectId: string;
}

interface Project {
  id: string;
  name: string;
}

interface WorkerAttendance {
  id: string;
  date: string;
  present: boolean;
  hourlyWage: number;
  hoursWorked: number;
  totalWage: number;
  notes?: string;
}

interface WorkerTransfer {
  id: string;
  amount: number;
  transferDate: string;
  recipientName: string;
  notes?: string;
  type: 'advance' | 'salary' | 'deduction';
}

interface WorkerBalance {
  totalEarned: number;
  totalTransfers: number;
  currentBalance: number;
  previousBalance: number;
}

interface WorkerStatement {
  worker: Worker;
  project: Project;
  attendance: WorkerAttendance[];
  transfers: WorkerTransfer[];
  balance: WorkerBalance;
  periodSummary: {
    totalDaysWorked: number;
    totalHoursWorked: number;
    totalEarnings: number;
    totalAdvances: number;
    netBalance: number;
  };
}

export default function ProfessionalWorkerStatement() {
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return format(date, 'yyyy-MM-dd');
  });
  const [dateTo, setDateTo] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [showReport, setShowReport] = useState(false);

  // Fetch workers
  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ['/api/workers'],
  });

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Fetch worker statement data - استخدام endpoint الصحيح مع الحوالات
  const { data: workerStatement, isLoading: isLoadingStatement } = useQuery<WorkerStatement | null>({
    queryKey: ['/api/worker-statement', selectedWorkerId, selectedProjectId, dateFrom, dateTo],
    queryFn: async (): Promise<WorkerStatement | null> => {
      if (!selectedWorkerId || !selectedProjectId) return null;
      
      const params = new URLSearchParams();
      params.append('projectId', selectedProjectId);  
      params.append('dateFrom', dateFrom);
      params.append('dateTo', dateTo);
      params.append('projects', selectedProjectId); // المعامل المطلوب
      
      const response = await fetch(`/api/worker-statement/${selectedWorkerId}?${params}`);
      if (!response.ok) {
        throw new Error('فشل في جلب بيانات كشف الحساب');
      }
      
      const data = await response.json();
      const worker = workers.find(w => w.id === selectedWorkerId);
      const project = projects.find(p => p.id === selectedProjectId);
      
      if (!worker || !project) {
        throw new Error('بيانات العامل أو المشروع غير موجودة');
      }

      // حساب ملخص الفترة
      const totalDaysWorked = data.attendance?.filter((a: any) => a.isPresent).length || 0;
      const totalHoursWorked = data.attendance?.reduce((sum: number, a: any) => 
        sum + (a.isPresent ? 8 : 0), 0) || 0;
      const totalEarnings = data.attendance?.reduce((sum: number, a: any) => 
        sum + (a.isPresent ? Number(a.actualWage || 0) : 0), 0) || 0;
      const totalAdvances = data.transfers?.reduce((sum: number, t: any) => 
        sum + Number(t.amount || 0), 0) || 0;

      return {
        worker: data.worker,
        project: data.projects?.[0] || project,
        attendance: data.attendance || [],
        transfers: data.transfers || [],
        balance: data.balance || { 
          totalEarned: totalEarnings, 
          totalTransfers: totalAdvances, 
          currentBalance: totalEarnings - totalAdvances,
          previousBalance: 0 
        },
        periodSummary: {
          totalDaysWorked,
          totalHoursWorked,
          totalEarnings,
          totalAdvances,
          netBalance: totalEarnings - totalAdvances
        }
      };
    },
    enabled: !!selectedWorkerId && !!selectedProjectId && !!dateFrom && !!dateTo && showReport,
  });

  const generateReport = () => {
    if (!selectedWorkerId || !selectedProjectId) {
      alert('يرجى اختيار العامل والمشروع');
      return;
    }
    setShowReport(true);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('professional-statement-print');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>كشف حساب العامل - ${workerStatement?.worker.name}</title>
          <style>
            @page {
              size: A4;
              margin: 8mm;
            }
            body {
              font-family: 'Arial', sans-serif;
              direction: rtl;
              margin: 0;
              padding: 0;
              font-size: 10px;
              line-height: 1.2;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #1e40af;
              padding-bottom: 6px;
              margin-bottom: 12px;
            }
            .company-name {
              font-size: 16px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 2px;
            }
            .document-title {
              font-size: 13px;
              font-weight: bold;
              margin-bottom: 4px;
              color: #374151;
            }
            .period-info {
              font-size: 9px;
              color: #6b7280;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 12px;
            }
            .info-section {
              border: 1px solid #d1d5db;
              padding: 6px;
              border-radius: 3px;
              background-color: #f9fafb;
            }
            .info-title {
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 4px;
              font-size: 10px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 2px;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
              font-size: 9px;
            }
            .info-label {
              color: #6b7280;
            }
            .info-value {
              font-weight: bold;
              color: #374151;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 8px;
              font-size: 8px;
            }
            .data-table th,
            .data-table td {
              border: 1px solid #d1d5db;
              padding: 2px 4px;
              text-align: center;
            }
            .data-table th {
              background-color: #f3f4f6;
              font-weight: bold;
              font-size: 8px;
              color: #1e40af;
            }
            .data-table td {
              font-size: 8px;
            }
            .summary-section {
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              border: 2px solid #1e40af;
              padding: 8px;
              border-radius: 5px;
              margin-top: 8px;
            }
            .summary-title {
              font-size: 11px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 6px;
              text-align: center;
              border-bottom: 1px solid #1e40af;
              padding-bottom: 2px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 8px;
            }
            .summary-item {
              text-align: center;
              background-color: white;
              padding: 4px;
              border-radius: 3px;
              border: 1px solid #e5e7eb;
            }
            .summary-label {
              font-size: 8px;
              color: #6b7280;
              margin-bottom: 1px;
            }
            .summary-value {
              font-size: 10px;
              font-weight: bold;
            }
            .footer {
              margin-top: 10px;
              text-align: center;
              font-size: 7px;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
              padding-top: 4px;
            }
            .currency {
              font-weight: bold;
            }
            .positive { color: #059669; }
            .negative { color: #dc2626; }
            .section-title {
              font-size: 9px;
              font-weight: bold;
              margin: 8px 0 4px 0;
              color: #1e40af;
              background-color: #f0f9ff;
              padding: 2px 6px;
              border-right: 3px solid #1e40af;
            }
            .present { color: #059669; }
            .absent { color: #dc2626; }
            .working-hours {
              font-weight: bold;
              color: #1e40af;
            }
            .row-alternate:nth-child(even) {
              background-color: #f9fafb;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.print();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ar });
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <FileText className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">كشف حساب العامل الاحترافي</h1>
          <p className="text-muted-foreground">
            كشف حساب شامل ومفصل للعامل في صفحة A4 واحدة
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            إعدادات الكشف
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="worker">العامل</Label>
              <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر العامل" />
                </SelectTrigger>
                <SelectContent>
                  {workers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.name} - {worker.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="project">المشروع</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المشروع" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateFrom">من تاريخ</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dateTo">إلى تاريخ</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={generateReport} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              إنشاء الكشف
            </Button>
            
            {workerStatement && (
              <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                طباعة
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Professional Statement Display */}
      {isLoadingStatement && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">جاري تحميل البيانات...</div>
          </CardContent>
        </Card>
      )}

      {workerStatement && (
        <div id="professional-statement-print" className="worker-statement-container bg-white">
          {/* Header */}
          <div className="worker-statement-header">
            كشف حساب العامل الشامل - الفترة من {formatDate(dateFrom)} إلى {formatDate(dateTo)}
          </div>

          {/* Worker and Project Info */}
          <div className="worker-info-section">
            <div>
              <strong>العامل:</strong> {workerStatement.worker.name} ({workerStatement.worker.type})
            </div>
            <div>
              <strong>المشروع:</strong> {workerStatement.project.name}
            </div>
            <div>
              <strong>الأجر اليومي:</strong> {formatCurrency(Number(workerStatement.worker.dailyWage))} ريال
            </div>
            <div>
              <strong>أيام العمل:</strong> {workerStatement.periodSummary.totalDaysWorked} يوم
            </div>
          </div>

          {/* عرض جميع الحوالات بشكل مباشر */}
          <div style={{ margin: '10px 0', padding: '15px', backgroundColor: '#fff3e0', border: '3px solid #ff9800', borderRadius: '8px' }}>
            <h3 style={{ color: '#e65100', margin: '0 0 15px 0', textAlign: 'center' }}>حوالات الأهل للعامل</h3>
            {workerStatement?.transfers && workerStatement.transfers.length > 0 ? (
              <div>
                <p style={{ color: '#d84315', fontWeight: 'bold', marginBottom: '10px' }}>
                  عدد الحوالات: {workerStatement.transfers.length} | 
                  إجمالي المبلغ: {formatCurrency(workerStatement.transfers.reduce((sum, t) => sum + Number(t.amount), 0))}
                </p>
                {workerStatement.transfers.map((transfer, index) => (
                  <div key={index} style={{ 
                    padding: '10px', 
                    backgroundColor: '#fff', 
                    margin: '8px 0', 
                    border: '2px solid #ff9800',
                    borderRadius: '6px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#e65100' }}>
                        📅 {transfer.transferDate}
                      </span>
                      <span style={{ fontWeight: 'bold', color: '#2e7d32', fontSize: '18px' }}>
                        💰 {formatCurrency(Number(transfer.amount))}
                      </span>
                    </div>
                    <div style={{ marginTop: '5px', color: '#424242' }}>
                      <strong>المرسل:</strong> {transfer.senderName} | 
                      <strong> المستقبل:</strong> {transfer.recipientName}
                    </div>
                    <div style={{ marginTop: '5px', color: '#616161', fontSize: '12px' }}>
                      📝 {transfer.notes || 'بدون ملاحظات'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#d32f2f', textAlign: 'center', fontWeight: 'bold' }}>
                لا توجد حوالات أهل مسجلة للعامل في هذه الفترة
              </p>
            )}
          </div>

          {/* Combined Attendance and Transfers Table */}
          <table className="worker-statement-table">
            <thead>
              <tr>
                <th style={{ width: '10%' }}>التاريخ</th>
                <th style={{ width: '8%' }}>اليوم</th>
                <th style={{ width: '8%' }}>حضور</th>
                <th style={{ width: '8%' }}>أيام</th>
                <th style={{ width: '10%' }}>أجر يومي</th>
                <th style={{ width: '10%' }}>إجمالي</th>
                <th style={{ width: '10%' }}>مدفوع</th>
                <th style={{ width: '10%' }}>سلفة</th>
                <th style={{ width: '10%' }}>حوالة أهل</th>
                <th style={{ width: '8%' }}>رصيد</th>
                <th style={{ width: '8%' }}>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // جمع جميع السجلات (حضور + حوالات) وترتيبها بالتاريخ
                const allRecords: any[] = [];
                
                // إضافة سجلات الحضور
                workerStatement.attendance.forEach(att => {
                  allRecords.push({ ...att, type: 'attendance', date: att.date });
                });
                
                // إضافة سجلات الحوالات
                workerStatement.transfers.forEach(transfer => {
                  allRecords.push({ ...transfer, type: 'transfer', date: transfer.transferDate });
                });
                
                // ترتيب حسب التاريخ
                allRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                return allRecords.slice(0, 20).map((record, index) => {
                  const recordDate = new Date(record.date);
                  const dayName = recordDate.toLocaleDateString('ar-SA', { weekday: 'short' });
                  
                  if (record.type === 'attendance') {
                    return (
                      <tr key={`${record.date}-${index}`} style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                        <td className="date-cell">{formatDate(record.date)}</td>
                        <td>{dayName}</td>
                        <td>{record.isPresent ? '✓' : '-'}</td>
                        <td>{record.workDays || '1'}</td>
                        <td className="currency-cell">{formatCurrency(Number(record.dailyWage || 0))}</td>
                        <td className="currency-cell">{formatCurrency(Number(record.actualWage || 0))}</td>
                        <td className="currency-cell">{formatCurrency(Number(record.paidAmount || 0))}</td>
                        <td className="currency-cell">-</td>
                        <td className="currency-cell">-</td>
                        <td className="currency-cell">{formatCurrency(Number(record.remainingAmount || 0))}</td>
                        <td style={{ fontSize: '6px' }}>{record.notes || '-'}</td>
                      </tr>
                    );
                  } else {
                    // صف الحوالة
                    return (
                      <tr key={`${record.date}-${index}`} style={{ backgroundColor: '#fff8e1' }}>
                        <td className="date-cell">{formatDate(record.date)}</td>
                        <td>{dayName}</td>
                        <td>حوالة أهل</td>
                        <td>-</td>
                        <td className="currency-cell">-</td>
                        <td className="currency-cell">0</td>
                        <td className="currency-cell">-</td>
                        <td className="currency-cell">-</td>
                        <td className="currency-cell" style={{ backgroundColor: '#ffb74d', fontWeight: 'bold' }}>
                          {formatCurrency(Number(record.amount))}
                        </td>
                        <td className="currency-cell" style={{ backgroundColor: '#ffcdd2', fontWeight: 'bold' }}>
                          -{formatCurrency(Number(record.amount))}
                        </td>
                        <td style={{ fontSize: '6px' }}>حوالة: {record.notes || 'بدون ملاحظات'}</td>
                      </tr>
                    );
                  }
                });
              })()}
            </tbody>
          </table>
          
          {(workerStatement.attendance.length + workerStatement.transfers.length) > 20 && (
            <div style={{ fontSize: '6px', textAlign: 'center', color: '#6b7280', marginTop: '2px' }}>
              عرض أول 20 سجل فقط
            </div>
          )}

          {/* Summary Section */}
          <div className="summary-section">
            <div className="summary-title">📊 الملخص المالي الشامل للفترة</div>
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-label">💼 إجمالي الأجور المستحقة</div>
                <div className="summary-value positive">{formatCurrency(workerStatement.periodSummary.totalEarnings)} ريال</div>
                <div style={{ fontSize: '7px', color: '#6b7280' }}>
                  ({workerStatement.periodSummary.totalDaysWorked} أيام عمل)
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-label">💸 إجمالي السلف والحوالات</div>
                <div className="summary-value negative">{formatCurrency(workerStatement.periodSummary.totalAdvances)} ريال</div>
                <div style={{ fontSize: '7px', color: '#6b7280' }}>
                  ({workerStatement.transfers.length} عملية - تتضمن حوالات الأهل)
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-label">🏦 الرصيد الصافي المستحق</div>
                <div className={`summary-value ${workerStatement.periodSummary.netBalance >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(workerStatement.periodSummary.netBalance)} ريال
                </div>
                <div style={{ fontSize: '7px', color: '#6b7280' }}>
                  {workerStatement.periodSummary.netBalance >= 0 ? 'للعامل' : 'على العامل'}
                </div>
              </div>
            </div>
            
            {/* Additional Statistics */}
            <div style={{ 
              marginTop: '8px', 
              paddingTop: '6px', 
              borderTop: '1px solid #e5e7eb',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '6px',
              fontSize: '8px',
              textAlign: 'center'
            }}>
              <div>
                <strong>متوسط الأجر اليومي:</strong><br/>
                {workerStatement.periodSummary.totalDaysWorked > 0 
                  ? formatCurrency(workerStatement.periodSummary.totalEarnings / workerStatement.periodSummary.totalDaysWorked)
                  : '0'} ريال
              </div>
              <div>
                <strong>إجمالي ساعات العمل:</strong><br/>
                {workerStatement.periodSummary.totalHoursWorked} ساعة
              </div>
              <div>
                <strong>متوسط الساعات اليومية:</strong><br/>
                {workerStatement.periodSummary.totalDaysWorked > 0 
                  ? (workerStatement.periodSummary.totalHoursWorked / workerStatement.periodSummary.totalDaysWorked).toFixed(1)
                  : '0'} ساعة
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            <div>📋 تم إنشاء هذا الكشف آلياً من نظام إدارة مشاريع البناء المتطور</div>
            <div>🕐 تاريخ الإنشاء: {formatDate(new Date().toISOString())} | ✅ جميع البيانات حقيقية ومأخوذة من قاعدة البيانات الأساسية</div>
            <div>📞 للاستفسار: 0533366543 | 🏢 إدارة المشاريع والحسابات</div>
          </div>
        </div>
      )}
    </div>
  );
}