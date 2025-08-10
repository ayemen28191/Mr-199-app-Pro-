import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, User, Building2, Calendar, DollarSign, UserCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useSelectedProject } from "@/hooks/use-selected-project";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate, getCurrentDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { UnifiedReportTemplate, SummaryCard, UnifiedTable } from "@/components/unified-report-template";
// تصدير Excel مع القالب الموحد
import type { Worker, Project, WorkerAttendance, WorkerTransfer } from "@shared/schema";
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface WorkerStatementData {
  worker: Worker;
  projects: Project[];
  attendance: (WorkerAttendance & { projectName: string })[];
  transfers: (WorkerTransfer & { projectName: string })[];
}

export default function UnifiedWorkerStatement() {
  const { selectedProjectId } = useSelectedProject();
  const { toast } = useToast();
  
  // Form states
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState(getCurrentDate());
  const [statementData, setStatementData] = useState<WorkerStatementData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch data
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  const selectedWorker = workers.find(w => w.id === selectedWorkerId);
  const selectedProjects = projects.filter(p => selectedProjectIds.includes(p.id));

  // Generate statement
  const generateStatement = useCallback(async () => {
    if (selectedProjectIds.length === 0) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار مشروع واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    if (!selectedWorkerId) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار عامل",
        variant: "destructive",
      });
      return;
    }

    if (!dateFrom || !dateTo) {
      toast({
        title: "تنبيه", 
        description: "يرجى تحديد فترة الكشف",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Fetch worker attendance data for all selected projects
      const attendanceResponse = await apiRequest(
        'GET',
        `/api/worker-attendance-filter?workerId=${selectedWorkerId}&dateFrom=${dateFrom}&dateTo=${dateTo}`
      );

      // Fetch worker transfers data for all selected projects
      const allTransfers: WorkerTransfer[] = [];
      for (const projectId of selectedProjectIds) {
        const transfersResponse = await apiRequest(
          'GET',
          `/api/workers/${selectedWorkerId}/transfers?projectId=${projectId}&dateFrom=${dateFrom}&dateTo=${dateTo}`
        );
        if (Array.isArray(transfersResponse)) {
          allTransfers.push(...transfersResponse);
        }
      }

      const allAttendance: WorkerAttendance[] = attendanceResponse || [];
      
      // Filter attendance for selected projects only
      const filteredAttendance = allAttendance.filter(record => 
        selectedProjectIds.includes(record.projectId)
      );

      if (filteredAttendance.length === 0 && allTransfers.length === 0) {
        toast({
          title: "تنبيه",
          description: "لا توجد بيانات للعامل في المشاريع والفترة المحددة",
        });
        setIsGenerating(false);
        return;
      }

      const worker = workers.find(w => w.id === selectedWorkerId);

      if (!worker) {
        toast({
          title: "خطأ",
          description: "خطأ في جلب بيانات العامل",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      // Add project names to attendance and transfers
      const attendanceWithProjectNames = filteredAttendance.map(record => {
        const project = projects.find(p => p.id === record.projectId);
        return {
          ...record,
          workDays: Number(record.workDays),
          dailyWage: Number(record.dailyWage),
          paidAmount: Number(record.paidAmount),
          attendanceDate: record.date,
          notes: record.workDescription || '',
          projectName: project?.name || 'مشروع غير محدد'
        };
      });

      const transfersWithProjectNames = allTransfers.map(transfer => {
        const project = projects.find(p => p.id === transfer.projectId);
        return {
          ...transfer,
          date: transfer.transferDate,
          amount: Number(transfer.amount),
          recipientAddress: transfer.recipientPhone || '',
          projectName: project?.name || 'مشروع غير محدد'
        };
      });

      setStatementData({
        worker: {
          ...worker,
          dailyWage: Number(worker.dailyWage)
        },
        projects: selectedProjects,
        attendance: attendanceWithProjectNames,
        transfers: transfersWithProjectNames
      });

      const projectNames = selectedProjects.map(p => p.name).join(', ');
      toast({
        title: "تم بنجاح",
        description: `تم إنشاء كشف حساب العامل ${worker.name} للمشاريع: ${projectNames}`,
      });

    } catch (error) {
      console.error("Error generating worker statement:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء الكشف",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedProjectIds, selectedWorkerId, dateFrom, dateTo, toast, workers, projects, selectedProjects]);

  // Print statement
  const printStatement = useCallback(() => {
    if (!statementData) {
      toast({
        title: "تنبيه",
        description: "يرجى إنشاء الكشف أولاً",
        variant: "destructive",
      });
      return;
    }

    window.print();
  }, [statementData, toast]);

  // Export to Excel with unified template
  const exportToExcel = useCallback(async () => {
    if (!statementData) {
      toast({
        title: "تنبيه",
        description: "يرجى إنشاء الكشف أولاً",
        variant: "destructive",
      });
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('كشف حساب العامل');

      // Summary calculations
      const totalWorkDays = statementData.attendance.reduce((sum, record) => sum + (Number(record.workDays) || 0), 0);
      const totalAmountDue = statementData.attendance.reduce((sum, record) => 
        sum + (Number(record.actualWage) || 0), 0);
      const totalAmountReceived = statementData.attendance.reduce((sum, record) => 
        sum + (Number(record.paidAmount) || 0), 0);
      const totalTransferred = statementData.transfers.reduce((sum, transfer) => sum + Number(transfer.amount), 0);
      const remainingAmount = totalAmountDue - totalAmountReceived;
      const workerCurrentBalance = totalAmountDue - totalAmountReceived - totalTransferred;

      // Header information for the template
      const headerInfo = {
        reportTitle: "كشف حساب العامل الشامل والتفصيلي",
        companyName: "نظام إدارة المشاريع الإنشائية",
        period: `من ${formatDate(dateFrom)} إلى ${formatDate(dateTo)}`,
        workerName: statementData.worker.name,
        workerType: statementData.worker.type,
        projectNames: statementData.projects.map(p => p.name).join(', '),
        dailyWage: formatCurrency(Number(statementData.worker.dailyWage)),
        totalWorkDays: `${totalWorkDays.toFixed(1)} يوم`,
        totalAmountDue: formatCurrency(totalAmountDue),
        totalAmountReceived: formatCurrency(totalAmountReceived),
        totalTransferred: formatCurrency(totalTransferred),
        remainingAmount: formatCurrency(remainingAmount),
        workerCurrentBalance: formatCurrency(workerCurrentBalance)
      };

      // Apply unified Excel settings
      worksheet.pageSetup = {
        paperSize: 9, // A4
        orientation: 'portrait',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.5, right: 0.5, top: 1.0, bottom: 1.0 }
      };
      
      worksheet.views = [{ rightToLeft: true, zoomScale: 100 }];

      // Add unified header
      worksheet.mergeCells('A1:L3');
      const headerCell = worksheet.getCell('A1');
      headerCell.value = `${headerInfo.companyName}\n${headerInfo.reportTitle}\n${headerInfo.period}`;
      headerCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      headerCell.font = { bold: true, size: 14 };
      headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };

      // Worker info section
      let currentRow = 5;
      worksheet.getCell(`A${currentRow}`).value = 'اسم العامل:';
      worksheet.getCell(`B${currentRow}`).value = headerInfo.workerName;
      worksheet.getCell(`C${currentRow}`).value = 'المهنة:';
      worksheet.getCell(`D${currentRow}`).value = headerInfo.workerType;
      worksheet.getCell(`E${currentRow}`).value = 'المشاريع:';
      worksheet.getCell(`F${currentRow}`).value = headerInfo.projectNames;
      
      currentRow += 2;
      worksheet.getCell(`A${currentRow}`).value = 'الأجر اليومي:';
      worksheet.getCell(`B${currentRow}`).value = headerInfo.dailyWage;
      worksheet.getCell(`C${currentRow}`).value = 'إجمالي الأيام:';
      worksheet.getCell(`D${currentRow}`).value = headerInfo.totalWorkDays;
      worksheet.getCell(`E${currentRow}`).value = 'إجمالي المستحق:';
      worksheet.getCell(`F${currentRow}`).value = headerInfo.totalAmountDue;

      // Add attendance data
      if (statementData.attendance.length > 0) {
        currentRow = 15;
        
        // Attendance section header
        worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
        const attendanceHeader = worksheet.getCell(`A${currentRow}`);
        attendanceHeader.value = 'سجل الحضور والأجور';
        attendanceHeader.font = { bold: true, size: 12 };
        attendanceHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
        attendanceHeader.alignment = { horizontal: 'center' };

        currentRow += 2;
        
        // Headers
        const headers = ['م', 'التاريخ', 'المشروع', 'أوقات العمل', 'أيام العمل', 'الأجر اليومي', 'المبلغ المستحق', 'المبلغ المدفوع', 'المتبقي', 'ملاحظات'];
        headers.forEach((header, index) => {
          const cell = worksheet.getCell(currentRow, index + 1);
          cell.value = header;
          cell.font = { bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E5F5' } };
          cell.alignment = { horizontal: 'center' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        currentRow++;

        // Data rows
        statementData.attendance.forEach((record, index) => {
          const rowData = [
            index + 1,
            formatDate(record.attendanceDate),
            record.projectName,
            `${record.startTime || ''} - ${record.endTime || ''}`,
            Number(record.workDays).toFixed(1),
            formatCurrency(Number(record.dailyWage)),
            formatCurrency(Number(record.actualWage) || 0),
            formatCurrency(Number(record.paidAmount) || 0),
            formatCurrency((Number(record.actualWage) || 0) - (Number(record.paidAmount) || 0)),
            record.notes || ''
          ];

          rowData.forEach((data, colIndex) => {
            const cell = worksheet.getCell(currentRow, colIndex + 1);
            cell.value = data;
            cell.alignment = { horizontal: 'center' };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
          currentRow++;
        });
      }

      // Add transfers data
      if (statementData.transfers.length > 0) {
        currentRow = worksheet.lastRow ? worksheet.lastRow.number + 3 : 20;
        
        // Transfers section header
        worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
        const transfersHeader = worksheet.getCell(`A${currentRow}`);
        transfersHeader.value = 'سجل التحويلات للأهل';
        transfersHeader.font = { bold: true, size: 12 };
        transfersHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4EC' } };
        transfersHeader.alignment = { horizontal: 'center' };

        currentRow += 2;
        
        // Headers
        const transferHeaders = ['م', 'التاريخ', 'المشروع', 'المبلغ', 'اسم المستلم', 'رقم الهاتف', 'العنوان', 'ملاحظات'];
        transferHeaders.forEach((header, index) => {
          const cell = worksheet.getCell(currentRow, index + 1);
          cell.value = header;
          cell.font = { bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E5F5' } };
          cell.alignment = { horizontal: 'center' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        currentRow++;

        // Data rows
        statementData.transfers.forEach((transfer, index) => {
          const rowData = [
            index + 1,
            formatDate(transfer.date),
            transfer.projectName,
            formatCurrency(Number(transfer.amount)),
            transfer.recipientName || '',
            transfer.recipientPhone || '',
            transfer.recipientAddress || '',
            transfer.notes || ''
          ];

          rowData.forEach((data, colIndex) => {
            const cell = worksheet.getCell(currentRow, colIndex + 1);
            cell.value = data;
            cell.alignment = { horizontal: 'center' };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
          currentRow++;
        });
      }

      // Auto-size columns
      worksheet.columns.forEach(column => {
        column.width = 15;
      });

      // Generate and save file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const fileName = `كشف_حساب_العامل_${statementData.worker.name}_${formatDate(dateFrom)}_${formatDate(dateTo)}.xlsx`;
      saveAs(blob, fileName);

      toast({
        title: "تم بنجاح",
        description: "تم تصدير كشف الحساب إلى Excel",
      });

    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تصدير الملف",
        variant: "destructive",
      });
    }
  }, [statementData, dateFrom, dateTo, toast]);

  // Calculate summary data
  const getSummaryData = () => {
    if (!statementData) return null;

    const totalWorkDays = statementData.attendance.reduce((sum, record) => sum + (Number(record.workDays) || 0), 0);
    const totalAmountDue = statementData.attendance.reduce((sum, record) => 
      sum + (Number(record.actualWage) || 0), 0);
    const totalAmountReceived = statementData.attendance.reduce((sum, record) => 
      sum + (Number(record.paidAmount) || 0), 0);
    const totalTransferred = statementData.transfers.reduce((sum, transfer) => sum + Number(transfer.amount), 0);
    const remainingAmount = totalAmountDue - totalAmountReceived;
    const workerCurrentBalance = totalAmountDue - totalAmountReceived - totalTransferred;

    return {
      totalWorkDays,
      totalAmountDue,
      totalAmountReceived,
      totalTransferred,
      remainingAmount,
      workerCurrentBalance
    };
  };

  const summaryData = getSummaryData();

  // Prepare table data for attendance
  const attendanceTableData = statementData?.attendance.map((record, index) => [
    index + 1,
    formatDate(record.attendanceDate),
    <Badge variant="outline" className="text-blue-600">
      {record.projectName}
    </Badge>,
    `${record.startTime || ''} - ${record.endTime || ''}`,
    `${Number(record.workDays).toFixed(1)} يوم`,
    formatCurrency(Number(record.dailyWage)),
    formatCurrency(Number(record.actualWage) || 0),
    <Badge variant={Number(record.paidAmount) > 0 ? "default" : "secondary"}>
      {formatCurrency(Number(record.paidAmount) || 0)}
    </Badge>,
    <Badge variant={(Number(record.actualWage) || 0) > (Number(record.paidAmount) || 0) ? "destructive" : "default"}>
      {formatCurrency((Number(record.actualWage) || 0) - (Number(record.paidAmount) || 0))}
    </Badge>,
    record.notes || '-'
  ]) || [];

  // Prepare table data for transfers
  const transfersTableData = statementData?.transfers.map((transfer, index) => [
    index + 1,
    formatDate(transfer.date),
    <Badge variant="outline" className="text-purple-600">
      {transfer.projectName}
    </Badge>,
    <Badge variant="outline" className="text-red-600">
      {formatCurrency(Number(transfer.amount))}
    </Badge>,
    transfer.recipientName || '-',
    transfer.recipientPhone || '-',
    transfer.recipientAddress || '-',
    transfer.notes || '-'
  ]) || [];

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Controls Section */}
      <Card className="mb-6 print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            كشف حساب العامل الشامل
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>المشاريع (يمكن اختيار أكثر من مشروع)</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={project.id}
                      checked={selectedProjectIds.includes(project.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedProjectIds([...selectedProjectIds, project.id]);
                        } else {
                          setSelectedProjectIds(selectedProjectIds.filter(id => id !== project.id));
                        }
                      }}
                    />
                    <Label htmlFor={project.id} className="text-sm font-normal cursor-pointer flex-1">
                      {project.name}
                    </Label>
                  </div>
                ))}
                {selectedProjectIds.length === 0 && (
                  <p className="text-sm text-muted-foreground">اختر مشروع واحد على الأقل</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>العامل</Label>
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

            <div className="space-y-2">
              <Label>من تاريخ</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>إلى تاريخ</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={generateStatement} 
              disabled={isGenerating || !selectedWorkerId || !dateFrom || !dateTo || selectedProjectIds.length === 0}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                "جاري الإنشاء..."
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  إنشاء الكشف
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Display */}
      {statementData && summaryData ? (
        <UnifiedReportTemplate
          title="كشف حساب العامل الشامل والتفصيلي"
          subtitle={`العامل: ${statementData.worker.name} - عبدالله عمر`}
          headerInfo={[
            { label: "اسم العامل", value: statementData.worker.name },
            { label: "المهنة", value: statementData.worker.type },
            { label: "المشاريع", value: statementData.projects.map(p => p.name).join(', ') },
            { label: "الأجر اليومي", value: formatCurrency(Number(statementData.worker.dailyWage)) },
            { label: "الفترة", value: `من ${formatDate(dateFrom)} إلى ${formatDate(dateTo)}` },
            { label: "إجمالي أيام العمل", value: `${summaryData.totalWorkDays.toFixed(1)} يوم` }
          ]}
          onPrint={printStatement}
          onExport={exportToExcel}
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              title="إجمالي المستحق"
              value={summaryData.totalAmountDue}
              valueColor="text-blue-600"
              icon={<DollarSign className="h-5 w-5 text-blue-500" />}
            />
            <SummaryCard
              title="إجمالي المستلم"
              value={summaryData.totalAmountReceived}
              valueColor="text-green-600"
              icon={<UserCheck className="h-5 w-5 text-green-500" />}
            />
            <SummaryCard
              title="إجمالي المحول للأهل"
              value={summaryData.totalTransferred}
              valueColor="text-orange-600"
              icon={<Send className="h-5 w-5 text-orange-500" />}
            />
            <SummaryCard
              title="الرصيد الحالي"
              value={summaryData.workerCurrentBalance}
              valueColor={summaryData.workerCurrentBalance >= 0 ? "text-blue-600" : "text-red-600"}
              icon={<DollarSign className="h-5 w-5 text-purple-500" />}
            />
          </div>

          {/* Attendance Table */}
          {statementData.attendance.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  سجل الحضور والأجور
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UnifiedTable
                  headers={['م', 'التاريخ', 'المشروع', 'أوقات العمل', 'أيام العمل', 'الأجر اليومي', 'المبلغ المستحق', 'المبلغ المدفوع', 'المتبقي', 'ملاحظات']}
                  data={attendanceTableData}
                />
              </CardContent>
            </Card>
          )}

          {/* Transfers Table */}
          {statementData.transfers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  سجل التحويلات للأهل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UnifiedTable
                  headers={['م', 'التاريخ', 'المشروع', 'المبلغ', 'اسم المستلم', 'رقم الهاتف', 'العنوان', 'ملاحظات']}
                  data={transfersTableData}
                />
              </CardContent>
            </Card>
          )}
        </UnifiedReportTemplate>
      ) : (
        !isGenerating && (
          <Card>
            <CardContent className="text-center py-12">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">اختر العامل والفترة لإنشاء الكشف</h3>
              <p className="text-gray-500">
                املأ البيانات المطلوبة أعلاه ثم اضغط على "إنشاء الكشف"
              </p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}