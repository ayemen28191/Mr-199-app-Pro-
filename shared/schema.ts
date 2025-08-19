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
export const insertWorkerTransferSchema = createInsertSchema(workerTransfers).omit({ id: true, createdAt: true });
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

// =====================================================
// نظام إدارة المعدات والأدوات الاحترافي
// =====================================================

// Tool Categories (تصنيفات الأدوات)
export const toolCategories = pgTable("tool_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon"), // أيقونة التصنيف
  color: text("color").default("#3b82f6"), // لون التصنيف
  parentId: varchar("parent_id").references((): any => toolCategories.id, { onDelete: 'cascade' }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tools (الأدوات الرئيسية)
export const tools = pgTable("tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sku: text("sku").unique(), // كود المخزون
  name: text("name").notNull(),
  description: text("description"),
  categoryId: varchar("category_id").references(() => toolCategories.id),
  projectId: varchar("project_id").references(() => projects.id), // المشروع المرتبط
  unit: text("unit").notNull().default("قطعة"), // الوحدة
  
  // خصائص الأداة
  isTool: boolean("is_tool").default(true).notNull(), // أداة عمل
  isConsumable: boolean("is_consumable").default(false).notNull(), // قابل للاستهلاك
  isSerial: boolean("is_serial").default(false).notNull(), // له رقم تسلسلي
  
  // معلومات الشراء والمالية
  purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }),
  currentValue: decimal("current_value", { precision: 12, scale: 2 }), // القيمة الحالية
  depreciationRate: decimal("depreciation_rate", { precision: 5, scale: 2 }), // معدل الإهلاك السنوي
  purchaseDate: timestamp("purchase_date"),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  warrantyExpiry: timestamp("warranty_expiry"),
  
  // معلومات الصيانة
  maintenanceInterval: integer("maintenance_interval"), // عدد الأيام بين الصيانة
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  nextMaintenanceDate: timestamp("next_maintenance_date"),
  
  // الحالة والموقع
  status: text("status").notNull().default("available"), // available, assigned, maintenance, lost, consumed, reserved
  condition: text("condition").notNull().default("excellent"), // excellent, good, fair, poor, damaged
  locationType: text("location_type"), // نوع الموقع (مخزن، مشروع، فرع، مكتب، ورشة)
  locationId: text("location_id"), // تحديد الموقع
  
  // معلومات إضافية
  serialNumber: text("serial_number"),
  barcode: text("barcode"),
  qrCode: text("qr_code"),
  imageUrls: text("image_urls").array(),
  notes: text("notes"),
  specifications: jsonb("specifications"), // مواصفات تقنية
  
  // تتبع الاستخدام
  totalUsageHours: decimal("total_usage_hours", { precision: 10, scale: 2 }).default('0'),
  usageCount: integer("usage_count").default(0),
  
  // تقييم الذكاء الاصطناعي
  aiRating: decimal("ai_rating", { precision: 3, scale: 2 }), // تقييم من 1-5
  aiNotes: text("ai_notes"), // ملاحظات الذكاء الاصطناعي
  
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tool Stock (مخزون الأدوات حسب الموقع)
export const toolStock = pgTable("tool_stock", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  toolId: varchar("tool_id").notNull().references(() => tools.id, { onDelete: 'cascade' }),
  
  // معلومات الموقع
  locationType: text("location_type").notNull(), // warehouse, project, external, maintenance, none
  locationId: varchar("location_id"), // مرجع للمشروع أو المخزن
  locationName: text("location_name"), // اسم الموقع للعرض
  
  // الكميات
  quantity: integer("quantity").notNull().default(0),
  availableQuantity: integer("available_quantity").notNull().default(0),
  reservedQuantity: integer("reserved_quantity").notNull().default(0),
  
  // معلومات إضافية
  notes: text("notes"),
  lastVerifiedAt: timestamp("last_verified_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueToolLocation: sql`UNIQUE (tool_id, location_type, location_id)`
}));

// Tool Movements (سجل حركات الأدوات)
export const toolMovements = pgTable("tool_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  toolId: varchar("tool_id").notNull().references(() => tools.id, { onDelete: 'cascade' }),
  
  // معلومات الحركة
  movementType: text("movement_type").notNull(), // purchase, transfer, return, consume, adjust, maintenance, lost
  quantity: integer("quantity").notNull(),
  
  // من إلى
  fromType: text("from_type"), // warehouse, project, external, supplier, none
  fromId: varchar("from_id"),
  fromName: text("from_name"),
  
  toType: text("to_type"), // warehouse, project, external, maintenance, none
  toId: varchar("to_id"),
  toName: text("to_name"),
  
  // معلومات إضافية
  reason: text("reason"),
  notes: text("notes"),
  referenceNumber: text("reference_number"), // رقم مرجعي للعملية
  cost: decimal("cost", { precision: 12, scale: 2 }), // تكلفة العملية
  
  // تتبع الموقع الجغرافي (GPS)
  gpsLocation: jsonb("gps_location"), // {lat, lng, accuracy, timestamp}
  
  // مرفقات
  imageUrls: text("image_urls").array(),
  documentUrls: text("document_urls").array(),
  
  // معلومات المستخدم
  performedBy: varchar("performed_by").references(() => users.id),
  performedAt: timestamp("performed_at").defaultNow().notNull(),
  
  // معلومات الموافقة
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // مراجع خارجية
  purchaseId: varchar("purchase_id"), // مرجع لفاتورة الشراء
  projectId: varchar("project_id").references(() => projects.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tool Maintenance Logs (سجل صيانة الأدوات)
export const toolMaintenanceLogs = pgTable("tool_maintenance_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  toolId: varchar("tool_id").notNull().references(() => tools.id, { onDelete: 'cascade' }),
  
  // نوع الصيانة
  maintenanceType: text("maintenance_type").notNull(), // preventive, corrective, emergency, inspection
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  
  // تفاصيل الصيانة
  title: text("title").notNull(),
  description: text("description"),
  workPerformed: text("work_performed"),
  
  // التواريخ
  scheduledDate: timestamp("scheduled_date"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  nextDueDate: timestamp("next_due_date"),
  
  // الحالة
  status: text("status").notNull().default("scheduled"), // scheduled, in_progress, completed, cancelled, overdue
  
  // التكلفة
  laborCost: decimal("labor_cost", { precision: 12, scale: 2 }).default('0'),
  partsCost: decimal("parts_cost", { precision: 12, scale: 2 }).default('0'),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).default('0'),
  
  // المشاركون
  performedBy: varchar("performed_by").references(() => users.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  
  // تقييم الحالة
  conditionBefore: text("condition_before"), // حالة الأداة قبل الصيانة
  conditionAfter: text("condition_after"), // حالة الأداة بعد الصيانة
  
  // مرفقات
  imageUrls: text("image_urls").array(),
  documentUrls: text("document_urls").array(),
  
  // ملاحظات
  notes: text("notes"),
  issues: text("issues"), // المشاكل المكتشفة
  recommendations: text("recommendations"), // التوصيات
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tool Usage Analytics (تحليلات استخدام الأدوات)
export const toolUsageAnalytics = pgTable("tool_usage_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  toolId: varchar("tool_id").notNull().references(() => tools.id, { onDelete: 'cascade' }),
  projectId: varchar("project_id").references(() => projects.id),
  
  // فترة التحليل
  analysisDate: text("analysis_date").notNull(), // YYYY-MM-DD
  analysisWeek: text("analysis_week"), // YYYY-WW
  analysisMonth: text("analysis_month"), // YYYY-MM
  
  // إحصائيات الاستخدام
  usageHours: decimal("usage_hours", { precision: 10, scale: 2 }).default('0'),
  transferCount: integer("transfer_count").default(0),
  maintenanceCount: integer("maintenance_count").default(0),
  
  // إحصائيات التكلفة
  operationalCost: decimal("operational_cost", { precision: 12, scale: 2 }).default('0'),
  maintenanceCost: decimal("maintenance_cost", { precision: 12, scale: 2 }).default('0'),
  
  // تقييم الأداء
  utilizationRate: decimal("utilization_rate", { precision: 5, scale: 2 }), // معدل الاستخدام %
  efficiencyScore: decimal("efficiency_score", { precision: 5, scale: 2 }), // نقاط الكفاءة
  
  // تنبؤات الذكاء الاصطناعي
  predictedUsage: decimal("predicted_usage", { precision: 10, scale: 2 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tool Purchase Integration (ربط الأدوات بالمشتريات) - مرحلة 3
export const toolPurchaseItems = pgTable("tool_purchase_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // ربط مع المشتريات
  materialPurchaseId: varchar("material_purchase_id").notNull().references(() => materialPurchases.id, { onDelete: 'cascade' }),
  
  // معلومات الأداة المشتراة
  itemName: text("item_name").notNull(), // اسم البند كما في الفاتورة
  itemDescription: text("item_description"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  
  // تصنيف الأداة
  isToolItem: boolean("is_tool_item").default(false).notNull(), // هل هذا البند أداة؟
  suggestedCategoryId: varchar("suggested_category_id").references(() => toolCategories.id), // التصنيف المقترح
  
  // حالة التحويل إلى أداة
  conversionStatus: text("conversion_status").notNull().default("pending"), // pending, converted, skipped, failed
  toolId: varchar("tool_id").references(() => tools.id), // مرجع الأداة المنشأة
  
  // ذكاء اصطناعي للتصنيف
  aiConfidence: decimal("ai_confidence", { precision: 5, scale: 2 }), // ثقة الذكاء الاصطناعي في التصنيف
  aiSuggestions: jsonb("ai_suggestions"), // اقتراحات الذكاء الاصطناعي
  
  // معلومات إضافية
  notes: text("notes"),
  convertedAt: timestamp("converted_at"),
  convertedBy: varchar("converted_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Advanced Maintenance Schedules (جداول الصيانة المتقدمة) - مرحلة 3
export const maintenanceSchedules = pgTable("maintenance_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  toolId: varchar("tool_id").notNull().references(() => tools.id, { onDelete: 'cascade' }),
  
  // نوع الجدولة
  scheduleType: text("schedule_type").notNull(), // time_based, usage_based, condition_based, custom
  
  // إعدادات الجدولة الزمنية
  intervalDays: integer("interval_days"), // الفترة بالأيام
  intervalWeeks: integer("interval_weeks"), // الفترة بالأسابيع
  intervalMonths: integer("interval_months"), // الفترة بالشهور
  
  // إعدادات الجدولة بالاستخدام
  usageHoursInterval: decimal("usage_hours_interval", { precision: 10, scale: 2 }), // فترة بساعات العمل
  usageCountInterval: integer("usage_count_interval"), // فترة بعدد الاستخدامات
  
  // حالة الجدولة
  isActive: boolean("is_active").default(true).notNull(),
  
  // تواريخ مهمة
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  nextDueDate: timestamp("next_due_date").notNull(),
  
  // تفاصيل الصيانة
  maintenanceType: text("maintenance_type").notNull().default("preventive"), // preventive, corrective, inspection
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  estimatedDuration: integer("estimated_duration"), // المدة المقدرة بالساعات
  estimatedCost: decimal("estimated_cost", { precision: 12, scale: 2 }),
  
  // المسؤوليات
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdBy: varchar("created_by").references(() => users.id),
  
  // ملاحظات ووصف
  title: text("title").notNull(),
  description: text("description"),
  checklistItems: jsonb("checklist_items"), // قائمة مراجعة JSON
  
  // تنبيهات
  enableNotifications: boolean("enable_notifications").default(true).notNull(),
  notifyDaysBefore: integer("notify_days_before").default(3).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Maintenance Tasks (مهام الصيانة التفصيلية) - مرحلة 3
export const maintenanceTasks = pgTable("maintenance_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scheduleId: varchar("schedule_id").notNull().references(() => maintenanceSchedules.id, { onDelete: 'cascade' }),
  toolId: varchar("tool_id").notNull().references(() => tools.id, { onDelete: 'cascade' }),
  
  // معلومات المهمة
  taskName: text("task_name").notNull(),
  taskDescription: text("task_description"),
  taskType: text("task_type").notNull(), // inspection, cleaning, lubrication, replacement, repair, calibration
  
  // الأولوية والحالة
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, cancelled, overdue
  
  // التوقيت
  dueDate: timestamp("due_date").notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  estimatedDuration: integer("estimated_duration"), // بالدقائق
  actualDuration: integer("actual_duration"), // بالدقائق
  
  // التكلفة
  estimatedCost: decimal("estimated_cost", { precision: 12, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 12, scale: 2 }),
  
  // المسؤوليات
  assignedTo: varchar("assigned_to").references(() => users.id),
  performedBy: varchar("performed_by").references(() => users.id),
  
  // النتائج
  result: text("result"), // success, failed, partial, needs_followup
  findings: text("findings"), // ما تم اكتشافه
  actionsTaken: text("actions_taken"), // الإجراءات المتخذة
  recommendations: text("recommendations"), // التوصيات
  
  // المرفقات والوثائق
  beforeImages: text("before_images").array(), // صور قبل الصيانة
  afterImages: text("after_images").array(), // صور بعد الصيانة
  documentUrls: text("document_urls").array(), // مستندات
  
  // المواد المستخدمة
  materialsUsed: jsonb("materials_used"), // JSON array of {name, quantity, cost}
  
  // التوقيعات والموافقات
  performerSignature: text("performer_signature"), // توقيع المنفذ
  supervisorSignature: text("supervisor_signature"), // توقيع المشرف
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // ملاحظات
  notes: text("notes"),
  internalNotes: text("internal_notes"), // ملاحظات داخلية
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Cost Tracking for Tools (تتبع التكاليف للأدوات) - مرحلة 3
export const toolCostTracking = pgTable("tool_cost_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  toolId: varchar("tool_id").notNull().references(() => tools.id, { onDelete: 'cascade' }),
  
  // نوع التكلفة
  costType: text("cost_type").notNull(), // purchase, maintenance, operation, depreciation, insurance, storage
  costCategory: text("cost_category").notNull(), // capital, operational, unexpected
  
  // التكلفة
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("YER"), // العملة
  
  // التاريخ والفترة
  costDate: text("cost_date").notNull(), // YYYY-MM-DD
  costPeriod: text("cost_period"), // monthly, yearly, one-time
  
  // المرجع
  referenceType: text("reference_type"), // purchase_invoice, maintenance_log, manual_entry
  referenceId: varchar("reference_id"), // مرجع للفاتورة أو سجل الصيانة
  
  // تفاصيل إضافية
  description: text("description").notNull(),
  notes: text("notes"),
  
  // الموافقات
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // المشروع المرتبط
  projectId: varchar("project_id").references(() => projects.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueToolDate: sql`UNIQUE (tool_id, analysis_date)`
}));

// Tool Reservations (حجوزات الأدوات)
export const toolReservations = pgTable("tool_reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  toolId: varchar("tool_id").notNull().references(() => tools.id, { onDelete: 'cascade' }),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  
  // تفاصيل الحجز
  quantity: integer("quantity").notNull(),
  reservedBy: varchar("reserved_by").notNull().references(() => users.id),
  
  // التواريخ
  reservationDate: timestamp("reservation_date").defaultNow().notNull(),
  requestedDate: timestamp("requested_date").notNull(),
  expiryDate: timestamp("expiry_date"),
  
  // الحالة
  status: text("status").notNull().default("pending"), // pending, approved, fulfilled, cancelled, expired
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  
  // ملاحظات
  reason: text("reason"),
  notes: text("notes"),
  
  // الموافقة
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // الإنجاز
  fulfilledBy: varchar("fulfilled_by").references(() => users.id),
  fulfilledAt: timestamp("fulfilled_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schema Types and Validators for Tools System
export const insertToolCategorySchema = createInsertSchema(toolCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertToolSchema = createInsertSchema(tools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema مخصص لتحديث الأدوات مع معالجة تحويل الأنواع
export const updateToolSchema = insertToolSchema.extend({
  purchasePrice: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === undefined || val === null || val === '') return undefined;
    return typeof val === 'string' ? val : val.toString();
  }),
  currentValue: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === undefined || val === null || val === '') return undefined;
    return typeof val === 'string' ? val : val.toString();
  }),
  depreciationRate: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === undefined || val === null || val === '') return undefined;
    return typeof val === 'string' ? val : val.toString();
  }),
  purchaseDate: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return undefined;
    if (typeof val === 'string') {
      const date = new Date(val);
      return isNaN(date.getTime()) ? undefined : date;
    }
    return val;
  }),
  warrantyExpiry: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return undefined;
    if (typeof val === 'string') {
      const date = new Date(val);
      return isNaN(date.getTime()) ? undefined : date;
    }
    return val;
  }),
  lastMaintenanceDate: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return undefined;
    if (typeof val === 'string') {
      const date = new Date(val);
      return isNaN(date.getTime()) ? undefined : date;
    }
    return val;
  }),
  nextMaintenanceDate: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return undefined;
    if (typeof val === 'string') {
      const date = new Date(val);
      return isNaN(date.getTime()) ? undefined : date;
    }
    return val;
  }),
}).partial();

export const insertToolStockSchema = createInsertSchema(toolStock).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertToolMovementSchema = createInsertSchema(toolMovements).omit({
  id: true,
  createdAt: true,
});

export const insertToolMaintenanceLogSchema = createInsertSchema(toolMaintenanceLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertToolUsageAnalyticsSchema = createInsertSchema(toolUsageAnalytics).omit({
  id: true,
  createdAt: true,
});

export const insertToolReservationSchema = createInsertSchema(toolReservations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertToolCategory = z.infer<typeof insertToolCategorySchema>;
export type ToolCategory = typeof toolCategories.$inferSelect;

export type InsertTool = z.infer<typeof insertToolSchema>;
export type UpdateTool = z.infer<typeof updateToolSchema>;
export type Tool = typeof tools.$inferSelect;

export type InsertToolStock = z.infer<typeof insertToolStockSchema>;
export type ToolStock = typeof toolStock.$inferSelect;

export type InsertToolMovement = z.infer<typeof insertToolMovementSchema>;
export type ToolMovement = typeof toolMovements.$inferSelect;

export type InsertToolMaintenanceLog = z.infer<typeof insertToolMaintenanceLogSchema>;
export type ToolMaintenanceLog = typeof toolMaintenanceLogs.$inferSelect;

export type InsertToolUsageAnalytics = z.infer<typeof insertToolUsageAnalyticsSchema>;
export type ToolUsageAnalytics = typeof toolUsageAnalytics.$inferSelect;

export type InsertToolReservation = z.infer<typeof insertToolReservationSchema>;
export type ToolReservation = typeof toolReservations.$inferSelect;

// New schemas for Phase 3 - Integration & Advanced Maintenance
export const insertToolPurchaseItemSchema = createInsertSchema(toolPurchaseItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMaintenanceScheduleSchema = createInsertSchema(maintenanceSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMaintenanceTaskSchema = createInsertSchema(maintenanceTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertToolCostTrackingSchema = createInsertSchema(toolCostTracking).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// New types for Phase 3
export type InsertToolPurchaseItem = z.infer<typeof insertToolPurchaseItemSchema>;
export type ToolPurchaseItem = typeof toolPurchaseItems.$inferSelect;

export type InsertMaintenanceSchedule = z.infer<typeof insertMaintenanceScheduleSchema>;
export type MaintenanceSchedule = typeof maintenanceSchedules.$inferSelect;

export type InsertMaintenanceTask = z.infer<typeof insertMaintenanceTaskSchema>;
export type MaintenanceTask = typeof maintenanceTasks.$inferSelect;

export type InsertToolCostTracking = z.infer<typeof insertToolCostTrackingSchema>;
export type ToolCostTracking = typeof toolCostTracking.$inferSelect;
