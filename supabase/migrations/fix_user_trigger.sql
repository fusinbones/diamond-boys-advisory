-- Fix: Make the handle_new_user trigger more defensive
-- Run this in Supabase SQL Editor

-- Drop and recreate with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, display_name, avatar_color)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            split_part(COALESCE(NEW.email, 'user'), '@', 1)
        ),
        '#' || lpad(to_hex((random() * 16777215)::int), 6, '0')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't block signup if profile creation fails
        RAISE LOG 'handle_new_user trigger failed for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
