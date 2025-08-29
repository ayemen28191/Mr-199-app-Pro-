import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, CheckCircle, AlertCircle, Info, AlertTriangle, Filter, Clock } from 'lucide-react';
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'system' | 'maintenance' | 'warranty' | 'damaged';
  title: string;
  message: string;
  priority: 'info' | 'low' | 'medium' | 'high' | 'critical' | number;
  createdAt: string;
  status?: 'read' | 'unread';
  isRead?: boolean;
  actionRequired: boolean;
}

const priorityColors = {
  info: 'bg-blue-500',
  low: 'bg-gray-500', 
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500'
};

const priorityIcons = {
  info: Info,
  low: Info,
  medium: AlertTriangle,
  high: AlertCircle,
  critical: AlertCircle
};

const typeIcons = {
  system: Bell,
  maintenance: AlertTriangle,
  warranty: AlertCircle,
  damaged: AlertCircle
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // جلب الإشعارات
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      return response.json() as Promise<{
        notifications: Notification[];
        unreadCount: number;
        total: number;
      }>;
    }
  });

  // استخراج مصفوفة الإشعارات من البيانات المُرجعة
  const notifications = notificationsData?.notifications || [];

  // تحديد إشعار كمقروء
  const markAsReadMutation = useMutation({
    mutationFn: async ({ notificationId, userId }: { notificationId: string; userId?: string }) => {
      const response = await fetch(`/api/notifications/${userId || 'default'}/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId,
          notificationType: 'system'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "تم بنجاح",
        description: "تم تعليم الإشعار كمقروء",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تعليم الإشعار كمقروء",
        variant: "destructive",
      });
    }
  });

  // تحويل البيانات لضمان التوافق
  const normalizedNotifications = notifications.map(notification => ({
    ...notification,
    priority: getPriorityString(notification.priority),
    status: notification.status || (notification.isRead ? 'read' : 'unread')
  }));

  // فلترة الإشعارات
  const filteredNotifications = normalizedNotifications.filter(notification => {
    // فلترة حسب الحالة
    if (filter !== 'all' && notification.status !== filter) return false;
    // فلترة حسب النوع
    if (selectedType !== 'all' && notification.type !== selectedType) return false;
    return true;
  });

  // أنواع الإشعارات الموجودة
  const notificationTypes = Array.from(new Set(normalizedNotifications.map(n => n.type)));
  
  // دالة مساعدة لتحويل الأولوية الرقمية إلى نص
  const getPriorityString = (priority: number | string): 'info' | 'low' | 'medium' | 'high' | 'critical' => {
    if (typeof priority === 'string') return priority as any;
    if (priority <= 1) return 'info';
    if (priority <= 2) return 'low';
    if (priority <= 3) return 'medium';
    if (priority <= 4) return 'high';
    return 'critical';
  };

  // إحصائيات سريعة
  const stats = {
    total: normalizedNotifications.length,
    unread: normalizedNotifications.filter(n => n.status === 'unread').length,
    critical: normalizedNotifications.filter(n => getPriorityString(n.priority) === 'critical').length,
    high: normalizedNotifications.filter(n => getPriorityString(n.priority) === 'high').length,
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate({ notificationId });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-6 min-h-screen" dir="rtl">
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-900/10" dir="rtl">
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* إحصائيات سريعة */}
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-blue-500/10 px-4 py-3 rounded-lg text-center">
              <div className="text-xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs text-gray-600">إجمالي الإشعارات</div>
            </div>
            <div className="bg-orange-500/10 px-4 py-3 rounded-lg text-center">
              <div className="text-xl font-bold text-orange-600">{stats.unread}</div>
              <div className="text-xs text-gray-600">غير مقروء</div>
            </div>
            <div className="bg-red-500/10 px-4 py-3 rounded-lg text-center">
              <div className="text-xl font-bold text-red-600">{stats.critical}</div>
              <div className="text-xs text-gray-600">حرج</div>
            </div>
            <div className="bg-yellow-500/10 px-4 py-3 rounded-lg text-center">
              <div className="text-xl font-bold text-yellow-600">{stats.high}</div>
              <div className="text-xs text-gray-600">عالي الأولوية</div>
            </div>
          </div>
        </div>

        {/* فلاتر الإشعارات */}
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">تصفية الإشعارات</span>
          </div>
          
          {/* فلاتر الحالة */}
          <div className="grid grid-cols-2 sm:flex gap-2 mb-3">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
              className="gap-2"
              data-testid="filter-all"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">جميع الإشعارات</span>
              <span className="sm:hidden">الكل</span>
              <Badge variant="secondary" className="text-xs">{stats.total}</Badge>
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              onClick={() => setFilter('unread')}
              size="sm"
              className="gap-2"
              data-testid="filter-unread"
            >
              <BellOff className="h-4 w-4" />
              <span className="hidden sm:inline">غير مقروءة</span>
              <span className="sm:hidden">جديد</span>
              <Badge variant="secondary" className="text-xs">{stats.unread}</Badge>
            </Button>
            <Button
              variant={filter === 'read' ? 'default' : 'outline'}
              onClick={() => setFilter('read')}
              size="sm"
              className="gap-2"
              data-testid="filter-read"
            >
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">مقروءة</span>
              <span className="sm:hidden">مقروء</span>
              <Badge variant="secondary" className="text-xs">{stats.total - stats.unread}</Badge>
            </Button>
          </div>

          {/* فلاتر النوع */}
          {notificationTypes.length > 0 && (
            <div className="grid grid-cols-2 sm:flex gap-2">
              <Button
                variant={selectedType === 'all' ? 'secondary' : 'ghost'}
                onClick={() => setSelectedType('all')}
                size="sm"
                className="text-xs"
              >
                جميع الأنواع
              </Button>
              {notificationTypes.map(type => (
                <Button
                  key={type}
                  variant={selectedType === type ? 'secondary' : 'ghost'}
                  onClick={() => setSelectedType(type)}
                  size="sm" 
                  className="text-xs gap-1"
                >
                  {typeIcons[type as keyof typeof typeIcons] && 
                    React.createElement(typeIcons[type as keyof typeof typeIcons], { className: "h-3 w-3" })}
                  {type === 'system' && 'نظام'}
                  {type === 'maintenance' && 'صيانة'}
                  {type === 'warranty' && 'ضمان'}
                  {type === 'damaged' && 'عطل'}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* قائمة الإشعارات */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-lg text-center">
              <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                لا توجد إشعارات
              </h3>
              <p className="text-gray-500">
                {filter === 'all' && 'لا توجد إشعارات في النظام حالياً'}
                {filter === 'unread' && 'لا توجد إشعارات غير مقروءة'}
                {filter === 'read' && 'لا توجد إشعارات مقروءة'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const PriorityIcon = priorityIcons[notification.priority];
              const TypeIcon = typeIcons[notification.type];
              
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 shadow-lg transition-all duration-200 hover:shadow-xl",
                    notification.status === 'unread' && "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                  )}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex items-center gap-2 mt-1">
                        <TypeIcon className="h-5 w-5 text-gray-500" />
                        <div className={cn("p-1 rounded-full", priorityColors[notification.priority])}>
                          <PriorityIcon className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {notification.title}
                          </h3>
                          {notification.status === 'unread' && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                              جديد
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={cn("text-xs text-white border-0", priorityColors[notification.priority])}
                          >
                            {notification.priority === 'info' && 'معلومات'}
                            {notification.priority === 'low' && 'منخفض'}
                            {notification.priority === 'medium' && 'متوسط'}
                            {notification.priority === 'high' && 'عالي'}
                            {notification.priority === 'critical' && 'حرج'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(notification.createdAt).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {notification.message}
                        </p>
                        
                        {notification.actionRequired && (
                          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-sm font-medium">يتطلب إجراءً</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {notification.status === 'unread' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={markAsReadMutation.isPending}
                        className="gap-2 shrink-0"
                        data-testid={`mark-read-${notification.id}`}
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">تعليم كمقروء</span>
                        <span className="sm:hidden">مقروء</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}