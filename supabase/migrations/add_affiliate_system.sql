-- ═══════════════════════════════════════════
-- Affiliate System Tables
-- ═══════════════════════════════════════════

-- 1. Affiliates — one row per member who activates referral
CREATE TABLE IF NOT EXISTS affiliates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    affiliate_code TEXT NOT NULL UNIQUE,
    commission_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00,
    recurrence TEXT NOT NULL DEFAULT 'first_only' CHECK (recurrence IN ('first_only', 'recurring', 'lifetime')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'revoked')),
    total_earned NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_affiliate UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_user ON affiliates(user_id);

-- 2. Referrals — one row per converted referral
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    referred_email TEXT NOT NULL,
    referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    stripe_session_id TEXT,
    stripe_subscription_id TEXT,
    tier_id TEXT,
    tier_price NUMERIC(10,2),
    commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid')),
    converted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_affiliate ON referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_referrals_email ON referrals(referred_email);

-- 3. Affiliate Payouts — audit log for manual payouts
CREATE TABLE IF NOT EXISTS affiliate_payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    method TEXT NOT NULL DEFAULT 'paypal',
    notes TEXT,
    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_payouts_affiliate ON affiliate_payouts(affiliate_id);

-- ═══════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════

ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- Affiliates: users can read their own row only
CREATE POLICY "Users can view own affiliate" ON affiliates
    FOR SELECT USING (auth.uid() = user_id);

-- Referrals: affiliates can view their own referrals
CREATE POLICY "Affiliates can view own referrals" ON referrals
    FOR SELECT USING (
        affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
    );

-- Payouts: affiliates can view their own payouts
CREATE POLICY "Affiliates can view own payouts" ON affiliate_payouts
    FOR SELECT USING (
        affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
    );
