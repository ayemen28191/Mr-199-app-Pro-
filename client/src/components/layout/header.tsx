import { Bell, UserCircle, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-reverse space-x-3">
            <HardHat className="h-6 w-6" />
            <h1 className="text-lg font-bold">إدارة المشاريع الإنشائية</h1>
          </div>
          <div className="flex items-center space-x-reverse space-x-2">
            <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-primary/80">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-primary/80">
              <UserCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
