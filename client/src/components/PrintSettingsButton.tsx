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
    // حفظ بيانات التقرير + HTML الكامل في localStorage للوصول إليها في صفحة إعدادات الطباعة
    if (reportData) {
      // جلب HTML الكامل للتقرير من المنطقة المعروضة حالياً
      const reportElement = document.querySelector('[data-report-content]');
      let reportHTML = '';
      
      if (reportElement) {
        // نسخ العنصر مع جميع الأنماط المطبقة
        const clonedElement = reportElement.cloneNode(true) as HTMLElement;
        
        // إضافة الأنماط المحسوبة للحفاظ على التنسيق
        const allElements = clonedElement.querySelectorAll('*');
        allElements.forEach((el) => {
          const computedStyle = window.getComputedStyle(el as Element);
          const inlineStyle = computedStyle.cssText;
          if (inlineStyle) {
            (el as HTMLElement).style.cssText = inlineStyle;
          }
        });
        
        reportHTML = clonedElement.outerHTML;
      }
      
      const reportContext = {
        type: reportType,
        data: reportData,
        html: reportHTML, // إضافة HTML الكامل مع الأنماط
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