// نسخ جميع أنواع البيانات من التطبيق الويب

export interface Project {
  id: string;
  name: string;
  status: string;
  imageUrl?: string;
  createdAt: string;
}

export interface ProjectWithStats extends Project {
  stats: ProjectStats;
}

export interface ProjectStats {
  totalWorkers: string;
  totalExpenses: number;
  totalIncome: number;
  currentBalance: number;
  activeWorkers: string;
  completedDays: string;
  materialPurchases: string;
  lastActivity: string;
}

export interface Worker {
  id: string;
  name: string;
  type: string;
  dailyWage: string;
  isActive: boolean;
  createdAt: string;
}

export interface WorkerAttendance {
  id: string;
  projectId: string;
  workerId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  workDescription?: string;
  isPresent: boolean;
  workDays: string;
  dailyWage: string;
  actualWage: string;
  paidAmount: string;
  remainingAmount: string;
  paymentType: string;
  createdAt: string;
}

export interface DailyExpense {
  id: string;
  projectId: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  receipt?: string;
  createdAt: string;
}

export interface MaterialPurchase {
  id: string;
  projectId: string;
  supplierId?: string;
  materialId: string;
  quantity: string;
  unitPrice: string;
  totalAmount: string;
  purchaseType: string;
  paidAmount: string;
  remainingAmount: string;
  supplierName?: string;
  invoiceNumber?: string;
  invoiceDate: string;
  dueDate?: string;
  invoicePhoto?: string;
  notes?: string;
  purchaseDate: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  paymentTerms: string;
  totalDebt: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  purchaseDate?: string;
  purchasePrice?: string;
  currentValue?: string;
  condition: string;
  status: string;
  location?: string;
  assignedTo?: string;
  warrantyExpiryDate?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceCost?: string;
  notes?: string;
  qrCode?: string;
  createdAt: string;
}

export interface FundTransfer {
  id: string;
  projectId: string;
  amount: string;
  senderName?: string;
  transferNumber?: string;
  transferType: string;
  transferDate: string;
  notes?: string;
  createdAt: string;
}