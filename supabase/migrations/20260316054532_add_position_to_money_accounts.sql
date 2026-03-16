-- Add missing position columns to money tables
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='money_accounts' AND column_name='position') THEN
        ALTER TABLE public.money_accounts ADD COLUMN position INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='money_bills' AND column_name='position') THEN
        ALTER TABLE public.money_bills ADD COLUMN position INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='money_weeks' AND column_name='position') THEN
        ALTER TABLE public.money_weeks ADD COLUMN position INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='money_items' AND column_name='position') THEN
        ALTER TABLE public.money_items ADD COLUMN position INTEGER DEFAULT 0;
    END IF;
END $$;
