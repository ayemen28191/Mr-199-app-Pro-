// أنواع البيانات للتقارير الموحدة
export type ReportType = 'worker_statement' | 'daily_expenses' | 'project_summary' | 'supplier_statement';

export interface ReportHeader {
  title: string;
  subtitle?: string;
  projectName?: string;
  workerName?: string;
  dateRange?: string;
}

export interface ReportData {
  [key: string]: any;
}