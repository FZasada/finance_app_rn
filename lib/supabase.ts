import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://ompfdpahawvculeouvii.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tcGZkcGFoYXd2Y3VsZW91dmlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjkyMDEsImV4cCI6MjA3NTEwNTIwMX0.uJqab06q3j2j8FALXpKa5AmXZnZdFf8hZdVINFWmd_c';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter as any,
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