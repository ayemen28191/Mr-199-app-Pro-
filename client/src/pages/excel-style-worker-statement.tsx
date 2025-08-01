import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Printer, FileDown, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useSelectedProject } from "@/hooks/use-selected-project";
import { getCurrentDate, formatCurrency, formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Worker, Project, WorkerAttendance, FundTransfer } from "@shared/schema";

interface WorkerStatementData {
  worker: Worker;
  projects: Project[];
  attendance: WorkerAttendance[];
  transfers: FundTransfer[];
  summary: {
    totalEarnings: number;
    totalAdvances: number;
    netBalance: number;
    totalDays: number;
    totalHours: number;
    projectStats: {
      projectId: string;
      projectName: string;
      days: number;
      hours: number;
      earnings: number;
    }[];
  };
}

export default function ExcelStyleWorkerStatement() {
  const [, setLocation] = useLocation();
  const { selectedProjectId } = useSelectedProject();
  const { toast } = useToast();

  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState(getCurrentDate());
  const [workerStatement, setWorkerStatement] = useState<WorkerStatementData | null>(null);

  // Fetch data
  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const generateStatement = async () => {
    if (!selectedWorkerId || !dateFrom || !dateTo) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار العامل والفترة الزمنية",
        variant: "destructive",
      });
      return;
    }

    if (selectedProjectIds.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار مشروع واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    try {
      const projectsQuery = selectedProjectIds.join(',');
      const data = await apiRequest("GET", 
        `/api/worker-statement/${selectedWorkerId}?dateFrom=${dateFrom}&dateTo=${dateTo}&projects=${projectsQuery}`
      );
      setWorkerStatement(data);
      
      toast({
        title: "تم إنشاء الكشف",
        description: "تم إنشاء كشف حساب العامل بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء الكشف",
        variant: "destructive",
      });
    }
  };

  const printStatement = () => {
    window.print();
  };

  const selectedWorker = workers.find(w => w.id === selectedWorkerId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Controls Section - Hidden in Print */}
      <div className="no-print bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/reports")}
              className="ml-3 p-2"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-bold text-foreground">كشف حساب العامل - نمط Excel</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">العامل</label>
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
              <label className="block text-sm font-medium mb-1">من تاريخ</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">إلى تاريخ</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">المشاريع</label>
              <div className="max-h-32 overflow-y-auto border rounded p-2 bg-white">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-2 mb-1">
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
                    <label htmlFor={project.id} className="text-sm mr-2">{project.name}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={generateStatement} className="flex-1">
                إنشاء الكشف
              </Button>
              {workerStatement && (
                <Button onClick={printStatement} variant="outline">
                  <Printer className="h-4 w-4 ml-1" />
                  طباعة
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statement Display */}
      {workerStatement && (
        <div className="print-content">
          <style>{`
            @media print {
              .no-print { display: none !important; }
              .print-content { 
                padding: 0.5cm !important; 
                margin: 0 !important;
                max-width: none !important;
                width: 21cm !important;
                height: 29.7cm !important;
                background: white !important;
              }
              body { 
                margin: 0; 
                padding: 0;
                background: white !important;
              }
              .excel-table { 
                page-break-inside: avoid; 
                width: 100% !important;
                margin: 0 !important;
              }
              @page {
                size: A4;
                margin: 0.5cm;
              }
            }
            
            .excel-table {
              width: 100%;
              border-collapse: collapse;
              font-family: 'Arial', sans-serif;
              font-size: 8px;
              direction: rtl;
              margin: 1px 0;
            }
            
            .excel-table th,
            .excel-table td {
              border: 1px solid #000;
              padding: 1px;
              text-align: center;
              vertical-align: middle;
              white-space: nowrap;
              height: 16px;
              line-height: 1.2;
            }
            
            .excel-header {
              background-color: #FFA500;
              font-weight: bold;
              color: #000;
            }
            
            .excel-subheader {
              background-color: #FFE4B5;
              font-weight: bold;
            }
            
            .excel-worker-info {
              background-color: #F0F8FF;
            }
            
            .excel-summary {
              background-color: #FFF8DC;
              font-weight: bold;
            }
            
            .amount-positive {
              color: #008000;
              font-weight: bold;
            }
            
            .amount-negative {
              color: #FF0000;
              font-weight: bold;
            }
          `}</style>

          <div className="max-w-full mx-auto p-2 bg-white min-h-screen" style={{ margin: '0 auto', paddingLeft: '0.75cm', paddingRight: '0.75cm' }}>
            {/* Header */}
            <table className="excel-table mb-1">
              <tr>
                <td colSpan={11} className="excel-header" style={{ fontSize: '14px', padding: '8px' }}>
                  كشف حساب العامل للفترة من تاريخ {formatDate(dateFrom)} الى تاريخ {formatDate(dateTo)}
                </td>
              </tr>
            </table>

            {/* Worker and Project Info */}
            <table className="excel-table mb-1">
              <tr>
                <td className="excel-worker-info" style={{ width: '12%' }}>اسم العامل</td>
                <td style={{ width: '18%', fontWeight: 'bold' }}>{workerStatement.worker.name}</td>
                <td className="excel-worker-info" style={{ width: '12%' }}>المشاريع</td>
                <td style={{ width: '23%' }}>{workerStatement.projects.map(p => p.name).join(' + ')}</td>
                <td className="excel-worker-info" style={{ width: '12%' }}>الأجر اليومي</td>
                <td style={{ width: '12%' }}>{formatCurrency(parseFloat(workerStatement.worker.dailyWage))}</td>
                <td className="excel-worker-info" style={{ width: '11%' }}>المسمى الوظيفي</td>
              </tr>
              <tr>
                <td className="excel-worker-info">من تاريخ</td>
                <td>{formatDate(dateFrom)}</td>
                <td className="excel-worker-info">إلى تاريخ</td>
                <td>{formatDate(dateTo)}</td>
                <td className="excel-worker-info">نوع العامل</td>
                <td>{workerStatement.worker.type || 'عامل عادي'}</td>
                <td>عامل عادي</td>
              </tr>
            </table>

            {/* Attendance Table */}
            <table className="excel-table">
              <thead>
                <tr className="excel-header">
                  <th style={{ width: '3%' }}>م</th>
                  <th style={{ width: '7%' }}>اليوم</th>
                  <th style={{ width: '11%' }}>المشروع</th>
                  <th style={{ width: '7%' }}>الأجر اليومي</th>
                  <th style={{ width: '8%' }}>التاريخ</th>
                  <th style={{ width: '6%' }}>أيام العمل</th>
                  <th style={{ width: '6%' }}>ساعات العمل</th>
                  <th style={{ width: '8%' }}>المبلغ المستحق</th>
                  <th style={{ width: '8%' }}>المبلغ المستلم</th>
                  <th style={{ width: '7%' }}>الباقي</th>
                  <th style={{ width: '19%' }}>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {workerStatement.attendance.map((record, index) => {
                  const recordDate = new Date(record.date);
                  const dayName = recordDate.toLocaleDateString('ar-SA', { weekday: 'long' });
                  const project = workerStatement.projects.find(p => p.id === record.projectId);
                  const dailyWage = parseFloat(record.dailyWage) || 0;
                  const workDays = parseFloat(record.workDays || '1');
                  const actualWage = dailyWage * workDays; // الأجر الفعلي حسب أيام العمل
                  const received = parseFloat(record.paidAmount) || 0;
                  const remaining = actualWage - received;

                  return (
                    <tr key={record.id}>
                      <td>{index + 1}</td>
                      <td>{dayName}</td>
                      <td>{project?.name || 'غير محدد'}</td>
                      <td>{formatCurrency(dailyWage)}</td>
                      <td>{formatDate(record.date)}</td>
                      <td>{record.isPresent ? (parseFloat(record.workDays || '1')) : '0'}</td>
                      <td>{record.isPresent ? (parseFloat(record.workDays || '1') * 8) : 0}</td>
                      <td className="amount-positive">{formatCurrency(actualWage)}</td>
                      <td className="amount-negative">{formatCurrency(received)}</td>
                      <td className={remaining >= 0 ? 'amount-positive' : 'amount-negative'}>
                        {formatCurrency(Math.abs(remaining))}
                      </td>
                      <td style={{ fontSize: '8px' }}>{record.workDescription || ''}</td>
                    </tr>
                  );
                })}

                {/* Add transfers/advances as rows */}
                {workerStatement.transfers.map((transfer, index) => {
                  const transferAmount = parseFloat(transfer.amount) || 0;
                  return (
                    <tr key={`transfer-${transfer.id}`}>
                      <td>{workerStatement.attendance.length + index + 1}</td>
                      <td colSpan={2}>
                        {transfer.transferType === 'advance' && 'سلفة'}
                        {transfer.transferType === 'salary' && 'راتب'}
                        {transfer.transferType === 'deduction' && 'خصم'}
                        {!transfer.transferType && 'تحويل مالي'}
                      </td>
                      <td>{formatCurrency(transferAmount)}</td>
                      <td>{formatDate(transfer.transferDate)}</td>
                      <td>0</td>
                      <td>0</td>
                      <td className="amount-negative">-{formatCurrency(transferAmount)}</td>
                      <td className="amount-negative">{formatCurrency(transferAmount)}</td>
                      <td>0</td>
                      <td style={{ fontSize: '7px' }}>{transfer.notes || transfer.transferNumber || ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Summary */}
            <table className="excel-table mt-2">
              {(() => {
                // حساب الإجماليات الصحيحة
                const totalEarnings = workerStatement.attendance.reduce((sum, record) => {
                  if (!record.isPresent) return sum;
                  const dailyWage = parseFloat(record.dailyWage) || 0;
                  const workDays = parseFloat(record.workDays || '1');
                  return sum + (dailyWage * workDays); // الأجر الفعلي = الأجر اليومي × أيام العمل
                }, 0);
                
                const totalPaidFromAttendance = workerStatement.attendance.reduce((sum, record) => {
                  return sum + parseFloat(record.paidAmount || '0');
                }, 0);
                
                const totalTransfers = workerStatement.transfers.reduce((sum, transfer) => {
                  return sum + parseFloat(transfer.amount);
                }, 0);
                
                const totalReceived = totalPaidFromAttendance + totalTransfers;
                const netBalance = totalEarnings - totalReceived;
                
                return (
                  <>
                    <tr>
                      <td className="excel-summary" style={{ width: '25%' }}>إجمالي المبلغ المستحق للعامل</td>
                      <td className="amount-positive" style={{ width: '15%' }}>{formatCurrency(totalEarnings)}</td>
                      <td className="excel-summary" style={{ width: '25%' }}>إجمالي عدد أيام العمل</td>
                      <td style={{ width: '15%' }}>{workerStatement.summary.totalDays}</td>
                      <td rowSpan={3} style={{ width: '20%', verticalAlign: 'middle', fontWeight: 'bold', fontSize: '10px' }}>
                        إجمالي المبلغ المتبقي للعامل<br/>
                        <span className={netBalance >= 0 ? 'amount-positive' : 'amount-negative'}>
                          {formatCurrency(Math.abs(netBalance))}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="excel-summary">إجمالي المبلغ المستلم</td>
                      <td className="amount-negative">{formatCurrency(totalReceived)}</td>
                      <td className="excel-summary">إجمالي عدد ساعات العمل</td>
                      <td>{workerStatement.summary.totalHours}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '7px' }}>
                        تم إنشاء هذا الكشف آلياً من نظام إدارة مشاريع البناء - جميع البيانات حقيقية ومستمدة من قاعدة البيانات
                      </td>
                    </tr>
                  </>
                );
              })()}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}