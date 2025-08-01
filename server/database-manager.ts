import { db } from './db';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';

// ⚠️ تحذير صارم: هذا الملف للتحقق من قاعدة بيانات Supabase السحابية فقط
// ⛔ ممنوع منعاً باتاً إنشاء أو استخدام قاعدة بيانات محلية
// ✅ التطبيق يعتمد كلياً على قاعدة بيانات Supabase PostgreSQL السحابية

interface DatabaseCheckResult {
  success: boolean;
  message: string;
  details?: any;
}

class DatabaseManager {
  
  /**
   * فحص الاتصال بقاعدة بيانات Supabase السحابية
   */
  async checkConnection(): Promise<DatabaseCheckResult> {
    try {
      console.log('🔍 جاري فحص الاتصال بقاعدة بيانات Supabase...');
      
      const result = await db.execute(sql`SELECT 1 as test`);
      
      console.log('✅ تم الاتصال بقاعدة بيانات Supabase بنجاح');
      return {
        success: true,
        message: 'الاتصال بقاعدة بيانات Supabase ناجح',
        details: result
      };
    } catch (error) {
      console.error('❌ فشل الاتصال بقاعدة بيانات Supabase:', error);
      return {
        success: false,
        message: 'فشل الاتصال بقاعدة بيانات Supabase',
        details: error
      };
    }
  }

  /**
   * فحص وجود الجداول المطلوبة في Supabase
   */
  async checkTablesExist(): Promise<DatabaseCheckResult> {
    try {
      console.log('🔍 جاري فحص الجداول في قاعدة بيانات Supabase...');
      
      const tablesQuery = await db.execute(sql`
        SELECT tablename as table_name 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
      `);
      
      // استخراج أسماء الجداول من النتيجة
      let existingTables: string[] = [];
      console.log('🔍 نتيجة استعلام الجداول الخام:', tablesQuery);
      
      // النتيجة في tablesQuery.rows وليس في tablesQuery مباشرة
      if (tablesQuery && tablesQuery.rows && Array.isArray(tablesQuery.rows)) {
        existingTables = tablesQuery.rows.map((row: any) => {
          return row.table_name || row.tablename || row.TABLE_NAME || row.TABLENAME;
        }).filter(Boolean);
      }
      
      console.log('📋 الجداول الموجودة في Supabase:', existingTables);
      
      // إذا كانت الجداول موجودة، لا تظهر رسائل تحذيرية
      if (existingTables.length > 0) {
        console.log('✅ تم العثور على', existingTables.length, 'جدول في قاعدة بيانات Supabase');
      }
      
      const requiredTables = [
        'projects',
        'workers', 
        'fund_transfers',
        'worker_attendance',
        'materials',
        'material_purchases',
        'transportation_expenses',
        'daily_expense_summaries',
        'worker_transfers',
        'worker_misc_expenses'
      ];
      
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));
      
      if (missingTables.length > 0) {
        console.log('⚠️ الجداول المفقودة في قاعدة بيانات Supabase:', missingTables);
        console.log('⛔ تحذير: يجب إنشاء الجداول في قاعدة بيانات Supabase السحابية مباشرة');
        console.log('❌ لا يمكن إنشاء جداول محلية - التطبيق يستخدم Supabase فقط');
        return {
          success: false,
          message: `الجداول التالية مفقودة في Supabase: ${missingTables.join(', ')}`,
          details: { existingTables, missingTables, requiredTables }
        };
      }
      
      console.log('✅ جميع الجداول المطلوبة موجودة في Supabase');
      return {
        success: true,
        message: 'جميع الجداول المطلوبة موجودة في Supabase',
        details: { existingTables, requiredTables }
      };
    } catch (error) {
      console.error('❌ خطأ في فحص جداول Supabase:', error);
      return {
        success: false,
        message: 'خطأ في فحص جداول Supabase',
        details: error
      };
    }
  }

  /**
   * ✅ فحص قاعدة بيانات Supabase السحابية
   * ⛔ لا يتم إنشاء أي جداول محلية - Supabase فقط
   */
  async initializeDatabase(): Promise<DatabaseCheckResult> {
    console.log('🔄 بدء فحص قاعدة بيانات Supabase السحابية...');
    
    // 1. فحص الاتصال بـ Supabase
    const connectionCheck = await this.checkConnection();
    if (!connectionCheck.success) {
      console.error('❌ فشل الاتصال بقاعدة بيانات Supabase');
      return connectionCheck;
    }
    
    // 2. فحص وجود الجداول في Supabase
    const tablesCheck = await this.checkTablesExist();
    
    if (!tablesCheck.success) {
      console.error('⚠️ جداول مفقودة في قاعدة بيانات Supabase');
      console.error('⛔ يجب إنشاء الجداول في Supabase مباشرة');
      console.error('❌ لا يمكن إنشاء جداول محلية');
      return {
        success: false,
        message: 'جداول مفقودة في Supabase - يجب إنشاؤها يدوياً',
        details: tablesCheck.details
      };
    }
    
    console.log('✅ قاعدة بيانات Supabase متصلة وجاهزة');
    return {
      success: true,
      message: 'قاعدة بيانات Supabase متصلة وتحتوي على جميع الجداول'
    };
  }

  /**
   * اختبار عمليات CRUD الأساسية على Supabase
   */
  async testBasicOperations(): Promise<DatabaseCheckResult> {
    try {
      console.log('🧪 جاري اختبار العمليات الأساسية على Supabase...');
      
      // اختبار إنشاء مشروع تجريبي
      const testProject = await db.insert(schema.projects).values({
        name: 'مشروع تجريبي - ' + Date.now(),
        status: 'active'
      }).returning();
      
      console.log('✅ تم إنشاء مشروع تجريبي في Supabase:', testProject[0]);
      
      // اختبار قراءة المشاريع
      const projects = await db.select().from(schema.projects).limit(1);
      console.log('✅ تم قراءة المشاريع من Supabase:', projects.length);
      
      // حذف المشروع التجريبي
      await db.delete(schema.projects).where(sql`id = ${testProject[0].id}`);
      console.log('✅ تم حذف المشروع التجريبي من Supabase');
      
      return {
        success: true,
        message: 'جميع العمليات الأساسية تعمل بشكل صحيح على Supabase'
      };
    } catch (error) {
      console.error('❌ خطأ في اختبار العمليات الأساسية على Supabase:', error);
      return {
        success: false,
        message: 'خطأ في اختبار العمليات الأساسية على Supabase',
        details: error
      };
    }
  }

  /**
   * ⛔ دالة محذوفة: إنشاء الجداول ممنوع منعاً باتاً
   * ✅ التطبيق يستخدم فقط جداول موجودة في Supabase السحابية
   */
  async createTables(): Promise<DatabaseCheckResult> {
    console.error('❌ خطأ حرج: محاولة إنشاء جداول محلية محظورة!');
    console.error('⛔ التطبيق يستخدم فقط قاعدة بيانات Supabase السحابية');
    console.error('⚠️ يجب إنشاء/تحديث الجداول في Supabase مباشرة');
    
    return {
      success: false,
      message: 'إنشاء الجداول المحلية ممنوع - استخدم Supabase فقط',
      details: { error: 'LOCAL_TABLE_CREATION_FORBIDDEN' }
    };
  }
}

export const databaseManager = new DatabaseManager();