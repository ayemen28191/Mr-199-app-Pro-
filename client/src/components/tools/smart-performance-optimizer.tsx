/**
 * الوصف: محسن الأداء الذكي للأدوات والعمليات
 * المدخلات: بيانات الأداء الحالية وسجلات الاستخدام
 * المخرجات: تحسينات ذكية للأداء والكفاءة
 * المالك: عمار
 * آخر تعديل: 2025-08-20
 * الحالة: نشط - تحسين أداء ذكي
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { StatsCard } from '@/components/ui/stats-card';
import {
  Zap,
  TrendingUp,
  Target,
  Gauge,
  Settings,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  DollarSign
} from 'lucide-react';

interface PerformanceMetric {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  category: 'efficiency' | 'utilization' | 'cost' | 'quality';
  trend: 'up' | 'down' | 'stable';
  improvementPotential: number;
  optimizationActions: string[];
}

interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  category: string;
  expectedImprovement: number;
  steps: string[];
  affectedMetrics: string[];
}

interface SmartPerformanceOptimizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SmartPerformanceOptimizer: React.FC<SmartPerformanceOptimizerProps> = ({
  open,
  onOpenChange
}) => {
  const [activeOptimization, setActiveOptimization] = useState<string | null>(null);

  // Fetch performance data
  const { data: tools = [] } = useQuery<any[]>({
    queryKey: ['/api/tools'],
    enabled: open,
  });

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ['/api/projects'],
    enabled: open,
  });

  const { data: usageAnalytics = [] } = useQuery<any[]>({
    queryKey: ['/api/tool-usage-analytics'],
    enabled: open,
  });

  // Calculate performance metrics
  const performanceMetrics = useMemo((): PerformanceMetric[] => {
    if (!tools.length) return [];

    // Tool Utilization Rate
    const inUseTools = tools.filter(t => t.status === 'in_use').length;
    const utilizationRate = (inUseTools / tools.length) * 100;

    // Maintenance Efficiency
    const needsMaintenance = tools.filter(t => t.status === 'maintenance').length;
    const maintenanceEfficiency = ((tools.length - needsMaintenance) / tools.length) * 100;

    // Cost Efficiency
    const totalValue = tools.reduce((sum, tool) => sum + (tool.purchasePrice || 0), 0);
    const avgToolValue = totalValue / tools.length;
    const costEfficiency = Math.max(0, 100 - (avgToolValue / 10000) * 100);

    // Quality Score
    const excellentTools = tools.filter(t => t.condition === 'excellent').length;
    const goodTools = tools.filter(t => t.condition === 'good').length;
    const qualityScore = ((excellentTools * 2 + goodTools) / (tools.length * 2)) * 100;

    return [
      {
        id: 'utilization',
        name: 'معدل الاستخدام',
        currentValue: utilizationRate,
        targetValue: 85,
        unit: '%',
        category: 'utilization',
        trend: utilizationRate > 70 ? 'up' : utilizationRate > 50 ? 'stable' : 'down',
        improvementPotential: Math.max(0, 85 - utilizationRate),
        optimizationActions: [
          'إعادة توزيع الأدوات المتاحة',
          'تحسين جدولة المشاريع',
          'تدريب العمال على استخدام الأدوات'
        ]
      },
      {
        id: 'maintenance',
        name: 'كفاءة الصيانة',
        currentValue: maintenanceEfficiency,
        targetValue: 95,
        unit: '%',
        category: 'efficiency',
        trend: maintenanceEfficiency > 90 ? 'up' : maintenanceEfficiency > 80 ? 'stable' : 'down',
        improvementPotential: Math.max(0, 95 - maintenanceEfficiency),
        optimizationActions: [
          'تطبيق صيانة وقائية منتظمة',
          'تحسين جدولة الصيانة',
          'استخدام أدوات تشخيص متقدمة'
        ]
      },
      {
        id: 'cost',
        name: 'كفاءة التكلفة',
        currentValue: costEfficiency,
        targetValue: 80,
        unit: '%',
        category: 'cost',
        trend: costEfficiency > 70 ? 'up' : costEfficiency > 50 ? 'stable' : 'down',
        improvementPotential: Math.max(0, 80 - costEfficiency),
        optimizationActions: [
          'تحسين عمليات الشراء',
          'التفاوض مع الموردين',
          'استخدام تحليل القيمة مقابل السعر'
        ]
      },
      {
        id: 'quality',
        name: 'مؤشر الجودة',
        currentValue: qualityScore,
        targetValue: 90,
        unit: '%',
        category: 'quality',
        trend: qualityScore > 80 ? 'up' : qualityScore > 60 ? 'stable' : 'down',
        improvementPotential: Math.max(0, 90 - qualityScore),
        optimizationActions: [
          'تحسين برامج الصيانة الوقائية',
          'استبدال الأدوات القديمة',
          'تدريب العمال على الاستخدام الصحيح'
        ]
      }
    ];
  }, [tools]);

  // Generate optimization suggestions
  const optimizationSuggestions = useMemo((): OptimizationSuggestion[] => {
    const suggestions: OptimizationSuggestion[] = [];

    // Based on performance metrics
    performanceMetrics.forEach(metric => {
      if (metric.improvementPotential > 15) {
        suggestions.push({
          id: `opt_${metric.id}`,
          title: `تحسين ${metric.name}`,
          description: `يمكن تحسين ${metric.name} بنسبة ${Math.round(metric.improvementPotential)}% من خلال تطبيق استراتيجيات محددة.`,
          impact: metric.improvementPotential > 30 ? 'high' : metric.improvementPotential > 15 ? 'medium' : 'low',
          effort: metric.category === 'cost' ? 'high' : 'medium',
          category: metric.category,
          expectedImprovement: metric.improvementPotential,
          steps: metric.optimizationActions,
          affectedMetrics: [metric.id]
        });
      }
    });

    // AI-driven suggestions
    if (tools.length > 0) {
      const availableTools = tools.filter(t => t.status === 'available').length;
      const activeProjects = projects.filter(p => p.status === 'active').length;

      if (availableTools > activeProjects * 3) {
        suggestions.push({
          id: 'excess_tools',
          title: 'تحسين إدارة المخزون',
          description: 'يوجد فائض في الأدوات المتاحة. يمكن تحسين الكفاءة من خلال إعادة التوزيع.',
          impact: 'medium',
          effort: 'low',
          category: 'utilization',
          expectedImprovement: 20,
          steps: [
            'تحليل احتياجات المشاريع الفعلية',
            'إعادة توزيع الأدوات الفائضة',
            'وضع معايير للمخزون المطلوب',
            'تحسين عمليات التخطيط'
          ],
          affectedMetrics: ['utilization', 'cost']
        });
      }
    }

    return suggestions.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      const effortOrder = { low: 3, medium: 2, high: 1 };
      
      const aScore = impactOrder[a.impact] + effortOrder[a.effort];
      const bScore = impactOrder[b.impact] + effortOrder[b.effort];
      
      return bScore - aScore;
    });
  }, [performanceMetrics, tools, projects]);

  const getMetricColor = (value: number, target: number) => {
    const percentage = (value / target) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-4 z-50 overflow-auto bg-background border rounded-lg shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Zap className="h-7 w-7 text-orange-600" />
                محسن الأداء الذكي
              </h2>
              <p className="text-muted-foreground">
                تحليل شامل وتحسينات ذكية لأداء النظام
              </p>
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إغلاق
            </Button>
          </div>

          <Tabs defaultValue="metrics" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="metrics">مقاييس الأداء</TabsTrigger>
              <TabsTrigger value="optimization">تحسينات مقترحة</TabsTrigger>
              <TabsTrigger value="monitoring">مراقبة مستمرة</TabsTrigger>
            </TabsList>

            <TabsContent value="metrics" className="space-y-6">
              {/* Performance Overview - صف أول */}
              <div className="grid grid-cols-2 gap-4">
                {performanceMetrics.slice(0, 2).map((metric) => (
                  <StatsCard
                    key={metric.id}
                    title={metric.name}
                    value={`${Math.round(metric.currentValue)}${metric.unit}`}
                    icon={metric.category === 'efficiency' ? Zap :
                          metric.category === 'utilization' ? Activity :
                          metric.category === 'cost' ? DollarSign : Target}
                    color={metric.currentValue >= metric.targetValue ? "green" :
                           metric.currentValue >= metric.targetValue * 0.7 ? "orange" : "red"}
                  />
                ))}
              </div>
              
              {/* Performance Overview - صف ثاني */}
              <div className="grid grid-cols-2 gap-4">
                {performanceMetrics.slice(2, 4).map((metric) => (
                  <StatsCard
                    key={metric.id}
                    title={metric.name}
                    value={`${Math.round(metric.currentValue)}${metric.unit}`}
                    icon={metric.category === 'efficiency' ? Zap :
                          metric.category === 'utilization' ? Activity :
                          metric.category === 'cost' ? DollarSign : Target}
                    color={metric.currentValue >= metric.targetValue ? "green" :
                           metric.currentValue >= metric.targetValue * 0.7 ? "orange" : "red"}
                  />
                ))}
              </div>

              {/* Target vs Current Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    مقارنة الأداء الحالي بالأهداف
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {performanceMetrics.map((metric) => (
                      <StatsCard
                        key={metric.id}
                        title={`هدف ${metric.name}`}
                        value={`${metric.targetValue}${metric.unit}`}
                        icon={Target}
                        color="blue"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Improvement Potential */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    إمكانيات التحسين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {performanceMetrics.map((metric) => (
                      <StatsCard
                        key={metric.id}
                        title={`تحسين ${metric.name}`}
                        value={`${Math.round(metric.improvementPotential)}%`}
                        icon={TrendingUp}
                        color={metric.improvementPotential > 30 ? "red" : 
                               metric.improvementPotential > 15 ? "orange" : "green"}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Action Items Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    خطط العمل المقترحة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {performanceMetrics.map((metric) => (
                      <div key={metric.id} className="p-4 border border-l-4 rounded-lg bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
                           style={{ borderLeftColor: metric.category === 'efficiency' ? '#16a34a' :
                                                      metric.category === 'utilization' ? '#2563eb' :
                                                      metric.category === 'cost' ? '#dc2626' : '#7c3aed' }}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-lg">{metric.name}</h4>
                          <Badge variant="outline" className="capitalize">
                            {metric.category === 'efficiency' ? 'كفاءة' :
                             metric.category === 'utilization' ? 'استخدام' :
                             metric.category === 'cost' ? 'تكلفة' : 'جودة'}
                          </Badge>
                        </div>
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                            <span>التقدم نحو الهدف</span>
                            <span>{Math.round((metric.currentValue / metric.targetValue) * 100)}%</span>
                          </div>
                          <Progress value={(metric.currentValue / metric.targetValue) * 100} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            إجراءات التحسين:
                          </h5>
                          <ul className="text-sm space-y-1">
                            {metric.optimizationActions.slice(0, 2).map((action, index) => (
                              <li key={index} className="flex items-center gap-2 text-muted-foreground">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                {action}
                              </li>
                            ))}
                            {metric.optimizationActions.length > 2 && (
                              <li className="text-xs text-blue-600">
                                +{metric.optimizationActions.length - 2} إجراء إضافي
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="optimization" className="space-y-6">
              {/* Optimization Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="التحسينات المتاحة"
                  value={optimizationSuggestions.length}
                  icon={Zap}
                  color="blue"
                />
                <StatsCard
                  title="أولوية عالية"
                  value={optimizationSuggestions.filter(s => s.impact === 'high').length}
                  icon={AlertTriangle}
                  color="red"
                />
                <StatsCard
                  title="جهد منخفض"
                  value={optimizationSuggestions.filter(s => s.effort === 'low').length}
                  icon={CheckCircle}
                  color="green"
                />
                <StatsCard
                  title="متوسط التحسن"
                  value={`${Math.round(optimizationSuggestions.reduce((sum, s) => sum + s.expectedImprovement, 0) / optimizationSuggestions.length) || 0}%`}
                  icon={TrendingUp}
                  color="purple"
                />
              </div>

              {/* Optimization Suggestions */}
              <div className="space-y-4">
                {optimizationSuggestions.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">أداء ممتاز!</h3>
                      <p className="text-muted-foreground">
                        جميع المقاييس ضمن النطاق المثالي. لا توجد تحسينات مطلوبة حالياً.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  optimizationSuggestions.map((suggestion) => (
                    <Card key={suggestion.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Zap className="h-5 w-5 text-orange-500" />
                            {suggestion.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getImpactColor(suggestion.impact)}>
                              أثر {suggestion.impact === 'high' ? 'عالي' : suggestion.impact === 'medium' ? 'متوسط' : 'منخفض'}
                            </Badge>
                            <Badge variant="outline">
                              جهد {suggestion.effort === 'high' ? 'عالي' : suggestion.effort === 'medium' ? 'متوسط' : 'منخفض'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">{suggestion.description}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm">التحسن المتوقع:</h4>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              <span className="text-lg font-bold text-green-600">
                                +{Math.round(suggestion.expectedImprovement)}%
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm">المقاييس المتأثرة:</h4>
                            <div className="flex flex-wrap gap-1">
                              {suggestion.affectedMetrics.map((metricId) => {
                                const metric = performanceMetrics.find(m => m.id === metricId);
                                return metric ? (
                                  <Badge key={metricId} variant="outline" className="text-xs">
                                    {metric.name}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm">الفئة:</h4>
                            <Badge variant="secondary" className="text-xs">
                              {suggestion.category === 'efficiency' ? 'كفاءة' :
                               suggestion.category === 'utilization' ? 'استخدام' :
                               suggestion.category === 'cost' ? 'تكلفة' : suggestion.category}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            خطوات التنفيذ:
                          </h4>
                          <div className="grid gap-2">
                            {suggestion.steps.map((step, index) => (
                              <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                                  {index + 1}
                                </div>
                                <span className="text-sm">{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 mt-6">
                          <Button 
                            size="sm" 
                            className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
                            onClick={() => setActiveOptimization(suggestion.id)}
                          >
                            <Zap className="h-4 w-4 ml-2" />
                            بدء التحسين
                          </Button>
                          <Button size="sm" variant="outline" className="w-full sm:w-auto">
                            <BarChart3 className="h-4 w-4 ml-2" />
                            تفاصيل أكثر
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    مراقبة الأداء المستمرة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <Gauge className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">نظام المراقبة النشط</h3>
                      <p className="text-muted-foreground mb-4">
                        يتم مراقبة مقاييس الأداء تلقائياً وإرسال تنبيهات عند الحاجة للتدخل.
                      </p>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <RefreshCw className="h-4 w-4 ml-2" />
                        تحديث البيانات
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SmartPerformanceOptimizer;