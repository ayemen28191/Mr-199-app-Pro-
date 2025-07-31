import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  transfers: any[];
  balance: any;
}

interface FamilyTransfer {
  id: string;
  projectName: string;
  amount: string;
  transferDate: string;
  recipientName: string;
  notes?: string;
}

export default function ExcelStyleWorkerStatement() {
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

  // Print report with Excel-style layout
  const printReport = () => {
    if (!workerStatement || !selectedWorker) return;

    // Calculate totals first
    let grandTotalEarned = 0;
    let grandTotalPaid = 0;
    let grandTotalRemaining = 0;
    let grandTotalHours = 0;
    let grandTotalDays = 0;

    const allAttendance: any[] = [];
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
        grandTotalDays += parseFloat(record.workDays || '1');

        allAttendance.push({
          ...record,
          projectName: projectStatement.projectName,
          workingHours
        });
      });
    });

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
            margin: 0.5in;
          }
          
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            font-size: 11pt;
            line-height: 1.3;
            margin: 0;
            padding: 0;
            background: white;
            color: black;
          }
          
          .main-header {
            background: linear-gradient(135deg, #ff9800, #ffa500);
            color: white;
            text-align: center;
            padding: 10pt;
            margin-bottom: 15pt;
            border: 2pt solid #ff9800;
          }
          
          .main-title {
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 5pt;
          }
          
          .header-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20pt;
            margin-bottom: 15pt;
          }
          
          .info-section {
            border: 2pt solid #ff9800;
            background: #fff3e0;
          }
          
          .info-header {
            background: #ff9800;
            color: white;
            text-align: center;
            padding: 8pt;
            font-weight: bold;
            font-size: 12pt;
          }
          
          .info-content {
            padding: 10pt;
          }
          
          .info-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            margin-bottom: 8pt;
            border-bottom: 1pt solid #ddd;
            padding-bottom: 5pt;
          }
          
          .info-label {
            font-weight: bold;
            background: #ffcc80;
            padding: 5pt;
            text-align: center;
          }
          
          .info-value {
            background: white;
            padding: 5pt;
            text-align: center;
            border: 1pt solid #ddd;
          }
          
          .main-table {
            width: 100%;
            border-collapse: collapse;
            border: 2pt solid #ff9800;
            margin-bottom: 15pt;
          }
          
          .main-table th {
            background: #ff9800 !important;
            color: white !important;
            font-weight: bold;
            font-size: 10pt;
            padding: 8pt 5pt;
            text-align: center;
            border: 1pt solid #e65100;
          }
          
          .main-table td {
            padding: 6pt 4pt;
            text-align: center;
            border: 1pt solid #ddd;
            font-size: 9pt;
          }
          
          .main-table tbody tr:nth-child(even) {
            background: #fff3e0 !important;
          }
          
          .main-table tbody tr:nth-child(odd) {
            background: white !important;
          }
          
          .transfer-section {
            background: #e1f5fe !important;
          }
          
          .transfer-header {
            background: #03a9f4 !important;
            color: white !important;
            font-weight: bold;
          }
          
          .totals-section {
            margin-top: 15pt;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10pt;
          }
          
          .total-box {
            border: 2pt solid #ff9800;
            text-align: center;
            padding: 10pt;
            background: #fff3e0;
          }
          
          .total-label {
            font-weight: bold;
            font-size: 10pt;
            margin-bottom: 5pt;
            color: #ff9800;
          }
          
          .total-value {
            font-size: 14pt;
            font-weight: bold;
            color: #333;
          }
          
          .final-balance {
            grid-column: span 3;
            background: #4caf50 !important;
            color: white !important;
            font-size: 16pt;
            border-color: #4caf50;
          }
        </style>
      </head>
      <body>
        <div class="main-header">
          <div class="main-title">كشف حساب العامل للفترة من تاريخ ${formatDate(dateFrom)} إلى تاريخ ${formatDate(dateTo)}</div>
        </div>
        
        <div class="header-info">
          <div class="info-section">
            <div class="info-header">بيانات العامل</div>
            <div class="info-content">
              <div class="info-row">
                <div class="info-label">اسم العامل</div>
                <div class="info-value">${selectedWorker.name}</div>
              </div>
              <div class="info-row">
                <div class="info-label">المهنة</div>
                <div class="info-value">${selectedWorker.type === 'master' ? 'أسطى' : 'عامل عادي'}</div>
              </div>
              <div class="info-row">
                <div class="info-label">الأجر اليومي</div>
                <div class="info-value">${formatCurrency(parseFloat(selectedWorker.dailyWage))}</div>
              </div>
            </div>
          </div>
          
          <div class="info-section">
            <div class="info-header">بيانات المشروع</div>
            <div class="info-content">
              <div class="info-row">
                <div class="info-label">مؤسس عبدالحكيم</div>
                <div class="info-value">المقاول: ${selectedProjectIds.length > 1 ? 'مشاريع متعددة' : (workerStatement?.[0]?.projectName || '')}</div>
              </div>
              <div class="info-row">
                <div class="info-label">تاريخ بداية</div>
                <div class="info-value">${formatExcelDate(dateFrom)}</div>
              </div>
              <div class="info-row">
                <div class="info-label">رقم الهاتف</div>
                <div class="info-value">737366643</div>
              </div>
            </div>
          </div>
        </div>
        
        <table class="main-table">
          <thead>
            <tr>
              <th style="width: 3%;">م</th>
              <th style="width: 12%;">المشروع</th>
              <th style="width: 8%;">التاريخ اليومي</th>
              <th style="width: 6%;">الأجر</th>
              <th style="width: 7%;">أيام العمل</th>
              <th style="width: 7%;">ساعات</th>
              <th style="width: 8%;">المبلغ المستحق</th>
              <th style="width: 8%;">المبلغ المستلم</th>
              <th style="width: 8%;">المتبقي للمستحق</th>
              <th style="width: 15%;">ملاحظات</th>
            </tr>
          </thead>  
          <tbody>`;

    // Add data rows
    allAttendance.forEach((record, index) => {
      const workingHours = record.workingHours;
      const dailyWage = parseFloat(record.dailyWage || '0');
      const paidAmount = parseFloat(record.paidAmount || '0');
      const remainingAmount = parseFloat(record.remainingAmount || '0');

      printContent += `
        <tr>
          <td>${index + 1}</td>
          <td>${record.projectName}</td>
          <td>${formatExcelDate(record.date)}</td>
          <td>${formatCurrency(dailyWage)}</td>
          <td>1</td>
          <td>${workingHours.toFixed(1)}</td>
          <td>${formatCurrency(dailyWage)}</td>
          <td>${formatCurrency(paidAmount)}</td>
          <td>${formatCurrency(remainingAmount)}</td>
          <td>${record.workDescription || ''}</td>
        </tr>`;
    });

    // Add family transfers if any
    const allFamilyTransfers = familyTransfers.filter(transfer => 
      selectedProjectIds.some(projectId => 
        workerStatement?.some(ps => ps.projectId === projectId && ps.projectName === transfer.projectName)
      )
    );

    if (allFamilyTransfers.length > 0) {
      allFamilyTransfers.forEach((transfer, index) => {
        printContent += `
          <tr class="transfer-section">
            <td>${allAttendance.length + index + 1}</td>
            <td>${transfer.projectName}</td>
            <td>${formatExcelDate(transfer.transferDate)}</td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td style="color: red;">-${formatCurrency(parseFloat(transfer.amount))}</td>
            <td>${transfer.recipientName}</td>
            <td style="color: red;">-${formatCurrency(parseFloat(transfer.amount))}</td>
            <td>حوالة للأهل من حساب العامل رقم الحوالة ${index + 1}</td>
          </tr>`;
      });
    }

    const totalFamilyTransfers = allFamilyTransfers.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const finalBalance = grandTotalRemaining - totalFamilyTransfers;

    printContent += `
          </tbody>
        </table>
        
        <div class="totals-section">
          <div class="total-box">
            <div class="total-label">إجمالي عدد أيام العمل</div>
            <div class="total-value">${grandTotalDays.toFixed(1)}</div>
          </div>
          
          <div class="total-box">
            <div class="total-label">إجمالي عدد ساعات العمل</div>
            <div class="total-value">${grandTotalHours.toFixed(1)}</div>
          </div>
          
          <div class="total-box">
            <div class="total-label">إجمالي المبلغ المستحق</div>
            <div class="total-value">${formatCurrency(grandTotalEarned)}</div>
          </div>
          
          <div class="total-box">
            <div class="total-label">إجمالي المبلغ المستلم</div>
            <div class="total-value">${formatCurrency(grandTotalPaid)}</div>
          </div>
          
          <div class="total-box">
            <div class="total-label">إجمالي المتبقي للعامل</div>
            <div class="total-value">${formatCurrency(grandTotalRemaining)}</div>
          </div>
          
          <div class="total-box final-balance">
            <div class="total-label">إجمالي المبلغ النهائي للعامل</div>
            <div class="total-value">${formatCurrency(finalBalance)}</div>
          </div>
        </div>
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
        'م', 'اسم المشروع', 'التاريخ', 'الأجر اليومي', 'أيام العمل', 'ساعات العمل', 
        'المبلغ المستحق', 'المبلغ المستلم', 'المتبقي', 'ملاحظات'
      ];
      
      let rowIndex = 1;
      const rows: any[] = [];
      let grandTotalEarned = 0;
      let grandTotalPaid = 0;
      let grandTotalRemaining = 0;
      let grandTotalHours = 0;
      let grandTotalDays = 0;

      workerStatement.forEach((projectStatement: any) => {
        const attendance = projectStatement.attendance || [];
        
        attendance.forEach((record: any) => {
          const workingHours = calculateWorkingHours(record.startTime, record.endTime);
          const dailyWage = parseFloat(record.dailyWage || '0');
          const paidAmount = parseFloat(record.paidAmount || '0');
          const remainingAmount = parseFloat(record.remainingAmount || '0');
          const workDays = parseFloat(record.workDays || '1');
          
          grandTotalEarned += dailyWage;
          grandTotalPaid += paidAmount;
          grandTotalRemaining += remainingAmount;
          grandTotalHours += workingHours;
          grandTotalDays += workDays;

          rows.push([
            rowIndex++,
            projectStatement.projectName,
            formatExcelDate(record.date),
            formatCurrency(dailyWage),
            workDays,
            workingHours.toFixed(1),
            formatCurrency(dailyWage),
            formatCurrency(paidAmount),
            formatCurrency(remainingAmount),
            record.workDescription || ''
          ]);
        });
      });

      // Add totals row
      rows.push([
        '',
        'الإجماليات',
        '',
        '',
        grandTotalDays.toFixed(1),
        grandTotalHours.toFixed(1),
        formatCurrency(grandTotalEarned),
        formatCurrency(grandTotalPaid),
        formatCurrency(grandTotalRemaining),
        ''
      ]);

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
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: ar });
    } catch {
      return dateString;
    }
  };

  const formatExcelDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy-MM-dd');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    return hours.toFixed(1);
  };

  const calculateWorkingHours = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 8; // Default 8 hours

    try {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const startInMinutes = startHour * 60 + startMinute;
      const endInMinutes = endHour * 60 + endMinute;
      
      const diffInMinutes = endInMinutes - startInMinutes;
      return diffInMinutes > 0 ? diffInMinutes / 60 : 8;
    } catch {
      return 8;
    }
  };

  if (!showReport) {
    return (
      <div className="container mx-auto p-6 space-y-6 max-w-4xl" dir="rtl">
        <div className="flex items-center gap-4 mb-6">
          <FileText className="h-8 w-8 text-orange-600" />
          <div>
            <h1 className="text-3xl font-bold">كشف حساب العامل - التصميم المحسن</h1>
            <p className="text-muted-foreground">
              إنشاء كشف حساب تفصيلي للعامل بتصميم Excel احترافي
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              إعدادات كشف الحساب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="worker">اختيار العامل</Label>
                <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر عامل..." />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.name} - {worker.type === "master" ? "أسطى" : "عامل"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>الفترة الزمنية</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="dateFrom" className="text-sm">من تاريخ</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateTo" className="text-sm">إلى تاريخ</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {selectedWorkerId && workerProjects.length > 0 && (
              <div className="space-y-2">
                <Label>اختيار المشاريع</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 border rounded-lg">
                  {workerProjects.map((project) => (
                    <div key={project.id} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={project.id}
                        checked={selectedProjectIds.includes(project.id)}
                        onCheckedChange={(checked) => 
                          handleProjectSelection(project.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={project.id} className="text-sm font-medium">
                        {project.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={generateReport}
                disabled={!selectedWorkerId || selectedProjectIds.length === 0}
                className="flex-1"
              >
                <FileText className="ml-2 h-4 w-4" />
                إنشاء كشف الحساب
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">كشف حساب العامل - {selectedWorker?.name}</h1>
        <p className="text-muted-foreground">
          من {formatDate(dateFrom)} إلى {formatDate(dateTo)}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-center mb-6">
        <Button onClick={printReport} variant="outline">
          <Printer className="ml-2 h-4 w-4" />
          طباعة
        </Button>
        <Button onClick={exportToExcel} variant="outline">
          <Download className="ml-2 h-4 w-4" />
          تصدير Excel
        </Button>
        <Button onClick={() => setShowReport(false)} variant="outline">
          عودة للإعدادات
        </Button>
      </div>

      {/* Preview */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>معاينة الكشف ستظهر هنا عند الطباعة</p>
            <p>استخدم زر "طباعة" لرؤية التصميم النهائي</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}