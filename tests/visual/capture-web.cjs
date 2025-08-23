/**
 * 📸 Web Screenshot Capture - CommonJS Version
 * يستخدم أدوات بسيطة لالتقاط لقطات الويب
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// قائمة الشاشات المطلوب تصويرها
const SCREENS = [
  { name: 'Dashboard', url: '/', selector: 'main', waitFor: 'h1, .card, .project-card' },
  { name: 'Projects', url: '/projects', selector: 'main', waitFor: '.project-card, h1' },
  { name: 'Workers', url: '/workers', selector: 'main', waitFor: 'h1, table, .worker-card' },
];

// Mobile viewport size
const MOBILE_VIEWPORT = { width: 375, height: 667 }; // iPhone SE

async function captureWebScreenshots(baseUrl = 'http://localhost:5000', outputDir = 'tests/visual/web') {
  console.log('🚀 بدء التقاط لقطات الويب...');
  
  try {
    // إنشاء مجلد الإخراج
    await fs.mkdir(outputDir, { recursive: true });
    
    // محاولة تشغيل puppeteer
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security'
        ]
      });
    } catch (error) {
      console.log('⚠️ فشل في تشغيل puppeteer، ربما غير متوفر:', error.message);
      return createSimpleReport(outputDir, 'puppeteer_not_available');
    }

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
        
        // محاولة الوصول للصفحة
        const response = await page.goto(`${baseUrl}${screen.url}`, { 
          waitUntil: 'networkidle0',
          timeout: 15000 
        });

        if (!response.ok()) {
          throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
        }

        // انتظار تحميل المحتوى
        await page.waitForTimeout(2000);

        // انتظار العناصر الأساسية
        try {
          await page.waitForSelector(screen.waitFor, { timeout: 5000 });
        } catch {
          console.log(`⚠️ لم يتم العثور على العناصر المطلوبة في ${screen.name}`);
        }

        // تنظيف الصفحة للتصوير
        await page.evaluate(() => {
          // إخفاء عناصر التنقل
          const selectors = ['nav', '[data-floating-button]', '.no-print'];
          selectors.forEach(sel => {
            const elements = document.querySelectorAll(sel);
            elements.forEach(el => el.style.display = 'none');
          });
          
          // إخفاء scrollbars
          document.body.style.overflow = 'hidden';
        });

        const filename = `${screen.name}.png`;
        const filepath = path.join(outputDir, filename);

        // التقاط لقطة
        await page.screenshot({
          path: filepath,
          fullPage: true,
          type: 'png'
        });

        const stats = await fs.stat(filepath);
        
        results.push({
          screen: screen.name,
          status: 'success',
          path: filepath,
          size: stats.size,
          url: `${baseUrl}${screen.url}`
        });

        console.log(`✅ نجح تصوير ${screen.name} - ${(stats.size / 1024).toFixed(1)} KB`);
        
      } catch (error) {
        console.error(`❌ فشل تصوير ${screen.name}:`, error.message);
        results.push({
          screen: screen.name,
          status: 'error',
          error: error.message,
          url: `${baseUrl}${screen.url}`
        });
      }
    }

    await browser.close();

    // حفظ تقرير النتائج
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl,
      viewport: MOBILE_VIEWPORT,
      totalScreens: SCREENS.length,
      successCount: results.filter(r => r.status === 'success').length,
      errorCount: results.filter(r => r.status === 'error').length,
      results
    };

    const reportPath = path.join(outputDir, 'capture-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 تقرير اللقطات:');
    console.log(`✅ نجح: ${report.successCount}`);
    console.log(`❌ فشل: ${report.errorCount}`);
    console.log(`📄 التقرير: ${reportPath}`);

    return results;

  } catch (error) {
    console.error('💥 خطأ عام في النظام:', error);
    return createSimpleReport(outputDir, error.message);
  }
}

async function createSimpleReport(outputDir, error) {
  const report = {
    timestamp: new Date().toISOString(),
    status: 'failed',
    error,
    message: 'فشل في تشغيل نظام التقاط اللقطات'
  };
  
  const reportPath = path.join(outputDir, 'capture-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  return [];
}

// تشغيل السكربت إذا تم استدعاؤه مباشرة
if (require.main === module) {
  const args = process.argv.slice(2);
  const baseUrl = args[0] || 'http://localhost:5000';
  const outputDir = args[1] || 'tests/visual/web';
  
  captureWebScreenshots(baseUrl, outputDir)
    .then((results) => {
      const success = results.filter(r => r.status === 'success').length;
      if (success > 0) {
        console.log(`🎉 اكتمل التقاط ${success} لقطة بنجاح!`);
        process.exit(0);
      } else {
        console.log('⚠️ لم يتم التقاط أي لقطات بنجاح');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 فشل النظام:', error);
      process.exit(1);
    });
}

module.exports = { captureWebScreenshots, SCREENS, MOBILE_VIEWPORT };