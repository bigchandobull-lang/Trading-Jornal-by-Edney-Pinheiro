import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../components/ThemeProvider';
import { get, set, del } from '../utils/db';

const STORAGE_KEY = 'appColors';

interface CustomColors {
  profit: string;
  loss: string;
}

const getDefaultsFromCSS = () => {
    const DEFAULTS = { profit: '#059669', loss: '#DC2626' };
    if (typeof document === 'undefined') return DEFAULTS;
    
    const el = document.createElement('div');
    document.body.appendChild(el);
    const styles = getComputedStyle(el);
    const profit = styles.getPropertyValue('--brand-profit').trim() || DEFAULTS.profit;
    const loss = styles.getPropertyValue('--brand-loss').trim() || DEFAULTS.loss;
    document.body.removeChild(el);

    return { profit, loss };
}

export const useAppColors = () => {
  const { theme } = useTheme();

  const [customColors, setCustomColors] = useState<CustomColors | null>(null);

  useEffect(() => {
    get<CustomColors>(STORAGE_KEY).then(stored => {
        setCustomColors(stored || null);
    }).catch(e => console.error("Failed to load colors from DB", e));
  }, []);

  useEffect(() => {
    const defaults = getDefaultsFromCSS();
    const profit = customColors?.profit || defaults.profit;
    const loss = customColors?.loss || defaults.loss;

    if (typeof document !== 'undefined') {
        document.body.style.setProperty('--brand-profit', profit);
        document.body.style.setProperty('--brand-loss', loss);
    }
    
    return () => {
        if (typeof document !== 'undefined') {
            document.body.style.removeProperty('--brand-profit');
            document.body.style.removeProperty('--brand-loss');
        }
    }
  }, [customColors, theme]);

  const [chartColors, setChartColors] = useState({
      grid: '', text: '', profit: '', loss: '', brushFill: ''
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
        const bodyStyles = getComputedStyle(document.body);
        setChartColors({
            grid: bodyStyles.getPropertyValue('--color-border-soft').trim(),
            text: bodyStyles.getPropertyValue('--color-text-secondary').trim(),
            profit: bodyStyles.getPropertyValue('--brand-profit').trim(),
            loss: bodyStyles.getPropertyValue('--brand-loss').trim(),
            brushFill: bodyStyles.getPropertyValue('--color-surface-opaque').trim()
        });
    }
  }, [customColors, theme]);


  const handleSetCustomColors = useCallback((newColors: Partial<CustomColors>) => {
    const updatedColors = { ...(customColors || getDefaultsFromCSS()), ...newColors } as CustomColors;
    set(STORAGE_KEY, updatedColors)
        .then(() => setCustomColors(updatedColors))
        .catch(error => console.error("Failed to save custom colors.", error));
  }, [customColors]);


  const resetColors = useCallback(() => {
    del(STORAGE_KEY)
        .then(() => setCustomColors(null))
        .catch(error => console.error("Failed to reset colors.", error));
  }, []);
  
  return { 
      chartColors,
      setCustomColors: handleSetCustomColors, 
      resetColors 
  };
};