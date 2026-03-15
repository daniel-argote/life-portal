-- Add dashboard_widgets to profiles table
-- Column was already added in 20260315220449, just keeping this file to maintain migration sequence
COMMENT ON COLUMN public.profiles.dashboard_widgets IS 'The ordered list of widgets on the dashboard.';
