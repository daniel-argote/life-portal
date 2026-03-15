-- Upgrade recipes table to use structured data
-- First drop existing columns to clear any string data that won't cast to jsonb directly
alter table public.recipes drop column if exists ingredients;
alter table public.recipes drop column if exists instructions;

-- Re-add as jsonb
alter table public.recipes 
  add column ingredients jsonb default '[]'::jsonb,
  add column instructions jsonb default '[]'::jsonb;
