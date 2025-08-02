-- تشخيص مشكلة إضافة المورد
-- تنفذ هذه الاستعلامات في لوحة تحكم Supabase للتحقق من الهيكل

-- 1. فحص هيكل جدول suppliers
SELECT column_name, data_type, ordinal_position, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'suppliers' 
ORDER BY ordinal_position;

-- 2. التحقق من وجود العمود total_debt
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'suppliers' AND column_name = 'total_debt';

-- 3. تجربة إدراج بسيط
INSERT INTO suppliers (name, contact_person, phone, address, payment_terms, total_debt, is_active, notes) 
VALUES ('اختبار', 'شخص تجريبي', '123456789', 'عنوان تجريبي', 'نقد', 0, true, 'ملاحظات تجريبية')
RETURNING *;

-- 4. عرض جميع الموردين الحاليين
SELECT * FROM suppliers LIMIT 5;