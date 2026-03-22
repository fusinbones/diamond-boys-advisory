import { NextResponse } from 'next/server';

const MLB_API = 'https://statsapi.mlb.com/api/v1';
const MLB_LOGO = (id: number) => `https://www.mlbstatic.com/team-logos/${id}.svg`;

interface TeamPattern {
    teamId: number;
    teamName: string;
    logo: string;
    division: string;
    recentResults: Array<{ date: string; result: 'W' | 'L'; opponent: string; score: string }>;
    pattern: string;
    altStreak: number;
    isAlternating: boolean;
    nextPrediction: 'W' | 'L' | null;
    predictionType: 'continue' | 'break' | null; // continue = pattern holds, break = pattern due to snap
    altScore: number;
}

// All 30 MLB teams
const MLB_TEAMS: Array<{ id: number; name: string; division: string }> = [
    // AL East
    { id: 147, name: 'Yankees', division: 'AL East' },
    { id: 111, name: 'Red Sox', division: 'AL East' },
    { id: 141, name: 'Blue Jays', division: 'AL East' },
    { id: 139, name: 'Rays', division: 'AL East' },
    { id: 110, name: 'Orioles', division: 'AL East' },
    // AL Central
    { id: 114, name: 'Guardians', division: 'AL Central' },
    { id: 142, name: 'Twins', division: 'AL Central' },
    { id: 116, name: 'Tigers', division: 'AL Central' },
    { id: 118, name: 'Royals', division: 'AL Central' },
    { id: 145, name: 'White Sox', division: 'AL Central' },
    // AL West
    { id: 117, name: 'Astros', division: 'AL West' },
    { id: 136, name: 'Mariners', division: 'AL West' },
    { id: 140, name: 'Rangers', division: 'AL West' },
    { id: 108, name: 'Angels', division: 'AL West' },
    { id: 133, name: 'Athletics', division: 'AL West' },
    // NL East
    { id: 144, name: 'Braves', division: 'NL East' },
    { id: 143, name: 'Phillies', division: 'NL East' },
    { id: 121, name: 'Mets', division: 'NL East' },
    { id: 120, name: 'Nationals', division: 'NL East' },
    { id: 146, name: 'Marlins', division: 'NL East' },
    // NL Central
    { id: 158, name: 'Brewers', division: 'NL Central' },
    { id: 112, name: 'Cubs', division: 'NL Central' },
    { id: 138, name: 'Cardinals', division: 'NL Central' },
    { id: 134, name: 'Pirates', division: 'NL Central' },
    { id: 113, name: 'Reds', division: 'NL Central' },
    // NL West
    { id: 119, name: 'Dodgers', division: 'NL West' },
    { id: 109, name: 'Diamondbacks', division: 'NL West' },
    { id: 135, name: 'Padres', division: 'NL West' },
    { id: 137, name: 'Giants', division: 'NL West' },
    { id: 115, name: 'Rockies', division: 'NL West' },
];

/**
 * Diamond Boys Alternation Break Algorithm
 *
 * TRUE alternating pattern = strictly LWLWLW or WLWLWL for 6+ games.
 * By game 7, the pattern BREAKS — the last result doubles.
 *
 * Examples:
 *   LWLWLW → game 7 = (W) → LWLWLW(W)
 *   WLWLWL → game 7 = (L) → WLWLWL(L)
 *
 * Anything less than 6 strict games is NOT a true pattern.
 */
function analyzeAlternation(results: Array<{ result: 'W' | 'L' }>): {
    altStreak: number;
    isAlternating: boolean;
    nextPrediction: 'W' | 'L' | null;
    predictionType: 'continue' | 'break' | null;
    altScore: number;
} {
    if (results.length < 2) return { altStreak: 0, isAlternating: false, nextPrediction: null, predictionType: null, altScore: 0 };

    const last = results[0].result;
    const secondLast = results[1].result;
    const currentlyAlternating = last !== secondLast;

    // Count the CURRENT live alternating streak from most recent backwards
    let altStreak = 0;
    if (currentlyAlternating) {
        altStreak = 1;
        for (let i = 1; i < results.length; i++) {
            if (results[i].result !== results[i - 1].result) {
                altStreak++;
            } else {
                break;
            }
        }
    }

    // TRUE alternating = 6+ strict games. Anything less is NOT a pattern.
    const isAlternating = altStreak >= 6;

    // Break probability: only kicks in at 6+
    let altScore = 0;
    if (altStreak >= 8) altScore = 99;
    else if (altStreak === 7) altScore = 95;
    else if (altStreak === 6) altScore = 85;

    // Prediction: always BREAK — the last result doubles
    // LWLWLW → (W), WLWLWL → (L)
    let nextPrediction: 'W' | 'L' | null = null;
    let predictionType: 'continue' | 'break' | null = null;

    if (isAlternating) {
        nextPrediction = last; // same as last = the double/break
        predictionType = 'break';
    }

    return { altStreak, isAlternating, nextPrediction, predictionType, altScore };
}

export async function GET() {
    try {
        const today = new Date().toISOString().split('T')[0];
        // Get games from last 14 days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 14);
        const start = startDate.toISOString().split('T')[0];

        // Fetch schedule with scores for all teams
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scheduleRes = await fetch(
            `${MLB_API}/schedule?sportId=1&startDate=${start}&endDate=${today}&hydrate=linescore,team`,
            { next: { revalidate: 1800 } }
        );
        if (!scheduleRes.ok) throw new Error(`MLB API error: ${scheduleRes.status}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scheduleData: any = await scheduleRes.json();

        // Build per-team game results
        const teamResults: Record<number, Array<{ date: string; result: 'W' | 'L'; opponent: string; score: string }>> = {};

        for (const date of scheduleData.dates || []) {
            for (const game of date.games || []) {
                const status = game.status?.abstractGameState;
                if (status !== 'Final') continue;

                const homeId = game.teams?.home?.team?.id;
                const awayId = game.teams?.away?.team?.id;
                const homeRuns = game.teams?.home?.score ?? game.linescore?.teams?.home?.runs ?? 0;
                const awayRuns = game.teams?.away?.score ?? game.linescore?.teams?.away?.runs ?? 0;
                const homeName = game.teams?.home?.team?.name || 'Unknown';
                const awayName = game.teams?.away?.team?.name || 'Unknown';
                const gameDate = game.officialDate || date.date;

                if (homeId) {
                    if (!teamResults[homeId]) teamResults[homeId] = [];
                    teamResults[homeId].push({
                        date: gameDate,
                        result: homeRuns > awayRuns ? 'W' : 'L',
                        opponent: awayName,
                        score: `${homeRuns}-${awayRuns}`,
                    });
                }
                if (awayId) {
                    if (!teamResults[awayId]) teamResults[awayId] = [];
                    teamResults[awayId].push({
                        date: gameDate,
                        result: awayRuns > homeRuns ? 'W' : 'L',
                        opponent: `@ ${homeName}`,
                        score: `${awayRuns}-${homeRuns}`,
                    });
                }
            }
        }

        // Build team patterns
        const patterns: TeamPattern[] = MLB_TEAMS.map(team => {
            const games = (teamResults[team.id] || [])
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10);

            const { altStreak, isAlternating, nextPrediction, predictionType, altScore } = analyzeAlternation(games);

            return {
                teamId: team.id,
                teamName: team.name,
                logo: MLB_LOGO(team.id),
                division: team.division,
                recentResults: games,
                pattern: games.map(g => g.result).join('-'),
                altStreak,
                isAlternating,
                nextPrediction,
                predictionType,
                altScore,
            };
        });

        // Sort: alternating teams first, then by altScore
        patterns.sort((a, b) => {
            if (a.isAlternating && !b.isAlternating) return -1;
            if (!a.isAlternating && b.isAlternating) return 1;
            return b.altScore - a.altScore;
        });

        // Today's games for cross-reference
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const todayRes = await fetch(
            `${MLB_API}/schedule?sportId=1&date=${today}&hydrate=team`,
            { next: { revalidate: 1800 } }
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const todayData: any = await todayRes.json();
        const todayTeamIds = new Set<number>();
        for (const date of todayData.dates || []) {
            for (const game of date.games || []) {
                if (game.teams?.home?.team?.id) todayTeamIds.add(game.teams.home.team.id);
                if (game.teams?.away?.team?.id) todayTeamIds.add(game.teams.away.team.id);
            }
        }

        return NextResponse.json({
            patterns,
            todayTeamIds: Array.from(todayTeamIds),
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Alternation patterns error:', error);
        return NextResponse.json({ patterns: [], todayTeamIds: [], error: 'Failed to fetch patterns' }, { status: 500 });
    }
}
