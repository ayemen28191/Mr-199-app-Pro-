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
        <div className="print-section bg-white max-w-full overflow-x-auto">
          {/* Report Header - Yellow Background */}
          <div className="bg-yellow-400 border-2 border-black p-3 text-center">
            <h2 className="text-lg font-bold text-black">
              كشف حساب العامل للفترة من تاريخ ........ إلى تاريخ ........
            </h2>
          </div>

          {/* Worker Information Section */}
          <div className="grid grid-cols-2 border-2 border-t-0 border-black">
            {/* Right side - Project info */}
            <div className="border-l border-black">
              <div className="border-b border-black">
                <div className="grid grid-cols-2 h-10">
                  <div className="bg-orange-200 border-r border-black p-2 text-xs font-bold text-center flex items-center justify-center">
                    اسم المشروع
                  </div>
                  <div className="p-2 text-xs text-center flex items-center justify-center">
                    مشروع ابو التجوا مشروع معنث الجحيدي
                  </div>
                </div>
              </div>
              <div>
                <div className="grid grid-cols-2 h-10">
                  <div className="bg-orange-200 border-r border-black p-2 text-xs font-bold text-center flex items-center justify-center">
                    تاريخ بداية
                  </div>
                  <div className="p-2 text-xs text-center flex items-center justify-center">
                    22/06/2025
                  </div>
                </div>
              </div>
            </div>

            {/* Left side - Worker info */}
            <div>
              <div className="border-b border-black">
                <div className="grid grid-cols-2 h-10">
                  <div className="bg-orange-200 border-r border-black p-2 text-xs font-bold text-center flex items-center justify-center">
                    موقع عبدالعزيز
                  </div>
                  <div className="p-2 text-xs text-center flex items-center justify-center">
                    عامل عادي
                  </div>
                </div>
              </div>
              <div>
                <div className="grid grid-cols-2 h-10">
                  <div className="bg-orange-200 border-r border-black p-2 text-xs font-bold text-center flex items-center justify-center">
                    تاريخ نهاية
                  </div>
                  <div className="p-2 text-xs text-center flex items-center justify-center">
                    732566543
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional info row */}
          <div className="grid grid-cols-2 border-2 border-t-0 border-black">
            <div className="border-l border-black">
              <div className="grid grid-cols-2 h-10">
                <div className="bg-orange-200 border-r border-black p-2 text-xs font-bold text-center flex items-center justify-center">
                  اسم العامل
                </div>
                <div className="p-2 text-xs text-center flex items-center justify-center font-bold">
                  عبود مطهر
                </div>
              </div>
            </div>
            <div>
              <div className="grid grid-cols-2 h-10">
                <div className="bg-orange-200 border-r border-black p-2 text-xs font-bold text-center flex items-center justify-center">
                  المهنة
                </div>
                <div className="p-2 text-xs text-center flex items-center justify-center">
                  عامل عادي
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 border-2 border-t-0 border-black">
            <div className="border-l border-black">
              <div className="grid grid-cols-2 h-10">
                <div className="bg-orange-200 border-r border-black p-2 text-xs font-bold text-center flex items-center justify-center">
                  الأجر اليومي
                </div>
                <div className="p-2 text-xs text-center flex items-center justify-center font-bold">
                  12,000
                </div>
              </div>
            </div>
            <div>
              <div className="grid grid-cols-2 h-10">
                <div className="bg-orange-200 border-r border-black p-2 text-xs font-bold text-center flex items-center justify-center">
                  المشروع
                </div>
                <div className="p-2 text-xs text-center flex items-center justify-center">
                  مشاريع متعددة
                </div>
              </div>
            </div>
          </div>

          {/* Table Headers - Exact layout as Excel */}
          <div className="border-2 border-t-0 border-black">
            <div className="bg-orange-200 grid text-xs font-bold" style={{gridTemplateColumns: '25px 70px 60px 50px 40px 40px 50px 55px 45px 130px'}}>
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

            {/* Real Data from System */}
            {attendance.map((record: any, index: number) => {
              const dailyWage = selectedWorker?.type === 'عامل عادي' ? 12000 : 
                               selectedWorker?.type === 'عامل متخصص' ? 15000 : 
                               parseInt(selectedWorker?.dailyWage) || 12000;
              const workingDays = record.status === 'حاضر' ? 1 : 
                                  record.status === 'نصف يوم' ? 0.5 : 0;
              const workingHours = workingDays * 8;
              const totalAmount = dailyWage * workingDays;
              const paidAmount = record.paidAmount || 0;
              
              return (
                <div key={record.id} className="grid text-xs border-t border-black" style={{gridTemplateColumns: '25px 70px 60px 50px 40px 40px 50px 55px 45px 130px'}}>
                  <div className="border-r border-black p-1 text-center">{index + 1}</div>
                  <div className="border-r border-black p-1 text-center break-words">{selectedWorker?.name || 'عبود مطهر'}</div>
                  <div className="border-r border-black p-1 text-center break-words">{record.project?.name || 'مشروع متعدد'}</div>
                  <div className="border-r border-black p-1 text-center">{dailyWage.toLocaleString()}</div>
                  <div className="border-r border-black p-1 text-center">{format(new Date(record.date), 'yyyy-MM-dd')}</div>
                  <div className="border-r border-black p-1 text-center">{workingDays}</div>
                  <div className="border-r border-black p-1 text-center">{workingHours}</div>
                  <div className="border-r border-black p-1 text-center">{totalAmount.toLocaleString()}</div>
                  <div className="border-r border-black p-1 text-center">{paidAmount.toLocaleString()}</div>
                  <div className="p-1 text-center break-words text-xs">
                    {record.workDescription || record.notes || 
                     (record.status === 'حاضر' ? 'عمل عادي' : 
                      record.status === 'غائب' ? 'غائب' : 
                      record.status === 'نصف يوم' ? 'نصف يوم عمل' : '')}
                  </div>
                </div>
              );
            })}
            
            {/* Fund Transfers from System */}
            {workerStatement?.fundTransfers?.map((transfer: any, index: number) => (
              <div key={`transfer-${index}`} className="grid text-xs border-t border-black" style={{gridTemplateColumns: '25px 70px 60px 50px 40px 40px 50px 55px 45px 130px'}}>
                <div className="border-r border-black p-1 text-center">{attendance.length + index + 1}</div>
                <div className="border-r border-black p-1 text-center break-words">{selectedWorker?.name || 'عبود مطهر'}</div>
                <div className="border-r border-black p-1 text-center break-words">{transfer.project?.name || 'مشروع متعدد'}</div>
                <div className="border-r border-black p-1 text-center">-</div>
                <div className="border-r border-black p-1 text-center">{format(new Date(transfer.date), 'yyyy-MM-dd')}</div>
                <div className="border-r border-black p-1 text-center">0</div>
                <div className="border-r border-black p-1 text-center">0</div>
                <div className="border-r border-black p-1 text-center">0</div>
                <div className="border-r border-black p-1 text-center">-{parseInt(transfer.amount).toLocaleString()}</div>
                <div className="p-1 text-center break-words text-xs bg-orange-100">
                  حوالة {transfer.senderName} رقم {transfer.transferNumber}
                </div>
              </div>
            ))}
            
            {/* Fill remaining rows to maintain single page layout */}
            {Array.from({ length: Math.max(0, 15 - attendance.length - (workerStatement?.fundTransfers?.length || 0)) }).map((_, index) => (
              <div key={`empty-${index}`} className="grid text-xs border-t border-black h-5" style={{gridTemplateColumns: '25px 70px 60px 50px 40px 40px 50px 55px 45px 130px'}}>
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

          {/* Summary Boxes - Compact layout */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            {/* Left Summary - Real Data */}
            <div className="bg-orange-200 border-2 border-black text-center">
              <div className="border-b border-black p-1 text-xs font-bold">
                إجمالي عدد أيام العمل
              </div>
              <div className="p-1 text-sm font-bold">
                {attendance.reduce((sum, record) => {
                  const days = record.status === 'حاضر' ? 1 : record.status === 'نصف يوم' ? 0.5 : 0;
                  return sum + days;
                }, 0).toFixed(1)}
              </div>
            </div>

            {/* Center Summary - Real Data */}
            <div className="bg-orange-200 border-2 border-black text-center">
              <div className="border-b border-black p-1 text-xs font-bold">
                إجمالي عدد ساعات العمل
              </div>
              <div className="p-1 text-sm font-bold">
                {(attendance.reduce((sum, record) => {
                  const days = record.status === 'حاضر' ? 1 : record.status === 'نصف يوم' ? 0.5 : 0;
                  return sum + days;
                }, 0) * 8).toFixed(1)}
              </div>
            </div>

            {/* Right Summary - Real Data */}
            <div className="bg-orange-200 border-2 border-black">
              <div className="text-center p-1 border-b border-black">
                <div className="text-xs font-bold">
                  {attendance.reduce((sum, record) => {
                    const dailyWage = parseInt(selectedWorker?.dailyWage) || 12000;
                    const days = record.status === 'حاضر' ? 1 : record.status === 'نصف يوم' ? 0.5 : 0;
                    return sum + (dailyWage * days);
                  }, 0).toLocaleString()}
                </div>
                <div className="text-xs">إجمالي المبلغ المستحق</div>
              </div>
              <div className="text-center p-1">
                <div className="text-xs font-bold">
                  {(attendance.reduce((sum, record) => sum + (record.paidAmount || 0), 0) +
                    (workerStatement?.fundTransfers?.reduce((sum, transfer) => sum + parseInt(transfer.amount), 0) || 0)
                  ).toLocaleString()}
                </div>
                <div className="text-xs">إجمالي المبلغ المستلم</div>
              </div>
            </div>
          </div>

          {/* Final Balance - Real Calculation */}
          <div className="bg-orange-200 border-2 border-black text-center mt-2 p-2">
            <div className="text-sm font-bold mb-1">المبلغ المتبقي للعامل</div>
            <div className="text-lg font-bold">
              {(() => {
                const totalEarned = attendance.reduce((sum, record) => {
                  const dailyWage = parseInt(selectedWorker?.dailyWage) || 12000;
                  const days = record.status === 'حاضر' ? 1 : record.status === 'نصف يوم' ? 0.5 : 0;
                  return sum + (dailyWage * days);
                }, 0);
                const totalPaid = attendance.reduce((sum, record) => sum + (record.paidAmount || 0), 0);
                const totalTransfers = workerStatement?.fundTransfers?.reduce((sum, transfer) => sum + parseInt(transfer.amount), 0) || 0;
                return (totalEarned - totalPaid - totalTransfers).toLocaleString();
              })()}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            margin: 0.3in;
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
            background: white !important;
            font-size: 10px !important;
          }
          
          .bg-yellow-400 {
            background: #facc15 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .bg-orange-200 {
            background: #fed7aa !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .bg-orange-100 {
            background: #ffedd5 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .border, .border-2, .border-black {
            border: 1px solid #000 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .border-r {
            border-right: 1px solid #000 !important;
          }
          
          .border-l {
            border-left: 1px solid #000 !important;
          }
          
          .border-t {
            border-top: 1px solid #000 !important;
          }
          
          .border-b {
            border-bottom: 1px solid #000 !important;
          }
          
          .text-xs {
            font-size: 9px !important;
          }
          
          .break-words {
            word-wrap: break-word !important;
            word-break: break-word !important;
            hyphens: auto !important;
          }
          
          .grid {
            display: grid !important;
          }
          
          .p-1 {
            padding: 2px !important;
          }
          
          .p-2 {
            padding: 4px !important;
          }
          
          .text-center {
            text-align: center !important;
          }
          
          .font-bold {
            font-weight: bold !important;
          }
        }
        
        .break-words {
          word-wrap: break-word;
          word-break: break-word;
          hyphens: auto;
        }
        `
      }} />
    </div>
  );
}