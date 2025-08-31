/**
 * 🎨 useTheme Hook - إدارة موحدة للثيم
 */

import { useState, useEffect, createContext, useContext } from 'react';
import { Appearance } from 'react-native';
import { designTokens } from '@mobile/tokens/design-tokens';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  colors: typeof designTokens.colors.light;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return default values if no context provider
    const isDark = Appearance.getColorScheme() === 'dark';
    return {
      theme: 'system' as Theme,
      isDark,
      setTheme: () => {},
      colors: designTokens.colors[isDark ? 'dark' : 'light'],
    };
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('system');
  const [systemColorScheme, setSystemColorScheme] = useState(Appearance.getColorScheme());

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
  const colors = designTokens.colors[isDark ? 'dark' : 'light'];

  const value: ThemeContextType = {
    theme,
    isDark,
    setTheme,
    colors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};