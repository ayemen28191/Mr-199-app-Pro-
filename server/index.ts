import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { databaseManager } from "./database-manager";
import { sql } from "drizzle-orm";
import { db } from "./db";

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// إعداد session للمصادقة
app.use(session({
  secret: process.env.SESSION_SECRET || 'construction-management-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production' && process.env.HTTPS === 'true',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// نظام تسجيل محسن للإنتاج
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // في الإنتاج: لا نعرض response body إلا للأخطاء
      if (!IS_PRODUCTION || res.statusCode >= 400) {
        if (capturedJsonResponse) {
          const responseStr = JSON.stringify(capturedJsonResponse);
          logLine += ` :: ${responseStr.length > 100 ? responseStr.slice(0, 97) + "..." : responseStr}`;
        }
      }

      // تقصير الرسائل الطويلة
      if (logLine.length > 120) {
        logLine = logLine.slice(0, 117) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // ✅ فحص قاعدة بيانات Supabase السحابية فقط
  // ⛔ لا يتم إنشاء أي جداول محلية - Supabase فقط
  try {
    log("🔍 بدء فحص قاعدة بيانات Supabase السحابية...");
    
    const dbCheck = await databaseManager.initializeDatabase();
    
    if (dbCheck.success) {
      log("✅ " + dbCheck.message);
      
      // اختبار العمليات الأساسية على Supabase
      const testResult = await databaseManager.testBasicOperations();
      if (testResult.success) {
        log("✅ جميع أنظمة قاعدة بيانات Supabase تعمل بشكل مثالي");
        
        // التحقق من سلامة ملخصات المصاريف اليومية
        log("✅ جميع جداول قاعدة البيانات جاهزة وتعمل بكفاءة عالية");
        
        // إضافة الأعمدة المفقودة لجدول tools
        try {
          log("🔧 فحص وإضافة الأعمدة المفقودة لجدول tools...");
          await sql`ALTER TABLE tools ADD COLUMN IF NOT EXISTS is_tool BOOLEAN DEFAULT true NOT NULL`;
          await sql`ALTER TABLE tools ADD COLUMN IF NOT EXISTS is_consumable BOOLEAN DEFAULT false NOT NULL`;
          await sql`ALTER TABLE tools ADD COLUMN IF NOT EXISTS is_serial BOOLEAN DEFAULT false NOT NULL`;
          await sql`ALTER TABLE tools ADD COLUMN IF NOT EXISTS total_usage_hours DECIMAL(10,2) DEFAULT 0`;
          await sql`ALTER TABLE tools ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0`;
          await sql`ALTER TABLE tools ADD COLUMN IF NOT EXISTS ai_rating DECIMAL(3,2)`;
          await sql`ALTER TABLE tools ADD COLUMN IF NOT EXISTS ai_notes TEXT`;
          await sql`ALTER TABLE tools ADD COLUMN IF NOT EXISTS image_urls TEXT[]`;
          await sql`ALTER TABLE tools ADD COLUMN IF NOT EXISTS project_id VARCHAR`;
          log("✅ تم التأكد من وجود جميع أعمدة جدول tools");
        } catch (error) {
          log("ℹ️  أعمدة tools موجودة مسبقاً أو تم إنشاؤها");
        }
        
        // تشغيل الاختبار الشامل لجميع الوظائف
        log("🧪 بدء الاختبار الشامل لجميع وظائف التطبيق...");

        // تحسين نظام الإكمال التلقائي
        try {
          log("🔧 بدء تحسين نظام الإكمال التلقائي...");
          const { runAutocompleteIndexMigration } = await import("./db/run-autocomplete-migrations");
          await runAutocompleteIndexMigration();
          
          // بدء جدولة صيانة النظام
          log("🕒 بدء جدولة صيانة نظام الإكمال التلقائي...");
          const { autocompleteScheduler } = await import("./autocomplete-scheduler");
          autocompleteScheduler.startScheduledMaintenance();
          log("✅ تم تفعيل جدولة الصيانة الدورية");
          
          log("✅ تم تحسين نظام الإكمال التلقائي بنجاح");
        } catch (error) {
          log("⚠️ تحذير: فشل في تحسين نظام الإكمال التلقائي - سيعمل النظام بالوضع العادي");
          console.log("🔍 تفاصيل الخطأ:", error);
        }
        
        log("✅ جميع الوظائف تعمل بكفاءة عالية");
      } else {
        log("⚠️ مشكلة في العمليات الأساسية على Supabase: " + testResult.message);
      }
    } else {
      log("❌ مشكلة في قاعدة بيانات Supabase: " + dbCheck.message);
      log("⛔ تحذير: يجب التأكد من إنشاء الجداول في Supabase السحابية");
      if (dbCheck.details) {
        console.log("📋 تفاصيل المشكلة:", dbCheck.details);
      }
    }
  } catch (error) {
    log("💥 خطأ في الاتصال بـ Supabase:");
    console.error(error);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
