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
    // التحقق من وجود السياق المحفوظ مسبقاً في localStorage
    const existingContext = localStorage.getItem('printReportContext');
    
    if (existingContext) {
      try {
        const reportContext = JSON.parse(existingContext);
        console.log('✅ استخدام التقرير المحفوظ مسبقاً:', {
          type: reportContext.type,
          htmlLength: reportContext.html?.length || 0,
          title: reportContext.title
        });
        
        // الانتقال مباشرة إلى صفحة إعدادات الطباعة
        setLocation(`/print-control?type=${reportType}&withData=true`);
        return;
      } catch (e) {
        console.warn('خطأ في تحليل السياق المحفوظ');
      }
    }
    
    // إذا لم يوجد سياق محفوظ، حفظ السياق الحالي
    const reportContext = {
      type: reportType,
      data: reportData,
      html: '',
      title: reportTitle,
      timestamp: Date.now(),
      hasRealData: true
    };
    
    localStorage.setItem('printReportContext', JSON.stringify(reportContext));
    setLocation(`/print-control?type=${reportType}&withData=true`);
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