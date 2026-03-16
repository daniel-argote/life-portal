-- Create recreation_hikes table
CREATE TABLE public.recreation_hikes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    location TEXT,
    distance NUMERIC(5,2), -- miles or km
    elevation_gain INTEGER, -- feet or meters
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    difficulty TEXT DEFAULT 'moderate', -- easy, moderate, hard, strenuous
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create recreation_camping table
CREATE TABLE public.recreation_camping (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    site_name TEXT NOT NULL,
    location TEXT,
    start_date DATE,
    end_date DATE,
    type TEXT DEFAULT 'tent', -- tent, rv, cabin, backcountry
    amenities TEXT[],
    notes TEXT,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.recreation_hikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recreation_camping ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can manage their own hikes" ON public.recreation_hikes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own camping trips" ON public.recreation_camping FOR ALL USING (auth.uid() = user_id);
