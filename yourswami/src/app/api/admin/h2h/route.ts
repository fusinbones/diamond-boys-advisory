import { NextRequest, NextResponse } from 'next/server';
import { getMLBH2H } from '@/lib/mlb-stats';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const team1 = Number(searchParams.get('team1'));
        const team2 = Number(searchParams.get('team2'));
        const season = searchParams.get('season') ? Number(searchParams.get('season')) : undefined;

        if (!team1 || !team2) {
            return NextResponse.json({ error: 'team1 and team2 params required' }, { status: 400 });
        }

        const games = await getMLBH2H(team1, team2, season);

        // Summarize H2H
        let team1Wins = 0;
        let team2Wins = 0;
        for (const game of games) {
            if (game.status.short !== 'FT') continue;
            const homeWon = (game.scores.home.total ?? 0) > (game.scores.away.total ?? 0);
            if (game.teams.home.id === team1) {
                if (homeWon) team1Wins++;
                else team2Wins++;
            } else {
                if (homeWon) team2Wins++;
                else team1Wins++;
            }
        }

        return NextResponse.json({
            games,
            summary: { team1Wins, team2Wins, totalGames: games.filter(g => g.status.short === 'FT').length },
        });
    } catch (error) {
        console.error('Admin H2H API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch H2H' },
            { status: 500 }
        );
    }
}
