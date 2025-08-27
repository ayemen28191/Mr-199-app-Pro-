import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

interface Notification {
  id: string;
  type: 'system' | 'maintenance' | 'warranty' | 'damaged';
  title: string;
  message: string;
  priority: 'info' | 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  status: 'read' | 'unread';
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

  // جلب الإشعارات
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      return response.json() as Promise<Notification[]>;
    }
  });

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

  // فلترة الإشعارات
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    return notification.status === filter;
  });

  // عد الإشعارات غير المقروءة
  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate({ notificationId });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8 min-h-screen" dir="rtl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">الإشعارات</h1>
              <p className="text-gray-600">إدارة إشعارات النظام</p>
            </div>
          </div>
        </div>
        
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
    <div className="container mx-auto p-6 space-y-8 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">الإشعارات</h1>
            <p className="text-gray-600">
              إدارة إشعارات النظام ({notifications.length} إجمالي، {unreadCount} غير مقروء)
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className="gap-2"
          data-testid="filter-all"
        >
          <Bell className="h-4 w-4" />
          جميع الإشعارات ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          onClick={() => setFilter('unread')}
          className="gap-2"
          data-testid="filter-unread"
        >
          <BellOff className="h-4 w-4" />
          غير مقروءة ({unreadCount})
        </Button>
        <Button
          variant={filter === 'read' ? 'default' : 'outline'}
          onClick={() => setFilter('read')}
          className="gap-2"
          data-testid="filter-read"
        >
          <CheckCircle className="h-4 w-4" />
          مقروءة ({notifications.length - unreadCount})
        </Button>
      </div>

      {/* Notifications List */}
      <div className="grid gap-4">
        {filteredNotifications.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                لا توجد إشعارات
              </h3>
              <p className="text-gray-500">
                {filter === 'all' && 'لا توجد إشعارات في النظام حالياً'}
                {filter === 'unread' && 'لا توجد إشعارات غير مقروءة'}
                {filter === 'read' && 'لا توجد إشعارات مقروءة'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const PriorityIcon = priorityIcons[notification.priority];
            const TypeIcon = typeIcons[notification.type];
            
            return (
              <Card
                key={notification.id}
                className={`transition-all duration-200 hover:shadow-md ${
                  notification.status === 'unread' 
                    ? 'border-l-4 border-l-blue-500 bg-blue-50/30' 
                    : ''
                }`}
                data-testid={`notification-${notification.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex items-center gap-2 mt-1">
                        <TypeIcon className="h-5 w-5 text-gray-500" />
                        <PriorityIcon className={`h-4 w-4 text-white rounded-full p-1 ${priorityColors[notification.priority]}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{notification.title}</CardTitle>
                          {notification.status === 'unread' && (
                            <Badge variant="secondary" className="text-xs">
                              جديد
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-xs ${priorityColors[notification.priority]} text-white`}
                          >
                            {notification.priority === 'info' && 'معلومات'}
                            {notification.priority === 'low' && 'منخفض'}
                            {notification.priority === 'medium' && 'متوسط'}
                            {notification.priority === 'high' && 'عالي'}
                            {notification.priority === 'critical' && 'حرج'}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {new Date(notification.createdAt).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </CardDescription>
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
                        تعليم كمقروء
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {notification.message}
                  </p>
                  
                  {notification.actionRequired && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">يتطلب إجراءً</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}