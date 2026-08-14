-- Add unique nickname column to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Create unique index for nickname (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_nickname_unique 
ON user_profiles (LOWER(nickname)) WHERE nickname IS NOT NULL;

-- Backfill existing users: set nickname = display_name where possible
-- (This may fail for duplicates, which is fine — those users will be prompted)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id, display_name FROM user_profiles WHERE nickname IS NULL
    LOOP
        BEGIN
            UPDATE user_profiles SET nickname = r.display_name WHERE id = r.id;
        EXCEPTION WHEN unique_violation THEN
            -- Skip duplicates — user will be prompted to pick a unique nickname
            NULL;
        END;
    END LOOP;
END $$;
