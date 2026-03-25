import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

interface Pick {
    id: string;
    game_date: string;
    created_at: string;
    matchup: string;
    pick_type: string;
    pick_value: string;
    confidence: number;
    units: number;
    odds: string | null;
    edge: number | null;
    sport: string;
    status: string;
    score: string | null;
    result: string | null;
    reasoning: string | null;
    alt_score: number | null;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const sport = searchParams.get('sport');
        const tab = searchParams.get('tab') || 'today'; // today | upcoming | results
        const limit = Number(searchParams.get('limit')) || 50;

        const supabase = getSupabase();
        const today = new Date().toISOString().split('T')[0];

        // ── Fetch picks based on tab ──
        let query = supabase
            .from('picks')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (tab === 'today') {
            query = query.gte('game_date', today);
        } else if (tab === 'upcoming') {
            query = query.in('status', ['upcoming']);
        } else if (tab === 'results') {
            query = query.in('status', ['won', 'lost', 'push']);
        }

        if (sport && sport !== 'All') {
            query = query.eq('sport', sport);
        }

        const { data: rawPicks, error } = await query;
        if (error) throw error;

        // Transform raw DB rows into PickCard-compatible format
        // AI picks have: home_team, away_team, result, unit_size, pick_team, pick_type, reason
        // PickCard expects: matchup, status, units, pick_value, reasoning, odds, edge
        interface RawPick {
            id: string;
            game_date: string;
            created_at: string;
            // Legacy columns (old manual picks)
            matchup?: string;
            status?: string;
            units?: number;
            odds?: string | null;
            edge?: number | null;
            pick_value?: string;
            reasoning?: string | null;
            // New columns (AI picks + streamlined entry)
            home_team?: string;
            away_team?: string;
            pick_team?: string;
            pick_type?: string;
            result?: string;
            unit_size?: number;
            reason?: string;
            confidence?: number;
            source?: string;
            sport?: string;
            score?: string | null;
            alt_score?: number | null;
            odds_at_pick?: Record<string, unknown>;
        }

        const picks: Pick[] = ((rawPicks || []) as RawPick[]).map(raw => ({
            id: raw.id,
            game_date: raw.game_date,
            created_at: raw.created_at,
            matchup: raw.matchup || (raw.away_team && raw.home_team ? `${raw.away_team} @ ${raw.home_team}` : 'Unknown'),
            pick_type: raw.pick_type || '',
            pick_value: raw.pick_value || (raw.pick_team ? `${raw.pick_team} ${raw.pick_type || 'ML'}` : ''),
            confidence: raw.confidence || 75,
            units: raw.units || raw.unit_size || 1,
            edge: raw.edge || null,
            odds: raw.odds || raw.pick_value || null,
            sport: raw.sport || 'MLB',
            // Map 'result' column to 'status' expected by PickCard
            status: raw.status || (raw.result === 'pending' ? 'upcoming' : raw.result === 'hit' ? 'won' : raw.result === 'miss' ? 'lost' : raw.result || 'upcoming'),
            score: raw.score || null,
            reasoning: raw.reasoning || raw.reason || null,
            alt_score: raw.alt_score || null,
            result: raw.result || null,
        }));

        // ── Calculate KPIs from all graded picks ──
        // Support both legacy 'status' column and new 'result' column
        const { data: allGraded, error: kpiError } = await supabase
            .from('picks')
            .select('status, result, units, unit_size, sport, edge, created_at, game_date')
            .or('status.in.(won,lost,push),result.in.(hit,miss,push)');

        if (kpiError) throw kpiError;

        // Normalize: map both column schemes to won/lost/push
        interface GradedPick { status: string; units: number; created_at: string; edge?: number | null; sport?: string; game_date?: string; }
        const gradedPicks: GradedPick[] = (allGraded || []).map((p: Record<string, unknown>) => {
            const effectiveStatus = (p.status as string) || (p.result === 'hit' ? 'won' : p.result === 'miss' ? 'lost' : (p.result as string) || '');
            return { status: effectiveStatus, units: Number(p.units) || Number(p.unit_size) || 1, created_at: p.created_at as string, edge: p.edge as number | null, sport: p.sport as string, game_date: p.game_date as string };
        });
        const wins = gradedPicks.filter(p => p.status === 'won').length;
        const losses = gradedPicks.filter(p => p.status === 'lost').length;
        const pushes = gradedPicks.filter(p => p.status === 'push').length;
        const totalGraded = wins + losses;
        const winRate = totalGraded > 0 ? ((wins / totalGraded) * 100).toFixed(1) : '0.0';

        // Units P&L: won = +units, lost = -units, push = 0
        const totalUnits = gradedPicks.reduce((acc, p) => {
            const u = Number(p.units) || 1;
            if (p.status === 'won') return acc + u;
            if (p.status === 'lost') return acc - u;
            return acc;
        }, 0);

        // Current streak
        const sortedGraded = [...gradedPicks]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        let streak = 0;
        let streakType: 'W' | 'L' | '' = '';
        for (const p of sortedGraded) {
            if (p.status === 'push') continue;
            if (!streakType) {
                streakType = p.status === 'won' ? 'W' : 'L';
                streak = 1;
            } else if ((p.status === 'won' && streakType === 'W') || (p.status === 'lost' && streakType === 'L')) {
                streak++;
            } else {
                break;
            }
        }

        // Avg edge
        const edgePicks = gradedPicks.filter((p) => p.edge !== null && p.edge !== undefined);
        const avgEdge = edgePicks.length > 0
            ? (edgePicks.reduce((acc, p) => acc + Number(p.edge), 0) / edgePicks.length).toFixed(1)
            : '0.0';

        // ── Morning Slate ──
        const { data: todayPicks } = await supabase
            .from('picks')
            .select('sport, status')
            .gte('game_date', today);

        const todayCount = todayPicks?.length || 0;
        const upcomingToday = todayPicks?.filter((p) => p.status === 'upcoming').length || 0;
        const sportsToday = [...new Set(todayPicks?.map((p) => p.sport) || [])];

        return NextResponse.json({
            picks: (picks || []) as Pick[],
            kpis: {
                record: `${wins}-${losses}${pushes > 0 ? `-${pushes}` : ''}`,
                winRate: `${winRate}%`,
                totalUnits: totalUnits.toFixed(1),
                roi: totalGraded > 0 ? ((totalUnits / totalGraded) * 100).toFixed(1) + '%' : '0.0%',
                streak: streak > 0 ? `${streakType}${streak}` : 'N/A',
                avgEdge: `+${avgEdge}%`,
            },
            morningSlate: {
                totalGames: todayCount,
                upcomingPicks: upcomingToday,
                sports: sportsToday,
            },
        });
    } catch (error) {
        console.error('Dashboard picks error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
