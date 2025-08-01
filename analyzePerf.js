// analyzePerf.js - محلل أداء Supabase للإكمال التلقائي
import { writeFileSync } from 'fs';

(async () => {
  console.log('🔍 بدء تحليل أداء نظام الإكمال التلقائي في Supabase...');
  
  try {
    // استيراد محلل الأداء ديناميكيا
    const { performanceAnalyzer } = await import('./server/performance-analyzer.js');
    
    // تشغيل التحليل السريع
    const quickAnalysis = await performanceAnalyzer.runQuickAnalysis();
    console.log(quickAnalysis);
    
    // إنشاء تقرير مفصل
    await performanceAnalyzer.generateDetailedReport();
    
    console.log('✅ تم اكتمال تحليل الأداء بنجاح');
    
  } catch (error) {
    console.error('❌ خطأ في تحليل الأداء:', error);
    console.error('💡 تأكد من تشغيل الأمر من مجلد المشروع الصحيح');
    process.exit(1);
  }
})();