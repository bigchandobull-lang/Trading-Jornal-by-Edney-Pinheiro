import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trade } from '../types';
import TradesTable from './RecentTradesTable';
import { ChevronLeft, ChevronRight, Search, SearchX, ListPlus, Trash2, X, AlertTriangle } from 'lucide-react';
import { useTradesContext } from '../contexts/TradesContext';
import { useNotification } from '../contexts/NotificationContext';

interface TradesListProps {
  trades: Trade[];
  lastAddedTradeId?: string | null;
}

const ITEMS_PER_PAGE = 25;

const TradesList: React.FC<TradesListProps> = ({ trades, lastAddedTradeId }) => {
  const { deleteMultipleTrades } = useTradesContext();
  const { showNotification } = useNotification();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTradeIds, setSelectedTradeIds] = useState<Set<string>>(new Set());
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  const handleSort = useCallback((key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' }; // Default to descending
    });
    setCurrentPage(1);
  }, []);

  const processedTrades = useMemo(() => {
    let result = trades;

    // 1. Filter
    if (searchTerm) {
        const lowercasedFilter = searchTerm.toLowerCase();
        result = result.filter(trade => 
          trade.pair.toLowerCase().includes(lowercasedFilter) ||
          trade.notes?.toLowerCase().includes(lowercasedFilter) ||
          (trade.tags && Object.values(trade.tags).flat().some(tag => typeof tag === 'string' && tag.toLowerCase().includes(lowercasedFilter)))
        );
    }

    // 2. Sort
    if (sortConfig) {
        // Create a copy to sort
        result = [...result].sort((a, b) => {
            if (sortConfig.key === 'pnl') {
                return sortConfig.direction === 'asc' ? a.pnl - b.pnl : b.pnl - a.pnl;
            }
            if (sortConfig.key === 'date') {
                const dateA = a.date + (a.time || '');
                const dateB = b.date + (b.time || '');
                return sortConfig.direction === 'asc' 
                    ? dateA.localeCompare(dateB) 
                    : dateB.localeCompare(dateA);
            }
            return 0;
        });
    }

    return result;
  }, [trades, searchTerm, sortConfig]);

  const totalPages = Math.ceil(processedTrades.length / ITEMS_PER_PAGE);
  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedTrades.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [processedTrades, currentPage]);
  
  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);
  
  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const handleToggleSelect = useCallback((tradeId: string) => {
    setSelectedTradeIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(tradeId)) newSet.delete(tradeId);
        else newSet.add(tradeId);
        return newSet;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    const allVisibleIds = new Set(paginatedTrades.map(t => t.id));
    const allSelectedOnPage = paginatedTrades.every(t => selectedTradeIds.has(t.id));

    if (allSelectedOnPage) {
        setSelectedTradeIds(prev => {
            const newSet = new Set(prev);
            allVisibleIds.forEach(id => newSet.delete(id));
            return newSet;
        });
    } else {
        setSelectedTradeIds(prev => new Set([...prev, ...allVisibleIds]));
    }
  }, [paginatedTrades, selectedTradeIds]);
  
  const handleDeleteSelected = () => {
    if (selectedTradeIds.size === 0) return;
    deleteMultipleTrades(Array.from(selectedTradeIds));
    showNotification(t('notifications.tradesDeleted', { count: selectedTradeIds.size }), 'info');
    setSelectedTradeIds(new Set());
    setConfirmOpen(false);
  };

  return (
    <>
      <div className="glass-panel p-4 space-y-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
              <h2 className="text-xl font-bold text-brand-text-primary tracking-tight">{t('tradesList.title')}</h2>
              <p className="text-sm text-brand-text-secondary">{t('tradesList.tradesFound', { count: processedTrades.length })}</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary" />
            <input 
              type="text"
              placeholder={t('tradesList.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-brand-surface-light border border-brand-border-soft rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
            />
          </div>
        </div>
        
        {paginatedTrades.length > 0 ? (
          <TradesTable
            trades={paginatedTrades}
            lastAddedTradeId={lastAddedTradeId}
            isSelectable={true}
            selectedIds={selectedTradeIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        ) : (
          <div className="empty-state-container min-h-[400px]">
              <div className="bg-brand-surface-light p-4 rounded-full mb-2">
                {searchTerm ? <SearchX size={48} className="text-brand-text-tertiary" /> : <ListPlus size={48} className="text-brand-text-tertiary" />}
              </div>
              <div>
                  <h3 className="font-semibold text-brand-text-primary text-lg">
                      {searchTerm ? t('tradesList.noTradesFound') : t('tradesList.emptyJournal')}
                  </h3>
                  <p className="mt-1 text-sm text-brand-text-secondary max-w-sm mx-auto">
                      {searchTerm ? t('tradesList.noTradesFoundDesc', { searchTerm }) : t('tradesList.emptyJournalDesc')}
                  </p>
              </div>
          </div>
        )}

        {(totalPages > 1 || selectedTradeIds.size > 0) && (
          <div className="pt-4 border-t border-brand-border-soft">
            {totalPages > 1 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-brand-text-secondary">
                  {t('tradesList.page')} {currentPage} {t('common.of')} {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrevPage} disabled={currentPage === 1} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-brand-surface-light bg-brand-surface border border-brand-border shadow-soft disabled:opacity-50"><ChevronLeft size={16} /> {t('tradesList.previous')}</button>
                  <button onClick={handleNextPage} disabled={currentPage === totalPages} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-brand-surface-light bg-brand-surface border border-brand-border shadow-soft disabled:opacity-50">{t('tradesList.next')} <ChevronRight size={16} /></button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {selectedTradeIds.size > 0 && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 bg-brand-surface-light border-t border-brand-border-soft -mx-4 -mb-4 mt-4 animate-fade-in">
              <span className="text-sm font-semibold">{t('tradesList.selected', { count: selectedTradeIds.size })}</span>
              <div className="flex items-center gap-4">
                  <button onClick={() => setConfirmOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-brand-loss hover:bg-red-500 rounded-md font-semibold transition-colors active:scale-95">
                      <Trash2 size={16} /> {t('tradesList.deleteSelected')}
                  </button>
                  <button onClick={() => setSelectedTradeIds(new Set())} className="p-1.5 hover:bg-brand-surface rounded-full text-brand-text-secondary transition-colors" aria-label={t('tooltips.clearSelection')}>
                      <X size={18} />
                  </button>
              </div>
          </div>
        )}
      </div>

      {isConfirmOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-[51] p-4">
              <div className="bg-brand-surface/80 backdrop-blur-xl border border-brand-border rounded-xl shadow-soft-lg p-6 max-w-sm text-center animate-scale-in">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-brand-loss/20"><AlertTriangle className="h-6 w-6 text-brand-loss" /></div>
                  <h3 className="text-lg font-bold text-brand-text-primary mt-4">{t('tradeModal.confirmDeletion')}</h3>
                  <p className="text-brand-text-secondary my-3 text-sm">
                      {t('tradeModal.confirmDeletionMsg', { count: selectedTradeIds.size })}
                  </p>
                  <div className="flex justify-center gap-4 mt-6">
                      <button onClick={() => setConfirmOpen(false)} className="bg-brand-surface-light hover:bg-brand-border font-bold py-2 px-6 rounded-md">{t('actions.cancel')}</button>
                      <button onClick={handleDeleteSelected} className="bg-brand-loss hover:bg-red-500 text-white font-bold py-2 px-6 rounded-md">{t('actions.delete')}</button>
                  </div>
              </div>
          </div>
      )}
    </>
  );
};

export default React.memo(TradesList);