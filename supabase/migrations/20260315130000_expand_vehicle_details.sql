-- Add category and style to vehicles for better organization and placeholders
alter table public.vehicles add column if not exists category text default 'car';
alter table public.vehicles add column if not exists style text;
