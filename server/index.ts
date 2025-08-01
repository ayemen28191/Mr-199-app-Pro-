import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { databaseManager } from "./database-manager";
import { databaseTester } from "./database-tester";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

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
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // فحص شامل لقاعدة البيانات باستخدام النظام الذكي
  try {
    log("🚀 بدء الفحص الشامل لقاعدة البيانات...");
    
    const dbCheck = await databaseManager.initializeDatabase();
    
    if (dbCheck.success) {
      log("✅ " + dbCheck.message);
      
      // اختبار العمليات الأساسية
      const testResult = await databaseManager.testBasicOperations();
      if (testResult.success) {
        log("✅ جميع أنظمة قاعدة البيانات تعمل بشكل مثالي");
        
        // تشغيل الاختبار الشامل لجميع الوظائف
        log("🧪 بدء الاختبار الشامل لجميع وظائف التطبيق...");
        const testResults = await databaseTester.runComprehensiveTests();
        
        // استيراد وطباعة التقرير الشامل
        const { ComprehensiveTestReporter } = await import('./comprehensive-test-report');
        const report = ComprehensiveTestReporter.generateFullReport();
        ComprehensiveTestReporter.printFormattedReport(report);
      } else {
        log("⚠️ مشكلة في العمليات الأساسية: " + testResult.message);
      }
    } else {
      log("❌ " + dbCheck.message);
      if (dbCheck.details) {
        console.log("📋 تفاصيل المشكلة:", dbCheck.details);
      }
    }
  } catch (error) {
    log("💥 خطأ كبير في النظام:");
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
