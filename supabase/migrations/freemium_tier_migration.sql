-- ═══════════════════════════════════════════════════════════════
-- Diamond Boys Freemium Tier Migration
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Update tier_level function to support new tier names ───

CREATE OR REPLACE FUNCTION tier_level(tier TEXT)
RETURNS INT AS $$
BEGIN
    RETURN CASE tier
        -- New tier names
        WHEN 'free' THEN 0
        WHEN 'starter' THEN 1
        WHEN 'pro' THEN 2
        WHEN 'elite' THEN 3
        -- Legacy tier names (backward compatible)
        WHEN 'daily' THEN 1
        WHEN 'weekly' THEN 2
        WHEN 'monthly' THEN 3
        WHEN 'season' THEN 4
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ─── 2. Update channel RLS to allow all authenticated users to see channels ───
-- (Frontend handles gating — users need to see locked channels to know what they're missing)

DROP POLICY IF EXISTS "Subscribers see channels at their tier" ON community_channels;

CREATE POLICY "All authenticated users can see channels"
    ON community_channels FOR SELECT
    TO authenticated
    USING (true);


-- ─── 3. Update channel min_tier values ─────────────────────────

-- General channels → free
UPDATE community_channels SET min_tier = 'free' WHERE name IN ('welcome', 'announcements');

-- General chat → starter (prevents pick leaking between free/paid)
UPDATE community_channels SET min_tier = 'starter' WHERE name = 'general';

-- Picks channels
UPDATE community_channels SET min_tier = 'starter' WHERE name IN ('daily-picks', 'weekly-reports');
UPDATE community_channels SET min_tier = 'pro' WHERE name IN ('elite-plays', 'season-vip');

-- Bot channel → free
UPDATE community_channels SET min_tier = 'free' WHERE name = 'diamond-bot';


-- ─── 4. Create free-lobby channel ──────────────────────────────

INSERT INTO community_channels (name, category, min_tier, description, sort_order, is_readonly, icon)
VALUES ('free-lobby', 'GENERAL', 'free', 'Chat with the community! Meet fellow fans.', 4, false, '🏠')
ON CONFLICT DO NOTHING;


-- ─── 5. Add welcome_message column if not exists ───────────────

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'community_channels' AND column_name = 'welcome_message'
    ) THEN
        ALTER TABLE community_channels ADD COLUMN welcome_message TEXT;
    END IF;
END $$;

-- Set welcome message for free-lobby
UPDATE community_channels
SET welcome_message = 'Welcome to the Free Lobby! 🏠 Chat with fans, check game stats, and get a taste of what Diamond Boys has to offer. Upgrade anytime for full access to picks and premium channels.'
WHERE name = 'free-lobby';
