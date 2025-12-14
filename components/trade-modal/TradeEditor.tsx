import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Trade, TradeTags } from '../../types';
import PairInput from '../PairInput';
import StarRating from '../StarRating';
import AllTagGroups from './AllTagGroups';
import PhotoManager from './PhotoManager';
import { useQuillEditor } from './useQuillEditor';
import { useTradesContext } from '../../contexts/TradesContext';
import { Loader2, Check } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';

interface TradeEditorProps {
  trade: Trade;
  updateTrade: (id: string, updates: Partial<Trade>) => Promise<void>;
  onImageClick: (url: string) => void;
}

const TradeEditor: React.FC<TradeEditorProps> = ({ trade, updateTrade, onImageClick }) => {
    const { t } = useTranslation();
    const { pairs, removePair } = useTradesContext();
    const { currencySymbol } = useCurrency();

    const [editedTrade, setEditedTrade] = useState(trade);
    const [pnlInput, setPnlInput] = useState(trade.pnl.toString());
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    
    const editorRef = useRef<HTMLDivElement>(null);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // When the parent component passes a new trade, reset the local state.
    useEffect(() => {
        setEditedTrade(trade);
        setPnlInput(trade.pnl.toString());
        setSaveStatus('idle'); // Reset save status
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    }, [trade]);

    const triggerSave = useCallback((newState: Trade) => {
        setSaveStatus('saving');
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                const updates: Partial<Trade> = {};
                (Object.keys(newState) as Array<keyof Trade>).forEach(key => {
                    if (key !== 'id' && JSON.stringify(newState[key]) !== JSON.stringify(trade[key])) {
                        (updates as any)[key] = newState[key];
                    }
                });

                if (Object.keys(updates).length > 0) {
                    await updateTrade(trade.id, updates);
                    setSaveStatus('saved');
                    setTimeout(() => setSaveStatus('idle'), 2000);
                } else {
                    setSaveStatus('idle'); // No actual changes
                }
            } catch (error) {
                console.error("Failed to save trade:", error);
                setSaveStatus('idle'); // Could set an error state here
            }
        }, 800); // 800ms debounce delay
    }, [trade, updateTrade]);

    const handleFieldChange = useCallback((updates: Partial<Trade>) => {
        setEditedTrade(currentTrade => {
            const newState = { ...currentTrade, ...updates };
            triggerSave(newState);
            return newState;
        });
    }, [triggerSave]);

    const handlePnlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setPnlInput(val);
        const pnlNum = parseFloat(val);
        if (!isNaN(pnlNum)) {
            handleFieldChange({ pnl: pnlNum });
        }
    };

    const handleTagsChange = useCallback((category: keyof TradeTags, value: string[] | string) => {
        const currentTags = editedTrade.tags || {};
        const updatedTags = { ...currentTags, [category]: value };
        if ((Array.isArray(value) && value.length === 0) || !value) {
            delete (updatedTags as any)[category];
        }
        handleFieldChange({ tags: updatedTags });
    }, [editedTrade.tags, handleFieldChange]);

    const handleNotesChange = useCallback((html: string) => {
        handleFieldChange({ notes: html === '<p><br></p>' ? '' : html });
    }, [handleFieldChange]);

    const { charCount, maxChars } = useQuillEditor(
        editorRef, 
        editedTrade.notes, 
        handleNotesChange, 
        t('tradeModal.addNotesPlaceholder')
    );
    
    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    const SaveStatusIndicator = () => (
        <div className="flex justify-end items-center h-6">
            {saveStatus === 'saving' && (
                <div className="flex items-center gap-2 text-sm text-brand-text-secondary animate-fade-in">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving...</span>
                </div>
            )}
            {saveStatus === 'saved' && (
                <div className="flex items-center gap-2 text-sm text-brand-profit animate-fade-in">
                    <Check size={16} />
                    <span>Saved</span>
                </div>
            )}
        </div>
    );

    const inputBaseClasses = "w-full bg-white dark:bg-brand-surface border border-gray-200 dark:border-brand-border-soft rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent/50 transition-all text-brand-text-primary";

    return (
        <div className="mt-2 p-3 bg-gray-100/50 dark:bg-black/10 rounded-lg border border-gray-200 dark:border-brand-border-soft space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4 border-b border-gray-200 dark:border-brand-border-soft">
                <PairInput 
                    value={editedTrade.pair} 
                    onChange={(v) => handleFieldChange({ pair: v.toUpperCase() })} 
                    suggestions={pairs} 
                    onRemoveSuggestion={removePair} 
                    className={`${inputBaseClasses} px-3 py-2`}
                />
                <div className="relative w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary text-sm pointer-events-none">{currencySymbol}</span>
                    <input 
                        type="text"
                        inputMode="decimal"
                        placeholder={t('common.pnl')} 
                        value={pnlInput} 
                        onChange={handlePnlInputChange} 
                        className={`${inputBaseClasses} pl-7 pr-3 py-2`}
                    />
                </div>
                <input 
                    type="time" 
                    value={editedTrade.time} 
                    onChange={(e) => handleFieldChange({ time: e.target.value })} 
                    className={`${inputBaseClasses} px-3 py-2`}
                />
                <div className="flex w-full bg-white dark:bg-brand-surface border border-gray-200 dark:border-brand-border-soft rounded-md p-1">
                    <button 
                        type="button" 
                        onClick={() => handleFieldChange({ type: 'long' })} 
                        className={`flex-1 py-1.5 text-sm font-semibold rounded transition-colors ${editedTrade.type === 'long' ? 'bg-brand-profit text-white shadow' : 'text-brand-text-secondary hover:bg-gray-50 dark:hover:bg-brand-surface-light'}`}
                    >
                        {t('common.long')}
                    </button>
                    <button 
                        type="button" 
                        onClick={() => handleFieldChange({ type: 'short' })} 
                        className={`flex-1 py-1.5 text-sm font-semibold rounded transition-colors ${editedTrade.type === 'short' ? 'bg-brand-loss text-white shadow' : 'text-brand-text-secondary hover:bg-gray-50 dark:hover:bg-brand-surface-light'}`}
                    >
                        {t('common.short')}
                    </button>
                </div>
            </div>
             <div className="pt-2">
                <label className="block text-sm font-medium text-brand-text-primary mb-1.5">{t('tradeModal.executionScoring')}</label>
                <div className="flex items-center justify-between bg-white dark:bg-brand-surface border border-gray-200 dark:border-brand-border-soft rounded-md px-3 py-2">
                    <span className="text-sm font-semibold text-brand-text-secondary pr-4">{t('tradeModal.tradeRating')}</span>
                    <StarRating 
                        rating={editedTrade.rating || 0} 
                        setRating={(newRating) => handleFieldChange({ rating: newRating })}
                    />
                </div>
            </div>
            
            <AllTagGroups 
                tags={editedTrade.tags || {}} 
                onTagsChange={handleTagsChange} 
            />

            <div>
                <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-medium text-brand-text-secondary">{t('common.notes')}</label>
                    <span className={`text-xs font-medium ${charCount > maxChars ? 'text-brand-loss' : 'text-brand-text-secondary'}`}>{charCount}/{maxChars}</span>
                </div>
                <div ref={editorRef} style={{ minHeight: '120px' }}></div>
            </div>
            
            <PhotoManager 
                photos={editedTrade.photos || []} 
                onUpdate={(photos) => handleFieldChange({ photos })} 
                onImageClick={onImageClick} 
                uploaderId={`photo-upload-${trade.id}`} 
            />
            
            <SaveStatusIndicator />
        </div>
    );
};

export default React.memo(TradeEditor);