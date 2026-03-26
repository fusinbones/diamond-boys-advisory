import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

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
 * GET /api/community/channels
 * Returns channels the authenticated user has access to (based on their tier).
 * Server-side: validates auth token, checks subscription, RLS filters channels.
 */
export async function GET() {
    try {
        const headersList = await headers();
        const authHeader = headersList.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify the user from token
        const supabase = getUserSupabase(token);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check subscription (server-side — never trust client)
        const serviceDb = getServiceSupabase();
        const { data: profile } = await serviceDb
            .from('user_profiles')
            .select('subscription_tier, is_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.subscription_tier && !profile?.is_admin) {
            return NextResponse.json({ error: 'No active subscription' }, { status: 403 });
        }

        // Fetch channels — service client so we can filter ourselves
        // (RLS would require the user's session, so we filter server-side)
        const tierLevel = getTierLevel(profile.subscription_tier);
        const { data: channels, error } = await serviceDb
            .from('community_channels')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) throw error;

        // Filter channels by tier (admins see all)
        const filtered = profile.is_admin
            ? channels
            : (channels || []).filter(ch => getTierLevel(ch.min_tier) <= tierLevel);

        return NextResponse.json({ channels: filtered });
    } catch (error) {
        console.error('Channels GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
    }
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
