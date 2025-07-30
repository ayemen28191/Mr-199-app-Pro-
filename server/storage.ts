import { 
  type Project, type Worker, type FundTransfer, type WorkerAttendance, 
  type Material, type MaterialPurchase, type TransportationExpense, type DailyExpenseSummary,
  type WorkerTransfer, type WorkerBalance,
  type InsertProject, type InsertWorker, type InsertFundTransfer, type InsertWorkerAttendance,
  type InsertMaterial, type InsertMaterialPurchase, type InsertTransportationExpense, type InsertDailyExpenseSummary,
  type InsertWorkerTransfer, type InsertWorkerBalance,
  projects, workers, fundTransfers, workerAttendance, materials, materialPurchases, transportationExpenses, dailyExpenseSummaries,
  workerTransfers, workerBalances
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  getProjectByName(name: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  
  // Workers
  getWorkers(): Promise<Worker[]>;
  getWorker(id: string): Promise<Worker | undefined>;
  getWorkerByName(name: string): Promise<Worker | undefined>;
  createWorker(worker: InsertWorker): Promise<Worker>;
  updateWorker(id: string, worker: Partial<InsertWorker>): Promise<Worker | undefined>;
  
  // Fund Transfers
  getFundTransfers(projectId: string, date?: string): Promise<FundTransfer[]>;
  getFundTransferByNumber(transferNumber: string): Promise<FundTransfer | undefined>;
  createFundTransfer(transfer: InsertFundTransfer): Promise<FundTransfer>;
  updateFundTransfer(id: string, transfer: Partial<InsertFundTransfer>): Promise<FundTransfer | undefined>;
  deleteFundTransfer(id: string): Promise<void>;
  
  // Worker Attendance
  getWorkerAttendance(projectId: string, date?: string): Promise<WorkerAttendance[]>;
  createWorkerAttendance(attendance: InsertWorkerAttendance): Promise<WorkerAttendance>;
  updateWorkerAttendance(id: string, attendance: Partial<InsertWorkerAttendance>): Promise<WorkerAttendance | undefined>;
  deleteWorkerAttendance(id: string): Promise<void>;
  
  // Materials
  getMaterials(): Promise<Material[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  findMaterialByNameAndUnit(name: string, unit: string): Promise<Material | undefined>;
  
  // Material Purchases
  getMaterialPurchases(projectId: string, dateFrom?: string, dateTo?: string): Promise<MaterialPurchase[]>;
  createMaterialPurchase(purchase: InsertMaterialPurchase): Promise<MaterialPurchase>;
  updateMaterialPurchase(id: string, purchase: Partial<InsertMaterialPurchase>): Promise<MaterialPurchase | undefined>;
  deleteMaterialPurchase(id: string): Promise<void>;
  
  // Transportation Expenses
  getTransportationExpenses(projectId: string, date?: string): Promise<TransportationExpense[]>;
  createTransportationExpense(expense: InsertTransportationExpense): Promise<TransportationExpense>;
  updateTransportationExpense(id: string, expense: Partial<InsertTransportationExpense>): Promise<TransportationExpense | undefined>;
  deleteTransportationExpense(id: string): Promise<void>;
  
  // Daily Expense Summaries
  getDailyExpenseSummary(projectId: string, date: string): Promise<DailyExpenseSummary | undefined>;
  createOrUpdateDailyExpenseSummary(summary: InsertDailyExpenseSummary): Promise<DailyExpenseSummary>;
  getPreviousDayBalance(projectId: string, currentDate: string): Promise<string>;
  
  // Worker Balance Management
  getWorkerBalance(workerId: string, projectId: string): Promise<WorkerBalance | undefined>;
  updateWorkerBalance(workerId: string, projectId: string, balance: Partial<InsertWorkerBalance>): Promise<WorkerBalance>;
  
  // Worker Transfers
  getWorkerTransfers(workerId: string, projectId?: string): Promise<WorkerTransfer[]>;
  createWorkerTransfer(transfer: InsertWorkerTransfer): Promise<WorkerTransfer>;
  getAllWorkerTransfers(): Promise<WorkerTransfer[]>;
  getFilteredWorkerTransfers(projectId?: string, date?: string): Promise<WorkerTransfer[]>;
  
  // Reports
  getWorkerAccountStatement(workerId: string, projectId?: string, dateFrom?: string, dateTo?: string): Promise<WorkerAttendance[]>;
  
  // Multi-project worker management
  getWorkersWithMultipleProjects(): Promise<{worker: Worker, projects: Project[], totalBalance: string}[]>;
  getWorkerMultiProjectStatement(workerId: string, dateFrom?: string, dateTo?: string): Promise<{
    worker: Worker;
    projects: {
      project: Project;
      attendance: WorkerAttendance[];
      balance: WorkerBalance | null;
      transfers: WorkerTransfer[];
    }[];
    totals: {
      totalEarned: string;
      totalPaid: string;
      totalTransferred: string;
      totalBalance: string;
    };
  }>;
  getWorkerProjects(workerId: string): Promise<Project[]>;
}

export class MemStorage implements IStorage {
  private projects: Map<string, Project> = new Map();
  private workers: Map<string, Worker> = new Map();
  private fundTransfers: Map<string, FundTransfer> = new Map();
  private workerAttendance: Map<string, WorkerAttendance> = new Map();
  private materials: Map<string, Material> = new Map();
  private materialPurchases: Map<string, MaterialPurchase> = new Map();
  private transportationExpenses: Map<string, TransportationExpense> = new Map();
  private dailyExpenseSummaries: Map<string, DailyExpenseSummary> = new Map();
  private workerTransfers: Map<string, WorkerTransfer> = new Map();
  private workerBalances: Map<string, WorkerBalance> = new Map();

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize some basic materials
    const basicMaterials: Material[] = [
      { id: randomUUID(), name: "حديد تسليح", category: "حديد", unit: "طن", createdAt: new Date() },
      { id: randomUUID(), name: "أسمنت", category: "أسمنت", unit: "كيس", createdAt: new Date() },
      { id: randomUUID(), name: "رمل", category: "رمل", unit: "متر مكعب", createdAt: new Date() },
      { id: randomUUID(), name: "زلط", category: "زلط", unit: "متر مكعب", createdAt: new Date() },
      { id: randomUUID(), name: "خشب", category: "خشب", unit: "متر", createdAt: new Date() },
      { id: randomUUID(), name: "بلاط", category: "بلاط", unit: "متر مربع", createdAt: new Date() },
    ];

    basicMaterials.forEach(material => {
      this.materials.set(material.id, material);
    });
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectByName(name: string): Promise<Project | undefined> {
    return Array.from(this.projects.values()).find(project => project.name === name);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const id = randomUUID();
    const newProject: Project = { 
      ...project, 
      id, 
      createdAt: new Date(),
      status: project.status || 'active'
    };
    this.projects.set(id, newProject);
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const existing = this.projects.get(id);
    if (!existing) return undefined;
    
    const updated: Project = { ...existing, ...project };
    this.projects.set(id, updated);
    return updated;
  }

  // Workers
  async getWorkers(): Promise<Worker[]> {
    return Array.from(this.workers.values());
  }

  async getWorker(id: string): Promise<Worker | undefined> {
    return this.workers.get(id);
  }

  async getWorkerByName(name: string): Promise<Worker | undefined> {
    return Array.from(this.workers.values()).find(worker => worker.name === name);
  }

  async createWorker(worker: InsertWorker): Promise<Worker> {
    const id = randomUUID();
    const newWorker: Worker = { 
      ...worker, 
      id, 
      createdAt: new Date(),
      isActive: worker.isActive !== false
    };
    this.workers.set(id, newWorker);
    return newWorker;
  }

  async updateWorker(id: string, worker: Partial<InsertWorker>): Promise<Worker | undefined> {
    const existing = this.workers.get(id);
    if (!existing) return undefined;
    
    const updated: Worker = { ...existing, ...worker };
    this.workers.set(id, updated);
    return updated;
  }

  // Fund Transfers
  async getFundTransfers(projectId: string, date?: string): Promise<FundTransfer[]> {
    return Array.from(this.fundTransfers.values()).filter(transfer => {
      if (transfer.projectId !== projectId) return false;
      if (date && transfer.transferDate.toISOString().split('T')[0] !== date) return false;
      return true;
    });
  }

  async getFundTransferByNumber(transferNumber: string): Promise<FundTransfer | undefined> {
    return Array.from(this.fundTransfers.values()).find(transfer => transfer.transferNumber === transferNumber);
  }

  async createFundTransfer(transfer: InsertFundTransfer): Promise<FundTransfer> {
    const id = randomUUID();
    const newTransfer: FundTransfer = { 
      ...transfer, 
      id, 
      createdAt: new Date(),
      senderName: transfer.senderName || null,
      transferNumber: transfer.transferNumber || null,
      notes: transfer.notes || null
    };
    this.fundTransfers.set(id, newTransfer);
    return newTransfer;
  }

  async updateFundTransfer(id: string, transfer: Partial<InsertFundTransfer>): Promise<FundTransfer | undefined> {
    const existing = this.fundTransfers.get(id);
    if (!existing) return undefined;
    
    const updated: FundTransfer = { ...existing, ...transfer };
    this.fundTransfers.set(id, updated);
    return updated;
  }

  async deleteFundTransfer(id: string): Promise<void> {
    this.fundTransfers.delete(id);
  }

  // Worker Attendance
  async getWorkerAttendance(projectId: string, date?: string): Promise<WorkerAttendance[]> {
    return Array.from(this.workerAttendance.values()).filter(
      attendance => attendance.projectId === projectId && (!date || attendance.date === date)
    );
  }

  async createWorkerAttendance(attendance: InsertWorkerAttendance): Promise<WorkerAttendance> {
    const id = randomUUID();
    const newAttendance: WorkerAttendance = { 
      ...attendance, 
      id, 
      createdAt: new Date(),
      startTime: attendance.startTime || null,
      endTime: attendance.endTime || null,
      workDescription: attendance.workDescription || null,
      paidAmount: attendance.paidAmount || '0',
      remainingAmount: attendance.remainingAmount || '0',
      paymentType: attendance.paymentType || 'partial'
    };
    this.workerAttendance.set(id, newAttendance);
    return newAttendance;
  }

  async updateWorkerAttendance(id: string, attendance: Partial<InsertWorkerAttendance>): Promise<WorkerAttendance | undefined> {
    const existing = this.workerAttendance.get(id);
    if (!existing) return undefined;
    
    const updated: WorkerAttendance = { ...existing, ...attendance };
    this.workerAttendance.set(id, updated);
    return updated;
  }

  async deleteWorkerAttendance(id: string): Promise<void> {
    this.workerAttendance.delete(id);
  }

  // Materials
  async getMaterials(): Promise<Material[]> {
    return Array.from(this.materials.values());
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const id = randomUUID();
    const newMaterial: Material = { ...material, id, createdAt: new Date() };
    this.materials.set(id, newMaterial);
    return newMaterial;
  }

  async findMaterialByNameAndUnit(name: string, unit: string): Promise<Material | undefined> {
    return Array.from(this.materials.values()).find(
      material => material.name === name && material.unit === unit
    );
  }

  // Material Purchases
  async getMaterialPurchases(projectId: string, dateFrom?: string, dateTo?: string): Promise<MaterialPurchase[]> {
    return Array.from(this.materialPurchases.values()).filter(
      purchase => {
        if (purchase.projectId !== projectId) return false;
        if (dateFrom && purchase.purchaseDate < dateFrom) return false;
        if (dateTo && purchase.purchaseDate > dateTo) return false;
        return true;
      }
    );
  }

  async createMaterialPurchase(purchase: InsertMaterialPurchase): Promise<MaterialPurchase> {
    const id = randomUUID();
    const newPurchase: MaterialPurchase = { 
      ...purchase, 
      id, 
      createdAt: new Date(),
      notes: purchase.notes || null,
      supplierName: purchase.supplierName || null,
      invoiceNumber: purchase.invoiceNumber || null,
      invoiceDate: purchase.invoiceDate || null,
      invoicePhoto: purchase.invoicePhoto || null
    };
    this.materialPurchases.set(id, newPurchase);
    return newPurchase;
  }

  async updateMaterialPurchase(id: string, purchase: Partial<InsertMaterialPurchase>): Promise<MaterialPurchase | undefined> {
    const existing = this.materialPurchases.get(id);
    if (!existing) return undefined;
    
    const updated: MaterialPurchase = { ...existing, ...purchase };
    this.materialPurchases.set(id, updated);
    return updated;
  }

  async deleteMaterialPurchase(id: string): Promise<void> {
    this.materialPurchases.delete(id);
  }

  // Transportation Expenses
  async getTransportationExpenses(projectId: string, date?: string): Promise<TransportationExpense[]> {
    return Array.from(this.transportationExpenses.values()).filter(
      expense => expense.projectId === projectId && (!date || expense.date === date)
    );
  }

  async createTransportationExpense(expense: InsertTransportationExpense): Promise<TransportationExpense> {
    const id = randomUUID();
    const newExpense: TransportationExpense = { 
      ...expense, 
      id, 
      createdAt: new Date(),
      notes: expense.notes || null,
      workerId: expense.workerId || null
    };
    this.transportationExpenses.set(id, newExpense);
    return newExpense;
  }

  async updateTransportationExpense(id: string, expense: Partial<InsertTransportationExpense>): Promise<TransportationExpense | undefined> {
    const existing = this.transportationExpenses.get(id);
    if (!existing) return undefined;
    
    const updated: TransportationExpense = { ...existing, ...expense };
    this.transportationExpenses.set(id, updated);
    return updated;
  }

  async deleteTransportationExpense(id: string): Promise<void> {
    this.transportationExpenses.delete(id);
  }

  // Daily Expense Summaries
  async getDailyExpenseSummary(projectId: string, date: string): Promise<DailyExpenseSummary | undefined> {
    return Array.from(this.dailyExpenseSummaries.values()).find(
      summary => summary.projectId === projectId && summary.date === date
    );
  }

  async createOrUpdateDailyExpenseSummary(summary: InsertDailyExpenseSummary): Promise<DailyExpenseSummary> {
    const existing = await this.getDailyExpenseSummary(summary.projectId, summary.date);
    
    if (existing) {
      const updated: DailyExpenseSummary = { ...existing, ...summary };
      this.dailyExpenseSummaries.set(existing.id, updated);
      return updated;
    } else {
      const id = randomUUID();
      const newSummary: DailyExpenseSummary = { 
        ...summary, 
        id, 
        createdAt: new Date(),
        carriedForwardAmount: summary.carriedForwardAmount || '0',
        totalFundTransfers: summary.totalFundTransfers || '0',
        totalWorkerWages: summary.totalWorkerWages || '0',
        totalMaterialCosts: summary.totalMaterialCosts || '0',
        totalTransportationCosts: summary.totalTransportationCosts || '0'
      };
      this.dailyExpenseSummaries.set(id, newSummary);
      return newSummary;
    }
  }

  // Worker Balance Management
  async getWorkerBalance(workerId: string, projectId: string): Promise<WorkerBalance | undefined> {
    return Array.from(this.workerBalances.values()).find(
      balance => balance.workerId === workerId && balance.projectId === projectId
    );
  }

  async updateWorkerBalance(workerId: string, projectId: string, balance: Partial<InsertWorkerBalance>): Promise<WorkerBalance> {
    const existing = await this.getWorkerBalance(workerId, projectId);
    
    if (existing) {
      const updated: WorkerBalance = { 
        ...existing, 
        ...balance, 
        lastUpdated: new Date() 
      };
      this.workerBalances.set(existing.id, updated);
      return updated;
    } else {
      const id = randomUUID();
      const newBalance: WorkerBalance = {
        id,
        workerId,
        projectId,
        totalEarned: '0',
        totalPaid: '0',
        totalTransferred: '0',
        currentBalance: '0',
        ...balance,
        lastUpdated: new Date(),
        createdAt: new Date()
      };
      this.workerBalances.set(id, newBalance);
      return newBalance;
    }
  }

  // Worker Transfers
  async getWorkerTransfers(workerId: string, projectId?: string): Promise<WorkerTransfer[]> {
    return Array.from(this.workerTransfers.values()).filter(
      transfer => {
        if (transfer.workerId !== workerId) return false;
        if (projectId && transfer.projectId !== projectId) return false;
        return true;
      }
    );
  }

  async createWorkerTransfer(transfer: InsertWorkerTransfer): Promise<WorkerTransfer> {
    const id = randomUUID();
    const newTransfer: WorkerTransfer = { 
      ...transfer, 
      id, 
      createdAt: new Date(),
      recipientPhone: transfer.recipientPhone || null,
      notes: transfer.notes || null
    };
    this.workerTransfers.set(id, newTransfer);
    return newTransfer;
  }

  // Reports
  async getWorkerAccountStatement(workerId: string, projectId?: string, dateFrom?: string, dateTo?: string): Promise<WorkerAttendance[]> {
    return Array.from(this.workerAttendance.values()).filter(
      attendance => {
        if (attendance.workerId !== workerId) return false;
        if (projectId && attendance.projectId !== projectId) return false;
        if (dateFrom && attendance.date < dateFrom) return false;
        if (dateTo && attendance.date > dateTo) return false;
        return true;
      }
    );
  }

  async getAllWorkerTransfers(): Promise<WorkerTransfer[]> {
    return Array.from(this.workerTransfers.values());
  }

  async getFilteredWorkerTransfers(projectId?: string, date?: string): Promise<WorkerTransfer[]> {
    return Array.from(this.workerTransfers.values()).filter(transfer => {
      if (projectId && transfer.projectId !== projectId) return false;
      if (date && transfer.transferDate !== date) return false;
      return true;
    });
  }

  async getPreviousDayBalance(projectId: string, currentDate: string): Promise<string> {
    // البحث عن آخر ملخص يومي قبل التاريخ الحالي
    const summaries = Array.from(this.dailyExpenseSummaries.values())
      .filter(summary => summary.projectId === projectId && summary.date < currentDate)
      .sort((a, b) => b.date.localeCompare(a.date));
    
    return summaries.length > 0 ? summaries[0].remainingBalance : "0";
  }

  // Multi-project worker management (simplified for MemStorage)
  async getWorkersWithMultipleProjects(): Promise<{worker: Worker, projects: Project[], totalBalance: string}[]> {
    const workerProjectMap = new Map<string, {worker: Worker, projects: Set<string>}>();
    
    // Find workers who worked on multiple projects
    const attendanceArray = Array.from(this.workerAttendance.values());
    for (const attendance of attendanceArray) {
      if (!workerProjectMap.has(attendance.workerId)) {
        const worker = this.workers.get(attendance.workerId);
        if (worker) {
          workerProjectMap.set(attendance.workerId, {
            worker,
            projects: new Set()
          });
        }
      }
      
      const data = workerProjectMap.get(attendance.workerId);
      if (data) {
        data.projects.add(attendance.projectId);
      }
    }

    const result = [];
    for (const [workerId, data] of Array.from(workerProjectMap.entries())) {
      if (data.projects.size > 1) {
        // Get project details
        const projects = Array.from(data.projects).map(id => this.projects.get(id)).filter(Boolean) as Project[];
        
        // Calculate total balance
        const balances = Array.from(this.workerBalances.values())
          .filter(balance => balance.workerId === workerId);
        const totalBalance = balances.reduce((sum, balance) => 
          sum + parseFloat(balance.currentBalance || '0'), 0
        );

        result.push({
          worker: data.worker,
          projects,
          totalBalance: totalBalance.toFixed(2)
        });
      }
    }

    return result;
  }

  async getWorkerMultiProjectStatement(workerId: string, dateFrom?: string, dateTo?: string): Promise<{
    worker: Worker;
    projects: {
      project: Project;
      attendance: WorkerAttendance[];
      balance: WorkerBalance | null;
      transfers: WorkerTransfer[];
    }[];
    totals: {
      totalEarned: string;
      totalPaid: string;
      totalTransferred: string;
      totalBalance: string;
    };
  }> {
    const worker = this.workers.get(workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    const workerProjects = await this.getWorkerProjects(workerId);
    const projectsData = [];
    let totalEarned = 0, totalPaid = 0, totalTransferred = 0, totalBalance = 0;

    for (const project of workerProjects) {
      // Get attendance for this project
      const attendance = Array.from(this.workerAttendance.values()).filter(a => {
        if (a.workerId !== workerId || a.projectId !== project.id) return false;
        if (dateFrom && a.date < dateFrom) return false;
        if (dateTo && a.date > dateTo) return false;
        return true;
      });

      // Get balance for this project
      const balance = Array.from(this.workerBalances.values())
        .find(b => b.workerId === workerId && b.projectId === project.id) || null;

      // Get transfers for this project
      const transfers = Array.from(this.workerTransfers.values())
        .filter(t => t.workerId === workerId && t.projectId === project.id);

      projectsData.push({
        project,
        attendance,
        balance,
        transfers
      });

      // Calculate totals
      if (balance) {
        totalEarned += parseFloat(balance.totalEarned || '0');
        totalPaid += parseFloat(balance.totalPaid || '0');
        totalTransferred += parseFloat(balance.totalTransferred || '0');
        totalBalance += parseFloat(balance.currentBalance || '0');
      }
    }

    return {
      worker,
      projects: projectsData,
      totals: {
        totalEarned: totalEarned.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        totalTransferred: totalTransferred.toFixed(2),
        totalBalance: totalBalance.toFixed(2)
      }
    };
  }

  async getWorkerProjects(workerId: string): Promise<Project[]> {
    const projectIds = new Set<string>();
    
    // Find all projects this worker has worked on
    const attendanceArray = Array.from(this.workerAttendance.values());
    for (const attendance of attendanceArray) {
      if (attendance.workerId === workerId) {
        projectIds.add(attendance.projectId);
      }
    }

    return Array.from(projectIds).map(id => this.projects.get(id)).filter(Boolean) as Project[];
  }
}

export class DatabaseStorage implements IStorage {
  async getProjects(): Promise<Project[]> {
    const result = await db.select().from(projects);
    return result;
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectByName(name: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.name, name));
    return project || undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values({
        ...project,
        status: project.status || 'active'
      })
      .returning();
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db
      .update(projects)
      .set(project)
      .where(eq(projects.id, id))
      .returning();
    return updated || undefined;
  }

  async getWorkers(): Promise<Worker[]> {
    const result = await db.select().from(workers);
    return result;
  }

  async getWorker(id: string): Promise<Worker | undefined> {
    const [worker] = await db.select().from(workers).where(eq(workers.id, id));
    return worker || undefined;
  }

  async getWorkerByName(name: string): Promise<Worker | undefined> {
    const [worker] = await db.select().from(workers).where(eq(workers.name, name));
    return worker || undefined;
  }

  async createWorker(worker: InsertWorker): Promise<Worker> {
    const [newWorker] = await db
      .insert(workers)
      .values({
        ...worker,
        isActive: worker.isActive !== false
      })
      .returning();
    return newWorker;
  }

  async updateWorker(id: string, worker: Partial<InsertWorker>): Promise<Worker | undefined> {
    const [updated] = await db
      .update(workers)
      .set(worker)
      .where(eq(workers.id, id))
      .returning();
    return updated || undefined;
  }

  async getFundTransfers(projectId: string, date?: string): Promise<FundTransfer[]> {
    try {
      if (date) {
        // جلب جميع العهد للمشروع
        const allTransfers = await db.select().from(fundTransfers)
          .where(eq(fundTransfers.projectId, projectId));
        
        // تصفية بالتاريخ في الكود 
        return allTransfers.filter(transfer => {
          const transferDateStr = transfer.transferDate.toISOString().split('T')[0];
          return transferDateStr === date;
        });
      } else {
        return await db.select().from(fundTransfers)
          .where(eq(fundTransfers.projectId, projectId));
      }
    } catch (error) {
      console.error("Error in getFundTransfers:", error);
      throw error;
    }
  }

  async getFundTransferByNumber(transferNumber: string): Promise<FundTransfer | undefined> {
    const [transfer] = await db.select().from(fundTransfers).where(eq(fundTransfers.transferNumber, transferNumber));
    return transfer || undefined;
  }

  async createFundTransfer(transfer: InsertFundTransfer): Promise<FundTransfer> {
    const [newTransfer] = await db
      .insert(fundTransfers)
      .values(transfer)
      .returning();
    
    // تحديث الملخص اليومي تلقائياً
    const transferDate = new Date(transfer.transferDate).toISOString().split('T')[0];
    await this.updateDailySummaryForDate(transfer.projectId, transferDate);
    
    return newTransfer;
  }

  async updateFundTransfer(id: string, transfer: Partial<InsertFundTransfer>): Promise<FundTransfer | undefined> {
    // الحصول على البيانات القديمة أولاً
    const [oldTransfer] = await db.select().from(fundTransfers).where(eq(fundTransfers.id, id));
    
    const [updated] = await db
      .update(fundTransfers)
      .set(transfer)
      .where(eq(fundTransfers.id, id))
      .returning();
    
    if (updated && oldTransfer) {
      // تحديث الملخص اليومي للتاريخ القديم والجديد
      const oldDate = new Date(oldTransfer.transferDate).toISOString().split('T')[0];
      await this.updateDailySummaryForDate(oldTransfer.projectId, oldDate);
      
      if (transfer.transferDate) {
        const newDate = new Date(transfer.transferDate).toISOString().split('T')[0];
        if (newDate !== oldDate) {
          await this.updateDailySummaryForDate(updated.projectId, newDate);
        }
      }
    }
    
    return updated || undefined;
  }

  async deleteFundTransfer(id: string): Promise<void> {
    // الحصول على البيانات قبل الحذف
    const [transfer] = await db.select().from(fundTransfers).where(eq(fundTransfers.id, id));
    
    await db.delete(fundTransfers).where(eq(fundTransfers.id, id));
    
    if (transfer) {
      // تحديث الملخص اليومي بعد الحذف
      const transferDate = new Date(transfer.transferDate).toISOString().split('T')[0];
      await this.updateDailySummaryForDate(transfer.projectId, transferDate);
    }
  }

  async getWorkerAttendance(projectId: string, date?: string): Promise<WorkerAttendance[]> {
    if (date) {
      const result = await db.select().from(workerAttendance)
        .where(and(eq(workerAttendance.projectId, projectId), eq(workerAttendance.date, date)));
      return result;
    } else {
      const result = await db.select().from(workerAttendance)
        .where(eq(workerAttendance.projectId, projectId));
      return result;
    }
  }

  async createWorkerAttendance(attendance: InsertWorkerAttendance): Promise<WorkerAttendance> {
    const [newAttendance] = await db
      .insert(workerAttendance)
      .values(attendance)
      .returning();
    
    // تحديث الملخص اليومي تلقائياً
    await this.updateDailySummaryForDate(attendance.projectId, attendance.date);
    
    return newAttendance;
  }

  async updateWorkerAttendance(id: string, attendance: Partial<InsertWorkerAttendance>): Promise<WorkerAttendance | undefined> {
    const [updated] = await db
      .update(workerAttendance)
      .set(attendance)
      .where(eq(workerAttendance.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteWorkerAttendance(id: string): Promise<void> {
    // الحصول على البيانات قبل الحذف
    const [attendance] = await db.select().from(workerAttendance).where(eq(workerAttendance.id, id));
    
    await db.delete(workerAttendance).where(eq(workerAttendance.id, id));
    
    if (attendance) {
      // تحديث الملخص اليومي بعد الحذف
      await this.updateDailySummaryForDate(attendance.projectId, attendance.date);
    }
  }

  async getMaterials(): Promise<Material[]> {
    const result = await db.select().from(materials);
    return result;
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const [newMaterial] = await db
      .insert(materials)
      .values(material)
      .returning();
    return newMaterial;
  }

  async findMaterialByNameAndUnit(name: string, unit: string): Promise<Material | undefined> {
    const [material] = await db.select().from(materials)
      .where(and(eq(materials.name, name), eq(materials.unit, unit)));
    return material || undefined;
  }

  async getMaterialPurchases(projectId: string, dateFrom?: string, dateTo?: string): Promise<MaterialPurchase[]> {
    try {
      let query = db
        .select({
          id: materialPurchases.id,
          projectId: materialPurchases.projectId,
          materialId: materialPurchases.materialId,
          quantity: materialPurchases.quantity,
          unitPrice: materialPurchases.unitPrice,
          totalAmount: materialPurchases.totalAmount,
          purchaseType: materialPurchases.purchaseType,
          supplierName: materialPurchases.supplierName,
          invoiceNumber: materialPurchases.invoiceNumber,
          invoiceDate: materialPurchases.invoiceDate,
          invoicePhoto: materialPurchases.invoicePhoto,
          notes: materialPurchases.notes,
          purchaseDate: materialPurchases.purchaseDate,
          createdAt: materialPurchases.createdAt,
          material: {
            id: materials.id,
            name: materials.name,
            category: materials.category,
            unit: materials.unit,
            createdAt: materials.createdAt
          }
        })
        .from(materialPurchases)
        .leftJoin(materials, eq(materialPurchases.materialId, materials.id))
        .where(eq(materialPurchases.projectId, projectId));

      if (dateFrom && dateTo) {
        query = db
          .select({
            id: materialPurchases.id,
            projectId: materialPurchases.projectId,
            materialId: materialPurchases.materialId,
            quantity: materialPurchases.quantity,
            unitPrice: materialPurchases.unitPrice,
            totalAmount: materialPurchases.totalAmount,
            purchaseType: materialPurchases.purchaseType,
            supplierName: materialPurchases.supplierName,
            invoiceNumber: materialPurchases.invoiceNumber,
            invoiceDate: materialPurchases.invoiceDate,
            invoicePhoto: materialPurchases.invoicePhoto,
            notes: materialPurchases.notes,
            purchaseDate: materialPurchases.purchaseDate,
            createdAt: materialPurchases.createdAt,
            material: {
              id: materials.id,
              name: materials.name,
              category: materials.category,
              unit: materials.unit,
              createdAt: materials.createdAt
            }
          })
          .from(materialPurchases)
          .leftJoin(materials, eq(materialPurchases.materialId, materials.id))
          .where(
            and(
              eq(materialPurchases.projectId, projectId),
              eq(materialPurchases.purchaseDate, dateFrom)
            )
          );
      }

      const result = await query;
      console.log("getMaterialPurchases result:", result);
      return result || [];
    } catch (error) {
      console.error("Error in getMaterialPurchases:", error);
      return [];
    }
  }

  async createMaterialPurchase(purchase: InsertMaterialPurchase): Promise<MaterialPurchase> {
    const [newPurchase] = await db
      .insert(materialPurchases)
      .values(purchase)
      .returning();
    
    // تحديث الملخص اليومي تلقائياً
    await this.updateDailySummaryForDate(purchase.projectId, purchase.purchaseDate);
    
    return newPurchase;
  }

  async updateMaterialPurchase(id: string, purchase: Partial<InsertMaterialPurchase>): Promise<MaterialPurchase | undefined> {
    const [updated] = await db
      .update(materialPurchases)
      .set(purchase)
      .where(eq(materialPurchases.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteMaterialPurchase(id: string): Promise<void> {
    // الحصول على البيانات قبل الحذف
    const [purchase] = await db.select().from(materialPurchases).where(eq(materialPurchases.id, id));
    
    await db.delete(materialPurchases).where(eq(materialPurchases.id, id));
    
    if (purchase) {
      // تحديث الملخص اليومي بعد الحذف
      await this.updateDailySummaryForDate(purchase.projectId, purchase.purchaseDate);
    }
  }

  async getTransportationExpenses(projectId: string, date?: string): Promise<TransportationExpense[]> {
    if (date) {
      const result = await db.select().from(transportationExpenses)
        .where(and(eq(transportationExpenses.projectId, projectId), eq(transportationExpenses.date, date)));
      return result;
    } else {
      const result = await db.select().from(transportationExpenses)
        .where(eq(transportationExpenses.projectId, projectId));
      return result;
    }
  }

  async createTransportationExpense(expense: InsertTransportationExpense): Promise<TransportationExpense> {
    const [newExpense] = await db
      .insert(transportationExpenses)
      .values(expense)
      .returning();
    
    // تحديث الملخص اليومي تلقائياً
    await this.updateDailySummaryForDate(expense.projectId, expense.date);
    
    return newExpense;
  }

  async updateTransportationExpense(id: string, expense: Partial<InsertTransportationExpense>): Promise<TransportationExpense | undefined> {
    const [updated] = await db
      .update(transportationExpenses)
      .set(expense)
      .where(eq(transportationExpenses.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTransportationExpense(id: string): Promise<void> {
    // الحصول على البيانات قبل الحذف
    const [expense] = await db.select().from(transportationExpenses).where(eq(transportationExpenses.id, id));
    
    await db.delete(transportationExpenses).where(eq(transportationExpenses.id, id));
    
    if (expense) {
      // تحديث الملخص اليومي بعد الحذف
      await this.updateDailySummaryForDate(expense.projectId, expense.date);
    }
  }

  async getDailyExpenseSummary(projectId: string, date: string): Promise<DailyExpenseSummary | undefined> {
    const [summary] = await db.select().from(dailyExpenseSummaries)
      .where(and(eq(dailyExpenseSummaries.projectId, projectId), eq(dailyExpenseSummaries.date, date)));
    return summary || undefined;
  }

  async createOrUpdateDailyExpenseSummary(summary: InsertDailyExpenseSummary): Promise<DailyExpenseSummary> {
    const existing = await this.getDailyExpenseSummary(summary.projectId, summary.date);
    
    if (existing) {
      const [updated] = await db
        .update(dailyExpenseSummaries)
        .set(summary)
        .where(eq(dailyExpenseSummaries.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newSummary] = await db
        .insert(dailyExpenseSummaries)
        .values(summary)
        .returning();
      return newSummary;
    }
  }

  async getWorkerAccountStatement(workerId: string, projectId?: string, dateFrom?: string, dateTo?: string): Promise<WorkerAttendance[]> {
    if (projectId) {
      const result = await db.select().from(workerAttendance)
        .where(and(eq(workerAttendance.workerId, workerId), eq(workerAttendance.projectId, projectId)));
      return result;
    } else {
      const result = await db.select().from(workerAttendance)
        .where(eq(workerAttendance.workerId, workerId));
      return result;
    }
  }

  async getWorkerBalance(workerId: string, projectId: string): Promise<WorkerBalance | undefined> {
    try {
      // حساب الرصيد ديناميكياً من سجلات الحضور
      const attendanceRecords = await db.select().from(workerAttendance)
        .where(and(eq(workerAttendance.workerId, workerId), eq(workerAttendance.projectId, projectId)));
      
      // حساب إجمالي المكتسب والمدفوع
      let totalEarned = 0;
      let totalPaid = 0;
      
      attendanceRecords.forEach(record => {
        totalEarned += parseFloat(record.dailyWage || '0');
        totalPaid += parseFloat(record.paidAmount || '0');
      });
      
      // حساب إجمالي المحول للأهل
      const transferRecords = await db.select().from(workerTransfers)
        .where(and(eq(workerTransfers.workerId, workerId), eq(workerTransfers.projectId, projectId)));
      
      let totalTransferred = 0;
      transferRecords.forEach(transfer => {
        totalTransferred += parseFloat(transfer.amount || '0');
      });
      
      // حساب الرصيد الحالي
      const currentBalance = totalEarned - totalPaid - totalTransferred;
      
      // إنشاء كائن الرصيد
      const balance: WorkerBalance = {
        id: `${workerId}-${projectId}`,
        workerId,
        projectId,
        totalEarned: totalEarned.toString(),
        totalPaid: totalPaid.toString(),
        totalTransferred: totalTransferred.toString(),
        currentBalance: currentBalance.toString(),
        lastUpdated: new Date(),
        createdAt: new Date()
      };
      
      return balance;
    } catch (error) {
      console.error("Error calculating worker balance:", error);
      return undefined;
    }
  }

  async updateWorkerBalance(workerId: string, projectId: string, balance: Partial<InsertWorkerBalance>): Promise<WorkerBalance> {
    const existing = await this.getWorkerBalance(workerId, projectId);
    
    if (existing) {
      const [updated] = await db
        .update(workerBalances)
        .set({ ...balance, lastUpdated: new Date() })
        .where(eq(workerBalances.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newBalance] = await db
        .insert(workerBalances)
        .values({
          workerId,
          projectId,
          totalEarned: '0',
          totalPaid: '0',
          totalTransferred: '0',
          currentBalance: '0',
          ...balance
        })
        .returning();
      return newBalance;
    }
  }

  async getWorkerTransfers(workerId: string, projectId?: string): Promise<WorkerTransfer[]> {
    if (projectId) {
      const result = await db.select().from(workerTransfers)
        .where(and(eq(workerTransfers.workerId, workerId), eq(workerTransfers.projectId, projectId)));
      return result;
    } else {
      const result = await db.select().from(workerTransfers)
        .where(eq(workerTransfers.workerId, workerId));
      return result;
    }
  }

  async createWorkerTransfer(transfer: InsertWorkerTransfer): Promise<WorkerTransfer> {
    const [newTransfer] = await db
      .insert(workerTransfers)
      .values(transfer)
      .returning();
    return newTransfer;
  }

  async getAllWorkerTransfers(): Promise<WorkerTransfer[]> {
    return await db.select().from(workerTransfers);
  }

  async getFilteredWorkerTransfers(projectId?: string, date?: string): Promise<WorkerTransfer[]> {
    if (projectId && date) {
      return await db.select().from(workerTransfers)
        .where(and(eq(workerTransfers.projectId, projectId), eq(workerTransfers.transferDate, date)));
    } else if (projectId) {
      return await db.select().from(workerTransfers)
        .where(eq(workerTransfers.projectId, projectId));
    } else if (date) {
      return await db.select().from(workerTransfers)
        .where(eq(workerTransfers.transferDate, date));
    }
    
    return await db.select().from(workerTransfers);
  }

  async getPreviousDayBalance(projectId: string, currentDate: string): Promise<string> {
    // البحث عن آخر ملخص يومي قبل التاريخ الحالي
    const result = await db.select()
      .from(dailyExpenseSummaries)
      .where(and(
        eq(dailyExpenseSummaries.projectId, projectId),
        sql`${dailyExpenseSummaries.date} < ${currentDate}`
      ))
      .orderBy(sql`${dailyExpenseSummaries.date} DESC`)
      .limit(1);
    
    return result.length > 0 ? result[0].remainingBalance : "0";
  }

  // حفظ الملخص اليومي تلقائياً عند أي تغيير في المصروفات
  async updateDailySummaryForDate(projectId: string, date: string): Promise<void> {
    try {
      // جمع جميع البيانات لهذا التاريخ
      const fundTransfers = await this.getFundTransfers(projectId, date);
      const workerAttendance = await this.getWorkerAttendance(projectId, date);
      const materialPurchases = await this.getMaterialPurchases(projectId, date);
      const transportationExpenses = await this.getTransportationExpenses(projectId, date);
      const workerTransfers = await this.getFilteredWorkerTransfers(projectId, date);

      // حساب الإجماليات
      const totalFundTransfers = fundTransfers.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalWorkerWages = workerAttendance.reduce((sum, a) => sum + parseFloat(a.dailyWage || '0'), 0);
      const totalMaterialCosts = materialPurchases.reduce((sum, p) => sum + parseFloat(p.totalAmount), 0);
      const totalTransportationCosts = transportationExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const totalWorkerTransferCosts = workerTransfers.reduce((sum, t) => sum + parseFloat(t.amount), 0);

      // الحصول على الرصيد المرحل من اليوم السابق
      const carriedForwardAmount = parseFloat(await this.getPreviousDayBalance(projectId, date));

      // حساب الإجماليات النهائية
      const totalIncome = carriedForwardAmount + totalFundTransfers;
      const totalExpenses = totalWorkerWages + totalMaterialCosts + totalTransportationCosts + totalWorkerTransferCosts;
      const remainingBalance = totalIncome - totalExpenses;

      // حفظ أو تحديث الملخص اليومي
      await this.createOrUpdateDailyExpenseSummary({
        projectId,
        date,
        carriedForwardAmount: carriedForwardAmount.toString(),
        totalFundTransfers: totalFundTransfers.toString(),
        totalWorkerWages: totalWorkerWages.toString(),
        totalMaterialCosts: totalMaterialCosts.toString(),
        totalTransportationCosts: totalTransportationCosts.toString(),
        totalIncome: totalIncome.toString(),
        totalExpenses: totalExpenses.toString(),
        remainingBalance: remainingBalance.toString()
      });

    } catch (error) {
      console.error('Error updating daily summary:', error);
    }
  }

  // Multi-project worker management functions
  async getWorkersWithMultipleProjects(): Promise<{worker: Worker, projects: Project[], totalBalance: string}[]> {
    try {
      // Get workers who have attendance in more than one project
      const workersWithMultipleProjects = await db
        .select({
          workerId: workerAttendance.workerId,
          projectId: workerAttendance.projectId,
          worker: {
            id: workers.id,
            name: workers.name,
            type: workers.type,
            dailyWage: workers.dailyWage,
            isActive: workers.isActive,
            createdAt: workers.createdAt
          },
          project: {
            id: projects.id,
            name: projects.name,
            status: projects.status,
            createdAt: projects.createdAt
          }
        })
        .from(workerAttendance)
        .innerJoin(workers, eq(workerAttendance.workerId, workers.id))
        .innerJoin(projects, eq(workerAttendance.projectId, projects.id))
        .groupBy(workerAttendance.workerId, workerAttendance.projectId, workers.id, projects.id);

      // Group by worker to find those with multiple projects
      const workerProjectMap = new Map<string, {worker: Worker, projects: Project[]}>();
      
      for (const record of workersWithMultipleProjects) {
        const workerId = record.workerId;
        if (!workerProjectMap.has(workerId)) {
          workerProjectMap.set(workerId, {
            worker: record.worker as Worker,
            projects: []
          });
        }
        
        const existing = workerProjectMap.get(workerId)!;
        const projectExists = existing.projects.some(p => p.id === record.project.id);
        if (!projectExists) {
          existing.projects.push(record.project as Project);
        }
      }

      // Filter workers with more than one project and calculate total balance
      const result = [];
      for (const [workerId, data] of Array.from(workerProjectMap.entries())) {
        if (data.projects.length > 1) {
          // Calculate total balance across all projects
          const balances = await db
            .select()
            .from(workerBalances)
            .where(eq(workerBalances.workerId, workerId));
            
          const totalBalance = balances.reduce((sum, balance) => 
            sum + parseFloat(balance.currentBalance || '0'), 0
          );

          result.push({
            worker: data.worker,
            projects: data.projects,
            totalBalance: totalBalance.toFixed(2)
          });
        }
      }

      return result;
    } catch (error) {
      console.error('Error getting workers with multiple projects:', error);
      return [];
    }
  }

  async getWorkerMultiProjectStatement(workerId: string, dateFrom?: string, dateTo?: string): Promise<{
    worker: Worker;
    projects: {
      project: Project;
      attendance: WorkerAttendance[];
      balance: WorkerBalance | null;
      transfers: WorkerTransfer[];
    }[];
    totals: {
      totalEarned: string;
      totalPaid: string;
      totalTransferred: string;
      totalBalance: string;
    };
  }> {
    try {
      // Get worker info
      const [worker] = await db.select().from(workers).where(eq(workers.id, workerId));
      if (!worker) {
        throw new Error('Worker not found');
      }

      // Get all projects this worker has worked on
      const workerProjects = await this.getWorkerProjects(workerId);
      
      const projectsData = [];
      let totalEarned = 0, totalPaid = 0, totalTransferred = 0, totalBalance = 0;

      for (const project of workerProjects) {
        // Get attendance for this project
        let attendanceQuery = db
          .select()
          .from(workerAttendance)
          .where(and(
            eq(workerAttendance.workerId, workerId), 
            eq(workerAttendance.projectId, project.id)
          ));

        if (dateFrom && dateTo) {
          attendanceQuery = db
            .select()
            .from(workerAttendance)
            .where(
              and(
                eq(workerAttendance.workerId, workerId), 
                eq(workerAttendance.projectId, project.id),
                gte(workerAttendance.date, dateFrom),
                lte(workerAttendance.date, dateTo)
              )
            );
        }

        const attendance = await attendanceQuery;
        
        // Get balance for this project
        const [balance] = await db
          .select()
          .from(workerBalances)
          .where(and(
            eq(workerBalances.workerId, workerId),
            eq(workerBalances.projectId, project.id)
          ));

        // Get transfers for this project
        const transfers = await db
          .select()
          .from(workerTransfers)
          .where(and(
            eq(workerTransfers.workerId, workerId),
            eq(workerTransfers.projectId, project.id)
          ));

        projectsData.push({
          project,
          attendance,
          balance: balance || null,
          transfers
        });

        // Calculate totals
        if (balance) {
          totalEarned += parseFloat(balance.totalEarned || '0');
          totalPaid += parseFloat(balance.totalPaid || '0');
          totalTransferred += parseFloat(balance.totalTransferred || '0');
          totalBalance += parseFloat(balance.currentBalance || '0');
        }
      }

      return {
        worker,
        projects: projectsData,
        totals: {
          totalEarned: totalEarned.toFixed(2),
          totalPaid: totalPaid.toFixed(2),
          totalTransferred: totalTransferred.toFixed(2),
          totalBalance: totalBalance.toFixed(2)
        }
      };
    } catch (error) {
      console.error('Error getting worker multi-project statement:', error);
      throw error;
    }
  }

  async getWorkerProjects(workerId: string): Promise<Project[]> {
    try {
      const result = await db
        .select({
          id: projects.id,
          name: projects.name,
          status: projects.status,
          createdAt: projects.createdAt
        })
        .from(projects)
        .innerJoin(workerAttendance, eq(projects.id, workerAttendance.projectId))
        .where(eq(workerAttendance.workerId, workerId))
        .groupBy(projects.id);

      return result;
    } catch (error) {
      console.error('Error getting worker projects:', error);
      return [];
    }
  }
}

// Always use DatabaseStorage now that we have PostgreSQL
export const storage = new DatabaseStorage();
