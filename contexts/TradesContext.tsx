import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Trade } from '../types';
import { useTrades } from '../hooks/useTrades';
import { useSuggestedPairs } from '../hooks/useSuggestedPairs';
import { handlePairLearningOnAdd, handlePairLearningOnUpdate } from '../utils/tradeUtils';
import { useTagOptions, TagOptions } from '../hooks/useTagOptions';

interface TradesContextType {
  trades: Trade[];
  addTrade: (trade: Omit<Trade, 'id'>) => Trade;
  deleteTrade: (tradeId: string) => void;
  deleteMultipleTrades: (tradeIds: string[]) => void;
  updateTrade: (tradeId: string, updates: Partial<Omit<Trade, 'id'>>) => Promise<void>;
  importTrades: (newTrades: Trade[]) => void;
  isLoaded: boolean;
  pairs: string[];
  removePair: (pair: string) => void;
  allTags: string[];
  lastUsedPair: string | null;
  tagOptions: TagOptions;
  addTagOption: (category: keyof TagOptions, option: string) => void;
}

const TradesContext = createContext<TradesContextType | undefined>(undefined);

export const TradesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { trades, addTrade: rawAddTrade, deleteTrade, deleteMultipleTrades, updateTrade: rawUpdateTrade, importTrades, isLoaded } = useTrades();
  const { pairs, addPair, removePair } = useSuggestedPairs(trades);
  const { tagOptions, addTagOption } = useTagOptions();
  
  const addTrade = useCallback((trade: Omit<Trade, 'id'>): Trade => {
    handlePairLearningOnAdd(trade, trades, pairs, addPair);
    return rawAddTrade(trade);
  }, [rawAddTrade, addPair, trades, pairs]);

  const updateTrade = useCallback(async (tradeId: string, updates: Partial<Omit<Trade, 'id'>>) => {
    handlePairLearningOnUpdate(tradeId, updates, trades, pairs, addPair);
    await rawUpdateTrade(tradeId, updates);
  }, [rawUpdateTrade, addPair, trades, pairs]);
  
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    trades.forEach(trade => {
        if (trade.tags) {
            Object.values(trade.tags).flat().filter(Boolean).forEach(tag => tagSet.add(tag as string));
        }
    });
    return Array.from(tagSet).sort();
  }, [trades]);

  const lastUsedPair = useMemo(() => {
    // The `trades` are sorted newest first from the useTrades hook
    return trades[0]?.pair || null;
  }, [trades]);

  const value = {
    trades,
    addTrade,
    deleteTrade,
    deleteMultipleTrades,
    updateTrade,
    importTrades,
    isLoaded,
    pairs,
    removePair,
    allTags,
    lastUsedPair,
    tagOptions,
    addTagOption,
  };

  return (
    <TradesContext.Provider value={value}>
      {children}
    </TradesContext.Provider>
  );
};

export const useTradesContext = (): TradesContextType => {
  const context = useContext(TradesContext);
  if (context === undefined) {
    throw new Error('useTradesContext must be used within a TradesProvider');
  }
  return context;
};