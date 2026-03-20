-- Seed Money Accounts
-- This assumes you have at least one user in auth.users
-- We use a subquery to find the first user ID to ensure it works on any local setup

DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Get the first user from auth.users
    SELECT id INTO target_user_id FROM auth.users LIMIT 1;

    IF target_user_id IS NOT NULL THEN
        -- Clear existing accounts to avoid duplicates if re-running seed
        DELETE FROM public.money_accounts WHERE user_id = target_user_id;

        INSERT INTO public.money_accounts (user_id, name, balance, account_type, position, custom_icon)
        VALUES 
            (target_user_id, 'Main Checking', 5420.50, 'cash', 0, 'Wallet'),
            (target_user_id, 'Emergency Fund', 12000.00, 'savings', 1, 'ShieldCheck'),
            (target_user_id, 'Travel Savings', 2150.00, 'savings', 2, 'Plane'),
            (target_user_id, 'Primary Credit Card', 0, 'credit', 3, 'CreditCard'),
            (target_user_id, 'Auto Loan', 0, 'loan', 4, 'Car');

        -- Update the credit/loan specific fields
        UPDATE public.money_accounts SET 
            statement_balance = 1250.40, 
            due_day = 15, 
            payoff_mode = 'monthly',
            last_statement_amount = 1250.40
        WHERE name = 'Primary Credit Card' AND user_id = target_user_id;

        UPDATE public.money_accounts SET 
            statement_balance = 18500.00, 
            due_day = 5, 
            payoff_mode = 'fixed', 
            payoff_weeks = 48
        WHERE name = 'Auto Loan' AND user_id = target_user_id;
        
        UPDATE public.money_accounts SET
            target_balance = 5000.00
        WHERE name = 'Travel Savings' AND user_id = target_user_id;

        RAISE NOTICE 'Seeded money_accounts for user %', target_user_id;
    ELSE
        RAISE WARNING 'No user found in auth.users. Please sign up in the app first, then run seed.';
    END IF;
END $$;
