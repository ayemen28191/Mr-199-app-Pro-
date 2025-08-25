import { useState, useCallback } from 'react';
import { apiService, ApiResponse } from '../services/api';
import { useErrorHandler } from './useErrorHandler';
import { toastManager } from '../components/UI/Toast';

export function useApi() {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const { handleApiError } = useErrorHandler();

  const setLoadingState = useCallback((key: string, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [key]: isLoading }));
  }, []);

  const isLoading = useCallback((key: string) => loading[key] || false, [loading]);

  // Generic API call wrapper
  const callApi = useCallback(async <T>(
    apiCall: () => Promise<ApiResponse<T>>,
    loadingKey: string,
    showSuccessMessage?: string,
    showErrorToast = true
  ): Promise<T | null> => {
    setLoadingState(loadingKey, true);
    
    try {
      const response = await apiCall();
      
      if (response.success && response.data) {
        if (showSuccessMessage) {
          toastManager.show(showSuccessMessage, 'success');
        }
        return response.data;
      } else {
        if (showErrorToast && response.error) {
          handleApiError(new Error(response.error));
        }
        return null;
      }
    } catch (error) {
      if (showErrorToast) {
        handleApiError(error);
      }
      return null;
    } finally {
      setLoadingState(loadingKey, false);
    }
  }, [setLoadingState, handleApiError]);

  // Projects API hooks
  const getProjects = useCallback(() => 
    callApi(() => apiService.getProjects(), 'projects'), 
    [callApi]
  );

  const createProject = useCallback((project: any) =>
    callApi(() => apiService.createProject(project), 'createProject', 'تم إنشاء المشروع بنجاح'),
    [callApi]
  );

  const updateProject = useCallback((id: string, project: any) =>
    callApi(() => apiService.updateProject(id, project), 'updateProject', 'تم تحديث المشروع بنجاح'),
    [callApi]
  );

  const deleteProject = useCallback((id: string) =>
    callApi(() => apiService.deleteProject(id), 'deleteProject', 'تم حذف المشروع بنجاح'),
    [callApi]
  );

  // Workers API hooks
  const getWorkers = useCallback(() => 
    callApi(() => apiService.getWorkers(), 'workers'), 
    [callApi]
  );

  const createWorker = useCallback((worker: any) =>
    callApi(() => apiService.createWorker(worker), 'createWorker', 'تم إضافة العامل بنجاح'),
    [callApi]
  );

  const updateWorker = useCallback((id: string, worker: any) =>
    callApi(() => apiService.updateWorker(id, worker), 'updateWorker', 'تم تحديث بيانات العامل بنجاح'),
    [callApi]
  );

  const deleteWorker = useCallback((id: string) =>
    callApi(() => apiService.deleteWorker(id), 'deleteWorker', 'تم حذف العامل بنجاح'),
    [callApi]
  );

  // Suppliers API hooks
  const getSuppliers = useCallback(() => 
    callApi(() => apiService.getSuppliers(), 'suppliers'), 
    [callApi]
  );

  const createSupplier = useCallback((supplier: any) =>
    callApi(() => apiService.createSupplier(supplier), 'createSupplier', 'تم إضافة المورد بنجاح'),
    [callApi]
  );

  // Dashboard API hooks
  const getDashboardStats = useCallback((projectId?: string) =>
    callApi(() => apiService.getDashboardStats(projectId), 'dashboardStats'),
    [callApi]
  );

  // Worker Attendance API hooks
  const getWorkerAttendance = useCallback((projectId?: string, date?: string) =>
    callApi(() => apiService.getWorkerAttendance(projectId, date), 'workerAttendance'),
    [callApi]
  );

  const createWorkerAttendance = useCallback((attendance: any) =>
    callApi(() => apiService.createWorkerAttendance(attendance), 'createAttendance', 'تم تسجيل الحضور بنجاح'),
    [callApi]
  );

  // Equipment API hooks
  const getEquipment = useCallback(() =>
    callApi(() => apiService.getEquipment(), 'equipment'),
    [callApi]
  );

  const createEquipment = useCallback((equipment: any) =>
    callApi(() => apiService.createEquipment(equipment), 'createEquipment', 'تم إضافة المعدة بنجاح'),
    [callApi]
  );

  return {
    // Loading states
    isLoading,
    
    // Projects
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    
    // Workers
    getWorkers,
    createWorker,
    updateWorker,
    deleteWorker,
    
    // Suppliers
    getSuppliers,
    createSupplier,
    
    // Dashboard
    getDashboardStats,
    
    // Worker Attendance
    getWorkerAttendance,
    createWorkerAttendance,
    
    // Equipment
    getEquipment,
    createEquipment,
    
    // Generic
    callApi,
  };
}