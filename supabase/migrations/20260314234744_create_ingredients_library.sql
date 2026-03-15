-- Ingredient Library for autocomplete
create table if not exists public.ingredients_library (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  last_unit text,
  created_at timestamptz default now(),
  unique(user_id, name)
);

alter table public.ingredients_library enable row level security;

drop policy if exists "Users can manage their own ingredients library" on public.ingredients_library;
create policy "Users can manage their own ingredients library" on public.ingredients_library
  for all using (auth.uid() = user_id);
