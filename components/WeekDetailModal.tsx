import React, { useMemo, useState } from 'react';
import { Trade } from '../types';
import { format, isSameDay, isWithinInterval } from 'date-fns';
import { X } from 'lucide-react';
import TagsDisplay from './TagsDisplay';
import ImageLightbox from './ImageLightbox';
import StarRating from './StarRating';
import { useCurrency } from '../contexts/CurrencyContext';


interface WeekDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekRange: { start: Date; end: Date };
  trades: Trade[];
}

const WeekDetailModal: React.FC<WeekDetailModalProps> = ({ isOpen, onClose, weekRange, trades }) => {
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const { formatCurrency } = useCurrency();

  const weeklyTrades = useMemo(() => {
    const { start, end } = weekRange;
    const adjustedEnd = new Date(end);
    adjustedEnd.setHours(23, 59, 59, 999);

    return trades.filter(trade => {
      const tradeDate = new Date(trade.date + 'T00:00:00');
      return isWithinInterval(tradeDate, { start, end: adjustedEnd });
    });
  }, [trades, weekRange]);

  const tradesByDay = useMemo(() => {
    const grouped = new Map<string, { trades: Trade[], totalPnl: number }>();
    weeklyTrades.forEach(trade => {
      const dayKey = trade.date;
      const dayData = grouped.get(dayKey) || { trades: [], totalPnl: 0 };
      dayData.trades.push(trade);
      dayData.totalPnl += trade.pnl;
      grouped.set(dayKey, dayData);
    });
    return new Map([...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [weeklyTrades]);
  
  const totalWeeklyPnl = useMemo(() =>
    weeklyTrades.reduce((acc, trade) => acc + trade.pnl, 0),
    [weeklyTrades]
  );

  if (!isOpen) return null;

  const handleCloseLightbox = () => setViewingImage(null);
  
  const { start, end } = weekRange;
  const title = isSameDay(start, end)
    ? `Trades for ${format(start, 'MMMM d, yyyy')}`
    : `Week of ${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 dark:bg-brand-surface/90 border border-white/20 dark:border-brand-border backdrop-blur-2xl rounded-2xl shadow-2xl dark:shadow-soft-lg w-full max-w-2xl h-[90vh] flex flex-col animate-scale-in">
          <div className="flex justify-between items-center p-4 border-b border-gray-200/50 dark:border-brand-border-soft">
            <div>
              <h2 className="text-xl font-bold text-brand-text-primary">{title}</h2>
              <p className={`text-sm font-semibold ${totalWeeklyPnl >= 0 ? 'text-brand-profit' : 'text-brand-loss'}`}>
                  Weekly P&L: {formatCurrency(totalWeeklyPnl)}
              </p>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-brand-surface-light transition-all active:scale-95 ml-1" aria-label="Close modal">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            {Array.from(tradesByDay.entries()).length > 0 ? (
              <div className="space-y-6">
                {Array.from(tradesByDay.entries()).map(([date, { trades, totalPnl }]) => (
                  <div key={date}>
                    <div className="flex justify-between items-baseline pb-2 border-b border-gray-200 dark:border-brand-border-soft">
                      <h3 className="font-semibold text-lg text-brand-text-primary">{format(new Date(date + 'T00:00:00'), 'EEEE, MMMM d')}</h3>
                      <p className={`font-semibold ${totalPnl >= 0 ? 'text-brand-profit' : 'text-brand-loss'}`}>
                          {formatCurrency(totalPnl)}
                      </p>
                    </div>
                    <div className="space-y-4 mt-3">
                      {trades.map(trade => (
                        <div key={trade.id} className="bg-gray-50 dark:bg-brand-surface-light p-3 rounded-lg border border-gray-200 dark:border-brand-border-soft shadow-sm dark:shadow-none">
                              <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                  <span className="font-mono text-base font-semibold text-brand-text-primary">{trade.pair}</span>
                                  {trade.type && (
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold leading-none ${
                                          trade.type === 'long' 
                                          ? 'bg-brand-profit/10 text-brand-profit' 
                                          : 'bg-brand-loss/10 text-brand-loss'
                                      }`}>
                                          {trade.type.toUpperCase()}
                                      </span>
                                  )}
                                  <span className="text-sm text-brand-text-secondary">{trade.time}</span>
                                  </div>
                                  <span className={`font-semibold text-base ${trade.pnl >= 0 ? 'text-brand-profit' : 'text-brand-loss'}`}>
                                  {formatCurrency(trade.pnl)}
                                  </span>
                              </div>
                              
                              {(trade.notes || (trade.tags && Object.keys(trade.tags).length > 0) || (trade.photos && trade.photos.length > 0) || (trade.rating && trade.rating > 0)) && (
                                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-brand-border-soft space-y-3">
                                      {trade.rating && trade.rating > 0 && (
                                        <StarRating rating={trade.rating} readOnly size="sm" />
                                      )}
                                      {trade.notes && (
                                          <div>
                                              <div className="ql-snow">
                                                  <div className="ql-editor !p-0 !border-none text-sm text-brand-text-primary" dangerouslySetInnerHTML={{ __html: trade.notes }} />
                                              </div>
                                          </div>
                                      )}
                                      {trade.tags && Object.keys(trade.tags).length > 0 && (
                                        <TagsDisplay tags={trade.tags} />
                                      )}
                                      {trade.photos && trade.photos.length > 0 && (
                                          <div className="flex gap-2">
                                              {trade.photos.map((photo, index) => (
                                                  <button key={index} onClick={() => setViewingImage(photo)} className="focus:outline-none focus:ring-2 focus:ring-brand-accent/50 rounded-md overflow-hidden">
                                                    <img src={photo} alt={`Trade photo ${index + 1}`} className="rounded-md w-24 h-24 object-cover transition-transform hover:scale-105 cursor-pointer" />
                                                  </button>
                                              ))}
                                          </div>
                                      )}
                                  </div>
                              )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-brand-text-secondary py-8">No trades recorded for this week.</p>
            )}
          </div>
        </div>
      </div>
      <ImageLightbox
        isOpen={!!viewingImage}
        imageUrl={viewingImage}
        onClose={handleCloseLightbox}
      />
    </>
  );
};

export default React.memo(WeekDetailModal);