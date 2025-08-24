import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import * as Icons from './Icons';

interface AutocompleteData {
  id: string;
  category: string;
  value: string;
  usageCount: number;
}

interface AutocompleteInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  category: string;
  multiline?: boolean;
  numberOfLines?: number;
  style?: any;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  editable?: boolean;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChangeText,
  placeholder,
  category,
  multiline = false,
  numberOfLines = 1,
  style,
  keyboardType = 'default',
  editable = true,
}) => {
  const { colors } = useTheme();
  const [suggestions, setSuggestions] = useState<AutocompleteData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // تحميل اقتراحات من autocomplete_data
  const loadSuggestions = async (searchText: string) => {
    if (!searchText.trim() || searchText.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/autocomplete?category=${category}&query=${encodeURIComponent(searchText)}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.slice(0, 10)); // أظهر أول 10 اقتراحات
        setShowSuggestions(data.length > 0);
      }
    } catch (error) {
      console.error('خطأ في تحميل الاقتراحات:', error);
    } finally {
      setLoading(false);
    }
  };

  // حفظ القيمة في autocomplete_data عند الانتهاء
  const saveAutocompleteValue = async (valueToSave: string) => {
    if (!valueToSave.trim()) return;
    
    try {
      await fetch('/api/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          category, 
          value: valueToSave.trim() 
        })
      });
    } catch (error) {
      console.error('خطأ في حفظ القيمة:', error);
    }
  };

  const handleTextChange = (text: string) => {
    onChangeText(text);
    loadSuggestions(text);
  };

  const selectSuggestion = (suggestion: AutocompleteData) => {
    onChangeText(suggestion.value);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleBlur = () => {
    // حفظ القيمة عند فقدان التركيز
    setTimeout(() => {
      setShowSuggestions(false);
      if (value.trim()) {
        saveAutocompleteValue(value);
      }
    }, 150); // تأخير صغير للسماح بالنقر على الاقتراحات
  };

  const renderSuggestion = ({ item }: { item: AutocompleteData }) => (
    <TouchableOpacity
      style={[styles.suggestionItem, { 
        backgroundColor: colors.surface, 
        borderBottomColor: colors.border 
      }]}
      onPress={() => selectSuggestion(item)}
    >
      <View style={styles.suggestionContent}>
        <Text style={[styles.suggestionText, { color: colors.text }]}>
          {item.value}
        </Text>
        <View style={styles.suggestionMeta}>
          <Text style={[styles.usageCount, { color: colors.textSecondary }]}>
            {item.usageCount} مرة
          </Text>
          <Icons.Clock size={12} color={colors.textSecondary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          multiline ? styles.textArea : styles.input,
          { 
            backgroundColor: colors.background, 
            color: colors.text, 
            borderColor: colors.border 
          },
          style
        ]}
        value={value}
        onChangeText={handleTextChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        editable={editable}
        textAlign="right"
      />
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      {/* عرض الاقتراحات */}
      <Modal
        visible={showSuggestions && suggestions.length > 0}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuggestions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSuggestions(false)}
        >
          <View style={[styles.suggestionsContainer, { backgroundColor: colors.background }]}>
            <View style={styles.suggestionsHeader}>
              <Text style={[styles.suggestionsTitle, { color: colors.text }]}>
                اقتراحات {category}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowSuggestions(false)}
                style={styles.closeButton}
              >
                <Icons.X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={suggestions}
              renderItem={renderSuggestion}
              keyExtractor={(item) => item.id}
              maxHeight={300}
              showsVerticalScrollIndicator={true}
              style={styles.suggestionsList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  loadingContainer: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsContainer: {
    width: '90%',
    maxHeight: 400,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    borderBottomWidth: 1,
  },
  suggestionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  suggestionText: {
    fontSize: 14,
    flex: 1,
  },
  suggestionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  usageCount: {
    fontSize: 12,
  },
});

export default AutocompleteInput;