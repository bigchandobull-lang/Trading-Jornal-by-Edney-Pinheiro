import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trade } from '../types';
import { format } from 'date-fns';
import { X, Clock } from 'lucide-react';
import TagsDisplay from './TagsDisplay';
import ImageLightbox from './ImageLightbox';
import { useDateFnsLocale } from '../hooks/useDateFnsLocale';
import StarRating from './StarRating';
import { useCurrency } from '../contexts/CurrencyContext';

interface ViewTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: Trade | null;
}

const ViewTradeModal: React.FC<ViewTradeModalProps> = ({ isOpen, onClose, trade }) => {
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const { formatCurrency } = useCurrency();

  if (!isOpen || !trade) return null;

  const handleCloseLightbox = () => setViewingImage(null);

  const pnlColor = trade.pnl >= 0 ? 'text-brand-profit' : 'text-brand-loss';
  const typeStyle = trade.type === 'long'
    ? 'bg-brand-profit/10 text-brand-profit ring-brand-profit/20'
    : 'bg-brand-loss/10 text-brand-loss ring-brand-loss/20';

  return (
    <>
      <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 dark:bg-brand-surface/90 border border-white/20 dark:border-brand-border backdrop-blur-2xl rounded-2xl shadow-2xl dark:shadow-soft-lg w-full max-w-xl h-auto max-h-[90vh] flex flex-col animate-scale-in">
          <div className="flex justify-between items-center p-4 border-b border-gray-200/50 dark:border-brand-border-soft">
            <div>
              <h2 className="text-xl font-bold text-brand-text-primary">{t('viewTradeModal.title')}</h2>
              <p className="text-sm text-brand-text-secondary">
                <span className="font-mono">{trade.pair}</span> {t('common.on')} {format(new Date(trade.date + 'T00:00:00'), 'MMMM d, yyyy', { locale })}
              </p>
            </div>
            <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text-primary transition-transform active:scale-95" aria-label={t('actions.close')}>
              <X size={24} />
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto space-y-5">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 dark:bg-brand-surface-light p-3 rounded-lg border border-gray-100 dark:border-transparent">
                <p className="text-sm font-medium text-brand-text-secondary">{t('viewTradeModal.netPnl')}</p>
                <p className={`text-2xl font-bold mt-1 ${pnlColor}`}>{formatCurrency(trade.pnl)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-brand-surface-light p-3 rounded-lg border border-gray-100 dark:border-transparent">
                <p className="text-sm font-medium text-brand-text-secondary">{t('common.type')}</p>
                <div className="flex justify-center mt-2">
                  <span className={`px-4 py-1.5 rounded-full text-base font-bold leading-none ring-1 ring-inset ${typeStyle}`}>
                    {t(`common.${trade.type || 'long'}`).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-brand-surface-light p-3 rounded-lg col-span-2 sm:col-span-1 border border-gray-100 dark:border-transparent">
                <p className="text-sm font-medium text-brand-text-secondary">{t('common.time')}</p>
                <p className="text-2xl font-bold mt-1 flex items-center justify-center gap-2 text-brand-text-primary">
                  <Clock size={20} />
                  <span>{trade.time}</span>
                </p>
              </div>
            </div>

            {/* Rating */}
            {trade.rating && trade.rating > 0 && (
                <div className="flex items-center justify-between bg-gray-50 dark:bg-brand-surface-light border border-gray-200 dark:border-brand-border-soft rounded-lg px-3 py-2">
                    <span className="text-sm font-semibold text-brand-text-secondary pr-4">{t('tradeModal.tradeRating')}</span>
                    <StarRating
                        rating={trade.rating}
                        readOnly
                    />
                </div>
            )}

            {/* Tags */}
            {trade.tags && Object.keys(trade.tags).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-brand-text-secondary mb-2">{t('actions.tags')}</h3>
                <TagsDisplay tags={trade.tags} />
              </div>
            )}

            {/* Notes */}
            {trade.notes && (
              <div>
                <h3 className="text-sm font-semibold text-brand-text-secondary mb-2">{t('common.notes')}</h3>
                <div className="bg-gray-50 dark:bg-brand-surface-light p-3 rounded-lg border border-gray-200 dark:border-brand-border-soft">
                  <div className="ql-snow">
                      <div className="ql-editor !p-0 !border-none text-sm max-h-48 overflow-y-auto text-brand-text-primary" dangerouslySetInnerHTML={{ __html: trade.notes }} />
                  </div>
                </div>
              </div>
            )}

            {/* Photos */}
            {trade.photos && trade.photos.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-brand-text-secondary mb-2">{t('common.photos')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {trade.photos.map((photo, index) => (
                    <button onClick={() => setViewingImage(photo)} key={index} className="focus:outline-none focus:ring-2 focus:ring-brand-accent/50 rounded-lg overflow-hidden">
                      <img src={photo} alt={`Trade photo ${index + 1}`} className="rounded-lg w-full h-32 object-cover transition-transform hover:scale-105 cursor-pointer" />
                    </button>
                  ))}
                </div>
              </div>
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

export default React.memo(ViewTradeModal);