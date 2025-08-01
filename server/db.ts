import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon/Supabase serverless connection
neonConfig.webSocketConstructor = ws;

// ✅ SUPABASE CLOUD DATABASE CONFIGURATION
// التطبيق يستخدم قاعدة بيانات Supabase PostgreSQL السحابية بالكامل
// لا يعتمد على قاعدة البيانات المحلية الخاصة بـ Replit
const SUPABASE_DATABASE_URL = "postgresql://postgres.wibtasmyusxfqxxqekks:Ay**--772283228@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

// Primary connection: Supabase Cloud Database
// Secondary fallback: Environment variable (not used in production)
const connectionString = SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "قاعدة البيانات السحابية Supabase غير متاحة - تحقق من الاتصال",
  );
}

// تكوين اتصال قاعدة البيانات السحابية
export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });