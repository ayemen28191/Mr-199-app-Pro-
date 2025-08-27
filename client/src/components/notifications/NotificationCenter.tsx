import { useState, useEffect } from "react";
import { Bell, X, CheckCircle, AlertTriangle, Info, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

interface Notification {
  id: string;
  type: 'safety' | 'task' | 'payroll' | 'announcement' | 'system';
  title: string;
  message: string;
  priority: number;
  createdAt: string;
  isRead?: boolean;
  actionRequired?: boolean;
}

interface NotificationCenterProps {
  className?: string;
}

const notificationIcons = {
  safety: AlertTriangle,
  task: CheckCircle,
  payroll: MessageCircle,
  announcement: Info,
  system: Bell,
};

const notificationColors = {
  safety: "text-red-600 bg-red-50",
  task: "text-blue-600 bg-blue-50",
  payroll: "text-green-600 bg-green-50",
  announcement: "text-purple-600 bg-purple-50",
  system: "text-gray-600 bg-gray-50",
};

const priorityLabels = {
  1: { label: "عاجل", color: "bg-red-500" },
  2: { label: "عالية", color: "bg-orange-500" },
  3: { label: "متوسطة", color: "bg-yellow-500" },
  4: { label: "منخفضة", color: "bg-blue-500" },
  5: { label: "معلومة", color: "bg-gray-500" },
};

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // جلب الإشعارات من API
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications?userId=default&limit=20');
      if (response.ok) {
        const data = await response.json();
        // إذا كان التنسيق الجديد
        if (data.notifications) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount || 0);
        } 
        // إذا كان التنسيق القديم
        else if (Array.isArray(data)) {
          setNotifications(data.map((n: any) => ({
            ...n,
            isRead: n.status === 'read'
          })));
          setUnreadCount(data.filter((n: any) => n.status !== 'read').length);
        }
      } else {
        console.error('فشل في جلب الإشعارات');
        // استخدام بيانات تجريبية في حالة الفشل
        setNotifications([
          {
            id: 'system-welcome',
            type: 'system',
            title: 'مرحباً بك',
            message: 'مرحباً بك في نظام إدارة المشاريع الإنشائية',
            priority: 3,
            createdAt: new Date().toISOString(),
            isRead: false,
          }
        ]);
        setUnreadCount(1);
      }
    } catch (error) {
      console.error('خطأ في جلب الإشعارات:', error);
    } finally {
      setLoading(false);
    }
  };

  // تعليم إشعار كمقروء
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: 'default' }),
      });
      
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('خطأ في تعليم الإشعار كمقروء:', error);
    }
  };

  // تعليم جميع الإشعارات كمقروءة
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: 'default' }),
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('خطأ في تعليم جميع الإشعارات كمقروءة:', error);
    }
  };

  // جلب الإشعارات عند تحميل المكون
  useEffect(() => {
    fetchNotifications();
    
    // تحديث الإشعارات كل 30 ثانية
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `منذ ${diffInMinutes} دقيقة`;
    } else if (diffInHours < 24) {
      return `منذ ${Math.floor(diffInHours)} ساعة`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `منذ ${diffInDays} يوم`;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("relative p-2 h-9 w-9", className)}
          data-testid="notification-bell"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
              variant="destructive"
              data-testid="notification-badge"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end" data-testid="notification-popover">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">الإشعارات</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={markAllAsRead}
                data-testid="mark-all-read-button"
              >
                تعليم الكل كمقروء
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              data-testid="close-notification-button"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">جاري التحميل...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <div className="text-sm text-muted-foreground">لا توجد إشعارات</div>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification, index) => {
                const Icon = notificationIcons[notification.type];
                const colorClasses = notificationColors[notification.type];
                const priority = priorityLabels[notification.priority as keyof typeof priorityLabels] || priorityLabels[3];
                
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                      !notification.isRead && "bg-blue-50/50"
                    )}
                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                    data-testid={`notification-item-${index}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-full", colorClasses)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={cn(
                            "text-sm font-medium mb-1",
                            !notification.isRead && "font-semibold"
                          )}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge
                              className={cn("h-4 text-xs", priority.color)}
                              variant="secondary"
                            >
                              {priority.label}
                            </Badge>
                            {!notification.isRead && (
                              <div className="h-2 w-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(notification.createdAt)}
                          </span>
                          
                          {notification.actionRequired && (
                            <Badge variant="outline" className="text-xs">
                              إجراء مطلوب
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => {
                  setIsOpen(false);
                  // يمكن إضافة التنقل إلى صفحة الإشعارات الكاملة هنا
                }}
                data-testid="view-all-notifications-button"
              >
                عرض جميع الإشعارات
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}