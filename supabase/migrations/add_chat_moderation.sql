-- ═══════════════════════════════════════════════
-- Chat Moderation System — Full Suite
-- ═══════════════════════════════════════════════

-- 1. Chat Presence — tracks who's currently online in a channel
CREATE TABLE IF NOT EXISTS chat_presence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    channel_id UUID NOT NULL,
    display_name TEXT NOT NULL,
    avatar_color TEXT DEFAULT '#6b7280',
    role TEXT DEFAULT 'member',
    last_heartbeat TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_presence_channel ON chat_presence(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_presence_heartbeat ON chat_presence(last_heartbeat);

-- 2. Chat Bans — supports ban, mute, suspend (timed), kick
CREATE TABLE IF NOT EXISTS chat_bans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('ban', 'mute', 'suspend', 'kick', 'warn')),
    reason TEXT,
    moderator_id UUID NOT NULL,
    moderator_email TEXT,
    channel_id UUID, -- NULL = global, specific = channel-only
    expires_at TIMESTAMPTZ, -- NULL = permanent (for bans), set for suspensions/mutes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_bans_user ON chat_bans(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_chat_bans_action ON chat_bans(action, is_active);

-- 3. Chat Reports — users report other users
CREATE TABLE IF NOT EXISTS chat_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID NOT NULL,
    reporter_email TEXT,
    reported_user_id UUID NOT NULL,
    reported_user_email TEXT,
    message_id UUID, -- the offending message if applicable
    message_content TEXT, -- snapshot of the message content
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'hate_speech', 'inappropriate', 'impersonation', 'other')),
    details TEXT, -- optional additional details from reporter
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
    resolution TEXT, -- admin notes on resolution
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_reports_status ON chat_reports(status, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_reports_user ON chat_reports(reported_user_id);

-- 4. Add is_muted and is_banned quick-check fields to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS muted_until TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
