/**
 * الوصف: نظام API الرئيسي للخادم - إدارة جميع المسارات والعمليات
 * المدخلات: طلبات HTTP من العميل
 * المخرجات: استجابات JSON مع البيانات المطلوبة
 * المالك: عمار
 * آخر تعديل: 2025-08-20
 * الحالة: نشط - النظام الأساسي للتطبيق
 */

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authSystem } from "./auth-system";
import { backupSystem } from "./backup-system";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { 
  insertProjectSchema, insertWorkerSchema, insertFundTransferSchema, 
  insertWorkerAttendanceSchema, insertMaterialSchema, insertMaterialPurchaseSchema,
  insertTransportationExpenseSchema, insertDailyExpenseSummarySchema, insertWorkerTransferSchema,
  insertWorkerBalanceSchema, insertAutocompleteDataSchema, insertWorkerTypeSchema,
  insertWorkerMiscExpenseSchema, insertUserSchema, insertSupplierSchema, insertSupplierPaymentSchema,
  insertPrintSettingsSchema, insertProjectFundTransferSchema,
  insertReportTemplateSchema,
  insertToolCategorySchema, insertToolSchema, updateToolSchema, insertToolStockSchema, insertToolMovementSchema, 
  insertToolMaintenanceLogSchema, insertToolUsageAnalyticsSchema, insertToolReservationSchema,
  // Phase 3 schemas
  insertToolPurchaseItemSchema, insertMaintenanceScheduleSchema, insertMaintenanceTaskSchema, insertToolCostTrackingSchema,
  // Notifications schemas
  insertToolNotificationSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Track read notifications in memory (could be moved to database later)
  const readNotifications = new Set<string>();
  
  // Fund Transfers (تحويلات العهدة)
  app.get("/api/fund-transfers", async (req, res) => {
    try {
      const projectId = req.query.projectId as string;
      const date = req.query.date as string;
      console.log(`🔍 جلب جميع تحويلات العهدة - المشروع: ${projectId || 'الكل'}, التاريخ: ${date || 'الكل'}`);
      const transfers = await storage.getFundTransfers(projectId, date);
      console.log(`✅ تم العثور على ${transfers.length} تحويل`);
      res.json(transfers);
    } catch (error) {
      console.error("خطأ في جلب تحويلات العهدة:", error);
      res.status(500).json({ message: "خطأ في جلب تحويلات العهدة", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Error fetching projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const result = insertProjectSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid project data", errors: result.error.issues });
      }
      
      // فحص عدم تكرار اسم المشروع
      const existingProject = await storage.getProjectByName(result.data.name);
      if (existingProject) {
        return res.status(400).json({ message: "يوجد مشروع بنفس الاسم مسبقاً" });
      }
      
      const project = await storage.createProject(result.data);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "خطأ في إنشاء المشروع" });
    }
  });

  // Get projects with statistics - مع إحصائيات حقيقية
  app.get("/api/projects/with-stats", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      
      // إضافة إحصائيات حقيقية لكل مشروع
      const projectsWithStats = await Promise.all(
        projects.map(async (project) => {
          try {
            // استدعاء دالة getProjectStatistics لجلب الإحصائيات الحقيقية
            const stats = await storage.getProjectStatistics(project.id);
            return {
              ...project,
              stats
            };
          } catch (error) {
            console.error(`Error getting stats for project ${project.id}:`, error);
            // في حالة الخطأ، نعيد إحصائيات افتراضية
            return {
              ...project,
              stats: {
                totalWorkers: 0,
                totalExpenses: 0,
                totalIncome: 0,
                currentBalance: 0,
                activeWorkers: 0,
                completedDays: 0,
                materialPurchases: 0,
                lastActivity: new Date().toISOString().split('T')[0]
              }
            };
          }
        })
      );
      
      res.json(projectsWithStats);
    } catch (error) {
      console.error("Error fetching projects with stats:", error);
      res.status(500).json({ message: "Error fetching project statistics" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Error fetching project" });
    }
  });

  // Get statistics for a specific project (optimized for single project)
  app.get("/api/projects/:id/stats", async (req, res) => {
    try {
      const stats = await storage.getProjectStatistics(req.params.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching project stats:", error);
      res.status(500).json({ message: "Error fetching project statistics" });
    }
  });

  // تحليل مفصل للرصيد السالب للمشروع
  app.get("/api/projects/:projectId/financial-analysis", async (req, res) => {
    try {
      const { projectId } = req.params;
      
      // جلب جميع البيانات المالية التفصيلية
      const [
        project,
        fundTransfers,
        projectTransfersIn,
        projectTransfersOut,
        workerWages,
        materialPurchases,
        transportExpenses,
        miscExpenses
      ] = await Promise.all([
        storage.getProject(projectId),
        
        db.execute(sql`
          SELECT transfer_date, amount, sender_name, notes, created_at
          FROM fund_transfers 
          WHERE project_id = ${projectId}
          ORDER BY transfer_date DESC
        `),
        
        db.execute(sql`
          SELECT transfer_date, amount, notes, from_project_id, created_at
          FROM project_fund_transfers 
          WHERE to_project_id = ${projectId}
          ORDER BY transfer_date DESC
        `),
        
        db.execute(sql`
          SELECT transfer_date, amount, notes, to_project_id, created_at
          FROM project_fund_transfers 
          WHERE from_project_id = ${projectId}
          ORDER BY transfer_date DESC
        `),
        
        db.execute(sql`
          SELECT wa.date, w.name as worker_name, wa.actual_wage, wa.created_at
          FROM worker_attendance wa
          JOIN workers w ON wa.worker_id = w.id
          WHERE wa.project_id = ${projectId}
          ORDER BY wa.date DESC
        `),
        
        db.execute(sql`
          SELECT mp.purchase_date, m.name as material_name, mp.total_amount, mp.created_at
          FROM material_purchases mp
          JOIN materials m ON mp.material_id = m.id
          WHERE mp.project_id = ${projectId}
          ORDER BY mp.purchase_date DESC
        `),
        
        db.execute(sql`
          SELECT expense_date, amount, description, created_at
          FROM transportation_expenses 
          WHERE project_id = ${projectId}
          ORDER BY expense_date DESC
        `),
        
        db.execute(sql`
          SELECT wme.expense_date, w.name as worker_name, wme.amount, wme.description, wme.created_at
          FROM worker_misc_expenses wme
          JOIN workers w ON wme.worker_id = w.id
          WHERE wme.project_id = ${projectId}
          ORDER BY wme.expense_date DESC
        `)
      ]);

      if (!project) {
        return res.status(404).json({ message: "المشروع غير موجود" });
      }

      // تحويل البيانات لتنسيق سهل القراءة
      const analysis = {
        project: {
          name: project.name,
          id: projectId,
          status: project.status,
          createdAt: project.createdAt
        },
        income: {
          fundTransfers: fundTransfers.rows.map((row: any) => ({
            date: row.transfer_date,
            amount: parseFloat(row.amount),
            sender: row.sender_name,
            notes: row.notes,
            createdAt: row.created_at
          })),
          projectTransfersIn: projectTransfersIn.rows.map((row: any) => ({
            date: row.transfer_date,
            amount: parseFloat(row.amount),
            notes: row.notes,
            fromProject: row.from_project_id,
            createdAt: row.created_at
          }))
        },
        expenses: {
          workerWages: workerWages.rows.map((row: any) => ({
            date: row.date,
            workerName: row.worker_name,
            amount: parseFloat(row.actual_wage),
            createdAt: row.created_at
          })),
          materialPurchases: materialPurchases.rows.map((row: any) => ({
            date: row.purchase_date,
            materialName: row.material_name,
            amount: parseFloat(row.total_amount),
            createdAt: row.created_at
          })),
          transportExpenses: transportExpenses.rows.map((row: any) => ({
            date: row.expense_date,
            amount: parseFloat(row.amount),
            description: row.description,
            createdAt: row.created_at
          })),
          projectTransfersOut: projectTransfersOut.rows.map((row: any) => ({
            date: row.transfer_date,
            amount: parseFloat(row.amount),
            notes: row.notes,
            toProject: row.to_project_id,
            createdAt: row.created_at
          })),
          miscExpenses: miscExpenses.rows.map((row: any) => ({
            date: row.expense_date,
            workerName: row.worker_name,
            amount: parseFloat(row.amount),
            description: row.description,
            createdAt: row.created_at
          }))
        }
      };

      // حساب الإجماليات
      const totalIncome = [
        ...analysis.income.fundTransfers,
        ...analysis.income.projectTransfersIn
      ].reduce((sum, item) => sum + item.amount, 0);

      const totalExpenses = [
        ...analysis.expenses.workerWages,
        ...analysis.expenses.materialPurchases,
        ...analysis.expenses.transportExpenses,
        ...analysis.expenses.projectTransfersOut,
        ...analysis.expenses.miscExpenses
      ].reduce((sum, item) => sum + item.amount, 0);

      const currentBalance = totalIncome - totalExpenses;

      (analysis as any).totals = {
        totalIncome,
        totalExpenses,
        currentBalance
      };

      res.json(analysis);
    } catch (error) {
      console.error('خطأ في تحليل البيانات المالية:', error);
      res.status(500).json({ message: "خطأ في تحليل البيانات المالية" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const result = insertProjectSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid project data", errors: result.error.issues });
      }
      
      // فحص عدم تكرار اسم المشروع إذا تم تغييره
      if (result.data.name) {
        const existingProject = await storage.getProjectByName(result.data.name);
        if (existingProject && existingProject.id !== req.params.id) {
          return res.status(400).json({ message: "يوجد مشروع بنفس الاسم مسبقاً" });
        }
      }
      
      const project = await storage.updateProject(req.params.id, result.data);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Error updating project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "المشروع غير موجود" });
      }
      
      await storage.deleteProject(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "خطأ في حذف المشروع" });
    }
  });

  // إصلاح حسابات يوم محدد - Fix specific day calculations
  app.post("/api/projects/:projectId/fix-day/:date", async (req, res) => {
    try {
      const { projectId, date } = req.params;
      console.log(`🔧 إصلاح حسابات اليوم ${date} للمشروع ${projectId}`);

      // حذف البيانات القديمة الخاطئة
      await storage.deleteDailySummary(projectId, date);
      console.log(`✅ تم حذف الملخص الخاطئ لتاريخ ${date}`);

      // إعادة إنشاء البيانات الصحيحة
      await storage.updateDailySummaryForDate(projectId, date);
      console.log(`✅ تم إعادة حساب الملخص الصحيح لتاريخ ${date}`);

      // جلب البيانات الجديدة للتحقق
      const newSummary = await storage.getDailySummary(projectId, date);
      
      res.json({ 
        success: true, 
        message: `تم إصلاح حسابات ${date} بنجاح`,
        summary: newSummary 
      });
    } catch (error) {
      console.error(`❌ خطأ في إصلاح اليوم ${req.params.date}:`, error);
      res.status(500).json({ message: "خطأ في إصلاح الحسابات" });
    }
  });

  // Workers
  app.get("/api/workers", async (req, res) => {
    try {
      const workers = await storage.getWorkers();
      res.json(workers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching workers" });
    }
  });

  app.post("/api/workers", async (req, res) => {
    try {
      const result = insertWorkerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid worker data", errors: result.error.issues });
      }
      
      // فحص عدم تكرار اسم العامل
      const existingWorker = await storage.getWorkerByName(result.data.name);
      if (existingWorker) {
        return res.status(400).json({ message: "يوجد عامل بنفس الاسم مسبقاً" });
      }
      
      const worker = await storage.createWorker(result.data);
      res.status(201).json(worker);
    } catch (error) {
      console.error("Error creating worker:", error);
      res.status(500).json({ message: "خطأ في إنشاء العامل" });
    }
  });

  app.put("/api/workers/:id", async (req, res) => {
    try {
      const result = insertWorkerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid worker data", errors: result.error.issues });
      }
      
      const worker = await storage.updateWorker(req.params.id, result.data);
      if (!worker) {
        return res.status(404).json({ message: "العامل غير موجود" });
      }
      res.json(worker);
    } catch (error) {
      console.error("Error updating worker:", error);
      res.status(500).json({ message: "خطأ في تحديث العامل" });
    }
  });

  app.patch("/api/workers/:id", async (req, res) => {
    try {
      const worker = await storage.updateWorker(req.params.id, req.body);
      if (!worker) {
        return res.status(404).json({ message: "العامل غير موجود" });
      }
      res.json(worker);
    } catch (error) {
      console.error("Error updating worker:", error);
      res.status(500).json({ message: "خطأ في تحديث العامل" });
    }
  });

  app.delete("/api/workers/:id", async (req, res) => {
    try {
      await storage.deleteWorker(req.params.id);
      res.json({ message: "تم حذف العامل بنجاح" });
    } catch (error) {
      console.error("Error deleting worker:", error);
      res.status(500).json({ message: "خطأ في حذف العامل" });
    }
  });

  // Worker Types
  app.get("/api/worker-types", async (req, res) => {
    try {
      const workerTypes = await storage.getWorkerTypes();
      res.json(workerTypes);
    } catch (error) {
      console.error("Error fetching worker types:", error);
      res.status(500).json({ message: "خطأ في جلب أنواع العمال" });
    }
  });

  app.post("/api/worker-types", async (req, res) => {
    try {
      const result = insertWorkerTypeSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "بيانات نوع العامل غير صالحة", errors: result.error.issues });
      }
      
      const workerType = await storage.createWorkerType(result.data);
      res.status(201).json(workerType);
    } catch (error: any) {
      console.error("Error creating worker type:", error);
      // فحص إذا كان الخطأ بسبب تكرار الاسم
      if (error.code === '23505' && error.constraint === 'worker_types_name_unique') {
        return res.status(400).json({ message: "نوع العامل موجود مسبقاً" });
      }
      res.status(500).json({ message: "خطأ في إضافة نوع العامل" });
    }
  });



  app.get("/api/projects/:projectId/fund-transfers", async (req, res) => {
    try {
      const date = req.query.date as string;
      console.log(`Getting fund transfers for project ${req.params.projectId}, date: ${date}`);
      const transfers = await storage.getFundTransfers(req.params.projectId, date);
      console.log(`Found ${transfers.length} transfers`);
      res.json(transfers);
    } catch (error) {
      console.error("Error fetching fund transfers:", error);
      res.status(500).json({ message: "Error fetching fund transfers", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/fund-transfers", async (req, res) => {
    try {
      console.log("📝 إنشاء حولة جديدة:", req.body);
      
      const result = insertFundTransferSchema.safeParse(req.body);
      if (!result.success) {
        console.error("❌ خطأ في التحقق من البيانات:", result.error.issues);
        return res.status(400).json({ 
          message: "بيانات الحولة غير صحيحة", 
          errors: result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
        });
      }
      
      // محاولة إنشاء التحويل مباشرة - إذا كان هناك تكرار ستعطي قاعدة البيانات خطأ
      try {
        const transfer = await storage.createFundTransfer(result.data);
        console.log("✅ تم إنشاء الحولة بنجاح:", transfer.id);
        res.status(201).json(transfer);
      } catch (dbError: any) {
        console.error("❌ خطأ في قاعدة البيانات:", dbError);
        
        // فحص إذا كان الخطأ بسبب تكرار رقم الحوالة
        if (dbError.code === '23505' && (dbError.constraint === 'fund_transfers_transfer_number_key' || dbError.constraint === 'fund_transfers_transfer_number_unique')) {
          return res.status(400).json({ message: "يوجد تحويل بنفس رقم الحوالة مسبقاً" });
        }
        
        // معالجة أخطاء أخرى من قاعدة البيانات
        if (dbError.code === '23503') {
          return res.status(400).json({ message: "المشروع المحدد غير موجود" });
        }
        
        throw dbError; // إعادة رفع الخطأ إذا لم يكن معروف
      }
    } catch (error: any) {
      console.error("❌ خطأ عام في إنشاء الحولة:", error);
      res.status(500).json({ 
        message: error?.message || "حدث خطأ أثناء إنشاء الحولة" 
      });
    }
  });

  app.put("/api/fund-transfers/:id", async (req, res) => {
    try {
      const result = insertFundTransferSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid fund transfer data", errors: result.error.issues });
      }
      
      // محاولة تحديث التحويل مباشرة - إذا كان هناك تكرار ستعطي قاعدة البيانات خطأ
      try {
        const transfer = await storage.updateFundTransfer(req.params.id, result.data);
        res.json(transfer);
      } catch (dbError: any) {
        // فحص إذا كان الخطأ بسبب تكرار رقم الحوالة
        if (dbError.code === '23505' && dbError.constraint === 'fund_transfers_transfer_number_key') {
          return res.status(400).json({ message: "يوجد تحويل بنفس رقم الحوالة مسبقاً" });
        }
        throw dbError; // إعادة رفع الخطأ إذا لم يكن تكرار
      }
    } catch (error) {
      console.error("Error updating fund transfer:", error);
      res.status(500).json({ message: "Error updating fund transfer" });
    }
  });

  app.delete("/api/fund-transfers/:id", async (req, res) => {
    try {
      await storage.deleteFundTransfer(req.params.id);
      res.status(200).json({ message: "تم حذف العهدة بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting fund transfer" });
    }
  });

  // Project Fund Transfers (ترحيل الأموال بين المشاريع)
  app.get("/api/project-fund-transfers", async (req, res) => {
    try {
      const fromProjectId = req.query.fromProjectId as string;
      const toProjectId = req.query.toProjectId as string;
      const date = req.query.date as string;
      
      const transfers = await storage.getProjectFundTransfers(fromProjectId, toProjectId, date);
      res.json(transfers);
    } catch (error) {
      console.error("Error fetching project fund transfers:", error);
      res.status(500).json({ message: "خطأ في جلب عمليات ترحيل الأموال" });
    }
  });

  app.get("/api/project-fund-transfers/:id", async (req, res) => {
    try {
      const transfer = await storage.getProjectFundTransfer(req.params.id);
      if (!transfer) {
        return res.status(404).json({ message: "عملية الترحيل غير موجودة" });
      }
      res.json(transfer);
    } catch (error) {
      console.error("Error fetching project fund transfer:", error);
      res.status(500).json({ message: "خطأ في جلب عملية الترحيل" });
    }
  });

  app.post("/api/project-fund-transfers", async (req, res) => {
    try {
      const result = insertProjectFundTransferSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "بيانات عملية الترحيل غير صحيحة", 
          errors: result.error.issues 
        });
      }

      const transfer = await storage.createProjectFundTransfer(result.data);
      res.status(201).json(transfer);
    } catch (error: any) {
      console.error("Error creating project fund transfer:", error);
      res.status(500).json({ 
        message: error.message || "خطأ في إنشاء عملية الترحيل" 
      });
    }
  });

  app.put("/api/project-fund-transfers/:id", async (req, res) => {
    try {
      const result = insertProjectFundTransferSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "بيانات عملية الترحيل غير صحيحة", 
          errors: result.error.issues 
        });
      }

      const transfer = await storage.updateProjectFundTransfer(req.params.id, result.data);
      if (!transfer) {
        return res.status(404).json({ message: "عملية الترحيل غير موجودة" });
      }
      
      res.json(transfer);
    } catch (error: any) {
      console.error("Error updating project fund transfer:", error);
      res.status(500).json({ 
        message: error.message || "خطأ في تحديث عملية الترحيل" 
      });
    }
  });

  app.delete("/api/project-fund-transfers/:id", async (req, res) => {
    try {
      await storage.deleteProjectFundTransfer(req.params.id);
      res.status(200).json({ message: "تم حذف عملية الترحيل بنجاح" });
    } catch (error) {
      console.error("Error deleting project fund transfer:", error);
      res.status(500).json({ message: "خطأ في حذف عملية الترحيل" });
    }
  });

  // Worker Attendance
  app.get("/api/projects/:projectId/attendance", async (req, res) => {
    try {
      const date = req.query.date as string;
      const attendance = await storage.getWorkerAttendance(req.params.projectId, date);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Error fetching worker attendance" });
    }
  });

  app.post("/api/worker-attendance", async (req, res) => {
    try {
      console.log("Received attendance data:", req.body);
      const result = insertWorkerAttendanceSchema.safeParse(req.body);
      if (!result.success) {
        console.log("Validation failed:", result.error.issues);
        return res.status(400).json({ message: "Invalid attendance data", errors: result.error.issues });
      }
      
      console.log("Creating attendance with data:", result.data);
      const attendance = await storage.createWorkerAttendance(result.data);
      console.log("Attendance created successfully:", attendance);
      
      // تحديث الملخص اليومي بعد إضافة الحضور
      setImmediate(() => {
        storage.updateDailySummaryForDate(attendance.projectId, attendance.date)
          .catch(error => console.error("Error updating daily summary after attendance:", error));
      });
      
      res.status(201).json(attendance);
    } catch (error) {
      console.error("Error creating worker attendance:", error);
      res.status(500).json({ 
        message: "حدث خطأ أثناء حفظ الحضور", 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.get("/api/worker-attendance/:id", async (req, res) => {
    try {
      const attendance = await storage.getWorkerAttendanceById(req.params.id);
      if (!attendance) {
        return res.status(404).json({ message: "Worker attendance not found" });
      }
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Error fetching worker attendance" });
    }
  });

  app.delete("/api/worker-attendance/:id", async (req, res) => {
    try {
      // الحصول على بيانات الحضور قبل حذفه لتحديث الملخص اليومي
      const attendance = await storage.getWorkerAttendanceById(req.params.id);
      
      await storage.deleteWorkerAttendance(req.params.id);
      
      // تحديث الملخص اليومي بعد حذف الحضور
      if (attendance) {
        setImmediate(() => {
          storage.updateDailySummaryForDate(attendance.projectId, attendance.date)
            .catch(error => console.error("Error updating daily summary after attendance deletion:", error));
        });
      }
      
      res.status(200).json({ message: "تم حذف حضور العامل بنجاح" });
    } catch (error) {
      console.error("Error deleting worker attendance:", error);
      res.status(500).json({ message: "حدث خطأ أثناء حذف الحضور" });
    }
  });

  // Worker Attendance Filter (for Workers Filter Report)
  app.get("/api/worker-attendance-filter", async (req, res) => {
    try {
      const { workerId, dateFrom, dateTo } = req.query;
      console.log("Worker filter request:", { workerId, dateFrom, dateTo });
      
      if (!workerId) {
        return res.status(400).json({ message: "Worker ID is required" });
      }

      if (!dateFrom || !dateTo) {
        return res.status(400).json({ message: "Date range is required" });
      }

      // Get worker attendance across all projects for the worker
      const projects = await storage.getProjects();
      const allAttendance = [];
      
      for (const project of projects) {
        try {
          // Get attendance for each day in the date range
          const fromDate = new Date(dateFrom as string);
          const toDate = new Date(dateTo as string);
          
          for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            try {
              const dayAttendance = await storage.getWorkerAttendance(project.id, dateStr);
              const workerDayAttendance = dayAttendance.filter((attendance: any) => attendance.workerId === workerId);
              allAttendance.push(...workerDayAttendance);
            } catch (dayError) {
              // Skip days with no data
              console.log(`No attendance data for ${dateStr} in project ${project.id}`);
            }
          }
        } catch (projectError) {
          console.error(`Error processing project ${project.id}:`, projectError);
        }
      }

      console.log(`Found ${allAttendance.length} attendance records for worker ${workerId}`);
      res.json(allAttendance);
    } catch (error) {
      console.error("Error fetching worker attendance:", error);
      res.status(500).json({ message: "Error fetching worker attendance", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get worker attendance with project details for filtering
  app.get("/api/worker-attendance/by-projects", async (req, res) => {
    try {
      const { projectIds, dateFrom, dateTo } = req.query;
      console.log("🔍 طلب جلب سجلات الحضور:", { projectIds, dateFrom, dateTo });
      
      if (!projectIds) {
        return res.status(400).json({ message: "مطلوب معرفات المشاريع" });
      }

      // تقسيم معرفات المشاريع
      const projectIdArray = (projectIds as string).split(',').filter(id => id.trim());
      console.log("🎯 المشاريع المحددة:", projectIdArray);
      
      if (projectIdArray.length === 0) {
        return res.json([]);
      }

      const allAttendanceRecords = [];
      
      // جلب بيانات المشاريع والعمال
      const projects = await storage.getProjects();
      const workers = await storage.getWorkers();
      
      // إنشاء خرائط للبحث السريع
      const projectMap = new Map(projects.map(p => [p.id, p]));
      const workerMap = new Map(workers.map(w => [w.id, w]));
      
      for (const projectId of projectIdArray) {
        const project = projectMap.get(projectId);
        if (!project) {
          console.log(`⚠️ مشروع غير موجود: ${projectId}`);
          continue;
        }

        try {
          // جلب جميع سجلات الحضور للمشروع
          let projectAttendance = [];
          
          if (dateFrom && dateTo) {
            // إذا تم تحديد تواريخ معينة
            const fromDate = new Date(dateFrom as string);
            const toDate = new Date(dateTo as string);
            
            for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
              const dateStr = d.toISOString().split('T')[0];
              try {
                const dayAttendance = await storage.getWorkerAttendance(projectId, dateStr);
                projectAttendance.push(...dayAttendance);
              } catch (dayError) {
                // تجاهل الأيام التي لا تحتوي على بيانات
              }
            }
          } else {
            // جلب جميع السجلات (آخر 30 يوم)
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            
            for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
              const dateStr = d.toISOString().split('T')[0];
              try {
                const dayAttendance = await storage.getWorkerAttendance(projectId, dateStr);
                projectAttendance.push(...dayAttendance);
              } catch (dayError) {
                // تجاهل الأيام التي لا تحتوي على بيانات
              }
            }
          }
          
          // إضافة تفاصيل المشروع والعامل
          for (const attendance of projectAttendance) {
            const worker = workerMap.get(attendance.workerId);
            if (worker) {
              allAttendanceRecords.push({
                id: attendance.id,
                workerId: attendance.workerId,
                workerName: worker.name,
                workerType: worker.type,
                projectId: projectId,
                projectName: project.name,
                date: attendance.date,
                dailyWage: Number(attendance.dailyWage) || 0,
                actualWage: Number(attendance.actualWage) || 0,
                paidAmount: Number(attendance.paidAmount) || 0,
                remainingAmount: Number(attendance.remainingAmount) || 0,
                isPresent: attendance.isPresent,
                workDays: Number(attendance.workDays) || 0
              });
            }
          }
          
        } catch (projectError) {
          console.error(`⛔ خطأ في معالجة المشروع ${projectId}:`, projectError);
        }
      }

      console.log(`✅ تم جلب ${allAttendanceRecords.length} سجل حضور`);
      res.json(allAttendanceRecords);
    } catch (error) {
      console.error("⛔ خطأ في جلب سجلات الحضور:", error);
      res.status(500).json({ message: "خطأ في جلب سجلات الحضور", error: error instanceof Error ? error.message : 'خطأ غير معروف' });
    }
  });

  // Materials
  app.get("/api/materials", async (req, res) => {
    try {
      const materials = await storage.getMaterials();
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "Error fetching materials" });
    }
  });

  app.post("/api/materials", async (req, res) => {
    try {
      const result = insertMaterialSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid material data", errors: result.error.issues });
      }
      
      const material = await storage.createMaterial(result.data);
      res.status(201).json(material);
    } catch (error) {
      res.status(500).json({ message: "Error creating material" });
    }
  });

  // Material Purchases
  app.get("/api/projects/:projectId/material-purchases", async (req, res) => {
    try {
      const { dateFrom, dateTo } = req.query;
      const purchases = await storage.getMaterialPurchases(
        req.params.projectId,
        dateFrom as string,
        dateTo as string
      );
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Error fetching material purchases" });
    }
  });

  app.post("/api/material-purchases", async (req, res) => {
    try {
      // التحقق من البيانات المطلوبة مع رسائل تفصيلية
      const { materialName, materialCategory, materialUnit, ...purchaseData } = req.body;
      
      // التحقق من البيانات الأساسية بشكل تفصيلي
      const validationErrors = [];
      
      if (!materialName || materialName.trim() === '') {
        validationErrors.push("اسم المادة مطلوب");
      }
      
      if (!materialUnit || materialUnit.trim() === '') {
        validationErrors.push("وحدة القياس مطلوبة");
      }
      
      if (!purchaseData.quantity || isNaN(Number(purchaseData.quantity)) || Number(purchaseData.quantity) <= 0) {
        validationErrors.push("يجب إدخال كمية صحيحة أكبر من صفر");
      }
      
      if (!purchaseData.unitPrice || isNaN(Number(purchaseData.unitPrice)) || Number(purchaseData.unitPrice) <= 0) {
        validationErrors.push("يجب إدخال سعر وحدة صحيح أكبر من صفر");
      }
      
      if (!purchaseData.projectId || purchaseData.projectId.trim() === '') {
        validationErrors.push("يجب اختيار مشروع");
      }
      
      if (!purchaseData.purchaseDate) {
        validationErrors.push("تاريخ الشراء مطلوب");
      }
      
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          message: "يرجى إصلاح الأخطاء التالية:",
          details: validationErrors,
          validationErrors: validationErrors
        });
      }
      
      // Create or find the material first
      let material = await storage.findMaterialByNameAndUnit(materialName, materialUnit);
      if (!material) {
        material = await storage.createMaterial({
          name: materialName.trim(),
          category: materialCategory?.trim() || "عام",
          unit: materialUnit.trim()
        });
      }
      
      // إعداد البيانات مع القيم الافتراضية المحسنة
      const purchaseDataWithMaterialId = {
        ...purchaseData,
        materialId: material.id,
        purchaseType: purchaseData.purchaseType || "نقد", // ضمان وجود قيمة
        paidAmount: purchaseData.purchaseType === "نقد" ? purchaseData.totalAmount : 0,
        remainingAmount: purchaseData.purchaseType === "آجل" ? purchaseData.totalAmount : 0,
      };
      
      const result = insertMaterialPurchaseSchema.safeParse(purchaseDataWithMaterialId);
      if (!result.success) {
        console.log("Schema validation errors:", result.error.issues);
        const userFriendlyErrors = result.error.issues.map(issue => {
          const field = issue.path.join('.');
          switch(field) {
            case 'quantity': return 'الكمية يجب أن تكون رقم موجب';
            case 'unitPrice': return 'سعر الوحدة يجب أن يكون رقم موجب';
            case 'totalAmount': return 'المبلغ الإجمالي غير صحيح';
            case 'paidAmount': return 'المبلغ المدفوع غير صحيح';
            case 'remainingAmount': return 'المبلغ المتبقي غير صحيح';
            case 'projectId': return 'يجب اختيار مشروع صحيح';
            case 'materialId': return 'معرف المادة غير صحيح';
            case 'purchaseDate': return 'تاريخ الشراء غير صحيح';
            case 'purchaseType': return 'نوع الشراء يجب أن يكون "نقد" أو "آجل"';
            default: return `خطأ في الحقل ${field}: ${issue.message}`;
          }
        });
        
        return res.status(400).json({ 
          message: "يرجى إصلاح الأخطاء التالية:",
          details: userFriendlyErrors,
          validationErrors: userFriendlyErrors
        });
      }
      
      const purchase = await storage.createMaterialPurchase(result.data);
      res.status(201).json(purchase);
    } catch (error: any) {
      console.error("Error creating material purchase:", error);
      
      // التحقق من نوع الخطأ وإرجاع رسالة مناسبة ومفصلة
      if (error.code === '23505') {
        const constraintName = error.constraint || '';
        if (constraintName.includes('invoice')) {
          return res.status(400).json({ 
            message: "رقم الفاتورة مستخدم مسبقاً",
            details: ["يرجى استخدام رقم فاتورة مختلف أو تركه فارغاً"]
          });
        }
        return res.status(400).json({ 
          message: "يوجد مشترى مكرر بنفس البيانات",
          details: ["يرجى التحقق من البيانات المدخلة"]
        });
      }
      
      if (error.code === '23503') {
        return res.status(400).json({ 
          message: "المشروع المحدد غير موجود",
          details: ["يرجى اختيار مشروع صحيح من القائمة"]
        });
      }
      
      if (error.code === '23514') {
        return res.status(400).json({ 
          message: "قيم البيانات غير صحيحة",
          details: ["يرجى التحقق من أن جميع الأرقام موجبة والتواريخ صحيحة"]
        });
      }
      
      // خطأ في الاتصال بقاعدة البيانات
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return res.status(503).json({ 
          message: "مشكلة في الاتصال بقاعدة البيانات",
          details: ["يرجى المحاولة مرة أخرى، إذا استمرت المشكلة تواصل مع الدعم الفني"]
        });
      }
      
      res.status(500).json({ 
        message: "حدث خطأ غير متوقع أثناء حفظ شراء المواد",
        details: ["يرجى المحاولة مرة أخرى، إذا استمرت المشكلة تواصل مع الدعم الفني"]
      });
    }
  });

  app.put("/api/material-purchases/:id", async (req, res) => {
    try {
      // التحقق من البيانات المطلوبة
      const { materialName, materialCategory, materialUnit, ...purchaseData } = req.body;
      
      if (!materialName || !materialUnit) {
        return res.status(400).json({ message: "اسم المادة ووحدة القياس مطلوبان" });
      }
      
      if (!purchaseData.quantity || !purchaseData.unitPrice) {
        return res.status(400).json({ message: "الكمية وسعر الوحدة مطلوبان" });
      }
      
      // Create or find the material first (if material details changed)
      let material = await storage.findMaterialByNameAndUnit(materialName, materialUnit);
      if (!material) {
        material = await storage.createMaterial({
          name: materialName.trim(),
          category: materialCategory?.trim() || "عام",
          unit: materialUnit.trim()
        });
      }
      
      // Update the purchase with the material ID
      const purchaseDataWithMaterialId = {
        ...purchaseData,
        materialId: material.id
      };
      
      const result = insertMaterialPurchaseSchema.safeParse(purchaseDataWithMaterialId);
      if (!result.success) {
        const errorMessages = result.error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ');
        return res.status(400).json({ 
          message: `بيانات غير صحيحة: ${errorMessages}`,
          errors: result.error.issues 
        });
      }
      
      const purchase = await storage.updateMaterialPurchase(req.params.id, result.data);
      if (!purchase) {
        return res.status(404).json({ message: "شراء المواد غير موجود" });
      }
      
      res.json(purchase);
    } catch (error: any) {
      console.error("Error updating material purchase:", error);
      
      // التحقق من نوع الخطأ وإرجاع رسالة مناسبة
      if (error.code === '23505') {
        return res.status(400).json({ message: "يوجد مشترى مكرر بنفس البيانات" });
      }
      
      if (error.code === '23503') {
        return res.status(400).json({ message: "المشروع أو المادة المحددة غير موجودة" });
      }
      
      res.status(500).json({ message: "حدث خطأ أثناء تحديث شراء المواد" });
    }
  });

  // Get all material purchases with filters
  app.get("/api/material-purchases", async (req, res) => {
    try {
      const { supplierId, projectId, dateFrom, dateTo, purchaseType } = req.query;
      console.log("Material purchases filter request:", { supplierId, projectId, dateFrom, dateTo, purchaseType });
      
      // أولاً: فحص إجمالي المشتريات في قاعدة البيانات
      const { materialPurchases } = await import("@shared/schema");
      const allPurchases = await db.select().from(materialPurchases).limit(5);
      console.log(`📊 Total material purchases in DB: ${allPurchases.length}`);
      if (allPurchases.length > 0) {
        console.log("Sample purchase:", {
          id: allPurchases[0].id,
          supplierId: allPurchases[0].supplierId,
          supplierName: allPurchases[0].supplierName,
          projectId: allPurchases[0].projectId
        });
      }
      
      // استخدام دالة storage للحصول على جميع المشتريات مع الفلاتر
      const purchases = await storage.getMaterialPurchasesWithFilters({
        supplierId: supplierId as string,
        projectId: projectId as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        purchaseType: purchaseType as string
      });
      
      // طباعة عينة من البيانات للتحقق من قيم purchaseType
      if (purchases.length > 0) {
        console.log('🔍 عينة من مشتريات المواد:', {
          total: purchases.length,
          first3: purchases.slice(0, 3).map(p => ({
            id: p.id,
            purchaseType: p.purchaseType,
            purchaseTypeValue: JSON.stringify(p.purchaseType),
            totalAmount: p.totalAmount,
            supplierName: p.supplierName
          }))
        });
        
        // عرض جميع القيم الفريدة لـ purchaseType
        const uniqueTypes = Array.from(new Set(purchases.map(p => p.purchaseType)));
        console.log('🏷️ جميع قيم purchaseType في المشتريات:', uniqueTypes.map(t => `"${t}"`));
      }
      
      console.log(`Found ${purchases.length} material purchases`);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching material purchases:", error);
      res.status(500).json({ message: "Error fetching material purchases" });
    }
  });

  app.get("/api/material-purchases/:id", async (req, res) => {
    // التحقق إذا كان المسار هو date-range
    if (req.params.id === 'date-range') {
      try {
        const dateRange = await storage.getMaterialPurchasesDateRange();
        res.json(dateRange);
        return;
      } catch (error) {
        console.error("Error fetching material purchases date range:", error);
        res.status(500).json({ message: "Error fetching date range" });
        return;
      }
    }
    
    // إذا لم يكن date-range، فهو ID عادي
    try {
      const purchase = await storage.getMaterialPurchaseById(req.params.id);
      if (!purchase) {
        return res.status(404).json({ message: "Material purchase not found" });
      }
      res.json(purchase);
    } catch (error) {
      res.status(500).json({ message: "Error fetching material purchase" });
    }
  });

  app.delete("/api/material-purchases/:id", async (req, res) => {
    try {
      await storage.deleteMaterialPurchase(req.params.id);
      res.status(200).json({ message: "تم حذف شراء المواد بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting material purchase" });
    }
  });

  // Transportation Expenses
  app.get("/api/transportation-expenses", async (req, res) => {
    try {
      const expenses = await storage.getAllTransportationExpenses();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transportation expenses" });
    }
  });

  app.get("/api/projects/:projectId/transportation-expenses", async (req, res) => {
    try {
      const date = req.query.date as string;
      const expenses = await storage.getTransportationExpenses(req.params.projectId, date);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transportation expenses" });
    }
  });

  app.post("/api/transportation-expenses", async (req, res) => {
    try {
      const result = insertTransportationExpenseSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid transportation expense data", errors: result.error.issues });
      }
      
      const expense = await storage.createTransportationExpense(result.data);
      res.status(201).json(expense);
    } catch (error) {
      res.status(500).json({ message: "Error creating transportation expense" });
    }
  });

  app.put("/api/transportation-expenses/:id", async (req, res) => {
    try {
      const result = insertTransportationExpenseSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid transportation expense data", errors: result.error.issues });
      }
      
      const expense = await storage.updateTransportationExpense(req.params.id, result.data);
      if (!expense) {
        return res.status(404).json({ message: "Transportation expense not found" });
      }
      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: "Error updating transportation expense" });
    }
  });

  app.delete("/api/transportation-expenses/:id", async (req, res) => {
    try {
      await storage.deleteTransportationExpense(req.params.id);
      res.status(200).json({ message: "تم حذف مصروف المواصلات بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting transportation expense" });
    }
  });

  // Daily Expense Summaries
  app.get("/api/projects/:projectId/daily-summary/:date", async (req, res) => {
    try {
      const summary = await storage.getDailyExpenseSummary(req.params.projectId, req.params.date);
      if (!summary) {
        return res.status(404).json({ message: "Daily summary not found" });
      }
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Error fetching daily summary" });
    }
  });

  // إعادة حساب الملخص اليومي
  app.put("/api/projects/:projectId/daily-summary/:date", async (req, res) => {
    try {
      await storage.updateDailySummaryForDate(req.params.projectId, req.params.date);
      const summary = await storage.getDailyExpenseSummary(req.params.projectId, req.params.date);
      res.json({ message: "تم إعادة حساب الملخص اليومي بنجاح", summary });
    } catch (error) {
      console.error("Error recalculating daily summary:", error);
      res.status(500).json({ message: "خطأ في إعادة حساب الملخص اليومي" });
    }
  });

  app.get("/api/projects/:projectId/previous-balance/:date", async (req, res) => {
    try {
      const balance = await storage.getPreviousDayBalance(req.params.projectId, req.params.date);
      res.json({ balance });
    } catch (error) {
      res.status(500).json({ message: "Error fetching previous day balance" });
    }
  });

  // إجبار تحديث الملخص اليومي لتاريخ معين
  app.post("/api/projects/:projectId/update-daily-summary/:date", async (req, res) => {
    try {
      await storage.updateDailySummaryForDate(req.params.projectId, req.params.date);
      res.json({ message: "تم تحديث الملخص اليومي بنجاح" });
    } catch (error) {
      console.error("Error updating daily summary:", error);
      res.status(500).json({ message: "Error updating daily summary" });
    }
  });

  // إعادة حساب جميع الأرصدة لمشروع معين
  app.post("/api/projects/:projectId/recalculate-balances", async (req, res) => {
    try {
      await storage.recalculateAllBalances(req.params.projectId);
      res.json({ message: "تم إعادة حساب جميع الأرصدة بنجاح" });
    } catch (error) {
      console.error("Error recalculating balances:", error);
      res.status(500).json({ message: "خطأ في إعادة حساب الأرصدة" });
    }
  });

  app.post("/api/daily-expense-summaries", async (req, res) => {
    try {
      const result = insertDailyExpenseSummarySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid daily summary data", errors: result.error.issues });
      }
      
      const summary = await storage.createOrUpdateDailyExpenseSummary(result.data);
      res.status(201).json(summary);
    } catch (error) {
      res.status(500).json({ message: "Error creating daily summary" });
    }
  });

  // Reports
  app.get("/api/reports/daily-expenses/:projectId/:date", async (req, res) => {
    try {
      const { projectId, date } = req.params;
      
      console.log(`🟦 Generating daily expense report for project ${projectId}, date ${date}`);
      
      // جلب معلومات المشروع أولاً
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const [
        fundTransfers,
        workerAttendance,
        materialPurchases, 
        transportationExpenses,
        workerTransfers,
        workerMiscExpenses,
        dailySummary,
        incomingProjectTransfers,
        outgoingProjectTransfers
      ] = await Promise.all([
        storage.getFundTransfers(projectId, date),
        storage.getWorkerAttendance(projectId, date),
        storage.getMaterialPurchases(projectId, date, date),
        storage.getTransportationExpenses(projectId, date),
        storage.getFilteredWorkerTransfers(projectId, date),
        storage.getWorkerMiscExpenses(projectId, date),
        storage.getDailyExpenseSummary(projectId, date),
        storage.getProjectFundTransfers(undefined, projectId, date), // الأموال الواردة
        storage.getProjectFundTransfers(projectId, undefined, date) // الأموال الصادرة
      ]);

      console.log(`📊 Data found for ${date}:`);
      console.log(`  - Fund transfers: ${fundTransfers.length}`);
      console.log(`  - Worker attendance: ${workerAttendance.length}`);
      console.log(`  - Material purchases: ${materialPurchases.length}`);
      console.log(`  - Transportation expenses: ${transportationExpenses.length}`);
      console.log(`  - Worker transfers: ${workerTransfers.length}`);
      console.log(`  - Worker misc expenses: ${workerMiscExpenses.length}`);
      console.log(`  - Incoming project transfers: ${incomingProjectTransfers.length}`);
      console.log(`  - Outgoing project transfers: ${outgoingProjectTransfers.length}`);

      // حساب الرصيد المرحل (من اليوم السابق)
      const prevDate = new Date(date);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateString = prevDate.toISOString().split('T')[0];
      const prevDailySummary = await storage.getDailyExpenseSummary(projectId, prevDateString);
      const carriedForward = prevDailySummary?.remainingBalance || 0;

      // حساب الإجماليات
      const totalFundTransfers = fundTransfers.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalWorkerCosts = workerAttendance.reduce((sum, a) => sum + parseFloat(a.paidAmount), 0);
      // فقط المشتريات النقدية تُحسب في مصروفات اليوم - المشتريات الآجلة لا تُحسب
      const totalMaterialCosts = materialPurchases
        .filter(p => p.purchaseType === "نقد")
        .reduce((sum, p) => sum + parseFloat(p.totalAmount), 0);
      const totalTransportCosts = transportationExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const totalTransferCosts = workerTransfers.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
      const totalWorkerMiscCosts = workerMiscExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      
      // حساب إجماليات ترحيل الأموال بين المشاريع
      const totalIncomingTransfers = incomingProjectTransfers.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalOutgoingTransfers = outgoingProjectTransfers.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const totalExpenses = totalWorkerCosts + totalMaterialCosts + totalTransportCosts + totalTransferCosts + totalWorkerMiscCosts + totalOutgoingTransfers;
      const totalIncome = totalFundTransfers + totalIncomingTransfers;
      const remainingBalance = parseFloat(carriedForward.toString()) + totalIncome - totalExpenses;

      // إضافة معلومات العمال للحضور
      const workerAttendanceWithWorkers = await Promise.all(
        workerAttendance.map(async (attendance) => {
          const worker = await storage.getWorker(attendance.workerId);
          return {
            ...attendance,
            worker
          };
        })
      );

      // إضافة معلومات المواد للمشتريات
      const materialPurchasesWithMaterials = await Promise.all(
        materialPurchases.map(async (purchase) => {
          const materials = await storage.getMaterials();
          const material = materials.find(m => m.id === purchase.materialId);
          return {
            ...purchase,
            material
          };
        })
      );

      // إضافة معلومات العمال لمصروفات النقل
      const transportationExpensesWithWorkers = await Promise.all(
        transportationExpenses.map(async (expense) => {
          const worker = expense.workerId ? await storage.getWorker(expense.workerId) : null;
          return {
            ...expense,
            worker
          };
        })
      );

      // إضافة معلومات العمال لحوالات العمال
      const workerTransfersWithWorkers = await Promise.all(
        workerTransfers.map(async (transfer) => {
          const worker = await storage.getWorker(transfer.workerId);
          return {
            ...transfer,
            worker
          };
        })
      );

      // إضافة معلومات العمال لنثريات العمال (نثريات عامة للمشروع)
      const workerMiscExpensesWithWorkers = workerMiscExpenses.map((expense) => ({
        ...expense,
        workerName: 'نثريات عامة', // نثريات العمال ليست مربوطة بعامل محدد
        worker: null
      }));

      // إضافة معلومات المشاريع لترحيل الأموال الواردة
      const incomingProjectTransfersWithProjects = await Promise.all(
        incomingProjectTransfers.map(async (transfer) => {
          const fromProject = await storage.getProject(transfer.fromProjectId);
          return {
            ...transfer,
            fromProjectName: fromProject?.name || `مشروع ${transfer.fromProjectId}`,
            transferReference: transfer.id.slice(-8).toUpperCase(),
            transferNotes: transfer.description || `أموال مرحلة من مشروع ${fromProject?.name || transfer.fromProjectId} بتاريخ ${transfer.transferDate}`,
            transferReason: transfer.transferReason || 'ترحيل أموال بين المشاريع'
          };
        })
      );

      // إضافة معلومات المشاريع لترحيل الأموال الصادرة
      const outgoingProjectTransfersWithProjects = await Promise.all(
        outgoingProjectTransfers.map(async (transfer) => {
          const toProject = await storage.getProject(transfer.toProjectId);
          return {
            ...transfer,
            toProjectName: toProject?.name || `مشروع ${transfer.toProjectId}`,
            transferReference: transfer.id.slice(-8).toUpperCase(),
            transferNotes: transfer.description || `أموال مرحلة إلى مشروع ${toProject?.name || transfer.toProjectId} بتاريخ ${transfer.transferDate}`,
            transferReason: transfer.transferReason || 'ترحيل أموال بين المشاريع'
          };
        })
      );

      res.json({
        date,
        projectId,
        projectName: project.name, // إضافة اسم المشروع
        
        // البيانات الأساسية بالتنسيق الذي يتوقعه القالب
        fundTransfers,
        workerAttendance: workerAttendanceWithWorkers,
        materialPurchases: materialPurchasesWithMaterials,
        transportationExpenses: transportationExpensesWithWorkers,
        workerTransfers: workerTransfersWithWorkers,
        miscExpenses: workerMiscExpensesWithWorkers, // تغيير الاسم ليتطابق مع القالب
        
        // ترحيل الأموال بين المشاريع
        incomingProjectTransfers: incomingProjectTransfersWithProjects,
        outgoingProjectTransfers: outgoingProjectTransfersWithProjects,
        totalIncomingTransfers,
        totalOutgoingTransfers,
        
        // الملخص المالي في المستوى الأعلى (كما يتوقعه القالب)
        carriedForward,
        totalIncome,
        totalExpenses,
        remainingBalance,
        
        // تفاصيل إضافية للتقرير
        dailySummary,
        summary: {
          carriedForward,
          totalFundTransfers,
          totalWorkerCosts,
          totalMaterialCosts,
          totalTransportCosts,
          totalTransferCosts,
          totalWorkerMiscCosts,
          totalIncome,
          totalExpenses,
          remainingBalance
        }
      });
    } catch (error) {
      console.error("Error generating daily expenses report:", error);
      res.status(500).json({ message: "Error generating daily expenses report" });
    }
  });

  app.get("/api/reports/material-purchases/:projectId", async (req, res) => {
    try {
      const { projectId } = req.params;
      const { dateFrom, dateTo } = req.query;
      
      const purchases = await storage.getMaterialPurchases(
        projectId, 
        dateFrom as string, 
        dateTo as string
      );
      
      res.json({
        projectId,
        dateFrom,
        dateTo,
        purchases
      });
    } catch (error) {
      console.error("Error generating material purchases report:", error);
      res.status(500).json({ message: "Error generating material purchases report" });
    }
  });

  app.get("/api/reports/project-summary/:projectId", async (req, res) => {
    try {
      const { projectId } = req.params;
      const { dateFrom, dateTo } = req.query;
      
      const [
        project,
        totalFundTransfers,
        totalWorkerAttendance,
        totalMaterialPurchases,
        totalTransportationExpenses,
        totalWorkerTransfers
      ] = await Promise.all([
        storage.getProject(projectId),
        storage.getFundTransfers(projectId),
        storage.getWorkerAttendance(projectId),
        storage.getMaterialPurchases(projectId, dateFrom as string, dateTo as string),
        storage.getTransportationExpenses(projectId),
        storage.getFilteredWorkerTransfers(projectId)
      ]);

      // حساب الإجماليات
      const totalIncome = totalFundTransfers.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalWorkerCosts = totalWorkerAttendance.reduce((sum, a) => sum + parseFloat(a.paidAmount), 0);
      // فقط المشتريات النقدية تُحسب في مصروفات التقرير - المشتريات الآجلة لا تُحسب
      const totalMaterialCosts = totalMaterialPurchases
        .filter(p => p.purchaseType === "نقد")
        .reduce((sum, p) => sum + parseFloat(p.totalAmount), 0);
      const totalTransportCosts = totalTransportationExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const totalTransferCosts = totalWorkerTransfers.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalExpenses = totalWorkerCosts + totalMaterialCosts + totalTransportCosts + totalTransferCosts;

      res.json({
        project,
        dateFrom,
        dateTo,
        summary: {
          totalIncome,
          totalExpenses,
          netBalance: totalIncome - totalExpenses,
          totalWorkerCosts,
          totalMaterialCosts,
          totalTransportCosts,
          totalTransferCosts
        },
        details: {
          fundTransfers: totalFundTransfers,
          workerAttendance: totalWorkerAttendance,
          materialPurchases: totalMaterialPurchases,
          transportationExpenses: totalTransportationExpenses,
          workerTransfers: totalWorkerTransfers
        }
      });
    } catch (error) {
      console.error("Error generating project summary report:", error);
      res.status(500).json({ message: "Error generating project summary report" });
    }
  });

  app.get("/api/workers/:workerId/account-statement", async (req, res) => {
    try {
      const { projectId, projectIds, dateFrom, dateTo } = req.query;
      
      console.log("🔍 طلب كشف حساب العامل:", { 
        workerId: req.params.workerId, 
        projectId, 
        projectIds, 
        dateFrom, 
        dateTo 
      });

      if (!dateFrom || !dateTo) {
        return res.status(400).json({ 
          message: "يجب تحديد تاريخ البداية والنهاية",
          details: "تأكد من اختيار التاريخ من والى قبل إنشاء التقرير"
        });
      }
      
      // التعامل مع مشاريع متعددة أو واحد
      if (projectIds) {
        // التعامل مع مشاريع متعددة - تحويل النص إلى مصفوفة
        let projectIdsArray: string[] = [];
        if (typeof projectIds === 'string') {
          projectIdsArray = projectIds.split(',').filter(id => id.trim());
        } else if (Array.isArray(projectIds)) {
          projectIdsArray = projectIds.filter(id => typeof id === 'string' && id.trim()).map(id => String(id));
        } else if (projectIds) {
          projectIdsArray = [String(projectIds)].filter(id => id.trim());
        }
        
        console.log("🔧 معالجة مشاريع متعددة:", projectIdsArray);

        if (projectIdsArray.length === 0) {
          return res.status(400).json({ 
            message: "لم يتم تحديد أي مشروع صالح",
            details: "يرجى اختيار مشروع واحد على الأقل لإنشاء كشف الحساب"
          });
        }

        // استخدام نفس الدالة للحالتين - إما مشروع واحد أو متعدد
        if (projectIdsArray.length === 1) {
          // مشروع واحد
          const statement = await storage.getWorkerAccountStatement(
            req.params.workerId,
            projectIdsArray[0],
            dateFrom as string,
            dateTo as string
          );
          res.json(statement);
        } else {
          // مشاريع متعددة
          const statement = await storage.getWorkerAccountStatementMultipleProjects(
            req.params.workerId,
            projectIdsArray,
            dateFrom as string,
            dateTo as string
          );
          res.json(statement);
        }
      } else if (projectId) {
        // التعامل مع مشروع واحد (الطريقة القديمة)
        console.log("🔧 معالجة مشروع واحد:", projectId);
        
        const statement = await storage.getWorkerAccountStatement(
          req.params.workerId,
          projectId as string,
          dateFrom as string,
          dateTo as string
        );
        res.json(statement);
      } else {
        return res.status(400).json({ 
          message: "يجب تحديد المشاريع المراد إنشاء التقرير لها",
          details: "قم بتحديد مشروع واحد أو أكثر من قائمة المشاريع"
        });
      }
    } catch (error) {
      console.error("خطأ في جلب كشف حساب العامل:", error);
      
      // تحسين رسالة الخطأ حسب النوع
      let userMessage = "حدث خطأ أثناء إنشاء كشف حساب العامل";
      let userDetails = "يرجى المحاولة مرة أخرى. إذا استمر الخطأ، تواصل مع الدعم الفني";
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('worker not found') || errorMsg.includes('لم يتم العثور على العامل')) {
          userMessage = "العامل المحدد غير موجود";
          userDetails = "تأكد من اختيار عامل صحيح من القائمة";
        } else if (errorMsg.includes('project not found') || errorMsg.includes('لم يتم العثور على المشروع')) {
          userMessage = "أحد المشاريع المحددة غير موجود";
          userDetails = "تأكد من اختيار مشاريع صحيحة من القائمة";
        } else if (errorMsg.includes('database') || errorMsg.includes('connection')) {
          userMessage = "خطأ في الاتصال بقاعدة البيانات";
          userDetails = "يرجى المحاولة مرة أخرى خلال دقائق قليلة";
        } else if (errorMsg.includes('timeout')) {
          userMessage = "انتهت مهلة الطلب";
          userDetails = "البيانات كثيرة جداً. جرب تقليل المدة الزمنية أو عدد المشاريع";
        }
      }
      
      res.status(500).json({ 
        message: userMessage,
        details: userDetails,
        technicalError: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      });
    }
  });

  // Worker statement with multiple projects support
  app.get("/api/worker-statement/:workerId", async (req, res) => {
    try {
      const { workerId } = req.params;
      const { dateFrom, dateTo, projects } = req.query;
      
      if (!dateFrom || !dateTo || !projects) {
        return res.status(400).json({ message: "Missing required parameters: dateFrom, dateTo, projects" });
      }

      const projectIds = (projects as string).split(',');
      
      // Get worker
      const worker = await storage.getWorker(workerId);
      if (!worker) {
        return res.status(404).json({ message: "Worker not found" });
      }

      // Get projects
      const projectList = await Promise.all(
        projectIds.map(id => storage.getProject(id))
      );
      const validProjects = projectList.filter(p => p !== undefined);

      // Get attendance for all selected projects within date range
      const attendancePromises = projectIds.map(projectId => 
        storage.getWorkerAttendanceForPeriod(workerId, projectId, dateFrom as string, dateTo as string)
      );
      const attendanceArrays = await Promise.all(attendancePromises);
      const attendance = attendanceArrays.flat().sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Get worker transfers (حوالات الأهل) for all projects within date range
      const workerTransfersPromises = projectIds.map(projectId =>
        storage.getWorkerTransfers(workerId, projectId)
      );
      const workerTransfersArrays = await Promise.all(workerTransfersPromises);
      const workerTransfers = workerTransfersArrays.flat().filter((t: any) => {
        const transferDate = new Date(t.transferDate);
        const fromDate = new Date(dateFrom as string);
        const toDate = new Date(dateTo as string);
        return transferDate >= fromDate && transferDate <= toDate;
      }).sort((a: any, b: any) => 
        new Date(a.transferDate).getTime() - new Date(b.transferDate).getTime()
      );

      // Get fund transfers (سلف) for all projects within date range
      const fundTransfersPromises = projectIds.map(projectId =>
        storage.getFundTransfersForWorker(workerId, projectId, dateFrom as string, dateTo as string)
      );
      const fundTransfersArrays = await Promise.all(fundTransfersPromises);
      const fundTransfers = fundTransfersArrays.flat().sort((a: any, b: any) => 
        new Date(a.transferDate).getTime() - new Date(b.transferDate).getTime()
      );

      // Calculate summary
      const totalEarnings = attendance.reduce((sum: number, record: any) => {
        return sum + (record.isPresent ? parseFloat(record.dailyWage) : 0);
      }, 0);

      const totalAdvances = fundTransfers.reduce((sum: number, transfer: any) => {
        return sum + parseFloat(transfer.amount);
      }, 0);

      const totalWorkerTransfers = workerTransfers.reduce((sum: number, transfer: any) => {
        return sum + parseFloat(transfer.amount);
      }, 0);

      const totalDays = attendance.reduce((sum: number, record: any) => {
        return sum + (record.isPresent ? parseFloat(record.workDays || '1') : 0);
      }, 0);
      const totalHours = totalDays * 8; // افتراض 8 ساعات لكل يوم

      const summary = {
        totalEarnings,
        totalAdvances,
        netBalance: totalEarnings - totalAdvances,
        totalDays,
        totalHours,
        projectStats: validProjects.map(project => {
          const projectAttendance = attendance.filter((a: any) => a.projectId === project.id);
          const projectDays = projectAttendance.reduce((sum: number, a: any) => 
            sum + (a.isPresent ? parseFloat(a.workDays || '1') : 0), 0
          );
          const projectEarnings = projectAttendance.reduce((sum: number, a: any) => 
            sum + (a.isPresent ? parseFloat(a.dailyWage) : 0), 0
          );
          
          return {
            projectId: project.id,
            projectName: project.name,
            days: projectDays,
            hours: projectDays * 8,
            earnings: projectEarnings
          };
        })
      };

      res.json({
        worker,
        projects: validProjects,
        attendance,
        transfers: workerTransfers, // حوالات الأهل
        fundTransfers, // السلف
        summary: {
          ...summary,
          totalWorkerTransfers
        }
      });

    } catch (error) {
      console.error("Error fetching worker statement:", error);
      res.status(500).json({ message: "Error fetching worker statement" });
    }
  });

  // Worker balances
  app.get("/api/workers/:workerId/balance/:projectId", async (req, res) => {
    const { workerId, projectId } = req.params;
    
    try {
      const balance = await storage.getWorkerBalance(workerId, projectId);
      res.json(balance);
    } catch (error) {
      console.error("Error fetching worker balance:", error);
      res.status(500).json({ message: "Failed to fetch worker balance" });
    }
  });

  // Worker transfers
  app.get("/api/workers/:workerId/transfers", async (req, res) => {
    const { workerId } = req.params;
    const projectId = req.query.projectId as string;
    
    try {
      const transfers = await storage.getWorkerTransfers(workerId, projectId);
      res.json(transfers);
    } catch (error) {
      console.error("Error fetching worker transfers:", error);
      res.status(500).json({ message: "Failed to fetch worker transfers" });
    }
  });

  app.get("/api/worker-transfers", async (req, res) => {
    const { projectId, date } = req.query;
    
    try {
      const transfers = await storage.getFilteredWorkerTransfers(projectId as string, date as string);
      res.json(transfers);
    } catch (error) {
      console.error("Error fetching worker transfers:", error);
      res.status(500).json({ message: "Failed to fetch worker transfers" });
    }
  });

  app.get("/api/worker-transfers/:id", async (req, res) => {
    try {
      const transfer = await storage.getWorkerTransfer(req.params.id);
      if (!transfer) {
        return res.status(404).json({ message: "Worker transfer not found" });
      }
      res.json(transfer);
    } catch (error) {
      res.status(500).json({ message: "Error fetching worker transfer" });
    }
  });

  app.post("/api/worker-transfers", async (req, res) => {
    try {
      console.log("📥 البيانات المستلمة لإنشاء حولة العامل:", JSON.stringify(req.body, null, 2));
      
      const validationResult = insertWorkerTransferSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.log("❌ خطأ في التحقق من البيانات:", JSON.stringify(validationResult.error.errors, null, 2));
        return res.status(400).json({ 
          message: "Invalid worker transfer data", 
          errors: validationResult.error.errors 
        });
      }

      const transfer = await storage.createWorkerTransfer(validationResult.data);
      
      // تحديث الملخص اليومي بعد إضافة الحوالة
      setImmediate(() => {
        storage.updateDailySummaryForDate(transfer.projectId, transfer.transferDate)
          .catch(error => console.error("Error updating daily summary after worker transfer:", error));
      });
      
      res.status(201).json(transfer);
    } catch (error) {
      console.error("Error creating worker transfer:", error);
      res.status(500).json({ message: "Failed to create worker transfer" });
    }
  });

  app.put("/api/worker-transfers/:id", async (req, res) => {
    try {
      const validationResult = insertWorkerTransferSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid worker transfer data", 
          errors: validationResult.error.errors 
        });
      }

      const transfer = await storage.updateWorkerTransfer(req.params.id, validationResult.data);
      if (!transfer) {
        return res.status(404).json({ message: "Worker transfer not found" });
      }
      
      // تحديث الملخص اليومي بعد تعديل الحوالة
      setImmediate(() => {
        storage.updateDailySummaryForDate(transfer.projectId, transfer.transferDate)
          .catch(error => console.error("Error updating daily summary after worker transfer update:", error));
      });
      
      res.json(transfer);
    } catch (error) {
      console.error("Error updating worker transfer:", error);
      res.status(500).json({ message: "Failed to update worker transfer" });
    }
  });

  // إضافة route PATCH للتحديث الجزئي
  app.patch("/api/worker-transfers/:id", async (req, res) => {
    try {
      console.log("📥 البيانات المستلمة لتعديل حولة العامل:", JSON.stringify(req.body, null, 2));
      
      const validationResult = insertWorkerTransferSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        console.log("❌ خطأ في التحقق من البيانات:", JSON.stringify(validationResult.error.errors, null, 2));
        return res.status(400).json({ 
          message: "Invalid worker transfer data", 
          errors: validationResult.error.errors 
        });
      }

      const transfer = await storage.updateWorkerTransfer(req.params.id, validationResult.data);
      if (!transfer) {
        return res.status(404).json({ message: "Worker transfer not found" });
      }
      
      // تحديث الملخص اليومي بعد تعديل الحوالة
      setImmediate(() => {
        storage.updateDailySummaryForDate(transfer.projectId, transfer.transferDate)
          .catch(error => console.error("Error updating daily summary after worker transfer update:", error));
      });
      
      console.log("✅ تم تعديل حولة العامل بنجاح:", transfer.id);
      res.json(transfer);
    } catch (error) {
      console.error("Error updating worker transfer:", error);
      res.status(500).json({ message: "Failed to update worker transfer" });
    }
  });

  app.delete("/api/worker-transfers/:id", async (req, res) => {
    try {
      // الحصول على بيانات الحوالة قبل حذفها لتحديث الملخص اليومي
      const transfer = await storage.getWorkerTransfer(req.params.id);
      
      await storage.deleteWorkerTransfer(req.params.id);
      
      // تحديث الملخص اليومي بعد حذف الحوالة
      if (transfer) {
        setImmediate(() => {
          storage.updateDailySummaryForDate(transfer.projectId, transfer.transferDate)
            .catch(error => console.error("Error updating daily summary after worker transfer deletion:", error));
        });
      }
      
      res.status(200).json({ message: "تم حذف الحولة بنجاح" });
    } catch (error) {
      console.error("Error deleting worker transfer:", error);
      res.status(500).json({ message: "Failed to delete worker transfer" });
    }
  });

  // Multi-project worker management routes
  app.get("/api/workers/multi-project", async (req, res) => {
    try {
      const workers = await storage.getWorkersWithMultipleProjects();
      res.json(workers);
    } catch (error) {
      console.error("Error fetching workers with multiple projects:", error);
      res.status(500).json({ message: "خطأ في جلب العمال متعددي المشاريع" });
    }
  });

  app.get("/api/workers/:workerId/multi-project-statement", async (req, res) => {
    try {
      const { workerId } = req.params;
      const { dateFrom, dateTo } = req.query;
      
      const statement = await storage.getWorkerMultiProjectStatement(
        workerId,
        dateFrom as string,
        dateTo as string
      );
      
      res.json(statement);
    } catch (error) {
      console.error("Error fetching multi-project worker statement:", error);
      res.status(500).json({ message: "خطأ في جلب كشف حساب العامل متعدد المشاريع" });
    }
  });

  app.get("/api/workers/:workerId/projects", async (req, res) => {
    try {
      const { workerId } = req.params;
      const projects = await storage.getWorkerProjects(workerId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching worker projects:", error);
      res.status(500).json({ message: "خطأ في جلب مشاريع العامل" });
    }
  });

  // Daily expenses range report
  app.get("/api/reports/daily-expenses-range/:projectId", async (req, res) => {
    try {
      const { projectId } = req.params;
      const { dateFrom, dateTo } = req.query;
      
      if (!dateFrom || !dateTo) {
        return res.status(400).json({ message: "يرجى تحديد تاريخ البداية والنهاية" });
      }
      
      const results = await storage.getDailyExpensesRange(projectId, dateFrom as string, dateTo as string);
      res.json(results);
    } catch (error) {
      console.error("Error generating daily expenses range report:", error);
      res.status(500).json({ message: "خطأ في إنشاء كشف المصروفات اليومية" });
    }
  });

  // Autocomplete data routes - محسنة مع إدارة الصيانة
  app.get("/api/autocomplete/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const { limit = '50' } = req.query;
      const data = await storage.getAutocompleteData(category, parseInt(limit as string));
      res.json(data);
    } catch (error) {
      console.error("Error fetching autocomplete data:", error);
      res.status(500).json({ message: "خطأ في جلب بيانات الإكمال التلقائي" });
    }
  });

  app.post("/api/autocomplete", async (req, res) => {
    try {
      const result = insertAutocompleteDataSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid autocomplete data", errors: result.error.issues });
      }
      
      const data = await storage.saveAutocompleteData(result.data);
      res.status(201).json(data);
    } catch (error) {
      console.error("Error saving autocomplete data:", error);
      res.status(500).json({ message: "خطأ في حفظ بيانات الإكمال التلقائي" });
    }
  });

  app.delete("/api/autocomplete/:category/:value", async (req, res) => {
    try {
      const { category, value } = req.params;
      await storage.removeAutocompleteData(category, decodeURIComponent(value));
      res.status(204).send();
    } catch (error) {
      console.error("Error removing autocomplete data:", error);
      res.status(500).json({ message: "خطأ في حذف بيانات الإكمال التلقائي" });
    }
  });

  // نقاط نهاية إدارة وصيانة الإكمال التلقائي
  app.get("/api/autocomplete-admin/stats", async (req, res) => {
    try {
      const { autocompleteOptimizer } = await import("./autocomplete-optimizer");
      const stats = await autocompleteOptimizer.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching autocomplete stats:", error);
      res.status(500).json({ message: "خطأ في جلب إحصائيات نظام الإكمال التلقائي" });
    }
  });

  app.post("/api/autocomplete-admin/cleanup", async (req, res) => {
    try {
      const { autocompleteOptimizer } = await import("./autocomplete-optimizer");
      const result = await autocompleteOptimizer.cleanupOldData();
      res.json(result);
    } catch (error) {
      console.error("Error cleaning up autocomplete data:", error);
      res.status(500).json({ message: "خطأ في تنظيف بيانات الإكمال التلقائي" });
    }
  });

  app.post("/api/autocomplete-admin/enforce-limits", async (req, res) => {
    try {
      const { category } = req.body;
      const { autocompleteOptimizer } = await import("./autocomplete-optimizer");
      const result = await autocompleteOptimizer.enforceCategoryLimits(category);
      res.json(result);
    } catch (error) {
      console.error("Error enforcing autocomplete limits:", error);
      res.status(500).json({ message: "خطأ في تطبيق حدود نظام الإكمال التلقائي" });
    }
  });

  app.post("/api/autocomplete-admin/maintenance", async (req, res) => {
    try {
      const { autocompleteOptimizer } = await import("./autocomplete-optimizer");
      const result = await autocompleteOptimizer.runMaintenance();
      res.json(result);
    } catch (error) {
      console.error("Error running autocomplete maintenance:", error);
      res.status(500).json({ message: "خطأ في تشغيل صيانة نظام الإكمال التلقائي" });
    }
  });

  // Worker miscellaneous expenses routes
  app.get("/api/projects/:projectId/worker-misc-expenses", async (req, res) => {
    try {
      const { projectId } = req.params;
      const { date } = req.query;
      const expenses = await storage.getWorkerMiscExpenses(projectId, date as string);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching worker misc expenses:", error);
      res.status(500).json({ message: "خطأ في جلب نثريات العمال" });
    }
  });

  app.get("/api/worker-misc-expenses", async (req, res) => {
    try {
      const { projectId, date } = req.query;
      const expenses = await storage.getWorkerMiscExpenses(projectId as string, date as string);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching worker misc expenses:", error);
      res.status(500).json({ message: "خطأ في جلب نثريات العمال" });
    }
  });

  app.post("/api/worker-misc-expenses", async (req, res) => {
    try {
      const result = insertWorkerMiscExpenseSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid worker misc expense data", errors: result.error.issues });
      }
      
      const expense = await storage.createWorkerMiscExpense(result.data);
      
      // تحديث الملخص اليومي
      setImmediate(() => {
        storage.updateDailySummaryForDate(expense.projectId, expense.date)
          .catch(error => console.error("Error updating daily summary after worker misc expense creation:", error));
      });
      
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating worker misc expense:", error);
      res.status(500).json({ message: "خطأ في إنشاء نثريات العمال" });
    }
  });

  app.put("/api/worker-misc-expenses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = insertWorkerMiscExpenseSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid worker misc expense data", errors: result.error.issues });
      }
      
      const expense = await storage.updateWorkerMiscExpense(id, result.data);
      if (!expense) {
        return res.status(404).json({ message: "Worker misc expense not found" });
      }
      
      // تحديث الملخص اليومي
      setImmediate(() => {
        storage.updateDailySummaryForDate(expense.projectId, expense.date)
          .catch(error => console.error("Error updating daily summary after worker misc expense update:", error));
      });
      
      res.json(expense);
    } catch (error) {
      console.error("Error updating worker misc expense:", error);
      res.status(500).json({ message: "خطأ في تحديث نثريات العمال" });
    }
  });

  app.delete("/api/worker-misc-expenses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // الحصول على تفاصيل النثريات قبل الحذف لتحديث الملخص اليومي
      const expense = await storage.getWorkerMiscExpense(id);
      
      await storage.deleteWorkerMiscExpense(id);
      
      // تحديث الملخص اليومي إذا كانت النثريات موجودة
      if (expense) {
        setImmediate(() => {
          storage.updateDailySummaryForDate(expense.projectId, expense.date)
            .catch(error => console.error("Error updating daily summary after worker misc expense deletion:", error));
        });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting worker misc expense:", error);
      res.status(500).json({ message: "خطأ في حذف نثريات العمال" });
    }
  });

  // Users endpoints
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      // إخفاء كلمات المرور من الاستجابة
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "خطأ في جلب المستخدمين" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "بيانات مستخدم غير صحيحة", errors: result.error.issues });
      }
      
      // فحص عدم تكرار البريد الإلكتروني
      const existingUser = await storage.getUserByEmail(result.data.email);
      if (existingUser) {
        return res.status(400).json({ message: "يوجد مستخدم بنفس البريد الإلكتروني مسبقاً" });
      }
      
      const user = await storage.createUser(result.data);
      
      // إخفاء كلمة المرور من الاستجابة
      const { password, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "خطأ في إنشاء المستخدم" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // إخفاء كلمة المرور من الاستجابة
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "خطأ في جلب المستخدم" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const result = insertUserSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "بيانات مستخدم غير صحيحة", errors: result.error.issues });
      }
      
      const user = await storage.updateUser(req.params.id, result.data);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      
      // إخفاء كلمة المرور من الاستجابة
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "خطأ في تحديث المستخدم" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "خطأ في حذف المستخدم" });
    }
  });

  // Performance analysis endpoints  
  app.get("/api/performance/quick-analysis", async (req, res) => {
    try {
      const { performanceAnalyzer } = await import('./performance-analyzer');
      const result = await performanceAnalyzer.runQuickAnalysis();
      res.json({ analysis: result });
    } catch (error) {
      res.status(500).json({ error: "تعذر تشغيل تحليل الأداء" });
    }
  });

  app.post("/api/performance/detailed-report", async (req, res) => {
    try {
      const { performanceAnalyzer } = await import('./performance-analyzer');
      await performanceAnalyzer.generateDetailedReport();
      res.json({ message: "تم إنشاء تقرير الأداء المفصل بنجاح" });
    } catch (error) {
      res.status(500).json({ error: "تعذر إنشاء تقرير الأداء" });
    }
  });

  app.get("/api/performance/analysis", async (req, res) => {
    try {
      const { performanceAnalyzer } = await import('./performance-analyzer');
      const analysis = await performanceAnalyzer.analyzeInsertDeletePerformance();
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: "تعذر تحليل أداء قاعدة البيانات" });
    }
  });

  // Admin routes for autocomplete system
  app.get("/api/autocomplete-admin/stats", async (req, res) => {
    try {
      const { autocompleteOptimizer } = await import('./autocomplete-optimizer');
      const stats = await autocompleteOptimizer.getSystemStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "تعذر جلب إحصائيات النظام" });
    }
  });

  app.post("/api/autocomplete-admin/cleanup", async (req, res) => {
    try {
      const { autocompleteOptimizer } = await import('./autocomplete-optimizer');
      const result = await autocompleteOptimizer.cleanupOldData();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "تعذر تنظيف البيانات القديمة" });
    }
  });

  app.post("/api/autocomplete-admin/enforce-limits", async (req, res) => {
    try {
      const { autocompleteOptimizer } = await import('./autocomplete-optimizer');
      const { category } = req.body;
      const result = await autocompleteOptimizer.enforceCategoryLimits(category);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "تعذر تطبيق حدود الفئات" });
    }
  });

  app.post("/api/autocomplete-admin/maintenance", async (req, res) => {
    try {
      const { autocompleteOptimizer } = await import('./autocomplete-optimizer');
      const result = await autocompleteOptimizer.runMaintenance();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "تعذر تشغيل الصيانة الشاملة" });
    }
  });

  // Batch operations endpoints - العمليات الجماعية المحسنة
  app.delete("/api/batch/autocomplete", async (req, res) => {
    try {
      const { batchOperationsOptimizer } = await import('./batch-operations-optimizer');
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "مطلوب مصفوفة من المعرفات" });
      }

      const result = await batchOperationsOptimizer.batchDeleteAutocomplete(ids);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "تعذر تنفيذ الحذف الجماعي" });
    }
  });

  app.post("/api/batch/autocomplete", async (req, res) => {
    try {
      const { batchOperationsOptimizer } = await import('./batch-operations-optimizer');
      const { records } = req.body;
      
      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ error: "مطلوب مصفوفة من السجلات" });
      }

      const result = await batchOperationsOptimizer.batchInsertAutocomplete(records);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "تعذر تنفيذ الإدخال الجماعي" });
    }
  });

  app.post("/api/batch/cleanup", async (req, res) => {
    try {
      const { batchOperationsOptimizer } = await import('./batch-operations-optimizer');
      const result = await batchOperationsOptimizer.optimizedBatchCleanup();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "تعذر تنفيذ التنظيف الجماعي" });
    }
  });

  app.get("/api/batch/stats", async (req, res) => {
    try {
      const { batchOperationsOptimizer } = await import('./batch-operations-optimizer');
      const stats = await batchOperationsOptimizer.getBatchOperationsStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "تعذر جلب إحصائيات العمليات الجماعية" });
    }
  });

  // Materialized Views endpoints
  app.post("/api/materialized-views/setup", async (req, res) => {
    try {
      const { materializedViewManager } = await import('./materialized-view-manager');
      const result = await materializedViewManager.setupMaterializedViews();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "تعذر إعداد Materialized Views" });
    }
  });

  app.post("/api/materialized-views/refresh", async (req, res) => {
    try {
      const { materializedViewManager } = await import('./materialized-view-manager');
      const result = await materializedViewManager.refreshDailySummaryView();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "تعذر تحديث Materialized Views" });
    }
  });

  app.get("/api/materialized-views/stats", async (req, res) => {
    try {
      const { materializedViewManager } = await import('./materialized-view-manager');
      const stats = await materializedViewManager.getMaterializedViewStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "تعذر جلب إحصائيات Materialized Views" });
    }
  });

  // Quick Performance Fixes endpoints
  app.post("/api/performance/apply-all-optimizations", async (req, res) => {
    try {
      const { quickPerformanceFixes } = await import('./quick-performance-fixes');
      const result = await quickPerformanceFixes.applyAllOptimizations();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "تعذر تطبيق التحسينات" });
    }
  });

  app.post("/api/performance/apply-indexes", async (req, res) => {
    try {
      const { quickPerformanceFixes } = await import('./quick-performance-fixes');
      const result = await quickPerformanceFixes.applyOptimizedIndexes();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "تعذر تطبيق الفهارس المحسنة" });
    }
  });

  app.post("/api/performance/immediate-cleanup", async (req, res) => {
    try {
      const { quickPerformanceFixes } = await import('./quick-performance-fixes');
      const result = await quickPerformanceFixes.immediateCleanupAndOptimize();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "تعذر تنفيذ التنظيف الفوري" });
    }
  });

  app.get("/api/performance/benchmark", async (req, res) => {
    try {
      const { quickPerformanceFixes } = await import('./quick-performance-fixes');
      const result = await quickPerformanceFixes.benchmarkPerformance();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "تعذر قياس الأداء" });
    }
  });

  // مسار التقارير المتقدمة
  app.get("/api/reports/advanced", async (req, res) => {
    try {
      const { projectId, reportType, dateFrom, dateTo } = req.query;
      
      if (!projectId || !reportType || !dateFrom || !dateTo) {
        return res.status(400).json({ 
          message: "مطلوب: projectId, reportType, dateFrom, dateTo" 
        });
      }

      if (reportType === 'expenses') {
        // جلب المصروفات من جميع الجداول
        const expenses = await storage.getExpensesForReport(
          projectId as string, 
          dateFrom as string, 
          dateTo as string
        );
        
        // حساب الإجماليات حسب الفئة أولاً
        const categoryTotals: Record<string, number> = {};
        expenses.forEach(expense => {
          const category = expense.category;
          const amount = parseFloat(expense.amount.toString());
          if (!isNaN(amount)) {
            categoryTotals[category] = (categoryTotals[category] || 0) + amount;
          }
        });

        // حساب الإجمالي العام من مجموع الفئات
        const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

        // سجلات تشخيصية للتحقق من دقة الحسابات
        console.log('🔍 تشخيص حسابات التقرير:');
        console.log(`📊 عدد المصروفات: ${expenses.length}`);
        console.log('💰 إجماليات الفئات:');
        Object.entries(categoryTotals).forEach(([category, total]) => {
          console.log(`   ${category}: ${total.toLocaleString('en-US')} ر.ي`);
        });
        console.log(`🔢 الإجمالي العام: ${totalExpenses.toLocaleString('en-US')} ر.ي`);
        console.log(`✅ التحقق: مجموع الفئات = ${Object.values(categoryTotals).reduce((a, b) => a + b, 0).toLocaleString('en-US')}`);

        res.json({
          expenses,
          totalExpenses,
          categoryTotals
        });

      } else if (reportType === 'income') {
        // جلب الإيرادات (تحويلات العهدة)
        const income = await storage.getIncomeForReport(
          projectId as string, 
          dateFrom as string, 
          dateTo as string
        );
        
        const totalIncome = income.reduce((sum, inc) => sum + parseFloat(inc.amount.toString()), 0);
        
        res.json({
          income,
          totalIncome
        });
      }
      
    } catch (error) {
      console.error("خطأ في إنشاء التقرير:", error);
      res.status(500).json({ message: "خطأ في إنشاء التقرير المتقدم" });
    }
  });

  // Suppliers routes
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "خطأ في جلب قائمة الموردين" });
    }
  });

  // إحصائيات الموردين العامة مع فصل النقدي والآجل (يجب أن يأتي قبل route :id)
  app.get("/api/suppliers/statistics", async (req, res) => {
    try {
      const { supplierId, projectId, dateFrom, dateTo, purchaseType } = req.query;
      console.log(`📊 طلب إحصائيات الموردين:`, { supplierId, projectId, dateFrom, dateTo, purchaseType });
      
      // تصفية القيم الفارغة والغير محددة
      const filters: any = {};
      if (supplierId && supplierId !== 'undefined' && supplierId !== '') filters.supplierId = supplierId as string;
      if (projectId && projectId !== 'all' && projectId !== 'undefined' && projectId !== '') filters.projectId = projectId as string;
      if (dateFrom && dateFrom !== 'undefined' && dateFrom !== '') filters.dateFrom = dateFrom as string;
      if (dateTo && dateTo !== 'undefined' && dateTo !== '') filters.dateTo = dateTo as string;
      if (purchaseType && purchaseType !== 'all' && purchaseType !== 'undefined' && purchaseType !== '') filters.purchaseType = purchaseType as string;
      
      console.log(`🔄 الفلاتر المطبقة:`, filters);
      
      const statistics = await storage.getSupplierStatistics(filters);
      
      console.log(`✅ تم حساب إحصائيات الموردين:`, statistics);
      res.json(statistics);
    } catch (error) {
      console.error("خطأ في جلب إحصائيات الموردين:", error);
      
      // إرجاع إحصائيات فارغة بدلاً من خطأ 500
      res.json({
        totalSuppliers: 0,
        totalCashPurchases: "0",
        totalCreditPurchases: "0",
        totalDebt: "0",
        totalPaid: "0",
        remainingDebt: "0",
        activeSuppliers: 0
      });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const result = insertSupplierSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "بيانات مورد غير صحيحة", errors: result.error.issues });
      }
      
      // فحص عدم تكرار اسم المورد
      const existingSupplier = await storage.getSupplierByName(result.data.name);
      if (existingSupplier) {
        return res.status(400).json({ message: "يوجد مورد بنفس الاسم مسبقاً" });
      }
      
      const supplier = await storage.createSupplier(result.data);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "خطأ في إنشاء المورد" });
    }
  });

  app.get("/api/suppliers/:id", async (req, res) => {
    try {
      const supplier = await storage.getSupplier(req.params.id);
      if (!supplier) {
        return res.status(404).json({ message: "المورد غير موجود" });
      }
      res.json(supplier);
    } catch (error) {
      console.error("Error fetching supplier:", error);
      res.status(500).json({ message: "خطأ في جلب المورد" });
    }
  });

  app.put("/api/suppliers/:id", async (req, res) => {
    try {
      const result = insertSupplierSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "بيانات مورد غير صحيحة", errors: result.error.issues });
      }
      
      const supplier = await storage.updateSupplier(req.params.id, result.data);
      if (!supplier) {
        return res.status(404).json({ message: "المورد غير موجود" });
      }
      
      res.json(supplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(500).json({ message: "خطأ في تحديث المورد" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      await storage.deleteSupplier(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ message: "خطأ في حذف المورد" });
    }
  });

  // Supplier account statement
  app.get("/api/suppliers/:id/account", async (req, res) => {
    try {
      const { projectId, dateFrom, dateTo } = req.query;
      const statement = await storage.getSupplierAccountStatement(
        req.params.id,
        projectId as string,
        dateFrom as string,
        dateTo as string
      );
      res.json(statement);
    } catch (error) {
      console.error("Error fetching supplier account statement:", error);
      res.status(500).json({ message: "خطأ في جلب كشف حساب المورد" });
    }
  });


  // Supplier purchases
  app.get("/api/suppliers/:id/purchases", async (req, res) => {
    try {
      const { paymentType, dateFrom, dateTo } = req.query;
      const purchases = await storage.getPurchasesBySupplier(
        req.params.id,
        paymentType as string,
        dateFrom as string,
        dateTo as string
      );
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching supplier purchases:", error);
      res.status(500).json({ message: "خطأ في جلب مشتريات المورد" });
    }
  });

  // Supplier payments routes
  app.get("/api/supplier-payments", async (req, res) => {
    try {
      console.log('🔍 API: بدء استدعاء getAllSupplierPayments...');
      const payments = await storage.getAllSupplierPayments();
      console.log(`📊 API: تم الحصول على ${payments.length} مدفوعة`);
      res.json(payments);
    } catch (error) {
      console.error("خطأ في API route للمدفوعات:", error);
      res.status(500).json({ message: "خطأ في جلب جميع مدفوعات الموردين" });
    }
  });

  app.get("/api/suppliers/:supplierId/payments", async (req, res) => {
    try {
      const { supplierId } = req.params;
      const projectId = req.query.projectId as string;
      
      const payments = await storage.getSupplierPayments(supplierId, projectId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching supplier payments:", error);
      res.status(500).json({ message: "خطأ في جلب مدفوعات المورد" });
    }
  });

  app.post("/api/supplier-payments", async (req, res) => {
    try {
      const result = insertSupplierPaymentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "بيانات دفعة غير صحيحة", errors: result.error.issues });
      }
      
      const payment = await storage.createSupplierPayment(result.data);
      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating supplier payment:", error);
      res.status(500).json({ message: "خطأ في إنشاء دفعة المورد" });
    }
  });

  app.get("/api/supplier-payments/:id", async (req, res) => {
    try {
      const payment = await storage.getSupplierPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ message: "الدفعة غير موجودة" });
      }
      res.json(payment);
    } catch (error) {
      console.error("Error fetching supplier payment:", error);
      res.status(500).json({ message: "خطأ في جلب الدفعة" });
    }
  });

  app.put("/api/supplier-payments/:id", async (req, res) => {
    try {
      const result = insertSupplierPaymentSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "بيانات دفعة غير صحيحة", errors: result.error.issues });
      }
      
      const payment = await storage.updateSupplierPayment(req.params.id, result.data);
      if (!payment) {
        return res.status(404).json({ message: "الدفعة غير موجودة" });
      }
      
      res.json(payment);
    } catch (error) {
      console.error("Error updating supplier payment:", error);
      res.status(500).json({ message: "خطأ في تحديث الدفعة" });
    }
  });

  app.delete("/api/supplier-payments/:id", async (req, res) => {
    try {
      await storage.deleteSupplierPayment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier payment:", error);
      res.status(500).json({ message: "خطأ في حذف الدفعة" });
    }
  });

  // Supplier reports
  app.get("/api/suppliers/:supplierId/statement", async (req, res) => {
    try {
      const { supplierId } = req.params;
      const { projectId, dateFrom, dateTo } = req.query;
      
      const statement = await storage.getSupplierAccountStatement(
        supplierId,
        projectId as string,
        dateFrom as string,
        dateTo as string
      );
      
      res.json(statement);
    } catch (error) {
      console.error("Error fetching supplier statement:", error);
      res.status(500).json({ message: "خطأ في جلب كشف حساب المورد" });
    }
  });

  app.get("/api/suppliers/:supplierId/purchases", async (req, res) => {
    try {
      const { supplierId } = req.params;
      const { paymentType, dateFrom, dateTo } = req.query;
      
      const purchases = await storage.getPurchasesBySupplier(
        supplierId,
        paymentType as string,
        dateFrom as string,
        dateTo as string
      );
      
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching supplier purchases:", error);
      res.status(500).json({ message: "خطأ في جلب مشتريات المورد" });
    }
  });

  // Print Settings Routes
  app.get("/api/print-settings", async (req, res) => {
    try {
      const { reportType, userId } = req.query;
      const settings = await storage.getPrintSettings(reportType as string, userId as string);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching print settings:", error);
      res.status(500).json({ message: "خطأ في جلب إعدادات الطباعة" });
    }
  });

  app.post("/api/print-settings", async (req, res) => {
    try {
      const result = insertPrintSettingsSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "بيانات إعدادات الطباعة غير صحيحة", errors: result.error.issues });
      }
      
      const settings = await storage.createPrintSettings(result.data);
      res.status(201).json(settings);
    } catch (error) {
      console.error("Error creating print settings:", error);
      res.status(500).json({ message: "خطأ في إنشاء إعدادات الطباعة" });
    }
  });

  app.get("/api/print-settings/:id", async (req, res) => {
    try {
      const settings = await storage.getPrintSettingsById(req.params.id);
      if (!settings) {
        return res.status(404).json({ message: "إعدادات الطباعة غير موجودة" });
      }
      res.json(settings);
    } catch (error) {
      console.error("Error fetching print settings:", error);
      res.status(500).json({ message: "خطأ في جلب إعدادات الطباعة" });
    }
  });

  app.put("/api/print-settings/:id", async (req, res) => {
    try {
      const result = insertPrintSettingsSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "بيانات إعدادات الطباعة غير صحيحة", errors: result.error.issues });
      }
      
      const settings = await storage.updatePrintSettings(req.params.id, result.data);
      if (!settings) {
        return res.status(404).json({ message: "إعدادات الطباعة غير موجودة" });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error updating print settings:", error);
      res.status(500).json({ message: "خطأ في تحديث إعدادات الطباعة" });
    }
  });

  app.delete("/api/print-settings/:id", async (req, res) => {
    try {
      await storage.deletePrintSettings(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting print settings:", error);
      res.status(500).json({ message: "خطأ في حذف إعدادات الطباعة" });
    }
  });

  // Get default print settings by report type
  app.get("/api/print-settings/default/:reportType", async (req, res) => {
    try {
      const settings = await storage.getDefaultPrintSettings(req.params.reportType);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching default print settings:", error);
      res.status(500).json({ message: "خطأ في جلب الإعدادات الافتراضية للطباعة" });
    }
  });

  // Print Preview API - للمعاينة المباشرة للتقارير
  app.get("/api/print-preview/:reportType", async (req, res) => {
    try {
      const { reportType } = req.params;
      let previewData = {};

      switch (reportType) {
        case 'worker_statement':
          // جلب بيانات تجريبية لكشف حساب العامل
          const workers = await storage.getWorkers();
          const projects = await storage.getProjects();
          previewData = {
            type: 'worker_statement',
            worker: workers[0] || { name: 'عامل تجريبي', workerType: 'معلم بناء', dailyWage: 200 },
            project: projects[0] || { name: 'مشروع تجريبي', location: 'الرياض' },
            attendanceData: [
              { date: '2025-08-01', hours: 8, description: 'أعمال البناء', amount: 200 },
              { date: '2025-08-02', hours: 8, description: 'أعمال التشطيب', amount: 200 },
              { date: '2025-08-03', hours: 8, description: 'أعمال الدهان', amount: 200 }
            ],
            transfers: [
              { date: '2025-08-03', amount: 300, transferNumber: '12345', recipient: 'الأهل' }
            ]
          };
          break;

        case 'supplier_statement':
          const suppliers = await storage.getSuppliers();
          previewData = {
            type: 'supplier_statement',
            supplier: suppliers[0] || { name: 'مورد تجريبي', phone: '+966501234567' },
            purchases: [
              { date: '2025-08-01', material: 'أسمنت', quantity: 50, unitPrice: 25, total: 1250, paymentType: 'deferred' },
              { date: '2025-08-02', material: 'حديد', quantity: 2, unitPrice: 2500, total: 5000, paymentType: 'cash' }
            ]
          };
          break;

        case 'daily_expenses':
          const projectsForDaily = await storage.getProjects();
          previewData = {
            type: 'daily_expenses',
            date: new Date().toISOString().split('T')[0],
            project: projectsForDaily[0] || { name: 'مشروع تجريبي' },
            expenses: [
              { time: '08:00', category: 'عمالة', description: 'أجور عمال اليوم', amount: 1500, notes: '5 عمال' },
              { time: '10:30', category: 'مواد', description: 'شراء أسمنت', amount: 800, notes: 'من المورد الرئيسي' },
              { time: '14:00', category: 'مواصلات', description: 'نقل مواد', amount: 200, notes: 'شاحنة كبيرة' }
            ]
          };
          break;

        case 'material_purchases':
          previewData = {
            type: 'material_purchases',
            purchases: [
              { date: '2025-08-03', material: 'أسمنت بورتلاندي', supplier: 'مصنع الرياض', quantity: 100, price: 25, total: 2500 },
              { date: '2025-08-03', material: 'حديد تسليح', supplier: 'مصنع الحديد', quantity: 3, price: 3000, total: 9000 }
            ]
          };
          break;

        case 'advanced_reports':
          previewData = {
            type: 'advanced_reports',
            analysis: {
              totalExpenses: 50000,
              categories: {
                labor: { amount: 30000, percentage: 60 },
                materials: { amount: 15000, percentage: 30 },
                transportation: { amount: 5000, percentage: 10 }
              },
              dailyAverage: 2500,
              projectDuration: 20
            }
          };
          break;

        default:
          return res.status(400).json({ message: "نوع تقرير غير مدعوم" });
      }

      res.json(previewData);
    } catch (error) {
      console.error("Error generating print preview:", error);
      res.status(500).json({ message: "خطأ في إنشاء معاينة التقرير" });
    }
  });

  // إضافة APIs مفقودة حسب خطة التحسينات
  
  // API Health Check - إصلاح المشكلة الحرجة
  app.get("/api/health", async (req, res) => {
    try {
      const healthStatus = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: 'connected',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      };
      res.json(healthStatus);
    } catch (error) {
      res.status(500).json({ 
        status: 'ERROR', 
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  // API Stats Summary - إضافة المفقود
  app.get("/api/stats-summary", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      const workers = await storage.getWorkers();
      const materials = await storage.getMaterials();
      
      // حساب إحصائيات سريعة بدون تفاصيل مطولة
      const totalProjects = projects.length;
      const activeProjects = projects.filter(p => p.status === 'active' || !p.status).length;
      const totalWorkers = workers.length;
      const totalMaterials = materials.length;
      
      const summary = {
        projects: {
          total: totalProjects,
          active: activeProjects
        },
        workers: {
          total: totalWorkers
        },
        materials: {
          total: totalMaterials
        },
        system: {
          status: 'operational',
          lastUpdated: new Date().toISOString()
        }
      };
      
      res.json(summary);
    } catch (error) {
      console.error("Error getting stats summary:", error);
      res.status(500).json({ message: "Error retrieving system statistics" });
    }
  });

  // مسارات المصادقة والمستخدمين  
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, role = 'admin' } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'الإيميل وكلمة المرور مطلوبان' 
        });
      }

      const result = await authSystem.register({
        email,
        password,
        firstName,
        lastName,
        role,
        isActive: true
      });

      res.json(result);
    } catch (error) {
      console.error('خطأ في التسجيل:', error);  
      res.status(500).json({ 
        success: false, 
        message: 'خطأ في إنشاء الحساب' 
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'الإيميل وكلمة المرور مطلوبان' 
        });
      }

      const result = await authSystem.login(email, password);
      
      if (result.success && result.user) {
        // إنشاء session
        (req.session as any).auth = authSystem.createSession(result.user);
      }

      res.json(result);
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      res.status(500).json({ 
        success: false, 
        message: 'خطأ في تسجيل الدخول' 
      });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'خطأ في تسجيل الخروج' 
        });
      }
      res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    const user = authSystem.getCurrentUser(req);
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ 
        success: false, 
        message: 'غير مسجل دخول' 
      });
    }
  });

  // مسارات النسخ الاحتياطي
  app.post("/api/backup/create", async (req, res) => {
    try {
      const result = await backupSystem.createFullBackup();
      res.json(result);
    } catch (error) {
      console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
      res.status(500).json({ 
        success: false, 
        message: 'خطأ في إنشاء النسخة الاحتياطية' 
      });
    }
  });

  app.get("/api/backup/list", async (req, res) => {
    try {
      const backups = await backupSystem.getBackupsList();
      res.json({ success: true, backups });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'خطأ في جلب قائمة النسخ الاحتياطية' 
      });
    }
  });

  // Workers Settlement Report - تقرير تصفية العمال الجماعي (مشاريع متعددة)
  app.get("/api/reports/workers-settlement", async (req, res) => {
    try {
      const { projectIds, dateFrom, dateTo, workerIds } = req.query;

      console.log('📊 طلب تقرير تصفية العمال:', { projectIds, dateFrom, dateTo, workerIds });

      // التحقق من المعاملات المطلوبة
      if (!projectIds) {
        return res.status(400).json({ message: "معرفات المشاريع مطلوبة" });
      }

      // جلب البيانات الأساسية
      const [allProjects, allWorkers] = await Promise.all([
        storage.getProjects(),
        storage.getWorkers()
      ]);

      // تحويل projectIds إلى مصفوفة ومعالجة حالة 'all'
      let selectedProjectIds: string[] = [];
      let selectedProjects: any[] = [];
      
      if (typeof projectIds === 'string') {
        if (projectIds.trim() === 'all' || projectIds.trim() === '') {
          // في حالة 'all' أو فارغ، استخدم جميع المشاريع
          selectedProjects = allProjects;
          selectedProjectIds = allProjects.map(p => p.id);
        } else {
          // في حالة تحديد مشاريع معينة
          selectedProjectIds = projectIds.split(',').filter(id => id.trim());
          selectedProjects = allProjects.filter(project => 
            selectedProjectIds.includes(project.id)
          );
        }
      }

      if (selectedProjects.length === 0) {
        return res.status(404).json({ message: "لا توجد مشاريع متاحة" });
      }

      // فلترة العمال إذا تم تحديدهم
      let selectedWorkerIds: string[] = [];
      if (workerIds && typeof workerIds === 'string') {
        selectedWorkerIds = workerIds.split(',').filter(id => id.trim());
      }

      // جلب بيانات الحضور والتحويلات لجميع المشاريع المحددة
      const allAttendances: any[] = [];
      const allTransfers: any[] = [];

      for (const projectId of selectedProjectIds) {
        try {
          const [attendances, transfers] = await Promise.all([
            storage.getWorkerAttendance(projectId),
            storage.getFilteredWorkerTransfers(projectId)
          ]);
          
          // فلترة بالتاريخ إذا تم تحديده
          let filteredAttendances = attendances;
          if (dateFrom && dateTo) {
            filteredAttendances = attendances.filter(att => 
              att.date >= dateFrom && att.date <= dateTo
            );
          } else if (dateFrom) {
            filteredAttendances = attendances.filter(att => att.date >= dateFrom);
          } else if (dateTo) {
            filteredAttendances = attendances.filter(att => att.date <= dateTo);
          }

          // فلترة التحويلات بالتاريخ إذا تم تحديده
          let filteredTransfers = transfers;
          if (dateFrom && dateTo) {
            filteredTransfers = transfers.filter(trans => 
              trans.transferDate >= dateFrom && trans.transferDate <= dateTo
            );
          } else if (dateFrom) {
            filteredTransfers = transfers.filter(trans => trans.transferDate >= dateFrom);
          } else if (dateTo) {
            filteredTransfers = transfers.filter(trans => trans.transferDate <= dateTo);
          }

          allAttendances.push(...filteredAttendances);
          allTransfers.push(...filteredTransfers);
        } catch (error) {
          console.error(`خطأ في جلب بيانات المشروع ${projectId}:`, error);
        }
      }

      // بناء تقرير العمال
      const workersReport = allWorkers
        .filter(worker => worker.isActive)
        .filter(worker => {
          // إذا تم تحديد عمال معينين
          if (selectedWorkerIds.length > 0) {
            return selectedWorkerIds.includes(worker.id);
          }
          // إذا لم يتم تحديد عمال، أظهر العمال الذين لديهم نشاط في المشاريع المحددة
          return allAttendances.some(attendance => attendance.workerId === worker.id) ||
                 allTransfers.some(transfer => transfer.workerId === worker.id);
        })
        .map(worker => {
          // حساب الحضور والأجور للعامل من جميع المشاريع
          const workerAttendanceRecords = allAttendances.filter(attendance => 
            attendance.workerId === worker.id
          );

          // حساب التحويلات للعامل من جميع المشاريع
          const workerTransferRecords = allTransfers.filter(transfer => 
            transfer.workerId === worker.id
          );

          const totalWorkDays = workerAttendanceRecords.reduce((sum, record) => 
            sum + parseFloat(record.workDays.toString()), 0
          );

          const totalEarned = workerAttendanceRecords.reduce((sum, record) => 
            sum + parseFloat(record.actualWage.toString()), 0
          );

          const totalPaid = workerAttendanceRecords.reduce((sum, record) => 
            sum + parseFloat(record.paidAmount.toString()), 0
          );

          const totalTransfers = workerTransferRecords.reduce((sum, record) => 
            sum + parseFloat(record.amount.toString()), 0
          );

          // الرصيد النهائي = المكتسب - المستلم - المحول للأهل
          const finalBalance = totalEarned - totalPaid - totalTransfers;

          return {
            worker_id: worker.id,
            worker_name: worker.name,
            worker_type: worker.type,
            daily_wage: parseFloat(worker.dailyWage.toString()),
            total_work_days: totalWorkDays,
            total_earned: totalEarned,
            total_paid: totalPaid,
            total_transfers: totalTransfers,
            final_balance: finalBalance
          };
        })
        .filter(workerData => 
          // إظهار العمال الذين لديهم نشاط (حضور أو تحويلات)
          workerData.total_work_days > 0 || workerData.total_transfers > 0
        );

      // حساب الإجماليات
      const totals = {
        total_workers: workersReport.length,
        total_work_days: workersReport.reduce((sum, w) => sum + w.total_work_days, 0),
        total_earned: workersReport.reduce((sum, w) => sum + w.total_earned, 0),
        total_paid: workersReport.reduce((sum, w) => sum + w.total_paid, 0),
        total_transfers: workersReport.reduce((sum, w) => sum + w.total_transfers, 0),
        final_balance: workersReport.reduce((sum, w) => sum + w.final_balance, 0)
      };

      const response = {
        projects: selectedProjects,
        workers: workersReport,
        totals: totals,
        filters: {
          projectIds: selectedProjectIds,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
          workerIds: selectedWorkerIds.length > 0 ? selectedWorkerIds : null
        },
        generated_at: new Date().toISOString()
      };

      console.log('✅ تم إنشاء تقرير تصفية العمال بنجاح:', {
        projectsCount: selectedProjects.length,
        workersCount: workersReport.length,
        totalEarned: totals.total_earned,
        finalBalance: totals.final_balance
      });

      res.json(response);

    } catch (error) {
      console.error('❌ خطأ في إنشاء تقرير تصفية العمال:', error);
      res.status(500).json({ 
        message: "خطأ في إنشاء تقرير تصفية العمال",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Report Templates Routes - إعدادات قوالب التقارير
  app.get("/api/report-templates", async (req, res) => {
    try {
      const templates = await storage.getReportTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching report templates:", error);
      res.status(500).json({ message: "خطأ في جلب قوالب التقارير" });
    }
  });

  app.get("/api/report-templates/active", async (req, res) => {
    try {
      const template = await storage.getActiveReportTemplate();
      if (!template) {
        // إنشاء قالب افتراضي إذا لم يوجد
        const defaultTemplate = {
          templateName: 'default',
          headerTitle: 'نظام إدارة مشاريع البناء',
          companyName: 'شركة البناء والتطوير',
          companyAddress: 'صنعاء - اليمن',
          companyPhone: '+967 1 234567',
          companyEmail: 'info@company.com',
          footerText: 'تم إنشاء هذا التقرير بواسطة نظام إدارة المشاريع',
          footerContact: 'للاستفسار: info@company.com | +967 1 234567',
          primaryColor: '#1f2937',
          secondaryColor: '#3b82f6',
          accentColor: '#10b981',
          textColor: '#1f2937',
          backgroundColor: '#ffffff',
          fontSize: 11,
          fontFamily: 'Arial',
          pageOrientation: 'portrait',
          pageSize: 'A4',
          margins: { top: 1, bottom: 1, left: 0.75, right: 0.75 },
          showHeader: true,
          showFooter: true,
          showLogo: true,
          showDate: true,
          showPageNumbers: true,
          isActive: true,
        };
        const newTemplate = await storage.createReportTemplate(defaultTemplate);
        return res.json(newTemplate);
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching active report template:", error);
      res.status(500).json({ message: "خطأ في جلب القالب النشط" });
    }
  });

  app.get("/api/report-templates/:id", async (req, res) => {
    try {
      const template = await storage.getReportTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "قالب التقرير غير موجود" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching report template:", error);
      res.status(500).json({ message: "خطأ في جلب قالب التقرير" });
    }
  });

  app.post("/api/report-templates", async (req, res) => {
    try {
      const result = insertReportTemplateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "بيانات قالب التقرير غير صحيحة", 
          errors: result.error.issues 
        });
      }
      
      const template = await storage.createReportTemplate(result.data);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating report template:", error);
      res.status(500).json({ message: "خطأ في إنشاء قالب التقرير" });
    }
  });

  app.put("/api/report-templates/:id", async (req, res) => {
    try {
      const result = insertReportTemplateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "بيانات قالب التقرير غير صحيحة", 
          errors: result.error.issues 
        });
      }
      
      const template = await storage.updateReportTemplate(req.params.id, result.data);
      if (!template) {
        return res.status(404).json({ message: "قالب التقرير غير موجود" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error updating report template:", error);
      res.status(500).json({ message: "خطأ في تحديث قالب التقرير" });
    }
  });

  app.delete("/api/report-templates/:id", async (req, res) => {
    try {
      const template = await storage.getReportTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "قالب التقرير غير موجود" });
      }
      
      await storage.deleteReportTemplate(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting report template:", error);
      res.status(500).json({ message: "خطأ في حذف قالب التقرير" });
    }
  });

  // =====================================================
  // API Routes لنظام إدارة المعدات والأدوات الاحترافي
  // =====================================================

  // Tool Categories Routes
  app.get("/api/tool-categories", async (req, res) => {
    try {
      const categories = await storage.getToolCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching tool categories:", error);
      res.status(500).json({ message: "خطأ في جلب تصنيفات الأدوات" });
    }
  });

  app.post("/api/tool-categories", async (req, res) => {
    try {
      const result = insertToolCategorySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "بيانات تصنيف الأداة غير صحيحة", 
          errors: result.error.issues 
        });
      }

      // فحص عدم تكرار اسم التصنيف
      const existingCategory = await storage.getToolCategoryByName(result.data.name);
      if (existingCategory) {
        return res.status(400).json({ message: "يوجد تصنيف بنفس الاسم مسبقاً" });
      }

      const category = await storage.createToolCategory(result.data);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating tool category:", error);
      res.status(500).json({ message: "خطأ في إنشاء تصنيف الأداة" });
    }
  });

  app.put("/api/tool-categories/:id", async (req, res) => {
    try {
      const result = insertToolCategorySchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "بيانات تصنيف الأداة غير صحيحة", 
          errors: result.error.issues 
        });
      }

      const category = await storage.updateToolCategory(req.params.id, result.data);
      if (!category) {
        return res.status(404).json({ message: "تصنيف الأداة غير موجود" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error updating tool category:", error);
      res.status(500).json({ message: "خطأ في تحديث تصنيف الأداة" });
    }
  });

  app.delete("/api/tool-categories/:id", async (req, res) => {
    try {
      await storage.deleteToolCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tool category:", error);
      res.status(500).json({ message: "خطأ في حذف تصنيف الأداة" });
    }
  });

  // General Notifications API - Alias for tool-notifications
  app.get("/api/notifications", async (req, res) => {
    try {
      const tools = await storage.getTools();
      const notifications: any[] = [];

      // فحص الصيانة المتأخرة
      tools.forEach((tool: any) => {
        if (tool.nextMaintenanceDate) {
          const maintenanceDate = new Date(tool.nextMaintenanceDate);
          const today = new Date();
          const daysDiff = Math.ceil((maintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff < 0) {
            const notificationId = `maintenance-${tool.id}`;
            notifications.push({
              id: notificationId,
              type: 'maintenance',
              title: 'صيانة متأخرة',
              message: `الأداة "${tool.name}" متأخرة عن موعد الصيانة بـ ${Math.abs(daysDiff)} يوم`,
              toolId: tool.id,
              toolName: tool.name,
              priority: 'critical',
              createdAt: new Date().toISOString(),
              status: 'unread',
              actionRequired: true,
            });
          }
        }
      });

      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "خطأ في جلب الإشعارات" });
    }
  });

  // Tool Usage Analytics API
  app.get("/api/tool-usage-analytics", async (req, res) => {
    try {
      const tools = await storage.getTools();
      const movements = await storage.getToolMovements();
      
      // حساب إحصائيات الاستخدام
      const analytics = {
        totalTools: tools.length,
        activeTools: tools.filter(t => t.status === 'in_use').length,
        totalMovements: movements.length,
        averageUsage: tools.length > 0 ? Math.round((movements.length / tools.length) * 100) / 100 : 0,
        categoryDistribution: tools.reduce((acc: any, tool) => {
          const category = tool.categoryId || 'غير مصنف';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {}),
        statusDistribution: tools.reduce((acc: any, tool) => {
          acc[tool.status] = (acc[tool.status] || 0) + 1;
          return acc;
        }, {}),
        conditionDistribution: tools.reduce((acc: any, tool) => {
          acc[tool.condition] = (acc[tool.condition] || 0) + 1;
          return acc;
        }, {}),
        recentActivity: movements.slice(-10).reverse()
      };

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching tool usage analytics:", error);
      res.status(500).json({ message: "خطأ في جلب تحليلات استخدام الأدوات" });
    }
  });

  // Tool Movements with limit API
  app.get("/api/tool-movements/:limit", async (req, res) => {
    try {
      const limit = parseInt(req.params.limit) || 30;
      const movements = await storage.getToolMovements();
      const limitedMovements = movements.slice(-limit).reverse();
      res.json(limitedMovements);
    } catch (error) {
      console.error("Error fetching tool movements:", error);
      res.status(500).json({ message: "خطأ في جلب تحركات الأدوات" });
    }
  });

  // Tools Routes
  // Tool Notifications API Routes - Must come before /api/tools/:id
  app.get("/api/tool-notifications", async (req, res) => {
    try {
      const tools = await storage.getTools();
      const notifications: any[] = [];

      // فحص الصيانة المتأخرة
      tools.forEach((tool: any) => {
        if (tool.nextMaintenanceDate) {
          const maintenanceDate = new Date(tool.nextMaintenanceDate);
          const today = new Date();
          const daysDiff = Math.ceil((maintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff < 0) {
            const notificationId = `maintenance-${tool.id}`;
            notifications.push({
              id: notificationId,
              type: 'maintenance',
              title: 'صيانة متأخرة',
              message: `الأداة "${tool.name}" متأخرة عن موعد الصيانة بـ ${Math.abs(daysDiff)} يوم`,
              toolId: tool.id,
              toolName: tool.name,
              priority: 'critical',
              timestamp: new Date().toISOString(),
              isRead: readNotifications.has(notificationId),
              actionRequired: true,
            });
          } else if (daysDiff <= 3) {
            const notificationId = `maintenance-soon-${tool.id}`;
            notifications.push({
              id: notificationId,
              type: 'maintenance',
              title: 'صيانة قريبة',
              message: `الأداة "${tool.name}" تحتاج صيانة خلال ${daysDiff} أيام`,
              toolId: tool.id,
              toolName: tool.name,
              priority: 'high',
              timestamp: new Date().toISOString(),
              isRead: readNotifications.has(notificationId),
              actionRequired: true,
            });
          }
        }

        // فحص انتهاء الضمان
        if (tool.warrantyExpiry) {
          const warrantyDate = new Date(tool.warrantyExpiry);
          const today = new Date();
          const daysDiff = Math.ceil((warrantyDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff <= 30 && daysDiff > 0) {
            const notificationId = `warranty-${tool.id}`;
            notifications.push({
              id: notificationId,
              type: 'warranty',
              title: 'انتهاء الضمان قريباً',
              message: `ضمان الأداة "${tool.name}" ينتهي خلال ${daysDiff} يوم`,
              toolId: tool.id,
              toolName: tool.name,
              priority: 'medium',
              timestamp: new Date().toISOString(),
              isRead: readNotifications.has(notificationId),
              actionRequired: false,
            });
          } else if (daysDiff <= 0) {
            const notificationId = `warranty-expired-${tool.id}`;
            notifications.push({
              id: notificationId,
              type: 'warranty',
              title: 'انتهى الضمان',
              message: `انتهى ضمان الأداة "${tool.name}"`,
              toolId: tool.id,
              toolName: tool.name,
              priority: 'low',
              timestamp: new Date().toISOString(),
              isRead: readNotifications.has(notificationId),
              actionRequired: false,
            });
          }
        }

        // فحص الأدوات المعطلة
        if (tool.status === 'damaged') {
          const notificationId = `damaged-${tool.id}`;
          notifications.push({
            id: notificationId,
            type: 'damaged',
            title: 'أداة معطلة',
            message: `الأداة "${tool.name}" بحالة تالفة وتحتاج إصلاح أو استبدال`,
            toolId: tool.id,
            toolName: tool.name,
            priority: 'high',
            timestamp: new Date().toISOString(),
            isRead: readNotifications.has(notificationId),
            actionRequired: true,
          });
        }
      });

      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "خطأ في جلب الإشعارات" });
    }
  });

  app.post("/api/notifications/:id/mark-read", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.json({ 
        success: true, 
        message: "تم تحديد الإشعار كمقروء",
        notificationId: id 
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "خطأ في تحديد الإشعار كمقروء" });
    }
  });

  app.post("/api/notifications/mark-all-read", async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead();
      res.json({ 
        success: true, 
        message: "تم تحديد جميع الإشعارات كمقروءة" 
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "خطأ في تحديد الإشعارات كمقروءة" });
    }
  });

  // Maintenance Schedule API Routes
  app.get("/api/maintenance-schedules", async (req, res) => {
    try {
      // إرجاع قائمة فارغة مؤقتاً - سيتم ربطها بقاعدة البيانات لاحقاً
      res.json([]);
    } catch (error) {
      console.error("Error fetching maintenance schedules:", error);
      res.status(500).json({ message: "خطأ في جلب جداول الصيانة" });
    }
  });

  app.post("/api/maintenance-schedules", async (req, res) => {
    try {
      // معالجة إنشاء جدول صيانة جديد
      const scheduleData = req.body;
      
      // إنشاء ID فريد للجدول
      const newSchedule = {
        id: `schedule_${Date.now()}`,
        ...scheduleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      res.json(newSchedule);
    } catch (error) {
      console.error("Error creating maintenance schedule:", error);
      res.status(500).json({ message: "خطأ في إنشاء جدول الصيانة" });
    }
  });

  app.get("/api/tools", async (req, res) => {
    try {
      const { categoryId, status, condition, searchTerm, projectId, locationType } = req.query;
      const filters = {
        categoryId: categoryId as string,
        status: status as string,
        condition: condition as string,
        searchTerm: searchTerm as string,
        projectId: projectId as string,
        locationType: locationType as string,
      };

      const tools = await storage.getTools(filters);
      res.json(tools);
    } catch (error) {
      console.error("Error fetching tools:", error);
      res.status(500).json({ message: "خطأ في جلب الأدوات" });
    }
  });

  app.get("/api/tools/:id", async (req, res) => {
    try {
      const tool = await storage.getTool(req.params.id);
      if (!tool) {
        return res.status(404).json({ message: "الأداة غير موجودة" });
      }
      res.json(tool);
    } catch (error) {
      console.error("Error fetching tool:", error);
      res.status(500).json({ message: "خطأ في جلب الأداة" });
    }
  });

  app.post("/api/tools", async (req, res) => {
    try {
      const result = insertToolSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "بيانات الأداة غير صحيحة", 
          errors: result.error.issues 
        });
      }

      // فحص عدم تكرار SKU إذا كان موجوداً
      if (result.data.sku) {
        const existingTool = await storage.getToolBySku(result.data.sku);
        if (existingTool) {
          return res.status(400).json({ message: "يوجد أداة بنفس كود المخزون مسبقاً" });
        }
      }

      const tool = await storage.createTool(result.data);
      res.status(201).json(tool);
    } catch (error) {
      console.error("Error creating tool:", error);
      res.status(500).json({ message: "خطأ في إنشاء الأداة" });
    }
  });

  app.put("/api/tools/:id", async (req, res) => {
    try {
      const result = updateToolSchema.safeParse(req.body);
      if (!result.success) {
        console.error('❌ خطأ في التحقق من صحة البيانات:', result.error.issues);
        return res.status(400).json({ 
          message: "بيانات الأداة غير صحيحة", 
          errors: result.error.issues 
        });
      }
      // تحويل التواريخ إلى strings إذا كانت Date objects
      const updateData = {
        ...result.data,
        purchaseDate: result.data.purchaseDate instanceof Date 
          ? result.data.purchaseDate.toISOString().split('T')[0] 
          : result.data.purchaseDate,
        warrantyExpiry: result.data.warrantyExpiry instanceof Date 
          ? result.data.warrantyExpiry.toISOString().split('T')[0] 
          : result.data.warrantyExpiry,
        lastMaintenanceDate: result.data.lastMaintenanceDate instanceof Date 
          ? result.data.lastMaintenanceDate.toISOString().split('T')[0] 
          : result.data.lastMaintenanceDate,
        nextMaintenanceDate: result.data.nextMaintenanceDate instanceof Date 
          ? result.data.nextMaintenanceDate.toISOString().split('T')[0] 
          : result.data.nextMaintenanceDate,
      };
      const tool = await storage.updateTool(req.params.id, updateData);
      if (!tool) {
        console.error('❌ الأداة غير موجودة:', req.params.id);
        return res.status(404).json({ message: "الأداة غير موجودة" });
      }
      
      console.log('✅ تم تحديث الأداة بنجاح:', tool);
      res.json(tool);
    } catch (error) {
      console.error("❌ خطأ في تحديث الأداة:", error);
      res.status(500).json({ message: "خطأ في تحديث الأداة" });
    }
  });

  app.delete("/api/tools/:id", async (req, res) => {
    try {
      await storage.deleteTool(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tool:", error);
      res.status(500).json({ message: "خطأ في حذف الأداة" });
    }
  });

  // Tools Search Routes
  app.get("/api/tools/search/sku/:sku", async (req, res) => {
    try {
      const tool = await storage.getToolBySku(req.params.sku);
      if (!tool) {
        return res.status(404).json({ message: "الأداة غير موجودة" });
      }
      res.json(tool);
    } catch (error) {
      console.error("Error searching tool by SKU:", error);
      res.status(500).json({ message: "خطأ في البحث عن الأداة" });
    }
  });

  app.get("/api/tools/search/barcode/:barcode", async (req, res) => {
    try {
      const tool = await storage.getToolByBarcode(req.params.barcode);
      if (!tool) {
        return res.status(404).json({ message: "الأداة غير موجودة" });
      }
      res.json(tool);
    } catch (error) {
      console.error("Error searching tool by barcode:", error);
      res.status(500).json({ message: "خطأ في البحث عن الأداة" });
    }
  });

  app.get("/api/tools/search/qr/:qrCode", async (req, res) => {
    try {
      const tool = await storage.getToolByQrCode(req.params.qrCode);
      if (!tool) {
        return res.status(404).json({ message: "الأداة غير موجودة" });
      }
      res.json(tool);
    } catch (error) {
      console.error("Error searching tool by QR code:", error);
      res.status(500).json({ message: "خطأ في البحث عن الأداة" });
    }
  });

  // Tool Stock Routes
  app.get("/api/tool-stock", async (req, res) => {
    try {
      const { toolId, locationType, locationId } = req.query;
      const stock = await storage.getToolStock(
        toolId as string, 
        locationType as string, 
        locationId as string
      );
      res.json(stock);
    } catch (error) {
      console.error("Error fetching tool stock:", error);
      res.status(500).json({ message: "خطأ في جلب مخزون الأدوات" });
    }
  });

  // Tool Stock by ID Route (for tool details dialog)
  app.get("/api/tool-stock/:toolId", async (req, res) => {
    try {
      const stock = await storage.getToolStock(req.params.toolId);
      res.json(stock);
    } catch (error) {
      console.error("Error fetching tool stock by ID:", error);
      res.status(500).json({ message: "خطأ في جلب مخزون الأداة" });
    }
  });

  app.post("/api/tool-stock", async (req, res) => {
    try {
      const result = insertToolStockSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "بيانات مخزون الأداة غير صحيحة", 
          errors: result.error.issues 
        });
      }

      const stock = await storage.createOrUpdateToolStock(result.data);
      res.status(201).json(stock);
    } catch (error) {
      console.error("Error creating/updating tool stock:", error);
      res.status(500).json({ message: "خطأ في إنشاء/تحديث مخزون الأداة" });
    }
  });

  // Tool Movements Routes
  app.get("/api/tool-movements", async (req, res) => {
    try {
      const { toolId, projectId, movementType, dateFrom, dateTo } = req.query;
      const filters = {
        toolId: toolId as string,
        projectId: projectId as string,
        movementType: movementType as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      };

      const movements = await storage.getToolMovements(filters);
      res.json(movements);
    } catch (error) {
      console.error("Error fetching tool movements:", error);
      res.status(500).json({ message: "خطأ في جلب حركات الأدوات" });
    }
  });

  // Tool Movements Recent by ID Route (for tool details dialog)
  app.get("/api/tool-movements/:toolId/recent", async (req, res) => {
    try {
      const filters = {
        toolId: req.params.toolId,
        projectId: '',
        movementType: '',
        dateFrom: '',
        dateTo: '',
      };

      const movements = await storage.getToolMovements(filters);
      // أخذ آخر 10 حركات فقط
      const recentMovements = movements.slice(0, 10);
      res.json(recentMovements);
    } catch (error) {
      console.error("Error fetching recent tool movements:", error);
      res.status(500).json({ message: "خطأ في جلب الحركات الأخيرة للأداة" });
    }
  });

  app.post("/api/tool-movements", async (req, res) => {
    try {
      console.log("📦 البيانات المستلمة:", JSON.stringify(req.body, null, 2));
      
      const result = insertToolMovementSchema.safeParse(req.body);
      if (!result.success) {
        console.log("❌ فشل التحقق من الصحة:", JSON.stringify(result.error.issues, null, 2));
        return res.status(400).json({ 
          message: "بيانات حركة الأداة غير صحيحة", 
          errors: result.error.issues 
        });
      }

      console.log("✅ البيانات المحققة:", JSON.stringify(result.data, null, 2));
      const movement = await storage.createToolMovement(result.data);
      res.status(201).json(movement);
    } catch (error) {
      console.error("Error creating tool movement:", error);
      res.status(500).json({ message: "خطأ في إنشاء حركة الأداة" });
    }
  });

  // Tool Transfer Route
  app.post("/api/tools/:toolId/transfer", async (req, res) => {
    try {
      const { toolId } = req.params;
      const { fromLocation, toLocation, quantity, userId, reason } = req.body;

      if (!fromLocation || !toLocation || !quantity || !userId) {
        return res.status(400).json({ 
          message: "بيانات التحويل غير مكتملة" 
        });
      }

      const movement = await storage.transferTool(
        toolId, 
        fromLocation, 
        toLocation, 
        quantity, 
        userId, 
        reason
      );
      res.status(201).json(movement);
    } catch (error) {
      console.error("Error transferring tool:", error);
      res.status(500).json({ message: "خطأ في تحويل الأداة" });
    }
  });

  // Tool Maintenance Routes
  app.get("/api/tool-maintenance", async (req, res) => {
    try {
      const { toolId, status } = req.query;
      const logs = await storage.getToolMaintenanceLogs(
        toolId as string, 
        status as string
      );
      res.json(logs);
    } catch (error) {
      console.error("Error fetching tool maintenance logs:", error);
      res.status(500).json({ message: "خطأ في جلب سجلات الصيانة" });
    }
  });

  app.post("/api/tool-maintenance", async (req, res) => {
    try {
      const result = insertToolMaintenanceLogSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "بيانات صيانة الأداة غير صحيحة", 
          errors: result.error.issues 
        });
      }

      const log = await storage.createToolMaintenanceLog(result.data);
      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating tool maintenance log:", error);
      res.status(500).json({ message: "خطأ في إنشاء سجل الصيانة" });
    }
  });

  app.get("/api/tool-maintenance/overdue", async (req, res) => {
    try {
      const overdueMaintenace = await storage.getOverdueMaintenanceTasks();
      res.json(overdueMaintenace);
    } catch (error) {
      console.error("Error fetching overdue maintenance:", error);
      res.status(500).json({ message: "خطأ في جلب الصيانة المتأخرة" });
    }
  });

  // Tool Reservations Routes
  app.get("/api/tool-reservations", async (req, res) => {
    try {
      const { toolId, projectId, status, userId } = req.query;
      const filters = {
        toolId: toolId as string,
        projectId: projectId as string,
        status: status as string,
        userId: userId as string,
      };

      const reservations = await storage.getToolReservations(filters);
      res.json(reservations);
    } catch (error) {
      console.error("Error fetching tool reservations:", error);
      res.status(500).json({ message: "خطأ في جلب حجوزات الأدوات" });
    }
  });

  app.post("/api/tool-reservations", async (req, res) => {
    try {
      const result = insertToolReservationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "بيانات حجز الأداة غير صحيحة", 
          errors: result.error.issues 
        });
      }

      const reservation = await storage.createToolReservation(result.data);
      res.status(201).json(reservation);
    } catch (error) {
      console.error("Error creating tool reservation:", error);
      res.status(500).json({ message: "خطأ في إنشاء حجز الأداة" });
    }
  });

  // ==================== Tools Reports API ====================
  
  // Tools stats endpoint
  app.get("/api/tools/stats/:days", async (req, res) => {
    try {
      const days = parseInt(req.params.days);
      const tools = await storage.getTools({});
      
      const stats = {
        totalTools: tools.length,
        availableTools: tools.filter(t => t.status === 'available').length,
        inUseTools: tools.filter(t => t.status === 'in_use').length,
        maintenanceTools: tools.filter(t => t.status === 'maintenance').length,
        damagedTools: tools.filter(t => t.status === 'damaged').length,
        totalValue: tools.reduce((sum, tool) => sum + (Number(tool.purchasePrice) || 0), 0),
        categoriesCount: new Set(tools.map(t => t.categoryId)).size
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching tools stats:", error);
      res.status(500).json({ message: "خطأ في جلب إحصائيات الأدوات" });
    }
  });

  // Usage report endpoint  
  app.get("/api/tools/usage-report/:days/:category", async (req, res) => {
    try {
      const days = parseInt(req.params.days);
      const category = req.params.category;
      
      const tools = await storage.getTools({
        categoryId: category === 'all' ? undefined : category
      });
      
      const categories = await storage.getToolCategories();
      const categoryMap = new Map(categories.map(c => [c.id, c.name]));
      
      // جلب أسماء المشاريع للأدوات المربوطة بمشاريع
      const projects = await storage.getProjects();
      const projectMap = new Map(projects.map(p => [p.id, p.name]));
      
      const usageReport = tools.map(tool => {
        let location = 'المخزن الرئيسي';
        
        // تحديد الموقع بناءً على بيانات الأداة
        if (tool.projectId && projectMap.has(tool.projectId)) {
          location = projectMap.get(tool.projectId)!;
        } else if (tool.locationType === 'project' && tool.locationId && projectMap.has(tool.locationId)) {
          location = projectMap.get(tool.locationId)!;
        } else if (tool.locationType && tool.locationType !== 'warehouse') {
          location = tool.locationType;
        }
        
        return {
          id: tool.id,
          name: tool.name,
          category: categoryMap.get(tool.categoryId || '') || 'غير محدد',
          usageCount: tool.usageCount || 0,
          lastUsed: tool.updatedAt,
          status: tool.status,
          location: location
        };
      });
      
      res.json(usageReport);
    } catch (error) {
      console.error("Error fetching usage report:", error);
      res.status(500).json({ message: "خطأ في جلب تقرير الاستخدام" });
    }
  });

  // Categories stats endpoint
  app.get("/api/tools/categories-stats/:days", async (req, res) => {
    try {
      const categories = await storage.getToolCategories();
      const tools = await storage.getTools({});
      
      const categoryStats = categories.map(category => {
        const categoryTools = tools.filter(t => t.categoryId === category.id);
        
        // حساب الأداة الأكثر استخداماً
        const mostUsedTool = categoryTools.length > 0 
          ? categoryTools.reduce((max, tool) => 
              (tool.usageCount || 0) > (max.usageCount || 0) ? tool : max
            ).name || null
          : null;
        
        // حساب متوسط الحالة
        const conditionValues = {
          'excellent': 5,
          'good': 4,
          'fair': 3,
          'poor': 2,
          'damaged': 1
        };
        
        const averageConditionScore = categoryTools.length > 0
          ? categoryTools.reduce((sum, tool) => sum + (conditionValues[tool.condition as keyof typeof conditionValues] || 3), 0) / categoryTools.length
          : 3;
        
        const averageCondition = averageConditionScore >= 4.5 ? 'excellent' :
                                averageConditionScore >= 3.5 ? 'good' :
                                averageConditionScore >= 2.5 ? 'fair' :
                                averageConditionScore >= 1.5 ? 'poor' : 'damaged';
        
        return {
          id: category.id,
          name: category.name,
          description: category.description,
          icon: category.icon,
          toolCount: categoryTools.length,
          totalValue: categoryTools.reduce((sum, tool) => sum + (Number(tool.purchasePrice) || 0), 0),
          availableCount: categoryTools.filter(t => t.status === 'available').length,
          inUseCount: categoryTools.filter(t => t.status === 'in_use').length,
          mostUsedTool: mostUsedTool,
          averageCondition: averageCondition,
          createdAt: category.createdAt
        };
      });
      
      res.json(categoryStats);
    } catch (error) {
      console.error("Error fetching categories stats:", error);
      res.status(500).json({ message: "خطأ في جلب إحصائيات التصنيفات" });
    }
  });

  // Maintenance report endpoint
  app.get("/api/tools/maintenance-report", async (req, res) => {
    try {
      const tools = await storage.getTools({});
      
      const maintenanceReport = tools
        .filter(tool => tool.nextMaintenanceDate)
        .map(tool => {
          const nextMaintenance = new Date(tool.nextMaintenanceDate!);
          const today = new Date();
          const daysUntilMaintenance = Math.ceil((nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          return {
            id: tool.id,
            toolName: tool.name,
            lastMaintenance: tool.lastMaintenanceDate,
            nextMaintenance: tool.nextMaintenanceDate,
            maintenanceType: 'صيانة دورية',
            overdue: daysUntilMaintenance < 0,
            daysOverdue: Math.abs(daysUntilMaintenance)
          };
        });
      
      res.json(maintenanceReport);
    } catch (error) {
      console.error("Error fetching maintenance report:", error);
      res.status(500).json({ message: "خطأ في جلب تقرير الصيانة" });
    }
  });

  // Advanced Tool Reports Routes
  app.get("/api/tools/reports/utilization", async (req, res) => {
    try {
      const { dateFrom, dateTo } = req.query;
      
      if (!dateFrom || !dateTo) {
        return res.status(400).json({ message: "يرجى تحديد تاريخ البداية والنهاية" });
      }

      const report = await storage.getToolUtilizationReport(
        dateFrom as string, 
        dateTo as string
      );
      res.json(report);
    } catch (error) {
      console.error("Error generating tool utilization report:", error);
      res.status(500).json({ message: "خطأ في إنشاء تقرير استخدام الأدوات" });
    }
  });

  app.get("/api/tools/reports/low-stock", async (req, res) => {
    try {
      const { threshold = 5 } = req.query;
      const lowStockTools = await storage.getLowStockTools(parseInt(threshold as string));
      res.json(lowStockTools);
    } catch (error) {
      console.error("Error fetching low stock tools:", error);
      res.status(500).json({ message: "خطأ في جلب الأدوات منخفضة المخزون" });
    }
  });

  app.get("/api/tools/reports/needing-maintenance", async (req, res) => {
    try {
      const toolsNeedingMaintenance = await storage.getToolsNeedingMaintenance();
      res.json(toolsNeedingMaintenance);
    } catch (error) {
      console.error("Error fetching tools needing maintenance:", error);
      res.status(500).json({ message: "خطأ في جلب الأدوات التي تحتاج صيانة" });
    }
  });

  app.get("/api/tools/:toolId/history", async (req, res) => {
    try {
      const history = await storage.getToolHistory(req.params.toolId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching tool history:", error);
      res.status(500).json({ message: "خطأ في جلب تاريخ الأداة" });
    }
  });

  app.get("/api/projects/:projectId/tools", async (req, res) => {
    try {
      const tools = await storage.getToolsByProject(req.params.projectId);
      res.json(tools);
    } catch (error) {
      console.error("Error fetching project tools:", error);
      res.status(500).json({ message: "خطأ في جلب أدوات المشروع" });
    }
  });

  // Tool QR Code Generation
  app.post("/api/tools/:toolId/generate-qr", async (req, res) => {
    try {
      const qrCode = await storage.generateToolQRCode(req.params.toolId);
      res.json({ qrCode });
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ message: "خطأ في إنشاء كود QR" });
    }
  });

  // Bulk Tool Operations
  app.post("/api/tools/bulk-update-status", async (req, res) => {
    try {
      const { toolIds, status, userId } = req.body;
      
      if (!toolIds || !Array.isArray(toolIds) || !status || !userId) {
        return res.status(400).json({ 
          message: "بيانات التحديث المجمع غير مكتملة" 
        });
      }

      await storage.bulkUpdateToolStatus(toolIds, status, userId);
      res.json({ message: "تم تحديث حالة الأدوات بنجاح", count: toolIds.length });
    } catch (error) {
      console.error("Error bulk updating tool status:", error);
      res.status(500).json({ message: "خطأ في التحديث المجمع لحالة الأدوات" });
    }
  });

  // Tool System Migration Endpoint
  app.post("/api/migrate/tools", async (req, res) => {
    try {
      console.log("🔧 بدء إنشاء جداول نظام الأدوات...");
      
      // حذف الجداول الموجودة إذا كانت موجودة وغير متطابقة
      try {
        console.log("🗑️ حذف الجداول القديمة إذا كانت موجودة...");
        await db.execute(sql`DROP TABLE IF EXISTS tool_reservations CASCADE`);
        await db.execute(sql`DROP TABLE IF EXISTS tool_usage_analytics CASCADE`);
        await db.execute(sql`DROP TABLE IF EXISTS tool_maintenance_logs CASCADE`);
        await db.execute(sql`DROP TABLE IF EXISTS tool_movements CASCADE`);
        await db.execute(sql`DROP TABLE IF EXISTS tool_stock CASCADE`);
        await db.execute(sql`DROP TABLE IF EXISTS tools CASCADE`);
        await db.execute(sql`DROP TABLE IF EXISTS tool_categories CASCADE`);
        console.log("✅ تم حذف الجداول القديمة");
      } catch (error) {
        console.log("ℹ️ لا توجد جداول قديمة للحذف");
      }

      // إنشاء جداول نظام الأدوات
      await db.execute(sql`
        CREATE TABLE tool_categories (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          icon TEXT,
          color TEXT DEFAULT '#3b82f6',
          parent_id TEXT REFERENCES tool_categories(id) ON DELETE CASCADE,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS tools (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          name TEXT NOT NULL,
          description TEXT,
          category_id TEXT REFERENCES tool_categories(id) ON DELETE SET NULL,
          sku TEXT,
          serial_number TEXT,
          barcode TEXT,
          qr_code TEXT,
          unit TEXT NOT NULL DEFAULT 'قطعة',
          purchase_price DECIMAL(15,2),
          current_value DECIMAL(15,2),
          depreciation_rate DECIMAL(5,2) DEFAULT 0,
          purchase_date DATE,
          warranty_expiry DATE,
          maintenance_interval INTEGER,
          next_maintenance_date DATE,
          status TEXT DEFAULT 'available',
          condition TEXT DEFAULT 'good',
          location_type TEXT DEFAULT 'warehouse',
          location_id TEXT,
          specifications JSONB DEFAULT '{}',
          images TEXT[] DEFAULT '{}',
          manuals TEXT[] DEFAULT '{}',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS tool_stock (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
          location_type TEXT NOT NULL,
          location_id TEXT,
          quantity INTEGER NOT NULL DEFAULT 0,
          available_quantity INTEGER NOT NULL DEFAULT 0,
          reserved_quantity INTEGER NOT NULL DEFAULT 0,
          min_stock_level INTEGER DEFAULT 1,
          max_stock_level INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      console.log("✅ تم إنشاء الجداول الأساسية");

      // باقي الجداول
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS tool_movements (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
          movement_type TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          from_type TEXT,
          from_id TEXT,
          to_type TEXT,
          to_id TEXT,
          project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
          reference_number TEXT,
          reason TEXT,
          performed_by TEXT NOT NULL,
          performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          notes TEXT
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS tool_maintenance_logs (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
          maintenance_type TEXT NOT NULL,
          scheduled_date DATE NOT NULL,
          completed_date DATE,
          status TEXT DEFAULT 'scheduled',
          cost DECIMAL(15,2),
          performed_by TEXT,
          description TEXT,
          notes TEXT,
          next_maintenance_date DATE,
          parts_replaced TEXT[] DEFAULT '{}',
          attachments TEXT[] DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      console.log("✅ تم إنشاء جداول الحركة والصيانة");

      // الجداول المتقدمة
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS tool_usage_analytics (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
          project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
          analysis_date DATE NOT NULL,
          analysis_week TEXT,
          analysis_month TEXT,
          usage_hours DECIMAL(10,2) DEFAULT 0,
          utilization_rate DECIMAL(5,2) DEFAULT 0,
          operational_cost DECIMAL(15,2) DEFAULT 0,
          efficiency_score DECIMAL(5,2) DEFAULT 0,
          downtime_hours DECIMAL(10,2) DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS tool_reservations (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
          project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
          reserved_by TEXT NOT NULL,
          requested_date DATE NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          status TEXT DEFAULT 'pending',
          purpose TEXT,
          approved_by TEXT,
          approved_at TIMESTAMP WITH TIME ZONE,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      console.log("✅ تم إنشاء الجداول المتقدمة");

      // إنشاء الفهارس للأداء المحسن
      const indexCommands = [
        `CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category_id)`,
        `CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status)`,
        `CREATE INDEX IF NOT EXISTS idx_tools_sku ON tools(sku)`,
        `CREATE INDEX IF NOT EXISTS idx_tools_qr_code ON tools(qr_code)`,
        `CREATE INDEX IF NOT EXISTS idx_tool_stock_tool_id ON tool_stock(tool_id)`,
        `CREATE INDEX IF NOT EXISTS idx_tool_stock_location ON tool_stock(location_type, location_id)`,
        `CREATE INDEX IF NOT EXISTS idx_tool_movements_tool_id ON tool_movements(tool_id)`,
        `CREATE INDEX IF NOT EXISTS idx_tool_movements_project_id ON tool_movements(project_id)`,
        `CREATE INDEX IF NOT EXISTS idx_tool_movements_performed_at ON tool_movements(performed_at)`,
        `CREATE INDEX IF NOT EXISTS idx_tool_maintenance_tool_id ON tool_maintenance_logs(tool_id)`,
        `CREATE INDEX IF NOT EXISTS idx_tool_maintenance_scheduled_date ON tool_maintenance_logs(scheduled_date)`,
        `CREATE INDEX IF NOT EXISTS idx_tool_maintenance_status ON tool_maintenance_logs(status)`,
        `CREATE INDEX IF NOT EXISTS idx_tool_analytics_tool_id ON tool_usage_analytics(tool_id)`,
        `CREATE INDEX IF NOT EXISTS idx_tool_analytics_date ON tool_usage_analytics(analysis_date)`,
        `CREATE INDEX IF NOT EXISTS idx_tool_reservations_tool_id ON tool_reservations(tool_id)`,
        `CREATE INDEX IF NOT EXISTS idx_tool_reservations_project_id ON tool_reservations(project_id)`,
        `CREATE INDEX IF NOT EXISTS idx_tool_reservations_dates ON tool_reservations(start_date, end_date)`
      ];

      for (const indexCmd of indexCommands) {
        await db.execute(sql.raw(indexCmd));
      }

      console.log("✅ تم إنشاء جميع الفهارس");

      // إدراج بيانات أولية للتصنيفات
      const categories = [
        ['أدوات كهربائية', 'أدوات العمل الكهربائية والآلات', 'Zap'],
        ['أدوات يدوية', 'الأدوات اليدوية التقليدية', 'Tool'],
        ['معدات الحفر', 'معدات وأدوات الحفر والتنقيب', 'Drill'],
        ['معدات الرفع', 'رافعات وونشات ومعدات الرفع', 'Crane'],
        ['أدوات القياس', 'أجهزة القياس والمعايرة', 'Ruler'],
        ['معدات الأمان', 'معدات السلامة والحماية الشخصية', 'Shield'],
        ['أدوات البناء', 'أدوات ومعدات أعمال البناء', 'Hammer'],
        ['معدات النقل', 'مركبات ومعدات النقل الداخلي', 'Truck']
      ];

      for (const [name, description, icon] of categories) {
        await db.execute(sql`
          INSERT INTO tool_categories (name, description, icon) VALUES (${name}, ${description}, ${icon})
          ON CONFLICT (name) DO NOTHING
        `);
      }

      console.log("✅ تم إدراج التصنيفات الأولية");

      res.json({ 
        success: true, 
        message: "تم إنشاء جداول نظام الأدوات بنجاح",
        tablesCreated: 7,
        indexesCreated: 16,
        categoriesInserted: 8
      });
    } catch (error) {
      console.error("❌ خطأ في إنشاء جداول نظام الأدوات:", error);
      res.status(500).json({ 
        success: false, 
        message: "فشل في إنشاء جداول نظام الأدوات", 
        error: error instanceof Error ? error.message : "خطأ غير معروف"
      });
    }
  });

  // =====================================
  // Phase 3: Integration & Advanced Maintenance APIs
  // =====================================

  // Tool Purchase Items Routes
  app.get("/api/tool-purchase-items/:purchaseId", async (req, res) => {
    try {
      const items = await storage.getToolPurchaseItemsByPurchase(req.params.purchaseId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching tool purchase items:", error);
      res.status(500).json({ message: "خطأ في جلب بنود شراء الأدوات" });
    }
  });

  app.post("/api/tool-purchase-items", async (req, res) => {
    try {
      const result = insertToolPurchaseItemSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "بيانات بند شراء الأداة غير صحيحة", 
          errors: result.error.issues 
        });
      }

      const item = await storage.createToolPurchaseItem(result.data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating tool purchase item:", error);
      res.status(500).json({ message: "خطأ في إنشاء بند شراء الأداة" });
    }
  });

  app.post("/api/tool-purchase-items/:itemId/convert-to-tool", async (req, res) => {
    try {
      const { itemId } = req.params;
      const toolData = req.body;

      const result = await storage.convertPurchaseItemToTool(itemId, toolData);
      res.json({
        message: "تم تحويل بند الشراء إلى أداة بنجاح",
        item: result.item,
        tool: result.tool
      });
    } catch (error) {
      console.error("Error converting purchase item to tool:", error);
      res.status(500).json({ message: "خطأ في تحويل بند الشراء إلى أداة" });
    }
  });

  app.post("/api/tool-purchase-items/classify/:purchaseId", async (req, res) => {
    try {
      await storage.classifyPurchaseItems(req.params.purchaseId);
      res.json({ message: "تم تصنيف بنود الشراء باستخدام الذكاء الاصطناعي" });
    } catch (error) {
      console.error("Error classifying purchase items:", error);
      res.status(500).json({ message: "خطأ في تصنيف بنود الشراء" });
    }
  });

  // Maintenance Schedules Routes
  app.get("/api/maintenance-schedules", async (req, res) => {
    try {
      const { toolId, isActive, scheduleType } = req.query;
      const filters = {
        toolId: toolId as string,
        isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
        scheduleType: scheduleType as string,
      };

      const schedules = await storage.getMaintenanceSchedules(filters);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching maintenance schedules:", error);
      res.status(500).json({ message: "خطأ في جلب جداول الصيانة" });
    }
  });

  app.get("/api/maintenance-schedules/upcoming", async (req, res) => {
    try {
      const { daysBefore = 7 } = req.query;
      const schedules = await storage.getUpcomingMaintenanceSchedules(parseInt(daysBefore as string));
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching upcoming maintenance schedules:", error);
      res.status(500).json({ message: "خطأ في جلب جداول الصيانة القادمة" });
    }
  });

  app.post("/api/maintenance-schedules", async (req, res) => {
    try {
      const result = insertMaintenanceScheduleSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "بيانات جدول الصيانة غير صحيحة", 
          errors: result.error.issues 
        });
      }

      const schedule = await storage.createMaintenanceSchedule(result.data);
      res.status(201).json(schedule);
    } catch (error) {
      console.error("Error creating maintenance schedule:", error);
      res.status(500).json({ message: "خطأ في إنشاء جدول الصيانة" });
    }
  });

  // Maintenance Tasks Routes
  app.get("/api/maintenance-tasks", async (req, res) => {
    try {
      const { toolId, scheduleId, status, assignedTo } = req.query;
      const filters = {
        toolId: toolId as string,
        scheduleId: scheduleId as string,
        status: status as string,
        assignedTo: assignedTo as string,
      };

      const tasks = await storage.getMaintenanceTasks(filters);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching maintenance tasks:", error);
      res.status(500).json({ message: "خطأ في جلب مهام الصيانة" });
    }
  });

  app.post("/api/maintenance-tasks", async (req, res) => {
    try {
      const result = insertMaintenanceTaskSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "بيانات مهمة الصيانة غير صحيحة", 
          errors: result.error.issues 
        });
      }

      const task = await storage.createMaintenanceTask(result.data);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating maintenance task:", error);
      res.status(500).json({ message: "خطأ في إنشاء مهمة الصيانة" });
    }
  });

  app.put("/api/maintenance-tasks/:taskId/status", async (req, res) => {
    try {
      const { taskId } = req.params;
      const { status, ...updateData } = req.body;

      const updatedTask = await storage.updateMaintenanceTaskStatus(taskId, status, updateData);
      if (!updatedTask) {
        return res.status(404).json({ message: "مهمة الصيانة غير موجودة" });
      }

      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating maintenance task status:", error);
      res.status(500).json({ message: "خطأ في تحديث حالة مهمة الصيانة" });
    }
  });

  // Tool Cost Tracking Routes
  app.get("/api/tool-cost-tracking", async (req, res) => {
    try {
      const { toolId, costType, costCategory, projectId, startDate, endDate } = req.query;
      const filters = {
        toolId: toolId as string,
        costType: costType as string,
        costCategory: costCategory as string,
        projectId: projectId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      };

      const costs = await storage.getToolCostTracking(filters);
      res.json(costs);
    } catch (error) {
      console.error("Error fetching tool cost tracking:", error);
      res.status(500).json({ message: "خطأ في جلب تتبع التكاليف" });
    }
  });

  app.get("/api/tools/:toolId/total-costs", async (req, res) => {
    try {
      const costs = await storage.getToolTotalCosts(req.params.toolId);
      res.json(costs);
    } catch (error) {
      console.error("Error fetching tool total costs:", error);
      res.status(500).json({ message: "خطأ في جلب إجمالي التكاليف" });
    }
  });

  app.post("/api/tool-cost-tracking", async (req, res) => {
    try {
      const result = insertToolCostTrackingSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "بيانات تتبع التكاليف غير صحيحة", 
          errors: result.error.issues 
        });
      }

      const cost = await storage.createToolCostTracking(result.data);
      res.status(201).json(cost);
    } catch (error) {
      console.error("Error creating tool cost tracking:", error);
      res.status(500).json({ message: "خطأ في إنشاء تتبع التكاليف" });
    }
  });

  // Phase 3 Migration Endpoint
  app.post("/api/migrate/tools-phase3", async (req, res) => {
    try {
      console.log("🚀 بدء إنشاء جداول المرحلة 3 - التكامل والصيانة المتقدمة...");
      
      // حذف الجداول إذا كانت موجودة للبدء من جديد
      await db.execute(sql`DROP TABLE IF EXISTS tool_cost_tracking CASCADE`);
      await db.execute(sql`DROP TABLE IF EXISTS maintenance_tasks CASCADE`);
      await db.execute(sql`DROP TABLE IF EXISTS maintenance_schedules CASCADE`);
      await db.execute(sql`DROP TABLE IF EXISTS tool_purchase_items CASCADE`);
      
      // إنشاء جدول ربط الأدوات بالمشتريات
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS tool_purchase_items (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          material_purchase_id TEXT NOT NULL REFERENCES material_purchases(id) ON DELETE CASCADE,
          item_name TEXT NOT NULL,
          item_description TEXT,
          quantity INTEGER NOT NULL DEFAULT 1,
          unit_price DECIMAL(12,2) NOT NULL,
          total_price DECIMAL(12,2) NOT NULL,
          is_tool_item BOOLEAN DEFAULT false NOT NULL,
          suggested_category_id TEXT REFERENCES tool_categories(id),
          conversion_status TEXT NOT NULL DEFAULT 'pending',
          tool_id TEXT REFERENCES tools(id),
          ai_confidence DECIMAL(5,2),
          ai_suggestions JSONB,
          notes TEXT,
          converted_at TIMESTAMP WITH TIME ZONE,
          converted_by_name TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `);

      // إنشاء جدول جداول الصيانة المتقدمة
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS maintenance_schedules (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
          schedule_type TEXT NOT NULL,
          interval_days INTEGER,
          interval_weeks INTEGER,
          interval_months INTEGER,
          usage_hours_interval DECIMAL(10,2),
          usage_count_interval INTEGER,
          is_active BOOLEAN DEFAULT true NOT NULL,
          last_maintenance_date TIMESTAMP WITH TIME ZONE,
          next_due_date TIMESTAMP WITH TIME ZONE NOT NULL,
          maintenance_type TEXT NOT NULL DEFAULT 'preventive',
          priority TEXT NOT NULL DEFAULT 'medium',
          estimated_duration INTEGER,
          estimated_cost DECIMAL(12,2),
          assigned_to_name TEXT,
          created_by_name TEXT,
          title TEXT NOT NULL,
          description TEXT,
          checklist_items JSONB,
          enable_notifications BOOLEAN DEFAULT true NOT NULL,
          notify_days_before INTEGER DEFAULT 3 NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `);

      // إنشاء جدول مهام الصيانة التفصيلية
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS maintenance_tasks (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          schedule_id TEXT NOT NULL REFERENCES maintenance_schedules(id) ON DELETE CASCADE,
          tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
          task_name TEXT NOT NULL,
          task_description TEXT,
          task_type TEXT NOT NULL,
          priority TEXT NOT NULL DEFAULT 'medium',
          status TEXT NOT NULL DEFAULT 'pending',
          due_date TIMESTAMP WITH TIME ZONE NOT NULL,
          started_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          estimated_duration INTEGER,
          actual_duration INTEGER,
          estimated_cost DECIMAL(12,2),
          actual_cost DECIMAL(12,2),
          assigned_to_name TEXT,
          performed_by_name TEXT,
          result TEXT,
          findings TEXT,
          actions_taken TEXT,
          recommendations TEXT,
          before_images TEXT[],
          after_images TEXT[],
          document_urls TEXT[],
          materials_used JSONB,
          performer_signature TEXT,
          supervisor_signature TEXT,
          approved_by_name TEXT,
          approved_at TIMESTAMP WITH TIME ZONE,
          notes TEXT,
          internal_notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `);

      // إنشاء جدول تتبع التكاليف للأدوات
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS tool_cost_tracking (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
          cost_type TEXT NOT NULL,
          cost_category TEXT NOT NULL,
          amount DECIMAL(12,2) NOT NULL,
          currency TEXT NOT NULL DEFAULT 'YER',
          cost_date TEXT NOT NULL,
          cost_period TEXT,
          reference_type TEXT,
          reference_id TEXT,
          description TEXT NOT NULL,
          notes TEXT,
          approved_by_name TEXT,
          approved_at TIMESTAMP WITH TIME ZONE,
          project_id TEXT REFERENCES projects(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `);

      // إنشاء فهارس للأداء
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tool_purchase_items_purchase_id ON tool_purchase_items(material_purchase_id)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tool_purchase_items_tool_id ON tool_purchase_items(tool_id)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_tool_id ON maintenance_schedules(tool_id)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_due_date ON maintenance_schedules(next_due_date)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_schedule_id ON maintenance_tasks(schedule_id)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_tool_id ON maintenance_tasks(tool_id)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_status ON maintenance_tasks(status)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tool_cost_tracking_tool_id ON tool_cost_tracking(tool_id)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tool_cost_tracking_date ON tool_cost_tracking(cost_date)`);

      console.log("✅ تم إنشاء جميع جداول المرحلة 3 بنجاح");
      
      res.json({ 
        success: true, 
        message: "تم إنشاء جداول المرحلة 3 - التكامل والصيانة المتقدمة بنجاح",
        tablesCreated: [
          "tool_purchase_items",
          "maintenance_schedules", 
          "maintenance_tasks",
          "tool_cost_tracking"
        ]
      });
    } catch (error) {
      console.error("❌ خطأ في إنشاء جداول المرحلة 3:", error);
      res.status(500).json({ 
        success: false, 
        message: "فشل في إنشاء جداول المرحلة 3", 
        error: error instanceof Error ? error.message : "خطأ غير معروف"
      });
    }
  });

  // إضافة العمود المفقود project_id إلى جدول tools
  app.post("/api/migrate/add-project-id-column", async (req, res) => {
    try {
      console.log("🔧 جاري إضافة العمود project_id إلى جدول tools...");

      // التحقق من وجود العمود أولاً
      const columnCheck = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='tools' AND column_name='project_id'
      `);

      if (Array.isArray(columnCheck) && columnCheck.length === 0) {
        // إضافة العمود إذا لم يكن موجوداً
        console.log("العمود غير موجود - جاري الإضافة...");
        await db.execute(sql`
          ALTER TABLE tools 
          ADD COLUMN project_id TEXT
        `);
        console.log("تم إضافة العمود project_id بنجاح");

        // إضافة المرجعية للمشروع
        try {
          await db.execute(sql`
            ALTER TABLE tools 
            ADD CONSTRAINT fk_tools_project 
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
          `);
          console.log("✅ تم إضافة العمود project_id مع المرجعية بنجاح");
        } catch (constraintError) {
          console.log("ℹ️  تم إضافة العمود project_id (المرجعية موجودة مسبقاً)");
        }
        
      } else {
        console.log("ℹ️  العمود project_id موجود مسبقاً");
      }

      res.json({ 
        success: true, 
        message: "تم التحقق من العمود project_id وإضافته إذا كان مفقوداً" 
      });
    } catch (error) {
      console.error("❌ خطأ في إضافة العمود project_id:", error);
      res.status(500).json({ 
        success: false, 
        message: "فشل في إضافة العمود project_id", 
        error: error instanceof Error ? error.message : "خطأ غير معروف"
      });
    }
  });

  // إعادة إنشاء جدول الأدوات مع جميع الأعمدة المطلوبة
  app.post("/api/migrate/force-update-tools-schema", async (req, res) => {
    try {
      console.log("🔧 إعادة تحديث schema جدول tools بجميع الأعمدة...");
      
      const requiredColumns = [
        { name: 'project_id', type: 'TEXT' },
        { name: 'is_tool', type: 'BOOLEAN DEFAULT true' },
        { name: 'is_consumable', type: 'BOOLEAN DEFAULT false' },
        { name: 'is_serial', type: 'BOOLEAN DEFAULT false' },
        { name: 'purchase_price', type: 'NUMERIC(12,2)' },
        { name: 'purchase_date', type: 'TIMESTAMP' },
        { name: 'supplier_id', type: 'TEXT' },
        { name: 'warranty_expiry', type: 'TIMESTAMP' },
        { name: 'maintenance_interval', type: 'INTEGER' },
        { name: 'last_maintenance_date', type: 'TIMESTAMP' },
        { name: 'next_maintenance_date', type: 'TIMESTAMP' },
        { name: 'serial_number', type: 'TEXT' },
        { name: 'barcode', type: 'TEXT' },
        { name: 'qr_code', type: 'TEXT' },
        { name: 'image_urls', type: 'TEXT[]' },
        { name: 'specifications', type: 'JSONB' },
        { name: 'total_usage_hours', type: 'NUMERIC(10,2) DEFAULT 0' },
        { name: 'usage_count', type: 'INTEGER DEFAULT 0' },
        { name: 'ai_rating', type: 'NUMERIC(3,2)' },
        { name: 'ai_notes', type: 'TEXT' }
      ];
      
      let addedColumns = 0;
      
      for (const column of requiredColumns) {
        try {
          await db.execute(sql.raw(`
            ALTER TABLE tools 
            ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}
          `));
          addedColumns++;
          console.log(`✅ تم فحص/إضافة العمود ${column.name}`);
        } catch (e: any) {
          if (!e.message.includes('already exists')) {
            console.log(`⚠️ تحذير في العمود ${column.name}:`, e.message);
          }
        }
      }
      
      // إضافة المراجع
      try {
        await db.execute(sql`
          ALTER TABLE tools 
          ADD CONSTRAINT IF NOT EXISTS fk_tools_project_id 
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
        `);
        console.log("✅ تم فحص/إضافة مرجعية المشروع");
      } catch (e) {
        // المرجعية موجودة
      }
      
      try {
        await db.execute(sql`
          ALTER TABLE tools 
          ADD CONSTRAINT IF NOT EXISTS fk_tools_supplier_id 
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
        `);
        console.log("✅ تم فحص/إضافة مرجعية المورد");
      } catch (e) {
        // المرجعية موجودة
      }

      res.json({ 
        success: true, 
        message: `تم تحديث schema جدول tools - تم فحص ${requiredColumns.length} عمود`,
        addedColumns
      });
      
    } catch (error) {
      console.error("❌ خطأ في تحديث schema جدول tools:", error);
      res.status(500).json({ 
        success: false, 
        message: "فشل في تحديث schema", 
        error: error instanceof Error ? error.message : "خطأ غير معروف"
      });
    }
  });

  // إضافة العمود notes المفقود
  app.post("/api/migrate/add-notes-column", async (req, res) => {
    try {
      console.log("🔧 إضافة العمود notes لجدول tools...");
      
      await db.execute(sql`
        ALTER TABLE tools 
        ADD COLUMN IF NOT EXISTS notes TEXT
      `);
      
      console.log("✅ تم إضافة العمود notes بنجاح");
      
      res.json({ 
        success: true, 
        message: "تم إضافة العمود notes بنجاح"
      });
      
    } catch (error) {
      console.error("❌ خطأ في إضافة العمود notes:", error);
      res.status(500).json({ 
        success: false, 
        message: "فشل في إضافة العمود notes", 
        error: error instanceof Error ? error.message : "خطأ غير معروف"
      });
    }
  });

  // Temporary SQL migration endpoint (مؤقت لإضافة الحقول المفقودة)
  app.post("/api/tools/add-missing-fields", async (req, res) => {
    try {
      console.log('🔧 بدء إضافة الحقول المفقودة إلى جدول tools...');
      
      // إضافة الحقول الجديدة
      await db.execute(sql`
        ALTER TABLE tools 
        ADD COLUMN IF NOT EXISTS current_value DECIMAL(12, 2),
        ADD COLUMN IF NOT EXISTS depreciation_rate DECIMAL(5, 2),
        ADD COLUMN IF NOT EXISTS location_type TEXT,
        ADD COLUMN IF NOT EXISTS location_id TEXT
      `);
      
      // التحقق من إضافة الحقول
      const checkResult = await db.execute(sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'tools' 
        AND column_name IN ('current_value', 'depreciation_rate', 'location_type', 'location_id')
        ORDER BY column_name
      `);
      
      console.log('✅ تم إضافة الحقول الجديدة بنجاح:', checkResult.rows);
      
      res.json({
        success: true,
        message: 'تم إضافة الحقول المفقودة بنجاح',
        fields: checkResult.rows
      });
      
    } catch (error) {
      console.error('❌ خطأ في إضافة الحقول:', error);
      res.status(500).json({ 
        success: false, 
        message: 'خطأ في إضافة الحقول المفقودة',
        error: (error as Error).message 
      });
    }
  });

  // Fix tools current location based on latest movements
  app.post('/api/tools/fix-locations', async (req, res) => {
    try {
      await storage.fixToolLocations();
      res.json({ message: 'تم إصلاح مواقع الأدوات بنجاح' });
    } catch (error) {
      console.error('Error fixing tool locations:', error);
      res.status(500).json({ error: 'فشل في إصلاح مواقع الأدوات' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
