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
    const saveReportContext = () => {
      // البحث عن عنصر التقرير حسب نوع التقرير المحدد
      let reportElement = 
        // البحث حسب نوع التقرير أولاً
        document.querySelector(`[data-report-content="${reportType}"]`) ||
        document.querySelector(`[data-report-content]`) ||
        // أو البحث بالكلاسات المحددة
        document.querySelector('.daily-report-container') ||
        document.querySelector('.worker-statement-preview') ||
        document.querySelector('.professional-report-container') ||
        document.querySelector('.enhanced-worker-account-report') ||
        document.querySelector('.print-content') ||
        document.querySelector('.print-preview') ||
        // البحث في المحتوى النشط
        document.querySelector('[data-report-content] .print-content') ||
        document.querySelector('[data-report-content] table') ||
        // كحل أخير
        document.querySelector('table');
      
      let reportHTML = '';
      
      if (reportElement) {
        console.log('🔍 تم العثور على عنصر التقرير:', {
          tagName: reportElement.tagName,
          className: reportElement.className,
          dataAttribute: reportElement.getAttribute('data-report-content'),
          reportType: reportType
        });
        
        // نسخ العنصر مع جميع المحتويات والأنماط
        const clonedElement = reportElement.cloneNode(true) as HTMLElement;
        
        // الحفاظ على الأنماط المهمة وإضافة معرفات للطباعة
        clonedElement.classList.add('print-content', 'report-preview');
        clonedElement.setAttribute('data-report-type', reportType);
        
        // الحفاظ على الأنماط الحالية
        const computedStyle = window.getComputedStyle(reportElement);
        clonedElement.style.fontFamily = computedStyle.fontFamily;
        clonedElement.style.fontSize = computedStyle.fontSize;
        clonedElement.style.direction = 'rtl';
        
        reportHTML = clonedElement.outerHTML;
        
        console.log('📄 تم حفظ HTML بنجاح:', {
          length: reportHTML.length,
          preview: reportHTML.substring(0, 200) + '...',
          reportType: reportType
        });
      } else {
        console.warn('⚠️ لم يتم العثور على عنصر التقرير. البحث عن:', {
          reportType: reportType,
          availableElements: Array.from(document.querySelectorAll('[data-report-content], .print-content, .report-preview')).map(el => ({
            tagName: el.tagName,
            className: el.className,
            dataAttribute: el.getAttribute('data-report-content')
          }))
        });
        
        // إنشاء HTML بسيط من البيانات المتاحة
        if (reportData) {
          reportHTML = `
            <div class="print-content report-preview">
              <div class="print-header text-center p-4 mb-4 bg-blue-600 text-white">
                <h1>${reportTitle || 'تقرير'}</h1>
                <h2>شركة الإنشاءات المتقدمة</h2>
              </div>
              <div class="report-data">
                <pre>${JSON.stringify(reportData, null, 2)}</pre>
              </div>
            </div>
          `;
        }
      }
      
      const reportContext = {
        type: reportType,
        data: reportData || {},
        html: reportHTML,
        title: reportTitle || `تقرير ${reportType}`,
        timestamp: Date.now(),
        hasRealData: !!reportData
      };
      
      localStorage.setItem('printReportContext', JSON.stringify(reportContext));
      console.log('💾 تم حفظ سياق التقرير:', reportContext.title);
      
      return reportContext;
    };
    
    // حفظ البيانات أولاً
    const savedContext = saveReportContext();
    
    // الانتقال إلى صفحة إعدادات الطباعة
    setLocation(`/print-control?reportType=${reportType}&withData=true&title=${encodeURIComponent(savedContext.title)}`);
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