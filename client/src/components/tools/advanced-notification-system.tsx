import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  AlertTriangle, 
  Calendar, 
  Wrench, 
  Package, 
  Clock,
  CheckCircle,
  X,
  Settings,
  Check,
  MoreVertical,
  Trash2,
  AlertCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'maintenance' | 'damage' | 'warranty' | 'usage' | 'update';
  priority: 'low' | 'medium' | 'high';
  status: 'read' | 'unread';
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  readAt?: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'maintenance':
      return <Wrench className="h-4 w-4" />;
    case 'warranty':
      return <Calendar className="h-4 w-4" />;
    case 'damage':
      return <AlertTriangle className="h-4 w-4" />;
    case 'usage':
      return <Clock className="h-4 w-4" />;
    case 'update':
      return <Info className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'maintenance':
      return 'صيانة';
    case 'warranty':
      return 'ضمان';
    case 'damage':
      return 'عطل';
    case 'usage':
      return 'استخدام';
    case 'update':
      return 'تحديث';
    default:
      return 'عام';
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'عالية';
    case 'medium':
      return 'متوسطة';
    case 'low':
      return 'منخفضة';
    default:
      return 'عادية';
  }
};

const AdvancedNotificationSystem: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const queryClient = useQueryClient();

  // جلب الإشعارات
  const { data: notifications = [], isLoading } = useQuery<SystemNotification[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 60000, // كل دقيقة
  });

  // تحديد الإشعار كمقروء
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => 
      fetch(`/api/notifications/${id}/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // تحديد جميع الإشعارات كمقروءة
  const markAllAsReadMutation = useMutation({
    mutationFn: () => 
      fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // حذف الإشعار
  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => 
      fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // تصفية الإشعارات
  const filteredNotifications = notifications.filter(notification => {
    if (selectedType === 'all') return true;
    if (selectedType === 'unread') return notification.status === 'unread';
    return notification.type === selectedType;
  });

  // عدد الإشعارات غير المقروءة
  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDeleteNotification = (id: string) => {
    deleteNotificationMutation.mutate(id);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="relative"
            data-testid="button-notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500"
                data-testid="badge-unread-count"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl max-h-[80vh]" data-testid="dialog-notifications">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                الإشعارات النظام
              </span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    disabled={markAllAsReadMutation.isPending}
                    data-testid="button-mark-all-read"
                  >
                    <Check className="h-4 w-4 ml-2" />
                    تحديد الكل كمقروء
                  </Button>
                )}
              </div>
            </DialogTitle>
            <DialogDescription>
              إدارة إشعارات النظام والأدوات
            </DialogDescription>
          </DialogHeader>

          {/* فلاتر الإشعارات */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('all')}
              data-testid="filter-all"
            >
              الكل ({notifications.length})
            </Button>
            <Button
              variant={selectedType === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('unread')}
              data-testid="filter-unread"
            >
              غير مقروء ({unreadCount})
            </Button>
            <Button
              variant={selectedType === 'maintenance' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('maintenance')}
              data-testid="filter-maintenance"
            >
              <Wrench className="h-4 w-4 ml-1" />
              صيانة
            </Button>
            <Button
              variant={selectedType === 'damage' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('damage')}
              data-testid="filter-damage"
            >
              <AlertTriangle className="h-4 w-4 ml-1" />
              أعطال
            </Button>
            <Button
              variant={selectedType === 'warranty' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('warranty')}
              data-testid="filter-warranty"
            >
              <Calendar className="h-4 w-4 ml-1" />
              ضمان
            </Button>
          </div>

          {/* قائمة الإشعارات */}
          <ScrollArea className="max-h-96">
            {isLoading ? (
              <div className="text-center py-8" data-testid="loading-notifications">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">جاري تحميل الإشعارات...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-8" data-testid="no-notifications">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  {selectedType === 'all' ? 'لا توجد إشعارات' : 'لا توجد إشعارات مطابقة للفلتر المحدد'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={cn(
                      "transition-all duration-200 hover:shadow-md",
                      notification.status === 'unread' 
                        ? "border-l-4 border-l-primary bg-blue-50/30" 
                        : "bg-gray-50/30"
                    )}
                    data-testid={`notification-${notification.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn(
                              "p-1 rounded-full",
                              getPriorityColor(notification.priority)
                            )}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            <h4 className="font-semibold text-sm">
                              {notification.title}
                            </h4>
                            <Badge variant="secondary" className="text-xs">
                              {getTypeLabel(notification.type)}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", getPriorityColor(notification.priority))}
                            >
                              {getPriorityLabel(notification.priority)}
                            </Badge>
                            {notification.status === 'unread' && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              {notification.createdAt ? (
                                formatDistanceToNow(new Date(notification.createdAt), {
                                  addSuffix: true,
                                  locale: ar
                                })
                              ) : (
                                'منذ قليل'
                              )}
                            </span>
                            {notification.entityType === 'tool' && notification.metadata?.toolName && (
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {notification.metadata.toolName}
                              </span>
                            )}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {notification.status === 'unread' && (
                              <DropdownMenuItem
                                onClick={() => handleMarkAsRead(notification.id)}
                                data-testid={`mark-read-${notification.id}`}
                              >
                                <Check className="h-4 w-4 ml-2" />
                                تحديد كمقروء
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="text-red-600 hover:text-red-700"
                              data-testid={`delete-${notification.id}`}
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdvancedNotificationSystem;