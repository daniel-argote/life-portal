-- Fix RLS policies to use ALL which covers SELECT, INSERT, UPDATE, DELETE
-- and ensures the user_id matches the authenticated user.

drop policy if exists "Users can manage their own todos" on public.todos;
create policy "Users can manage their own todos" on public.todos
  for all using (auth.uid() = user_id);

drop policy if exists "Users can manage their own health records" on public.health;
create policy "Users can manage their own health records" on public.health
  for all using (auth.uid() = user_id);

drop policy if exists "Users can manage their own calendar events" on public.calendar;
create policy "Users can manage their own calendar events" on public.calendar
  for all using (auth.uid() = user_id);

drop policy if exists "Users can manage their own money accounts" on public.money_accounts;
create policy "Users can manage their own money accounts" on public.money_accounts
  for all using (auth.uid() = user_id);

drop policy if exists "Users can manage their own money weeks" on public.money_weeks;
create policy "Users can manage their own money weeks" on public.money_weeks
  for all using (auth.uid() = user_id);

drop policy if exists "Users can manage their own money items" on public.money_items;
create policy "Users can manage their own money items" on public.money_items
  for all using (auth.uid() = user_id);
