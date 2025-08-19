-- إضافة الحقول المفقودة إلى جدول tools
ALTER TABLE tools 
ADD COLUMN IF NOT EXISTS current_value DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS depreciation_rate DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS location_type TEXT,
ADD COLUMN IF NOT EXISTS location_id TEXT;

-- إضافة تعليقات للحقول الجديدة
COMMENT ON COLUMN tools.current_value IS 'القيمة الحالية للأداة';
COMMENT ON COLUMN tools.depreciation_rate IS 'معدل الإهلاك السنوي بالنسبة المئوية';
COMMENT ON COLUMN tools.location_type IS 'نوع الموقع (مخزن، مشروع، فرع، مكتب، ورشة)';
COMMENT ON COLUMN tools.location_id IS 'تحديد الموقع';

-- عرض رسالة النجاح
SELECT 'تم إضافة الحقول المفقودة بنجاح إلى جدول tools' as result;
