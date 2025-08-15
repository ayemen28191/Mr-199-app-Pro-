import React from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Printer, FileSpreadsheet } from 'lucide-react';

interface ReportColumn {
  key: string;
  label: string;
  type?: 'text' | 'currency' | 'date' | 'number';
}

interface ReportSummary {
  title: string;
  items: {
    label: string;
    value: number | string;
    type?: 'currency' | 'text';
  }[];
}

interface FinalBalance {
  label: string;
  value: number;
  type?: 'positive' | 'negative' | 'neutral';
}

interface UnifiedA4ReportProps {
  title: string;
  projectName?: string;
  dateFrom?: string;
  dateTo?: string;
  reportDate?: string;
  data: any[];
  columns: ReportColumn[];
  summary?: ReportSummary[];
  finalBalance?: FinalBalance;
}

interface UnifiedReportActionsProps {
  onPrint: () => void;
  onExport: () => void;
}

export function UnifiedA4Report({
  title,
  projectName,
  dateFrom,
  dateTo,
  reportDate,
  data,
  columns,
  summary,
  finalBalance
}: UnifiedA4ReportProps) {
  const formatCellValue = (value: any, type?: string): string => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'currency':
        return formatCurrency(Number(value) || 0);
      case 'date':
        return formatDate(value);
      case 'number':
        return Number(value).toLocaleString('en-US');
      default:
        return String(value);
    }
  };

  const getBalanceClass = (value: number, type?: string): string => {
    if (type === 'positive' || (type === undefined && value >= 0)) {
      return 'text-green-700 bg-green-50';
    } else if (type === 'negative' || (type === undefined && value < 0)) {
      return 'text-red-700 bg-red-50';
    }
    return 'text-blue-700 bg-blue-50';
  };

  return (
    <div className="unified-a4-report bg-white" dir="rtl">
      {/* رأس التقرير */}
      <div className="report-header border-b-2 border-blue-600 pb-6 mb-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blue-900 mb-2">
            شركة المباني الذكية والإنشاءات الهندسية
          </h1>
          <div className="text-lg font-semibold text-gray-800 mb-2">{title}</div>
          {projectName && (
            <div className="text-md font-medium text-blue-700 mb-1">
              مشروع: {projectName}
            </div>
          )}
          <div className="text-sm text-gray-600">
            {dateFrom && dateTo ? (
              <>الفترة: من {formatDate(dateFrom)} إلى {formatDate(dateTo)}</>
            ) : (
              <>تاريخ التقرير: {formatDate(reportDate || new Date().toISOString())}</>
            )}
          </div>
        </div>
      </div>

      {/* جدول البيانات */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="border border-gray-300 px-3 py-2 text-center font-bold text-sm">م</th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="border border-gray-300 px-3 py-2 text-center font-bold text-sm"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                  {index + 1}
                </td>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`border border-gray-300 px-3 py-2 text-center text-sm ${
                      column.type === 'currency' ? 'font-medium' : ''
                    }`}
                  >
                    {formatCellValue(row[column.key], column.type)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ملخص التقرير */}
      {summary && summary.length > 0 && (
        <div className="summary-section mb-6">
          {summary.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-4">
              <h3 className="text-lg font-bold text-blue-800 mb-2 text-center border-b border-gray-300 pb-1">
                {section.title}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex justify-between items-center border-b border-gray-200 py-1">
                    <span className="text-sm font-medium text-gray-700">{item.label}:</span>
                    <span className="text-sm font-bold text-blue-800">
                      {item.type === 'currency' 
                        ? formatCurrency(Number(item.value) || 0)
                        : item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* الرصيد النهائي */}
      {finalBalance && (
        <div className="final-balance mt-6 pt-4 border-t-2 border-gray-300">
          <div className={`text-center p-4 rounded-lg border-2 ${getBalanceClass(finalBalance.value, finalBalance.type)}`}>
            <div className="text-lg font-bold">
              {finalBalance.label}: {formatCurrency(finalBalance.value)}
            </div>
          </div>
        </div>
      )}

      {/* تذييل التقرير */}
      <div className="report-footer mt-8 pt-4 border-t border-gray-300 text-center">
        <div className="text-xs text-gray-600">
          تم إنشاء هذا التقرير في {formatDate(new Date().toISOString())} | 
          نظام إدارة مشاريع البناء الاحترافي
        </div>
      </div>
    </div>
  );
}

export function UnifiedReportActions({ onPrint, onExport }: UnifiedReportActionsProps) {
  return (
    <div className="unified-report-actions no-print mb-6 flex justify-center gap-4">
      <Button
        onClick={onPrint}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
      >
        <Printer className="h-4 w-4" />
        طباعة التقرير
      </Button>
      
      <Button
        onClick={onExport}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2"
      >
        <FileSpreadsheet className="h-4 w-4" />
        تصدير إلى Excel
      </Button>
    </div>
  );
}