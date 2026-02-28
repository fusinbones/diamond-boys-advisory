-- Add Discord posting columns to the picks table
-- Run this in Supabase SQL Editor

ALTER TABLE picks ADD COLUMN IF NOT EXISTS discord_channel_id TEXT;
ALTER TABLE picks ADD COLUMN IF NOT EXISTS discord_post_at TIMESTAMPTZ;
ALTER TABLE picks ADD COLUMN IF NOT EXISTS discord_posted BOOLEAN DEFAULT false;
ALTER TABLE picks ADD COLUMN IF NOT EXISTS discord_message_id TEXT;
ALTER TABLE picks ADD COLUMN IF NOT EXISTS unit_size INTEGER DEFAULT 1;

-- Index for the cron job to efficiently query scheduled picks
CREATE INDEX IF NOT EXISTS idx_picks_discord_schedule
ON picks (discord_posted, discord_post_at)
WHERE discord_posted = false AND discord_post_at IS NOT NULL;
