import { defineConfig } from "drizzle-kit";

// ⚠️ تحذير صارم: ممنوع منعاً باتاً استخدام قاعدة البيانات المحلية الخاصة بـ Replit
// ✅ التطبيق يستخدم فقط قاعدة بيانات Supabase PostgreSQL السحابية
// ⛔ أي محاولة لاستخدام DATABASE_URL المحلي سيؤدي إلى فشل النظام

// ✅ الاتصال الوحيد المسموح: Supabase Cloud Database
const SUPABASE_DATABASE_URL = "postgresql://postgres.wibtasmyusxfqxxqekks:Ay**--772283228@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

// ⛔ حماية صارمة ضد استخدام قواعد البيانات المحلية
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')) {
  throw new Error("⛔ ممنوع استخدام قاعدة البيانات المحلية! استخدم Supabase فقط");
}

export default defineConfig({
  out: "./migrations",
  schema: "../shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: SUPABASE_DATABASE_URL,
  },
  strict: true,
  verbose: true
});
