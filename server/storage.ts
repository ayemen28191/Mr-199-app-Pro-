import { 
  type Project, type Worker, type FundTransfer, type WorkerAttendance, 
  type Material, type MaterialPurchase, type TransportationExpense, type DailyExpenseSummary,
  type WorkerTransfer, type WorkerBalance, type AutocompleteData,
  type InsertProject, type InsertWorker, type InsertFundTransfer, type InsertWorkerAttendance,
  type InsertMaterial, type InsertMaterialPurchase, type InsertTransportationExpense, type InsertDailyExpenseSummary,
  type InsertWorkerTransfer, type InsertWorkerBalance, type InsertAutocompleteData,
  projects, workers, fundTransfers, workerAttendance, materials, materialPurchases, transportationExpenses, dailyExpenseSummaries,
  workerTransfers, workerBalances, autocompleteData
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  getProjectByName(name: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<void>;
  
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
  getWorkerAttendanceById(id: string): Promise<WorkerAttendance | null>;
  createWorkerAttendance(attendance: InsertWorkerAttendance): Promise<WorkerAttendance>;
  updateWorkerAttendance(id: string, attendance: Partial<InsertWorkerAttendance>): Promise<WorkerAttendance | undefined>;
  deleteWorkerAttendance(id: string): Promise<void>;
  
  // Materials
  getMaterials(): Promise<Material[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  findMaterialByNameAndUnit(name: string, unit: string): Promise<Material | undefined>;
  
  // Material Purchases
  getMaterialPurchases(projectId: string, dateFrom?: string, dateTo?: string): Promise<MaterialPurchase[]>;
  getMaterialPurchaseById(id: string): Promise<MaterialPurchase | null>;
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
  getWorkerTransfer(id: string): Promise<WorkerTransfer | null>;
  createWorkerTransfer(transfer: InsertWorkerTransfer): Promise<WorkerTransfer>;
  updateWorkerTransfer(id: string, transfer: Partial<InsertWorkerTransfer>): Promise<WorkerTransfer | undefined>;
  deleteWorkerTransfer(id: string): Promise<void>;
  getAllWorkerTransfers(): Promise<WorkerTransfer[]>;
  getFilteredWorkerTransfers(projectId?: string, date?: string): Promise<WorkerTransfer[]>;
  
  // Project Statistics
  getProjectStatistics(projectId: string): Promise<any>;
  
  // Reports
  getWorkerAccountStatement(workerId: string, projectId?: string, dateFrom?: string, dateTo?: string): Promise<{
    attendance: WorkerAttendance[];
    transfers: WorkerTransfer[];
    balance: WorkerBalance | null;
  }>;
  
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
  updateDailySummaryForDate(projectId: string, date: string): Promise<void>;
  
  // Autocomplete data
  getAutocompleteData(category: string): Promise<AutocompleteData[]>;
  saveAutocompleteData(data: InsertAutocompleteData): Promise<AutocompleteData>;
  removeAutocompleteData(category: string, value: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Projects
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectByName(name: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.name, name.trim()));
    return project || undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values({ ...project, name: project.name.trim() })
      .returning();
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const updateData = project.name ? { ...project, name: project.name.trim() } : project;
    const [updated] = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Workers
  async getWorkers(): Promise<Worker[]> {
    return await db.select().from(workers);
  }

  async getWorker(id: string): Promise<Worker | undefined> {
    const [worker] = await db.select().from(workers).where(eq(workers.id, id));
    return worker || undefined;
  }

  async getWorkerByName(name: string): Promise<Worker | undefined> {
    const [worker] = await db.select().from(workers).where(eq(workers.name, name.trim()));
    return worker || undefined;
  }

  async createWorker(worker: InsertWorker): Promise<Worker> {
    const [newWorker] = await db
      .insert(workers)
      .values({ ...worker, name: worker.name.trim() })
      .returning();
    return newWorker;
  }

  async updateWorker(id: string, worker: Partial<InsertWorker>): Promise<Worker | undefined> {
    const updateData = worker.name ? { ...worker, name: worker.name.trim() } : worker;
    const [updated] = await db
      .update(workers)
      .set(updateData)
      .where(eq(workers.id, id))
      .returning();
    return updated || undefined;
  }

  // Fund Transfers
  async getFundTransfers(projectId: string, date?: string): Promise<FundTransfer[]> {
    if (date) {
      const result = await db.select().from(fundTransfers)
        .where(and(eq(fundTransfers.projectId, projectId), sql`DATE(${fundTransfers.transferDate}) = ${date}`));
      return result;
    } else {
      const result = await db.select().from(fundTransfers)
        .where(eq(fundTransfers.projectId, projectId));
      return result;
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
    
    // تحديث الملخص اليومي في الخلفية (دون انتظار)
    const transferDate = new Date(transfer.transferDate).toISOString().split('T')[0];
    this.updateDailySummaryForDate(transfer.projectId, transferDate).catch(console.error);
    
    return newTransfer;
  }

  async updateFundTransfer(id: string, transfer: Partial<InsertFundTransfer>): Promise<FundTransfer | undefined> {
    const [oldTransfer] = await db.select().from(fundTransfers).where(eq(fundTransfers.id, id));
    
    const [updated] = await db
      .update(fundTransfers)
      .set(transfer)
      .where(eq(fundTransfers.id, id))
      .returning();
    
    if (updated && oldTransfer) {
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
    const [transfer] = await db.select().from(fundTransfers).where(eq(fundTransfers.id, id));
    
    await db.delete(fundTransfers).where(eq(fundTransfers.id, id));
    
    if (transfer) {
      const transferDate = new Date(transfer.transferDate).toISOString().split('T')[0];
      await this.updateDailySummaryForDate(transfer.projectId, transferDate);
    }
  }

  // Worker Attendance
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

  async getWorkerAttendanceById(id: string): Promise<WorkerAttendance | null> {
    const [attendance] = await db.select().from(workerAttendance).where(eq(workerAttendance.id, id));
    return attendance || null;
  }

  async createWorkerAttendance(attendance: InsertWorkerAttendance): Promise<WorkerAttendance> {
    // التحقق من عدم وجود حضور مسجل مسبقاً لنفس العامل في نفس اليوم
    const existingAttendance = await db.select().from(workerAttendance)
      .where(and(
        eq(workerAttendance.workerId, attendance.workerId),
        eq(workerAttendance.date, attendance.date),
        eq(workerAttendance.projectId, attendance.projectId)
      ));
    
    if (existingAttendance.length > 0) {
      throw new Error("تم تسجيل حضور هذا العامل مسبقاً في هذا التاريخ");
    }
    
    // حساب الأجر الفعلي بناءً على عدد أيام العمل
    const workDays = attendance.workDays || 1.0;
    const dailyWage = parseFloat(attendance.dailyWage.toString());
    const actualWage = dailyWage * workDays;
    
    // إعداد الحضور مع الأجر المحسوب
    const attendanceData = {
      ...attendance,
      workDays: workDays.toString(),
      actualWage: actualWage.toString(),
      remainingAmount: attendance.paymentType === 'credit' 
        ? actualWage.toString() 
        : (actualWage - parseFloat(attendance.paidAmount?.toString() || '0')).toString()
    };
    
    const [newAttendance] = await db
      .insert(workerAttendance)
      .values(attendanceData)
      .returning();
    
    // تحديث الملخص اليومي في الخلفية (دون انتظار)
    this.updateDailySummaryForDate(attendance.projectId, attendance.date).catch(console.error);
    
    return newAttendance;
  }

  async updateWorkerAttendance(id: string, attendance: Partial<InsertWorkerAttendance>): Promise<WorkerAttendance | undefined> {
    // الحصول على البيانات الحالية لحساب الأجر إذا تم تحديث عدد الأيام
    const [currentAttendance] = await db.select().from(workerAttendance).where(eq(workerAttendance.id, id));
    
    // إعداد بيانات التحديث مع التحويل المناسب للأنواع
    let updateData: any = {};
    
    // نسخ الحقول العادية
    Object.keys(attendance).forEach(key => {
      if (key !== 'workDays') {
        updateData[key] = attendance[key as keyof typeof attendance];
      }
    });
    
    // إعادة حساب الأجر الفعلي إذا تم تغيير عدد أيام العمل أو الأجر اليومي
    if (attendance.workDays !== undefined || attendance.dailyWage) {
      const workDays = typeof attendance.workDays === 'number' 
        ? attendance.workDays 
        : parseFloat(currentAttendance?.workDays || '1.0');
      const dailyWage = attendance.dailyWage 
        ? parseFloat(attendance.dailyWage.toString())
        : parseFloat(currentAttendance?.dailyWage || '0');
      
      const actualWage = dailyWage * workDays;
      
      // تحويل الأرقام إلى نصوص للحفظ في قاعدة البيانات
      updateData.workDays = workDays.toString();
      updateData.actualWage = actualWage.toString();
      
      // إعادة حساب المبلغ المتبقي
      const paidAmount = attendance.paidAmount 
        ? parseFloat(attendance.paidAmount.toString())
        : parseFloat(currentAttendance?.paidAmount || '0');
      
      updateData.remainingAmount = attendance.paymentType === 'credit' 
        ? actualWage.toString() 
        : (actualWage - paidAmount).toString();
    }
    
    const [updated] = await db
      .update(workerAttendance)
      .set(updateData)
      .where(eq(workerAttendance.id, id))
      .returning();
    
    if (updated) {
      await this.updateDailySummaryForDate(updated.projectId, updated.date);
    }
    
    return updated || undefined;
  }

  async deleteWorkerAttendance(id: string): Promise<void> {
    const [attendance] = await db.select().from(workerAttendance).where(eq(workerAttendance.id, id));
    
    await db.delete(workerAttendance).where(eq(workerAttendance.id, id));
    
    if (attendance) {
      await this.updateDailySummaryForDate(attendance.projectId, attendance.date);
    }
  }

  // Materials
  async getMaterials(): Promise<Material[]> {
    return await db.select().from(materials);
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

  // Material Purchases
  async getMaterialPurchases(projectId: string, dateFrom?: string, dateTo?: string): Promise<any[]> {
    // جلب مشتريات المواد مع معلومات المواد
    const purchases = await db
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
        // معلومات المادة
        materialName: materials.name,
        materialCategory: materials.category,
        materialUnit: materials.unit,
        materialCreatedAt: materials.createdAt
      })
      .from(materialPurchases)
      .leftJoin(materials, eq(materialPurchases.materialId, materials.id))
      .where(
        dateFrom && dateTo 
          ? and(
              eq(materialPurchases.projectId, projectId),
              eq(materialPurchases.purchaseDate, dateFrom)
            )
          : eq(materialPurchases.projectId, projectId)
      )
      .orderBy(materialPurchases.createdAt);

    // تحويل البيانات للشكل المطلوب
    return purchases.map(purchase => ({
      id: purchase.id,
      projectId: purchase.projectId,
      materialId: purchase.materialId,
      quantity: purchase.quantity,
      unitPrice: purchase.unitPrice,
      totalAmount: purchase.totalAmount,
      purchaseType: purchase.purchaseType,
      supplierName: purchase.supplierName,
      invoiceNumber: purchase.invoiceNumber,
      invoiceDate: purchase.invoiceDate,
      invoicePhoto: purchase.invoicePhoto,
      notes: purchase.notes,
      purchaseDate: purchase.purchaseDate,
      createdAt: purchase.createdAt,
      material: {
        id: purchase.materialId,
        name: purchase.materialName,
        category: purchase.materialCategory,
        unit: purchase.materialUnit,
        createdAt: purchase.materialCreatedAt
      }
    }));
  }

  async getMaterialPurchaseById(id: string): Promise<MaterialPurchase | null> {
    const [purchase] = await db.select().from(materialPurchases).where(eq(materialPurchases.id, id));
    return purchase || null;
  }

  async createMaterialPurchase(purchase: InsertMaterialPurchase): Promise<MaterialPurchase> {
    const [newPurchase] = await db
      .insert(materialPurchases)
      .values(purchase)
      .returning();
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
    const [purchase] = await db.select().from(materialPurchases).where(eq(materialPurchases.id, id));
    
    await db.delete(materialPurchases).where(eq(materialPurchases.id, id));
    
    if (purchase) {
      await this.updateDailySummaryForDate(purchase.projectId, purchase.purchaseDate);
    }
  }

  // Transportation Expenses
  async getTransportationExpenses(projectId: string, date?: string): Promise<TransportationExpense[]> {
    if (date) {
      return await db.select().from(transportationExpenses)
        .where(and(eq(transportationExpenses.projectId, projectId), eq(transportationExpenses.date, date)));
    } else {
      return await db.select().from(transportationExpenses)
        .where(eq(transportationExpenses.projectId, projectId));
    }
  }

  async createTransportationExpense(expense: InsertTransportationExpense): Promise<TransportationExpense> {
    const [newExpense] = await db
      .insert(transportationExpenses)
      .values(expense)
      .returning();
    
    // تحديث الملخص اليومي في الخلفية (دون انتظار)
    this.updateDailySummaryForDate(expense.projectId, expense.date).catch(console.error);
    
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
    const [expense] = await db.select().from(transportationExpenses).where(eq(transportationExpenses.id, id));
    
    await db.delete(transportationExpenses).where(eq(transportationExpenses.id, id));
    
    if (expense) {
      await this.updateDailySummaryForDate(expense.projectId, expense.date);
    }
  }

  // Daily Expense Summaries
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

  async getPreviousDayBalance(projectId: string, currentDate: string): Promise<string> {
    console.log(`Getting previous day balance for project ${projectId}, date: ${currentDate}`);
    
    const result = await db.select()
      .from(dailyExpenseSummaries)
      .where(and(
        eq(dailyExpenseSummaries.projectId, projectId),
        sql`${dailyExpenseSummaries.date} < ${currentDate}`
      ))
      .orderBy(sql`${dailyExpenseSummaries.date} DESC`)
      .limit(1);
    
    const balance = result.length > 0 ? result[0].remainingBalance : "0";
    console.log(`Previous day balance found: ${balance}`);
    
    // التحقق من صحة البيانات
    if (result.length > 0) {
      const prevSummary = result[0];
      console.log(`Previous summary from ${prevSummary.date}: carried=${prevSummary.carriedForwardAmount}, income=${prevSummary.totalIncome}, expenses=${prevSummary.totalExpenses}, remaining=${prevSummary.remainingBalance}`);
    }
    
    return balance;
  }

  // إزالة الملخصات المكررة للتاريخ الواحد
  async removeDuplicateSummaries(projectId: string, date: string): Promise<void> {
    try {
      // البحث عن الملخصات المكررة
      const duplicates = await db.select()
        .from(dailyExpenseSummaries)
        .where(and(
          eq(dailyExpenseSummaries.projectId, projectId),
          eq(dailyExpenseSummaries.date, date)
        ))
        .orderBy(dailyExpenseSummaries.createdAt);

      // إذا كان هناك أكثر من ملخص، احذف الأقدم واحتفظ بالأحدث
      if (duplicates.length > 1) {
        const toDelete = duplicates.slice(0, -1); // جميع الملخصات عدا الأحدث
        for (const summary of toDelete) {
          await db.delete(dailyExpenseSummaries)
            .where(eq(dailyExpenseSummaries.id, summary.id));
        }
        console.log(`🗑️ Removed ${toDelete.length} duplicate summaries for ${projectId} on ${date}`);
      }
    } catch (error) {
      console.error('Error removing duplicate summaries:', error);
    }
  }

  // تحديث الملخص اليومي تلقائياً مع تحسينات الأداء وقيود الحماية
  async updateDailySummaryForDate(projectId: string, date: string): Promise<void> {
    try {
      console.log(`🔄 Updating daily summary for ${projectId} on ${date}...`);
      
      // التحقق من وجود ملخصات مكررة وحذفها
      await this.removeDuplicateSummaries(projectId, date);
      
      // تشغيل جميع الاستعلامات بشكل متوازي لتحسين الأداء
      const [
        fundTransfers,
        workerAttendanceRecords,
        materialPurchases,
        transportationExpenses,
        workerTransfers,
        carriedForwardAmount
      ] = await Promise.all([
        this.getFundTransfers(projectId, date),
        this.getWorkerAttendance(projectId, date),
        this.getMaterialPurchases(projectId, date),
        this.getTransportationExpenses(projectId, date),
        this.getFilteredWorkerTransfers(projectId, date),
        this.getPreviousDayBalance(projectId, date).then(balance => parseFloat(balance))
      ]);

      const totalFundTransfers = fundTransfers.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      // استخدام المبلغ المدفوع بدلاً من إجمالي الأجر اليومي
      const totalWorkerWages = workerAttendanceRecords.reduce((sum, a) => sum + parseFloat(a.paidAmount || '0'), 0);
      const totalMaterialCosts = materialPurchases.reduce((sum, p) => sum + parseFloat(p.totalAmount), 0);
      const totalTransportationCosts = transportationExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const totalWorkerTransferCosts = workerTransfers.reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const totalIncome = carriedForwardAmount + totalFundTransfers;
      const totalExpenses = totalWorkerWages + totalMaterialCosts + totalTransportationCosts + totalWorkerTransferCosts;
      const remainingBalance = totalIncome - totalExpenses;

      // معلومات تفصيلية للتشخيص
      console.log(`📊 Balance calculation for ${date}:`);
      console.log(`   Carried Forward: ${carriedForwardAmount}`);
      console.log(`   Fund Transfers: ${totalFundTransfers}`);
      console.log(`   Worker Wages: ${totalWorkerWages}`);
      console.log(`   Material Costs: ${totalMaterialCosts}`);
      console.log(`   Transportation: ${totalTransportationCosts}`);
      console.log(`   Worker Transfers: ${totalWorkerTransferCosts}`);
      console.log(`   Total Income: ${totalIncome}`);
      console.log(`   Total Expenses: ${totalExpenses}`);
      console.log(`   Remaining Balance: ${remainingBalance}`);
      
      // التحقق من صحة البيانات المحاسبية
      if (Math.abs(totalIncome - totalExpenses - remainingBalance) > 0.01) {
        console.error(`❌ BALANCE ERROR: Income(${totalIncome}) - Expenses(${totalExpenses}) ≠ Remaining(${remainingBalance})`);
        throw new Error(`خطأ في حساب الرصيد: الدخل - المصروفات ≠ المتبقي`);
      }

      await this.createOrUpdateDailyExpenseSummary({
        projectId,
        date,
        carriedForwardAmount: carriedForwardAmount.toString(),
        totalIncome: totalIncome.toString(),
        totalExpenses: totalExpenses.toString(),
        remainingBalance: remainingBalance.toString()
      });
      
      console.log(`✅ Daily summary updated successfully for ${projectId} on ${date}`);
    } catch (error) {
      console.error('❌ Error updating daily summary:', error);
      throw error;
    }
  }

  // Helper function to get previous date
  private getPreviousDate(currentDate: string): string {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  }

  // إعادة حساب جميع الأرصدة لمشروع معين لإصلاح أي أخطاء
  async recalculateAllBalances(projectId: string): Promise<void> {
    console.log(`🔄 Recalculating all balances for project ${projectId}...`);
    
    try {
      // الحصول على جميع التواريخ التي بها ملخصات يومية
      const existingSummaries = await db.select()
        .from(dailyExpenseSummaries)
        .where(eq(dailyExpenseSummaries.projectId, projectId))
        .orderBy(sql`${dailyExpenseSummaries.date} ASC`);

      // حذف جميع الملخصات الموجودة
      await db.delete(dailyExpenseSummaries)
        .where(eq(dailyExpenseSummaries.projectId, projectId));

      // إعادة حساب كل تاريخ بالترتيب الصحيح
      for (const summary of existingSummaries) {
        console.log(`📅 Recalculating ${summary.date}...`);
        await this.updateDailySummaryForDate(projectId, summary.date);
      }

      console.log(`✅ All balances recalculated successfully for project ${projectId}`);
    } catch (error) {
      console.error(`❌ Error recalculating balances:`, error);
      throw error;
    }
  }

  // Worker Balance Management
  async getWorkerBalance(workerId: string, projectId: string): Promise<WorkerBalance | undefined> {
    // حساب الرصيد ديناميكياً من سجلات الحضور
    const attendanceRecords = await db.select().from(workerAttendance)
      .where(and(eq(workerAttendance.workerId, workerId), eq(workerAttendance.projectId, projectId)));
    
    let totalEarned = 0;
    let totalPaid = 0;
    
    attendanceRecords.forEach(record => {
      totalEarned += parseFloat(record.dailyWage || '0');
      totalPaid += parseFloat(record.paidAmount || '0');
    });
    
    const transferRecords = await db.select().from(workerTransfers)
      .where(and(eq(workerTransfers.workerId, workerId), eq(workerTransfers.projectId, projectId)));
    
    let totalTransferred = 0;
    transferRecords.forEach(transfer => {
      totalTransferred += parseFloat(transfer.amount || '0');
    });
    
    const currentBalance = totalEarned - totalPaid - totalTransferred;
    
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

  // Worker Transfers
  async getWorkerTransfers(workerId: string, projectId?: string): Promise<WorkerTransfer[]> {
    if (projectId) {
      return await db.select().from(workerTransfers)
        .where(and(eq(workerTransfers.workerId, workerId), eq(workerTransfers.projectId, projectId)));
    } else {
      return await db.select().from(workerTransfers)
        .where(eq(workerTransfers.workerId, workerId));
    }
  }

  async getWorkerTransfer(id: string): Promise<WorkerTransfer | null> {
    const [transfer] = await db.select().from(workerTransfers).where(eq(workerTransfers.id, id));
    return transfer || null;
  }

  async createWorkerTransfer(transfer: InsertWorkerTransfer): Promise<WorkerTransfer> {
    const [newTransfer] = await db
      .insert(workerTransfers)
      .values(transfer)
      .returning();
    return newTransfer;
  }

  async updateWorkerTransfer(id: string, transfer: Partial<InsertWorkerTransfer>): Promise<WorkerTransfer | undefined> {
    const [updated] = await db
      .update(workerTransfers)
      .set(transfer)
      .where(eq(workerTransfers.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteWorkerTransfer(id: string): Promise<void> {
    await db.delete(workerTransfers).where(eq(workerTransfers.id, id));
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

  // Reports
  async getWorkerAccountStatement(workerId: string, projectId?: string, dateFrom?: string, dateTo?: string): Promise<{
    attendance: WorkerAttendance[];
    transfers: WorkerTransfer[];
    balance: WorkerBalance | null;
  }> {
    try {
      let attendanceConditions = [eq(workerAttendance.workerId, workerId)];
      
      if (projectId) {
        attendanceConditions.push(eq(workerAttendance.projectId, projectId));
      }
      
      if (dateFrom) {
        attendanceConditions.push(gte(workerAttendance.date, dateFrom));
      }
      
      if (dateTo) {
        attendanceConditions.push(lte(workerAttendance.date, dateTo));
      }
      
      const attendance = await db.select().from(workerAttendance)
        .where(and(...attendanceConditions))
        .orderBy(workerAttendance.date);
      
      // Get worker transfers
      let transfersConditions = [eq(workerTransfers.workerId, workerId)];
      
      if (projectId) {
        transfersConditions.push(eq(workerTransfers.projectId, projectId));
      }
      
      if (dateFrom) {
        transfersConditions.push(gte(workerTransfers.transferDate, dateFrom));
      }
      
      if (dateTo) {
        transfersConditions.push(lte(workerTransfers.transferDate, dateTo));
      }
      
      const transfers = await db.select().from(workerTransfers)
        .where(and(...transfersConditions))
        .orderBy(workerTransfers.transferDate);
      
      // Get worker balance
      let balance = null;
      if (projectId) {
        const balanceResult = await db.select().from(workerBalances)
          .where(and(eq(workerBalances.workerId, workerId), eq(workerBalances.projectId, projectId)))
          .limit(1);
        balance = balanceResult[0] || null;
      }
      
      return {
        attendance,
        transfers,
        balance
      };
    } catch (error) {
      console.error('Error getting worker account statement:', error);
      return {
        attendance: [],
        transfers: [],
        balance: null
      };
    }
  }

  // Multi-project worker management
  async getWorkersWithMultipleProjects(): Promise<{worker: Worker, projects: Project[], totalBalance: string}[]> {
    return [];
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
    const [worker] = await db.select().from(workers).where(eq(workers.id, workerId));
    if (!worker) {
      throw new Error('Worker not found');
    }

    return {
      worker,
      projects: [],
      totals: {
        totalEarned: '0',
        totalPaid: '0',
        totalTransferred: '0',
        totalBalance: '0'
      }
    };
  }

  async getWorkerProjects(workerId: string): Promise<Project[]> {
    try {
      const projectIds = await db
        .selectDistinct({ projectId: workerAttendance.projectId })
        .from(workerAttendance)
        .where(eq(workerAttendance.workerId, workerId));
      
      if (projectIds.length === 0) {
        return [];
      }
      
      const projectsList = await db
        .select()
        .from(projects)
        .where(inArray(projects.id, projectIds.map(p => p.projectId)));
      
      return projectsList;
    } catch (error) {
      console.error('Error getting worker projects:', error);
      return [];
    }
  }

  async getWorkerAttendanceForPeriod(workerId: string, projectId: string, dateFrom: string, dateTo: string): Promise<WorkerAttendance[]> {
    try {
      return await db.select().from(workerAttendance)
        .where(and(
          eq(workerAttendance.workerId, workerId),
          eq(workerAttendance.projectId, projectId),
          gte(workerAttendance.date, dateFrom),
          lte(workerAttendance.date, dateTo)
        ))
        .orderBy(workerAttendance.date);
    } catch (error) {
      console.error('Error getting worker attendance for period:', error);
      return [];
    }
  }

  async getFundTransfersForWorker(workerId: string, projectId: string, dateFrom: string, dateTo: string): Promise<FundTransfer[]> {
    try {
      // البحث عن التحويلات المالية التي تخص هذا العامل
      // يمكن أن نبحث باستخدام اسم العامل في senderName أو في الملاحظات
      const worker = await this.getWorker(workerId);
      if (!worker) return [];

      return await db.select().from(fundTransfers)
        .where(and(
          eq(fundTransfers.projectId, projectId),
          sql`DATE(${fundTransfers.transferDate}) >= ${dateFrom}`,
          sql`DATE(${fundTransfers.transferDate}) <= ${dateTo}`,
          sql`(${fundTransfers.senderName} LIKE '%${worker.name}%' OR ${fundTransfers.notes} LIKE '%${worker.name}%')`
        ))
        .orderBy(fundTransfers.transferDate);
    } catch (error) {
      console.error('Error getting fund transfers for worker:', error);
      return [];
    }
  }

  async getProjectStatistics(projectId: string): Promise<{
    totalWorkers: number;
    totalExpenses: number;
    totalIncome: number;
    currentBalance: number;
    activeWorkers: number;
    completedDays: number;
    materialPurchases: number;
    lastActivity: string;
  }> {
    try {
      // حساب إجمالي العمال في المشروع
      const workersCount = await db
        .select({ count: sql<number>`count(distinct ${workerAttendance.workerId})` })
        .from(workerAttendance)
        .where(eq(workerAttendance.projectId, projectId));
      
      const totalWorkers = workersCount[0]?.count || 0;

      // حساب العمال النشطين (الذين عملوا في آخر 30 يوم)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      
      const activeWorkersCount = await db
        .select({ count: sql<number>`count(distinct ${workerAttendance.workerId})` })
        .from(workerAttendance)
        .where(and(
          eq(workerAttendance.projectId, projectId),
          gte(workerAttendance.date, thirtyDaysAgoStr)
        ));
      
      const activeWorkers = activeWorkersCount[0]?.count || 0;

      // حساب عدد أيام العمل المكتملة
      const completedDaysCount = await db
        .select({ count: sql<number>`count(distinct ${workerAttendance.date})` })
        .from(workerAttendance)
        .where(eq(workerAttendance.projectId, projectId));
      
      const completedDays = completedDaysCount[0]?.count || 0;

      // حساب عدد مشتريات المواد
      const purchasesCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(materialPurchases)
        .where(eq(materialPurchases.projectId, projectId));
      
      const materialPurchasesCount = purchasesCount[0]?.count || 0;

      // حساب المالية من آخر ملخص يومي
      const latestSummary = await db
        .select()
        .from(dailyExpenseSummaries)
        .where(eq(dailyExpenseSummaries.projectId, projectId))
        .orderBy(sql`${dailyExpenseSummaries.date} DESC`)
        .limit(1);

      let totalIncome = 0;
      let totalExpenses = 0;
      let currentBalance = 0;

      if (latestSummary.length > 0) {
        const summary = latestSummary[0];
        totalIncome = parseFloat(summary.totalIncome || '0');
        totalExpenses = parseFloat(summary.totalExpenses || '0');
        currentBalance = parseFloat(summary.remainingBalance || '0');
      } else {
        // إذا لم توجد ملخصات، احسب من البيانات الخام
        const fundTransfersSum = await db
          .select({ sum: sql<number>`COALESCE(SUM(CAST(${fundTransfers.amount} AS NUMERIC)), 0)` })
          .from(fundTransfers)
          .where(eq(fundTransfers.projectId, projectId));
        
        totalIncome = parseFloat(fundTransfersSum[0]?.sum?.toString() || '0');

        // حساب المصروفات
        const wagesSum = await db
          .select({ sum: sql<number>`COALESCE(SUM(CAST(${workerAttendance.dailyWage} AS NUMERIC)), 0)` })
          .from(workerAttendance)
          .where(eq(workerAttendance.projectId, projectId));

        const materialsSum = await db
          .select({ sum: sql<number>`COALESCE(SUM(CAST(${materialPurchases.totalAmount} AS NUMERIC)), 0)` })
          .from(materialPurchases)
          .where(eq(materialPurchases.projectId, projectId));

        const transportSum = await db
          .select({ sum: sql<number>`COALESCE(SUM(CAST(${transportationExpenses.amount} AS NUMERIC)), 0)` })
          .from(transportationExpenses)
          .where(eq(transportationExpenses.projectId, projectId));

        const wages = parseFloat(wagesSum[0]?.sum?.toString() || '0');
        const materials = parseFloat(materialsSum[0]?.sum?.toString() || '0');
        const transport = parseFloat(transportSum[0]?.sum?.toString() || '0');
        
        totalExpenses = wages + materials + transport;
        currentBalance = totalIncome - totalExpenses;
      }

      // البحث عن آخر نشاط
      const lastActivityQueries = await Promise.all([
        db.select({ date: workerAttendance.date }).from(workerAttendance)
          .where(eq(workerAttendance.projectId, projectId))
          .orderBy(sql`${workerAttendance.date} DESC`).limit(1),
        db.select({ date: materialPurchases.purchaseDate }).from(materialPurchases)
          .where(eq(materialPurchases.projectId, projectId))
          .orderBy(sql`${materialPurchases.purchaseDate} DESC`).limit(1),
        db.select({ date: transportationExpenses.date }).from(transportationExpenses)
          .where(eq(transportationExpenses.projectId, projectId))
          .orderBy(sql`${transportationExpenses.date} DESC`).limit(1)
      ]);

      const dates = [
        lastActivityQueries[0][0]?.date,
        lastActivityQueries[1][0]?.date,
        lastActivityQueries[2][0]?.date
      ].filter(date => date);

      const lastActivity = dates.length > 0 
        ? dates.sort().reverse()[0] 
        : new Date().toISOString().split('T')[0];

      return {
        totalWorkers,
        totalExpenses,
        totalIncome,
        currentBalance,
        activeWorkers,
        completedDays,
        materialPurchases: materialPurchasesCount,
        lastActivity
      };
    } catch (error) {
      console.error('Error getting project statistics:', error);
      return {
        totalWorkers: 0,
        totalExpenses: 0,
        totalIncome: 0,
        currentBalance: 0,
        activeWorkers: 0,
        completedDays: 0,
        materialPurchases: 0,
        lastActivity: new Date().toISOString().split('T')[0]
      };
    }
  }

  // Autocomplete data methods
  async getAutocompleteData(category: string): Promise<AutocompleteData[]> {
    try {
      return await db
        .select()
        .from(autocompleteData)
        .where(eq(autocompleteData.category, category))
        .orderBy(sql`${autocompleteData.usageCount} DESC, ${autocompleteData.lastUsed} DESC`);
    } catch (error) {
      console.error('Error getting autocomplete data:', error);
      return [];
    }
  }

  async saveAutocompleteData(data: InsertAutocompleteData): Promise<AutocompleteData> {
    try {
      // تحقق من وجود القيمة مسبقاً
      const existing = await db
        .select()
        .from(autocompleteData)
        .where(and(
          eq(autocompleteData.category, data.category),
          eq(autocompleteData.value, data.value.trim())
        ))
        .limit(1);

      if (existing.length > 0) {
        // إذا كانت موجودة، اعد تحديث عدد الاستخدام وتاريخ آخر استخدام
        const [updated] = await db
          .update(autocompleteData)
          .set({
            usageCount: sql`${autocompleteData.usageCount} + 1`,
            lastUsed: new Date()
          })
          .where(eq(autocompleteData.id, existing[0].id))
          .returning();
        
        return updated;
      } else {
        // إذا لم تكن موجودة، أنشئ سجل جديد
        const [created] = await db
          .insert(autocompleteData)
          .values({
            ...data,
            value: data.value.trim()
          })
          .returning();
        
        return created;
      }
    } catch (error) {
      console.error('Error saving autocomplete data:', error);
      throw error;
    }
  }

  async removeAutocompleteData(category: string, value: string): Promise<void> {
    try {
      await db
        .delete(autocompleteData)
        .where(and(
          eq(autocompleteData.category, category),
          eq(autocompleteData.value, value.trim())
        ));
    } catch (error) {
      console.error('Error removing autocomplete data:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();