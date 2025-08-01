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
import MultiProjectWorkers from "@/pages/multi-project-workers";
import WorkerStatementReport from "@/pages/worker-statement-simple";
import EnhancedWorkerStatement from "@/pages/enhanced-worker-statement";
import ExcelStyleWorkerStatement from "@/pages/excel-style-worker-statement";
import ExcelFormatWorkerStatement from "@/pages/excel-style-worker-statement";
import WorkerStatementExcelStyle from "@/pages/worker-statement-excel-style";

import ProjectsPage from "@/pages/projects";
import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/worker-attendance" component={WorkerAttendance} />
      <Route path="/worker-accounts" component={WorkerAccounts} />
      <Route path="/daily-expenses" component={DailyExpenses} />
      <Route path="/material-purchase" component={MaterialPurchase} />
      <Route path="/multi-project-workers" component={MultiProjectWorkers} />
      <Route path="/worker-statement" component={WorkerStatementReport} />
      <Route path="/enhanced-worker-statement" component={EnhancedWorkerStatement} />
      <Route path="/excel-worker-statement" component={ExcelStyleWorkerStatement} />
      <Route path="/excel-format-worker-statement" component={ExcelFormatWorkerStatement} />
      <Route path="/worker-statement-excel" component={WorkerStatementExcelStyle} />

      <Route path="/reports" component={ReportsFixed} />
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
