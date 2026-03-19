-- Add deleted_at to money_accounts for soft-delete/undo support
ALTER TABLE public.money_accounts 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.money_accounts.deleted_at IS 'Timestamp when the account was soft-deleted. NULL means active.';
