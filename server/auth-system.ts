import bcrypt from 'bcrypt';
import { storage } from './storage';
import type { User, InsertUser } from '@shared/schema';

interface AuthSession {
  userId: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
}

// Session interface extension for TypeScript
declare module 'express-session' {
  interface SessionData {
    auth?: AuthSession;
  }
}

export class AuthSystem {
  private readonly SALT_ROUNDS = 12;

  /**
   * تشفير كلمة المرور
   */
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * التحقق من كلمة المرور
   */
  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * إنشاء مستخدم جديد
   */
  async register(userData: Omit<InsertUser, 'password'> & { password: string }): Promise<{ success: boolean; message: string; user?: Omit<User, 'password'> }> {
    try {
      // التحقق من عدم وجود المستخدم مسبقاً
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return {
          success: false,
          message: 'يوجد مستخدم بنفس الإيميل مسبقاً'
        };
      }

      // تشفير كلمة المرور
      const hashedPassword = await this.hashPassword(userData.password);

      // إنشاء المستخدم
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });

      // إرجاع البيانات بدون كلمة المرور
      const { password, ...userWithoutPassword } = user;

      return {
        success: true,
        message: 'تم إنشاء المستخدم بنجاح',
        user: userWithoutPassword
      };

    } catch (error) {
      console.error('خطأ في إنشاء المستخدم:', error);
      return {
        success: false,
        message: 'خطأ في إنشاء المستخدم'
      };
    }
  }

  /**
   * تسجيل الدخول
   */
  async login(email: string, password: string): Promise<{ success: boolean; message: string; user?: Omit<User, 'password'> }> {
    try {
      // البحث عن المستخدم
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return {
          success: false,
          message: 'الإيميل أو كلمة المرور غير صحيحة'
        };
      }

      // التحقق من حالة المستخدم
      if (!user.isActive) {
        return {
          success: false,
          message: 'حساب المستخدم معطل'
        };
      }

      // التحقق من كلمة المرور
      const isValidPassword = await this.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return {
          success: false,
          message: 'الإيميل أو كلمة المرور غير صحيحة'
        };
      }

      // تحديث آخر تسجيل دخول (تم تسجيله في logs فقط)
      console.log(`تسجيل دخول المستخدم: ${user.email} في ${new Date().toISOString()}`);

      // إرجاع البيانات بدون كلمة المرور
      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        user: userWithoutPassword
      };

    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      return {
        success: false,
        message: 'خطأ في تسجيل الدخول'
      };
    }
  }

  /**
   * تغيير كلمة المرور
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // الحصول على المستخدم
      const user = await storage.getUser(userId);
      if (!user) {
        return {
          success: false,
          message: 'المستخدم غير موجود'
        };
      }

      // التحقق من كلمة المرور القديمة
      const isValidOldPassword = await this.verifyPassword(oldPassword, user.password);
      if (!isValidOldPassword) {
        return {
          success: false,
          message: 'كلمة المرور القديمة غير صحيحة'
        };
      }

      // تشفير كلمة المرور الجديدة
      const hashedNewPassword = await this.hashPassword(newPassword);

      // تحديث كلمة المرور
      await storage.updateUser(userId, { password: hashedNewPassword });

      return {
        success: true,
        message: 'تم تغيير كلمة المرور بنجاح'
      };

    } catch (error) {
      console.error('خطأ في تغيير كلمة المرور:', error);
      return {
        success: false,
        message: 'خطأ في تغيير كلمة المرور'
      };
    }
  }

  /**
   * إنشاء session للمستخدم
   */
  createSession(user: Omit<User, 'password'>): AuthSession {
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      createdAt: new Date()
    };
  }

  /**
   * middleware للتحقق من تسجيل الدخول
   */
  requireAuth = (req: any, res: any, next: any) => {
    if (!req.session?.auth) {
      return res.status(401).json({ 
        success: false, 
        message: 'يجب تسجيل الدخول أولاً' 
      });
    }
    next();
  };

  /**
   * middleware للتحقق من صلاحية الإدارة
   */
  requireAdmin = (req: any, res: any, next: any) => {
    if (!req.session?.auth) {
      return res.status(401).json({ 
        success: false, 
        message: 'يجب تسجيل الدخول أولاً' 
      });
    }

    if (req.session.auth.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'غير مصرح لك بالوصول' 
      });
    }

    next();
  };

  /**
   * الحصول على معلومات المستخدم الحالي من session
   */
  getCurrentUser = (req: any): AuthSession | null => {
    return req.session?.auth || null;
  };
}

export const authSystem = new AuthSystem();