-- Add hierarchy and preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN feature_hierarchy JSONB,
ADD COLUMN page_names JSONB,
ADD COLUMN portal_config JSONB,
ADD COLUMN dashboard_widgets JSONB;

-- Comment on columns for clarity
COMMENT ON COLUMN public.profiles.feature_hierarchy IS 'The recursive structure of features and their children.';
COMMENT ON COLUMN public.profiles.page_names IS 'User-defined names for each feature ID.';
COMMENT ON COLUMN public.profiles.portal_config IS 'General application settings (showHeaders, autoHideSidebar, etc.).';
COMMENT ON COLUMN public.profiles.dashboard_widgets IS 'The ordered list of widgets on the dashboard.';
