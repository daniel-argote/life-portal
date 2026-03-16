-- Create chores table
CREATE TABLE public.chores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    frequency TEXT NOT NULL DEFAULT 'weekly', -- 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'
    last_completed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create chore history log for tracking completions over time
CREATE TABLE public.chore_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    chore_id UUID REFERENCES public.chores ON DELETE CASCADE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chore_history ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can manage their own chores" ON public.chores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own chore history" ON public.chore_history FOR ALL USING (auth.uid() = user_id);
