# سكربتات نظام مراقبة المخطط - دليل الاستخدام السريع

## الأوامر السريعة ⚡

```bash
# 1. توليد المخطط المتوقع من الكود
./scripts/run-commands.sh gen:expected

# 2. فحص المطابقة مع قاعدة البيانات
./scripts/run-commands.sh check:schema

# 3. فحص CI شامل (للاستخدام في GitHub Actions)
./scripts/run-commands.sh schema:ci

# 4. نسخة احتياطية كاملة
./scripts/run-commands.sh backup:full

# 5. إعداد نظام التدقيق
./scripts/run-commands.sh setup:audit
```

## الملفات والوظائف 📁

### `generate-expected-schema.ts`
**ماذا يفعل**: يقرأ ملف `shared/schema.ts` وينتج مخطط JSON متوقع

**متى تستخدمه**:
- عند إضافة جداول جديدة للكود
- قبل مقارنة المخططات
- كجزء من سير العمل CI/CD

**الإخراج**: `expected_schema.json` (~112KB)

```bash
# تشغيل مباشر
npx tsx scripts/generate-expected-schema.ts

# أو استخدام الأمر السريع
./scripts/run-commands.sh gen:expected
```

### `compare-expected-vs-db.ts`
**ماذا يفعل**: يقارن المخطط المتوقع مع قاعدة البيانات الفعلية

**متى تستخدمه**:
- للتحقق من التطابق بين الكود وقاعدة البيانات
- قبل الإصدارات الجديدة
- عند الشك في وجود انحراف

**الإخراج**: `schema_comparison_report.json` (~175KB)

```bash
# تشغيل مباشر  
npx tsx scripts/compare-expected-vs-db.ts

# أو استخدام الأمر السريع
./scripts/run-commands.sh check:schema
```

### `backup-database.ts`
**ماذا يفعل**: ينشئ نسخة احتياطية شاملة من قاعدة البيانات

**متى تستخدمه**:
- قبل إجراء تعديلات كبيرة
- قبل تشغيل Migration
- للنسخ الاحتياطية الدورية

```bash
# نسخة احتياطية كاملة
npx tsx scripts/backup-database.ts

# أو استخدام الأمر السريع  
./scripts/run-commands.sh backup:full
```

### `setup-ddl-audit.ts`
**ماذا يفعل**: يعد نظام تدقيق لرصد تغييرات المخطط

**متى تستخدمه**:
- عند إعداد النظام لأول مرة
- لتفعيل المراقبة التلقائية للتغييرات
- في بيئة الإنتاج للأمان

```bash
# إعداد التدقيق
npx tsx scripts/setup-ddl-audit.ts

# أو استخدام الأمر السريع
./scripts/run-commands.sh setup:audit
```

### `run-commands.sh`
**ماذا يفعل**: واجهة موحدة لجميع الأوامر مع معالجة الأخطاء

**لماذا نستخدمه**:
- سهولة الاستخدام
- معالجة أخطاء موحدة  
- أذونات صحيحة تلقائياً

## قراءة التقارير 📊

### نتائج المقارنة الجيدة ✅
```
📋 جداول متطابقة: 37
❌ جداول مفقودة: 0  
➕ جداول إضافية: 0
📊 الحالة: ✅ مطابق تماماً
```

### نتائج تشير لانحراف ⚠️
```
📋 جداول متطابقة: 35
❌ جداول مفقودة: 2
➕ جداول إضافية: 1  
📊 الحالة: ⚠️ انحراف مكتشف
```

## استكشاف الأخطاء 🔧

### خطأ في الاتصال
```bash
❌ خطأ: Error connecting to database
```
**الحل**: تحقق من متغير `DATABASE_URL`

### خطأ في الأذونات
```bash  
❌ خطأ: permission denied
```
**الحل**: تأكد من صلاحيات قاعدة البيانات

### ملف غير موجود
```bash
❌ خطأ: ENOENT: no such file
```
**الحل**: تشغيل `gen:expected` أولاً

## متطلبات البيئة 🌍

```bash
# متغيرات البيئة المطلوبة
DATABASE_URL=postgresql://user:pass@host:port/db

# الاعتماديات المطلوبة
npm install @neondatabase/serverless ws typescript
```

## سير العمل المقترح 🔄

### للتطوير اليومي:
1. `gen:expected` - توليد المخطط المتوقع
2. `check:schema` - فحص المطابقة
3. إصلاح أي انحرافات مكتشفة
4. إعادة الفحص للتأكد

### قبل الإصدار:
1. `backup:full` - نسخة احتياطية  
2. `schema:ci` - فحص شامل
3. مراجعة التقرير التفصيلي
4. معالجة أي مشاكل

### إعداد أولي:
1. `setup:audit` - تفعيل التدقيق
2. `gen:expected` - المخطط الأساسي
3. `check:schema` - خط الأساس
4. دمج مع CI/CD

## نصائح هامة 💡

- **تشغيل دوري**: فحص يومي أو أسبوعي
- **قبل Migration**: نسخ احتياطية دائماً
- **مراجعة التقارير**: تحليل التفاصيل وليس فقط النتيجة
- **البيئات المتعددة**: فحص جميع البيئات (dev/staging/prod)

---
*للحصول على التوثيق الشامل، راجع: `docs/SCHEMA_MONITORING_SYSTEM.md`*