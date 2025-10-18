import { useCurrency } from '@/contexts/CurrencyContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { supabase } from '@/lib/supabase';
import { transactionService } from '@/lib/transactionService';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get("window").width;

interface MonthlyData {
  month: string;
  year: number;
  monthlyBudget: number;      // Das gesetzte Budget für diesen Monat
  expenses: number;           // Tatsächliche Ausgaben
  budgetRemaining: number;    // Budget minus Ausgaben (kann negativ sein)
  budgetPercentageUsed: number; // Wie viel % des Budgets verwendet wurde
  isOverBudget: boolean;      // Ob das Budget überschritten wurde
  income: number;             // Für Vollständigkeit
}

interface FinancialOverviewModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function FinancialOverviewModal({ visible, onClose }: FinancialOverviewModalProps) {
  const { t } = useTranslation();
  const { household } = useHousehold();
  const { formatAmount } = useCurrency();
  
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'3months' | '6months' | '12months'>('6months');
  const [savingsPotential, setSavingsPotential] = useState<{
    averageExpenses: number;
    suggestedReduction: number;
    potentialSavings: number;
  }>({ averageExpenses: 0, suggestedReduction: 0, potentialSavings: 0 });

  const loadFinancialData = useCallback(async () => {
    if (!household) return;

    setLoading(true);
    try {
      const monthsToLoad = selectedPeriod === '3months' ? 3 : selectedPeriod === '6months' ? 6 : 12;
      const data: MonthlyData[] = [];
      
      const currentDate = new Date();
      
      // Lade Daten für die letzten X Monate
      for (let i = monthsToLoad - 1; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const monthString = `${year}-${month.toString().padStart(2, '0')}`;
        
        // Hole Budget-Analyse für jeden Monat
        const budgetAnalysis = await transactionService.getBudgetAnalysis(year, month, household.id);
        
        // Hole Budget-Daten für diesen Monat aus der Datenbank
        const { data: budgetData } = await supabase
          .from('budgets')
          .select('amount')
          .eq('household_id', household.id)
          .eq('month', monthString)
          .single();

        const monthlyBudget = budgetData?.amount || 0;
        const expenses = budgetAnalysis.totalExpenses;
        const budgetRemaining = monthlyBudget - expenses;
        const budgetPercentageUsed = monthlyBudget > 0 ? (expenses / monthlyBudget) * 100 : 0;
        const isOverBudget = expenses > monthlyBudget;
        
        data.push({
          month: month.toString().padStart(2, '0'),
          year,
          monthlyBudget,
          expenses,
          budgetRemaining,
          budgetPercentageUsed,
          isOverBudget,
          income: budgetAnalysis.totalIncome,
        });
      }
      
      setMonthlyData(data);
      
      // Berechne Sparpotenzial basierend auf Budget-Performance
      if (data.length > 0) {
        const avgExpenses = data.reduce((sum, item) => sum + item.expenses, 0) / data.length;
        const avgBudgetRemaining = data.reduce((sum, item) => sum + item.budgetRemaining, 0) / data.length;
        
        // Berechne Sparpotenzial basierend auf Budget-Überschreitungen
        const overBudgetMonths = data.filter(item => item.isOverBudget);
        const avgOverspending = overBudgetMonths.length > 0 
          ? overBudgetMonths.reduce((sum, item) => sum + Math.abs(item.budgetRemaining), 0) / overBudgetMonths.length 
          : 0;
        
        const suggestedReduction = Math.max(avgOverspending, avgExpenses * 0.1); // Mindestens 10% oder Durchschnitt der Überschreitungen
        const potentialSavings = (suggestedReduction + Math.max(0, avgBudgetRemaining)) * 12; // Jahrespotenzial
        
        setSavingsPotential({
          averageExpenses: avgExpenses,
          suggestedReduction,
          potentialSavings,
        });
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  }, [household, selectedPeriod]);

  useEffect(() => {
    if (visible) {
      loadFinancialData();
    }
  }, [visible, loadFinancialData]);

  const getMonthLabel = (month: string, year: number) => {
    const monthNames = [
      'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
      'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year.toString().slice(-2)}`;
  };

  // Chart-Daten für Budget vs. Ausgaben Balkendiagramm
  const chartData = {
    labels: monthlyData.map(item => getMonthLabel(item.month, item.year)),
    datasets: [
      {
        data: monthlyData.map(item => item.monthlyBudget),
        color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`, // Blau für Budget
      },
      {
        data: monthlyData.map(item => item.expenses),
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, // Rot für Ausgaben
      }
    ]
  };

  // Chart-Daten für Budget-Restbeträge Liniendiagramm
  const budgetPerformanceChartData = {
    labels: monthlyData.map(item => getMonthLabel(item.month, item.year)),
    datasets: [
      {
        data: monthlyData.map(item => item.budgetRemaining),
        color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
        strokeWidth: 3,
      }
    ]
  };

  const PeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['3months', '6months', '12months'] as const).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === period && styles.periodButtonTextActive
          ]}>
            {period === '3months' ? '3M' : period === '6months' ? '6M' : '12M'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const SavingsCalculator = () => (
    <View style={styles.savingsCard}>
      <Text style={styles.cardTitle}>{t('financialOverview.savingsPotential')}</Text>
      
      <View style={styles.savingsContent}>
        <View style={styles.savingsItem}>
          <Text style={styles.savingsLabel}>
            {t('financialOverview.averageMonthlyExpenses')}
          </Text>
          <Text style={styles.savingsValue}>
            {formatAmount(savingsPotential.averageExpenses)}
          </Text>
        </View>
        
        <View style={styles.savingsItem}>
          <Text style={styles.savingsLabel}>
            {t('financialOverview.suggestedReduction')} (15%)
          </Text>
          <Text style={[styles.savingsValue, { color: '#EF4444' }]}>
            -{formatAmount(savingsPotential.suggestedReduction)}
          </Text>
        </View>
        
        <View style={[styles.savingsItem, styles.savingsHighlight]}>
          <Text style={styles.savingsLabel}>
            {t('financialOverview.annualSavingsPotential')}
          </Text>
          <Text style={[styles.savingsValue, { color: '#10B981', fontSize: 18, fontWeight: 'bold' }]}>
            {formatAmount(savingsPotential.potentialSavings)}
          </Text>
        </View>
      </View>
      
      <View style={styles.savingsTip}>
        <Ionicons name="bulb-outline" size={16} color="#667eea" />
        <Text style={styles.savingsTipText}>
          {t('financialOverview.savingsTip')}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.safeAreaContainer}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>{t('financialOverview.title')}</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Zeitraum-Auswahl */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('financialOverview.timePeriod')}</Text>
              <PeriodSelector />
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>{t('common.loading')}</Text>
              </View>
            ) : monthlyData.length > 0 ? (
              <>
                {/* Budget vs. Ausgaben Balkendiagramm */}
                <View style={styles.chartCard}>
                  <Text style={styles.cardTitle}>Budget vs. Ausgaben</Text>
                  
                  <View style={styles.chartLegend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendColor, { backgroundColor: 'rgba(102, 126, 234, 1)' }]} />
                      <Text style={styles.legendText}>{t('dashboard.monthlyBudget')}</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendColor, { backgroundColor: 'rgba(239, 68, 68, 1)' }]} />
                      <Text style={styles.legendText}>{t('dashboard.totalExpenses')}</Text>
                    </View>
                  </View>

                  <BarChart
                    data={chartData}
                    width={screenWidth - 60}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={{
                      backgroundColor: '#fff',
                      backgroundGradientFrom: '#fff',
                      backgroundGradientTo: '#fff',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      style: { borderRadius: 16 },
                      propsForLabels: { fontSize: 10 },
                    }}
                    style={styles.chart}
                    showValuesOnTopOfBars
                    withInnerLines={false}
                  />
                </View>

                {/* Budget-Performance Verlauf */}
                <View style={styles.chartCard}>
                  <Text style={styles.cardTitle}>Budget-Performance</Text>
                  
                  <LineChart
                    data={budgetPerformanceChartData}
                    width={screenWidth - 60}
                    height={220}
                    chartConfig={{
                      backgroundColor: '#fff',
                      backgroundGradientFrom: '#fff',
                      backgroundGradientTo: '#fff',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      style: { borderRadius: 16 },
                      propsForLabels: { fontSize: 10 },
                    }}
                    bezier
                    style={styles.chart}
                    withDots
                    withInnerLines
                  />
                </View>

                {/* Sparpotenzial-Rechner */}
                <SavingsCalculator />

                {/* Monatliche Aufschlüsselung */}
                <View style={styles.monthlyBreakdown}>
                  <Text style={styles.sectionTitle}>{t('financialOverview.monthlyBreakdown')}</Text>
                  {monthlyData.map((item, index) => (
                    <View key={`${item.year}-${item.month}`} style={styles.monthCard}>
                      <Text style={styles.monthTitle}>
                        {getMonthLabel(item.month, item.year)}
                      </Text>
                      
                      <View style={styles.monthStats}>
                        <View style={styles.monthStatRow}>
                          <Text style={styles.monthStatLabel}>{t('dashboard.monthlyBudget')}</Text>
                          <Text style={[styles.monthStatValue, { color: '#667eea' }]}>
                            {formatAmount(item.monthlyBudget)}
                          </Text>
                        </View>
                        
                        <View style={styles.monthStatRow}>
                          <Text style={styles.monthStatLabel}>{t('dashboard.totalExpenses')}</Text>
                          <Text style={[styles.monthStatValue, { color: '#EF4444' }]}>
                            -{formatAmount(item.expenses)}
                          </Text>
                        </View>
                        
                        <View style={styles.monthStatRow}>
                          <Text style={styles.monthStatLabel}>Budget verwendet (%)</Text>
                          <Text style={[styles.monthStatValue, { 
                            color: item.isOverBudget ? '#EF4444' : '#10B981' 
                          }]}>
                            {item.budgetPercentageUsed.toFixed(1)}%
                          </Text>
                        </View>
                        
                        <View style={[styles.monthStatRow, styles.monthStatTotal]}>
                          <Text style={[styles.monthStatLabel, { fontWeight: 'bold' }]}>
                            {item.isOverBudget ? 'Budget überschritten' : 'Budget übrig'}
                          </Text>
                          <Text style={[
                            styles.monthStatValue,
                            { 
                              fontWeight: 'bold',
                              color: item.isOverBudget ? '#EF4444' : '#10B981'
                            }
                          ]}>
                            {item.isOverBudget ? '-' : '+'}{formatAmount(Math.abs(item.budgetRemaining))}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="analytics-outline" size={64} color="#CBD5E1" />
                <Text style={styles.emptyText}>{t('financialOverview.noData')}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#667eea',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#667eea',
  },
  periodButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  periodButtonTextActive: {
    color: 'white',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
  },
  chart: {
    borderRadius: 16,
  },
  savingsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  savingsContent: {
    marginBottom: 16,
  },
  savingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  savingsHighlight: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  savingsLabel: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  savingsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  savingsTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
  },
  savingsTipText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 8,
    flex: 1,
  },
  monthlyBreakdown: {
    marginBottom: 20,
  },
  monthCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  monthStats: {
    gap: 4,
  },
  monthStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  monthStatTotal: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 4,
  },
  monthStatLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  monthStatValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
  },
});