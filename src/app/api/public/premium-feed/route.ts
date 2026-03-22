import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Public endpoint: returns premium picks split into two groups:
 *
 * 1. REVEALED — completed picks (result != 'pending') from last 3 days
 *    Full details visible: team, pick, analysis, result badge
 *    This is the "delayed reveal" — free users see what they missed
 *
 * 2. LOCKED — pending picks (not yet played)
 *    Only team names + confidence visible. Analysis is blurred client-side.
 *    This is the "FOMO trigger" — they can see picks exist but can't act on them
 */
export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        // Revealed: completed picks from last 3 days (full details)
        const { data: revealedRaw } = await supabase
            .from('picks')
            .select('id, pick_team, home_team, away_team, pick_type, pick_value, confidence, reason, result, game_date, created_at')
            .neq('result', 'pending')
            .gte('game_date', threeDaysAgo.toISOString().split('T')[0])
            .order('game_date', { ascending: false })
            .limit(10);

        // Locked: pending picks (upcoming — only safe-to-show fields)
        const { data: lockedRaw } = await supabase
            .from('picks')
            .select('id, home_team, away_team, confidence, game_date, pick_type')
            .eq('result', 'pending')
            .order('game_date', { ascending: true })
            .limit(6);

        return NextResponse.json({
            revealed: revealedRaw || [],
            locked: lockedRaw || [],
        });
    } catch (error) {
        console.error('Premium feed error:', error);
        return NextResponse.json({ revealed: [], locked: [] });
    }
}
