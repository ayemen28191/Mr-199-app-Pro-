import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Printer, Calculator } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useSelectedProject } from "@/hooks/use-selected-project";
import type { Worker, WorkerAttendance, Project } from "@shared/schema";

export default function WorkerStatementReport() {
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showReport, setShowReport] = useState(false);
  const { selectedProjectId } = useSelectedProject();

  // Query for workers
  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  // Query for projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Query for worker statement with project support
  const { data: workerStatement, isLoading: isLoadingStatement } = useQuery({
    queryKey: ["/api/workers/statement", selectedWorkerId, selectedProjectId, dateFrom, dateTo],
    queryFn: async () => {
      if (!selectedWorkerId || !dateFrom || !dateTo) return null;
      
      const params = new URLSearchParams();
      params.append('dateFrom', dateFrom);
      params.append('dateTo', dateTo);
      if (selectedProjectId) {
        params.append('projectId', selectedProjectId);
      }
      
      const response = await fetch(`/api/workers/${selectedWorkerId}/account-statement?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch worker statement");
      }
      
      return response.json();
    },
    enabled: !!selectedWorkerId && !!dateFrom && !!dateTo && showReport,
  });

  // Check if worker works in multiple projects
  const { data: multiProjectInfo } = useQuery({
    queryKey: ["/api/workers/multi-project", selectedWorkerId],
    queryFn: async () => {
      if (!selectedWorkerId) return null;
      const response = await fetch(`/api/workers/${selectedWorkerId}/multi-project-statement`);
      return response.ok ? response.json() : null;
    },
    enabled: !!selectedWorkerId,
  });

  const selectedWorker = workers.find(w => w.id === selectedWorkerId);
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'decimal',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(amount);
  };

  // Calculate totals from workerStatement
  const attendance = workerStatement?.attendance || [];
  const workerTransfers = workerStatement?.transfers || [];

  const generateReport = () => {
    if (!selectedWorkerId || !dateFrom || !dateTo) {
      alert("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    setShowReport(true);
  };

  const exportToExcel = () => {
    if (!attendance || !selectedWorker || attendance.length === 0) {
      alert("لا توجد بيانات للتصدير");
      return;
    }

    try {
      const headers = [
        'م', 'الاسم', 'التاريخ', 'الأجر اليومي', 'أيام العمل', 'ساعات العمل', 
        'المبلغ المستحق', 'المبلغ المستلم', 'المتبقي', 'ملاحظات'
      ];
      
      const rows = attendance.map((record, index) => [
        index + 1,
        selectedWorker.name,
        format(new Date(record.date), 'yyyy-MM-dd'),
        formatCurrency(parseFloat(record.dailyWage || '0')),
        '1',
        '0', 
        formatCurrency(parseFloat(record.dailyWage || '0')),
        record.paymentType === 'نقد' ? formatCurrency(parseFloat(record.dailyWage || '0')) : '0',
        record.paymentType === 'نقد' ? '0' : formatCurrency(parseFloat(record.dailyWage || '0')),
        record.workDescription || ''
      ]);

      const totalEarned = attendance.reduce((sum, a) => sum + parseFloat(a.dailyWage || '0'), 0);
      rows.push(['', '', '', '', '', '', '', '', '', '']);
      rows.push(['', 'إجمالي عدد أيام العمل', '', '', '', '', attendance.length.toString(), '', '', '']);
      rows.push(['', 'إجمالي المبلغ المستحق للعامل', '', '', '', '', formatCurrency(totalEarned), '', '', '']);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell || '')}"`).join(','))
        .join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `كشف_حساب_${selectedWorker.name}_${dateFrom}_${dateTo}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert("تم تصدير التقرير بنجاح");
    } catch (error) {
      console.error('خطأ في التصدير:', error);
      alert("حدث خطأ أثناء تصدير التقرير");
    }
  };

  const printReport = () => {
    try {
      // تطبيق تنسيقات الطباعة
      document.body.classList.add('printing');
      
      // إخفاء عناصر الواجهة غير المطلوبة للطباعة
      const elementsToHide = document.querySelectorAll('.no-print, nav, .sidebar, .header-controls, .print\\:hidden, .bg-gradient-to-r');
      const originalStyles: { element: HTMLElement; display: string }[] = [];
      
      elementsToHide.forEach((el) => {
        const element = el as HTMLElement;
        originalStyles.push({
          element: element,
          display: element.style.display
        });
        element.style.display = 'none';
      });
      
      // تأخير قصير للتأكد من تطبيق التنسيقات
      setTimeout(() => {
        window.print();
        
        // استعادة العناصر المخفية بعد الطباعة
        setTimeout(() => {
          originalStyles.forEach(({ element, display }) => {
            element.style.display = display;
          });
          document.body.classList.remove('printing');
        }, 100);
      }, 100);
      
    } catch (error) {
      console.error('خطأ في الطباعة:', error);
      alert("حدث خطأ أثناء الطباعة");
    }
  };

  // Calculate financial totals
  const totalEarned = attendance.reduce((sum, a) => sum + parseFloat(a.dailyWage || '0'), 0);
  const totalPaid = attendance.reduce((sum, a) => sum + parseFloat(a.paidAmount || '0'), 0);
  const totalTransferred = workerTransfers.reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
  const totalRemaining = totalEarned - totalPaid - totalTransferred;

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <FileText className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">كشف حساب العامل</h1>
          <p className="text-muted-foreground">
            إنشاء كشف حساب مفصل للعامل للفترة المحددة
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle>بيانات الكشف</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="worker">اسم العامل</Label>
              <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر العامل" />
                </SelectTrigger>
                <SelectContent>
                  {workers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.name}
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
              <Calculator className="h-4 w-4" />
              عرض الكشف
            </Button>
            
            {attendance.length > 0 && selectedWorker && (
              <div className="flex gap-2 no-print">
                <Button 
                  variant="outline" 
                  onClick={exportToExcel} 
                  className="flex items-center gap-2 hover:bg-green-50 hover:text-green-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  تصدير Excel
                </Button>
                <Button 
                  variant="outline" 
                  onClick={printReport} 
                  className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  طباعة
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoadingStatement && (
        <div className="text-center py-8">جاري التحميل...</div>
      )}

      {/* Report Display */}
      {attendance.length > 0 && selectedWorker && (
        <div className="print-section">
          <Card>
            <CardContent className="p-0">
              {/* Print Header - Only visible during print */}
              <div className="hidden print:block">
                <div className="text-center mb-4">
                  <h1 className="text-2xl font-bold mb-2">إدارة المشاريع الإنشائية</h1>
                  <p className="text-sm">هاتف: 123456789 | البريد الإلكتروني: info@construction.com</p>
                </div>
                <div className="bg-orange-100 p-3 mb-4 border border-orange-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="font-bold">اسم المشروع:</span> {selectedProject?.name || 'غير محدد'}</div>
                    <div><span className="font-bold">تاريخ الطباعة:</span> {format(new Date(), 'dd/MM/yyyy', { locale: ar })}</div>
                  </div>
                </div>
              </div>

              {/* Report Header */}
              <div className="bg-gradient-to-r from-orange-400 to-yellow-400 text-white p-4 text-center print:bg-orange-400 print:text-white">
                <h2 className="text-xl font-bold">
                  كشف حساب العامل للفترة من تاريخ {format(new Date(dateFrom), 'dd/MM/yyyy', { locale: ar })} إلى تاريخ {format(new Date(dateTo), 'dd/MM/yyyy', { locale: ar })}
                </h2>
              </div>

              {/* Worker Information */}
              <div className="grid grid-cols-2 gap-0 border-b">
                <div className="border-l">
                  <div className="grid grid-cols-2 h-10">
                    <div className="bg-orange-200 border-l border-b p-2 text-sm font-medium text-center">
                      اسم العامل
                    </div>
                    <div className="border-b p-2 text-sm text-center">
                      {selectedWorker.name}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 h-10">
                    <div className="bg-orange-200 border-l border-b p-2 text-sm font-medium text-center">
                      نوع العامل
                    </div>
                    <div className="border-b p-2 text-sm text-center">
                      {selectedWorker.type}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="grid grid-cols-2 h-10">
                    <div className="bg-orange-200 border-l border-b p-2 text-sm font-medium text-center">
                      تاريخ بداية العمل
                    </div>
                    <div className="border-b p-2 text-sm text-center">
                      {format(new Date(dateFrom), 'dd/MM/yyyy', { locale: ar })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 h-10">
                    <div className="bg-orange-200 border-l border-b p-2 text-sm font-medium text-center">
                      الأجر اليومي
                    </div>
                    <div className="border-b p-2 text-sm text-center">
                      {formatCurrency(parseFloat(selectedWorker.dailyWage))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Headers */}
              <div className="bg-orange-200 border-b">
                <div className="grid grid-cols-10 text-xs font-medium">
                  <div className="border-l p-2 text-center">م</div>
                  <div className="border-l p-2 text-center">الاسم</div>
                  <div className="border-l p-2 text-center">الأجر اليومي</div>
                  <div className="border-l p-2 text-center">التاريخ</div>
                  <div className="border-l p-2 text-center">أيام العمل</div>
                  <div className="border-l p-2 text-center">ساعات العمل</div>
                  <div className="border-l p-2 text-center">المبلغ المستحق</div>
                  <div className="border-l p-2 text-center">المبلغ المستلم</div>
                  <div className="border-l p-2 text-center">المتبقي</div>
                  <div className="p-2 text-center">ملاحظات</div>
                </div>
              </div>

              {/* Table Rows */}
              <div className="min-h-[400px]">
                {attendance.map((record, index) => (
                  <div key={record.id} className="grid grid-cols-10 text-xs border-b">
                    <div className="border-l p-2 text-center">{index + 1}</div>
                    <div className="border-l p-2 text-center">{selectedWorker.name}</div>
                    <div className="border-l p-2 text-center">{formatCurrency(parseFloat(record.dailyWage || '0'))}</div>
                    <div className="border-l p-2 text-center">
                      {format(new Date(record.date), 'yyyy-MM-dd')}
                    </div>
                    <div className="border-l p-2 text-center">1</div>
                    <div className="border-l p-2 text-center">0</div>
                    <div className="border-l p-2 text-center">{formatCurrency(parseFloat(record.dailyWage || '0'))}</div>
                    <div className="border-l p-2 text-center">
                      {record.paymentType === 'نقد' ? formatCurrency(parseFloat(record.dailyWage || '0')) : '0'}
                    </div>
                    <div className="border-l p-2 text-center">
                      {record.paymentType === 'نقد' ? '0' : formatCurrency(parseFloat(record.dailyWage || '0'))}
                    </div>
                    <div className="p-2 text-center text-xs">{record.workDescription || ''}</div>
                  </div>
                ))}

                {/* Fill empty rows */}
                {Array.from({ length: Math.max(0, 15 - attendance.length) }).map((_, index) => (
                  <div key={`empty-${index}`} className="grid grid-cols-10 text-xs border-b h-8">
                    <div className="border-l p-2 text-center"></div>
                    <div className="border-l p-2 text-center"></div>
                    <div className="border-l p-2 text-center">0</div>
                    <div className="border-l p-2 text-center"></div>
                    <div className="border-l p-2 text-center">0</div>
                    <div className="border-l p-2 text-center">0</div>
                    <div className="border-l p-2 text-center">0</div>
                    <div className="border-l p-2 text-center">0</div>
                    <div className="border-l p-2 text-center">0</div>
                    <div className="p-2 text-center"></div>
                  </div>
                ))}
              </div>

              {/* Summary Footer */}
              <div className="bg-orange-200">
                <div className="grid grid-cols-2 border-b">
                  <div className="border-l p-3 text-center font-medium">
                    إجمالي عدد أيام العمل
                  </div>
                  <div className="p-3 text-center font-bold">
                    {attendance.length}
                  </div>
                </div>
                <div className="grid grid-cols-2 border-b">
                  <div className="border-l p-3 text-center font-medium">
                    إجمالي المبلغ المستحق
                  </div>
                  <div className="p-3 text-center font-bold">
                    {formatCurrency(totalEarned)}
                  </div>
                </div>
                <div className="grid grid-cols-2 border-b">
                  <div className="border-l p-3 text-center font-medium">
                    إجمالي المبلغ المستلم
                  </div>
                  <div className="p-3 text-center font-bold">
                    {formatCurrency(totalPaid)}
                  </div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="border-l p-3 text-center font-medium">
                    إجمالي المبلغ المتبقي
                  </div>
                  <div className="p-3 text-center font-bold">
                    {formatCurrency(totalRemaining)}
                  </div>
                </div>
              </div>

              {/* Final Summary */}
              <div className="bg-orange-300 text-center p-4 font-bold text-lg border-2 border-orange-400">
                إجمالي المبلغ المستحق للعامل
                <div className="text-xl mt-2">
                  {formatCurrency(totalEarned)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            margin: 0.5in;
            size: A4;
          }
          
          /* Hide everything except print section */
          body * {
            visibility: hidden;
          }
          
          .print-section, .print-section * {
            visibility: visible;
          }
          
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          
          /* Ensure colors show in print */
          .bg-gradient-to-r {
            background: #fb923c !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .bg-orange-200 {
            background: #fed7aa !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .bg-orange-300 {
            background: #fdba74 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .bg-orange-100 {
            background: #ffedd5 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          /* Show print header */
          .hidden.print\\:block {
            display: block !important;
          }
          
          /* Force table structure */
          .grid {
            display: grid !important;
          }
          
          .border {
            border: 1px solid #000 !important;
          }
          
          .border-b {
            border-bottom: 1px solid #000 !important;
          }
          
          .border-l {
            border-left: 1px solid #000 !important;
          }
        }
        `
      }} />
    </div>
  );
}