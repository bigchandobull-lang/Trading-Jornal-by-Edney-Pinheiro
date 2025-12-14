import React from 'react';
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { TradesByDay } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';

interface WeeklySummaryProps {
  tradesByDay: Map<string, TradesByDay>;
  currentDate: Date;
}

interface WeekStats {
  weekNumber: number;
  totalPnl: number;
  tradingDays: number;
}

const WeeklySummary: React.FC<WeeklySummaryProps> = ({ tradesByDay, currentDate }) => {
  const { formatCurrency } = useCurrency();
  const weeklyStats = React.useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const weeks: WeekStats[] = [];
    let currentDayInCalendar = calendarStart;
    let weekCounter = 1;

    while (currentDayInCalendar <= calendarEnd) {
      const weekStart = currentDayInCalendar;
      const weekEnd = addDays(weekStart, 6);
      
      let totalPnl = 0;
      let tradingDays = 0;
      
      let dayInWeek = weekStart;
      let hasDayInMonth = false;
      while (dayInWeek <= weekEnd) {
        if (isSameMonth(dayInWeek, currentDate)) {
          hasDayInMonth = true;
          const dateStr = format(dayInWeek, 'yyyy-MM-dd');
          const daySummary = tradesByDay.get(dateStr);
          if (daySummary) {
            totalPnl += daySummary.totalPnl;
            tradingDays++;
          }
        }
        dayInWeek = addDays(dayInWeek, 1);
      }

      if (hasDayInMonth) {
        weeks.push({
          weekNumber: weekCounter,
          totalPnl,
          tradingDays: tradingDays,
        });
      }

      currentDayInCalendar = addDays(currentDayInCalendar, 7);
      weekCounter++;
    }
    
    return weeks;
  }, [tradesByDay, currentDate]);

  return (
    <div className="bg-brand-surface rounded-2xl p-4 shadow-soft-lg backdrop-blur-lg border border-brand-border">
        <h3 className="font-semibold mb-3 text-brand-text-primary">Weekly Summary</h3>
        <div className="space-y-3">
            {weeklyStats.map((week) => (
            <div 
                key={week.weekNumber} 
                className="bg-brand-surface-light rounded-lg p-3"
            >
                <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-brand-text-secondary">Week {week.weekNumber}</p>
                    <p className="text-xs text-brand-text-secondary">
                        {week.tradingDays} day{week.tradingDays !== 1 ? 's' : ''}
                    </p>
                </div>
                <p className={`text-lg font-bold mt-0.5 ${week.totalPnl >= 0 ? 'text-brand-profit' : 'text-brand-loss'}`}>
                {formatCurrency(week.totalPnl)}
                </p>
            </div>
            ))}
        </div>
    </div>
  );
};

export default React.memo(WeeklySummary);