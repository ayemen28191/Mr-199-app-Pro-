// اختبار توليد PDF - CommonJS
// تم إنشاؤه تلقائياً - 13 أغسطس 2025
const testPDFGeneration = async () => {
  try {
    console.log('🧪 بدء اختبار توليد PDF...');
    const puppeteer = require('puppeteer');
    const fs = require('fs');
    const path = require('path');
    
    console.log('✅ Puppeteer متاح - بدء التشغيل...');
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    
    const testHTML = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><style>@page{size:A4;margin:10mm}body{font-family:Arial;direction:rtl;text-align:right}.test-container{padding:20px}h1{color:#1e40af;text-align:center}table{width:100%;border-collapse:collapse;margin:10px 0}th,td{border:1px solid #ddd;padding:6px;text-align:center}</style></head><body><div class="test-container"><h1>🧪 اختبار توليد PDF</h1><p>هذا اختبار لتوليد ملف PDF باللغة العربية</p><table><thead><tr><th>البند</th><th>الحالة</th><th>النتيجة</th></tr></thead><tbody><tr><td>دعم العربية</td><td>✅</td><td>يعمل</td></tr><tr><td>اتجاه RTL</td><td>✅</td><td>يعمل</td></tr><tr><td>طباعة A4</td><td>✅</td><td>يعمل</td></tr></tbody></table><p>التاريخ: ${new Date().toLocaleDateString('ar-SA')}</p><p>الوقت: ${new Date().toLocaleTimeString('ar-SA')}</p></div></body></html>`;
    
    await page.setContent(testHTML, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: false,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      printBackground: true,
      preferCSSPageSize: true
    });
    
    await browser.close();
    
    const outputPath = path.join(__dirname, '../reports_output/test-pdf-output.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log('✅ نجح اختبار PDF:', outputPath);
    console.log('📊 حجم الملف:', Math.round(pdfBuffer.length / 1024), 'KB');
    
    return { success: true, path: outputPath, size: pdfBuffer.length };
    
  } catch (error) {
    console.error('❌ فشل اختبار PDF:', error.message);
    return { success: false, error: error.message };
  }
};

if (require.main === module) {
  testPDFGeneration().then(result => {
    console.log('نتيجة نهائية:', result);
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = testPDFGeneration;