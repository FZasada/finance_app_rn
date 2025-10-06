import { useCurrency } from '@/contexts/CurrencyContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    LayoutAnimation,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleMonthSectionProps {
  month: string;
  year: number;
  transactionCount: number;
  totalAmount: number;
  children: React.ReactNode;
  isInitiallyExpanded?: boolean;
}

export default function CollapsibleMonthSection({
  month,
  year,
  transactionCount,
  totalAmount,
  children,
  isInitiallyExpanded = false,
}: CollapsibleMonthSectionProps) {
  const { t } = useTranslation();
  const { getCurrencySymbol } = useCurrency();
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const formatAmount = (amount: number) => {
    const prefix = amount >= 0 ? '+' : '';
    const formattedAmount = Math.abs(amount).toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    });
    return `${prefix}${formattedAmount} ${getCurrencySymbol()}`;
  };

  const getMonthName = (monthNumber: string) => {
    const monthKey = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const monthIndex = parseInt(monthNumber) - 1;
    return monthIndex >= 0 && monthIndex < 12 ? t(`months.${monthKey[monthIndex]}`) : monthNumber;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={toggleExpanded}>
        <View style={styles.headerLeft}>
          <Text style={styles.monthTitle}>
            {getMonthName(month)} {year}
          </Text>
          <Text style={styles.transactionCount}>
            {transactionCount} {transactionCount === 1 ? t('transactions.transaction') : t('transactions.transactions')}
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          <Text style={[
            styles.totalAmount,
            { color: totalAmount >= 0 ? '#28A745' : '#FF3B30' }
          ]}>
            {formatAmount(totalAmount)}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#666"
            style={styles.chevron}
          />
        </View>
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  transactionCount: {
    fontSize: 14,
    color: '#666',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  chevron: {
    marginLeft: 4,
  },
  content: {
    backgroundColor: 'white',
  },
});