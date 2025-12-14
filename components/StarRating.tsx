import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
    rating: number;
    setRating?: (rating: number) => void;
    readOnly?: boolean;
    size?: 'sm' | 'md';
}

const StarRating: React.FC<StarRatingProps> = ({ rating, setRating, readOnly = false, size = 'md' }) => {
    const [hoverRating, setHoverRating] = useState(0);

    const handleStarClick = (index: number) => {
        if (readOnly || !setRating) return;
        // Allow unsetting the rating by clicking the same star again
        setRating(rating === index ? 0 : index);
    };

    const handleMouseEnter = (index: number) => {
        if (readOnly) return;
        setHoverRating(index);
    };

    const handleMouseLeave = () => {
        if (readOnly) return;
        setHoverRating(0);
    };

    const starSize = size === 'sm' ? 18 : 24;
    const buttonPadding = size === 'sm' ? 'p-0' : 'p-1';

    return (
        <div className="flex items-center" onMouseLeave={handleMouseLeave}>
            {[1, 2, 3, 4, 5].map((index) => {
                const isFilled = (hoverRating || rating) >= index;
                return (
                    <button
                        type="button"
                        key={index}
                        onClick={() => handleStarClick(index)}
                        onMouseEnter={() => handleMouseEnter(index)}
                        className={`transition-transform duration-150 ease-in-out ${buttonPadding} ${!readOnly ? 'hover:scale-125' : 'cursor-default'}`}
                        aria-label={`Rate ${index} star${index > 1 ? 's' : ''}`}
                        disabled={readOnly}
                    >
                        <Star
                            size={starSize}
                            className={`transition-colors ${isFilled ? 'text-yellow-400 dark:text-yellow-300' : 'text-brand-text-secondary/30'}`}
                            fill={isFilled ? 'currentColor' : 'none'}
                        />
                    </button>
                );
            })}
        </div>
    );
};

export default React.memo(StarRating);
