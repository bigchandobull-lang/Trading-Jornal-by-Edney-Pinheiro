import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { useTheme } from '../components/ThemeProvider';
import { get, set, del } from '../utils/db';

const STORAGE_KEY = 'appColors';

interface CustomColors {
  profit: string;
  loss: string;
}

interface ChartColors {
    grid: string; text: string; profit: string; loss: string; brushFill: string;
}

interface ColorContextType {
  chartColors: ChartColors;
  setCustomColors: (newColors: Partial<CustomColors>) => void;
  resetColors: () => void;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

const getDefaultsFromCSS = () => {
    const DEFAULTS = { profit: '#10B981', loss: '#F43F5E' };
    if (typeof document === 'undefined') return DEFAULTS;
    
    // We need to check if the body is in dark mode to return correct defaults
    const isDark = document.body.classList.contains('dark');
    const defaultProfit = isDark ? '#2DD4BF' : '#10B981';
    const defaultLoss = isDark ? '#F47174' : '#F43F5E';
    
    // Create a temporary element to read the default values from CSS variables
    const el = document.createElement('div');
    document.body.appendChild(el);
    const styles = getComputedStyle(document.body);
    // If the style is set, it might be from a previous instance of the provider
    // So we check against the hardcoded defaults
    const profit = styles.getPropertyValue('--brand-profit').trim();
    const loss = styles.getPropertyValue('--brand-loss').trim();
    document.body.removeChild(el);

    return { 
        profit: (profit && profit !== defaultProfit) ? profit : defaultProfit, 
        loss: (loss && loss !== defaultLoss) ? loss : defaultLoss,
    };
}

export const ColorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  const [customColors, setCustomColors] = useState<CustomColors | null>(null);
  const [chartColors, setChartColors] = useState<ChartColors>({ grid: '', text: '', profit: '', loss: '', brushFill: '' });

  useEffect(() => {
    get<CustomColors>(STORAGE_KEY)
        .then(stored => setCustomColors(stored || null))
        .catch(e => console.error("Failed to load colors from DB", e));
  }, []);

  useEffect(() => {
    const defaults = getDefaultsFromCSS();
    const profit = customColors?.profit || defaults.profit;
    const loss = customColors?.loss || defaults.loss;
    
    document.body.style.setProperty('--brand-profit', profit);
    document.body.style.setProperty('--brand-loss', loss);
    
    const bodyStyles = getComputedStyle(document.body);
    setChartColors({
        grid: bodyStyles.getPropertyValue('--color-border-soft').trim(),
        text: bodyStyles.getPropertyValue('--color-text-secondary').trim(),
        profit: bodyStyles.getPropertyValue('--brand-profit').trim(),
        loss: bodyStyles.getPropertyValue('--brand-loss').trim(),
        brushFill: bodyStyles.getPropertyValue('--color-surface-opaque').trim()
    });
    
    return () => {
      document.body.style.removeProperty('--brand-profit');
      document.body.style.removeProperty('--brand-loss');
    }
  }, [customColors, theme]);

  const handleSetCustomColors = useCallback((newColors: Partial<CustomColors>) => {
    const currentColors = customColors || getDefaultsFromCSS();
    const updatedColors = { ...currentColors, ...newColors } as CustomColors;
    set(STORAGE_KEY, updatedColors)
        .then(() => setCustomColors(updatedColors))
        .catch(error => console.error("Failed to save custom colors.", error));
  }, [customColors]);

  const resetColors = useCallback(() => {
    del(STORAGE_KEY)
        .then(() => setCustomColors(null))
        .catch(error => console.error("Failed to reset colors.", error));
  }, []);

  const value = { chartColors, setCustomColors: handleSetCustomColors, resetColors };

  return (
    <ColorContext.Provider value={value}>
      {children}
    </ColorContext.Provider>
  );
};

export const useAppColors = (): ColorContextType => {
  const context = useContext(ColorContext);
  if (context === undefined) {
    throw new Error('useAppColors must be used within a ColorProvider');
  }
  return context;
};
