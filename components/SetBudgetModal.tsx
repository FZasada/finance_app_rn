import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { supabase } from '@/lib/supabase';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface SetBudgetModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentBudget?: number;
}

export default function SetBudgetModal({ 
  visible, 
  onClose, 
  onSuccess, 
  currentBudget = 0 
}: SetBudgetModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { household } = useHousehold();
  const [amount, setAmount] = useState(currentBudget.toString());
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user || !household) return;

    const budgetAmount = parseFloat(amount);
    if (isNaN(budgetAmount) || budgetAmount < 0) {
      Alert.alert(t('common.error'), 'Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);

      // Get current month
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const currentMonth = `${year}-${month.toString().padStart(2, '0')}`;

      // Check if budget already exists for this month
      const { data: existingBudget } = await supabase
        .from('budgets')
        .select('id')
        .eq('household_id', household.id)
        .eq('month', currentMonth)
        .single();

      if (existingBudget) {
        // Update existing budget
        const { error } = await supabase
          .from('budgets')
          .update({ amount: budgetAmount })
          .eq('id', existingBudget.id);

        if (error) throw error;
      } else {
        // Create new budget
        const { error } = await supabase
          .from('budgets')
          .insert({
            household_id: household.id,
            month: currentMonth,
            amount: budgetAmount,
          });

        if (error) throw error;
      }

      Alert.alert(
        t('common.success'),
        t('budget.budgetUpdated'),
        [{ text: t('common.confirm'), onPress: () => {
          onSuccess();
          onClose();
          setAmount('');
        }}]
      );
    } catch (error) {
      console.error('Error setting budget:', error);
      Alert.alert(t('common.error'), 'Failed to set budget');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount(currentBudget.toString());
    onClose();
  };

  // Get current month name for display
  const getCurrentMonthName = () => {
    const now = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[now.getMonth()];
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.headerButton}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('budget.setBudget')}</Text>
          <TouchableOpacity 
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={[styles.headerButton, styles.saveButton]}>
              {loading ? t('common.loading') : t('common.save')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.monthInfo}>
            <Text style={styles.monthTitle}>
              {t('budget.budgetForMonth', { month: getCurrentMonthName() })}
            </Text>
            <Text style={styles.monthSubtitle}>
              Set your spending limit for this month
            </Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>{t('budget.budgetAmount')}</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>€</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
                autoFocus
              />
            </View>
          </View>

          {currentBudget > 0 && (
            <View style={styles.currentBudgetInfo}>
              <Text style={styles.currentBudgetLabel}>
                Current Budget: €{currentBudget}
              </Text>
            </View>
          )}

          <View style={styles.helpText}>
            <Text style={styles.helpTitle}>💡 Tip</Text>
            <Text style={styles.helpDescription}>
              Set a realistic budget based on your income and necessary expenses. 
              You can update this anytime.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  saveButton: {
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  monthInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  monthSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  inputSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    paddingVertical: 15,
  },
  currentBudgetInfo: {
    backgroundColor: '#e8f4ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  currentBudgetLabel: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
    fontWeight: '500',
  },
  helpText: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 5,
  },
  helpDescription: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});