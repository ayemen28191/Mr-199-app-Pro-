// تحليل مفصل للمصروف المحدد الذي تسبب في الرصيد السالب
const projectId = "4dd91471-231d-40da-ac05-7999556c5a72";
const projectName = "مشروع مصنع الحبشي";

console.log(`🔍 تحليل المصروف المحدد الذي تسبب في الرصيد السالب`);
console.log(`📂 المشروع: ${projectName}`);
console.log("=".repeat(80));

async function findSpecificExpense() {
  try {
    // جلب جميع العمليات المالية مع التواريخ
    const [
      // تحويلات العهدة (الدخل)
      fundTransfersResponse,
      // أجور العمال
      workerWagesResponse,
      // مشتريات المواد  
      materialPurchasesResponse,
      // مصاريف النقل
      transportResponse,
      // مصاريف متنوعة
      miscExpensesResponse
    ] = await Promise.all([
      fetch(`http://localhost:5000/api/fund-transfers`),
      fetch(`http://localhost:5000/api/worker-attendance`),
      fetch(`http://localhost:5000/api/material-purchases`),
      fetch(`http://localhost:5000/api/transportation-expenses`),
      fetch(`http://localhost:5000/api/worker-misc-expenses`)
    ]);

    const fundTransfers = await fundTransfersResponse.json();
    const workerWages = await workerWagesResponse.json();
    const materialPurchases = await materialPurchasesResponse.json();
    const transport = await transportResponse.json();
    const miscExpenses = await miscExpensesResponse.json();

    // تجميع جميع العمليات المالية مع التواريخ
    let allTransactions = [];

    // إضافة تحويلات العهدة (الدخل)
    if (Array.isArray(fundTransfers)) {
      fundTransfers.filter(ft => ft.projectId === projectId).forEach(ft => {
        allTransactions.push({
          date: ft.transferDate,
          type: 'دخل - تحويل عهدة',
          amount: parseFloat(ft.amount),
          description: `من: ${ft.senderName} - ${ft.notes || 'بدون ملاحظات'}`,
          isIncome: true
        });
      });
    }

    // إضافة أجور العمال (مصروف)
    if (Array.isArray(workerWages)) {
      workerWages.filter(wa => wa.projectId === projectId).forEach(wa => {
        allTransactions.push({
          date: wa.date,
          type: 'مصروف - أجور عمال',
          amount: parseFloat(wa.actualWage || wa.dailyWage),
          description: `عامل: ${wa.workerId} - ${wa.workDays} يوم عمل`,
          isIncome: false
        });
      });
    }

    // إضافة مشتريات المواد (مصروف)
    if (Array.isArray(materialPurchases)) {
      materialPurchases.filter(mp => mp.projectId === projectId).forEach(mp => {
        allTransactions.push({
          date: mp.purchaseDate,
          type: 'مصروف - مشتريات مواد',
          amount: parseFloat(mp.totalAmount),
          description: `مادة: ${mp.materialId} - كمية: ${mp.quantity}`,
          isIncome: false
        });
      });
    }

    // إضافة مصاريف النقل (مصروف)
    if (Array.isArray(transport)) {
      transport.filter(te => te.projectId === projectId).forEach(te => {
        allTransactions.push({
          date: te.expenseDate,
          type: 'مصروف - نقل ومواصلات',
          amount: parseFloat(te.amount),
          description: `${te.description || 'مصروف نقل'}`,
          isIncome: false
        });
      });
    }

    // إضافة المصاريف المتنوعة (مصروف)
    if (Array.isArray(miscExpenses)) {
      miscExpenses.filter(me => me.projectId === projectId).forEach(me => {
        allTransactions.push({
          date: me.expenseDate,
          type: 'مصروف - متنوع',
          amount: parseFloat(me.amount),
          description: `عامل: ${me.workerId} - ${me.description || 'مصروف متنوع'}`,
          isIncome: false
        });
      });
    }

    // ترتيب العمليات حسب التاريخ
    allTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    // حساب الرصيد التراكمي يوماً بيوم
    let runningBalance = 0;
    let balanceHistory = [];

    console.log(`📊 تحليل العمليات المالية يوماً بيوم:`);
    console.log("=".repeat(80));

    allTransactions.forEach((transaction, index) => {
      if (transaction.isIncome) {
        runningBalance += transaction.amount;
      } else {
        runningBalance -= transaction.amount;
      }

      balanceHistory.push({
        ...transaction,
        runningBalance: runningBalance,
        transactionNumber: index + 1
      });

      const balanceColor = runningBalance >= 0 ? "✅" : "❌";
      const amountPrefix = transaction.isIncome ? "+" : "-";
      
      console.log(`📅 ${transaction.date} | ${balanceColor} رصيد: ${runningBalance.toLocaleString()} ر.ي`);
      console.log(`   ${transaction.type}: ${amountPrefix}${transaction.amount.toLocaleString()} ر.ي`);
      console.log(`   التفاصيل: ${transaction.description}`);
      
      // إذا أصبح الرصيد سالباً لأول مرة
      if (runningBalance < 0 && (index === 0 || balanceHistory[index-1].runningBalance >= 0)) {
        console.log(`\n🎯 *** هذا هو المصروف الذي تسبب في الرصيد السالب ***`);
        console.log(`📅 التاريخ: ${transaction.date}`);
        console.log(`💸 نوع المصروف: ${transaction.type}`);
        console.log(`💰 المبلغ: ${transaction.amount.toLocaleString()} ر.ي`);
        console.log(`📝 التفاصيل: ${transaction.description}`);
        console.log(`📊 الرصيد بعد هذا المصروف: ${runningBalance.toLocaleString()} ر.ي`);
        console.log("*".repeat(80));
      }
      
      console.log("");
    });

    // ملخص النتائج النهائية
    console.log("\n" + "=".repeat(80));
    console.log(`📈 الملخص النهائي:`);
    console.log(`   💰 إجمالي الدخل: ${allTransactions.filter(t => t.isIncome).reduce((sum, t) => sum + t.amount, 0).toLocaleString()} ر.ي`);
    console.log(`   💸 إجمالي المصاريف: ${allTransactions.filter(t => !t.isIncome).reduce((sum, t) => sum + t.amount, 0).toLocaleString()} ر.ي`);
    console.log(`   📊 الرصيد النهائي: ${runningBalance.toLocaleString()} ر.ي`);
    console.log(`   📅 إجمالي العمليات: ${allTransactions.length} عملية`);

  } catch (error) {
    console.error("❌ خطأ في تحليل المصاريف:", error.message);
  }
}

findSpecificExpense();