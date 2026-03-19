-- Add account_id to money_items to link them to specific money_accounts
ALTER TABLE public.money_items 
ADD COLUMN account_id UUID REFERENCES public.money_accounts(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.money_items.account_id IS 'Reference to the account this item belongs to.';
