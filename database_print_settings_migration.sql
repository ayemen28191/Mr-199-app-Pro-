-- إضافة جدول إعدادات الطباعة إلى قاعدة بيانات Supabase الموجودة
-- يجب تنفيذ هذا الاستعلام في Supabase SQL Editor

-- إنشاء جدول print_settings إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS print_settings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type TEXT NOT NULL DEFAULT 'worker_statement',
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
    table_cell_padding INTEGER NOT NULL DEFAULT 3,
    table_column_widths TEXT NOT NULL DEFAULT '[8,12,10,30,12,15,15,12]',
    
    -- إعدادات العناصر المرئية
    show_header BOOLEAN NOT NULL DEFAULT true,
    show_logo BOOLEAN NOT NULL DEFAULT true,
    show_project_info BOOLEAN NOT NULL DEFAULT true,
    show_worker_info BOOLEAN NOT NULL DEFAULT true,
    show_attendance_table BOOLEAN NOT NULL DEFAULT true,
    show_transfers_table BOOLEAN NOT NULL DEFAULT true,
    show_summary BOOLEAN NOT NULL DEFAULT true,
    show_signatures BOOLEAN NOT NULL DEFAULT true,
    
    -- إعدادات النظام
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    user_id TEXT,
    
    -- طوابع زمنية
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- إدراج إعدادات افتراضية
INSERT INTO print_settings (
    name, report_type, page_size, page_orientation,
    margin_top, margin_bottom, margin_left, margin_right,
    font_family, font_size, header_font_size, table_font_size,
    header_background_color, header_text_color, table_header_color,
    table_row_even_color, table_row_odd_color, table_border_color,
    table_border_width, table_cell_padding, table_column_widths,
    show_header, show_logo, show_project_info, show_worker_info,
    show_attendance_table, show_transfers_table, show_summary, show_signatures,
    is_default, is_active
) VALUES 
(
    'الإعدادات الافتراضية - كشف حساب العامل',
    'worker_statement',
    'A4', 'portrait',
    15.00, 15.00, 15.00, 15.00,
    'Arial', 12, 16, 10,
    '#1e40af', '#ffffff', '#1e40af',
    '#ffffff', '#f9fafb', '#000000',
    1, 3, '[8,12,10,30,12,15,15,12]',
    true, true, true, true,
    true, true, true, true,
    true, true
),
(
    'إعدادات مضغوطة - A4',
    'worker_statement_compact',
    'A4', 'portrait',
    10.00, 10.00, 10.00, 10.00,
    'Arial', 10, 14, 8,
    '#0f172a', '#ffffff', '#0f172a',
    '#ffffff', '#f8fafc', '#000000',
    1, 2, '[6,10,8,32,10,12,12,10]',
    true, false, true, true,
    true, true, true, true,
    false, true
)
ON CONFLICT (id) DO NOTHING;

-- رسالة تأكيد
SELECT 'تم إنشاء جدول print_settings بنجاح مع الإعدادات الافتراضية!' as status;