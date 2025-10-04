import { notificationService } from './notificationService';
import { supabase } from './supabase';

export interface RealtimeUpdate {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  old_record?: any;
}

export interface TransactionUpdate extends RealtimeUpdate {
  table: 'transactions';
  record: {
    id: string;
    amount: number;
    description: string;
    type: 'income' | 'expense';
    category_id?: string;
    user_id: string;
    household_id: string;
    date: string;
    created_at: string;
    updated_at: string;
  };
}

export interface BudgetUpdate extends RealtimeUpdate {
  table: 'budgets';
  record: {
    id: string;
    household_id: string;
    month: string;
    amount: number;
    created_at: string;
    updated_at: string;
  };
}

type UpdateCallback = (update: RealtimeUpdate) => void;

class RealtimeService {
  private subscriptions: Map<string, any> = new Map();
  private callbacks: Map<string, UpdateCallback[]> = new Map();

  /**
   * Subscribe to real-time updates for a specific table and household
   */
  subscribeToTable(
    table: string,
    householdId: string,
    callback: UpdateCallback,
    userId?: string
  ) {
    const subscriptionKey = `${table}_${householdId}`;
    
    // Add callback to the list
    if (!this.callbacks.has(subscriptionKey)) {
      this.callbacks.set(subscriptionKey, []);
    }
    this.callbacks.get(subscriptionKey)!.push(callback);

    // If subscription already exists, don't create a new one
    if (this.subscriptions.has(subscriptionKey)) {
      return subscriptionKey;
    }

    console.log(`Subscribing to ${table} updates for household ${householdId}`);

    const subscription = supabase
      .channel(`${table}_changes_${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          console.log(`Received ${table} update:`, payload);
          
          const update: RealtimeUpdate = {
            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            table: table,
            record: payload.new,
            old_record: payload.old,
          };

          // Notify all callbacks for this subscription
          const callbacks = this.callbacks.get(subscriptionKey) || [];
          callbacks.forEach(cb => cb(update));

          // Send local notification if it's not from current user
          if (userId && payload.new?.user_id !== userId) {
            this.sendNotificationForUpdate(update, userId);
          }
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);
    return subscriptionKey;
  }

  /**
   * Subscribe to transaction updates
   */
  subscribeToTransactions(
    householdId: string,
    callback: (update: TransactionUpdate) => void,
    userId?: string
  ) {
    return this.subscribeToTable('transactions', householdId, callback as UpdateCallback, userId);
  }

  /**
   * Subscribe to budget updates
   */
  subscribeToBudgets(
    householdId: string,
    callback: (update: BudgetUpdate) => void,
    userId?: string
  ) {
    return this.subscribeToTable('budgets', householdId, callback as UpdateCallback, userId);
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(subscriptionKey: string) {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(subscriptionKey);
      this.callbacks.delete(subscriptionKey);
      console.log(`Unsubscribed from ${subscriptionKey}`);
    }
  }

  /**
   * Unsubscribe from all updates
   */
  unsubscribeAll() {
    for (const [key, subscription] of this.subscriptions) {
      supabase.removeChannel(subscription);
    }
    this.subscriptions.clear();
    this.callbacks.clear();
    console.log('Unsubscribed from all real-time updates');
  }

  /**
   * Send notification for real-time update
   */
  private async sendNotificationForUpdate(update: RealtimeUpdate, currentUserId: string) {
    if (update.table === 'transactions' && update.record?.user_id !== currentUserId) {
      let title = '';
      let body = '';

      switch (update.type) {
        case 'INSERT':
          title = 'New Transaction Added';
          body = `${update.record.type === 'income' ? 'Income' : 'Expense'} of €${Math.abs(update.record.amount)} was added`;
          break;
        case 'UPDATE':
          title = 'Transaction Updated';
          body = `A transaction was updated to €${Math.abs(update.record.amount)}`;
          break;
        case 'DELETE':
          title = 'Transaction Deleted';
          body = 'A transaction was deleted from your household';
          break;
      }

      await notificationService.sendLocalNotification(title, body, {
        type: 'transaction_update',
        transactionId: update.record.id,
      });
    }

    if (update.table === 'budgets') {
      let title = '';
      let body = '';

      switch (update.type) {
        case 'INSERT':
          title = 'Budget Set';
          body = `Monthly budget of €${update.record.amount} was set`;
          break;
        case 'UPDATE':
          title = 'Budget Updated';
          body = `Monthly budget was updated to €${update.record.amount}`;
          break;
        case 'DELETE':
          title = 'Budget Removed';
          body = 'Monthly budget was removed';
          break;
      }

      await notificationService.sendLocalNotification(title, body, {
        type: 'budget_update',
        budgetId: update.record.id,
      });
    }
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions() {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Check if subscribed to a specific table
   */
  isSubscribedTo(table: string, householdId: string) {
    const subscriptionKey = `${table}_${householdId}`;
    return this.subscriptions.has(subscriptionKey);
  }
}

export const realtimeService = new RealtimeService();