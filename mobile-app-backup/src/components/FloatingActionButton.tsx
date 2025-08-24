import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface FloatingAction {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions: FloatingAction[];
}

export function FloatingActionButton({ actions }: FloatingActionButtonProps) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    
    Animated.spring(animation, {
      toValue,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();
    
    setIsOpen(!isOpen);
  };

  const handleActionPress = (action: FloatingAction) => {
    setIsOpen(false);
    Animated.spring(animation, {
      toValue: 0,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();
    action.onPress();
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <>
      <Modal
        transparent
        visible={isOpen}
        animationType="fade"
        onRequestClose={toggleMenu}
      >
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={toggleMenu}
        >
          <View style={styles.menuContainer}>
            {actions.map((action, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.actionItem,
                  {
                    transform: [
                      {
                        translateY: animation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -(60 * (actions.length - index))],
                        }),
                      },
                      {
                        scale: animation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
                      },
                    ],
                    opacity: animation,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { 
                      backgroundColor: action.color || colors.primary,
                      shadowColor: colors.text 
                    }
                  ]}
                  onPress={() => handleActionPress(action)}
                  activeOpacity={0.8}
                >
                  {action.icon}
                </TouchableOpacity>
                <Text style={[styles.actionLabel, { color: colors.text }]}>
                  {action.label}
                </Text>
              </Animated.View>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.text }]}
        onPress={toggleMenu}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Text style={styles.fabIcon}>+</Text>
        </Animated.View>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  fabIcon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  menuContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    alignItems: 'center',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  actionLabel: {
    marginRight: 12,
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});