-- إصلاح عمود carried_forward_amount في جدول daily_expense_summaries
-- تحقق من وجود العمود أولاً
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'daily_expense_summaries' 
  AND column_name = 'carried_forward_amount';

-- إضافة العمود إذا لم يكن موجوداً
ALTER TABLE daily_expense_summaries 
ADD COLUMN IF NOT EXISTS carried_forward_amount DECIMAL(12,2) DEFAULT 0.00;

-- تحديث القيم الافتراضية للسجلات الموجودة
UPDATE daily_expense_summaries 
SET carried_forward_amount = 0.00 
WHERE carried_forward_amount IS NULL;

-- التأكد من وجود العمود بعد الإضافة
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'daily_expense_summaries' 
  AND column_name = 'carried_forward_amount';