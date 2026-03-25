-- Migration: Add category to bucket list items
ALTER TABLE public.travel_bucket_list ADD COLUMN category TEXT DEFAULT 'dream'; -- 'dream', 'attainable', 'local', etc.
