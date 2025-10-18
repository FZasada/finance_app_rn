import AddTransactionModal from '@/components/AddTransactionModal';
import FinancialOverviewModal from '@/components/FinancialOverview';
import SetBudgetModal from '@/components/SetBudgetModal';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { supabase } from '@/lib/supabase';
import { transactionService } from '@/lib/transactionService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Dimensions,
  RefreshControl,
  StatusBar,
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
  budgetSpent: number;        // All expenses are now budget-relevant
  totalIncome: number;
  totalExpenses: number;      // All expenses
  netBalance: number;         // Total income - total expenses
  monthlySavings: number;     // Positive net balance (savings)
  budgetRelevantByCategory: {
    categoryName: string;
    amount: number;
    color: string;
    percentage: number;
  }[];
  monthlyBudgetTrack: {
    day: number;
    cumulativeSpent: number;
  }[];
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { household } = useHousehold();
  const { formatAmount, getCurrencySymbol } = useCurrency();
  
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    monthlyBudget: 0,
    budgetSpent: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    monthlySavings: 0,
    budgetRelevantByCategory: [],
    monthlyBudgetTrack: [],
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showFinancialOverview, setShowFinancialOverview] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
  
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
  const greetingOpacity = scrollY.interpolate({
    inputRange: [0, 30],
    outputRange: [1, 0], // Begrüßung verschwindet
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

      // Get the simplified budget analysis (all expenses are budget-relevant)
      const budgetAnalysis = await transactionService.getBudgetAnalysis(
        year, 
        month, 
        household.id
      );

      const monthlyBudget = budgetData?.amount || 0;

      // Get monthly budget tracking data for line chart
      const monthlyBudgetTrack = await transactionService.getMonthlyBudgetTrack(
        year, 
        month, 
        household.id
      );

      setDashboardData({
        monthlyBudget,
        budgetSpent: budgetAnalysis.budgetRelevantExpenses,
        totalIncome: budgetAnalysis.totalIncome,
        totalExpenses: budgetAnalysis.totalExpenses,
        netBalance: budgetAnalysis.netBalance,
        monthlySavings: budgetAnalysis.monthlySavings,
        budgetRelevantByCategory: budgetAnalysis.budgetRelevantByCategory,
        monthlyBudgetTrack,
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

  // Reload dashboard data when the screen is focused (user returns to this tab)
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

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
    ? (dashboardData.budgetSpent / dashboardData.monthlyBudget) * 100 
    : 0;
  const budgetRemaining = dashboardData.monthlyBudget - dashboardData.budgetSpent;
  const isOverBudget = dashboardData.budgetSpent > dashboardData.monthlyBudget;

  const handleQuickAction = (type: 'income' | 'expense') => {
    setModalType(type);
    setShowAddModal(true);
  };

  // Get current month and year with translations
  const getCurrentMonthYearTranslated = () => {
    const now = new Date();
    const monthIndex = now.getMonth(); // 0-11
    const monthKeys = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const translatedMonth = t(`months.${monthKeys[monthIndex]}`);
    const year = now.getFullYear();
    return `${translatedMonth} ${year}`;
  };

  // Chart data for monthly budget tracking with budget limit line
  // Create simplified labels: only show 5, 10, 15, 20, 25, 30
  const createSimplifiedLabels = () => {
    const labels = new Array(dashboardData.monthlyBudgetTrack.length).fill('');
    const showLabels = [5, 10, 15, 20, 25, 30];
    showLabels.forEach(day => {
      if (day <= dashboardData.monthlyBudgetTrack.length) {
        labels[day - 1] = day.toString();
      }
    });
    return labels;
  };    // Mock data for charts - replace with real data later
  // Create custom formatted data for pie chart with € symbol
  const expenseData = dashboardData.budgetRelevantByCategory.length > 0 
    ? dashboardData.budgetRelevantByCategory.map(cat => {
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
          {/* Kompakter zentrierter Titel für kollabierte Ansicht */}
          <Animated.Text style={[styles.compactTitle, { opacity: compactTitleOpacity }]}>
            {t('dashboard.title')}
          </Animated.Text>
          
          {/* Normale Header-Inhalte */}
          <View style={styles.headerContent}>
            <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
              {t('dashboard.title')}
            </Animated.Text>
            <Animated.Text style={[styles.greeting, { opacity: greetingOpacity }]}>
              Hi, {user?.email?.split('@')[0]}!
            </Animated.Text>
          </View>
        </Animated.View>
        <Animated.ScrollView 
          style={styles.scrollView}
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
              colors={['#667eea']}
            />
          }
        >
          

        {/* Budget Overview */}
        <View style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <View style={styles.budgetTitleContainer}>
              <Text style={styles.cardTitle}>
                {isOverBudget ? t('dashboard.budgetExceeded') : t('dashboard.budgetRemaining')}
              </Text>
              <Text style={styles.budgetPeriod}>
                {t('dashboard.forMonth')} {getCurrentMonthYearTranslated()}
              </Text>
            </View>
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
                  {isOverBudget ? '-' : ''}{Math.abs(budgetRemaining).toLocaleString('de-DE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                    useGrouping: true,
                  })} {getCurrencySymbol()}
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
                  {budgetPercentage.toLocaleString('de-DE', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}% {t('budget.percentageUsed')}
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
                    {formatAmount(dashboardData.budgetSpent)}
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

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>{t('quickActions.title')}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
              onPress={() => handleQuickAction('expense')}
            >
              <Ionicons name="remove-circle" size={24} color="white" />
              <Text style={styles.actionButtonText}>{t('transactions.expense')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#10B981' }]}
              onPress={() => handleQuickAction('income')}
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text style={styles.actionButtonText}>{t('transactions.income')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Monthly Budget Tracking Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>{t('dashboard.monthlyBudgetSpending')}</Text>
          
          {/* Custom Chart Legend */}
          <View style={styles.chartLegend}>
            <View style={styles.chartLegendItem}>
              <View style={[styles.chartLegendColor, { backgroundColor: 'rgba(134, 65, 244, 1)' }]} />
              <Text style={styles.chartLegendText}>{t('dashboard.monthlyBudgetSpending')}</Text>
            </View>
            <View style={styles.chartLegendItem}>
              <View style={[styles.chartLegendColor, { backgroundColor: 'rgba(255, 59, 48, 1)', borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255, 59, 48, 1)' }]} />
              <Text style={styles.chartLegendText}>{t('dashboard.budgetLimit')}</Text>
            </View>
          </View>

          <LineChart
            data={{
              labels: createSimplifiedLabels(),
              datasets: [
                {
                  data: dashboardData.monthlyBudgetTrack.map(item => item.cumulativeSpent),
                  color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
                  strokeWidth: 3,
                  withDots: false
                },
                {
                  data: new Array(dashboardData.monthlyBudgetTrack.length).fill(dashboardData.monthlyBudget),
                  color: (opacity = 1) => `rgba(255, 59, 48, ${opacity})`,
                  strokeWidth: 2,
                  strokeDashArray: [5, 5],
                  withDots: false
                }
              ]
            }}
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
              }
            }}
            withDots={false}
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
            {dashboardData.budgetRelevantByCategory.map((item, index) => (
              <View key={`${item.categoryName}_${index}`} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>
                  {formatAmount(item.amount)} • {t(`categories.${item.categoryName}`)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Finanzübersicht Button */}
        <View style={styles.overviewSection}>
          <TouchableOpacity 
            style={styles.overviewButton}
            onPress={() => setShowFinancialOverview(true)}
          >
            <View style={styles.overviewButtonContent}>
              <View style={styles.overviewIconContainer}>
                <Text style={styles.overviewIcon}>📊</Text>
              </View>
              <View style={styles.overviewTextContainer}>
                <Text style={styles.overviewButtonTitle}>{t('financialOverview.title')}</Text>
                <Text style={styles.overviewButtonSubtitle}>
                  Vergleiche deine Finanzen über mehrere Monate
                </Text>
              </View>
              <View style={styles.overviewArrow}>
                <Text style={styles.overviewArrowText}>→</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>

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

      <FinancialOverviewModal
        visible={showFinancialOverview}
        onClose={() => setShowFinancialOverview(false)}
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#667eea', // Wichtig: Färbt den kompletten SafeArea-Bereich einschließlich Statusbar
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
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
  headerContent: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactTitle: {
    position: 'absolute',
    top: 0, // Startet ganz oben ohne Padding
    left: 0,
    right: 0,
    height: 44, // Exakt die minimale Header-Höhe
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 44, // Perfekte vertikale Zentrierung für 44px
    paddingTop: 0, // Kein zusätzliches Padding
    paddingBottom: 0,
    zIndex: 100, // Über anderen Inhalten
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  greeting: {
    fontSize: 16,
    color: '#E2E8F0',
    opacity: 0.9,
  },
  currentPeriod: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 8,
    textAlign: 'center',
  },
  budgetCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  budgetTitleContainer: {
    flex: 1,
  },
  budgetPeriod: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
    fontStyle: 'italic',
  },
  setBudgetButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  setBudgetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
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
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
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

  chartCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 15,
    paddingHorizontal: 10,
    width: '100%',
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartLegendColor: {
    width: 16,
    height: 3,
    marginRight: 8,
  },
  chartLegendText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
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
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 80,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  customLegend: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 15,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  overviewSection: {
    margin: 20,
    marginTop: 0,
  },
  overviewButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  overviewButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  overviewIcon: {
    fontSize: 24,
  },
  overviewTextContainer: {
    flex: 1,
  },
  overviewButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  overviewButtonSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  overviewArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewArrowText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});
