// فحص تفصيلي لبيانات مشروع مصنع الحبشي لإيجاد سبب المشكلة
import { Pool } from 'pg';

const connectionString = process.env.SUPABASE_CONNECTION_STRING || "postgresql://postgres.wibtasmyusxfqxxqekks:Ay**--772283228@aws-0-us-east-1.pooler.supabase.com:6543/postgres";
const pool = new Pool({ connectionString });
const projectId = "4dd91471-231d-40da-ac05-7999556c5a72";

console.log("🔍 فحص تفصيلي لبيانات مشروع مصنع الحبشي");
console.log("=".repeat(80));

async function debugProjectData() {
  try {
    console.log("📊 1. فحص أجور العمال (أكبر مصروف):");
    console.log("-".repeat(50));
    
    const workerWages = await pool.query(`
      SELECT 
        wa.date,
        w.name as worker_name,
        w.daily_wage,
        wa.work_days,
        wa.actual_wage,
        wa.created_at
      FROM worker_attendance wa
      JOIN workers w ON wa.worker_id = w.id
      WHERE wa.project_id = $1
      ORDER BY wa.date, wa.created_at
    `, [projectId]);

    let totalWages = 0;
    let suspiciousEntries = [];
    
    workerWages.rows.forEach(row => {
      totalWages += parseFloat(row.actual_wage);
      console.log(`📅 ${row.date} | ${row.worker_name} | أجر: ${row.actual_wage} ر.ي | أيام: ${row.work_days}`);
      
      // فحص القيم المشبوهة
      if (parseFloat(row.actual_wage) > 10000) {
        suspiciousEntries.push({
          date: row.date,
          worker: row.worker_name,
          wage: row.actual_wage,
          reason: 'أجر مرتفع جداً'
        });
      }
      
      if (parseFloat(row.work_days) > 1) {
        suspiciousEntries.push({
          date: row.date,
          worker: row.worker_name,
          days: row.work_days,
          reason: 'أيام عمل أكثر من 1'
        });
      }
    });
    
    console.log(`\n💰 إجمالي أجور العمال: ${totalWages} ر.ي`);
    console.log(`📊 عدد سجلات الحضور: ${workerWages.rows.length}`);
    
    if (suspiciousEntries.length > 0) {
      console.log("\n⚠️  السجلات المشبوهة:");
      suspiciousEntries.forEach(entry => {
        console.log(`   ❌ ${entry.date} - ${entry.worker} - ${entry.reason}`);
        if (entry.wage) console.log(`      الأجر: ${entry.wage} ر.ي`);
        if (entry.days) console.log(`      الأيام: ${entry.days}`);
      });
    }

    console.log("\n" + "=".repeat(80));
    console.log("📊 2. فحص تحويلات العهدة (الدخل):");
    console.log("-".repeat(50));
    
    const fundTransfers = await pool.query(`
      SELECT transfer_date, amount, sender_name, notes, created_at
      FROM fund_transfers
      WHERE project_id = $1
      ORDER BY transfer_date, created_at
    `, [projectId]);

    let totalFundTransfers = 0;
    fundTransfers.rows.forEach(row => {
      totalFundTransfers += parseFloat(row.amount);
      console.log(`📅 ${row.transfer_date} | من: ${row.sender_name} | مبلغ: ${row.amount} ر.ي | ${row.notes || ''}`);
    });
    
    console.log(`\n💰 إجمالي تحويلات العهدة: ${totalFundTransfers} ر.ي`);
    
    console.log("\n" + "=".repeat(80));
    console.log("📊 3. فحص المصاريف الأخرى:");
    console.log("-".repeat(50));

    // النقل
    const transport = await pool.query(`
      SELECT expense_date, amount, description
      FROM transportation_expenses
      WHERE project_id = $1
      ORDER BY expense_date
    `, [projectId]);

    let totalTransport = 0;
    transport.rows.forEach(row => {
      totalTransport += parseFloat(row.amount);
      console.log(`🚚 ${row.expense_date} | نقل: ${row.amount} ر.ي | ${row.description}`);
    });

    // المصاريف المتنوعة
    const misc = await pool.query(`
      SELECT wme.expense_date, wme.amount, wme.description, w.name as worker_name
      FROM worker_misc_expenses wme
      JOIN workers w ON wme.worker_id = w.id
      WHERE wme.project_id = $1
      ORDER BY wme.expense_date
    `, [projectId]);

    let totalMisc = 0;
    misc.rows.forEach(row => {
      totalMisc += parseFloat(row.amount);
      console.log(`📋 ${row.expense_date} | ${row.worker_name} | متنوع: ${row.amount} ر.ي | ${row.description}`);
    });

    // التحويلات الخارجة
    const transfers = await pool.query(`
      SELECT transfer_date, amount, notes
      FROM project_fund_transfers
      WHERE from_project_id = $1
      ORDER BY transfer_date
    `, [projectId]);

    let totalTransfersOut = 0;
    transfers.rows.forEach(row => {
      totalTransfersOut += parseFloat(row.amount);
      console.log(`📤 ${row.transfer_date} | تحويل خارج: ${row.amount} ر.ي | ${row.notes}`);
    });

    console.log(`\n💸 إجمالي النقل: ${totalTransport} ر.ي`);
    console.log(`💸 إجمالي المتنوع: ${totalMisc} ر.ي`);
    console.log(`💸 إجمالي التحويلات الخارجة: ${totalTransfersOut} ر.ي`);

    console.log("\n" + "=".repeat(80));
    console.log("📈 الملخص النهائي:");
    console.log("-".repeat(50));
    console.log(`💰 إجمالي الدخل: ${totalFundTransfers} ر.ي`);
    console.log(`💸 إجمالي أجور العمال: ${totalWages} ر.ي`);
    console.log(`💸 إجمالي النقل: ${totalTransport} ر.ي`);
    console.log(`💸 إجمالي المتنوع: ${totalMisc} ر.ي`);
    console.log(`💸 إجمالي التحويلات الخارجة: ${totalTransfersOut} ر.ي`);
    
    const totalExpenses = totalWages + totalTransport + totalMisc + totalTransfersOut;
    const balance = totalFundTransfers - totalExpenses;
    
    console.log(`💸 إجمالي المصاريف: ${totalExpenses} ر.ي`);
    console.log(`📊 الرصيد النهائي: ${balance} ر.ي`);
    
    if (balance < 0) {
      console.log(`\n🎯 سبب الرصيد السالب:`);
      if (totalWages > totalFundTransfers * 0.8) {
        console.log(`   ❌ أجور العمال مرتفعة جداً: ${((totalWages / totalFundTransfers) * 100).toFixed(1)}% من الدخل`);
      }
      if (suspiciousEntries.length > 0) {
        console.log(`   ❌ يوجد ${suspiciousEntries.length} سجل مشبوه في أجور العمال`);
      }
    }

  } catch (error) {
    console.error("❌ خطأ في الفحص:", error.message);
  } finally {
    await pool.end();
  }
}

debugProjectData();