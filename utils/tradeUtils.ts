import { Trade } from '../types';

/**
 * Handles the logic for learning a new suggested pair when a trade is added.
 * A pair is added to suggestions if it's new and has been used more than twice.
 * @param newTrade The trade being added.
 * @param allTrades The complete list of trades before this addition.
 * @param suggestedPairs The current list of suggested pairs.
 * @param addPairFn The function to call to add a pair.
 */
export const handlePairLearningOnAdd = (
  newTrade: Omit<Trade, 'id'>,
  allTrades: Trade[],
  suggestedPairs: string[],
  addPairFn: (pair: string) => void
): void => {
  const newPair = newTrade.pair.toUpperCase().trim();
  if (newPair && !suggestedPairs.includes(newPair)) {
    // +1 for the trade currently being added
    const count = allTrades.filter(t => t.pair.toUpperCase().trim() === newPair).length + 1;
    if (count > 2) {
      addPairFn(newPair);
    }
  }
};

/**
 * Handles the logic for learning a new suggested pair when a trade is updated.
 * A pair is added to suggestions if it's new and has been used more than twice.
 * @param tradeId The ID of the trade being updated.
 * @param updates The partial updates for the trade.
 * @param allTrades The complete list of trades before this update.
 * @param suggestedPairs The current list of suggested pairs.
 * @param addPairFn The function to call to add a pair.
 */
export const handlePairLearningOnUpdate = (
  tradeId: string,
  updates: Partial<Omit<Trade, 'id'>>,
  allTrades: Trade[],
  suggestedPairs: string[],
  addPairFn: (pair: string) => void
): void => {
  const updatedPair = updates.pair?.toUpperCase().trim();
  if (updatedPair && !suggestedPairs.includes(updatedPair)) {
    // Create a preview of the next state of trades to get an accurate count
    const nextTrades = allTrades.map(t =>
      t.id === tradeId ? { ...t, ...updates } : t
    );
    const count = nextTrades.filter(t => t.pair.toUpperCase().trim() === updatedPair).length;
    if (count > 2) {
      addPairFn(updatedPair);
    }
  }
};
