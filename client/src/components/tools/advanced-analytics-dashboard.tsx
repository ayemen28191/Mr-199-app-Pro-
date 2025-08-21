/**
 * الوصف: لوحة تحليلات متقدمة للأدوات والمعدات
 * المدخلات: بيانات الأدوات والحركات والتكاليف
 * المخرجات: تحليلات ذكية ورؤى تفاعلية
 * المالك: عمار
 * آخر تعديل: 2025-08-20
 * الحالة: نشط - تحليلات متقدمة
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { StatsCard, StatsGrid } from '@/components/ui/stats-card';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  PieChart,
  Calendar,
  DollarSign,
  Activity,
  Target,
  Zap,
  Wrench,
  Settings
} from 'lucide-react';

interface AnalyticsData {
  utilizationRate: number;
  maintenanceCosts: number;
  depreciationValue: number;
  efficiencyScore: number;
  categoryBreakdown: { [key: string]: number };
  statusDistribution: { [key: string]: number };
  projectUsage: { [key: string]: number };
  timelineData: Array<{
    date: string;
    movements: number;
    maintenance: number;
    costs: number;
  }>;
  recommendations: Array<{
    type: 'warning' | 'info' | 'success';
    title: string;
    description: string;
    action?: string;
  }>;
}

interface Tool {
  id: string;
  name: string;
  status: string;
  condition: string;
  categoryId?: string;
  projectId?: string;
  purchasePrice?: number;
  currentValue?: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
}

interface AdvancedAnalyticsDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  open,
  onOpenChange
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedProject, setSelectedProject] = useState('all');

  // Fetch tools data
  const { data: tools = [] } = useQuery<Tool[]>({
    queryKey: ['/api/tools'],
    enabled: open,
  });

  // Fetch tool movements
  const { data: movements = [] } = useQuery({
    queryKey: ['/api/tool-movements', selectedPeriod],
    enabled: open,
  });

  // Fetch projects
  const { data: projects = [] } = useQuery<{id: string, name: string}[]>({
    queryKey: ['/api/projects'],
    enabled: open,
  });

  // Calculate analytics data
  const analyticsData = useMemo((): AnalyticsData => {
    if (!tools.length) {
      return {
        utilizationRate: 0,
        maintenanceCosts: 0,
        depreciationValue: 0,
        efficiencyScore: 0,
        categoryBreakdown: {},
        statusDistribution: {},
        projectUsage: {},
        timelineData: [],
        recommendations: []
      };
    }

    // Calculate utilization rate
    const inUseTools = tools.filter(t => t.status === 'in_use').length;
    const utilizationRate = Math.round((inUseTools / tools.length) * 100);

    // Calculate total values
    const totalPurchaseValue = tools.reduce((sum, tool) => 
      sum + (tool.purchasePrice || 0), 0);
    const totalCurrentValue = tools.reduce((sum, tool) => 
      sum + (tool.currentValue || tool.purchasePrice || 0), 0);
    const depreciationValue = totalPurchaseValue - totalCurrentValue;

    // Category breakdown
    const categoryBreakdown: { [key: string]: number } = {};
    tools.forEach(tool => {
      const category = tool.categoryId || 'غير محدد';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });

    // Status distribution
    const statusDistribution: { [key: string]: number } = {};
    tools.forEach(tool => {
      statusDistribution[tool.status] = (statusDistribution[tool.status] || 0) + 1;
    });

    // Project usage
    const projectUsage: { [key: string]: number } = {};
    tools.forEach(tool => {
      if (tool.projectId) {
        const project = projects.find(p => p.id === tool.projectId);
        const projectName = project?.name || 'مشروع غير معروف';
        projectUsage[projectName] = (projectUsage[projectName] || 0) + 1;
      }
    });

    // Calculate efficiency score (complex algorithm)
    const availableTools = tools.filter(t => t.status === 'available').length;
    const damagedTools = tools.filter(t => t.status === 'damaged').length;
    const maintenanceTools = tools.filter(t => t.status === 'maintenance').length;
    
    let efficiencyScore = 100;
    efficiencyScore -= (damagedTools / tools.length) * 40; // Heavy penalty for damaged
    efficiencyScore -= (maintenanceTools / tools.length) * 20; // Medium penalty for maintenance
    efficiencyScore -= (availableTools / tools.length) * 10; // Light penalty for unused
    efficiencyScore = Math.max(0, Math.round(efficiencyScore));

    // Generate recommendations
    const recommendations = [];

    if (utilizationRate < 60) {
      recommendations.push({
        type: 'warning' as const,
        title: 'معدل استخدام منخفض',
        description: `معدل استخدام الأدوات ${utilizationRate}% فقط. يمكن تحسين الاستفادة.`,
        action: 'مراجعة توزيع الأدوات'
      });
    }

    if (damagedTools > 0) {
      recommendations.push({
        type: 'warning' as const,
        title: 'أدوات تحتاج إصلاح',
        description: `يوجد ${damagedTools} أداة تحتاج إصلاح فوري.`,
        action: 'جدولة الصيانة'
      });
    }

    if (efficiencyScore >= 80) {
      recommendations.push({
        type: 'success' as const,
        title: 'أداء ممتاز',
        description: `نظام الأدوات يعمل بكفاءة عالية ${efficiencyScore}%.`,
      });
    }

    return {
      utilizationRate,
      maintenanceCosts: 0, // يمكن حسابها من بيانات الصيانة
      depreciationValue,
      efficiencyScore,
      categoryBreakdown,
      statusDistribution,
      projectUsage,
      timelineData: [], // يمكن إضافة بيانات زمنية
      recommendations
    };
  }, [tools, projects]);

  const StatusCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-4 z-50 overflow-auto bg-background border rounded-lg shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">تحليلات الأدوات المتقدمة</h2>
              <p className="text-muted-foreground">رؤى ذكية وتحليلات شاملة</p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">آخر 7 أيام</SelectItem>
                  <SelectItem value="30">آخر 30 يوم</SelectItem>
                  <SelectItem value="90">آخر 3 شهور</SelectItem>
                  <SelectItem value="365">آخر سنة</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                إغلاق
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
              <TabsTrigger value="performance">الأداء</TabsTrigger>
              <TabsTrigger value="distribution">التوزيع</TabsTrigger>
              <TabsTrigger value="recommendations">التوصيات</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <StatsGrid>
                <StatsCard
                  title="معدل الاستخدام"
                  value={`${analyticsData.utilizationRate}%`}
                  icon={Activity}
                  color="blue"
                  formatter={(value) => `${value}%`}
                />
                <StatsCard
                  title="نتيجة الكفاءة"
                  value={`${analyticsData.efficiencyScore}%`}
                  icon={Target}
                  color={analyticsData.efficiencyScore >= 80 ? "green" : "orange"}
                  formatter={(value) => `${value}%`}
                />
                <StatsCard
                  title="قيمة الاستهلاك"
                  value={analyticsData.depreciationValue}
                  icon={TrendingDown}
                  color="red"
                  formatter={(value) => `${value.toLocaleString()} ريال`}
                />
                <StatsCard
                  title="إجمالي الأدوات"
                  value={tools.length}
                  icon={BarChart3}
                  color="purple"
                />
              </StatsGrid>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    توزيع حالة الأدوات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StatsGrid>
                    {Object.entries(analyticsData.statusDistribution).map(([status, count]) => (
                      <StatsCard
                        key={status}
                        title={status === 'available' ? 'متاحة' : 
                               status === 'in_use' ? 'قيد الاستخدام' :
                               status === 'maintenance' ? 'صيانة' : 'تالفة'}
                        value={count}
                        icon={status === 'available' ? CheckCircle :
                              status === 'in_use' ? Wrench :
                              status === 'maintenance' ? Settings : AlertTriangle}
                        color={status === 'available' ? 'green' :
                               status === 'in_use' ? 'blue' :
                               status === 'maintenance' ? 'orange' : 'red'}
                      />
                    ))}
                  </StatsGrid>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              {/* Performance Metrics Cards */}
              <StatsGrid>
                <StatsCard
                  title="معدل الاستخدام الفعلي"
                  value={`${analyticsData.utilizationRate}%`}
                  icon={Activity}
                  color={analyticsData.utilizationRate >= 70 ? "green" : "orange"}
                  formatter={(value: string) => value}
                />
                <StatsCard
                  title="نتيجة الكفاءة العامة"
                  value={`${analyticsData.efficiencyScore}%`}
                  icon={Target}
                  color={analyticsData.efficiencyScore >= 80 ? "green" : "red"}
                  formatter={(value: string) => value}
                />
                <StatsCard
                  title="قيمة الاستهلاك"
                  value={analyticsData.depreciationValue}
                  icon={TrendingDown}
                  color="red"
                  formatter={(value: number) => `${value.toLocaleString()} ريال`}
                />
              </StatsGrid>
            </TabsContent>

            <TabsContent value="distribution" className="space-y-6">
              {/* Project Usage */}
              {Object.keys(analyticsData.projectUsage).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>توزيع الأدوات على المشاريع</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(analyticsData.projectUsage).map(([project, count]) => (
                        <div key={project} className="flex justify-between items-center p-2 border rounded">
                          <span className="font-medium">{project}</span>
                          <Badge variant="outline">{count} أداة</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-6">
              <div className="space-y-4">
                {analyticsData.recommendations.map((rec, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {rec.type === 'warning' && <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />}
                        {rec.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />}
                        {rec.type === 'info' && <Zap className="h-5 w-5 text-blue-500 mt-0.5" />}
                        <div className="flex-1">
                          <h4 className="font-semibold">{rec.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                          {rec.action && (
                            <Button variant="outline" size="sm" className="mt-2">
                              {rec.action}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {analyticsData.recommendations.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">ممتاز!</h3>
                      <p className="text-muted-foreground">لا توجد توصيات حالياً. النظام يعمل بكفاءة عالية.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;