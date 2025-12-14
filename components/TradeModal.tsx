import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Trade } from '../types';
import { format } from 'date-fns';
import { X, ChevronLeft, ChevronRight, Trash2, Archive } from 'lucide-react';
import ImageLightbox from './ImageLightbox';
import NewTradeForm from './trade-modal/NewTradeForm';
import TradeEditor from './trade-modal/TradeEditor';
import { useNotification } from '../contexts/NotificationContext';
import { useCurrency } from '../contexts/CurrencyContext';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  tradesForDay: Trade[];
  addTrade: (trade: Omit<Trade, 'id'>) => void;
  deleteTrade: (tradeId: string) => void;
  updateTrade: (tradeId: string, updates: Partial<Omit<Trade, 'id'>>) => Promise<void>;
  onPrevDay: () => void;
  onNextDay: () => void;
}

const TradeModal: React.FC<TradeModalProps> = ({ isOpen, onClose, selectedDate, tradesForDay, addTrade, deleteTrade, updateTrade, onPrevDay, onNextDay }) => {
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const { showNotification } = useNotification();
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  
  // Reset modal state when it's closed or the date changes
  useEffect(() => {
    if (!isOpen) {
      setExpandedTradeId(null);
      setTradeToDelete(null);
      setViewingImage(null);
    }
  }, [isOpen]);

  // Collapse any expanded trade when navigating between days
  useEffect(() => {
      setExpandedTradeId(null);
  }, [selectedDate]);

  if (!isOpen) return null;

  const totalPnl = useMemo(() => tradesForDay.reduce((acc, trade) => acc + trade.pnl, 0), [tradesForDay]);

  const handleDeleteConfirm = useCallback(() => {
    if (tradeToDelete) {
      deleteTrade(tradeToDelete.id);
      setTradeToDelete(null);
    }
  }, [tradeToDelete, deleteTrade]);

  const handleUpdateWithNotification = useCallback(async (tradeId: string, updates: Partial<Omit<Trade, 'id'>>) => {
    await updateTrade(tradeId, updates);
    showNotification(t('notifications.tradeUpdated'), 'success');
  }, [updateTrade, showNotification, t]);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 dark:bg-brand-surface/90 border border-white/20 dark:border-brand-border backdrop-blur-2xl rounded-2xl shadow-2xl dark:shadow-soft-lg w-full max-w-lg animate-scale-in relative flex flex-col max-h-[90vh]">
          {/* Modal Header */}
          <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200/50 dark:border-brand-border-soft">
            <button onClick={onPrevDay} className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-brand-surface-light transition-colors" aria-label={t('tradesList.previous')}><ChevronLeft size={20} /></button>
            <div className="text-center flex-1 mx-2">
              <h2 className="text-xl font-bold text-brand-text-primary">{t('tradeModal.tradesFor', { date: format(selectedDate, 'MMMM d, yyyy') })}</h2>
              <p className={`text-sm font-semibold ${totalPnl >= 0 ? 'text-brand-profit' : 'text-brand-loss'}`}>{t('tradeModal.dailyPnl')}: {formatCurrency(totalPnl)}</p>
            </div>
            <div className="flex items-center">
              <button onClick={onNextDay} className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-brand-surface-light transition-colors" aria-label={t('tradesList.next')}><ChevronRight size={20} /></button>
              <button onClick={onClose} className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-brand-surface-light ml-1 transition-colors" aria-label={t('actions.close')}><X size={20} /></button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="mb-6">
              {tradesForDay.length > 0 ? (
                <div className="space-y-2">{tradesForDay.map(trade => (
                    <div key={trade.id} className="bg-gray-50 dark:bg-brand-surface-light p-3 rounded-lg border border-gray-200 dark:border-brand-border-soft shadow-sm dark:shadow-none">
                        <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedTradeId(prevId => prevId === trade.id ? null : trade.id)}>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-semibold text-brand-text-primary">{trade.pair}</span>
                                {trade.type && (<span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${trade.type === 'long' ? 'bg-brand-profit/10 text-brand-profit' : 'bg-brand-loss/10 text-brand-loss'}`}>{t(`common.${trade.type}`).toUpperCase()}</span>)}
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`font-semibold ${trade.pnl >= 0 ? 'text-brand-profit' : 'text-brand-loss'}`}>{formatCurrency(trade.pnl)}</span>
                              <button onClick={(e) => { e.stopPropagation(); setTradeToDelete(trade);}} className="text-brand-text-secondary hover:text-brand-loss transition-colors" aria-label={t('actions.delete')}><Trash2 size={16} /></button>
                            </div>
                        </div>
                        {expandedTradeId === trade.id && <TradeEditor key={trade.id} trade={trade} updateTrade={handleUpdateWithNotification} onImageClick={setViewingImage}/>}
                    </div>
                ))}</div>
              ) : (
                <div className="text-center text-brand-text-secondary py-8 px-4 rounded-lg bg-gray-50 dark:bg-brand-surface-light border border-dashed border-gray-200 dark:border-brand-border flex flex-col items-center gap-4">
                    <Archive size={40} className="text-brand-text-secondary/50" />
                    <div><h3 className="font-semibold text-brand-text-primary">{t('tradeModal.noTradesLogged')}</h3><p className="mt-1 text-sm">{t('tradeModal.noTradesLoggedDesc')}</p></div>
                </div>
              )}
            </div>
            <NewTradeForm 
              selectedDate={selectedDate} 
              addTrade={addTrade} 
              onImageClick={setViewingImage}
              initiallyOpen={tradesForDay.length === 0}
            />
          </div>

          {/* Deletion Confirmation Dialog */}
          {tradeToDelete && (
              <div className="absolute inset-0 bg-white/80 dark:bg-brand-surface/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl p-4">
                  <div className="bg-white dark:bg-brand-surface border border-gray-200 dark:border-brand-border rounded-xl shadow-xl p-6 max-w-sm text-center animate-scale-in">
                      <h3 className="text-lg font-bold text-brand-text-primary">{t('tradeModal.confirmDeletion')}</h3>
                      <p className="text-brand-text-secondary my-4 text-sm">{t('tradeModal.confirmDeletionMsg', { pair: tradeToDelete.pair })}</p>
                      <div className="flex justify-center gap-4 mt-6">
                          <button onClick={() => setTradeToDelete(null)} className="bg-gray-100 dark:bg-brand-surface-light hover:bg-gray-200 dark:hover:bg-brand-border font-bold py-2 px-6 rounded-md text-brand-text-primary">{t('actions.cancel')}</button>
                          <button onClick={handleDeleteConfirm} className="bg-brand-loss hover:bg-red-500 text-white font-bold py-2 px-6 rounded-md">{t('actions.delete')}</button>
                      </div>
                  </div>
              </div>
          )}
        </div>
      </div>
      <ImageLightbox isOpen={!!viewingImage} imageUrl={viewingImage} onClose={() => setViewingImage(null)}/>
    </>
  );
};
export default React.memo(TradeModal);