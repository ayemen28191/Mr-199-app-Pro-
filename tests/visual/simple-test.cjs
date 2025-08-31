/**
 * 🧪 اختبار بسيط لنظام Port
 */

const fs = require('fs').promises;
const path = require('path');

async function testPortSystem() {
  console.log('🧪 بدء اختبار نظام Port يدوي كامل...');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  // 1. اختبار Design Tokens
  try {
    const tokensPath = path.join('..', 'packages', 'tokens', 'design-tokens.ts');
    const tokensContent = await fs.readFile(tokensPath, 'utf8');
    
    const hasColors = tokensContent.includes('colors:');
    const hasTypography = tokensContent.includes('typography:');
    const hasSpacing = tokensContent.includes('spacing:');
    
    results.tests.push({
      test: 'Design Tokens',
      status: hasColors && hasTypography && hasSpacing ? 'pass' : 'fail',
      details: `Colors: ${hasColors}, Typography: ${hasTypography}, Spacing: ${hasSpacing}`,
      file: tokensPath
    });
    
    console.log(`✅ Design Tokens: ${hasColors && hasTypography && hasSpacing ? 'PASS' : 'FAIL'}`);
  } catch (error) {
    results.tests.push({
      test: 'Design Tokens',
      status: 'error',
      error: error.message
    });
    console.log('❌ Design Tokens: ERROR');
  }

  // 2. اختبار UI Components
  try {
    const components = ['Button.tsx', 'Card.tsx', 'Text.tsx'];
    let passedComponents = 0;
    
    for (const component of components) {
      try {
        const componentPath = path.join('..', 'packages', 'ui', component);
        const content = await fs.readFile(componentPath, 'utf8');
        
        // فحص المكونات الأساسية
        const hasInterface = content.includes('Props') || content.includes('interface');
        const hasReactImport = content.includes('import React') || content.includes('import {');
        const hasExport = content.includes('export');
        
        if (hasInterface && hasReactImport && hasExport) {
          passedComponents++;
        }
      } catch (error) {
        console.log(`⚠️ مكون ${component} غير موجود`);
      }
    }
    
    results.tests.push({
      test: 'UI Components',
      status: passedComponents === components.length ? 'pass' : 'partial',
      details: `${passedComponents}/${components.length} components found`,
      components: passedComponents
    });
    
    console.log(`✅ UI Components: ${passedComponents}/${components.length} - ${passedComponents === components.length ? 'PASS' : 'PARTIAL'}`);
  } catch (error) {
    results.tests.push({
      test: 'UI Components',
      status: 'error', 
      error: error.message
    });
    console.log('❌ UI Components: ERROR');
  }

  // 3. اختبار Visual Testing Scripts
  try {
    const scriptsPath = 'visual';
    const scripts = ['capture-web.cjs', 'compare.js'];
    let foundScripts = 0;
    
    for (const script of scripts) {
      try {
        await fs.access(path.join(scriptsPath, script));
        foundScripts++;
      } catch {
        try {
          // محاولة البحث في المجلد الرئيسي
          await fs.access(path.join('..', 'tests', 'visual', script));
          foundScripts++;
        } catch {
          console.log(`⚠️ سكريبت ${script} غير موجود`);
        }
      }
    }
    
    results.tests.push({
      test: 'Visual Testing Scripts',
      status: foundScripts === scripts.length ? 'pass' : 'partial',
      details: `${foundScripts}/${scripts.length} scripts found`
    });
    
    console.log(`✅ Visual Scripts: ${foundScripts}/${scripts.length} - ${foundScripts === scripts.length ? 'PASS' : 'PARTIAL'}`);
  } catch (error) {
    results.tests.push({
      test: 'Visual Testing Scripts',
      status: 'error',
      error: error.message
    });
    console.log('❌ Visual Scripts: ERROR');
  }

  // 4. اختبار Screens Matrix
  try {
    const matrixPath = path.join('..', 'screens-matrix.json');
    const matrixContent = await fs.readFile(matrixPath, 'utf8');
    const matrix = JSON.parse(matrixContent);
    
    const totalScreens = matrix.summary?.total_screens || 0;
    const screensWithData = Object.keys(matrix.screens || {}).length;
    
    results.tests.push({
      test: 'Screens Matrix',
      status: totalScreens === screensWithData && totalScreens > 0 ? 'pass' : 'partial',
      details: `${screensWithData} screens documented, ${totalScreens} total expected`,
      screens: screensWithData
    });
    
    console.log(`✅ Screens Matrix: ${screensWithData}/${totalScreens} - ${totalScreens === screensWithData ? 'PASS' : 'PARTIAL'}`);
  } catch (error) {
    results.tests.push({
      test: 'Screens Matrix',
      status: 'error',
      error: error.message
    });
    console.log('❌ Screens Matrix: ERROR');
  }

  // 5. اختبار Data Layer
  try {
    const dataPath = path.join('..', 'packages', 'data', 'supabase-unified.ts');
    const dataContent = await fs.readFile(dataPath, 'utf8');
    
    const hasSupabase = dataContent.includes('supabase');
    const hasApiRequest = dataContent.includes('apiRequest');
    const hasFunctions = dataContent.includes('export const');
    
    results.tests.push({
      test: 'Data Layer',
      status: hasSupabase && hasApiRequest && hasFunctions ? 'pass' : 'partial',
      details: `Supabase: ${hasSupabase}, API: ${hasApiRequest}, Functions: ${hasFunctions}`
    });
    
    console.log(`✅ Data Layer: ${hasSupabase && hasApiRequest && hasFunctions ? 'PASS' : 'PARTIAL'}`);
  } catch (error) {
    results.tests.push({
      test: 'Data Layer',
      status: 'error',
      error: error.message
    });
    console.log('❌ Data Layer: ERROR');
  }

  // حساب النتائج الإجمالية
  const totalTests = results.tests.length;
  const passedTests = results.tests.filter(t => t.status === 'pass').length;
  const partialTests = results.tests.filter(t => t.status === 'partial').length;
  const errorTests = results.tests.filter(t => t.status === 'error').length;

  results.summary = {
    totalTests,
    passed: passedTests,
    partial: partialTests,
    errors: errorTests,
    successRate: ((passedTests + partialTests * 0.5) / totalTests * 100).toFixed(1)
  };

  // حفظ التقرير
  const reportPath = 'port-system-test-report.json';
  try {
    await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  } catch (writeError) {
    console.log('⚠️ لم يتم حفظ التقرير:', writeError.message);
  }

  console.log('\n📊 تقرير الاختبار:');
  console.log(`✅ نجح: ${passedTests}`);
  console.log(`🔶 جزئي: ${partialTests}`);
  console.log(`❌ خطأ: ${errorTests}`);
  console.log(`📈 معدل النجاح: ${results.summary.successRate}%`);
  console.log(`📄 التقرير المفصل: ${reportPath}`);

  return results;
}

// تشغيل الاختبار
if (require.main === module) {
  testPortSystem()
    .then((results) => {
      const successRate = parseFloat(results.summary.successRate);
      if (successRate >= 80) {
        console.log('\n🎉 نظام Port جاهز للاستخدام!');
        process.exit(0);
      } else {
        console.log('\n⚠️ نظام Port يحتاج تحسينات إضافية');
        process.exit(1);
      }
    })
    .catch(console.error);
}

module.exports = { testPortSystem };