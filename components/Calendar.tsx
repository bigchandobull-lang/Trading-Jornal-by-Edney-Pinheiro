import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  isSameDay,
  isSameMonth
} from 'date-fns';
import { ChevronRight, BarChart2 } from 'lucide-react';
import { TradesByDay } from '../types';
import CalendarDay from './CalendarDay';
import { useDateFnsLocale } from '../hooks/useDateFnsLocale';
import { useCurrency } from '../contexts/CurrencyContext';

interface CalendarProps {
  currentDate: Date;
  tradesByDay: Map<string, TradesByDay>;
  onDayClick: (date: Date) => void;
  onWeekClick: (startDate: Date, endDate: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ currentDate, tradesByDay, onDayClick, onWeekClick }) => {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const { formatCurrency } = useCurrency();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { locale });
  const endDate = endOfWeek(monthEnd, { locale });

  const renderHeader = () => {
    const days: string[] = [];
    let day = startDate;
    for (let i = 0; i < 7; i++) {
        days.push(format(day, 'eee', { locale }));
        day = addDays(day, 1);
    }

    return (
      <div className="grid grid-cols-7 text-xs text-center text-brand-text-secondary font-semibold border-b border-brand-border-soft pb-3 mb-2">
        {days.map(day => (
          <div key={day} className="py-1">{day}</div>
        ))}
      </div>
    );
  };

  const renderDesktopCells = () => {
    const rows: React.ReactElement[] = [];
    let weekStartDate = startDate;

    while (weekStartDate <= endDate) {
      const daysInWeek: React.ReactElement[] = [];
      const currentWeekStart = weekStartDate;

      for (let i = 0; i < 7; i++) {
        const day = addDays(currentWeekStart, i);
        const formattedDate = format(day, 'yyyy-MM-dd');
        const summary = tradesByDay.get(formattedDate);
        
        daysInWeek.push(
          <CalendarDay
            key={day.getTime()}
            day={day}
            monthStart={monthStart}
            summary={summary}
            onClick={onDayClick}
          />
        );
      }

      rows.push(
        <div className="relative group" key={currentWeekStart.getTime()}>
          <button 
            onClick={() => onWeekClick(currentWeekStart, endOfWeek(currentWeekStart, { locale }))}
            className="absolute -left-10 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full text-brand-text-secondary bg-brand-surface hover:bg-brand-surface-light shadow-glass opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all hover:scale-110 active:scale-95 border border-brand-border-soft"
            title={t('calendar.viewWeekDetails', { date: format(currentWeekStart, 'MMMM do', { locale }) })}
          >
            <ChevronRight size={18} />
          </button>
          <div className="grid grid-cols-7 gap-1 lg:gap-2">
            {daysInWeek}
          </div>
        </div>
      );

      weekStartDate = addDays(weekStartDate, 7);
    }
    return <div className="flex flex-col gap-1 lg:gap-2">{rows}</div>;
  };

  const renderMobileList = () => {
    const mobileWeeks: React.ReactElement[] = [];
    let weekStartDate = startDate;

    while (weekStartDate <= endDate) {
       const weekEnd = addDays(weekStartDate, 6);
       const currentWeekStart = weekStartDate;
       
       // Only render week if it overlaps with current month
       if (weekEnd < monthStart || weekStartDate > monthEnd) {
           weekStartDate = addDays(weekStartDate, 7);
           continue;
       }

       const daysInWeekNodes = [];
       for(let i=0; i<7; i++) {
           const day = addDays(weekStartDate, i);
           const formattedDate = format(day, 'yyyy-MM-dd');
           const summary = tradesByDay.get(formattedDate);
           const isToday = isSameDay(day, new Date());
           const isCurrentMonth = isSameMonth(day, monthStart);
           
           if (!isCurrentMonth && !summary) continue;

           daysInWeekNodes.push(
              <button 
                key={day.getTime()} 
                onClick={() => onDayClick(day)} 
                className={`w-full p-3 flex justify-between items-center cursor-pointer transition-colors border-b border-brand-border-soft last:border-0 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-accent/50 ${isToday ? 'bg-brand-accent/5' : 'hover:bg-white/5'}`}
              >
                  <div className="flex items-center gap-3">
                      <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg ${isToday ? 'bg-brand-accent text-white shadow-md' : 'bg-brand-surface-light text-brand-text-primary border border-brand-border-soft'}`}>
                          <span className="text-xs font-bold uppercase">{format(day, 'EEE', { locale })}</span>
                          <span className="text-sm font-bold">{format(day, 'd')}</span>
                      </div>
                  </div>
                  <div className="flex-1 text-right">
                       {summary ? (
                          <div>
                               <p className={`text-base font-bold ${summary.totalPnl >= 0 ? 'text-brand-profit' : 'text-brand-loss'}`}>
                                  {formatCurrency(summary.totalPnl)}
                               </p>
                               <div className="flex items-center justify-end gap-1 text-xs text-brand-text-secondary">
                                  <span>{summary.tradeCount} trade{summary.tradeCount !== 1 ? 's' : ''}</span>
                               </div>
                          </div>
                       ) : (
                          <span className="text-xs text-brand-text-tertiary italic">No trades</span>
                       )}
                  </div>
                  <ChevronRight size={16} className="text-brand-text-tertiary ml-2" />
              </button>
           );
       }
       
       mobileWeeks.push(
          <div key={weekStartDate.getTime()} className="mb-4 bg-brand-surface/60 rounded-xl border border-brand-border-soft overflow-hidden shadow-sm backdrop-blur-sm">
              <div className="flex justify-between items-center p-3 bg-brand-surface-light/50 border-b border-brand-border-soft">
                  <span className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider">
                      Week of {format(weekStartDate, 'MMM d', { locale })}
                  </span>
                  <button 
                    onClick={() => onWeekClick(currentWeekStart, weekEnd)} 
                    className="flex items-center gap-1 text-xs font-semibold text-brand-accent hover:text-brand-text-primary transition-colors bg-brand-surface px-2 py-1 rounded-md border border-brand-border-soft shadow-sm"
                  >
                      <BarChart2 size={12} />
                      Weekly Stats
                  </button>
              </div>
              <div>
                  {daysInWeekNodes}
              </div>
          </div>
       );
       
       weekStartDate = addDays(weekStartDate, 7);
    }
    return <div className="space-y-4">{mobileWeeks}</div>;
  };

  return (
    <div className="glass-panel p-2 sm:p-4">
        <div className="hidden md:block">
            {renderHeader()}
            {renderDesktopCells()}
        </div>
        <div className="md:hidden">
            {renderMobileList()}
        </div>
    </div>
  );
};

export default React.memo(Calendar);