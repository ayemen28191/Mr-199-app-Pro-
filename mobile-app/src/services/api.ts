// خدمة API موحدة مع النظام الويب - مطابقة 100%
import { 
  Project, 
  Worker, 
  WorkerAttendance, 
  Equipment, 
  Material, 
  MaterialPurchase,
  Supplier
} from '../types/schema';

// API-specific types
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalWorkers: number;
  activeWorkers: number;
  totalSuppliers: number;
  totalEquipment: number;
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// تحديد عنوان API بناءً على البيئة
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api'  // للتطوير
  : 'https://your-production-domain.com/api'; // للإنتاج

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ غير معروف',
      };
    }
  }

  // Projects API
  async getProjects(): Promise<ApiResponse<Project[]>> {
    return this.request<Project[]>('/projects');
  }

  async getProject(id: string): Promise<ApiResponse<Project>> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(project: Omit<Project, 'id' | 'createdAt'>): Promise<ApiResponse<Project>> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(id: string, project: Partial<Project>): Promise<ApiResponse<Project>> {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    });
  }

  async deleteProject(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Workers API
  async getWorkers(): Promise<ApiResponse<Worker[]>> {
    return this.request<Worker[]>('/workers');
  }

  async getWorker(id: string): Promise<ApiResponse<Worker>> {
    return this.request<Worker>(`/workers/${id}`);
  }

  async createWorker(worker: Omit<Worker, 'id' | 'createdAt'>): Promise<ApiResponse<Worker>> {
    return this.request<Worker>('/workers', {
      method: 'POST',
      body: JSON.stringify(worker),
    });
  }

  async updateWorker(id: string, worker: Partial<Worker>): Promise<ApiResponse<Worker>> {
    return this.request<Worker>(`/workers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(worker),
    });
  }

  async deleteWorker(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/workers/${id}`, {
      method: 'DELETE',
    });
  }

  // Worker Attendance API
  async getWorkerAttendance(projectId?: string, date?: string): Promise<ApiResponse<WorkerAttendance[]>> {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    if (date) params.append('date', date);
    
    return this.request<WorkerAttendance[]>(`/worker-attendance?${params}`);
  }

  async createWorkerAttendance(attendance: Omit<WorkerAttendance, 'id' | 'createdAt'>): Promise<ApiResponse<WorkerAttendance>> {
    return this.request<WorkerAttendance>('/worker-attendance', {
      method: 'POST',
      body: JSON.stringify(attendance),
    });
  }

  async updateWorkerAttendance(id: string, attendance: Partial<WorkerAttendance>): Promise<ApiResponse<WorkerAttendance>> {
    return this.request<WorkerAttendance>(`/worker-attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(attendance),
    });
  }

  async deleteWorkerAttendance(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/worker-attendance/${id}`, {
      method: 'DELETE',
    });
  }

  // Equipment API
  async getEquipment(): Promise<ApiResponse<Equipment[]>> {
    return this.request<Equipment[]>('/equipment');
  }

  async getEquipmentItem(id: string): Promise<ApiResponse<Equipment>> {
    return this.request<Equipment>(`/equipment/${id}`);
  }

  async createEquipment(equipment: Omit<Equipment, 'id' | 'code' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Equipment>> {
    return this.request<Equipment>('/equipment', {
      method: 'POST',
      body: JSON.stringify(equipment),
    });
  }

  async updateEquipment(id: string, equipment: Partial<Equipment>): Promise<ApiResponse<Equipment>> {
    return this.request<Equipment>(`/equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(equipment),
    });
  }

  async deleteEquipment(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/equipment/${id}`, {
      method: 'DELETE',
    });
  }

  // Materials API
  async getMaterials(): Promise<ApiResponse<Material[]>> {
    return this.request<Material[]>('/materials');
  }

  async getMaterial(id: string): Promise<ApiResponse<Material>> {
    return this.request<Material>(`/materials/${id}`);
  }

  async createMaterial(material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Material>> {
    return this.request<Material>('/materials', {
      method: 'POST',
      body: JSON.stringify(material),
    });
  }

  // Material Purchases API
  async getMaterialPurchases(projectId?: string): Promise<ApiResponse<MaterialPurchase[]>> {
    const params = projectId ? `?projectId=${projectId}` : '';
    return this.request<MaterialPurchase[]>(`/material-purchases${params}`);
  }

  async createMaterialPurchase(purchase: Omit<MaterialPurchase, 'id' | 'createdAt'>): Promise<ApiResponse<MaterialPurchase>> {
    return this.request<MaterialPurchase>('/material-purchases', {
      method: 'POST',
      body: JSON.stringify(purchase),
    });
  }

  // Suppliers API
  async getSuppliers(): Promise<ApiResponse<Supplier[]>> {
    return this.request<Supplier[]>('/suppliers');
  }

  async getSupplier(id: string): Promise<ApiResponse<Supplier>> {
    return this.request<Supplier>(`/suppliers/${id}`);
  }

  async createSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Supplier>> {
    return this.request<Supplier>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplier),
    });
  }

  // Dashboard API
  async getDashboardStats(projectId?: string): Promise<ApiResponse<DashboardStats>> {
    const params = projectId ? `?projectId=${projectId}` : '';
    return this.request<DashboardStats>(`/dashboard/stats${params}`);
  }

  // Autocomplete API
  async getAutocompleteData(category: string, query: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/autocomplete?category=${category}&query=${encodeURIComponent(query)}`);
  }

  async saveAutocompleteData(category: string, value: string): Promise<ApiResponse<void>> {
    return this.request<void>('/autocomplete', {
      method: 'POST',
      body: JSON.stringify({ category, value }),
    });
  }

  // Reports API
  async generateReport(type: string, params: any): Promise<ApiResponse<any>> {
    return this.request<any>('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ type, params }),
    });
  }

  async exportData(type: string, format: 'excel' | 'pdf', params: any): Promise<ApiResponse<any>> {
    return this.request<any>('/export', {
      method: 'POST',
      body: JSON.stringify({ type, format, params }),
    });
  }

  // QR Code API
  async generateQRCode(data: any): Promise<ApiResponse<string>> {
    return this.request<string>('/qr/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async scanQRCode(code: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/qr/scan?code=${encodeURIComponent(code)}`);
  }

  // Analytics API
  async getAnalytics(type: string, params: any): Promise<ApiResponse<any>> {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/analytics/${type}?${query}`);
  }

  // File Upload API
  async uploadFile(file: any, type: string): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'فشل في رفع الملف',
      };
    }
  }
}

export const apiService = new ApiService();
export default apiService;