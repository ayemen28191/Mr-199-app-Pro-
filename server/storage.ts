import { 
  type Project, type Worker, type FundTransfer, type WorkerAttendance, 
  type Material, type MaterialPurchase, type TransportationExpense, type DailyExpenseSummary,
  type WorkerTransfer, type WorkerBalance, type AutocompleteData, type WorkerType, type WorkerMiscExpense, type User,
  type Supplier, type SupplierPayment, type PrintSettings, type ProjectFundTransfer,
  type ReportTemplate,
  type ToolCategory, type Tool, type ToolStock, type ToolMovement, type ToolMaintenanceLog, type ToolUsageAnalytics, type ToolReservation,
  type InsertProject, type InsertWorker, type InsertFundTransfer, type InsertWorkerAttendance,
  type InsertMaterial, type InsertMaterialPurchase, type InsertTransportationExpense, type InsertDailyExpenseSummary,
  type InsertWorkerTransfer, type InsertWorkerBalance, type InsertAutocompleteData, type InsertWorkerType, type InsertWorkerMiscExpense, type InsertUser,
  type InsertSupplier, type InsertSupplierPayment, type InsertPrintSettings, type InsertProjectFundTransfer,
  type InsertReportTemplate,
  type InsertToolCategory, type InsertTool, type InsertToolStock, type InsertToolMovement, type InsertToolMaintenanceLog, type InsertToolUsageAnalytics, type InsertToolReservation,
  // Phase 3 types
  type ToolPurchaseItem, type MaintenanceSchedule, type MaintenanceTask, type ToolCostTracking,
  type InsertToolPurchaseItem, type InsertMaintenanceSchedule, type InsertMaintenanceTask, type InsertToolCostTracking,
  projects, workers, fundTransfers, workerAttendance, materials, materialPurchases, transportationExpenses, dailyExpenseSummaries,
  workerTransfers, workerBalances, autocompleteData, workerTypes, workerMiscExpenses, users, suppliers, supplierPayments, printSettings, projectFundTransfers, reportTemplates,
  toolCategories, tools, toolStock, toolMovements, toolMaintenanceLogs, toolUsageAnalytics, toolReservations,
  // Phase 3 imports
  toolPurchaseItems, maintenanceSchedules, maintenanceTasks, toolCostTracking
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, gt, sql, inArray, or } from "drizzle-orm";

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
  
  // Worker Types
  getWorkerTypes(): Promise<WorkerType[]>;
  createWorkerType(workerType: InsertWorkerType): Promise<WorkerType>;
  
  // Fund Transfers
  getFundTransfers(projectId: string, date?: string): Promise<FundTransfer[]>;
  getFundTransferByNumber(transferNumber: string): Promise<FundTransfer | undefined>;
  createFundTransfer(transfer: InsertFundTransfer): Promise<FundTransfer>;
  updateFundTransfer(id: string, transfer: Partial<InsertFundTransfer>): Promise<FundTransfer | undefined>;
  deleteFundTransfer(id: string): Promise<void>;
  
  // Project Fund Transfers (ترحيل الأموال بين المشاريع)
  getProjectFundTransfers(fromProjectId?: string, toProjectId?: string, date?: string): Promise<ProjectFundTransfer[]>;
  getProjectFundTransfer(id: string): Promise<ProjectFundTransfer | undefined>;
  createProjectFundTransfer(transfer: InsertProjectFundTransfer): Promise<ProjectFundTransfer>;
  updateProjectFundTransfer(id: string, transfer: Partial<InsertProjectFundTransfer>): Promise<ProjectFundTransfer | undefined>;
  deleteProjectFundTransfer(id: string): Promise<void>;
  
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
  getMaterialPurchasesWithFilters(filters: {
    supplierId?: string;
    projectId?: string;
    dateFrom?: string;
    dateTo?: string;
    purchaseType?: string;
  }): Promise<MaterialPurchase[]>;
  getMaterialPurchasesDateRange(): Promise<{ minDate: string; maxDate: string }>;
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
  deleteDailySummary(projectId: string, date: string): Promise<void>;
  getDailySummary(projectId: string, date: string): Promise<DailyExpenseSummary | null>;
  
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
  getDailyExpensesRange(projectId: string, dateFrom: string, dateTo: string): Promise<any[]>;
  
  // Autocomplete data
  getAutocompleteData(category: string): Promise<AutocompleteData[]>;
  saveAutocompleteData(data: InsertAutocompleteData): Promise<AutocompleteData>;
  removeAutocompleteData(category: string, value: string): Promise<void>;
  
  // Worker miscellaneous expenses
  getWorkerMiscExpenses(projectId: string, date?: string): Promise<WorkerMiscExpense[]>;
  getWorkerMiscExpense(id: string): Promise<WorkerMiscExpense | null>;
  createWorkerMiscExpense(expense: InsertWorkerMiscExpense): Promise<WorkerMiscExpense>;
  updateWorkerMiscExpense(id: string, expense: Partial<InsertWorkerMiscExpense>): Promise<WorkerMiscExpense | undefined>;
  deleteWorkerMiscExpense(id: string): Promise<void>;
  
  // Advanced Reports
  getExpensesForReport(projectId: string, dateFrom: string, dateTo: string): Promise<any[]>;
  getIncomeForReport(projectId: string, dateFrom: string, dateTo: string): Promise<any[]>;
  
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  
  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  getSupplierByName(name: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<void>;
  
  // Supplier Payments
  getSupplierPayments(supplierId: string, projectId?: string): Promise<SupplierPayment[]>;
  getSupplierPayment(id: string): Promise<SupplierPayment | undefined>;
  createSupplierPayment(payment: InsertSupplierPayment): Promise<SupplierPayment>;
  updateSupplierPayment(id: string, payment: Partial<InsertSupplierPayment>): Promise<SupplierPayment | undefined>;
  deleteSupplierPayment(id: string): Promise<void>;
  
  // Supplier Reports
  getSupplierAccountStatement(supplierId: string, projectId?: string, dateFrom?: string, dateTo?: string): Promise<{
    supplier: Supplier;
    purchases: MaterialPurchase[];
    payments: SupplierPayment[];
    totalDebt: string;
    totalPaid: string;
    remainingDebt: string;
  }>;
  
  // Purchase filtering for supplier reports
  getPurchasesBySupplier(supplierId: string, purchaseType?: string, dateFrom?: string, dateTo?: string): Promise<MaterialPurchase[]>;
  
  // Print Settings
  getPrintSettings(reportType?: string, userId?: string): Promise<PrintSettings[]>;
  getPrintSettingsById(id: string): Promise<PrintSettings | undefined>;
  createPrintSettings(settings: InsertPrintSettings): Promise<PrintSettings>;
  updatePrintSettings(id: string, settings: Partial<InsertPrintSettings>): Promise<PrintSettings | undefined>;
  deletePrintSettings(id: string): Promise<void>;
  getDefaultPrintSettings(reportType: string): Promise<PrintSettings | undefined>;
  

  
  // Report Templates
  getReportTemplates(): Promise<ReportTemplate[]>;
  getReportTemplate(id: string): Promise<ReportTemplate | undefined>;
  getActiveReportTemplate(): Promise<ReportTemplate | undefined>;
  createReportTemplate(template: InsertReportTemplate): Promise<ReportTemplate>;
  updateReportTemplate(id: string, template: Partial<InsertReportTemplate>): Promise<ReportTemplate | undefined>;
  deleteReportTemplate(id: string): Promise<void>;

  // =====================================================
  // نظام إدارة المعدات والأدوات الاحترافي
  // =====================================================

  // Tool Categories
  getToolCategories(): Promise<ToolCategory[]>;
  getToolCategory(id: string): Promise<ToolCategory | undefined>;
  getToolCategoryByName(name: string): Promise<ToolCategory | undefined>;
  createToolCategory(category: InsertToolCategory): Promise<ToolCategory>;
  updateToolCategory(id: string, category: Partial<InsertToolCategory>): Promise<ToolCategory | undefined>;
  deleteToolCategory(id: string): Promise<void>;

  // Tools
  getTools(filters?: {
    categoryId?: string;
    status?: string;
    condition?: string;
    searchTerm?: string;
    projectId?: string;
    locationType?: string;
  }): Promise<Tool[]>;
  getTool(id: string): Promise<Tool | undefined>;
  getToolBySku(sku: string): Promise<Tool | undefined>;
  getToolByBarcode(barcode: string): Promise<Tool | undefined>;
  getToolByQrCode(qrCode: string): Promise<Tool | undefined>;
  createTool(tool: InsertTool): Promise<Tool>;
  updateTool(id: string, tool: Partial<InsertTool>): Promise<Tool | undefined>;
  deleteTool(id: string): Promise<void>;

  // Tool Stock
  getToolStock(toolId?: string, locationType?: string, locationId?: string): Promise<ToolStock[]>;
  getToolStockByLocation(locationType: string, locationId?: string): Promise<ToolStock[]>;
  updateToolStock(toolId: string, locationType: string, locationId: string | null, stock: Partial<InsertToolStock>): Promise<ToolStock>;
  createOrUpdateToolStock(stock: InsertToolStock): Promise<ToolStock>;
  
  // Tool Movements
  getToolMovements(filters?: {
    toolId?: string;
    projectId?: string;
    movementType?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ToolMovement[]>;
  getToolMovement(id: string): Promise<ToolMovement | undefined>;
  createToolMovement(movement: InsertToolMovement): Promise<ToolMovement>;
  updateToolMovement(id: string, movement: Partial<InsertToolMovement>): Promise<ToolMovement | undefined>;
  deleteToolMovement(id: string): Promise<void>;

  // Tool Maintenance
  getToolMaintenanceLogs(toolId?: string, status?: string): Promise<ToolMaintenanceLog[]>;
  getToolMaintenanceLog(id: string): Promise<ToolMaintenanceLog | undefined>;
  createToolMaintenanceLog(log: InsertToolMaintenanceLog): Promise<ToolMaintenanceLog>;
  updateToolMaintenanceLog(id: string, log: Partial<InsertToolMaintenanceLog>): Promise<ToolMaintenanceLog | undefined>;
  deleteToolMaintenanceLog(id: string): Promise<void>;
  getOverdueMaintenanceTasks(): Promise<ToolMaintenanceLog[]>;

  // Tool Usage Analytics
  getToolUsageAnalytics(toolId?: string, projectId?: string, period?: string): Promise<ToolUsageAnalytics[]>;
  createOrUpdateToolUsageAnalytics(analytics: InsertToolUsageAnalytics): Promise<ToolUsageAnalytics>;
  getToolUtilizationReport(dateFrom: string, dateTo: string): Promise<any[]>;

  // Tool Reservations
  getToolReservations(filters?: {
    toolId?: string;
    projectId?: string;
    status?: string;
    userId?: string;
  }): Promise<ToolReservation[]>;
  getToolReservation(id: string): Promise<ToolReservation | undefined>;
  createToolReservation(reservation: InsertToolReservation): Promise<ToolReservation>;
  updateToolReservation(id: string, reservation: Partial<InsertToolReservation>): Promise<ToolReservation | undefined>;
  deleteToolReservation(id: string): Promise<void>;

  // Advanced Tool Functions
  transferTool(toolId: string, fromLocation: {type: string, id: string | null}, toLocation: {type: string, id: string | null}, quantity: number, userId: string, reason?: string): Promise<ToolMovement>;
  getToolHistory(toolId: string): Promise<{movements: ToolMovement[], maintenance: ToolMaintenanceLog[]}>;
  getToolsByProject(projectId: string): Promise<Tool[]>;
  getLowStockTools(threshold?: number): Promise<Tool[]>;
  getToolsNeedingMaintenance(): Promise<Tool[]>;
  generateToolQRCode(toolId: string): Promise<string>;
  bulkUpdateToolStatus(toolIds: string[], status: string, userId: string): Promise<void>;
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
    try {
      const [newProject] = await db
        .insert(projects)
        .values({ ...project, name: project.name.trim() })
        .returning();
      
      if (!newProject) {
        throw new Error('فشل في إنشاء المشروع');
      }
      
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
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
    try {
      // التحقق من وجود نوع العامل وإضافته إذا لم يكن موجوداً
      await this.ensureWorkerTypeExists(worker.type);
      
      const [newWorker] = await db
        .insert(workers)
        .values({ ...worker, name: worker.name.trim() })
        .returning();
      
      if (!newWorker) {
        throw new Error('فشل في إنشاء العامل');
      }
      
      // تحديث عداد الاستخدام لنوع العامل
      await this.incrementWorkerTypeUsage(worker.type);
      
      return newWorker;
    } catch (error) {
      console.error('Error creating worker:', error);
      throw error;
    }
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

  async deleteWorker(id: string): Promise<void> {
    try {
      await db.delete(workers).where(eq(workers.id, id));
    } catch (error) {
      console.error('Error deleting worker:', error);
      throw new Error('فشل في حذف العامل');
    }
  }

  // Worker Types
  async getWorkerTypes(): Promise<WorkerType[]> {
    try {
      return await db.select().from(workerTypes).orderBy(sql`${workerTypes.usageCount} DESC, ${workerTypes.name} ASC`);
    } catch (error) {
      console.error('Error fetching worker types:', error);
      throw new Error('خطأ في جلب أنواع العمال');
    }
  }

  async createWorkerType(workerType: InsertWorkerType): Promise<WorkerType> {
    try {
      const [newWorkerType] = await db
        .insert(workerTypes)
        .values({ ...workerType, name: workerType.name.trim() })
        .returning();
      
      if (!newWorkerType) {
        throw new Error('فشل في إنشاء نوع العامل');
      }
      
      return newWorkerType;
    } catch (error) {
      console.error('Error creating worker type:', error);
      throw new Error('خطأ في إضافة نوع العامل');
    }
  }

  // دالة للتأكد من وجود نوع العامل وإضافته إذا لم يكن موجوداً
  private async ensureWorkerTypeExists(typeName: string): Promise<void> {
    try {
      const trimmedName = typeName.trim();
      
      // البحث عن نوع العامل
      const [existingType] = await db
        .select()
        .from(workerTypes)
        .where(eq(workerTypes.name, trimmedName));
      
      // إذا لم يكن موجوداً، أضفه
      if (!existingType) {
        await db
          .insert(workerTypes)
          .values({ name: trimmedName })
          .onConflictDoNothing(); // تجنب الخطأ إذا تم إدراجه من مكان آخر
      }
    } catch (error) {
      console.error('Error ensuring worker type exists:', error);
      // لا نلقي خطأ هنا لأن هذا لا يجب أن يوقف إنشاء العامل
    }
  }

  // دالة لزيادة عداد استخدام نوع العامل
  private async incrementWorkerTypeUsage(typeName: string): Promise<void> {
    try {
      await db
        .update(workerTypes)
        .set({ 
          usageCount: sql`${workerTypes.usageCount} + 1`,
          lastUsed: new Date()
        })
        .where(eq(workerTypes.name, typeName.trim()));
    } catch (error) {
      console.error('Error incrementing worker type usage:', error);
      // لا نلقي خطأ هنا لأن هذا ليس حرجاً
    }
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
    try {
      console.log('💾 إنشاء حولة جديدة في قاعدة البيانات:', {
        projectId: transfer.projectId,
        amount: transfer.amount,
        transferType: transfer.transferType,
        senderName: transfer.senderName
      });
      
      const [newTransfer] = await db
        .insert(fundTransfers)
        .values(transfer)
        .returning();
      
      if (!newTransfer) {
        throw new Error('فشل في إنشاء تحويل العهدة - لم يتم إرجاع البيانات من قاعدة البيانات');
      }
      
      console.log('✅ تم إنشاء الحولة بنجاح في قاعدة البيانات:', newTransfer.id);
      
      // تحديث الملخص اليومي في الخلفية (دون انتظار)
      const transferDate = new Date(transfer.transferDate).toISOString().split('T')[0];
      this.updateDailySummaryForDate(transfer.projectId, transferDate).catch(console.error);
      
      return newTransfer;
    } catch (error: any) {
      console.error('❌ خطأ في إنشاء الحولة:', error);
      
      // إذا كان الخطأ متعلق بتكرار رقم التحويل
      if (error.code === '23505' && error.constraint?.includes('transfer_number')) {
        throw new Error('يوجد تحويل بنفس رقم الحوالة مسبقاً');
      }
      
      // إذا كان الخطأ متعلق بمرجع خارجي غير صحيح (المشروع غير موجود)
      if (error.code === '23503') {
        throw new Error('المشروع المحدد غير موجود');
      }
      
      // إذا كان الخطأ متعلق بقيود البيانات
      if (error.code === '23514') {
        throw new Error('البيانات المدخلة لا تتوافق مع قيود قاعدة البيانات');
      }
      
      // خطأ عام
      throw new Error(error.message || 'حدث خطأ غير متوقع أثناء إنشاء الحولة');
    }
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

  // دالة مساعدة لجلب عمليات ترحيل الأموال لمشروع معين في تاريخ محدد
  async getProjectFundTransfersForDate(projectId: string, date: string): Promise<ProjectFundTransfer[]> {
    const transfers = await db.select().from(projectFundTransfers)
      .where(
        and(
          or(
            eq(projectFundTransfers.fromProjectId, projectId),
            eq(projectFundTransfers.toProjectId, projectId)
          ),
          eq(projectFundTransfers.transferDate, date)
        )
      );
    return transfers;
  }

  // Project Fund Transfers (ترحيل الأموال بين المشاريع)
  async getProjectFundTransfers(fromProjectId?: string, toProjectId?: string, date?: string): Promise<ProjectFundTransfer[]> {
    const conditions = [];
    if (fromProjectId) {
      conditions.push(eq(projectFundTransfers.fromProjectId, fromProjectId));
    }
    if (toProjectId) {
      conditions.push(eq(projectFundTransfers.toProjectId, toProjectId));
    }
    if (date) {
      conditions.push(eq(projectFundTransfers.transferDate, date));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(projectFundTransfers).where(and(...conditions));
    }
    
    return await db.select().from(projectFundTransfers);
  }

  async getProjectFundTransfer(id: string): Promise<ProjectFundTransfer | undefined> {
    const [transfer] = await db.select().from(projectFundTransfers).where(eq(projectFundTransfers.id, id));
    return transfer || undefined;
  }

  async createProjectFundTransfer(transfer: InsertProjectFundTransfer): Promise<ProjectFundTransfer> {
    try {
      // التحقق من أن المشروعين مختلفين
      if (transfer.fromProjectId === transfer.toProjectId) {
        throw new Error('لا يمكن ترحيل الأموال إلى نفس المشروع');
      }

      // التحقق من وجود المشروعين
      const fromProject = await this.getProject(transfer.fromProjectId);
      const toProject = await this.getProject(transfer.toProjectId);
      
      if (!fromProject) {
        throw new Error('المشروع المرسل غير موجود');
      }
      if (!toProject) {
        throw new Error('المشروع المستلم غير موجود');
      }

      // إنشاء عملية الترحيل
      const [newTransfer] = await db
        .insert(projectFundTransfers)
        .values(transfer)
        .returning();
      
      if (!newTransfer) {
        throw new Error('فشل في إنشاء عملية الترحيل');
      }
      
      // تحديث الملخصات اليومية للمشروعين
      await this.updateDailySummaryForDate(transfer.fromProjectId, transfer.transferDate);
      await this.updateDailySummaryForDate(transfer.toProjectId, transfer.transferDate);
      
      return newTransfer;
    } catch (error) {
      console.error('Error creating project fund transfer:', error);
      throw error;
    }
  }

  async updateProjectFundTransfer(id: string, transfer: Partial<InsertProjectFundTransfer>): Promise<ProjectFundTransfer | undefined> {
    const [oldTransfer] = await db.select().from(projectFundTransfers).where(eq(projectFundTransfers.id, id));
    
    const [updated] = await db
      .update(projectFundTransfers)
      .set(transfer)
      .where(eq(projectFundTransfers.id, id))
      .returning();
    
    if (updated && oldTransfer) {
      // تحديث الملخصات اليومية للمشاريع المتأثرة
      await this.updateDailySummaryForDate(oldTransfer.fromProjectId, oldTransfer.transferDate);
      await this.updateDailySummaryForDate(oldTransfer.toProjectId, oldTransfer.transferDate);
      
      if (transfer.transferDate) {
        await this.updateDailySummaryForDate(updated.fromProjectId, updated.transferDate);
        await this.updateDailySummaryForDate(updated.toProjectId, updated.transferDate);
      }
    }
    
    return updated || undefined;
  }

  async deleteProjectFundTransfer(id: string): Promise<void> {
    const [transfer] = await db.select().from(projectFundTransfers).where(eq(projectFundTransfers.id, id));
    
    await db.delete(projectFundTransfers).where(eq(projectFundTransfers.id, id));
    
    if (transfer) {
      // تحديث الملخصات اليومية للمشروعين
      await this.updateDailySummaryForDate(transfer.fromProjectId, transfer.transferDate);
      await this.updateDailySummaryForDate(transfer.toProjectId, transfer.transferDate);
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
    
    try {
      const [newAttendance] = await db
        .insert(workerAttendance)
        .values(attendanceData)
        .returning();
      
      if (!newAttendance) {
        throw new Error('فشل في حفظ حضور العامل');
      }
      
      // تحديث الملخص اليومي في الخلفية (دون انتظار)
      this.updateDailySummaryForDate(attendance.projectId, attendance.date).catch(console.error);
      
      return newAttendance;
    } catch (error: any) {
      console.error('Error creating worker attendance:', error);
      
      // إذا كان الخطأ متعلق بتكرار الحضور
      if (error.code === '23505' && error.constraint?.includes('unique')) {
        throw new Error('تم تسجيل حضور هذا العامل مسبقاً في هذا التاريخ');
      }
      
      throw error;
    }
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
  async getMaterialPurchases(projectId: string, dateFrom?: string, dateTo?: string, purchaseType?: string): Promise<any[]> {
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
        (() => {
          const conditions = [eq(materialPurchases.projectId, projectId)];
          
          if (dateFrom && dateTo) {
            conditions.push(eq(materialPurchases.purchaseDate, dateFrom));
          }
          
          if (purchaseType) {
            conditions.push(eq(materialPurchases.purchaseType, purchaseType));
          }
          
          return and(...conditions);
        })()
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

  async getMaterialPurchasesWithFilters(filters: {
    supplierId?: string;
    projectId?: string;
    dateFrom?: string;
    dateTo?: string;
    purchaseType?: string;
  }): Promise<any[]> {
    const { supplierId, projectId, dateFrom, dateTo, purchaseType } = filters;
    
    // إنشاء شروط البحث
    const conditions = [];
    
    if (supplierId) {
      // جلب اسم المورد من جدول الموردين
      const supplierData = await db.select({ name: suppliers.name })
        .from(suppliers)
        .where(eq(suppliers.id, supplierId));
      
      const supplierName = supplierData[0]?.name;
      console.log(`🔍 البحث عن المورد: ID=${supplierId}, Name=${supplierName}`);
      
      if (supplierName) {
        // البحث بـ supplierName أولاً (لأن البيانات محفوظة بهذا الشكل)
        conditions.push(eq(materialPurchases.supplierName, supplierName));
        console.log(`✅ إضافة شرط البحث بـ supplierName: ${supplierName}`);
      } else {
        console.log(`❌ لم يتم العثور على اسم المورد للـ ID: ${supplierId}`);
        // في حالة عدم وجود اسم، ابحث بـ supplierId
        conditions.push(eq(materialPurchases.supplierId, supplierId));
      }
    }
    
    if (projectId && projectId !== 'all') {
      conditions.push(eq(materialPurchases.projectId, projectId));
    }
    
    if (dateFrom) {
      conditions.push(gte(materialPurchases.purchaseDate, dateFrom));
    }
    
    if (dateTo) {
      conditions.push(lte(materialPurchases.purchaseDate, dateTo));
    }
    
    if (purchaseType && purchaseType !== 'all') {
      conditions.push(eq(materialPurchases.purchaseType, purchaseType));
    }

    // جلب المشتريات مع معلومات المواد والموردين
    const purchases = await db
      .select({
        id: materialPurchases.id,
        projectId: materialPurchases.projectId,
        materialId: materialPurchases.materialId,
        supplierId: materialPurchases.supplierId,
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
        // إضافة الحقول المالية المطلوبة
        paidAmount: materialPurchases.paidAmount,
        remainingAmount: materialPurchases.remainingAmount,
        dueDate: materialPurchases.dueDate,
        // معلومات المادة
        materialName: materials.name,
        materialCategory: materials.category,
        materialUnit: materials.unit,
        // معلومات المشروع
        projectName: projects.name
      })
      .from(materialPurchases)
      .leftJoin(materials, eq(materialPurchases.materialId, materials.id))
      .leftJoin(projects, eq(materialPurchases.projectId, projects.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(materialPurchases.createdAt);
      
    console.log(`📊 استعلم قاعدة البيانات وحصل على ${purchases.length} مشترى`);

    console.log(`🔍 إرجاع ${purchases.length} مشترى بعد التطبيق الفلاتر`);
    
    return purchases.map(purchase => ({
      id: purchase.id,
      projectId: purchase.projectId,
      materialId: purchase.materialId,
      supplierId: purchase.supplierId,
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
      // إضافة الحقول المفقودة بقيم افتراضية
      paidAmount: purchase.paidAmount || "0",
      remainingAmount: purchase.remainingAmount || "0",
      dueDate: purchase.dueDate || null,
      material: {
        id: purchase.materialId,
        name: purchase.materialName,
        category: purchase.materialCategory,
        unit: purchase.materialUnit
      },
      project: {
        name: purchase.projectName
      }
    }));
  }

  async getMaterialPurchasesDateRange(): Promise<{ minDate: string; maxDate: string }> {
    const result = await db
      .select({
        minDate: sql<string>`MIN(${materialPurchases.purchaseDate})`,
        maxDate: sql<string>`MAX(${materialPurchases.purchaseDate})`
      })
      .from(materialPurchases);

    return {
      minDate: result[0]?.minDate || new Date().toISOString().split('T')[0],
      maxDate: result[0]?.maxDate || new Date().toISOString().split('T')[0]
    };
  }

  async getMaterialPurchaseById(id: string): Promise<MaterialPurchase | null> {
    const [purchase] = await db.select().from(materialPurchases).where(eq(materialPurchases.id, id));
    return purchase || null;
  }

  async createMaterialPurchase(purchase: InsertMaterialPurchase): Promise<MaterialPurchase> {
    // تحويل الأرقام إلى strings حسب schema
    const purchaseData = {
      ...purchase,
      quantity: purchase.quantity.toString(),
      unitPrice: purchase.unitPrice.toString(),
      totalAmount: purchase.totalAmount.toString(),
      paidAmount: purchase.paidAmount.toString(),
      remainingAmount: purchase.remainingAmount.toString()
    };
    
    const [newPurchase] = await db
      .insert(materialPurchases)
      .values(purchaseData)
      .returning();
    
    // تحديث الملخص اليومي في الخلفية (دون انتظار) لتحسين الأداء
    setImmediate(() => {
      this.updateDailySummaryForDate(purchase.projectId, purchase.purchaseDate)
        .catch(error => console.error("Error updating daily summary:", error));
    });
    
    return newPurchase;
  }

  async updateMaterialPurchase(id: string, purchase: Partial<InsertMaterialPurchase>): Promise<MaterialPurchase | undefined> {
    // تحويل الأرقام إلى strings إذا كانت موجودة
    const purchaseData: any = { ...purchase };
    if (purchaseData.quantity !== undefined) purchaseData.quantity = purchaseData.quantity.toString();
    if (purchaseData.unitPrice !== undefined) purchaseData.unitPrice = purchaseData.unitPrice.toString();
    if (purchaseData.totalAmount !== undefined) purchaseData.totalAmount = purchaseData.totalAmount.toString();
    if (purchaseData.paidAmount !== undefined) purchaseData.paidAmount = purchaseData.paidAmount.toString();
    if (purchaseData.remainingAmount !== undefined) purchaseData.remainingAmount = purchaseData.remainingAmount.toString();
    
    const [updated] = await db
      .update(materialPurchases)
      .set(purchaseData)
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

  async getLatestDailySummary(projectId: string): Promise<DailyExpenseSummary | undefined> {
    const [summary] = await db.select().from(dailyExpenseSummaries)
      .where(eq(dailyExpenseSummaries.projectId, projectId))
      .orderBy(sql`${dailyExpenseSummaries.date} DESC`)
      .limit(1);
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

  // تحديث الملخص اليومي تلقائياً مع تحسينات الأداء المحسنة
  async updateDailySummaryForDate(projectId: string, date: string): Promise<void> {
    try {
      // إزالة الملخصات المكررة في الخلفية لتحسين الأداء
      setImmediate(() => {
        this.removeDuplicateSummaries(projectId, date).catch(console.error);
      });
      
      // تشغيل جميع الاستعلامات بشكل متوازي لتحسين الأداء
      const [
        fundTransfers,
        projectTransfers,
        workerAttendanceRecords,
        materialPurchases,
        transportationExpenses,
        workerTransfers,
        workerMiscExpenses,
        carriedForwardAmount
      ] = await Promise.all([
        this.getFundTransfers(projectId, date),
        this.getProjectFundTransfersForDate(projectId, date),
        this.getWorkerAttendance(projectId, date),
        this.getMaterialPurchases(projectId, date), // جلب جميع المشتريات
        this.getTransportationExpenses(projectId, date),
        this.getFilteredWorkerTransfers(projectId, date),
        this.getWorkerMiscExpenses(projectId, date),
        this.getPreviousDayBalance(projectId, date).then(balance => parseFloat(balance))
      ]);

      const totalFundTransfers = fundTransfers.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      // حساب عمليات ترحيل الأموال منفصلة (الواردة والصادرة)
      const incomingTransfers = projectTransfers.filter(t => t.toProjectId === projectId).reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const outgoingTransfers = projectTransfers.filter(t => t.fromProjectId === projectId).reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      // استخدام المبلغ المدفوع بدلاً من إجمالي الأجر اليومي
      const totalWorkerWages = workerAttendanceRecords.reduce((sum, a) => sum + parseFloat(a.paidAmount || '0'), 0);
      // فقط المشتريات النقدية تُحسب في مصروفات اليوم - المشتريات الآجلة لا تُحسب
      const totalMaterialCosts = materialPurchases
        .filter(p => p.purchaseType === "نقد")
        .reduce((sum, p) => sum + parseFloat(p.totalAmount), 0);
      const totalTransportationCosts = transportationExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const totalWorkerTransferCosts = workerTransfers.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalWorkerMiscCosts = workerMiscExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

      // للملخص اليومي: التحويلات الصادرة لا تُحسب كمصروف، بل كحركة مالية منفصلة
      const netProjectTransfers = incomingTransfers - outgoingTransfers;
      const totalIncome = carriedForwardAmount + totalFundTransfers + netProjectTransfers;
      const totalExpenses = totalWorkerWages + totalMaterialCosts + totalTransportationCosts + totalWorkerTransferCosts + totalWorkerMiscCosts;
      const remainingBalance = totalIncome - totalExpenses;

      // معلومات مختصرة للتشخيص
      console.log(`📊 ${date}: Income=${totalIncome}, Expenses=${totalExpenses}, Balance=${remainingBalance}`);
      
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
      
      // تم تحديث الملخص بنجاح
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
      // استخدام actualWage بدلاً من dailyWage لضمان الدقة في الأجور الجزئية
      totalEarned += parseFloat(record.actualWage || '0');
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
    worker: Worker | null;
    attendance: any[];
    transfers: WorkerTransfer[];
    balance: WorkerBalance | null;
    summary: {
      totalWorkDays: number;
      totalWagesEarned: number;
      totalPaidAmount: number;
      totalTransfers: number;
      remainingBalance: number;
    };
  }> {
    try {
      // جلب بيانات العامل
      const [worker] = await db.select().from(workers).where(eq(workers.id, workerId));
      
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
      
      const attendanceData = await db.select().from(workerAttendance)
        .where(and(...attendanceConditions))
        .orderBy(workerAttendance.date);

      // جلب بيانات المشاريع المرتبطة بالحضور
      const projectsMap = new Map();
      const uniqueProjectIds = Array.from(new Set(attendanceData.map(record => record.projectId)));
      
      for (const pId of uniqueProjectIds) {
        const [project] = await db.select().from(projects).where(eq(projects.id, pId));
        if (project) {
          projectsMap.set(pId, project);
        }
      }
      
      // دمج بيانات الحضور مع بيانات المشروع
      const attendance = attendanceData.map((record: any) => ({
        ...record,
        project: projectsMap.get(record.projectId) || null
      }));
      
      // Get worker transfers (including family transfers)
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
      
      // Get worker balance (calculated dynamically to include all transfers)
      let balance: WorkerBalance | null = null;
      if (projectId) {
        const workerBalance = await this.getWorkerBalance(workerId, projectId);
        balance = workerBalance || null;
      }
      
      // حساب الإحصائيات الإجمالية
      const totalWorkDays = attendance.reduce((sum, record) => sum + (Number(record.workDays) || 1), 0);
      const totalWagesEarned = attendance.reduce((sum, record) => {
        const dailyWage = Number(record.dailyWage) || Number(worker?.dailyWage) || 0;
        const workDays = Number(record.workDays) || 1;
        return sum + (dailyWage * workDays);
      }, 0);
      const totalPaidAmount = attendance.reduce((sum, record) => sum + (Number(record.paidAmount) || 0), 0);
      const totalTransfers = transfers.reduce((sum, transfer) => sum + (Number(transfer.amount) || 0), 0);
      const remainingBalance = totalWagesEarned - totalPaidAmount;

      const summary = {
        totalWorkDays,
        totalWagesEarned,
        totalPaidAmount,
        totalTransfers,
        remainingBalance
      };

      return {
        worker,
        attendance,
        transfers, // This now includes all transfers including family transfers
        balance,
        summary
      };
    } catch (error) {
      console.error('Error getting worker account statement:', error);
      return {
        worker: null,
        attendance: [],
        transfers: [],
        balance: null,
        summary: {
          totalWorkDays: 0,
          totalWagesEarned: 0,
          totalPaidAmount: 0,
          totalTransfers: 0,
          remainingBalance: 0
        }
      };
    }
  }

  // دالة جديدة لجلب كشف حساب العامل من مشاريع متعددة
  async getWorkerAccountStatementMultipleProjects(workerId: string, projectIds: string[], dateFrom?: string, dateTo?: string): Promise<{
    worker: Worker | null;
    attendance: any[];
    transfers: WorkerTransfer[];
    balance: WorkerBalance | null;
    projectsInfo: { projectId: string; projectName: string }[];
  }> {
    try {
      // جلب معلومات المشاريع
      const projectsInfo = await Promise.all(
        projectIds.map(async (projectId) => {
          const project = await this.getProject(projectId);
          return {
            projectId,
            projectName: project?.name || `مشروع ${projectId}`
          };
        })
      );

      // جلب الحضور من المشاريع المحددة
      let attendanceConditions = [
        eq(workerAttendance.workerId, workerId),
        inArray(workerAttendance.projectId, projectIds)
      ];
      
      if (dateFrom) {
        attendanceConditions.push(gte(workerAttendance.date, dateFrom));
      }
      
      if (dateTo) {
        attendanceConditions.push(lte(workerAttendance.date, dateTo));
      }
      
      const attendanceData = await db.select().from(workerAttendance)
        .where(and(...attendanceConditions))
        .orderBy(workerAttendance.date);
      
      // إضافة بيانات المشروع لكل سجل حضور
      const projectsMap = new Map();
      for (const projectId of projectIds) {
        const project = await this.getProject(projectId);
        if (project) {
          projectsMap.set(projectId, project);
        }
      }
      
      // دمج بيانات الحضور مع بيانات المشروع
      const attendance = attendanceData.map((record: any) => ({
        ...record,
        project: projectsMap.get(record.projectId) || null
      }));
      
      // جلب التحويلات من المشاريع المحددة
      let transfersConditions = [
        eq(workerTransfers.workerId, workerId),
        inArray(workerTransfers.projectId, projectIds)
      ];
      
      if (dateFrom) {
        transfersConditions.push(gte(workerTransfers.transferDate, dateFrom));
      }
      
      if (dateTo) {
        transfersConditions.push(lte(workerTransfers.transferDate, dateTo));
      }
      
      const transfers = await db.select().from(workerTransfers)
        .where(and(...transfersConditions))
        .orderBy(workerTransfers.transferDate);
      
      // حساب الرصيد الإجمالي من جميع المشاريع
      let totalBalance = 0;
      for (const projectId of projectIds) {
        const workerBalance = await this.getWorkerBalance(workerId, projectId);
        if (workerBalance) {
          totalBalance += parseFloat(workerBalance.currentBalance);
        }
      }
      
      const balance: WorkerBalance = {
        id: `multi-${workerId}`,
        createdAt: new Date(),
        workerId,
        projectId: projectIds[0], // المشروع الأول كمرجع
        totalEarned: "0",
        totalPaid: "0", 
        totalTransferred: "0",
        currentBalance: totalBalance.toString(),
        lastUpdated: new Date()
      };
      
      // جلب بيانات العامل
      const [worker] = await db.select().from(workers).where(eq(workers.id, workerId));
      
      return {
        worker,
        attendance,
        transfers,
        balance,
        projectsInfo
      };
    } catch (error) {
      console.error('Error getting worker account statement for multiple projects:', error);
      return {
        worker: null,
        attendance: [],
        transfers: [],
        balance: null,
        projectsInfo: []
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

    try {
      // جلب جميع المشاريع التي عمل بها العامل
      let projectConditions = [eq(workerAttendance.workerId, workerId)];
      
      if (dateFrom) {
        projectConditions.push(gte(workerAttendance.date, dateFrom));
      }
      
      if (dateTo) {
        projectConditions.push(lte(workerAttendance.date, dateTo));
      }
      
      // الحصول على المشاريع المميزة
      const distinctProjects = await db.selectDistinct({ projectId: workerAttendance.projectId })
        .from(workerAttendance)
        .where(and(...projectConditions));
      
      const projectsList = [];
      let totalEarned = 0;
      let totalPaid = 0;
      let totalTransferred = 0;
      let totalBalance = 0;
      
      // لكل مشروع، احسب التفاصيل
      for (const { projectId } of distinctProjects) {
        const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
        if (!project) continue;
        
        // جلب الحضور لهذا المشروع
        let attendanceConditions = [
          eq(workerAttendance.workerId, workerId),
          eq(workerAttendance.projectId, projectId)
        ];
        
        if (dateFrom) {
          attendanceConditions.push(gte(workerAttendance.date, dateFrom));
        }
        
        if (dateTo) {
          attendanceConditions.push(lte(workerAttendance.date, dateTo));
        }
        
        const attendance = await db.select().from(workerAttendance)
          .where(and(...attendanceConditions))
          .orderBy(workerAttendance.date);
        
        // جلب التحويلات لهذا المشروع
        let transfersConditions = [
          eq(workerTransfers.workerId, workerId),
          eq(workerTransfers.projectId, projectId)
        ];
        
        if (dateFrom) {
          transfersConditions.push(gte(workerTransfers.transferDate, dateFrom));
        }
        
        if (dateTo) {
          transfersConditions.push(lte(workerTransfers.transferDate, dateTo));
        }
        
        const transfers = await db.select().from(workerTransfers)
          .where(and(...transfersConditions))
          .orderBy(workerTransfers.transferDate);
        
        // حساب الإحصائيات لهذا المشروع
        const projectEarned = attendance.reduce((sum, record) => {
          const dailyWage = Number(record.dailyWage) || Number(worker.dailyWage) || 0;
          const workDays = Number(record.workDays) || 1;
          return sum + (dailyWage * workDays);
        }, 0);
        
        const projectPaid = attendance.reduce((sum, record) => sum + (Number(record.paidAmount) || 0), 0);
        const projectTransferred = transfers.reduce((sum, transfer) => sum + (Number(transfer.amount) || 0), 0);
        
        const balance = await this.getWorkerBalance(workerId, projectId);
        
        projectsList.push({
          project,
          attendance,
          balance: balance || null,
          transfers
        });
        
        totalEarned += projectEarned;
        totalPaid += projectPaid;
        totalTransferred += projectTransferred;
        totalBalance += balance ? Number(balance.currentBalance) : 0;
      }
      
      return {
        worker,
        projects: projectsList,
        totals: {
          totalEarned: totalEarned.toString(),
          totalPaid: totalPaid.toString(),
          totalTransferred: totalTransferred.toString(),
          totalBalance: totalBalance.toString()
        }
      };
    } catch (error) {
      console.error('Error getting worker multi-project statement:', error);
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
      const worker = await this.getWorker(workerId);
      if (!worker) return [];

      return await db.select().from(fundTransfers)
        .where(and(
          eq(fundTransfers.projectId, projectId),
          sql`DATE(${fundTransfers.transferDate}) >= ${dateFrom}`,
          sql`DATE(${fundTransfers.transferDate}) <= ${dateTo}`,
          or(
            sql`${fundTransfers.senderName} LIKE ${`%${worker.name}%`}`,
            sql`${fundTransfers.notes} LIKE ${`%${worker.name}%`}`
          )
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
      console.log(`🔍 حساب إحصائيات المشروع: ${projectId}`);
      
      // حساب الإحصائيات الكلية الحقيقية من جميع المعاملات
      const [
        workers,
        fundTransfers,
        projectTransfersIn,
        projectTransfersOut,
        attendance,
        materials,
        transport,
        miscExpenses,
        workerTransfers
      ] = await Promise.all([
        // عدد العمال المميزين
        db.execute(sql`
          SELECT COUNT(DISTINCT worker_id) as count
          FROM worker_attendance 
          WHERE project_id = ${projectId}
        `),
        
        // إجمالي تحويلات العهدة
        db.execute(sql`
          SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total
          FROM fund_transfers 
          WHERE project_id = ${projectId}
        `),
        
        // التحويلات الواردة للمشروع
        db.execute(sql`
          SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total
          FROM project_fund_transfers 
          WHERE to_project_id = ${projectId}
        `),
        
        // التحويلات الصادرة من المشروع
        db.execute(sql`
          SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total
          FROM project_fund_transfers 
          WHERE from_project_id = ${projectId}
        `),
        
        // إجمالي المبالغ المدفوعة فعلياً فقط (المبالغ التي تم صرفها فعلاً) والأيام
        db.execute(sql`
          SELECT 
            COALESCE(SUM(CASE WHEN paid_amount > 0 THEN CAST(paid_amount AS DECIMAL) ELSE 0 END), 0) as total_wages,
            COUNT(DISTINCT date) as completed_days
          FROM worker_attendance 
          WHERE project_id = ${projectId}
        `),
        
        // إجمالي مشتريات المواد النقدية فقط (المشتريات الآجلة لا تُحسب)
        db.execute(sql`
          SELECT 
            COALESCE(SUM(CASE WHEN purchase_type = 'نقد' THEN CAST(total_amount AS DECIMAL) ELSE 0 END), 0) as total,
            COUNT(DISTINCT id) as count
          FROM material_purchases 
          WHERE project_id = ${projectId}
        `),
        
        // إجمالي النقل
        db.execute(sql`
          SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total
          FROM transportation_expenses 
          WHERE project_id = ${projectId}
        `),
        
        // مصاريف العمال المتنوعة
        db.execute(sql`
          SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total
          FROM worker_misc_expenses 
          WHERE project_id = ${projectId}
        `),
        
        // حوالات الأهل (من العامل للأهل)
        db.execute(sql`
          SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total
          FROM worker_transfers 
          WHERE project_id = ${projectId}
        `)
      ]);

      // حساب الإجماليات
      const totalWorkers = parseInt((workers.rows[0] as any)?.count || '0');
      const totalFundTransfers = parseFloat((fundTransfers.rows[0] as any)?.total || '0');
      const totalProjectIn = parseFloat((projectTransfersIn.rows[0] as any)?.total || '0');
      const totalProjectOut = parseFloat((projectTransfersOut.rows[0] as any)?.total || '0');
      const totalWages = parseFloat((attendance.rows[0] as any)?.total_wages || '0');
      const completedDays = parseInt((attendance.rows[0] as any)?.completed_days || '0');
      const totalMaterials = parseFloat((materials.rows[0] as any)?.total || '0');
      const materialCount = parseInt((materials.rows[0] as any)?.count || '0');
      const totalTransport = parseFloat((transport.rows[0] as any)?.total || '0');
      const totalMisc = parseFloat((miscExpenses.rows[0] as any)?.total || '0');
      const totalWorkerTransfers = parseFloat((workerTransfers.rows[0] as any)?.total || '0');

      // تسجيل القيم للتأكد من صحة البيانات
      console.log(`📊 تفاصيل الحسابات للمشروع ${projectId}:`);
      console.log(`   💰 تحويلات العهدة: ${totalFundTransfers}`);
      console.log(`   📈 تحويلات واردة: ${totalProjectIn}`);
      console.log(`   📉 تحويلات صادرة: ${totalProjectOut}`);
      console.log(`   👷 أجور العمال المدفوعة فعلياً: ${totalWages}`);
      console.log(`   🏗️  مشتريات المواد (نقدية فقط): ${totalMaterials}`);
      console.log(`   🚚 النقل: ${totalTransport}`);
      console.log(`   📋 مصاريف متنوعة: ${totalMisc}`);
      console.log(`   💸 حوالات الأهل: ${totalWorkerTransfers}`);
      console.log(`   📤 تحويلات صادرة: ${totalProjectOut}`);

      // الإجمالي الكلي للدخل والمصروفات - مع تصحيح منطق التحويلات الصادرة
      const totalIncome = totalFundTransfers + totalProjectIn;
      const totalExpenses = totalWages + totalMaterials + totalTransport + totalMisc + totalWorkerTransfers + totalProjectOut;
      // ملاحظة: التحويلات الصادرة تُحسب كمصروف لأنها أموال تخرج من المشروع
      // حوالات الأهل أيضاً تُحسب كمصروف لأنها أموال تخرج من المشروع نهائياً
      const currentBalance = totalIncome - totalExpenses;

      console.log(`   📊 إجمالي الدخل: ${totalIncome}`);
      console.log(`   📊 إجمالي المصاريف (شاملة التحويلات): ${totalExpenses}`);
      console.log(`   📊 الرصيد النهائي: ${currentBalance}`);
      
      // التحقق من أن البيانات منطقية
      if (isNaN(currentBalance) || !isFinite(currentBalance)) {
        console.error('⚠️  خطأ في حساب الرصيد - قيمة غير منطقية');
        throw new Error('خطأ في حساب الرصيد المالي');
      }

      const result = {
        totalWorkers: totalWorkers,
        totalExpenses: Math.round(totalExpenses * 100) / 100, // المصاريف الحقيقية فقط (بدون التحويلات)
        totalIncome: Math.round(totalIncome * 100) / 100,
        currentBalance: Math.round(currentBalance * 100) / 100,
        activeWorkers: totalWorkers, // نفترض أن جميع العمال نشطين
        completedDays: completedDays,
        materialPurchases: materialCount,
        lastActivity: new Date().toISOString().split('T')[0]
      };

      console.log(`✅ تم حساب الإحصائيات بنجاح - الرصيد النهائي: ${result.currentBalance}`);
      return result;

    } catch (error) {
      console.error('❌ خطأ في حساب إحصائيات المشروع:', error);
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

  // Autocomplete data methods - محسنة مع حدود وذاكرة تخزين مؤقت
  async getAutocompleteData(category: string, limit: number = 50): Promise<AutocompleteData[]> {
    try {
      return await db
        .select()
        .from(autocompleteData)
        .where(eq(autocompleteData.category, category))
        .orderBy(sql`${autocompleteData.usageCount} DESC, ${autocompleteData.lastUsed} DESC`)
        .limit(limit);
    } catch (error) {
      console.error('Error getting autocomplete data:', error);
      return [];
    }
  }

  async saveAutocompleteData(data: InsertAutocompleteData): Promise<AutocompleteData> {
    try {
      const trimmedValue = data.value.trim();
      
      // تحقق من صحة البيانات
      if (!trimmedValue || trimmedValue.length < 2) {
        throw new Error('قيمة الإكمال التلقائي يجب أن تكون على الأقل حرفين');
      }

      // تحقق من وجود القيمة مسبقاً
      const existing = await db
        .select()
        .from(autocompleteData)
        .where(and(
          eq(autocompleteData.category, data.category),
          eq(autocompleteData.value, trimmedValue)
        ))
        .limit(1);

      if (existing.length > 0) {
        // إذا كانت موجودة، قم بتحديث عدد الاستخدام وتاريخ آخر استخدام
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
        // تحقق من عدم تجاوز الحد الأقصى للسجلات في هذه الفئة
        await this.enforceCategoryLimit(data.category);

        // إنشاء سجل جديد
        const [created] = await db
          .insert(autocompleteData)
          .values({
            ...data,
            value: trimmedValue
          })
          .returning();
        
        return created;
      }
    } catch (error) {
      console.error('Error saving autocomplete data:', error);
      throw error;
    }
  }

  // طريقة جديدة لفرض حدود الفئة
  private async enforceCategoryLimit(category: string, maxRecords: number = 100): Promise<void> {
    try {
      // عد السجلات الحالية في هذه الفئة
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(autocompleteData)
        .where(eq(autocompleteData.category, category));

      const currentCount = countResult[0]?.count || 0;

      if (currentCount >= maxRecords) {
        // حذف أقل السجلات استخداماً
        const recordsToDelete = await db
          .select({ id: autocompleteData.id })
          .from(autocompleteData)
          .where(eq(autocompleteData.category, category))
          .orderBy(sql`${autocompleteData.usageCount} ASC, ${autocompleteData.lastUsed} ASC`)
          .limit(currentCount - maxRecords + 1);

        if (recordsToDelete.length > 0) {
          await db
            .delete(autocompleteData)
            .where(
              sql`id IN (${recordsToDelete.map(r => `'${r.id}'`).join(',')})`
            );
        }
      }
    } catch (error) {
      console.error('Error enforcing category limit:', error);
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

  async getDailyExpensesRange(projectId: string, dateFrom: string, dateTo: string): Promise<any[]> {
    try {
      const startDate = new Date(dateFrom);
      const endDate = new Date(dateTo);
      const results = [];

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const currentDate = d.toISOString().split('T')[0];
        
        let dailySummary = await this.getDailyExpenseSummary(projectId, currentDate);
        
        if (!dailySummary) {
          await this.updateDailySummaryForDate(projectId, currentDate);
          dailySummary = await this.getDailyExpenseSummary(projectId, currentDate);
        }

        if (dailySummary) {
          const [
            fundTransfers,
            workerAttendance,
            materialPurchases,
            transportationExpenses,
            workerTransfers,
            workerMiscExpenses
          ] = await Promise.all([
            this.getFundTransfers(projectId, currentDate),
            this.getWorkerAttendance(projectId, currentDate),
            this.getMaterialPurchases(projectId, currentDate, currentDate),
            this.getTransportationExpenses(projectId, currentDate),
            this.getWorkerTransfers("", projectId).then(transfers => 
              transfers.filter(t => t.transferDate === currentDate)
            ),
            this.getWorkerMiscExpenses(projectId, currentDate)
          ]);

          // حساب إجمالي نثريات العمال
          const totalWorkerMiscExpenses = workerMiscExpenses?.reduce((sum, expense) => sum + parseFloat(expense.amount), 0) || 0;

          results.push({
            date: currentDate,
            summary: {
              carriedForward: parseFloat(dailySummary.carriedForwardAmount),
              totalIncome: parseFloat(dailySummary.totalIncome),
              totalExpenses: parseFloat(dailySummary.totalExpenses),
              remainingBalance: parseFloat(dailySummary.remainingBalance),
              totalFundTransfers: parseFloat(dailySummary.totalFundTransfers),
              totalWorkerWages: parseFloat(dailySummary.totalWorkerWages),
              totalMaterialCosts: parseFloat(dailySummary.totalMaterialCosts),
              totalTransportationCosts: parseFloat(dailySummary.totalTransportationCosts),
              totalWorkerTransfers: workerTransfers?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0,
              totalWorkerMiscExpenses: totalWorkerMiscExpenses
            },
            fundTransfers,
            workerAttendance,
            materialPurchases,
            transportationExpenses,
            workerTransfers,
            workerMiscExpenses
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error getting daily expenses range:', error);
      return [];
    }
  }

  // Worker miscellaneous expenses methods
  async getWorkerMiscExpenses(projectId: string, date?: string): Promise<WorkerMiscExpense[]> {
    try {
      if (date) {
        return await db.select().from(workerMiscExpenses)
          .where(and(eq(workerMiscExpenses.projectId, projectId), eq(workerMiscExpenses.date, date)))
          .orderBy(workerMiscExpenses.createdAt);
      } else {
        return await db.select().from(workerMiscExpenses)
          .where(eq(workerMiscExpenses.projectId, projectId))
          .orderBy(workerMiscExpenses.date, workerMiscExpenses.createdAt);
      }
    } catch (error) {
      console.error('Error getting worker misc expenses:', error);
      return [];
    }
  }

  async getWorkerMiscExpense(id: string): Promise<WorkerMiscExpense | null> {
    try {
      const [expense] = await db.select().from(workerMiscExpenses).where(eq(workerMiscExpenses.id, id));
      return expense || null;
    } catch (error) {
      console.error('Error getting worker misc expense:', error);
      return null;
    }
  }

  async createWorkerMiscExpense(expense: InsertWorkerMiscExpense): Promise<WorkerMiscExpense> {
    try {
      const [newExpense] = await db
        .insert(workerMiscExpenses)
        .values(expense)
        .returning();
      return newExpense;
    } catch (error) {
      console.error('Error creating worker misc expense:', error);
      throw error;
    }
  }

  async updateWorkerMiscExpense(id: string, expense: Partial<InsertWorkerMiscExpense>): Promise<WorkerMiscExpense | undefined> {
    try {
      const [updated] = await db
        .update(workerMiscExpenses)
        .set(expense)
        .where(eq(workerMiscExpenses.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating worker misc expense:', error);
      throw error;
    }
  }

  async deleteWorkerMiscExpense(id: string): Promise<void> {
    try {
      await db.delete(workerMiscExpenses).where(eq(workerMiscExpenses.id, id));
    } catch (error) {
      console.error('Error deleting worker misc expense:', error);
      throw error;
    }
  }

  // Advanced Reports
  async getExpensesForReport(projectId: string, dateFrom: string, dateTo: string): Promise<any[]> {
    // جلب جميع المصروفات من مصادر مختلفة
    const expenses: any[] = [];

    // 1. أجور العمال المدفوعة فعلياً فقط
    const workerWages = await db.select({
      id: workerAttendance.id,
      projectId: workerAttendance.projectId,
      date: workerAttendance.date,
      category: sql`'عمالة'`.as('category'),
      subcategory: workers.type,
      description: workers.name,
      amount: workerAttendance.paidAmount,
      vendor: sql`NULL`.as('vendor'),
      notes: sql`NULL`.as('notes'),
      type: sql`'wages'`.as('type')
    })
    .from(workerAttendance)
    .leftJoin(workers, eq(workerAttendance.workerId, workers.id))
    .where(and(
      eq(workerAttendance.projectId, projectId),
      gte(workerAttendance.date, dateFrom),
      lte(workerAttendance.date, dateTo),
      eq(workerAttendance.isPresent, true),
      gt(workerAttendance.paidAmount, "0") // فقط الأجور المدفوعة
    ));

    // 2. مشتريات المواد (النقدية فقط - المشتريات الآجلة لا تُحسب كمصروفات)
    const materialPurchasesData = await db.select({
      id: materialPurchases.id,
      projectId: materialPurchases.projectId,
      date: materialPurchases.purchaseDate,
      category: sql`'مشتريات'`.as('category'),
      subcategory: materialPurchases.purchaseType, // نوع الدفع كفئة فرعية
      description: materials.name,
      amount: materialPurchases.totalAmount,
      vendor: materialPurchases.supplierName,
      notes: materialPurchases.notes,
      type: sql`'materials'`.as('type')
    })
    .from(materialPurchases)
    .leftJoin(materials, eq(materialPurchases.materialId, materials.id))
    .where(and(
      eq(materialPurchases.projectId, projectId),
      gte(materialPurchases.purchaseDate, dateFrom),
      lte(materialPurchases.purchaseDate, dateTo),
      eq(materialPurchases.purchaseType, 'نقد') // فقط المشتريات النقدية تُحسب كمصروفات
    ));

    // 3. مصروفات النقل
    const transportExpenses = await db.select({
      id: transportationExpenses.id,
      projectId: transportationExpenses.projectId,
      date: transportationExpenses.date,
      category: sql`'مواصلات'`.as('category'),
      subcategory: sql`'أجور نقل'`.as('subcategory'),
      description: transportationExpenses.description,
      amount: transportationExpenses.amount,
      vendor: sql`NULL`.as('vendor'),
      notes: transportationExpenses.notes,
      type: sql`'transport'`.as('type')
    })
    .from(transportationExpenses)
    .where(and(
      eq(transportationExpenses.projectId, projectId),
      gte(transportationExpenses.date, dateFrom),
      lte(transportationExpenses.date, dateTo)
    ));

    // 4. تحويلات العمال
    const workerTransfersExp = await db.select({
      id: workerTransfers.id,
      projectId: workerTransfers.projectId,
      date: workerTransfers.transferDate,
      category: sql`'تحويلات عمال'`.as('category'),
      subcategory: sql`'تحويل'`.as('subcategory'),
      description: workers.name,
      amount: workerTransfers.amount,
      vendor: sql`NULL`.as('vendor'),
      notes: workerTransfers.notes,
      type: sql`'worker_transfers'`.as('type')
    })
    .from(workerTransfers)
    .leftJoin(workers, eq(workerTransfers.workerId, workers.id))
    .where(and(
      eq(workerTransfers.projectId, projectId),
      gte(workerTransfers.transferDate, dateFrom),
      lte(workerTransfers.transferDate, dateTo)
    ));

    // 5. نثريات العمال
    const workerMiscExp = await db.select({
      id: workerMiscExpenses.id,
      projectId: workerMiscExpenses.projectId,
      date: workerMiscExpenses.date,
      category: sql`'نثريات'`.as('category'),
      subcategory: sql`'نثريات عمال'`.as('subcategory'),
      description: workerMiscExpenses.description,
      amount: workerMiscExpenses.amount,
      vendor: sql`NULL`.as('vendor'),
      notes: workerMiscExpenses.notes,
      type: sql`'misc'`.as('type')
    })
    .from(workerMiscExpenses)
    .where(and(
      eq(workerMiscExpenses.projectId, projectId),
      gte(workerMiscExpenses.date, dateFrom),
      lte(workerMiscExpenses.date, dateTo)
    ));

    // دمج جميع المصروفات
    expenses.push(...workerWages, ...materialPurchasesData, ...transportExpenses, ...workerTransfersExp, ...workerMiscExp);

    // إضافة اسم المشروع لكل سجل
    const project = await this.getProject(projectId);
    const projectName = project?.name || 'غير محدد';

    return expenses.map(expense => ({
      ...expense,
      projectName,
      amount: parseFloat(expense.amount?.toString() || '0'),
      category: expense.category || 'غير محدد',
      subcategory: expense.subcategory || '',
      description: expense.description || '',
      vendor: expense.vendor || '',
      notes: expense.notes || ''
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getIncomeForReport(projectId: string, dateFrom: string, dateTo: string): Promise<any[]> {
    // جلب تحويلات العهدة (الإيرادات)
    const income = await db.select({
      id: fundTransfers.id,
      projectId: fundTransfers.projectId,
      date: fundTransfers.transferDate,
      transferNumber: fundTransfers.transferNumber,
      senderName: fundTransfers.senderName,
      transferType: fundTransfers.transferType,
      amount: fundTransfers.amount,
      notes: fundTransfers.notes
    })
    .from(fundTransfers)
    .where(and(
      eq(fundTransfers.projectId, projectId),
      gte(sql`date(${fundTransfers.transferDate})`, dateFrom),
      lte(sql`date(${fundTransfers.transferDate})`, dateTo)
    ))
    .orderBy(fundTransfers.transferDate);

    // إضافة اسم المشروع
    const project = await this.getProject(projectId);
    const projectName = project?.name || 'غير محدد';

    return income.map(inc => ({
      ...inc,
      projectName,
      amount: parseFloat(inc.amount?.toString() || '0'),
      transferNumber: inc.transferNumber || 'غير محدد',
      senderName: inc.senderName || 'غير محدد',
      transferType: inc.transferType || 'حوالة عادية',
      notes: inc.notes || ''
    }));
  }

  // Users methods
  async getUsers(): Promise<User[]> {
    try {
      return await db.select().from(users).orderBy(users.createdAt);
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user || undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const [newUser] = await db
        .insert(users)
        .values({
          ...user,
          updatedAt: new Date()
        })
        .returning();
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const [updated] = await db
        .update(users)
        .set({
          ...user,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await db.delete(users).where(eq(users.id, id));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Suppliers methods
  async getSuppliers(): Promise<Supplier[]> {
    try {
      return await db.select({
        id: suppliers.id,
        name: suppliers.name,
        contactPerson: suppliers.contactPerson,
        phone: suppliers.phone,
        address: suppliers.address,
        paymentTerms: suppliers.paymentTerms,
        totalDebt: suppliers.totalDebt,
        notes: suppliers.notes,
        isActive: suppliers.isActive,
        createdAt: suppliers.createdAt,
      }).from(suppliers).orderBy(suppliers.name);
    } catch (error) {
      console.error('Error getting suppliers:', error);
      return [];
    }
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    try {
      const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
      return supplier || undefined;
    } catch (error) {
      console.error('Error getting supplier:', error);
      return undefined;
    }
  }

  async getSupplierByName(name: string): Promise<Supplier | undefined> {
    try {
      const [supplier] = await db.select().from(suppliers).where(eq(suppliers.name, name));
      return supplier || undefined;
    } catch (error) {
      console.error('Error getting supplier by name:', error);
      return undefined;
    }
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    try {
      // إنشاء كائن البيانات مع تحديد صريح للحقول
      const supplierData = {
        name: supplier.name,
        contactPerson: supplier.contactPerson || null,
        phone: supplier.phone || null,
        address: supplier.address || null,
        paymentTerms: supplier.paymentTerms || "نقد",
        totalDebt: supplier.totalDebt || '0',
        isActive: supplier.isActive !== undefined ? supplier.isActive : true,
        notes: supplier.notes || null
      };
      
      console.log('Creating supplier with data:', supplierData);
      
      const [newSupplier] = await db
        .insert(suppliers)
        .values(supplierData)
        .returning();
      return newSupplier;
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    try {
      const [updated] = await db
        .update(suppliers)
        .set(supplier)
        .where(eq(suppliers.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  }

  async deleteSupplier(id: string): Promise<void> {
    try {
      await db.delete(suppliers).where(eq(suppliers.id, id));
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  }

  // Supplier Payments methods
  async getSupplierPayments(supplierId: string, projectId?: string): Promise<SupplierPayment[]> {
    try {
      const conditions = [eq(supplierPayments.supplierId, supplierId)];
      if (projectId) {
        conditions.push(eq(supplierPayments.projectId, projectId));
      }
      
      return await db.select().from(supplierPayments)
        .where(and(...conditions))
        .orderBy(supplierPayments.paymentDate);
    } catch (error) {
      console.error('Error getting supplier payments:', error);
      return [];
    }
  }

  async getSupplierPayment(id: string): Promise<SupplierPayment | undefined> {
    try {
      const [payment] = await db.select().from(supplierPayments).where(eq(supplierPayments.id, id));
      return payment || undefined;
    } catch (error) {
      console.error('Error getting supplier payment:', error);
      return undefined;
    }
  }

  async createSupplierPayment(payment: InsertSupplierPayment): Promise<SupplierPayment> {
    try {
      const [newPayment] = await db
        .insert(supplierPayments)
        .values(payment)
        .returning();
      return newPayment;
    } catch (error) {
      console.error('Error creating supplier payment:', error);
      throw error;
    }
  }

  async updateSupplierPayment(id: string, payment: Partial<InsertSupplierPayment>): Promise<SupplierPayment | undefined> {
    try {
      const [updated] = await db
        .update(supplierPayments)
        .set(payment)
        .where(eq(supplierPayments.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating supplier payment:', error);
      throw error;
    }
  }

  async deleteSupplierPayment(id: string): Promise<void> {
    try {
      await db.delete(supplierPayments).where(eq(supplierPayments.id, id));
    } catch (error) {
      console.error('Error deleting supplier payment:', error);
      throw error;
    }
  }

  // Supplier Reports methods
  async getSupplierAccountStatement(supplierId: string, projectId?: string, dateFrom?: string, dateTo?: string): Promise<{
    supplier: Supplier;
    purchases: MaterialPurchase[];
    payments: SupplierPayment[];
    totalDebt: string;
    totalPaid: string;
    remainingDebt: string;
  }> {
    try {
      // جلب بيانات المورد
      const supplier = await this.getSupplier(supplierId);
      if (!supplier) {
        throw new Error('المورد غير موجود');
      }

      // شروط التصفية
      const purchaseConditions = [eq(materialPurchases.supplierId, supplierId)];
      const paymentConditions = [eq(supplierPayments.supplierId, supplierId)];
      
      if (projectId) {
        purchaseConditions.push(eq(materialPurchases.projectId, projectId));
        paymentConditions.push(eq(supplierPayments.projectId, projectId));
      }
      
      if (dateFrom && dateTo) {
        purchaseConditions.push(
          gte(materialPurchases.invoiceDate, dateFrom),
          lte(materialPurchases.invoiceDate, dateTo)
        );
        paymentConditions.push(
          gte(supplierPayments.paymentDate, dateFrom),
          lte(supplierPayments.paymentDate, dateTo)
        );
      }

      // جلب المشتريات
      const purchases = await db.select().from(materialPurchases)
        .where(and(...purchaseConditions))
        .orderBy(materialPurchases.invoiceDate);

      // جلب المدفوعات
      const payments = await db.select().from(supplierPayments)
        .where(and(...paymentConditions))
        .orderBy(supplierPayments.paymentDate);

      // حساب الإجماليات
      const totalDebt = purchases.reduce((sum, purchase) => 
        sum + parseFloat(purchase.totalAmount || '0'), 0);
      const totalPaid = payments.reduce((sum, payment) => 
        sum + parseFloat(payment.amount || '0'), 0);
      const remainingDebt = totalDebt - totalPaid;

      return {
        supplier,
        purchases,
        payments,
        totalDebt: totalDebt.toString(),
        totalPaid: totalPaid.toString(),
        remainingDebt: remainingDebt.toString()
      };
    } catch (error) {
      console.error('Error getting supplier account statement:', error);
      throw error;
    }
  }

  async getPurchasesBySupplier(supplierId: string, purchaseType?: string, dateFrom?: string, dateTo?: string): Promise<MaterialPurchase[]> {
    try {
      const conditions = [eq(materialPurchases.supplierId, supplierId)];
      
      if (purchaseType) {
        conditions.push(eq(materialPurchases.purchaseType, purchaseType));
      }
      
      if (dateFrom && dateTo) {
        conditions.push(
          gte(materialPurchases.invoiceDate, dateFrom),
          lte(materialPurchases.invoiceDate, dateTo)
        );
      }

      return await db.select().from(materialPurchases)
        .where(and(...conditions))
        .orderBy(materialPurchases.invoiceDate);
    } catch (error) {
      console.error('Error getting purchases by supplier:', error);
      return [];
    }
  }

  // Print Settings Methods
  async getPrintSettings(reportType?: string, userId?: string): Promise<PrintSettings[]> {
    try {
      const conditions = [];
      
      if (reportType) {
        conditions.push(eq(printSettings.reportType, reportType));
      }
      
      if (userId) {
        conditions.push(eq(printSettings.userId, userId));
      }
      
      return await db.select().from(printSettings)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(printSettings.createdAt);
    } catch (error) {
      console.error('Error getting print settings:', error);
      return [];
    }
  }

  async getPrintSettingsById(id: string): Promise<PrintSettings | undefined> {
    try {
      const [settings] = await db.select().from(printSettings).where(eq(printSettings.id, id));
      return settings || undefined;
    } catch (error) {
      console.error('Error getting print settings by id:', error);
      return undefined;
    }
  }

  async createPrintSettings(settings: InsertPrintSettings): Promise<PrintSettings> {
    try {
      const [newSettings] = await db
        .insert(printSettings)
        .values(settings)
        .returning();
      return newSettings;
    } catch (error) {
      console.error('Error creating print settings:', error);
      throw error;
    }
  }

  async updatePrintSettings(id: string, settings: Partial<InsertPrintSettings>): Promise<PrintSettings | undefined> {
    try {
      const [updated] = await db
        .update(printSettings)
        .set(settings)
        .where(eq(printSettings.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating print settings:', error);
      throw error;
    }
  }

  async deletePrintSettings(id: string): Promise<void> {
    try {
      await db.delete(printSettings).where(eq(printSettings.id, id));
    } catch (error) {
      console.error('Error deleting print settings:', error);
      throw error;
    }
  }

  async getDefaultPrintSettings(reportType: string): Promise<PrintSettings | undefined> {
    try {
      const [settings] = await db.select().from(printSettings)
        .where(and(
          eq(printSettings.reportType, reportType),
          eq(printSettings.isDefault, true)
        ))
        .limit(1);
      return settings || undefined;
    } catch (error) {
      console.error('Error getting default print settings:', error);
      return undefined;
    }
  }

  // دالتان إضافيتان للإصلاح
  async deleteDailySummary(projectId: string, date: string): Promise<void> {
    try {
      await db.delete(dailyExpenseSummaries)
        .where(and(
          eq(dailyExpenseSummaries.projectId, projectId),
          eq(dailyExpenseSummaries.date, date)
        ));
      console.log(`✅ تم حذف ملخص ${date} للمشروع ${projectId}`);
    } catch (error) {
      console.error('Error deleting daily summary:', error);
      throw error;
    }
  }

  async getDailySummary(projectId: string, date: string): Promise<DailyExpenseSummary | null> {
    try {
      const [summary] = await db.select().from(dailyExpenseSummaries)
        .where(and(
          eq(dailyExpenseSummaries.projectId, projectId),
          eq(dailyExpenseSummaries.date, date)
        ));
      return summary || null;
    } catch (error) {
      console.error('Error getting daily summary:', error);
      return null;
    }
  }

  // Report Templates
  async getReportTemplates(): Promise<ReportTemplate[]> {
    try {
      return await db.select().from(reportTemplates).orderBy(sql`created_at DESC`);
    } catch (error) {
      console.error('Error getting report templates:', error);
      return [];
    }
  }

  async getReportTemplate(id: string): Promise<ReportTemplate | undefined> {
    try {
      const [template] = await db.select().from(reportTemplates).where(eq(reportTemplates.id, id));
      return template || undefined;
    } catch (error) {
      console.error('Error getting report template:', error);
      return undefined;
    }
  }

  async getActiveReportTemplate(): Promise<ReportTemplate | undefined> {
    try {
      const [template] = await db.select().from(reportTemplates)
        .where(eq(reportTemplates.isActive, true))
        .orderBy(sql`updated_at DESC`)
        .limit(1);
      return template || undefined;
    } catch (error) {
      console.error('Error getting active report template:', error);
      return undefined;
    }
  }

  async createReportTemplate(template: InsertReportTemplate): Promise<ReportTemplate> {
    try {
      // إذا كان هذا القالب سيكون نشطاً، إلغاء تفعيل القوالب الأخرى
      if (template.isActive) {
        await db.update(reportTemplates)
          .set({ isActive: false })
          .where(eq(reportTemplates.isActive, true));
      }

      const [newTemplate] = await db
        .insert(reportTemplates)
        .values(template)
        .returning();
      
      if (!newTemplate) {
        throw new Error('فشل في إنشاء قالب التقرير');
      }
      
      return newTemplate;
    } catch (error) {
      console.error('Error creating report template:', error);
      throw error;
    }
  }

  async updateReportTemplate(id: string, template: Partial<InsertReportTemplate>): Promise<ReportTemplate | undefined> {
    try {
      // إذا كان سيتم تفعيل هذا القالب، إلغاء تفعيل القوالب الأخرى
      if (template.isActive) {
        await db.update(reportTemplates)
          .set({ isActive: false })
          .where(eq(reportTemplates.isActive, true));
      }

      const [updated] = await db
        .update(reportTemplates)
        .set({ ...template, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(reportTemplates.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating report template:', error);
      throw error;
    }
  }

  async deleteReportTemplate(id: string): Promise<void> {
    try {
      await db.delete(reportTemplates).where(eq(reportTemplates.id, id));
    } catch (error) {
      console.error('Error deleting report template:', error);
      throw error;
    }
  }

  // =====================================================
  // تنفيذ دوال نظام إدارة المعدات والأدوات الاحترافي
  // =====================================================

  // Tool Categories
  async getToolCategories(): Promise<ToolCategory[]> {
    try {
      return await db.select().from(toolCategories)
        .where(eq(toolCategories.isActive, true))
        .orderBy(toolCategories.name);
    } catch (error) {
      console.error('Error getting tool categories:', error);
      return [];
    }
  }

  async getToolCategory(id: string): Promise<ToolCategory | undefined> {
    try {
      const [category] = await db.select().from(toolCategories).where(eq(toolCategories.id, id));
      return category || undefined;
    } catch (error) {
      console.error('Error getting tool category:', error);
      return undefined;
    }
  }

  async getToolCategoryByName(name: string): Promise<ToolCategory | undefined> {
    try {
      const [category] = await db.select().from(toolCategories)
        .where(and(eq(toolCategories.name, name.trim()), eq(toolCategories.isActive, true)));
      return category || undefined;
    } catch (error) {
      console.error('Error getting tool category by name:', error);
      return undefined;
    }
  }

  async createToolCategory(category: InsertToolCategory): Promise<ToolCategory> {
    try {
      const [newCategory] = await db
        .insert(toolCategories)
        .values(category)
        .returning();
      
      if (!newCategory) {
        throw new Error('فشل في إنشاء تصنيف الأداة');
      }
      
      return newCategory;
    } catch (error) {
      console.error('Error creating tool category:', error);
      throw error;
    }
  }

  async updateToolCategory(id: string, category: Partial<InsertToolCategory>): Promise<ToolCategory | undefined> {
    try {
      const [updated] = await db
        .update(toolCategories)
        .set({ ...category, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(toolCategories.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating tool category:', error);
      throw error;
    }
  }

  async deleteToolCategory(id: string): Promise<void> {
    try {
      await db.update(toolCategories)
        .set({ isActive: false })
        .where(eq(toolCategories.id, id));
    } catch (error) {
      console.error('Error deleting tool category:', error);
      throw error;
    }
  }

  // Tools
  async getTools(filters?: {
    categoryId?: string;
    status?: string;
    condition?: string;
    searchTerm?: string;
    projectId?: string;
    locationType?: string;
  }): Promise<Tool[]> {
    try {
      let query = db.select().from(tools).where(eq(tools.isActive, true));

      const conditions = [eq(tools.isActive, true)];

      if (filters?.categoryId) {
        conditions.push(eq(tools.categoryId, filters.categoryId));
      }

      if (filters?.status) {
        conditions.push(eq(tools.status, filters.status));
      }

      if (filters?.condition) {
        conditions.push(eq(tools.condition, filters.condition));
      }

      if (filters?.searchTerm) {
        const searchTerm = `%${filters.searchTerm}%`;
        conditions.push(
          or(
            sql`${tools.name} ILIKE ${searchTerm}`,
            sql`${tools.description} ILIKE ${searchTerm}`,
            sql`${tools.sku} ILIKE ${searchTerm}`,
            sql`${tools.serialNumber} ILIKE ${searchTerm}`
          )!
        );
      }

      if (conditions.length > 0) {
        query = db.select().from(tools).where(and(...conditions));
      }

      return await query.orderBy(tools.name);
    } catch (error) {
      console.error('Error getting tools:', error);
      return [];
    }
  }

  async getTool(id: string): Promise<Tool | undefined> {
    try {
      const [tool] = await db.select().from(tools).where(eq(tools.id, id));
      return tool || undefined;
    } catch (error) {
      console.error('Error getting tool:', error);
      return undefined;
    }
  }

  async getToolBySku(sku: string): Promise<Tool | undefined> {
    try {
      const [tool] = await db.select().from(tools)
        .where(and(eq(tools.sku, sku), eq(tools.isActive, true)));
      return tool || undefined;
    } catch (error) {
      console.error('Error getting tool by SKU:', error);
      return undefined;
    }
  }

  async getToolByBarcode(barcode: string): Promise<Tool | undefined> {
    try {
      const [tool] = await db.select().from(tools)
        .where(and(eq(tools.barcode, barcode), eq(tools.isActive, true)));
      return tool || undefined;
    } catch (error) {
      console.error('Error getting tool by barcode:', error);
      return undefined;
    }
  }

  async getToolByQrCode(qrCode: string): Promise<Tool | undefined> {
    try {
      const [tool] = await db.select().from(tools)
        .where(and(eq(tools.qrCode, qrCode), eq(tools.isActive, true)));
      return tool || undefined;
    } catch (error) {
      console.error('Error getting tool by QR code:', error);
      return undefined;
    }
  }

  async createTool(tool: InsertTool): Promise<Tool> {
    try {
      const [newTool] = await db
        .insert(tools)
        .values({
          ...tool,
          qrCode: tool.qrCode || `TOOL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        })
        .returning();
      
      if (!newTool) {
        throw new Error('فشل في إنشاء الأداة');
      }
      
      return newTool;
    } catch (error) {
      console.error('Error creating tool:', error);
      throw error;
    }
  }

  async updateTool(id: string, tool: Partial<InsertTool>): Promise<Tool | undefined> {
    try {
      const [updated] = await db
        .update(tools)
        .set({ ...tool, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(tools.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating tool:', error);
      throw error;
    }
  }

  async deleteTool(id: string): Promise<void> {
    try {
      await db.update(tools)
        .set({ isActive: false })
        .where(eq(tools.id, id));
    } catch (error) {
      console.error('Error deleting tool:', error);
      throw error;
    }
  }

  // Tool Stock
  async getToolStock(toolId?: string, locationType?: string, locationId?: string): Promise<ToolStock[]> {
    try {
      const conditions = [];

      if (toolId) {
        conditions.push(eq(toolStock.toolId, toolId));
      }

      if (locationType) {
        conditions.push(eq(toolStock.locationType, locationType));
      }

      if (locationId !== undefined) {
        if (locationId === null) {
          conditions.push(sql`${toolStock.locationId} IS NULL`);
        } else {
          conditions.push(eq(toolStock.locationId, locationId));
        }
      }

      let query = db.select().from(toolStock);

      if (conditions.length > 0) {
        query = db.select().from(toolStock).where(and(...conditions));
      }

      return await query.orderBy(toolStock.createdAt);
    } catch (error) {
      console.error('Error getting tool stock:', error);
      return [];
    }
  }

  async getToolStockByLocation(locationType: string, locationId?: string): Promise<ToolStock[]> {
    try {
      const conditions = [eq(toolStock.locationType, locationType)];

      if (locationId !== undefined) {
        if (locationId === null) {
          conditions.push(sql`${toolStock.locationId} IS NULL`);
        } else {
          conditions.push(eq(toolStock.locationId, locationId));
        }
      }

      return await db.select().from(toolStock)
        .where(and(...conditions))
        .orderBy(toolStock.createdAt);
    } catch (error) {
      console.error('Error getting tool stock by location:', error);
      return [];
    }
  }

  async updateToolStock(toolId: string, locationType: string, locationId: string | null, stock: Partial<InsertToolStock>): Promise<ToolStock> {
    try {
      // محاولة تحديث المخزون الموجود
      const [updated] = await db
        .update(toolStock)
        .set({ ...stock, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(and(
          eq(toolStock.toolId, toolId),
          eq(toolStock.locationType, locationType),
          locationId ? eq(toolStock.locationId, locationId!) : sql`${toolStock.locationId} IS NULL`
        ))
        .returning();

      if (updated) {
        return updated;
      }

      // إذا لم يوجد، إنشاء سجل جديد
      const [newStock] = await db
        .insert(toolStock)
        .values({
          toolId,
          locationType,
          locationId,
          ...stock,
        })
        .returning();

      if (!newStock) {
        throw new Error('فشل في تحديث مخزون الأداة');
      }

      return newStock;
    } catch (error) {
      console.error('Error updating tool stock:', error);
      throw error;
    }
  }

  async createOrUpdateToolStock(stock: InsertToolStock): Promise<ToolStock> {
    try {
      const [existing] = await db.select().from(toolStock)
        .where(and(
          eq(toolStock.toolId, stock.toolId),
          eq(toolStock.locationType, stock.locationType),
          stock.locationId ? eq(toolStock.locationId, stock.locationId) : sql`${toolStock.locationId} IS NULL`
        ));

      if (existing) {
        const [updated] = await db
          .update(toolStock)
          .set({
            ...stock,
            updatedAt: sql`CURRENT_TIMESTAMP`
          })
          .where(eq(toolStock.id, existing.id))
          .returning();
        
        return updated!;
      } else {
        const [newStock] = await db
          .insert(toolStock)
          .values(stock)
          .returning();
        
        if (!newStock) {
          throw new Error('فشل في إنشاء مخزون الأداة');
        }
        
        return newStock;
      }
    } catch (error) {
      console.error('Error creating/updating tool stock:', error);
      throw error;
    }
  }

  // Tool Movements
  async getToolMovements(filters?: {
    toolId?: string;
    projectId?: string;
    movementType?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ToolMovement[]> {
    try {
      const conditions = [];

      if (filters?.toolId) {
        conditions.push(eq(toolMovements.toolId, filters.toolId));
      }

      if (filters?.projectId) {
        conditions.push(eq(toolMovements.projectId, filters.projectId));
      }

      if (filters?.movementType) {
        conditions.push(eq(toolMovements.movementType, filters.movementType));
      }

      if (filters?.dateFrom) {
        conditions.push(gte(toolMovements.performedAt, new Date(filters.dateFrom)));
      }

      if (filters?.dateTo) {
        conditions.push(lte(toolMovements.performedAt, new Date(filters.dateTo + ' 23:59:59')));
      }

      let query = db.select().from(toolMovements);

      if (conditions.length > 0) {
        query = db.select().from(toolMovements).where(and(...conditions));
      }

      return await query.orderBy(sql`${toolMovements.performedAt} DESC`);
    } catch (error) {
      console.error('Error getting tool movements:', error);
      return [];
    }
  }

  async getToolMovement(id: string): Promise<ToolMovement | undefined> {
    try {
      const [movement] = await db.select().from(toolMovements).where(eq(toolMovements.id, id));
      return movement || undefined;
    } catch (error) {
      console.error('Error getting tool movement:', error);
      return undefined;
    }
  }

  async createToolMovement(movement: InsertToolMovement): Promise<ToolMovement> {
    try {
      const [newMovement] = await db
        .insert(toolMovements)
        .values({
          ...movement,
          referenceNumber: movement.referenceNumber || `MOV_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        })
        .returning();
      
      if (!newMovement) {
        throw new Error('فشل في إنشاء حركة الأداة');
      }
      
      return newMovement;
    } catch (error) {
      console.error('Error creating tool movement:', error);
      throw error;
    }
  }

  async updateToolMovement(id: string, movement: Partial<InsertToolMovement>): Promise<ToolMovement | undefined> {
    try {
      const [updated] = await db
        .update(toolMovements)
        .set(movement)
        .where(eq(toolMovements.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating tool movement:', error);
      throw error;
    }
  }

  async deleteToolMovement(id: string): Promise<void> {
    try {
      await db.delete(toolMovements).where(eq(toolMovements.id, id));
    } catch (error) {
      console.error('Error deleting tool movement:', error);
      throw error;
    }
  }

  // Tool Maintenance
  async getToolMaintenanceLogs(toolId?: string, status?: string): Promise<ToolMaintenanceLog[]> {
    try {
      const conditions = [];

      if (toolId) {
        conditions.push(eq(toolMaintenanceLogs.toolId, toolId));
      }

      if (status) {
        conditions.push(eq(toolMaintenanceLogs.status, status));
      }

      let query = db.select().from(toolMaintenanceLogs);

      if (conditions.length > 0) {
        query = db.select().from(toolMaintenanceLogs).where(and(...conditions));
      }

      return await query.orderBy(sql`${toolMaintenanceLogs.scheduledDate} DESC`);
    } catch (error) {
      console.error('Error getting tool maintenance logs:', error);
      return [];
    }
  }

  async getToolMaintenanceLog(id: string): Promise<ToolMaintenanceLog | undefined> {
    try {
      const [log] = await db.select().from(toolMaintenanceLogs).where(eq(toolMaintenanceLogs.id, id));
      return log || undefined;
    } catch (error) {
      console.error('Error getting tool maintenance log:', error);
      return undefined;
    }
  }

  async createToolMaintenanceLog(log: InsertToolMaintenanceLog): Promise<ToolMaintenanceLog> {
    try {
      const [newLog] = await db
        .insert(toolMaintenanceLogs)
        .values(log)
        .returning();
      
      if (!newLog) {
        throw new Error('فشل في إنشاء سجل الصيانة');
      }
      
      return newLog;
    } catch (error) {
      console.error('Error creating tool maintenance log:', error);
      throw error;
    }
  }

  async updateToolMaintenanceLog(id: string, log: Partial<InsertToolMaintenanceLog>): Promise<ToolMaintenanceLog | undefined> {
    try {
      const [updated] = await db
        .update(toolMaintenanceLogs)
        .set({ ...log, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(toolMaintenanceLogs.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating tool maintenance log:', error);
      throw error;
    }
  }

  async deleteToolMaintenanceLog(id: string): Promise<void> {
    try {
      await db.delete(toolMaintenanceLogs).where(eq(toolMaintenanceLogs.id, id));
    } catch (error) {
      console.error('Error deleting tool maintenance log:', error);
      throw error;
    }
  }

  async getOverdueMaintenanceTasks(): Promise<ToolMaintenanceLog[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      return await db.select().from(toolMaintenanceLogs)
        .where(and(
          eq(toolMaintenanceLogs.status, 'scheduled'),
          lte(toolMaintenanceLogs.scheduledDate, new Date(today))
        ))
        .orderBy(toolMaintenanceLogs.scheduledDate);
    } catch (error) {
      console.error('Error getting overdue maintenance tasks:', error);
      return [];
    }
  }

  // Tool Usage Analytics
  async getToolUsageAnalytics(toolId?: string, projectId?: string, period?: string): Promise<ToolUsageAnalytics[]> {
    try {
      const conditions = [];

      if (toolId) {
        conditions.push(eq(toolUsageAnalytics.toolId, toolId));
      }

      if (projectId) {
        conditions.push(eq(toolUsageAnalytics.projectId, projectId));
      }

      if (period) {
        if (period.includes('-W')) {
          // أسبوعي
          conditions.push(eq(toolUsageAnalytics.analysisWeek, period));
        } else if (period.length === 7) {
          // شهري
          conditions.push(eq(toolUsageAnalytics.analysisMonth, period));
        } else {
          // يومي
          conditions.push(eq(toolUsageAnalytics.analysisDate, period));
        }
      }

      let query = db.select().from(toolUsageAnalytics);

      if (conditions.length > 0) {
        query = db.select().from(toolUsageAnalytics).where(and(...conditions));
      }

      return await query.orderBy(sql`${toolUsageAnalytics.analysisDate} DESC`);
    } catch (error) {
      console.error('Error getting tool usage analytics:', error);
      return [];
    }
  }

  async createOrUpdateToolUsageAnalytics(analytics: InsertToolUsageAnalytics): Promise<ToolUsageAnalytics> {
    try {
      const [existing] = await db.select().from(toolUsageAnalytics)
        .where(and(
          eq(toolUsageAnalytics.toolId, analytics.toolId),
          eq(toolUsageAnalytics.analysisDate, analytics.analysisDate),
          analytics.projectId ? eq(toolUsageAnalytics.projectId, analytics.projectId!) : sql`${toolUsageAnalytics.projectId} IS NULL`
        ));

      if (existing) {
        const [updated] = await db
          .update(toolUsageAnalytics)
          .set(analytics)
          .where(eq(toolUsageAnalytics.id, existing.id))
          .returning();
        
        return updated!;
      } else {
        const [newAnalytics] = await db
          .insert(toolUsageAnalytics)
          .values(analytics)
          .returning();
        
        if (!newAnalytics) {
          throw new Error('فشل في إنشاء تحليلات الاستخدام');
        }
        
        return newAnalytics;
      }
    } catch (error) {
      console.error('Error creating/updating tool usage analytics:', error);
      throw error;
    }
  }

  async getToolUtilizationReport(dateFrom: string, dateTo: string): Promise<any[]> {
    try {
      // تقرير شامل عن استخدام الأدوات
      const result = await db.execute(sql`
        SELECT 
          t.id as tool_id,
          t.name as tool_name,
          t.status,
          t.condition,
          tc.name as category_name,
          COALESCE(SUM(ta.usage_hours), 0) as total_usage_hours,
          COALESCE(AVG(ta.utilization_rate), 0) as avg_utilization_rate,
          COALESCE(SUM(ta.operational_cost), 0) as total_operational_cost,
          COUNT(tm.id) as movement_count
        FROM tools t
        LEFT JOIN tool_categories tc ON t.category_id = tc.id
        LEFT JOIN tool_usage_analytics ta ON t.id = ta.tool_id 
          AND ta.analysis_date BETWEEN ${dateFrom} AND ${dateTo}
        LEFT JOIN tool_movements tm ON t.id = tm.tool_id 
          AND tm.performed_at BETWEEN ${dateFrom} AND ${dateTo}
        WHERE t.is_active = true
        GROUP BY t.id, t.name, t.status, t.condition, tc.name
        ORDER BY total_usage_hours DESC
      `);

      return result.rows;
    } catch (error) {
      console.error('Error getting tool utilization report:', error);
      return [];
    }
  }

  // Tool Reservations
  async getToolReservations(filters?: {
    toolId?: string;
    projectId?: string;
    status?: string;
    userId?: string;
  }): Promise<ToolReservation[]> {
    try {
      const conditions = [];

      if (filters?.toolId) {
        conditions.push(eq(toolReservations.toolId, filters.toolId));
      }

      if (filters?.projectId) {
        conditions.push(eq(toolReservations.projectId, filters.projectId));
      }

      if (filters?.status) {
        conditions.push(eq(toolReservations.status, filters.status));
      }

      if (filters?.userId) {
        conditions.push(eq(toolReservations.reservedBy, filters.userId));
      }

      let query = db.select().from(toolReservations);

      if (conditions.length > 0) {
        query = db.select().from(toolReservations).where(and(...conditions));
      }

      return await query.orderBy(sql`${toolReservations.requestedDate} DESC`);
    } catch (error) {
      console.error('Error getting tool reservations:', error);
      return [];
    }
  }

  async getToolReservation(id: string): Promise<ToolReservation | undefined> {
    try {
      const [reservation] = await db.select().from(toolReservations).where(eq(toolReservations.id, id));
      return reservation || undefined;
    } catch (error) {
      console.error('Error getting tool reservation:', error);
      return undefined;
    }
  }

  async createToolReservation(reservation: InsertToolReservation): Promise<ToolReservation> {
    try {
      const [newReservation] = await db
        .insert(toolReservations)
        .values(reservation)
        .returning();
      
      if (!newReservation) {
        throw new Error('فشل في إنشاء حجز الأداة');
      }
      
      return newReservation;
    } catch (error) {
      console.error('Error creating tool reservation:', error);
      throw error;
    }
  }

  async updateToolReservation(id: string, reservation: Partial<InsertToolReservation>): Promise<ToolReservation | undefined> {
    try {
      const [updated] = await db
        .update(toolReservations)
        .set({ ...reservation, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(toolReservations.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating tool reservation:', error);
      throw error;
    }
  }

  async deleteToolReservation(id: string): Promise<void> {
    try {
      await db.delete(toolReservations).where(eq(toolReservations.id, id));
    } catch (error) {
      console.error('Error deleting tool reservation:', error);
      throw error;
    }
  }

  // Advanced Tool Functions
  async transferTool(
    toolId: string, 
    fromLocation: {type: string, id: string | null}, 
    toLocation: {type: string, id: string | null}, 
    quantity: number, 
    userId: string, 
    reason?: string
  ): Promise<ToolMovement> {
    try {
      // إنشاء سجل الحركة
      const movement = await this.createToolMovement({
        toolId,
        movementType: 'transfer',
        quantity,
        fromType: fromLocation.type,
        fromId: fromLocation.id,
        toType: toLocation.type,
        toId: toLocation.id,
        reason,
        performedBy: userId,
      });

      // تحديث المخزون في الموقع الأصلي
      if (fromLocation.type !== 'none') {
        const currentFromStock = await this.getToolStock(toolId, fromLocation.type, fromLocation.id);
        if (currentFromStock.length > 0) {
          const stock = currentFromStock[0];
          await this.updateToolStock(toolId, fromLocation.type, fromLocation.id, {
            quantity: Math.max(0, stock.quantity - quantity),
            availableQuantity: Math.max(0, stock.availableQuantity - quantity),
          });
        }
      }

      // تحديث المخزون في الموقع الجديد
      if (toLocation.type !== 'none') {
        const currentToStock = await this.getToolStock(toolId, toLocation.type, toLocation.id);
        if (currentToStock.length > 0) {
          const stock = currentToStock[0];
          await this.updateToolStock(toolId, toLocation.type, toLocation.id, {
            quantity: stock.quantity + quantity,
            availableQuantity: stock.availableQuantity + quantity,
          });
        } else {
          // إنشاء سجل مخزون جديد
          await this.createOrUpdateToolStock({
            toolId,
            locationType: toLocation.type,
            locationId: toLocation.id,
            quantity,
            availableQuantity: quantity,
            reservedQuantity: 0,
          });
        }
      }

      return movement;
    } catch (error) {
      console.error('Error transferring tool:', error);
      throw error;
    }
  }

  async getToolHistory(toolId: string): Promise<{movements: ToolMovement[], maintenance: ToolMaintenanceLog[]}> {
    try {
      const [movements, maintenance] = await Promise.all([
        this.getToolMovements({ toolId }),
        this.getToolMaintenanceLogs(toolId),
      ]);

      return { movements, maintenance };
    } catch (error) {
      console.error('Error getting tool history:', error);
      return { movements: [], maintenance: [] };
    }
  }

  async getToolsByProject(projectId: string): Promise<Tool[]> {
    try {
      const result = await db.execute(sql`
        SELECT DISTINCT t.*
        FROM tools t
        JOIN tool_stock ts ON t.id = ts.tool_id
        WHERE ts.location_type = 'project' 
          AND ts.location_id = ${projectId}
          AND t.is_active = true
          AND ts.quantity > 0
        ORDER BY t.name
      `);

      return result.rows as any[];
    } catch (error) {
      console.error('Error getting tools by project:', error);
      return [];
    }
  }

  async getLowStockTools(threshold: number = 5): Promise<Tool[]> {
    try {
      const result = await db.execute(sql`
        SELECT t.*, SUM(ts.available_quantity) as total_available
        FROM tools t
        JOIN tool_stock ts ON t.id = ts.tool_id
        WHERE t.is_active = true
        GROUP BY t.id, t.name, t.description, t.category_id, t.unit, t.status, t.condition, t.created_at, t.updated_at
        HAVING SUM(ts.available_quantity) <= ${threshold}
        ORDER BY total_available ASC
      `);

      return result.rows as any[];
    } catch (error) {
      console.error('Error getting low stock tools:', error);
      return [];
    }
  }

  async getToolsNeedingMaintenance(): Promise<Tool[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await db.execute(sql`
        SELECT DISTINCT t.*
        FROM tools t
        WHERE t.is_active = true
          AND (
            t.next_maintenance_date <= ${today}
            OR t.next_maintenance_date IS NULL AND t.maintenance_interval IS NOT NULL
          )
        ORDER BY t.next_maintenance_date ASC NULLS LAST
      `);

      return result.rows as any[];
    } catch (error) {
      console.error('Error getting tools needing maintenance:', error);
      return [];
    }
  }

  async generateToolQRCode(toolId: string): Promise<string> {
    try {
      const qrCode = `TOOL_${toolId}_${Date.now()}`;
      await this.updateTool(toolId, { qrCode });
      return qrCode;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  async bulkUpdateToolStatus(toolIds: string[], status: string, userId: string): Promise<void> {
    try {
      await db.update(tools)
        .set({ 
          status, 
          updatedAt: sql`CURRENT_TIMESTAMP` 
        })
        .where(inArray(tools.id, toolIds));

      // إنشاء سجلات الحركة للتحديث المجمع
      const movements = toolIds.map(toolId => ({
        toolId,
        movementType: 'adjust' as const,
        quantity: 0,
        reason: `تحديث الحالة إلى: ${status}`,
        performedBy: userId,
      }));

      for (const movement of movements) {
        await this.createToolMovement(movement);
      }
    } catch (error) {
      console.error('Error bulk updating tool status:', error);
      throw error;
    }
  }

  // =====================================
  // Phase 3: Integration & Advanced Maintenance Methods
  // =====================================

  // Tool Purchase Items - ربط الأدوات بالمشتريات
  async createToolPurchaseItem(item: InsertToolPurchaseItem): Promise<ToolPurchaseItem> {
    try {
      const [newItem] = await db
        .insert(toolPurchaseItems)
        .values(item)
        .returning();
      
      if (!newItem) {
        throw new Error('فشل في إنشاء بند شراء الأداة');
      }
      
      return newItem;
    } catch (error) {
      console.error('Error creating tool purchase item:', error);
      throw error;
    }
  }

  async getToolPurchaseItemsByPurchase(purchaseId: string): Promise<ToolPurchaseItem[]> {
    try {
      return await db.select()
        .from(toolPurchaseItems)
        .where(eq(toolPurchaseItems.materialPurchaseId, purchaseId))
        .orderBy(desc(toolPurchaseItems.createdAt));
    } catch (error) {
      console.error('Error getting tool purchase items:', error);
      return [];
    }
  }

  async convertPurchaseItemToTool(itemId: string, toolData: InsertTool): Promise<{ item: ToolPurchaseItem; tool: Tool }> {
    try {
      // إنشاء الأداة
      const tool = await this.createTool(toolData);
      
      // تحديث بند الشراء
      const [updatedItem] = await db
        .update(toolPurchaseItems)
        .set({
          conversionStatus: 'converted',
          toolId: tool.id,
          convertedAt: sql`CURRENT_TIMESTAMP`,
          updatedAt: sql`CURRENT_TIMESTAMP`
        })
        .where(eq(toolPurchaseItems.id, itemId))
        .returning();

      if (!updatedItem) {
        throw new Error('فشل في تحديث بند الشراء');
      }

      return { item: updatedItem, tool };
    } catch (error) {
      console.error('Error converting purchase item to tool:', error);
      throw error;
    }
  }

  // Maintenance Schedules - جداول الصيانة المتقدمة
  async createMaintenanceSchedule(schedule: InsertMaintenanceSchedule): Promise<MaintenanceSchedule> {
    try {
      const [newSchedule] = await db
        .insert(maintenanceSchedules)
        .values(schedule)
        .returning();
      
      if (!newSchedule) {
        throw new Error('فشل في إنشاء جدول الصيانة');
      }
      
      return newSchedule;
    } catch (error) {
      console.error('Error creating maintenance schedule:', error);
      throw error;
    }
  }

  async getMaintenanceSchedules(filters: {
    toolId?: string;
    isActive?: boolean;
    scheduleType?: string;
  } = {}): Promise<MaintenanceSchedule[]> {
    try {
      let query = db.select().from(maintenanceSchedules);
      const conditions = [];

      if (filters.toolId) {
        conditions.push(eq(maintenanceSchedules.toolId, filters.toolId));
      }

      if (filters.isActive !== undefined) {
        conditions.push(eq(maintenanceSchedules.isActive, filters.isActive));
      }

      if (filters.scheduleType) {
        conditions.push(eq(maintenanceSchedules.scheduleType, filters.scheduleType));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      return await query.orderBy(desc(maintenanceSchedules.nextDueDate));
    } catch (error) {
      console.error('Error getting maintenance schedules:', error);
      return [];
    }
  }

  async getUpcomingMaintenanceSchedules(daysBefore: number = 7): Promise<MaintenanceSchedule[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysBefore);
      
      return await db.select()
        .from(maintenanceSchedules)
        .where(
          and(
            eq(maintenanceSchedules.isActive, true),
            sql`${maintenanceSchedules.nextDueDate} <= ${futureDate.toISOString()}`
          )
        )
        .orderBy(asc(maintenanceSchedules.nextDueDate));
    } catch (error) {
      console.error('Error getting upcoming maintenance schedules:', error);
      return [];
    }
  }

  // Maintenance Tasks - مهام الصيانة التفصيلية
  async createMaintenanceTask(task: InsertMaintenanceTask): Promise<MaintenanceTask> {
    try {
      const [newTask] = await db
        .insert(maintenanceTasks)
        .values(task)
        .returning();
      
      if (!newTask) {
        throw new Error('فشل في إنشاء مهمة الصيانة');
      }
      
      return newTask;
    } catch (error) {
      console.error('Error creating maintenance task:', error);
      throw error;
    }
  }

  async getMaintenanceTasks(filters: {
    toolId?: string;
    scheduleId?: string;
    status?: string;
    assignedTo?: string;
  } = {}): Promise<MaintenanceTask[]> {
    try {
      let query = db.select().from(maintenanceTasks);
      const conditions = [];

      if (filters.toolId) {
        conditions.push(eq(maintenanceTasks.toolId, filters.toolId));
      }

      if (filters.scheduleId) {
        conditions.push(eq(maintenanceTasks.scheduleId, filters.scheduleId));
      }

      if (filters.status) {
        conditions.push(eq(maintenanceTasks.status, filters.status));
      }

      if (filters.assignedTo) {
        conditions.push(eq(maintenanceTasks.assignedTo, filters.assignedTo));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      return await query.orderBy(desc(maintenanceTasks.dueDate));
    } catch (error) {
      console.error('Error getting maintenance tasks:', error);
      return [];
    }
  }

  async updateMaintenanceTaskStatus(taskId: string, status: string, updateData: Partial<InsertMaintenanceTask> = {}): Promise<MaintenanceTask | undefined> {
    try {
      const updateValues = {
        ...updateData,
        status,
        updatedAt: sql`CURRENT_TIMESTAMP`
      };

      // إضافة timestamps حسب الحالة
      if (status === 'in_progress' && !updateData.startedAt) {
        updateValues.startedAt = sql`CURRENT_TIMESTAMP`;
      } else if (status === 'completed' && !updateData.completedAt) {
        updateValues.completedAt = sql`CURRENT_TIMESTAMP`;
      }

      const [updated] = await db
        .update(maintenanceTasks)
        .set(updateValues)
        .where(eq(maintenanceTasks.id, taskId))
        .returning();

      return updated || undefined;
    } catch (error) {
      console.error('Error updating maintenance task status:', error);
      throw error;
    }
  }

  // Tool Cost Tracking - تتبع التكاليف للأدوات
  async createToolCostTracking(cost: InsertToolCostTracking): Promise<ToolCostTracking> {
    try {
      const [newCost] = await db
        .insert(toolCostTracking)
        .values(cost)
        .returning();
      
      if (!newCost) {
        throw new Error('فشل في تسجيل تكلفة الأداة');
      }
      
      return newCost;
    } catch (error) {
      console.error('Error creating tool cost tracking:', error);
      throw error;
    }
  }

  async getToolCostTracking(filters: {
    toolId?: string;
    costType?: string;
    costCategory?: string;
    projectId?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<ToolCostTracking[]> {
    try {
      let query = db.select().from(toolCostTracking);
      const conditions = [];

      if (filters.toolId) {
        conditions.push(eq(toolCostTracking.toolId, filters.toolId));
      }

      if (filters.costType) {
        conditions.push(eq(toolCostTracking.costType, filters.costType));
      }

      if (filters.costCategory) {
        conditions.push(eq(toolCostTracking.costCategory, filters.costCategory));
      }

      if (filters.projectId) {
        conditions.push(eq(toolCostTracking.projectId, filters.projectId));
      }

      if (filters.startDate) {
        conditions.push(sql`${toolCostTracking.costDate} >= ${filters.startDate}`);
      }

      if (filters.endDate) {
        conditions.push(sql`${toolCostTracking.costDate} <= ${filters.endDate}`);
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      return await query.orderBy(desc(toolCostTracking.costDate));
    } catch (error) {
      console.error('Error getting tool cost tracking:', error);
      return [];
    }
  }

  async getToolTotalCosts(toolId: string): Promise<{
    purchaseCost: number;
    maintenanceCost: number;
    operationalCost: number;
    totalCost: number;
  }> {
    try {
      const costs = await db.select()
        .from(toolCostTracking)
        .where(eq(toolCostTracking.toolId, toolId));

      const summary = costs.reduce((acc, cost) => {
        const amount = parseFloat(cost.amount.toString());
        
        switch (cost.costType) {
          case 'purchase':
            acc.purchaseCost += amount;
            break;
          case 'maintenance':
            acc.maintenanceCost += amount;
            break;
          case 'operation':
            acc.operationalCost += amount;
            break;
        }
        
        acc.totalCost += amount;
        return acc;
      }, {
        purchaseCost: 0,
        maintenanceCost: 0,
        operationalCost: 0,
        totalCost: 0
      });

      return summary;
    } catch (error) {
      console.error('Error calculating tool total costs:', error);
      return {
        purchaseCost: 0,
        maintenanceCost: 0,
        operationalCost: 0,
        totalCost: 0
      };
    }
  }

  // AI-powered purchase item classification
  async classifyPurchaseItems(purchaseId: string): Promise<void> {
    try {
      const items = await this.getToolPurchaseItemsByPurchase(purchaseId);
      
      for (const item of items) {
        // بسيطة AI classification based on keywords
        const toolKeywords = [
          'مطرقة', 'منشار', 'مفك', 'مثقب', 'ريقة', 'مقص',
          'كماشة', 'خردوات', 'أدوات', 'معدات', 'آلة', 'جهاز',
          'hammer', 'saw', 'drill', 'tool', 'equipment', 'machine'
        ];

        const itemName = item.itemName.toLowerCase();
        const isToolItem = toolKeywords.some(keyword => itemName.includes(keyword));
        
        if (isToolItem) {
          // اقتراح تصنيف بناءً على الكلمات المفتاحية
          let suggestedCategoryId = null;
          const categories = await this.getToolCategories({ isActive: true });
          
          for (const category of categories) {
            if (itemName.includes(category.name.toLowerCase())) {
              suggestedCategoryId = category.id;
              break;
            }
          }

          await db.update(toolPurchaseItems)
            .set({
              isToolItem: true,
              suggestedCategoryId,
              aiConfidence: isToolItem ? 85 : 15,
              aiSuggestions: {
                category: suggestedCategoryId ? categories.find(c => c.id === suggestedCategoryId)?.name : null,
                confidence: isToolItem ? 85 : 15,
                reason: isToolItem ? 'تم العثور على كلمات مفتاحية متطابقة' : 'لا توجد كلمات مفتاحية متطابقة'
              }
            })
            .where(eq(toolPurchaseItems.id, item.id));
        }
      }
    } catch (error) {
      console.error('Error classifying purchase items:', error);
    }
  }

}

export const storage = new DatabaseStorage();