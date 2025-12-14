import React from 'react';

/**
 * A trading-related icon featuring a bullish (green) and bearish (red) candlestick.
 * This icon is relevant to financial markets and day trading.
 */
export const AppIcon = ({ className }: { className?: string }) => {
  return React.createElement(
    'svg',
    {
      className: className,
      viewBox: '0 0 200 200',
      xmlns: 'http://www.w3.org/2000/svg',
      preserveAspectRatio: 'xMidYMid meet',
      'aria-label': 'Trading candlesticks icon',
    },
    [
      // Bullish Candle (Green)
      React.createElement('g', { key: 'bull-candle' }, [
        // Wick
        React.createElement('line', {
          key: 'bull-wick',
          x1: '65',
          y1: '30',
          x2: '65',
          y2: '170',
          stroke: '#2DD4BF', // Updated color
          strokeWidth: '12',
          strokeLinecap: 'round',
        }),
        // Body
        React.createElement('rect', {
          key: 'bull-body',
          x: '45',
          y: '80',
          width: '40',
          height: '60',
          fill: '#2DD4BF', // Updated color
        }),
      ]),
      // Bearish Candle (Red)
      React.createElement('g', { key: 'bear-candle' }, [
        // Wick
        React.createElement('line', {
          key: 'bear-wick',
          x1: '135',
          y1: '40',
          x2: '135',
          y2: '160',
          stroke: '#F47174', // Updated color
          strokeWidth: '12',
          strokeLinecap: 'round',
        }),
        // Body
        React.createElement('rect', {
          key: 'bear-body',
          x: '115',
          y: '60',
          width: '40',
          height: '50',
          fill: '#F47174', // Updated color
        }),
      ]),
    ]
  );
};