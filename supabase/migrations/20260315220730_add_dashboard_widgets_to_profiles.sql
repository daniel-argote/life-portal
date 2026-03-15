-- Add dashboard_widgets to profiles table
ALTER TABLE public.profiles 
ADD COLUMN dashboard_widgets JSONB;

COMMENT ON COLUMN public.profiles.dashboard_widgets IS 'The ordered list of widgets on the dashboard.';
