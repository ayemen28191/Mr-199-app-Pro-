-- إصلاح طارئ لمشكلة الموردين
-- يجب تنفيذ هذا فوراً في Supabase SQL Editor

-- 1. حذف الجدول الحالي وإعادة إنشاؤه (آمن - لا يحذف البيانات إذا كانت موجودة)
DROP TABLE IF EXISTS suppliers CASCADE;

-- 2. إنشاء جدول suppliers بالهيكل الصحيح
CREATE TABLE suppliers (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    contact_person TEXT,
    phone TEXT,
    address TEXT,
    payment_terms TEXT DEFAULT 'نقد',
    total_debt DECIMAL(12,2) DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 3. إنشاء الفهارس
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_active ON suppliers(is_active);
CREATE INDEX idx_suppliers_total_debt ON suppliers(total_debt);

-- 4. إضافة بيانات تجريبية للاختبار
INSERT INTO suppliers (name, contact_person, phone, address, payment_terms, total_debt, is_active, notes) VALUES
('مورد تجريبي 1', 'أحمد محمد', '777123456', 'صنعاء - شارع الزبيري', 'نقد', 0, true, 'مورد موثوق للحديد والأسمنت'),
('شركة البناء المتطورة', 'علي أحمد', '777987654', 'عدن', '30 يوم', 15000, true, 'مورد مواد البناء الأساسية');

-- 5. التحقق من البيانات
SELECT * FROM suppliers;

-- 6. التحقق من هيكل الجدول
SELECT column_name, data_type, ordinal_position, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'suppliers' 
ORDER BY ordinal_position;