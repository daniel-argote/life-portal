-- Goals Table
create table if not exists public.goals (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  title text not null,
  description text,
  target_date date,
  status text default 'active', -- active, achieved, paused
  created_at timestamptz default now()
);

alter table public.goals enable row level security;
drop policy if exists "Users can manage their own goals" on public.goals;
create policy "Users can manage their own goals" on public.goals
  for all using (auth.uid() = user_id);

-- Health Appointments Table
create table if not exists public.health_appointments (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  provider text not null,
  type text,
  date date not null,
  time time,
  notes text,
  created_at timestamptz default now()
);

alter table public.health_appointments enable row level security;
drop policy if exists "Users can manage their own appointments" on public.health_appointments;
create policy "Users can manage their own appointments" on public.health_appointments
  for all using (auth.uid() = user_id);
