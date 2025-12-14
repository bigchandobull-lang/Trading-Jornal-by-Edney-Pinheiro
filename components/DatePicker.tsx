import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDateFnsLocale } from '../hooks/useDateFnsLocale';

interface DatePickerProps {
    value: Date;
    onChange: (date: Date) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange }) => {
    const { t } = useTranslation();
    const [displayDate, setDisplayDate] = useState(value || new Date());
    const locale = useDateFnsLocale();

    const handleDateSelect = (day: Date) => {
        onChange(day);
    };

    const handlePrevMonth = () => {
        setDisplayDate(prev => subMonths(prev, 1));
    };

    const handleNextMonth = () => {
        setDisplayDate(prev => addMonths(prev, 1));
    };

    const handleTodayClick = () => {
        const today = new Date();
        setDisplayDate(today);
        onChange(today);
    };

    const renderHeader = () => (
        <div className="flex justify-between items-center px-2 pt-2">
            <button onClick={handlePrevMonth} className="p-1.5 rounded-md hover:bg-brand-surface-light transition-all active:scale-95" aria-label={t('datepicker.prevMonth')}>
                <ChevronLeft size={18} />
            </button>
            <span className="font-semibold text-sm">{format(displayDate, 'MMMM yyyy', { locale })}</span>
            <button onClick={handleNextMonth} className="p-1.5 rounded-md hover:bg-brand-surface-light transition-all active:scale-95" aria-label={t('datepicker.nextMonth')}>
                <ChevronRight size={18} />
            </button>
        </div>
    );

    const renderDaysOfWeek = () => {
        const days: string[] = [];
        const start = startOfWeek(displayDate, { locale });
        for(let i = 0; i < 7; i++) {
            days.push(format(addDays(start, i), 'EE', { locale }));
        }

        return (
            <div className="grid grid-cols-7 text-xs text-center text-brand-text-secondary font-medium mt-2">
                {days.map((day, i) => <div key={i} className="py-1">{day}</div>)}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(displayDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { locale });
        const endDate = endOfWeek(monthEnd, { locale });

        const cells: React.ReactElement[] = [];
        let day = startDate;

        while (day <= endDate) {
            const cloneDay = day;
            const isSelected = isSameDay(day, value);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, displayDate);

            cells.push(
                 <div key={day.getTime()} className="flex justify-center items-center p-0.5">
                    <button
                        type="button"
                        onClick={() => handleDateSelect(cloneDay)}
                        className={`w-9 h-9 flex items-center justify-center rounded-full text-sm transition-all duration-200 active:scale-95
                            ${!isCurrentMonth ? 'text-brand-text-secondary/40 hover:bg-brand-surface-light' : 'text-brand-text-primary'}
                            ${isCurrentMonth ? 'hover:bg-brand-surface-light' : ''}
                            ${isSelected ? 'bg-brand-accent text-white font-semibold shadow-md hover:bg-brand-accent/90' : ''}
                            ${!isSelected && isToday ? 'border border-brand-accent/50' : ''}
                        `}
                    >
                        {format(day, 'd')}
                    </button>
                </div>
            );
            day = addDays(day, 1);
        }
        return <div className="grid grid-cols-7 gap-y-1 p-1">{cells}</div>;
    };

    return (
        <div className="rounded-2xl p-[1px] bg-gradient-to-br from-white/30 to-white/10 dark:from-white/10 dark:to-white/5 shadow-soft-lg animate-scale-in w-72">
            <div className="bg-brand-surface-opaque rounded-[15px] overflow-hidden backdrop-blur-xl shadow-glass p-2">
                {renderHeader()}
                {renderDaysOfWeek()}
                {renderCells()}
                <div className="pt-2 mt-1 border-t border-brand-border-soft">
                    <button onClick={handleTodayClick} className="w-full text-center text-sm font-semibold py-1.5 rounded-md hover:bg-brand-surface-light transition-all active:scale-95">
                        {t('actions.today')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(DatePicker);
