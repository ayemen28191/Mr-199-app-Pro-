# قائمة فحص التنظيف والتحسين - نظام إدارة المشاريع الإنشائية

## ✅ المُنجز

### الفحوصات الأساسية
- [x] **TypeScript Build**: إصلاح أخطاء البناء (حذف server/storage-broken.ts)
- [x] **ESLint Setup**: إنشاء eslint.config.js محدث
- [x] **Browserslist**: تحديث قاعدة بيانات المتصفحات
- [x] **سكربت التدقيق**: تنفيذ repo-audit.sh بنجاح

### الملفات والسكربتات المُنشأة
- [x] `tools/check-deps-usage.sh` - فحص استخدام الحزم
- [x] `.github/workflows/ci.yml` - إعداد CI/CD
- [x] `audit-report.md` - التقرير الشامل
- [x] `تقرير_التدقيق_التنفيذي.md` - الملخص التنفيذي
- [x] `ملخص_العمل_المنجز.md` - ملخص الإنجازات

---

## 🔄 الخطوات التالية (حسب الأولوية)

### أولوية فورية (0-2 أيام)
- [ ] **فحص الحزم**: مراجعة نتائج `audit-results/deps-usage.txt`
- [ ] **إزالة الحزم غير المستخدمة**: بعد التحقق اليدوي
- [ ] **أرشفة الأصول**: نقل الصور غير المستخدمة إلى `archive/`
- [ ] **تشغيل الاختبارات**: التأكد من عدم كسر أي وظيفة

### أولوية قصيرة المدى (3-7 أيام)
- [ ] **مراجعة Orphaned Files**: فحص ملفات madge-orphans.txt
- [ ] **اختبار الأداء**: بعد التنظيف
- [ ] **تفعيل CI**: اختبار الـ workflow الجديد

### أولوية متوسطة (أسبوعان)
- [ ] **أتمتة التدقيق**: جدولة شهرية
- [ ] **مراقبة الاستقرار**: بعد التغييرات

---

## 📋 الحزم المرشحة للمراجعة

### احتمالية عالية للحذف
- `@jridgewell/trace-mapping` - أداة تطوير قد لا تُستخدم
- `connect-pg-simple` - إذا لم نستخدم PostgreSQL sessions
- `memorystore` - إذا لم نستخدم memory-based sessions
- `tw-animate-css` - إذا لم نستخدم Tailwind animations

### احتمالية متوسطة للحذف
- `framer-motion` - مكتبة animation قد تكون غير مستخدمة
- `next-themes` - إذا لم نطبق نمط الضوء/الظلام
- `openid-client` - إذا لم نستخدم OpenID authentication
- `react-icons` - إذا استخدمنا lucide-react فقط

### تحتاج فحص دقيق
- `passport` + `passport-local` - نظام المصادقة
- `xlsx` - تصدير Excel (قد تُستخدم ديناميكياً)

---

## 🧪 أوامر الاختبار

```bash
# فحص TypeScript
npx tsc --noEmit

# فحص ESLint
npx eslint . --ext .js,.jsx,.ts,.tsx

# بناء المشروع
npm run build

# تشغيل الاختبارات
npm test

# فحص استخدام الحزم
bash tools/check-deps-usage.sh

# تحديث browserslist
npx update-browserslist-db@latest
```

---

## ⚠️ تحذيرات مهمة

### قبل حذف أي حزمة:
1. **ابحث في الكود**: استخدم سكربت check-deps-usage.sh
2. **اختبر المشروع**: تأكد من عمل جميع الوظائف
3. **فحص الاستيرادات الديناميكية**: `require()` أو `import()`
4. **مراجعة ملفات الإعداد**: vite.config.ts, tailwind.config.ts

### قبل أرشفة ملفات:
1. **تأكد من عدم الاستخدام**: ابحث عن المراجع
2. **انقل إلى archive/**: لا تحذف مباشرة
3. **وثق السبب**: في commit message

---

## 📊 مؤشرات النجاح

- ✅ `npx tsc --noEmit` بدون أخطاء
- ✅ التطبيق يعمل بشكل طبيعي
- ✅ انخفاض حجم node_modules
- ✅ تحسن سرعة التثبيت
- ✅ CI/CD يعمل بدون أخطاء

---

## 📞 الاتصال والدعم

إذا واجهت أي مشكلة:
1. راجع `audit-report.md` للتفاصيل الفنية
2. تحقق من `audit-results/` للبيانات الخام
3. استخدم `git stash` قبل التغييرات الكبيرة
4. احتفظ بنسخ احتياطية في `archive/`