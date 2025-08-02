-- استعلامات إصلاح قاعدة البيانات - نظام إدارة مشاريع البناء
-- تنفذ هذه الاستعلامات في لوحة تحكم Supabase SQL Editor

-- 1. إضافة العمود المفقود total_debt إلى جدول suppliers
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS total_debt DECIMAL(12,2) DEFAULT 0 NOT NULL;

-- 2. إضافة تعليق على العمود
COMMENT ON COLUMN suppliers.total_debt IS 'إجمالي مديونية المورد بالريال اليمني';

-- 3. التحقق من وجود جميع الأعمدة المطلوبة في جدول suppliers
DO $$
BEGIN
    -- فحص وإضافة العمود contact_person إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'suppliers' AND column_name = 'contact_person') THEN
        ALTER TABLE suppliers ADD COLUMN contact_person TEXT;
        RAISE NOTICE 'تم إضافة العمود contact_person';
    END IF;
    
    -- فحص وإضافة العمود payment_terms إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'suppliers' AND column_name = 'payment_terms') THEN
        ALTER TABLE suppliers ADD COLUMN payment_terms TEXT DEFAULT 'نقد';
        RAISE NOTICE 'تم إضافة العمود payment_terms';
    END IF;
    
    -- فحص وإضافة العمود is_active إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'suppliers' AND column_name = 'is_active') THEN
        ALTER TABLE suppliers ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;
        RAISE NOTICE 'تم إضافة العمود is_active';
    END IF;
    
    -- فحص وإضافة العمود notes إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'suppliers' AND column_name = 'notes') THEN
        ALTER TABLE suppliers ADD COLUMN notes TEXT;
        RAISE NOTICE 'تم إضافة العمود notes';
    END IF;
    
    -- فحص وإضافة العمود created_at إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'suppliers' AND column_name = 'created_at') THEN
        ALTER TABLE suppliers ADD COLUMN created_at TIMESTAMP DEFAULT NOW() NOT NULL;
        RAISE NOTICE 'تم إضافة العمود created_at';
    END IF;
END $$;

-- 4. إنشاء فهرس على اسم المورد لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_total_debt ON suppliers(total_debt);

-- 5. إنشاء قيد فريد على اسم المورد إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'suppliers' AND constraint_name = 'suppliers_name_unique') THEN
        ALTER TABLE suppliers ADD CONSTRAINT suppliers_name_unique UNIQUE (name);
        RAISE NOTICE 'تم إضافة القيد الفريد على اسم المورد';
    END IF;
EXCEPTION
    WHEN duplicate_key THEN
        RAISE NOTICE 'القيد الفريد موجود مسبقاً أو هناك أسماء مكررة';
END $$;

-- 6. التحقق من وجود جدول autocomplete_data وإنشاؤه إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS autocomplete_data (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR NOT NULL,
    value TEXT NOT NULL,
    usage_count INTEGER DEFAULT 1 NOT NULL,
    last_used TIMESTAMP DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(category, value)
);

-- 7. إنشاء فهارس لجدول autocomplete_data لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_autocomplete_category ON autocomplete_data(category);
CREATE INDEX IF NOT EXISTS idx_autocomplete_usage ON autocomplete_data(category, usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_autocomplete_last_used ON autocomplete_data(last_used);

-- 8. تحديث قيم total_debt للموردين الموجودين (إذا كانت NULL)
UPDATE suppliers 
SET total_debt = 0 
WHERE total_debt IS NULL;

-- 9. إضافة بيانات افتراضية لجدول autocomplete_data للموردين
INSERT INTO autocomplete_data (category, value, usage_count) VALUES
('supplier_payment_terms', 'نقد', 10),
('supplier_payment_terms', '30 يوم', 8),
('supplier_payment_terms', '60 يوم', 5),
('supplier_payment_terms', '15 يوم', 3)
ON CONFLICT (category, value) DO UPDATE SET usage_count = autocomplete_data.usage_count + 1;

-- 10. التحقق من هيكل الجدول النهائي
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'suppliers' 
ORDER BY ordinal_position;

-- 11. عرض إحصائيات الجدول
SELECT 
    COUNT(*) as total_suppliers,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_suppliers,
    COUNT(CASE WHEN total_debt > 0 THEN 1 END) as suppliers_with_debt,
    COALESCE(SUM(total_debt), 0) as total_debt_amount
FROM suppliers;

-- تم الانتهاء من جميع الاستعلامات
SELECT 'تم إكمال جميع إصلاحات قاعدة البيانات بنجاح' as status;