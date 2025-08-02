-- استعلامات إصلاح قاعدة البيانات - نسخة مبسطة وآمنة
-- تنفذ هذه الاستعلامات في لوحة تحكم Supabase SQL Editor

-- 1. إضافة العمود المفقود total_debt إلى جدول suppliers
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS total_debt DECIMAL(12,2) DEFAULT 0 NOT NULL;

-- 2. إضافة الأعمدة الأخرى إذا كانت مفقودة
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS contact_person TEXT;

ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'نقد';

ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW() NOT NULL;

-- 3. إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_total_debt ON suppliers(total_debt);

-- 4. تحديث قيم total_debt للموردين الموجودين (إذا كانت NULL)
UPDATE suppliers 
SET total_debt = 0 
WHERE total_debt IS NULL;

-- 5. إنشاء جدول autocomplete_data إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS autocomplete_data (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR NOT NULL,
    value TEXT NOT NULL,
    usage_count INTEGER DEFAULT 1 NOT NULL,
    last_used TIMESTAMP DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(category, value)
);

-- 6. إنشاء فهارس لجدول autocomplete_data
CREATE INDEX IF NOT EXISTS idx_autocomplete_category ON autocomplete_data(category);
CREATE INDEX IF NOT EXISTS idx_autocomplete_usage ON autocomplete_data(category, usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_autocomplete_last_used ON autocomplete_data(last_used);

-- 7. إضافة بيانات افتراضية لشروط الدفع
INSERT INTO autocomplete_data (category, value, usage_count) VALUES
('supplier_payment_terms', 'نقد', 10),
('supplier_payment_terms', '30 يوم', 8),
('supplier_payment_terms', '60 يوم', 5),
('supplier_payment_terms', '15 يوم', 3)
ON CONFLICT (category, value) DO UPDATE SET usage_count = autocomplete_data.usage_count + 1;

-- 8. التحقق من هيكل الجدول النهائي
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'suppliers' 
ORDER BY ordinal_position;

-- 9. عرض إحصائيات الجدول
SELECT 
    COUNT(*) as total_suppliers,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_suppliers,
    COUNT(CASE WHEN total_debt > 0 THEN 1 END) as suppliers_with_debt,
    COALESCE(SUM(total_debt), 0) as total_debt_amount
FROM suppliers;

-- تم الانتهاء من جميع الاستعلامات
SELECT 'تم إكمال جميع إصلاحات قاعدة البيانات بنجاح' as status;