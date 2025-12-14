import React from 'react';

/**
 * United States Flag
 * Corrected to a more common 5:3 aspect ratio from the previous 4:3.
 * Official government ratio is 19:10, but 5:3 is widely used.
 */
export const FlagEN = () => {
    // Dimensions based on 5:3 aspect ratio (e.g., 75x45)
    const viewboxWidth = 75;
    const viewboxHeight = 45;
    const cantonWidth = 30; // 0.4 * width
    const cantonHeight = (7 / 13) * viewboxHeight; // ~24.23

    // Star layout calculations
    const starGridX = cantonWidth / 6; // Horizontal spacing for 6-star rows
    const starGridY = cantonHeight / 5; // Vertical spacing for 5-star rows

    // A single 5-pointed star path, scaled to fit the grid
    const starPath = "M5 2 L6.1756 5.5135 L10 5.427 L7.218 7.573 L8.0902 11 L5 8.6 L1.9098 11 L2.782 7.573 L0 5.427 L3.8244 5.5135 Z";
    const starScale = 0.2; // Adjust scale to fit nicely

    return (
        <svg width="24" height="18" viewBox={`0 0 ${viewboxWidth} ${viewboxHeight}`} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="United States Flag">
            {/* White background */}
            <rect width={viewboxWidth} height={viewboxHeight} fill="#FFFFFF" />

            {/* 7 Red Stripes */}
            {Array.from({ length: 7 }).map((_, i) => (
                <rect key={`stripe-${i}`} y={i * (viewboxHeight / 13) * 2} width={viewboxWidth} height={viewboxHeight / 13} fill="#B22234" />
            ))}

            {/* Blue Canton (Union) */}
            <rect width={cantonWidth} height={cantonHeight} fill="#3C3B6E" />

            <g fill="#FFFFFF">
                {/* 5 rows of 6 stars */}
                {Array.from({ length: 5 }).map((_, r) => (
                    Array.from({ length: 6 }).map((_, c) => (
                        <path key={`s6-${r}-${c}`} d={starPath} transform={`translate(${c * starGridX + starGridX / 2}, ${r * starGridY + starGridY / 2}) scale(${starScale}) translate(-5 -5.5)`} />
                    ))
                ))}
                {/* 4 rows of 5 stars */}
                {Array.from({ length: 4 }).map((_, r) => (
                    Array.from({ length: 5 }).map((_, c) => (
                        <path key={`s5-${r}-${c}`} d={starPath} transform={`translate(${c * starGridX + starGridX}, ${r * starGridY + starGridY}) scale(${starScale}) translate(-5 -5.5)`} />
                    ))
                ))}
            </g>
        </svg>
    );
};
