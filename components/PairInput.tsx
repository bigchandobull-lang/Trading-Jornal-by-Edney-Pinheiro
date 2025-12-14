import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface PairInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  onRemoveSuggestion: (pair: string) => void;
  placeholder?: string;
  className?: string;
}

const PairInput: React.FC<PairInputProps> = ({ value, onChange, suggestions, onRemoveSuggestion, placeholder, className }) => {
    const { t } = useTranslation();
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredSuggestions = useMemo(() => {
        const lowerValue = value.toLowerCase();
        if (!lowerValue) {
            return suggestions;
        }
        return suggestions.filter(s =>
            s.toLowerCase().includes(lowerValue) && s.toLowerCase() !== lowerValue
        );
    }, [value, suggestions]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const inputClassName = className || "w-full bg-brand-surface-light border border-brand-border-soft rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-shadow duration-200";

    return (
        <div className="relative" ref={containerRef}>
            <input
                type="text"
                placeholder={placeholder || t('common.pair')}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                className={inputClassName}
                autoComplete="off"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-brand-surface border border-brand-border rounded-xl shadow-soft-lg z-20 max-h-48 overflow-y-auto p-1 animate-fade-in backdrop-blur-md">
                    <ul role="listbox">
                        {filteredSuggestions.map(suggestion => (
                            <li
                                key={suggestion}
                                className="group flex justify-between items-center p-2 rounded-lg hover:bg-brand-surface-light cursor-pointer text-sm"
                                onClick={() => {
                                    onChange(suggestion);
                                    setShowSuggestions(false);
                                }}
                                role="option"
                                aria-selected="false"
                            >
                                <span className="font-medium">{suggestion}</span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveSuggestion(suggestion);
                                    }}
                                    className="text-brand-text-secondary hover:text-brand-loss p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label={t('tooltips.removeSuggestion', { suggestion })}
                                >
                                    <X size={16} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default React.memo(PairInput);