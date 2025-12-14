import { useState, useEffect, useCallback } from 'react';
import { Trade } from '../types';
import { get, set } from '../utils/db';

const STORAGE_KEY = 'suggestedPairs';

const DEFAULT_PAIRS = [
    'EUR/USD', 
    'GBP/USD', 
    'USD/JPY', 
    'NASDAQ',
    'XAU/USD',
    'SPY',
    'US30'
];

export const useSuggestedPairs = (trades: Trade[]) => {
  const [pairs, setPairs] = useState<string[]>([]);

  useEffect(() => {
    const loadPairs = async () => {
        try {
            const storedPairs = await get<string[]>(STORAGE_KEY);
            if (storedPairs) {
                setPairs(storedPairs);
            } else {
                const pairsFromTrades = [...new Set(trades.map(t => t.pair.toUpperCase()))];
                const initialPairs = [...new Set([...DEFAULT_PAIRS, ...pairsFromTrades])].sort();
                setPairs(initialPairs);
                await set(STORAGE_KEY, initialPairs);
            }
        } catch (error) {
            console.error("Failed to load pairs from DB", error);
            setPairs(DEFAULT_PAIRS);
        }
    };
    loadPairs();
  }, [trades]);

  const savePairs = useCallback((pairsToSave: string[]) => {
    set(STORAGE_KEY, pairsToSave).catch(error => {
        console.error("Failed to save pairs to DB", error);
    });
  }, []);

  const addPair = useCallback((pair: string) => {
    const upperPair = pair.toUpperCase().trim();
    setPairs(prevPairs => {
      if (upperPair && !prevPairs.includes(upperPair)) {
        const newPairs = [...prevPairs, upperPair].sort();
        savePairs(newPairs);
        return newPairs;
      }
      return prevPairs;
    });
  }, [savePairs]);

  const removePair = useCallback((pairToRemove: string) => {
    const upperPair = pairToRemove.toUpperCase();
    setPairs(prevPairs => {
      const newPairs = prevPairs.filter(p => p !== upperPair);
      savePairs(newPairs);
      return newPairs;
    });
  }, [savePairs]);

  return { pairs, addPair, removePair };
};