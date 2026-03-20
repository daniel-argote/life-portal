-- Migration: Create Fitness Tables (Weight Training & Cardio)
-- Description: Adds tables for workout templates, strength tracking, and cardio logging.

-- 1. Exercise Library / Stats
CREATE TABLE IF NOT EXISTS public.health_exercises (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    muscle_group text,
    best_weight numeric DEFAULT 0,
    best_reps int DEFAULT 0,
    best_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Workout Templates
CREATE TABLE IF NOT EXISTS public.health_workouts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Workout Template Items
CREATE TABLE IF NOT EXISTS public.health_workout_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    workout_id uuid NOT NULL REFERENCES public.health_workouts(id) ON DELETE CASCADE,
    exercise_name text NOT NULL,
    prescribed_sets int DEFAULT 3,
    prescribed_reps int DEFAULT 10,
    prescribed_weight numeric,
    target_rpe int, -- Rate of Perceived Exertion (1-10)
    rest_period text, -- e.g., '90s'
    template_type text DEFAULT 'standard' CHECK (template_type IN ('standard', 'superset')),
    group_id uuid, -- For grouping supersets
    position int DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. Workout Session Logs
CREATE TABLE IF NOT EXISTS public.health_workout_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_id uuid REFERENCES public.health_workouts(id) ON DELETE SET NULL,
    completed_at timestamp with time zone DEFAULT now(),
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- 5. Individual Log Entries
CREATE TABLE IF NOT EXISTS public.health_workout_log_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    log_id uuid NOT NULL REFERENCES public.health_workout_logs(id) ON DELETE CASCADE,
    exercise_name text NOT NULL,
    sets_completed int,
    reps_completed int,
    weight_used numeric,
    rpe_achieved int, -- User-reported intensity
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- 6. Cardio Logs
CREATE TABLE IF NOT EXISTS public.health_cardio_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type text NOT NULL, -- Run, Bike, Hike, etc.
    duration_minutes int NOT NULL,
    distance_km numeric,
    limiting_factor text CHECK (limiting_factor IN ('musculoskeletal', 'cardio', 'pulmonary')),
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_workout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_workout_log_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_cardio_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own exercises" ON public.health_exercises
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own workouts" ON public.health_workouts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage items for their workouts" ON public.health_workout_items
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.health_workouts 
        WHERE id = workout_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their own workout logs" ON public.health_workout_logs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage items for their workout logs" ON public.health_workout_log_items
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.health_workout_logs 
        WHERE id = log_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their own cardio logs" ON public.health_cardio_logs
    FOR ALL USING (auth.uid() = user_id);

-- Helper to track position
COMMENT ON COLUMN public.health_workout_items.group_id IS 'UUID used to link exercises in a superset together visually.';
COMMENT ON COLUMN public.health_cardio_logs.limiting_factor IS 'The primary biological constraint encountered during the session.';
