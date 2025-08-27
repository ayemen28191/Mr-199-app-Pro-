import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, date, boolean, jsonb, serial, inet, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (جدول المستخدمين) - محدث لدعم المصادقة المتقدمة
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // سيتم تشفيرها
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: varchar("phone", { length: 50 }),
  avatarUrl: text("avatar_url"),
  
  // المصادقة التقليدية
  role: text("role").notNull().default("admin"), // admin, manager, user (للتوافق العكسي)
  isActive: boolean("is_active").default(true).notNull(),
  
  // المصادقة المتقدمة
  isSuperAdmin: boolean("is_super_admin").default(false).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  
  // تأكيد البيانات
  emailVerifiedAt: timestamp("email_verified_at"),
  phoneVerifiedAt: timestamp("phone_verified_at"),
  
  // المصادقة متعددة العوامل
  totpSecret: text("totp_secret"), // مشفر
  totpEnabled: boolean("totp_enabled").default(false).notNull(),
  backupCodes: jsonb("backup_codes"), // رموز احتياطية مشفرة
  
  // حماية من الهجمات
  loginAttempts: integer("login_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
  
  // تواريخ مهمة
  lastLogin: timestamp("last_login"),
  passwordChangedAt: timestamp("password_changed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"), // active, completed, paused
  imageUrl: text("image_url"), // صورة المشروع
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Workers table
export const workers = pgTable("workers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // معلم (master), عامل (worker)
  dailyWage: decimal("daily_wage", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Fund transfers (تحويلات العهدة)
export const fundTransfers = pgTable("fund_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  senderName: text("sender_name"), // اسم المرسل
  transferNumber: text("transfer_number").unique(), // رقم الحولة - فريد
  transferType: text("transfer_type").notNull(), // حولة، تسليم يدوي، صراف
  transferDate: timestamp("transfer_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Worker attendance
export const workerAttendance = pgTable("worker_attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  workerId: varchar("worker_id").notNull().references(() => workers.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  startTime: text("start_time"), // HH:MM format
  endTime: text("end_time"), // HH:MM format
  workDescription: text("work_description"),
  isPresent: boolean("is_present").notNull(),
  workDays: decimal("work_days", { precision: 3, scale: 2 }).notNull().default('1.00'), // عدد أيام العمل (مثل 0.5، 1.0، 1.5)
  dailyWage: decimal("daily_wage", { precision: 10, scale: 2 }).notNull(), // الأجر اليومي الكامل
  actualWage: decimal("actual_wage", { precision: 10, scale: 2 }).notNull(), // الأجر الفعلي = dailyWage * workDays
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default('0').notNull(), // المبلغ المدفوع فعلياً (الصرف)
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }).default('0').notNull(), // المتبقي في حساب العامل
  paymentType: text("payment_type").notNull().default("partial"), // "full" | "partial" | "credit"
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // قيد فريد لمنع تسجيل حضور مكرر لنفس العامل في نفس اليوم
  uniqueWorkerDate: sql`UNIQUE (worker_id, date, project_id)`
}));

// Suppliers (الموردين)
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  contactPerson: text("contact_person"), // الشخص المسؤول
  phone: text("phone"),
  address: text("address"),
  paymentTerms: text("payment_terms").default("نقد"), // نقد، 30 يوم، 60 يوم، etc
  totalDebt: decimal("total_debt", { precision: 12, scale: 2 }).default('0').notNull(), // إجمالي المديونية
  isActive: boolean("is_active").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Materials
export const materials = pgTable("materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(), // حديد، أسمنت، رمل، etc
  unit: text("unit").notNull(), // طن، كيس، متر مكعب، etc
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Material purchases - محسن للمحاسبة الصحيحة
export const materialPurchases = pgTable("material_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  supplierId: varchar("supplier_id").references(() => suppliers.id), // ربط بالمورد
  materialId: varchar("material_id").notNull().references(() => materials.id),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  purchaseType: text("purchase_type").notNull().default("نقد"), // نقد، أجل
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default('0').notNull(), // المبلغ المدفوع
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }).default('0').notNull(), // المتبقي
  supplierName: text("supplier_name"), // اسم المورد (للتوافق العكسي)
  invoiceNumber: text("invoice_number"),
  invoiceDate: text("invoice_date").notNull(), // تاريخ الفاتورة - YYYY-MM-DD format
  dueDate: text("due_date"), // تاريخ الاستحقاق للفواتير الآجلة - YYYY-MM-DD format
  invoicePhoto: text("invoice_photo"), // base64 or file path
  notes: text("notes"),
  purchaseDate: text("purchase_date").notNull(), // YYYY-MM-DD format
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Supplier payments (مدفوعات الموردين)
export const supplierPayments = pgTable("supplier_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  purchaseId: varchar("purchase_id").references(() => materialPurchases.id), // ربط بفاتورة محددة
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull().default("نقد"), // نقد، حوالة، شيك
  paymentDate: text("payment_date").notNull(), // YYYY-MM-DD format
  referenceNumber: text("reference_number"), // رقم المرجع أو الشيك
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Transportation expenses (أجور المواصلات)
export const transportationExpenses = pgTable("transportation_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  workerId: varchar("worker_id").references(() => workers.id), // optional, for worker-specific transport
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Worker balance transfers (حوالات الحساب للأهالي)
export const workerTransfers = pgTable("worker_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workerId: varchar("worker_id").notNull().references(() => workers.id),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  transferNumber: text("transfer_number"), // رقم الحوالة
  senderName: text("sender_name"), // اسم المرسل
  recipientName: text("recipient_name").notNull(), // اسم المستلم (الأهل)
  recipientPhone: text("recipient_phone"), // رقم هاتف المستلم
  transferMethod: text("transfer_method").notNull(), // "hawaleh" | "bank" | "cash"
  transferDate: text("transfer_date").notNull(), // YYYY-MM-DD format
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Worker account balances (أرصدة حسابات العمال)
export const workerBalances = pgTable("worker_balances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workerId: varchar("worker_id").notNull().references(() => workers.id),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  totalEarned: decimal("total_earned", { precision: 10, scale: 2 }).default('0').notNull(), // إجمالي المكتسب
  totalPaid: decimal("total_paid", { precision: 10, scale: 2 }).default('0').notNull(), // إجمالي المدفوع
  totalTransferred: decimal("total_transferred", { precision: 10, scale: 2 }).default('0').notNull(), // إجمالي المحول للأهل
  currentBalance: decimal("current_balance", { precision: 10, scale: 2 }).default('0').notNull(), // الرصيد الحالي
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Daily expense summaries (ملخص المصروفات اليومية)
export const dailyExpenseSummaries = pgTable("daily_expense_summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  carriedForwardAmount: decimal("carried_forward_amount", { precision: 10, scale: 2 }).default('0').notNull(),
  totalFundTransfers: decimal("total_fund_transfers", { precision: 10, scale: 2 }).default('0').notNull(),
  totalWorkerWages: decimal("total_worker_wages", { precision: 10, scale: 2 }).default('0').notNull(),
  totalMaterialCosts: decimal("total_material_costs", { precision: 10, scale: 2 }).default('0').notNull(),
  totalTransportationCosts: decimal("total_transportation_costs", { precision: 10, scale: 2 }).default('0').notNull(),
  totalIncome: decimal("total_income", { precision: 10, scale: 2 }).notNull(),
  totalExpenses: decimal("total_expenses", { precision: 10, scale: 2 }).notNull(),
  remainingBalance: decimal("remaining_balance", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Worker types table (أنواع العمال)
export const workerTypes = pgTable("worker_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // اسم نوع العامل
  usageCount: integer("usage_count").default(1).notNull(), // عدد مرات الاستخدام
  lastUsed: timestamp("last_used").defaultNow().notNull(), // آخر استخدام
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Autocomplete data table (بيانات الإكمال التلقائي)
export const autocompleteData = pgTable("autocomplete_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(), // نوع البيانات: senderNames, recipientNames, etc
  value: text("value").notNull(), // القيمة المحفوظة
  usageCount: integer("usage_count").default(1).notNull(), // عدد مرات الاستخدام
  lastUsed: timestamp("last_used").defaultNow().notNull(), // آخر استخدام
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Worker miscellaneous expenses table (نثريات العمال)
export const workerMiscExpenses = pgTable("worker_misc_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(), // وصف النثريات
  date: text("date").notNull(), // تاريخ النثريات
  notes: text("notes"), // ملاحظات إضافية
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Print Settings Table (إعدادات الطباعة)
export const printSettings = pgTable('print_settings', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  reportType: text('report_type').notNull().default('worker_statement'),
  name: text('name').notNull(),
  
  // Page settings
  pageSize: text('page_size').notNull().default('A4'),
  pageOrientation: text('page_orientation').notNull().default('portrait'),
  marginTop: decimal('margin_top', { precision: 5, scale: 2 }).notNull().default('15.00'),
  marginBottom: decimal('margin_bottom', { precision: 5, scale: 2 }).notNull().default('15.00'),
  marginLeft: decimal('margin_left', { precision: 5, scale: 2 }).notNull().default('15.00'),
  marginRight: decimal('margin_right', { precision: 5, scale: 2 }).notNull().default('15.00'),
  
  // Font settings
  fontFamily: text('font_family').notNull().default('Arial'),
  fontSize: integer('font_size').notNull().default(12),
  headerFontSize: integer('header_font_size').notNull().default(16),
  tableFontSize: integer('table_font_size').notNull().default(10),
  
  // Color settings
  headerBackgroundColor: text('header_background_color').notNull().default('#1e40af'),
  headerTextColor: text('header_text_color').notNull().default('#ffffff'),
  tableHeaderColor: text('table_header_color').notNull().default('#1e40af'),
  tableRowEvenColor: text('table_row_even_color').notNull().default('#ffffff'),
  tableRowOddColor: text('table_row_odd_color').notNull().default('#f9fafb'),
  tableBorderColor: text('table_border_color').notNull().default('#000000'),
  
  // Table settings
  tableBorderWidth: integer('table_border_width').notNull().default(1),
  tableCellPadding: integer('table_cell_padding').notNull().default(3),
  tableColumnWidths: text('table_column_widths').notNull().default('[8,12,10,30,12,15,15,12]'),
  
  // Visual elements settings
  showHeader: boolean('show_header').notNull().default(true),
  showLogo: boolean('show_logo').notNull().default(true),
  showProjectInfo: boolean('show_project_info').notNull().default(true),
  showWorkerInfo: boolean('show_worker_info').notNull().default(true),
  showAttendanceTable: boolean('show_attendance_table').notNull().default(true),
  showTransfersTable: boolean('show_transfers_table').notNull().default(true),
  showSummary: boolean('show_summary').notNull().default(true),
  showSignatures: boolean('show_signatures').notNull().default(true),
  
  // System settings
  isDefault: boolean('is_default').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  userId: text('user_id'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Project fund transfers table (ترحيل الأموال بين المشاريع)
export const projectFundTransfers = pgTable("project_fund_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromProjectId: varchar("from_project_id").notNull().references(() => projects.id),
  toProjectId: varchar("to_project_id").notNull().references(() => projects.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"), // وصف الترحيل
  transferReason: text("transfer_reason"), // سبب الترحيل
  transferDate: text("transfer_date").notNull(), // YYYY-MM-DD format
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schema definitions for forms
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertWorkerSchema = createInsertSchema(workers).omit({ id: true, createdAt: true });
export const insertFundTransferSchema = createInsertSchema(fundTransfers).omit({ id: true, createdAt: true }).extend({
  amount: z.coerce.string(), // تحويل number إلى string تلقائياً للتوافق مع نوع decimal
  transferDate: z.coerce.date(), // تحويل string إلى Date تلقائياً
});
export const insertWorkerAttendanceSchema = createInsertSchema(workerAttendance).omit({ id: true, createdAt: true, actualWage: true }).extend({
  workDays: z.number().min(0.1).max(2.0).default(1.0), // عدد أيام العمل من 0.1 إلى 2.0
  dailyWage: z.coerce.string(), // تحويل إلى string للتوافق مع نوع decimal
  paidAmount: z.coerce.string().optional(), // تحويل إلى string للتوافق مع نوع decimal
  remainingAmount: z.coerce.string().optional(), // تحويل إلى string للتوافق مع نوع decimal
});
export const insertMaterialSchema = createInsertSchema(materials).omit({ id: true, createdAt: true });
export const insertMaterialPurchaseSchema = createInsertSchema(materialPurchases).omit({ id: true, createdAt: true }).extend({
  quantity: z.coerce.string(), // تحويل إلى string للتوافق مع نوع decimal
  unitPrice: z.coerce.string(), // تحويل إلى string للتوافق مع نوع decimal
  totalAmount: z.coerce.string(), // تحويل إلى string للتوافق مع نوع decimal
  purchaseType: z.string().default("نقد"), // قيمة افتراضية للنوع
  paidAmount: z.coerce.string().default("0"), // المبلغ المدفوع
  remainingAmount: z.coerce.string().default("0"), // المتبقي
});
export const insertTransportationExpenseSchema = createInsertSchema(transportationExpenses).omit({ id: true, createdAt: true }).extend({
  amount: z.coerce.string(), // تحويل number إلى string تلقائياً للتوافق مع نوع decimal
});
export const insertWorkerTransferSchema = createInsertSchema(workerTransfers).omit({ id: true, createdAt: true }).extend({
  amount: z.coerce.string(), // تحويل number إلى string تلقائياً للتوافق مع نوع decimal في قاعدة البيانات
});
export const insertWorkerBalanceSchema = createInsertSchema(workerBalances).omit({ id: true, createdAt: true, lastUpdated: true }).extend({
  totalEarned: z.coerce.string().optional(),
  totalPaid: z.coerce.string().optional(),
  totalTransferred: z.coerce.string().optional(),
  currentBalance: z.coerce.string().optional(),
});
export const insertProjectFundTransferSchema = createInsertSchema(projectFundTransfers).omit({ id: true, createdAt: true }).extend({
  amount: z.coerce.string(), // تحويل number إلى string تلقائياً للتوافق مع نوع decimal
});
export const insertDailyExpenseSummarySchema = createInsertSchema(dailyExpenseSummaries).omit({ id: true, createdAt: true });
export const insertWorkerTypeSchema = createInsertSchema(workerTypes).omit({ id: true, createdAt: true, lastUsed: true });
export const insertAutocompleteDataSchema = createInsertSchema(autocompleteData).omit({ id: true, createdAt: true, lastUsed: true });
export const insertWorkerMiscExpenseSchema = createInsertSchema(workerMiscExpenses).omit({ id: true, createdAt: true }).extend({
  amount: z.coerce.string(), // تحويل number إلى string تلقائياً للتوافق مع نوع decimal
});
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true, lastLogin: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, createdAt: true });
export const insertSupplierPaymentSchema = createInsertSchema(supplierPayments).omit({ id: true, createdAt: true }).extend({
  amount: z.coerce.string(), // تحويل number إلى string تلقائياً للتوافق مع نوع decimal
});
export const insertPrintSettingsSchema = createInsertSchema(printSettings).omit({ id: true, createdAt: true, updatedAt: true });

// Type definitions
export type Project = typeof projects.$inferSelect;
export type Worker = typeof workers.$inferSelect;
export type FundTransfer = typeof fundTransfers.$inferSelect;
export type WorkerAttendance = typeof workerAttendance.$inferSelect;
export type Material = typeof materials.$inferSelect;
export type MaterialPurchase = typeof materialPurchases.$inferSelect;
export type TransportationExpense = typeof transportationExpenses.$inferSelect;
export type WorkerTransfer = typeof workerTransfers.$inferSelect;
export type WorkerBalance = typeof workerBalances.$inferSelect;
export type DailyExpenseSummary = typeof dailyExpenseSummaries.$inferSelect;
export type WorkerType = typeof workerTypes.$inferSelect;
export type AutocompleteData = typeof autocompleteData.$inferSelect;
export type WorkerMiscExpense = typeof workerMiscExpenses.$inferSelect;
export type User = typeof users.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type SupplierPayment = typeof supplierPayments.$inferSelect;
export type PrintSettings = typeof printSettings.$inferSelect;
export type ProjectFundTransfer = typeof projectFundTransfers.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertWorker = z.infer<typeof insertWorkerSchema>;
export type InsertFundTransfer = z.infer<typeof insertFundTransferSchema>;
export type InsertWorkerAttendance = z.infer<typeof insertWorkerAttendanceSchema>;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type InsertMaterialPurchase = z.infer<typeof insertMaterialPurchaseSchema>;
export type InsertTransportationExpense = z.infer<typeof insertTransportationExpenseSchema>;
export type InsertWorkerTransfer = z.infer<typeof insertWorkerTransferSchema>;
export type InsertWorkerBalance = z.infer<typeof insertWorkerBalanceSchema>;
export type InsertDailyExpenseSummary = z.infer<typeof insertDailyExpenseSummarySchema>;
export type InsertWorkerType = z.infer<typeof insertWorkerTypeSchema>;
export type InsertAutocompleteData = z.infer<typeof insertAutocompleteDataSchema>;
export type InsertWorkerMiscExpense = z.infer<typeof insertWorkerMiscExpenseSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type InsertSupplierPayment = z.infer<typeof insertSupplierPaymentSchema>;
export type InsertPrintSettings = z.infer<typeof insertPrintSettingsSchema>;
export type InsertProjectFundTransfer = z.infer<typeof insertProjectFundTransferSchema>;

// ================================
// جداول نظام المصادقة والأمان المتقدم
// ================================

// جدول الأدوار (Roles)
export const authRoles = pgTable("auth_roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  description: text("description"),
  isSystem: boolean("is_system").default(false).notNull(),
  color: varchar("color", { length: 7 }).default("#3B82F6").notNull(), // لون للواجهة
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

// جدول الصلاحيات (Permissions)
export const authPermissions = pgTable("auth_permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(), // مثل: projects.create
  displayName: varchar("display_name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // مثل: projects, users, financial
  resource: varchar("resource", { length: 100 }).notNull(), // مثل: project, user, expense
  action: varchar("action", { length: 50 }).notNull(), // مثل: create, read, update, delete
  isDangerous: boolean("is_dangerous").default(false).notNull(), // للصلاحيات الحساسة
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// جدول ربط الأدوار بالصلاحيات (Role-Permission Relations)
export const authRolePermissions = pgTable("auth_role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull().references(() => authRoles.id, { onDelete: "cascade" }),
  permissionId: integer("permission_id").notNull().references(() => authPermissions.id, { onDelete: "cascade" }),
  grantedBy: varchar("granted_by").references(() => users.id),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
});

// جدول ربط المستخدمين بالأدوار (User-Role Relations)
export const authUserRoles = pgTable("auth_user_roles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: integer("role_id").notNull().references(() => authRoles.id, { onDelete: "cascade" }),
  grantedBy: varchar("granted_by").references(() => users.id),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // للأدوار المؤقتة
  isActive: boolean("is_active").default(true).notNull(),
});

// جدول الصلاحيات المباشرة للمستخدمين (User-Permission Overrides)
export const authUserPermissions = pgTable("auth_user_permissions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  permissionId: integer("permission_id").notNull().references(() => authPermissions.id, { onDelete: "cascade" }),
  granted: boolean("granted").default(true).notNull(), // true = منح، false = منع صراحة
  grantedBy: varchar("granted_by").references(() => users.id),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // للصلاحيات المؤقتة
  reason: text("reason"), // سبب منح أو منع الصلاحية
  isActive: boolean("is_active").default(true).notNull(),
});

// جدول الجلسات والأجهزة (User Sessions & Devices)
export const authUserSessions = pgTable("auth_user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // معلومات الجهاز
  deviceId: varchar("device_id", { length: 255 }).notNull(), // fingerprint للجهاز
  deviceName: varchar("device_name", { length: 255 }),
  deviceType: varchar("device_type", { length: 50 }), // web, mobile, desktop
  browserName: varchar("browser_name", { length: 100 }),
  browserVersion: varchar("browser_version", { length: 50 }),
  osName: varchar("os_name", { length: 100 }),
  osVersion: varchar("os_version", { length: 50 }),
  
  // معلومات الموقع والشبكة
  ipAddress: text("ip_address"), // استخدم text بدلاً من inet للتوافق
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
  timezone: varchar("timezone", { length: 50 }),
  
  // معلومات الجلسة
  refreshTokenHash: text("refresh_token_hash").notNull(),
  accessTokenHash: text("access_token_hash"),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isRevoked: boolean("is_revoked").default(false).notNull(),
  revokedAt: timestamp("revoked_at"),
  revokedReason: varchar("revoked_reason", { length: 100 }),
  
  // تتبع النشاط
  loginMethod: varchar("login_method", { length: 50 }).notNull().default("password"), // password, totp, backup_code
  isTrustedDevice: boolean("is_trusted_device").default(false).notNull(),
  securityFlags: jsonb("security_flags"), // معلومات أمان إضافية
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// جدول سجل التدقيق (Audit Log)
export const authAuditLog = pgTable("auth_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  sessionId: varchar("session_id").references(() => authUserSessions.id, { onDelete: "set null" }),
  
  // تفاصيل الحدث
  action: varchar("action", { length: 100 }).notNull(), // login, logout, create_user, etc.
  resource: varchar("resource", { length: 100 }), // user, project, role, etc.
  resourceId: varchar("resource_id"), // ID الكائن المتأثر
  
  // تفاصيل الطلب
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  method: varchar("method", { length: 10 }), // GET, POST, PUT, DELETE
  url: text("url"),
  
  // البيانات والنتائج
  requestData: jsonb("request_data"), // البيانات المرسلة
  responseData: jsonb("response_data"), // البيانات المرجعة
  oldValues: jsonb("old_values"), // القيم القديمة (للتحديثات)
  newValues: jsonb("new_values"), // القيم الجديدة (للتحديثات)
  
  // حالة العملية
  status: varchar("status", { length: 20 }).notNull().default("success"), // success, failed, error
  errorMessage: text("error_message"),
  duration: integer("duration"), // مدة العملية بالميلي ثانية
  
  // سياق إضافي
  riskLevel: varchar("risk_level", { length: 20 }).default("low").notNull(), // low, medium, high, critical
  tags: text("tags").array(), // علامات للتصنيف والبحث
  metadata: jsonb("metadata"), // معلومات إضافية
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// جدول رموز التحقق (Verification Codes)
export const authVerificationCodes = pgTable("auth_verification_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  
  // تفاصيل الكود
  code: varchar("code", { length: 10 }).notNull(), // الكود المرسل (مشفر)
  codeHash: text("code_hash").notNull(), // hash للتحقق
  type: varchar("type", { length: 50 }).notNull(), // email_verification, password_reset, phone_verification
  
  // معلومات الإرسال
  email: text("email"),
  phone: varchar("phone", { length: 50 }),
  sentVia: varchar("sent_via", { length: 20 }).notNull(), // email, sms, voice
  
  // حالة الكود
  isUsed: boolean("is_used").default(false).notNull(),
  usedAt: timestamp("used_at"),
  attempts: integer("attempts").default(0).notNull(),
  maxAttempts: integer("max_attempts").default(3).notNull(),
  
  // انتهاء الصلاحية
  expiresAt: timestamp("expires_at").notNull(),
  
  // أمان إضافي
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// جدول إعدادات الأمان للمستخدمين (User Security Settings)
export const authUserSecuritySettings = pgTable("auth_user_security_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  
  // إعدادات كلمة المرور
  passwordExpiryDays: integer("password_expiry_days").default(90),
  requirePasswordChange: boolean("require_password_change").default(false).notNull(),
  passwordHistory: jsonb("password_history"), // آخر كلمات المرور (مشفرة)
  
  // إعدادات المصادقة
  sessionTimeout: integer("session_timeout").default(30).notNull(), // بالدقائق
  maxSessions: integer("max_sessions").default(5).notNull(),
  requireMfaForSensitive: boolean("require_mfa_for_sensitive").default(false).notNull(),
  
  // إعدادات الأجهزة الموثقة
  trustDeviceDays: integer("trust_device_days").default(30).notNull(),
  autoRevokeInactive: boolean("auto_revoke_inactive").default(true).notNull(),
  inactivityDays: integer("inactivity_days").default(90).notNull(),
  
  // إعدادات التنبيهات
  notifyLoginFromNewDevice: boolean("notify_login_from_new_device").default(true).notNull(),
  notifyPasswordChange: boolean("notify_password_change").default(true).notNull(),
  notifyPermissionChange: boolean("notify_permission_change").default(true).notNull(),
  
  // إعدادات الخصوصية
  allowSessionSharing: boolean("allow_session_sharing").default(false).notNull(),
  logDetailLevel: varchar("log_detail_level", { length: 20 }).default("standard").notNull(), // minimal, standard, detailed
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});



// Report Templates Schema - إعدادات تصميم التقارير
export const reportTemplates = pgTable('report_templates', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  templateName: text('template_name').notNull().default('default'),
  
  // إعدادات الرأس
  headerTitle: text('header_title').notNull().default('نظام إدارة مشاريع البناء'),
  headerSubtitle: text('header_subtitle').default('تقرير مالي'),
  companyName: text('company_name').notNull().default('شركة البناء والتطوير'),
  companyAddress: text('company_address').default('صنعاء - اليمن'),
  companyPhone: text('company_phone').default('+967 1 234567'),
  companyEmail: text('company_email').default('info@company.com'),
  
  // إعدادات الذيل
  footerText: text('footer_text').default('تم إنشاء هذا التقرير بواسطة نظام إدارة المشاريع'),
  footerContact: text('footer_contact').default('للاستفسار: info@company.com | +967 1 234567'),
  
  // إعدادات الألوان
  primaryColor: text('primary_color').notNull().default('#1f2937'), // رمادي داكن
  secondaryColor: text('secondary_color').notNull().default('#3b82f6'), // أزرق
  accentColor: text('accent_color').notNull().default('#10b981'), // أخضر
  textColor: text('text_color').notNull().default('#1f2937'),
  backgroundColor: text('background_color').notNull().default('#ffffff'),
  
  // إعدادات التصميم
  fontSize: integer('font_size').notNull().default(11),
  fontFamily: text('font_family').notNull().default('Arial'),
  logoUrl: text('logo_url'), // رابط الشعار
  
  // إعدادات الطباعة
  pageOrientation: text('page_orientation').notNull().default('portrait'), // portrait أو landscape
  pageSize: text('page_size').notNull().default('A4'),
  margins: jsonb('margins').default({ top: 1, bottom: 1, left: 0.75, right: 0.75 }),
  
  // تفعيل/إلغاء العناصر
  showHeader: boolean('show_header').notNull().default(true),
  showFooter: boolean('show_footer').notNull().default(true),
  showLogo: boolean('show_logo').notNull().default(true),
  showDate: boolean('show_date').notNull().default(true),
  showPageNumbers: boolean('show_page_numbers').notNull().default(true),
  
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertReportTemplateSchema = createInsertSchema(reportTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertReportTemplate = z.infer<typeof insertReportTemplateSchema>;
export type ReportTemplate = typeof reportTemplates.$inferSelect;

// =====================================================
// نظام إدارة المعدات المبسط
// =====================================================

// Equipment (المعدات)
export const equipment = pgTable("equipment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").unique().notNull(), // رقم/كود المعدة - سيتم توليده تلقائياً
  name: text("name").notNull(), // اسم المعدة
  type: text("type"), // نوعها (حفار، مولد...)
  description: text("description"),
  imageUrl: text("image_url"), // رابط صورة المعدة
  purchaseDate: date("purchase_date"),
  purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }),
  status: text("status").notNull().default("active"), // نشط / صيانة / خارج الخدمة / غير نشط
  currentProjectId: varchar("current_project_id").references(() => projects.id), // المشروع الحالي
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Equipment Movements (سجل حركات المعدات)
export const equipmentMovements = pgTable("equipment_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  equipmentId: varchar("equipment_id").notNull().references(() => equipment.id, { onDelete: 'cascade' }),
  fromProjectId: varchar("from_project_id").references(() => projects.id),
  toProjectId: varchar("to_project_id").references(() => projects.id),
  movementDate: timestamp("movement_date").defaultNow().notNull(),
  reason: text("reason"),
  performedBy: text("performed_by").notNull(), // من قام بالنقل
  notes: text("notes"),
});

// Equipment insert schemas
export const insertEquipmentSchema = createInsertSchema(equipment).omit({
  id: true,
  code: true, // سيتم توليده تلقائياً
  createdAt: true,
  updatedAt: true,
}).extend({
  purchasePrice: z.coerce.string().optional(), // تحويل إلى string للتوافق مع نوع decimal
});

export const insertEquipmentMovementSchema = createInsertSchema(equipmentMovements).omit({
  id: true,
  movementDate: true,
});

export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipmentMovement = z.infer<typeof insertEquipmentMovementSchema>;
export type EquipmentMovement = typeof equipmentMovements.$inferSelect;

// =====================================================
// نظام إدارة فئات الأدوات
// =====================================================

// Tool Categories (فئات الأدوات)
export const toolCategories = pgTable("tool_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // اسم الفئة
  description: text("description"), // وصف الفئة
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tools (الأدوات)
export const tools = pgTable("tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").unique().notNull(), // رمز الأداة
  name: text("name").notNull(), // اسم الأداة
  categoryId: varchar("category_id").references(() => toolCategories.id),
  description: text("description"),
  purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }),
  currentValue: decimal("current_value", { precision: 12, scale: 2 }),
  condition: text("condition").default("good"), // جيد، متوسط، سيء
  location: text("location"), // الموقع الحالي
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tool Movements (حركات الأدوات)
export const toolMovements = pgTable("tool_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  toolId: varchar("tool_id").notNull().references(() => tools.id, { onDelete: 'cascade' }),
  fromLocation: text("from_location"),
  toLocation: text("to_location"),
  movementDate: timestamp("movement_date").defaultNow().notNull(),
  reason: text("reason"),
  performedBy: text("performed_by").notNull(),
  notes: text("notes"),
});

// =====================================================
// نظام الإشعارات المتكامل - Advanced Notifications System
// =====================================================

// Notifications (الإشعارات الرئيسية)
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id), // المشروع (optional)
  type: text("type").notNull(), // 'safety','task','payroll','announcement','message','system'
  title: text("title").notNull(),
  body: text("body").notNull(),
  payload: jsonb("payload"), // معلومات إضافية: task_id, attachments, etc
  priority: integer("priority").notNull().default(3), // 1=emergency, 2=high, 3=medium, 4=low, 5=info
  recipients: jsonb("recipients"), // قائمة معرفات المستقبلين أو المجموعات
  channelPreference: jsonb("channel_preference").default('{"push":true,"email":true,"sms":false}'), // تفضيلات القنوات
  createdBy: varchar("created_by").references(() => users.id),
  scheduledAt: timestamp("scheduled_at"), // للإشعارات المجدولة
  deliveredTo: jsonb("delivered_to"), // mapping user_id -> {delivered_at,channel,status}
  readBy: jsonb("read_by"), // mapping user_id -> read_at
  meta: jsonb("meta"), // معلومات إضافية
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notification Templates (قوالب الإشعارات)
export const notificationTemplates = pgTable("notification_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // اسم القالب
  type: text("type").notNull(), // نوع الإشعار
  titleTemplate: text("title_template").notNull(), // قالب العنوان مع متغيرات
  bodyTemplate: text("body_template").notNull(), // قالب النص مع متغيرات
  priority: integer("priority").notNull().default(3),
  channelPreference: jsonb("channel_preference").default('{"push":true,"email":false,"sms":false}'),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Notification Settings (إعدادات الإشعارات للمستخدمين)
export const notificationSettings = pgTable("notification_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  notificationType: text("notification_type").notNull(), // نوع الإشعار
  pushEnabled: boolean("push_enabled").default(true).notNull(),
  emailEnabled: boolean("email_enabled").default(true).notNull(),
  smsEnabled: boolean("sms_enabled").default(false).notNull(),
  doNotDisturbStart: text("dnd_start"), // وقت بداية عدم الإزعاج HH:MM
  doNotDisturbEnd: text("dnd_end"), // وقت نهاية عدم الإزعاج HH:MM
  projectScope: jsonb("project_scope"), // المشاريع المحددة أو "all"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserNotificationType: sql`UNIQUE (user_id, notification_type)`
}));

// Notification Read States (حالة قراءة الإشعارات) - محدث
export const notificationReadStates = pgTable("notification_read_states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // معرف المستخدم
  notificationId: varchar("notification_id").notNull(), // معرف الإشعار
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  actionTaken: text("action_taken"), // الإجراء المتخذ: "acknowledged", "dismissed", "acted"
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserNotification: sql`UNIQUE (user_id, notification_id)`
}));

// Notification Queue (طابور الإشعارات للإرسال)
export const notificationQueue = pgTable("notification_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  notificationId: varchar("notification_id").notNull().references(() => notifications.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull(),
  channel: text("channel").notNull(), // 'push', 'email', 'sms'
  status: text("status").default("pending").notNull(), // 'pending', 'sent', 'failed', 'retrying'
  attempts: integer("attempts").default(0).notNull(),
  maxAttempts: integer("max_attempts").default(3).notNull(),
  lastAttemptAt: timestamp("last_attempt_at"),
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Channels (قنوات التواصل - للرسائل المباشرة)
export const channels = pgTable("channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'project', 'private', 'group'
  projectId: varchar("project_id").references(() => projects.id), // للقنوات الخاصة بالمشاريع
  participants: jsonb("participants"), // قائمة معرفات المشاركين
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Messages (الرسائل)
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull().references(() => channels.id, { onDelete: 'cascade' }),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: text("message_type").default("text").notNull(), // 'text', 'image', 'file', 'system'
  attachments: jsonb("attachments"), // ملفات مرفقة
  replyToId: varchar("reply_to_id"), // الرد على رسالة - سنضيف المرجع لاحقاً
  isEdited: boolean("is_edited").default(false).notNull(),
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tool Categories insert schemas
export const insertToolCategorySchema = createInsertSchema(toolCategories).omit({
  id: true,
  createdAt: true,
});

export const insertToolSchema = createInsertSchema(tools).omit({
  id: true,
  code: true, // سيتم توليده تلقائياً
  createdAt: true,
  updatedAt: true,
}).extend({
  purchasePrice: z.coerce.string().optional(),
  currentValue: z.coerce.string().optional(),
});

export const insertToolMovementSchema = createInsertSchema(toolMovements).omit({
  id: true,
  movementDate: true,
});

// Notification schemas
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  deliveredTo: true,
  readBy: true,
});

export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationReadStateSchema = createInsertSchema(notificationReadStates).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export const insertNotificationQueueSchema = createInsertSchema(notificationQueue).omit({
  id: true,
  createdAt: true,
  lastAttemptAt: true,
  sentAt: true,
});

export const insertChannelSchema = createInsertSchema(channels).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  editedAt: true,
});

// =================================
// جداول المصادقة المتقدمة موجودة بالأعلى
// =================================

// Export types
export type ToolCategory = typeof toolCategories.$inferSelect;
export type InsertToolCategory = z.infer<typeof insertToolCategorySchema>;
export type Tool = typeof tools.$inferSelect;
export type InsertTool = z.infer<typeof insertToolSchema>;
export type ToolMovement = typeof toolMovements.$inferSelect;
export type InsertToolMovement = z.infer<typeof insertToolMovementSchema>;

// Notification types
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type InsertNotificationTemplate = z.infer<typeof insertNotificationTemplateSchema>;
export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;
export type NotificationReadState = typeof notificationReadStates.$inferSelect;
export type InsertNotificationReadState = z.infer<typeof insertNotificationReadStateSchema>;
export type NotificationQueue = typeof notificationQueue.$inferSelect;
export type InsertNotificationQueue = z.infer<typeof insertNotificationQueueSchema>;
export type Channel = typeof channels.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// إعداد أنواع الإشعارات
export const NotificationTypes = {
  SAFETY: 'safety' as const,
  TASK: 'task' as const,
  PAYROLL: 'payroll' as const,
  ANNOUNCEMENT: 'announcement' as const,
  MESSAGE: 'message' as const,
  SYSTEM: 'system' as const,
  MAINTENANCE: 'maintenance' as const,
  ATTENDANCE: 'attendance' as const,
} as const;

export type NotificationType = typeof NotificationTypes[keyof typeof NotificationTypes];

// أولويات الإشعارات
export const NotificationPriority = {
  EMERGENCY: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
  INFO: 5,
} as const;

export type NotificationPriorityType = typeof NotificationPriority[keyof typeof NotificationPriority];

// حالات الإرسال
export const NotificationStatus = {
  PENDING: 'pending' as const,
  SENT: 'sent' as const,
  FAILED: 'failed' as const,
  RETRYING: 'retrying' as const,
} as const;

export type NotificationStatusType = typeof NotificationStatus[keyof typeof NotificationStatus];

// ================================
// مخططات الإدراج للجداول الأمنية (Insert Schemas)
// ================================

export const insertAuthRoleSchema = createInsertSchema(authRoles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAuthPermissionSchema = createInsertSchema(authPermissions).omit({ id: true, createdAt: true });
export const insertAuthRolePermissionSchema = createInsertSchema(authRolePermissions).omit({ id: true, grantedAt: true });
export const insertAuthUserRoleSchema = createInsertSchema(authUserRoles).omit({ id: true, grantedAt: true });
export const insertAuthUserPermissionSchema = createInsertSchema(authUserPermissions).omit({ id: true, grantedAt: true });
export const insertAuthUserSessionSchema = createInsertSchema(authUserSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAuthAuditLogSchema = createInsertSchema(authAuditLog).omit({ id: true, createdAt: true });
export const insertAuthVerificationCodeSchema = createInsertSchema(authVerificationCodes).omit({ id: true, createdAt: true });
export const insertAuthUserSecuritySettingsSchema = createInsertSchema(authUserSecuritySettings).omit({ id: true, createdAt: true, updatedAt: true });

// ================================
// تعريفات الأنواع للجداول الأمنية (Type Definitions)
// ================================

// Select Types (أنواع القراءة)
export type AuthRole = typeof authRoles.$inferSelect;
export type AuthPermission = typeof authPermissions.$inferSelect;
export type AuthRolePermission = typeof authRolePermissions.$inferSelect;
export type AuthUserRole = typeof authUserRoles.$inferSelect;
export type AuthUserPermission = typeof authUserPermissions.$inferSelect;
export type AuthUserSession = typeof authUserSessions.$inferSelect;
export type AuthAuditLog = typeof authAuditLog.$inferSelect;
export type AuthVerificationCode = typeof authVerificationCodes.$inferSelect;
export type AuthUserSecuritySettings = typeof authUserSecuritySettings.$inferSelect;

// Insert Types (أنواع الإدراج)
export type InsertAuthRole = z.infer<typeof insertAuthRoleSchema>;
export type InsertAuthPermission = z.infer<typeof insertAuthPermissionSchema>;
export type InsertAuthRolePermission = z.infer<typeof insertAuthRolePermissionSchema>;
export type InsertAuthUserRole = z.infer<typeof insertAuthUserRoleSchema>;
export type InsertAuthUserPermission = z.infer<typeof insertAuthUserPermissionSchema>;
export type InsertAuthUserSession = z.infer<typeof insertAuthUserSessionSchema>;
export type InsertAuthAuditLog = z.infer<typeof insertAuthAuditLogSchema>;
export type InsertAuthVerificationCode = z.infer<typeof insertAuthVerificationCodeSchema>;
export type InsertAuthUserSecuritySettings = z.infer<typeof insertAuthUserSecuritySettingsSchema>;
