import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check, Plus } from 'lucide-react';
import { getTagCategoryStyle } from '../utils/tags';

interface TagGroupProps {
  title: string;
  icon: React.ReactNode;
  options: string[];
  selected: string[] | string;
  onUpdate: (selection: string[] | string) => void;
  onAddOption?: (option: string) => void;
  multiSelect?: boolean;
  category: string;
}

const TagGroup: React.FC<TagGroupProps> = ({ title, icon, options, selected, onUpdate, onAddOption, multiSelect = true, category }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [newOptionInput, setNewOptionInput] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedArray = Array.isArray(selected) ? selected : (selected ? [selected] : []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: string) => {
        if (multiSelect) {
            const newSelection = selectedArray.includes(option)
                ? selectedArray.filter(item => item !== option)
                : [...selectedArray, option];
            onUpdate(newSelection);
        } else {
            onUpdate(selectedArray.includes(option) ? '' : option);
            setIsOpen(false);
        }
    };

    const handleAddOptionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = newOptionInput.trim();
            if (value && onAddOption && !options.some(o => o.toLowerCase() === value.toLowerCase())) {
                onAddOption(value);
                handleSelect(value);
                setNewOptionInput('');
            }
        }
    };
    
    const handleRemove = (option: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (multiSelect) {
        onUpdate(selectedArray.filter(item => item !== option));
      } else {
        onUpdate('');
      }
    }
    
    const basePillClasses = "flex items-center font-semibold px-2 py-0.5 rounded text-xs animate-pop-elastic";

    return (
        <div ref={containerRef} className="relative">
            <div className="flex justify-between items-center mb-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-brand-text-primary">
                    {icon}
                    {title}
                </label>
            </div>
            <button
                type="button"
                onClick={() => setIsOpen(p => !p)}
                className={`flex flex-wrap gap-1.5 items-center w-full bg-brand-surface border rounded-lg p-2.5 text-left transition-all duration-200 min-h-[46px] ${isOpen ? 'ring-2 ring-brand-accent/50 border-brand-accent/50' : 'border-brand-border-soft hover:border-brand-border'}`}
            >
                {selectedArray.length === 0 && <span className="text-brand-text-secondary text-sm">{t('tagGroup.placeholder')}</span>}
                {selectedArray.map(item => (
                    <span key={item} className={`${basePillClasses} ${getTagCategoryStyle(category)}`}>
                        {t(`tagOptions.${category}.${item}`, item)}
                        <button
                            type="button"
                            onClick={(e) => handleRemove(item, e)}
                            className="ml-1.5 -mr-0.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                            aria-label={t('tooltips.removeTag', { tag: item })}
                        >
                            <X size={12} />
                        </button>
                    </span>
                ))}
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-brand-surface border border-brand-border rounded-xl shadow-soft-lg z-20 flex flex-col max-h-64 animate-menu-slide backdrop-blur-md">
                    {onAddOption && (
                        <div className="p-2 border-b border-brand-border-soft flex-shrink-0">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={t('tagGroup.addCustom')}
                                    value={newOptionInput}
                                    onChange={(e) => setNewOptionInput(e.target.value)}
                                    onKeyDown={handleAddOptionKeyDown}
                                    className="w-full bg-brand-surface-light border border-brand-border-soft rounded-md pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-accent transition-shadow"
                                    autoFocus
                                />
                                <Plus size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-text-secondary pointer-events-none" />
                            </div>
                        </div>
                    )}
                   <ul className="flex-grow overflow-y-auto p-2 stagger-list custom-scrollbar">
                        {options.map(option => {
                            const isSelected = selectedArray.includes(option);
                            return (
                                <li
                                    key={option}
                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm font-medium transition-colors ${isSelected ? 'bg-brand-accent/10 text-brand-accent' : 'hover:bg-brand-surface-light text-brand-text-primary'}`}
                                    onClick={() => handleSelect(option)}
                                    role="option"
                                    aria-selected={isSelected}
                                >
                                    <span>{t(`tagOptions.${category}.${option}`, option)}</span>
                                    {isSelected && <Check size={16} className="animate-pop-elastic" />}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default React.memo(TagGroup);