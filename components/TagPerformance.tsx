import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Trade } from '../types';
import { TrendingUp, TrendingDown, Tag } from 'lucide-react';
import { formatTag } from '../utils/tags';
import { useCurrency } from '../contexts/CurrencyContext';

interface TagPerformanceProps {
  trades: Trade[];
}

interface TagStat {
  tag: string;
  totalPnl: number;
  tradeCount: number;
  winCount: number;
  winRate: number;
}

const TagPerformanceListItem: React.FC<{ stat: TagStat, isProfitable: boolean, formatCurrency: (val: number) => string }> = ({ stat, isProfitable, formatCurrency }) => {
    const pnlColor = isProfitable ? 'text-brand-profit' : 'text-brand-loss';
    const pnlBg = isProfitable ? 'bg-brand-profit' : 'bg-brand-loss';
    const totalPnlAbs = Math.abs(stat.totalPnl);

    // This is a placeholder for max P&L to create a relative bar. A more sophisticated approach could be used.
    const maxPnlInList = 5000;
    const barWidth = Math.min(100, (totalPnlAbs / maxPnlInList) * 100);

    return (
        <li className="p-3 bg-brand-surface-light rounded-lg border border-brand-border-soft">
            <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-sm text-brand-text-primary truncate">{formatTag(stat.tag)}</span>
                <span className={`font-semibold text-sm ${pnlColor}`}>
                    {formatCurrency(stat.totalPnl)}
                </span>
            </div>
            <div className="flex justify-between items-center text-xs text-brand-text-secondary">
                <span>{stat.winRate.toFixed(0)}% WR</span>
                <span>{stat.tradeCount} trade{stat.tradeCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="relative h-1.5 w-full bg-brand-surface rounded-full mt-2 overflow-hidden">
                <div className={`absolute top-0 left-0 h-full rounded-full ${pnlBg}`} style={{ width: `${barWidth}%` }}></div>
            </div>
        </li>
    );
};


const TagPerformance: React.FC<TagPerformanceProps> = ({ trades }) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  const tagStats = useMemo<TagStat[]>(() => {
    const statsMap = new Map<string, Omit<TagStat, 'tag' | 'winRate'>>();
    trades.forEach(trade => {
      if (trade.tags) {
        Object.values(trade.tags).flat().forEach(tag => {
          if (typeof tag === 'string' && tag) {
            const stat = statsMap.get(tag) || { totalPnl: 0, tradeCount: 0, winCount: 0 };
            stat.totalPnl += trade.pnl;
            stat.tradeCount++;
            if (trade.pnl > 0) {
              stat.winCount++;
            }
            statsMap.set(tag, stat);
          }
        });
      }
    });
    return Array.from(statsMap.entries()).map(([tag, stat]) => ({
      tag,
      ...stat,
      winRate: stat.tradeCount > 0 ? (stat.winCount / stat.tradeCount) * 100 : 0,
    })).filter(s => s.tradeCount >= 3); // Only consider tags used at least 3 times
  }, [trades]);

  const { topProfitable, topUnprofitable } = useMemo(() => {
    const profitable = tagStats.filter(s => s.totalPnl > 0).sort((a, b) => b.totalPnl - a.totalPnl);
    const unprofitable = tagStats.filter(s => s.totalPnl < 0).sort((a, b) => a.totalPnl - b.totalPnl);
    return {
      topProfitable: profitable.slice(0, 3),
      topUnprofitable: unprofitable.slice(0, 3),
    };
  }, [tagStats]);

  const hasData = topProfitable.length > 0 || topUnprofitable.length > 0;

  if (!hasData) {
    return (
      <div>
        <h3 className="font-semibold mb-4 text-brand-text-primary">{t('dashboard.tagPerformance')}</h3>
        <div className="text-center text-brand-text-secondary py-8 px-4 rounded-lg bg-brand-surface-light border border-dashed border-brand-border h-[260px] flex flex-col justify-center items-center">
          <Tag size={32} className="mb-2"/>
          <p>{t('dashboard.notEnoughDataTags')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-semibold mb-4 text-brand-text-primary">{t('dashboard.tagPerformance')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={18} className="text-brand-profit" />
                <h4 className="font-semibold text-sm text-brand-text-primary">{t('dashboard.topProfitableTags')}</h4>
            </div>
            {topProfitable.length > 0 ? (
                <ul className="space-y-2">
                    {topProfitable.map(stat => <TagPerformanceListItem key={stat.tag} stat={stat} isProfitable={true} formatCurrency={formatCurrency} />)}
                </ul>
            ) : <p className="text-xs text-center text-brand-text-secondary p-4">{t('dashboard.noProfitableTags')}</p>}
        </div>
        <div>
            <div className="flex items-center gap-2 mb-3">
                <TrendingDown size={18} className="text-brand-loss" />
                <h4 className="font-semibold text-sm text-brand-text-primary">{t('dashboard.topUnprofitableTags')}</h4>
            </div>
            {topUnprofitable.length > 0 ? (
                <ul className="space-y-2">
                    {topUnprofitable.map(stat => <TagPerformanceListItem key={stat.tag} stat={stat} isProfitable={false} formatCurrency={formatCurrency} />)}
                </ul>
            ) : <p className="text-xs text-center text-brand-text-secondary p-4">{t('dashboard.noUnprofitableTags')}</p>}
        </div>
      </div>
    </div>
  );
};

export default React.memo(TagPerformance);