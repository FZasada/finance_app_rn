import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { notificationService } from '@/lib/notificationService';
import { BudgetUpdate, realtimeService, TransactionUpdate } from '@/lib/realtimeService';
import { useEffect, useRef } from 'react';

interface UseRealtimeUpdatesOptions {
  onTransactionUpdate?: (update: TransactionUpdate) => void;
  onBudgetUpdate?: (update: BudgetUpdate) => void;
  enableNotifications?: boolean;
}

export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions = {}) {
  const { user } = useAuth();
  const { household } = useHousehold();
  const subscriptionsRef = useRef<string[]>([]);
  const {
    onTransactionUpdate,
    onBudgetUpdate,
    enableNotifications = true,
  } = options;

  useEffect(() => {
    if (!user || !household) return;

    // Initialize notifications if enabled
    if (enableNotifications) {
      notificationService.initialize().then(() => {
        notificationService.registerPushToken(user.id);
      });
    }

    // Subscribe to transaction updates
    if (onTransactionUpdate) {
      const transactionSub = realtimeService.subscribeToTransactions(
        household.id,
        (update: TransactionUpdate) => {
          onTransactionUpdate(update);
          
          // Send notification if not from current user and notifications are enabled
          if (enableNotifications && update.record.user_id !== user.id) {
            const isIncome = update.record.type === 'income';
            const amount = Math.abs(update.record.amount);
            
            let title = '';
            let body = '';
            
            switch (update.type) {
              case 'INSERT':
                title = isIncome ? '💰 New Income Added' : '💸 New Expense Added';
                body = `€${amount} - ${update.record.description || 'No description'}`;
                break;
              case 'UPDATE':
                title = '✏️ Transaction Updated';
                body = `Updated to €${amount} - ${update.record.description || 'No description'}`;
                break;
              case 'DELETE':
                title = '🗑️ Transaction Deleted';
                body = 'A transaction was removed from your household';
                break;
            }
            
            notificationService.sendLocalNotification(title, body, {
              transactionId: update.record.id,
              type: 'transaction_update',
            });
          }
        },
        user.id
      );
      subscriptionsRef.current.push(transactionSub);
    }

    // Subscribe to budget updates
    if (onBudgetUpdate) {
      const budgetSub = realtimeService.subscribeToBudgets(
        household.id,
        (update: BudgetUpdate) => {
          onBudgetUpdate(update);
          
          // Send notification if budget changes and notifications are enabled
          if (enableNotifications) {
            let title = '';
            let body = '';
            
            switch (update.type) {
              case 'INSERT':
                title = '📊 Budget Set';
                body = `Monthly budget of €${update.record.amount} was set`;
                break;
              case 'UPDATE':
                title = '📊 Budget Updated';
                body = `Monthly budget updated to €${update.record.amount}`;
                break;
              case 'DELETE':
                title = '📊 Budget Removed';
                body = 'Monthly budget was removed';
                break;
            }
            
            notificationService.sendLocalNotification(title, body, {
              budgetId: update.record.id,
              type: 'budget_update',
            });
          }
        },
        user.id
      );
      subscriptionsRef.current.push(budgetSub);
    }

    // Cleanup function
    return () => {
      subscriptionsRef.current.forEach(sub => {
        realtimeService.unsubscribe(sub);
      });
      subscriptionsRef.current = [];
    };
  }, [user, household, onTransactionUpdate, onBudgetUpdate, enableNotifications]);

  // Return utility functions
  return {
    isConnected: user && household,
    activeSubscriptions: subscriptionsRef.current.length,
  };
}