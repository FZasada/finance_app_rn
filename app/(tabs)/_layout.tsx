import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { user, loading } = useAuth();
  const colorScheme = useColorScheme();
  
  // Always call the hook, but handle errors gracefully
  const { t } = useTranslation();
  
  // Safe translation function with fallbacks
  const translate = (key: string) => {
    try {
      const translation = t(key);
      if (translation && translation !== key) {
        return translation;
      }
    } catch (error) {
      console.warn('Translation error for key:', key, error);
    }
    
    // Fallback translations
    const fallbacks: Record<string, string> = {
      'navigation.dashboard': 'Dashboard',
      'navigation.transactions': 'Transactions',
      'navigation.household': 'Household',
      'navigation.settings': 'Settings',
    };
    return fallbacks[key] || key;
  };

  if (loading) {
    return null; // or a loading component
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: translate('navigation.dashboard'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: translate('navigation.transactions'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'list' : 'list-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="household"
        options={{
          title: translate('navigation.household'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: translate('navigation.settings'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
