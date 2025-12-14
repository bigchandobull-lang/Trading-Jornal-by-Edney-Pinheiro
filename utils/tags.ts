/**
 * Returns a Tailwind CSS class string for styling a tag based on its category.
 * @param category The tag category (e.g., "strategy").
 * @returns A string of CSS classes.
 */
export const getTagCategoryStyle = (category: string): string => {
    switch (category) {
        case 'strategy':
            return 'bg-tag-strategy-bg text-tag-strategy-text ring-1 ring-inset ring-tag-strategy-ring';
        case 'trigger':
            return 'bg-tag-trigger-bg text-tag-trigger-text ring-1 ring-inset ring-tag-trigger-ring';
        case 'session':
            return 'bg-tag-session-bg text-tag-session-text ring-1 ring-inset ring-tag-session-ring';
        case 'mistakes':
            return 'bg-tag-mistakes-bg text-tag-mistakes-text ring-1 ring-inset ring-tag-mistakes-ring';
        case 'confidence':
            return 'bg-tag-confidence-bg text-tag-confidence-text ring-1 ring-inset ring-tag-confidence-ring';
        case 'emotions':
            return 'bg-tag-emotions-bg text-tag-emotions-text ring-1 ring-inset ring-tag-emotions-ring';
        case 'custom':
        default:
            return 'bg-tag-custom-bg text-tag-custom-text ring-1 ring-inset ring-tag-custom-ring';
    }
};

/**
 * Formats a tag string for display by removing any category prefix.
 * @param tag The tag string (e.g., "strategy:Breakout").
 * @returns The formatted tag string (e.g., "Breakout").
 */
export const formatTag = (tag: string): string => {
    const parts = tag.split(':');
    return parts.length > 1 ? parts.slice(1).join(':') : tag;
};

/**
 * Returns a Tailwind CSS class string for styling a tag based on its value.
 * It extracts the category from a prefixed tag string.
 * @param tag The tag string (e.g., "strategy:Breakout" or "Breakout").
 * @returns A string of CSS classes.
 */
export const getTagStyle = (tag: string): string => {
    const category = tag.split(':')[0];
    const knownCategories = ['strategy', 'trigger', 'session', 'mistakes', 'confidence', 'emotions'];
    if (knownCategories.includes(category)) {
        return getTagCategoryStyle(category);
    }
    return getTagCategoryStyle('custom');
};