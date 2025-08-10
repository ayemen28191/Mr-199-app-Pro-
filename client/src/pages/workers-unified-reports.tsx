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
        const response = await apiRequest(url);
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

  // Export multiple workers report
  const exportMultipleWorkersToCSV = () => {
    if (reportData.length === 0) return;

    const headers = ['التاريخ', 'العامل', 'المشروع', 'ساعات العمل', 'الأجر اليومي', 'المبلغ المدفوع', 'الملاحظات'];
    const data = reportData.map(row => [
      formatDate(row.date),
      row.worker?.name || 'غير محدد',
      row.project?.name || 'غير محدد',
      row.hoursWorked,
      formatCurrency(parseFloat(row.dailyWage)),
      formatCurrency(parseFloat(row.paidAmount)),
      row.notes || ''
    ]);

    const csvData = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    
    const selectedWorkersText = selectedWorkerIds.length > 0 
      ? workers.filter(w => selectedWorkerIds.includes(w.id)).map(w => w.name).join('-')
      : 'جميع-العمال';
    
    link.download = `تقرير-العمال-${selectedWorkersText}-${dateFrom}-إلى-${dateTo}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "تم التصدير",
      description: "تم تصدير التقرير بنجاح",
    });
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
                  projectId={selectedProjectId}
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
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateFrom2">من تاريخ</Label>
                <Input
                  id="dateFrom2"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dateTo2">إلى تاريخ</Label>
                <Input
                  id="dateTo2"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1"
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

            <div className="flex gap-2">
              <Button
                onClick={generateMultipleWorkersReport}
                disabled={isGenerating}
                className="flex items-center gap-2"
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

                {/* Action Buttons */}
                <div className="flex gap-2 mb-4 no-print">
                  <Button onClick={handlePrint} variant="outline" size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    طباعة
                  </Button>
                  <Button onClick={exportMultipleWorkersToCSV} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    تصدير CSV
                  </Button>
                </div>

                {/* Data Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-purple-50">
                        <TableHead className="text-right font-semibold">التاريخ</TableHead>
                        <TableHead className="text-right font-semibold">العامل</TableHead>
                        <TableHead className="text-right font-semibold">المشروع</TableHead>
                        <TableHead className="text-center font-semibold">ساعات العمل</TableHead>
                        <TableHead className="text-center font-semibold">الأجر اليومي</TableHead>
                        <TableHead className="text-center font-semibold">المبلغ المدفوع</TableHead>
                        <TableHead className="text-right font-semibold">ملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((row, index) => (
                        <TableRow key={row.id || index}>
                          <TableCell className="text-right">{formatDate(row.date)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {row.worker?.name || 'غير محدد'}
                            <div className="text-xs text-muted-foreground">{row.worker?.type}</div>
                          </TableCell>
                          <TableCell className="text-right">{row.project?.name || 'غير محدد'}</TableCell>
                          <TableCell className="text-center">{row.hoursWorked || 0}</TableCell>
                          <TableCell className="text-center font-semibold">
                            {formatCurrency(parseFloat(row.dailyWage || '0'))}
                          </TableCell>
                          <TableCell className="text-center font-semibold text-green-600">
                            {formatCurrency(parseFloat(row.paidAmount || '0'))}
                          </TableCell>
                          <TableCell className="text-right">
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