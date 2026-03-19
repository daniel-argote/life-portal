-- Add account_type to money_accounts
ALTER TABLE public.money_accounts 
ADD COLUMN account_type TEXT DEFAULT 'credit' 
CHECK (account_type IN ('credit', 'loan', 'cash', 'savings', 'investment', 'other'));

COMMENT ON COLUMN public.money_accounts.account_type IS 'The category of the account for filtering and UI logic.';
