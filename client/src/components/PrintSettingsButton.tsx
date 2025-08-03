import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useLocation } from 'wouter';

interface PrintSettingsButtonProps {
  reportType: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  reportData?: any; // بيانات التقرير للمعاينة
  reportTitle?: string; // عنوان التقرير
}

/**
 * مكون زر إعدادات الطباعة - ينقل إلى صفحة التحكم مع تحديد نوع التقرير
 */
export function PrintSettingsButton({ 
  reportType, 
  className = "",
  variant = "ghost",
  reportData,
  reportTitle
}: PrintSettingsButtonProps) {
  const [, setLocation] = useLocation();

  const handleOpenSettings = () => {
    // حفظ بيانات التقرير في localStorage للوصول إليها في صفحة إعدادات الطباعة
    if (reportData) {
      const reportContext = {
        type: reportType,
        data: reportData,
        title: reportTitle || 'تقرير',
        timestamp: Date.now()
      };
      localStorage.setItem('printReportContext', JSON.stringify(reportContext));
    }
    
    setLocation(`/print-control?reportType=${reportType}&withData=true`);
  };

  return (
    <Button
      onClick={handleOpenSettings}
      variant={variant}
      className={`no-print ${className}`}
      title="إعدادات الطباعة"
    >
      <Settings className="w-4 h-4 ml-2" />
      إعدادات الطباعة
    </Button>
  );
}

export default PrintSettingsButton;