import { NextResponse } from 'next/server';
import { getMLBGames } from '@/lib/mlb-stats';

// Public endpoint — no auth required
// Returns today's MLB games in simplified format for the landing page ticker
export async function GET() {
    try {
        const { games } = await getMLBGames();

        // Return simplified game objects for the public ticker
        const tickerGames = games.map(g => ({
            id: g.id,
            status: g.status,
            away: {
                name: g.teams.away.name,
                logo: g.teams.away.logo,
                score: g.scores.away.total,
            },
            home: {
                name: g.teams.home.name,
                logo: g.teams.home.logo,
                score: g.scores.home.total,
            },
            league: g.league.name,
            time: g.time,
        }));

        return NextResponse.json(
            { games: tickerGames },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
                },
            }
        );
    } catch (error) {
        console.error('Public games API error:', error);
        return NextResponse.json({ games: [] }, { status: 200 });
    }
}
