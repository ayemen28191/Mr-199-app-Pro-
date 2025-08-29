/**
 * صفحة إدارة الأخطاء الذكية
 * تعرض إحصائيات شاملة عن أخطاء النظام ومعالجتها بذكاء
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Database, 
  Clock, 
  Target,
  RefreshCw,
  TestTube,
  BarChart3,
  AlertCircle,
  Info
} from 'lucide-react';

interface ErrorStatistics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errorsByTable: Record<string, number>;
  recentErrors: number;
  resolvedErrors: number;
}

interface TestResult {
  type: string;
  severity: string;
  friendlyMessage: string;
  fingerprint: string;
}

const SmartErrorsPage: React.FC = () => {
  const [statistics, setStatistics] = useState<ErrorStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTestingSystem, setIsTestingSystem] = useState(false);
  const { toast } = useToast();

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/smart-errors/statistics');
      const data = await response.json();
      
      if (data.success) {
        setStatistics(data.statistics);
      } else {
        toast({
          title: "خطأ في جلب البيانات",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('خطأ في جلب الإحصائيات:', error);
      toast({
        title: "خطأ في الشبكة",
        description: "لا يمكن جلب إحصائيات الأخطاء حالياً",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testSmartErrorSystem = async () => {
    setIsTestingSystem(true);
    try {
      const response = await fetch('/api/smart-errors/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTestResult(data.testError);
        toast({
          title: "نجح الاختبار! 🎯",
          description: data.message,
          variant: "default",
        });
        
        // تحديث الإحصائيات بعد الاختبار
        setTimeout(fetchStatistics, 1000);
      } else {
        toast({
          title: "خطأ في الاختبار",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('خطأ في اختبار النظام:', error);
      toast({
        title: "خطأ في الاختبار",
        description: "حدث خطأ أثناء اختبار النظام الذكي",
        variant: "destructive",
      });
    } finally {
      setIsTestingSystem(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertCircle className="h-4 w-4" />;
      case 'medium': return <Info className="h-4 w-4" />;
      case 'low': return <CheckCircle2 className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6" dir="rtl">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="mr-3 text-lg">جاري تحميل إحصائيات الأخطاء...</span>
        </div>
      </div>
    );
  }

  const healthScore = statistics ? 
    Math.max(0, 100 - (statistics.totalErrors * 2) - (statistics.recentErrors * 5)) : 0;

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Database className="h-8 w-8 text-blue-600" />
            نظام كشف الأخطاء الذكي
          </h1>
          <p className="text-gray-600 mt-2">
            مراقبة وتحليل أخطاء قاعدة البيانات بذكاء اصطناعي متقدم
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={fetchStatistics}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          
          <Button 
            onClick={testSmartErrorSystem}
            variant="outline"
            size="sm"
            disabled={isTestingSystem}
          >
            <TestTube className={`h-4 w-4 ml-2 ${isTestingSystem ? 'animate-pulse' : ''}`} />
            اختبار النظام
          </Button>
        </div>
      </div>

      {/* نتيجة الاختبار */}
      {testResult && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>تم اختبار النظام بنجاح!</strong>
            <br />
            نوع الخطأ: {testResult.type} | الشدة: {testResult.severity}
            <br />
            الرسالة: {testResult.friendlyMessage}
            <br />
            البصمة: {testResult.fingerprint}...
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="analysis">التحليل المتقدم</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* إحصائيات عامة */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الأخطاء</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics?.totalErrors || 0}</div>
                <p className="text-xs text-muted-foreground">
                  منذ بداية التسجيل
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">أخطاء حديثة</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {statistics?.recentErrors || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  خلال آخر 24 ساعة
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">أخطاء محلولة</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {statistics?.resolvedErrors || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  تم حل المشاكل
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">صحة النظام</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  healthScore >= 90 ? 'text-green-600' :
                  healthScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {healthScore.toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  درجة الصحة العامة
                </p>
              </CardContent>
            </Card>
          </div>

          {/* توزيع الأخطاء حسب الشدة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                توزيع الأخطاء حسب الشدة
              </CardTitle>
              <CardDescription>
                تصنيف الأخطاء حسب مستوى الخطورة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(statistics?.errorsBySeverity || {}).map(([severity, count]) => (
                  <div key={severity} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="secondary" 
                        className={`${getSeverityColor(severity)} px-3 py-1`}
                      >
                        {getSeverityIcon(severity)}
                        <span className="mr-2">
                          {severity === 'critical' ? 'حرج' :
                           severity === 'high' ? 'عالي' :
                           severity === 'medium' ? 'متوسط' : 'منخفض'}
                        </span>
                      </Badge>
                    </div>
                    <span className="font-semibold text-lg">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* أكثر الجداول تأثراً */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                أكثر الجداول تأثراً بالأخطاء
              </CardTitle>
              <CardDescription>
                الجداول التي تسجل أعلى نسبة أخطاء
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(statistics?.errorsByTable || {})
                  .slice(0, 10)
                  .map(([tableName, count]) => (
                    <div key={tableName} className="flex items-center justify-between">
                      <span className="font-medium">{tableName}</span>
                      <Badge variant="outline">{count} خطأ</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>التحليل المتقدم للأخطاء</CardTitle>
              <CardDescription>
                تحليل تفصيلي لأنماط الأخطاء والتوجهات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  هذا القسم قيد التطوير وسيتم إضافة المزيد من التحليلات المتقدمة قريباً.
                  ستشمل الرسوم البيانية التفاعلية وتحليل الاتجاهات الزمنية.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات النظام الذكي</CardTitle>
              <CardDescription>
                تخصيص سلوك نظام كشف الأخطاء والإشعارات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  إعدادات النظام متاحة حالياً من خلال ملف الإعدادات. 
                  واجهة الإعدادات المرئية قيد التطوير.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartErrorsPage;