import AddTransactionModal from '@/components/AddTransactionModal';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { supabase, Transaction } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TransactionWithCategory extends Transaction {
  categories?: {
    name: string;
    color: string;
    icon: string;
  };
}

export default function TransactionsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { household } = useHousehold();
  
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadTransactions = useCallback(async () => {
    if (!household) return;

    console.log('Loading transactions for household:', household.id);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories(name, color, icon)
        `)
        .eq('household_id', household.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Loaded transactions count:', data?.length || 0);
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [household]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Setup real-time updates for transactions
  useRealtimeUpdates({
    onTransactionUpdate: () => {
      console.log('Real-time transaction update received, reloading...');
      loadTransactions(); // Reload transactions when they change
    },
    enableNotifications: true,
  });

  const handleTransactionAdded = useCallback(() => {
    console.log('Transaction added, reloading transactions...');
    // Reset loading state to show fresh data
    setLoading(true);
    // Add a small delay to ensure database transaction is complete
    setTimeout(() => {
      loadTransactions();
    }, 100);
  }, [loadTransactions]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number, type: 'income' | 'expense') => {
    const prefix = type === 'income' ? '+' : '-';
    return `${prefix}€${amount.toFixed(2)}`;
  };

  const getTransactionIcon = (type: string, category?: { name: string; icon: string }) => {
    if (category?.icon) {
      return category.icon as any;
    }
    return type === 'income' ? 'add-circle-outline' : 'remove-circle-outline';
  };

  const TransactionItem = ({ item }: { item: TransactionWithCategory }) => (
    <View style={styles.transactionItem}>
      <View style={[
        styles.transactionIcon,
        { backgroundColor: item.categories?.color || (item.type === 'income' ? '#28A745' : '#FF3B30') }
      ]}>
        <Ionicons
          name={getTransactionIcon(item.type, item.categories)}
          size={24}
          color="white"
        />
      </View>
      
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <View style={styles.transactionMeta}>
          <Text style={styles.transactionCategory}>
            {item.categories?.name ? t(`categories.${item.categories.name}`) : t('categories.other')}
          </Text>
          <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
        </View>
      </View>
      
      <Text style={[
        styles.transactionAmount,
        { color: item.type === 'income' ? '#28A745' : '#FF3B30' }
      ]}>
        {formatAmount(item.amount, item.type)}
      </Text>
    </View>
  );  const renderTransaction = ({ item }: { item: TransactionWithCategory }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Ionicons
          name={getTransactionIcon(item.type, item.category)}
          size={24}
          color={item.type === 'income' ? '#28A745' : '#FF3B30'}
        />
      </View>
      
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <View style={styles.transactionMeta}>
          <Text style={styles.transactionCategory}>
            {t(`categories.${item.category || 'other'}`)}
          </Text>
          <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
        </View>
      </View>
      
      <Text style={[
        styles.transactionAmount,
        { color: item.type === 'income' ? '#28A745' : '#FF3B30' }
      ]}>
        {formatAmount(item.amount, item.type)}
      </Text>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>{t('transactions.noTransactions')}</Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.emptyButtonText}>{t('transactions.addTransaction')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('transactions.title')}</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      {transactions.length === 0 && !loading ? (
        <EmptyState />
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#007AFF"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <AddTransactionModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleTransactionAdded}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionCategory: {
    fontSize: 14,
    color: '#666',
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});