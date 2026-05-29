-- Seed Money Accounts
-- This script ensures a test user exists and seeds standard test data.

DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- 1. Ensure a test user exists
    SELECT id INTO target_user_id FROM auth.users LIMIT 1;

    IF target_user_id IS NULL THEN
        target_user_id := '00000000-0000-0000-0000-000000000000';
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change) 
        VALUES (target_user_id, 'test@example.com', 'password', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
        RAISE NOTICE 'Created new test user %', target_user_id;
    END IF;

    -- 2. Clear existing money data to ensure a clean state
    DELETE FROM public.money_items WHERE user_id = target_user_id;
    DELETE FROM public.money_weeks WHERE user_id = target_user_id;
    DELETE FROM public.money_accounts WHERE user_id = target_user_id;

    -- 3. Seed Accounts
    INSERT INTO public.money_accounts (user_id, name, balance, account_type, position, custom_icon)
    VALUES 
        (target_user_id, 'Main Checking', 5420.50, 'cash', 0, 'Wallet'),
        (target_user_id, 'Emergency Fund', 12000.00, 'savings', 1, 'ShieldCheck'),
        (target_user_id, 'Travel Savings', 2150.00, 'savings', 2, 'Plane'),
        (target_user_id, 'Primary Credit Card', 0, 'credit', 3, 'CreditCard'),
        (target_user_id, 'Auto Loan', 0, 'loan', 4, 'Car');

    -- 4. Configure Credit/Loan specific fields
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
END $$;
