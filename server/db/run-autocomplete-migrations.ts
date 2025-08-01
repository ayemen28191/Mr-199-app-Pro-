import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * تشغيل هجرة فهارس الإكمال التلقائي
 * Run autocomplete system indexes migration
 */

export async function runAutocompleteIndexMigration(): Promise<void> {
  try {
    console.log('🔄 بدء تشغيل هجرة فهارس الإكمال التلقائي...');

    // إضافة فهرس مركب لتحسين البحث والترتيب حسب الفئة وعدد الاستخدام
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_autocomplete_category_usage 
      ON autocomplete_data (category, usage_count DESC, last_used DESC)
    `);

    // فهرس للبحث النصي في القيم حسب الفئة
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_autocomplete_value_search 
      ON autocomplete_data (category, value)
    `);

    // فهرس لتنظيف البيانات القديمة
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_autocomplete_cleanup 
      ON autocomplete_data (last_used, usage_count)
    `);

    // فهرس لتحسين عمليات التحديث والحذف
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_autocomplete_category_value 
      ON autocomplete_data (category, value)
    `);

    // فهرس لتحسين إحصائيات النظام
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_autocomplete_stats 
      ON autocomplete_data (created_at, category)
    `);

    // محاولة إضافة قيد فريد لمنع التكرار (قد يفشل إذا كان هناك بيانات مكررة)
    try {
      await db.execute(sql`
        ALTER TABLE autocomplete_data 
        ADD CONSTRAINT uk_autocomplete_category_value 
        UNIQUE (category, value)
      `);
      console.log('✅ تم إضافة القيد الفريد بنجاح');
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        console.log('⚠️ القيد الفريد موجود مسبقاً أو يوجد بيانات مكررة');
      } else {
        console.log('⚠️ لم يتم إضافة القيد الفريد:', error.message);
      }
    }

    // إضافة تعليقات للجدول والأعمدة
    await db.execute(sql`
      COMMENT ON TABLE autocomplete_data IS 'جدول بيانات الإكمال التلقائي - يحفظ اقتراحات المستخدم لتحسين تجربة الإدخال'
    `);

    await db.execute(sql`
      COMMENT ON COLUMN autocomplete_data.category IS 'فئة البيانات مثل أسماء المرسلين، أرقام الهواتف، إلخ'
    `);

    await db.execute(sql`
      COMMENT ON COLUMN autocomplete_data.value IS 'القيمة المقترحة للإكمال التلقائي'
    `);

    await db.execute(sql`
      COMMENT ON COLUMN autocomplete_data.usage_count IS 'عدد مرات استخدام هذه القيمة - يحدد أولوية الظهور'
    `);

    await db.execute(sql`
      COMMENT ON COLUMN autocomplete_data.last_used IS 'تاريخ آخر استخدام لهذه القيمة'
    `);

    await db.execute(sql`
      COMMENT ON COLUMN autocomplete_data.created_at IS 'تاريخ إنشاء السجل في النظام'
    `);

    console.log('✅ اكتملت هجرة فهارس الإكمال التلقائي بنجاح');
  } catch (error) {
    console.error('❌ فشل في تشغيل هجرة فهارس الإكمال التلقائي:', error);
    throw error;
  }
}

// تشغيل الهجرة إذا تم استدعاء الملف مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  runAutocompleteIndexMigration()
    .then(() => {
      console.log('✅ تم تشغيل الهجرة بنجاح');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل تشغيل الهجرة:', error);
      process.exit(1);
    });
}