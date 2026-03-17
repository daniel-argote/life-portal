-- Food Top Lists
CREATE TABLE public.food_top_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    category_name TEXT NOT NULL, -- "Reubens", "Burgers", "Pho"
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Food Top List Items
CREATE TABLE public.food_top_list_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    list_id UUID REFERENCES public.food_top_lists ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    restaurant_name TEXT NOT NULL,
    dish_name TEXT, -- The specific dish they had
    location_name TEXT, -- Address or neighborhood
    lat NUMERIC,
    lng NUMERIC,
    photo_url TEXT,
    
    -- Ratings (1-10 or 1-5, let's go with 1-10 for more granularity)
    rating_flavor INTEGER CHECK (rating_flavor >= 0 AND rating_flavor <= 10),
    rating_value INTEGER CHECK (rating_value >= 0 AND rating_value <= 10),
    rating_vibe INTEGER CHECK (rating_vibe >= 0 AND rating_vibe <= 10),
    
    price_point INTEGER CHECK (price_point >= 1 AND price_point <= 4), -- $ to $$$$
    must_try_other_dishes TEXT, -- "The fries are also killer"
    review_notes TEXT,
    visited_at DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.food_top_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_top_list_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own top lists" ON public.food_top_lists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own top list items" ON public.food_top_list_items FOR ALL USING (auth.uid() = user_id);
