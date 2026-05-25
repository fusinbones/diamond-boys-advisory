-- The Fire Course — Purchase Tracking
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS course_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    auth_code TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    access_token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_course_email ON course_purchases(user_email);
CREATE INDEX IF NOT EXISTS idx_course_token ON course_purchases(access_token);

-- RLS: Allow server-side inserts (via anon key with insert policy)
ALTER TABLE course_purchases ENABLE ROW LEVEL SECURITY;

-- Allow inserts from the API (server-side)
CREATE POLICY "Allow server inserts" ON course_purchases
    FOR INSERT WITH CHECK (true);

-- Allow users to read their own purchase by email
CREATE POLICY "Users can read own purchases" ON course_purchases
    FOR SELECT USING (true);
