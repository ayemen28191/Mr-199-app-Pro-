import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProjectSchema, insertWorkerSchema, insertFundTransferSchema, 
  insertWorkerAttendanceSchema, insertMaterialSchema, insertMaterialPurchaseSchema,
  insertTransportationExpenseSchema, insertDailyExpenseSummarySchema, insertWorkerTransferSchema,
  insertWorkerBalanceSchema, insertAutocompleteDataSchema, insertWorkerTypeSchema,
  insertWorkerMiscExpenseSchema, insertUserSchema, insertSupplierSchema, insertSupplierPaymentSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
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

  // Get projects with statistics
  app.get("/api/projects/with-stats", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      const projectsWithStats = await Promise.all(
        projects.map(async (project) => {
          const stats = await storage.getProjectStatistics(project.id);
          return {
            ...project,
            stats
          };
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

  // Fund Transfers
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
      const result = insertFundTransferSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid fund transfer data", errors: result.error.issues });
      }
      
      // محاولة إنشاء التحويل مباشرة - إذا كان هناك تكرار ستعطي قاعدة البيانات خطأ
      try {
        const transfer = await storage.createFundTransfer(result.data);
        res.status(201).json(transfer);
      } catch (dbError: any) {
        // فحص إذا كان الخطأ بسبب تكرار رقم الحوالة
        if (dbError.code === '23505' && (dbError.constraint === 'fund_transfers_transfer_number_key' || dbError.constraint === 'fund_transfers_transfer_number_unique')) {
          return res.status(400).json({ message: "يوجد تحويل بنفس رقم الحوالة مسبقاً" });
        }
        throw dbError; // إعادة رفع الخطأ إذا لم يكن تكرار
      }
    } catch (error) {
      console.error("Error creating fund transfer:", error);
      res.status(500).json({ message: "Error creating fund transfer" });
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
      // التحقق من البيانات المطلوبة
      const { materialName, materialCategory, materialUnit, ...purchaseData } = req.body;
      
      if (!materialName || !materialUnit) {
        return res.status(400).json({ message: "اسم المادة ووحدة القياس مطلوبان" });
      }
      
      if (!purchaseData.quantity || !purchaseData.unitPrice) {
        return res.status(400).json({ message: "الكمية وسعر الوحدة مطلوبان" });
      }
      
      if (!purchaseData.projectId) {
        return res.status(400).json({ message: "يجب اختيار مشروع" });
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
      
      // Now create the purchase with the material ID
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
      
      const purchase = await storage.createMaterialPurchase(result.data);
      
      // تحديث الملخص اليومي في الخلفية لتحسين الأداء
      setImmediate(() => {
        storage.updateDailySummaryForDate(purchase.projectId, purchase.purchaseDate)
          .catch(error => console.error("Error updating daily summary:", error));
      });
      
      res.status(201).json(purchase);
    } catch (error: any) {
      console.error("Error creating material purchase:", error);
      
      // التحقق من نوع الخطأ وإرجاع رسالة مناسبة
      if (error.code === '23505') {
        return res.status(400).json({ message: "يوجد مشترى مكرر بنفس البيانات" });
      }
      
      if (error.code === '23503') {
        return res.status(400).json({ message: "المشروع المحدد غير موجود" });
      }
      
      res.status(500).json({ message: "حدث خطأ أثناء حفظ شراء المواد" });
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

  app.get("/api/material-purchases/:id", async (req, res) => {
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
      
      const [
        fundTransfers,
        workerAttendance,
        materialPurchases, 
        transportationExpenses,
        workerTransfers,
        dailySummary
      ] = await Promise.all([
        storage.getFundTransfers(projectId, date),
        storage.getWorkerAttendance(projectId, date),
        storage.getMaterialPurchases(projectId, date, date),
        storage.getTransportationExpenses(projectId, date),
        storage.getFilteredWorkerTransfers(projectId, date),
        storage.getDailyExpenseSummary(projectId, date)
      ]);

      console.log(`📊 Data found for ${date}:`);
      console.log(`  - Fund transfers: ${fundTransfers.length}`);
      console.log(`  - Worker attendance: ${workerAttendance.length}`);
      console.log(`  - Material purchases: ${materialPurchases.length}`);
      console.log(`  - Transportation expenses: ${transportationExpenses.length}`);
      console.log(`  - Worker transfers: ${workerTransfers.length}`);

      // حساب الرصيد المرحل (من اليوم السابق)
      const prevDate = new Date(date);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateString = prevDate.toISOString().split('T')[0];
      const prevDailySummary = await storage.getDailyExpenseSummary(projectId, prevDateString);
      const carriedForward = prevDailySummary?.remainingBalance || 0;

      // حساب الإجماليات
      const totalFundTransfers = fundTransfers.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalWorkerCosts = workerAttendance.reduce((sum, a) => sum + parseFloat(a.paidAmount), 0);
      const totalMaterialCosts = materialPurchases.reduce((sum, p) => sum + parseFloat(p.totalAmount), 0);
      const totalTransportCosts = transportationExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const totalTransferCosts = workerTransfers.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
      const totalExpenses = totalWorkerCosts + totalMaterialCosts + totalTransportCosts + totalTransferCosts;
      const totalIncome = totalFundTransfers;
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

      res.json({
        date,
        projectId,
        fundTransfers,
        workerAttendance: workerAttendanceWithWorkers,
        materialPurchases: materialPurchasesWithMaterials,
        transportationExpenses: transportationExpensesWithWorkers,
        workerTransfers: workerTransfersWithWorkers,
        dailySummary,
        summary: {
          carriedForward,
          totalFundTransfers,
          totalWorkerCosts,
          totalMaterialCosts,
          totalTransportCosts,
          totalTransferCosts,
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
      const totalMaterialCosts = totalMaterialPurchases.reduce((sum, p) => sum + parseFloat(p.totalAmount), 0);
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
      const { projectId, dateFrom, dateTo } = req.query;
      const statement = await storage.getWorkerAccountStatement(
        req.params.workerId,
        projectId as string,
        dateFrom as string,
        dateTo as string
      );
      res.json(statement);
    } catch (error) {
      res.status(500).json({ message: "Error fetching worker account statement" });
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
      const validationResult = insertWorkerTransferSchema.safeParse(req.body);
      if (!validationResult.success) {
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

  const httpServer = createServer(app);
  return httpServer;
}
