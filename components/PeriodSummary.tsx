import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Trade } from '../types';
import {
  endOfMonth,
  eachMonthOfInterval,
  format,
  eachWeekOfInterval,
  isWithinInterval,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useDateFnsLocale } from '../hooks/useDateFnsLocale';
import { useCurrency } from '../contexts/CurrencyContext';

interface PeriodSummaryProps {
  trades: Trade[];
  period: 'month' | 'year';
  currentDate: Date;
}

interface PeriodStats {
  label: string;
  totalPnl: number;
  tradeCount: number;
  winRate: number;
}

const PeriodSummary: React.FC<PeriodSummaryProps> = ({ trades, period, currentDate }) => {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const { formatCurrency } = useCurrency();
  
  const summaryData = useMemo<PeriodStats[]>(() => {
    if (period === 'year') {
      const yearStart = new Date(currentDate.getFullYear(), 0, 1);
      const yearEnd = new Date(currentDate.getFullYear(), 11, 31);
      const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
      
      return months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        
        const monthTrades = trades.filter(t => {
          const tradeDate = new Date(t.date + 'T00:00:00');
          return isWithinInterval(tradeDate, { start: monthStart, end: monthEnd });
        });

        const totalPnl = monthTrades.reduce((acc, t) => acc + t.pnl, 0);
        const winningTrades = monthTrades.filter(t => t.pnl > 0).length;
        const tradeCount = monthTrades.length;
        const winRate = tradeCount > 0 ? (winningTrades / tradeCount) * 100 : 0;

        return {
          label: format(month, 'MMMM', { locale }),
          totalPnl,
          tradeCount,
          winRate,
        };
      });
    }

    if (period === 'month') {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { locale });

        return weeks.map((weekStart, index) => {
            const weekEnd = endOfWeek(weekStart, { locale });
            const weekTrades = trades.filter(t => {
                const tradeDate = new Date(t.date + 'T00:00:00');
                return isWithinInterval(tradeDate, { start: weekStart, end: weekEnd });
            });

            const totalPnl = weekTrades.reduce((acc, t) => acc + t.pnl, 0);
            const winningTrades = weekTrades.filter(t => t.pnl > 0).length;
            const tradeCount = weekTrades.length;
            const winRate = tradeCount > 0 ? (winningTrades / tradeCount) * 100 : 0;
            
            return {
                label: `${t('calendar.week')} ${index + 1}`,
                totalPnl,
                tradeCount,
                winRate,
            };
        }).filter(week => week.tradeCount > 0);
    }
    return [];
  }, [trades, period, currentDate, locale, t]);

  const title = period === 'year' ? t('periodSummary.monthly') : t('periodSummary.weekly');

  const hasData = summaryData.some(s => s.tradeCount > 0);

  return (
    <div>
      <h3 className="font-semibold mb-4 text-brand-text-primary">{title}</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {hasData ? summaryData.map((stats, index) => {
            if (stats.tradeCount === 0) return null; // Don't show empty periods
            
            const pnlColor = stats.totalPnl > 0 ? 'text-brand-profit' : stats.totalPnl < 0 ? 'text-brand-loss' : 'text-brand-text-secondary';
            const Icon = stats.totalPnl > 0 ? TrendingUp : stats.totalPnl < 0 ? TrendingDown : Minus;

            return (
                <div key={index} className="bg-brand-surface-light rounded-lg p-3 grid grid-cols-3 items-center gap-4 border border-brand-border-soft">
                    <div className="col-span-1 flex items-center gap-3">
                        <Icon size={20} className={pnlColor} />
                        <p className="font-semibold text-sm text-brand-text-primary">{stats.label}</p>
                    </div>
                    <div className="col-span-1 text-center">
                        <p className="text-xs text-brand-text-secondary">{t('tradeModal.trade', { count: stats.tradeCount })}</p>
                        <p className="font-semibold text-sm">{stats.winRate.toFixed(1)}% WR</p>
                    </div>
                    <div className="col-span-1 text-right">
                         <p className={`font-bold text-base ${pnlColor}`}>
                            {formatCurrency(stats.totalPnl)}
                        </p>
                    </div>
                </div>
            )
        }) : (
            <p className="text-center text-brand-text-secondary py-4 text-sm">{t('periodSummary.noTrades')}</p>
        )}
      </div>
    </div>
  );
};

export default React.memo(PeriodSummary);