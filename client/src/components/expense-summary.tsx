/**
 * الوصف: مكون ملخص المصاريف اليومية
 * المدخلات: الدخل والمنصرفات والرصيد
 * المخرجات: عرض ملخص مالي مصمم
 * المالك: عمار
 * آخر تعديل: 2025-08-20
 * الحالة: نشط - مكون أساسي للتقارير المالية
 */

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface ExpenseSummaryProps {
  totalIncome: number;
  totalExpenses: number;
  remainingBalance: number;
}

export default function ExpenseSummary({ totalIncome, totalExpenses, remainingBalance }: ExpenseSummaryProps) {
  return (
    <div className="mt-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl p-4">
      <h4 className="font-bold text-lg mb-3">ملخص اليوم</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="opacity-90">إجمالي الدخل:</div>
          <div className="text-lg font-bold arabic-numbers">{formatCurrency(totalIncome)}</div>
        </div>
        <div>
          <div className="opacity-90">إجمالي المنصرف:</div>
          <div className="text-lg font-bold arabic-numbers">{formatCurrency(totalExpenses)}</div>
        </div>
      </div>
      <div className="text-center mt-3 pt-3 border-t border-primary-foreground/20">
        <div className="text-sm opacity-90">المبلغ المتبقي</div>
        <div className="text-2xl font-bold arabic-numbers">{formatCurrency(remainingBalance)}</div>
      </div>
    </div>
  );
}
