/**
 * 🎨 Design Tokens الموحدة - استخراج دقيق من تطبيق الويب
 * تطابق 100% مع client/src/index.css
 */

export const designTokens = {
  // ألوان النظام - مطابقة تماماً للويب
  colors: {
    // Light Mode Colors
    light: {
      background: 'hsl(0, 0%, 98%)',
      foreground: 'hsl(0, 0%, 9%)',
      muted: 'hsl(210, 40%, 96%)',
      mutedForeground: 'hsl(215, 16%, 47%)',
      popover: 'hsl(0, 0%, 100%)',
      popoverForeground: 'hsl(0, 0%, 9%)',
      card: 'hsl(0, 0%, 100%)',
      cardForeground: 'hsl(0, 0%, 9%)',
      border: 'hsl(214, 32%, 91%)',
      input: 'hsl(214, 32%, 91%)',
      primary: 'hsl(207, 90%, 54%)',
      primaryForeground: 'hsl(210, 40%, 98%)',
      secondary: 'hsl(45, 100%, 51%)',
      secondaryForeground: 'hsl(0, 0%, 9%)',
      accent: 'hsl(210, 40%, 96%)',
      accentForeground: 'hsl(0, 0%, 9%)',
      destructive: 'hsl(0, 84%, 60%)',
      destructiveForeground: 'hsl(210, 40%, 98%)',
      success: 'hsl(142, 76%, 36%)',
      successForeground: 'hsl(355, 7%, 97%)',
      ring: 'hsl(215, 20%, 65%)',
    },
    
    // Dark Mode Colors
    dark: {
      background: 'hsl(240, 10%, 3.9%)',
      foreground: 'hsl(0, 0%, 98%)',
      muted: 'hsl(240, 3.7%, 15.9%)',
      mutedForeground: 'hsl(240, 5%, 64.9%)',
      popover: 'hsl(240, 10%, 3.9%)',
      popoverForeground: 'hsl(0, 0%, 98%)',
      card: 'hsl(240, 10%, 3.9%)',
      cardForeground: 'hsl(0, 0%, 98%)',
      border: 'hsl(240, 3.7%, 15.9%)',
      input: 'hsl(240, 3.7%, 15.9%)',
      primary: 'hsl(207, 90%, 54%)',
      primaryForeground: 'hsl(210, 40%, 98%)',
      secondary: 'hsl(45, 100%, 51%)',
      secondaryForeground: 'hsl(0, 0%, 9%)',
      accent: 'hsl(240, 3.7%, 15.9%)',
      accentForeground: 'hsl(0, 0%, 98%)',
      destructive: 'hsl(0, 62%, 30%)',
      destructiveForeground: 'hsl(0, 0%, 98%)',
      success: 'hsl(142, 76%, 36%)',
      successForeground: 'hsl(355, 7%, 97%)',
      ring: 'hsl(240, 4.9%, 83.9%)',
    },
    
    // Mobile-specific gradient colors
    gradients: {
      green: ['#d4fdd4', '#a7f3d0'],
      red: ['#fee2e2', '#fecaca'],
      purple: ['#ede9fe', '#ddd6fe'],
      blue: ['#dbeafe', '#bfdbfe'],
      orange: ['#fed7aa', '#fdba74'],
    }
  },

  // Typography - خط Cairo مطابق للويب
  typography: {
    fontFamily: {
      primary: 'Cairo',
      fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      web: "'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    },
    fontWeights: {
      light: '300',
      normal: '400',
      medium: '500',
      semiBold: '600',
      bold: '700',
    },
    fontSizes: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
    },
    lineHeights: {
      tight: '1.2',
      normal: '1.4',
      relaxed: '1.5',
      loose: '1.6',
    }
  },

  // Spacing - مطابقة Tailwind
  spacing: {
    0: 0,
    1: 4,    // 0.25rem
    2: 8,    // 0.5rem
    3: 12,   // 0.75rem
    4: 16,   // 1rem
    5: 20,   // 1.25rem
    6: 24,   // 1.5rem
    8: 32,   // 2rem
    10: 40,  // 2.5rem
    12: 48,  // 3rem
    16: 64,  // 4rem
    20: 80,  // 5rem
    24: 96,  // 6rem
    32: 128, // 8rem
  },

  // Border Radius
  borderRadius: {
    none: 0,
    sm: 2,
    default: 4,
    md: 6,
    lg: 8,
    xl: 12,    // 0.75rem - مطابق للويب
    full: 9999,
  },

  // Shadows - تحويل box-shadow للـ React Native
  shadows: {
    sm: {
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      elevation: 1,
    },
    default: {
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      elevation: 2,
    },
    md: {
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      elevation: 4,
    },
    lg: {
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 16,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      elevation: 8,
    },
    xl: {
      shadowOffset: { width: 0, height: 12 },
      shadowRadius: 24,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      elevation: 12,
    },
  },

  // Animation Durations
  animations: {
    duration: {
      fast: 150,
      normal: 200,
      slow: 300,
      slower: 600,
    },
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // ease-out
  },

  // Breakpoints for responsive design
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },

  // Z-index layers
  zIndex: {
    hide: -1,
    auto: 0,
    base: 1,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },

  // Component-specific sizes
  sizes: {
    button: {
      sm: { height: 36, paddingHorizontal: 12 },
      default: { height: 40, paddingHorizontal: 16 },
      lg: { height: 44, paddingHorizontal: 32 },
      icon: { width: 40, height: 40 },
    },
    input: {
      sm: { height: 36 },
      default: { height: 40 },
      lg: { height: 44 },
    },
    card: {
      padding: 24,
      borderRadius: 12,
    },
    touch: {
      minHeight: 44, // iOS Human Interface Guidelines
      minWidth: 44,
    }
  },
} as const;

// Type exports للـ TypeScript
export type ColorTheme = typeof designTokens.colors.light;
export type ColorKey = keyof ColorTheme;
export type SpacingKey = keyof typeof designTokens.spacing;
export type FontSizeKey = keyof typeof designTokens.typography.fontSizes;
export type BorderRadiusKey = keyof typeof designTokens.borderRadius;
export type ShadowKey = keyof typeof designTokens.shadows;

// Helper functions للألوان
export const getColor = (theme: 'light' | 'dark', color: ColorKey): string => {
  return designTokens.colors[theme][color];
};

// Helper function للمسافات
export const getSpacing = (size: SpacingKey): number => {
  return designTokens.spacing[size];
};

// Default export
export default designTokens;