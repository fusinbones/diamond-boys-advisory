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

        const { data: picks, error } = await query;
        if (error) throw error;

        // ── Calculate KPIs from all graded picks ──
        const { data: allGraded, error: kpiError } = await supabase
            .from('picks')
            .select('status, units, sport, edge, created_at, game_date')
            .in('status', ['won', 'lost', 'push']);

        if (kpiError) throw kpiError;

        const gradedPicks = (allGraded || []) as Pick[];
        const wins = gradedPicks.filter((p) => p.status === 'won').length;
        const losses = gradedPicks.filter((p) => p.status === 'lost').length;
        const pushes = gradedPicks.filter((p) => p.status === 'push').length;
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
