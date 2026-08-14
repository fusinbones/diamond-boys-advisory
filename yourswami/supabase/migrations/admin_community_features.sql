-- ═══════════════════════════════════════════════════════
-- Admin features: delete any message, welcome messages
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- 1. Let admins delete ANY message
CREATE POLICY "Admins can delete any message"
    ON community_messages FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.is_admin = true
        )
    );

-- 2. Let admins update messages (for pinning, etc.)
CREATE POLICY "Admins can update any message"
    ON community_messages FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.is_admin = true
        )
    );

-- 3. Add welcome_message column to channels
ALTER TABLE community_channels
    ADD COLUMN IF NOT EXISTS welcome_message TEXT;

-- 4. Admin CRUD on channels
CREATE POLICY "Admins can insert channels"
    ON community_channels FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can update channels"
    ON community_channels FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can delete channels"
    ON community_channels FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.is_admin = true
        )
    );

-- 5. Set default welcome messages
UPDATE community_channels SET welcome_message = '👋 Welcome to Diamond Boys! Read the rules and enjoy the community.' WHERE name = 'welcome';
UPDATE community_channels SET welcome_message = '📢 Stay tuned for official announcements.' WHERE name = 'announcements';
UPDATE community_channels SET welcome_message = '💬 Chat about anything — sports, picks, vibes. Keep it respectful.' WHERE name = 'general';
UPDATE community_channels SET welcome_message = '⚾ Daily MLB picks will be posted here with full analysis.' WHERE name = 'daily-picks';
UPDATE community_channels SET welcome_message = '📊 Weekly deep-dive reports and trend analysis.' WHERE name = 'weekly-reports';
UPDATE community_channels SET welcome_message = '🔥 Elite monthly picks and exclusive parlay breakdowns.' WHERE name = 'elite-plays';
UPDATE community_channels SET welcome_message = '👑 Season Pass VIP exclusive content and strategies.' WHERE name = 'season-vip';
UPDATE community_channels SET welcome_message = '🤖 Chat with DiamondBot AI for instant game analysis. Just type your question!' WHERE name = 'diamond-bot';
