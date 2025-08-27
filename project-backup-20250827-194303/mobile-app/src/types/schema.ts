// أنواع البيانات الموحدة مع النظام الويب - مطابقة 100%
// Re-export all types from shared schema for mobile app
export * from '../../../shared/schema';

// Additional mobile-specific types for UI components only
export interface MobileAppConfig {
  version: string;
  buildNumber: string;
  apiBaseUrl: string;
}

export interface NavigationParams {
  screen?: string;
  params?: any;
}

export interface ListItemProps {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  onPress?: () => void;
}

export interface ScreenProps {
  navigation?: any;
  route?: any;
}

// UI-specific interfaces for mobile components
export interface ProjectCardProps {
  project: any;
  onEdit: () => void;
  onDelete: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
}

export interface WorkerCardProps {
  worker: any;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

export interface SupplierCardProps {
  supplier: any;
  onEdit: () => void;
  onDelete: () => void;
}