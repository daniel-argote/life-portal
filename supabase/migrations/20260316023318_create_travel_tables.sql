-- Create travel_trips table
CREATE TABLE public.travel_trips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create travel_days table
CREATE TABLE public.travel_days (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID REFERENCES public.travel_trips ON DELETE CASCADE NOT NULL,
    day_number INTEGER NOT NULL,
    date DATE,
    destination_city TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create travel_bucket_list table
CREATE TABLE public.travel_bucket_list (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    country TEXT,
    priority TEXT DEFAULT 'medium',
    notes TEXT,
    is_visited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create travel_poi table (Points of Interest)
CREATE TABLE public.travel_poi (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    day_id UUID REFERENCES public.travel_days ON DELETE CASCADE,
    bucket_id UUID REFERENCES public.travel_bucket_list ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    category TEXT DEFAULT 'other', -- food, landmark, activity, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT poi_target_check CHECK (
        (day_id IS NOT NULL AND bucket_id IS NULL) OR 
        (day_id IS NULL AND bucket_id IS NOT NULL) OR
        (day_id IS NULL AND bucket_id IS NULL)
    )
);

-- Create travel_packing table
CREATE TABLE public.travel_packing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    trip_id UUID REFERENCES public.travel_trips ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    is_packed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.travel_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_bucket_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_poi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_packing ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can manage their own trips" ON public.travel_trips FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own travel days" ON public.travel_days FOR ALL USING (
    EXISTS (SELECT 1 FROM public.travel_trips WHERE id = travel_days.trip_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage their own bucket list" ON public.travel_bucket_list FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own POIs" ON public.travel_poi FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own travel packing" ON public.travel_packing FOR ALL USING (auth.uid() = user_id);
