import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import * as Icons from '../Icons';

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  style?: any;
}

export default function SearchBar({
  placeholder,
  value,
  onChangeText,
  onClear,
  style
}: SearchBarProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      <Icons.Search size={20} color={colors.textSecondary} />
      
      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        textAlign="right"
      />
      
      {value.length > 0 && onClear && (
        <TouchableOpacity onPress={onClear} style={styles.clearButton}>
          <Icons.X size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
});