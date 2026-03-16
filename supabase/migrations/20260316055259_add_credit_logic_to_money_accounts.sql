-- Add credit account logic to money_accounts
ALTER TABLE public.money_accounts 
ADD COLUMN due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31),
ADD COLUMN statement_balance NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.money_accounts.due_day IS 'The day of the month the payment is due.';
COMMENT ON COLUMN public.money_accounts.statement_balance IS 'The amount due by the next due date.';
