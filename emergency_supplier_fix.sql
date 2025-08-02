-- ============================================
-- إصلاح طارئ للأعمدة المفقودة فقط
-- تركيز على المشاكل الأساسية
-- ============================================

-- إضافة العمود المفقود في جدول daily_expense_summaries
ALTER TABLE daily_expense_summaries 
ADD COLUMN IF NOT EXISTS carried_forward_amount DECIMAL(10,2) DEFAULT 0;

-- إضافة الأعمدة المفقودة في جدول material_purchases
ALTER TABLE material_purchases 
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'نقد';

ALTER TABLE material_purchases 
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0;

ALTER TABLE material_purchases 
ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(10,2) DEFAULT 0;

ALTER TABLE material_purchases 
ADD COLUMN IF NOT EXISTS supplier_id VARCHAR;

ALTER TABLE material_purchases 
ADD COLUMN IF NOT EXISTS due_date TEXT;

-- إضافة العمود المفقود في جدول suppliers
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS total_debt DECIMAL(12,2) DEFAULT 0;

-- التحقق من النتائج
SELECT 'تم إصلاح جميع الأعمدة المفقودة!' as result;