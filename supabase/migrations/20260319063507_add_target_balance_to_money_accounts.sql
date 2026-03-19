-- Add target_balance to money_accounts for savings goals
ALTER TABLE public.money_accounts 
ADD COLUMN target_balance NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.money_accounts.target_balance IS 'The goal balance for assets or the payoff target for liabilities.';
