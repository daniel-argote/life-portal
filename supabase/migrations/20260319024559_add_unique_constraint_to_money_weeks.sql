-- Ensure users cannot have duplicate weeks starting on the same date
ALTER TABLE public.money_weeks
ADD CONSTRAINT money_weeks_user_id_start_date_key UNIQUE (user_id, start_date);
