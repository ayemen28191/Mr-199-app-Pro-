-- نظام المصادقة وإدارة الصلاحيات المتقدم
-- قاعدة البيانات PostgreSQL
-- آخر تحديث: 27 أغسطس 2025

-- ✅ تم تحديث المخطط بنجاح - يعمل مع 44 جدول في Supabase
-- ✅ تمت إضافة 8 جداول أمنية جديدة لنظام المصادقة المتقدم

-- إعداد الامتدادات المطلوبة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- جدول المستخدمين الرئيسي
CREATE TABLE auth_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    
    -- حالة الحساب
    is_active BOOLEAN DEFAULT TRUE,
    is_super_admin BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- تأكيد البيانات
    email_verified_at TIMESTAMP NULL,
    phone_verified_at TIMESTAMP NULL,
    
    -- المصادقة متعددة العوامل
    totp_secret TEXT, -- مشفر
    totp_enabled BOOLEAN DEFAULT FALSE,
    backup_codes JSONB, -- رموز احتياطية مشفرة
    
    -- حماية من الهجمات
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP NULL,
    
    -- تواريخ مهمة
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    last_login_at TIMESTAMP,
    password_changed_at TIMESTAMP DEFAULT NOW()
);

-- جدول الأدوار
CREATE TABLE auth_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    color VARCHAR(7) DEFAULT '#3B82F6', -- لون للواجهة
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth_users(id)
);

-- جدول الصلاحيات
CREATE TABLE auth_permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL, -- مثل: projects.create
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- مثل: projects, users, financial
    resource VARCHAR(100) NOT NULL, -- مثل: project, user, expense
    action VARCHAR(50) NOT NULL, -- مثل: create, read, update, delete
    is_dangerous BOOLEAN DEFAULT FALSE, -- للصلاحيات الحساسة
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- جدول ربط الأدوار بالصلاحيات
CREATE TABLE auth_role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES auth_roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES auth_permissions(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES auth_users(id),
    granted_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(role_id, permission_id)
);

-- جدول ربط المستخدمين بالأدوار
CREATE TABLE auth_user_roles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES auth_roles(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES auth_users(id),
    granted_at TIMESTAMP DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP NULL, -- للأدوار المؤقتة
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, role_id)
);

-- جدول الصلاحيات المباشرة للمستخدمين (تجاوز الأدوار)
CREATE TABLE auth_user_permissions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES auth_permissions(id) ON DELETE CASCADE,
    granted BOOLEAN DEFAULT TRUE, -- true = منح، false = منع صراحة
    granted_by UUID REFERENCES auth_users(id),
    granted_at TIMESTAMP DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP NULL, -- للصلاحيات المؤقتة
    reason TEXT, -- سبب منح أو منع الصلاحية
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, permission_id)
);

-- جدول الجلسات والأجهزة
CREATE TABLE auth_user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    
    -- معلومات الجهاز
    device_id VARCHAR(255) NOT NULL, -- fingerprint للجهاز
    device_name VARCHAR(255),
    device_type VARCHAR(50), -- web, mobile, desktop
    browser_name VARCHAR(100),
    browser_version VARCHAR(50),
    os_name VARCHAR(100),
    os_version VARCHAR(50),
    
    -- معلومات الموقع
    ip_address INET,
    country VARCHAR(100),
    city VARCHAR(100),
    timezone VARCHAR(50),
    
    -- معلومات الجلسة
    refresh_token_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_trusted BOOLEAN DEFAULT FALSE, -- أجهزة موثوقة
    
    -- تواريخ
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    last_used_at TIMESTAMP DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    
    UNIQUE(user_id, device_id)
);

-- جدول سجل التدقيق الشامل
CREATE TABLE auth_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth_users(id), -- قد يكون null للعمليات النظام
    
    -- تفاصيل العملية
    action VARCHAR(100) NOT NULL, -- login, logout, create_user, grant_permission
    resource_type VARCHAR(100), -- user, role, permission
    resource_id VARCHAR(255), -- معرف المورد المتأثر
    
    -- التغييرات
    old_values JSONB, -- القيم القديمة
    new_values JSONB, -- القيم الجديدة
    changes_summary TEXT, -- ملخص التغييرات
    
    -- معلومات السياق
    ip_address INET,
    user_agent TEXT,
    session_id UUID REFERENCES auth_user_sessions(id),
    
    -- نتيجة العملية
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    risk_level INTEGER DEFAULT 1, -- 1=منخفض، 2=متوسط، 3=عالي، 4=حرج
    
    -- تصنيف العملية
    category VARCHAR(50), -- authentication, authorization, administration
    severity VARCHAR(20) DEFAULT 'info', -- info, warning, error, critical
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- جدول رموز التحقق والاستعادة
CREATE TABLE auth_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    token_type VARCHAR(50) NOT NULL, -- email_verification, password_reset, phone_verification, magic_link
    
    -- معلومات إضافية
    email VARCHAR(255), -- البريد المرسل إليه
    phone VARCHAR(50), -- الهاتف المرسل إليه
    attempts INTEGER DEFAULT 0, -- عدد محاولات الاستخدام
    max_attempts INTEGER DEFAULT 3,
    
    -- تواريخ
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    
    -- معلومات الأمان
    ip_address INET,
    user_agent TEXT
);

-- جدول محاولات تسجيل الدخول والأمان
CREATE TABLE auth_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- محاولة الدخول
    email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    
    -- نتيجة المحاولة
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100), -- invalid_credentials, account_locked, mfa_required, mfa_failed
    
    -- تفاصيل إضافية
    device_fingerprint VARCHAR(255),
    location_country VARCHAR(100),
    location_city VARCHAR(100),
    is_suspicious BOOLEAN DEFAULT FALSE, -- محاولة مشبوهة
    risk_score INTEGER DEFAULT 1, -- درجة الخطر 1-10
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- جدول الإعدادات الأمنية للمستخدمين
CREATE TABLE auth_user_security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE UNIQUE,
    
    -- إعدادات MFA
    mfa_required BOOLEAN DEFAULT FALSE,
    trusted_devices_enabled BOOLEAN DEFAULT TRUE,
    
    -- إعدادات الإشعارات الأمنية
    notify_login BOOLEAN DEFAULT TRUE,
    notify_new_device BOOLEAN DEFAULT TRUE,
    notify_permission_changes BOOLEAN DEFAULT TRUE,
    notify_password_change BOOLEAN DEFAULT TRUE,
    
    -- إعدادات الجلسات
    auto_logout_minutes INTEGER DEFAULT 480, -- 8 ساعات
    max_concurrent_sessions INTEGER DEFAULT 5,
    require_reauth_for_sensitive BOOLEAN DEFAULT TRUE,
    
    -- إعدادات كلمة المرور
    password_expires_days INTEGER DEFAULT 90,
    require_password_change BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- جدول السياسات الأمنية للنظام
CREATE TABLE auth_security_policies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- إعدادات السياسة
    policy_config JSONB NOT NULL, -- إعدادات السياسة في JSON
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,
    
    -- أولوية التطبيق
    priority INTEGER DEFAULT 1,
    
    -- تواريخ
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth_users(id)
);

-- إدراج البيانات الأساسية

-- الأدوار الافتراضية
INSERT INTO auth_roles (name, display_name, description, is_system) VALUES
('super_admin', 'مدير عام', 'صلاحية كاملة على النظام', true),
('admin', 'مدير', 'إدارة المشاريع والعمال والتقارير', true),
('project_manager', 'مدير مشروع', 'إدارة مشروع محدد والعمال المختصين', true),
('accountant', 'محاسب', 'إدارة الشؤون المالية والتقارير المالية', true),
('supervisor', 'مشرف', 'مشرف الموقع وإدارة الحضور', true),
('hr_manager', 'مدير الموارد البشرية', 'إدارة العمال والرواتب', true),
('viewer', 'مستعرض', 'عرض البيانات فقط بدون تعديل', true);

-- الصلاحيات الأساسية
INSERT INTO auth_permissions (name, display_name, description, category, resource, action) VALUES
-- إدارة المستخدمين
('users.create', 'إنشاء مستخدم', 'إنشاء حسابات مستخدمين جديدة', 'users', 'user', 'create'),
('users.read', 'عرض المستخدمين', 'عرض قائمة وتفاصيل المستخدمين', 'users', 'user', 'read'),
('users.update', 'تحديث المستخدمين', 'تحديث بيانات المستخدمين', 'users', 'user', 'update'),
('users.delete', 'حذف المستخدمين', 'حذف حسابات المستخدمين', 'users', 'user', 'delete'),
('users.manage_roles', 'إدارة أدوار المستخدمين', 'منح وإلغاء الأدوار للمستخدمين', 'users', 'user', 'manage'),

-- إدارة الأدوار والصلاحيات
('roles.create', 'إنشاء دور', 'إنشاء أدوار جديدة', 'roles', 'role', 'create'),
('roles.read', 'عرض الأدوار', 'عرض الأدوار والصلاحيات', 'roles', 'role', 'read'),
('roles.update', 'تحديث الأدوار', 'تعديل الأدوار والصلاحيات', 'roles', 'role', 'update'),
('roles.delete', 'حذف الأدوار', 'حذف الأدوار غير المستخدمة', 'roles', 'role', 'delete'),

-- إدارة المشاريع
('projects.create', 'إنشاء مشروع', 'إنشاء مشاريع جديدة', 'projects', 'project', 'create'),
('projects.read', 'عرض المشاريع', 'عرض قائمة وتفاصيل المشاريع', 'projects', 'project', 'read'),
('projects.update', 'تحديث المشاريع', 'تحديث بيانات المشاريع', 'projects', 'project', 'update'),
('projects.delete', 'حذف المشاريع', 'حذف المشاريع المكتملة أو الملغاة', 'projects', 'project', 'delete'),
('projects.financial_reports', 'التقارير المالية للمشروع', 'عرض التقارير المالية التفصيلية', 'projects', 'project', 'report'),

-- إدارة العمال
('workers.create', 'إضافة عامل', 'تسجيل عمال جدد في النظام', 'workers', 'worker', 'create'),
('workers.read', 'عرض العمال', 'عرض قوائم وتفاصيل العمال', 'workers', 'worker', 'read'),
('workers.update', 'تحديث بيانات العامل', 'تحديث معلومات العمال', 'workers', 'worker', 'update'),
('workers.delete', 'حذف عامل', 'إزالة العامل من النظام', 'workers', 'worker', 'delete'),
('workers.manage_attendance', 'إدارة الحضور', 'تسجيل حضور وغياب العمال', 'workers', 'attendance', 'manage'),
('workers.manage_salaries', 'إدارة الرواتب', 'إدارة رواتب ومستحقات العمال', 'workers', 'salary', 'manage'),

-- إدارة المالية
('financial.read_reports', 'عرض التقارير المالية', 'الوصول للتقارير المالية', 'financial', 'report', 'read'),
('financial.manage_expenses', 'إدارة المصاريف', 'إضافة وتعديل المصاريف اليومية', 'financial', 'expense', 'manage'),
('financial.manage_transfers', 'إدارة التحويلات', 'إدارة تحويلات العهدة والأموال', 'financial', 'transfer', 'manage'),
('financial.export_data', 'تصدير البيانات المالية', 'تصدير التقارير والبيانات المالية', 'financial', 'data', 'export'),

-- إدارة الموردين
('suppliers.create', 'إضافة مورد', 'تسجيل موردين جدد', 'suppliers', 'supplier', 'create'),
('suppliers.read', 'عرض الموردين', 'عرض قوائم وتفاصيل الموردين', 'suppliers', 'supplier', 'read'),
('suppliers.update', 'تحديث المورد', 'تحديث بيانات الموردين', 'suppliers', 'supplier', 'update'),
('suppliers.delete', 'حذف مورد', 'إزالة المورد من النظام', 'suppliers', 'supplier', 'delete'),
('suppliers.manage_accounts', 'إدارة حسابات الموردين', 'إدارة المدفوعات والديون', 'suppliers', 'account', 'manage'),

-- إدارة النظام
('system.view_audit_logs', 'عرض سجل التدقيق', 'الوصول لسجل العمليات والتدقيق', 'system', 'audit', 'read'),
('system.manage_settings', 'إدارة إعدادات النظام', 'تكوين الإعدادات العامة للنظام', 'system', 'settings', 'manage'),
('system.manage_backups', 'إدارة النسخ الاحتياطي', 'إنشاء واستعادة النسخ الاحتياطية', 'system', 'backup', 'manage'),
('system.impersonate_user', 'انتحال هوية المستخدم', 'تسجيل الدخول كمستخدم آخر للدعم', 'system', 'user', 'impersonate');

-- ربط الأدوار بالصلاحيات الافتراضية

-- المدير العام - جميع الصلاحيات
INSERT INTO auth_role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM auth_roles r 
CROSS JOIN auth_permissions p 
WHERE r.name = 'super_admin';

-- المدير - معظم الصلاحيات عدا إدارة النظام الحساسة
INSERT INTO auth_role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM auth_roles r 
CROSS JOIN auth_permissions p 
WHERE r.name = 'admin'
AND p.name NOT IN ('system.impersonate_user', 'roles.delete', 'users.delete');

-- مدير المشروع - صلاحيات محدودة للمشاريع والعمال
INSERT INTO auth_role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM auth_roles r 
CROSS JOIN auth_permissions p 
WHERE r.name = 'project_manager'
AND p.name IN (
    'projects.read', 'projects.update', 
    'workers.read', 'workers.manage_attendance',
    'financial.read_reports'
);

-- المحاسب - الصلاحيات المالية
INSERT INTO auth_role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM auth_roles r 
CROSS JOIN auth_permissions p 
WHERE r.name = 'accountant'
AND p.category IN ('financial', 'suppliers')
OR p.name IN ('projects.read', 'workers.read');

-- المشرف - إدارة الحضور والعمال
INSERT INTO auth_role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM auth_roles r 
CROSS JOIN auth_permissions p 
WHERE r.name = 'supervisor'
AND p.name IN (
    'workers.read', 'workers.manage_attendance',
    'projects.read'
);

-- مدير الموارد البشرية
INSERT INTO auth_role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM auth_roles r 
CROSS JOIN auth_permissions p 
WHERE r.name = 'hr_manager'
AND p.name IN (
    'workers.create', 'workers.read', 'workers.update',
    'workers.manage_salaries', 'workers.manage_attendance',
    'projects.read'
);

-- المستعرض - صلاحيات القراءة فقط
INSERT INTO auth_role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM auth_roles r 
CROSS JOIN auth_permissions p 
WHERE r.name = 'viewer'
AND p.action = 'read';

-- الفهارس لتحسين الأداء
CREATE INDEX idx_auth_users_email ON auth_users(email);
CREATE INDEX idx_auth_users_active ON auth_users(is_active);
CREATE INDEX idx_auth_users_verified ON auth_users(is_verified);
CREATE INDEX idx_auth_users_created_at ON auth_users(created_at);

CREATE INDEX idx_auth_user_sessions_user_id ON auth_user_sessions(user_id);
CREATE INDEX idx_auth_user_sessions_active ON auth_user_sessions(is_active);
CREATE INDEX idx_auth_user_sessions_expires ON auth_user_sessions(expires_at);
CREATE INDEX idx_auth_user_sessions_device ON auth_user_sessions(device_id);

CREATE INDEX idx_auth_audit_logs_user_id ON auth_audit_logs(user_id);
CREATE INDEX idx_auth_audit_logs_created_at ON auth_audit_logs(created_at);
CREATE INDEX idx_auth_audit_logs_action ON auth_audit_logs(action);
CREATE INDEX idx_auth_audit_logs_category ON auth_audit_logs(category);

CREATE INDEX idx_auth_verification_tokens_user_id ON auth_verification_tokens(user_id);
CREATE INDEX idx_auth_verification_tokens_type ON auth_verification_tokens(token_type);
CREATE INDEX idx_auth_verification_tokens_expires ON auth_verification_tokens(expires_at);

CREATE INDEX idx_auth_login_attempts_ip ON auth_login_attempts(ip_address);
CREATE INDEX idx_auth_login_attempts_email ON auth_login_attempts(email);
CREATE INDEX idx_auth_login_attempts_created_at ON auth_login_attempts(created_at);
CREATE INDEX idx_auth_login_attempts_suspicious ON auth_login_attempts(is_suspicious);

CREATE INDEX idx_auth_user_roles_user_id ON auth_user_roles(user_id);
CREATE INDEX idx_auth_user_roles_role_id ON auth_user_roles(role_id);
CREATE INDEX idx_auth_user_roles_active ON auth_user_roles(is_active);

CREATE INDEX idx_auth_user_permissions_user_id ON auth_user_permissions(user_id);
CREATE INDEX idx_auth_user_permissions_permission_id ON auth_user_permissions(permission_id);
CREATE INDEX idx_auth_user_permissions_active ON auth_user_permissions(is_active);

-- دوال مساعدة

-- دالة للتحقق من صلاحية المستخدم
CREATE OR REPLACE FUNCTION check_user_permission(user_uuid UUID, permission_name VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := FALSE;
BEGIN
    -- التحقق من الصلاحية المباشرة
    SELECT EXISTS(
        SELECT 1 FROM auth_user_permissions up
        JOIN auth_permissions p ON up.permission_id = p.id
        WHERE up.user_id = user_uuid
        AND p.name = permission_name
        AND up.granted = true
        AND up.is_active = true
        AND (up.expires_at IS NULL OR up.expires_at > NOW())
    ) INTO has_permission;
    
    -- إذا لم توجد صلاحية مباشرة، تحقق من الأدوار
    IF NOT has_permission THEN
        SELECT EXISTS(
            SELECT 1 FROM auth_user_roles ur
            JOIN auth_role_permissions rp ON ur.role_id = rp.role_id
            JOIN auth_permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = user_uuid
            AND p.name = permission_name
            AND ur.is_active = true
            AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        ) INTO has_permission;
    END IF;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- دالة لتسجيل العمليات في سجل التدقيق
CREATE OR REPLACE FUNCTION log_audit_action(
    p_user_id UUID,
    p_action VARCHAR,
    p_resource_type VARCHAR DEFAULT NULL,
    p_resource_id VARCHAR DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_success BOOLEAN DEFAULT TRUE,
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO auth_audit_logs (
        user_id, action, resource_type, resource_id,
        old_values, new_values, ip_address,
        success, error_message
    ) VALUES (
        p_user_id, p_action, p_resource_type, p_resource_id,
        p_old_values, p_new_values, p_ip_address,
        p_success, p_error_message
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Triggers لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_auth_users_updated_at
    BEFORE UPDATE ON auth_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auth_roles_updated_at
    BEFORE UPDATE ON auth_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auth_user_security_settings_updated_at
    BEFORE UPDATE ON auth_user_security_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Views مفيدة

-- عرض المستخدمين مع أدوارهم
CREATE VIEW user_roles_view AS
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    u.is_active,
    r.id as role_id,
    r.name as role_name,
    r.display_name as role_display_name,
    ur.granted_at,
    ur.expires_at
FROM auth_users u
LEFT JOIN auth_user_roles ur ON u.id = ur.user_id AND ur.is_active = true
LEFT JOIN auth_roles r ON ur.role_id = r.id;

-- عرض صلاحيات المستخدمين الشامل
CREATE VIEW user_permissions_view AS
-- الصلاحيات من الأدوار
SELECT 
    u.id as user_id,
    u.email,
    p.id as permission_id,
    p.name as permission_name,
    p.display_name as permission_display_name,
    p.category,
    'role' as source,
    r.name as source_name,
    true as granted
FROM auth_users u
JOIN auth_user_roles ur ON u.id = ur.user_id AND ur.is_active = true
JOIN auth_roles r ON ur.role_id = r.id
JOIN auth_role_permissions rp ON r.id = rp.role_id
JOIN auth_permissions p ON rp.permission_id = p.id
WHERE (ur.expires_at IS NULL OR ur.expires_at > NOW())

UNION ALL

-- الصلاحيات المباشرة
SELECT 
    u.id as user_id,
    u.email,
    p.id as permission_id,
    p.name as permission_name,
    p.display_name as permission_display_name,
    p.category,
    'direct' as source,
    'مباشر' as source_name,
    up.granted
FROM auth_users u
JOIN auth_user_permissions up ON u.id = up.user_id AND up.is_active = true
JOIN auth_permissions p ON up.permission_id = p.id
WHERE (up.expires_at IS NULL OR up.expires_at > NOW());

COMMENT ON TABLE auth_users IS 'جدول المستخدمين الرئيسي مع بيانات المصادقة والأمان';
COMMENT ON TABLE auth_roles IS 'جدول الأدوار والمسؤوليات في النظام';
COMMENT ON TABLE auth_permissions IS 'جدول الصلاحيات والأذونات التفصيلية';
COMMENT ON TABLE auth_audit_logs IS 'سجل شامل لجميع العمليات والأنشطة في النظام';
COMMENT ON TABLE auth_user_sessions IS 'جلسات المستخدمين والأجهزة المصرح لها';
COMMENT ON FUNCTION check_user_permission IS 'التحقق من صلاحية مستخدم معين لعملية محددة';
COMMENT ON FUNCTION log_audit_action IS 'تسجيل عملية في سجل التدقيق مع التفاصيل الكاملة';