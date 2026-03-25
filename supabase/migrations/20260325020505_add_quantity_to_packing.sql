-- Migration: Add quantity to packing items
ALTER TABLE public.travel_packing ADD COLUMN quantity INTEGER DEFAULT 1;
