import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

// Rate limit: track last message time per user (in-memory, resets on deploy)
const rateLimits = new Map<string, number>();
const RATE_LIMIT_MS = 1000; // 1 message per second
const MAX_MESSAGE_LENGTH = 2000;

function getServiceSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

function getUserSupabase(accessToken: string) {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
}

/**
 * Sanitize message content — strip HTML tags to prevent XSS
 */
function sanitize(content: string): string {
    return content
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
}

function getTierLevel(tier: string | null): number {
    switch (tier) {
        case 'starter':
        case 'daily':
        case 'pro':
        case 'weekly':
        case 'monthly':
        case 'elite':
        case 'season': return 3;
        default: return 0;
    }
}

async function authenticateUser() {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) return null;

    const supabase = getUserSupabase(token);
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    return user;
}

/**
 * GET /api/community/messages?channelId=xxx&before=timestamp&limit=50
 * Fetch paginated messages for a channel.
 */
export async function GET(request: NextRequest) {
    try {
        const user = await authenticateUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = request.nextUrl;
        const channelId = searchParams.get('channelId');
        const before = searchParams.get('before');
        const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);

        if (!channelId) {
            return NextResponse.json({ error: 'channelId required' }, { status: 400 });
        }

        // Verify user has access to this channel
        const db = getServiceSupabase();
        const { data: profile } = await db
            .from('user_profiles')
            .select('subscription_tier, is_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.subscription_tier && !profile?.is_admin) {
            return NextResponse.json({ error: 'No active subscription' }, { status: 403 });
        }

        // Check channel access
        const { data: channel } = await db
            .from('community_channels')
            .select('min_tier')
            .eq('id', channelId)
            .single();

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
        }

        if (!profile.is_admin && getTierLevel(profile.subscription_tier) < getTierLevel(channel.min_tier)) {
            return NextResponse.json({ error: 'Insufficient tier access' }, { status: 403 });
        }

        let query = db
            .from('community_messages')
            .select('*')
            .eq('channel_id', channelId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (before) {
            query = query.lt('created_at', before);
        }

        const { data: messages, error } = await query;
        if (error) throw error;

        return NextResponse.json({ messages: (messages || []).reverse() });
    } catch (error) {
        console.error('Messages GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

/**
 * POST /api/community/messages
 * Send a message. Server-side: auth, subscription, channel access, rate limit, sanitize.
 */
export async function POST(request: NextRequest) {
    try {
        const user = await authenticateUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limit
        const lastSent = rateLimits.get(user.id) || 0;
        const now = Date.now();
        if (now - lastSent < RATE_LIMIT_MS) {
            return NextResponse.json(
                { error: 'Slow down! You can send one message per second.' },
                { status: 429 }
            );
        }

        const { channelId, content } = await request.json();
        if (!channelId || !content) {
            return NextResponse.json({ error: 'channelId and content required' }, { status: 400 });
        }

        // Sanitize + validate
        const sanitized = sanitize(content);
        if (sanitized.length === 0) {
            return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
        }
        if (sanitized.length > MAX_MESSAGE_LENGTH) {
            return NextResponse.json({ error: `Max ${MAX_MESSAGE_LENGTH} characters` }, { status: 400 });
        }

        const db = getServiceSupabase();

        // Get profile
        const { data: profile } = await db
            .from('user_profiles')
            .select('display_name, avatar_color, subscription_tier, is_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.subscription_tier && !profile?.is_admin) {
            return NextResponse.json({ error: 'No active subscription' }, { status: 403 });
        }

        // Check channel access + readonly
        const { data: channel } = await db
            .from('community_channels')
            .select('min_tier, is_readonly')
            .eq('id', channelId)
            .single();

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
        }

        if (channel.is_readonly && !profile.is_admin) {
            return NextResponse.json({ error: 'This channel is read-only' }, { status: 403 });
        }

        if (!profile.is_admin && getTierLevel(profile.subscription_tier) < getTierLevel(channel.min_tier)) {
            return NextResponse.json({ error: 'Insufficient tier access' }, { status: 403 });
        }

        // Insert message
        const { data: message, error } = await db
            .from('community_messages')
            .insert({
                channel_id: channelId,
                user_id: user.id,
                content: sanitized,
                display_name: profile.display_name || user.email?.split('@')[0] || 'Anonymous',
                avatar_color: profile.avatar_color || '#FFC107',
                is_bot: false,
            })
            .select()
            .single();

        if (error) throw error;

        // Update rate limit
        rateLimits.set(user.id, now);

        // YourSwamiBot @mention trigger
        if (sanitized.toLowerCase().includes('@tripleplayzbot')) {
            triggerBotResponse(channelId, sanitized, user.id).catch(console.error);
        }

        return NextResponse.json({ message });
    } catch (error) {
        console.error('Messages POST error:', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}

/**
 * YourSwamiBot AI response (fire-and-forget)
 */
async function triggerBotResponse(
    channelId: string,
    userMessage: string,
    userId: string
) {
    try {
        const db = getServiceSupabase();
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: `You are YourSwamiBot 💎, the AI assistant for YourSwami - Sports Advisory — a premium MLB picks service.
You're chatting in the YourSwami community. Be helpful, knowledgeable about baseball/sports betting, and keep responses concise (under 500 chars).
Use sports betting terminology naturally. Be confident but not arrogant. Use emojis sparingly.

User message: ${userMessage.replace(/@tripleplayzbot/gi, '').trim()}

Respond naturally as YourSwamiBot:`,
        });

        const botReply = response.text || "Sorry, I'm having trouble right now. Try again! 💎";

        await db
            .from('community_messages')
            .insert({
                channel_id: channelId,
                user_id: userId,
                content: botReply,
                display_name: 'YourSwamiBot 💎',
                avatar_color: '#FFC107',
                is_bot: true,
            });
    } catch (error) {
        console.error('YourSwamiBot response error:', error);
    }
}
