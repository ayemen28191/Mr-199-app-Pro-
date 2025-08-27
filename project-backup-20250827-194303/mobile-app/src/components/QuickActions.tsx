import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import * as Icons from './Icons';

interface QuickAction {
  icon: React.ComponentType<any>;
  label: string;
  bgColor: string;
  action: () => void;
}

interface QuickActionsProps {
  onNavigate: (route: string) => void;
}

export default function QuickActions({ onNavigate }: QuickActionsProps) {
  const { colors } = useTheme();

  const quickActions: QuickAction[] = [
    {
      icon: Icons.Clock,
      label: "تسجيل حضور",
      bgColor: colors.primary,
      action: () => onNavigate("/worker-attendance"),
    },
    {
      icon: Icons.Receipt,
      label: "مصروفات يومية", 
      bgColor: colors.secondary,
      action: () => onNavigate("/daily-expenses"),
    },
    {
      icon: Icons.ShoppingCart,
      label: "شراء مواد",
      bgColor: colors.success,
      action: () => onNavigate("/material-purchase"),
    },
    {
      icon: Icons.BarChart,
      label: "التقارير",
      bgColor: '#9333ea',
      action: () => onNavigate("/reports"),
    },
    {
      icon: Icons.ArrowRight,
      label: "ترحيل أموال",
      bgColor: '#ea580c',
      action: () => onNavigate("/project-transfers"),
    },
    {
      icon: Icons.Settings,
      label: "إعدادات القوالب",
      bgColor: '#4338ca',
      action: () => onNavigate("/report-template-settings-enhanced"),
    },
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>إجراءات سريعة</Text>
      <View style={styles.actionsGrid}>
        {quickActions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.actionButton, { backgroundColor: action.bgColor }]}
              onPress={action.action}
              activeOpacity={0.8}
            >
              <IconComponent size={24} color="#ffffff" />
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'right',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 80,
  },
  actionLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});