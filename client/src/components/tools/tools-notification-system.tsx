import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Zap
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface NotificationSettings {
  maintenanceAlerts: boolean;
  warrantyExpiry: boolean;
  stockLevels: boolean;
  unusedTools: boolean;
  damagedReports: boolean;
}

interface ToolNotification {
  id: string;
  type: 'maintenance' | 'warranty' | 'stock' | 'unused' | 'damaged';
  title: string;
  message: string;
  toolId: string;
  toolName: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  isRead: boolean;
  actionRequired: boolean;
}

const ToolsNotificationSystem: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [settings, setSettings] = useState<NotificationSettings>({
    maintenanceAlerts: true,
    warrantyExpiry: true,
    stockLevels: true,
    unusedTools: false,
    damagedReports: true,
  });

  // جلب الإشعارات من الخادم
  const { data: notifications = [], refetch } = useQuery<ToolNotification[]>({
    queryKey: ['/api/tools/notifications'],
    refetchInterval: 300000, // كل 5 دقائق
  });

  const unreadCount = (notifications as ToolNotification[]).filter((n: ToolNotification) => !n.isRead).length;
  const criticalCount = (notifications as ToolNotification[]).filter((n: ToolNotification) => n.priority === 'critical').length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'warranty': return <Calendar className="h-4 w-4" />;
      case 'stock': return <Package className="h-4 w-4" />;
      case 'unused': return <Clock className="h-4 w-4" />;
      case 'damaged': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
      case 'high': return 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200';
      case 'low': return 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
      default: return 'bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-200';
    }
  };

  const filteredNotifications = (notifications as ToolNotification[]).filter((notification: ToolNotification) => 
    selectedType === 'all' || notification.type === selectedType
  );

  const markAsRead = async (notificationId: string) => {
    try {
      // إرسال طلب لتحديث حالة الإشعار في قاعدة البيانات
      await apiRequest(`/api/notifications/${notificationId}/mark-read`, 'POST');
      
      // تحديث البيانات المحلية
      const currentNotifications = notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      );
      
      // إعادة تحديث البيانات
      refetch();
    } catch (error) {
      console.error('خطأ في تحديد الإشعار كمقروء:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // إرسال طلب لتحديث جميع الإشعارات
      await apiRequest('/api/notifications/mark-all-read', 'POST');
      
      // إعادة تحديث البيانات
      refetch();
    } catch (error) {
      console.error('خطأ في تحديد جميع الإشعارات كمقروءة:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="relative"
          data-testid="notifications-button"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -left-2 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-0"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          إشعارات الأدوات
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-hidden" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            إشعارات إدارة الأدوات
            {criticalCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                <Zap className="h-3 w-3" />
                {criticalCount} عاجل
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-sm">
            تتبع حالة الأدوات والصيانة والتنبيهات المهمة
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Filter Tabs - Mobile Responsive */}
          <div className="grid grid-cols-2 sm:flex gap-2 mb-4">
            <Button
              variant={selectedType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('all')}
              className="text-xs"
            >
              الكل ({(notifications as ToolNotification[]).length})
            </Button>
            <Button
              variant={selectedType === 'maintenance' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('maintenance')}
              className="text-xs"
            >
              <Wrench className="h-3 w-3 ml-1" />
              صيانة ({(notifications as ToolNotification[]).filter((n: ToolNotification) => n.type === 'maintenance').length})
            </Button>
            <Button
              variant={selectedType === 'warranty' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('warranty')}
              className="text-xs"
            >
              <Calendar className="h-3 w-3 ml-1" />
              ضمان ({(notifications as ToolNotification[]).filter((n: ToolNotification) => n.type === 'warranty').length})
            </Button>
            <Button
              variant={selectedType === 'damaged' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('damaged')}
              className="text-xs"
            >
              <AlertTriangle className="h-3 w-3 ml-1" />
              معطل ({(notifications as ToolNotification[]).filter((n: ToolNotification) => n.type === 'damaged').length})
            </Button>
          </div>

          {/* Action Bar - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="text-xs"
            >
              <CheckCircle className="h-4 w-4 ml-1" />
              تحديد الكل كمقروء
            </Button>
            
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs">
                  <Settings className="h-4 w-4 ml-1" />
                  إعدادات الإشعارات
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 p-3 border rounded-md bg-gray-50 dark:bg-gray-900">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="maintenance-alerts"
                      checked={settings.maintenanceAlerts}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, maintenanceAlerts: checked }))
                      }
                    />
                    <Label htmlFor="maintenance-alerts" className="text-sm">
                      تنبيهات الصيانة
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="warranty-expiry"
                      checked={settings.warrantyExpiry}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, warrantyExpiry: checked }))
                      }
                    />
                    <Label htmlFor="warranty-expiry" className="text-sm">
                      انتهاء الضمان
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="damaged-reports"
                      checked={settings.damagedReports}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, damagedReports: checked }))
                      }
                    />
                    <Label htmlFor="damaged-reports" className="text-sm">
                      تقارير الأعطال
                    </Label>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {selectedType === 'all' ? 'لا توجد إشعارات' : 'لا توجد إشعارات من هذا النوع'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification: ToolNotification) => (
                <Card
                  key={notification.id}
                  className={`${getPriorityColor(notification.priority)} ${
                    !notification.isRead ? 'shadow-md' : 'opacity-75'
                  } transition-all hover:shadow-lg`}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 sm:gap-3 flex-1">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-1 flex-wrap">
                            <h4 className="font-medium text-sm leading-tight">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                            )}
                            {notification.actionRequired && (
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                يتطلب إجراء
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-gray-500">
                            <span>الأداة: {notification.toolName}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>
                              {formatDistanceToNow(new Date(notification.timestamp), {
                                addSuffix: true,
                                locale: ar
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-1 flex-shrink-0">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-2"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ToolsNotificationSystem;