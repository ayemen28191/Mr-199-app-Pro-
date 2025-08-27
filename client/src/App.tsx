import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProfessionalLoader } from "@/components/ui/professional-loader";
import React, { useState, useEffect } from "react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import LoginPage from "@/pages/LoginPage";

import WorkerAttendance from "@/pages/worker-attendance";

import DailyExpenses from "@/pages/daily-expenses";
import MaterialPurchase from "@/pages/material-purchase";
import Reports from "@/pages/reports";

import ProjectTransfers from "@/pages/project-transfers";
import ProjectTransactionsPage from "@/pages/project-transactions-simple";

import ProjectsPage from "@/pages/projects";
import WorkersPage from "@/pages/workers";
import WorkerAccountsPage from "@/pages/worker-accounts";
import SuppliersProPage from "@/pages/suppliers-professional";
import SupplierAccountsPage from "@/pages/supplier-accounts";
import AutocompleteAdminPage from "@/pages/autocomplete-admin";
import { EquipmentManagement } from "@/pages/equipment-management";
import AdvancedReports from "@/pages/advanced-reports";
import WorkersUnifiedReports from "@/pages/workers-unified-reports";
import NotificationsPage from "@/pages/notifications";

import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import FloatingAddButton from "@/components/layout/floating-add-button";
import { FloatingButtonProvider } from "@/components/layout/floating-button-context";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import RegisterPage from "@/pages/RegisterPage";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/projects">
        <ProtectedRoute>
          <ProjectsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/workers">
        <ProtectedRoute>
          <WorkersPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/worker-accounts">
        <ProtectedRoute>
          <WorkerAccountsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/suppliers">
        <ProtectedRoute>
          <SuppliersProPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/suppliers-pro">
        <ProtectedRoute>
          <SuppliersProPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/supplier-accounts">
        <ProtectedRoute>
          <SupplierAccountsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/worker-attendance">
        <ProtectedRoute>
          <WorkerAttendance />
        </ProtectedRoute>
      </Route>

      <Route path="/daily-expenses">
        <ProtectedRoute>
          <DailyExpenses />
        </ProtectedRoute>
      </Route>
      
      <Route path="/material-purchase">
        <ProtectedRoute>
          <MaterialPurchase />
        </ProtectedRoute>
      </Route>
      
      <Route path="/material-purchases">
        <ProtectedRoute>
          <MaterialPurchase />
        </ProtectedRoute>
      </Route>

      <Route path="/project-transfers">
        <ProtectedRoute>
          <ProjectTransfers />
        </ProtectedRoute>
      </Route>
      
      <Route path="/project-transactions">
        <ProtectedRoute>
          <ProjectTransactionsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/autocomplete-admin">
        <ProtectedRoute>
          <AutocompleteAdminPage />
        </ProtectedRoute>
      </Route>

      <Route path="/equipment">
        <ProtectedRoute>
          <EquipmentManagement />
        </ProtectedRoute>
      </Route>
      
      <Route path="/equipment-management">
        <ProtectedRoute>
          <EquipmentManagement />
        </ProtectedRoute>
      </Route>
      
      <Route path="/reports">
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      </Route>
      
      <Route path="/advanced-reports">
        <ProtectedRoute>
          <AdvancedReports />
        </ProtectedRoute>
      </Route>
      
      <Route path="/workers-unified-reports">
        <ProtectedRoute>
          <WorkersUnifiedReports />
        </ProtectedRoute>
      </Route>
      
      <Route path="/notifications">
        <ProtectedRoute>
          <NotificationsPage />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // إضافة تأخير بسيط للتأكد من أن HTML loader يظهر أولاً
    const timer = setTimeout(() => {
      // إخفاء الـ HTML loader وإظهار React app
      const htmlLoader = document.getElementById('initial-loader');
      const root = document.getElementById('root');
      
      if (htmlLoader) {
        htmlLoader.classList.add('fade-out');
        setTimeout(() => {
          htmlLoader.style.display = 'none';
          if (root) {
            root.classList.add('loaded');
          }
        }, 500);
      }
    }, 1500); // إظهار HTML loader لمدة 1.5 ثانية

    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
