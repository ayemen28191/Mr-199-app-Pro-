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
      // البحث عن عنصر التقرير بعدة طرق مختلفة
      let reportElement = document.querySelector('[data-report-content]') ||
                         document.querySelector('.enhanced-worker-account-report') ||
                         document.querySelector('.daily-report-container') ||
                         document.querySelector('.report-content') ||
                         document.querySelector('.print-content') ||
                         document.querySelector('.worker-statement-preview') ||
                         document.querySelector('.report-preview') ||
                         document.querySelector('table'); // كحل أخير، ابحث عن أي جدول
      
      let reportHTML = '';
      
      if (reportElement) {
        console.log('🔍 تم العثور على عنصر التقرير:', reportElement.className);
        
        // نسخ العنصر مع جميع المحتويات
        const clonedElement = reportElement.cloneNode(true) as HTMLElement;
        
        // الحفاظ على الأنماط المهمة
        clonedElement.classList.add('print-content', 'report-preview');
        
        reportHTML = clonedElement.outerHTML;
        
        console.log('📄 تم حفظ HTML:', reportHTML.substring(0, 200) + '...');
      } else {
        console.warn('⚠️ لم يتم العثور على عنصر التقرير، سيتم استخدام البيانات فقط');
        
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