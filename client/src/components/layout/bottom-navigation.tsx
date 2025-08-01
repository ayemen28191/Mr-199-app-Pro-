import { useLocation } from "wouter";
import { Home, Users, Receipt, BarChart, CreditCard, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { path: "/", icon: Home, label: "الرئيسية", key: "dashboard" },
  { path: "/projects", icon: Building2, label: "المشاريع", key: "projects" },
  { path: "/worker-attendance", icon: Users, label: "الحضور", key: "attendance" },
  { path: "/daily-expenses", icon: Receipt, label: "المصروفات", key: "expenses" },
  { path: "/daily-expenses-report", icon: BarChart, label: "كشف المصروفات", key: "daily-report" },
];

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="grid grid-cols-5 h-16">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Button
              key={item.key}
              variant="ghost"
              className={`flex flex-col items-center justify-center space-y-1 h-full rounded-none ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
              onClick={() => setLocation(item.path)}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
