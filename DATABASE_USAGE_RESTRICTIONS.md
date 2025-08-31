# 🚫 موانع استخدام قاعدة البيانات المحلية

## ⚠️ تحذير صارم

هذا النظام **ممنوع منعاً باتاً** من استخدام أي قاعدة بيانات محلية أو خدمات أخرى غير Supabase.

## ✅ المسموح

- **Supabase PostgreSQL السحابية فقط**
- المشروع: `wibtasmyusxfqxxqekks.supabase.co`
- المنطقة: AWS US-East-1

## ❌ محظور تماماً

### خدمات قواعد البيانات
- ❌ Replit PostgreSQL (المحلية)
- ❌ Neon Database
- ❌ Railway PostgreSQL
- ❌ Heroku PostgreSQL
- ❌ PlanetScale
- ❌ CockroachDB
- ❌ MongoDB
- ❌ أي خدمة `localhost` أو `127.0.0.1`

### أوامر محظورة
- ❌ `npm run db:push` (استخدم Supabase Studio بدلاً من ذلك)
- ❌ `createdb`, `dropdb`
- ❌ `psql` مع قواعد بيانات محلية
- ❌ `pg_dump` للقواعد المحلية
- ❌ `postgres` server محلي

### متغيرات البيئة محظورة
- ❌ `DATABASE_URL=postgresql://localhost:...`
- ❌ `PGHOST=localhost`
- ❌ `PGPORT=5432`
- ❌ `NEON_DATABASE_URL`
- ❌ `POSTGRES_URL`

## 🔧 الاستخدام الصحيح

### إعداد قاعدة البيانات
```bash
# ✅ استخدم Supabase Studio للتغييرات
# https://wibtasmyusxfqxxqekks.supabase.co

# ✅ للنشر استخدم drizzle.config.json
drizzle-kit push --config=drizzle.config.json
```

### متغيرات البيئة الصحيحة
```bash
# ✅ استخدم هذه فقط
SUPABASE_URL=https://wibtasmyusxfqxxqekks.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

## 🛡️ أنظمة الحماية المُطبقة

### 1. DatabaseSecurityGuard
- مراقبة اتصالات قاعدة البيانات
- منع الخدمات المحظورة
- تنظيف متغيرات البيئة الضارة

### 2. DatabaseRestrictionGuard
- منع تنفيذ الأوامر المحظورة
- مراقبة العمليات المشبوهة
- فحص دوري للأمان

### 3. ملفات الحماية
- `server/database-security.ts`
- `server/database-restrictions.ts`
- `tools/drizzle.config.ts` (محمي)
- `.env.restrictions` (قواعد الموانع)

## 🚨 عواقب المخالفة

عند محاولة استخدام قاعدة بيانات محلية:

1. **إيقاف فوري للنظام**
2. **رسائل خطأ صارمة**
3. **تسجيل في سجل الأمان**
4. **حذف متغيرات البيئة الضارة**

## 📞 للمساعدة

إذا كنت بحاجة لتعديل قاعدة البيانات:

1. **استخدم Supabase Studio**: https://wibtasmyusxfqxxqekks.supabase.co
2. **للطوارئ**: اتصل بمدير النظام
3. **للتطوير**: استخدم Supabase CLI الرسمي

---

**آخر تحديث**: 30 أغسطس 2025  
**حالة النظام**: محمي بالكامل ضد قواعد البيانات المحلية