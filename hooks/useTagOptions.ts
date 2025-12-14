import { useState, useEffect, useCallback } from 'react';
import { get, set } from '../utils/db';

const STORAGE_KEY = 'customTagOptions';

const DEFAULT_TAG_OPTIONS = {
    strategy: ['Breakout', 'Reversal', 'Liquidity Grab', 'Trend Following'],
    trigger: ['Break & Retest', 'Liquidity Sweep', 'Order Block', 'Fair Value Gap', 'Trendline Bounce'],
    session: ['London', 'New York', 'Asia', 'Overlap'],
    mistakes: ['Early Entry', 'Late Entry', 'Early Exit', 'Late Exit', 'Over-leveraged', 'FOMO', 'Revenge Trading'],
    confidence: ['High', 'Medium', 'Low'],
    emotions: ['Patient', 'Disciplined', 'Anxious', 'Greedy', 'Fearful', 'Hesitant', 'Bored'],
};

export type TagOptions = typeof DEFAULT_TAG_OPTIONS;

export const useTagOptions = () => {
    const [tagOptions, setTagOptions] = useState<TagOptions>(DEFAULT_TAG_OPTIONS);

    useEffect(() => {
        const loadCustomOptions = async () => {
            try {
                const customOptions = await get<Partial<TagOptions>>(STORAGE_KEY);
                if (customOptions) {
                    setTagOptions(prev => {
                        const merged = { ...prev };
                        for (const key in customOptions) {
                            const category = key as keyof TagOptions;
                            const customValues = customOptions[category] || [];
                            const defaultValues = DEFAULT_TAG_OPTIONS[category] || [];
                            // Use Set to ensure unique values and maintain order
                            merged[category] = [...new Set([...defaultValues, ...customValues])] as any;
                        }
                        return merged;
                    });
                }
            } catch (error) {
                console.error("Failed to load custom tag options", error);
            }
        };
        loadCustomOptions();
    }, []);

    const addTagOption = useCallback(async (category: keyof TagOptions, option: string) => {
        const newOption = option.trim();
        if (!newOption) return;

        setTagOptions(prev => {
            const existingOptions = prev[category] || [];
            // Case-insensitive check to prevent duplicates
            if (existingOptions.some(o => o.toLowerCase() === newOption.toLowerCase())) {
                return prev;
            }
            const updatedOptions = [...existingOptions, newOption];
            const newState = { ...prev, [category]: updatedOptions };
            
            // Persist only the custom options
            (async () => {
                try {
                    const customOptions = await get<Partial<TagOptions>>(STORAGE_KEY) || {};
                    const customCategoryOptions = customOptions[category] || [];
                    if (!customCategoryOptions.some(o => o.toLowerCase() === newOption.toLowerCase())) {
                        customOptions[category] = [...customCategoryOptions, newOption] as any;
                        await set(STORAGE_KEY, customOptions);
                    }
                } catch (error) {
                    console.error("Failed to save custom tag option", error);
                }
            })();

            return newState;
        });
    }, []);

    return { tagOptions, addTagOption };
};