import { 
  notifications, 
  notificationQueue, 
  notificationReadStates, 
  notificationSettings,
  notificationTemplates,
  channels,
  messages,
  NotificationTypes,
  NotificationPriority,
  NotificationStatus,
  type Notification,
  type InsertNotification,
  type NotificationSettings as NotificationSettingsType,
  type InsertNotificationQueue
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, or, inArray } from "drizzle-orm";

export interface NotificationPayload {
  type: string;
  title: string;
  body: string;
  payload?: Record<string, any>;
  priority?: number;
  recipients?: string[] | string;
  projectId?: string;
  scheduledAt?: Date;
  channelPreference?: {
    push?: boolean;
    email?: boolean;
    sms?: boolean;
  };
}

export interface NotificationTemplate {
  name: string;
  type: string;
  titleTemplate: string;
  bodyTemplate: string;
  priority?: number;
  channelPreference?: {
    push?: boolean;
    email?: boolean;
    sms?: boolean;
  };
}

/**
 * خدمة الإشعارات المتكاملة
 * تدعم إنشاء وإرسال وإدارة الإشعارات عبر قنوات متعددة
 */
export class NotificationService {
  constructor() {
    // خدمة مستقلة لا تحتاج لـ storage
  }

  /**
   * إنشاء إشعار جديد
   */
  async createNotification(data: NotificationPayload): Promise<Notification> {
    console.log(`📨 إنشاء إشعار جديد: ${data.title}`);
    
    // تحويل المستقبلين إلى مصفوفة
    let recipients: string[] = [];
    if (typeof data.recipients === 'string') {
      recipients = [data.recipients];
    } else if (Array.isArray(data.recipients)) {
      recipients = data.recipients;
    }

    const notificationData: InsertNotification = {
      projectId: data.projectId || null,
      type: data.type,
      title: data.title,
      body: data.body,
      payload: data.payload || null,
      priority: data.priority || NotificationPriority.MEDIUM,
      recipients: recipients.length > 0 ? recipients : null,
      channelPreference: data.channelPreference || { push: true, email: false, sms: false },
      scheduledAt: data.scheduledAt || null,
      createdBy: null, // سيتم تحديثه لاحقاً بناء على السياق
    };

    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();

    // إضافة الإشعار إلى طابور الإرسال
    await this.queueNotification(notification, recipients);

    console.log(`✅ تم إنشاء الإشعار: ${notification.id}`);
    return notification;
  }

  /**
   * إضافة إشعار إلى طابور الإرسال
   */
  private async queueNotification(notification: Notification, recipients: string[]): Promise<void> {
    const channels = ['push']; // يمكن إضافة email و sms لاحقاً
    const queueItems: InsertNotificationQueue[] = [];

    for (const userId of recipients) {
      for (const channel of channels) {
        queueItems.push({
          notificationId: notification.id,
          userId: userId,
          channel: channel,
          status: NotificationStatus.PENDING,
        });
      }
    }

    if (queueItems.length > 0) {
      await db
        .insert(notificationQueue)
        .values(queueItems);
    }
  }

  /**
   * إنشاء إشعار أمني طارئ
   */
  async createSafetyAlert(data: {
    title: string;
    body: string;
    location?: { lat: number; lng: number };
    severity: 'low' | 'medium' | 'high' | 'critical';
    projectId: string;
    recipients?: string[];
  }): Promise<Notification> {
    console.log(`🚨 إنشاء تنبيه أمني: ${data.severity}`);

    const priority = data.severity === 'critical' ? NotificationPriority.EMERGENCY :
                    data.severity === 'high' ? NotificationPriority.HIGH :
                    data.severity === 'medium' ? NotificationPriority.MEDIUM :
                    NotificationPriority.LOW;

    const payload = {
      type: 'safety',
      severity: data.severity,
      location: data.location,
      action: 'open_emergency'
    };

    return await this.createNotification({
      type: NotificationTypes.SAFETY,
      title: data.title,
      body: data.body,
      payload,
      priority,
      recipients: data.recipients || [],
      projectId: data.projectId,
      channelPreference: {
        push: true,
        email: data.severity === 'critical',
        sms: data.severity === 'critical'
      }
    });
  }

  /**
   * إنشاء إشعار مهمة جديدة
   */
  async createTaskNotification(data: {
    title: string;
    body: string;
    taskId: string;
    projectId: string;
    assignedTo: string[];
    dueDate?: Date;
  }): Promise<Notification> {
    console.log(`📋 إنشاء إشعار مهمة: ${data.title}`);

    const payload = {
      type: 'task',
      taskId: data.taskId,
      dueDate: data.dueDate?.toISOString(),
      action: 'open_task'
    };

    return await this.createNotification({
      type: NotificationTypes.TASK,
      title: data.title,
      body: data.body,
      payload,
      priority: NotificationPriority.HIGH,
      recipients: data.assignedTo,
      projectId: data.projectId,
      channelPreference: {
        push: true,
        email: true,
        sms: false
      }
    });
  }

  /**
   * إنشاء إشعار راتب
   */
  async createPayrollNotification(data: {
    workerId: string;
    workerName: string;
    amount: number;
    projectId: string;
    paymentType: 'salary' | 'bonus' | 'advance';
  }): Promise<Notification> {
    console.log(`💰 إنشاء إشعار راتب: ${data.workerName} - ${data.amount}`);

    const title = data.paymentType === 'salary' ? 'راتب مستحق' :
                  data.paymentType === 'bonus' ? 'مكافأة إضافية' :
                  'سلفة مالية';

    const payload = {
      type: 'payroll',
      workerId: data.workerId,
      amount: data.amount,
      paymentType: data.paymentType,
      action: 'open_payroll'
    };

    return await this.createNotification({
      type: NotificationTypes.PAYROLL,
      title: title,
      body: `تم ${title} للعامل ${data.workerName} بمبلغ ${data.amount} ريال`,
      payload,
      priority: NotificationPriority.MEDIUM,
      recipients: [data.workerId],
      projectId: data.projectId
    });
  }

  /**
   * إنشاء إعلان عام
   */
  async createAnnouncement(data: {
    title: string;
    body: string;
    projectId?: string;
    recipients: string[] | 'all';
    priority?: number;
  }): Promise<Notification> {
    console.log(`📢 إنشاء إعلان عام: ${data.title}`);

    let recipients: string[] = [];
    if (data.recipients === 'all') {
      // جلب جميع المستخدمين النشطين
      recipients = await this.getAllActiveUserIds();
    } else {
      recipients = data.recipients;
    }

    const payload = {
      type: 'announcement',
      action: 'open_announcement'
    };

    return await this.createNotification({
      type: NotificationTypes.ANNOUNCEMENT,
      title: data.title,
      body: data.body,
      payload,
      priority: data.priority || NotificationPriority.INFO,
      recipients,
      projectId: data.projectId,
      channelPreference: {
        push: true,
        email: false,
        sms: false
      }
    });
  }

  /**
   * جلب جميع معرفات المستخدمين النشطين
   */
  private async getAllActiveUserIds(): Promise<string[]> {
    // هذا مؤقت - يمكن تحسينه لاحقاً
    return ['default']; // المستخدم الافتراضي
  }

  /**
   * جلب الإشعارات للمستخدم مع الفلترة
   */
  async getUserNotifications(
    userId: string, 
    filters: {
      type?: string;
      unreadOnly?: boolean;
      projectId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    notifications: Notification[];
    unreadCount: number;
    total: number;
  }> {
    console.log(`📥 جلب إشعارات المستخدم: ${userId}`);

    const conditions = [];

    // فلترة حسب النوع
    if (filters.type) {
      conditions.push(eq(notifications.type, filters.type));
    }

    // فلترة حسب المشروع
    if (filters.projectId) {
      conditions.push(eq(notifications.projectId, filters.projectId));
    }

    // فلترة الإشعارات للمستخدم
    conditions.push(
      or(
        eq(notifications.recipients, JSON.stringify([userId])),
        eq(notifications.recipients, null) // الإشعارات العامة
      )
    );

    // جلب الإشعارات
    const notificationList = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);

    // جلب حالة القراءة للإشعارات
    const notificationIds = notificationList.map((n: any) => n.id);
    const readStates = notificationIds.length > 0 ? 
      await db
        .select()
        .from(notificationReadStates)
        .where(
          and(
            eq(notificationReadStates.userId, userId),
            inArray(notificationReadStates.notificationId, notificationIds)
          )
        ) : [];

    // دمج حالة القراءة مع الإشعارات
    const enrichedNotifications = notificationList.map((notification: any) => ({
      ...notification,
      isRead: readStates.some((rs: any) => rs.notificationId === notification.id && rs.isRead)
    }));

    // فلترة غير المقروءة إذا طُلب ذلك
    const filteredNotifications = filters.unreadOnly 
      ? enrichedNotifications.filter((n: any) => !n.isRead)
      : enrichedNotifications;

    // حساب عدد غير المقروءة
    const unreadCount = enrichedNotifications.filter((n: any) => !n.isRead).length;

    console.log(`📊 تم جلب ${filteredNotifications.length} إشعار، غير مقروء: ${unreadCount}`);

    return {
      notifications: filteredNotifications,
      unreadCount,
      total: notificationList.length
    };
  }

  /**
   * تعليم إشعار كمقروء
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    console.log(`✅ تعليم الإشعار كمقروء: ${notificationId}`);

    await db
      .insert(notificationReadStates)
      .values({
        notificationId,
        userId,
        isRead: true,
        readAt: new Date(),
        actionTaken: 'read'
      });
  }

  /**
   * تعليم جميع الإشعارات كمقروءة
   */
  async markAllAsRead(userId: string, projectId?: string): Promise<void> {
    console.log(`✅ تعليم جميع الإشعارات كمقروءة للمستخدم: ${userId}`);

    const conditions = [
      or(
        eq(notifications.recipients, JSON.stringify([userId])),
        eq(notifications.recipients, null)
      )
    ];

    if (projectId) {
      conditions.push(eq(notifications.projectId, projectId));
    }

    const userNotifications = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(...conditions));

    for (const notification of userNotifications) {
      await this.markAsRead(notification.id, userId);
    }

    console.log(`✅ تم تعليم ${userNotifications.length} إشعار كمقروء`);
  }

  /**
   * حذف إشعار
   */
  async deleteNotification(notificationId: string): Promise<void> {
    console.log(`🗑️ حذف الإشعار: ${notificationId}`);

    // حذف حالات القراءة أولاً
    await db
      .delete(notificationReadStates)
      .where(eq(notificationReadStates.notificationId, notificationId));

    // حذف من طابور الإرسال
    await db
      .delete(notificationQueue)
      .where(eq(notificationQueue.notificationId, notificationId));

    // حذف الإشعار
    await db
      .delete(notifications)
      .where(eq(notifications.id, notificationId));

    console.log(`✅ تم حذف الإشعار: ${notificationId}`);
  }

  /**
   * جلب إحصائيات الإشعارات
   */
  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    byPriority: Record<number, number>;
  }> {
    console.log(`📊 حساب إحصائيات الإشعارات للمستخدم: ${userId}`);

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(
        or(
          eq(notifications.recipients, JSON.stringify([userId])),
          eq(notifications.recipients, null)
        )
      );

    const readStates = await db
      .select()
      .from(notificationReadStates)
      .where(eq(notificationReadStates.userId, userId));

    const readNotificationIds = readStates
      .filter((rs: any) => rs.isRead)
      .map((rs: any) => rs.notificationId);

    const unread = userNotifications.filter((n: any) => !readNotificationIds.includes(n.id));

    // إحصائيات حسب النوع
    const byType: Record<string, number> = {};
    userNotifications.forEach((n: any) => {
      byType[n.type] = (byType[n.type] || 0) + 1;
    });

    // إحصائيات حسب الأولوية
    const byPriority: Record<number, number> = {};
    userNotifications.forEach((n: any) => {
      byPriority[n.priority] = (byPriority[n.priority] || 0) + 1;
    });

    const stats = {
      total: userNotifications.length,
      unread: unread.length,
      byType,
      byPriority
    };

    console.log(`📊 إحصائيات الإشعارات:`, stats);
    return stats;
  }
}