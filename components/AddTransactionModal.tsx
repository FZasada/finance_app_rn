import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { categoryService } from '@/lib/categoryService';
import { supabase, type Category } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialType?: 'income' | 'expense';
}

export default function AddTransactionModal({
  visible,
  onClose,
  onSuccess,
  initialType = 'expense',
}: AddTransactionModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { household } = useHousehold();
  const { getCurrencySymbol } = useCurrency();
  
  const [type, setType] = useState<'income' | 'expense'>(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Lade Kategorien beim Typ-Wechsel
  useEffect(() => {
    loadCategories();
  }, [type, visible]);

  const loadCategories = async () => {
    try {
      await categoryService.initializeDefaultCategories();
      const categoryList = await categoryService.getCategories(type);
      setCategories(categoryList);
      
      // Reset selected category when type changes
      setSelectedCategory(null);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setSelectedCategory(null);
    setType(initialType);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Funktion zur Verarbeitung der Betragseingabe
  const handleAmountChange = (text: string) => {
    // Erlaube nur Zahlen, Kommas und Punkte
    const cleanedText = text.replace(/[^0-9,.-]/g, '');
    
    // Ersetze Kommas durch Punkte für konsistente Verarbeitung
    const normalizedText = cleanedText.replace(',', '.');
    
    // Verhindere mehrere Dezimalpunkte
    const parts = normalizedText.split('.');
    if (parts.length > 2) {
      return; // Ignoriere weitere Eingaben wenn schon ein Punkt vorhanden ist
    }
    
    // Begrenze Dezimalstellen auf 2
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    
    // Zeige dem Benutzer die deutsche Formatierung mit Komma
    const displayText = normalizedText.replace('.', ',');
    setAmount(displayText);
  };

  const handleSubmit = async () => {
    if (!amount || !description || !user || !selectedCategory) {
      Alert.alert(t('common.error'), 'Bitte füllen Sie alle Felder aus und wählen Sie eine Kategorie');
      return;
    }

    // Verbesserte Betragsverarbeitung
    const cleanAmount = amount.replace(',', '.').trim();
    const numericAmount = parseFloat(cleanAmount);
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert(t('common.error'), 'Bitte geben Sie einen gültigen Betrag ein (z.B. 33,45)');
      return;
    }

    // Runde auf 2 Dezimalstellen
    const roundedAmount = Math.round(numericAmount * 100) / 100;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          household_id: household?.id || null,
          user_id: user.id,
          type,
          amount: roundedAmount,
          description,
          category_id: selectedCategory.id,
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        }]);

      if (error) throw error;

      Alert.alert(
        t('common.success'),
        t('transactions.transactionAdded'),
        [{ text: t('common.confirm'), onPress: () => {
          resetForm();
          onSuccess();
          onClose();
        }}]
      );
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert(t('common.error'), 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
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
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('transactions.addTransaction')}</Text>
          <TouchableOpacity 
            onPress={handleSubmit} 
            style={[styles.headerButton, loading && styles.headerButtonDisabled]}
            disabled={loading}
          >
            <Text style={[styles.headerButtonText, styles.saveButton]}>
              {loading ? t('common.loading') : t('common.save')}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Type Toggle */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type</Text>
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'expense' && styles.typeButtonActive,
                ]}
                onPress={() => {
                  setType('expense');
                }}
              >
                <Ionicons 
                  name="remove-circle" 
                  size={20} 
                  color={type === 'expense' ? 'white' : '#FF3B30'} 
                />
                <Text style={[
                  styles.typeButtonText,
                  type === 'expense' && styles.typeButtonTextActive,
                ]}>
                  {t('transactions.expense')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'income' && styles.typeButtonActive,
                ]}
                onPress={() => {
                  setType('income');
                }}
              >
                <Ionicons 
                  name="add-circle" 
                  size={20} 
                  color={type === 'income' ? 'white' : '#28A745'} 
                />
                <Text style={[
                  styles.typeButtonText,
                  type === 'income' && styles.typeButtonTextActive,
                ]}>
                  {t('transactions.income')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Amount */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('transactions.amount')}</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>{getCurrencySymbol()}</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0,00"
                keyboardType="decimal-pad"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('transactions.description')}</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder={t('transactions.description')}
              returnKeyType="next"
            />
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('transactions.category')}</Text>
            <TouchableOpacity
              style={styles.categorySelector}
              onPress={() => setShowCategoryPicker(true)}
            >
              <View style={styles.categorySelectorContent}>
                {selectedCategory ? (
                  <>
                    <View style={[styles.categoryIcon, { backgroundColor: selectedCategory.color }]}>
                      <Ionicons name={selectedCategory.icon as any} size={20} color="white" />
                    </View>
                    <Text style={styles.categorySelectorText}>
                      {t(`categories.${selectedCategory.name}`)}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.categorySelectorPlaceholder}>
                    {t('transactions.selectCategory')}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Category Picker Modal */}
        <Modal
          visible={showCategoryPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCategoryPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerContent}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>{t('transactions.category')}</Text>
                <TouchableOpacity
                  onPress={() => setShowCategoryPicker(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerList}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      selectedCategory?.id === category.id && styles.categoryItemSelected
                    ]}
                    onPress={() => {
                      setSelectedCategory(category);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                      <Ionicons name={category.icon as any} size={20} color="white" />
                    </View>
                    <Text style={[
                      styles.categoryText,
                      selectedCategory?.id === category.id && styles.categoryTextSelected
                    ]}>
                      {t(`categories.${category.name}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 15,
  },
  headerButton: {
    padding: 5,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  saveButton: {
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginLeft: 8,
  },
  typeButtonTextActive: {
    color: 'white',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  categorySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categorySelectorText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  categorySelectorPlaceholder: {
    color: '#999',
    fontSize: 16,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    height: '80%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  pickerList: {
    flex: 1,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    minHeight: 60,
  },
  categoryItemSelected: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  categoryTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
});