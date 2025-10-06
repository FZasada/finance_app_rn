import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://ompfdpahawvculeouvii.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tcGZkcGFoYXd2Y3VsZW91dmlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjkyMDEsImV4cCI6MjA3NTEwNTIwMX0.uJqab06q3j2j8FALXpKa5AmXZnZdFf8hZdVINFWmd_c';

// Check if we're in a web environment
const isWebBuild = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

// For web builds, use a simple localStorage adapter
// For native builds, use SecureStore or fallback
const storageAdapter = isWebBuild 
  ? {
      getItem: (key: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            return Promise.resolve(window.localStorage.getItem(key));
          }
        } catch (error) {
          console.warn('localStorage getItem failed:', error);
        }
        return Promise.resolve(null);
      },
      setItem: (key: string, value: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(key, value);
          }
        } catch (error) {
          console.warn('localStorage setItem failed:', error);
        }
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(key);
          }
        } catch (error) {
          console.warn('localStorage removeItem failed:', error);
        }
        return Promise.resolve();
      },
    }
  : {
      // Fallback adapter for native or when localStorage is not available
      getItem: (key: string) => Promise.resolve(null),
      setItem: (key: string, value: string) => Promise.resolve(),
      removeItem: (key: string) => Promise.resolve(),
    };

// Only import SecureStore for native platforms
let nativeAdapter = null;
if (!isWebBuild) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SecureStore = require('expo-secure-store');
    nativeAdapter = {
      getItem: (key: string) => {
        return SecureStore.getItemAsync(key).catch((error: any) => {
          console.warn('SecureStore getItem failed:', error);
          return null;
        });
      },
      setItem: (key: string, value: string) => {
        return SecureStore.setItemAsync(key, value).catch((error: any) => {
          console.warn('SecureStore setItem failed:', error);
        });
      },
      removeItem: (key: string) => {
        return SecureStore.deleteItemAsync(key).catch((error: any) => {
          console.warn('SecureStore removeItem failed:', error);
        });
      },
    };
  } catch (error) {
    console.warn('SecureStore initialization failed:', error);
    // Fallback to storageAdapter if SecureStore fails
    nativeAdapter = storageAdapter;
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: (nativeAdapter || storageAdapter) as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Household {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface Budget {
  id: string;
  household_id: string;
  amount: number;
  month: string; // YYYY-MM format
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  household_id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category_id?: string;
  date: string;
  created_at: string;
  updated_at: string;
  category?: Category; // Join relationship
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  created_at: string;
}