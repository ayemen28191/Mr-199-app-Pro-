// فحص مشروع الحبشي بالتفصيل
import express from 'express';

const app = express();

// استيراد قاعدة البيانات
const { db } = await import('./server/db.js');

// معرف مشروع الحبشي
const HABASHY_PROJECT_ID = '4dd91471-231d-40da-ac05-7999556c5a72';

console.log('🔍 === تشخيص مشروع الحبشي ===');
console.log('معرف المشروع:', HABASHY_PROJECT_ID);

try {
  // فحص أجور العمال
  console.log('\n👷 === أجور العمال ===');
  const { workerWages } = await import('./shared/schema.js');
  
  const wages = await db.select().from(workerWages)
    .where(eq(workerWages.projectId, HABASHY_PROJECT_ID));
  
  console.log('عدد سجلات الأجور:', wages.length);
  let totalWages = 0;
  let totalPaidWages = 0;
  
  wages.forEach((wage, index) => {
    console.log(`${index + 1}. عامل: ${wage.workerId}, تاريخ: ${wage.date}`);
    console.log(`   الأجر الكامل: ${wage.actualWage}, المدفوع: ${wage.paidAmount || 0}`);
    totalWages += wage.actualWage || 0;
    totalPaidWages += wage.paidAmount || 0;
  });
  
  console.log(`📊 إجمالي الأجور الكاملة: ${totalWages}`);
  console.log(`💰 إجمالي المدفوع فعلياً: ${totalPaidWages}`);
  
  // فحص المصاريف الأخرى
  console.log('\n🧾 === المصاريف الأخرى ===');
  const { dailyExpenses } = await import('./shared/schema.js');
  
  const expenses = await db.select().from(dailyExpenses)
    .where(eq(dailyExpenses.projectId, HABASHY_PROJECT_ID));
  
  console.log('عدد سجلات المصاريف:', expenses.length);
  let totalExpenses = 0;
  
  const expensesByType = {};
  expenses.forEach((exp, index) => {
    console.log(`${index + 1}. نوع: ${exp.expenseType}, المبلغ: ${exp.amount}, تاريخ: ${exp.date}`);
    totalExpenses += exp.amount || 0;
    expensesByType[exp.expenseType] = (expensesByType[exp.expenseType] || 0) + (exp.amount || 0);
  });
  
  console.log(`📊 إجمالي المصاريف الأخرى: ${totalExpenses}`);
  console.log('تفصيل المصاريف:', expensesByType);
  
  // فحص تحويلات العهدة
  console.log('\n💸 === تحويلات العهدة ===');
  const { trustTransfers } = await import('./shared/schema.js');
  
  const transfers = await db.select().from(trustTransfers)
    .where(eq(trustTransfers.projectId, HABASHY_PROJECT_ID));
  
  console.log('عدد التحويلات:', transfers.length);
  let totalIncome = 0;
  let totalOutgoing = 0;
  
  transfers.forEach((transfer, index) => {
    console.log(`${index + 1}. نوع: ${transfer.transferType}, مبلغ: ${transfer.amount}, من: ${transfer.fromName || 'غير محدد'}, إلى: ${transfer.toName || 'غير محدد'}`);
    
    if (transfer.transferType === 'incoming' || transfer.transferType === 'trust') {
      totalIncome += transfer.amount || 0;
    } else if (transfer.transferType === 'outgoing') {
      totalOutgoing += transfer.amount || 0;
    }
  });
  
  console.log(`📈 إجمالي الدخل: ${totalIncome}`);
  console.log(`📉 إجمالي الصادر: ${totalOutgoing}`);
  
  // الحساب النهائي
  console.log('\n🧮 === الحساب النهائي ===');
  const calculatedExpenses = totalPaidWages + totalExpenses;
  const calculatedBalance = totalIncome - calculatedExpenses - totalOutgoing;
  
  console.log(`💰 إجمالي الدخل: ${totalIncome}`);
  console.log(`💸 إجمالي المصاريف المحسوبة: ${calculatedExpenses}`);
  console.log(`   - أجور مدفوعة: ${totalPaidWages}`);
  console.log(`   - مصاريف أخرى: ${totalExpenses}`);
  console.log(`📤 تحويلات صادرة: ${totalOutgoing}`);
  console.log(`🏦 الرصيد النهائي: ${calculatedBalance}`);
  
} catch (error) {
  console.error('❌ خطأ في التشخيص:', error);
}

process.exit(0);