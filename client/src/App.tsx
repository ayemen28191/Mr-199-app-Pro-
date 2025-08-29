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
import AISystemDashboard from "@/pages/AISystemDashboard";

import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import FloatingAddButton from "@/components/layout/floating-add-button";
import { FloatingButtonProvider } from "@/components/layout/floating-button-context";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import RegisterPage from "@/pages/RegisterPage";

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="pb-20">
        {children}
      </main>
      <BottomNavigation />
      <FloatingAddButton />
    </>
  );
}

function Router() {
  return (
    <Switch>
      {/* صفحات غير محمية - بدون شريط علوي أو سفلي */}
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      
      {/* صفحات محمية - مع شريط علوي وسفلي */}
      <Route path="/">
        <ProtectedRoute>
          <AuthLayout>
            <Dashboard />
          </AuthLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/projects">
        <ProtectedRoute>
          <AuthLayout>
            <ProjectsPage />
          </AuthLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/workers">
        <ProtectedRoute>
          <AuthLayout>
            <WorkersPage />
          </AuthLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/worker-accounts">
        <ProtectedRoute>
          <AuthLayout>
            <WorkerAccountsPage />
          </AuthLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/suppliers">
        <ProtectedRoute>
          <AuthLayout>
            <SuppliersProPage />
          </AuthLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/suppliers-pro">
        <ProtectedRoute>
          <AuthLayout>
            <SuppliersProPage />
          </AuthLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/supplier-accounts">
        <ProtectedRoute>
          <AuthLayout>
            <SupplierAccountsPage />
          </AuthLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/worker-attendance">
        <ProtectedRoute>
          <AuthLayout>
            <WorkerAttendance />
          </AuthLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/daily-expenses">
        <ProtectedRoute>
          <AuthLayout>
            <DailyExpenses />
          </AuthLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/material-purchase">
        <ProtectedRoute>
          <AuthLayout>
            <MaterialPurchase />
          </AuthLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/material-purchases">
        <ProtectedRoute>
          <AuthLayout>
            <MaterialPurchase />
          </AuthLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/project-transfers">
        <ProtectedRoute>
          <AuthLayout>
            <ProjectTransfers />
          </AuthLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/project-transactions">
        <ProtectedRoute>
          <AuthLayout>
            <ProjectTransactionsPage />
          </AuthLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/autocomplete-admin">
        <ProtectedRoute>
          <AuthLayout>
            <AutocompleteAdminPage />
          </AuthLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/equipment">
        <ProtectedRoute>
          <AuthLayout>
            <EquipmentManagement />
          </AuthLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/equipment-management">
        <ProtectedRoute>
          <AuthLayout>
            <EquipmentManagement />
          </AuthLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/reports">
        <ProtectedRoute>
          <AuthLayout>
            <Reports />
          </AuthLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/advanced-reports">
        <ProtectedRoute>
          <AuthLayout>
            <AdvancedReports />
          </AuthLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/workers-unified-reports">
        <ProtectedRoute>
          <AuthLayout>
            <WorkersUnifiedReports />
          </AuthLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/notifications">
        <ProtectedRoute>
          <AuthLayout>
            <NotificationsPage />
          </AuthLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/ai-system">
        <ProtectedRoute>
          <AuthLayout>
            <AISystemDashboard />
          </AuthLayout>
        </ProtectedRoute>
      </Route>


      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // تم إزالة كود DOM manipulation لتجنب الأخطاء

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <FloatingButtonProvider>
            <div className="min-h-screen bg-background text-foreground" dir="rtl">
              <Router />
              <Toaster />
            </div>
          </FloatingButtonProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
