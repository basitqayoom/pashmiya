'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Currency {
  code: string;
  symbol: string;
  rate: number; // rate to EUR
}

const currencies: Currency[] = [
  { code: 'EUR', symbol: '€', rate: 1 },
  { code: 'USD', symbol: '$', rate: 1.1 },
  { code: 'GBP', symbol: '£', rate: 0.85 },
  { code: 'INR', symbol: '₹', rate: 90 },
  { code: 'JPY', symbol: '¥', rate: 165 },
  { code: 'AUD', symbol: 'A$', rate: 1.65 },
  { code: 'CAD', symbol: 'C$', rate: 1.5 },
  { code: 'CHF', symbol: 'CHF', rate: 0.95 },
  { code: 'CNY', symbol: '¥', rate: 7.8 },
  { code: 'SGD', symbol: 'S$', rate: 1.45 },
];

export { currencies };

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (code: string) => void;
  formatPrice: (priceInEUR: number) => string;
  currencies: Currency[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(currencies[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('pashmiya-currency');
    if (saved) {
      const found = currencies.find(c => c.code === saved);
      if (found) setCurrencyState(found);
    } else {
      const userCountry = Intl.NumberFormat().resolvedOptions().locale.split('-')[1];
      if (userCountry === 'US') setCurrencyState(currencies[1]);
      else if (userCountry === 'GB') setCurrencyState(currencies[2]);
      else if (userCountry === 'IN') setCurrencyState(currencies[3]);
      else if (userCountry === 'JP') setCurrencyState(currencies[4]);
      else if (userCountry === 'AU') setCurrencyState(currencies[5]);
      else if (userCountry === 'CA') setCurrencyState(currencies[6]);
      else if (userCountry === 'CH') setCurrencyState(currencies[7]);
      else if (userCountry === 'CN') setCurrencyState(currencies[8]);
      else if (userCountry === 'SG') setCurrencyState(currencies[9]);
    }
    setMounted(true);
  }, []);

  const setCurrency = (code: string) => {
    const found = currencies.find(c => c.code === code);
    if (found) {
      setCurrencyState(found);
      localStorage.setItem('pashmiya-currency', code);
    }
  };

  const formatPrice = (priceInEUR: number): string => {
    const converted = priceInEUR * currency.rate;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 0,
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, currencies }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}
