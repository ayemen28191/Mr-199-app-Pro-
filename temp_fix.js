// إصلاح مؤقت لمشكلة الرصيد المرحل في مشروع الحبشي
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function fixHabashiProject() {
  try {
    console.log('🔧 بدء إصلاح مشروع الحبشي...');
    
    const projectId = '4dd91471-231d-40da-ac05-7999556c5a72';
    
    // حذف الملخصات الخاطئة
    console.log('حذف الملخصات الخاطئة...');
    await sql`DELETE FROM daily_expense_summaries 
              WHERE project_id = ${projectId} 
              AND date IN ('2025-08-07', '2025-08-08')`;
    
    // التحقق من يوم 6/8
    const day6 = await sql`SELECT * FROM daily_expense_summaries 
                           WHERE project_id = ${projectId} 
                           AND date = '2025-08-06'`;
    
    console.log('✅ ملخص يوم 6/8:', day6[0]);
    
    // فحص العمليات في يوم 7/8
    const fundTransfers7 = await sql`SELECT * FROM fund_transfers 
                                     WHERE project_id = ${projectId} 
                                     AND transfer_date = '2025-08-07'`;
    
    const workerTransfers7 = await sql`SELECT * FROM worker_transfers 
                                       WHERE project_id = ${projectId} 
                                       AND transfer_date = '2025-08-07'`;
    
    const projectTransfers7 = await sql`SELECT * FROM project_fund_transfers 
                                         WHERE (from_project_id = ${projectId} OR to_project_id = ${projectId})
                                         AND transfer_date = '2025-08-07'`;
    
    console.log('📊 عمليات يوم 7/8:');
    console.log('  - تحويلات عهدة:', fundTransfers7.length);
    console.log('  - حوالات عمال:', workerTransfers7.length);
    console.log('  - تحويلات مشاريع:', projectTransfers7.length);
    
    // إنشاء ملخص صحيح ليوم 7/8
    if (fundTransfers7.length === 0 && workerTransfers7.length === 0 && projectTransfers7.length === 0) {
      console.log('إنشاء ملخص ليوم 7/8 (لا توجد عمليات)...');
      await sql`INSERT INTO daily_expense_summaries 
                (project_id, date, carried_forward_amount, total_income, total_expenses, remaining_balance)
                VALUES (${projectId}, '2025-08-07', '0.00', '0.00', '0.00', '0.00')`;
    }
    
    console.log('✅ تم إصلاح مشروع الحبشي بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في الإصلاح:', error);
  }
}

fixHabashiProject();