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

  // مكون عرض بطاقة الإشعار
  const NotificationCard = ({ notification }: { notification: AdminNotification }) => {
    const typeInfo = typeLabels[notification.type as keyof typeof typeLabels] || { label: notification.type, icon: '📄' };
    const priorityInfo = priorityLabels[notification.priority as keyof typeof priorityLabels] || { label: 'غير محدد', color: 'bg-gray-500' };

    return (
      <Card className="mb-4 border-r-4" style={{ borderRightColor: priorityInfo.color.replace('bg-', '#') }}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>{typeInfo.icon}</span>
              {notification.title}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={`${priorityInfo.color} text-white`}>
                {priorityInfo.label}
              </Badge>
              <Badge variant="outline">
                {typeInfo.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">{notification.body}</p>
          
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(notification.createdAt).toLocaleString('ar')}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {notification.totalReads}/{notification.totalUsers} مقروء
            </span>
          </div>

          {/* تفاصيل المستخدمين */}
          <div className="space-y-2">
            <div className="text-sm font-medium">حالة المستخدمين:</div>
            <ScrollArea className="h-32 w-full rounded border p-2">
              {notification.readStates.map((state) => (
                <div key={state.userId} className="flex items-center justify-between py-1 border-b last:border-b-0">
                  <span className="text-sm">{state.userId}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={state.isRead ? "default" : "secondary"}>
                      {state.isRead ? 'مقروء' : 'غير مقروء'}
                    </Badge>
                    {state.readAt && (
                      <span className="text-xs text-gray-500">
                        {new Date(state.readAt).toLocaleString('ar')}
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate({
                        notificationId: notification.id,
                        userId: state.userId,
                        isRead: !state.isRead
                      })}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => deleteNotificationMutation.mutate(notification.id)}
            >
              <Delete className="h-4 w-4 mr-1" />
              حذف
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // مكون نشاط المستخدمين
  const UserActivityCard = ({ activity }: { activity: UserActivity }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              activity.userRole === 'admin' ? 'bg-red-500' : 'bg-blue-500'
            }`}>
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-medium flex items-center gap-2">
                {activity.userName}
                <Badge variant={activity.userRole === 'admin' ? 'destructive' : 'secondary'} className="text-xs">
                  {activity.userRole === 'admin' ? 'مسؤول' : 'مستخدم'}
                </Badge>
              </div>
              <div className="text-xs text-gray-500">{activity.userEmail}</div>
              <div className="text-xs text-gray-400">
                آخر نشاط: {activity.lastActivity ? new Date(activity.lastActivity).toLocaleString('ar') : 'لا يوجد'}
              </div>
            </div>
          </div>
          <div className="text-left space-y-1">
            <div className="text-sm">
              <Badge variant="outline">{activity.totalNotifications} إجمالي</Badge>
            </div>
            <div className="text-sm">
              <Badge variant="default" className="bg-green-500">{activity.readNotifications} مقروء</Badge>
              <Badge variant="secondary" className="ml-1">{activity.unreadNotifications} غير مقروء</Badge>
            </div>
            <div className="text-sm">
              <Badge variant="outline">{activity.readPercentage}% معدل القراءة</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-4 max-w-7xl" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Shield className="h-8 w-8 text-blue-600" />
          لوحة تحكم الإشعارات - المسؤول
        </h1>
        <p className="text-gray-600">إدارة شاملة لجميع إشعارات النظام والمستخدمين</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            الإشعارات
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            المستخدمين
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            إرسال جديد
          </TabsTrigger>
        </TabsList>

        {/* نظرة عامة */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  إجمالي الإشعارات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{notificationsData?.total || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  المستخدمين النشطين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userActivityData?.userStats?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BellRing className="h-4 w-4" />
                  متوسط القراءة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userActivityData?.userStats?.length > 0 
                    ? Math.round(userActivityData.userStats.reduce((acc: number, user: UserActivity) => acc + user.readPercentage, 0) / userActivityData.userStats.length)
                    : 0}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  الإشعارات الحرجة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {notificationsData?.notifications?.filter((n: AdminNotification) => n.priority === 5).length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>آخر النشاطات</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <ScrollArea className="h-96">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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