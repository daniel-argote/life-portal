import { useState, useRef, useEffect } from 'react';
import { 
    format, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval, 
    isSameMonth, 
    isSameDay, 
    addMonths, 
    subMonths,
    isBefore,
    isAfter,
    startOfDay
} from 'date-fns';
import Icon from './Icon';

const DatePicker = ({ value, onChange, className, minDate, maxDate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(value ? new Date(value.replace(/-/g, '/')) : new Date());
    const containerRef = useRef(null);

    const selectedDate = value ? new Date(value.replace(/-/g, '/')) : null;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const handleDateClick = (day) => {
        if (isDateDisabled(day)) return;
        onChange(format(day, 'yyyy-MM-dd'));
        setIsOpen(false);
    };

    const isDateDisabled = (day) => {
        const d = startOfDay(day);
        if (minDate && isBefore(d, startOfDay(new Date(minDate.replace(/-/g, '/'))))) return true;
        if (maxDate && isAfter(d, startOfDay(new Date(maxDate.replace(/-/g, '/'))))) return true;
        return false;
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-base-100 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary transition-all cursor-pointer flex justify-between items-center"
            >
                <span className={!value ? 'text-slate-600' : 'text-base-content'}>
                    {value ? format(selectedDate, 'PPP') : 'Select Date'}
                </span>
                <Icon name="Calendar" size={18} className="text-slate-600" />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 z-[110] bg-base-200 border border-base-300 rounded-[2rem] shadow-2xl p-6 w-[320px] animate-in zoom-in-95 duration-200">
                    <header className="flex justify-between items-center mb-6">
                        <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-base-300 rounded-full transition-colors text-slate-600">
                            <Icon name="ChevronLeft" size={18} />
                        </button>
                        <h4 className="font-black text-base-content uppercase tracking-widest text-[10px]">
                            {format(currentMonth, 'MMMM yyyy')}
                        </h4>
                        <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-base-300 rounded-full transition-colors text-slate-600">
                            <Icon name="ChevronRight" size={18} />
                        </button>
                    </header>

                    <div className="grid grid-cols-7 mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <div key={i} className="text-center text-[10px] font-black text-slate-600 uppercase">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, idx) => {
                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isToday = isSameDay(day, new Date());
                            const isDisabled = isDateDisabled(day);

                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleDateClick(day)}
                                    disabled={isDisabled}
                                    className={`aspect-square rounded-xl text-xs font-bold transition-all flex items-center justify-center
                                        ${!isCurrentMonth ? 'text-slate-500 opacity-20' : 'text-base-content'}
                                        ${isToday && !isSelected ? 'text-primary border-2 border-primary/20' : ''}
                                        ${isDisabled ? 'opacity-10 cursor-not-allowed grayscale' : ''}
                                        ${isSelected ? 'bg-primary text-primary-content shadow-lg shadow-primary/20 scale-110' : (!isDisabled ? 'hover:bg-base-300' : '')}`}
                                >
                                    {format(day, 'd')}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatePicker;