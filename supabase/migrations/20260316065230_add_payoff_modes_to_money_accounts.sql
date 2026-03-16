-- Add payoff_mode and payoff_weeks to money_accounts
ALTER TABLE public.money_accounts 
ADD COLUMN payoff_mode TEXT DEFAULT 'monthly' CHECK (payoff_mode IN ('monthly', 'fixed')),
ADD COLUMN payoff_weeks INTEGER DEFAULT 1;

COMMENT ON COLUMN public.money_accounts.payoff_mode IS 'The strategy for calculating weekly requirements: monthly recurring or fixed-term payoff.';
COMMENT ON COLUMN public.money_accounts.payoff_weeks IS 'The number of weeks to divide the balance by if mode is fixed.';
