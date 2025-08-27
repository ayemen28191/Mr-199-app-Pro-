/**
 * مكون التحليلات المبسط
 * يوفر وظائف تسجيل الأحداث بدون مكتبات خارجية ثقيلة
 */

class AnalyticsService {
  private isEnabled: boolean = false;

  constructor() {
    this.isEnabled = process.env.EXPO_PUBLIC_ANALYTICS_ENABLED === 'true';
    if (this.isEnabled) {
      console.log('✅ خدمة التحليلات المبسطة جاهزة');
    }
  }

  /**
   * تسجيل معلومات المستخدم
   */
  identifyUser(userId: string, userInfo?: {
    name?: string;
    email?: string;
    role?: string;
    company?: string;
    subscriptionPlan?: string;
  }) {
    if (this.isEnabled) {
      console.log('👤 تم تسجيل المستخدم:', userId, userInfo);
    }
  }

  /**
   * تسجيل حدث مخصص
   */
  logEvent(eventName: string, properties?: Record<string, any>) {
    if (this.isEnabled) {
      console.log('📊 تم تسجيل الحدث:', eventName, properties);
    }
  }

  /**
   * تسجيل خطأ
   */
  logError(error: Error, context?: Record<string, any>) {
    if (this.isEnabled) {
      console.error('❌ خطأ:', error.message, context);
    }
  }

  /**
   * تسجيل عملية المشروع
   */
  logProjectAction(action: string, projectId: string, details?: Record<string, any>) {
    this.logEvent('project_action', {
      action,
      project_id: projectId,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * تسجيل عملية العامل
   */
  logWorkerAction(action: string, workerId: string, details?: Record<string, any>) {
    this.logEvent('worker_action', {
      action,
      worker_id: workerId,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * تسجيل المعاملة المالية
   */
  logFinancialTransaction(type: string, amount: number, details?: Record<string, any>) {
    this.logEvent('financial_transaction', {
      type,
      amount,
      currency: 'SAR',
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * تسجيل أداء التطبيق
   */
  logPerformance(metric: string, value: number, unit?: string) {
    this.logEvent('performance_metric', {
      metric,
      value,
      unit: unit || 'ms',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * بدء جلسة عمل جديدة
   */
  startSession(sessionType: string, metadata?: Record<string, any>) {
    this.logEvent('session_start', {
      session_type: sessionType,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * إنهاء جلسة العمل
   */
  endSession(sessionType: string, duration?: number, metadata?: Record<string, any>) {
    this.logEvent('session_end', {
      session_type: sessionType,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * تسجيل تصفح الشاشة
   */
  logScreenView(screenName: string, metadata?: Record<string, any>) {
    this.logEvent('screen_view', {
      screen_name: screenName,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }
}

// إنشاء مثيل واحد للاستخدام في التطبيق
export const Analytics = new AnalyticsService();

// تصدير أنواع البيانات للـ TypeScript
export interface UserInfo {
  name?: string;
  email?: string;
  role?: string;
  company?: string;
}

export interface EventProperties {
  [key: string]: any;
}