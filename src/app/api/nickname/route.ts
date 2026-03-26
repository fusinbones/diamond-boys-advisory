import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
}

// Nickname rules
const NICKNAME_MIN = 3;
const NICKNAME_MAX = 16;
const NICKNAME_REGEX = /^[a-zA-Z0-9_]+$/;

function validateNickname(nick: string): string | null {
    if (!nick || nick.trim().length === 0) return 'Nickname is required';
    const trimmed = nick.trim();
    if (trimmed.length < NICKNAME_MIN) return `Min ${NICKNAME_MIN} characters`;
    if (trimmed.length > NICKNAME_MAX) return `Max ${NICKNAME_MAX} characters`;
    if (!NICKNAME_REGEX.test(trimmed)) return 'Letters, numbers, and underscores only';

    // Block offensive patterns
    const blocked = ['admin', 'moderator', 'staff', 'tripleplayz', 'system', 'bot', 'support'];
    if (blocked.some(b => trimmed.toLowerCase().includes(b))) return 'That nickname is reserved';

    return null;
}

// GET — check if nickname is available
export async function GET(request: NextRequest) {
    try {
        const nick = request.nextUrl.searchParams.get('nickname');
        if (!nick) return NextResponse.json({ error: 'nickname param required' }, { status: 400 });

        const validationError = validateNickname(nick);
        if (validationError) return NextResponse.json({ available: false, error: validationError });

        const supabase = getSupabase();
        const { data } = await supabase
            .from('user_profiles')
            .select('id')
            .ilike('nickname', nick.trim())
            .limit(1);

        return NextResponse.json({
            available: !data || data.length === 0,
            error: data && data.length > 0 ? 'Already taken' : null,
        });
    } catch (error) {
        console.error('Nickname check error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST — set nickname for a user
export async function POST(request: NextRequest) {
    try {
        const { userId, nickname } = await request.json() as { userId: string; nickname: string };

        if (!userId || !nickname) {
            return NextResponse.json({ error: 'userId and nickname required' }, { status: 400 });
        }

        const validationError = validateNickname(nickname);
        if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

        const trimmed = nickname.trim();
        const supabase = getSupabase();

        // Check uniqueness (case-insensitive)
        const { data: existing } = await supabase
            .from('user_profiles')
            .select('id')
            .ilike('nickname', trimmed)
            .neq('id', userId)
            .limit(1);

        if (existing && existing.length > 0) {
            return NextResponse.json({ error: 'That nickname is already taken' }, { status: 409 });
        }

        // Update nickname + display_name for chat
        const { error } = await supabase
            .from('user_profiles')
            .update({ nickname: trimmed, display_name: trimmed })
            .eq('id', userId);

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'That nickname is already taken' }, { status: 409 });
            }
            throw error;
        }

        return NextResponse.json({ success: true, nickname: trimmed });
    } catch (error) {
        console.error('Nickname set error:', error);
        return NextResponse.json({ error: 'Failed to set nickname' }, { status: 500 });
    }
}
