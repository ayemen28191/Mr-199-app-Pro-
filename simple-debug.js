// فحص بسيط من خلال API
const projectId = "4dd91471-231d-40da-ac05-7999556c5a72";

console.log("🔍 فحص مشروع مصنع الحبشي عبر API");
console.log("=".repeat(60));

// استخدام curl للحصول على البيانات
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function debugProject() {
  try {
    // الحصول على إحصائيات المشروع
    console.log("📊 جلب إحصائيات المشروع...");
    const { stdout: stats } = await execAsync(`curl -s "http://localhost:5000/api/projects/${projectId}/stats"`);
    const projectStats = JSON.parse(stats);
    
    console.log("📈 الإحصائيات الحالية:");
    console.log(`   💰 الدخل: ${projectStats.totalIncome} ر.ي`);
    console.log(`   💸 المصاريف: ${projectStats.totalExpenses} ر.ي`);
    console.log(`   📊 الرصيد: ${projectStats.currentBalance} ر.ي`);
    console.log(`   👷 العمال: ${projectStats.totalWorkers}`);
    console.log(`   📅 أيام العمل: ${projectStats.completedDays}`);

    if (projectStats.currentBalance >= 0) {
      console.log("✅ لا توجد مشكلة - الرصيد موجب!");
      return;
    }

    // فحص مكونات المصاريف من خلال التحليل المالي
    console.log("\n🔍 تحليل مفصل للمصاريف...");
    const { stdout: analysis } = await execAsync(`curl -s "http://localhost:5000/api/projects/${projectId}/financial-analysis"`);
    const financialAnalysis = JSON.parse(analysis);
    
    console.log("💸 تفصيل المصاريف:");
    
    // أجور العمال
    const workerWages = financialAnalysis.expenses.workerWages;
    let totalWages = workerWages.reduce((sum, wage) => sum + wage.amount, 0);
    console.log(`   👷 أجور العمال: ${totalWages.toFixed(2)} ر.ي (${workerWages.length} سجل)`);
    
    // البحث عن أعلى الأجور
    const highWages = workerWages.filter(w => w.amount > 5000).sort((a, b) => b.amount - a.amount);
    if (highWages.length > 0) {
      console.log("   ⚠️  الأجور المرتفعة:");
      highWages.slice(0, 5).forEach(wage => {
        console.log(`      - ${wage.date}: ${wage.amount.toFixed(2)} ر.ي`);
      });
    }

    // مشتريات المواد
    const materials = financialAnalysis.expenses.materialPurchases;
    let totalMaterials = materials.reduce((sum, material) => sum + material.amount, 0);
    console.log(`   🏗️  مشتريات المواد: ${totalMaterials.toFixed(2)} ر.ي (${materials.length} عملية)`);

    // النقل
    const transport = financialAnalysis.expenses.transportExpenses;
    let totalTransport = transport.reduce((sum, t) => sum + t.amount, 0);
    console.log(`   🚚 النقل: ${totalTransport.toFixed(2)} ر.ي (${transport.length} عملية)`);

    // المتنوعة
    const misc = financialAnalysis.expenses.miscExpenses;
    let totalMisc = misc.reduce((sum, m) => sum + m.amount, 0);
    console.log(`   📋 متنوعة: ${totalMisc.toFixed(2)} ر.ي (${misc.length} عملية)`);

    // التحويلات الخارجة
    const transfersOut = financialAnalysis.expenses.projectTransfersOut;
    let totalTransfersOut = transfersOut.reduce((sum, t) => sum + t.amount, 0);
    console.log(`   📤 تحويلات خارجة: ${totalTransfersOut.toFixed(2)} ر.ي (${transfersOut.length} عملية)`);

    const calculatedTotal = totalWages + totalMaterials + totalTransport + totalMisc + totalTransfersOut;
    
    console.log(`\n📊 المجموع المحسوب: ${calculatedTotal.toFixed(2)} ر.ي`);
    console.log(`📊 المجموع من API: ${projectStats.totalExpenses} ر.ي`);
    console.log(`📊 الفرق: ${Math.abs(calculatedTotal - projectStats.totalExpenses).toFixed(2)} ر.ي`);

    // تحديد السبب الرئيسي
    console.log("\n🎯 تحليل السبب:");
    if (totalWages > projectStats.totalIncome * 0.8) {
      console.log(`❌ أجور العمال مرتفعة جداً: ${((totalWages / projectStats.totalIncome) * 100).toFixed(1)}% من الدخل`);
      
      // البحث عن أكبر يوم مصروف
      const maxWage = Math.max(...workerWages.map(w => w.amount));
      const maxWageRecord = workerWages.find(w => w.amount === maxWage);
      if (maxWageRecord) {
        console.log(`🎯 أكبر مصروف يومي: ${maxWage.toFixed(2)} ر.ي في تاريخ ${maxWageRecord.date}`);
      }
    }

    console.log("\n💡 الحل المطلوب:");
    const deficit = Math.abs(projectStats.currentBalance);
    console.log(`💰 إضافة تحويل عهدة بمبلغ: ${Math.ceil(deficit / 1000) * 1000} ر.ي`);

  } catch (error) {
    console.error("❌ خطأ:", error.message);
  }
}

debugProject();