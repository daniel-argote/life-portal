import { setDate, isAfter, addMonths, subMonths, startOfDay, addDays, getDay } from 'date-fns';

/**
 * Returns the start and end dates of the monthly cycle for a given due day and reference date.
 */
export const getCycleRange = (dueDay, referenceDate = new Date()) => {
    const today = startOfDay(new Date(referenceDate));
    let nextTarget = setDate(new Date(today), dueDay);
    
    if (!isAfter(nextTarget, today)) {
        nextTarget = addMonths(nextTarget, 1);
    }
    
    const prevTarget = subMonths(nextTarget, 1);
    return { start: prevTarget, end: nextTarget };
};

/**
 * Counts how many financial week starts (e.g. Sundays) occur between two dates.
 */
export const countFinancialWeeks = (startDate, endDate, weekStartDay = 0) => {
    let count = 0;
    let current = startOfDay(new Date(startDate));
    const targetEnd = startOfDay(new Date(endDate));

    // If we are starting on a week start day, count it as the first opportunity
    while (current < targetEnd) {
        if (getDay(current) === weekStartDay) {
            count++;
        }
        current = addDays(current, 1);
    }
    
    return Math.max(1, count);
};

/**
 * Calculates the weekly requirement for an account payoff.
 */
export const calculateWeeklyRequirement = (account, referenceDate = new Date(), weekStartDay = 0) => {
    const { payoff_mode, statement_balance, due_day, payoff_weeks, fixed_amount } = account;
    
    if (payoff_mode === 'fixed_amount') {
        return fixed_amount || 0;
    }

    if (!statement_balance || statement_balance <= 0) return 0;

    if (payoff_mode === 'fixed') {
        const weeks = Math.max(1, payoff_weeks || 1);
        return statement_balance / weeks;
    }

    if (!due_day) return 0;
    
    const { end } = getCycleRange(due_day, referenceDate);
    const weeksLeft = countFinancialWeeks(referenceDate, end, weekStartDay);
    
    return statement_balance / weeksLeft;
};
