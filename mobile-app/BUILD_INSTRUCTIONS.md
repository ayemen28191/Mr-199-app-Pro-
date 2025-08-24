# تعليمات بناء التطبيق الموبايل - نظام إدارة المشاريع الإنشائية

## نظرة عامة
هذا التطبيق الموبايل مطور بـ React Native مع Expo، ويوفر نفس وظائف التطبيق الويب مع واجهة محسنة للأجهزة المحمولة.

## المتطلبات الأساسية

### البرامج المطلوبة
```bash
# 1. Node.js (الإصدار 18 أو أحدث)
node --version  # يجب أن يكون 18.0.0 أو أحدث

# 2. تثبيت Expo CLI
npm install -g @expo/cli

# 3. تثبيت EAS CLI (للبناء السحابي)
npm install -g eas-cli

# 4. اختياري: Android Studio للتطوير المحلي
```

### إعداد البيئة التطويرية

#### 1. تثبيت التبعيات
```bash
cd mobile-app
npm install
# أو
pnpm install
```

#### 2. التحقق من ملف البيئة
تأكد من وجود ملف `.env` مع الإعدادات التالية:
```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://wibtasmyusxfqxxqekks.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production
```

## طرق تشغيل التطبيق

### 1. التطوير والاختبار (Expo Go)
```bash
# بدء تشغيل التطبيق في وضع التطوير
npx expo start

# للتشغيل على Android مباشرة
npx expo start --android

# للتشغيل على iOS مباشرة (على Mac فقط)
npx expo start --ios

# للتشغيل في المتصفح
npx expo start --web
```

**تطبيق Expo Go:**
1. حمل تطبيق Expo Go من متجر التطبيقات
2. امسح الـ QR Code الذي يظهر في الترمينال
3. التطبيق سيفتح مباشرة

### 2. البناء والتوزيع

#### أ) بناء APK للاختبار (Preview Build)
```bash
# تسجيل الدخول إلى EAS
eas login

# إنشاء APK للاختبار
eas build --platform android --profile preview

# تحميل APK بعد انتهاء البناء
eas build:download
```

#### ب) بناء APK للإنتاج
```bash
# بناء APK للإنتاج
eas build --platform android --profile production

# أو بناء AAB لمتجر Google Play
eas build --platform android --profile production
```

#### ج) البناء المحلي (اختياري)
```bash
# إنشاء APK محلياً (يتطلب Android Studio)
npx expo run:android --variant release
```

## بنية المشروع

```
mobile-app/
├── src/
│   ├── components/        # المكونات المشتركة
│   ├── screens/          # شاشات التطبيق
│   ├── navigation/       # إعداد التنقل
│   ├── context/         # سياق React للحالة
│   ├── services/        # خدمات API و Supabase
│   ├── types/           # تعريفات TypeScript
│   └── utils/           # الأدوات المساعدة
├── assets/              # الصور والأيقونات
├── App.tsx             # نقطة دخول التطبيق
├── app.json            # إعدادات Expo
├── eas.json            # إعدادات البناء
├── package.json        # التبعيات والنصوص
└── .env               # متغيرات البيئة
```

## الشاشات المتاحة

### الشاشات الأساسية
1. **لوحة التحكم (Dashboard)** - إحصائيات شاملة ومعلومات المشروع
2. **المشاريع (Projects)** - إدارة وعرض المشاريع
3. **العمال (Workers)** - إدارة العمال والحضور والمرتبات
4. **الموردين (Suppliers)** - إدارة حسابات الموردين والمدفوعات
5. **المزيد (More)** - إعدادات إضافية وميزات أخرى

### الشاشات المتقدمة
- **المصروفات اليومية** - تتبع وإدارة المصروفات
- **شراء المواد** - إدارة مشتريات مواد البناء
- **إدارة المعدات** - تتبع الأدوات والمعدات
- **التقارير** - تقارير مالية وإحصائية شاملة
- **حضور العمال** - نظام تسجيل الحضور والغياب

## قاعدة البيانات

التطبيق متصل بنفس قاعدة بيانات Supabase المستخدمة في التطبيق الويب:
- **عدد الجداول:** 40 جدول
- **المزامنة:** في الوقت الفعلي مع التطبيق الويب
- **البيانات:** جميع البيانات مشتركة بين النسختين

## الميزات المتقدمة

### دعم اللغة العربية
- **اتجاه RTL:** دعم كامل للكتابة من اليمين لليسار
- **الخطوط:** خطوط عربية محسنة للقراءة
- **الواجهة:** جميع النصوص باللغة العربية

### الأداء والتحليلات
- **LogRocket:** مراقبة الأخطاء والأداء
- **Analytics:** تتبع استخدام التطبيق
- **التحديثات:** نظام التحديثات التلقائية

## حل المشاكل الشائعة

### مشاكل البناء
```bash
# مشكلة في التبعيات
rm -rf node_modules package-lock.json
npm install

# مشكلة في Metro bundler
npx expo start --clear

# مشكلة في Android build
./gradlew clean
```

### مشاكل الاتصال
- تأكد من صحة متغيرات البيئة في `.env`
- تحقق من اتصال الإنترنت
- تأكد من تشغيل Supabase

### مشاكل الأذونات
```bash
# إذن تشغيل gradlew على Linux/Mac
chmod +x android/gradlew
```

## نصائح التطوير

### اختبار التطبيق
1. **Expo Go:** سريع للتطوير والاختبار
2. **Development Build:** للميزات المتقدمة
3. **APK Release:** للاختبار النهائي

### الأداء
- استخدم `React.memo` للمكونات الثقيلة
- تحسين الصور والأصول
- استخدام lazy loading للشاشات الكبيرة

### الأمان
- لا تعرض API keys في الكود
- استخدم متغيرات البيئة للإعدادات الحساسة
- تحقق من صحة البيانات قبل الإرسال

## الدعم والمساعدة

### الموارد المفيدة
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Supabase Documentation](https://supabase.com/docs)

### إصدارات التبعيات الحالية
- Expo SDK: 52.0
- React Native: 0.76.3
- Supabase: 2.39.0

---

## التحديثات والصيانة

هذا التطبيق متزامن مع التطبيق الويب ويتم تحديثه تلقائياً. لإجراء تحديثات:

1. تحديث التبعيات: `npm update`
2. اختبار التطبيق: `npx expo start`
3. بناء إصدار جديد: `eas build`
4. توزيع التحديث: `eas update`

تاريخ آخر تحديث: 24 أغسطس 2025