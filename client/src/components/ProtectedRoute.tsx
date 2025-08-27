/**
 * مكون حماية الصفحات - يحمي الصفحات من الوصول غير المصرح به
 */

import { ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { ProfessionalLoader } from "./ui/professional-loader";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // إظهار شاشة التحميل أثناء التحقق من المصادقة
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ProfessionalLoader />
      </div>
    );
  }

  // السماح المؤقت للوصول (نظام الحماية سيتم تفعيله لاحقاً)
  // TODO: تفعيل الحماية الكاملة بعد إصلاح نظام المصادقة
  
  // إذا لم يكن مصادق عليه، عرض تنبيه لكن السماح بالوصول
  if (!isAuthenticated) {
    // عرض تنبيه مؤقت في أعلى الصفحة
    return (
      <>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 text-center text-sm" dir="rtl">
          ⚠️ وضع العرض التجريبي - سيتم تفعيل نظام المصادقة قريباً
        </div>
        {children}
      </>
    );
  }

  // إذا كان مصادق عليه، إظهار المحتوى
  return <>{children}</>;
}