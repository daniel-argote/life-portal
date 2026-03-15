-- Vehicles Table
create table if not exists public.vehicles (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  vin text,
  make text,
  model text,
  year integer,
  created_at timestamptz default now()
);

alter table public.vehicles enable row level security;
drop policy if exists "Users can manage their own vehicles" on public.vehicles;
create policy "Users can manage their own vehicles" on public.vehicles
  for all using (auth.uid() = user_id);

-- Vehicle Records Table
create table if not exists public.vehicle_records (
  id uuid not null primary key default gen_random_uuid(),
  vehicle_id uuid references public.vehicles(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  date date not null,
  odometer integer,
  type text default 'Maintenance', -- Maintenance, Repair, Upgrade, Other
  description text,
  cost numeric,
  created_at timestamptz default now()
);

alter table public.vehicle_records enable row level security;
drop policy if exists "Users can manage their own vehicle records" on public.vehicle_records;
create policy "Users can manage their own vehicle records" on public.vehicle_records
  for all using (auth.uid() = user_id);
