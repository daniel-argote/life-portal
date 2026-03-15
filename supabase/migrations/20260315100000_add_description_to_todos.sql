-- Add description to todos for extra details
alter table public.todos add column if not exists description text;
