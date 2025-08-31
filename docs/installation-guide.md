# 🚀 دليل التثبيت والإعداد

## 📋 متطلبات النظام

### البرامج المطلوبة
- **Node.js**: الإصدار 18.0 أو أحدث
- **npm**: مدير الحزم (يأتي مع Node.js)
- **Git**: لتنزيل المشروع
- **متصفح حديث**: Chrome, Firefox, Safari, Edge

### متطلبات النظام
- **الذاكرة**: 4GB RAM كحد أدنى، 8GB مستحسن
- **التخزين**: 2GB مساحة حرة
- **الشبكة**: اتصال إنترنت مستقر

## 🔧 التثبيت خطوة بخطوة

### 1. إعداد البيئة الأساسية

#### تثبيت Node.js
```bash
# للتحقق من الإصدار المثبت
node --version
npm --version

# إذا لم يكن مثبت، قم بتنزيله من:
# https://nodejs.org/
```

#### تثبيت Git
```bash
# للتحقق من Git
git --version

# للتثبيت على Ubuntu/Debian
sudo apt update
sudo apt install git

# للتثبيت على macOS (باستخدام Homebrew)
brew install git
```

### 2. تنزيل المشروع

```bash
# تنزيل المشروع
git clone [repository-url]
cd project-name

# أو إذا كان المشروع في Replit
# افتح المشروع مباشرة في Replit
```

### 3. تثبيت الحزم والتبعيات

```bash
# تثبيت جميع الحزم المطلوبة
npm install

# التحقق من التثبيت الناجح
npm list --depth=0
```

### 4. إعداد قاعدة البيانات

#### إنشاء حساب Supabase
1. اذهب إلى [supabase.com](https://supabase.com)
2. أنشئ حساباً جديداً أو سجل دخولك
3. أنشئ مشروعاً جديداً
4. احصل على:
   - **SUPABASE_URL**: رابط المشروع
   - **SUPABASE_ANON_KEY**: مفتاح الوصول العام

#### إعداد متغيرات البيئة
```bash
# إنشاء ملف .env
cp .env.example .env

# تحرير الملف وإضافة البيانات
# SUPABASE_URL=your-supabase-url
# SUPABASE_ANON_KEY=your-supabase-anon-key
# JWT_ACCESS_SECRET=your-jwt-secret
# JWT_REFRESH_SECRET=your-refresh-secret
# ENCRYPTION_KEY=your-encryption-key
```

### 5. إنشاء جداول قاعدة البيانات

```bash
# تشغيل هجرة قاعدة البيانات
npm run db:migrate

# أو إذا كانت تعمل تلقائياً عند البداية
npm run dev
```

### 6. تشغيل المشروع

```bash
# تشغيل في بيئة التطوير
npm run dev

# المشروع سيعمل على:
# Frontend: http://localhost:5000
# Backend API: http://localhost:5000/api
```

## 🔐 إعداد نظام المصادقة

### توليد المفاتيح الأمنية

```bash
# توليد JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# توليد Encryption Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### إعداد المصادقة الثنائية (اختياري)

```bash
# تفعيل MFA في الإعدادات
# يتطلب: TOTP_SECRET في متغيرات البيئة
```

## 📱 إعداد التطبيق المحمول (اختياري)

### متطلبات إضافية
```bash
# تثبيت Expo CLI
npm install -g expo-cli
npm install -g @expo/cli

# تثبيت EAS CLI للبناء
npm install -g eas-cli
```

### تشغيل التطبيق المحمول
```bash
# الانتقال إلى مجلد التطبيق المحمول
cd mobile-app

# تثبيت الحزم
npm install

# تشغيل في بيئة التطوير
npx expo start
```

## ✅ التحقق من التثبيت

### اختبار شامل للنظام

```bash
# تشغيل الاختبارات
npm test

# فحص الأخطاء
npm run lint

# فحص الأنواع
npm run type-check
```

### التحقق من الوظائف الأساسية

1. **الواجهة الرئيسية**: تأكد من ظهور لوحة التحكم
2. **قاعدة البيانات**: تحقق من الاتصال والبيانات
3. **المصادقة**: جرب تسجيل الدخول/الخروج
4. **التقارير**: اختبر إنتاج تقرير بسيط
5. **التصدير**: جرب تصدير Excel أو PDF

### علامات النجاح

```bash
# رسائل النجاح المتوقعة في الكونسول:
✅ قاعدة بيانات Supabase متصلة وجاهزة
✅ تم العثور على 53 جدول في قاعدة بيانات Supabase
✅ جميع الجداول المطلوبة موجودة في Supabase
✅ تم تفعيل نظام المصادقة المتقدم بنجاح
🚀 serving on port 5000
```

## 🔧 حل مشاكل التثبيت الشائعة

### مشكلة 1: فشل في تثبيت الحزم
```bash
# حل المشكلة
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### مشكلة 2: خطأ في الاتصال بقاعدة البيانات
```bash
# تحقق من متغيرات البيئة
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# تأكد من صحة الروابط والمفاتيح
```

### مشكلة 3: لا يعمل المنفذ 5000
```bash
# تغيير المنفذ
PORT=3000 npm run dev

# أو قتل العمليات المتضاربة
sudo lsof -ti:5000 | xargs kill -9
```

### مشكلة 4: خطأ في النظام المحمول
```bash
# تنظيف الكاش
npx expo start --clear

# إعادة تثبيت Expo
npm uninstall expo-cli
npm install -g @expo/cli
```

## 📊 مراقبة الأداء بعد التثبيت

### مقاييس الأداء المتوقعة
- **وقت تحميل الصفحة الرئيسية**: < 2 ثانية
- **وقت استعلام قاعدة البيانات**: < 0.2 ثانية  
- **حجم الذاكرة المستخدمة**: < 500MB
- **استجابة API**: < 100ms

### أدوات المراقبة
```bash
# مراقبة استخدام الذاكرة
npm run monitor:memory

# مراقبة أداء قاعدة البيانات
npm run monitor:db

# تحليل حجم الملفات
npm run analyze:bundle
```

## 🎯 الخطوات التالية

بعد التثبيت الناجح:

1. **اقرأ دليل المستخدم**: [user-manual.md](./user-manual.md)
2. **تعرف على النظام**: جرب الوظائف الأساسية
3. **أضف بيانات تجريبية**: لاختبار جميع المميزات
4. **اطلع على الدليل التقني**: للمطورين [developer-guide.md](./developer-guide.md)
5. **راجع الأسئلة الشائعة**: [faq.md](./faq.md)

## 📞 الدعم التقني

إذا واجهت أي مشاكل:
- راجع [دليل حل المشاكل](./troubleshooting.md)
- اطلع على [الأسئلة الشائعة](./faq.md)
- تحقق من سجل التغييرات [changelog.md](./changelog.md)

---

**آخر تحديث**: 27 أغسطس 2025  
**مستوى الصعوبة**: مبتدئ إلى متوسط  
**الوقت المطلوب**: 15-30 دقيقة