-- إضافة فهارس قاعدة البيانات لتحسين أداء نظام الإكمال التلقائي
-- Database indexes for AutoComplete system performance optimization

-- فهرس مركب لتحسين البحث والترتيب حسب الفئة وعدد الاستخدام
-- Compound index for category-based search and usage count ordering
CREATE INDEX IF NOT EXISTS idx_autocomplete_category_usage 
ON autocomplete_data (category, usage_count DESC, last_used DESC);

-- فهرس للبحث النصي في القيم حسب الفئة
-- Index for text search in values by category
CREATE INDEX IF NOT EXISTS idx_autocomplete_value_search 
ON autocomplete_data (category, value);

-- فهرس لتنظيف البيانات القديمة
-- Index for cleanup operations on old data
CREATE INDEX IF NOT EXISTS idx_autocomplete_cleanup 
ON autocomplete_data (last_used, usage_count);

-- فهرس لتحسين عمليات التحديث والحذف
-- Index for optimizing update and delete operations
CREATE INDEX IF NOT EXISTS idx_autocomplete_category_value 
ON autocomplete_data (category, value);

-- فهرس لتحسين إحصائيات النظام
-- Index for system statistics queries
CREATE INDEX IF NOT EXISTS idx_autocomplete_stats 
ON autocomplete_data (created_at, category);

-- إضافة قيود فريدة لمنع التكرار
-- Add unique constraint to prevent duplicates
ALTER TABLE autocomplete_data 
ADD CONSTRAINT uk_autocomplete_category_value 
UNIQUE (category, value);

-- تحسين إعدادات PostgreSQL للبحث النصي العربي
-- Optimize PostgreSQL settings for Arabic text search
-- (يتطلب صلاحيات إدارية - يمكن تشغيلها يدوياً إذا لزم الأمر)

-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_autocomplete_value_trigram 
-- ON autocomplete_data USING gin (value gin_trgm_ops);

-- إضافة تعليقات للجدول والأعمدة
-- Add comments for table and columns documentation
COMMENT ON TABLE autocomplete_data IS 'جدول بيانات الإكمال التلقائي - يحفظ اقتراحات المستخدم لتحسين تجربة الإدخال';
COMMENT ON COLUMN autocomplete_data.category IS 'فئة البيانات مثل أسماء المرسلين، أرقام الهواتف، إلخ';
COMMENT ON COLUMN autocomplete_data.value IS 'القيمة المقترحة للإكمال التلقائي';
COMMENT ON COLUMN autocomplete_data.usage_count IS 'عدد مرات استخدام هذه القيمة - يحدد أولوية الظهور';
COMMENT ON COLUMN autocomplete_data.last_used IS 'تاريخ آخر استخدام لهذه القيمة';
COMMENT ON COLUMN autocomplete_data.created_at IS 'تاريخ إنشاء السجل في النظام';