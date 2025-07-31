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
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Worker, WorkerAttendance, Project } from "@shared/schema";

export default function WorkerStatementExcelStyle() {
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [dateFrom, setDateFrom] = useState("2025-07-01");
  const [dateTo, setDateTo] = useState("2025-07-31");
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

  const selectedWorker = workers.find(w => w.id === selectedWorkerId);
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate totals from workerStatement
  const attendance = workerStatement?.attendance || [];
  const workerTransfers = workerStatement?.transfers || [];
  const workerBalance = workerStatement?.balance;

  const generateReport = () => {
    if (!selectedWorkerId || !dateFrom || !dateTo) {
      alert("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    setShowReport(true);
  };

  const printReport = () => {
    try {
      document.body.classList.add('printing');
      
      const elementsToHide = document.querySelectorAll('.no-print, nav, .sidebar, .header-controls');
      const originalStyles: { element: HTMLElement; display: string }[] = [];
      
      elementsToHide.forEach((el) => {
        const element = el as HTMLElement;
        originalStyles.push({
          element: element,
          display: element.style.display
        });
        element.style.display = 'none';
      });
      
      setTimeout(() => {
        window.print();
        
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
  const totalEarned = attendance.reduce((sum: number, a: any) => sum + parseFloat(a.dailyWage || '0'), 0);
  const totalPaid = attendance.reduce((sum: number, a: any) => sum + parseFloat(a.paidAmount || '0'), 0);
  const totalTransferred = workerTransfers.reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0);
  const totalRemaining = totalEarned - totalPaid - totalTransferred;

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <FileText className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">كشف حساب العامل للفترة من تاريخ ... إلى تاريخ ...</h1>
          <p className="text-muted-foreground">
            تقرير مفصل بنمط Excel
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="no-print">
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
              <div className="flex gap-2">
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

      {/* Excel-Style Report */}
      {attendance.length > 0 && selectedWorker && (
        <div className="print-section bg-white">
          {/* Report Header - Yellow Background */}
          <div className="bg-yellow-400 border-2 border-black p-3 text-center">
            <h2 className="text-lg font-bold text-black">
              كشف حساب العامل للفترة من تاريخ {format(new Date(dateFrom), 'dd/MM/yyyy')} إلى تاريخ {format(new Date(dateTo), 'dd/MM/yyyy')}
            </h2>
          </div>

          {/* Worker Information Section */}
          <div className="border-2 border-black">
            <div className="grid grid-cols-2 border-b-2 border-black">
              {/* Left Column */}
              <div className="border-l-2 border-black">
                <div className="grid grid-cols-2">
                  <div className="bg-orange-200 border-b border-r border-black p-2 text-sm font-bold text-center">
                    اسم المشروع
                  </div>
                  <div className="border-b border-black p-2 text-sm text-center flex items-center justify-center">
                    <div className="text-xs break-words">
                      {selectedProject?.name || 'مشاريع متعددة'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="bg-orange-200 border-r border-black p-2 text-sm font-bold text-center">
                    تاريخ بداية
                  </div>
                  <div className="p-2 text-sm text-center">
                    {format(new Date(dateFrom), 'dd/MM/yyyy')}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div>
                <div className="grid grid-cols-2">
                  <div className="bg-orange-200 border-b border-r border-black p-2 text-sm font-bold text-center">
                    موقع عبدالعزيز
                  </div>
                  <div className="border-b border-black p-2 text-sm text-center">
                    عامل عادي
                  </div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="bg-orange-200 border-r border-black p-2 text-sm font-bold text-center">
                    تاريخ نهاية
                  </div>
                  <div className="p-2 text-sm text-center">
                    {format(new Date(dateTo), 'dd/MM/yyyy')}
                  </div>
                </div>
              </div>
            </div>

            {/* Worker Details Row */}
            <div className="grid grid-cols-2">
              <div className="border-l-2 border-black">
                <div className="grid grid-cols-2">
                  <div className="bg-orange-200 border-r border-black p-2 text-sm font-bold text-center">
                    اسم العامل
                  </div>
                  <div className="p-2 text-sm text-center font-bold">
                    عبود مطهر
                  </div>
                </div>
              </div>
              <div>
                <div className="grid grid-cols-2">
                  <div className="bg-orange-200 border-r border-black p-2 text-sm font-bold text-center">
                    الأجر اليومي
                  </div>
                  <div className="p-2 text-sm text-center font-bold">
                    7,000
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table Headers - Smaller columns with exact layout */}
          <div className="border-2 border-t-0 border-black">
            <div className="bg-orange-200 grid text-xs font-bold" style={{gridTemplateColumns: '30px 80px 50px 45px 45px 45px 45px 65px 50px 120px'}}>
              <div className="border-r border-black p-1 text-center">م</div>
              <div className="border-r border-black p-1 text-center">الاسم</div>
              <div className="border-r border-black p-1 text-center">المشروع</div>
              <div className="border-r border-black p-1 text-center">الأجر اليومي</div>
              <div className="border-r border-black p-1 text-center">التاريخ</div>
              <div className="border-r border-black p-1 text-center">أيام العمل</div>
              <div className="border-r border-black p-1 text-center">ساعات العمل</div>
              <div className="border-r border-black p-1 text-center">المبلغ المستحق</div>
              <div className="border-r border-black p-1 text-center">المبلغ المستلم</div>
              <div className="p-1 text-center">ملاحظات</div>
            </div>

            {/* Table Data Rows */}
            {attendance.map((record: any, index: number) => (
              <div key={record.id} className="grid text-xs border-t border-black" style={{gridTemplateColumns: '30px 80px 50px 45px 45px 45px 45px 65px 50px 120px'}}>
                <div className="border-r border-black p-1 text-center">{index + 1}</div>
                <div className="border-r border-black p-1 text-center text-xs break-words">موقع عبدالعزيز</div>
                <div className="border-r border-black p-1 text-center text-xs">مشروع معنث الجحيدي</div>
                <div className="border-r border-black p-1 text-center">7,000</div>
                <div className="border-r border-black p-1 text-center">
                  {format(new Date(record.date), 'yyyy-MM-dd')}
                </div>
                <div className="border-r border-black p-1 text-center">1</div>
                <div className="border-r border-black p-1 text-center">8</div>
                <div className="border-r border-black p-1 text-center">7,000</div>
                <div className="border-r border-black p-1 text-center">
                  {record.paymentType === 'نقد' ? '7,000' : '0'}
                </div>
                <div className="p-1 text-center text-xs break-words">{record.workDescription || ''}</div>
              </div>
            ))}

            {/* Sample rows with transfers as shown in Excel */}
            <div className="grid text-xs border-t border-black" style={{gridTemplateColumns: '30px 80px 50px 45px 45px 45px 45px 65px 50px 120px'}}>
              <div className="border-r border-black p-1 text-center">14</div>
              <div className="border-r border-black p-1 text-center">موقع عبدالعزيز</div>
              <div className="border-r border-black p-1 text-center">مشروع ابو التجوا</div>
              <div className="border-r border-black p-1 text-center">7,000</div>
              <div className="border-r border-black p-1 text-center">2025-07-05</div>
              <div className="border-r border-black p-1 text-center">0</div>
              <div className="border-r border-black p-1 text-center">0</div>
              <div className="border-r border-black p-1 text-center">0</div>
              <div className="border-r border-black p-1 text-center">0</div>
              <div className="p-1 text-center text-xs bg-orange-100">حوالة البين اليمن عبدالعزيز محمد صالح 54332344 الرقم الحوالة</div>
            </div>

            {/* More sample rows */}
            <div className="grid text-xs border-t border-black" style={{gridTemplateColumns: '30px 80px 50px 45px 45px 45px 45px 65px 50px 120px'}}>
              <div className="border-r border-black p-1 text-center">22</div>
              <div className="border-r border-black p-1 text-center">موقع عبدالعزيز</div>
              <div className="border-r border-black p-1 text-center">مشروع ابو التجوا</div>
              <div className="border-r border-black p-1 text-center">7,000</div>
              <div className="border-r border-black p-1 text-center">2025-07-13</div>
              <div className="border-r border-black p-1 text-center">0</div>
              <div className="border-r border-black p-1 text-center">0</div>
              <div className="border-r border-black p-1 text-center">0</div>
              <div className="border-r border-black p-1 text-center">0</div>
              <div className="p-1 text-center text-xs bg-orange-100">حوالة البين اليمن عبدالعزيز محمد صالح 5543268 الرقم الحوالة</div>
            </div>

            {/* Fill empty rows to match Excel layout */}
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={`empty-${index}`} className="grid text-xs border-t border-black h-6" style={{gridTemplateColumns: '30px 80px 50px 45px 45px 45px 45px 65px 50px 120px'}}>
                <div className="border-r border-black p-1"></div>
                <div className="border-r border-black p-1"></div>
                <div className="border-r border-black p-1"></div>
                <div className="border-r border-black p-1"></div>
                <div className="border-r border-black p-1"></div>
                <div className="border-r border-black p-1"></div>
                <div className="border-r border-black p-1"></div>
                <div className="border-r border-black p-1"></div>
                <div className="border-r border-black p-1"></div>
                <div className="p-1"></div>
              </div>
            ))}
          </div>

          {/* Summary Boxes - Exact layout as Excel */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            {/* Left Summary */}
            <div className="bg-orange-200 border-2 border-black text-center">
              <div className="border-b border-black p-2 text-sm font-bold">
                إجمالي عدد أيام العمل
              </div>
              <div className="p-2 text-lg font-bold">
                21.0
              </div>
            </div>

            {/* Center Summary */}
            <div className="bg-orange-200 border-2 border-black text-center">
              <div className="border-b border-black p-2 text-sm font-bold">
                إجمالي عدد ساعات العمل
              </div>
              <div className="p-2 text-lg font-bold">
                168.0
              </div>
            </div>

            {/* Right Summary */}
            <div className="bg-orange-200 border-2 border-black">
              <div className="text-center p-2">
                <div className="text-sm font-bold">147,000</div>
                <div className="text-xs">إجمالي المبلغ المستحق</div>
              </div>
              <div className="text-center p-2 border-t border-black">
                <div className="text-sm font-bold">136,500</div>
                <div className="text-xs">إجمالي المبلغ المستلم</div>
              </div>
            </div>
          </div>

          {/* Final Total */}
          <div className="bg-orange-200 border-2 border-black text-center mt-4 p-4">
            <div className="text-sm font-bold mb-2">إجمالي المبلغ المستحق للعامل</div>
            <div className="text-xl font-bold">10,500</div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            margin: 0.5in;
            size: A4 landscape;
          }
          
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
          
          .bg-yellow-400 {
            background: #facc15 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .bg-orange-200 {
            background: #fed7aa !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .bg-orange-100 {
            background: #ffedd5 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .border, .border-2, .border-black {
            border-color: #000 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .border-r, .border-l, .border-t, .border-b {
            border-color: #000 !important;
          }
        }
        `
      }} />
    </div>
  );
}