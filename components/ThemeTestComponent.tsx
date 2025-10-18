import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface ThemeTestComponentProps {
  title?: string;
}

export const ThemeTestComponent: React.FC<ThemeTestComponentProps> = ({ title = "Theme Test" }) => {
  const { colors, isDark, theme } = useTheme();
  const themedStyles = useThemedStyles();

  return (
    <View style={[styles.container, themedStyles.surface, themedStyles.border, { borderWidth: 1 }]}>
      <Text style={[styles.title, themedStyles.text]}>{title}</Text>
      <Text style={[styles.subtitle, themedStyles.textSecondary]}>
        Current theme: {theme} ({isDark ? 'Dark' : 'Light'})
      </Text>
      
      <View style={[styles.colorRow]}>
        <View style={[styles.colorBox, { backgroundColor: colors.tint }]} />
        <Text style={[styles.colorLabel, themedStyles.text]}>Primary</Text>
      </View>
      
      <View style={[styles.colorRow]}>
        <View style={[styles.colorBox, { backgroundColor: colors.surface }]} />
        <Text style={[styles.colorLabel, themedStyles.text]}>Surface</Text>
      </View>
      
      <View style={[styles.colorRow]}>
        <View style={[styles.colorBox, { backgroundColor: colors.background }]} />
        <Text style={[styles.colorLabel, themedStyles.text]}>Background</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 8,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 8,
  },
  colorLabel: {
    fontSize: 14,
  },
});