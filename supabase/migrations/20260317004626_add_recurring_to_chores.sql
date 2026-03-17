-- Add is_recurring and status to chores table
ALTER TABLE public.chores ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT TRUE;
ALTER TABLE public.chores ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'; -- 'pending', 'completed' (for one-offs)

-- Update status of existing chores (all were recurring before)
UPDATE public.chores SET status = 'pending' WHERE status IS NULL;
