import { db } from './db';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';

interface DatabaseCheckResult {
  success: boolean;
  message: string;
  details?: any;
}

class DatabaseManager {
  
  /**
   * فحص الاتصال بقاعدة البيانات
   */
  async checkConnection(): Promise<DatabaseCheckResult> {
    try {
      console.log('🔍 جاري فحص الاتصال بقاعدة البيانات...');
      
      const result = await db.execute(sql`SELECT 1 as test`);
      
      console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
      return {
        success: true,
        message: 'الاتصال بقاعدة البيانات ناجح',
        details: result
      };
    } catch (error) {
      console.error('❌ فشل الاتصال بقاعدة البيانات:', error);
      return {
        success: false,
        message: 'فشل الاتصال بقاعدة البيانات',
        details: error
      };
    }
  }

  /**
   * فحص وجود الجداول المطلوبة
   */
  async checkTablesExist(): Promise<DatabaseCheckResult> {
    try {
      console.log('🔍 جاري فحص الجداول الموجودة...');
      
      const tablesQuery = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      // استخراج أسماء الجداول من النتيجة
      let existingTables: string[] = [];
      if (tablesQuery && Array.isArray(tablesQuery)) {
        existingTables = tablesQuery.map((row: any) => row.table_name);
      }
      console.log('📋 الجداول الموجودة:', existingTables);
      
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
        console.log('⚠️ الجداول المفقودة:', missingTables);
        return {
          success: false,
          message: `الجداول التالية مفقودة: ${missingTables.join(', ')}`,
          details: { existingTables, missingTables, requiredTables }
        };
      }
      
      console.log('✅ جميع الجداول المطلوبة موجودة');
      return {
        success: true,
        message: 'جميع الجداول المطلوبة موجودة',
        details: { existingTables, requiredTables }
      };
    } catch (error) {
      console.error('❌ خطأ في فحص الجداول:', error);
      return {
        success: false,
        message: 'خطأ في فحص الجداول',
        details: error
      };
    }
  }

  /**
   * إنشاء الجداول مباشرة باستخدام SQL
   */
  async createTables(): Promise<DatabaseCheckResult> {
    try {
      console.log('🔨 جاري إنشاء الجداول مباشرة...');
      
      // إنشاء جدول المشاريع
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS projects (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log('✅ تم إنشاء جدول projects');

      // إنشاء جدول العمال
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS workers (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          daily_wage DECIMAL(10,2) NOT NULL,
          is_active BOOLEAN DEFAULT true NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log('✅ تم إنشاء جدول workers');

      // إنشاء جدول تحويلات العهدة
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS fund_transfers (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id VARCHAR NOT NULL REFERENCES projects(id),
          amount DECIMAL(10,2) NOT NULL,
          sender_name TEXT,
          transfer_number TEXT UNIQUE,
          transfer_type TEXT NOT NULL,
          transfer_date TIMESTAMP NOT NULL,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log('✅ تم إنشاء جدول fund_transfers');

      // إنشاء جدول حضور العمال
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS worker_attendance (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id VARCHAR NOT NULL REFERENCES projects(id),
          worker_id VARCHAR NOT NULL REFERENCES workers(id),
          date TEXT NOT NULL,
          start_time TEXT,
          end_time TEXT,
          work_description TEXT,
          is_present BOOLEAN NOT NULL,
          work_days DECIMAL(3,2) NOT NULL DEFAULT 1.00,
          daily_wage DECIMAL(10,2) NOT NULL,
          actual_wage DECIMAL(10,2) NOT NULL,
          paid_amount DECIMAL(10,2) DEFAULT 0 NOT NULL,
          remaining_amount DECIMAL(10,2) DEFAULT 0 NOT NULL,
          payment_type TEXT NOT NULL DEFAULT 'partial',
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          UNIQUE (worker_id, date, project_id)
        )
      `);
      console.log('✅ تم إنشاء جدول worker_attendance');

      // إنشاء جدول المواد
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS materials (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          unit TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log('✅ تم إنشاء جدول materials');

      // إنشاء جدول مشتريات المواد
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS material_purchases (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id VARCHAR NOT NULL REFERENCES projects(id),
          material_id VARCHAR NOT NULL REFERENCES materials(id),
          quantity DECIMAL(10,3) NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          total_amount DECIMAL(10,2) NOT NULL,
          supplier_name TEXT,
          purchase_date TEXT NOT NULL,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log('✅ تم إنشاء جدول material_purchases');

      // إنشاء جدول مصاريف النقل
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS transportation_expenses (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id VARCHAR NOT NULL REFERENCES projects(id),
          amount DECIMAL(10,2) NOT NULL,
          description TEXT NOT NULL,
          date TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log('✅ تم إنشاء جدول transportation_expenses');

      // حذف وإعادة إنشاء جدول ملخص المصاريف اليومية بالهيكل الصحيح
      await db.execute(sql`DROP TABLE IF EXISTS daily_expense_summaries CASCADE`);
      await db.execute(sql`
        CREATE TABLE daily_expense_summaries (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id VARCHAR NOT NULL REFERENCES projects(id),
          date TEXT NOT NULL,
          carried_forward_amount DECIMAL(10,2) DEFAULT 0 NOT NULL,
          total_fund_transfers DECIMAL(10,2) DEFAULT 0 NOT NULL,
          total_worker_wages DECIMAL(10,2) DEFAULT 0 NOT NULL,
          total_material_costs DECIMAL(10,2) DEFAULT 0 NOT NULL,
          total_transportation_costs DECIMAL(10,2) DEFAULT 0 NOT NULL,
          total_income DECIMAL(10,2) NOT NULL,
          total_expenses DECIMAL(10,2) NOT NULL,
          remaining_balance DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          UNIQUE (project_id, date)
        )
      `);
      console.log('✅ تم إنشاء جدول daily_expense_summaries');

      // إنشاء الجداول الإضافية
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS worker_transfers (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id VARCHAR NOT NULL REFERENCES projects(id),
          worker_id VARCHAR NOT NULL REFERENCES workers(id),
          amount DECIMAL(10,2) NOT NULL,
          transfer_number TEXT,
          date TEXT NOT NULL,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log('✅ تم إنشاء جدول worker_transfers');

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS worker_balances (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          worker_id VARCHAR NOT NULL REFERENCES workers(id),
          project_id VARCHAR NOT NULL REFERENCES projects(id),
          total_earned DECIMAL(10,2) DEFAULT 0 NOT NULL,
          total_paid DECIMAL(10,2) DEFAULT 0 NOT NULL,
          current_balance DECIMAL(10,2) DEFAULT 0 NOT NULL,
          last_updated TIMESTAMP DEFAULT NOW() NOT NULL,
          UNIQUE (worker_id, project_id)
        )
      `);
      console.log('✅ تم إنشاء جدول worker_balances');

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS autocomplete_data (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          field_name TEXT NOT NULL,
          value TEXT NOT NULL,
          usage_count INTEGER DEFAULT 1 NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          UNIQUE (field_name, value)
        )
      `);
      console.log('✅ تم إنشاء جدول autocomplete_data');

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS worker_types (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          type_name TEXT NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log('✅ تم إنشاء جدول worker_types');

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS worker_misc_expenses (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id VARCHAR NOT NULL REFERENCES projects(id),
          amount DECIMAL(10,2) NOT NULL,
          description TEXT NOT NULL,
          date TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      console.log('✅ تم إنشاء جدول worker_misc_expenses');
      
      console.log('🎉 تم إنشاء جميع الجداول بنجاح!');
      
      return {
        success: true,
        message: 'تم إنشاء جميع الجداول بنجاح'
      };
    } catch (error) {
      console.error('❌ خطأ في إنشاء الجداول:', error);
      return {
        success: false,
        message: 'خطأ في إنشاء الجداول',
        details: error
      };
    }
  }

  /**
   * فحص شامل لقاعدة البيانات وإعداد الجداول
   */
  async initializeDatabase(): Promise<DatabaseCheckResult> {
    console.log('🚀 بدء الفحص الشامل لقاعدة البيانات...');
    
    // 1. فحص الاتصال
    const connectionCheck = await this.checkConnection();
    if (!connectionCheck.success) {
      return connectionCheck;
    }
    
    // 2. فحص الجداول
    const tablesCheck = await this.checkTablesExist();
    if (!tablesCheck.success) {
      console.log('⚠️ الجداول غير موجودة، سيتم إنشاؤها تلقائياً...');
      
      // 3. إنشاء الجداول تلقائياً
      const createResult = await this.createTables();
      if (!createResult.success) {
        return {
          success: false,
          message: 'فشل في إنشاء الجداول: ' + createResult.message,
          details: createResult.details
        };
      }
      
      // 4. فحص الجداول مرة أخرى للتأكد
      const recheckTables = await this.checkTablesExist();
      if (!recheckTables.success) {
        return {
          success: false,
          message: 'فشل في التحقق من إنشاء الجداول',
          details: recheckTables.details
        };
      }
    }
    
    console.log('🎉 قاعدة البيانات جاهزة للاستخدام');
    return {
      success: true,
      message: 'قاعدة البيانات جاهزة ومُعدة بالكامل'
    };
  }

  /**
   * اختبار عمليات CRUD الأساسية
   */
  async testBasicOperations(): Promise<DatabaseCheckResult> {
    try {
      console.log('🧪 جاري اختبار العمليات الأساسية...');
      
      // اختبار إنشاء مشروع تجريبي
      const testProject = await db.insert(schema.projects).values({
        name: 'مشروع تجريبي - ' + Date.now(),
        status: 'active'
      }).returning();
      
      console.log('✅ تم إنشاء مشروع تجريبي:', testProject[0]);
      
      // اختبار قراءة المشاريع
      const projects = await db.select().from(schema.projects).limit(1);
      console.log('✅ تم قراءة المشاريع:', projects.length);
      
      // حذف المشروع التجريبي
      await db.delete(schema.projects).where(sql`id = ${testProject[0].id}`);
      console.log('✅ تم حذف المشروع التجريبي');
      
      return {
        success: true,
        message: 'جميع العمليات الأساسية تعمل بشكل صحيح'
      };
    } catch (error) {
      console.error('❌ خطأ في اختبار العمليات الأساسية:', error);
      return {
        success: false,
        message: 'خطأ في اختبار العمليات الأساسية',
        details: error
      };
    }
  }
}

export const databaseManager = new DatabaseManager();