import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Public endpoint: returns pick alerts for the PickAlertBanner component.
 *
 * Returns two types:
 * 1. newPick — most recent pending pick (< 2 hours old)
 * 2. recentHit — most recent pick that hit (< 4 hours since result was set)
 *
 * The "recentHit" is the highest-converting notification in sports advisory:
 * "Premium members locked this in X hours ago" → triggers regret in free users
 */
export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

        // Most recent pending pick (< 2 hours old)
        const { data: newPicks } = await supabase
            .from('picks')
            .select('id, pick_team, home_team, away_team, pick_type, pick_value, confidence, result, created_at')
            .eq('result', 'pending')
            .gte('created_at', twoHoursAgo)
            .order('created_at', { ascending: false })
            .limit(1);

        // Most recent HIT pick (result set within last 4 hours)
        // We check game_date is today or yesterday to get recently settled picks
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        const { data: hitPicks } = await supabase
            .from('picks')
            .select('id, pick_team, home_team, away_team, pick_type, pick_value, confidence, result, created_at')
            .eq('result', 'hit')
            .gte('game_date', yesterday)
            .lte('game_date', today)
            .order('game_date', { ascending: false })
            .limit(1);

        return NextResponse.json({
            newPick: newPicks?.[0] || null,
            recentHit: hitPicks?.[0] || null,
        });
    } catch (error) {
        console.error('Pick alerts error:', error);
        return NextResponse.json({ newPick: null, recentHit: null });
    }
}
