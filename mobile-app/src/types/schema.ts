// أنواع البيانات الموحدة مع النظام الويب - مطابقة 100%
// تم إنشاؤها بناءً على shared/schema.ts

export interface User {
  id: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'manager' | 'user';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'paused';
  imageUrl?: string;
  createdAt: Date;
}

export interface Worker {
  id: string;
  name: string;
  type: string; // معلم (master), عامل (worker)
  dailyWage: number;
  isActive: boolean;
  createdAt: Date;
}

export interface WorkerAttendance {
  id: string;
  projectId: string;
  workerId: string;
  date: string; // YYYY-MM-DD format
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  workDescription?: string;
  isPresent: boolean;
  workDays: number; // عدد أيام العمل (مثل 0.5، 1.0، 1.5)
  dailyWage: number; // الأجر اليومي الكامل
  actualWage: number; // الأجر الفعلي = dailyWage * workDays
  paidAmount: number; // المبلغ المدفوع فعلياً (الصرف)
  remainingAmount: number; // المتبقي في حساب العامل
  paymentType: 'full' | 'partial' | 'credit';
  createdAt: Date;
}

export interface Equipment {
  id: string;
  code: string; // رقم/كود المعدة - سيتم توليده تلقائياً
  name: string; // اسم المعدة
  type?: string; // نوعها (حفار، مولد...)
  description?: string;
  imageUrl?: string; // رابط صورة المعدة
  purchaseDate?: Date;
  purchasePrice?: number;
  status: 'active' | 'maintenance' | 'out_of_service' | 'inactive';
  currentProjectId?: string; // المشروع الحالي
  createdAt: Date;
  updatedAt: Date;
}

export interface EquipmentMovement {
  id: string;
  equipmentId: string;
  fromLocation?: string;
  toLocation: string;
  moveDate: string; // YYYY-MM-DD format
  moveReason: string;
  movedBy?: string;
  notes?: string;
  createdAt: Date;
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  maintenanceType: 'preventive' | 'corrective' | 'inspection' | 'repair';
  description: string;
  maintenanceDate: string; // YYYY-MM-DD format
  cost?: number;
  performedBy?: string;
  nextMaintenanceDate?: string;
  notes?: string;
  createdAt: Date;
}

export interface Material {
  id: string;
  name: string;
  unit: string; // وحدة القياس (متر، كيس، طن...)
  currentStock: number;
  minimumStock: number;
  unitPrice: number;
  description?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialPurchase {
  id: string;
  projectId: string;
  supplierId?: string; // ربط بالمورد
  materialId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  purchaseType: string; // نقد، أجل
  paidAmount: number; // المبلغ المدفوع
  remainingAmount: number; // المتبقي
  supplierName?: string; // اسم المورد (للتوافق العكسي)
  invoiceNumber?: string;
  invoiceDate: string; // تاريخ الفاتورة - YYYY-MM-DD format
  dueDate?: string; // تاريخ الاستحقاق للفواتير الآجلة
  invoicePhoto?: string; // base64 or file path
  notes?: string;
  purchaseDate: string; // YYYY-MM-DD format
  createdAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  paymentTerms?: string; // شروط الدفع
  creditLimit?: number; // الحد الائتماني
  currentBalance: number; // الرصيد الحالي (مدين/دائن)
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransportationExpense {
  id: string;
  projectId: string;
  workerId?: string; // optional, for worker-specific transport
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD format
  notes?: string;
  createdAt: Date;
}

export interface WorkerBalance {
  id: string;
  workerId: string;
  projectId: string;
  totalEarned: number; // إجمالي المكتسب
  totalPaid: number; // إجمالي المدفوع
  totalTransferred: number; // إجمالي المحول للأهل
  currentBalance: number; // الرصيد الحالي
  lastUpdated: Date;
  createdAt: Date;
}

export interface DailyExpenseSummary {
  id: string;
  projectId: string;
  date: string; // YYYY-MM-DD format
  carriedForwardAmount: number;
  totalFundTransfers: number;
  totalWorkerWages: number;
  totalMaterialCosts: number;
  totalTransportationCosts: number;
  totalIncome: number;
  totalExpenses: number;
  remainingBalance: number;
  createdAt: Date;
}

export interface ReportTemplate {
  id: string;
  templateName: string;
  
  // إعدادات الرأس
  headerTitle: string;
  headerSubtitle?: string;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  
  // إعدادات الذيل
  footerText?: string;
  footerContact?: string;
  
  // إعدادات الألوان
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  
  // إعدادات التصميم
  fontSize: number;
  fontFamily: string;
  logoUrl?: string;
  
  // إعدادات الطباعة
  pageOrientation: 'portrait' | 'landscape';
  pageSize: string;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  
  // تفعيل/إلغاء العناصر
  showHeader: boolean;
  showFooter: boolean;
  showLogo: boolean;
  showDate: boolean;
  showPageNumbers: boolean;
  
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AutocompleteData {
  id: string;
  category: string;
  value: string;
  usageCount: number;
  lastUsed?: Date;
  createdAt: Date;
}

// أنواع إضافية للتطبيق المحمول
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalWorkers: number;
  activeWorkers: number;
  totalEquipment: number;
  activeEquipment: number;
  todayExpenses: number;
  monthlyExpenses: number;
}

export interface ProjectSummary {
  project: Project;
  stats: {
    totalWorkers: number;
    activeWorkers: number;
    totalEquipment: number;
    todayExpenses: number;
    totalExpenses: number;
  };
}

// أنواع النماذج
export interface WorkerAttendanceForm {
  workerId: string;
  projectId: string;
  date: string;
  isPresent: boolean;
  startTime?: string;
  endTime?: string;
  workDescription?: string;
  workDays: number;
  paymentType: 'full' | 'partial' | 'credit';
  paidAmount?: number;
}

export interface EquipmentForm {
  name: string;
  type?: string;
  description?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  status: 'active' | 'maintenance' | 'out_of_service' | 'inactive';
  currentProjectId?: string;
}

export interface MaterialPurchaseForm {
  materialId: string;
  supplierId?: string;
  quantity: number;
  unitPrice: number;
  purchaseType: string;
  paidAmount: number;
  supplierName?: string;
  invoiceNumber?: string;
  invoiceDate: string;
  dueDate?: string;
  notes?: string;
}

// أنواع الفلاتر والبحث
export interface WorkerFilter {
  type?: string;
  isActive?: boolean;
  projectId?: string;
  search?: string;
}

export interface EquipmentFilter {
  status?: string;
  type?: string;
  projectId?: string;
  search?: string;
}

export interface ExpenseFilter {
  dateFrom?: string;
  dateTo?: string;
  projectId?: string;
  type?: string;
}

// حالات التطبيق
export interface AppState {
  currentProject?: Project;
  user?: User;
  theme: 'light' | 'dark';
  language: 'ar' | 'en';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// أنواع الإحصائيات والتقارير
export interface ExpenseReport {
  date: string;
  workerWages: number;
  materialCosts: number;
  transportationCosts: number;
  totalExpenses: number;
  remainingBalance: number;
}

export interface WorkerReport {
  worker: Worker;
  totalDays: number;
  totalEarned: number;
  totalPaid: number;
  currentBalance: number;
  attendanceRate: number;
}

export interface EquipmentReport {
  equipment: Equipment;
  totalMaintenanceCost: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  utilizationRate: number;
  status: string;
}