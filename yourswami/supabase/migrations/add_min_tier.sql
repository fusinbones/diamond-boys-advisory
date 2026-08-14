-- Add min_tier column to picks for tier-based Discord channel routing
-- Default 'daily' means the pick goes to all channels (daily, weekly, monthly, season)
-- Set to 'monthly' for a pick that only goes to monthly + season channels, etc.
-- Run this in Supabase SQL Editor

ALTER TABLE picks ADD COLUMN IF NOT EXISTS min_tier TEXT DEFAULT 'daily';
