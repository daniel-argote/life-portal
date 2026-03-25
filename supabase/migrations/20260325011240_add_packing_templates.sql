-- Migration: Add packing templates support
-- We add is_template and template_name to travel_packing to allow creating "blueprints"

ALTER TABLE public.travel_packing 
ADD COLUMN is_template BOOLEAN DEFAULT false,
ADD COLUMN template_name TEXT;

-- Create an index for faster template lookups
CREATE INDEX idx_travel_packing_templates ON public.travel_packing (user_id, is_template) WHERE is_template = true;

-- Update RLS (Policies should already cover these as they use user_id)
-- But let's be explicit if needed. The existing policy:
-- CREATE POLICY "Users can manage their own travel packing" ON public.travel_packing FOR ALL USING (auth.uid() = user_id);
-- Still holds perfectly.
