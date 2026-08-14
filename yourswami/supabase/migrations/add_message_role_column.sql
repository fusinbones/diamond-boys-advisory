-- Add missing columns to community_messages
ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'member';
ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;
