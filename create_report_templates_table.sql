-- إنشاء جدول report_templates مع جميع الحقول المطلوبة
CREATE TABLE IF NOT EXISTS report_templates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  template_name TEXT NOT NULL UNIQUE DEFAULT 'default',
  
  -- إعدادات الرأس
  header_title TEXT NOT NULL DEFAULT 'نظام إدارة مشاريع البناء',
  header_subtitle TEXT DEFAULT 'تقرير مالي',
  company_name TEXT NOT NULL DEFAULT 'شركة البناء والتطوير',
  company_address TEXT DEFAULT 'صنعاء - اليمن',
  company_phone TEXT DEFAULT '+967 1 234567',
  company_email TEXT DEFAULT 'info@company.com',
  
  -- إعدادات الذيل
  footer_text TEXT DEFAULT 'تم إنشاء هذا التقرير بواسطة نظام إدارة المشاريع',
  footer_contact TEXT DEFAULT 'للاستفسار: info@company.com | +967 1 234567',
  
  -- إعدادات الألوان
  primary_color TEXT NOT NULL DEFAULT '#1f2937',
  secondary_color TEXT NOT NULL DEFAULT '#3b82f6',
  accent_color TEXT NOT NULL DEFAULT '#10b981',
  text_color TEXT NOT NULL DEFAULT '#1f2937',
  background_color TEXT NOT NULL DEFAULT '#ffffff',
  
  -- إعدادات التصميم
  font_size INTEGER NOT NULL DEFAULT 11,
  font_family TEXT NOT NULL DEFAULT 'Arial',
  logo_url TEXT,
  
  -- إعدادات الطباعة
  page_orientation TEXT NOT NULL DEFAULT 'portrait',
  page_size TEXT NOT NULL DEFAULT 'A4',
  margins JSONB DEFAULT '{"top": 1, "bottom": 1, "left": 0.75, "right": 0.75}',
  
  -- تفعيل/إلغاء العناصر
  show_header BOOLEAN NOT NULL DEFAULT true,
  show_footer BOOLEAN NOT NULL DEFAULT true,
  show_logo BOOLEAN NOT NULL DEFAULT true,
  show_date BOOLEAN NOT NULL DEFAULT true,
  show_page_numbers BOOLEAN NOT NULL DEFAULT true,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إدراج البيانات الافتراضية
INSERT INTO report_templates (
  template_name, is_active, header_title, header_subtitle, 
  company_name, company_address, company_phone, company_email,
  footer_text, footer_contact, primary_color, secondary_color,
  accent_color, text_color, background_color, font_size,
  font_family, page_orientation, page_size, margins,
  show_header, show_footer, show_logo, show_date, show_page_numbers
) VALUES (
  'default', 
  true, 
  'نظام إدارة مشاريع البناء', 
  'تقرير مالي',
  'شركة البناء والتطوير', 
  'صنعاء - اليمن', 
  '+967 1 234567', 
  'info@company.com',
  'تم إنشاء هذا التقرير بواسطة نظام إدارة المشاريع', 
  'للاستفسار: info@company.com | +967 1 234567',
  '#1f2937', 
  '#3b82f6', 
  '#10b981', 
  '#1f2937', 
  '#ffffff', 
  11,
  'Arial', 
  'portrait', 
  'A4', 
  '{"top": 1, "bottom": 1, "left": 0.75, "right": 0.75}',
  true, 
  true, 
  true, 
  true, 
  true
)
ON CONFLICT (template_name) DO UPDATE SET
  updated_at = CURRENT_TIMESTAMP;

-- إنشاء فهرس للحصول على القالب النشط بسرعة
CREATE INDEX IF NOT EXISTS idx_report_templates_active ON report_templates(is_active) WHERE is_active = true;

-- التحقق من إنشاء الجدول والبيانات
SELECT 'تم إنشاء جدول report_templates بنجاح' as status;
SELECT COUNT(*) as total_templates FROM report_templates;
SELECT template_name, is_active FROM report_templates WHERE is_active = true;