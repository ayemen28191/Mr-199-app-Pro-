/**
 * 🗄️ Supabase Client موحد للمحمول
 * تطابق كامل مع تطبيق الويب في الاستعلامات والعمليات
 */

import { createClient } from '@supabase/supabase-js';

// نفس إعدادات الـ Supabase من الويب
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // تعطيل auto-refresh للجلسات في المحمول لتحسين الأداء
    autoRefreshToken: true,
    persistSession: true,
  },
});

// API Helper - مطابق للويب
export const apiRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
) => {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
  const url = `${baseUrl}${endpoint}`;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Project Statistics - مطابقة تماماً للويب
export const getProjectStatistics = async (projectId: string) => {
  return apiRequest(`/api/projects/${projectId}/stats`);
};

// Projects with Stats - مطابقة للويب
export const getProjectsWithStats = async () => {
  return apiRequest('/api/projects/with-stats');
};

// Workers Operations - مطابقة للويب  
export const getWorkers = async (projectId?: string) => {
  const endpoint = projectId ? `/api/workers?project=${projectId}` : '/api/workers';
  return apiRequest(endpoint);
};

export const createWorker = async (workerData: any) => {
  return apiRequest('/api/workers', 'POST', workerData);
};

// Supplier Operations - مطابقة للويب
export const getSuppliers = async (projectId?: string) => {
  const endpoint = projectId ? `/api/suppliers?project=${projectId}` : '/api/suppliers';
  return apiRequest(endpoint);
};

export const createSupplier = async (supplierData: any) => {
  return apiRequest('/api/suppliers', 'POST', supplierData);
};

// Material Purchase - مطابقة للويب
export const getMaterialPurchases = async (projectId?: string) => {
  const endpoint = projectId ? `/api/material-purchases?project=${projectId}` : '/api/material-purchases';
  return apiRequest(endpoint);
};

export const createMaterialPurchase = async (purchaseData: any) => {
  return apiRequest('/api/material-purchases', 'POST', purchaseData);
};

// Worker Attendance - مطابقة للويب
export const getWorkerAttendance = async (projectId?: string, date?: string) => {
  let endpoint = '/api/worker-attendance';
  const params = new URLSearchParams();
  
  if (projectId) params.append('project', projectId);
  if (date) params.append('date', date);
  
  if (params.toString()) {
    endpoint += `?${params.toString()}`;
  }
  
  return apiRequest(endpoint);
};

export const createWorkerAttendance = async (attendanceData: any) => {
  return apiRequest('/api/worker-attendance', 'POST', attendanceData);
};

// Daily Expenses - مطابقة للويب
export const getDailyExpenses = async (projectId?: string) => {
  const endpoint = projectId ? `/api/daily-expenses?project=${projectId}` : '/api/daily-expenses';
  return apiRequest(endpoint);
};

export const createDailyExpense = async (expenseData: any) => {
  return apiRequest('/api/daily-expenses', 'POST', expenseData);
};

// Equipment/Tools - مطابقة للويب
export const getTools = async (projectId?: string) => {
  const endpoint = projectId ? `/api/tools?project=${projectId}` : '/api/tools';
  return apiRequest(endpoint);
};

export const createTool = async (toolData: any) => {
  return apiRequest('/api/tools', 'POST', toolData);
};

// Reports - مطابقة للويب
export const generateReport = async (reportType: string, params: any) => {
  return apiRequest('/api/reports/generate', 'POST', { reportType, params });
};

// Autocomplete Data - مطابقة للويب
export const getAutocompleteData = async (category?: string) => {
  const endpoint = category ? `/api/autocomplete?category=${category}` : '/api/autocomplete';
  return apiRequest(endpoint);
};

export const saveAutocompleteValue = async (category: string, value: string) => {
  return apiRequest('/api/autocomplete', 'POST', { category, value });
};

export default supabase;