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
        // Fetch up to 5 years of history for deep alternation analysis
        const seasonsToFetch: number[] = [];
        for (let yr = currentYear; yr >= currentYear - 5 && yr >= 2021; yr--) {
            seasonsToFetch.push(yr);
        }

        // Fetch stats for current context
        let stats = await getMLBTeamStats(teamId, season, gameType).catch(() => null);

        // Fetch games across seasons (regular season only — spring training excluded)
        const allGamesPromises = seasonsToFetch.map(async (yr) => {
            return getMLBTeamGames(teamId, yr, 'R').catch(() => []);
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

        // Regular season: if no games yet, that's expected early season — don't fall back to spring training

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

        // Map ALL finished games for frontend filtering by year
        const streakData = uniqueFinished.map(g => {
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

        // Compute W/L results for ALL historical games (for overall alt%)
        const allHistoricalResults = uniqueFinished.map(g => {
            const isHome = g.teams.home.id === teamId;
            const teamScore = isHome ? g.scores.home.total : g.scores.away.total;
            const oppScore = isHome ? g.scores.away.total : g.scores.home.total;
            return {
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

        // ═══ Overall all-time alternation from ALL historical games ═══
        const allResults = allHistoricalResults.map(g => g.result).reverse(); // oldest → newest
        let allAltCount = 0;
        for (let i = 1; i < allResults.length; i++) {
            if (allResults[i] !== allResults[i - 1]) allAltCount++;
        }
        const overallAltPct = allResults.length > 1 ? Math.round((allAltCount / (allResults.length - 1)) * 100) : 0;

        // Per-season Alt% breakdown
        const seasonBreakdown: Record<number, { games: number; wins: number; losses: number; altPct: number }> = {};
        const groupedBySeason = new Map<number, string[]>();
        for (const g of allHistoricalResults) {
            if (!groupedBySeason.has(g.season)) groupedBySeason.set(g.season, []);
            groupedBySeason.get(g.season)!.push(g.result);
        }
        for (const [yr, results] of groupedBySeason.entries()) {
            const ordered = results.reverse(); // oldest first within season
            let sAltCount = 0;
            for (let i = 1; i < ordered.length; i++) {
                if (ordered[i] !== ordered[i - 1]) sAltCount++;
            }
            seasonBreakdown[yr] = {
                games: results.length,
                wins: results.filter(r => r === 'W').length,
                losses: results.filter(r => r === 'L').length,
                altPct: results.length > 1 ? Math.round((sAltCount / (results.length - 1)) * 100) : 0,
            };
        }

        return NextResponse.json({
            stats,
            streakData,
            streakInfo: {
                sequence: resultSequence.join(''),
                altPercentage,
                currentStreak,
                currentResult,
                gamesAnalyzed: recentResults.length,
                totalGamesAvailable: uniqueFinished.length,
                // Alternation-specific fields
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
            seasonBreakdown,
        });
    } catch (error) {
        console.error('Admin team stats API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch team stats' },
            { status: 500 }
        );
    }
}
