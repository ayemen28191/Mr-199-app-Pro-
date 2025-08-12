import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PrinterIcon, DownloadIcon, Building2Icon } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface UnifiedReportTemplateProps {
  title: string;
  subtitle?: string;
  reportDate?: string;
  headerInfo: {
    label: string;
    value: string;
  }[];
  children: React.ReactNode;
  onPrint?: () => void;
  onExport?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function UnifiedReportTemplate({
  title,
  subtitle,
  reportDate = new Date().toISOString().split('T')[0],
  headerInfo,
  children,
  onPrint,
  onExport,
  isLoading = false,
  className = ""
}: UnifiedReportTemplateProps) {
  return (
    <div className={`container mx-auto p-4 space-y-6 max-w-7xl ${className}`}>
      {/* Header Section - Professional Design */}
      <Card className="print:shadow-none print:border-2 print:border-gray-800">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            {/* Company Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Building2Icon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-lg text-muted-foreground mt-1">{subtitle}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    تاريخ التقرير: {formatDate(reportDate)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* أزرار التحكم تمت إزالتها لمنع التكرار - الأزرار موجودة في الصفحة الرئيسية */}
          </div>

          <Separator className="mt-4" />

          {/* Report Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {headerInfo.map((info, index) => (
              <div key={index} className="flex justify-between py-2 px-3 bg-muted/30 rounded-lg">
                <span className="font-medium text-sm text-muted-foreground">
                  {info.label}:
                </span>
                <span className="font-semibold text-sm">
                  {info.value}
                </span>
              </div>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Content Section */}
      <div className="space-y-4">
        {children}
      </div>

      {/* Footer - Print Only */}
      <div className="hidden print:block text-center text-xs text-gray-500 mt-8 pt-4 border-t">
        <p>نظام إدارة المشاريع الإنشائية - طُبع في {formatDate(new Date().toISOString().split('T')[0])}</p>
        <p>www.constructionpm.com | info@constructionpm.com</p>
      </div>

      {/* Unified Print Styles */}
      <style>{`
        @media print {
          @page {
            margin: 0.5in;
            size: A4;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          body {
            font-size: 12px !important;
            line-height: 1.4 !important;
          }
          
          .container {
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:border-2 {
            border: 2px solid !important;
          }
          
          .print\\:border-gray-800 {
            border-color: #1f2937 !important;
          }
          
          /* Table optimizations for print */
          table {
            page-break-inside: auto;
            font-size: 11px !important;
          }
          
          thead {
            display: table-header-group;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          th, td {
            padding: 6px 8px !important;
            font-size: 10px !important;
            border: 1px solid #e5e7eb !important;
          }
          
          th {
            background-color: #f3f4f6 !important;
            font-weight: bold !important;
          }
          
          /* Card spacing optimizations */
          .space-y-6 > * + * {
            margin-top: 1rem !important;
          }
          
          .space-y-4 > * + * {
            margin-top: 0.75rem !important;
          }
          
          /* Header optimizations */
          h1 {
            font-size: 18px !important;
            margin-bottom: 8px !important;
          }
          
          h2 {
            font-size: 14px !important;
            margin-bottom: 6px !important;
          }
          
          h3 {
            font-size: 12px !important;
            margin-bottom: 4px !important;
          }
          
          /* Responsive grid for print */
          .grid {
            display: grid !important;
            gap: 0.5rem !important;
          }
          
          .grid-cols-3 {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          
          .grid-cols-2 {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          
          /* Badge and button styles */
          .badge {
            font-size: 9px !important;
            padding: 2px 6px !important;
          }
          
          /* Summary card optimizations */
          .summary-cards {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0.5rem !important;
            margin: 1rem 0 !important;
          }
          
          .summary-card {
            border: 1px solid #e5e7eb !important;
            padding: 0.75rem !important;
            text-align: center !important;
            background: #f9fafb !important;
          }
          
          .summary-card .title {
            font-size: 10px !important;
            color: #6b7280 !important;
            margin-bottom: 4px !important;
          }
          
          .summary-card .value {
            font-size: 14px !important;
            font-weight: bold !important;
            color: #111827 !important;
          }
        }
        
        /* Mobile responsiveness - Screen only */
        @media (max-width: 768px) and (not print) {
          .container {
            padding: 0.5rem !important;
          }
          
          .overflow-x-auto {
            -webkit-overflow-scrolling: touch;
          }
          
          table {
            font-size: 0.875rem;
            min-width: 600px;
          }
          
          th, td {
            padding: 0.5rem !important;
            white-space: nowrap;
          }
          
          .grid-cols-3 {
            grid-template-columns: 1fr !important;
          }
          
          .grid-cols-2 {
            grid-template-columns: 1fr !important;
          }
          
          .flex-col {
            flex-direction: column !important;
          }
          
          .gap-4 {
            gap: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}

// Helper component for summary cards with unified styling
interface SummaryCardProps {
  title: string;
  value: string | number;
  valueColor?: string;
  icon?: React.ReactNode;
}

export function SummaryCard({ title, value, valueColor = "text-gray-900", icon }: SummaryCardProps) {
  return (
    <Card className="summary-card">
      <CardContent className="p-4 text-center">
        {icon && (
          <div className="flex justify-center mb-2">
            {icon}
          </div>
        )}
        <p className="text-sm text-muted-foreground title">{title}</p>
        <p className={`text-xl font-bold value ${valueColor}`}>
          {typeof value === 'number' ? formatCurrency(value) : value}
        </p>
      </CardContent>
    </Card>
  );
}

// Professional table component with unified styling
interface UnifiedTableProps {
  headers: string[];
  data: (string | number | React.ReactNode)[][];
  className?: string;
}

export function UnifiedTable({ headers, data, className = "" }: UnifiedTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full border-collapse ${className}`}>
        <thead>
          <tr className="bg-muted/50">
            {headers.map((header, index) => (
              <th
                key={index}
                className="text-center font-semibold text-sm border border-gray-300 p-3"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-muted/30 even:bg-muted/10">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="text-center text-sm border border-gray-300 p-3"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}