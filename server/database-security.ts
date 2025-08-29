/**
 * 🔐 نظام الحماية المتقدم لقاعدة البيانات
 * 
 * ⚠️ تحذير صارم: هذا النظام يمنع منعاً باتاً استخدام أي قاعدة بيانات غير Supabase
 * 🛡️ الحماية تشمل: منع قواعد البيانات المحلية، Neon، Replit PostgreSQL، وأي خدمة أخرى
 * ✅ المسموح: Supabase PostgreSQL السحابية فقط (wibtasmyusxfqxxqekks.supabase.co)
 */

export class DatabaseSecurityGuard {
  private static readonly ALLOWED_SUPABASE_PROJECT = 'wibtasmyusxfqxxqekks';
  private static readonly ALLOWED_HOSTS = [
    'aws-0-us-east-1.pooler.supabase.com',
    'supabase.com'
  ];

  /**
   * فحص صارم لضمان استخدام Supabase فقط
   */
  static validateDatabaseConnection(connectionString: string): void {
    console.log('🔐 بدء فحص أمني شامل لقاعدة البيانات...');
    
    // فحص وجود رابط الاتصال
    if (!connectionString) {
      throw new Error('❌ رابط قاعدة البيانات مفقود!');
    }

    // قائمة الخدمات المحظورة
    const FORBIDDEN_SERVICES = [
      'replit', 'localhost', '127.0.0.1', 'local', 'neon', 'postgres.js',
      'railway', 'heroku', 'planetscale', 'cockroachdb', 'mongodb'
    ];

    // فحص الخدمات المحظورة
    const forbiddenService = FORBIDDEN_SERVICES.find(service => 
      connectionString.toLowerCase().includes(service)
    );
    
    if (forbiddenService) {
      console.error(`🚨 خطر أمني: محاولة استخدام خدمة محظورة: ${forbiddenService}`);
      throw new Error(
        `❌ خطأ أمني حرج: استخدام ${forbiddenService} محظور!\n` +
        `🔐 يجب استخدام Supabase السحابية فقط`
      );
    }

    // فحص أن الرابط يحتوي على مشروع Supabase المحدد
    if (!connectionString.includes(this.ALLOWED_SUPABASE_PROJECT)) {
      throw new Error(
        `❌ خطأ أمني: مشروع Supabase غير صحيح!\n` +
        `🔐 يجب استخدام مشروع: ${this.ALLOWED_SUPABASE_PROJECT}.supabase.co فقط`
      );
    }

    // فحص أن الرابط يحتوي على نطاق Supabase صحيح
    const hasValidHost = this.ALLOWED_HOSTS.some(host => 
      connectionString.includes(host)
    );

    if (!hasValidHost) {
      throw new Error(
        `❌ خطأ أمني: نطاق قاعدة البيانات غير صحيح!\n` +
        `🔐 يجب استخدام Supabase السحابية فقط`
      );
    }

    console.log('✅ فحص الأمان مكتمل - قاعدة البيانات Supabase صحيحة');
  }

  /**
   * مراقبة مستمرة لمتغيرات البيئة المحظورة
   */
  static monitorEnvironmentVariables(): void {
    const FORBIDDEN_ENV_VARS = [
      'DATABASE_URL', 'PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGDATABASE',
      'NEON_DATABASE_URL', 'POSTGRES_URL', 'DB_URL'
    ];

    const detectedVars = FORBIDDEN_ENV_VARS.filter(varName => 
      process.env[varName] && process.env[varName] !== ''
    );

    if (detectedVars.length > 0) {
      console.warn(`⚠️ تحذير: متغيرات بيئة محلية محتملة مكتشفة: ${detectedVars.join(', ')}`);
      console.warn('🔐 سيتم تجاهلها واستخدام Supabase السحابية فقط');
      
      // تفريغ المتغيرات المحظورة لضمان عدم استخدامها
      detectedVars.forEach(varName => {
        delete process.env[varName];
      });
    }
  }

  /**
   * تسجيل معلومات الاتصال الآمن
   */
  static logSecureConnectionInfo(): void {
    console.log('🔐 ═══ معلومات اتصال قاعدة البيانات الآمن ═══');
    console.log('✅ قاعدة البيانات: Supabase PostgreSQL السحابية');
    console.log('✅ المشروع: wibtasmyusxfqxxqekks.supabase.co');
    console.log('✅ المنطقة: AWS US-East-1');
    console.log('⛔ قواعد البيانات المحلية: محظورة تماماً');
    console.log('⛔ خدمات أخرى: محظورة (Neon, Replit PostgreSQL, إلخ)');
    console.log('🛡️ مستوى الحماية: متقدم');
  }

  /**
   * فحص دوري للأمان
   */
  static startSecurityMonitoring(): void {
    // فحص دوري كل 30 دقيقة
    setInterval(() => {
      this.monitorEnvironmentVariables();
      console.log('🔍 فحص دوري للأمان مكتمل');
    }, 30 * 60 * 1000);
  }
}