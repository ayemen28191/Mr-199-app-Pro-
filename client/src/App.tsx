import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import WorkerAttendance from "@/pages/worker-attendance";
import WorkerAccounts from "@/pages/worker-accounts";
import DailyExpenses from "@/pages/daily-expenses";
import MaterialPurchase from "@/pages/material-purchase";
import ReportsFixed from "@/pages/reports-fixed";
import ExcelStyleWorkerStatement from "@/pages/excel-style-worker-statement";
import DailyExpensesReport from "@/pages/daily-expenses-report";
import ExcelStyleDailyExpenses from "@/pages/excel-style-daily-expenses";

import ProjectsPage from "@/pages/projects";
import WorkersPage from "@/pages/workers";
import SuppliersPage from "@/pages/suppliers-fixed";
import SuppliersProPage from "@/pages/suppliers-professional";
import SupplierAccountsPage from "@/pages/supplier-accounts";
import SupplierReportPage from "@/pages/supplier-report";
import AutocompleteAdminPage from "@/pages/autocomplete-admin";
import AdvancedReports from "@/pages/advanced-reports";
import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/workers" component={WorkersPage} />
      <Route path="/suppliers" component={SuppliersPage} />
      <Route path="/suppliers-pro" component={SuppliersProPage} />
      <Route path="/supplier-accounts" component={SupplierAccountsPage} />
      <Route path="/supplier-report" component={SupplierReportPage} />
      <Route path="/worker-attendance" component={WorkerAttendance} />
      <Route path="/worker-accounts" component={WorkerAccounts} />
      <Route path="/daily-expenses" component={DailyExpenses} />
      <Route path="/material-purchase" component={MaterialPurchase} />
      <Route path="/excel-format-worker-statement" component={ExcelStyleWorkerStatement} />
      <Route path="/daily-expenses-report" component={DailyExpensesReport} />
      <Route path="/excel-style-daily-expenses" component={ExcelStyleDailyExpenses} />
      <Route path="/autocomplete-admin" component={AutocompleteAdminPage} />

      <Route path="/reports" component={ReportsFixed} />
      <Route path="/advanced-reports" component={AdvancedReports} />
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
