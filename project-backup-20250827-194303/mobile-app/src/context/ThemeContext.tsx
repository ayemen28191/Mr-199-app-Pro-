import React, { createContext, useContext, useState } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    muted: string;
    info: string;
  };
}

const lightColors = {
  primary: 'hsl(207, 90%, 54%)',      // يطابق الويب
  secondary: 'hsl(45, 100%, 51%)',     // يطابق الويب  
  background: 'hsl(0, 0%, 98%)',       // يطابق الويب
  surface: 'hsl(0, 0%, 100%)',         // يطابق الويب
  text: 'hsl(0, 0%, 9%)',              // يطابق الويب
  textSecondary: 'hsl(215, 16%, 47%)', // يطابق الويب
  border: 'hsl(214, 32%, 91%)',        // يطابق الويب
  success: 'hsl(142, 76%, 36%)',       // يطابق الويب
  warning: '#f59e0b',
  error: 'hsl(0, 84%, 60%)',           // يطابق الويب
  muted: 'hsl(210, 40%, 96%)',         // يطابق الويب
  info: '#0ea5e9',
};

const darkColors = {
  primary: 'hsl(207, 90%, 54%)',        // يطابق الويب
  secondary: 'hsl(45, 100%, 51%)',       // يطابق الويب
  background: 'hsl(240, 10%, 3.9%)',     // يطابق الويب
  surface: 'hsl(240, 10%, 3.9%)',        // يطابق الويب
  text: 'hsl(0, 0%, 98%)',               // يطابق الويب
  textSecondary: 'hsl(240, 5%, 64.9%)',  // يطابق الويب
  border: 'hsl(240, 3.7%, 15.9%)',       // يطابق الويب
  success: 'hsl(142, 76%, 36%)',         // يطابق الويب
  warning: '#f59e0b',
  error: 'hsl(0, 62%, 30%)',             // يطابق الويب
  muted: 'hsl(240, 3.7%, 15.9%)',        // يطابق الويب
  info: '#0ea5e9',
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark(!isDark);

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};