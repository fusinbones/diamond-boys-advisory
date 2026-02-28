import { NextRequest, NextResponse } from 'next/server';
import { getMLBTeamStats, getMLBTeamGames } from '@/lib/mlb-stats';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const teamId = Number(id);
        const { searchParams } = request.nextUrl;
        const season = Number(searchParams.get('season')) || new Date().getFullYear();
        const league = Number(searchParams.get('league')) || 1;

        // Determine gameType from league
        const gameType = league === 71 ? 'S' : 'R';

        // Try current season first
        let [stats, games] = await Promise.all([
            getMLBTeamStats(teamId, season, gameType).catch(() => null),
            getMLBTeamGames(teamId, season, gameType === 'S' ? 'S' : 'R,S').catch(() => []),
        ]);

        // If no games found for this season, try previous season with regular season
        let fallbackSeason: number | null = null;
        if (games.length === 0 || games.filter(g => g.status.short === 'FT').length === 0) {
            const prevSeason = season - 1;
            const [fbStats, fbGames] = await Promise.all([
                getMLBTeamStats(teamId, prevSeason, 'R').catch(() => null),
                getMLBTeamGames(teamId, prevSeason, 'R').catch(() => []),
            ]);
            if (fbGames.length > 0) {
                stats = fbStats;
                games = fbGames;
                fallbackSeason = prevSeason;
            }
        }

        // Also try Spring Training if regular season returned no games
        if (games.length === 0 || games.filter(g => g.status.short === 'FT').length === 0) {
            if (gameType !== 'S') {
                const stGames = await getMLBTeamGames(teamId, season, 'S').catch(() => []);
                if (stGames.length > 0) {
                    games = stGames;
                    const stStats = await getMLBTeamStats(teamId, season, 'S').catch(() => null);
                    if (stStats) stats = stStats;
                    fallbackSeason = null;
                }
            }
        }

        // Derive streak data from games
        const finishedGames = games
            .filter(g => g.status.short === 'FT')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const streakData = finishedGames.slice(0, 20).map(g => {
            const isHome = g.teams.home.id === teamId;
            const teamScore = isHome ? g.scores.home.total : g.scores.away.total;
            const oppScore = isHome ? g.scores.away.total : g.scores.home.total;
            return {
                gameId: g.id,
                date: g.date,
                opponent: isHome ? g.teams.away.name : g.teams.home.name,
                opponentLogo: isHome ? g.teams.away.logo : g.teams.home.logo,
                isHome,
                teamScore: teamScore ?? 0,
                oppScore: oppScore ?? 0,
                result: (teamScore ?? 0) > (oppScore ?? 0) ? 'W' : 'L',
            };
        });

        // Calculate alt streak info
        const resultSequence = streakData.map(g => g.result).reverse();
        let altCount = 0;
        for (let i = 1; i < resultSequence.length; i++) {
            if (resultSequence[i] !== resultSequence[i - 1]) altCount++;
        }
        const altPercentage = resultSequence.length > 1 ? Math.round((altCount / (resultSequence.length - 1)) * 100) : 0;

        // Current streak
        let currentStreak = streakData.length > 0 ? 1 : 0;
        const currentResult = streakData[0]?.result || '';
        for (let i = 1; i < streakData.length; i++) {
            if (streakData[i].result === currentResult) currentStreak++;
            else break;
        }

        return NextResponse.json({
            stats,
            streakData,
            streakInfo: {
                sequence: resultSequence.join(''),
                altPercentage,
                currentStreak,
                currentResult,
                gamesAnalyzed: streakData.length,
            },
            totalGames: finishedGames.length,
            fallbackSeason,
        });
    } catch (error) {
        console.error('Admin team stats API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch team stats' },
            { status: 500 }
        );
    }
}
