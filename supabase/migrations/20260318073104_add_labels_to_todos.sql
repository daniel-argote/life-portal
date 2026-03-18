-- Create todo_labels table
CREATE TABLE public.todo_labels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1', -- Indigo default
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.todo_labels ENABLE ROW LEVEL SECURITY;

-- Policies for todo_labels
CREATE POLICY "Users can manage their own labels" ON public.todo_labels
    FOR ALL USING (auth.uid() = user_id);

-- Add label_ids to todos table
ALTER TABLE public.todos ADD COLUMN label_ids UUID[] DEFAULT '{}';

-- Create index for performance
CREATE INDEX idx_todos_label_ids ON public.todos USING GIN (label_ids);
