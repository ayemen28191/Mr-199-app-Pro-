import { useState, useCallback } from 'react';
import { toastManager } from '../components/UI/Toast';

export interface ErrorState {
  hasError: boolean;
  error: string | null;
  errorType: 'network' | 'validation' | 'server' | 'unknown';
}

export interface UseErrorHandlerReturn {
  errorState: ErrorState;
  showError: (error: string, type?: ErrorState['errorType']) => void;
  clearError: () => void;
  handleApiError: (error: any) => void;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorType: 'unknown',
  });

  const showError = useCallback((error: string, type: ErrorState['errorType'] = 'unknown') => {
    setErrorState({
      hasError: true,
      error,
      errorType: type,
    });
    
    // عرض Toast للأخطاء
    toastManager.show(error, 'error');
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorType: 'unknown',
    });
  }, []);

  const handleApiError = useCallback((error: any) => {
    let errorMessage = 'حدث خطأ غير متوقع';
    let errorType: ErrorState['errorType'] = 'unknown';

    if (error?.message) {
      if (error.message.includes('Network')) {
        errorMessage = 'خطأ في الاتصال بالإنترنت';
        errorType = 'network';
      } else if (error.message.includes('404')) {
        errorMessage = 'البيانات المطلوبة غير موجودة';
        errorType = 'server';
      } else if (error.message.includes('400')) {
        errorMessage = 'البيانات المدخلة غير صحيحة';
        errorType = 'validation';
      } else if (error.message.includes('500')) {
        errorMessage = 'خطأ في الخادم، يرجى المحاولة لاحقاً';
        errorType = 'server';
      } else {
        errorMessage = error.message;
      }
    }

    showError(errorMessage, errorType);
  }, [showError]);

  return {
    errorState,
    showError,
    clearError,
    handleApiError,
  };
}

// Hook لـ Loading states
export interface LoadingState {
  [key: string]: boolean;
}

export function useLoadingState() {
  const [loading, setLoading] = useState<LoadingState>({});

  const setLoadingState = useCallback((key: string, isLoading: boolean) => {
    setLoading(prev => ({
      ...prev,
      [key]: isLoading,
    }));
  }, []);

  const isLoading = useCallback((key: string): boolean => {
    return loading[key] || false;
  }, [loading]);

  const isAnyLoading = useCallback((): boolean => {
    return Object.values(loading).some(Boolean);
  }, [loading]);

  return {
    setLoadingState,
    isLoading,
    isAnyLoading,
  };
}