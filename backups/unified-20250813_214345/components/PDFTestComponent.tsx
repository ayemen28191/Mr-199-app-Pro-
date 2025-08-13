// مكون اختبار توليد PDF - تجريبي
// تم إنشاؤه تلقائياً - 13 أغسطس 2025

import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import generatePDF from '@/utils/pdfGenerator';

export const PDFTestComponent: React.FC = () => {
  
  const testPDFGeneration = async () => {
    const testHTML = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>اختبار PDF</title>
        <style>
          body { font-family: Arial; direction: rtl; text-align: right; }
          .test-content { padding: 20px; }
          h1 { color: #1e40af; text-align: center; }
        </style>
      </head>
      <body>
        <div class="test-content">
          <h1>🧪 اختبار توليد PDF</h1>
          <p>هذا اختبار لتوليد ملف PDF باللغة العربية</p>
          <p>التاريخ: ${new Date().toLocaleDateString('ar-SA')}</p>
          <p>الوقت: ${new Date().toLocaleTimeString('ar-SA')}</p>
        </div>
      </body>
      </html>
    `;

    try {
      const success = await generatePDF({
        html: testHTML,
        filename: 'test-pdf-arabic',
        format: 'A4',
        orientation: 'portrait'
      });
      
      if (success) {
        console.log('✅ نجح اختبار توليد PDF');
      } else {
        console.log('❌ فشل اختبار توليد PDF');
      }
    } catch (error) {
      console.error('خطأ في اختبار PDF:', error);
    }
  };

  return (
    <div className="no-print p-4 border rounded">
      <h3 className="text-lg font-bold mb-2">🧪 اختبار توليد PDF</h3>
      <p className="text-sm text-gray-600 mb-4">
        اختبار وظيفة توليد PDF باستخدام Puppeteer
      </p>
      <Button 
        onClick={testPDFGeneration}
        variant="outline" 
        size="sm"
        className="flex items-center gap-2"
      >
        <Download size={16} />
        اختبار PDF
      </Button>
    </div>
  );
};

export default PDFTestComponent;