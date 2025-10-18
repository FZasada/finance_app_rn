import AddTransactionModal from '@/components/AddTransactionModal';
import CollapsibleMonthSection from '@/components/CollapsibleMonthSection';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { supabase, Transaction } from '@/lib/supabase';
import { transactionService } from '@/lib/transactionService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Animated,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TransactionWithCategory extends Omit<Transaction, 'category'> {
  category?: {
    name: string;
    color: string;
    icon: string;
  };
}

export default function TransactionsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { household } = useHousehold();
  const { getCurrencySymbol } = useCurrency();
  
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Animation values for collapsible header
  const scrollY = new Animated.Value(0);
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [80, 44], // Minimaler kollabierter Header für beste UX
    extrapolate: 'clamp',
  });
  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [1, 0], // Großer Titel verschwindet
    extrapolate: 'clamp',
  });
  const addButtonOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [1, 0], // Add-Button verschwindet
    extrapolate: 'clamp',
  });
  const compactTitleOpacity = scrollY.interpolate({
    inputRange: [40, 80],
    outputRange: [0, 1], // Kompakter Titel erscheint
    extrapolate: 'clamp',
  });
  
  // Dynamisches Padding für minimalen kollabierten Header
  const headerPaddingTop = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [10, 0], // Padding verschwindet im kollabierten Zustand
    extrapolate: 'clamp',
  });
  const headerPaddingBottom = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [15, 0], // Padding verschwindet im kollabierten Zustand
    extrapolate: 'clamp',
  });

  const loadTransactions = useCallback(async () => {
    if (!household) return;

    console.log('Loading transactions for household:', household.id);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(name, color, icon)
        `)
        .eq('household_id', household.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Loaded transactions count:', data?.length || 0);
      console.log('Sample transaction with category:', data?.[0] ? {
        id: data[0].id,
        description: data[0].description,
        category_id: data[0].category_id,
        category: data[0].category
      } : 'No transactions');
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

  // Reload transactions when the screen is focused (user returns to this tab)
  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

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

  const handleDeleteTransaction = useCallback(async (transactionId: string, description: string) => {
    Alert.alert(
      t('transactions.deleteConfirmTitle'),
      t('transactions.deleteConfirmMessage', { description }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await transactionService.deleteTransaction(transactionId);
              loadTransactions(); // Reload transactions after deletion
            } catch (error) {
              Alert.alert(
                t('common.error'),
                t('transactions.deleteError')
              );
            }
          },
        },
      ]
    );
  }, [loadTransactions, t]);

  // Group transactions by month and year
  const groupedTransactions = useCallback(() => {
    const groups: { [key: string]: {
      month: string;
      year: number;
      transactions: TransactionWithCategory[];
      totalAmount: number;
    } } = {};

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const key = `${year}-${month}`;

      if (!groups[key]) {
        groups[key] = {
          month,
          year,
          transactions: [],
          totalAmount: 0,
        };
      }

      groups[key].transactions.push(transaction);
      // Calculate net amount (income - expenses)
      const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      groups[key].totalAmount += amount;
    });

    // Convert to array and sort by date (newest first)
    return Object.entries(groups)
      .map(([key, group]) => ({
        key,
        ...group,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.year, parseInt(a.month) - 1);
        const dateB = new Date(b.year, parseInt(b.month) - 1);
        return dateB.getTime() - dateA.getTime();
      });
  }, [transactions]);

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
    const formattedAmount = amount.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    });
    return `${prefix}${formattedAmount} ${getCurrencySymbol()}`;
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
        { backgroundColor: item.category?.color || (item.type === 'income' ? '#28A745' : '#FF3B30') }
      ]}>
        <Ionicons
          name={getTransactionIcon(item.type, item.category)}
          size={24}
          color="white"
        />
      </View>
      
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <View style={styles.transactionMeta}>
          <Text style={styles.transactionCategory}>
            {item.category?.name ? t(`categories.${item.category.name}`) : t('categories.other')}
          </Text>
          <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
        </View>
      </View>
      
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          { color: item.type === 'income' ? '#28A745' : '#FF3B30' }
        ]}>
          {formatAmount(item.amount, item.type)}
        </Text>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteTransaction(item.id, item.description)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
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
    <SafeAreaView style={styles.safeAreaContainer} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor="#667eea" barStyle="light-content" />
      <View style={styles.container}>
        <Animated.View style={[
          styles.header, 
          { 
            height: headerHeight,
            paddingTop: headerPaddingTop,
            paddingBottom: headerPaddingBottom,
          }
        ]}>
          {/* Compact Title - erscheint beim Scrollen */}
          <Animated.Text style={[
            styles.compactTitle,
            { opacity: compactTitleOpacity }
          ]}>
            {t('transactions.title')}
          </Animated.Text>
          
          {/* Header Content - verschwindet beim Scrollen */}
          <Animated.View style={[
            styles.headerContent,
            { opacity: titleOpacity }
          ]}>
            <Text style={styles.title}>
              {t('transactions.title')}
            </Text>
            
            <Animated.View style={[
              styles.addButtonContainer,
              { opacity: addButtonOpacity }
            ]}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddModal(true)}
              >
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      
        {transactions.length === 0 && !loading ? (
          <EmptyState />
        ) : (
          <Animated.ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#667eea"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {groupedTransactions().map((group, index) => (
            <CollapsibleMonthSection
              key={group.key}
              month={group.month}
              year={group.year}
              transactionCount={group.transactions.length}
              totalAmount={group.totalAmount}
              isInitiallyExpanded={index === 0} // Only expand the first (most recent) month
            >
              {group.transactions.map((transaction) => (
                <TransactionItem key={transaction.id} item={transaction} />
              ))}
            </CollapsibleMonthSection>
          ))}
          </Animated.ScrollView>
        )}

      <AddTransactionModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleTransactionAdded}
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 0,
    position: 'relative',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#64748B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
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
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    borderRadius: 8,
    marginVertical: 2,
    marginHorizontal: 4,
    shadowColor: '#64748B',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
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
    color: '#1E293B',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionCategory: {
    fontSize: 14,
    color: '#64748B',
  },
  transactionDate: {
    fontSize: 14,
    color: '#64748B',
  },
  transactionRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  compactTitle: {
    position: 'absolute',
    top: 0, // Startet ganz oben ohne Padding
    left: 0,
    right: 0,
    height: 44, // Exakt die minimale Header-Höhe
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    lineHeight: 44, // Perfekte vertikale Zentrierung für 44px
    paddingTop: 0, // Kein zusätzliches Padding
    paddingBottom: 0,
    zIndex: 100, // Über anderen Inhalten
  },
  headerContent: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButtonContainer: {
    // Container für den Add-Button
  },
});