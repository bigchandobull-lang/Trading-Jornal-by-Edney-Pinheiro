import { useMemo } from 'react';
import { Trade, Streak } from '../types';

const STREAK_THRESHOLD = 3;

export const useTradeCycleTracker = (trades: Trade[]): Streak | null => {
  return useMemo(() => {
    if (trades.length < STREAK_THRESHOLD) {
      return null;
    }

    // Sort trades chronologically using string comparison for performance
    const sortedTrades = trades
      .slice()
      .sort((a, b) => {
          const dateTimeA = a.date + (a.time || '');
          const dateTimeB = b.date + (b.time || '');
          return dateTimeA.localeCompare(dateTimeB);
      });
    
    if (sortedTrades.length < STREAK_THRESHOLD) {
        return null;
    }
    
    const recentTrades = sortedTrades.slice(-STREAK_THRESHOLD);
    const lastTrade = recentTrades[recentTrades.length - 1];

    const isLosingStreak = lastTrade.pnl < 0 && recentTrades.every(trade => trade.pnl < 0);
    const isWinningStreak = lastTrade.pnl > 0 && recentTrades.every(trade => trade.pnl > 0);

    if (isLosingStreak || isWinningStreak) {
        const streakType = isLosingStreak ? 'loss' : 'win';
        let streakLength = 0;
        for (let i = sortedTrades.length - 1; i >= 0; i--) {
            const currentTrade = sortedTrades[i];
            const matchesStreakType = (streakType === 'loss' && currentTrade.pnl < 0) || (streakType === 'win' && currentTrade.pnl > 0);
            if (matchesStreakType) {
                streakLength++;
            } else {
                break;
            }
        }

        if (streakLength >= STREAK_THRESHOLD) {
            return { type: streakType, length: streakLength };
        }
    }

    return null;
  }, [trades]);
};