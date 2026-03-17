-- Add completed_at column to todos and goals tables
alter table public.todos add column if not exists completed_at timestamptz;
alter table public.goals add column if not exists completed_at timestamptz;

-- Function to set completed_at on status change
create or replace function public.handle_completed_at()
returns trigger as $$
begin
    if TG_TABLE_NAME = 'todos' then
        if NEW.status = 'done' and (OLD.status is null or OLD.status != 'done') then
            NEW.completed_at = now();
        elsif NEW.status != 'done' and OLD.status = 'done' then
            NEW.completed_at = null;
        end if;
    end if;

    if TG_TABLE_NAME = 'goals' then
        if NEW.status = 'achieved' and (OLD.status is null or OLD.status != 'achieved') then
            NEW.completed_at = now();
        elsif NEW.status != 'achieved' and OLD.status = 'achieved' then
            NEW.completed_at = null;
        end if;
    end if;

    return NEW;
end;
$$ language plpgsql;

-- Triggers for automatic completed_at
drop trigger if exists tr_todos_completed_at on public.todos;
create trigger tr_todos_completed_at
before update on public.todos
for each row execute function public.handle_completed_at();

drop trigger if exists tr_goals_completed_at on public.goals;
create trigger tr_goals_completed_at
before update on public.goals
for each row execute function public.handle_completed_at();
