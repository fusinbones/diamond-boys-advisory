import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export async function GET() {
    try {
        const supabase = getSupabase();

        // Fetch all graded picks (uses 'result' column: hit/miss/push)
        const { data, error } = await supabase
            .from('picks')
            .select('*')
            .in('result', ['hit', 'miss', 'push'])
            .order('game_date', { ascending: true });

        if (error) throw error;

        const picks = (data || []) as Record<string, unknown>[];

        // ── Daily P&L (for bankroll chart) ──
        const dailyMap = new Map<string, { wins: number; losses: number; pushes: number; units: number }>();
        for (const p of picks) {
            const date = (p.game_date as string) || 'unknown';
            const entry = dailyMap.get(date) || { wins: 0, losses: 0, pushes: 0, units: 0 };
            const u = Number(p.unit_size) || 1;
            if (p.result === 'hit') { entry.wins++; entry.units += u; }
            if (p.result === 'miss') { entry.losses++; entry.units -= u; }
            if (p.result === 'push') { entry.pushes++; }
            dailyMap.set(date, entry);
        }

        // Cumulative bankroll
        let cumulative = 0;
        const dailyPnl = Array.from(dailyMap.entries()).map(([date, d]) => {
            cumulative += d.units;
            return {
                date,
                record: `${d.wins}-${d.losses}${d.pushes > 0 ? `-${d.pushes}` : ''}`,
                units: Number(d.units.toFixed(1)),
                cumulative: Number(cumulative.toFixed(1)),
            };
        });

        // ── By Sport ──
        const sportKeyMap: Record<string, string> = {
            baseball_mlb: 'MLB', 'baseball_mlb_preseason': 'MLB',
            basketball_nba: 'NBA', 'basketball_nba_preseason': 'NBA',
            icehockey_nhl: 'NHL', 'icehockey_nhl_preseason': 'NHL',
            americanfootball_nfl: 'NFL', 'americanfootball_nfl_preseason': 'NFL',
        };

        const sportMap = new Map<string, { wins: number; losses: number; units: number }>();
        for (const p of picks) {
            const rawSport = (p.sport as string) || '';
            const sport = sportKeyMap[rawSport] || rawSport || 'MLB';
            const entry = sportMap.get(sport) || { wins: 0, losses: 0, units: 0 };
            const u = Number(p.unit_size) || 1;
            if (p.result === 'hit') { entry.wins++; entry.units += u; }
            if (p.result === 'miss') { entry.losses++; entry.units -= u; }
            sportMap.set(sport, entry);
        }

        const sportColors: Record<string, string> = {
            MLB: 'bg-red-500', NBA: 'bg-orange-500', NFL: 'bg-emerald-500', NHL: 'bg-blue-500',
        };

        const bySport = Array.from(sportMap.entries()).map(([sport, s]) => {
            const total = s.wins + s.losses;
            return {
                sport,
                record: `${s.wins}-${s.losses}`,
                winPct: total > 0 ? `${((s.wins / total) * 100).toFixed(1)}%` : '0.0%',
                units: `${s.units >= 0 ? '+' : ''}${s.units.toFixed(1)}`,
                color: sportColors[sport] || 'bg-zinc-500',
            };
        });

        // ── "If You Tailed" totals ──
        const totalWonUnits = picks
            .filter(p => p.result === 'hit')
            .reduce((acc, p) => acc + (Number(p.unit_size) || 1), 0);
        const totalLostUnits = picks
            .filter(p => p.result === 'miss')
            .reduce((acc, p) => acc + (Number(p.unit_size) || 1), 0);
        const netUnits = totalWonUnits - totalLostUnits;

        // Last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentPicks = picks.filter(p => new Date(p.game_date as string) >= sevenDaysAgo);
        const recentWon = recentPicks.filter(p => p.result === 'hit').reduce((a, p) => a + (Number(p.unit_size) || 1), 0);
        const recentLost = recentPicks.filter(p => p.result === 'miss').reduce((a, p) => a + (Number(p.unit_size) || 1), 0);
        const recentNet = recentWon - recentLost;

        // ── Fire Picks Aggregation ──
        const { data: fireData, error: fireError } = await supabase
            .from('fire_picks')
            .select('*')
            .in('status', ['won', 'lost', 'push'])
            .order('scheduled_at', { ascending: true });

        const fireStats = {
            wins: 0,
            losses: 0,
            pushes: 0,
            units: 0,
            record: '0-0',
            winPct: '0.0%',
        };

        if (fireData && !fireError) {
            for (const fp of fireData) {
                const result = fp.result || fp.status;
                const u = Number(fp.units) || 3;
                if (result === 'won') { fireStats.wins++; fireStats.units += u; }
                if (result === 'lost') { fireStats.losses++; fireStats.units -= u; }
                if (result === 'push') { fireStats.pushes++; }
            }
            
            const totalDecisions = fireStats.wins + fireStats.losses;
            const w = fireStats.wins;
            const l = fireStats.losses;
            const p = fireStats.pushes;
            
            fireStats.record = `${w}-${l}${p > 0 ? `-${p}` : ''}`;
            fireStats.winPct = totalDecisions > 0 ? `${((w / totalDecisions) * 100).toFixed(1)}%` : '0.0%';
            // Limit units to 1 decimal
            fireStats.units = Number(fireStats.units.toFixed(1));
        }

        return NextResponse.json({
            dailyPnl,
            recentDays: dailyPnl.slice(-5).reverse(),
            bySport,
            tailTracker: {
                seasonUnits: Number(netUnits.toFixed(1)),
                weekUnits: Number(recentNet.toFixed(1)),
                totalPicks: picks.length,
            },
            fireStats,
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
