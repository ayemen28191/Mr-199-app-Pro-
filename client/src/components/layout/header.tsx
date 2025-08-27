import { Bell, UserCircle, HardHat, Settings, Home, Building2, Users, Truck, UserCheck, DollarSign, Calculator, Package, ArrowLeftRight, FileText, CreditCard, FileSpreadsheet, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

// مطابقة الصفحات مع العناوين والأيقونات
const pageInfo: Record<string, { title: string; icon: any }> = {
  '/': { title: 'لوحة التحكم', icon: Home },
  '/projects': { title: 'إدارة المشاريع', icon: Building2 },
  '/workers': { title: 'إدارة العمال', icon: Users },
  '/suppliers-pro': { title: 'إدارة الموردين', icon: Truck },
  '/worker-attendance': { title: 'حضور العمال', icon: UserCheck },
  '/worker-accounts': { title: 'حسابات العمال', icon: DollarSign },
  '/daily-expenses': { title: 'المصاريف اليومية', icon: Calculator },
  '/material-purchase': { title: 'شراء المواد', icon: Package },
  '/project-transfers': { title: 'تحويلات العهدة', icon: ArrowLeftRight },
  '/project-transactions': { title: 'سجل العمليات', icon: FileText },
  '/project-transactions-simple': { title: 'سجل العمليات المبسط', icon: FileText },
  '/supplier-accounts': { title: 'حسابات الموردين', icon: CreditCard },
  '/reports': { title: 'التقارير', icon: FileSpreadsheet },
  '/autocomplete-admin': { title: 'إعدادات الإكمال التلقائي', icon: Wrench },
  '/tools-management': { title: 'إدارة الأدوات والمعدات', icon: Wrench },
  '/notifications': { title: 'الإشعارات', icon: Bell },
};

export default function Header() {
  const [location, setLocation] = useLocation();
  
  // الحصول على معلومات الصفحة الحالية
  const currentPage = pageInfo[location] || { title: 'إدارة المشاريع الإنشائية', icon: HardHat };
  const PageIcon = currentPage.icon;

  return (
    <header className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-reverse space-x-3">
            <PageIcon className="h-6 w-6" />
            <h1 className="text-lg font-bold">{currentPage.title}</h1>
          </div>
          <div className="flex items-center space-x-reverse space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 rounded-full hover:bg-primary/80"
              onClick={() => setLocation('/print-control')}
              title="التحكم في الطباعة"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <NotificationCenter />
            <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-primary/80">
              <UserCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
