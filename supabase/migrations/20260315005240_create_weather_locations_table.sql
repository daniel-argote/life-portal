-- Weather Locations Table
create table if not exists public.weather_locations (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  latitude numeric not null,
  longitude numeric not null,
  is_primary boolean default false,
  created_at timestamptz default now()
);

alter table public.weather_locations enable row level security;

drop policy if exists "Users can manage their own weather locations" on public.weather_locations;
create policy "Users can manage their own weather locations" on public.weather_locations
  for all using (auth.uid() = user_id);
