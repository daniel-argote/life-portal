-- Migration: Remove any overly restrictive unique constraints on travel_packing
-- We want to allow the same item name (e.g., 'Passport') to exist as a template AND as multiple trip instances.

DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.travel_packing'::regclass 
        AND contype = 'u'
    ) LOOP 
        EXECUTE 'ALTER TABLE public.travel_packing DROP CONSTRAINT ' || r.conname;
    END LOOP;
END $$;
