import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'teal' | 'indigo' | 'emerald' | 'amber';
  formatter?: (value: number) => string;
}

const colorVariants = {
  blue: {
    border: '#2563eb',
    text: '#2563eb',
    bg: '#eff6ff',
    iconBg: '#dbeafe',
    iconColor: '#2563eb'
  },
  green: {
    border: '#16a34a',
    text: '#16a34a',
    bg: '#f0fdf4',
    iconBg: '#dcfce7',
    iconColor: '#16a34a'
  },
  orange: {
    border: '#ea580c',
    text: '#ea580c',
    bg: '#fff7ed',
    iconBg: '#fed7aa',
    iconColor: '#ea580c'
  },
  red: {
    border: '#dc2626',
    text: '#dc2626',
    bg: '#fef2f2',
    iconBg: '#fecaca',
    iconColor: '#dc2626'
  },
  purple: {
    border: '#9333ea',
    text: '#9333ea',
    bg: '#faf5ff',
    iconBg: '#e9d5ff',
    iconColor: '#9333ea'
  },
  teal: {
    border: '#0d9488',
    text: '#0d9488',
    bg: '#f0fdfa',
    iconBg: '#ccfbf1',
    iconColor: '#0d9488'
  },
  indigo: {
    border: '#4338ca',
    text: '#4338ca',
    bg: '#eef2ff',
    iconBg: '#c7d2fe',
    iconColor: '#4338ca'
  },
  emerald: {
    border: '#059669',
    text: '#059669',
    bg: '#ecfdf5',
    iconBg: '#a7f3d0',
    iconColor: '#059669'
  },
  amber: {
    border: '#d97706',
    text: '#d97706',
    bg: '#fffbeb',
    iconBg: '#fde68a',
    iconColor: '#d97706'
  }
};

export function StatsCard({ 
  title, 
  value, 
  icon, 
  color = 'blue', 
  formatter 
}: StatsCardProps) {
  const { colors: themeColors, isDark } = useTheme();
  const colors = colorVariants[color] || colorVariants.blue; // fallback للأمان
  const displayValue = typeof value === 'number' && formatter ? formatter(value) : value.toString();
  
  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: isDark ? themeColors.surface : colors.bg,
        borderLeftColor: colors.border,
        shadowColor: themeColors.text
      }
    ]}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: themeColors.textSecondary }]}>
            {title}
          </Text>
          <Text style={[styles.value, { color: isDark ? themeColors.text : colors.text }]}>
            {displayValue}
          </Text>
        </View>
        <View style={[
          styles.iconContainer, 
          { backgroundColor: isDark ? colors.border + '40' : colors.iconBg }
        ]}>
          {icon}
        </View>
      </View>
    </View>
  );
}

export function StatsGrid({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.grid}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 6,
    width: '45%',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
});