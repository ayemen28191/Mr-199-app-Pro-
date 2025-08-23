/**
 * 📸 Web Screenshot Capture - لقطات الويب للمقارنة البصرية
 * يستخدم Puppeteer لالتقاط صور مطابقة للمحمول
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// قائمة الشاشات المطلوب تصويرها
const SCREENS = [
  { name: 'Dashboard', url: '/', selector: 'main' },
  { name: 'Projects', url: '/projects', selector: 'main' },
  { name: 'Workers', url: '/workers', selector: 'main' },
  { name: 'WorkerAccounts', url: '/worker-accounts', selector: 'main' },
  { name: 'WorkerAttendance', url: '/worker-attendance', selector: 'main' },
  { name: 'SuppliersProfessional', url: '/suppliers-professional', selector: 'main' },
  { name: 'SupplierAccounts', url: '/supplier-accounts', selector: 'main' },
  { name: 'DailyExpenses', url: '/daily-expenses', selector: 'main' },
  { name: 'MaterialPurchase', url: '/material-purchase', selector: 'main' },
  { name: 'Reports', url: '/reports', selector: 'main' },
  { name: 'AdvancedReports', url: '/advanced-reports', selector: 'main' },
  { name: 'EquipmentManagement', url: '/equipment-management', selector: 'main' },
];

// Mobile viewport size
const MOBILE_VIEWPORT = { width: 375, height: 667 }; // iPhone SE

async function captureWebScreenshots(baseUrl = 'http://localhost:5000', outputDir = 'tests/visual/web') {
  console.log('🚀 بدء التقاط لقطات الويب...');
  
  // إنشاء مجلد الإخراج
  await fs.mkdir(outputDir, { recursive: true });
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // تعيين viewport للمحمول
  await page.setViewport(MOBILE_VIEWPORT);
  
  // إضافة style للعربية و RTL
  await page.evaluateOnNewDocument(() => {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.style.direction = 'rtl';
  });

  const results = [];

  for (const screen of SCREENS) {
    try {
      console.log(`📸 تصوير شاشة ${screen.name}...`);
      
      await page.goto(`${baseUrl}${screen.url}`, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // انتظار تحميل المحتوى
      await page.waitForTimeout(2000);

      // انتظار العنصر الأساسي
      await page.waitForSelector(screen.selector, { timeout: 10000 });

      // إزالة عناصر التنقل والشريط العلوي
      await page.evaluate(() => {
        // إخفاء شريط التنقل العلوي
        const nav = document.querySelector('nav');
        if (nav) nav.style.display = 'none';
        
        // إخفاء أي floating buttons
        const floatingBtns = document.querySelectorAll('[data-floating-button]');
        floatingBtns.forEach(btn => btn.style.display = 'none');
        
        // إخفاء scrollbars
        document.body.style.overflow = 'hidden';
      });

      const filename = `${screen.name}.png`;
      const filepath = path.join(outputDir, filename);

      // التقاط لقطة للشاشة الكاملة أو العنصر المحدد
      if (screen.selector === 'main') {
        await page.screenshot({
          path: filepath,
          fullPage: true,
          type: 'png'
        });
      } else {
        const element = await page.$(screen.selector);
        await element.screenshot({
          path: filepath,
          type: 'png'
        });
      }

      results.push({
        screen: screen.name,
        status: 'success',
        path: filepath,
        size: (await fs.stat(filepath)).size
      });

      console.log(`✅ نجح تصوير ${screen.name} - حُفظ في ${filepath}`);
      
    } catch (error) {
      console.error(`❌ فشل تصوير ${screen.name}:`, error.message);
      results.push({
        screen: screen.name,
        status: 'error',
        error: error.message
      });
    }
  }

  await browser.close();

  // حفظ تقرير النتائج
  const reportPath = path.join(outputDir, 'capture-report.json');
  await fs.writeFile(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl,
    viewport: MOBILE_VIEWPORT,
    totalScreens: SCREENS.length,
    successCount: results.filter(r => r.status === 'success').length,
    errorCount: results.filter(r => r.status === 'error').length,
    results
  }, null, 2));

  console.log('\n📊 تقرير اللقطات:');
  console.log(`✅ نجح: ${results.filter(r => r.status === 'success').length}`);
  console.log(`❌ فشل: ${results.filter(r => r.status === 'error').length}`);
  console.log(`📄 التقرير: ${reportPath}`);

  return results;
}

// تشغيل السكربت إذا تم استدعاؤه مباشرة
if (require.main === module) {
  const args = process.argv.slice(2);
  const baseUrl = args[0] || 'http://localhost:5000';
  const outputDir = args[1] || 'tests/visual/web';
  
  captureWebScreenshots(baseUrl, outputDir)
    .then(() => console.log('🎉 اكتمل التقاط لقطات الويب!'))
    .catch(console.error);
}

module.exports = { captureWebScreenshots, SCREENS, MOBILE_VIEWPORT };