import React from 'react';
import { Text } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
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

export const secondary = '#6b7280';