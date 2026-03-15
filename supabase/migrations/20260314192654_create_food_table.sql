-- Create a table for food logs
create table if not exists public.food (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  meal text,
  content text,
  calories integer,
  created_at timestamptz default now()
);

alter table public.food enable row level security;

drop policy if exists "Users can manage their own food records" on public.food;
create policy "Users can manage their own food records" on public.food
  for all using (auth.uid() = user_id);
