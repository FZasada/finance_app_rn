import type { Transaction } from './supabase';
import { supabase } from './supabase';

export const transactionService = {
  // Hole Transaktionen für einen Haushalt mit Kategorie-Informationen
  async getTransactions(householdId?: string): Promise<Transaction[]> {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        category:categories(*)
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (householdId) {
      query = query.eq('household_id', householdId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
    
    return data || [];
  },

  // Erstelle eine neue Transaktion
  async createTransaction(transaction: {
    household_id?: string;
    user_id: string;
    type: 'income' | 'expense';
    amount: number;
    description: string;
    category_id?: string;
    date: string;
  }): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select(`
        *,
        category:categories(*)
      `)
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }

    return data;
  },

  // Hole Transaktionen für einen bestimmten Monat
  async getTransactionsForMonth(year: number, month: number, householdId?: string): Promise<Transaction[]> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

    let query = supabase
      .from('transactions')
      .select(`
        *,
        category:categories(*)
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (householdId) {
      query = query.eq('household_id', householdId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching monthly transactions:', error);
      throw error;
    }
    
    return data || [];
  },

  // Berechne Ausgaben-Statistiken nach Kategorie
  async getExpensesByCategory(year: number, month: number, householdId?: string): Promise<{
    categoryName: string;
    amount: number;
    color: string;
    percentage: number;
  }[]> {
    const transactions = await this.getTransactionsForMonth(year, month, householdId);
    const expenses = transactions.filter(t => t.type === 'expense');
    
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    if (totalExpenses === 0) return [];

    const categoryMap = new Map<string, { amount: number; color: string; name: string }>();
    
    expenses.forEach(transaction => {
      const categoryName = transaction.category?.name || 'other';
      const categoryColor = transaction.category?.color || '#B0B0B0';
      const displayName = transaction.category?.name || 'Other';
      
      if (categoryMap.has(categoryName)) {
        categoryMap.get(categoryName)!.amount += transaction.amount;
      } else {
        categoryMap.set(categoryName, {
          amount: transaction.amount,
          color: categoryColor,
          name: displayName
        });
      }
    });

    return Array.from(categoryMap.entries()).map(([_, data]) => ({
      categoryName: data.name,
      amount: data.amount,
      color: data.color,
      percentage: (data.amount / totalExpenses) * 100
    })).sort((a, b) => b.amount - a.amount);
  },

  // Berechne Einnahmen vs Ausgaben für einen Monat
  async getIncomeVsExpenses(year: number, month: number, householdId?: string): Promise<{
    income: number;
    expenses: number;
    balance: number;
  }> {
    const transactions = await this.getTransactionsForMonth(year, month, householdId);
    
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses
    };
  },

  /**
   * Get weekly expenses for the current week
   */
  async getWeeklyExpenses(userId: string, householdId: string) {
    // Get the start of current week (Monday)
    const now = new Date();
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? 6 : currentDay - 1; // Sunday = 0, so Sunday becomes 6 days after Monday
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('amount, date')
      .eq('user_id', userId)
      .eq('household_id', householdId)
      .eq('type', 'expense')
      .gte('date', startOfWeek.toISOString())
      .lte('date', endOfWeek.toISOString())
      .order('date');

    if (error) {
      console.error('Error fetching weekly expenses:', error);
      return [];
    }

    // Initialize array for each day of the week
    const weeklyData = [
      { day: 'Mo', amount: 0 },
      { day: 'Di', amount: 0 },
      { day: 'Mi', amount: 0 },
      { day: 'Do', amount: 0 },
      { day: 'Fr', amount: 0 },
      { day: 'Sa', amount: 0 },
      { day: 'So', amount: 0 },
    ];

    // Group transactions by day of week
    transactions?.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      const dayOfWeek = transactionDate.getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday=0 to index 6
      weeklyData[adjustedDay].amount += Math.abs(transaction.amount);
    });

    return weeklyData;
  }
};