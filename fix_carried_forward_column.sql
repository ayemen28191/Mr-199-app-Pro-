-- إصلاح عمود carried_forward_amount في جدول daily_expense_summaries
-- التحقق من وجود العمود وإضافته إذا لم يكن موجوداً

-- إضافة العمود إذا لم يكن موجوداً
ALTER TABLE daily_expense_summaries 
ADD COLUMN IF NOT EXISTS carried_forward_amount DECIMAL(10,2) DEFAULT 0 NOT NULL;

-- التحقق من هيكل الجدول
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'daily_expense_summaries'
ORDER BY ordinal_position;

-- إذا كان الجدول غير موجود، إنشاؤه بالكامل
CREATE TABLE IF NOT EXISTS daily_expense_summaries (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR NOT NULL REFERENCES projects(id),
    date TEXT NOT NULL,
    carried_forward_amount DECIMAL(10,2) DEFAULT 0 NOT NULL,
    total_fund_transfers DECIMAL(10,2) DEFAULT 0 NOT NULL,
    total_worker_wages DECIMAL(10,2) DEFAULT 0 NOT NULL,
    total_material_costs DECIMAL(10,2) DEFAULT 0 NOT NULL,
    total_transportation_costs DECIMAL(10,2) DEFAULT 0 NOT NULL,
    total_income DECIMAL(10,2) NOT NULL,
    total_expenses DECIMAL(10,2) NOT NULL,
    remaining_balance DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_daily_summaries_project_date 
ON daily_expense_summaries(project_id, date);

-- تحديث القيم الفارغة إذا كانت موجودة
UPDATE daily_expense_summaries 
SET carried_forward_amount = 0 
WHERE carried_forward_amount IS NULL;