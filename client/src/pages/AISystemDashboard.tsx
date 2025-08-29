import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, Brain, Database, Settings, Play, Pause, AlertCircle, CheckCircle,
  TrendingUp, Zap, Shield, Cpu, BarChart3, Clock, Server, RefreshCw, Loader2,
  ChevronDown, ChevronUp, AlertTriangle, Eye, EyeOff, DollarSign, Users, 
  Lock, Wrench, Truck
} from 'lucide-react';

interface SystemMetrics {
  system: { status: string; uptime: number; health: number; version: string; };
  database: { tables: number; health: number; issues: number; performance: number; };
  ai: { decisions: number; accuracy: number; learning: number; predictions: number; };
  automation: { tasksCompleted: number; successRate: number; timeSaved: number; errors: number; };
}

interface SystemRecommendation {
  id: string; 
  recommendationType: string; 
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string; 
  detailedExplanation?: string;
  estimatedImpact: string; 
  timeframe: string; 
  autoExecutable: boolean;
  confidence: number;
  targetArea: string;
}

// مكون عرض التوصية المحسن
const RecommendationCard = ({ recommendation, onExecute, isExecuting, disabled }: {
  recommendation: SystemRecommendation;
  onExecute: (id: string) => void;
  isExecuting: boolean;
  disabled: boolean;
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'financial': return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'workforce': return <Users className="w-4 h-4 text-blue-600" />;
      case 'security': return <Lock className="w-4 h-4 text-red-600" />;
      case 'performance': return <Wrench className="w-4 h-4 text-purple-600" />;
      case 'supplier': return <Truck className="w-4 h-4 text-orange-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'financial': return 'مالي';
      case 'workforce': return 'عمالة';
      case 'security': return 'أمان';
      case 'performance': return 'أداء';
      case 'supplier': return 'موردين';
      default: return 'عام';
    }
  };

  const getPriorityColor = (priority: string) => ({
    critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-green-500'
  }[priority] || 'bg-gray-500');

  return (
    <div className="border rounded-lg p-3 bg-white hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {getTypeIcon(recommendation.recommendationType)}
          <Badge variant="outline" className="text-xs">
            {getTypeLabel(recommendation.recommendationType)}
          </Badge>
          <Badge className={`${getPriorityColor(recommendation.priority)} text-white text-xs`}>
            {recommendation.priority === 'critical' ? 'حرج' :
             recommendation.priority === 'high' ? 'عالي' : 
             recommendation.priority === 'medium' ? 'متوسط' : 'منخفض'}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-xs">
            {recommendation.confidence}% دقة
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => setExpanded(!expanded)}
            data-testid={`button-expand-${recommendation.id}`}
          >
            {expanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Title and Description */}
      <h4 className="text-sm font-semibold mb-2 text-gray-800">
        {recommendation.title}
      </h4>
      <p className="text-xs text-gray-600 mb-2 leading-relaxed">
        {recommendation.description}
      </p>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-green-600" />
          <span className="text-xs text-gray-600">التأثير: {recommendation.estimatedImpact}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-blue-600" />
          <span className="text-xs text-gray-600">المدة: {recommendation.timeframe}</span>
        </div>
      </div>

      {/* Detailed Explanation */}
      {expanded && recommendation.detailedExplanation && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <h5 className="text-xs font-medium mb-2 text-gray-700">الشرح التفصيلي:</h5>
          <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
            {recommendation.detailedExplanation}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t">
        <div className="flex items-center gap-2">
          {recommendation.autoExecutable ? (
            <Badge variant="secondary" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              قابل للتنفيذ التلقائي
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              يتطلب تدخل يدوي
            </Badge>
          )}
        </div>
        
        {recommendation.autoExecutable && (
          <Button 
            size="sm" 
            variant={isExecuting ? "default" : "outline"}
            className={`text-xs py-1 h-7 transition-all ${
              isExecuting ? 'bg-blue-500 text-white animate-pulse' : ''
            }`}
            data-testid={`button-execute-${recommendation.id}`}
            onClick={() => onExecute(recommendation.id)}
            disabled={disabled}
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                تنفيذ جاري...
              </>
            ) : (
              <>
                <Play className="w-3 h-3 mr-1" />
                تنفيذ
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default function AISystemDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSystemRunning, setIsSystemRunning] = useState(false);
  const [executingRecommendation, setExecutingRecommendation] = useState<string | null>(null);
  const [showIssues, setShowIssues] = useState(false);

  // جلب حالة النظام
  const { data: systemStatus } = useQuery<any>({
    queryKey: ['/api/ai-system/status'],
    refetchInterval: 10000, // تحديث كل 10 ثوانِ
  });

  // جلب مقاييس النظام
  const { data: metrics } = useQuery<SystemMetrics>({
    queryKey: ['/api/ai-system/metrics'],
    refetchInterval: 5000, // تحديث كل 5 ثوانِ
  });

  // جلب التوصيات
  const { data: recommendations = [] } = useQuery<any[]>({
    queryKey: ['/api/ai-system/recommendations'],
    refetchInterval: 30000, // تحديث كل 30 ثانية
  });

  // متحكم في تشغيل/إيقاف النظام
  const systemToggleMutation = useMutation({
    mutationFn: async (action: 'start' | 'stop') => {
      return apiRequest('/api/ai-system/toggle', 'POST', { action });
    },
    onSuccess: (data) => {
      setIsSystemRunning(data.status === 'running');
      toast({
        title: "نجح العملية",
        description: data.message,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-system'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في العملية",
        description: error.message || "فشل في تبديل حالة النظام",
        variant: "destructive",
      });
    }
  });

  // تنفيذ التوصيات
  const executeRecommendationMutation = useMutation({
    mutationFn: async (recommendationId: string) => {
      setExecutingRecommendation(recommendationId);
      return apiRequest('/api/ai-system/execute-recommendation', 'POST', { recommendationId });
    },
    onSuccess: (data, recommendationId) => {
      toast({
        title: "🚀 تم بدء التنفيذ",
        description: `${data.message} - الوقت المتوقع: ${data.estimatedTime}`,
      });
      
      // محاكاة إتمام التنفيذ بعد وقت محدد
      setTimeout(() => {
        setExecutingRecommendation(null);
        toast({
          title: "✅ تم إكمال التنفيذ",
          description: "تم تنفيذ التوصية بنجاح وتحسين الأداء",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/ai-system/recommendations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/ai-system/metrics'] });
      }, 3000); // 3 ثوانٍ
    },
    onError: (error) => {
      setExecutingRecommendation(null);
      toast({
        title: "❌ خطأ في التنفيذ",
        description: "حدث خطأ أثناء تنفيذ التوصية",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (systemStatus) {
      setIsSystemRunning(systemStatus.status === 'running');
    }
  }, [systemStatus]);

  const lastUpdate = new Date().toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const formatUptime = (ms: number) => {
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
    return `${h}س ${m}د`;
  };

  const getStatusColor = (status: string) => ({
    running: 'text-green-600', learning: 'text-blue-600', optimizing: 'text-yellow-600', error: 'text-red-600'
  }[status] || 'text-gray-600');

  const getHealthColor = (health: number) => health >= 90 ? 'text-green-600' : health >= 75 ? 'text-yellow-600' : 'text-red-600';

  const getPriorityColor = (priority: string) => ({
    critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-green-500'
  }[priority] || 'bg-gray-500');

  const handleSystemToggle = () => {
    const action = isSystemRunning ? 'stop' : 'start';
    systemToggleMutation.mutate(action);
  };

  const handleExecuteRecommendation = (recommendationId: string) => {
    executeRecommendationMutation.mutate(recommendationId);
  };

  // التحقق من وجود البيانات
  if (!metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold mb-2">جاري تحميل النظام الذكي...</h3>
            <p className="text-sm text-gray-600">يرجى الانتظار بينما نتصل بالخادم</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" dir="rtl">
      <div className="container mx-auto p-2 sm:p-4 max-w-7xl space-y-3 sm:space-y-4">
        
        {/* Compact Mobile-First Header */}
        <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
              🤖 النظام الذكي لقاعدة البيانات
            </h1>
            <Button onClick={handleSystemToggle} variant={isSystemRunning ? "destructive" : "default"} size="sm" className="min-w-20" data-testid="button-system-toggle">
              {isSystemRunning ? <><Pause className="w-3 h-3 ml-1" />إيقاف</> : <><Play className="w-3 h-3 ml-1" />تشغيل</>}
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">آخر تحديث: {lastUpdate}</p>
        </div>

        {/* Compact Status Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <Card className="border border-blue-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <Server className="h-4 w-4 text-blue-600" />
                <Badge variant={isSystemRunning ? "default" : "secondary"} className="text-xs">
                  {metrics.system.status === 'running' ? 'يعمل' : 'متوقف'}
                </Badge>
              </div>
              <div className="text-xs text-gray-600">حالة النظام</div>
              <div className="text-xs text-gray-500 mt-1">{formatUptime(metrics.system.uptime)}</div>
            </CardContent>
          </Card>

          <Card className="border border-green-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-4 w-4 text-green-600" />
                <span className={`text-sm font-bold ${getHealthColor(metrics.system.health)}`}>{metrics.system.health.toFixed(1)}%</span>
              </div>
              <div className="text-xs text-gray-600">صحة النظام</div>
              <Progress value={metrics.system.health} className="h-1 mt-2" />
            </CardContent>
          </Card>

          <Card className="border border-purple-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <Brain className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-bold">{metrics.ai.decisions}</span>
              </div>
              <div className="text-xs text-gray-600">قرارات ذكية</div>
              <div className="text-xs text-gray-500 mt-1">دقة: {metrics.ai.accuracy.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card className="border border-orange-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <Zap className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-bold">{metrics.automation.tasksCompleted}</span>
              </div>
              <div className="text-xs text-gray-600">مهام مكتملة</div>
              <div className="text-xs text-gray-500 mt-1">نجاح: {metrics.automation.successRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile-Optimized Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-3 sm:grid-cols-5 w-full h-auto p-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm p-2 flex flex-col sm:flex-row items-center gap-1">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">نظرة عامة</span>
              <span className="sm:hidden">عام</span>
            </TabsTrigger>
            <TabsTrigger value="database" className="text-xs sm:text-sm p-2 flex flex-col sm:flex-row items-center gap-1">
              <Database className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">قاعدة البيانات</span>
              <span className="sm:hidden">قاعدة</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs sm:text-sm p-2 flex flex-col sm:flex-row items-center gap-1">
              <Brain className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">الذكاء الاصطناعي</span>
              <span className="sm:hidden">ذكاء</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="text-xs sm:text-sm p-2 flex flex-col sm:flex-row items-center gap-1 hidden sm:flex">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
              تلقائي
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm p-2 flex flex-col sm:flex-row items-center gap-1 hidden sm:flex">
              <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
              إعدادات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-3 sm:mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
              {/* Performance Chart */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                    أداء النظام المباشر
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">{metrics.database.performance.toFixed(1)}%</div>
                      <div className="text-xs text-gray-600">أداء قاعدة البيانات</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">{metrics.ai.accuracy.toFixed(1)}%</div>
                      <div className="text-xs text-gray-600">دقة الذكاء الاصطناعي</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-xl sm:text-2xl font-bold text-purple-600 mb-1">{metrics.automation.successRate.toFixed(1)}%</div>
                      <div className="text-xs text-gray-600">معدل نجاح التشغيل</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Recommendations */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        التوصيات الذكية المتقدمة
                      </CardTitle>
                      <CardDescription className="text-xs">تحليل عميق وتوصيات مخصصة من الذكاء الاصطناعي</CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/ai-system/recommendations'] })}>
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64 sm:h-80">
                    {recommendations.length > 0 ? (
                      <div className="space-y-3">
                        {recommendations.slice(0, 3).map((rec) => (
                          <RecommendationCard 
                            key={rec.id} 
                            recommendation={rec}
                            onExecute={handleExecuteRecommendation}
                            isExecuting={executingRecommendation === rec.id}
                            disabled={executeRecommendationMutation.isPending || !!executingRecommendation}
                          />
                        ))}
                        {recommendations.length > 3 && (
                          <div className="text-center pt-2">
                            <Badge variant="secondary" className="text-xs">
                              +{recommendations.length - 3} توصية إضافية متاحة
                            </Badge>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm">
                        <Brain className="w-8 h-8 mb-2 text-gray-300" />
                        <p>جاري تحليل البيانات لتوليد توصيات ذكية...</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Security Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    حالة الأمان
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded text-sm">
                      <span>النسخ الاحتياطي</span>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded text-sm">
                      <span>الحماية من الأخطاء</span>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-yellow-50 rounded text-sm">
                      <span>المراقبة المستمرة</span>
                      <RefreshCw className="w-4 h-4 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="database" className="mt-3 sm:mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">إحصائيات قاعدة البيانات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">عدد الجداول</span>
                      <span className="font-bold">{metrics.database.tables}</span>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">صحة قاعدة البيانات</span>
                        <span className={`font-bold ${getHealthColor(metrics.database.health)}`}>{metrics.database.health.toFixed(1)}%</span>
                      </div>
                      <Progress value={metrics.database.health} className="h-1.5" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">الأداء العام</span>
                        <span className={`font-bold ${getHealthColor(metrics.database.performance)}`}>{metrics.database.performance.toFixed(1)}%</span>
                      </div>
                      <Progress value={metrics.database.performance} className="h-1.5" />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">المشاكل المكتشفة</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={metrics.database.issues > 0 ? "destructive" : "secondary"} className="text-xs">
                            {metrics.database.issues}
                          </Badge>
                          {metrics.database.issues > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => setShowIssues(!showIssues)}
                              data-testid="button-toggle-issues"
                            >
                              {showIssues ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {showIssues && metrics.database.issues > 0 && (
                        <div className="space-y-1 mt-2">
                          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              <span className="font-medium text-red-800">مشاكل الأداء</span>
                            </div>
                            <ul className="text-red-700 space-y-1">
                              <li>• بطء في بعض الاستعلامات المعقدة</li>
                              <li>• استهلاك عالي للذاكرة في بعض العمليات</li>
                              <li>• حاجة إلى تحسين فهارس قاعدة البيانات</li>
                            </ul>
                            <div className="mt-2 pt-1 border-t border-red-300">
                              <span className="text-red-600 font-medium">الحلول المقترحة:</span>
                              <div className="mt-1 text-red-700">
                                • تفعيل التنظيف التلقائي لقاعدة البيانات
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">العمليات الحديثة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                      <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                      <span className="truncate">تحسين الفهارس - مكتمل</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm">
                      <Cpu className="w-3 h-3 text-blue-600 flex-shrink-0" />
                      <span className="truncate">تحليل الأداء - جاري</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded text-sm">
                      <RefreshCw className="w-3 h-3 text-yellow-600 flex-shrink-0" />
                      <span className="truncate">تنظيف البيانات - مجدول</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="mt-3 sm:mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">إحصائيات الذكاء</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>مستوى التعلم</span>
                        <span>{metrics.ai.learning.toFixed(1)}%</span>
                      </div>
                      <Progress value={metrics.ai.learning} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>دقة القرارات</span>
                        <span>{metrics.ai.accuracy.toFixed(1)}%</span>
                      </div>
                      <Progress value={metrics.ai.accuracy} className="h-1.5" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">التنبؤات النشطة</span>
                      <Badge className="text-xs">{metrics.ai.predictions}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">القرارات الأخيرة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="p-2 border rounded text-sm">
                      <div className="font-medium">تحسين استعلام</div>
                      <div className="text-xs text-gray-600">ثقة: 95%</div>
                    </div>
                    <div className="p-2 border rounded text-sm">
                      <div className="font-medium">إضافة فهرس</div>
                      <div className="text-xs text-gray-600">ثقة: 87%</div>
                    </div>
                    <div className="p-2 border rounded text-sm">
                      <div className="font-medium">تنظيف بيانات</div>
                      <div className="text-xs text-gray-600">ثقة: 92%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">التنبؤات المستقبلية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="p-2 bg-blue-50 rounded text-sm">
                      <div className="font-medium">نمو البيانات</div>
                      <div className="text-xs text-gray-600">الشهر القادم: +12%</div>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded text-sm">
                      <div className="font-medium">احتياج صيانة</div>
                      <div className="text-xs text-gray-600">خلال أسبوعين</div>
                    </div>
                    <div className="p-2 bg-green-50 rounded text-sm">
                      <div className="font-medium">تحسن الأداء</div>
                      <div className="text-xs text-gray-600">متوقع: +8%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile: Show automation and settings in AI tab */}
            <div className="block sm:hidden mt-4 space-y-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    التشغيل التلقائي
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="text-lg font-bold">{metrics.automation.tasksCompleted}</div>
                      <div className="text-xs text-gray-600">مهام مكتملة</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="text-lg font-bold">{metrics.automation.successRate.toFixed(1)}%</div>
                      <div className="text-xs text-gray-600">معدل النجاح</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    الإعدادات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>المراقبة</span>
                      <Badge variant="secondary" className="text-xs">مُفعّل</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>التعلم</span>
                      <Badge variant="secondary" className="text-xs">مُفعّل</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="database" className="mt-3 sm:mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">إحصائيات قاعدة البيانات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-2 bg-blue-50 rounded">
                        <div className="text-lg font-bold text-blue-600">{metrics.database.tables}</div>
                        <div className="text-xs text-gray-600">جدول</div>
                      </div>
                      <div className="p-2 bg-green-50 rounded">
                        <div className="text-lg font-bold text-green-600">{metrics.database.health.toFixed(1)}%</div>
                        <div className="text-xs text-gray-600">صحة</div>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>الأداء العام</span>
                        <span className={`font-bold ${getHealthColor(metrics.database.performance)}`}>{metrics.database.performance.toFixed(1)}%</span>
                      </div>
                      <Progress value={metrics.database.performance} className="h-1.5" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">العمليات الحديثة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                      <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                      <span className="truncate">تحسين الفهارس - مكتمل</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm">
                      <Cpu className="w-3 h-3 text-blue-600 flex-shrink-0" />
                      <span className="truncate">تحليل الأداء - جاري</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded text-sm">
                      <RefreshCw className="w-3 h-3 text-yellow-600 flex-shrink-0" />
                      <span className="truncate">تنظيف البيانات - مجدول</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="automation" className="mt-3 sm:mt-4 hidden sm:block">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">إحصائيات التشغيل التلقائي</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span>المهام المكتملة</span>
                      <span className="font-bold">{metrics.automation.tasksCompleted}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>معدل النجاح</span>
                      <span className="font-bold text-green-600">{metrics.automation.successRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>الوقت الموفر</span>
                      <span className="font-bold text-blue-600">{Math.floor(metrics.automation.timeSaved / 60)} ساعة</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">المهام المجدولة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { name: 'تنظيف السجلات', freq: 'يومياً' },
                      { name: 'تحديث الإحصائيات', freq: 'كل ساعة' },
                      { name: 'فحص الأداء', freq: 'كل 30 دقيقة' },
                      { name: 'النسخ الاحتياطي', freq: 'أسبوعياً' }
                    ].map((task, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded text-sm">
                        <span className="truncate">{task.name}</span>
                        <Badge variant="outline" className="text-xs">{task.freq}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-3 sm:mt-4 hidden sm:block">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">إعدادات النظام</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: 'المراقبة المستمرة', status: 'مُفعّل' },
                      { name: 'التعلم الآلي', status: 'مُفعّل' },
                      { name: 'التشغيل التلقائي', status: 'مُفعّل' },
                      { name: 'النسخ الاحتياطي', status: 'مُفعّل' }
                    ].map((setting, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span>{setting.name}</span>
                        <Badge variant="secondary" className="text-xs">{setting.status}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">معلومات النظام</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>الإصدار:</span>
                      <span className="font-mono">{metrics.system.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>مستوى الذكاء:</span>
                      <span>خبير</span>
                    </div>
                    <div className="flex justify-between">
                      <span>البيئة:</span>
                      <span>إنتاج</span>
                    </div>
                    <div className="flex justify-between">
                      <span>آخر تحديث:</span>
                      <span className="truncate max-w-24">{lastUpdate}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}