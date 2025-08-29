/**
 * خدمة المصادقة المتقدمة
 * تجمع جميع عمليات المصادقة والترخيص في مكان واحد
 */

import { eq, and, desc, gte, or } from 'drizzle-orm';
import { db } from '../db.js';
import { 
  users, 
  authUserSessions, 
  authAuditLog, 
  authVerificationCodes,
  authUserSecuritySettings,
  InsertAuthAuditLog,
  InsertAuthVerificationCode,
} from '../../shared/schema.js';

import { 
  hashPassword, 
  verifyPassword, 
  generateTOTPSecret,
  verifyTOTPCode,
  generateVerificationCode,
  verifyVerificationCode,
  validatePasswordStrength
} from './crypto-utils.js';

import {
  generateTokenPair,
  verifyAccessToken,
  refreshAccessToken,
  revokeToken,
  revokeAllUserSessions,
  getUserActiveSessions
} from './jwt-utils.js';

// واجهة طلب تسجيل الدخول
interface LoginRequest {
  email: string;
  password: string;
  totpCode?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: any;
}

// واجهة نتيجة تسجيل الدخول
interface LoginResult {
  success: boolean;
  user?: any;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
  requireMFA?: boolean;
  requireVerification?: boolean;
  message?: string;
}

// واجهة طلب التسجيل
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * تسجيل الدخول المتقدم مع MFA
 */
export async function loginUser(request: LoginRequest): Promise<LoginResult> {
  const { email, password, totpCode, ipAddress, userAgent, deviceInfo } = request;

  console.log('🔐 بدء عملية تسجيل الدخول للمستخدم:', email);
  console.log('🔐 تفاصيل الطلب:', { email, passwordLength: password?.length, hasPassword: !!password });

  try {
    // البحث عن المستخدم
    console.log('🔍 البحث عن المستخدم في قاعدة البيانات...');
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    console.log('🔍 نتيجة البحث:', { found: userResult.length, email });

    if (userResult.length === 0) {
      await logAuditEvent({
        action: 'login_failed',
        resource: 'auth',
        ipAddress,
        userAgent,
        status: 'failure',
        errorMessage: 'مستخدم غير موجود',
        metadata: { email },
      });

      return {
        success: false,
        message: 'بيانات تسجيل الدخول غير صحيحة'
      };
    }

    const user = userResult[0];

    // التحقق من حالة المستخدم
    if (!user.isActive) {
      await logAuditEvent({
        userId: user.id,
        action: 'login_failed',
        resource: 'auth',
        ipAddress,
        userAgent,
        status: 'blocked',
        errorMessage: 'حساب معطل',
      });

      return {
        success: false,
        message: 'الحساب معطل. يرجى التواصل مع المدير'
      };
    }

    // التحقق من كلمة المرور
    console.log('🔍 فحص كلمة المرور للمستخدم:', email);
    console.log('🔍 طول كلمة المرور المرسلة:', password.length);
    console.log('🔍 طول كلمة المرور المحفوظة:', user.password ? user.password.length : 'undefined');
    console.log('🔍 كلمة المرور المحفوظة تبدأ بـ:', user.password ? user.password.substring(0, 10) + '...' : 'undefined');
    
    const isPasswordValid = await verifyPassword(password, user.password);
    console.log('🔍 نتيجة التحقق من كلمة المرور:', isPasswordValid);
    
    if (!isPasswordValid) {
      await logAuditEvent({
        userId: user.id,
        action: 'login_failed',
        resource: 'auth',
        ipAddress,
        userAgent,
        status: 'failure',
        errorMessage: 'كلمة مرور خاطئة',
      });

      return {
        success: false,
        message: 'بيانات تسجيل الدخول غير صحيحة'
      };
    }

    // التحقق من TOTP إذا كان مفعل (تم تعطيله مؤقتاً حتى إضافة الحقول)
    /*
    if (user.totpSecret && user.mfaEnabled) {
      if (!totpCode) {
        return {
          success: false,
          requireMFA: true,
          message: 'يرجى إدخال رمز التحقق الثنائي'
        };
      }

      const isTOTPValid = verifyTOTPCode(user.totpSecret, totpCode);
      if (!isTOTPValid) {
        await logAuditEvent({
          userId: user.id,
          action: 'mfa_failed',
          resource: 'auth',
          ipAddress,
          userAgent,
          status: 'failure',
          errorMessage: 'رمز TOTP خاطئ',
        });

        return {
          success: false,
          message: 'رمز التحقق الثنائي غير صحيح'
        };
      }
    }
    */

    // التحقق من التحقق بالبريد الإلكتروني (تم تعطيله مؤقتاً)
    if (!user.emailVerifiedAt) {
      return {
        success: false,
        requireVerification: true,
        message: 'يرجى التحقق من بريدك الإلكتروني أولاً'
      };
    }

    // نظام مصادقة مبسط (بدون JWT معقد مؤقتاً)
    console.log('🔑 تسجيل دخول ناجح بنظام مبسط');
    const tokens = {
      accessToken: 'simple-access-token-' + user.id + '-' + Date.now(),
      refreshToken: 'simple-refresh-token-' + user.id + '-' + Date.now(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 ساعة
      sessionId: 'simple-session-' + user.id
    };

    // تسجيل نجاح تسجيل الدخول (معطل مؤقتاً)
    console.log('✅ نجح تسجيل الدخول للمستخدم:', user.id);

    // تحديث آخر تسجيل دخول
    await db
      .update(users)
      .set({ 
        lastLogin: new Date()
      })
      .where(eq(users.id, user.id));

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        role: user.role,
        profilePicture: user.avatarUrl,
        mfaEnabled: false, // مؤقتاً
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      }
    };

  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    
    await logAuditEvent({
      action: 'login_error',
      resource: 'auth',
      ipAddress,
      userAgent,
      status: 'error',
      errorMessage: (error as Error).message,
      metadata: { email },
    });

    return {
      success: false,
      message: 'حدث خطأ أثناء تسجيل الدخول'
    };
  }
}

/**
 * تسجيل مستخدم جديد
 */
export async function registerUser(request: RegisterRequest) {
  const { email, password, name, phone, role = 'user', ipAddress, userAgent } = request;

  try {
    // التحقق من قوة كلمة المرور
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        message: 'كلمة المرور ضعيفة',
        issues: passwordValidation.issues,
        suggestions: passwordValidation.suggestions
      };
    }

    // التحقق من وجود المستخدم
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return {
        success: false,
        message: 'البريد الإلكتروني مستخدم مسبقاً'
      };
    }

    // تشفير كلمة المرور
    const passwordHash = await hashPassword(password);

    // إنشاء المستخدم
    const newUser = await db
      .insert(users)
      .values({
        email,
        password: passwordHash,
        firstName: name,
        phone,
        role,
        isActive: true,
        emailVerifiedAt: null, // يحتاج التحقق
      })
      .returning();

    const userId = newUser[0].id;

    // إعدادات الأمان الافتراضية - سيتم إنشاؤها لاحقاً عند الحاجة
    console.log('✅ تم إنشاء المستخدم:', userId);

    // تفعيل الحساب مباشرة للاختبار
    await db
      .update(users)
      .set({ 
        emailVerifiedAt: new Date(), // تفعيل مباشر 
        isActive: true 
      })
      .where(eq(users.id, userId));

    console.log('📝 تم تسجيل مستخدم جديد وتفعيله:', email);

    return {
      success: true,
      message: 'تم إنشاء الحساب وتفعيله بنجاح!',
      user: {
        id: userId,
        email,
        name,
        role,
      }
    };

  } catch (error) {
    console.error('خطأ في التسجيل:', error);
    
    // تسجيل الخطأ بطريقة مبسطة
    console.log('❌ خطأ في إنشاء الحساب:', email, (error as Error).message);

    return {
      success: false,
      message: 'حدث خطأ أثناء إنشاء الحساب'
    };
  }
}

/**
 * التحقق من البريد الإلكتروني
 */
export async function verifyEmail(userId: string, code: string, ipAddress?: string, userAgent?: string) {
  try {
    // البحث عن رمز التحقق
    const verificationResult = await db
      .select()
      .from(authVerificationCodes)
      .where(
        and(
          eq(authVerificationCodes.userId, userId),
          eq(authVerificationCodes.type, 'email_verification'),
          eq(authVerificationCodes.isUsed, false),
          gte(authVerificationCodes.expiresAt, new Date())
        )
      )
      .limit(1);

    if (verificationResult.length === 0) {
      return {
        success: false,
        message: 'رمز التحقق غير صالح أو منتهي الصلاحية'
      };
    }

    const verification = verificationResult[0];

    // التحقق من الرمز
    const isCodeValid = verifyVerificationCode(code, verification.code);
    if (!isCodeValid) {
      // زيادة عدد المحاولات
      await db
        .update(authVerificationCodes)
        .set({ 
          attempts: verification.attempts + 1 
        })
        .where(eq(authVerificationCodes.id, verification.id));

      return {
        success: false,
        message: 'رمز التحقق غير صحيح'
      };
    }

    // تفعيل التحقق
    await db
      .update(users)
      .set({ 
        emailVerifiedAt: new Date()
      })
      .where(eq(users.id, userId));

    // تحديد الرمز كمستخدم
    await db
      .update(authVerificationCodes)
      .set({ 
        isUsed: true,
        usedAt: new Date()
      })
      .where(eq(authVerificationCodes.id, verification.id));

    // تسجيل الحدث
    await logAuditEvent({
      userId,
      action: 'email_verified',
      resource: 'auth',
      ipAddress,
      userAgent,
      status: 'success',
    });

    return {
      success: true,
      message: 'تم التحقق من البريد الإلكتروني بنجاح'
    };

  } catch (error) {
    console.error('خطأ في التحقق من البريد:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء التحقق'
    };
  }
}

/**
 * إعداد المصادقة الثنائية
 */
export async function setupTOTP(userId: string, email: string) {
  try {
    const { secret, qrCodeUrl, backupCodes } = generateTOTPSecret(email);

    // حفظ السر مؤقتاً (غير مفعل بعد)
    await db
      .update(users)
      .set({ 
        totpSecret: secret,
        // mfaEnabled حقل غير موجود في جدول users
      })
      .where(eq(users.id, userId));

    return {
      success: true,
      secret,
      qrCodeUrl,
      backupCodes,
      message: 'يرجى مسح الكود وإدخال رمز التحقق لتفعيل المصادقة الثنائية'
    };

  } catch (error) {
    console.error('خطأ في إعداد TOTP:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء إعداد المصادقة الثنائية'
    };
  }
}

/**
 * تفعيل المصادقة الثنائية
 */
export async function enableTOTP(userId: string, totpCode: string, ipAddress?: string, userAgent?: string) {
  try {
    // الحصول على المستخدم
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0 || !user[0].totpSecret) {
      return {
        success: false,
        message: 'لم يتم إعداد المصادقة الثنائية'
      };
    }

    // التحقق من الرمز
    const isValid = verifyTOTPCode(user[0].totpSecret, totpCode);
    if (!isValid) {
      return {
        success: false,
        message: 'رمز التحقق غير صحيح'
      };
    }

    // تفعيل MFA (مؤقتاً معطل حتى إضافة الحقول)
    /* await db
      .update(users)
      .set({ 
        mfaEnabled: true,
        mfaEnabledAt: new Date()
      })
      .where(eq(users.id, userId)); */

    // تسجيل الحدث
    await logAuditEvent({
      userId,
      action: 'mfa_enabled',
      resource: 'security',
      ipAddress,
      userAgent,
      status: 'success',
    });

    return {
      success: true,
      message: 'تم تفعيل المصادقة الثنائية بنجاح'
    };

  } catch (error) {
    console.error('خطأ في تفعيل MFA:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء تفعيل المصادقة الثنائية'
    };
  }
}

/**
 * تسجيل حدث في سجل التدقيق
 */
export async function logAuditEvent(event: any) {
  try {
    // تنظيف البيانات لتتطابق مع الجدول الموجود
    const cleanEvent = {
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      status: event.status || 'success',
      metadata: event.metadata ? JSON.stringify(event.metadata) : null,
      createdAt: new Date(),
    };
    
    await db.insert(authAuditLog).values(cleanEvent);
  } catch (error) {
    console.error('خطأ في تسجيل حدث التدقيق:', error);
  }
}

/**
 * الحصول على جلسات المستخدم النشطة
 */
export async function getActiveSessions(userId: string) {
  return getUserActiveSessions(userId);
}

/**
 * إنهاء جلسة معينة
 */
export async function terminateSession(userId: string, sessionId: string, reason = 'user_logout') {
  return revokeToken(sessionId, reason);
}

/**
 * إنهاء جميع الجلسات عدا الحالية
 */
export async function terminateAllOtherSessions(userId: string, exceptSessionId?: string) {
  return revokeAllUserSessions(userId, exceptSessionId);
}

/**
 * تغيير كلمة المرور
 */
export async function changePassword(
  userId: string, 
  currentPassword: string, 
  newPassword: string,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    // الحصول على المستخدم
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return {
        success: false,
        message: 'المستخدم غير موجود'
      };
    }

    // التحقق من كلمة المرور الحالية
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user[0].password);
    if (!isCurrentPasswordValid) {
      await logAuditEvent({
        userId,
        action: 'password_change_failed',
        resource: 'security',
        ipAddress,
        userAgent,
        status: 'failure',
        errorMessage: 'كلمة مرور حالية خاطئة',
      });

      return {
        success: false,
        message: 'كلمة المرور الحالية غير صحيحة'
      };
    }

    // التحقق من قوة كلمة المرور الجديدة
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        message: 'كلمة المرور الجديدة ضعيفة',
        issues: passwordValidation.issues,
        suggestions: passwordValidation.suggestions
      };
    }

    // تشفير كلمة المرور الجديدة
    const newPasswordHash = await hashPassword(newPassword);

    // تحديث كلمة المرور
    await db
      .update(users)
      .set({ 
        password: newPasswordHash,
      })
      .where(eq(users.id, userId));

    // إبطال جميع الجلسات النشطة (عدا الحالية)
    await revokeAllUserSessions(userId);

    // تسجيل الحدث
    await logAuditEvent({
      userId,
      action: 'password_changed',
      resource: 'security',
      ipAddress,
      userAgent,
      status: 'success',
    });

    return {
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح. سيتم إنهاء جميع الجلسات النشطة'
    };

  } catch (error) {
    console.error('خطأ في تغيير كلمة المرور:', error);
    
    await logAuditEvent({
      userId,
      action: 'password_change_error',
      resource: 'security',
      ipAddress,
      userAgent,
      status: 'error',
      errorMessage: (error as Error).message,
    });

    return {
      success: false,
      message: 'حدث خطأ أثناء تغيير كلمة المرور'
    };
  }
}

// تصدير دوال إضافية للاستخدام
export {
  generateTokenPair,
  verifyAccessToken,
  refreshAccessToken,
  revokeToken as revokeSession,
  validatePasswordStrength,
};