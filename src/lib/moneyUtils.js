import { setDate, isAfter, addMonths } from 'date-fns';

/**
 * Calculates the weekly requirement for an account payoff.
 * Supports 'monthly' (recurring) and 'fixed' (total weeks) modes.
 */
export const calculateWeeklyRequirement = (account) => {
    const { payoff_mode, statement_balance, due_day, payoff_weeks } = account;
    
    if (!statement_balance || statement_balance <= 0) return 0;

    if (payoff_mode === 'fixed') {
        const weeks = Math.max(1, payoff_weeks || 1);
        return statement_balance / weeks;
    }

    // Default to 'monthly'
    if (!due_day) return 0;
    
    const today = new Date();
    let targetDate = setDate(new Date(), due_day);
    
    if (!isAfter(targetDate, today)) {
        targetDate = addMonths(targetDate, 1);
    }
    
    const diffDays = Math.max(1, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const weeks = Math.ceil(diffDays / 7);
    
    return statement_balance / weeks;
};
