-- Odds cache table: stores pre-fetched odds/scores data from The Odds API
-- Only the refresh cron job writes here; all user-facing endpoints READ from here.
CREATE TABLE IF NOT EXISTS odds_cache (
    cache_key TEXT PRIMARY KEY,           -- e.g. "odds-baseball_mlb-h2h,spreads,totals-us" or "scores-baseball_mlb-1"
    data JSONB NOT NULL DEFAULT '[]',      -- the raw API response
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '4 hours')
);

-- Index for fast expiry checks
CREATE INDEX IF NOT EXISTS idx_odds_cache_expires ON odds_cache (expires_at);

-- RLS: allow service role full access, anon read-only
ALTER TABLE odds_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON odds_cache
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anon can read cache" ON odds_cache
    FOR SELECT USING (true);
