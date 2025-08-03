import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useLocation } from 'wouter';

interface PrintSettingsButtonProps {
  reportType: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

/**
 * مكون زر إعدادات الطباعة - ينقل إلى صفحة التحكم مع تحديد نوع التقرير
 */
export function PrintSettingsButton({ 
  reportType, 
  className = "",
  variant = "ghost" 
}: PrintSettingsButtonProps) {
  const [, setLocation] = useLocation();

  const handleOpenSettings = () => {
    setLocation(`/print-control?reportType=${reportType}`);
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