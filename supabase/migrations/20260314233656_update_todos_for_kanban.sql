-- Add Kanban and Calendar fields to todos
alter table public.todos add column if not exists due_date date;
alter table public.todos add column if not exists status text default 'todo';
alter table public.todos add column if not exists position integer default 0;

-- Migrate existing data
update public.todos set status = 'done' where is_complete = true;
update public.todos set status = 'todo' where is_complete = false or is_complete is null;

-- We can drop is_complete later if we want, but for now we'll keep it for compatibility if needed.
