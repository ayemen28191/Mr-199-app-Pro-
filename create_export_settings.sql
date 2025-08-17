-- إنشاء جدول إعدادات التصدير
CREATE TABLE IF NOT EXISTS export_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'إعدادات افتراضية',
    is_default BOOLEAN NOT NULL DEFAULT false,
    
    -- إعدادات الألوان
    header_background_color TEXT NOT NULL DEFAULT '#F3F4F6',
    header_text_color TEXT NOT NULL DEFAULT '#000000',
    table_header_background_color TEXT NOT NULL DEFAULT '#3B82F6',
    table_header_text_color TEXT NOT NULL DEFAULT '#FFFFFF',
    transfer_row_color TEXT NOT NULL DEFAULT '#B8E6B8',
    worker_row_color TEXT NOT NULL DEFAULT '#E6F3FF',
    even_row_color TEXT NOT NULL DEFAULT '#F9FAFB',
    odd_row_color TEXT NOT NULL DEFAULT '#FFFFFF',
    border_color TEXT NOT NULL DEFAULT '#000000',
    negative_balance_color TEXT NOT NULL DEFAULT '#EF4444',
    
    -- إعدادات النصوص
    company_name TEXT NOT NULL DEFAULT 'شركة الفتحي للمقاولات والاستشارات الهندسية',
    report_title TEXT NOT NULL DEFAULT 'كشف حساب المشروع',
    date_label TEXT NOT NULL DEFAULT 'التاريخ:',
    project_label TEXT NOT NULL DEFAULT 'المشروع:',
    print_date_label TEXT NOT NULL DEFAULT 'تاريخ الطباعة:',
    currency_unit TEXT NOT NULL DEFAULT 'ريال',
    
    -- عناوين الأعمدة
    serial_column_header TEXT NOT NULL DEFAULT 'م',
    date_column_header TEXT NOT NULL DEFAULT 'التاريخ',
    account_column_header TEXT NOT NULL DEFAULT 'اسم الحساب',
    credit_column_header TEXT NOT NULL DEFAULT 'دائن',
    debit_column_header TEXT NOT NULL DEFAULT 'مدين',
    balance_column_header TEXT NOT NULL DEFAULT 'الرصيد',
    notes_column_header TEXT NOT NULL DEFAULT 'البيان',
    
    -- أعرض الأعمدة
    serial_column_width INTEGER NOT NULL DEFAULT 40,
    date_column_width INTEGER NOT NULL DEFAULT 80,
    account_column_width INTEGER NOT NULL DEFAULT 200,
    credit_column_width INTEGER NOT NULL DEFAULT 80,
    debit_column_width INTEGER NOT NULL DEFAULT 80,
    balance_column_width INTEGER NOT NULL DEFAULT 80,
    notes_column_width INTEGER NOT NULL DEFAULT 250,
    
    -- إعدادات الصفوف
    auto_row_height BOOLEAN NOT NULL DEFAULT true,
    min_row_height INTEGER NOT NULL DEFAULT 18,
    max_row_height INTEGER NOT NULL DEFAULT 100,
    
    -- إعدادات الخط
    font_family TEXT NOT NULL DEFAULT 'Arial Unicode MS',
    font_size INTEGER NOT NULL DEFAULT 10,
    header_font_size INTEGER NOT NULL DEFAULT 12,
    table_font_size INTEGER NOT NULL DEFAULT 10,
    
    -- إعدادات إضافية
    enable_text_wrapping BOOLEAN NOT NULL DEFAULT true,
    border_width INTEGER NOT NULL DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء إعدادات افتراضية
INSERT INTO export_settings (name, is_default) 
VALUES ('إعدادات افتراضية', true)
ON CONFLICT DO NOTHING;
