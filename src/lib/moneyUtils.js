import { setDate, isAfter, addMonths, subMonths, startOfDay, addDays, getDay, subDays } from 'date-fns';

/**
 * Returns the start and end dates of the monthly cycle for a given due day and reference date.
 */
export const getCycleRange = (dueDay, referenceDate = new Date()) => {
    const today = startOfDay(new Date(referenceDate));
    let nextTarget = setDate(new Date(today), dueDay);

    // If the due date for this reference month has passed, look at next month
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

    while (current < targetEnd) {
        if (getDay(current) === weekStartDay) {
            count++;
        }
        current = addDays(current, 1);
    }

    return Math.max(1, count);
};

/**
 * Calculates the weekly requirement for an account payoff or savings goal.
 */
export const calculateWeeklyRequirement = (account, referenceDate = new Date(), weekStartDay = 0) => {
    const { payoff_mode, statement_balance, due_day, payoff_weeks, fixed_amount, account_type, balance, target_balance } = account;
    const isAsset = ['cash', 'savings', 'investment'].includes(account_type);

    if (payoff_mode === 'fixed_amount') {
        return fixed_amount || 0;
    }

    // Math for Savings Goals (Assets)
    if (isAsset) {
        if (!target_balance || target_balance <= balance) return 0;

        if (payoff_mode === 'fixed') {
            const weeks = Math.max(1, payoff_weeks || 1);
            return (target_balance - balance) / weeks;
        }

        // Monthly assets target the next occurrence of 'due_day' as a milestone
        if (!due_day) return 0;
        const { end } = getCycleRange(due_day, referenceDate);
        const weeksLeft = countFinancialWeeks(referenceDate, end, weekStartDay);
        return Math.max(0, target_balance - balance) / weeksLeft;
    }

    // Math for Liabilities
    if (!statement_balance || statement_balance <= 0) return 0;

    if (payoff_mode === 'fixed') {
        const weeks = Math.max(1, payoff_weeks || 1);
        return statement_balance / weeks;
    }

    if (!due_day) return 0;

    let anchoredStart = startOfDay(new Date(referenceDate));
    while (getDay(anchoredStart) !== weekStartDay) {
        anchoredStart = subDays(anchoredStart, 1);
    }

    const { end } = getCycleRange(due_day, anchoredStart);
    const weeksLeft = countFinancialWeeks(anchoredStart, end, weekStartDay);

    return statement_balance / weeksLeft;
};

/**
 * Estimates when a goal will be reached or a debt paid off.
 */
export const estimateCompletionDate = (account, weeklyAmount, referenceDate = new Date(), weekStartDay = 0) => {
    if (!weeklyAmount || weeklyAmount <= 0) return null;

    const { account_type, balance, target_balance, statement_balance } = account;
    const isAsset = ['cash', 'savings', 'investment'].includes(account_type);

    const amountRemaining = isAsset 
        ? Math.max(0, (target_balance || 0) - (balance || 0))
        : (statement_balance || 0);

    if (amountRemaining <= 0) return null;

    const weeksNeeded = Math.ceil(amountRemaining / weeklyAmount);

    // Find the current week start
    let current = startOfDay(new Date(referenceDate));
    while (getDay(current) !== weekStartDay) {
        current = subDays(current, 1);
    }

    // Add the number of weeks
    return addDays(current, weeksNeeded * 7);
};
