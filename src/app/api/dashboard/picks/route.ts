import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

interface PickOutput {
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
    status: string; // 'upcoming' | 'won' | 'lost' | 'push'
    score: string | null;
    result: string | null;
    reasoning: string | null;
    alt_score: number | null;
}

/**
 * Map the DB 'result' column to the UI 'status' for PickCard
 * DB uses: pending, hit, miss, push
 * UI uses: upcoming, won, lost, push
 */
function mapResultToStatus(result: string | null | undefined): string {
    if (!result || result === 'pending') return 'upcoming';
    if (result === 'hit') return 'won';
    if (result === 'miss') return 'lost';
    if (result === 'push') return 'push';
    return 'upcoming';
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const sport = searchParams.get('sport');
        const tab = searchParams.get('tab') || 'today';
        const limit = Number(searchParams.get('limit')) || 50;

        const supabase = getSupabase();
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

        // ── Fetch picks based on tab ──
        let query = supabase
            .from('picks')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (tab === 'today') {
            query = query.gte('game_date', today);
        } else if (tab === 'upcoming') {
            query = query.eq('result', 'pending');
        } else if (tab === 'results') {
            query = query.in('result', ['hit', 'miss', 'push']);
        }

        if (sport && sport !== 'All') {
            query = query.eq('sport', sport);
        }

        const { data: rawPicks, error } = await query;
        if (error) throw error;

        // ── Transform raw DB rows → PickCard format ──
        const picks: PickOutput[] = ((rawPicks || []) as Record<string, unknown>[]).map(raw => ({
            id: raw.id as string,
            game_date: raw.game_date as string,
            created_at: raw.created_at as string,
            matchup: (raw.matchup as string) || (raw.away_team && raw.home_team ? `${raw.away_team} @ ${raw.home_team}` : 'Unknown'),
            pick_type: (raw.pick_type as string) || '',
            pick_value: (raw.pick_value as string) || (raw.pick_team ? `${raw.pick_team} ${raw.pick_type || 'ML'}` : ''),
            confidence: (raw.confidence as number) || 75,
            units: Number(raw.units) || Number(raw.unit_size) || 1,
            edge: (raw.edge as number) || null,
            odds: (raw.odds as string) || (raw.pick_value as string) || null,
            sport: (raw.sport as string) || 'MLB',
            status: mapResultToStatus(raw.result as string),
            score: (raw.score as string) || null,
            result: (raw.result as string) || null,
            reasoning: (raw.reasoning as string) || (raw.reason as string) || null,
            alt_score: (raw.alt_score as number) || null,
        }));

        // ── Calculate KPIs from all graded picks ──
        const { data: allGraded, error: kpiError } = await supabase
            .from('picks')
            .select('result, unit_size, sport, edge, created_at, game_date')
            .in('result', ['hit', 'miss', 'push']);

        if (kpiError) throw kpiError;

        const gradedPicks = (allGraded || []) as Record<string, unknown>[];
        const wins = gradedPicks.filter(p => p.result === 'hit').length;
        const losses = gradedPicks.filter(p => p.result === 'miss').length;
        const pushes = gradedPicks.filter(p => p.result === 'push').length;
        const totalGraded = wins + losses;
        const winRate = totalGraded > 0 ? ((wins / totalGraded) * 100).toFixed(1) : '0.0';

        // Units P&L
        const totalUnits = gradedPicks.reduce((acc, p) => {
            const u = Number(p.unit_size) || 1;
            if (p.result === 'hit') return acc + u;
            if (p.result === 'miss') return acc - u;
            return acc;
        }, 0);

        // Current streak
        const sortedGraded = [...gradedPicks]
            .sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime());
        let streak = 0;
        let streakType: 'W' | 'L' | '' = '';
        for (const p of sortedGraded) {
            if (p.result === 'push') continue;
            if (!streakType) {
                streakType = p.result === 'hit' ? 'W' : 'L';
                streak = 1;
            } else if ((p.result === 'hit' && streakType === 'W') || (p.result === 'miss' && streakType === 'L')) {
                streak++;
            } else {
                break;
            }
        }

        // Avg edge
        const edgePicks = gradedPicks.filter(p => p.edge !== null && p.edge !== undefined);
        const avgEdge = edgePicks.length > 0
            ? (edgePicks.reduce((acc, p) => acc + Number(p.edge), 0) / edgePicks.length).toFixed(1)
            : '0.0';

        // ── Morning Slate ──
        const { data: todayPicks } = await supabase
            .from('picks')
            .select('sport, result')
            .gte('game_date', today);

        const todayCount = todayPicks?.length || 0;
        const upcomingToday = todayPicks?.filter(p => p.result === 'pending').length || 0;
        const sportsToday = [...new Set((todayPicks || []).map(p => p.sport as string).filter(Boolean))];

        return NextResponse.json({
            picks,
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
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data', details: msg }, { status: 500 });
    }
}
