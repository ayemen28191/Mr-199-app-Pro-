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

const SUPABASE_DATABASE_URL = "postgresql://postgres.wibtasmyusxfqxxqekks:Ay**--772283228@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

// ⛔ ممنوع استخدام process.env.DATABASE_URL - Replit PostgreSQL محظور
// ✅ الاتصال الوحيد المسموح: Supabase Cloud Database
const connectionString = SUPABASE_DATABASE_URL;

if (!connectionString || connectionString.includes('replit') || connectionString.includes('localhost')) {
  throw new Error(
    "❌ خطأ حرج: محاولة استخدام قاعدة بيانات محلية محظورة!\n" +
    "⚠️ التطبيق يستخدم فقط قاعدة بيانات Supabase السحابية\n" +
    "⛔ استخدام قاعدة بيانات Replit المحلية ممنوع منعاً باتاً"
  );
}

// تكوين اتصال قاعدة البيانات السحابية
export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });