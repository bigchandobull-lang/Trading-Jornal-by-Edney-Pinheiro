import { useMemo } from 'react';
import { useTradesContext } from '../contexts/TradesContext';

const MAX_SUGGESTIONS = 3;

/**
 * A hook that provides intelligent tag suggestions for a given trading pair
 * based on historical data. It finds the most frequently used tags for that pair.
 * @param pair The trading pair to get suggestions for.
 * @returns An array of suggested tag strings.
 */
export const useSmartTagSuggestions = (pair: string): string[] => {
  const { trades } = useTradesContext();

  return useMemo(() => {
    if (!pair) {
      return [];
    }

    const upperPair = pair.toUpperCase();
    
    // 1. Filter for trades that match the pair and have at least one tag.
    const relevantTrades = trades.filter(trade => {
        if (trade.pair.toUpperCase() !== upperPair || !trade.tags) {
            return false;
        }
        // Ensure the trade actually has tags by checking the flattened array of tag values.
        const allTags = Object.values(trade.tags).flat().filter(Boolean);
        return allTags.length > 0;
    });

    if (relevantTrades.length < 2) {
        return [];
    }

    // 2. Calculate the frequency of each tag used in the relevant trades.
    const tagFrequency = new Map<string, number>();
    relevantTrades.forEach(trade => {
      // Safely flatten all tag values from the TradeTags object into a single array.
      const allTagValues = Object.values(trade.tags!).flat().filter(Boolean) as string[];
      allTagValues.forEach(tag => {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      });
    });

    // 3. Sort by frequency and return the top suggestions.
    return Array.from(tagFrequency.entries())
      .sort((a, b) => b[1] - a[1]) 
      .slice(0, MAX_SUGGESTIONS)
      .map(([tag]) => tag);
  }, [trades, pair]);
};