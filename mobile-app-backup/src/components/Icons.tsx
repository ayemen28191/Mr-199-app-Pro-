import React from 'react';
import { Text } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  fill?: string;
}

// أيقونات مطابقة لـ Lucide React
export const Clock = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🕐</Text>
);

export const Receipt = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🧾</Text>
);

export const ShoppingCart = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🛒</Text>
);

export const BarChart = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>📊</Text>
);

export const DollarSign = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>💰</Text>
);

export const TrendingUp = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>📈</Text>
);

export const TrendingDown = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>📉</Text>
);

export const Calendar = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>📅</Text>
);

export const Package = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>📦</Text>
);

export const UserCheck = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>👤</Text>
);

export const User = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>👨</Text>
);

export const FolderPlus = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>📁</Text>
);

export const Plus = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>➕</Text>
);

export const Settings = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>⚙️</Text>
);

export const ArrowRight = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>→</Text>
);

export const MapPin = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>📍</Text>
);

export const Edit = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>✏️</Text>
);

export const Trash = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🗑️</Text>
);

export const Activity = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>📊</Text>
);

export const Building = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🏢</Text>
);

export const Phone = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>📞</Text>
);

export const CreditCard = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>💳</Text>
);

export const Hash = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>#</Text>
);

export const Search = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🔍</Text>
);

export const Filter = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🔍</Text>
);

// أيقونات إضافية مطلوبة للشاشات
export const Building2 = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🏗️</Text>
);

export const Trash2 = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🗑️</Text>
);

export const Users = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>👥</Text>
);

export const X = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>✖️</Text>
);

export const Star = ({ size = 20, color = '#000', fill }: IconProps) => (
  <Text style={{ fontSize: size, color: fill || color }}>⭐</Text>
);

export const Store = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🏪</Text>
);

export const RefreshCw = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🔄</Text>
);

export const Check = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>✅</Text>
);

export const Mail = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>✉️</Text>
);

export const Edit2 = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>✏️</Text>
);

export const Eye = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>👁️</Text>
);

export const Download = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>⬇️</Text>
);

export const FileText = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>📄</Text>
);

export const Printer = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🖨️</Text>
);

export const CheckCircle = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>✅</Text>
);

export const AlertCircle = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>⚠️</Text>
);

export const Share = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>📤</Text>
);

export const Mail = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>📧</Text>
);

export const MoreHorizontal = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>⋯</Text>
);

// أيقونات إضافية للمعدات والحضور
export const QrCode = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🔲</Text>
);

export const Move = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>↔️</Text>
);

export const Wrench = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🔧</Text>
);

export const Tool = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🛠️</Text>
);

export const Clipboard = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>📋</Text>
);

export const Database = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>💾</Text>
);

export const Zap = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>⚡</Text>
);

export const Shield = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🛡️</Text>
);

export const Camera = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>📷</Text>
);

export const Scan = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🔍</Text>
);

export const Target = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🎯</Text>
);

export const CheckCircle2 = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>✅</Text>
);

export const XCircle = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>❌</Text>
);

export const RefreshCw = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🔄</Text>
);

// أيقونات إضافية مطلوبة
export const Play = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>▶️</Text>
);

export const AlertTriangle = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>⚠️</Text>
);

export const Check = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>✓</Text>
);

// أيقونات إضافية مطلوبة لشاشة المزيد
export const Calculator = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🧮</Text>
);

export const ArrowLeftRight = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>↔️</Text>
);

export const FileSpreadsheet = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>📊</Text>
);

export const ChevronLeft = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>‹</Text>
);

// أيقونات إضافية مطلوبة للحضور والمصاريف
export const UserX = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>👤❌</Text>
);

export const Timer = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>⏱️</Text>
);

export const ClockOff = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🕐❌</Text>
);

export const Save = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>💾</Text>
);

export const Coffee = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>☕</Text>
);

export const UserPlus = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>👤➕</Text>
);

export const ArrowDown = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>↓</Text>
);

export const Car = ({ size = 20, color = '#000' }: IconProps) => (
  <Text style={{ fontSize: size, color }}>🚗</Text>
);

export const secondary = '#6b7280';