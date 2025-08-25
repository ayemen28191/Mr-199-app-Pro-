export const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000/api' 
    : 'https://your-production-domain.com/api',
  TIMEOUT: 10000, // 10 seconds
};

export const COLORS = {
  PRIMARY: '#2563eb',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',
};

export const SCREEN_NAMES = {
  DASHBOARD: 'DashboardScreen',
  PROJECTS: 'ProjectsScreen',
  WORKERS: 'WorkersScreen',
  SUPPLIERS: 'SuppliersScreen',
  MORE: 'MoreScreen',
  WORKER_ATTENDANCE: 'WorkerAttendanceScreen',
  DAILY_EXPENSES: 'DailyExpensesScreen',
  MATERIAL_PURCHASE: 'MaterialPurchaseScreen',
  EQUIPMENT: 'EquipmentManagementScreen',
  REPORTS: 'ReportsScreen',
  ADVANCED_REPORTS: 'AdvancedReportsScreen',
  WORKER_ACCOUNTS: 'WorkerAccountsScreen',
  PROJECT_TRANSFERS: 'ProjectTransfers',
  AUTOCOMPLETE_ADMIN: 'AutocompleteAdminScreen',
  NOT_FOUND: 'NotFoundScreen',
} as const;

export const ANIMATION_DURATION = 300;
export const DEBOUNCE_DELAY = 300;
export const REFRESH_THRESHOLD = 100;