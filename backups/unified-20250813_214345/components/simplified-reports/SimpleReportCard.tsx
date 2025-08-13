// مكون بطاقة تقرير مبسطة - واجهة موحدة لجميع التقارير
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UnifiedPrintButton, UnifiedExcelExporter } from '@/components/unified-reports';
import { Button } from '@/components/ui/button';
import { Eye, FileText } from 'lucide-react';

interface SimpleReportCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  data?: any;
  reportType: 'worker_statement' | 'daily_expenses' | 'project_summary';
  onGenerate?: () => void;
  onPreview?: () => void;
  isGenerating?: boolean;
  canExport?: boolean;
  exportFileName?: string;
}

export const SimpleReportCard: React.FC<SimpleReportCardProps> = ({
  title,
  description,
  icon,
  data,
  reportType,
  onGenerate,
  onPreview,
  isGenerating = false,
  canExport = false,
  exportFileName = 'تقرير'
}) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon && <span className="text-blue-600">{icon}</span>}
          {title}
        </CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* أزرار التحكم */}
          <div className="flex flex-wrap gap-2">
            {onGenerate && (
              <Button
                onClick={onGenerate}
                disabled={isGenerating}
                className="flex-1 min-w-[120px] text-sm"
              >
                <FileText className="w-4 h-4 ml-2" />
                {isGenerating ? 'جاري الإنشاء...' : 'إنشاء التقرير'}
              </Button>
            )}
            
            {onPreview && data && (
              <Button
                onClick={onPreview}
                variant="outline"
                className="flex-1 min-w-[120px] text-sm"
              >
                <Eye className="w-4 h-4 ml-2" />
                معاينة
              </Button>
            )}
          </div>

          {/* أزرار التصدير والطباعة */}
          {canExport && data && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <UnifiedPrintButton
                variant="outline"
                className="flex-1 min-w-[100px] text-sm"
              />
              
              <UnifiedExcelExporter
                data={data}
                fileName={exportFileName}
                reportType={reportType}
                variant="outline"
                className="flex-1 min-w-[100px] text-sm"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleReportCard;