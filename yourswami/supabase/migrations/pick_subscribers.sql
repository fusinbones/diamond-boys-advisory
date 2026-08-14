-- Pick notification subscribers
-- Users who want email + SMS alerts when fire picks are published and graded

CREATE TABLE IF NOT EXISTS pick_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    name TEXT,
    active BOOLEAN DEFAULT true,
    source TEXT DEFAULT 'manual',  -- 'manual', 'course', 'signup'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pick_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for API operations)
CREATE POLICY "Service role full access" ON pick_subscribers
    FOR ALL USING (true) WITH CHECK (true);

-- Seed with the admin
INSERT INTO pick_subscribers (email, name, source) VALUES
    ('diamondboysadvisory@gmail.com', 'Big Cherch', 'manual')
ON CONFLICT (email) DO NOTHING;
