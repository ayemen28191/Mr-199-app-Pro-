/**
 * الوصف: نظام التنبؤ بالصيانة الذكي للأدوات والمعدات
 * المدخلات: بيانات استخدام الأدوات وسجل الصيانة
 * المخرجات: توقعات ذكية لأوقات الصيانة والإنذارات المبكرة
 * المالك: عمار
 * آخر تعديل: 2025-08-20
 * الحالة: نشط - صيانة تنبؤية ذكية
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
  AlertTriangle,
  Clock,
  Wrench,
  Calendar,
  Brain,
  Zap,
  TrendingUp,
  Settings,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MaintenancePrediction {
  toolId: string;
  toolName: string;
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
  predictedDate: string;
  confidence: number;
  reasonCode: string;
  daysRemaining: number;
  recommendations: string[];
  riskFactors: string[];
  costEstimate: number;
}

interface PredictiveMaintenanceSystemProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PredictiveMaintenanceSystem: React.FC<PredictiveMaintenanceSystemProps> = ({
  open,
  onOpenChange
}) => {
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30');

  // Fetch tools and maintenance data
  const { data: tools = [] } = useQuery<any[]>({
    queryKey: ['/api/tools'],
    enabled: open,
  });

  const { data: maintenanceLogs = [] } = useQuery<any[]>({
    queryKey: ['/api/tool-maintenance-logs'],
    enabled: open,
  });

  const { data: usageAnalytics = [] } = useQuery<any[]>({
    queryKey: ['/api/tool-usage-analytics'],
    enabled: open,
  });

  // AI-powered predictive algorithm
  const predictions = useMemo((): MaintenancePrediction[] => {
    if (!tools.length) return [];

    const currentDate = new Date();
    const predictions: MaintenancePrediction[] = [];

    tools.forEach(tool => {
      // Skip tools not in active use
      if (tool.status !== 'in_use' && tool.status !== 'available') return;

      // Get maintenance history for this tool
      const toolMaintenanceHistory = maintenanceLogs.filter(log => log.toolId === tool.id);
      const lastMaintenance = toolMaintenanceHistory
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      // Get usage data
      const toolUsage = usageAnalytics.filter(usage => usage.toolId === tool.id);
      const avgDailyUsage = toolUsage.length > 0 
        ? toolUsage.reduce((sum, u) => sum + (u.hoursUsed || 0), 0) / toolUsage.length 
        : 4; // Default 4 hours per day

      // Calculate days since last maintenance
      const daysSinceLastMaintenance = lastMaintenance 
        ? Math.floor((currentDate.getTime() - new Date(lastMaintenance.date).getTime()) / (1000 * 60 * 60 * 24))
        : 365; // Assume 1 year if no maintenance history

      // AI Algorithm: Multiple factors analysis
      let riskScore = 0;
      const riskFactors: string[] = [];
      
      // Factor 1: Time since last maintenance
      if (daysSinceLastMaintenance > 180) {
        riskScore += 40;
        riskFactors.push('لم يتم صيانتها منذ أكثر من 6 أشهر');
      } else if (daysSinceLastMaintenance > 90) {
        riskScore += 20;
        riskFactors.push('لم يتم صيانتها منذ أكثر من 3 أشهر');
      }

      // Factor 2: Usage intensity
      if (avgDailyUsage > 8) {
        riskScore += 30;
        riskFactors.push('استخدام مكثف (أكثر من 8 ساعات يومياً)');
      } else if (avgDailyUsage > 6) {
        riskScore += 15;
        riskFactors.push('استخدام عالي (6-8 ساعات يومياً)');
      }

      // Factor 3: Tool age
      const toolAge = tool.purchaseDate 
        ? Math.floor((currentDate.getTime() - new Date(tool.purchaseDate).getTime()) / (1000 * 60 * 60 * 24))
        : 730; // Default 2 years
      
      if (toolAge > 1825) { // 5 years
        riskScore += 25;
        riskFactors.push('أداة قديمة (أكثر من 5 سنوات)');
      } else if (toolAge > 1095) { // 3 years
        riskScore += 15;
        riskFactors.push('أداة متوسطة العمر (3-5 سنوات)');
      }

      // Factor 4: Condition status
      if (tool.condition === 'poor') {
        riskScore += 35;
        riskFactors.push('حالة ضعيفة');
      } else if (tool.condition === 'fair') {
        riskScore += 20;
        riskFactors.push('حالة مقبولة');
      }

      // Factor 5: Maintenance frequency (predictive)
      const maintenanceFrequency = tool.maintenanceInterval || 90; // Default 90 days
      if (daysSinceLastMaintenance > maintenanceFrequency) {
        riskScore += 30;
        riskFactors.push('تجاوزت الفترة المحددة للصيانة');
      }

      // Determine urgency and predicted date
      let urgencyLevel: MaintenancePrediction['urgencyLevel'];
      let daysRemaining: number;
      let confidence: number;

      if (riskScore >= 80) {
        urgencyLevel = 'critical';
        daysRemaining = Math.max(1, 7 - Math.floor(riskScore / 15));
        confidence = 95;
      } else if (riskScore >= 60) {
        urgencyLevel = 'high';
        daysRemaining = Math.max(7, 14 - Math.floor(riskScore / 10));
        confidence = 85;
      } else if (riskScore >= 40) {
        urgencyLevel = 'medium';
        daysRemaining = Math.max(14, 30 - Math.floor(riskScore / 5));
        confidence = 75;
      } else {
        urgencyLevel = 'low';
        daysRemaining = Math.max(30, 60 - riskScore);
        confidence = 65;
      }

      const predictedDate = new Date(currentDate.getTime() + daysRemaining * 24 * 60 * 60 * 1000);

      // Generate recommendations
      const recommendations: string[] = [];
      if (urgencyLevel === 'critical') {
        recommendations.push('جدولة صيانة فورية');
        recommendations.push('فحص شامل للأداة');
        recommendations.push('تقييم إمكانية الاستبدال');
      } else if (urgencyLevel === 'high') {
        recommendations.push('جدولة صيانة خلال الأسبوع القادم');
        recommendations.push('فحص الأجزاء الأساسية');
      } else {
        recommendations.push('مراقبة الأداء');
        recommendations.push('صيانة وقائية منتظمة');
      }

      // Estimate cost (basic algorithm)
      const baseCost = tool.purchasePrice ? tool.purchasePrice * 0.05 : 500;
      const costMultiplier = urgencyLevel === 'critical' ? 2 : urgencyLevel === 'high' ? 1.5 : 1;
      const costEstimate = Math.round(baseCost * costMultiplier);

      predictions.push({
        toolId: tool.id,
        toolName: tool.name,
        urgencyLevel,
        predictedDate: predictedDate.toISOString().split('T')[0],
        confidence,
        reasonCode: `RISK_${riskScore}`,
        daysRemaining,
        recommendations,
        riskFactors,
        costEstimate
      });
    });

    // Sort by urgency and days remaining
    return predictions.sort((a, b) => {
      const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      if (urgencyOrder[a.urgencyLevel] !== urgencyOrder[b.urgencyLevel]) {
        return urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel];
      }
      return a.daysRemaining - b.daysRemaining;
    });
  }, [tools, maintenanceLogs, usageAnalytics]);

  // Filter predictions
  const filteredPredictions = predictions.filter(pred => {
    const matchesUrgency = selectedUrgency === 'all' || pred.urgencyLevel === selectedUrgency;
    const matchesTimeframe = selectedTimeframe === 'all' || pred.daysRemaining <= parseInt(selectedTimeframe);
    return matchesUrgency && matchesTimeframe;
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <CheckCircle2 className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'حرج';
      case 'high': return 'عالي';
      case 'medium': return 'متوسط';
      case 'low': return 'منخفض';
      default: return 'غير محدد';
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
                <Brain className="h-7 w-7 text-blue-600" />
                نظام التنبؤ بالصيانة الذكي
              </h2>
              <p className="text-muted-foreground">
                توقعات مدعومة بالذكاء الاصطناعي لصيانة الأدوات
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="مستوى الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المستويات</SelectItem>
                  <SelectItem value="critical">حرج</SelectItem>
                  <SelectItem value="high">عالي</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="low">منخفض</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="الإطار الزمني" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأوقات</SelectItem>
                  <SelectItem value="7">خلال أسبوع</SelectItem>
                  <SelectItem value="30">خلال شهر</SelectItem>
                  <SelectItem value="90">خلال 3 أشهر</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                إغلاق
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{predictions.filter(p => p.urgencyLevel === 'critical').length}</div>
                <div className="text-sm text-muted-foreground">حالات حرجة</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{predictions.filter(p => p.urgencyLevel === 'high').length}</div>
                <div className="text-sm text-muted-foreground">أولوية عالية</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{predictions.filter(p => p.urgencyLevel === 'medium').length}</div>
                <div className="text-sm text-muted-foreground">أولوية متوسطة</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{predictions.reduce((sum, p) => sum + p.costEstimate, 0).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">التكلفة المتوقعة (ريال)</div>
              </CardContent>
            </Card>
          </div>

          {/* Predictions List */}
          <div className="space-y-4">
            {filteredPredictions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">ممتاز!</h3>
                  <p className="text-muted-foreground">
                    لا توجد توقعات صيانة عاجلة للفترة المحددة.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredPredictions.map((prediction) => (
                <Card key={prediction.toolId} className="border-l-4" style={{
                  borderLeftColor: prediction.urgencyLevel === 'critical' ? '#dc2626' :
                                  prediction.urgencyLevel === 'high' ? '#ea580c' :
                                  prediction.urgencyLevel === 'medium' ? '#d97706' : '#16a34a'
                }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{prediction.toolName}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("border", getUrgencyColor(prediction.urgencyLevel))}>
                          {getUrgencyIcon(prediction.urgencyLevel)}
                          <span className="mr-1">{getUrgencyText(prediction.urgencyLevel)}</span>
                        </Badge>
                        <Badge variant="outline">
                          <TrendingUp className="h-3 w-3 ml-1" />
                          {prediction.confidence}% دقة
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Prediction Details */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            <strong>التاريخ المتوقع:</strong> {new Date(prediction.predictedDate).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            <strong>الأيام المتبقية:</strong> {prediction.daysRemaining} يوم
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            <strong>التكلفة المتوقعة:</strong> {prediction.costEstimate.toLocaleString()} ريال
                          </span>
                        </div>
                      </div>

                      {/* Risk Factors & Recommendations */}
                      <div className="space-y-3">
                        {prediction.riskFactors.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2">عوامل الخطر:</h4>
                            <ul className="text-xs space-y-1">
                              {prediction.riskFactors.map((factor, index) => (
                                <li key={index} className="flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                                  {factor}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {prediction.recommendations.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2">التوصيات:</h4>
                            <ul className="text-xs space-y-1">
                              {prediction.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-center gap-1">
                                  <Wrench className="h-3 w-3 text-blue-500" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline">
                        جدولة صيانة
                      </Button>
                      <Button size="sm" variant="outline">
                        عرض تفاصيل الأداة
                      </Button>
                      {prediction.urgencyLevel === 'critical' && (
                        <Button size="sm" className="bg-red-600 hover:bg-red-700">
                          إجراء فوري
                        </Button>
                      )}
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

export default PredictiveMaintenanceSystem;