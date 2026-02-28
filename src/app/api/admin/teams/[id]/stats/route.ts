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

        // ═══ Fetch multi-season data for alternation analysis ═══
        // Always get current season + previous season(s) for deep history
        const currentYear = new Date().getFullYear();
        const seasonsToFetch = [currentYear]; // Always current year
        if (currentYear - 1 >= 2024) seasonsToFetch.push(currentYear - 1); // 2025
        if (currentYear - 2 >= 2024) seasonsToFetch.push(currentYear - 2); // 2024

        // Fetch stats for current context
        let stats = await getMLBTeamStats(teamId, season, gameType).catch(() => null);

        // Fetch games across all seasons (regular + spring training)
        const allGamesPromises = seasonsToFetch.map(async (yr) => {
            const types = yr === currentYear ? (gameType === 'S' ? 'S' : 'R,S') : 'R';
            return getMLBTeamGames(teamId, yr, types).catch(() => []);
        });

        const allSeasonGames = await Promise.all(allGamesPromises);
        let allGames = allSeasonGames.flat();

        // If no stats for current season, fallback to previous
        let fallbackSeason: number | null = null;
        if (!stats) {
            for (const yr of seasonsToFetch.slice(1)) {
                const fbStats = await getMLBTeamStats(teamId, yr, 'R').catch(() => null);
                if (fbStats) {
                    stats = fbStats;
                    fallbackSeason = yr;
                    break;
                }
            }
        }

        // If no games at all for current season, try spring training
        const currentSeasonGames = allGames.filter(g => {
            const gYear = new Date(g.date).getFullYear();
            return gYear === currentYear;
        });
        if (currentSeasonGames.filter(g => g.status.short === 'FT').length === 0 && gameType !== 'S') {
            const stGames = await getMLBTeamGames(teamId, currentYear, 'S').catch(() => []);
            if (stGames.length > 0) {
                allGames = [...stGames, ...allGames];
                const stStats = await getMLBTeamStats(teamId, currentYear, 'S').catch(() => null);
                if (stStats) stats = stStats;
            }
        }

        // ═══ Derive streak data from ALL finished games ═══
        const finishedGames = allGames
            .filter(g => g.status.short === 'FT')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Remove duplicates (same game could appear in multiple fetches)
        const seen = new Set<number>();
        const uniqueFinished = finishedGames.filter(g => {
            if (seen.has(g.id)) return false;
            seen.add(g.id);
            return true;
        });

        // Map to streak data — enough for 13-game alternation analysis + context
        const streakData = uniqueFinished.slice(0, 30).map(g => {
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
                season: new Date(g.date).getFullYear(),
            };
        });

        // ═══ Alternation Pattern Analysis (up to 13 games) ═══
        const ALTERNATION_WINDOW = 13;
        const resultSequence = streakData.map(g => g.result).reverse(); // oldest → newest
        const recentResults = resultSequence.slice(-ALTERNATION_WINDOW); // last 13

        // Count alternations in the window
        let altCount = 0;
        for (let i = 1; i < recentResults.length; i++) {
            if (recentResults[i] !== recentResults[i - 1]) altCount++;
        }
        const altPercentage = recentResults.length > 1 ? Math.round((altCount / (recentResults.length - 1)) * 100) : 0;

        // Find longest alternating streak within the window
        let longestAltRun = 0;
        let currentAltRun = 0;
        for (let i = 1; i < recentResults.length; i++) {
            if (recentResults[i] !== recentResults[i - 1]) {
                currentAltRun++;
                longestAltRun = Math.max(longestAltRun, currentAltRun);
            } else {
                currentAltRun = 0;
            }
        }

        // Current alternating streak (from most recent game backwards)
        let currentAltStreak = 0;
        const reversed = [...recentResults].reverse(); // newest first
        for (let i = 1; i < reversed.length; i++) {
            if (reversed[i] !== reversed[i - 1]) {
                currentAltStreak++;
            } else {
                break;
            }
        }

        // Current same-result streak  
        let currentStreak = streakData.length > 0 ? 1 : 0;
        const currentResult = streakData[0]?.result || '';
        for (let i = 1; i < streakData.length; i++) {
            if (streakData[i].result === currentResult) currentStreak++;
            else break;
        }

        // Predict next result based on alternation pattern
        const lastResult = recentResults[recentResults.length - 1] || '';
        const predictedNext = lastResult === 'W' ? 'L' : 'W';
        const isCurrentlyAlternating = currentAltStreak >= 2;

        // All-time alternation from all available data 
        const allResults = streakData.map(g => g.result).reverse();
        let allAltCount = 0;
        for (let i = 1; i < allResults.length; i++) {
            if (allResults[i] !== allResults[i - 1]) allAltCount++;
        }
        const overallAltPct = allResults.length > 1 ? Math.round((allAltCount / (allResults.length - 1)) * 100) : 0;

        return NextResponse.json({
            stats,
            streakData,
            streakInfo: {
                sequence: resultSequence.join(''),
                altPercentage,
                currentStreak,
                currentResult,
                gamesAnalyzed: recentResults.length,
                totalGamesAvailable: streakData.length,
                // New alternation-specific fields
                alternationWindow: ALTERNATION_WINDOW,
                longestAltRun,
                currentAltStreak,
                predictedNext,
                isCurrentlyAlternating,
                overallAltPct,
                recentSequence: recentResults.join(''),
            },
            totalGames: uniqueFinished.length,
            fallbackSeason,
            seasonsIncluded: [...new Set(streakData.map(g => g.season))],
        });
    } catch (error) {
        console.error('Admin team stats API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch team stats' },
            { status: 500 }
        );
    }
}
