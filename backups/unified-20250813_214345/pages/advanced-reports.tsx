import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FileText, Printer } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
// import { applyPrintSettings } from '@/hooks/usePrintSettings'; // مؤقتاً - تم حذف النظام القديم

interface ReportData {
  expenses?: any[];
  income?: any[];
  totalExpenses?: number;
  totalIncome?: number;
  categoryTotals?: Record<string, number>;
}

export default function AdvancedReports() {
  const [reportType, setReportType] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // جلب المشاريع
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ['/api/projects'],
  });

  const generateReport = async () => {
    if (!reportType || !projectId || !dateFrom || !dateTo) {
      alert('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    setIsGenerating(true);
    try {
      const fromStr = format(dateFrom, 'yyyy-MM-dd');
      const toStr = format(dateTo, 'yyyy-MM-dd');
      
      const response = await fetch(`/api/reports/advanced?reportType=${reportType}&projectId=${projectId}&dateFrom=${fromStr}&dateTo=${toStr}`);
      const data = await response.json();
      
      if (response.ok) {
        setReportData(data);
      } else {
        console.error('خطأ في جلب التقرير:', data);
        alert('خطأ في جلب التقرير');
      }
    } catch (error) {
      console.error('خطأ في طلب التقرير:', error);
      alert('خطأ في طلب التقرير');
    } finally {
      setIsGenerating(false);
    }
  };

  const printReport = () => {
    // طباعة مباشرة بدلاً من النظام القديم
    window.print();
  };

  const projectName = projects.find((p: any) => p.id === projectId)?.name || '';
  const currentDate = new Date().toLocaleDateString('en-GB');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print-only CSS */}
      <style>
        {`
          @media print {
            body, html {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
            }
            
            .no-print {
              display: none !important;
            }
            
            .print-only {
              display: block !important;
            }
            
            .print-container {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 3mm !important;
              box-shadow: none !important;
              border: none !important;
              background: white !important;
              page-break-inside: avoid;
            }
            
            .page-break {
              page-break-before: always;
            }
            
            .report-header {
              border-bottom: 3px solid #1e40af;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            
            .company-title {
              font-size: 24px !important;
              font-weight: bold !important;
              color: #1e40af !important;
              text-align: center !important;
              margin-bottom: 10px !important;
            }
            
            .report-title {
              font-size: 18px !important;
              font-weight: 600 !important;
              color: #374151 !important;
              text-align: center !important;
              margin-bottom: 20px !important;
            }
            
            .report-info {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 20px !important;
              font-size: 12px !important;
              color: #6b7280 !important;
              margin-bottom: 20px !important;
            }
            
            .data-table {
              width: 100% !important;
              border-collapse: collapse !important;
              margin: 0 !important;
              font-size: 8px !important;
              table-layout: fixed !important;
            }
            
            .data-table th {
              background-color: #f3f4f6 !important;
              border: 1px solid #d1d5db !important;
              padding: 3px 1px !important;
              text-align: center !important;
              font-weight: bold !important;
              color: #374151 !important;
              -webkit-print-color-adjust: exact !important;
              white-space: nowrap !important;
              font-size: 8px !important;
            }
            
            .data-table td {
              border: 1px solid #d1d5db !important;
              padding: 2px 1px !important;
              text-align: center !important;
              color: #374151 !important;
              word-wrap: break-word !important;
              word-break: break-word !important;
              overflow-wrap: break-word !important;
              hyphens: auto !important;
              white-space: normal !important;
              vertical-align: top !important;
              overflow: hidden !important;
              font-size: 7px !important;
              line-height: 1.2 !important;
            }

            .data-table td.description-cell,
            .data-table td.notes-cell {
              text-align: right !important;
              padding: 4px 6px !important;
              max-width: 120px !important;
              min-width: 80px !important;
              word-wrap: break-word !important;
              word-break: break-word !important;
              overflow-wrap: break-word !important;
              hyphens: auto !important;
              white-space: normal !important;
              line-height: 1.3 !important;
              vertical-align: top !important;
              font-size: 6px !important;
            }
            
            .data-table tr:nth-child(even) td {
              background-color: #f9fafb !important;
              -webkit-print-color-adjust: exact !important;
            }
            
            .totals-section {
              border-top: 2px solid #1e40af;
              padding-top: 20px;
              margin-top: 30px;
            }
            
            .total-row {
              display: flex !important;
              justify-content: space-between !important;
              padding: 8px 0 !important;
              border-bottom: 1px solid #e5e7eb !important;
              font-size: 13px !important;
            }
            
            .grand-total {
              font-weight: bold !important;
              font-size: 14px !important;
              color: #1e40af !important;
              border-bottom: 2px solid #1e40af !important;
            }
            
            .report-footer {
              margin-top: 40px;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
              font-size: 10px;
              color: #6b7280;
              text-align: center;
            }
            
            .page-break {
              page-break-before: always !important;
            }
            
            .page-counter {
              position: fixed !important;
              bottom: 8mm !important;
              right: 50% !important;
              transform: translateX(50%) !important;
              font-size: 10px !important;
              color: #6b7280 !important;
              z-index: 1000 !important;
              background: white !important;
              padding: 2px 8px !important;
              border: 1px solid #e5e7eb !important;
              border-radius: 4px !important;
            }
            
            @page {
              margin: 10mm !important;
              @bottom-center {
                content: "صفحة " counter(page) " من " counter(pages);
                font-size: 10px;
                color: #6b7280;
                margin-top: 5mm;
              }
            }
          }
          
          @media screen {
            .print-only {
              display: none;
            }
          }
        `}
      </style>

      {/* Screen Controls - Hidden when printing */}
      <div className="no-print">
        <div className="container mx-auto p-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right">
                <FileText className="h-6 w-6" />
                التقارير المتقدمة للطباعة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>نوع التقرير</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع التقرير" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expenses">تقرير المصروفات</SelectItem>
                      <SelectItem value="income">تقرير الإيرادات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>المشروع</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المشروع" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project: any) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>من تاريخ</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "yyyy-MM-dd") : "اختر التاريخ"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>إلى تاريخ</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "yyyy-MM-dd") : "اختر التاريخ"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button 
                  onClick={generateReport} 
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {isGenerating ? 'جاري إنشاء التقرير...' : 'إنشاء التقرير'}
                </Button>

                {reportData && (
                  <Button 
                    onClick={printReport}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    طباعة التقرير
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print Report */}
      {reportData && (
        <div className="print-container print-only">
          {/* Report Header */}
          <div className="report-header">
            <div className="company-title">شركة الفتيني للمقاولات</div>
            <div className="report-title">
              {reportType === 'expenses' ? 'تقرير المصروفات المفصل' : 'تقرير الإيرادات المفصل'}
            </div>
            
            <div className="report-info">
              <div>
                <div><strong>المشروع:</strong> {projectName}</div>
                <div><strong>من تاريخ:</strong> {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : ''}</div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div><strong>تاريخ الطباعة:</strong> {currentDate}</div>
                <div><strong>إلى تاريخ:</strong> {dateTo ? format(dateTo, 'dd/MM/yyyy') : ''}</div>
              </div>
            </div>
          </div>

          {/* Expenses Report */}
          {reportType === 'expenses' && reportData.expenses && (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '7%' }}>التاريخ</th>
                    <th style={{ width: '8%' }}>الفئة</th>
                    <th style={{ width: '8%' }}>الفئة الفرعية</th>
                    <th style={{ width: '37%' }}>الوصف</th>
                    <th style={{ width: '10%' }}>المبلغ (ر.ي)</th>
                    <th style={{ width: '15%' }}>المورد</th>
                    <th style={{ width: '15%' }}>ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.expenses.map((expense, index) => (
                    <tr key={index}>
                      <td style={{ fontSize: '9px' }}>{new Date(expense.date).toLocaleDateString('en-CA')}</td>
                      <td>{expense.category}</td>
                      <td>{expense.subcategory || '-'}</td>
                      <td className="description-cell">{expense.description}</td>
                      <td style={{ color: '#dc2626', fontWeight: 'bold' }}>
                        {expense.amount.toLocaleString('en-US')}
                      </td>
                      <td style={{ fontSize: '9px' }}>{expense.vendor || '-'}</td>
                      <td className="notes-cell">{expense.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Category Totals */}
              <div className="totals-section">
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '15px', color: '#374151' }}>
                  الإجماليات حسب الفئة
                </h3>
                {reportData.categoryTotals && Object.entries(reportData.categoryTotals).map(([category, total]) => (
                  <div key={category} className="total-row">
                    <span>{category}</span>
                    <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                      {total.toLocaleString('en-US')} ر.ي
                    </span>
                  </div>
                ))}
                
                <div className="total-row grand-total">
                  <span>إجمالي المصروفات</span>
                  <span>{reportData.totalExpenses?.toLocaleString('en-US')} ر.ي</span>
                </div>
              </div>
            </>
          )}

          {/* Income Report */}
          {reportType === 'income' && reportData.income && (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '7%' }}>التاريخ</th>
                    <th style={{ width: '13%' }}>رقم الحوالة</th>
                    <th style={{ width: '35%' }}>اسم المرسل</th>
                    <th style={{ width: '13%' }}>نوع الحوالة</th>
                    <th style={{ width: '12%' }}>المبلغ (ر.ي)</th>
                    <th style={{ width: '20%' }}>ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.income.map((income, index) => (
                    <tr key={index}>
                      <td style={{ fontSize: '9px' }}>{new Date(income.date).toLocaleDateString('en-CA')}</td>
                      <td>{income.transferNumber}</td>
                      <td className="description-cell">{income.senderName}</td>
                      <td style={{ fontSize: '9px' }}>{income.transferType}</td>
                      <td style={{ color: '#059669', fontWeight: 'bold' }}>
                        {income.amount.toLocaleString('en-US')}
                      </td>
                      <td className="notes-cell">{income.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="totals-section">
                <div className="total-row grand-total">
                  <span>إجمالي الإيرادات</span>
                  <span style={{ color: '#059669' }}>{reportData.totalIncome?.toLocaleString('en-US')} ر.ي</span>
                </div>
              </div>
            </>
          )}

          {/* Report Footer */}
          <div className="report-footer">
            <div>تم إنشاء هذا التقرير باستخدام نظام إدارة مشاريع البناء | {currentDate}</div>
            <div style={{ marginTop: '5px' }}>
              الهاتف: 123-456-7890 | البريد الإلكتروني: info@construction.com
            </div>
          </div>
          
          {/* Page Counter for Print */}
          <div className="page-counter print-only">
          </div>
        </div>
      )}

      {/* Screen Preview when report is generated */}
      {reportData && (
        <div className="no-print">
          <div className="container mx-auto p-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  معاينة التقرير - للطباعة فقط
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <p className="text-lg">تم إنشاء التقرير بنجاح</p>
                  <p className="text-sm text-gray-600">
                    يحتوي التقرير على {reportType === 'expenses' ? reportData.expenses?.length : reportData.income?.length} عنصر
                  </p>
                  <p className="text-sm text-gray-600">
                    الإجمالي: {reportType === 'expenses' ? reportData.totalExpenses?.toLocaleString('en-US') : reportData.totalIncome?.toLocaleString('en-US')} ريال
                  </p>
                  <Button 
                    onClick={printReport}
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    <Printer className="h-5 w-5" />
                    طباعة التقرير الآن
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}