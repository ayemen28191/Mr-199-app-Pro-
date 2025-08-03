import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { printWithSettings } from '@/hooks/usePrintSettings';

interface PrintButtonProps {
  reportType: string;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  printSettings?: any; // إعدادات الطباعة المخصصة
}

/**
 * مكون زر الطباعة مع تطبيق إعدادات الطباعة تلقائياً
 */
export function PrintButton({ 
  reportType, 
  disabled = false, 
  children, 
  className = "",
  variant = "outline",
  printSettings
}: PrintButtonProps) {
  const handlePrint = () => {
    printWithSettings(reportType, 500, printSettings);
  };

  return (
    <Button
      onClick={handlePrint}
      disabled={disabled}
      variant={variant}
      className={`no-print ${className}`}
    >
      <Printer className="w-4 h-4 ml-2" />
      {children || 'طباعة'}
    </Button>
  );
}

export default PrintButton;