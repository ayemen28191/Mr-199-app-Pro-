import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (جدول المستخدمين)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // سيتم تشفيرها
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("admin"), // admin, manager, user
  isActive: boolean("is_active").default(true).notNull(),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"), // active, completed, paused
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
  transferDate: z.coerce.date(), // تحويل string إلى Date تلقائياً
});
export const insertWorkerAttendanceSchema = createInsertSchema(workerAttendance).omit({ id: true, createdAt: true, actualWage: true }).extend({
  workDays: z.number().min(0.1).max(2.0).default(1.0), // عدد أيام العمل من 0.1 إلى 2.0
});
export const insertMaterialSchema = createInsertSchema(materials).omit({ id: true, createdAt: true });
export const insertMaterialPurchaseSchema = createInsertSchema(materialPurchases).omit({ id: true, createdAt: true }).extend({
  quantity: z.coerce.number().positive(), // تحويل تلقائي للرقم
  unitPrice: z.coerce.number().positive(), // تحويل تلقائي للرقم
  totalAmount: z.coerce.number().positive(), // تحويل تلقائي للرقم
  purchaseType: z.string().default("نقد"), // قيمة افتراضية للنوع
  paidAmount: z.coerce.number().default(0), // المبلغ المدفوع
  remainingAmount: z.coerce.number().default(0), // المتبقي
});
export const insertTransportationExpenseSchema = createInsertSchema(transportationExpenses).omit({ id: true, createdAt: true });
export const insertWorkerTransferSchema = createInsertSchema(workerTransfers).omit({ id: true, createdAt: true }).extend({
  amount: z.coerce.number().positive(), // تحويل تلقائي للرقم
});
export const insertWorkerBalanceSchema = createInsertSchema(workerBalances).omit({ id: true, createdAt: true, lastUpdated: true });
export const insertProjectFundTransferSchema = createInsertSchema(projectFundTransfers).omit({ id: true, createdAt: true });
export const insertDailyExpenseSummarySchema = createInsertSchema(dailyExpenseSummaries).omit({ id: true, createdAt: true });
export const insertWorkerTypeSchema = createInsertSchema(workerTypes).omit({ id: true, createdAt: true, lastUsed: true });
export const insertAutocompleteDataSchema = createInsertSchema(autocompleteData).omit({ id: true, createdAt: true, lastUsed: true });
export const insertWorkerMiscExpenseSchema = createInsertSchema(workerMiscExpenses).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true, lastLogin: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, createdAt: true });
export const insertSupplierPaymentSchema = createInsertSchema(supplierPayments).omit({ id: true, createdAt: true });
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
