import React, { useState, useEffect, useRef } from 'react';
import { format, isSameDay, isSameMonth } from 'date-fns';
import { TradesByDay } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';

interface CalendarDayProps {
  day: Date;
  monthStart: Date;
  summary: TradesByDay | undefined;
  onClick: (date: Date) => void;
}

const CalendarDayComponent: React.FC<CalendarDayProps> = ({ day, monthStart, summary, onClick }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const prevSummaryRef = useRef<{ pnl: number | undefined, count: number | undefined } | undefined>(undefined);
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    const currentPnl = summary?.totalPnl;
    const currentCount = summary?.tradeCount;

    if (prevSummaryRef.current) {
        if (currentPnl !== prevSummaryRef.current.pnl || currentCount !== prevSummaryRef.current.count) {
            setIsAnimating(true);
            const timer = setTimeout(() => setIsAnimating(false), 600);
            return () => clearTimeout(timer);
        }
    }

    prevSummaryRef.current = { pnl: currentPnl, count: currentCount };
  }, [summary?.totalPnl, summary?.tradeCount]);

  const isCurrentMonth = isSameMonth(day, monthStart);
  const isToday = isSameDay(day, new Date());
  
  const pnl = summary?.totalPnl ?? 0;
  const hasTrades = summary && summary.tradeCount > 0 && isCurrentMonth;
  const trades = summary?.trades || [];

  let dayBgClass = '';
  let dayNumberClass = 'text-brand-text-secondary';
  let pnlTextClass = pnl > 0 ? 'text-brand-profit' : pnl < 0 ? 'text-brand-loss' : 'text-brand-text-primary';
  let tradeCountTextClass = 'text-brand-text-secondary';
  let borderClass = 'border-transparent';

  // Base styling for the day cell
  if (hasTrades) {
      if (pnl > 0) {
          dayBgClass = 'bg-brand-profit shadow-sm';
          dayNumberClass = 'text-white/90';
          pnlTextClass = 'text-white';
          tradeCountTextClass = 'text-white/80';
      } else if (pnl < 0) {
          dayBgClass = 'bg-brand-loss shadow-sm';
          dayNumberClass = 'text-white/90';
          pnlTextClass = 'text-white';
          tradeCountTextClass = 'text-white/80';
      } else { // pnl is 0 but has trades
          dayBgClass = 'bg-brand-surface-opaque shadow-sm';
          dayNumberClass = 'text-brand-text-secondary';
          pnlTextClass = 'text-brand-text-primary';
          tradeCountTextClass = 'text-brand-text-secondary';
          borderClass = 'border-brand-border-soft';
      }
  } else if (!isCurrentMonth) {
      dayBgClass = 'bg-black/5 dark:bg-white/5 opacity-60';
      dayNumberClass = 'text-brand-text-secondary/30';
  } else {
      // Empty day in current month
      dayBgClass = 'hover:bg-brand-surface-light';
  }

  if (isToday && !hasTrades) {
      dayNumberClass += ' bg-brand-accent text-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm';
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(day);
      }
  };

  // Hover effects logic
  const hoverEffects = hasTrades
    ? "hover:scale-[1.03] hover:-translate-y-0.5 hover:shadow-lg hover:z-20 hover:brightness-105" // Distinct lift and glow for trade days
    : "hover:scale-[1.02] hover:shadow-md hover:z-10"; // Subtle lift for empty days

  return (
    <div
      role="button"
      tabIndex={0}
      className={`relative flex flex-col h-24 sm:h-28 p-1 sm:p-2 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer group focus:outline-none focus:ring-2 focus:ring-brand-accent/50 border ${borderClass} ${dayBgClass} ${hoverEffects}`}
      onClick={() => onClick(day)}
      onKeyDown={handleKeyDown}
      aria-label={`View trades for ${format(day, 'MMMM do')}`}
    >
      <div className={`self-end text-xs sm:text-sm font-medium transition-colors ${dayNumberClass}`}>
        {format(day, 'd')}
      </div>
      {summary && isCurrentMonth && (
         <div className={`mt-auto text-right ${isAnimating ? 'animate-pnl-update' : ''}`}>
          <p className={`font-bold text-base sm:text-lg leading-tight ${pnlTextClass}`}>
            {formatCurrency(pnl)}
          </p>
          <p className={`text-[10px] sm:text-xs font-medium ${tradeCountTextClass}`}>{summary.tradeCount} trade{summary.tradeCount !== 1 ? 's' : ''}</p>
        </div>
      )}

      {/* Tooltip for Trade Details */}
      {hasTrades && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[110%] mb-1 w-48 bg-brand-surface-opaque/95 backdrop-blur-xl border border-brand-border rounded-xl shadow-xl p-2.5 z-50 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none hidden md:block scale-95 group-hover:scale-100 origin-bottom">
            <div className="space-y-1.5">
                {trades.slice(0, 5).map((trade) => (
                    <div key={trade.id} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                            <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${trade.pnl >= 0 ? 'bg-brand-profit' : 'bg-brand-loss'}`}></div>
                            <span className="font-mono font-medium text-brand-text-primary truncate max-w-[80px]">{trade.pair}</span>
                        </div>
                        <span className={`flex-shrink-0 font-semibold ${trade.pnl >= 0 ? 'text-brand-profit' : 'text-brand-loss'}`}>
                            {formatCurrency(trade.pnl)}
                        </span>
                    </div>
                ))}
                {trades.length > 5 && (
                    <div className="text-center text-[10px] font-medium text-brand-text-tertiary pt-1.5 border-t border-brand-border-soft mt-1">
                        +{trades.length - 5} more
                    </div>
                )}
            </div>
            {/* Tooltip Arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full h-0 w-0 border-x-8 border-x-transparent border-t-8 border-t-brand-border/50"></div>
        </div>
      )}
    </div>
  );
};

// Custom comparison function for React.memo
const areEqual = (prevProps: CalendarDayProps, nextProps: CalendarDayProps) => {
    return (
        isSameDay(prevProps.day, nextProps.day) &&
        isSameMonth(prevProps.monthStart, nextProps.monthStart) &&
        prevProps.summary?.totalPnl === nextProps.summary?.totalPnl &&
        prevProps.summary?.tradeCount === nextProps.summary?.tradeCount &&
        prevProps.onClick === nextProps.onClick
    );
};

export default React.memo(CalendarDayComponent, areEqual);