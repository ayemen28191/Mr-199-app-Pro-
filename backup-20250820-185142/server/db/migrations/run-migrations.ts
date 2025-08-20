import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from '../../db';
import { sql } from 'drizzle-orm';

/**
 * تشغيل ملفات الهجرة لقاعدة البيانات
 * Database migration runner
 */

export async function runAutocompleteIndexMigration(): Promise<void> {
  try {
    console.log('🔄 بدء تشغيل هجرة فهارس الإكمال التلقائي...');

    const migrationSQL = readFileSync(
      join(__dirname, 'add-autocomplete-indexes.sql'), 
      'utf-8'
    );

    // تقسيم الاستعلامات وتشغيلها واحداً تلو الآخر
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await db.execute(sql.raw(statement));
        console.log('✅ تم تنفيذ:', statement.substring(0, 50) + '...');
      } catch (error: any) {
        // تجاهل أخطاء الفهارس الموجودة مسبقاً
        if (error.message?.includes('already exists') || 
            error.message?.includes('already exists')) {
          console.log('⚠️ الفهرس موجود مسبقاً:', statement.substring(0, 50) + '...');
        } else {
          console.error('❌ خطأ في تنفيذ:', statement.substring(0, 50) + '...', error);
        }
      }
    }

    console.log('✅ اكتملت هجرة فهارس الإكمال التلقائي بنجاح');
  } catch (error) {
    console.error('❌ فشل في تشغيل هجرة فهارس الإكمال التلقائي:', error);
    throw error;
  }
}

// تشغيل الهجرة إذا تم استدعاء الملف مباشرة
if (require.main === module) {
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