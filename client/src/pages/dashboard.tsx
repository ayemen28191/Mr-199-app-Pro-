import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, Receipt, ShoppingCart, BarChart, Plus, Users } from "lucide-react";
import { useSelectedProject } from "@/hooks/use-selected-project";
import ProjectSelector from "@/components/project-selector";
import AddProjectForm from "@/components/forms/add-project-form";
import AddWorkerForm from "@/components/forms/add-worker-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Project, DailyExpenseSummary } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { selectedProjectId, selectProject } = useSelectedProject();
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddWorker, setShowAddWorker] = useState(false);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: todaySummary } = useQuery<DailyExpenseSummary>({
    queryKey: ["/api/projects", selectedProjectId, "daily-summary", new Date().toISOString().split('T')[0]],
    enabled: !!selectedProjectId,
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);

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
  ];

  return (
    <div className="p-4 fade-in">
      {/* Management Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Dialog open={showAddProject} onOpenChange={setShowAddProject}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-12 border-2 border-dashed">
              <Plus className="ml-2 h-4 w-4" />
              إضافة مشروع
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مشروع جديد</DialogTitle>
            </DialogHeader>
            <AddProjectForm onSuccess={() => setShowAddProject(false)} />
          </DialogContent>
        </Dialog>

        <Dialog open={showAddWorker} onOpenChange={setShowAddWorker}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-12 border-2 border-dashed">
              <Users className="ml-2 h-4 w-4" />
              إضافة عامل
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة عامل جديد</DialogTitle>
            </DialogHeader>
            <AddWorkerForm onSuccess={() => setShowAddWorker(false)} />
          </DialogContent>
        </Dialog>
      </div>

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

            {todaySummary ? (
              <>
                {/* Financial Summary Cards */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground mb-1">إجمالي التوريد</div>
                    <div className="text-lg font-bold text-primary arabic-numbers">
                      {formatCurrency(todaySummary.totalIncome)}
                    </div>
                    <div className="text-xs text-muted-foreground">ريال</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground mb-1">إجمالي المنصرف</div>
                    <div className="text-lg font-bold text-destructive arabic-numbers">
                      {formatCurrency(todaySummary.totalExpenses)}
                    </div>
                    <div className="text-xs text-muted-foreground">ريال</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground mb-1">المتبقي</div>
                    <div className="text-lg font-bold text-success arabic-numbers">
                      {formatCurrency(todaySummary.remainingBalance)}
                    </div>
                    <div className="text-xs text-muted-foreground">ريال</div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">آخر تحديث</div>
                    <div className="text-sm font-medium text-foreground">
                      {formatDate(todaySummary.date)}
                    </div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">حالة المشروع</div>
                    <div className="text-sm font-medium text-foreground">نشط</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>لا توجد بيانات لهذا اليوم</p>
                <p className="text-sm">ابدأ بتسجيل المصروفات اليومية</p>
              </div>
            )}
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
