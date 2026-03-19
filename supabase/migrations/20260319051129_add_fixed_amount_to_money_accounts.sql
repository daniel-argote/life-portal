-- Add fixed_amount to money_accounts and update mode constraint
ALTER TABLE public.money_accounts 
ADD COLUMN fixed_amount NUMERIC DEFAULT 0;

-- Update the constraint to allow for clear mode names
ALTER TABLE public.money_accounts
DROP CONSTRAINT IF EXISTS money_accounts_payoff_mode_check;

ALTER TABLE public.money_accounts
ADD CONSTRAINT money_accounts_payoff_mode_check 
CHECK (payoff_mode IN ('monthly', 'fixed', 'fixed_amount'));

COMMENT ON COLUMN public.money_accounts.fixed_amount IS 'A hardcoded weekly amount to pay regardless of cycle or balance math.';
