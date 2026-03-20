-- ═══════════════════════════════════════════════════════════════
-- Diamond Boys Community Platform — Database Schema
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. User Profiles ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT 'Diamond Boy',
    avatar_color TEXT NOT NULL DEFAULT '#00e59b',
    subscription_tier TEXT, -- 'daily', 'weekly', 'monthly', 'season'
    stripe_customer_id TEXT,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, display_name, avatar_color)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        '#' || lpad(to_hex((random() * 16777215)::int), 6, '0')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read profiles (for displaying names in chat)
CREATE POLICY "Authenticated users can read profiles"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);


-- ─── 2. Channels ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS community_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'GENERAL',
    min_tier TEXT NOT NULL DEFAULT 'daily',
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_readonly BOOLEAN NOT NULL DEFAULT false,
    icon TEXT DEFAULT '💬',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for channels — only subscribers can see channels at their tier level
ALTER TABLE community_channels ENABLE ROW LEVEL SECURITY;

-- Tier level mapping function
CREATE OR REPLACE FUNCTION tier_level(tier TEXT)
RETURNS INT AS $$
BEGIN
    RETURN CASE tier
        WHEN 'daily' THEN 1
        WHEN 'weekly' THEN 2
        WHEN 'monthly' THEN 3
        WHEN 'season' THEN 4
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Users can only see channels at or below their tier level
CREATE POLICY "Subscribers see channels at their tier"
    ON community_channels FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND (
                user_profiles.is_admin = true
                OR tier_level(user_profiles.subscription_tier) >= tier_level(community_channels.min_tier)
            )
        )
    );


-- ─── 3. Messages ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS community_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES community_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) <= 2000),
    display_name TEXT NOT NULL,
    avatar_color TEXT NOT NULL DEFAULT '#00e59b',
    is_bot BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast channel message queries
CREATE INDEX IF NOT EXISTS idx_messages_channel_created
    ON community_messages (channel_id, created_at DESC);

-- RLS for messages
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages in channels they have access to
CREATE POLICY "Read messages in accessible channels"
    ON community_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM community_channels c
            JOIN user_profiles p ON p.id = auth.uid()
            WHERE c.id = community_messages.channel_id
            AND (
                p.is_admin = true
                OR tier_level(p.subscription_tier) >= tier_level(c.min_tier)
            )
        )
    );

-- Users can insert messages if they have channel access AND channel is not readonly
CREATE POLICY "Send messages in accessible non-readonly channels"
    ON community_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM community_channels c
            JOIN user_profiles p ON p.id = auth.uid()
            WHERE c.id = community_messages.channel_id
            AND c.is_readonly = false
            AND (
                p.is_admin = true
                OR tier_level(p.subscription_tier) >= tier_level(c.min_tier)
            )
        )
    );

-- Admins can insert into readonly channels (for bot/pick posts)
CREATE POLICY "Admins can post in readonly channels"
    ON community_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.is_admin = true
        )
    );

-- Users can only delete their own messages
CREATE POLICY "Users can delete own messages"
    ON community_messages FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);


-- ─── 4. Enable Realtime ─────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE community_messages;


-- ─── 5. Seed Default Channels ───────────────────────────────

INSERT INTO community_channels (name, category, min_tier, description, sort_order, is_readonly, icon) VALUES
    ('welcome',        'GENERAL', 'daily',   'Welcome to Diamond Boys! Read the rules.',       1, true,  '👋'),
    ('announcements',  'GENERAL', 'daily',   'Official announcements from the Diamond Boys.',   2, true,  '📢'),
    ('general',        'GENERAL', 'daily',   'Chat with the crew. Sports talk, vibes, etc.',    3, false, '💬'),
    ('daily-picks',    'PICKS',   'daily',   'Daily MLB picks with full analysis.',             10, true,  '⚾'),
    ('weekly-reports', 'PICKS',   'weekly',  'Weekly deep-dive reports and analysis.',           11, true,  '📊'),
    ('elite-plays',    'PICKS',   'monthly', 'Elite monthly picks and exclusive parlays.',       12, true,  '🔥'),
    ('season-vip',     'PICKS',   'season',  'Season Pass VIP exclusive strategies.',            13, true,  '👑'),
    ('diamond-bot',    'BOT',     'daily',   'Chat with DiamondBot AI for instant analysis.',   20, false, '🤖')
ON CONFLICT DO NOTHING;
