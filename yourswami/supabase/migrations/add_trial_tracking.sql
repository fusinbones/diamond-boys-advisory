-- ═══════════════════════════════════════════════════════════════
-- TriplePlayz — Trial Tracking Migration
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Add trial + admin tracking columns
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS trial_bonus_days INT DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS notes TEXT;

-- Set trial_end for existing users who don't have one yet
UPDATE user_profiles
SET trial_end = created_at + INTERVAL '7 days'
WHERE trial_end IS NULL;

-- Update the auto-create trigger to set trial_end on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, display_name, avatar_color, subscription_tier, trial_end)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        '#' || lpad(to_hex((random() * 16777215)::int), 6, '0'),
        'free',
        NOW() + INTERVAL '7 days'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_trial_end ON user_profiles(trial_end);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_seen ON user_profiles(last_seen_at DESC);

-- Allow service role to read all profiles (for admin API)
DROP POLICY IF EXISTS "Service role can read all profiles" ON user_profiles;
CREATE POLICY "Service role can read all profiles"
    ON user_profiles FOR SELECT
    TO service_role
    USING (true);

-- Allow service role to update profiles (for admin actions)
DROP POLICY IF EXISTS "Service role can update profiles" ON user_profiles;
CREATE POLICY "Service role can update profiles"
    ON user_profiles FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);
