import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { addMonths, addWeeks, addYears, endOfWeek, format, startOfWeek, subMonths, subWeeks, subYears } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DatePicker from './DatePicker';
import Dashboard from './Dashboard';
import { Trade } from '../types';
import { Timeframe, ActiveTab } from '../App';
import { useDateFnsLocale } from '../hooks/useDateFnsLocale';

interface DashboardViewProps {
  trades: Trade[];
  pnlGoal: number;
  setPnlGoal: (goal: number) => void;
  lastAddedTradeId?: string | null;
  onDayClick: (date: Date) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ trades, pnlGoal, setPnlGoal, lastAddedTradeId, onDayClick, setActiveTab }) => {
  const { t } = useTranslation();
  const timeframes: { key: Timeframe, label: string }[] = [
      { key: 'week', label: t('timeframes.week') },
      { key: 'month', label: t('timeframes.month') },
      { key: 'year', label: t('timeframes.year') }
  ];

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>('month');
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

  const handleNext = useCallback(() => {
    switch(timeframe) {
        case 'week': setCurrentDate(current => addWeeks(current, 1)); break;
        case 'year': setCurrentDate(current => addYears(current, 1)); break;
        default: setCurrentDate(current => addMonths(current, 1)); break;
    }
  }, [timeframe]);

  const handlePrev = useCallback(() => {
     switch(timeframe) {
        case 'week': setCurrentDate(current => subWeeks(current, 1)); break;
        case 'year': setCurrentDate(current => subYears(current, 1)); break;
        default: setCurrentDate(current => subMonths(current, 1)); break;
    }
  }, [timeframe]);

  const handleDateChange = useCallback((date: Date) => {
    if (date) { setCurrentDate(date); }
    setIsDatePickerOpen(false);
  }, []);
  
  const handleTodayClick = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const formatDateHeader = useMemo(() => {
    switch (timeframe) {
      case 'week':
        const weekStart = startOfWeek(currentDate, { locale });
        return `${format(weekStart, 'MMM d', { locale })} - ${format(endOfWeek(currentDate, { locale }), 'd, yyyy', { locale })}`;
      case 'year': return format(currentDate, 'yyyy', { locale });
      default: return format(currentDate, 'MMMM yyyy', { locale });
    }
  }, [currentDate, timeframe, locale]);

  return (
    <div className="space-y-6">
        <div className="relative z-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-brand-surface/50 rounded-2xl border border-brand-border-soft backdrop-blur-lg">
            <div>
                <h2 className="text-xl font-bold text-brand-text-primary tracking-tight">{t('dashboard.title')}</h2>
                <p className="text-sm text-brand-text-secondary">{t('dashboard.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-start md:justify-end w-full md:w-auto">
                <div className="flex items-center bg-brand-surface border border-brand-border-soft p-1 rounded-lg shadow-soft backdrop-blur-md">
                    {timeframes.map(item => (
                        <button
                          key={item.key}
                          onClick={() => setTimeframe(item.key)}
                          className={`px-3 sm:px-4 py-1.5 text-sm font-semibold rounded-md transition-all active:scale-95 ${timeframe === item.key 
                            ? 'bg-brand-surface-opaque shadow-sm text-brand-text-primary' 
                            : 'text-brand-text-secondary hover:text-brand-text-primary'}`}
                        >
                          {item.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <div ref={datePickerRef} className="relative flex items-center bg-brand-surface border border-brand-border-soft p-1 rounded-lg shadow-soft backdrop-blur-md">
                      <button onClick={handlePrev} className="p-2 rounded-md hover:bg-brand-surface-light transition-all active:scale-95" aria-label={t('tradesList.previous')}><ChevronLeft size={20} /></button>
                      <button onClick={() => setIsDatePickerOpen(prev => !prev)} className="text-base font-semibold w-36 sm:w-44 text-center mx-1 tracking-tight">{formatDateHeader}</button>
                      <button onClick={handleNext} className="p-2 rounded-md hover:bg-brand-surface-light transition-all active:scale-95" aria-label={t('tradesList.next')}><ChevronRight size={20} /></button>
                      {isDatePickerOpen && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-30"><DatePicker value={currentDate} onChange={handleDateChange} /></div>
                      )}
                    </div>
                    <button onClick={handleTodayClick} className="px-4 py-2.5 rounded-lg hover:bg-brand-surface-light bg-brand-surface border border-brand-border-soft shadow-soft backdrop-blur-md transition-all active:scale-95 text-sm font-semibold">{t('actions.today')}</button>
                </div>
            </div>
        </div>
        <Dashboard 
          trades={trades} 
          currentDate={currentDate} 
          timeframe={timeframe} 
          pnlGoal={pnlGoal}
          setPnlGoal={setPnlGoal}
          lastAddedTradeId={lastAddedTradeId}
          onDayClick={onDayClick}
          setCurrentDate={setCurrentDate}
          setActiveTab={setActiveTab}
        />
    </div>
  );
};

export default React.memo(DashboardView);