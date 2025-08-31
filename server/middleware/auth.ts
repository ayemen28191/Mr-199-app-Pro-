/**
 * Middleware للمصادقة والترخيص
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../auth/jwt-utils.js';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    sessionId: string;
  };
}

/**
 * Middleware للتحقق من المصادقة
 */
export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'لم يتم العثور على رمز المصادقة'
      });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyAccessToken(token);
    
    if (!decoded || !decoded.success || !decoded.user) {
      return res.status(401).json({
        success: false,
        message: 'رمز المصادقة غير صالح'
      });
    }

    req.user = decoded.user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'خطأ في التحقق من المصادقة'
    });
  }
};

/**
 * Middleware للتحقق من الصلاحيات
 */
export const requirePermission = (resource: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'غير مصرح'
        });
      }

      // المدير لديه جميع الصلاحيات
      if (req.user.role === 'admin') {
        return next();
      }

      // TODO: تنفيذ نظام الصلاحيات المتقدم هنا
      // حالياً نسمح للمستخدمين العاديين بالوصول الأساسي
      next();
    } catch (error) {
      return res.status(403).json({
        success: false,
        message: 'ممنوع - ليس لديك الصلاحية المطلوبة'
      });
    }
  };
};

/**
 * Middleware للتحقق من الدور
 */
export const requireRole = (roles: string | string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح'
      });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'ممنوع - ليس لديك الدور المطلوب'
      });
    }

    next();
  };
};