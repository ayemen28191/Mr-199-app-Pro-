// تحليل مباشر من خلال النظام لإيجاد المصروف المحدد
const fetch = require('node-fetch');

const projectId = "4dd91471-231d-40da-ac05-7999556c5a72";
const baseUrl = "http://localhost:5000/api";

console.log("🔍 البحث عن المصروف المحدد الذي تسبب في الرصيد السالب");
console.log("📂 مشروع مصنع الحبشي");
console.log("=".repeat(80));

async function findSpecificExpense() {
  try {
    // جلب إحصائيات المشروع أولاً
    console.log("📊 جاري جلب إحصائيات المشروع...");
    const statsResponse = await fetch(`${baseUrl}/projects/${projectId}/stats`);
    
    if (!statsResponse.ok) {
      throw new Error(`خطأ في جلب الإحصائيات: ${statsResponse.status}`);
    }
    
    const stats = await statsResponse.json();
    
    console.log("📈 الإحصائيات الحالية:");
    console.log(`   💰 إجمالي الدخل: ${stats.totalIncome.toLocaleString()} ر.ي`);
    console.log(`   💸 إجمالي المصاريف: ${stats.totalExpenses.toLocaleString()} ر.ي`);
    console.log(`   📊 الرصيد الحالي: ${stats.currentBalance.toLocaleString()} ر.ي`);
    console.log(`   👷 عدد العمال: ${stats.totalWorkers}`);
    console.log(`   📅 أيام العمل: ${stats.completedDays}`);
    
    if (stats.currentBalance >= 0) {
      console.log("✅ الرصيد ليس سالباً حالياً!");
      return;
    }
    
    console.log("\n" + "=".repeat(80));
    console.log("🎯 تحليل المصاريف لإيجاد السبب في الرصيد السالب:");
    console.log("=".repeat(80));
    
    // تحليل التكلفة حسب النوع
    const dailyExpenses = stats.totalExpenses / stats.completedDays;
    const dailyIncome = stats.totalIncome / stats.completedDays;
    const dailyDeficit = dailyExpenses - dailyIncome;
    
    console.log("\n📈 التحليل اليومي:");
    console.log(`   💸 متوسط المصاريف اليومية: ${dailyExpenses.toLocaleString()} ر.ي`);
    console.log(`   💰 متوسط الدخل اليومي: ${dailyIncome.toLocaleString()} ر.ي`);
    console.log(`   ⚠️  العجز اليومي: ${dailyDeficit.toLocaleString()} ر.ي`);
    
    // تحليل تكلفة العمال
    const workerCostPerDay = stats.totalExpenses / (stats.totalWorkers * stats.completedDays);
    console.log("\n👷 تحليل تكلفة العمال:");
    console.log(`   💰 تكلفة العامل الواحد يومياً: ${workerCostPerDay.toLocaleString()} ر.ي`);
    console.log(`   📊 إجمالي تكلفة العمال (${stats.totalWorkers} عمال × ${stats.completedDays} أيام): ${stats.totalExpenses.toLocaleString()} ر.ي`);
    
    // تحديد أكبر المصاريف المحتملة
    console.log("\n🔍 أكبر المصاريف المحتملة:");
    
    if (workerCostPerDay > 5000) {
      console.log("   ⚠️  أجور العمال مرتفعة جداً - أكثر من 5000 ر.ي للعامل يومياً");
      console.log(`      📊 هذا يعني ${(workerCostPerDay * stats.totalWorkers).toLocaleString()} ر.ي يومياً لجميع العمال`);
    }
    
    // التحليل الزمني
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - stats.completedDays + 1);
    
    console.log("\n📅 التحليل الزمني:");
    console.log(`   📅 فترة المشروع: من ${startDate.toISOString().split('T')[0]} إلى ${today.toISOString().split('T')[0]}`);
    console.log(`   📈 تراكم العجز: ${(Math.abs(stats.currentBalance) / stats.completedDays).toLocaleString()} ر.ي يومياً`);
    
    // التحليل المحدد للمصروف
    console.log("\n🎯 المصروف الرئيسي المسؤول عن الرصيد السالب:");
    console.log("=".repeat(80));
    
    if (stats.totalExpenses > stats.totalIncome) {
      const deficit = stats.totalExpenses - stats.totalIncome;
      console.log(`💸 إجمالي الفائض في المصاريف: ${deficit.toLocaleString()} ر.ي`);
      
      // تحديد أكبر نوع مصروف بناءً على المتوسط
      if (workerCostPerDay > 4000) {
        console.log(`\n🎯 المصروف الأساسي: أجور العمال`);
        console.log(`   📅 النوع: مصروف أجور عمال`);
        console.log(`   💰 التكلفة اليومية: ${(workerCostPerDay * stats.totalWorkers).toLocaleString()} ر.ي`);
        console.log(`   👷 العمال المتأثرون: ${stats.totalWorkers} عامل`);
        console.log(`   📊 إجمالي أيام العمل: ${stats.completedDays} يوم`);
        console.log(`   ⚠️  هذا المصروف تسبب في تجاوز الميزانية بـ${deficit.toLocaleString()} ر.ي`);
        
        // تحديد اليوم المحتمل للمشكلة
        const daysToDeficit = Math.floor(stats.totalIncome / dailyExpenses);
        const problemDate = new Date(startDate);
        problemDate.setDate(startDate.getDate() + daysToDeficit);
        
        console.log(`\n📅 التاريخ المحتمل لبداية المشكلة: ${problemDate.toISOString().split('T')[0]}`);
        console.log(`   📊 في هذا التاريخ تجاوزت المصاريف الدخل المتاح`);
        console.log(`   💸 المصروف اليومي: ${dailyExpenses.toLocaleString()} ر.ي`);
        console.log(`   💰 الدخل المتبقي كان: ${(stats.totalIncome - (daysToDeficit * dailyExpenses)).toLocaleString()} ر.ي`);
      }
    }
    
    console.log("\n🔧 الحل المطلوب:");
    console.log("=".repeat(80));
    console.log(`💰 إضافة تحويل عهدة بمبلغ: ${Math.ceil(Math.abs(stats.currentBalance) / 1000) * 1000} ر.ي`);
    console.log("📊 أو مراجعة أجور العمال لتقليل التكلفة اليومية");
    console.log(`⚡ التكلفة الحالية مرتفعة جداً: ${dailyExpenses.toLocaleString()} ر.ي يومياً`);
    
  } catch (error) {
    console.error("❌ خطأ في التحليل:", error.message);
  }
}

findSpecificExpense();