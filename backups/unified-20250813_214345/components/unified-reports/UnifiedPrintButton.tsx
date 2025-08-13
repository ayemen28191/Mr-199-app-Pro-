// مكون زر الطباعة الموحد - مبسط وفعال
import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface UnifiedPrintButtonProps {
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  targetSelector?: string; // اختياري: محدد للعنصر المراد طباعته
}

export function UnifiedPrintButton({ 
  disabled = false, 
  children, 
  className = "",
  variant = "outline",
  targetSelector = ".print-content"
}: UnifiedPrintButtonProps) {
  
  const handlePrint = () => {
    // إضافة كلاس للجسم لتفعيل أنماط الطباعة
    document.body.classList.add('print-mode');
    
    // تحسين إعدادات الطباعة
    const printContent = document.querySelector('.print-content') as HTMLElement;
    if (printContent) {
      // إضافة كلاس لضغط المحتوى في صفحة واحدة
      printContent.classList.add('print-single-page');
      
      // ضبط التحجيم حسب طول المحتوى
      const contentHeight = printContent.scrollHeight;
      if (contentHeight > 1000) {
        printContent.style.transform = 'scale(0.7)';
        printContent.style.transformOrigin = 'top center';
      } else if (contentHeight > 800) {
        printContent.style.transform = 'scale(0.8)';
        printContent.style.transformOrigin = 'top center';
      }
    }
    
    // طباعة مباشرة
    window.print();
    
    // إزالة الكلاس بعد الطباعة واستعادة الحالة الأصلية
    setTimeout(() => {
      document.body.classList.remove('print-mode');
      if (printContent) {
        printContent.classList.remove('print-single-page');
        printContent.style.transform = '';
        printContent.style.transformOrigin = '';
      }
    }, 1000);
  };

  return (
    <Button
      onClick={handlePrint}
      disabled={disabled}
      variant={variant}
      className={`no-print ${className}`}
      data-testid="button-print"
    >
      <Printer className="w-4 h-4 ml-2" />
      {children || 'طباعة'}
    </Button>
  );
}

export default UnifiedPrintButton;