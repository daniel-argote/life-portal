-- Reading List Table
create table if not exists public.reading_list (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  title text not null,
  author text,
  status text default 'queued', -- queued, reading, finished
  type text default 'book',     -- book, article, other
  rating integer check (rating >= 1 and rating <= 5),
  notes text,
  created_at timestamptz default now()
);

alter table public.reading_list enable row level security;

drop policy if exists "Users can manage their own reading list" on public.reading_list;
create policy "Users can manage their own reading list" on public.reading_list
  for all using (auth.uid() = user_id);
