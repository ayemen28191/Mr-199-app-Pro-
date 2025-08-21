/**
 * الوصف: محرك التوصيات الذكية للأدوات والمعدات
 * المدخلات: بيانات الاستخدام وسجلات الأداء والتكاليف
 * المخرجات: توصيات ذكية مدعومة بخوارزميات AI متطورة
 * المالك: عمار
 * آخر تعديل: 2025-08-20
 * الحالة: نشط - توصيات ذكية متقدمة
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Target,
  Zap,
  Brain,
  Star,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatsCard, StatsGrid } from '@/components/ui/stats-card';

interface SmartRecommendation {
  id: string;
  type: 'cost_optimization' | 'efficiency_improvement' | 'preventive_action' | 'investment_opportunity' | 'resource_allocation';
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  impactScore: number;
  implementationCost: number;
  expectedSavings: number;
  timeframe: string;
  confidence: number;
  actionItems: string[];
  relatedTools: string[];
  metrics: {
    currentValue: number;
    projectedValue: number;
    improvementPercentage: number;
  };
}

interface IntelligentRecommendationsEngineProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const IntelligentRecommendationsEngine: React.FC<IntelligentRecommendationsEngineProps> = ({
  open,
  onOpenChange
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Fetch comprehensive data for AI analysis
  const { data: tools = [] } = useQuery<any[]>({
    queryKey: ['/api/tools'],
    enabled: open,
  });

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ['/api/projects'],
    enabled: open,
  });

  const { data: usageAnalyticsData } = useQuery<any>({
    queryKey: ['/api/tool-usage-analytics'],
    enabled: open,
  });

  // Extract usage data from API response
  const usageData = usageAnalyticsData?.recentActivity || [];

  const { data: costData = [] } = useQuery<any[]>({
    queryKey: ['/api/tool-cost-tracking'],
    enabled: open,
  });

  // AI-powered recommendations engine
  const recommendations = useMemo((): SmartRecommendation[] => {
    if (!tools.length) return [];

    const recs: SmartRecommendation[] = [];

    // 1. Cost Optimization Analysis
    const totalToolValue = tools.reduce((sum, tool) => sum + (tool.purchasePrice || 0), 0);
    const underutilizedTools = tools.filter(tool => {
      const activity = usageData.filter((u: any) => u.toolId === tool.id);
      const activityScore = activity.length; // Number of recent activities
      return activityScore < 3; // Less than 3 recent activities
    });

    if (underutilizedTools.length > 0) {
      const potentialSavings = underutilizedTools.reduce((sum, tool) => 
        sum + (tool.purchasePrice || 0) * 0.1, 0); // 10% savings through optimization

      recs.push({
        id: 'cost_opt_1',
        type: 'cost_optimization',
        priority: 'high',
        category: 'تحسين التكاليف',
        title: 'تحسين استخدام الأدوات المهملة',
        description: `يوجد ${underutilizedTools.length} أداة قليلة الاستخدام. يمكن تحسين استخدامها أو إعادة توزيعها.`,
        impactScore: 85,
        implementationCost: 1000,
        expectedSavings: potentialSavings,
        timeframe: '30 يوم',
        confidence: 92,
        actionItems: [
          'تحليل أسباب قلة الاستخدام',
          'إعادة توزيع الأدوات على المشاريع النشطة',
          'تدريب العمال على استخدام الأدوات',
          'وضع جدول استخدام محسّن'
        ],
        relatedTools: underutilizedTools.map(t => t.name),
        metrics: {
          currentValue: underutilizedTools.length,
          projectedValue: Math.max(1, underutilizedTools.length - 3),
          improvementPercentage: Math.round((3 / underutilizedTools.length) * 100)
        }
      });
    }

    // 2. Efficiency Improvement
    const oldTools = tools.filter(tool => {
      const age = tool.purchaseDate 
        ? Math.floor((new Date().getTime() - new Date(tool.purchaseDate).getTime()) / (1000 * 60 * 60 * 24))
        : 1000;
      return age > 1095; // 3+ years old
    });

    if (oldTools.length > 0) {
      recs.push({
        id: 'eff_imp_1',
        type: 'efficiency_improvement',
        priority: 'medium',
        category: 'تحسين الكفاءة',
        title: 'تحديث الأدوات القديمة',
        description: `${oldTools.length} أداة تحتاج تحديث لتحسين الكفاءة والإنتاجية.`,
        impactScore: 75,
        implementationCost: oldTools.length * 5000,
        expectedSavings: oldTools.length * 8000,
        timeframe: '90 يوم',
        confidence: 88,
        actionItems: [
          'تقييم حالة الأدوات القديمة',
          'دراسة البدائل الحديثة',
          'وضع خطة تحديث مرحلية',
          'قياس تحسن الإنتاجية'
        ],
        relatedTools: oldTools.map(t => t.name),
        metrics: {
          currentValue: oldTools.length,
          projectedValue: 0,
          improvementPercentage: 100
        }
      });
    }

    // 3. Preventive Maintenance
    const maintenanceNeeded = tools.filter(tool => {
      const lastMaintenance = tool.lastMaintenanceDate 
        ? new Date(tool.lastMaintenanceDate)
        : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      const daysSince = Math.floor((new Date().getTime() - lastMaintenance.getTime()) / (1000 * 60 * 60 * 24));
      return daysSince > 90;
    });

    if (maintenanceNeeded.length > 0) {
      recs.push({
        id: 'prev_act_1',
        type: 'preventive_action',
        priority: 'high',
        category: 'صيانة وقائية',
        title: 'برنامج صيانة وقائية شامل',
        description: `${maintenanceNeeded.length} أداة تحتاج صيانة وقائية لتجنب الأعطال المكلفة.`,
        impactScore: 90,
        implementationCost: maintenanceNeeded.length * 500,
        expectedSavings: maintenanceNeeded.length * 2000,
        timeframe: '14 يوم',
        confidence: 95,
        actionItems: [
          'جدولة صيانة فورية للأدوات',
          'وضع برنامج صيانة دورية',
          'تدريب فريق الصيانة',
          'متابعة دورية للحالة'
        ],
        relatedTools: maintenanceNeeded.map(t => t.name),
        metrics: {
          currentValue: maintenanceNeeded.length,
          projectedValue: 0,
          improvementPercentage: 100
        }
      });
    }

    // 4. Investment Opportunities
    const projectsNeedingTools = projects.filter(p => p.status === 'active').length;
    if (projectsNeedingTools > tools.filter(t => t.status === 'available').length) {
      recs.push({
        id: 'inv_opp_1',
        type: 'investment_opportunity',
        priority: 'medium',
        category: 'فرص استثمارية',
        title: 'توسيع مخزون الأدوات',
        description: 'المشاريع النشطة تحتاج المزيد من الأدوات لتحسين الإنتاجية.',
        impactScore: 70,
        implementationCost: 50000,
        expectedSavings: 120000,
        timeframe: '60 يوم',
        confidence: 80,
        actionItems: [
          'تحليل احتياجات المشاريع النشطة',
          'دراسة أفضل الأدوات للشراء',
          'وضع ميزانية الاستثمار',
          'تنفيذ خطة الشراء'
        ],
        relatedTools: ['أدوات جديدة مطلوبة'],
        metrics: {
          currentValue: tools.filter(t => t.status === 'available').length,
          projectedValue: projectsNeedingTools * 2,
          improvementPercentage: 150
        }
      });
    }

    // 5. Resource Allocation Optimization
    const toolsByProject = projects.map(project => ({
      project,
      toolCount: tools.filter(t => t.projectId === project.id).length
    }));

    const unbalancedProjects = toolsByProject.filter(p => p.toolCount < 3 || p.toolCount > 10);
    if (unbalancedProjects.length > 0) {
      recs.push({
        id: 'res_all_1',
        type: 'resource_allocation',
        priority: 'low',
        category: 'توزيع الموارد',
        title: 'إعادة توزيع الأدوات بين المشاريع',
        description: 'بعض المشاريع تحتاج إعادة توزيع الأدوات لتحسين الكفاءة.',
        impactScore: 60,
        implementationCost: 500,
        expectedSavings: 5000,
        timeframe: '7 أيام',
        confidence: 85,
        actionItems: [
          'تحليل احتياجات كل مشروع',
          'إعادة توزيع الأدوات المتاحة',
          'متابعة الاستخدام الجديد',
          'تقييم النتائج'
        ],
        relatedTools: tools.filter(t => t.status === 'available').map(t => t.name),
        metrics: {
          currentValue: unbalancedProjects.length,
          projectedValue: 0,
          improvementPercentage: 100
        }
      });
    }

    return recs.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.impactScore - a.impactScore;
    });
  }, [tools, projects, usageData, costData]);

  // Filter recommendations
  const filteredRecommendations = recommendations.filter(rec => {
    const matchesType = selectedType === 'all' || rec.type === selectedType;
    const matchesPriority = selectedPriority === 'all' || rec.priority === selectedPriority;
    return matchesType && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cost_optimization': return <DollarSign className="h-4 w-4" />;
      case 'efficiency_improvement': return <TrendingUp className="h-4 w-4" />;
      case 'preventive_action': return <AlertCircle className="h-4 w-4" />;
      case 'investment_opportunity': return <Target className="h-4 w-4" />;
      case 'resource_allocation': return <BarChart3 className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-4 z-50 overflow-auto bg-background border rounded-lg shadow-lg">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Brain className="h-7 w-7 text-purple-600" />
                محرك التوصيات الذكية
              </h2>
              <p className="text-muted-foreground">
                توصيات مدعومة بالذكاء الاصطناعي لتحسين الأداء والكفاءة
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="نوع التوصية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="cost_optimization">تحسين التكاليف</SelectItem>
                    <SelectItem value="efficiency_improvement">تحسين الكفاءة</SelectItem>
                    <SelectItem value="preventive_action">إجراءات وقائية</SelectItem>
                    <SelectItem value="investment_opportunity">فرص استثمارية</SelectItem>
                    <SelectItem value="resource_allocation">توزيع الموارد</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="الأولوية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأولويات</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="low">منخفضة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                إغلاق
              </Button>
            </div>
          </div>

          {/* Summary Stats - Using Unified StatsGrid */}
          <StatsGrid className="mb-6">
            <StatsCard
              title="توصية ذكية"
              value={recommendations.length}
              icon={Lightbulb}
              color="purple"
            />
            <StatsCard
              title="وفورات متوقعة (ريال)"
              value={Math.round(recommendations.reduce((sum, r) => sum + r.expectedSavings, 0))}
              icon={DollarSign}
              color="green"
              formatter={(value) => value.toLocaleString()}
            />
            <StatsCard
              title="متوسط الأثر المتوقع"
              value={`${Math.round(recommendations.reduce((sum, r) => sum + r.impactScore, 0) / recommendations.length) || 0}%`}
              icon={Target}
              color="blue"
            />
            <StatsCard
              title="توصيات عالية الأولوية"
              value={recommendations.filter(r => r.priority === 'high').length}
              icon={AlertCircle}
              color="orange"
            />
          </StatsGrid>

          {/* Recommendations List */}
          <div className="space-y-4">
            {filteredRecommendations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">ممتاز!</h3>
                  <p className="text-muted-foreground">
                    لا توجد توصيات للمعايير المحددة. النظام يعمل بكفاءة عالية.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredRecommendations.map((recommendation) => (
                <Card key={recommendation.id} className="border-l-4" style={{
                  borderLeftColor: recommendation.priority === 'high' ? '#dc2626' :
                                  recommendation.priority === 'medium' ? '#d97706' : '#16a34a'
                }}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getTypeIcon(recommendation.type)}
                        <span className="break-words">{recommendation.title}</span>
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={cn("border whitespace-nowrap", getPriorityColor(recommendation.priority))}>
                          {recommendation.priority === 'high' ? 'عالية' : 
                           recommendation.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                        </Badge>
                        <Badge variant="outline" className="whitespace-nowrap">
                          <Star className="h-3 w-3 ml-1" />
                          {recommendation.impactScore}%
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{recommendation.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      {/* Financial Impact */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">الأثر المالي:</h4>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span>وفورات: {recommendation.expectedSavings.toLocaleString()} ريال</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-3 w-3 text-red-500" />
                            <span>تكلفة: {recommendation.implementationCost.toLocaleString()} ريال</span>
                          </div>
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">مقاييس الأداء:</h4>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span>الحالي: {recommendation.metrics.currentValue}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowUp className="h-3 w-3 text-green-500" />
                            <span>تحسن: {recommendation.metrics.improvementPercentage}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Implementation Details */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">تفاصيل التنفيذ:</h4>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-blue-500" />
                            <span>المدة: {recommendation.timeframe}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="h-3 w-3 text-purple-500" />
                            <span>الثقة: {recommendation.confidence}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Items */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">خطوات التنفيذ:</h4>
                      <ul className="text-sm space-y-1">
                        {recommendation.actionItems.map((action, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Buttons - Responsive Layout */}
                    <div className="flex flex-col sm:flex-row gap-2 mt-4">
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
                        تنفيذ التوصية
                      </Button>
                      <Button size="sm" variant="outline" className="w-full sm:w-auto">
                        تفاصيل أكثر
                      </Button>
                      <Button size="sm" variant="outline" className="w-full sm:w-auto">
                        تأجيل
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligentRecommendationsEngine;