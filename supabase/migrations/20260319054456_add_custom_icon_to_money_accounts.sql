-- Add custom_icon to money_accounts
ALTER TABLE public.money_accounts 
ADD COLUMN custom_icon TEXT;

COMMENT ON COLUMN public.money_accounts.custom_icon IS 'A custom icon name (Lucide) chosen by the user for this account.';
