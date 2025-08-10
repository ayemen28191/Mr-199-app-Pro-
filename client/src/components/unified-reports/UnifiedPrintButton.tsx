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
    
    // طباعة مباشرة
    window.print();
    
    // إزالة الكلاس بعد الطباعة
    setTimeout(() => {
      document.body.classList.remove('print-mode');
    }, 100);
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