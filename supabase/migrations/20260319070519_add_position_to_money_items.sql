-- Add position to money_items for deterministic sorting
ALTER TABLE public.money_items 
ADD COLUMN position INTEGER DEFAULT 0;

COMMENT ON COLUMN public.money_items.position IS 'Controls the display order of items in the weekly ledger.';
