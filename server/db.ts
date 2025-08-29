import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon/Supabase serverless connection
neonConfig.webSocketConstructor = ws;

// ✅ SUPABASE CLOUD DATABASE CONFIGURATION - الاتصال الوحيد المسموح
// ⚠️ تحذير صارم: ممنوع منعاً باتاً استخدام قاعدة البيانات المحلية الخاصة بـ Replit
// ⚠️ التطبيق يستخدم فقط قاعدة بيانات Supabase PostgreSQL السحابية
// ⚠️ أي محاولة لاستخدام DATABASE_URL المحلي سيؤدي إلى فشل النظام

const SUPABASE_DATABASE_URL = "postgresql://postgres.wibtasmyusxfqxxqekks:Ay3KeKsUSdFZp8Nb772283228@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

// ⛔ حماية صارمة ضد استخدام قواعد البيانات المحلية
// ✅ الاتصال الوحيد المسموح: Supabase Cloud Database
const connectionString = SUPABASE_DATABASE_URL;

// ⚠️ تجاهل متغيرات البيئة المحلية تماماً - استخدام Supabase فقط
console.log("🔐 إجبار استخدام قاعدة بيانات Supabase السحابية حصرياً");
console.log("⛔ تجاهل أي متغيرات بيئة محلية (DATABASE_URL، PGHOST، إلخ)");

// فحص أن رابط Supabase صحيح
if (!connectionString || !connectionString.includes('supabase.com')) {
  throw new Error(
    "❌ خطأ حرج: رابط Supabase غير صحيح!\n" +
    "🔐 يجب أن يكون الرابط من supabase.com"
  );
}

// تكوين اتصال قاعدة البيانات السحابية
export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });