import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, Receipt, ShoppingCart, BarChart, ArrowRight, Settings, DollarSign, TrendingDown, TrendingUp, Calendar, Package, UserCheck } from "lucide-react";
import { StatsCard, StatsGrid } from "@/components/ui/stats-card";
import { useSelectedProject } from "@/hooks/use-selected-project";
import ProjectSelector from "@/components/project-selector";

import { formatCurrency, formatDate } from "@/lib/utils";
import { LoadingCard, LoadingSpinner } from "@/components/ui/loading-spinner";
import { useFloatingButton } from "@/components/layout/floating-button-context";
import { useEffect } from "react";
import type { Project, DailyExpenseSummary } from "@shared/schema";

interface ProjectStats {
  totalWorkers: string;
  totalExpenses: number;
  totalIncome: number;
  currentBalance: number;
  activeWorkers: string;
  completedDays: string;
  materialPurchases: string;
  lastActivity: string;
}

interface ProjectWithStats extends Project {
  stats: ProjectStats;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { selectedProjectId, selectProject } = useSelectedProject();


  const queryClient = useQueryClient();
  const { setFloatingAction } = useFloatingButton();

  // تحميل المشاريع مع الإحصائيات بشكل محسن
  const { data: projects = [], isLoading: projectsLoading } = useQuery<ProjectWithStats[]>({
    queryKey: ["/api/projects/with-stats"],
    staleTime: 1000 * 30, // 30 ثانية فقط للإحصائيات لضمان الحصول على البيانات المحدثة
    refetchInterval: 1000 * 60, // إعادة التحديث كل دقيقة
  });

  const { data: todaySummary } = useQuery<DailyExpenseSummary>({
    queryKey: ["/api/projects", selectedProjectId, "daily-summary", new Date().toISOString().split('T')[0]],
    enabled: !!selectedProjectId,
    staleTime: 1000 * 30, // 30 ثانية للملخص اليومي
  });



  const selectedProject = projects.find((p: ProjectWithStats) => p.id === selectedProjectId);



  // تعيين إجراء الزر العائم
  useEffect(() => {
    setFloatingAction(null);
    return () => setFloatingAction(null);
  }, [setFloatingAction]);

  // تسجيل بيانات المشروع المحدد - داخل useEffect لتجنب التحديثات أثناء الرسم
  useEffect(() => {
    if (selectedProject) {
      console.log('🔍 بيانات المشروع المحدد في Frontend:', {
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        totalIncome: selectedProject.stats?.totalIncome,
        totalExpenses: selectedProject.stats?.totalExpenses,
        currentBalance: selectedProject.stats?.currentBalance
      });
      
      // فحص خاص لمشروع الحبشي
      if (selectedProject.name.includes('الحبشي')) {
        console.warn('🚨 مشروع الحبشي - تحقق من البيانات:', {
          مشروع: selectedProject.name,
          الدخل: selectedProject.stats?.totalIncome,
          المصاريف: selectedProject.stats?.totalExpenses,
          هل_متساوية: selectedProject.stats?.totalIncome === selectedProject.stats?.totalExpenses,
          fullStats: selectedProject.stats
        });
      }
    }
  }, [selectedProject]);

  // دالة تنسيق العملة
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' ر.ي';
  };

  const quickActions = [
    {
      icon: Clock,
      label: "تسجيل حضور",
      bgColor: "bg-primary",
      hoverColor: "hover:bg-primary/90",
      textColor: "text-primary-foreground",
      action: () => setLocation("/worker-attendance"),
    },
    {
      icon: Receipt,
      label: "مصروفات يومية",
      bgColor: "bg-secondary",
      hoverColor: "hover:bg-secondary/90",
      textColor: "text-secondary-foreground",
      action: () => setLocation("/daily-expenses"),
    },
    {
      icon: ShoppingCart,
      label: "شراء مواد",
      bgColor: "bg-success",
      hoverColor: "hover:bg-success/90",
      textColor: "text-success-foreground",
      action: () => setLocation("/material-purchase"),
    },
    {
      icon: BarChart,
      label: "التقارير",
      bgColor: "bg-purple-600",
      hoverColor: "hover:bg-purple-700",
      textColor: "text-white",
      action: () => setLocation("/reports"),
    },
    {
      icon: ArrowRight,
      label: "ترحيل أموال",
      bgColor: "bg-orange-600",
      hoverColor: "hover:bg-orange-700",
      textColor: "text-white",
      action: () => setLocation("/project-transfers"),
    },
    {
      icon: Settings,
      label: "إعدادات القوالب",
      bgColor: "bg-indigo-600",
      hoverColor: "hover:bg-indigo-700",
      textColor: "text-white",
      action: () => setLocation("/report-template-settings-enhanced"),
    },
  ];

  // عرض شاشة تحميل أولية إذا كانت المشاريع لم تحمل بعد
  if (projectsLoading) {
    return <LoadingCard />;
  }

  return (
    <div className="p-4 fade-in">




      <ProjectSelector
        selectedProjectId={selectedProjectId}
        onProjectChange={selectProject}
      />

      {selectedProject && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">{selectedProject.name}</h3>
              <Badge variant="secondary" className="bg-success text-success-foreground">
                نشط
              </Badge>
            </div>

            {/* Project Statistics */}
            <div className="grid grid-cols-2 gap-3">
              <StatsCard
                title="إجمالي التوريد"
                value={selectedProject?.stats?.totalIncome || 0}
                icon={TrendingUp}
                color="blue"
                formatter={formatCurrency}
              />
              <StatsCard
                title="إجمالي المنصرف"
                value={selectedProject?.stats?.totalExpenses || 0}
                icon={TrendingDown}
                color="red"
                formatter={formatCurrency}
              />
              <StatsCard
                title="المتبقي الحالي"
                value={selectedProject?.stats?.currentBalance || 0}
                icon={DollarSign}
                color="green"
                formatter={formatCurrency}
              />
              <StatsCard
                title="العمال النشطين"
                value={selectedProject?.stats?.activeWorkers || "0"}
                icon={UserCheck}
                color="purple"
              />
              <StatsCard
                title="أيام العمل المكتملة"
                value={selectedProject?.stats?.completedDays || "0"}
                icon={Calendar}
                color="teal"
              />
              <StatsCard
                title="مشتريات المواد"
                value={selectedProject?.stats?.materialPurchases || "0"}
                icon={Package}
                color="indigo"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-bold text-foreground mb-4">إجراءات سريعة</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  onClick={action.action}
                  className={`${action.bgColor} ${action.hoverColor} ${action.textColor} p-4 h-auto flex-col space-y-2 transition-colors`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
