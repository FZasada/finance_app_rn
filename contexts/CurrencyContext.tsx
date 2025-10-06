import { Currency } from '@/components/CurrencyModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatAmount: (amount: number, showSign?: boolean) => string;
  formatNumber: (amount: number, showSign?: boolean) => string;
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
    const absAmount = Math.abs(amount);
    
    // Deutsche Formatierung:
    // - Punkt als Tausendertrennzeichen (1.000)
    // - Komma als Dezimaltrennzeichen (1.234,56)
    const formattedAmount = absAmount.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true, // Aktiviert Tausendertrennzeichen
    });
    
    // Different formatting based on currency
    switch (currency.code) {
      case 'USD':
      case 'GBP':
        return `${prefix}${currency.symbol}${formattedAmount}`;
      case 'PLN':
        return `${prefix}${formattedAmount} ${currency.symbol}`;
      default: // EUR and others
        return `${prefix}${formattedAmount} ${currency.symbol}`;
    }
  }, [currency]);

  // Formatiert nur die Zahl ohne Währungssymbol
  const formatNumber = useCallback((amount: number, showSign: boolean = false) => {
    const prefix = showSign && amount >= 0 ? '+' : '';
    const absAmount = Math.abs(amount);
    
    return prefix + absAmount.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    });
  }, []);

  const getCurrencySymbol = useCallback(() => {
    return currency.symbol;
  }, [currency]);

  const value = useMemo(() => ({
    currency,
    setCurrency,
    formatAmount,
    formatNumber,
    getCurrencySymbol,
    loading,
  }), [currency, formatAmount, formatNumber, getCurrencySymbol, loading]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};