-- Add role column to user_profiles for Admin / Staff Moderator / Member roles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

-- Set existing admins
UPDATE user_profiles SET role = 'admin' WHERE is_admin = true;

-- Index for role queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Add user_role column to community_messages for Staff/Admin badges in chat
ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'member';
