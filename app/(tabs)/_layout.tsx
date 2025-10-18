import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { user, loading } = useAuth();
  
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
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#64748B',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 0.5,
          borderTopColor: '#E2E8F0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
          shadowColor: '#64748B',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 4,
        },
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
        name="settings"
        options={{
          title: translate('navigation.settings'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="household"
        options={{
          href: null, // Versteckt den Tab, aber behält die Route bei
        }}
      />
    </Tabs>
  );
}
