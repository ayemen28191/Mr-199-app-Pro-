import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface UnifiedPrintButtonProps {
  reportData: any;
  reportType: string;
  projectName?: string;
}

export const UnifiedPrintButton: React.FC<UnifiedPrintButtonProps> = ({
  reportData,
  reportType,
  projectName
}) => {
  const handlePrint = () => {
    // إخفاء العناصر غير المطلوبة للطباعة
    const noprint = document.querySelectorAll('.no-print');
    noprint.forEach(el => (el as HTMLElement).style.display = 'none');

    // طباعة الصفحة
    window.print();

    // إعادة إظهار العناصر بعد الطباعة
    setTimeout(() => {
      noprint.forEach(el => (el as HTMLElement).style.display = '');
    }, 1000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      className="flex items-center gap-2"
    >
      <Printer className="h-4 w-4" />
      طباعة
    </Button>
  );
};