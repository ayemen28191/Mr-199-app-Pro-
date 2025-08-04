import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Download, Printer, Users, Filter, Calendar, DollarSign, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSelectedProject } from "@/hooks/use-selected-project";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate, getCurrentDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { Worker, Project, WorkerAttendance } from "@shared/schema";
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface WorkerReportData {
  worker: Worker;
  project: Project;
  dailyWage: number;
  totalWorkDays: number;
  totalAmountDue: number;
  totalAmountReceived: number;
  remainingAmount: number;
  attendanceRecords: WorkerAttendance[];
}

export default function WorkersFilterReport() {
  const { selectedProjectId } = useSelectedProject();
  const { toast } = useToast();
  
  // Form states
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState(getCurrentDate());
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [reportData, setReportData] = useState<WorkerReportData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch data
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Filter workers by selected project (workers don't have projectId field)
  const projectWorkers = workers;

  // Handle worker selection
  const handleWorkerToggle = (workerId: string, checked: boolean) => {
    if (checked) {
      setSelectedWorkerIds(prev => [...prev, workerId]);
    } else {
      setSelectedWorkerIds(prev => prev.filter(id => id !== workerId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedWorkerIds(projectWorkers.map(w => w.id));
    } else {
      setSelectedWorkerIds([]);
    }
  };

  // Generate report
  const generateReport = useCallback(async () => {
    if (!selectedProjectId) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار مشروع أولاً",
        variant: "destructive",
      });
      return;
    }

    if (!dateFrom || !dateTo) {
      toast({
        title: "تنبيه", 
        description: "يرجى تحديد فترة التقرير",
        variant: "destructive",
      });
      return;
    }

    if (selectedWorkerIds.length === 0) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار عامل واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const reportResults: WorkerReportData[] = [];

      for (const workerId of selectedWorkerIds) {
        const worker = workers.find(w => w.id === workerId);
        if (!worker) continue;

        // Fetch worker attendance data for the period
        const attendanceResponse = await apiRequest(
          `/api/worker-attendance-filter?workerId=${workerId}&dateFrom=${dateFrom}&dateTo=${dateTo}`,
          { method: 'GET' }
        );

        const attendanceRecords: WorkerAttendance[] = attendanceResponse || [];
        
        // Calculate totals
        const totalWorkDays = attendanceRecords.reduce((sum, record) => sum + (Number(record.workDays) || 0), 0);
        const totalAmountDue = attendanceRecords.reduce((sum, record) => sum + (Number(record.workDays) || 0) * (Number(worker.dailyWage) || 0), 0);
        const totalAmountReceived = attendanceRecords.reduce((sum, record) => sum + (Number(record.paidAmount) || 0), 0);
        const remainingAmount = totalAmountDue - totalAmountReceived;

        reportResults.push({
          worker,
          project: selectedProject!,
          dailyWage: Number(worker.dailyWage) || 0,
          totalWorkDays,
          totalAmountDue,
          totalAmountReceived,
          remainingAmount,
          attendanceRecords
        });
      }

      setReportData(reportResults);
      
      toast({
        title: "تم بنجاح",
        description: `تم إنشاء تقرير تصفية العمال لـ ${reportResults.length} عامل`,
      });

    } catch (error) {
      console.error("Error generating workers filter report:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء التقرير",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedProjectId, dateFrom, dateTo, selectedWorkerIds, workers, selectedProject, toast]);

  // Calculate totals
  const totals = useMemo(() => {
    return reportData.reduce((acc, item) => ({
      totalWorkDays: acc.totalWorkDays + item.totalWorkDays,
      totalAmountDue: acc.totalAmountDue + item.totalAmountDue,
      totalAmountReceived: acc.totalAmountReceived + item.totalAmountReceived,
      remainingAmount: acc.remainingAmount + item.remainingAmount,
    }), {
      totalWorkDays: 0,
      totalAmountDue: 0,
      totalAmountReceived: 0,
      remainingAmount: 0,
    });
  }, [reportData]);

  // Export to Excel
  const exportToExcel = useCallback(async () => {
    if (!reportData.length) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات لتصديرها",
        variant: "destructive",
      });
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('تقرير تصفية العمال', {
        views: [{ rightToLeft: true }]
      });

      // Add company header
      worksheet.mergeCells('A1:H2');
      const companyHeader = worksheet.getCell('A1');
      companyHeader.value = `شركة الحاج عبدالرحمن علي الجهني وأولاده\nتقرير تصفية العمال - ${selectedProject?.name}`;
      companyHeader.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      companyHeader.font = { size: 16, bold: true };

      // Add period info
      worksheet.mergeCells('A3:H3');
      const periodHeader = worksheet.getCell('A3');
      periodHeader.value = `الفترة: من ${formatDate(dateFrom)} إلى ${formatDate(dateTo)} | تاريخ التقرير: ${formatDate(new Date())}`;
      periodHeader.alignment = { horizontal: 'center', vertical: 'middle' };
      periodHeader.font = { size: 12 };

      // Add headers
      const headers = [
        'اسم المشروع', 'اسم العامل', 'الأجر اليومي', 'إجمالي عدد الأيام', 
        'إجمالي المبلغ المستحق', 'إجمالي المبلغ المستلم', 'إجمالي المبلغ المتبقي'
      ];

      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2563EB' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Add data rows
      reportData.forEach((item, index) => {
        const dataRow = worksheet.addRow([
          item.project.name,
          item.worker.name,
          item.dailyWage,
          item.totalWorkDays,
          item.totalAmountDue,
          item.totalAmountReceived,
          item.remainingAmount
        ]);

        dataRow.eachCell((cell, colNumber) => {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };

          // Format currency columns
          if ([3, 5, 6, 7].includes(colNumber)) {
            cell.numFmt = '#,##0.00';
          }

          // Alternating row colors
          if (index % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' }
            };
          }
        });
      });

      // Add totals row
      const totalsRow = worksheet.addRow([
        'الإجمالي',
        `${reportData.length} عامل`,
        '',
        totals.totalWorkDays,
        totals.totalAmountDue,
        totals.totalAmountReceived,
        totals.remainingAmount
      ]);

      totalsRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFDBEAFE' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thick' },
          left: { style: 'thin' },
          bottom: { style: 'thick' },
          right: { style: 'thin' }
        };

        // Format currency columns
        if ([3, 5, 6, 7].includes(colNumber)) {
          cell.numFmt = '#,##0.00';
        }
      });

      // Set column widths
      worksheet.columns = [
        { width: 20 }, // اسم المشروع
        { width: 20 }, // اسم العامل
        { width: 15 }, // الأجر اليومي
        { width: 18 }, // إجمالي عدد الأيام
        { width: 20 }, // إجمالي المبلغ المستحق
        { width: 20 }, // إجمالي المبلغ المستلم
        { width: 20 }  // إجمالي المبلغ المتبقي
      ];

      // Save file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const fileName = `تقرير-تصفية-العمال-${selectedProject?.name}-${formatDate(dateFrom)}-${formatDate(dateTo)}.xlsx`;
      saveAs(blob, fileName);

      toast({
        title: "تم بنجاح",
        description: "تم تصدير تقرير تصفية العمال إلى Excel",
      });

    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تصدير الملف",
        variant: "destructive",
      });
    }
  }, [reportData, selectedProject, dateFrom, dateTo, totals, toast]);

  // Print report
  const printReport = useCallback(() => {
    if (!reportData.length) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات للطباعة",
        variant: "destructive",
      });
      return;
    }

    window.print();
  }, [reportData, toast]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">تقرير تصفية العمال</h1>
          <p className="text-muted-foreground">إنشاء تقرير شامل للعمال المحددين</p>
        </div>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            مرشحات التقرير
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">من تاريخ</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">إلى تاريخ</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Worker Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">اختيار العمال</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="selectAll"
                  checked={selectedWorkerIds.length === projectWorkers.length && projectWorkers.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="selectAll">تحديد الكل</Label>
              </div>
            </div>

            {projectWorkers.length === 0 ? (
              <p className="text-muted-foreground">لا توجد عمال في المشروع المحدد</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {projectWorkers.map((worker) => (
                  <div key={worker.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Checkbox
                      id={worker.id}
                      checked={selectedWorkerIds.includes(worker.id)}
                      onCheckedChange={(checked) => handleWorkerToggle(worker.id, !!checked)}
                    />
                    <Label htmlFor={worker.id} className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium">{worker.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {worker.type} - {formatCurrency(Number(worker.dailyWage))} ريال/يوم
                        </p>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {selectedWorkerIds.length > 0 && (
              <Badge variant="secondary" className="text-sm">
                تم اختيار {selectedWorkerIds.length} من {projectWorkers.length} عامل
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={generateReport}
              disabled={isGenerating || !selectedProjectId || !dateFrom || !dateTo || selectedWorkerIds.length === 0}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              {isGenerating ? "جاري الإنشاء..." : "إنشاء التقرير"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData.length > 0 && (
        <Card className="print-preview">
          <CardHeader className="print:hidden">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                نتائج تقرير تصفية العمال
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportToExcel}>
                  <FileSpreadsheet className="h-4 w-4 ml-2" />
                  تصدير Excel
                </Button>
                <Button variant="outline" size="sm" onClick={printReport}>
                  <Printer className="h-4 w-4 ml-2" />
                  طباعة
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Print Header */}
            <div className="hidden print:block mb-6 text-center">
              <h1 className="text-2xl font-bold mb-2">شركة الحاج عبدالرحمن علي الجهني وأولاده</h1>
              <h2 className="text-xl font-semibold mb-2">تقرير تصفية العمال - {selectedProject?.name}</h2>
              <p className="text-sm text-muted-foreground">
                الفترة: من {formatDate(dateFrom)} إلى {formatDate(dateTo)} | تاريخ التقرير: {formatDate(new Date())}
              </p>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">اسم المشروع</TableHead>
                    <TableHead className="text-center">اسم العامل</TableHead>
                    <TableHead className="text-center">الأجر اليومي</TableHead>
                    <TableHead className="text-center">إجمالي عدد الأيام</TableHead>
                    <TableHead className="text-center">إجمالي المبلغ المستحق</TableHead>
                    <TableHead className="text-center">إجمالي المبلغ المستلم</TableHead>
                    <TableHead className="text-center">إجمالي المبلغ المتبقي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((item, index) => (
                    <TableRow key={item.worker.id} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                      <TableCell className="text-center">{item.project.name}</TableCell>
                      <TableCell className="text-center font-medium">{item.worker.name}</TableCell>
                      <TableCell className="text-center">{formatCurrency(item.dailyWage)}</TableCell>
                      <TableCell className="text-center">{item.totalWorkDays}</TableCell>
                      <TableCell className="text-center text-green-600 font-medium">
                        {formatCurrency(item.totalAmountDue)}
                      </TableCell>
                      <TableCell className="text-center text-blue-600 font-medium">
                        {formatCurrency(item.totalAmountReceived)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-medium ${
                          item.remainingAmount > 0 ? 'text-red-600' : 
                          item.remainingAmount < 0 ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {formatCurrency(item.remainingAmount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Totals Row */}
                  <TableRow className="bg-primary/10 font-bold border-t-2">
                    <TableCell className="text-center">الإجمالي</TableCell>
                    <TableCell className="text-center">{reportData.length} عامل</TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center">{totals.totalWorkDays}</TableCell>
                    <TableCell className="text-center text-green-600">
                      {formatCurrency(totals.totalAmountDue)}
                    </TableCell>
                    <TableCell className="text-center text-blue-600">
                      {formatCurrency(totals.totalAmountReceived)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`${
                        totals.remainingAmount > 0 ? 'text-red-600' : 
                        totals.remainingAmount < 0 ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {formatCurrency(totals.remainingAmount)}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground">عدد العمال</p>
                <p className="text-2xl font-bold text-blue-600">{reportData.length}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground">إجمالي الأيام</p>
                <p className="text-2xl font-bold text-green-600">{totals.totalWorkDays}</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-muted-foreground">إجمالي المستحق</p>
                <p className="text-lg font-bold text-yellow-600">{formatCurrency(totals.totalAmountDue)}</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-muted-foreground">إجمالي المتبقي</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(totals.remainingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}