/**
 * الوصف: قالب كشف حساب العامل المحسن
 * المدخلات: بيانات العامل وسجلات الحضور والتحويلات
 * المخرجات: كشف حساب شامل للعامل مع دعم الطباعة
 * المالك: عمار
 * آخر تعديل: 2025-08-15
 * الحالة: نشط
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UnifiedReportTemplate, SummaryCard, UnifiedTable } from "@/components/unified-report-template";
import { formatCurrency, formatDate } from "@/lib/utils";
import { User, Calendar, DollarSign, CreditCard, Clock } from "lucide-react";

interface WorkerStatementData {
  worker: {
    id: string;
    name: string;
    type: string;
    dailyWage: number;
    phone?: string;
    isActive: boolean;
  };
  dateFrom: string;
  dateTo: string;
  attendance: any[];
  transfers: any[];
  projects: any[];
  summary: {
    totalWorkDays: number;
    totalWagesEarned: number;
    totalPaidAmount: number;
    totalTransfers: number;
    remainingBalance: number;
  };
}

interface WorkerStatementTemplateProps {
  data: WorkerStatementData;
  onPrint?: () => void;
  onExport?: () => void;
}

export function WorkerStatementTemplate({ 
  data, 
  onPrint, 
  onExport 
}: WorkerStatementTemplateProps) {
  // إعداد معلومات الرأس
  const headerInfo = [
    { label: "اسم العامل", value: data.worker?.name || "غير محدد" },
    { label: "نوع العمل", value: data.worker?.type || "غير محدد" },
    { label: "الأجر اليومي", value: formatCurrency(data.worker?.dailyWage || 0) },
    { label: "فترة التقرير", value: `من ${formatDate(data.dateFrom)} إلى ${formatDate(data.dateTo)}` },
    { label: "إجمالي أيام العمل", value: `${data.summary?.totalWorkDays || 0} يوم` },
    { label: "الحالة", value: data.worker?.isActive ? "نشط" : "غير نشط" }
  ];

  // تحضير بيانات جدول الحضور
  const attendanceData = (data.attendance || []).map(record => [
    formatDate(record.date),
    new Date(record.date).toLocaleDateString('ar-SA', { weekday: 'long' }),
    record.status === 'present' ? 'حاضر' : 'غائب',
    formatCurrency(record.wage || 0),
    formatCurrency(record.paidAmount || 0),
    record.notes || ""
  ]);

  // تحضير بيانات جدول التحويلات
  const transfersData = (data.transfers || []).map(transfer => [
    formatDate(transfer.date),
    transfer.transferMethod === 'hawaleh' ? 'حوالة أهل' : 
    transfer.transferMethod === 'bank' ? 'تحويل بنكي' : 'نقد',
    formatCurrency(transfer.amount),
    transfer.recipientName || data.worker?.name || 'غير محدد',
    transfer.recipientPhone || "",
    transfer.notes || ""
  ]);

  // تحضير بيانات جدول المشاريع
  const projectsData = (data.projects || []).map(project => [
    project.name,
    project.workDays || 0,
    formatCurrency(project.totalWages || 0),
    formatCurrency(project.totalPaid || 0),
    formatCurrency((project.totalWages || 0) - (project.totalPaid || 0))
  ]);

  return (
    <UnifiedReportTemplate
      title="كشف حساب العامل"
      subtitle={`العامل: ${data.worker.name} - ${data.worker.type}`}
      reportDate={data.dateTo}
      headerInfo={headerInfo}
    >
      {/* معلومات العامل الأساسية */}
      <Card className="print:shadow-none print:border print:border-gray-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 print:text-base">
            <User className="h-5 w-5" />
            معلومات العامل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-muted-foreground print:text-gray-600">الاسم الكامل:</span>
              <span className="font-semibold print:text-black">{data.worker.name}</span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-muted-foreground print:text-gray-600">نوع العمل:</span>
              <span className="font-semibold print:text-black">{data.worker.type}</span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-muted-foreground print:text-gray-600">الأجر اليومي:</span>
              <span className="font-semibold text-green-600 print:text-black">
                {formatCurrency(data.worker.dailyWage)}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-muted-foreground print:text-gray-600">رقم الهاتف:</span>
              <span className="font-semibold print:text-black">{data.worker.phone || "غير محدد"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ملخص مالي */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard
          title="أيام العمل الكلية"
          value={`${data.summary?.totalWorkDays || 0} يوم`}
          icon={<Calendar className="h-5 w-5 text-blue-500" />}
        />
        <SummaryCard
          title="إجمالي الأجور المستحقة"
          value={data.summary?.totalWagesEarned || 0}
          valueColor="text-blue-600"
          icon={<DollarSign className="h-5 w-5 text-blue-500" />}
        />
        <SummaryCard
          title="إجمالي المدفوع"
          value={data.summary?.totalPaidAmount || 0}
          valueColor="text-green-600"
          icon={<CreditCard className="h-5 w-5 text-green-500" />}
        />
        <SummaryCard
          title="إجمالي التحويلات"
          value={data.summary?.totalTransfers || 0}
          valueColor="text-orange-600"
          icon={<Clock className="h-5 w-5 text-orange-500" />}
        />
        <SummaryCard
          title="الرصيد المتبقي"
          value={data.summary?.remainingBalance || 0}
          valueColor={(data.summary?.remainingBalance || 0) >= 0 ? "text-green-600" : "text-red-600"}
          icon={<DollarSign className="h-5 w-5 text-gray-500" />}
        />
      </div>

      {/* سجل الحضور */}
      {(data.attendance || []).length > 0 && (
        <Card className="print:shadow-none print:border print:border-gray-300">
          <CardHeader>
            <CardTitle className="text-lg print:text-base">
              سجل الحضور
              <Badge variant="secondary" className="mr-2">
                {(data.attendance || []).length} يوم
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UnifiedTable
              headers={["التاريخ", "اليوم", "الحالة", "الأجر المستحق", "المدفوع", "ملاحظات"]}
              data={attendanceData}
            />
          </CardContent>
        </Card>
      )}

      {/* سجل التحويلات المالية */}
      {(data.transfers || []).length > 0 && (
        <Card className="print:shadow-none print:border print:border-gray-300">
          <CardHeader>
            <CardTitle className="text-lg print:text-base">
              سجل التحويلات المالية
              <Badge variant="secondary" className="mr-2">
                {(data.transfers || []).length} تحويل
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UnifiedTable
              headers={["التاريخ", "نوع التحويل", "المبلغ", "المستفيد", "رقم الهاتف", "ملاحظات"]}
              data={transfersData}
            />
          </CardContent>
        </Card>
      )}

      {/* توزيع العمل على المشاريع */}
      {(data.projects || []).length > 0 && (
        <Card className="print:shadow-none print:border print:border-gray-300">
          <CardHeader>
            <CardTitle className="text-lg print:text-base">
              توزيع العمل على المشاريع
              <Badge variant="secondary" className="mr-2">
                {(data.projects || []).length} مشروع
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UnifiedTable
              headers={["اسم المشروع", "أيام العمل", "إجمالي الأجور", "المدفوع", "المتبقي"]}
              data={projectsData}
            />
          </CardContent>
        </Card>
      )}

      {/* تنبيهات مالية */}
      {(data.summary?.remainingBalance || 0) < 0 && (
        <Card className="border-red-200 bg-red-50 print:bg-white print:border-red-400">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="bg-red-100 rounded-full p-2">
                <DollarSign className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-900 print:text-black">تنبيه: دين للعامل</h3>
                <p className="text-sm text-red-700 print:text-gray-700 mt-1">
                  يوجد مبلغ مستحق للعامل بقيمة {formatCurrency(Math.abs(data.summary?.remainingBalance || 0))}. 
                  يُرجى مراجعة المحاسبة وصرف المستحقات.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </UnifiedReportTemplate>
  );
}