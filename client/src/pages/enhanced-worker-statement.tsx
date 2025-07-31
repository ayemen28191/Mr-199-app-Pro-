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
      
      // Fetch data for each selected project
      const statements = await Promise.all(
        selectedProjectIds.map(async (projectId) => {
          const params = new URLSearchParams();
          params.append('dateFrom', dateFrom);
          params.append('dateTo', dateTo);
          params.append('projectId', projectId);
          
          const response = await fetch(`/api/workers/${selectedWorkerId}/account-statement?${params}`);
          if (!response.ok) return null;
          
          const data = await response.json();
          return {
            projectId,
            projectName: projects.find(p => p.id === projectId)?.name || '',
            ...data
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
    window.print();
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

      {/* Report Display */}
      {showReport && workerStatement && workerStatement.length > 0 && (
        <Card className="print-container">
          <CardHeader className="text-center border-b">
            <CardTitle className="text-xl">
              إدارة المشاريع الإنشائية
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              هاتف: +967133456789 | البريد الإلكتروني: info@construction.com
            </p>
            <div className="mt-4">
              <h2 className="text-lg font-bold">كشف حساب العامل</h2>
              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                <div>اسم العامل: <span className="font-bold">{selectedWorker?.name}</span></div>
                <div>تاريخ الطباعة: <span className="font-bold">{format(new Date(), 'yyyy/MM/dd', { locale: ar })}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-1 text-sm">
                <div>من تاريخ: <span className="font-bold">{formatDate(dateFrom)}</span></div>
                <div>إلى تاريخ: <span className="font-bold">{formatDate(dateTo)}</span></div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-orange-100">
                    <th className="border border-gray-400 p-2 text-center">م</th>
                    <th className="border border-gray-400 p-2 text-center">اسم المشروع</th>
                    <th className="border border-gray-400 p-2 text-center">التاريخ</th>
                    <th className="border border-gray-400 p-2 text-center">وقت البداية</th>
                    <th className="border border-gray-400 p-2 text-center">وقت النهاية</th>
                    <th className="border border-gray-400 p-2 text-center">ساعات العمل</th>
                    <th className="border border-gray-400 p-2 text-center">الأجر اليومي</th>
                    <th className="border border-gray-400 p-2 text-center">المبلغ المستلم</th>
                    <th className="border border-gray-400 p-2 text-center">المتبقي</th>
                    <th className="border border-gray-400 p-2 text-center">ملاحظات</th>
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
                          <tr key={`${projectStatement.projectId}-${record.id}`} className="hover:bg-gray-50">
                            <td className="border border-gray-400 p-2 text-center arabic-numbers">{rowIndex++}</td>
                            <td className="border border-gray-400 p-2 text-center">{projectStatement.projectName}</td>
                            <td className="border border-gray-400 p-2 text-center arabic-numbers">{formatDate(record.date)}</td>
                            <td className="border border-gray-400 p-2 text-center arabic-numbers">{record.startTime || '-'}</td>
                            <td className="border border-gray-400 p-2 text-center arabic-numbers">{record.endTime || '-'}</td>
                            <td className="border border-gray-400 p-2 text-center arabic-numbers">{formatHours(workingHours)}</td>
                            <td className="border border-gray-400 p-2 text-center arabic-numbers">{formatCurrency(dailyWage)}</td>
                            <td className="border border-gray-400 p-2 text-center arabic-numbers">{formatCurrency(paidAmount)}</td>
                            <td className="border border-gray-400 p-2 text-center arabic-numbers">{formatCurrency(remainingAmount)}</td>
                            <td className="border border-gray-400 p-2 text-center">{record.workDescription || '-'}</td>
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

                    rows.push(
                      <tr key="summary-hours" className="bg-orange-100">
                        <td colSpan={5} className="border border-gray-400 p-2 text-center font-bold">
                          إجمالي ساعات العمل
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold arabic-numbers">
                          {formatHours(grandTotalHours)}
                        </td>
                        <td colSpan={4} className="border border-gray-400 p-2"></td>
                      </tr>
                    );

                    rows.push(
                      <tr key="summary-earned" className="bg-orange-100">
                        <td colSpan={6} className="border border-gray-400 p-2 text-center font-bold">
                          إجمالي المبلغ المستحق للعامل
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold arabic-numbers">
                          {formatCurrency(grandTotalEarned)}
                        </td>
                        <td colSpan={3} className="border border-gray-400 p-2"></td>
                      </tr>
                    );

                    rows.push(
                      <tr key="summary-paid" className="bg-orange-100">
                        <td colSpan={7} className="border border-gray-400 p-2 text-center font-bold">
                          إجمالي المبلغ المستلم
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold arabic-numbers">
                          {formatCurrency(grandTotalPaid)}
                        </td>
                        <td colSpan={2} className="border border-gray-400 p-2"></td>
                      </tr>
                    );

                    rows.push(
                      <tr key="summary-remaining" className="bg-orange-100">
                        <td colSpan={8} className="border border-gray-400 p-2 text-center font-bold">
                          إجمالي المتبقي للعامل
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-bold arabic-numbers">
                          {formatCurrency(grandTotalRemaining)}
                        </td>
                        <td className="border border-gray-400 p-2"></td>
                      </tr>
                    );

                    return rows;
                  })()}
                </tbody>
              </table>
            </div>
          </CardContent>

          {/* Action Buttons */}
          <CardContent className="border-t mt-4">
            <div className="flex gap-2 justify-center print:hidden">
              <Button onClick={printReport} variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                طباعة
              </Button>
              <Button onClick={exportToExcel} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                تصدير Excel
              </Button>
            </div>
          </CardContent>
        </Card>
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