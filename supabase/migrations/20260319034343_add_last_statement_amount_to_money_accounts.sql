-- Add last_statement_amount to track the previous goal before subtraction
ALTER TABLE public.money_accounts 
ADD COLUMN last_statement_amount NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.money_accounts.last_statement_amount IS 'The original statement balance before weekly payments were subtracted. Used for Cycle Reset logic.';
