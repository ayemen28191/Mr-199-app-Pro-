# 📱 دليل بناء التطبيق - نظام إدارة المشاريع الإنشائية

## 🚀 الطرق المتاحة لبناء التطبيق

### ✅ الطريقة الأولى: البناء السحابي (الأسهل - موصى بها)

#### المتطلبات:
- حساب Expo مجاني على [expo.dev](https://expo.dev)
- البيانات المتوفرة: `Ayemen28191@gmail.com`

#### الخطوات:
```bash
# 1. تثبيت EAS CLI
npm install -g eas-cli

# 2. الانتقال لمجلد التطبيق
cd mobile-app

# 3. تسجيل الدخول
eas login
# استخدم البيانات: Ayemen28191@gmail.com

# 4. إعداد المشروع (لأول مرة فقط)
eas build:configure

# 5. بناء APK للاختبار
eas build --platform android --profile preview

# 6. بناء APK للإنتاج
eas build --platform android --profile production
```

### 🛠️ الطريقة الثانية: البناء المحلي

#### المتطلبات:
- Java JDK 17 أو أحدث
- Android SDK
- Android Studio أو command line tools

#### الخطوات:
```bash
# 1. تثبيت Java JDK
# Windows: تحميل من Oracle أو OpenJDK
# macOS: brew install openjdk@17
# Linux: sudo apt install openjdk-17-jdk

# 2. إعداد متغيرات البيئة
export JAVA_HOME=/path/to/java
export ANDROID_HOME=/path/to/android-sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# 3. إنشاء ملفات البناء
cd mobile-app
npx expo prebuild --clean

# 4. بناء APK
cd android
./gradlew assembleRelease

# 5. العثور على APK في:
# android/app/build/outputs/apk/release/app-release.apk
```

### 🌐 الطريقة الثالثة: GitHub Actions (أوتوماتيكي)

سيتم إنشاء APK تلقائياً عند كل تحديث:

```yaml
# .github/workflows/build-android.yml
name: Build Android APK
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'
      
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        run: |
          cd mobile-app
          npm install
      
      - name: Build APK
        run: |
          cd mobile-app
          eas build --platform android --profile preview --non-interactive
```

## 📦 معلومات التطبيق المبني

### تفاصيل التطبيق:
- **الاسم**: نظام إدارة المشاريع الإنشائية
- **Package**: `com.constructionmanagement.mobile`
- **الإصدار**: 1.0.0
- **الحد الأدنى Android**: 5.0 (API 21)
- **LogRocket**: مفعل للمراقبة

### الميزات المضمنة:
- ✅ واجهة عربية كاملة مع RTL
- ✅ قاعدة بيانات Supabase (40 جدول)
- ✅ 5 شاشات رئيسية متكاملة
- ✅ تتبع المشاريع والعمال والموردين
- ✅ نظام تحليلات متقدم
- ✅ تصميم Material Design

### حجم التطبيق المتوقع:
- **APK**: ~15-25 MB
- **AAB**: ~12-18 MB
- **مثبت**: ~30-45 MB

## 🔧 حل المشاكل الشائعة

### مشكلة Java:
```bash
# فحص إصدار Java
java -version

# إذا لم يكن مثبتاً، ثبته من:
# https://adoptium.net/
```

### مشكلة Android SDK:
```bash
# تحميل Android Studio من:
# https://developer.android.com/studio

# أو تثبيت command line tools فقط
```

### مشكلة EAS Login:
```bash
# إذا فشل تسجيل الدخول
eas logout
eas login

# أو استخدم token
eas login --token YOUR_EXPO_TOKEN
```

## 📞 الدعم الفني

في حالة واجهت أي مشاكل:
1. تأكد من تثبيت جميع المتطلبات
2. راجع الأخطاء في السجلات
3. تحقق من اتصال الإنترنت للبناء السحابي
4. تأكد من صحة بيانات تسجيل الدخول

## 🎯 النتيجة النهائية

بعد اكتمال البناء ستحصل على:
- ملف APK جاهز للتثبيت
- رابط تحميل (في حالة البناء السحابي)
- تطبيق كامل جاهز للاستخدام الإنتاجي