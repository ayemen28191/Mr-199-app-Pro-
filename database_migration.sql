-- ============================================
-- استعلام شامل لفحص وإنشاء الجداول والأعمدة المفقودة
-- نسخة محدثة لقاعدة بيانات Supabase PostgreSQL
-- ============================================

-- تفعيل ملحق UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. جدول المستخدمين (Users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- 2. جدول المشاريع (Projects)
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- 3. جدول العمال (Workers)
-- ============================================
CREATE TABLE IF NOT EXISTS workers (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    daily_wage DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- 4. جدول تحويلات العهدة (Fund Transfers)
-- ============================================
CREATE TABLE IF NOT EXISTS fund_transfers (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR NOT NULL REFERENCES projects(id),
    amount DECIMAL(10,2) NOT NULL,
    sender_name TEXT,
    transfer_number TEXT UNIQUE,
    transfer_type TEXT NOT NULL,
    transfer_date TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- 5. جدول حضور العمال (Worker Attendance)
-- ============================================
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
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(worker_id, date, project_id)
);

-- ============================================
-- 6. جدول الموردين (Suppliers)
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
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

-- ============================================
-- 7. جدول المواد (Materials)
-- ============================================
CREATE TABLE IF NOT EXISTS materials (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- 8. جدول مشتريات المواد (Material Purchases)
-- ============================================
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

-- ============================================
-- 9. جدول مدفوعات الموردين (Supplier Payments)
-- ============================================
CREATE TABLE IF NOT EXISTS supplier_payments (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id VARCHAR NOT NULL REFERENCES suppliers(id),
    project_id VARCHAR NOT NULL REFERENCES projects(id),
    purchase_id VARCHAR REFERENCES material_purchases(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'نقد',
    payment_date TEXT NOT NULL,
    reference_number TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- 10. جدول أجور المواصلات (Transportation Expenses)
-- ============================================
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

-- ============================================
-- 11. جدول حوالات العمال (Worker Transfers)
-- ============================================
CREATE TABLE IF NOT EXISTS worker_transfers (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id VARCHAR NOT NULL REFERENCES workers(id),
    project_id VARCHAR NOT NULL REFERENCES projects(id),
    amount DECIMAL(10,2) NOT NULL,
    transfer_number TEXT,
    sender_name TEXT,
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT,
    transfer_method TEXT NOT NULL,
    transfer_date TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- 12. جدول أرصدة العمال (Worker Balances)
-- ============================================
CREATE TABLE IF NOT EXISTS worker_balances (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id VARCHAR NOT NULL REFERENCES workers(id),
    project_id VARCHAR NOT NULL REFERENCES projects(id),
    total_earned DECIMAL(10,2) DEFAULT 0 NOT NULL,
    total_paid DECIMAL(10,2) DEFAULT 0 NOT NULL,
    total_transferred DECIMAL(10,2) DEFAULT 0 NOT NULL,
    current_balance DECIMAL(10,2) DEFAULT 0 NOT NULL,
    last_updated TIMESTAMP DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- 13. جدول ملخص المصروفات اليومية (Daily Expense Summaries)
-- ============================================
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

-- ============================================
-- 14. جدول أنواع العمال (Worker Types)
-- ============================================
CREATE TABLE IF NOT EXISTS worker_types (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    usage_count INTEGER DEFAULT 1 NOT NULL,
    last_used TIMESTAMP DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- 15. جدول الإكمال التلقائي (Autocomplete Data)
-- ============================================
CREATE TABLE IF NOT EXISTS autocomplete_data (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    value TEXT NOT NULL,
    usage_count INTEGER DEFAULT 1 NOT NULL,
    last_used TIMESTAMP DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- 16. جدول نثريات العمال (Worker Miscellaneous Expenses)
-- ============================================
CREATE TABLE IF NOT EXISTS worker_misc_expenses (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- التحقق من الأعمدة المفقودة وإضافتها
-- ============================================

-- التحقق من جدول material_purchases
DO $$
BEGIN
    -- إضافة العمود payment_type إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'material_purchases' AND column_name = 'payment_type') THEN
        ALTER TABLE material_purchases ADD COLUMN payment_type TEXT NOT NULL DEFAULT 'نقد';
    END IF;
    
    -- إضافة العمود paid_amount إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'material_purchases' AND column_name = 'paid_amount') THEN
        ALTER TABLE material_purchases ADD COLUMN paid_amount DECIMAL(10,2) DEFAULT 0 NOT NULL;
    END IF;
    
    -- إضافة العمود remaining_amount إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'material_purchases' AND column_name = 'remaining_amount') THEN
        ALTER TABLE material_purchases ADD COLUMN remaining_amount DECIMAL(10,2) DEFAULT 0 NOT NULL;
    END IF;
    
    -- إضافة العمود supplier_id إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'material_purchases' AND column_name = 'supplier_id') THEN
        ALTER TABLE material_purchases ADD COLUMN supplier_id VARCHAR REFERENCES suppliers(id);
    END IF;
    
    -- إضافة العمود due_date إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'material_purchases' AND column_name = 'due_date') THEN
        ALTER TABLE material_purchases ADD COLUMN due_date TEXT;
    END IF;
END $$;

-- التحقق من جدول daily_expense_summaries
DO $$
BEGIN
    -- إضافة العمود carried_forward_amount إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_expense_summaries' AND column_name = 'carried_forward_amount') THEN
        ALTER TABLE daily_expense_summaries ADD COLUMN carried_forward_amount DECIMAL(10,2) DEFAULT 0 NOT NULL;
    END IF;
END $$;

-- التحقق من جدول suppliers
DO $$
BEGIN
    -- إضافة العمود total_debt إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'suppliers' AND column_name = 'total_debt') THEN
        ALTER TABLE suppliers ADD COLUMN total_debt DECIMAL(12,2) DEFAULT 0 NOT NULL;
    END IF;
END $$;

-- ============================================
-- إنشاء الفهارس للأداء الأمثل
-- ============================================

-- فهارس المشاريع
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- فهارس حضور العمال
CREATE INDEX IF NOT EXISTS idx_worker_attendance_date ON worker_attendance(date);
CREATE INDEX IF NOT EXISTS idx_worker_attendance_project ON worker_attendance(project_id);
CREATE INDEX IF NOT EXISTS idx_worker_attendance_worker ON worker_attendance(worker_id);

-- فهارس مشتريات المواد
CREATE INDEX IF NOT EXISTS idx_material_purchases_project ON material_purchases(project_id);
CREATE INDEX IF NOT EXISTS idx_material_purchases_date ON material_purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_material_purchases_supplier ON material_purchases(supplier_id);

-- فهارس تحويلات العهدة
CREATE INDEX IF NOT EXISTS idx_fund_transfers_project ON fund_transfers(project_id);
CREATE INDEX IF NOT EXISTS idx_fund_transfers_date ON fund_transfers(transfer_date);

-- فهارس ملخص المصروفات اليومية
CREATE INDEX IF NOT EXISTS idx_daily_summaries_project_date ON daily_expense_summaries(project_id, date);

-- فهارس المواصلات
CREATE INDEX IF NOT EXISTS idx_transportation_project ON transportation_expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_transportation_date ON transportation_expenses(date);

-- فهارس الإكمال التلقائي
CREATE INDEX IF NOT EXISTS idx_autocomplete_category ON autocomplete_data(category);
CREATE INDEX IF NOT EXISTS idx_autocomplete_value ON autocomplete_data(value);
CREATE INDEX IF NOT EXISTS idx_autocomplete_usage ON autocomplete_data(usage_count DESC);

-- ============================================
-- إنشاء القيود الفريدة
-- ============================================

-- قيد فريد لملخص المصروفات اليومية
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_project_date') THEN
        ALTER TABLE daily_expense_summaries ADD CONSTRAINT unique_project_date UNIQUE (project_id, date);
    END IF;
END $$;

-- قيد فريد لأسماء المشاريع
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_project_name') THEN
        ALTER TABLE projects ADD CONSTRAINT unique_project_name UNIQUE (name);
    END IF;
END $$;

-- ============================================
-- تقرير النتائج
-- ============================================

-- عرض عدد الصفوف في كل جدول للتحقق
SELECT 
    'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 
    'projects' as table_name, COUNT(*) as row_count FROM projects
UNION ALL
SELECT 
    'workers' as table_name, COUNT(*) as row_count FROM workers
UNION ALL
SELECT 
    'fund_transfers' as table_name, COUNT(*) as row_count FROM fund_transfers
UNION ALL
SELECT 
    'worker_attendance' as table_name, COUNT(*) as row_count FROM worker_attendance
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
    'supplier_payments' as table_name, COUNT(*) as row_count FROM supplier_payments
UNION ALL
SELECT 
    'transportation_expenses' as table_name, COUNT(*) as row_count FROM transportation_expenses
UNION ALL
SELECT 
    'worker_transfers' as table_name, COUNT(*) as row_count FROM worker_transfers
UNION ALL
SELECT 
    'worker_balances' as table_name, COUNT(*) as row_count FROM worker_balances
UNION ALL
SELECT 
    'daily_expense_summaries' as table_name, COUNT(*) as row_count FROM daily_expense_summaries
UNION ALL
SELECT 
    'worker_types' as table_name, COUNT(*) as row_count FROM worker_types
UNION ALL
SELECT 
    'autocomplete_data' as table_name, COUNT(*) as row_count FROM autocomplete_data
UNION ALL
SELECT 
    'worker_misc_expenses' as table_name, COUNT(*) as row_count FROM worker_misc_expenses
ORDER BY table_name;

-- ============================================
-- التحقق من الأعمدة المهمة
-- ============================================

-- التحقق من وجود العمود payment_type في material_purchases
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'material_purchases' 
AND column_name IN ('payment_type', 'paid_amount', 'remaining_amount', 'supplier_id')
ORDER BY column_name;

-- التحقق من وجود العمود carried_forward_amount في daily_expense_summaries
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'daily_expense_summaries' 
AND column_name = 'carried_forward_amount';

-- التحقق من وجود العمود total_debt في suppliers
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'suppliers' 
AND column_name = 'total_debt';

-- ============================================
-- انتهاء الاستعلام
-- ============================================

SELECT 'تم الانتهاء من إنشاء وتحديث جميع الجداول والأعمدة بنجاح!' AS result;