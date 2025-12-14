import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trade } from '../types';
import { format } from 'date-fns';
import ViewTradeModal from './ViewTradeModal';
import { useDateFnsLocale } from '../hooks/useDateFnsLocale';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';

interface TradesTableProps {
  trades: Trade[];
  lastAddedTradeId?: string | null;
  isSelectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (tradeId: string) => void;
  onToggleSelectAll?: () => void;
  sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
  onSort?: (key: string) => void;
}

const TradesTable: React.FC<TradesTableProps> = ({
  trades,
  lastAddedTradeId,
  isSelectable = false,
  selectedIds = new Set(),
  onToggleSelect,
  onToggleSelectAll,
  sortConfig,
  onSort,
}) => {
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const { formatCurrency } = useCurrency();

  const allOnPageSelected = trades.length > 0 && trades.every(t => selectedIds.has(t.id));

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const someOnPageSelected = trades.some(t => selectedIds.has(t.id));
      selectAllCheckboxRef.current.indeterminate = someOnPageSelected && !allOnPageSelected;
    }
  }, [selectedIds, allOnPageSelected, trades]);

  const renderSortIcon = (key: string) => {
    if (!onSort) return null;
    
    const isActive = sortConfig?.key === key;
    
    if (isActive) {
        return sortConfig?.direction === 'asc' 
            ? <ArrowUp size={14} className="text-brand-accent ml-1" />
            : <ArrowDown size={14} className="text-brand-accent ml-1" />;
    }
    
    return <ArrowUpDown size={14} className="text-brand-text-tertiary opacity-0 group-hover:opacity-50 ml-1 transition-opacity" />;
  };
  
  return (
    <>
      <div className="relative w-full -mx-4 sm:mx-0 overflow-x-auto">
        <div className="min-w-full inline-block align-middle">
            <div className="max-h-[600px] overflow-y-auto border-t border-b sm:border border-brand-border-soft sm:rounded-lg">
                <table className="min-w-full divide-y divide-brand-border-soft">
                <thead className="bg-brand-surface/90 sticky top-0 z-10 backdrop-blur-md shadow-sm">
                    <tr>
                    {isSelectable && (
                        <th className="px-3 py-3 text-left text-xs font-semibold text-brand-text-secondary w-8 sm:w-12 rounded-tl-lg">
                        <input
                            type="checkbox"
                            ref={selectAllCheckboxRef}
                            checked={allOnPageSelected}
                            onChange={onToggleSelectAll}
                            aria-label={t('tooltips.selectAll')}
                            className="w-4 h-4 rounded border-brand-border bg-brand-surface text-brand-accent focus:ring-2 focus:ring-brand-accent/50 focus:ring-offset-brand-surface"
                        />
                        </th>
                    )}
                    <th 
                        className={`px-3 py-4 text-left text-xs font-semibold text-brand-text-secondary whitespace-nowrap group ${onSort ? 'cursor-pointer select-none hover:bg-white/5 transition-colors' : ''} ${!isSelectable ? 'rounded-tl-lg' : ''}`}
                        onClick={() => onSort?.('date')}
                    >
                        <div className="flex items-center">
                            {t('common.date')}
                            {renderSortIcon('date')}
                        </div>
                    </th>
                    <th className="px-3 py-4 text-left text-xs font-semibold text-brand-text-secondary whitespace-nowrap">{t('common.symbol')}</th>
                    <th className="hidden sm:table-cell px-3 py-4 text-left text-xs font-semibold text-brand-text-secondary whitespace-nowrap">{t('common.type')}</th>
                    <th 
                        className={`px-3 py-4 text-right text-xs font-semibold text-brand-text-secondary whitespace-nowrap group ${onSort ? 'cursor-pointer select-none hover:bg-white/5 transition-colors' : ''} rounded-tr-lg`}
                        onClick={() => onSort?.('pnl')}
                    >
                        <div className="flex items-center justify-end">
                            {t('dashboard.netPnl')}
                            {renderSortIcon('pnl')}
                        </div>
                    </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-brand-border-soft bg-transparent stagger-enter">
                    {trades.length > 0 ? trades.map((trade, index) => (
                    <tr
                        key={trade.id}
                        className={`transition-all duration-300 ${
                        selectedIds.has(trade.id)
                            ? 'bg-brand-accent/10'
                            : 'hover:bg-brand-surface-light/50 hover:backdrop-blur-sm'
                        } ${trade.id === lastAddedTradeId ? 'animate-new-trade' : ''}`}
                        onClick={() => setViewingTrade(trade)}
                        style={{ cursor: 'pointer', animationDelay: `${index * 0.03}s` }}
                    >
                        {isSelectable && (
                        <td className="px-3 py-3 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                            <input
                            type="checkbox"
                            checked={selectedIds.has(trade.id)}
                            onChange={() => onToggleSelect?.(trade.id)}
                            aria-label={t('tooltips.selectTrade', { pair: trade.pair })}
                            className="w-4 h-4 rounded border-brand-border bg-brand-surface text-brand-accent focus:ring-2 focus:ring-brand-accent/50 focus:ring-offset-brand-surface"
                            />
                        </td>
                        )}
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-brand-text-primary">
                            <div className="flex flex-col">
                                <span>{format(new Date(trade.date + 'T00:00:00'), 'dd MMM yyyy', { locale })}</span>
                                <span className="text-xs text-brand-text-tertiary sm:hidden">{trade.time}</span>
                            </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium font-mono text-brand-text-primary">
                            <div className="flex items-center gap-2">
                                {trade.pair}
                                <span className={`sm:hidden w-2 h-2 rounded-full ${trade.type === 'long' ? 'bg-brand-profit' : 'bg-brand-loss'}`} title={trade.type}></span>
                            </div>
                        </td>
                        <td className="hidden sm:table-cell px-3 py-4 whitespace-nowrap text-sm">
                        {trade.type && (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide border ${
                            trade.type === 'long'
                                ? 'bg-brand-profit/10 text-brand-profit border-brand-profit/20'
                                : 'bg-brand-loss/10 text-brand-loss border-brand-loss/20'
                            }`}>
                            {t(`common.${trade.type}`).toUpperCase()}
                            </span>
                        )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-right">
                             <span className={`inline-block px-2.5 py-1 rounded-md text-sm font-bold shadow-sm ${
                                trade.pnl >= 0 
                                ? 'bg-brand-profit/10 text-brand-profit border border-brand-profit/20' 
                                : 'bg-brand-loss/10 text-brand-loss border border-brand-loss/20'
                            }`}>
                                {formatCurrency(trade.pnl)}
                            </span>
                        </td>
                    </tr>
                    )) : (
                    <tr>
                        <td colSpan={isSelectable ? 5 : 4} className="px-3 py-12 text-center text-sm text-brand-text-secondary italic">
                        No trades to display.
                        </td>
                    </tr>
                    )}
                </tbody>
                </table>
            </div>
        </div>
      </div>
      <ViewTradeModal
        isOpen={!!viewingTrade}
        onClose={() => setViewingTrade(null)}
        trade={viewingTrade}
      />
    </>
  );
};

export default React.memo(TradesTable);