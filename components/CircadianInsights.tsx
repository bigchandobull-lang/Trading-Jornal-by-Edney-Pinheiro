import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Trade } from '../types';
import { TrendingUp, AlertTriangle, Info, Clock } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';

interface CircadianInsightsProps {
  trades: Trade[];
}

interface TimeWindowStats {
  name: string;
  start: string;
  end: string;
  totalPnl: number;
  winCount: number;
  tradeCount: number;
  winRate: number;
}

const MIN_TRADES_FOR_INSIGHT = 3;

interface InsightCardProps {
    type: 'profit' | 'loss';
    window: TimeWindowStats;
}

const InsightCard: React.FC<InsightCardProps> = React.memo(({ type, window }) => {
    const { t } = useTranslation();
    const { formatCurrency } = useCurrency();
    const isProfit = type === 'profit';
    const config = {
        profit: {
            title: t('circadian.insights.profitZone'),
            description: t('circadian.insights.profitZoneDesc', { start: window.start, end: window.end, winRate: window.winRate.toFixed(0) }),
            icon: <TrendingUp size={24} className="text-brand-profit" />,
            colors: "bg-brand-profit/10 border-brand-profit/30"
        },
        loss: {
            title: t('circadian.insights.cautionZone'),
            description: t('circadian.insights.cautionZoneDesc', { start: window.start }),
            icon: <AlertTriangle size={24} className="text-brand-accent" />,
            colors: "bg-brand-accent/10 border-brand-accent/30"
        }
    };
    const current = config[type];
    const pnlColor = window.totalPnl >= 0 ? 'text-brand-profit' : 'text-brand-loss';

    return (
        <div className={`flex items-start gap-4 p-4 rounded-2xl border backdrop-blur-md ${current.colors}`}>
            <div className="flex-shrink-0 mt-0.5">{current.icon}</div>
            <div className="flex-1">
                <h4 className="font-bold text-brand-text-primary">{current.title}</h4>
                <p className="text-sm text-brand-text-secondary mt-1">{current.description}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-brand-text-secondary">
                    <span className="flex items-center gap-1.5">
                        <Clock size={14} /> 
                        <span className="font-semibold">{t('circadian.insights.trades', { count: window.tradeCount })}</span>
                    </span>
                     <span className={`font-semibold ${pnlColor}`}>
                        {formatCurrency(window.totalPnl)}
                    </span>
                </div>
            </div>
        </div>
    );
});


const CircadianInsights: React.FC<CircadianInsightsProps> = ({ trades }) => {
  const { t } = useTranslation();
  const TIME_WINDOWS = useMemo(() => [
      { name: t('circadian.insights.openingBell'), start: '08:00', end: '10:00' },
      { name: t('circadian.insights.midMorning'), start: '10:00', end: '12:00' },
      { name: t('circadian.insights.lunchLull'), start: '12:00', end: '14:00' },
      { name: t('circadian.insights.afternoonSession'), start: '14:00', end: '16:00' },
      { name: t('circadian.insights.closingBell'), start: '16:00', end: '18:00' },
  ], [t]);

  const timeWindowStats = useMemo(() => {
    const stats: { [key: string]: Omit<TimeWindowStats, 'name'|'start'|'end'|'winRate'> } = TIME_WINDOWS.reduce((acc, window) => {
        acc[window.name] = { totalPnl: 0, winCount: 0, tradeCount: 0 };
        return acc;
    }, {} as { [key: string]: any });

    trades.forEach(trade => {
        if (!trade.time) return;
        const window = TIME_WINDOWS.find(w => trade.time >= w.start && trade.time < w.end);
        if (window) {
            stats[window.name].totalPnl += trade.pnl;
            stats[window.name].tradeCount++;
            if (trade.pnl > 0) {
                stats[window.name].winCount++;
            }
        }
    });

    return TIME_WINDOWS.map(w => ({
        ...w,
        ...stats[w.name],
        winRate: stats[w.name].tradeCount > 0 ? (stats[w.name].winCount / stats[w.name].tradeCount) * 100 : 0,
    }));
  }, [trades, TIME_WINDOWS]);

  const insights = useMemo(() => {
    const validWindows = timeWindowStats.filter(w => w.tradeCount >= MIN_TRADES_FOR_INSIGHT);

    if (validWindows.length === 0) return null;

    const bestWindow = [...validWindows]
        .filter(w => w.totalPnl > 0)
        .sort((a, b) => b.winRate - a.winRate)[0] || null;
      
    const worstWindow = [...validWindows]
        .filter(w => w.winRate < 50 || w.totalPnl < 0)
        .sort((a, b) => a.totalPnl - b.totalPnl)[0] || null;

    return { bestWindow, worstWindow };
  }, [timeWindowStats]);

  if (!insights || (!insights.bestWindow && !insights.worstWindow)) {
    return (
        <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl bg-brand-surface-light p-4 text-center text-sm text-brand-text-secondary border border-brand-border-soft">
            <Info size={18} />
            <p>{t('circadian.insights.unlock')}</p>
        </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
      {insights.bestWindow && <InsightCard type="profit" window={insights.bestWindow} />}
      {insights.worstWindow && insights.worstWindow !== insights.bestWindow && <InsightCard type="loss" window={insights.worstWindow} />}
    </div>
  );
};

export default React.memo(CircadianInsights);