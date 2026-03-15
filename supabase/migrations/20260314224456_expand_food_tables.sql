-- Recipes Table
create table if not exists public.recipes (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  title text not null,
  ingredients text,
  instructions text,
  created_at timestamptz default now()
);

alter table public.recipes enable row level security;
drop policy if exists "Users can manage their own recipes" on public.recipes;
create policy "Users can manage their own recipes" on public.recipes
  for all using (auth.uid() = user_id);

-- Meal Plan Table
create table if not exists public.meal_plan (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  day_date date not null,
  meal_type text, -- Breakfast, Lunch, Dinner, Snack
  recipe_id uuid references public.recipes(id) on delete set null,
  note text,
  created_at timestamptz default now()
);

alter table public.meal_plan enable row level security;
drop policy if exists "Users can manage their own meal plan" on public.meal_plan;
create policy "Users can manage their own meal plan" on public.meal_plan
  for all using (auth.uid() = user_id);
