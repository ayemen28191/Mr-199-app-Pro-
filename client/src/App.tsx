import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import ReportTemplateSettingsEnhanced from "@/pages/report-template-settings-enhanced";
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

import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/report-template-settings-enhanced" component={ReportTemplateSettingsEnhanced} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/workers" component={WorkersPage} />
      <Route path="/worker-accounts" component={WorkerAccountsPage} />
      <Route path="/suppliers-pro" component={SuppliersProPage} />
      <Route path="/supplier-accounts" component={SupplierAccountsPage} />
      <Route path="/worker-attendance" component={WorkerAttendance} />

      <Route path="/daily-expenses" component={DailyExpenses} />
      <Route path="/material-purchase" component={MaterialPurchase} />

      <Route path="/project-transfers" component={ProjectTransfers} />
      <Route path="/project-transactions" component={ProjectTransactionsPage} />
      <Route path="/autocomplete-admin" component={AutocompleteAdminPage} />

      <Route path="/reports" component={Reports} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground" dir="rtl">
          <Header />
          <main className="pb-20">
            <Router />
          </main>
          <BottomNavigation />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
