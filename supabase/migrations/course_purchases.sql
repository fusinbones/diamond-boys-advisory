-- Fire Course: Account-Based Access + Announcements
-- Run this in Supabase SQL Editor

-- 1. Add course_purchaser flag to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS course_purchaser BOOLEAN DEFAULT false;

-- 2. Create course announcements table
CREATE TABLE IF NOT EXISTS course_announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',  -- 'info', 'update', 'alert', 'promo'
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE course_announcements ENABLE ROW LEVEL SECURITY;

-- Anyone can read active announcements
CREATE POLICY "Public read announcements" ON course_announcements
    FOR SELECT USING (active = true);

-- Only service role can insert/update (admin API)
CREATE POLICY "Admin insert announcements" ON course_announcements
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin update announcements" ON course_announcements
    FOR UPDATE USING (true);

-- 3. Seed a welcome announcement
INSERT INTO course_announcements (title, body, type) VALUES (
    '🔥 Welcome to The Fire Course!',
    'Start with Module 1 and work your way through all 7 modules. Use the "Launch Pattern System" button to access the live dashboard. New content and updates coming soon!',
    'info'
);
