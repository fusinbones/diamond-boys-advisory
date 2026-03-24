-- ═══════════════════════════════════════════════════════════════
-- TriplePlayz — Pick Performance Tracking Columns
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Units wagered (1.0 = standard, 2.0 = double, etc.)
ALTER TABLE picks ADD COLUMN IF NOT EXISTS units DECIMAL(4,1) DEFAULT 1.0;

-- Odds string: e.g. "-110", "+150", "-1.5 (-120)"
ALTER TABLE picks ADD COLUMN IF NOT EXISTS odds TEXT;

-- Calculated edge %: difference between model probability and implied odds
ALTER TABLE picks ADD COLUMN IF NOT EXISTS edge DECIMAL(5,2);

-- Sport: MLB, NBA, NFL, NHL
ALTER TABLE picks ADD COLUMN IF NOT EXISTS sport TEXT DEFAULT 'MLB';

-- Status: upcoming | live | won | lost | push
ALTER TABLE picks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming';

-- Final score: e.g. "7-3 F"
ALTER TABLE picks ADD COLUMN IF NOT EXISTS score TEXT;

-- Index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_picks_status ON picks(status);
CREATE INDEX IF NOT EXISTS idx_picks_sport ON picks(sport);
CREATE INDEX IF NOT EXISTS idx_picks_created_at ON picks(created_at DESC);
