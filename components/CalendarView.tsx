import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { addMonths, format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, TrendingUp, DollarSign, BarChart2 } from 'lucide-react';
import DatePicker from './DatePicker';
import Calendar from './Calendar';
import { TradesByDay, Trade } from '../types';
import WeeklySummary from './WeeklySummary';
import { useDateFnsLocale } from '../hooks/useDateFnsLocale';
import { useCurrency } from '../contexts/CurrencyContext';

const MonthlySummaryStats: React.FC<{ tradesByDay: Map<string, TradesByDay>, currentDate: Date }> = React.memo(({ tradesByDay, currentDate }) => {
    const { t } = useTranslation();
    const { formatCurrency } = useCurrency();
    const { totalPnl, winRate, tradeCount } = useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        let totalPnl = 0, winCount = 0, tradeCount = 0;
        
        tradesByDay.forEach((dayData, dateStr) => {
            const date = new Date(dateStr + "T00:00:00");
            if (isWithinInterval(date, { start: monthStart, end: monthEnd })) {
                totalPnl += dayData.totalPnl;
                tradeCount += dayData.tradeCount;
                winCount += dayData.trades.filter(t => t.pnl > 0).length;
            }
        });
        
        const winRate = tradeCount > 0 ? (winCount / tradeCount) * 100 : 0;
        return { totalPnl, winRate, tradeCount };
    }, [tradesByDay, currentDate]);

    const StatCard = ({ icon, title, value, colorClass }: { icon: React.ReactNode, title: string, value: string, colorClass?: string }) => (
        <div className="bg-brand-surface rounded-xl p-5 shadow-soft flex items-center gap-5 backdrop-blur-md border border-brand-border-soft">
             <div className="grid place-content-center w-12 h-12 bg-gradient-to-br from-brand-surface-light to-brand-surface-opaque border border-brand-border-soft rounded-xl shadow-sm text-brand-accent">
                {icon}
            </div>
            <div>
                <p className="text-sm font-semibold text-brand-text-secondary mb-1">{title}</p>
                <p className={`text-2xl font-bold tracking-tight ${colorClass || 'text-brand-text-primary'}`}>{value}</p>
            </div>
        </div>
    );

    return (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
                icon={<DollarSign size={24} />}
                title={t('monthlySummary.totalPnl')}
                value={formatCurrency(totalPnl)}
                colorClass={totalPnl >= 0 ? 'text-brand-profit' : 'text-brand-loss'}
            />
            <StatCard 
                icon={<TrendingUp size={24} />}
                title={t('monthlySummary.winRate')}
                value={`${winRate.toFixed(1)}%`}
            />
            <StatCard 
                icon={<BarChart2 size={24} />}
                title={t('monthlySummary.trades')}
                value={tradeCount.toString()}
            />
        </div>
    );
});


interface CalendarViewProps {
  tradesByDay: Map<string, TradesByDay>;
  onDayClick: (date: Date) => void;
  onWeekClick: (start: Date, end: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tradesByDay, onDayClick, onWeekClick }) => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const locale = useDateFnsLocale();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNext = useCallback(() => setCurrentDate(current => addMonths(current, 1)), []);
  const handlePrev = useCallback(() => setCurrentDate(current => subMonths(current, 1)), []);
  
  const handleDateChange = useCallback((date: Date) => {
    if (date) { setCurrentDate(date); }
    setIsDatePickerOpen(false);
  }, []);
  
  const handleTodayClick = useCallback(() => setCurrentDate(new Date()), []);

  return (
    <div className="space-y-6">
      <div className="glass-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4">
        <div>
          <h2 className="text-xl font-bold text-brand-text-primary tracking-tight">{t('calendar.title')}</h2>
          <p className="text-sm text-brand-text-secondary">{t('calendar.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-start md:justify-end w-full md:w-auto">
            <div ref={datePickerRef} className="relative flex items-center bg-brand-surface border border-brand-border-soft p-1 rounded-lg shadow-soft backdrop-blur-md">
              <button onClick={handlePrev} className="p-2 rounded-md hover:bg-brand-surface-light transition-all active:scale-95" aria-label={t('tradesList.previous')}><ChevronLeft size={20} /></button>
              <button onClick={() => setIsDatePickerOpen(prev => !prev)} className="text-base font-semibold w-36 sm:w-40 text-center mx-1 tracking-tight">{format(currentDate, 'MMMM yyyy', { locale })}</button>
              <button onClick={handleNext} className="p-2 rounded-md hover:bg-brand-surface-light transition-all active:scale-95" aria-label={t('tradesList.next')}><ChevronRight size={20} /></button>
              {isDatePickerOpen && (
                <div className="absolute top-full right-0 mt-2 z-30"><DatePicker value={currentDate} onChange={handleDateChange} /></div>
              )}
            </div>
            <button onClick={handleTodayClick} className="px-4 py-2.5 rounded-lg hover:bg-brand-surface-light bg-brand-surface border border-brand-border-soft shadow-soft backdrop-blur-md transition-all active:scale-95 text-sm font-semibold">{t('actions.today')}</button>
        </div>
      </div>
      <MonthlySummaryStats tradesByDay={tradesByDay} currentDate={currentDate} />
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_350px] gap-8 items-start">
        <div>
          <Calendar 
            currentDate={currentDate} 
            tradesByDay={tradesByDay}
            onDayClick={onDayClick} 
            onWeekClick={onWeekClick}
          />
        </div>
        <div className="w-full max-w-sm mx-auto xl:max-w-none xl:mx-0">
          <WeeklySummary tradesByDay={tradesByDay} currentDate={currentDate} />
        </div>
      </div>
    </div>
  );
};

export default React.memo(CalendarView);