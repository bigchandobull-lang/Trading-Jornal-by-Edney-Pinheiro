import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { getTagStyle, formatTag } from '../utils/tags';

interface PredefinedTags {
    strategy: string[];
    session: string[];
}

interface TagInputProps {
    tags: string[];
    onUpdate: (tags: string[]) => void;
    predefinedTags: PredefinedTags;
    smartSuggestions?: string[];
    error?: boolean;
}

const TagInput: React.FC<TagInputProps> = ({ tags, onUpdate, predefinedTags, smartSuggestions, error = false }) => {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const allSuggestions = useMemo(() => {
        const suggestionsMap = new Map<string, { display: string, value: string, category: string }>();
        const toCanonical = (value: string) => value.toLowerCase().replace(/ /g, '');

        // 1. Add smart suggestions first to give them priority
        (smartSuggestions || []).forEach(tagValue => {
            const canonicalKey = toCanonical(tagValue);
            if (!suggestionsMap.has(canonicalKey)) {
                suggestionsMap.set(canonicalKey, {
                    display: formatTag(tagValue),
                    value: tagValue,
                    category: t('tagCategories.smart')
                });
            }
        });

        // 2. Add predefined suggestions if they don't already exist
        const predefined = [
            ...predefinedTags.strategy.map(display => ({ display, value: `strategy:${display}`, category: t('tagCategories.strategy') })),
            ...predefinedTags.session.map(display => ({ display, value: `session:${display}`, category: t('tagCategories.session') }))
        ];
        predefined.forEach(suggestion => {
            const canonicalKey = toCanonical(suggestion.value);
            if (!suggestionsMap.has(canonicalKey)) {
                suggestionsMap.set(canonicalKey, suggestion);
            }
        });
        
        const result = Array.from(suggestionsMap.values());
        const categoryOrder: { [key: string]: number } = {
            [t('tagCategories.smart')]: 1,
            [t('tagCategories.strategy')]: 2,
            [t('tagCategories.session')]: 3
        };

        result.sort((a, b) => {
            const orderA = categoryOrder[a.category] || 99;
            const orderB = categoryOrder[b.category] || 99;
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            return a.display.localeCompare(b.display);
        });

        return result;
    }, [predefinedTags, smartSuggestions, t]);

    const filteredSuggestions = useMemo(() => {
        const availableSuggestions = allSuggestions.filter(s => !tags.includes(s.value));
        
        if (!inputValue) {
            return availableSuggestions;
        }

        const lowerInput = inputValue.toLowerCase();
        return availableSuggestions.filter(s => 
            s.display.toLowerCase().includes(lowerInput)
        );
    }, [inputValue, allSuggestions, tags]);

    const groupedSuggestions = useMemo(() => {
        type Suggestion = typeof filteredSuggestions[number];
        return filteredSuggestions.reduce((acc: Record<string, Suggestion[]>, suggestion) => {
            const category = suggestion.category || 'Other';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(suggestion);
            return acc;
        }, {});
    }, [filteredSuggestions]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addTag = (tag: string) => {
        const newTag = tag.trim();
        if (newTag && !tags.includes(newTag)) {
            onUpdate([...tags, newTag]);
        }
        setInputValue('');
        setShowSuggestions(false);
    };
    
    const removeTag = (tagToRemove: string) => {
        onUpdate(tags.filter(tag => tag !== tagToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue) {
            e.preventDefault();
            const trimmedInput = inputValue.trim();
            const exactMatch = filteredSuggestions.find(s => s.display.toLowerCase() === trimmedInput.toLowerCase());

            if (exactMatch) {
                addTag(exactMatch.value);
            } else {
                addTag(trimmedInput);
            }
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <div className={`flex flex-wrap gap-2 items-center w-full bg-brand-surface border rounded-md p-2 transition-all duration-200 ${error ? 'border-brand-loss ring-2 ring-brand-loss/50' : 'border-brand-border-soft focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-accent/50'}`}>
                {tags.map(tag => (
                    <span key={tag} className={`flex items-center font-semibold px-2.5 py-1 rounded-full text-xs ${getTagStyle(tag)}`}>
                        {formatTag(tag)}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1.5 -mr-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                            aria-label={t('tooltips.removeTag', { tag: formatTag(tag) })}
                        >
                            <X size={14} />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder={tags.length === 0 ? t('tradeModal.addTagPlaceholder') : t('tradeModal.addMoreTagsPlaceholder')}
                    className="flex-1 bg-transparent focus:outline-none text-sm min-w-[120px]"
                />
            </div>
            
            {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-brand-surface border border-brand-border rounded-xl shadow-soft-lg z-20 max-h-64 overflow-y-auto p-1 animate-fade-in backdrop-blur-md">
                    <ul role="listbox">
                        {Object.keys(groupedSuggestions).map(category => (
                             <li key={category}>
                                <div className="px-3 pt-2 pb-1 text-xs font-bold text-brand-text-secondary uppercase tracking-wider">{category}</div>
                                <ul>
                                    {groupedSuggestions[category].map(suggestion => (
                                        <li
                                            key={suggestion.value}
                                            className="group flex justify-between items-center mx-1 p-2 rounded-lg hover:bg-brand-surface-light cursor-pointer text-sm"
                                            onClick={() => addTag(suggestion.value)}
                                            role="option"
                                            aria-selected="false"
                                        >
                                            <span className="font-medium">{suggestion.display}</span>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default React.memo(TagInput);