-- Create a table for tracking bills
create table if not exists public.money_bills (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  amount numeric not null,
  due_date date not null,
  is_paid boolean default false,
  created_at timestamptz default now()
);

alter table public.money_bills enable row level security;

drop policy if exists "Users can manage their own bills" on public.money_bills;
create policy "Users can manage their own bills" on public.money_bills
  for all using (auth.uid() = user_id);
