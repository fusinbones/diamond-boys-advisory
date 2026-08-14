import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const now = new Date().toISOString();

        // Get ALL active fire picks (scheduled or revealed)
        const { data: activePicks, error } = await supabaseAdmin
            .from('fire_picks')
            .select('*')
            .in('status', ['scheduled', 'revealed'])
            .order('scheduled_at', { ascending: true });

        if (error && error.code !== 'PGRST116') throw error;

        const picks = activePicks || [];
        const validPicks = [];

        for (const pick of picks) {
            const isRevealed = pick.status === 'revealed' || new Date(pick.scheduled_at) <= new Date(now);

            // If it should be revealed but status is still 'scheduled', auto-reveal it
            if (isRevealed && pick.status === 'scheduled') {
                await supabaseAdmin
                    .from('fire_picks')
                    .update({ status: 'revealed', revealed_at: now })
                    .eq('id', pick.id);
                pick.status = 'revealed';
                pick.revealed_at = now;
            }

            // SAFETY: Auto-expire revealed picks older than 12 hours.
            const revealedAt = pick.revealed_at ? new Date(pick.revealed_at) : new Date(pick.scheduled_at);
            const hoursSinceReveal = (Date.now() - revealedAt.getTime()) / (1000 * 60 * 60);
            if (pick.status === 'revealed' && hoursSinceReveal > 12) {
                continue; // Skip stale picks
            }

            // For scheduled (not yet revealed), return teaser only
            if (!isRevealed) {
                validPicks.push({
                    id: pick.id,
                    matchup: pick.matchup,
                    sport: pick.sport,
                    scheduled_at: pick.scheduled_at,
                    status: 'scheduled',
                    confidence: pick.confidence,
                    units: pick.units,
                });
            } else {
                validPicks.push(pick);
            }
        }

        // Fetch history
        const { data: historyData } = await supabaseAdmin
            .from('fire_picks')
            .select('*')
            .in('status', ['won', 'lost', 'push'])
            .order('scheduled_at', { ascending: false })
            .limit(10);

        // Return array of fire picks + single legacy firePick for backward compat
        return NextResponse.json({
            firePicks: validPicks,
            firePick: validPicks[0] || null, // backward compat
            history: historyData || [],
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message, firePicks: [], firePick: null, history: [] }, { status: 500 });
    }
}
