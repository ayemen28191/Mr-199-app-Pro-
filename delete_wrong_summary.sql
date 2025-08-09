-- حذف الملخص الخاطئ ليوم 7/8 لمشروع الحبشي
DELETE FROM daily_expense_summaries 
WHERE id = '3b05d77e-8d70-498f-bc39-7b5fce7e3633';

-- أو حذف بالمشروع والتاريخ
DELETE FROM daily_expense_summaries 
WHERE project_id = '4dd91471-231d-40da-ac05-7999556c5a72' 
  AND date = '2025-08-07';

-- حذف أي ملخصات خاطئة لأيام 7/8 و 8/8
DELETE FROM daily_expense_summaries 
WHERE project_id = '4dd91471-231d-40da-ac05-7999556c5a72' 
  AND date IN ('2025-08-07', '2025-08-08');

-- إنشاء ملخص صحيح ليوم 7/8 (بدون عمليات)
INSERT INTO daily_expense_summaries (
  project_id, 
  date, 
  carried_forward_amount, 
  total_fund_transfers,
  total_worker_wages,
  total_material_costs,
  total_transportation_costs,
  total_income, 
  total_expenses, 
  remaining_balance
) VALUES (
  '4dd91471-231d-40da-ac05-7999556c5a72',
  '2025-08-07',
  '0.00',  -- الرصيد المرحل الصحيح من يوم 6/8
  '0.00',  -- لا توجد تحويلات عهدة
  '0.00',  -- لا توجد أجور
  '0.00',  -- لا توجد مواد
  '0.00',  -- لا توجد نقل
  '0.00',  -- إجمالي الدخل
  '0.00',  -- إجمالي المصاريف
  '0.00'   -- الرصيد النهائي
);