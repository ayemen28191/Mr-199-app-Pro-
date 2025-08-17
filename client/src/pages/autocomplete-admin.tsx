import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, BarChart3, Settings, Trash2, RefreshCw, Database, Clock } from 'lucide-react';
import { useFloatingButton } from '@/components/layout/floating-button-context';
import { useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

/**
 * واجهة إدارة نظام الإكمال التلقائي
 * AutoComplete System Administration Interface
 */

interface AutocompleteStats {
  totalRecords: number;
  categoriesCount: number;
  categoryBreakdown: { category: string; count: number; avgUsage: number }[];
  oldRecordsCount: number;
}

interface MaintenanceResult {
  cleanupResult: { deletedCount: number; categories: string[] };
  limitResult: { trimmedCategories: string[]; deletedCount: number };
  totalProcessed: number;
}

export default function AutocompleteAdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMaintenanceRunning, setIsMaintenanceRunning] = useState(false);
  const { setFloatingAction } = useFloatingButton();

  // تعيين إجراء الزر العائم لتشغيل الصيانة
  useEffect(() => {
    const handleRunMaintenance = () => {
      if (!isMaintenanceRunning) {
        setIsMaintenanceRunning(true);
        maintenanceMutation.mutate();
      }
    };
    
    setFloatingAction(handleRunMaintenance, "تشغيل الصيانة");
    return () => setFloatingAction(null);
  }, [setFloatingAction, isMaintenanceRunning]);

  // جلب الإحصائيات
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['autocomplete-admin', 'stats'],
    queryFn: () => apiRequest('GET', '/api/autocomplete-admin/stats') as Promise<AutocompleteStats>,
  });

  // تنظيف البيانات القديمة
  const cleanupMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/autocomplete-admin/cleanup'),
    onSuccess: (result: any) => {
      toast({
        title: "تم التنظيف بنجاح",
        description: `تم حذف ${result.deletedCount} سجل قديم من ${result.categories.length} فئة`
      });
      refetchStats();
    },
    onError: () => {
      toast({
        title: "خطأ في التنظيف",
        description: "فشل في تنظيف البيانات القديمة",
        variant: "destructive"
      });
    }
  });

  // تطبيق حدود الفئات
  const enforceLimitsMutation = useMutation({
    mutationFn: (category?: string) => 
      apiRequest('POST', '/api/autocomplete-admin/enforce-limits', { category }),
    onSuccess: (result: any) => {
      toast({
        title: "تم تطبيق الحدود بنجاح",
        description: `تم تقليم ${result.trimmedCategories.length} فئة وحذف ${result.deletedCount} سجل`
      });
      refetchStats();
    },
    onError: () => {
      toast({
        title: "خطأ في تطبيق الحدود",
        description: "فشل في تطبيق حدود الفئات",
        variant: "destructive"
      });
    }
  });

  // صيانة شاملة
  const maintenanceMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/autocomplete-admin/maintenance'),
    onSuccess: (result: MaintenanceResult) => {
      toast({
        title: "اكتملت الصيانة الشاملة",
        description: `معالجة ${result.totalProcessed} سجل بنجاح`
      });
      refetchStats();
      setIsMaintenanceRunning(false);
    },
    onError: () => {
      toast({
        title: "خطأ في الصيانة",
        description: "فشل في تشغيل الصيانة الشاملة",
        variant: "destructive"
      });
      setIsMaintenanceRunning(false);
    }
  });

  const handleRunMaintenance = () => {
    setIsMaintenanceRunning(true);
    maintenanceMutation.mutate();
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (statsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">

      {/* بطاقات الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي السجلات</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.totalRecords || 0)}</div>
            <p className="text-xs text-muted-foreground">سجل في النظام</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد الفئات</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.categoriesCount || 0)}</div>
            <p className="text-xs text-muted-foreground">فئة مختلفة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">السجلات القديمة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatNumber(stats?.oldRecordsCount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">تحتاج تنظيف</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حالة النظام</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.oldRecordsCount === 0 ? 'ممتاز' : 'يحتاج صيانة'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.oldRecordsCount === 0 ? 'لا يوجد سجلات قديمة' : 'يوجد سجلات تحتاج تنظيف'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="categories">تفصيل الفئات</TabsTrigger>
          <TabsTrigger value="maintenance">أدوات الصيانة</TabsTrigger>
        </TabsList>

        {/* نظرة عامة */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>صحة النظام</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>كفاءة البيانات</span>
                    <span>{stats ? Math.round(((stats.totalRecords - stats.oldRecordsCount) / stats.totalRecords) * 100) : 0}%</span>
                  </div>
                  <Progress 
                    value={stats ? ((stats.totalRecords - stats.oldRecordsCount) / stats.totalRecords) * 100 : 0} 
                  />
                </div>
                
                {stats && stats.oldRecordsCount > 0 && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      <span className="font-medium text-orange-800 dark:text-orange-200">
                        تحذير: يوجد {formatNumber(stats.oldRecordsCount)} سجل قديم يحتاج تنظيف
                      </span>
                    </div>
                    <p className="text-sm text-orange-600 dark:text-orange-300 mt-2">
                      هذه السجلات لم تُستخدم لأكثر من 6 أشهر وتم استخدامها أقل من 3 مرات
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تفصيل الفئات */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تفصيل الفئات حسب الاستخدام</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.categoryBreakdown.map((category) => (
                  <div key={category.category} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{category.category}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatNumber(category.count)} سجل - متوسط الاستخدام: {category.avgUsage.toFixed(1)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={category.count > 100 ? "destructive" : "secondary"}>
                        {formatNumber(category.count)}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => enforceLimitsMutation.mutate(category.category)}
                        disabled={enforceLimitsMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 ml-1" />
                        تقليم
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* أدوات الصيانة */}
        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>تنظيف البيانات القديمة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  حذف السجلات التي لم تُستخدم لأكثر من 6 أشهر والمستخدمة أقل من 3 مرات
                </p>
                <Button
                  onClick={() => cleanupMutation.mutate()}
                  disabled={cleanupMutation.isPending}
                  className="w-full"
                  variant={stats?.oldRecordsCount === 0 ? "secondary" : "default"}
                >
                  {cleanupMutation.isPending ? (
                    <>جاري التنظيف...</>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 ml-2" />
                      تنظيف البيانات القديمة ({formatNumber(stats?.oldRecordsCount || 0)})
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تطبيق حدود الفئات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  فرض حد أقصى 100 اقتراح لكل فئة وحذف الأقل استخداماً
                </p>
                <Button
                  onClick={() => enforceLimitsMutation.mutate(undefined)}
                  disabled={enforceLimitsMutation.isPending}
                  className="w-full"
                  variant="outline"
                >
                  {enforceLimitsMutation.isPending ? (
                    <>جاري التطبيق...</>
                  ) : (
                    <>
                      <Settings className="w-4 h-4 ml-2" />
                      تطبيق الحدود على جميع الفئات
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>صيانة شاملة للنظام</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                تشغيل صيانة شاملة تتضمن تنظيف البيانات القديمة وتطبيق حدود الفئات في عملية واحدة
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  ما تتضمنه الصيانة الشاملة:
                </h4>
                <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
                  <li>• حذف السجلات القديمة وغير المستخدمة</li>
                  <li>• تطبيق حدود على جميع الفئات</li>
                  <li>• تحسين فهارس قاعدة البيانات</li>
                  <li>• إعادة تنظيم ترتيب الاقتراحات</li>
                </ul>
              </div>
              <Button
                onClick={handleRunMaintenance}
                disabled={isMaintenanceRunning || maintenanceMutation.isPending}
                className="w-full"
                size="lg"
              >
                {isMaintenanceRunning || maintenanceMutation.isPending ? (
                  <>جاري تشغيل الصيانة الشاملة...</>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 ml-2" />
                    تشغيل الصيانة الشاملة
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}