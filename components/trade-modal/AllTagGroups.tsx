import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TradeTags } from '../../types';
import { Settings, Target, Star, AlertTriangle, BarChart, Smile } from 'lucide-react';
import TagGroup from '../TagGroup';
import { useTradesContext } from '../../contexts/TradesContext';

interface AllTagGroupsProps {
  tags: TradeTags;
  onTagsChange: (category: keyof TradeTags, value: string[] | string) => void;
}

const AllTagGroups: React.FC<AllTagGroupsProps> = ({ tags, onTagsChange }) => {
    const { t } = useTranslation();
    const { tagOptions, addTagOption } = useTradesContext();

    const handleAddOption = useCallback((category: keyof typeof tagOptions) => (option: string) => {
        addTagOption(category, option);
    }, [addTagOption]);

    const TAG_CONFIG = [
        { title: t('tagCategories.strategy'), icon: <Settings size={16} />, category: 'strategy', multiSelect: true },
        { title: t('tagCategories.trigger'), icon: <Target size={16} />, category: 'trigger', multiSelect: true },
        { title: t('tagCategories.session'), icon: <Star size={16} />, category: 'session', multiSelect: true },
        { title: t('tagCategories.mistakes'), icon: <AlertTriangle size={16} />, category: 'mistakes', multiSelect: true },
        { title: t('tagCategories.confidence'), icon: <BarChart size={16} />, category: 'confidence', multiSelect: false },
        { title: t('tagCategories.emotions'), icon: <Smile size={16} />, category: 'emotions', multiSelect: true },
    ] as const;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TAG_CONFIG.map(({ title, icon, category, multiSelect }) => (
                <TagGroup
                    key={category}
                    title={title}
                    icon={icon}
                    options={tagOptions[category]}
                    onAddOption={handleAddOption(category)}
                    selected={tags[category] || (multiSelect ? [] : '')}
                    onUpdate={(value) => onTagsChange(category, value)}
                    category={category}
                    multiSelect={multiSelect}
                />
            ))}
        </div>
    );
};

export default React.memo(AllTagGroups);
