import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProjectSchema, insertWorkerSchema, insertFundTransferSchema, 
  insertWorkerAttendanceSchema, insertMaterialSchema, insertMaterialPurchaseSchema,
  insertTransportationExpenseSchema, insertDailyExpenseSummarySchema, insertWorkerTransferSchema,
  insertWorkerBalanceSchema
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
        if (dbError.code === '23505' && dbError.constraint === 'fund_transfers_transfer_number_key') {
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
      const result = insertWorkerAttendanceSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid attendance data", errors: result.error.issues });
      }
      
      const attendance = await storage.createWorkerAttendance(result.data);
      res.status(201).json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Error creating worker attendance" });
    }
  });

  app.delete("/api/worker-attendance/:id", async (req, res) => {
    try {
      await storage.deleteWorkerAttendance(req.params.id);
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
      // Extract material info from request body to create material first
      const { materialName, materialCategory, materialUnit, ...purchaseData } = req.body;
      
      // Create or find the material first
      let material = await storage.findMaterialByNameAndUnit(materialName, materialUnit);
      if (!material) {
        material = await storage.createMaterial({
          name: materialName,
          category: materialCategory || "عام",
          unit: materialUnit
        });
      }
      
      // Now create the purchase with the material ID
      const purchaseDataWithMaterialId = {
        ...purchaseData,
        materialId: material.id
      };
      
      const result = insertMaterialPurchaseSchema.safeParse(purchaseDataWithMaterialId);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid material purchase data", errors: result.error.issues });
      }
      
      const purchase = await storage.createMaterialPurchase(result.data);
      
      // Update daily expense summary with material cost using purchase date
      const purchaseDate = purchase.purchaseDate;
      const existingSummary = await storage.getDailyExpenseSummary(purchase.projectId, purchaseDate);
      
      const currentMaterialCosts = parseFloat(existingSummary?.totalMaterialCosts || '0');
      const newMaterialCosts = currentMaterialCosts + parseFloat(purchase.totalAmount);
      
      const totalExpenses = newMaterialCosts + 
        parseFloat(existingSummary?.totalWorkerWages || '0') + 
        parseFloat(existingSummary?.totalTransportationCosts || '0');
      const totalIncome = parseFloat(existingSummary?.totalFundTransfers || '0') + 
        parseFloat(existingSummary?.carriedForwardAmount || '0');
      const remainingBalance = totalIncome - totalExpenses;

      await storage.createOrUpdateDailyExpenseSummary({
        projectId: purchase.projectId,
        date: purchaseDate,
        totalIncome: totalIncome.toString(),
        totalExpenses: totalExpenses.toString(),
        remainingBalance: remainingBalance.toString(),
        totalMaterialCosts: newMaterialCosts.toString(),
        carriedForwardAmount: existingSummary?.carriedForwardAmount || '0',
        totalFundTransfers: existingSummary?.totalFundTransfers || '0',
        totalWorkerWages: existingSummary?.totalWorkerWages || '0',
        totalTransportationCosts: existingSummary?.totalTransportationCosts || '0'
      });
      
      res.status(201).json(purchase);
    } catch (error) {
      console.error("Error creating material purchase:", error);
      res.status(500).json({ message: "Error creating material purchase" });
    }
  });

  app.put("/api/material-purchases/:id", async (req, res) => {
    try {
      // Extract material info from request body to update material if needed
      const { materialName, materialCategory, materialUnit, ...purchaseData } = req.body;
      
      // Create or find the material first (if material details changed)
      let material = await storage.findMaterialByNameAndUnit(materialName, materialUnit);
      if (!material) {
        material = await storage.createMaterial({
          name: materialName,
          category: materialCategory || "عام",
          unit: materialUnit
        });
      }
      
      // Update the purchase with the material ID
      const purchaseDataWithMaterialId = {
        ...purchaseData,
        materialId: material.id
      };
      
      const result = insertMaterialPurchaseSchema.safeParse(purchaseDataWithMaterialId);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid material purchase data", errors: result.error.issues });
      }
      
      const purchase = await storage.updateMaterialPurchase(req.params.id, result.data);
      if (!purchase) {
        return res.status(404).json({ message: "Material purchase not found" });
      }
      
      res.json(purchase);
    } catch (error) {
      console.error("Error updating material purchase:", error);
      res.status(500).json({ message: "Error updating material purchase" });
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

      res.json({
        date,
        projectId,
        fundTransfers,
        workerAttendance,
        materialPurchases,
        transportationExpenses,
        workerTransfers,
        dailySummary
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
      
      // Update worker balance after transfer
      const currentBalance = await storage.getWorkerBalance(transfer.workerId, transfer.projectId);
      if (currentBalance) {
        const newTotalTransferred = parseFloat(currentBalance.totalTransferred) + parseFloat(transfer.amount);
        const newCurrentBalance = parseFloat(currentBalance.currentBalance) - parseFloat(transfer.amount);
        
        await storage.updateWorkerBalance(transfer.workerId, transfer.projectId, {
          totalTransferred: newTotalTransferred.toString(),
          currentBalance: newCurrentBalance.toString(),
        });
      }
      
      res.status(201).json(transfer);
    } catch (error) {
      console.error("Error creating worker transfer:", error);
      res.status(500).json({ message: "Failed to create worker transfer" });
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

  const httpServer = createServer(app);
  return httpServer;
}
