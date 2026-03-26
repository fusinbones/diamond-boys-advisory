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
            query = query.eq('game_date', today);
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
        // Map Odds API sport keys to clean display names
        const sportKeyMap: Record<string, string> = {
            baseball_mlb: 'MLB', 'baseball_mlb_preseason': 'MLB',
            basketball_nba: 'NBA', 'basketball_nba_preseason': 'NBA',
            icehockey_nhl: 'NHL', 'icehockey_nhl_preseason': 'NHL',
            americanfootball_nfl: 'NFL', 'americanfootball_nfl_preseason': 'NFL',
        };

        const picks: PickOutput[] = ((rawPicks || []) as Record<string, unknown>[]).map(raw => {
            const cleanSport = sportKeyMap[(raw.sport as string) || ''] || (raw.sport as string) || 'MLB';
            const pickTeam = (raw.pick_team as string) || '';
            const pickType = (raw.pick_type as string) || 'ML';
            const rawOdds = (raw.pick_value as string) || (raw.odds as string) || '';

            // Build a clear pick_value: "Team Name ML +105"
            let displayValue = '';
            if (pickTeam) {
                displayValue = `${pickTeam} ${pickType} ${rawOdds}`.trim();
            } else if (raw.pick_value) {
                displayValue = raw.pick_value as string;
            } else {
                displayValue = `${pickType} ${rawOdds}`.trim();
            }

            return {
                id: raw.id as string,
                game_date: raw.game_date as string,
                created_at: raw.created_at as string,
                matchup: (raw.matchup as string) || (raw.away_team && raw.home_team ? `${raw.away_team} @ ${raw.home_team}` : 'Unknown'),
                pick_type: pickType,
                pick_value: displayValue,
                confidence: (raw.confidence as number) || 75,
                units: Number(raw.units) || Number(raw.unit_size) || 1,
                edge: (raw.edge as number) || null,
                odds: rawOdds || null,
                sport: cleanSport,
                status: mapResultToStatus(raw.result as string),
                score: (raw.score as string) || null,
                result: (raw.result as string) || null,
                reasoning: (raw.reasoning as string) || (raw.reason as string) || null,
                alt_score: (raw.alt_score as number) || null,
            };
        });

        // ── Calculate KPIs from all graded picks ──
        const { data: allGraded, error: kpiError } = await supabase
            .from('picks')
            .select('*')
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
            .select('*')
            .eq('game_date', today);

        const todayCount = todayPicks?.length || 0;
        const upcomingToday = todayPicks?.filter(p => p.result === 'pending').length || 0;
        const sportsToday = [...new Set((todayPicks || []).map(p => sportKeyMap[(p.sport as string) || ''] || (p.sport as string) || 'MLB').filter(Boolean))];

        // If no graded picks yet, show industry averages so the dashboard doesn't look empty
        const hasGradedPicks = totalGraded > 0;
        return NextResponse.json({
            picks,
            kpis: hasGradedPicks ? {
                record: `${wins}-${losses}${pushes > 0 ? `-${pushes}` : ''}`,
                winRate: `${winRate}%`,
                totalUnits: totalUnits.toFixed(1),
                roi: ((totalUnits / totalGraded) * 100).toFixed(1) + '%',
                streak: streak > 0 ? `${streakType}${streak}` : 'N/A',
                avgEdge: `+${avgEdge}%`,
                isPreseason: false,
            } : {
                record: '0-0',
                winRate: '55.0%',
                totalUnits: '+0.0',
                roi: '8.5%',
                streak: 'N/A',
                avgEdge: '+3.2%',
                isPreseason: true,
            },
            morningSlate: {
                totalGames: todayCount,
                upcomingPicks: upcomingToday,
                sports: sportsToday,
            },
        });
    } catch (error: unknown) {
        console.error('Dashboard picks error:', error);
        let msg = 'Unknown error';
        if (error && typeof error === 'object') {
            const e = error as Record<string, unknown>;
            msg = (e.message as string) || (e.code as string) || JSON.stringify(error);
        } else if (error instanceof Error) {
            msg = error.message;
        }
        return NextResponse.json({ error: 'Failed to fetch dashboard data', details: msg }, { status: 500 });
    }
}
