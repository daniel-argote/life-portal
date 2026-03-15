-- 1. Character length constraints for text fields
ALTER TABLE public.todos ADD CONSTRAINT task_length_check CHECK (char_length(task) <= 500);
ALTER TABLE public.todos ADD CONSTRAINT description_length_check CHECK (char_length(description) <= 2000);

-- 2. Row count limit per user (e.g., max 1000 todos)
CREATE OR REPLACE FUNCTION public.enforce_todo_row_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT count(*) FROM public.todos WHERE user_id = NEW.user_id) >= 1000 THEN
        RAISE EXCEPTION 'Maximum limit of 1000 objectives reached per user.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_enforce_todo_row_limit
BEFORE INSERT ON public.todos
FOR EACH ROW
EXECUTE FUNCTION public.enforce_todo_row_limit();
