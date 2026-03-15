-- Add theme and style to profiles table
ALTER TABLE public.profiles 
ADD COLUMN theme TEXT DEFAULT 'light',
ADD COLUMN style TEXT DEFAULT 'default';

COMMENT ON COLUMN public.profiles.theme IS 'The user''s dark/light mode preference.';
COMMENT ON COLUMN public.profiles.style IS 'The user''s visual theme preference (nautical, forest, etc.).';
