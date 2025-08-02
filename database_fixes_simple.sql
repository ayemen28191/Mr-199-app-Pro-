-- ============================================
-- استعلام مبسط لإصلاح الأعمدة المفقودة فقط
-- نسخة آمنة وبسيطة لـ Supabase PostgreSQL
-- ============================================

-- تفعيل ملحق UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- إنشاء الجداول الأساسية إذا لم تكن موجودة
-- ============================================

-- جدول المشاريع
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- جدول العمال
CREATE TABLE IF NOT EXISTS workers (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    daily_wage DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- جدول الموردين
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    address TEXT,
    payment_terms TEXT DEFAULT 'نقد',
    total_debt DECIMAL(12,2) DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- جدول المواد
CREATE TABLE IF NOT EXISTS materials (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- جدول مشتريات المواد
CREATE TABLE IF NOT EXISTS material_purchases (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR NOT NULL REFERENCES projects(id),
    supplier_id VARCHAR REFERENCES suppliers(id),
    material_id VARCHAR NOT NULL REFERENCES materials(id),
    quantity DECIMAL(10,3) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_type TEXT NOT NULL DEFAULT 'نقد',
    paid_amount DECIMAL(10,2) DEFAULT 0 NOT NULL,
    remaining_amount DECIMAL(10,2) DEFAULT 0 NOT NULL,
    supplier_name TEXT,
    invoice_number TEXT,
    invoice_date TEXT NOT NULL,
    due_date TEXT,
    invoice_photo TEXT,
    notes TEXT,
    purchase_date TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- جدول ملخص المصروفات اليومية
CREATE TABLE IF NOT EXISTS daily_expense_summaries (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR NOT NULL REFERENCES projects(id),
    date TEXT NOT NULL,
    carried_forward_amount DECIMAL(10,2) DEFAULT 0 NOT NULL,
    total_fund_transfers DECIMAL(10,2) DEFAULT 0 NOT NULL,
    total_worker_wages DECIMAL(10,2) DEFAULT 0 NOT NULL,
    total_material_costs DECIMAL(10,2) DEFAULT 0 NOT NULL,
    total_transportation_costs DECIMAL(10,2) DEFAULT 0 NOT NULL,
    total_income DECIMAL(10,2) NOT NULL,
    total_expenses DECIMAL(10,2) NOT NULL,
    remaining_balance DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- جدول تحويلات العهدة
CREATE TABLE IF NOT EXISTS fund_transfers (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR NOT NULL REFERENCES projects(id),
    amount DECIMAL(10,2) NOT NULL,
    sender_name TEXT,
    transfer_number TEXT,
    transfer_type TEXT NOT NULL,
    transfer_date TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- جدول حضور العمال
CREATE TABLE IF NOT EXISTS worker_attendance (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR NOT NULL REFERENCES projects(id),
    worker_id VARCHAR NOT NULL REFERENCES workers(id),
    date TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    work_description TEXT,
    is_present BOOLEAN NOT NULL,
    work_days DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    daily_wage DECIMAL(10,2) NOT NULL,
    actual_wage DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0 NOT NULL,
    remaining_amount DECIMAL(10,2) DEFAULT 0 NOT NULL,
    payment_type TEXT NOT NULL DEFAULT 'partial',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- جدول أجور المواصلات
CREATE TABLE IF NOT EXISTS transportation_expenses (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR NOT NULL REFERENCES projects(id),
    worker_id VARCHAR REFERENCES workers(id),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- جدول الإكمال التلقائي
CREATE TABLE IF NOT EXISTS autocomplete_data (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    value TEXT NOT NULL,
    usage_count INTEGER DEFAULT 1 NOT NULL,
    last_used TIMESTAMP DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- إضافة الأعمدة المفقودة - الجزء المهم
-- ============================================

-- إضافة الأعمدة المفقودة في جدول material_purchases
DO $$
BEGIN
    -- إضافة payment_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'material_purchases' AND column_name = 'payment_type') THEN
        ALTER TABLE material_purchases ADD COLUMN payment_type TEXT NOT NULL DEFAULT 'نقد';
    END IF;
    
    -- إضافة paid_amount
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'material_purchases' AND column_name = 'paid_amount') THEN
        ALTER TABLE material_purchases ADD COLUMN paid_amount DECIMAL(10,2) DEFAULT 0 NOT NULL;
    END IF;
    
    -- إضافة remaining_amount
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'material_purchases' AND column_name = 'remaining_amount') THEN
        ALTER TABLE material_purchases ADD COLUMN remaining_amount DECIMAL(10,2) DEFAULT 0 NOT NULL;
    END IF;
    
    -- إضافة supplier_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'material_purchases' AND column_name = 'supplier_id') THEN
        ALTER TABLE material_purchases ADD COLUMN supplier_id VARCHAR REFERENCES suppliers(id);
    END IF;
    
    -- إضافة due_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'material_purchases' AND column_name = 'due_date') THEN
        ALTER TABLE material_purchases ADD COLUMN due_date TEXT;
    END IF;
END $$;

-- إضافة الأعمدة المفقودة في جدول daily_expense_summaries
DO $$
BEGIN
    -- إضافة carried_forward_amount
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_expense_summaries' AND column_name = 'carried_forward_amount') THEN
        ALTER TABLE daily_expense_summaries ADD COLUMN carried_forward_amount DECIMAL(10,2) DEFAULT 0 NOT NULL;
    END IF;
END $$;

-- إضافة الأعمدة المفقودة في جدول suppliers
DO $$
BEGIN
    -- إضافة total_debt
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'suppliers' AND column_name = 'total_debt') THEN
        ALTER TABLE suppliers ADD COLUMN total_debt DECIMAL(12,2) DEFAULT 0 NOT NULL;
    END IF;
END $$;

-- ============================================
-- إنشاء الفهارس الأساسية
-- ============================================

-- فهارس حضور العمال
CREATE INDEX IF NOT EXISTS idx_worker_attendance_date ON worker_attendance(date);
CREATE INDEX IF NOT EXISTS idx_worker_attendance_project ON worker_attendance(project_id);
CREATE INDEX IF NOT EXISTS idx_worker_attendance_worker ON worker_attendance(worker_id);

-- فهارس مشتريات المواد
CREATE INDEX IF NOT EXISTS idx_material_purchases_project ON material_purchases(project_id);
CREATE INDEX IF NOT EXISTS idx_material_purchases_date ON material_purchases(purchase_date);

-- فهارس تحويلات العهدة
CREATE INDEX IF NOT EXISTS idx_fund_transfers_project ON fund_transfers(project_id);

-- فهارس ملخص المصروفات اليومية
CREATE INDEX IF NOT EXISTS idx_daily_summaries_project_date ON daily_expense_summaries(project_id, date);

-- فهارس المواصلات
CREATE INDEX IF NOT EXISTS idx_transportation_project ON transportation_expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_transportation_date ON transportation_expenses(date);

-- ============================================
-- تقرير النتائج
-- ============================================

-- عرض معلومات الجداول المهمة
SELECT 
    'projects' as table_name, COUNT(*) as row_count FROM projects
UNION ALL
SELECT 
    'workers' as table_name, COUNT(*) as row_count FROM workers
UNION ALL
SELECT 
    'suppliers' as table_name, COUNT(*) as row_count FROM suppliers
UNION ALL
SELECT 
    'materials' as table_name, COUNT(*) as row_count FROM materials
UNION ALL
SELECT 
    'material_purchases' as table_name, COUNT(*) as row_count FROM material_purchases
UNION ALL
SELECT 
    'daily_expense_summaries' as table_name, COUNT(*) as row_count FROM daily_expense_summaries
UNION ALL
SELECT 
    'fund_transfers' as table_name, COUNT(*) as row_count FROM fund_transfers
UNION ALL
SELECT 
    'worker_attendance' as table_name, COUNT(*) as row_count FROM worker_attendance
UNION ALL
SELECT 
    'transportation_expenses' as table_name, COUNT(*) as row_count FROM transportation_expenses
ORDER BY table_name;

-- التحقق من الأعمدة المهمة
SELECT 
    'material_purchases - payment_type' as check_item,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'material_purchases' AND column_name = 'payment_type')
         THEN 'موجود ✅' ELSE 'مفقود ❌' END as status
UNION ALL
SELECT 
    'daily_expense_summaries - carried_forward_amount' as check_item,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'daily_expense_summaries' AND column_name = 'carried_forward_amount')
         THEN 'موجود ✅' ELSE 'مفقود ❌' END as status
UNION ALL
SELECT 
    'suppliers - total_debt' as check_item,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'suppliers' AND column_name = 'total_debt')
         THEN 'موجود ✅' ELSE 'مفقود ❌' END as status;

-- رسالة النجاح النهائية
SELECT 'تم الانتهاء من إصلاح جميع الأعمدة المفقودة بنجاح! 🎉' AS نتيجة_نهائية;