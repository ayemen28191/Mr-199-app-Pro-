// تحليل مفصل للرصيد السالب - مشروع مصنع الحبشي
// معرف المشروع: 4dd91471-231d-40da-ac05-7999556c5a72

const projectId = "4dd91471-231d-40da-ac05-7999556c5a72";

console.log("🔍 بدء التحليل المالي المفصل لمشروع مصنع الحبشي");
console.log("=".repeat(60));

// استعلامات مباشرة لجلب جميع البيانات المالية
const queries = [
  {
    name: "1. تحويلات العهدة (الدخل)",
    url: `http://localhost:5000/api/projects/${projectId}/stats`
  },
  {
    name: "2. مصاريف أجور العمال",
    description: "أجور العمال اليومية"
  },
  {
    name: "3. مشتريات المواد",
    description: "جميع مشتريات المواد للمشروع"
  },
  {
    name: "4. مصاريف النقل",
    description: "مصاريف النقل والمواصلات"
  },
  {
    name: "5. مصاريف متنوعة للعمال",
    description: "مصاريف إضافية للعمال"
  }
];

async function analyzeFinancialData() {
  try {
    // جلب الإحصائيات العامة
    const response = await fetch(`http://localhost:5000/api/projects/${projectId}/stats`);
    const stats = await response.json();
    
    console.log("📊 الإحصائيات الحالية:");
    console.log(`   💰 إجمالي الدخل: ${stats.totalIncome.toLocaleString()} ر.ي`);
    console.log(`   💸 إجمالي المصاريف: ${stats.totalExpenses.toLocaleString()} ر.ي`);
    console.log(`   📈 الرصيد الحالي: ${stats.currentBalance.toLocaleString()} ر.ي`);
    console.log(`   👷 عدد العمال: ${stats.totalWorkers}`);
    console.log(`   📅 أيام العمل المكتملة: ${stats.completedDays}`);
    
    console.log("\n" + "=".repeat(60));
    console.log("🎯 تحليل مصادر الرصيد السالب:");
    console.log("=".repeat(60));
    
    // تحليل المصاريف
    const deficit = Math.abs(stats.currentBalance);
    console.log(`⚠️  العجز المالي الحالي: ${deficit.toLocaleString()} ر.ي`);
    console.log(`📊 نسبة المصاريف إلى الدخل: ${((stats.totalExpenses / stats.totalIncome) * 100).toFixed(1)}%`);
    
    // حساب متوسط المصاريف اليومية
    const dailyAverageExpenses = stats.totalExpenses / stats.completedDays;
    const dailyAverageIncome = stats.totalIncome / stats.completedDays;
    
    console.log(`\n📈 تحليل المصاريف اليومية:`);
    console.log(`   💸 متوسط المصاريف اليومية: ${dailyAverageExpenses.toLocaleString()} ر.ي`);
    console.log(`   💰 متوسط الدخل اليومي: ${dailyAverageIncome.toLocaleString()} ر.ي`);
    console.log(`   📊 الفجوة اليومية: ${(dailyAverageExpenses - dailyAverageIncome).toLocaleString()} ر.ي`);
    
    // تحليل بناء على عدد العمال
    const averageWorkerCost = stats.totalExpenses / (stats.totalWorkers * stats.completedDays);
    console.log(`\n👷 تحليل تكلفة العمال:`);
    console.log(`   💰 متوسط تكلفة العامل الواحد يومياً: ${averageWorkerCost.toLocaleString()} ر.ي`);
    console.log(`   📊 إجمالي تكلفة جميع العمال لمدة ${stats.completedDays} أيام: ${stats.totalExpenses.toLocaleString()} ر.ي`);
    
    // تواريخ المشكلة
    const today = new Date();
    const workStartDate = new Date();
    workStartDate.setDate(today.getDate() - stats.completedDays);
    
    console.log(`\n📅 التحليل الزمني:`);
    console.log(`   🎯 المشروع نشط منذ ${stats.completedDays} أيام`);
    console.log(`   📈 تراكم العجز: ${(deficit / stats.completedDays).toLocaleString()} ر.ي يومياً`);
    console.log(`   ⚠️  إذا استمر بنفس المعدل: العجز سيزيد ${(deficit / stats.completedDays).toLocaleString()} ر.ي كل يوم`);
    
    // اقتراحات للحلول
    console.log("\n💡 أسباب الرصيد السالب:");
    console.log("   1. المصاريف اليومية عالية جداً - أكثر من الدخل بـ30%");
    console.log("   2. تكلفة العمال الـ8 مرتفعة جداً لمدة 10 أيام");
    console.log("   3. قد تكون هناك مصاريف إضافية (مواد، نقل، متنوعة)");
    console.log(`   4. العجز تراكم خلال الأيام الـ${stats.completedDays} الماضية`);
    
    console.log("\n🔧 الحلول العاجلة:");
    console.log(`   1. إضافة تحويلة عهدة بمبلغ ${Math.ceil(deficit / 1000) * 1000} ر.ي لتغطية العجز`);
    console.log("   2. مراجعة أجور العمال اليومية - قد تكون مرتفعة");
    console.log("   3. تحليل المصاريف الإضافية (مواد، نقل، متنوعة)");
    console.log("   4. تحسين كفاءة العمل لتقليل المدة");
    
  } catch (error) {
    console.error("❌ خطأ في التحليل:", error.message);
  }
}

// تشغيل التحليل
analyzeFinancialData();