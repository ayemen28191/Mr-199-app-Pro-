import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Bell, BellRing, Clock, Delete, Edit, Eye, RefreshCw, Send, Settings, Shield, User, Users } from 'lucide-react';

// أنواع البيانات
interface AdminNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  priority: number;
  recipients: string[] | null;
  projectId?: string;
  createdAt: string;
  readStates: Array<{
    userId: string;
    isRead: boolean;
    readAt?: string;
    actionTaken: boolean;
  }>;
  totalReads: number;
  totalUsers: number;
}

interface UserActivity {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  totalNotifications: number;
  readNotifications: number;
  unreadNotifications: number;
  lastActivity?: string;
  readPercentage: number;
}

// أولويات الإشعارات
const priorityLabels = {
  1: { label: 'معلومات', color: 'bg-blue-500' },
  2: { label: 'منخفض', color: 'bg-green-500' },
  3: { label: 'متوسط', color: 'bg-yellow-500' },
  4: { label: 'عالي', color: 'bg-orange-500' },
  5: { label: 'حرج', color: 'bg-red-500' }
};

// أنواع الإشعارات
const typeLabels = {
  'system': { label: 'نظام', icon: '⚙️' },
  'security': { label: 'أمني', icon: '🔒' },
  'error': { label: 'خطأ', icon: '❌' },
  'task': { label: 'مهمة', icon: '📋' },
  'payroll': { label: 'راتب', icon: '💰' },
  'announcement': { label: 'إعلان', icon: '📢' },
  'maintenance': { label: 'صيانة', icon: '🔧' },
  'warranty': { label: 'ضمان', icon: '🛡️' }
};

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [filters, setFilters] = useState({
    type: '',
    priority: '',
    limit: 50,
    offset: 0
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    body: '',
    type: 'announcement',
    priority: 3,
    recipients: 'all',
    projectId: ''
  });

  // جلب جميع الإشعارات للمسؤول
  const { data: notificationsData, isLoading: isLoadingNotifications, refetch: refetchNotifications } = useQuery({
    queryKey: ['admin-notifications', filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        requesterId: 'admin',
        limit: filters.limit.toString(),
        offset: filters.offset.toString(),
        ...(filters.type && { type: filters.type }),
        ...(filters.priority && { priority: filters.priority })
      });
      
      const response = await fetch(`/api/admin/notifications/all?${params}`);
      if (!response.ok) throw new Error('فشل في جلب الإشعارات');
      return response.json();
    }
  });

  // جلب نشاط المستخدمين
  const { data: userActivityData, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['user-activity'],
    queryFn: async () => {
      const response = await fetch('/api/admin/notifications/user-activity?requesterId=admin');
      if (!response.ok) throw new Error('فشل في جلب نشاط المستخدمين');
      return response.json();
    }
  });

  // إرسال إشعار جديد
  const sendNotificationMutation = useMutation({
    mutationFn: async (notification: typeof newNotification) => {
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...notification, requesterId: 'admin' })
      });
      if (!response.ok) throw new Error('فشل في إرسال الإشعار');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم إرسال الإشعار بنجاح', variant: 'default' });
      setIsCreateDialogOpen(false);
      setNewNotification({
        title: '',
        body: '',
        type: 'announcement',
        priority: 3,
        recipients: 'all',
        projectId: ''
      });
      refetchNotifications();
    },
    onError: () => {
      toast({ title: 'خطأ في إرسال الإشعار', variant: 'destructive' });
    }
  });

  // حذف إشعار
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/admin/notifications/${notificationId}?requesterId=admin`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('فشل في حذف الإشعار');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم حذف الإشعار بنجاح', variant: 'default' });
      refetchNotifications();
    },
    onError: () => {
      toast({ title: 'خطأ في حذف الإشعار', variant: 'destructive' });
    }
  });

  // تغيير حالة الإشعار لمستخدم معين
  const updateStatusMutation = useMutation({
    mutationFn: async ({ notificationId, userId, isRead }: { notificationId: string; userId: string; isRead: boolean }) => {
      const response = await fetch(`/api/admin/notifications/${notificationId}/user/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead, requesterId: 'admin' })
      });
      if (!response.ok) throw new Error('فشل في تحديث الحالة');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم تحديث الحالة بنجاح', variant: 'default' });
      refetchNotifications();
    },
    onError: () => {
      toast({ title: 'خطأ في تحديث الحالة', variant: 'destructive' });
    }
  });

  // جلب اسم المستخدم من بياناته
  const getUserName = (userId: string) => {
    const user = userActivityData?.userStats?.find((u: UserActivity) => u.userId === userId);
    return user?.userName || userId.slice(0, 8) + '...';
  };

  // مكون عرض بطاقة الإشعار
  const NotificationCard = ({ notification }: { notification: AdminNotification }) => {
    const typeInfo = typeLabels[notification.type as keyof typeof typeLabels] || { label: notification.type, icon: '📄' };
    const priorityInfo = priorityLabels[notification.priority as keyof typeof priorityLabels] || { label: 'غير محدد', color: 'bg-gray-500' };

    return (
      <Card className="mb-3 border-r-4 shadow-sm" style={{ borderRightColor: priorityInfo.color.replace('bg-', '#') }}>
        <CardHeader className="pb-3 px-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2 break-words">
              <span className="text-lg">{typeInfo.icon}</span>
              <span className="min-w-0 flex-1">{notification.title}</span>
            </CardTitle>
            <div className="flex items-center gap-1 flex-wrap">
              <Badge className={`${priorityInfo.color} text-white text-xs px-2 py-1`}>
                {priorityInfo.label}
              </Badge>
              <Badge variant="outline" className="text-xs px-2 py-1">
                {typeInfo.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{notification.body}</p>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 mb-3 gap-1">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{new Date(notification.createdAt).toLocaleString('ar', { 
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3 flex-shrink-0" />
              {notification.totalReads}/{notification.totalUsers} مقروء
            </span>
          </div>

          {/* تفاصيل المستخدمين */}
          <div className="space-y-2">
            <div className="text-sm font-medium flex items-center gap-1">
              <User className="h-4 w-4" />
              حالة المستخدمين:
            </div>
            <ScrollArea className="h-24 sm:h-32 w-full rounded border p-2 bg-gray-50">
              {notification.readStates.map((state) => (
                <div key={state.userId} className="flex items-center justify-between py-1.5 px-1 border-b last:border-b-0 bg-white rounded mb-1 last:mb-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${
                      userActivityData?.userStats?.find((u: UserActivity) => u.userId === state.userId)?.userRole === 'admin' 
                        ? 'bg-red-500' : 'bg-blue-500'
                    }`}>
                      {getUserName(state.userId).charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium truncate">{getUserName(state.userId)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={state.isRead ? "default" : "secondary"} className="text-xs px-1.5 py-0.5">
                      {state.isRead ? '✓' : '○'}
                    </Badge>
                    {state.readAt && (
                      <span className="text-xs text-gray-500 hidden sm:block">
                        {new Date(state.readAt).toLocaleString('ar', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>

          <div className="flex justify-end gap-2 mt-3">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => deleteNotificationMutation.mutate(notification.id)}
              className="h-8 px-3 text-xs"
            >
              <Delete className="h-3 w-3 mr-1" />
              حذف
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // مكون نشاط المستخدمين
  const UserActivityCard = ({ activity }: { activity: UserActivity }) => (
    <Card className="mb-2 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              activity.userRole === 'admin' ? 'bg-red-500' : 'bg-blue-500'
            }`}>
              {activity.userRole === 'admin' ? (
                <Shield className="h-5 w-5 text-white" />
              ) : (
                <User className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium flex items-center gap-2 flex-wrap">
                <span className="truncate">{activity.userName}</span>
                <Badge variant={activity.userRole === 'admin' ? 'destructive' : 'secondary'} className="text-xs px-2 py-0.5">
                  {activity.userRole === 'admin' ? 'مسؤول' : 'مستخدم'}
                </Badge>
              </div>
              <div className="text-xs text-gray-500 truncate">{activity.userEmail}</div>
              <div className="text-xs text-gray-400">
                آخر نشاط: {activity.lastActivity ? new Date(activity.lastActivity).toLocaleString('ar', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'لا يوجد'}
              </div>
            </div>
          </div>
          <div className="flex flex-row sm:flex-col sm:text-left gap-2 sm:gap-1 flex-wrap">
            <Badge variant="outline" className="text-xs px-2 py-1">
              {activity.totalNotifications} إجمالي
            </Badge>
            <div className="flex gap-1">
              <Badge variant="default" className="bg-green-500 text-xs px-2 py-1">
                {activity.readNotifications} مقروء
              </Badge>
              <Badge variant="secondary" className="text-xs px-2 py-1">
                {activity.unreadNotifications} غير مقروء
              </Badge>
            </div>
            <Badge variant={activity.readPercentage >= 80 ? "default" : activity.readPercentage >= 50 ? "secondary" : "destructive"} className="text-xs px-2 py-1">
              {activity.readPercentage}% معدل القراءة
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-2 sm:p-4 max-w-7xl" dir="rtl">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 flex items-center gap-2">
          <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
          <span className="break-words">لوحة تحكم الإشعارات - المسؤول</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-600">إدارة شاملة لجميع إشعارات النظام والمستخدمين</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto p-1">
          <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">نظرة عامة</span>
            <span className="sm:hidden">عامة</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
            <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">الإشعارات</span>
            <span className="sm:hidden">إشعارات</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">المستخدمين</span>
            <span className="sm:hidden">مستخدمين</span>
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
            <Send className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">إرسال جديد</span>
            <span className="sm:hidden">إرسال</span>
          </TabsTrigger>
        </TabsList>

        {/* نظرة عامة */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                  <Bell className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                  <span className="break-words">إجمالي الإشعارات</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="text-lg sm:text-2xl font-bold text-blue-600">{notificationsData?.total || 0}</div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                  <span className="break-words">المستخدمين النشطين</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="text-lg sm:text-2xl font-bold text-green-600">{userActivityData?.userStats?.length || 0}</div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                  <BellRing className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                  <span className="break-words">متوسط القراءة</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                  {userActivityData?.userStats?.length > 0 
                    ? Math.round(userActivityData.userStats.reduce((acc: number, user: UserActivity) => acc + user.readPercentage, 0) / userActivityData.userStats.length)
                    : 0}%
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                  <span className="break-words">الإشعارات الحرجة</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="text-lg sm:text-2xl font-bold text-red-600">
                  {notificationsData?.notifications?.filter((n: AdminNotification) => n.priority === 5).length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-base sm:text-lg">آخر النشاطات</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ScrollArea className="h-48 sm:h-64">
                {userActivityData?.userStats?.slice(0, 5).map((activity: UserActivity) => (
                  <UserActivityCard key={activity.userId} activity={activity} />
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* إدارة الإشعارات */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>فلترة الإشعارات</CardTitle>
                <Button
                  onClick={() => refetchNotifications()}
                  disabled={isLoadingNotifications}
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  تحديث
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                <Select value={filters.type || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value === "all" ? "" : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="نوع الإشعار" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    {Object.entries(typeLabels).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.icon} {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.priority || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value === "all" ? "" : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="الأولوية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأولويات</SelectItem>
                    {Object.entries(priorityLabels).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  placeholder="عدد النتائج"
                  value={filters.limit}
                  onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) || 50 }))}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {isLoadingNotifications ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : notificationsData?.notifications?.length > 0 ? (
              notificationsData.notifications.map((notification: AdminNotification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p>لا توجد إشعارات</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* نشاط المستخدمين */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>نشاط المستخدمين مع الإشعارات</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingActivity ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : userActivityData?.userStats?.length > 0 ? (
                <ScrollArea className="h-64 sm:h-96">
                  {userActivityData.userStats.map((activity: UserActivity) => (
                    <UserActivityCard key={activity.userId} activity={activity} />
                  ))}
                </ScrollArea>
              ) : (
                <div className="text-center py-8">لا يوجد نشاط للمستخدمين</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* إرسال إشعار جديد */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إرسال إشعار جديد</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">العنوان</label>
                  <Input
                    value={newNotification.title}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="عنوان الإشعار"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">النوع</label>
                  <Select 
                    value={newNotification.type} 
                    onValueChange={(value) => setNewNotification(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.icon} {value.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">الأولوية</label>
                  <Select 
                    value={newNotification.priority.toString()} 
                    onValueChange={(value) => setNewNotification(prev => ({ ...prev, priority: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityLabels).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">المستقبلين</label>
                  <Select 
                    value={newNotification.recipients} 
                    onValueChange={(value) => setNewNotification(prev => ({ ...prev, recipients: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المستخدمين</SelectItem>
                      <SelectItem value="admins">المسؤولين فقط</SelectItem>
                      <SelectItem value="users">المستخدمين العاديين فقط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">المحتوى</label>
                <Textarea
                  value={newNotification.body}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="محتوى الإشعار"
                  rows={4}
                />
              </div>

              <Button
                onClick={() => sendNotificationMutation.mutate(newNotification)}
                disabled={!newNotification.title || !newNotification.body || sendNotificationMutation.isPending}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendNotificationMutation.isPending ? 'جاري الإرسال...' : 'إرسال الإشعار'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}