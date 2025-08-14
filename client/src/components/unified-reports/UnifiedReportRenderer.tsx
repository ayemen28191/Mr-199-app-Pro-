// مكون التقارير الموحد - نظام شامل لجميع التقارير
// تم تحديثه للنسخة النهائية - 14 أغسطس 2025
import React from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import '@/styles/unified-print.css';

interface UnifiedReportRendererProps {
  reportData: any;
  reportType: string;
  projectName?: string;
}

export const UnifiedReportRenderer: React.FC<UnifiedReportRendererProps> = ({
  reportData,
  reportType,
  projectName
}) => {

  const renderDailyExpensesReport = () => {
    if (!reportData?.expenses) return <div>لا توجد بيانات لعرضها</div>;

    const { expenses, summary, project } = reportData;

    return (
      <div className="unified-report-container">
        <div className="report-header text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">كشف المصروفات اليومية</h1>
          <h2 className="text-lg text-gray-700">{project?.name || projectName}</h2>
          <p className="text-sm text-gray-600">التاريخ: {formatDate(summary?.date)}</p>
        </div>

        <div className="expenses-table-container">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-blue-50">
                <th className="border border-gray-300 p-3 text-right">الرقم</th>
                <th className="border border-gray-300 p-3 text-right">النوع</th>
                <th className="border border-gray-300 p-3 text-right">الوصف</th>
                <th className="border border-gray-300 p-3 text-right">المبلغ</th>
                <th className="border border-gray-300 p-3 text-right">تاريخ الدفع</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense: any, index: number) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-3">{index + 1}</td>
                  <td className="border border-gray-300 p-3">{expense.type}</td>
                  <td className="border border-gray-300 p-3">{expense.description}</td>
                  <td className="border border-gray-300 p-3 text-left font-mono">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="border border-gray-300 p-3">{formatDate(expense.payment_date)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-100 font-bold">
                <td colSpan={3} className="border border-gray-300 p-3 text-right">
                  إجمالي المصروفات:
                </td>
                <td className="border border-gray-300 p-3 text-left font-mono">
                  {formatCurrency(summary?.total || 0)}
                </td>
                <td className="border border-gray-300 p-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  const renderWorkerStatementReport = () => {
    if (!reportData?.transactions) return <div>لا توجد بيانات لعرضها</div>;

    const { worker, transactions, summary } = reportData;

    return (
      <div className="unified-report-container">
        <div className="report-header text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">كشف حساب العامل</h1>
          <h2 className="text-lg text-gray-700">العامل: {worker?.name}</h2>
          <p className="text-sm text-gray-600">
            الفترة: {formatDate(summary?.dateFrom)} - {formatDate(summary?.dateTo)}
          </p>
        </div>

        <div className="statement-table-container">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-purple-50">
                <th className="border border-gray-300 p-3 text-right">التاريخ</th>
                <th className="border border-gray-300 p-3 text-right">الوصف</th>
                <th className="border border-gray-300 p-3 text-right">المستحق</th>
                <th className="border border-gray-300 p-3 text-right">المدفوع</th>
                <th className="border border-gray-300 p-3 text-right">الرصيد</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-3">{formatDate(transaction.date)}</td>
                  <td className="border border-gray-300 p-3">{transaction.description}</td>
                  <td className="border border-gray-300 p-3 text-left font-mono">
                    {transaction.credit ? formatCurrency(transaction.credit) : '-'}
                  </td>
                  <td className="border border-gray-300 p-3 text-left font-mono">
                    {transaction.debit ? formatCurrency(transaction.debit) : '-'}
                  </td>
                  <td className="border border-gray-300 p-3 text-left font-mono">
                    {formatCurrency(transaction.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-purple-100 font-bold">
                <td colSpan={4} className="border border-gray-300 p-3 text-right">
                  الرصيد النهائي:
                </td>
                <td className="border border-gray-300 p-3 text-left font-mono">
                  {formatCurrency(summary?.finalBalance || 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  const renderMaterialsReport = () => {
    if (!reportData?.materials) return <div>لا توجد بيانات لعرضها</div>;

    const { materials, summary, project } = reportData;

    return (
      <div className="unified-report-container">
        <div className="report-header text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">كشف المواد المشتراة</h1>
          <h2 className="text-lg text-gray-700">{project?.name || projectName}</h2>
          <p className="text-sm text-gray-600">
            الفترة: {formatDate(summary?.dateFrom)} - {formatDate(summary?.dateTo)}
          </p>
        </div>

        <div className="materials-table-container">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-green-50">
                <th className="border border-gray-300 p-3 text-right">المادة</th>
                <th className="border border-gray-300 p-3 text-right">الكمية</th>
                <th className="border border-gray-300 p-3 text-right">السعر</th>
                <th className="border border-gray-300 p-3 text-right">المورد</th>
                <th className="border border-gray-300 p-3 text-right">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((material: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-3">{material.description}</td>
                  <td className="border border-gray-300 p-3">{material.quantity || '-'}</td>
                  <td className="border border-gray-300 p-3 text-left font-mono">
                    {formatCurrency(material.amount)}
                  </td>
                  <td className="border border-gray-300 p-3">{material.supplier || '-'}</td>
                  <td className="border border-gray-300 p-3">{formatDate(material.payment_date)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-green-100 font-bold">
                <td colSpan={4} className="border border-gray-300 p-3 text-right">
                  إجمالي المواد:
                </td>
                <td className="border border-gray-300 p-3 text-left font-mono">
                  {formatCurrency(summary?.total || 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  const renderProjectSummaryReport = () => {
    if (!reportData?.summary) return <div>لا توجد بيانات لعرضها</div>;

    const { summary, project } = reportData;

    return (
      <div className="unified-report-container">
        <div className="report-header text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">ملخص المشروع</h1>
          <h2 className="text-lg text-gray-700">{project?.name || projectName}</h2>
          <p className="text-sm text-gray-600">
            الفترة: {formatDate(summary?.dateFrom)} - {formatDate(summary?.dateTo)}
          </p>
        </div>

        <div className="summary-grid grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="income-section">
            <h3 className="text-lg font-semibold mb-3 text-green-700">الإيرادات</h3>
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>تحويلات العهدة:</span>
                  <span className="font-mono">{formatCurrency(summary.totalTrustTransfers || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>تحويلات واردة:</span>
                  <span className="font-mono">{formatCurrency(summary.totalIncomingTransfers || 0)}</span>
                </div>
                <hr className="border-green-200" />
                <div className="flex justify-between font-bold">
                  <span>إجمالي الإيرادات:</span>
                  <span className="font-mono">{formatCurrency(summary.totalIncome || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="expenses-section">
            <h3 className="text-lg font-semibold mb-3 text-red-700">المصروفات</h3>
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>أجور العمال:</span>
                  <span className="font-mono">{formatCurrency(summary.totalWages || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>مشتريات المواد:</span>
                  <span className="font-mono">{formatCurrency(summary.totalMaterials || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>النقل:</span>
                  <span className="font-mono">{formatCurrency(summary.totalTransportation || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>مصاريف متنوعة:</span>
                  <span className="font-mono">{formatCurrency(summary.totalMiscellaneous || 0)}</span>
                </div>
                <hr className="border-red-200" />
                <div className="flex justify-between font-bold">
                  <span>إجمالي المصروفات:</span>
                  <span className="font-mono">{formatCurrency(summary.totalExpenses || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="final-summary mt-6 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded p-4 inline-block">
            <h3 className="text-lg font-semibold mb-2">الرصيد النهائي</h3>
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency((summary.totalIncome || 0) - (summary.totalExpenses || 0))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // تحديد نوع التقرير وعرض المحتوى المناسب
  const renderReport = () => {
    switch (reportType) {
      case 'daily':
        return renderDailyExpensesReport();
      case 'worker_statement':
        return renderWorkerStatementReport();
      case 'materials':
        return renderMaterialsReport();
      case 'project_summary':
        return renderProjectSummaryReport();
      default:
        return <div>نوع التقرير غير مدعوم</div>;
    }
  };

  return (
    <div className="unified-report-wrapper print:p-0">
      {renderReport()}
    </div>
  );
};