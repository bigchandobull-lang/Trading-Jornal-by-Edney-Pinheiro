import { useState, useEffect, useCallback } from 'react';
import { Trade, TradeTags } from '../types';
import { getAllTrades, addTradeDB, deleteTradeDB, updateTradeDB, bulkAddTradesDB, clearTradesDB } from '../utils/db';

const generateId = () => `trade_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`;

const sortTrades = (tradeList: Trade[]): Trade[] => {
  return tradeList.sort((a, b) => {
    // String comparison of ISO timestamps is faster than creating Date objects
    const dateTimeA = a.date + (a.time || '');
    const dateTimeB = b.date + (b.time || '');
    return dateTimeB.localeCompare(dateTimeA);
  });
};

export const useTrades = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTrades = async () => {
      try {
        const dbTrades = await getAllTrades();
        let hasMigrationChanges = false;

        const migratedTrades = dbTrades.map(trade => {
            if (Array.isArray(trade.tags)) {
                hasMigrationChanges = true;
                const newTags: TradeTags = {};
                const knownCategories: (keyof TradeTags)[] = ['strategy', 'trigger', 'session', 'mistakes', 'confidence', 'emotions'];

                (trade.tags as string[]).forEach(tag => {
                    const parts = tag.split(':');
                    const prefix = parts[0];
                    const value = parts.length > 1 ? parts.slice(1).join(':') : null;

                    if (value && knownCategories.some(k => k === prefix)) {
                        const category = prefix as keyof TradeTags;
                        if (category === 'confidence') {
                            newTags.confidence = value;
                        } else {
                            const currentTags = (newTags as any)[category] as string[] | undefined;
                            (newTags as any)[category] = [...(currentTags || []), value];
                        }
                    } else {
                        if (!newTags.custom) newTags.custom = [];
                        newTags.custom.push(tag);
                    }
                });
                return { ...trade, tags: newTags };
            }
            return trade;
        });

        // If migration happened, persist changes to DB to improve future load times
        if (hasMigrationChanges) {
            await bulkAddTradesDB(migratedTrades);
        }

        setTrades(sortTrades(migratedTrades));
      } catch (error) {
        console.error("Failed to load trades from IndexedDB", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTrades();
  }, []);

  const addTrade = useCallback((trade: Omit<Trade, 'id'>): Trade => {
    const newTrade: Trade = { ...trade, id: generateId() };
    addTradeDB(newTrade).then(() => {
        setTrades(prevTrades => sortTrades([newTrade, ...prevTrades]));
    }).catch(error => console.error("Failed to add trade to DB", error));
    return newTrade;
  }, []);

  const deleteTrade = useCallback((tradeId: string) => {
    deleteTradeDB(tradeId).then(() => {
        setTrades(prevTrades => prevTrades.filter(trade => trade.id !== tradeId));
    }).catch(error => console.error("Failed to delete trade from DB", error));
  }, []);
  
  const deleteMultipleTrades = useCallback((tradeIds: string[]) => {
    const idsToDelete = new Set(tradeIds);
    const deletePromises = tradeIds.map(id => deleteTradeDB(id));
    Promise.all(deletePromises).then(() => {
        setTrades(prevTrades => prevTrades.filter(trade => !idsToDelete.has(trade.id)));
    }).catch(error => console.error("Failed to delete multiple trades from DB", error));
  }, []);

  const updateTrade = useCallback(async (tradeId: string, updates: Partial<Omit<Trade, 'id'>>) => {
    const originalTrade = trades.find(t => t.id === tradeId);
    if (!originalTrade) return;

    const updatedTrade = { ...originalTrade, ...updates };
    try {
        await updateTradeDB(updatedTrade);
        setTrades(prevTrades => {
            const updatedTrades = prevTrades.map(t => t.id === tradeId ? updatedTrade : t);
            if (updates.date || updates.time) {
                return sortTrades(updatedTrades);
            }
            return updatedTrades;
        });
    } catch (error) {
        console.error("Failed to update trade in DB", error);
        throw error; // Re-throw to allow UI to handle it
    }
  }, [trades]);
  
  const importTrades = useCallback((newTrades: Trade[]) => {
    if (!Array.isArray(newTrades)) {
        console.error("Import failed: provided data is not an array.");
        return;
    }
    clearTradesDB().then(() => {
        const tradesWithIds = newTrades.map(t => ({...t, id: t.id || generateId()}))
        bulkAddTradesDB(tradesWithIds).then(() => {
            setTrades(sortTrades(tradesWithIds));
        }).catch(error => console.error("Failed to bulk add trades to DB", error));
    }).catch(error => console.error("Failed to clear trades from DB before import", error));
  }, []);
  
  return { trades, addTrade, deleteTrade, deleteMultipleTrades, updateTrade, importTrades, isLoaded };
};