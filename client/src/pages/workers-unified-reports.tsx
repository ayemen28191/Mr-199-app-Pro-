import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useSelectedProject } from "@/hooks/use-selected-project";
import { 
  Users, FileText, Download, RefreshCw, Filter, User, DollarSign, UserCheck, Printer
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate, getCurrentDate } from "@/lib/utils";
import { EnhancedWorkerAccountStatement } from "@/components/EnhancedWorkerAccountStatementFixed";
import type { Worker, Project } from "@shared/schema";

export default function WorkersUnifiedReports() {
  const { selectedProjectId } = useSelectedProject();
  const { toast } = useToast();
  
  // States for report modes
  const [reportMode, setReportMode] = useState<'single' | 'multiple'>('single');
  
  // Single worker states
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState(getCurrentDate());
  const [showWorkerStatement, setShowWorkerStatement] = useState(false);
  
  // Multiple workers states
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Fetch data
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedWorker = workers.find(w => w.id === selectedWorkerId);

  // Generate multiple workers report  
  const generateMultipleWorkersReport = async () => {
    if (selectedWorkerIds.length === 0 || !dateFrom || !dateTo) {
      toast({
        title: "بيانات ناقصة", 
        description: "يرجى اختيار العمال والتواريخ",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const allAttendanceData: any[] = [];
      
      for (const workerId of selectedWorkerIds) {
        const url = `/api/workers/${workerId}/account-statement?dateFrom=${dateFrom}&dateTo=${dateTo}`;
        const response = await apiRequest('GET', url);
        const attendance = response?.attendance || [];
        
        // إضافة معلومات العامل والمشروع
        const worker = workers.find(w => w.id === workerId);
        attendance.forEach((record: any) => {
          const project = projects.find(p => p.id === record.projectId);
          allAttendanceData.push({
            ...record,
            worker,
            project
          });
        });
      }

      // ترتيب البيانات حسب التاريخ
      allAttendanceData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setReportData(allAttendanceData);
      setShowResults(true);

      toast({
        title: "تم إنشاء التقرير",
        description: `تم العثور على ${allAttendanceData.length} سجل حضور`,
      });

    } catch (error) {
      console.error('Error generating multiple workers report:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء التقرير",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Enhanced Excel Export with Professional Formatting
  const exportToExcel = async () => {
    if (reportData.length === 0) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات للتصدير",
        variant: "destructive",
      });
      return;
    }

    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('تقرير العمال الشامل');

      // إعداد العرض والارتفاع
      worksheet.columns = [
        { header: 'التاريخ', key: 'date', width: 15 },
        { header: 'العامل', key: 'worker', width: 25 },
        { header: 'نوع العامل', key: 'workerType', width: 20 },
        { header: 'المشروع', key: 'project', width: 30 },
        { header: 'ساعات العمل', key: 'hours', width: 15 },
        { header: 'الأجر اليومي', key: 'dailyWage', width: 18 },
        { header: 'المبلغ المدفوع', key: 'paidAmount', width: 18 },
        { header: 'الرصيد المتبقي', key: 'balance', width: 18 },
        { header: 'الملاحظات', key: 'notes', width: 25 }
      ];

      // تنسيق رأس الجدول
      const headerRow = worksheet.getRow(1);
      headerRow.height = 35;
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
      });

      // إضافة البيانات
      reportData.forEach((row, index) => {
        const rowData = worksheet.addRow({
          date: formatDate(row.date),
          worker: row.worker?.name || 'غير محدد',
          workerType: row.worker?.type || 'غير محدد',
          project: row.project?.name || 'غير محدد',
          hours: row.hoursWorked || 8,
          dailyWage: parseFloat(row.dailyWage || '0'),
          paidAmount: parseFloat(row.paidAmount || '0'),
          balance: (parseFloat(row.dailyWage || '0') - parseFloat(row.paidAmount || '0')),
          notes: row.notes || ''
        });

        // تنسيق الصفوف
        rowData.height = 25;
        rowData.eachCell((cell, colIndex) => {
          cell.font = { name: 'Arial', size: 11 };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          };

          // تنسيق الأرقام
          if ([6, 7, 8].includes(colIndex)) {
            cell.numFmt = '#,##0 "ر.ي"';
            if (cell.value && parseFloat(cell.value) < 0) {
              cell.font = { ...cell.font, color: { argb: 'FFFF0000' } };
            }
          }

          // لون متبادل للصفوف
          if (index % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
          }
        });
      });

      // إضافة صف الإجمالي
      const totalRow = worksheet.addRow({
        date: '',
        worker: '',
        workerType: '',
        project: 'المجموع الكلي',
        hours: reportData.reduce((sum, row) => sum + (row.hoursWorked || 8), 0),
        dailyWage: totalEarned,
        paidAmount: totalPaid,
        balance: totalEarned - totalPaid,
        notes: ''
      });

      // تنسيق صف الإجمالي
      totalRow.height = 30;
      totalRow.eachCell((cell, colIndex) => {
        cell.font = { name: 'Arial', size: 12, bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thick' }, left: { style: 'thin' },
          bottom: { style: 'thick' }, right: { style: 'thin' }
        };

        if ([6, 7, 8].includes(colIndex)) {
          cell.numFmt = '#,##0 "ر.ي"';
          cell.font = { ...cell.font, color: { argb: 'FFFFFFFF' } };
        }
      });

      // إضافة معلومات إضافية
      const infoStartRow = worksheet.rowCount + 3;
      worksheet.mergeCells(`A${infoStartRow}:I${infoStartRow}`);
      const infoHeaderCell = worksheet.getCell(`A${infoStartRow}`);
      infoHeaderCell.value = `تقرير العمال الشامل - الفترة من ${formatDate(dateFrom)} إلى ${formatDate(dateTo)}`;
      infoHeaderCell.font = { name: 'Arial', size: 14, bold: true };
      infoHeaderCell.alignment = { horizontal: 'center' };
      infoHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

      // حفظ الملف
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const selectedWorkersText = selectedWorkerIds.length > 0 
        ? workers.filter(w => selectedWorkerIds.includes(w.id)).map(w => w.name).join('-')
        : 'جميع-العمال';
      
      const selectedProjectsText = selectedProjectIds.length > 0 
        ? projects.filter(p => selectedProjectIds.includes(p.id)).map(p => p.name).join('-')
        : 'جميع-المشاريع';

      const { saveAs } = await import('file-saver');
      saveAs(blob, `تقرير-العمال-الاحترافي-${selectedWorkersText}-${selectedProjectsText}-${dateFrom}-إلى-${dateTo}.xlsx`);

      toast({
        title: "تم التصدير بنجاح",
        description: "تم إنشاء ملف Excel الاحترافي بنجاح",
      });
    } catch (error) {
      console.error('Excel export error:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء إنشاء ملف Excel",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate totals for multiple workers report
  const totalEarned = reportData.reduce((sum, row) => sum + parseFloat(row.dailyWage || '0'), 0);
  const totalPaid = reportData.reduce((sum, row) => sum + parseFloat(row.paidAmount || '0'), 0);

  return (
    <div className="container mx-auto p-4 space-y-6 bg-gradient-to-br from-purple-50 via-white to-indigo-50 min-h-screen">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="bg-purple-100 p-3 rounded-full">
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-purple-800 mb-2">
          تقارير العمال الشاملة
        </h1>
        <p className="text-purple-600">
          كشوفات الحسابات والتقارير التفصيلية للعمال
        </p>
      </div>

      {/* Report Mode Selection */}
      <Card className="border-purple-200 shadow-lg">
        <CardHeader className="bg-purple-50 border-b border-purple-200">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Filter className="h-5 w-5" />
            نوع التقرير
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Button
              variant={reportMode === 'single' ? 'default' : 'outline'}
              onClick={() => {
                setReportMode('single');
                setShowResults(false);
                setShowWorkerStatement(false);
              }}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              كشف حساب عامل واحد
            </Button>
            <Button
              variant={reportMode === 'multiple' ? 'default' : 'outline'}
              onClick={() => {
                setReportMode('multiple');
                setShowResults(false);
                setShowWorkerStatement(false);
              }}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              تقرير متعدد العمال
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Single Worker Mode */}
      {reportMode === 'single' && (
        <Card className="border-purple-200 shadow-lg">
          <CardHeader className="bg-purple-50 border-b border-purple-200">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <User className="h-5 w-5" />
              كشف حساب عامل واحد
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateFrom">من تاريخ</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dateTo">إلى تاريخ</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>المشروع المحدد</Label>
                <Badge variant="outline" className="ml-2">
                  {selectedProject?.name || 'لم يتم اختيار مشروع'}
                </Badge>
              </div>
              <div>
                <Label htmlFor="worker">العامل</Label>
                <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                  <SelectTrigger className="mt-1">
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
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (!selectedProjectId || !selectedWorkerId || !dateFrom || !dateTo) {
                    toast({
                      title: "بيانات ناقصة",
                      description: "يرجى اختيار المشروع والعامل والتواريخ",
                      variant: "destructive",
                    });
                    return;
                  }
                  setShowWorkerStatement(true);
                }}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                إنشاء كشف الحساب
              </Button>
            </div>

            {/* Show Enhanced Worker Statement */}
            {showWorkerStatement && selectedProjectId && selectedWorkerId && dateFrom && dateTo && (
              <div className="mt-6 border-t pt-6">
                <EnhancedWorkerAccountStatement
                  data={{
                    worker: selectedWorker,
                    attendance: [],
                    transfers: [],
                    summary: {}
                  }}
                  selectedProject={selectedProject}
                  workerId={selectedWorkerId}
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Multiple Workers Mode */}
      {reportMode === 'multiple' && (
        <Card className="border-purple-200 shadow-lg">
          <CardHeader className="bg-purple-50 border-b border-purple-200">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Users className="h-5 w-5" />
              تقرير متعدد العمال
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 lg:p-6 space-y-4">
            {/* Multi-Project Selection - Enhanced */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-green-500 p-1 rounded-full">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <Label className="text-green-800 font-semibold">اختيار المشاريع (إمكانية متعددة)</Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-2 bg-white p-2 rounded border">
                    <Checkbox
                      id={`project-${project.id}`}
                      checked={selectedProjectIds.includes(project.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedProjectIds([...selectedProjectIds, project.id]);
                        } else {
                          setSelectedProjectIds(selectedProjectIds.filter(id => id !== project.id));
                        }
                      }}
                    />
                    <Label htmlFor={`project-${project.id}`} className="text-xs font-medium truncate">
                      {project.name}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">
                  {selectedProjectIds.length > 0 
                    ? `تم اختيار ${selectedProjectIds.length} مشروع` 
                    : 'لم يتم اختيار مشاريع (جميع المشاريع)'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateFrom2" className="text-sm font-medium">من تاريخ</Label>
                <Input
                  id="dateFrom2"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1 h-12"
                />
              </div>
              <div>
                <Label htmlFor="dateTo2" className="text-sm font-medium">إلى تاريخ</Label>
                <Input
                  id="dateTo2"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1 h-12"
                />
              </div>
            </div>

            <div>
              <Label>العمال المطلوبين</Label>
              <div className="mt-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-gray-50">
                {workers.map((worker) => (
                  <div key={worker.id} className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id={`worker-${worker.id}`}
                      checked={selectedWorkerIds.includes(worker.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedWorkerIds([...selectedWorkerIds, worker.id]);
                        } else {
                          setSelectedWorkerIds(selectedWorkerIds.filter(id => id !== worker.id));
                        }
                      }}
                    />
                    <label htmlFor={`worker-${worker.id}`} className="text-sm font-medium">
                      {worker.name} - {worker.type}
                    </label>
                  </div>
                ))}
              </div>
              <div className="text-sm text-purple-600 mt-1">
                تم اختيار {selectedWorkerIds.length} عامل من {workers.length}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={generateMultipleWorkersReport}
                disabled={isGenerating || selectedWorkerIds.length === 0 || !dateFrom || !dateTo}
                className="flex items-center justify-center gap-2 flex-1 h-12"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    إنشاء التقرير
                  </>
                )}
              </Button>
            </div>

            {/* Results */}
            {showResults && reportData.length > 0 && (
              <div className="mt-6 border-t pt-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{reportData.length}</div>
                      <div className="text-sm text-muted-foreground">إجمالي السجلات</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold text-green-600">{selectedWorkerIds.length}</div>
                      <div className="text-sm text-muted-foreground">العمال المشمولين</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <DollarSign className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalEarned)}</div>
                      <div className="text-sm text-muted-foreground">إجمالي المستحق</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <UserCheck className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalPaid)}</div>
                      <div className="text-sm text-muted-foreground">إجمالي المدفوع</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 mb-4 no-print">
                  <Button onClick={exportToExcel} variant="default" size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    تصدير Excel احترافي
                  </Button>
                  <Button onClick={handlePrint} variant="outline" size="sm" className="flex-1">
                    <Printer className="h-4 w-4 mr-2" />
                    طباعة
                  </Button>
                </div>

                {/* Enhanced Responsive Data Display */}
                {/* Desktop Table View */}
                <div className="hidden md:block border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-purple-50 to-purple-100">
                        <TableHead className="text-right font-bold text-purple-800">التاريخ</TableHead>
                        <TableHead className="text-right font-bold text-purple-800">العامل</TableHead>
                        <TableHead className="text-right font-bold text-purple-800">المشروع</TableHead>
                        <TableHead className="text-center font-bold text-purple-800">ساعات العمل</TableHead>
                        <TableHead className="text-center font-bold text-purple-800">الأجر اليومي</TableHead>
                        <TableHead className="text-center font-bold text-purple-800">المبلغ المدفوع</TableHead>
                        <TableHead className="text-right font-bold text-purple-800">ملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((row, index) => (
                        <TableRow key={row.id || index} className={index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}>
                          <TableCell className="text-right font-medium">{formatDate(row.date)}</TableCell>
                          <TableCell className="text-right">
                            <div className="font-semibold">{row.worker?.name || 'غير محدد'}</div>
                            <div className="text-xs text-muted-foreground">{row.worker?.type}</div>
                          </TableCell>
                          <TableCell className="text-right text-sm">{row.project?.name || 'غير محدد'}</TableCell>
                          <TableCell className="text-center">{row.hoursWorked || 8}</TableCell>
                          <TableCell className="text-center font-bold text-green-700">
                            {formatCurrency(parseFloat(row.dailyWage || '0'))}
                          </TableCell>
                          <TableCell className="text-center font-bold text-blue-700">
                            {formatCurrency(parseFloat(row.paidAmount || '0'))}
                          </TableCell>
                          <TableCell className="text-right text-sm text-gray-600">
                            {row.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}