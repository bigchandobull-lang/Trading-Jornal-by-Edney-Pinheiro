import React from 'react';
import { useTranslation } from 'react-i18next';
import { getTagCategoryStyle } from '../utils/tags';
import { TradeTags } from '../types';

interface TagsDisplayProps {
    tags: TradeTags;
}

const TagsDisplay: React.FC<TagsDisplayProps> = ({ tags }) => {
    const { t } = useTranslation();
    if (!tags || Object.keys(tags).length === 0) {
        return null;
    }
    
    // Define a canonical order for categories
    const categoryOrder = ['strategy', 'trigger', 'session', 'mistakes', 'confidence', 'emotions', 'custom'];

    return (
        <div className="flex flex-wrap items-center gap-2">
            {categoryOrder.map(category => {
                const tagValues = tags[category as keyof TradeTags];
                if (!tagValues || (Array.isArray(tagValues) && tagValues.length === 0)) {
                    return null;
                }

                const values = Array.isArray(tagValues) ? tagValues : [tagValues];
                const style = getTagCategoryStyle(category);

                return values.map(tag => (
                    <span key={`${category}-${tag}`} className={`font-semibold px-2.5 py-1 rounded-full text-xs ${style}`}>
                        {t(`tagOptions.${category}.${tag}`, tag)}
                    </span>
                ));
            })}
        </div>
    );
};

export default React.memo(TagsDisplay);