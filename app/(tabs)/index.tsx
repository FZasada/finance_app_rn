import AddTransactionModal from '@/components/AddTransactionModal';
import SetBudgetModal from '@/components/SetBudgetModal';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { supabase } from '@/lib/supabase';
import { transactionService } from '@/lib/transactionService';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

const screenWidth = Dimensions.get("window").width;

interface DashboardData {
  monthlyBudget: number;
  spent: number;
  income: number;
  savings: number;
  expensesByCategory: {
    categoryName: string;
    amount: number;
    color: string;
    percentage: number;
  }[];
  weeklyExpenses: {
    day: string;
    amount: number;
  }[];
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { household } = useHousehold();
  const { formatAmount, getCurrencySymbol } = useCurrency();
  
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    monthlyBudget: 0,
    spent: 0,
    income: 0,
    savings: 0,
    expensesByCategory: [],
    weeklyExpenses: [],
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');

  const loadDashboardData = useCallback(async () => {
    if (!user || !household) return;

    try {
      // Get current month
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const currentMonth = `${year}-${month.toString().padStart(2, '0')}`;

      // Get budget for current month
      const { data: budgetData } = await supabase
        .from('budgets')
        .select('amount')
        .eq('household_id', household.id)
        .eq('month', currentMonth)
        .single();

      // Get income vs expenses data using transaction service
      const incomeVsExpenses = await transactionService.getIncomeVsExpenses(
        year, 
        month, 
        household.id
      );

      // Get expenses by category
      const expensesByCategory = await transactionService.getExpensesByCategory(
        year,
        month,
        household.id
      );

      const monthlyBudget = budgetData?.amount || 0;

      // Get weekly expenses for line chart
      const weeklyExpenses = await transactionService.getWeeklyExpenses(
        user.id,
        household.id
      );

      setDashboardData({
        monthlyBudget,
        spent: incomeVsExpenses.expenses,
        income: incomeVsExpenses.income,
        savings: incomeVsExpenses.balance,
        expensesByCategory,
        weeklyExpenses,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user, household]);

  const handleRefresh = useCallback(() => {
    console.log('Dashboard refresh triggered');
    setRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Setup real-time updates
  useRealtimeUpdates({
    onTransactionUpdate: () => {
      loadDashboardData(); // Reload dashboard when transactions change
    },
    onBudgetUpdate: () => {
      loadDashboardData(); // Reload dashboard when budget changes
    },
    enableNotifications: true,
  });

  const budgetPercentage = dashboardData.monthlyBudget > 0 
    ? (dashboardData.spent / dashboardData.monthlyBudget) * 100 
    : 0;
  const budgetRemaining = dashboardData.monthlyBudget - dashboardData.spent;
  const isOverBudget = dashboardData.spent > dashboardData.monthlyBudget;

  const handleQuickAction = (type: 'income' | 'expense') => {
    setModalType(type);
    setShowAddModal(true);
  };

  // Chart data for weekly expenses
  const chartData = {
    labels: dashboardData.weeklyExpenses.map(item => item.day),
    datasets: [
      {
        data: dashboardData.weeklyExpenses.map(item => item.amount),
        color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`, // optional
        strokeWidth: 2 // optional
      }
    ],
    legend: [t('dashboard.weeklyExpenses')]
  };    // Mock data for charts - replace with real data later
  // Create custom formatted data for pie chart with € symbol
  const expenseData = dashboardData.expensesByCategory.length > 0 
    ? dashboardData.expensesByCategory.map(cat => {
        return {
          name: cat.categoryName, // Just category name for the chart
          amount: cat.amount,
          color: cat.color,
          legendFontColor: '#7F7F7F',
          legendFontSize: 14,
        };
      })
    : [
        {
          name: 'No Data',
          amount: 1,
          color: '#CCCCCC',
          legendFontColor: '#7F7F7F',
          legendFontSize: 14,
        }
      ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
            colors={['#007AFF']}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('dashboard.title')}</Text>
          <Text style={styles.greeting}>
            Hi, {user?.email?.split('@')[0]}!
          </Text>
        </View>

        {/* Budget Overview */}
        <View style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <Text style={styles.cardTitle}>
              {isOverBudget ? t('dashboard.budgetExceeded') : t('dashboard.budgetRemaining')}
            </Text>
            <TouchableOpacity 
              style={styles.setBudgetButton}
              onPress={() => setShowBudgetModal(true)}
            >
              <Text style={styles.setBudgetButtonText}>
                {dashboardData.monthlyBudget > 0 ? t('common.edit') : t('budget.setBudget')}
              </Text>
            </TouchableOpacity>
          </View>
          
          {dashboardData.monthlyBudget > 0 ? (
            <>
              {/* Main Budget Remaining Display */}
              <View style={styles.mainBudgetDisplay}>
                <Text style={[
                  styles.remainingAmount,
                  { color: isOverBudget ? '#FF3B30' : '#28A745' }
                ]}>
                  {isOverBudget ? '-' : ''}{Math.abs(budgetRemaining).toFixed(2)} {getCurrencySymbol()}
                </Text>
                <Text style={styles.remainingText}>
                  {isOverBudget ? t('dashboard.overBudgetBy') : t('dashboard.leftToSpend')}
                </Text>
              </View>
              
              <View style={styles.budgetProgress}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.min(budgetPercentage, 100)}%`,
                        backgroundColor: isOverBudget ? '#FF3B30' : '#007AFF'
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {budgetPercentage.toFixed(1)}% {t('budget.percentageUsed')}
                </Text>
              </View>

              <View style={styles.budgetStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>{t('dashboard.monthlyBudget')}</Text>
                  <Text style={styles.statValue}>{dashboardData.monthlyBudget} {getCurrencySymbol()}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>{t('dashboard.budgetUsed')}</Text>
                  <Text style={[styles.statValue, isOverBudget && styles.overBudgetText]}>
                    {dashboardData.spent} {getCurrencySymbol()}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.noBudgetContainer}>
              <Text style={styles.noBudgetText}>{t('dashboard.noBudgetSet')}</Text>
              <Text style={styles.noBudgetSubtext}>
                {t('quickActions.description')}
              </Text>
            </View>
          )}
        </View>

        {/* Income & Savings */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { marginRight: 10 }]}>
            <Text style={styles.cardTitle}>{t('dashboard.totalIncome')}</Text>
            <Text style={[styles.statValue, { color: '#28A745' }]}>{dashboardData.income} {getCurrencySymbol()}</Text>
          </View>
          <View style={[styles.statCard, { marginLeft: 10 }]}>
            <Text style={styles.cardTitle}>{t('dashboard.savings')}</Text>
            <Text style={[styles.statValue, { color: '#28A745' }]}>{dashboardData.savings} {getCurrencySymbol()}</Text>
          </View>
        </View>

        {/* Weekly Spending Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>{t('dashboard.weeklySpending')}</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 60}
            height={220}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: "#007AFF"
              }
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Expense Categories */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>{t('dashboard.expenseCategories')}</Text>
          <PieChart
            data={expenseData}
            width={screenWidth - 60}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              decimalPlaces: 0,
              propsForLabels: {
                fontSize: 12,
              },
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute={false}
            hasLegend={false}
            avoidFalseZero={true}
            center={[60, 0]}
          />
          
          {/* Custom Legend */}
                    <View style={styles.customLegend}>
            {dashboardData.expensesByCategory.map((item, index) => (
              <View key={`${item.categoryName}_${index}`} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>
                  {formatAmount(item.amount)} {item.categoryName}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>{t('quickActions.title')}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
              onPress={() => handleQuickAction('expense')}
            >
              <Text style={styles.actionButtonText}>{t('transactions.addExpense')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#28A745' }]}
              onPress={() => handleQuickAction('income')}
            >
              <Text style={styles.actionButtonText}>{t('transactions.addIncome')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <AddTransactionModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadDashboardData}
        initialType={modalType}
      />

      <SetBudgetModal
        visible={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        onSuccess={loadDashboardData}
        currentBudget={dashboardData.monthlyBudget}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  budgetCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  setBudgetButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  setBudgetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  mainBudgetDisplay: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  remainingAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  remainingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  budgetAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  budgetProgress: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  budgetStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  overBudgetText: {
    color: '#FF3B30',
  },
  noBudgetContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noBudgetText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  noBudgetSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  quickActions: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  customLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#7F7F7F',
  },
});
