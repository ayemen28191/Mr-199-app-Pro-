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
      
      const project = await storage.createProject(result.data);
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ message: "Error creating project" });
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
      
      const worker = await storage.createWorker(result.data);
      res.status(201).json(worker);
    } catch (error) {
      res.status(500).json({ message: "Error creating worker" });
    }
  });

  // Fund Transfers
  app.get("/api/projects/:projectId/fund-transfers", async (req, res) => {
    try {
      const transfers = await storage.getFundTransfers(req.params.projectId);
      res.json(transfers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching fund transfers" });
    }
  });

  app.post("/api/fund-transfers", async (req, res) => {
    try {
      const result = insertFundTransferSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid fund transfer data", errors: result.error.issues });
      }
      
      const transfer = await storage.createFundTransfer(result.data);
      res.status(201).json(transfer);
    } catch (error) {
      res.status(500).json({ message: "Error creating fund transfer" });
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
      
      // Update daily expense summary with material cost
      const today = new Date().toISOString().split('T')[0];
      const existingSummary = await storage.getDailyExpenseSummary(purchase.projectId, today);
      
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
        date: today,
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

  const httpServer = createServer(app);
  return httpServer;
}
