-- إنشاء جدول إعدادات الطباعة للكشوف
-- Print Settings Migration SQL

-- إنشاء الجدول الجديد
CREATE TABLE IF NOT EXISTS print_settings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type TEXT NOT NULL,
    name TEXT NOT NULL,
    
    -- إعدادات الصفحة
    page_size TEXT NOT NULL DEFAULT 'A4',
    page_orientation TEXT NOT NULL DEFAULT 'portrait',
    margin_top DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    margin_bottom DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    margin_left DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    margin_right DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    
    -- إعدادات الخطوط
    font_family TEXT NOT NULL DEFAULT 'Arial',
    font_size INTEGER NOT NULL DEFAULT 12,
    header_font_size INTEGER NOT NULL DEFAULT 16,
    table_font_size INTEGER NOT NULL DEFAULT 10,
    
    -- إعدادات الألوان
    header_background_color TEXT NOT NULL DEFAULT '#1e40af',
    header_text_color TEXT NOT NULL DEFAULT '#ffffff',
    table_header_color TEXT NOT NULL DEFAULT '#1e40af',
    table_row_even_color TEXT NOT NULL DEFAULT '#ffffff',
    table_row_odd_color TEXT NOT NULL DEFAULT '#f9fafb',
    table_border_color TEXT NOT NULL DEFAULT '#000000',
    
    -- إعدادات الجدول
    table_border_width INTEGER NOT NULL DEFAULT 1,
    table_cell_padding DECIMAL(5,2) NOT NULL DEFAULT 3.00,
    table_column_widths JSONB,
    
    -- إعدادات العناصر المرئية
    show_header BOOLEAN NOT NULL DEFAULT true,
    show_logo BOOLEAN NOT NULL DEFAULT true,
    show_project_info BOOLEAN NOT NULL DEFAULT true,
    show_worker_info BOOLEAN NOT NULL DEFAULT true,
    show_attendance_table BOOLEAN NOT NULL DEFAULT true,
    show_transfers_table BOOLEAN NOT NULL DEFAULT true,
    show_summary BOOLEAN NOT NULL DEFAULT true,
    show_signatures BOOLEAN NOT NULL DEFAULT true,
    
    -- معرف المستخدم والحالة
    user_id VARCHAR REFERENCES users(id),
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- إدراج إعدادات افتراضية لكشف حساب العامل
INSERT INTO print_settings (
    report_type, name, page_size, page_orientation, 
    margin_top, margin_bottom, margin_left, margin_right,
    font_family, font_size, header_font_size, table_font_size,
    is_default, is_active
) VALUES 
(
    'worker_statement', 'الإعداد الافتراضي لكشف العمال', 'A4', 'portrait',
    15.00, 15.00, 15.00, 15.00,
    'Arial', 12, 16, 10,
    true, true
),
(
    'worker_statement', 'إعداد مضغوط', 'A4', 'portrait',
    10.00, 10.00, 10.00, 10.00,
    'Arial', 10, 14, 8,
    false, true
),
(
    'worker_statement', 'إعداد كبير', 'A3', 'portrait',
    20.00, 20.00, 20.00, 20.00,
    'Arial', 14, 18, 12,
    false, true
);

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_print_settings_report_type ON print_settings(report_type);
CREATE INDEX IF NOT EXISTS idx_print_settings_user_id ON print_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_print_settings_default ON print_settings(is_default, is_active);

-- إضافة تعليق على الجدول
COMMENT ON TABLE print_settings IS 'جدول إعدادات الطباعة للكشوف المختلفة مع إمكانية التحكم الكامل في التنسيق';