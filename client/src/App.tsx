import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProfessionalLoader } from "@/components/ui/professional-loader";
import React, { useState, useEffect } from "react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";

import WorkerAttendance from "@/pages/worker-attendance";

import DailyExpenses from "@/pages/daily-expenses";
import MaterialPurchase from "@/pages/material-purchase";
import Reports from "@/pages/reports";

import ProjectTransfers from "@/pages/ProjectTransfers";
import ProjectTransactionsPage from "@/pages/ProjectTransactionsSimple";

import ProjectsPage from "@/pages/projects";
import WorkersPage from "@/pages/workers";
import WorkerAccountsPage from "@/pages/worker-accounts";
import SuppliersProPage from "@/pages/suppliers-professional";
import SupplierAccountsPage from "@/pages/supplier-accounts";
import AutocompleteAdminPage from "@/pages/autocomplete-admin";
import { EquipmentManagement } from "@/pages/equipment-management";
import AdvancedReports from "@/pages/advanced-reports";
import WorkersUnifiedReports from "@/pages/workers-unified-reports";

import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import FloatingAddButton from "@/components/layout/floating-add-button";
import { FloatingButtonProvider } from "@/components/layout/floating-button-context";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />

      <Route path="/projects" component={ProjectsPage} />
      <Route path="/workers" component={WorkersPage} />
      <Route path="/worker-accounts" component={WorkerAccountsPage} />
      <Route path="/suppliers" component={SuppliersProPage} />
      <Route path="/suppliers-pro" component={SuppliersProPage} />
      <Route path="/supplier-accounts" component={SupplierAccountsPage} />
      <Route path="/worker-attendance" component={WorkerAttendance} />

      <Route path="/daily-expenses" component={DailyExpenses} />
      <Route path="/material-purchase" component={MaterialPurchase} />
      <Route path="/material-purchases" component={MaterialPurchase} />

      <Route path="/project-transfers" component={ProjectTransfers} />
      <Route path="/project-transactions" component={ProjectTransactionsPage} />
      <Route path="/autocomplete-admin" component={AutocompleteAdminPage} />

      <Route path="/equipment" component={EquipmentManagement} />
      <Route path="/equipment-management" component={EquipmentManagement} />
      <Route path="/reports" component={Reports} />
      <Route path="/advanced-reports" component={AdvancedReports} />
      <Route path="/workers-unified-reports" component={WorkersUnifiedReports} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // التحقق من وجود خيار تخطي التحميل في localStorage (للمطورين)
    const skipLoading = localStorage.getItem('skipLoading') === 'true';
    if (skipLoading) {
      setIsLoading(false);
      return;
    }

    // محاكاة تحميل التطبيق
    const loadingSteps = [
      { progress: 20, message: "جاري تحميل الإعدادات..." },
      { progress: 40, message: "جاري الاتصال بقاعدة البيانات..." },
      { progress: 60, message: "جاري تحميل المشاريع..." },
      { progress: 80, message: "جاري تحضير الواجهة..." },
      { progress: 100, message: "مرحباً بك!" }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        setLoadingProgress(loadingSteps[currentStep].progress);
        currentStep++;
      } else {
        clearInterval(interval);
        // إنهاء التحميل بعد ثانية واحدة
        setTimeout(() => setIsLoading(false), 1000);
      }
    }, 600);

    // إضافة مفتاح للتخطي السريع (مفيد للمطورين)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || (e.ctrlKey && e.key === 's')) {
        clearInterval(interval);
        setIsLoading(false);
        localStorage.setItem('skipLoading', 'true');
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  if (isLoading) {
    return (
      <ProfessionalLoader 
        showProgress={true}
        progress={loadingProgress}
        message={
          loadingProgress <= 20 ? "جاري تحميل الإعدادات..." :
          loadingProgress <= 40 ? "جاري الاتصال بقاعدة البيانات..." :
          loadingProgress <= 60 ? "جاري تحميل المشاريع..." :
          loadingProgress <= 80 ? "جاري تحضير الواجهة..." :
          "مرحباً بك!"
        }
      />
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <FloatingButtonProvider>
          <div className="min-h-screen bg-background text-foreground" dir="rtl">
            <Header />
            <main className="pb-20">
              <Router />
            </main>
            <BottomNavigation />
            <FloatingAddButton />
            <Toaster />
          </div>
        </FloatingButtonProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
