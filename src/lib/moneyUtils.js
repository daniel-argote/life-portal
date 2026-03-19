import { setDate, isAfter, addMonths, subMonths, startOfDay } from 'date-fns';

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
 * Calculates the weekly requirement for an account payoff.
 * Supports 'monthly' (recurring) and 'fixed' (total weeks) modes.
 */
export const calculateWeeklyRequirement = (account, referenceDate = new Date()) => {
    const { payoff_mode, statement_balance, due_day, payoff_weeks, last_statement_amount } = account;
    
    // Use the historical goal for a stable weekly slice calculation
    // Fallback to current balance if historical isn't set yet
    const targetAmount = last_statement_amount > 0 ? last_statement_amount : statement_balance;
    
    if (!targetAmount || targetAmount <= 0) return 0;

    if (payoff_mode === 'fixed') {
        const weeks = Math.max(1, payoff_weeks || 1);
        return targetAmount / weeks;
    }

    // Default to 'monthly'
    if (!due_day) return 0;
    
    const { start, end } = getCycleRange(due_day, referenceDate);
    
    // Calculate TOTAL weeks in the full cycle for a stable divisor
    const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const totalWeeksInCycle = Math.ceil(diffDays / 7);
    
    return targetAmount / totalWeeksInCycle;
};
