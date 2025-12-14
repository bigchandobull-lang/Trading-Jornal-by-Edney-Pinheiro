import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Plus, Loader2, X } from 'lucide-react';
import { Trade, TradeTags } from '../../types';
import PairInput from '../PairInput';
import StarRating from '../StarRating';
import AllTagGroups from './AllTagGroups';
import PhotoManager from './PhotoManager';
import { useQuillEditor } from './useQuillEditor';
import { useTradesContext } from '../../contexts/TradesContext';
import { useCurrency } from '../../contexts/CurrencyContext';

interface NewTradeFormProps {
  selectedDate: Date;
  addTrade: (trade: Omit<Trade, 'id'>) => void;
  onImageClick: (url: string) => void;
  initiallyOpen: boolean;
}

const NewTradeForm: React.FC<NewTradeFormProps> = ({ selectedDate, addTrade, onImageClick, initiallyOpen }) => {
    const { t } = useTranslation();
    const { pairs, removePair, lastUsedPair } = useTradesContext();
    const { currencySymbol } = useCurrency();
    
    const [isFormOpen, setIsFormOpen] = useState(initiallyOpen);
    
    // Form state
    const [pair, setPair] = useState('');
    const [pnl, setPnl] = useState('');
    const [time, setTime] = useState(() => format(new Date(), 'HH:mm'));
    const [tradeType, setTradeType] = useState<'long' | 'short'>('long');
    const [rating, setRating] = useState(0);
    const [photos, setPhotos] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const [tags, setTags] = useState<TradeTags>({});
    const [pnlError, setPnlError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const editorRef = useRef<HTMLDivElement>(null);
    
    const { charCount, maxChars } = useQuillEditor(editorRef, notes, setNotes, t('tradeModal.addNotesPlaceholder'));

    // Pre-fill with last used pair when the form is opened
    useEffect(() => {
        if (isFormOpen && !pair && lastUsedPair) {
            setPair(lastUsedPair);
        }
    }, [isFormOpen, lastUsedPair, pair]); 

    // Sync form visibility with prop, e.g., when navigating days in the modal
    useEffect(() => {
        setIsFormOpen(initiallyOpen);
    }, [initiallyOpen]);

    const isFormValid = useMemo(() => {
        return pair.trim() && pnl.trim() && time && !isNaN(parseFloat(pnl));
    }, [pair, pnl, time]);
    
    useEffect(() => {
        setPnlError(pnl && isNaN(parseFloat(pnl)) ? t('errors.pnlNumber') : '');
    }, [pnl, t]);
    
    const resetForm = useCallback(() => {
        setPair('');
        setPnl('');
        setTime(format(new Date(), 'HH:mm'));
        setPhotos([]);
        setTradeType('long');
        setNotes('');
        setTags({});
        setPnlError('');
        setRating(0);
        if (editorRef.current) {
            const quill = (editorRef.current as any).quill;
            if (quill) quill.setText('');
        }
    }, []);

    const handleTagsChange = useCallback((category: keyof TradeTags, value: string[] | string) => {
        setTags(prev => {
            const updated = { ...prev, [category]: value };
            if ((Array.isArray(value) && value.length === 0) || !value) {
                delete (updated as any)[category];
            }
            return updated;
        });
    }, []);

    const handleAddTrade = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting || !isFormValid) return;

        setIsSubmitting(true);
        // Simulate a short delay for better user feedback
        await new Promise(res => setTimeout(res, 300));

        addTrade({
            date: format(selectedDate, 'yyyy-MM-dd'),
            time,
            pair: pair.toUpperCase(),
            pnl: parseFloat(pnl),
            type: tradeType,
            notes,
            tags,
            photos,
            rating
        });
        
        resetForm();
        setIsFormOpen(false);
        setIsSubmitting(false);
    }, [selectedDate, time, pair, pnl, tradeType, notes, photos, tags, rating, addTrade, resetForm, isFormValid, isSubmitting]);

    const inputBaseClasses = "w-full bg-gray-50 dark:bg-brand-surface-light border border-gray-200 dark:border-brand-border-soft rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent/50 transition-all text-brand-text-primary";

    return (
        <div className="pt-6 border-t border-gray-200 dark:border-brand-border-soft">
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => {
                        if (isFormOpen) {
                            resetForm();
                        }
                        setIsFormOpen(p => !p);
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-95 ${
                        isFormOpen 
                        ? 'bg-gray-100 dark:bg-brand-surface text-brand-text-primary hover:bg-gray-200 dark:hover:bg-brand-surface-light border border-gray-200 dark:border-brand-border-soft'
                        : 'bg-brand-accent text-white hover:bg-indigo-500'
                    }`}
                >
                    {isFormOpen ? <X size={16} /> : <Plus size={16} />}
                    {isFormOpen ? t('actions.cancel') : t('actions.addNewTrade')}
                </button>
            </div>
            
            {isFormOpen && (
                <form onSubmit={handleAddTrade} className="mt-4 space-y-4 animate-fade-in">
                    <div className="flex w-full bg-gray-100 dark:bg-brand-surface-light border border-gray-200 dark:border-brand-border-soft rounded-md p-1">
                        <button type="button" onClick={() => setTradeType('long')} className={`flex-1 py-1.5 text-sm font-semibold rounded transition-colors ${tradeType === 'long' ? 'bg-brand-profit text-white shadow' : 'text-brand-text-secondary hover:bg-white dark:hover:bg-brand-surface'}`}>{t('common.long')}</button>
                        <button type="button" onClick={() => setTradeType('short')} className={`flex-1 py-1.5 text-sm font-semibold rounded transition-colors ${tradeType === 'short' ? 'bg-brand-loss text-white shadow' : 'text-brand-text-secondary hover:bg-white dark:hover:bg-brand-surface'}`}>{t('common.short')}</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
                        <PairInput value={pair} onChange={setPair} suggestions={pairs} onRemoveSuggestion={removePair} placeholder={t('common.pair')} className={`${inputBaseClasses} px-3 py-2`} />
                        <div className="relative w-full sm:w-28">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary text-sm pointer-events-none">{currencySymbol}</span>
                            <input 
                                type="text" 
                                placeholder={t('common.pnl')} 
                                value={pnl} 
                                onChange={(e) => setPnl(e.target.value)} 
                                className={`${inputBaseClasses} pl-7 pr-3 py-2 ${pnlError ? 'border-brand-loss focus:border-brand-loss focus:ring-brand-loss/50' : ''}`} 
                                required 
                            />
                        </div>
                        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`${inputBaseClasses} px-3 py-2 sm:w-auto`} required />
                    </div>
                    {pnlError && <p className="text-xs text-brand-loss -mt-3 ml-1">{pnlError}</p>}
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-brand-surface-light border border-gray-200 dark:border-brand-border-soft rounded-md px-3 py-2">
                        <span className="text-sm font-semibold text-brand-text-secondary pr-4">{t('tradeModal.tradeRating')}</span>
                        <StarRating rating={rating} setRating={setRating} />
                    </div>
                    
                    <AllTagGroups tags={tags} onTagsChange={handleTagsChange} />
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-sm font-medium text-brand-text-secondary">{t('common.notes')}</label>
                            <span className={`text-xs font-medium ${charCount > maxChars ? 'text-brand-loss' : 'text-brand-text-secondary'}`}>{charCount}/{maxChars}</span>
                        </div>
                        <div ref={editorRef} style={{ minHeight: '120px' }}></div>
                    </div>
                    <PhotoManager photos={photos} onUpdate={setPhotos} onImageClick={onImageClick} uploaderId="new-trade-photo-upload" />

                    <button type="submit" className="w-full bg-brand-accent hover:bg-indigo-500 text-white font-bold py-2.5 px-3 rounded-md flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed shadow-md" disabled={!isFormValid || isSubmitting}>
                        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                        <span>{isSubmitting ? t('tradeModal.adding') : t('actions.addNewTrade')}</span>
                    </button>
                </form>
            )}
        </div>
    );
};

export default NewTradeForm;