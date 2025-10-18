import { useTheme } from '@/contexts/ThemeContext';

/**
 * Hook that provides dynamic styles based on the current theme
 */
export const useThemedStyles = () => {
  const { colors, isDark } = useTheme();

  return {
    // Container styles
    container: {
      backgroundColor: colors.background,
    },
    surface: {
      backgroundColor: colors.surface,
    },
    card: {
      backgroundColor: colors.card,
      shadowColor: colors.shadow,
    },
    
    // Text styles
    text: {
      color: colors.text,
    },
    textSecondary: {
      color: colors.textSecondary,
    },
    
    // Input styles
    input: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      color: colors.text,
    },
    
    // Button styles
    primaryButton: {
      backgroundColor: colors.tint,
    },
    secondaryButton: {
      backgroundColor: colors.surfaceSecondary,
    },
    
    // Modal styles
    modalOverlay: {
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: colors.surface,
    },
    
    // Header styles
    header: {
      backgroundColor: colors.tint,
    },
    
    // Border styles
    border: {
      borderColor: colors.border,
    },
    borderSecondary: {
      borderColor: colors.borderSecondary,
    },
    
    // Status colors
    success: {
      color: colors.success,
    },
    error: {
      color: colors.error,
    },
    warning: {
      color: colors.warning,
    },
    info: {
      color: colors.info,
    },
    
    // Icon styles
    icon: {
      color: colors.icon,
    },
    iconSecondary: {
      color: colors.iconSecondary,
    },
  };
};