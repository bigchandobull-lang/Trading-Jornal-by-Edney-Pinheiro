import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, X, Check } from 'lucide-react';
import { formatTag, getTagStyle } from '../utils/tags';

interface TagFilterProps {
    allTags: string[];
    selectedTags: string[];
    onTagToggle: (tag: string) => void;
    onClear: () => void;
}

const TagFilter: React.FC<TagFilterProps> = ({ allTags, selectedTags, onTagToggle, onClear }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const hasFilters = selectedTags.length > 0;
    const hasTags = allTags.length > 0;

    return (
        <div className="relative" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(prev => !prev)}
                disabled={!hasTags}
                className="relative flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-brand-surface-light bg-brand-surface border border-brand-border-soft shadow-soft backdrop-blur-md transition-all active:scale-95 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <Filter size={16} />
                <span>{t('actions.tags')}</span>
                {hasFilters && (
                    <span className="grid place-content-center w-5 h-5 text-xs font-bold text-white bg-brand-accent rounded-full animate-pop-elastic">
                        {selectedTags.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-brand-surface-opaque/90 border border-brand-border backdrop-blur-2xl rounded-xl shadow-soft-lg animate-menu-slide z-50 p-3">
                    <div className="flex justify-between items-center pb-2 mb-2 border-b border-brand-border-soft">
                        <h4 className="font-semibold text-brand-text-primary">Filter by Tags</h4>
                        {hasFilters && (
                             <button onClick={onClear} className="text-sm font-semibold text-brand-accent hover:underline transition-colors">
                                {t('actions.clear')}
                            </button>
                        )}
                    </div>
                    {hasTags ? (
                        <ul className="space-y-1 max-h-60 overflow-y-auto stagger-list custom-scrollbar">
                            {allTags.map(tag => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                    <li key={tag}>
                                        <button 
                                            onClick={() => onTagToggle(tag)}
                                            className={`w-full flex items-center justify-between text-left p-2 rounded-md transition-colors ${isSelected ? 'bg-brand-accent/10' : 'hover:bg-brand-surface-light'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-5 h-5 flex items-center justify-center rounded border transition-all duration-200 ${isSelected ? 'bg-brand-accent border-brand-accent' : 'border-brand-border-soft'}`}>
                                                    {isSelected && <Check size={14} className="text-white animate-pop-elastic" />}
                                                </div>
                                                <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${getTagStyle(tag)}`}>
                                                    {formatTag(tag)}
                                                </span>
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="text-center text-sm text-brand-text-secondary py-4">No tags have been added to any trades yet.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default React.memo(TagFilter);