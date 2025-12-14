import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { get, set } from '../utils/db';

const STORAGE_KEY = 'userCurrency';

export const AVAILABLE_CURRENCIES = [
    { code: 'USD', label: 'USD - US Dollar', symbol: '$' },
    { code: 'EUR', label: 'EUR - Euro', symbol: '€' },
    { code: 'GBP', label: 'GBP - British Pound', symbol: '£' },
    { code: 'JPY', label: 'JPY - Japanese Yen', symbol: '¥' },
    { code: 'AUD', label: 'AUD - Australian Dollar', symbol: 'A$' },
    { code: 'CAD', label: 'CAD - Canadian Dollar', symbol: 'C$' },
    { code: 'CHF', label: 'CHF - Swiss Franc', symbol: 'Fr' },
    { code: 'CNY', label: 'CNY - Chinese Yuan', symbol: '¥' },
    { code: 'BRL', label: 'BRL - Brazilian Real', symbol: 'R$' },
    { code: 'INR', label: 'INR - Indian Rupee', symbol: '₹' },
];

interface CurrencyContextType {
  currency: string;
  setCurrency: (code: string) => void;
  formatCurrency: (value: number) => string;
  currencySymbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>('USD');

  useEffect(() => {
    get<string>(STORAGE_KEY).then(stored => {
        if (stored) setCurrencyState(stored);
    }).catch(e => console.error("Failed to load currency from DB", e));
  }, []);

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    set(STORAGE_KEY, code).catch(e => console.error("Failed to save currency to DB", e));
  }, []);

  const formatCurrency = useCallback((value: number) => {
    // We use en-US locale for consistent formatting (e.g. 1,000.00) but change the currency code.
    // Ideally, we could switch locale based on currency, but keeping 'en-US' is safer for layout consistency in this specific UI.
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
  }, [currency]);

  const currencySymbol = AVAILABLE_CURRENCIES.find(c => c.code === currency)?.symbol || '$';

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency, currencySymbol }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};