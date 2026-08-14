-- ═══════════════════════════════════════════════════════════════
-- TriplePlayz — Robust Signup Trigger Fix
-- Run this in Supabase SQL Editor to prevent signup failures
-- ═══════════════════════════════════════════════════════════════

-- Make the handle_new_user trigger resilient:
-- 1. ON CONFLICT DO NOTHING prevents duplicate key errors
-- 2. EXCEPTION handler catches any error so signup never fails
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, display_name, avatar_color, subscription_tier, trial_end)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(COALESCE(NEW.email, 'user'), '@', 1)),
        '#' || lpad(to_hex((random() * 16777215)::int), 6, '0'),
        'free',
        NOW() + INTERVAL '7 days'
    )
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log but don't block signup
    RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
