-- Add columns for AI auto-picks and enhanced pick tracking
-- Run this in Supabase SQL Editor

-- Source tracking (manual vs AI)
ALTER TABLE picks ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Odds snapshot at time of pick
ALTER TABLE picks ADD COLUMN IF NOT EXISTS odds_at_pick JSONB;

-- Sport for filtering
ALTER TABLE picks ADD COLUMN IF NOT EXISTS sport TEXT;

-- Game ID from external API for deduplication
ALTER TABLE picks ADD COLUMN IF NOT EXISTS game_id TEXT;

-- Create index for efficient AI pick lookups
CREATE INDEX IF NOT EXISTS idx_picks_source ON picks(source);
CREATE INDEX IF NOT EXISTS idx_picks_game_date ON picks(game_date);
CREATE INDEX IF NOT EXISTS idx_picks_game_id ON picks(game_id);
