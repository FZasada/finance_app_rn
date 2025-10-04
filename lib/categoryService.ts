import type { Category } from './supabase';
import { supabase } from './supabase';

export const categoryService = {
  // Hole alle Kategorien eines bestimmten Typs
  async getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
    let query = supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
    
    return data || [];
  },

  // Erstelle eine neue Kategorie
  async createCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      throw error;
    }

    return data;
  },

  // Standard-Kategorien initialisieren (falls noch nicht vorhanden)
  async initializeDefaultCategories(): Promise<void> {
    const existingCategories = await this.getCategories();
    
    if (existingCategories.length > 0) {
      return; // Kategorien existieren bereits
    }

    const defaultCategories = [
      // Expense categories
      { name: 'groceries', type: 'expense' as const, color: '#FF6B6B', icon: 'basket' },
      { name: 'transport', type: 'expense' as const, color: '#4ECDC4', icon: 'car' },
      { name: 'entertainment', type: 'expense' as const, color: '#45B7D1', icon: 'game-controller' },
      { name: 'utilities', type: 'expense' as const, color: '#FFA07A', icon: 'flash' },
      { name: 'healthcare', type: 'expense' as const, color: '#98D8C8', icon: 'medical' },
      { name: 'shopping', type: 'expense' as const, color: '#F7DC6F', icon: 'bag' },
      { name: 'restaurant', type: 'expense' as const, color: '#BB8FCE', icon: 'restaurant' },
      { name: 'education', type: 'expense' as const, color: '#85C1E9', icon: 'school' },
      { name: 'other_expense', type: 'expense' as const, color: '#B0B0B0', icon: 'ellipsis-horizontal' },
      
      // Income categories
      { name: 'salary', type: 'income' as const, color: '#52C41A', icon: 'cash' },
      { name: 'freelance', type: 'income' as const, color: '#1890FF', icon: 'laptop' },
      { name: 'investment', type: 'income' as const, color: '#722ED1', icon: 'trending-up' },
      { name: 'business', type: 'income' as const, color: '#13C2C2', icon: 'business' },
      { name: 'gift', type: 'income' as const, color: '#EB2F96', icon: 'gift' },
      { name: 'other_income', type: 'income' as const, color: '#52C41A', icon: 'add-circle' },
    ];

    try {
      await Promise.all(
        defaultCategories.map(category => this.createCategory(category))
      );
    } catch (error) {
      console.error('Error initializing default categories:', error);
      throw error;
    }
  }
};