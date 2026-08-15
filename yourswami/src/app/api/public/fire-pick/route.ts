import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export const dynamic = 'force-dynamic';

// Aggregate a list of decided fire picks into a record + win% + net units.
// Mirrors the historical math: per-pick `units` (default 3), result || status.
function aggregate(list: { status?: string; result?: string; units?: number }[]) {
    let wins = 0, losses = 0, pushes = 0, units = 0;
    for (const fp of list) {
        const r = fp.result || fp.status;
        const u = Number(fp.units) || 3;
        if (r === 'won') { wins++; units += u; }
        else if (r === 'lost') { losses++; units -= u; }
        else if (r === 'push') { pushes++; }
    }
    const decided = wins + losses;
    return {
        record: `${wins}-${losses}${pushes > 0 ? `-${pushes}` : ''}`,
        wins, losses, pushes,
        winPct: decided > 0 ? `${((wins / decided) * 100).toFixed(1)}%` : '0.0%',
        units: Number(units.toFixed(1)),
    };
}

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

        // Fetch history (last 10 decided, for the list)
        const { data: historyData } = await supabaseAdmin
            .from('fire_picks')
            .select('*')
            .in('status', ['won', 'lost', 'push'])
            .order('scheduled_at', { ascending: false })
            .limit(10);

        // Full decided set (most recent first) for stats: all-time, season, streak, last-10.
        const { data: decided } = await supabaseAdmin
            .from('fire_picks')
            .select('status, result, units, scheduled_at')
            .in('status', ['won', 'lost', 'push'])
            .order('scheduled_at', { ascending: false });

        const all = decided || [];
        const currentYear = new Date().getFullYear();
        const allTime = aggregate(all);
        const season = aggregate(all.filter(fp => new Date(fp.scheduled_at).getFullYear() === currentYear));

        // Current streak (most recent consecutive W or L; pushes skipped)
        let streakType: string | null = null, streakCount = 0;
        for (const fp of all) {
            const r = fp.result || fp.status;
            if (r === 'push') continue;
            if (streakType === null) { streakType = r as string; streakCount = 1; }
            else if (r === streakType) { streakCount++; }
            else break;
        }
        const streak = streakType ? `${streakType === 'won' ? 'W' : 'L'}${streakCount}` : '—';

        // Last 10 form (oldest→newest for a left-to-right dot strip)
        const last = all.slice(0, 10);
        const last10 = aggregate(last).record;
        const form = last.slice().reverse().map(fp => {
            const r = fp.result || fp.status;
            return r === 'won' ? 'W' : r === 'lost' ? 'L' : 'P';
        });

        const stats = { allTime, season, seasonYear: currentYear, streak, last10, form };

        // Return array of fire picks + single legacy firePick for backward compat
        return NextResponse.json({
            firePicks: validPicks,
            firePick: validPicks[0] || null, // backward compat
            history: historyData || [],
            stats,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message, firePicks: [], firePick: null, history: [] }, { status: 500 });
    }
}
