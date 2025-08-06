// تحليل مباشر لإيجاد المصروف المحدد الذي تسبب في الرصيد السالب
import { Pool } from '@neondatabase/serverless';

const connectionString = "postgresql://postgres.wibtasmyusxfqxxqekks:Ay**--772283228@aws-0-us-east-1.pooler.supabase.com:6543/postgres";
const pool = new Pool({ connectionString });
const projectId = "4dd91471-231d-40da-ac05-7999556c5a72";

console.log("🔍 البحث عن المصروف المحدد الذي تسبب في الرصيد السالب");
console.log("=".repeat(80));

async function findSpecificExpense() {
  try {
    // جلب جميع العمليات المالية للمشروع مرتبة حسب التاريخ
    console.log("📊 جاري تحليل جميع العمليات المالية...");
    
    // 1. تحويلات العهدة (الدخل)
    const fundTransfers = await pool.query(`
      SELECT transfer_date as date, amount, sender_name, notes, 'fund_transfer' as type, 'income' as category, created_at
      FROM fund_transfers 
      WHERE project_id = $1
      ORDER BY transfer_date ASC, created_at ASC
    `, [projectId]);

    // 2. أجور العمال (مصروف)
    const workerWages = await pool.query(`
      SELECT wa.date, wa.actual_wage as amount, w.name as worker_name, 'worker_wage' as type, 'expense' as category, wa.created_at
      FROM worker_attendance wa
      JOIN workers w ON wa.worker_id = w.id
      WHERE wa.project_id = $1
      ORDER BY wa.date ASC, wa.created_at ASC
    `, [projectId]);

    // 3. مشتريات المواد (مصروف)
    const materialPurchases = await pool.query(`
      SELECT mp.purchase_date as date, mp.total_amount as amount, m.name as material_name, 'material_purchase' as type, 'expense' as category, mp.created_at
      FROM material_purchases mp
      JOIN materials m ON mp.material_id = m.id
      WHERE mp.project_id = $1
      ORDER BY mp.purchase_date ASC, mp.created_at ASC
    `, [projectId]);

    // 4. مصاريف النقل (مصروف)
    const transportExpenses = await pool.query(`
      SELECT expense_date as date, amount, description, 'transport' as type, 'expense' as category, created_at
      FROM transportation_expenses
      WHERE project_id = $1
      ORDER BY expense_date ASC, created_at ASC
    `, [projectId]);

    // 5. المصاريف المتنوعة (مصروف)
    const miscExpenses = await pool.query(`
      SELECT wme.expense_date as date, wme.amount, wme.description, w.name as worker_name, 'misc_expense' as type, 'expense' as category, wme.created_at
      FROM worker_misc_expenses wme
      JOIN workers w ON wme.worker_id = w.id
      WHERE wme.project_id = $1
      ORDER BY wme.expense_date ASC, wme.created_at ASC
    `, [projectId]);

    // 6. التحويلات بين المشاريع (داخل وخارج)
    const projectTransfers = await pool.query(`
      SELECT 
        transfer_date as date, 
        amount, 
        notes,
        CASE 
          WHEN to_project_id = $1 THEN 'project_transfer_in'
          WHEN from_project_id = $1 THEN 'project_transfer_out'
        END as type,
        CASE 
          WHEN to_project_id = $1 THEN 'income'
          WHEN from_project_id = $1 THEN 'expense'
        END as category,
        created_at
      FROM project_fund_transfers
      WHERE to_project_id = $1 OR from_project_id = $1
      ORDER BY transfer_date ASC, created_at ASC
    `, [projectId]);

    // تجميع جميع العمليات
    let allTransactions = [];

    // إضافة تحويلات العهدة
    fundTransfers.rows.forEach(row => {
      allTransactions.push({
        date: row.date,
        amount: parseFloat(row.amount),
        type: 'دخل - تحويل عهدة',
        description: `من: ${row.sender_name} - ${row.notes || 'بدون ملاحظات'}`,
        isIncome: true,
        createdAt: row.created_at
      });
    });

    // إضافة أجور العمال
    workerWages.rows.forEach(row => {
      allTransactions.push({
        date: row.date,
        amount: parseFloat(row.amount),
        type: 'مصروف - أجور عمال',
        description: `عامل: ${row.worker_name}`,
        isIncome: false,
        createdAt: row.created_at
      });
    });

    // إضافة مشتريات المواد
    materialPurchases.rows.forEach(row => {
      allTransactions.push({
        date: row.date,
        amount: parseFloat(row.amount),
        type: 'مصروف - مشتريات مواد',
        description: `مادة: ${row.material_name}`,
        isIncome: false,
        createdAt: row.created_at
      });
    });

    // إضافة مصاريف النقل
    transportExpenses.rows.forEach(row => {
      allTransactions.push({
        date: row.date,
        amount: parseFloat(row.amount),
        type: 'مصروف - نقل ومواصلات',
        description: row.description || 'مصروف نقل',
        isIncome: false,
        createdAt: row.created_at
      });
    });

    // إضافة المصاريف المتنوعة
    miscExpenses.rows.forEach(row => {
      allTransactions.push({
        date: row.date,
        amount: parseFloat(row.amount),
        type: 'مصروف - متنوع',
        description: `عامل: ${row.worker_name} - ${row.description}`,
        isIncome: false,
        createdAt: row.created_at
      });
    });

    // إضافة تحويلات المشاريع
    projectTransfers.rows.forEach(row => {
      allTransactions.push({
        date: row.date,
        amount: parseFloat(row.amount),
        type: row.category === 'income' ? 'دخل - تحويل من مشروع' : 'مصروف - تحويل لمشروع',
        description: row.notes || 'تحويل بين المشاريع',
        isIncome: row.category === 'income',
        createdAt: row.created_at
      });
    });

    // ترتيب العمليات حسب التاريخ ثم وقت الإنشاء
    allTransactions.sort((a, b) => {
      const dateCompare = new Date(a.date) - new Date(b.date);
      if (dateCompare !== 0) return dateCompare;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    console.log(`📊 تم العثور على ${allTransactions.length} عملية مالية`);
    console.log("=".repeat(80));

    // حساب الرصيد التراكمي يوماً بيوم
    let runningBalance = 0;
    let firstNegativeFound = false;

    console.log("📅 تحليل العمليات حسب التاريخ:");
    console.log("=".repeat(80));

    for (let i = 0; i < allTransactions.length; i++) {
      const transaction = allTransactions[i];
      const previousBalance = runningBalance;
      
      if (transaction.isIncome) {
        runningBalance += transaction.amount;
      } else {
        runningBalance -= transaction.amount;
      }

      const balanceIcon = runningBalance >= 0 ? "✅" : "❌";
      const amountPrefix = transaction.isIncome ? "+" : "-";
      
      console.log(`\n📅 ${transaction.date} | ${balanceIcon} رصيد: ${runningBalance.toFixed(2)} ر.ي`);
      console.log(`   نوع العملية: ${transaction.type}`);
      console.log(`   المبلغ: ${amountPrefix}${transaction.amount.toFixed(2)} ر.ي`);
      console.log(`   التفاصيل: ${transaction.description}`);
      console.log(`   الرصيد قبل العملية: ${previousBalance.toFixed(2)} ر.ي`);
      console.log(`   الرصيد بعد العملية: ${runningBalance.toFixed(2)} ر.ي`);
      
      // إذا أصبح الرصيد سالباً لأول مرة
      if (!firstNegativeFound && runningBalance < 0 && previousBalance >= 0) {
        firstNegativeFound = true;
        console.log("\n" + "*".repeat(80));
        console.log("🎯 *** هذا هو المصروف الذي تسبب في الرصيد السالب ***");
        console.log("*".repeat(80));
        console.log(`📅 التاريخ المحدد: ${transaction.date}`);
        console.log(`💸 نوع المصروف: ${transaction.type}`);
        console.log(`💰 مبلغ المصروف: ${transaction.amount.toFixed(2)} ر.ي`);
        console.log(`📝 تفاصيل المصروف: ${transaction.description}`);
        console.log(`📊 الرصيد قبل هذا المصروف: ${previousBalance.toFixed(2)} ر.ي`);
        console.log(`📊 الرصيد بعد هذا المصروف: ${runningBalance.toFixed(2)} ر.ي`);
        console.log(`⚠️  مقدار العجز الذي سببه: ${Math.abs(runningBalance).toFixed(2)} ر.ي`);
        console.log("*".repeat(80));
      }
    }

    // ملخص نهائي
    console.log("\n" + "=".repeat(80));
    console.log("📈 الملخص النهائي:");
    console.log("=".repeat(80));
    
    const totalIncome = allTransactions.filter(t => t.isIncome).reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = allTransactions.filter(t => !t.isIncome).reduce((sum, t) => sum + t.amount, 0);
    
    console.log(`💰 إجمالي الدخل: ${totalIncome.toFixed(2)} ر.ي`);
    console.log(`💸 إجمالي المصاريف: ${totalExpenses.toFixed(2)} ر.ي`);
    console.log(`📊 الرصيد النهائي: ${runningBalance.toFixed(2)} ر.ي`);
    console.log(`📅 فترة التحليل: ${allTransactions.length} عملية مالية`);
    
    if (!firstNegativeFound && runningBalance < 0) {
      console.log("\n⚠️  ملاحظة: الرصيد سالب لكن لا يمكن تحديد العملية المحددة التي تسببت في ذلك");
    }

  } catch (error) {
    console.error("❌ خطأ في التحليل:", error.message);
    console.error("تفاصيل الخطأ:", error);
  } finally {
    await pool.end();
  }
}

findSpecificExpense();