import { Budget, supabase, Transaction } from './supabase';

export class FinanceService {
  // Transaction methods
  static async getTransactions(householdId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        categories(name, color, icon)
      `)
      .eq('household_id', householdId)
      .order('date', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async addTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTransaction(id: string, updates: Partial<Transaction>) {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteTransaction(id: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Budget methods
  static async getBudget(householdId: string, month: string) {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('household_id', householdId)
      .eq('month', month)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  }

  static async setBudget(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('budgets')
      .upsert(budget)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Analytics methods
  static async getMonthlySpending(householdId: string, year: number, month: number) {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

    const { data, error } = await supabase
      .from('transactions')
      .select('amount, type, categories(name)')
      .eq('household_id', householdId)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;
    return data || [];
  }

  static async getMonthlyIncome(householdId: string, year: number, month: number) {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('household_id', householdId)
      .eq('type', 'income')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;
    return data || [];
  }

  static async getCategorySpending(householdId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        amount,
        categories(name, color)
      `)
      .eq('household_id', householdId)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;
    return data || [];
  }

  // Weekly spending for charts
  static async getWeeklySpending(householdId: string, weeks: number = 4) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (weeks * 7));

    const { data, error } = await supabase
      .from('transactions')
      .select('amount, date')
      .eq('household_id', householdId)
      .eq('type', 'expense')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Categories
  static async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  // Household members
  static async getHouseholdMembers(householdId: string) {
    const { data, error } = await supabase
      .from('household_members')
      .select(`
        *,
        profiles:user_id(email)
      `)
      .eq('household_id', householdId);

    if (error) throw error;
    return data || [];
  }

  // Utility methods
  static getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  static formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  static calculateBudgetPercentage(spent: number, budget: number): number {
    if (budget === 0) return 0;
    return (spent / budget) * 100;
  }

  static calculateSavings(income: number, expenses: number): number {
    return income - expenses;
  }
}