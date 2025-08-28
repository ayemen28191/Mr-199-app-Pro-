/**
 * مكون حماية الصفحات - يحمي الصفحات من الوصول غير المصرح به
 */

import { ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { ProfessionalLoader } from "./ui/professional-loader";
import { Redirect } from "wouter";

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

  // إذا لم يكن مصادق عليه، إعادة توجيه لصفحة تسجيل الدخول
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // إذا كان مصادق عليه، إظهار المحتوى
  return <>{children}</>;
}