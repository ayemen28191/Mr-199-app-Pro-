import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { BarChart, Package, Users, TrendingUp } from "lucide-react";

export default function DashboardSimple() {
  const [, setLocation] = useLocation();

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">لوحة التحكم</h1>
      
      <div className="grid grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/projects')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="w-4 h-4" />
              المشاريع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">مشاريع نشطة</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/workers')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              العمال
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">عامل نشط</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/daily-expenses')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              المصاريف
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,500</div>
            <p className="text-xs text-muted-foreground">ريال اليوم</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/reports')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart className="w-4 h-4" />
              التقارير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">تقارير متاحة</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <Button onClick={() => setLocation('/projects')} className="w-full">
          إدارة المشاريع
        </Button>
        <Button onClick={() => setLocation('/workers')} variant="outline" className="w-full">
          إدارة العمال
        </Button>
        <Button onClick={() => setLocation('/daily-expenses')} variant="outline" className="w-full">
          المصاريف اليومية
        </Button>
      </div>
    </div>
  );
}