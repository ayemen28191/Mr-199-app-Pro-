import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Printer, Calculator } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Worker, WorkerAttendance, Project } from "@shared/schema";

export default function EnhancedWorkerStatement() {
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showReport, setShowReport] = useState(false);

  // Query for workers
  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  // Query for projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Query for worker projects (projects where this worker has worked)
  const { data: workerProjects = [] } = useQuery<Project[]>({
    queryKey: ["/api/workers", selectedWorkerId, "projects"],
    queryFn: async () => {
      if (!selectedWorkerId) return [];
      const response = await fetch(`/api/workers/${selectedWorkerId}/projects`);
      return response.ok ? response.json() : [];
    },
    enabled: !!selectedWorkerId,
  });

  // Query for worker statement with multiple projects support
  const { data: workerStatement, isLoading: isLoadingStatement } = useQuery({
    queryKey: ["/api/workers/enhanced-statement", selectedWorkerId, selectedProjectIds, dateFrom, dateTo],
    queryFn: async () => {
      if (!selectedWorkerId || !dateFrom || !dateTo || selectedProjectIds.length === 0) return null;
      
      // Fetch data for each selected project including transfers
      const statements = await Promise.all(
        selectedProjectIds.map(async (projectId) => {
          const params = new URLSearchParams();
          params.append('dateFrom', dateFrom);
          params.append('dateTo', dateTo);
          params.append('projectId', projectId);
          
          const [statementResponse, transfersResponse] = await Promise.all([
            fetch(`/api/workers/${selectedWorkerId}/account-statement?${params}`),
            fetch(`/api/workers/${selectedWorkerId}/transfers?projectId=${projectId}`)
          ]);
          
          if (!statementResponse.ok) return null;
          
          const statementData = await statementResponse.json();
          const transfersData = transfersResponse.ok ? await transfersResponse.json() : [];
          
          // Filter transfers by date range
          const filteredTransfers = transfersData.filter((transfer: any) => {
            return transfer.transferDate >= dateFrom && transfer.transferDate <= dateTo;
          });
          
          return {
            projectId,
            projectName: projects.find(p => p.id === projectId)?.name || '',
            ...statementData,
            familyTransfers: filteredTransfers
          };
        })
      );
      
      return statements.filter(s => s !== null);
    },
    enabled: !!selectedWorkerId && !!dateFrom && !!dateTo && selectedProjectIds.length > 0 && showReport,
  });

  const selectedWorker = workers.find(w => w.id === selectedWorkerId);

  // Calculate working hours between start and end time
  const calculateWorkingHours = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let startTotalMinutes = startHour * 60 + startMinute;
    let endTotalMinutes = endHour * 60 + endMinute;
    
    // Handle overnight work (e.g., 21:29 to 08:29)
    if (endTotalMinutes < startTotalMinutes) {
      endTotalMinutes += 24 * 60; // Add 24 hours
    }
    
    const diffMinutes = endTotalMinutes - startTotalMinutes;
    return diffMinutes / 60; // Convert to hours
  };

  // Format hours to display (e.g., 8.5 hours as "8:30")
  const formatHours = (hours: number): string => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleProjectSelection = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjectIds(prev => [...prev, projectId]);
    } else {
      setSelectedProjectIds(prev => prev.filter(id => id !== projectId));
    }
  };

  const generateReport = () => {
    if (!selectedWorkerId || !dateFrom || !dateTo || selectedProjectIds.length === 0) {
      alert("يرجى تعبئة جميع الحقول المطلوبة واختيار مشروع واحد على الأقل");
      return;
    }
    setShowReport(true);
  };

  const printReport = () => {
    // Hide action buttons before printing
    const actionButtons = document.querySelector('.print\\:hidden');
    if (actionButtons) {
      (actionButtons as HTMLElement).style.display = 'none';
    }
    
    setTimeout(() => {
      window.print();
      // Show buttons again after printing
      if (actionButtons) {
        (actionButtons as HTMLElement).style.display = 'block';
      }
    }, 100);
  };

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

      // Add summary rows
      rows.push(['', '', '', '', '', '', '', '', '']);
      rows.push(['', 'إجمالي ساعات العمل', '', '', formatHours(grandTotalHours), '', '', '', '']);
      rows.push(['', 'إجمالي المبلغ المستحق', '', '', '', formatCurrency(grandTotalEarned), '', '', '']);
      rows.push(['', 'إجمالي المبلغ المستلم', '', '', '', '', formatCurrency(grandTotalPaid), '', '']);
      rows.push(['', 'إجمالي المتبقي', '', '', '', '', '', formatCurrency(grandTotalRemaining), '']);

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

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Print-specific styles */}
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .print\\:text-xs { font-size: 8px !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:p-0\\.5 { padding: 1px !important; }
          .print\\:p-1 { padding: 2px !important; }
          .print\\:p-2 { padding: 4px !important; }
          .print\\:mb-1 { margin-bottom: 2px !important; }
          .print\\:text-sm { font-size: 10px !important; }
          .print\\:text-base { font-size: 12px !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          th, td { page-break-inside: avoid; }
          thead { display: table-header-group; }
        }
        @page {
          size: A4;
          margin: 0.5in;
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
                <Label htmlFor="dateFrom">من تاريخ *</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dateTo">إلى تاريخ *</Label>
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

      {/* Report Display - Only show the report without controls */}
      {showReport && workerStatement && workerStatement.length > 0 && (
        <div className="w-full max-w-full mx-auto bg-white print:w-full print:max-w-none print:m-0">
          <div className="text-center border-b p-3 print:p-2">
            <h1 className="text-lg font-bold mb-1 print:text-base print:mb-1">
              إدارة المشاريع الإنشائية
            </h1>
            <p className="text-xs text-gray-600 mb-2 print:text-xs print:mb-1">
              هاتف: +967133456789 | البريد الإلكتروني: info@construction.com
            </p>
            <div className="border-2 border-orange-300 p-2 rounded-lg bg-orange-50 print:border print:rounded-none print:p-1">
              <h2 className="text-base font-bold mb-2 print:text-sm print:mb-1">كشف حساب العامل المحسن</h2>
              <div className="grid grid-cols-2 gap-2 text-xs print:text-xs">
                <div className="text-right">اسم العامل: <span className="font-bold">{selectedWorker?.name}</span></div>
                <div className="text-left">تاريخ الطباعة: <span className="font-bold">{format(new Date(), 'yyyy/MM/dd', { locale: ar })}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1 text-xs print:text-xs">
                <div className="text-right">من تاريخ: <span className="font-bold">{formatDate(dateFrom)}</span></div>
                <div className="text-left">إلى تاريخ: <span className="font-bold">{formatDate(dateTo)}</span></div>
              </div>
              <div className="mt-1 text-xs print:text-xs">
                <div className="text-center">عدد المشاريع المختارة: <span className="font-bold">{selectedProjectIds.length}</span></div>
              </div>
            </div>
          </div>

          <div className="p-2 print:p-1">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full border-collapse text-xs print:text-xs" style={{ fontSize: '10px' }}>
                <thead>
                  <tr className="bg-orange-200">
                    <th className="border border-gray-400 p-1 text-center font-bold print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>م</th>
                    <th className="border border-gray-400 p-1 text-center font-bold print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>اسم المشروع</th>
                    <th className="border border-gray-400 p-1 text-center font-bold print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>التاريخ</th>
                    <th className="border border-gray-400 p-1 text-center font-bold print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>وقت البداية</th>
                    <th className="border border-gray-400 p-1 text-center font-bold print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>وقت النهاية</th>
                    <th className="border border-gray-400 p-1 text-center font-bold print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>ساعات العمل</th>
                    <th className="border border-gray-400 p-1 text-center font-bold print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>عدد أيام</th>
                    <th className="border border-gray-400 p-1 text-center font-bold print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>الأجر اليومي</th>
                    <th className="border border-gray-400 p-1 text-center font-bold print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>المبلغ المستلم</th>
                    <th className="border border-gray-400 p-1 text-center font-bold print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>المتبقي</th>
                    <th className="border border-gray-400 p-1 text-center font-bold print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let rowIndex = 1;
                    let grandTotalEarned = 0;
                    let grandTotalPaid = 0;
                    let grandTotalRemaining = 0;
                    let grandTotalHours = 0;
                    
                    const rows = workerStatement.flatMap((projectStatement: any) => {
                      const attendance = projectStatement.attendance || [];
                      
                      return attendance.map((record: any) => {
                        const workingHours = calculateWorkingHours(record.startTime, record.endTime);
                        const dailyWage = parseFloat(record.dailyWage || '0');
                        const paidAmount = parseFloat(record.paidAmount || '0');
                        const remainingAmount = parseFloat(record.remainingAmount || '0');
                        
                        grandTotalEarned += dailyWage;
                        grandTotalPaid += paidAmount;
                        grandTotalRemaining += remainingAmount;
                        grandTotalHours += workingHours;

                        return (
                          <tr key={`${projectStatement.projectId}-${record.id}`} className="hover:bg-blue-50" style={{ height: '20px' }}>
                            <td className="border border-gray-400 p-0.5 text-center arabic-numbers bg-gray-50 print:p-0" style={{ fontSize: '8px', lineHeight: '1.1' }}>{rowIndex++}</td>
                            <td className="border border-gray-400 p-0.5 text-center bg-blue-50 print:p-0" style={{ fontSize: '8px', lineHeight: '1.1', maxWidth: '80px', wordWrap: 'break-word' }}>{projectStatement.projectName}</td>
                            <td className="border border-gray-400 p-0.5 text-center arabic-numbers bg-yellow-50 print:p-0" style={{ fontSize: '8px', lineHeight: '1.1' }}>{formatDate(record.date)}</td>
                            <td className="border border-gray-400 p-0.5 text-center arabic-numbers print:p-0" style={{ fontSize: '8px', lineHeight: '1.1' }}>{record.startTime || '-'}</td>
                            <td className="border border-gray-400 p-0.5 text-center arabic-numbers print:p-0" style={{ fontSize: '8px', lineHeight: '1.1' }}>{record.endTime || '-'}</td>
                            <td className="border border-gray-400 p-0.5 text-center arabic-numbers bg-green-50 print:p-0" style={{ fontSize: '8px', lineHeight: '1.1' }}>{formatHours(workingHours)}</td>
                            <td className="border border-gray-400 p-0.5 text-center arabic-numbers bg-purple-50 print:p-0" style={{ fontSize: '8px', lineHeight: '1.1' }}>1</td>
                            <td className="border border-gray-400 p-0.5 text-center arabic-numbers bg-blue-100 print:p-0" style={{ fontSize: '8px', lineHeight: '1.1' }}>{formatCurrency(dailyWage)}</td>
                            <td className="border border-gray-400 p-0.5 text-center arabic-numbers bg-green-100 print:p-0" style={{ fontSize: '8px', lineHeight: '1.1' }}>{formatCurrency(paidAmount)}</td>
                            <td className="border border-gray-400 p-0.5 text-center arabic-numbers bg-red-100 print:p-0" style={{ fontSize: '8px', lineHeight: '1.1' }}>{formatCurrency(remainingAmount)}</td>
                            <td className="border border-gray-400 p-0.5 text-center bg-gray-100 print:p-0" style={{ fontSize: '8px', lineHeight: '1.1', maxWidth: '60px', wordWrap: 'break-word' }}>{record.workDescription || '-'}</td>
                          </tr>
                        );
                      });
                    });

                    // Add summary rows
                    rows.push(
                      <tr key="summary-header" className="bg-orange-200">
                        <td colSpan={10} className="border border-gray-400 p-2 text-center font-bold">
                          إجمالي الحسابات للعامل
                        </td>
                      </tr>
                    );

                    // Add family transfers section
                    const allFamilyTransfers = workerStatement.flatMap((ps: any) => 
                      (ps.familyTransfers || []).map((transfer: any) => ({
                        ...transfer,
                        projectName: ps.projectName
                      }))
                    );

                    if (allFamilyTransfers.length > 0) {
                      rows.push(
                        <tr key="family-transfers-header" className="bg-purple-200">
                          <td colSpan={11} className="border border-gray-400 p-1 text-center font-bold print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>
                            حوالات للأهل من حساب العامل
                          </td>
                        </tr>
                      );

                      allFamilyTransfers.forEach((transfer: any, index: number) => {
                        rows.push(
                          <tr key={`transfer-${transfer.id}`} className="bg-purple-50" style={{ height: '20px' }}>
                            <td className="border border-gray-400 p-0.5 text-center arabic-numbers print:p-0" style={{ fontSize: '8px', lineHeight: '1.1' }}>{index + 1}</td>
                            <td className="border border-gray-400 p-0.5 text-center print:p-0" style={{ fontSize: '8px', lineHeight: '1.1' }}>{transfer.projectName}</td>
                            <td className="border border-gray-400 p-0.5 text-center arabic-numbers print:p-0" style={{ fontSize: '8px', lineHeight: '1.1' }}>{formatDate(transfer.transferDate)}</td>
                            <td className="border border-gray-400 p-0.5 text-center print:p-0" style={{ fontSize: '8px', lineHeight: '1.1' }}>-</td>
                            <td className="border border-gray-400 p-0.5 text-center print:p-0" style={{ fontSize: '8px', lineHeight: '1.1' }}>-</td>
                            <td className="border border-gray-400 p-0.5 text-center print:p-0" style={{ fontSize: '8px', lineHeight: '1.1' }}>-</td>
                            <td className="border border-gray-400 p-0.5 text-center print:p-0" style={{ fontSize: '8px', lineHeight: '1.1' }}>-</td>
                            <td className="border border-gray-400 p-0.5 text-center arabic-numbers text-red-600 print:p-0" style={{ fontSize: '8px', lineHeight: '1.1' }}>-{formatCurrency(parseFloat(transfer.amount))}</td>
                            <td className="border border-gray-400 p-0.5 text-center print:p-0" style={{ fontSize: '8px', lineHeight: '1.1' }}>{transfer.recipientName}</td>
                            <td className="border border-gray-400 p-0.5 text-center arabic-numbers print:p-0" style={{ fontSize: '8px', lineHeight: '1.1' }}>-{formatCurrency(parseFloat(transfer.amount))}</td>
                            <td className="border border-gray-400 p-0.5 text-center print:p-0" style={{ fontSize: '8px', lineHeight: '1.1' }}>{transfer.notes || 'حولة للأهل'}</td>
                          </tr>
                        );
                      });
                    }

                    // Calculate total work days across all projects
                    const totalWorkDays = workerStatement.reduce((total, projectStatement) => 
                      total + (projectStatement.attendance?.length || 0), 0);

                    rows.push(
                      <tr key="summary-days" className="bg-orange-100">
                        <td colSpan={6} className="border border-gray-400 p-1 text-center font-bold print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>
                          إجمالي أيام العمل
                        </td>
                        <td className="border border-gray-400 p-1 text-center font-bold arabic-numbers print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>
                          {totalWorkDays}
                        </td>
                        <td colSpan={4} className="border border-gray-400 p-1 print:p-0.5"></td>
                      </tr>
                    );

                    rows.push(
                      <tr key="summary-hours" className="bg-orange-100">
                        <td colSpan={5} className="border border-gray-400 p-1 text-center font-bold print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>
                          إجمالي ساعات العمل
                        </td>
                        <td className="border border-gray-400 p-1 text-center font-bold arabic-numbers print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>
                          {formatHours(grandTotalHours)}
                        </td>
                        <td colSpan={5} className="border border-gray-400 p-1 print:p-0.5"></td>
                      </tr>
                    );

                    rows.push(
                      <tr key="summary-earned" className="bg-orange-100">
                        <td colSpan={7} className="border border-gray-400 p-1 text-center font-bold print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>
                          إجمالي المبلغ المستحق للعامل
                        </td>
                        <td className="border border-gray-400 p-1 text-center font-bold arabic-numbers print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>
                          {formatCurrency(grandTotalEarned)}
                        </td>
                        <td colSpan={3} className="border border-gray-400 p-1 print:p-0.5"></td>
                      </tr>
                    );

                    rows.push(
                      <tr key="summary-paid" className="bg-orange-100">
                        <td colSpan={8} className="border border-gray-400 p-1 text-center font-bold print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>
                          إجمالي المبلغ المستلم
                        </td>
                        <td className="border border-gray-400 p-1 text-center font-bold arabic-numbers print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>
                          {formatCurrency(grandTotalPaid)}
                        </td>
                        <td colSpan={2} className="border border-gray-400 p-1 print:p-0.5"></td>
                      </tr>
                    );

                    const totalTransferred = allFamilyTransfers.reduce((sum, transfer) => 
                      sum + parseFloat(transfer.amount), 0);

                    if (totalTransferred > 0) {
                      rows.push(
                        <tr key="summary-transferred" className="bg-orange-100">
                          <td colSpan={8} className="border border-gray-400 p-1 text-center font-bold print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>
                            إجمالي المحول للأهل
                          </td>
                          <td className="border border-gray-400 p-1 text-center font-bold arabic-numbers text-red-600 print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>
                            {formatCurrency(totalTransferred)}
                          </td>
                          <td colSpan={2} className="border border-gray-400 p-1 print:p-0.5"></td>
                        </tr>
                      );
                    }

                    const finalBalance = grandTotalRemaining - totalTransferred;

                    rows.push(
                      <tr key="summary-remaining" className="bg-orange-100">
                        <td colSpan={9} className="border border-gray-400 p-1 text-center font-bold print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>
                          إجمالي المتبقي للعامل (بعد خصم الحوالات)
                        </td>
                        <td className="border border-gray-400 p-1 text-center font-bold arabic-numbers print:p-0.5" style={{ fontSize: '9px', lineHeight: '1.2' }}>
                          {formatCurrency(finalBalance)}
                        </td>
                        <td className="border border-gray-400 p-1 print:p-0.5"></td>
                      </tr>
                    );

                    return rows;
                  })()}
                </tbody>
              </table>
            </div>
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

      {showReport && isLoadingStatement && (
        <div className="text-center py-8">
          <p>جاري تحميل البيانات...</p>
        </div>
      )}

      {showReport && !isLoadingStatement && (!workerStatement || workerStatement.length === 0) && (
        <Card>
          <CardContent className="text-center py-8">
            <p>لا توجد بيانات للفترة المحددة والمشاريع المختارة</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}