import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trade } from '../types';
import { Timeframe } from '../App';
import {
    addDays,
    startOfWeek,
    format,
    subMonths,
    startOfMonth,
    endOfMonth,
    isWithinInterval,
    getYear,
    getMonth
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDateFnsLocale } from '../hooks/useDateFnsLocale';
import { useCurrency } from '../contexts/CurrencyContext';

interface PeriodStripProps {
    trades: Trade[];
    currentDate: Date;
    timeframe: Timeframe;
    onDayClick: (date: Date) => void;
    onSetDate: (date: Date) => void;
}

interface PeriodBoxProps {
    label: string;
    subLabel?: string;
    pnl: number;
    onClick: () => void;
    isSelected?: boolean;
    formatCurrency: (val: number) => string;
}

const PeriodBox: React.FC<PeriodBoxProps> = React.memo(({ label, subLabel, pnl, onClick, isSelected, formatCurrency }) => {
    const pnlColor = pnl > 0 ? 'text-brand-profit' : pnl < 0 ? 'text-brand-loss' : 'text-brand-text-secondary';
    const selectedClasses = isSelected ? 'bg-white/20 dark:bg-white/10 ring-2 ring-brand-accent' : 'bg-brand-surface-light hover:bg-brand-surface';
    
    return (
        <button
            onClick={onClick}
            className={`flex-1 min-w-[100px] p-3 rounded-xl text-center transition-all duration-200 shadow-soft border border-brand-border-soft ${selectedClasses}`}
        >
            <p className="text-xs font-semibold text-brand-text-secondary">{subLabel || label}</p>
            {subLabel && <p className="text-xl font-bold text-brand-text-primary">{label}</p>}
            <p className={`text-base font-bold mt-1 ${pnlColor}`}>
                {formatCurrency(pnl)}
            </p>
        </button>
    );
});


const PeriodStrip: React.FC<PeriodStripProps> = ({ trades, currentDate, timeframe, onDayClick, onSetDate }) => {
    const { t } = useTranslation();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const locale = useDateFnsLocale();
    const { formatCurrency } = useCurrency();

    const data = useMemo(() => {
        if (timeframe === 'week') {
            const weekStart = startOfWeek(currentDate, { locale });
            const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
            return days.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const dayTrades = trades.filter(t => t.date === dayStr);
                const pnl = dayTrades.reduce((acc, t) => acc + t.pnl, 0);
                return {
                    id: dayStr,
                    date: day,
                    label: format(day, 'd', { locale }),
                    subLabel: format(day, 'eee', { locale }),
                    pnl,
                    isSelected: undefined,
                };
            });
        }

        if (timeframe === 'month') {
            const months = Array.from({ length: 7 }).map((_, i) => subMonths(currentDate, i)).reverse();
            return months.map(month => {
                const monthStart = startOfMonth(month);
                const monthEnd = endOfMonth(month);
                const monthTrades = trades.filter(t => {
                    const tradeDate = new Date(t.date + 'T00:00:00');
                    return isWithinInterval(tradeDate, { start: monthStart, end: monthEnd });
                });
                const pnl = monthTrades.reduce((acc, t) => acc + t.pnl, 0);
                return {
                    id: format(month, 'yyyy-MM'),
                    date: month,
                    label: format(month, 'MMM', { locale }),
                    pnl,
                    isSelected: getMonth(month) === getMonth(currentDate) && getYear(month) === getYear(currentDate),
                    subLabel: undefined,
                };
            });
        }
        
        if (timeframe === 'year') {
            const year = getYear(currentDate);
            const months = Array.from({ length: 12 }).map((_, i) => new Date(year, i, 1));
            return months.map(month => {
                const monthStart = startOfMonth(month);
                const monthEnd = endOfMonth(month);
                const monthTrades = trades.filter(t => {
                    const tradeDate = new Date(t.date + 'T00:00:00');
                    return isWithinInterval(tradeDate, { start: monthStart, end: monthEnd });
                });
                const pnl = monthTrades.reduce((acc, t) => acc + t.pnl, 0);
                return {
                    id: format(month, 'yyyy-MM'),
                    date: month,
                    label: format(month, 'MMM', { locale }),
                    pnl,
                    isSelected: getMonth(month) === getMonth(currentDate),
                    subLabel: undefined,
                };
            });
        }
        return [];
    }, [trades, currentDate, timeframe, locale]);

    const checkScrollability = useCallback(() => {
        const el = scrollContainerRef.current;
        if (el) {
            const hasOverflow = el.scrollWidth > el.clientWidth;
            setCanScrollLeft(el.scrollLeft > 5); // Add tolerance
            setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
        } else {
            setCanScrollLeft(false);
            setCanScrollRight(false);
        }
    }, []);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        
        checkScrollability();
        el.addEventListener('scroll', checkScrollability, { passive: true });
        
        const resizeObserver = new ResizeObserver(checkScrollability);
        resizeObserver.observe(el);

        return () => {
            el.removeEventListener('scroll', checkScrollability);
            resizeObserver.disconnect();
        };
    }, [data, checkScrollability]);

    const scroll = useCallback((direction: 'left' | 'right') => {
        const el = scrollContainerRef.current;
        if (el) {
            const scrollAmount = el.clientWidth * 0.8;
            el.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    }, []);
    
    const handleClick = useCallback((item: any) => {
        if (timeframe === 'week') {
            onDayClick(item.date);
        } else {
            onSetDate(item.date);
        }
    }, [timeframe, onDayClick, onSetDate]);
    
    return (
        <div className="mb-6">
            <div className="relative">
                <div 
                    ref={scrollContainerRef}
                    className="flex gap-2 sm:gap-4 overflow-x-auto pb-3 -mb-3 no-scrollbar"
                >
                    {data.map(item => (
                        <PeriodBox
                            key={item.id}
                            label={item.label}
                            subLabel={item.subLabel}
                            pnl={item.pnl}
                            onClick={() => handleClick(item)}
                            isSelected={item.isSelected}
                            formatCurrency={formatCurrency}
                        />
                    ))}
                </div>

                {canScrollLeft && (
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-brand-surface shadow-soft border border-brand-border-soft hover:scale-105 active:scale-95 transition-all animate-fade-in"
                        aria-label={t('tradesList.previous')}
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}

                {canScrollRight && (
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-brand-surface shadow-soft border border-brand-border-soft hover:scale-105 active:scale-95 transition-all animate-fade-in"
                        aria-label={t('tradesList.next')}
                    >
                        <ChevronRight size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default React.memo(PeriodStrip);