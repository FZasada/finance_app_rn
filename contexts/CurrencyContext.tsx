import { Currency } from '@/components/CurrencyModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatAmount: (amount: number, showSign?: boolean) => string;
  getCurrencySymbol: () => string;
  loading: boolean;
}

const defaultCurrency: Currency = {
  code: 'EUR',
  symbol: '€',
  name: 'Euro',
  flag: '🇪🇺'
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: React.ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(defaultCurrency);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrency();
  }, []);

  const loadCurrency = async () => {
    try {
      const savedCurrency = await AsyncStorage.getItem('selectedCurrency');
      if (savedCurrency) {
        const parsedCurrency = JSON.parse(savedCurrency);
        setCurrencyState(parsedCurrency);
      }
    } catch (error) {
      console.error('Error loading currency:', error);
    } finally {
      setLoading(false);
    }
  };

  const setCurrency = async (newCurrency: Currency) => {
    try {
      await AsyncStorage.setItem('selectedCurrency', JSON.stringify(newCurrency));
      setCurrencyState(newCurrency);
    } catch (error) {
      console.error('Error saving currency:', error);
    }
  };

  const formatAmount = useCallback((amount: number, showSign: boolean = false) => {
    const prefix = showSign && amount >= 0 ? '+' : '';
    const absAmount = Math.abs(amount).toFixed(2);
    
    // Different formatting based on currency
    switch (currency.code) {
      case 'USD':
      case 'GBP':
        return `${prefix}${currency.symbol}${absAmount}`;
      case 'PLN':
        return `${prefix}${absAmount} ${currency.symbol}`;
      default: // EUR and others
        return `${prefix}${absAmount} ${currency.symbol}`;
    }
  }, [currency]);

  const getCurrencySymbol = useCallback(() => {
    return currency.symbol;
  }, [currency]);

  const value = useMemo(() => ({
    currency,
    setCurrency,
    formatAmount,
    getCurrencySymbol,
    loading,
  }), [currency, formatAmount, getCurrencySymbol, loading]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};