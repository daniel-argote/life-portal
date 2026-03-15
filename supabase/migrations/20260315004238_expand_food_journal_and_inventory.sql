-- Add home-cooked flag to food journal
alter table public.food add column if not exists is_home_cooked boolean default false;

-- Create Food Inventory table
create table if not exists public.food_inventory (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  item_name text not null,
  quantity text,
  unit text,
  category text, -- Produce, Dairy, Meat, Pantry, Freezer, etc.
  expiry_date date,
  created_at timestamptz default now()
);

alter table public.food_inventory enable row level security;

drop policy if exists "Users can manage their own food inventory" on public.food_inventory;
create policy "Users can manage their own food inventory" on public.food_inventory
  for all using (auth.uid() = user_id);
