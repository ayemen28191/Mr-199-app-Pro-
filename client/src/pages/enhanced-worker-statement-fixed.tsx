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

  // Print report with optimized layout
  const printReport = () => {
    if (!workerStatement || !selectedWorker) return;

    // Create print content
    let printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>كشف حساب العامل - ${selectedWorker.name}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 0.3in;
          }
          
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            font-size: 9pt;
            line-height: 1.2;
            margin: 0;
            padding: 0;
            background: white;
            color: black;
          }
          
          .header {
            text-align: center;
            margin-bottom: 15pt;
            border-bottom: 2pt solid #ffa500;
            padding-bottom: 8pt;
          }
          
          .main-title {
            font-size: 16pt;
            font-weight: bold;
            color: #d97706;
            margin-bottom: 5pt;
          }
          
          .subtitle {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 8pt;
          }
          
          .contact-info {
            font-size: 8pt;
            color: #666;
            margin-bottom: 8pt;
          }
          
          .worker-info {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8pt;
            margin-bottom: 12pt;
            background: #fff3cd;
            padding: 8pt;
            border: 1pt solid #ffa500;
          }
          
          .info-box {
            background: white;
            padding: 4pt;
            border: 1pt solid #ddd;
            text-align: center;
          }
          
          .info-label {
            font-size: 7pt;
            font-weight: bold;
            display: block;
            margin-bottom: 2pt;
          }
          
          .info-value {
            font-size: 8pt;
            font-weight: bold;
            color: #333;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
            font-size: 7pt;
          }
          
          th {
            background-color: #ffa500 !important;
            color: black !important;
            font-weight: bold;
            padding: 3pt 2pt;
            border: 1pt solid #000;
            text-align: center;
            font-size: 7pt;
          }
          
          td {
            padding: 2pt 1pt;
            border: 0.5pt solid #000;
            text-align: center;
            font-size: 6pt;
            word-wrap: break-word;
          }
          
          .row-number { background-color: #f8f9fa !important; }
          .project-name { background-color: #e3f2fd !important; max-width: 60pt; }
          .date-cell { background-color: #fffde7 !important; }
          .hours-cell { background-color: #e8f5e8 !important; }
          .days-cell { background-color: #f3e5f5 !important; font-weight: bold; }
          .wage-cell { background-color: #bbdefb !important; font-weight: bold; }
          .paid-cell { background-color: #c8e6c9 !important; font-weight: bold; }
          .remaining-cell { background-color: #ffcdd2 !important; font-weight: bold; }
          .notes-cell { background-color: #f5f5f5 !important; max-width: 50pt; }
          
          .section-header {
            background-color: #e1bee7 !important;
            font-weight: bold;
            text-align: center;
          }
          
          .section-row {
            background-color: #f3e5f5 !important;
          }
          
          .total-row {
            background-color: #ffcc80 !important;
            font-weight: bold;
          }
          
          .final-row {
            background-color: #ff9800 !important;
            font-weight: bold;
            color: black;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="main-title">إدارة المشاريع الإنشائية</div>
          <div class="contact-info">هاتف: +967700123456 | البريد الإلكتروني: info@construction.ye | الموقع: www.construction.ye</div>
          <div class="subtitle">كشف حساب العامل المحسن</div>
        </div>
        
        <div class="worker-info">
          <div class="info-box">
            <span class="info-label">اسم العامل</span>
            <span class="info-value">${selectedWorker.name}</span>
          </div>
          <div class="info-box">
            <span class="info-label">نوع العامل</span>
            <span class="info-value">${selectedWorker.type === 'master' ? 'أسطى' : 'عامل'}</span>
          </div>
          <div class="info-box">
            <span class="info-label">الأجر اليومي</span>
            <span class="info-value">${formatCurrency(parseFloat(selectedWorker.dailyWage))}</span>
          </div>
          <div class="info-box">
            <span class="info-label">الفترة</span>
            <span class="info-value">${format(new Date(dateFrom), 'dd/MM/yyyy')} - ${format(new Date(dateTo), 'dd/MM/yyyy')}</span>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 4%;">م</th>
              <th style="width: 15%;">المشروع</th>
              <th style="width: 8%;">التاريخ</th>
              <th style="width: 7%;">بداية</th>
              <th style="width: 7%;">نهاية</th>
              <th style="width: 8%;">ساعات</th>
              <th style="width: 6%;">أيام</th>
              <th style="width: 12%;">الأجر</th>
              <th style="width: 12%;">مستلم</th>
              <th style="width: 12%;">متبقي</th>
              <th style="width: 9%;">ملاحظات</th>
            </tr>
          </thead>
          <tbody>`;

    // Add data rows
    let rowIndex = 1;
    let grandTotalEarned = 0;
    let grandTotalPaid = 0;
    let grandTotalRemaining = 0;
    let grandTotalHours = 0;
    let grandTotalWorkDays = 0;

    workerStatement.forEach((projectStatement) => {
      const attendance = projectStatement.attendance || [];
      
      attendance.forEach((record) => {
        const workingHours = calculateWorkingHours(record.startTime, record.endTime);
        const dailyWage = parseFloat(record.dailyWage || '0');
        const paidAmount = parseFloat(record.paidAmount || '0');
        const remainingAmount = parseFloat(record.remainingAmount || '0');
        const workDays = parseFloat(record.workDays || record.work_days || '1');
        
        grandTotalEarned += dailyWage;
        grandTotalPaid += paidAmount;
        grandTotalRemaining += remainingAmount;
        grandTotalHours += workingHours;
        grandTotalWorkDays += workDays;

        printContent += `
          <tr>
            <td class="row-number">${rowIndex++}</td>
            <td class="project-name">${projectStatement.projectName}</td>
            <td class="date-cell">${formatDate(record.date)}</td>
            <td>${record.startTime || '-'}</td>
            <td>${record.endTime || '-'}</td>
            <td class="hours-cell">${formatHours(workingHours)}</td>
            <td class="days-cell">${workDays}</td>
            <td class="wage-cell">${formatCurrency(dailyWage)}</td>
            <td class="paid-cell">${formatCurrency(paidAmount)}</td>
            <td class="remaining-cell">${formatCurrency(remainingAmount)}</td>
            <td class="notes-cell">${record.workDescription || '-'}</td>
          </tr>`;
      });
    });

    // Add family transfers if any
    const allFamilyTransfers = familyTransfers.filter(transfer => 
      selectedProjectIds.some(projectId => 
        workerStatement?.some(ps => ps.projectId === projectId && ps.projectName === transfer.projectName)
      )
    );

    if (allFamilyTransfers.length > 0) {
      printContent += `
        <tr>
          <td colspan="11" class="section-header">حوالات للأهل من حساب العامل</td>
        </tr>`;

      allFamilyTransfers.forEach((transfer, index) => {
        printContent += `
          <tr class="section-row">
            <td>${index + 1}</td>
            <td>${transfer.projectName}</td>
            <td>${formatDate(transfer.transferDate)}</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td style="color: red;">-${formatCurrency(parseFloat(transfer.amount))}</td>
            <td>${transfer.recipientName}</td>
            <td style="color: red;">-${formatCurrency(parseFloat(transfer.amount))}</td>
            <td>حولة للأهل</td>
          </tr>`;
      });
    }

    // Add totals
    const totalFamilyTransfers = allFamilyTransfers.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const finalBalance = grandTotalRemaining - totalFamilyTransfers;

    printContent += `
            <tr class="total-row">
              <td colspan="5">الإجماليات:</td>
              <td>${formatHours(grandTotalHours)}</td>
              <td>${grandTotalWorkDays}</td>
              <td>${formatCurrency(grandTotalEarned)}</td>
              <td>${formatCurrency(grandTotalPaid)}</td>
              <td>${formatCurrency(grandTotalRemaining)}</td>
              <td>-</td>
            </tr>
            <tr class="final-row">
              <td colspan="9">إجمالي المحول للأهل: ${formatCurrency(totalFamilyTransfers)}</td>
              <td colspan="2">الرصيد النهائي: ${formatCurrency(finalBalance)}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>`;

    // Open print window
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
    }
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
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            size: A4 landscape;
            margin: 0.2in;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
            font-family: Arial, sans-serif !important;
            font-size: 8pt !important;
            line-height: 1.1 !important;
            color: black !important;
            background: white !important;
          }
          
          .p-4 {
            padding: 0 !important;
          }
          
          .max-w-7xl {
            max-width: 100% !important;
            margin: 0 !important;
          }
          
          .print\\:hidden,
          button,
          .no-print,
          .print\\:block {
            display: none !important;
          }
          
          .text-3xl {
            font-size: 14pt !important;
            margin-bottom: 4pt !important;
          }
          
          .text-xl {
            font-size: 12pt !important;
            margin-bottom: 3pt !important;
          }
          
          .text-sm {
            font-size: 8pt !important;
          }
          
          .text-xs {
            font-size: 7pt !important;
          }
          
          .mb-6, .mb-3 {
            margin-bottom: 3pt !important;
          }
          
          .p-4, .p-2 {
            padding: 2pt !important;
          }
          
          .border-b-2 {
            border-bottom: 1pt solid #000 !important;
          }
          
          .pb-4, .pb-2 {
            padding-bottom: 2pt !important;
          }
          
          .grid {
            display: grid !important;
          }
          
          .grid-cols-4 {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 2pt !important;
          }
          
          .rounded,
          .rounded-lg {
            border-radius: 0 !important;
          }
          
          .bg-gradient-to-r {
            background: #fff3cd !important;
          }
          
          .border-2 {
            border: 1pt solid #000 !important;
          }
          
          .bg-white {
            background: white !important;
          }
          
          .overflow-x-auto {
            overflow: visible !important;
          }
          
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 0 !important;
            font-size: 7pt !important;
            table-layout: fixed !important;
          }
          
          th {
            background-color: #ffa500 !important;
            color: black !important;
            font-weight: bold !important;
            padding: 1pt !important;
            border: 0.5pt solid #000 !important;
            text-align: center !important;
            font-size: 7pt !important;
            height: 14pt !important;
            line-height: 1 !important;
          }
          
          td {
            padding: 1pt !important;
            border: 0.5pt solid #000 !important;
            text-align: center !important;
            font-size: 6pt !important;
            height: 12pt !important;
            line-height: 1 !important;
            overflow: hidden !important;
            word-wrap: break-word !important;
          }
          
          .w-8 { width: 4% !important; }
          .w-16 { width: 8% !important; }
          .w-20 { width: 10% !important; }
          .w-24 { width: 12% !important; }
          .w-32 { width: 16% !important; }
          
          .bg-orange-200 {
            background-color: #ffa500 !important;
          }
          
          .bg-gray-50 {
            background-color: #f8f9fa !important;
          }
          
          .bg-blue-50 {
            background-color: #e3f2fd !important;
          }
          
          .bg-yellow-50 {
            background-color: #fffde7 !important;
          }
          
          .bg-green-50 {
            background-color: #e8f5e8 !important;
          }
          
          .bg-purple-50 {
            background-color: #f3e5f5 !important;
          }
          
          .bg-blue-100 {
            background-color: #bbdefb !important;
          }
          
          .bg-green-100 {
            background-color: #c8e6c9 !important;
          }
          
          .bg-red-100 {
            background-color: #ffcdd2 !important;
          }
          
          .bg-gray-100 {
            background-color: #f5f5f5 !important;
          }
          
          .bg-purple-200 {
            background-color: #e1bee7 !important;
          }
          
          .font-bold {
            font-weight: bold !important;
          }
          
          .text-center {
            text-align: center !important;
          }
          
          .text-right {
            text-align: right !important;
          }
        }
        `
      }} />

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
        <div className="print-area w-full bg-white print:bg-white" style={{ fontSize: '14px' }}>
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
                  let grandTotalWorkDays = 0;

                  const rows: JSX.Element[] = [];

                  workerStatement.forEach((projectStatement) => {
                    const attendance = projectStatement.attendance || [];
                    
                    attendance.forEach((record) => {
                      const workingHours = calculateWorkingHours(record.startTime, record.endTime);
                      const dailyWage = parseFloat(record.dailyWage || '0');
                      const paidAmount = parseFloat(record.paidAmount || '0');
                      const remainingAmount = parseFloat(record.remainingAmount || '0');
                      const workDays = parseFloat(record.workDays || record.work_days || '1');
                      
                      grandTotalEarned += dailyWage;
                      grandTotalPaid += paidAmount;
                      grandTotalRemaining += remainingAmount;
                      grandTotalHours += workingHours;
                      grandTotalWorkDays += workDays;

                      rows.push(
                        <tr key={`${projectStatement.projectId}-${record.id}`} className="hover:bg-blue-50">
                          <td className="border border-gray-400 bg-gray-50 px-1 py-1 text-xs">{rowIndex++}</td>
                          <td className="border border-gray-400 bg-blue-50 px-1 py-1 text-xs" style={{ maxWidth: '120px', wordWrap: 'break-word' }}>{projectStatement.projectName}</td>
                          <td className="border border-gray-400 bg-yellow-50 px-1 py-1 text-xs">{formatDate(record.date)}</td>
                          <td className="border border-gray-400 px-1 py-1 text-xs">{record.startTime || '-'}</td>
                          <td className="border border-gray-400 px-1 py-1 text-xs">{record.endTime || '-'}</td>
                          <td className="border border-gray-400 bg-green-50 px-1 py-1 text-xs">{formatHours(workingHours)}</td>
                          <td className="border border-gray-400 bg-purple-50 px-1 py-1 text-xs font-bold">{workDays}</td>
                          <td className="border border-gray-400 bg-blue-100 px-1 py-1 text-xs font-semibold">{formatCurrency(dailyWage)}</td>
                          <td className="border border-gray-400 bg-green-100 px-1 py-1 text-xs font-semibold">{formatCurrency(paidAmount)}</td>
                          <td className="border border-gray-400 bg-red-100 px-1 py-1 text-xs font-semibold">{formatCurrency(remainingAmount)}</td>
                          <td className="border border-gray-400 bg-gray-100 px-1 py-1 text-xs" style={{ maxWidth: '100px', wordWrap: 'break-word' }}>{record.workDescription || '-'}</td>
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
                  rows.push(
                    <tr key="summary-days" className="bg-orange-100">
                      <td colSpan={6} className="border border-gray-400 text-center font-bold">إجمالي أيام العمل</td>
                      <td className="border border-gray-400 text-center font-bold">{grandTotalWorkDays}</td>
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