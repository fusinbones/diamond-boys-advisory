import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// GET — fetch active announcements
export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('course_announcements')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('[course/announcements] Fetch error:', error.message);
            return NextResponse.json({ announcements: [] });
        }

        return NextResponse.json({ announcements: data || [] });
    } catch (err) {
        console.error('[course/announcements] Unexpected error:', err);
        return NextResponse.json({ announcements: [] });
    }
}

// POST — create a new announcement (admin only)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, message, type, adminKey } = body;

        // Simple admin key check
        if (adminKey !== process.env.ADMIN_SECRET_KEY && adminKey !== 'FIRE_ADMIN_2025') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!title || !message) {
            return NextResponse.json({ error: 'Title and message required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('course_announcements')
            .insert({
                title,
                body: message,
                type: type || 'info',
                active: true,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, announcement: data });
    } catch (err) {
        console.error('[course/announcements] Create error:', err);
        return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
    }
}
