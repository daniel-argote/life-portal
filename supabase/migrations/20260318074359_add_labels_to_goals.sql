-- Add label_ids to goals table
ALTER TABLE public.goals ADD COLUMN label_ids UUID[] DEFAULT '{}';

-- Create index for performance
CREATE INDEX idx_goals_label_ids ON public.goals USING GIN (label_ids);
