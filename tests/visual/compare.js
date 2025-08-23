/**
 * 🔍 Visual Comparison Engine - محرك المقارنة البصرية
 * يقارن لقطات الويب والمحمول للوصول لتطابق 0 بكسل
 */

const fs = require('fs').promises;
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

async function compareImages(webImagePath, mobileImagePath, diffOutputPath) {
  try {
    // قراءة الصور
    const webImageBuffer = await fs.readFile(webImagePath);
    const mobileImageBuffer = await fs.readFile(mobileImagePath);

    // تحويل إلى PNG objects
    const webImage = PNG.sync.read(webImageBuffer);
    const mobileImage = PNG.sync.read(mobileImageBuffer);

    // التأكد من تطابق الأبعاد
    const { width: webWidth, height: webHeight } = webImage;
    const { width: mobileWidth, height: mobileHeight } = mobileImage;

    // إذا كانت الأبعاد مختلفة، نحتاج لتوحيدها
    const width = Math.min(webWidth, mobileWidth);
    const height = Math.min(webHeight, mobileHeight);

    // إنشاء صورة للفروقات
    const diff = new PNG({ width, height });

    // مقارنة البكسلات
    const diffPixels = pixelmatch(
      webImage.data, 
      mobileImage.data, 
      diff.data, 
      width, 
      height,
      {
        threshold: 0.1, // حساسية المقارنة
        includeAA: false, // تجاهل anti-aliasing
      }
    );

    // حفظ صورة الفروقات
    if (diffOutputPath) {
      await fs.writeFile(diffOutputPath, PNG.sync.write(diff));
    }

    const totalPixels = width * height;
    const diffPercentage = (diffPixels / totalPixels) * 100;

    return {
      width,
      height,
      totalPixels,
      diffPixels,
      diffPercentage: parseFloat(diffPercentage.toFixed(2)),
      webDimensions: { width: webWidth, height: webHeight },
      mobileDimensions: { width: mobileWidth, height: mobileHeight },
      identical: diffPixels === 0
    };

  } catch (error) {
    throw new Error(`فشل في مقارنة الصور: ${error.message}`);
  }
}

async function compareAllScreenshots(webDir = 'tests/visual/web', mobileDir = 'tests/visual/mobile', outputDir = 'tests/visual/diff') {
  console.log('🔍 بدء المقارنة البصرية الشاملة...');

  // إنشاء مجلد النتائج
  await fs.mkdir(outputDir, { recursive: true });

  const webFiles = await fs.readdir(webDir);
  const mobileFiles = await fs.readdir(mobileDir);

  const pngFiles = webFiles.filter(f => f.endsWith('.png'));
  const results = [];
  let totalDiffPixels = 0;
  let totalPixels = 0;

  for (const filename of pngFiles) {
    const webPath = path.join(webDir, filename);
    const mobilePath = path.join(mobileDir, filename);
    const diffPath = path.join(outputDir, `diff-${filename}`);

    try {
      // التحقق من وجود الملف في المحمول
      try {
        await fs.access(mobilePath);
      } catch {
        console.log(`⚠️ لم يتم العثور على ${filename} في المحمول`);
        results.push({
          screen: filename.replace('.png', ''),
          status: 'missing_mobile',
          error: 'Mobile screenshot not found'
        });
        continue;
      }

      console.log(`🔍 مقارنة ${filename}...`);

      const comparison = await compareImages(webPath, mobilePath, diffPath);
      
      totalDiffPixels += comparison.diffPixels;
      totalPixels += comparison.totalPixels;

      results.push({
        screen: filename.replace('.png', ''),
        status: comparison.identical ? 'identical' : 'different',
        ...comparison,
        diffImagePath: diffPath
      });

      const status = comparison.identical ? '✅ مطابق تماماً' : `❌ يختلف بـ ${comparison.diffPercentage}%`;
      console.log(`${status} - ${filename}`);

    } catch (error) {
      console.error(`❌ فشل مقارنة ${filename}:`, error.message);
      results.push({
        screen: filename.replace('.png', ''),
        status: 'error',
        error: error.message
      });
    }
  }

  // حساب النسب الإجمالية
  const overallDiffPercentage = totalPixels > 0 ? (totalDiffPixels / totalPixels) * 100 : 0;
  const identicalCount = results.filter(r => r.status === 'identical').length;
  const differentCount = results.filter(r => r.status === 'different').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const missingCount = results.filter(r => r.status === 'missing_mobile').length;

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalScreens: pngFiles.length,
      identical: identicalCount,
      different: differentCount,
      errors: errorCount,
      missing: missingCount,
      overallDiffPercentage: parseFloat(overallDiffPercentage.toFixed(2)),
      passedVisualTest: overallDiffPercentage === 0
    },
    results: results.sort((a, b) => a.screen.localeCompare(b.screen))
  };

  // حفظ التقرير
  const reportPath = path.join(outputDir, 'comparison-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  // إنشاء تقرير HTML
  const htmlReportPath = path.join(outputDir, 'comparison-report.html');
  await generateHTMLReport(report, htmlReportPath);

  console.log('\n📊 تقرير المقارنة البصرية:');
  console.log(`✅ مطابق تماماً: ${identicalCount}`);
  console.log(`❌ مختلف: ${differentCount}`);
  console.log(`⚠️ مفقود: ${missingCount}`);
  console.log(`💔 أخطاء: ${errorCount}`);
  console.log(`📊 نسبة الاختلاف الإجمالية: ${overallDiffPercentage.toFixed(2)}%`);
  console.log(`🎯 اجتياز الاختبار البصري: ${report.summary.passedVisualTest ? 'نعم' : 'لا'}`);
  console.log(`📄 التقرير JSON: ${reportPath}`);
  console.log(`🌐 التقرير HTML: ${htmlReportPath}`);

  return report;
}

async function generateHTMLReport(report, outputPath) {
  const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير المقارنة البصرية - Visual Comparison Report</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px; 
            background: white; 
            min-height: 100vh;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
        }
        .summary { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin-bottom: 30px; 
        }
        .stat-card { 
            padding: 20px; 
            border-radius: 10px; 
            text-align: center; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .identical { background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); color: white; }
        .different { background: linear-gradient(135deg, #f87171 0%, #ef4444 100%); color: white; }
        .missing { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; }
        .error { background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%); color: white; }
        
        .results-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 20px; 
        }
        .result-card { 
            border: 1px solid #ddd; 
            border-radius: 10px; 
            padding: 15px; 
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .result-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 10px; 
        }
        .status-badge { 
            padding: 5px 12px; 
            border-radius: 20px; 
            font-size: 12px; 
            font-weight: bold; 
        }
        .status-identical { background: #4ade80; color: white; }
        .status-different { background: #ef4444; color: white; }
        .status-missing { background: #f59e0b; color: white; }
        .status-error { background: #9333ea; color: white; }
        
        .diff-details { margin-top: 10px; font-size: 14px; color: #666; }
        .pass { color: #22c55e; font-weight: bold; }
        .fail { color: #ef4444; font-weight: bold; }
        
        h1, h2 { margin: 0; }
        .timestamp { opacity: 0.8; font-size: 14px; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 تقرير المقارنة البصرية</h1>
            <h2>Visual Comparison Report</h2>
            <div class="timestamp">Generated: ${new Date(report.timestamp).toLocaleString('ar-SA')}</div>
        </div>
        
        <div class="summary">
            <div class="stat-card identical">
                <h3>✅ مطابق تماماً</h3>
                <div style="font-size: 2em; margin: 10px 0;">${report.summary.identical}</div>
                <div>Identical Screens</div>
            </div>
            <div class="stat-card different">
                <h3>❌ مختلف</h3>
                <div style="font-size: 2em; margin: 10px 0;">${report.summary.different}</div>
                <div>Different Screens</div>
            </div>
            <div class="stat-card missing">
                <h3>⚠️ مفقود</h3>
                <div style="font-size: 2em; margin: 10px 0;">${report.summary.missing}</div>
                <div>Missing Screens</div>
            </div>
            <div class="stat-card error">
                <h3>💔 أخطاء</h3>
                <div style="font-size: 2em; margin: 10px 0;">${report.summary.errors}</div>
                <div>Error Screens</div>
            </div>
        </div>
        
        <div style="text-align: center; margin: 20px 0; padding: 20px; background: ${report.summary.passedVisualTest ? '#dcfce7' : '#fef2f2'}; border-radius: 10px;">
            <h2 class="${report.summary.passedVisualTest ? 'pass' : 'fail'}">
                🎯 اجتياز الاختبار البصري: ${report.summary.passedVisualTest ? '✅ نعم' : '❌ لا'}
            </h2>
            <p>نسبة الاختلاف الإجمالية: <strong>${report.summary.overallDiffPercentage}%</strong></p>
        </div>
        
        <div class="results-grid">
            ${report.results.map(result => `
                <div class="result-card">
                    <div class="result-header">
                        <h3>${result.screen}</h3>
                        <span class="status-badge status-${result.status}">
                            ${getStatusText(result.status)}
                        </span>
                    </div>
                    ${generateResultDetails(result)}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;

  function getStatusText(status) {
    const statusMap = {
      'identical': '✅ مطابق',
      'different': '❌ مختلف', 
      'missing_mobile': '⚠️ مفقود',
      'error': '💔 خطأ'
    };
    return statusMap[status] || status;
  }

  function generateResultDetails(result) {
    if (result.status === 'identical') {
      return `<div class="diff-details">
        <div>الأبعاد: ${result.width}×${result.height} بكسل</div>
        <div>🎉 تطابق كامل - 0 بكسل مختلف!</div>
      </div>`;
    }
    
    if (result.status === 'different') {
      return `<div class="diff-details">
        <div>الأبعاد: ${result.width}×${result.height} بكسل</div>
        <div>البكسلات المختلفة: ${result.diffPixels} من ${result.totalPixels}</div>
        <div>نسبة الاختلاف: <strong>${result.diffPercentage}%</strong></div>
      </div>`;
    }
    
    if (result.status === 'missing_mobile') {
      return `<div class="diff-details">❌ لم يتم العثور على لقطة المحمول</div>`;
    }
    
    if (result.status === 'error') {
      return `<div class="diff-details">❌ ${result.error}</div>`;
    }
    
    return '';
  }

  await fs.writeFile(outputPath, html);
}

// تشغيل السكربت إذا تم استدعاؤه مباشرة
if (require.main === module) {
  const args = process.argv.slice(2);
  const webDir = args[0] || 'tests/visual/web';
  const mobileDir = args[1] || 'tests/visual/mobile';
  const outputDir = args[2] || 'tests/visual/diff';
  
  compareAllScreenshots(webDir, mobileDir, outputDir)
    .then(report => {
      console.log('\n🎉 اكتملت المقارنة البصرية!');
      // Exit with error code if visual test failed
      process.exit(report.summary.passedVisualTest ? 0 : 1);
    })
    .catch(console.error);
}

module.exports = { compareImages, compareAllScreenshots };