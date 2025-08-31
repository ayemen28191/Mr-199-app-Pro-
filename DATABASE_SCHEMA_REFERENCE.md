# مرجع هيكل قاعدة البيانات - نظام إدارة المشاريع الإنشائية

## نظرة عامة
هذا المستند يحتوي على توثيق شامل لهيكل قاعدة البيانات الكاملة للنظام، بما في ذلك جداول Supabase الأساسية وجداول التطبيق المخصصة.

---

## إحصائيات النظام الحالية (أغسطس 2025)

### المخططات (Schemas)
- **public**: 46 جدول (نظام التطبيق الأساسي)
- **auth**: 17 جدول (نظام Supabase الأساسي)
- **storage**: 4 جداول (نظام التخزين)
- **extensions**: 2 جدول (الامتدادات)

### إجمالي الجداول: **69 جدول**

---

## قاعدة بيانات التطبيق الأساسية (Public Schema)

### 1. نظام إدارة المشاريع (8 جداول)
```sql
-- الجداول الأساسية
projects                    -- المشاريع الأساسية
users                      -- المستخدمين والمديرين
workers                    -- العمال ومعلوماتهم
suppliers                  -- الموردين وحساباتهم

-- الجداول المالية  
fund_transfers             -- تحويلات العهدة للمشاريع
project_fund_transfers     -- ترحيل الأموال بين المشاريع
daily_expense_summaries    -- ملخصات المصروفات اليومية
worker_balances           -- أرصدة حسابات العمال
```

### 2. نظام إدارة العمال (6 جداول)
```sql
worker_attendance          -- حضور وغياب العمال
worker_transfers          -- حوالات الأهالي
worker_types             -- أنواع العمال المختلفة
worker_misc_expenses     -- نثريات ومصاريف العمال
```

### 3. نظام إدارة المواد والمشتريات (4 جداول)
```sql
materials                 -- مواد البناء الأساسية
material_purchases        -- مشتريات المواد
supplier_payments         -- مدفوعات الموردين
transportation_expenses   -- مصاريف المواصلات
```

### 4. نظام الإشعارات المتقدم (6 جداول)
```sql
notifications             -- الإشعارات الأساسية
notification_templates    -- قوالب الإشعارات
notification_settings     -- إعدادات الإشعارات للمستخدمين
notification_queue        -- طابور إرسال الإشعارات
notification_read_states  -- حالة قراءة الإشعارات
channels                 -- قنوات التواصل
```

### 5. نظام المصادقة والأمان المتقدم (9 جداول)
```sql
auth_roles               -- الأدوار والصلاحيات
auth_permissions         -- الصلاحيات المفصلة
auth_role_permissions    -- ربط الأدوار بالصلاحيات
auth_user_roles         -- ربط المستخدمين بالأدوار
auth_user_permissions   -- صلاحيات مباشرة للمستخدمين
auth_user_sessions      -- إدارة الجلسات والأجهزة
auth_audit_log          -- سجل تدقيق العمليات
auth_verification_codes -- رموز التحقق
auth_user_security_settings -- إعدادات الأمان المخصصة
```

### 6. النظام الذكي والتحليلات (4 جداول)
```sql
ai_system_logs           -- سجلات النظام الذكي
ai_system_metrics        -- مقاييس الأداء
ai_system_decisions      -- قرارات النظام الذكي
ai_system_recommendations -- توصيات النظام الذكي
```

### 7. نظام السياسات الأمنية (4 جداول)
```sql
security_policies           -- السياسات الأمنية
security_policy_suggestions -- اقتراحات السياسات
security_policy_implementations -- تطبيق السياسات
security_policy_violations  -- انتهاكات السياسات
```

### 8. أنظمة مساعدة (5 جداول)
```sql
autocomplete_data        -- بيانات الإكمال التلقائي
print_settings          -- إعدادات الطباعة
report_templates        -- قوالب التقارير
equipment              -- المعدات والأدوات
equipment_movements    -- حركة المعدات
messages              -- الرسائل والمراسلات
error_logs            -- سجلات الأخطاء
```

---

## قاعدة بيانات Supabase الأساسية (Auth Schema)

### جداول المصادقة الأساسية (17 جدول)
```sql
-- المستخدمين والهويات
users                   -- المستخدمين الأساسيين
identities             -- هويات المستخدمين المتعددة
instances              -- مثيلات النظام

-- الجلسات والرموز
sessions               -- جلسات المستخدمين
refresh_tokens         -- رموز التحديث
one_time_tokens        -- الرموز المؤقتة

-- المصادقة متعددة العوامل
mfa_factors            -- عوامل المصادقة المتعددة
mfa_challenges         -- تحديات المصادقة
mfa_amr_claims        -- ادعاءات طرق المصادقة

-- تسجيل العمليات
audit_log_entries      -- سجل تدقيق العمليات

-- نظام SSO
sso_providers          -- موفري تسجيل الدخول الموحد
sso_domains           -- نطاقات SSO
saml_providers        -- موفري SAML
saml_relay_states     -- حالات SAML
flow_state           -- حالة تدفق المصادقة

-- الهوك والتكامل
hooks                 -- هوك النظام
schema_migrations     -- هجرات المخطط
```

---

## العلاقات الأساسية بين الجداول

### علاقات نظام الإشعارات
```sql
notifications → projects (project_id)
notifications → users (created_by)
notification_queue → notifications (notification_id)
notification_read_states ↔ notifications
notification_settings → users (user_id)
```

### علاقات نظام الأمان
```sql
auth_user_roles → users (user_id)
auth_user_roles → auth_roles (role_id)
auth_role_permissions → auth_roles (role_id)
auth_role_permissions → auth_permissions (permission_id)
auth_audit_log → users (user_id)
```

### علاقات النظام الذكي
```sql
ai_system_recommendations → users (executed_by)
ai_system_logs → projects (project_id)
ai_system_decisions → projects (project_id)
```

---

## أنواع البيانات المستخدمة

### PostgreSQL الأساسية
- **UUID**: معرفات فريدة (Primary Keys)
- **VARCHAR**: نصوص متغيرة الطول
- **TEXT**: نصوص طويلة
- **INTEGER/SERIAL**: أرقام صحيحة
- **DECIMAL(10,2)**: أرقام مالية دقيقة
- **TIMESTAMP**: تواريخ وأوقات
- **BOOLEAN**: قيم منطقية
- **JSONB**: بيانات JSON محسنة

### Supabase المتخصصة
- **INET**: عناوين IP
- **USER-DEFINED**: أنواع مخصصة (ENUMs)

---

## إعدادات الأمان والحماية

### مصادقة متعددة العوامل (MFA)
- TOTP (Time-based OTP)
- WebAuthn
- SMS OTP
- Recovery Codes

### حماية كلمات المرور
- bcrypt تشفير (12 SALT_ROUNDS)
- سياسات انتهاء صلاحية
- حماية من هجمات القوة الغاشمة

### مراجعة العمليات
- تسجيل شامل لجميع العمليات
- تتبع عناوين IP
- سجل تغييرات البيانات الحساسة

---

## الفهارس والأداء

### فهارس الأداء الأساسية
```sql
-- فهارس الإشعارات
CREATE INDEX idx_notifications_user_recipients ON notifications USING GIN (recipients);
CREATE INDEX idx_notifications_type_priority ON notifications (type, priority);
CREATE INDEX idx_notification_queue_status ON notification_queue (status, created_at);

-- فهارس المشاريع والعمال
CREATE INDEX idx_worker_attendance_project_date ON worker_attendance (project_id, date);
CREATE INDEX idx_fund_transfers_project_date ON fund_transfers (project_id, transfer_date);

-- فهارس النظام الذكي
CREATE INDEX idx_ai_recommendations_status ON ai_system_recommendations (status, created_at);
CREATE INDEX idx_ai_metrics_type_timestamp ON ai_system_metrics (metric_type, timestamp);
```

---

## حالة النظام الحالية

### ✅ مكتملة بنسبة 100%
- **نظام إدارة المشاريع**: 8 جداول
- **نظام إدارة العمال**: 6 جداول  
- **نظام المواد والمشتريات**: 4 جداول
- **نظام الإشعارات**: 6 جداول
- **نظام المصادقة المتقدم**: 9 جداول
- **النظام الذكي**: 4 جداول
- **نظام السياسات الأمنية**: 4 جداول
- **الأنظمة المساعدة**: 5 جداول

### إجمالي: 46 جدول في النظام الأساسي + 23 جدول Supabase = **69 جدول**

---

## معلومات تقنية إضافية

### نوع قاعدة البيانات
- **PostgreSQL 15+** عبر Supabase
- **ORM**: Drizzle ORM
- **Migration Tool**: drizzle-kit

### اتصال قاعدة البيانات
- **Development**: PostgreSQL محلي (Replit)
- **Production**: Supabase PostgreSQL
- **Connection Pooling**: مُفعل تلقائياً

### نسخ احتياطية
- **تلقائية**: كل 24 ساعة
- **يدوية**: عند الطلب
- **Point-in-time recovery**: متوفر

---

*آخر تحديث: 30 أغسطس 2025*
*إعداد: النظام الذكي لإدارة المشاريع الإنشائية*