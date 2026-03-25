-- Add email column to user_profiles so we don't need auth.admin access
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Backfill existing users' emails from auth.users
UPDATE user_profiles
SET email = auth.users.email
FROM auth.users
WHERE user_profiles.id = auth.users.id
AND user_profiles.email IS NULL;

-- Update the signup trigger to also store email
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, display_name, avatar_color, subscription_tier, trial_end)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        '#' || lpad(to_hex((random() * 16777215)::int), 6, '0'),
        'free',
        NOW() + INTERVAL '7 days'
    )
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
