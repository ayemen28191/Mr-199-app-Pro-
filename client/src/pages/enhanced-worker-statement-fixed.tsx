import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Calculator, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Worker {
  id: string;
  name: string;
  type: string;
  dailyWage: string;
}

interface Project {
  id: string;
  name: string;
}

interface WorkerStatement {
  projectId: string;
  projectName: string;
  attendance: any[];
}

interface FamilyTransfer {
  id: string;
  projectName: string;
  amount: string;
  transferDate: string;
  recipientName: string;
  notes?: string;
}

export default function EnhancedWorkerStatement() {
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return format(date, 'yyyy-MM-dd');
  });
  const [dateTo, setDateTo] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [showReport, setShowReport] = useState(false);
  const [workerStatement, setWorkerStatement] = useState<WorkerStatement[] | null>(null);
  const [familyTransfers, setFamilyTransfers] = useState<FamilyTransfer[]>([]);

  const queryClient = useQueryClient();

  // Fetch workers
  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ['/api/workers'],
  });

  // Fetch worker projects when worker is selected
  const { data: workerProjects = [] } = useQuery<Project[]>({
    queryKey: ['/api/workers', selectedWorkerId, 'projects'],
    enabled: !!selectedWorkerId,
  });

  // Fetch family transfers for the worker
  const { data: workerFamilyTransfers = [] } = useQuery<FamilyTransfer[]>({
    queryKey: ['/api/workers', selectedWorkerId, 'transfers'],
    enabled: !!selectedWorkerId,
  });

  // Handle worker selection
  useEffect(() => {
    if (selectedWorkerId) {
      const worker = workers.find(w => w.id === selectedWorkerId);
      setSelectedWorker(worker || null);
    } else {
      setSelectedWorker(null);
      setSelectedProjectIds([]);
    }
  }, [selectedWorkerId, workers]);

  // Update family transfers when data changes
  useEffect(() => {
    setFamilyTransfers(workerFamilyTransfers);
  }, [workerFamilyTransfers]);

  // Handle project selection
  const handleProjectSelection = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjectIds(prev => [...prev, projectId]);
    } else {
      setSelectedProjectIds(prev => prev.filter(id => id !== projectId));
    }
  };

  // Generate report
  const generateReport = async () => {
    if (!selectedWorkerId || selectedProjectIds.length === 0) return;

    try {
      console.log("إنشاء كشف حساب العامل:", {
        workerId: selectedWorkerId,
        projectIds: selectedProjectIds,
        dateFrom,
        dateTo
      });

      // استخدام المعاملات الصحيحة التي يتوقعها الخادم
      const params = new URLSearchParams();
      params.append('dateFrom', dateFrom);
      params.append('dateTo', dateTo);
      
      // للمشاريع المتعددة، نحتاج لاستدعاء API منفصل لكل مشروع
      const statementPromises = selectedProjectIds.map(async (projectId) => {
        const projectParams = new URLSearchParams();
        projectParams.append('projectId', projectId);
        projectParams.append('dateFrom', dateFrom);
        projectParams.append('dateTo', dateTo);
        
        const response = await fetch(`/api/workers/${selectedWorkerId}/account-statement?${projectParams}`);
        if (!response.ok) {
          throw new Error(`فشل في جلب بيانات المشروع ${projectId}`);
        }
        
        const data = await response.json();
        const project = workerProjects.find(p => p.id === projectId);
        
        return {
          projectId,
          projectName: project?.name || 'مشروع غير معروف',
          attendance: data.attendance || [],
          transfers: data.transfers || [],
          balance: data.balance
        };
      });

      const statements = await Promise.all(statementPromises);
      setWorkerStatement(statements);
      setShowReport(true);
      
      console.log("تم إنشاء كشف الحساب بنجاح:", statements);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('حدث خطأ أثناء إنشاء كشف الحساب');
    }
  };

  // Print report
  const printReport = () => {
    window.print();
  };

  // Export to Excel (CSV)
  const exportToExcel = () => {
    if (!workerStatement || !selectedWorker || workerStatement.length === 0) {
      alert("لا توجد بيانات للتصدير");
      return;
    }

    try {
      const headers = [
        'م', 'اسم المشروع', 'التاريخ', 'الأجر اليومي', 'ساعات العمل', 
        'المبلغ المستحق', 'المبلغ المستلم', 'المتبقي', 'ملاحظات'
      ];
      
      let rowIndex = 1;
      const rows: any[] = [];
      let grandTotalEarned = 0;
      let grandTotalPaid = 0;
      let grandTotalRemaining = 0;
      let grandTotalHours = 0;

      workerStatement.forEach((projectStatement: any) => {
        const attendance = projectStatement.attendance || [];
        
        attendance.forEach((record: any) => {
          const workingHours = calculateWorkingHours(record.startTime, record.endTime);
          const dailyWage = parseFloat(record.dailyWage || '0');
          const paidAmount = parseFloat(record.paidAmount || '0');
          const remainingAmount = parseFloat(record.remainingAmount || '0');
          
          grandTotalEarned += dailyWage;
          grandTotalPaid += paidAmount;
          grandTotalRemaining += remainingAmount;
          grandTotalHours += workingHours;

          rows.push([
            rowIndex++,
            projectStatement.projectName,
            formatDate(record.date),
            formatCurrency(dailyWage),
            formatHours(workingHours),
            formatCurrency(dailyWage),
            formatCurrency(paidAmount),
            formatCurrency(remainingAmount),
            record.workDescription || ''
          ]);
        });
      });

      const csvContent = [headers, ...rows]
        .map(row => row.map((cell: any) => `"${String(cell || '')}"`).join(','))
        .join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `كشف_حساب_${selectedWorker.name}_${dateFrom}_${dateTo}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export error:', error);
      alert('حدث خطأ أثناء التصدير');
    }
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy/MM/dd', { locale: ar });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-YE', {
      style: 'currency',
      currency: 'YER',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)} ساعة`;
  };

  const calculateWorkingHours = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 8;
    
    try {
      const start = new Date(`2000-01-01 ${startTime}`);
      const end = new Date(`2000-01-01 ${endTime}`);
      const diffMs = end.getTime() - start.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return Math.max(0, diffHours);
    } catch {
      return 8;
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Print-specific styles */}
      <style>{`
        @media print {
          /* قواعد عامة للطباعة */
          @page {
            size: A4 landscape;
            margin: 0.4in 0.2in;
          }
          
          body { 
            margin: 0 !important; 
            padding: 0 !important; 
            font-size: 10px !important; 
            font-family: Arial, sans-serif !important;
            background: white !important;
          }
          
          * { 
            box-sizing: border-box; 
            color: black !important;
          }
          
          /* إخفاء عناصر غير مرغوبة */
          .print\\:hidden, button, .no-print {
            display: none !important;
          }
          
          /* تخطيط الصفحة الرئيسي */
          .max-w-7xl {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* العنوان الرئيسي */
          .print-title { 
            font-size: 16px !important; 
            font-weight: bold !important;
            text-align: center !important;
            margin-bottom: 8px !important;
            color: black !important;
          }
          
          /* معلومات العامل */
          .print-info { 
            font-size: 12px !important; 
            margin: 2px 0 !important; 
            line-height: 1.3 !important;
          }
          
          /* الجدول الرئيسي */
          table { 
            width: 100% !important; 
            border-collapse: collapse !important; 
            margin: 5px 0 !important; 
            font-size: 9px !important;
            table-layout: auto !important;
          }
          
          /* خلايا الجدول */
          th, td { 
            padding: 3px 2px !important; 
            border: 1px solid #000 !important; 
            font-size: 9px !important; 
            line-height: 1.2 !important; 
            text-align: center !important;
            vertical-align: middle !important;
            overflow: hidden;
            word-wrap: break-word;
          }
          
          /* ترويسة الجدول */
          th { 
            font-weight: bold !important; 
            background-color: #ffa500 !important; 
            font-size: 10px !important;
            color: black !important;
            height: 20px !important;
          }
          
          /* صفوف البيانات */
          td {
            height: 18px !important;
            min-height: 18px !important;
          }
          
          /* الصفوف الخاصة */
          .bg-orange-100 th, 
          .bg-orange-100 td { 
            background-color: #ffcc80 !important; 
            font-weight: bold !important; 
          }
          
          .bg-purple-200 td { 
            background-color: #e1bee7 !important; 
            font-weight: bold !important;
          }
          
          .bg-purple-50 td { 
            background-color: #f3e5f5 !important; 
          }
          
          .bg-green-100 th,
          .bg-green-100 td {
            background-color: #c8e6c9 !important;
            font-weight: bold !important;
          }
          
          .bg-blue-100 th,
          .bg-blue-100 td {
            background-color: #bbdefb !important;
          }
          
          /* تحسين استغلال العرض */
          .w-8 { width: 5% !important; min-width: 30px !important; }
          .w-16 { width: 8% !important; min-width: 50px !important; }
          .w-20 { width: 10% !important; min-width: 60px !important; }
          .w-24 { width: 12% !important; min-width: 70px !important; }
          .w-32 { width: 15% !important; min-width: 90px !important; }
          
          /* كسر الصفحات */
          .page-break {
            page-break-before: always;
          }
          
          .avoid-break {
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Controls Card - Hidden when report is shown */}
      {!showReport && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              كشف حساب العامل المحسن
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Worker Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="worker">اختيار العامل *</Label>
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

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-2">
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
            </div>

            {/* Project Selection */}
            {selectedWorkerId && workerProjects.length > 0 && (
              <div>
                <Label>اختيار المشاريع *</Label>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-3">
                  {workerProjects.map((project) => (
                    <div key={project.id} className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Checkbox
                        id={project.id}
                        checked={selectedProjectIds.includes(project.id)}
                        onCheckedChange={(checked) => handleProjectSelection(project.id, checked as boolean)}
                      />
                      <Label htmlFor={project.id} className="text-sm font-normal cursor-pointer">
                        {project.name}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  يمكنك اختيار مشروع واحد أو أكثر لعرض كشف حساب شامل
                </p>
              </div>
            )}

            {/* Generate Report Button */}
            <div className="flex gap-2">
              <Button 
                onClick={generateReport}
                disabled={!selectedWorkerId || !dateFrom || !dateTo || selectedProjectIds.length === 0}
                className="flex-1"
              >
                <Calculator className="mr-2 h-4 w-4" />
                إنشاء الكشف
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Report */}
      {showReport && workerStatement && selectedWorker && (
        <div className="w-full bg-white print:bg-white">
          {/* Enhanced Report Header */}
          <div className="text-center mb-6 print:mb-3 border-b-2 border-orange-400 pb-4 print:pb-2">
            <h1 className="text-3xl font-bold mb-2 text-orange-600 print:text-2xl print-title">
              إدارة المشاريع الإنشائية
            </h1>
            <p className="text-sm text-gray-600 mb-3 print:text-xs print:mb-1 print-info">
              هاتف: +967700123456 | البريد الإلكتروني: info@construction.ye | الموقع: www.construction.ye
            </p>
            <div className="bg-gradient-to-r from-orange-100 to-yellow-100 border-2 border-orange-300 rounded-lg p-4 print:p-2">
              <h2 className="text-xl font-bold text-gray-800 mb-3 print:text-lg print:mb-2">
                كشف حساب العامل المحسن
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm print:grid-cols-4 print:gap-1 print:text-xs print-info">
                <div className="bg-white rounded p-2 print:p-1">
                  <span className="font-semibold">اسم العامل:</span><br/>
                  <span className="font-bold text-blue-600">{selectedWorker.name}</span>
                </div>
                <div className="bg-white rounded p-2 print:p-1">
                  <span className="font-semibold">نوع العامل:</span><br/>
                  <span className="font-bold text-green-600">{selectedWorker.type === 'master' ? 'أسطى' : 'عامل'}</span>
                </div>
                <div className="bg-white rounded p-2 print:p-1">
                  <span className="font-semibold">الأجر اليومي:</span><br/>
                  <span className="font-bold text-purple-600">{formatCurrency(parseFloat(selectedWorker.dailyWage))}</span>
                </div>
                <div className="bg-white rounded p-2 print:p-1">
                  <span className="font-semibold">الفترة:</span><br/>
                  <span className="font-bold text-red-600">{format(new Date(dateFrom), 'dd/MM/yyyy')} - {format(new Date(dateTo), 'dd/MM/yyyy')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border-2 border-gray-800 bg-white avoid-break">
              <thead>
                <tr className="bg-orange-200 print:bg-orange-200">
                  <th className="w-8 border border-gray-400 px-2 py-1 text-xs font-bold text-center">م</th>
                  <th className="w-32 border border-gray-400 px-2 py-1 text-xs font-bold text-center">المشروع</th>
                  <th className="w-20 border border-gray-400 px-2 py-1 text-xs font-bold text-center">التاريخ</th>
                  <th className="w-16 border border-gray-400 px-2 py-1 text-xs font-bold text-center">بداية العمل</th>
                  <th className="w-16 border border-gray-400 px-2 py-1 text-xs font-bold text-center">نهاية العمل</th>
                  <th className="w-16 border border-gray-400 px-2 py-1 text-xs font-bold text-center">ساعات العمل</th>
                  <th className="w-16 border border-gray-400 px-2 py-1 text-xs font-bold text-center">عدد أيام العمل</th>
                  <th className="w-20 border border-gray-400 px-2 py-1 text-xs font-bold text-center">الأجر المستحق</th>
                  <th className="w-20 border border-gray-400 px-2 py-1 text-xs font-bold text-center">المبلغ المستلم</th>
                  <th className="w-20 border border-gray-400 px-2 py-1 text-xs font-bold text-center">المبلغ المتبقي</th>
                  <th className="w-24 border border-gray-400 px-2 py-1 text-xs font-bold text-center">ملاحظات العمل</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let rowIndex = 1;
                  let grandTotalEarned = 0;
                  let grandTotalPaid = 0;
                  let grandTotalRemaining = 0;
                  let grandTotalHours = 0;

                  const rows: JSX.Element[] = [];

                  workerStatement.forEach((projectStatement) => {
                    const attendance = projectStatement.attendance || [];
                    
                    attendance.forEach((record) => {
                      const workingHours = calculateWorkingHours(record.startTime, record.endTime);
                      const dailyWage = parseFloat(record.dailyWage || '0');
                      const paidAmount = parseFloat(record.paidAmount || '0');
                      const remainingAmount = parseFloat(record.remainingAmount || '0');
                      
                      grandTotalEarned += dailyWage;
                      grandTotalPaid += paidAmount;
                      grandTotalRemaining += remainingAmount;
                      grandTotalHours += workingHours;

                      rows.push(
                        <tr key={`${projectStatement.projectId}-${record.id}`} className="hover:bg-blue-50">
                          <td className="border border-gray-400 bg-gray-50">{rowIndex++}</td>
                          <td className="border border-gray-400 bg-blue-50" style={{ maxWidth: '60px', fontSize: '5px', wordWrap: 'break-word' }}>{projectStatement.projectName}</td>
                          <td className="border border-gray-400 bg-yellow-50">{formatDate(record.date)}</td>
                          <td className="border border-gray-400">{record.startTime || '-'}</td>
                          <td className="border border-gray-400">{record.endTime || '-'}</td>
                          <td className="border border-gray-400 bg-green-50">{formatHours(workingHours)}</td>
                          <td className="border border-gray-400 bg-purple-50">1</td>
                          <td className="border border-gray-400 bg-blue-100">{formatCurrency(dailyWage)}</td>
                          <td className="border border-gray-400 bg-green-100">{formatCurrency(paidAmount)}</td>
                          <td className="border border-gray-400 bg-red-100">{formatCurrency(remainingAmount)}</td>
                          <td className="border border-gray-400 bg-gray-100" style={{ maxWidth: '50px', fontSize: '5px', wordWrap: 'break-word' }}>{record.workDescription || '-'}</td>
                        </tr>
                      );
                    });
                  });

                  // Add family transfers section
                  const allFamilyTransfers = familyTransfers.filter(transfer => 
                    selectedProjectIds.some(projectId => 
                      workerStatement?.some(ps => ps.projectId === projectId && ps.projectName === transfer.projectName)
                    )
                  );

                  if (allFamilyTransfers.length > 0) {
                    rows.push(
                      <tr key="family-transfers-header" className="bg-purple-200">
                        <td colSpan={11} className="border border-gray-400 text-center font-bold">
                          حوالات للأهل من حساب العامل
                        </td>
                      </tr>
                    );

                    allFamilyTransfers.forEach((transfer, index) => {
                      rows.push(
                        <tr key={`transfer-${transfer.id}`} className="bg-purple-50">
                          <td className="border border-gray-400">{index + 1}</td>
                          <td className="border border-gray-400">{transfer.projectName}</td>
                          <td className="border border-gray-400">{formatDate(transfer.transferDate)}</td>
                          <td className="border border-gray-400">-</td>
                          <td className="border border-gray-400">-</td>
                          <td className="border border-gray-400">-</td>
                          <td className="border border-gray-400">-</td>
                          <td className="border border-gray-400 text-red-600">-{formatCurrency(parseFloat(transfer.amount))}</td>
                          <td className="border border-gray-400">{transfer.recipientName}</td>
                          <td className="border border-gray-400">-{formatCurrency(parseFloat(transfer.amount))}</td>
                          <td className="border border-gray-400">حولة للأهل</td>
                        </tr>
                      );
                    });
                  }

                  // Add summary rows
                  const totalWorkDays = workerStatement.reduce((total, projectStatement) => 
                    total + (projectStatement.attendance?.length || 0), 0);

                  rows.push(
                    <tr key="summary-days" className="bg-orange-100">
                      <td colSpan={6} className="border border-gray-400 text-center font-bold">إجمالي أيام العمل</td>
                      <td className="border border-gray-400 text-center font-bold">{totalWorkDays}</td>
                      <td colSpan={4} className="border border-gray-400"></td>
                    </tr>
                  );

                  rows.push(
                    <tr key="summary-hours" className="bg-orange-100">
                      <td colSpan={5} className="border border-gray-400 text-center font-bold">إجمالي ساعات العمل</td>
                      <td className="border border-gray-400 text-center font-bold">{formatHours(grandTotalHours)}</td>
                      <td colSpan={5} className="border border-gray-400"></td>
                    </tr>
                  );

                  rows.push(
                    <tr key="summary-earned" className="bg-orange-100">
                      <td colSpan={7} className="border border-gray-400 text-center font-bold">إجمالي المبلغ المستحق</td>
                      <td className="border border-gray-400 text-center font-bold">{formatCurrency(grandTotalEarned)}</td>
                      <td colSpan={3} className="border border-gray-400"></td>
                    </tr>
                  );

                  rows.push(
                    <tr key="summary-paid" className="bg-orange-100">
                      <td colSpan={8} className="border border-gray-400 text-center font-bold">إجمالي المبلغ المستلم</td>
                      <td className="border border-gray-400 text-center font-bold">{formatCurrency(grandTotalPaid)}</td>
                      <td colSpan={2} className="border border-gray-400"></td>
                    </tr>
                  );

                  // Calculate total transferred amount
                  const totalTransferred = allFamilyTransfers.reduce((sum, transfer) => 
                    sum + parseFloat(transfer.amount), 0);

                  if (totalTransferred > 0) {
                    rows.push(
                      <tr key="summary-transferred" className="bg-orange-100">
                        <td colSpan={8} className="border border-gray-400 text-center font-bold">إجمالي المحول للأهل</td>
                        <td className="border border-gray-400 text-center font-bold text-red-600">{formatCurrency(totalTransferred)}</td>
                        <td colSpan={2} className="border border-gray-400"></td>
                      </tr>
                    );
                  }

                  const finalBalance = grandTotalRemaining - totalTransferred;

                  rows.push(
                    <tr key="summary-remaining" className="bg-orange-100">
                      <td colSpan={9} className="border border-gray-400 text-center font-bold">إجمالي المتبقي (بعد خصم الحوالات)</td>
                      <td className="border border-gray-400 text-center font-bold">{formatCurrency(finalBalance)}</td>
                      <td className="border border-gray-400"></td>
                    </tr>
                  );

                  return rows;
                })()}
              </tbody>
            </table>
          </div>

          {/* Action Buttons - Visible at bottom of report */}
          <div className="mt-6 p-4 border-t bg-gray-50 print:hidden">
            <div className="flex gap-3 justify-center flex-wrap">
              <Button 
                onClick={() => setShowReport(false)} 
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2"
              >
                <FileText className="mr-2 h-4 w-4" />
                عودة للإعدادات
              </Button>
              <Button onClick={printReport} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2">
                <Printer className="mr-2 h-4 w-4" />
                طباعة الكشف
              </Button>
              <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2">
                <Download className="mr-2 h-4 w-4" />
                تصدير Excel
              </Button>
              <Button 
                onClick={() => {
                  window.print();
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
              >
                <Printer className="mr-2 h-4 w-4" />
                حفظ PDF
              </Button>
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              يمكنك طباعة الكشف أو تصديره أو حفظه كملف PDF أو العودة لتعديل الإعدادات
            </p>
          </div>
        </div>
      )}
    </div>
  );
}