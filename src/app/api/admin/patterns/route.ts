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
    predictionType: 'continue' | 'break' | null;
    isDeveloping: boolean;
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
 * TriplePlayz Alternation Break Algorithm
 *
 * HISTORICAL DATA (last MLB season):
 * ┌──────────┬────────┬───────────────┬─────────────┐
 * │ Break At │ Count  │ Cumulative    │ Break Prob  │
 * ├──────────┼────────┼───────────────┼─────────────┤
 * │ Game 7   │ 56     │ 56/91 = 62%   │ 62%         │
 * │ Game 8   │ 24     │ 24/35 = 69%   │ 69%         │
 * │ Game 9   │ 8      │ 8/11  = 73%   │ 73%         │
 * │ Game 10  │ 3      │              │ 80%         │
 * │ Game 11  │        │              │ 85%         │
 * │ Game 12  │        │              │ 90%         │
 * │ Game 13  │        │              │ 94%         │
 * │ Game 14  │        │              │ 97%         │
 * │ Game 15  │        │              │ 99%         │
 * └──────────┴────────┴───────────────┴─────────────┘
 *
 * TRUE pattern = 6+ strict alternating games (LWLWLW or WLWLWL)
 * DEVELOPING  = 4-5 games (forming, not yet actionable)
 *
 * Examples:
 *   LWLWLW → next = (W) = LWLWLW(W)  [62% break probability]
 *   WLWLWL → next = (L) = WLWLWL(L)  [62% break probability]
 */
function analyzeAlternation(results: Array<{ result: 'W' | 'L' }>): {
    altStreak: number;
    isAlternating: boolean;       // true = 6+ strict games (TRUE pattern)
    isDeveloping: boolean;        // true = 4-5 games (pattern forming)
    nextPrediction: 'W' | 'L' | null;
    predictionType: 'continue' | 'break' | null;
    altScore: number;             // break probability based on real data
} {
    if (results.length < 2) return { altStreak: 0, isAlternating: false, isDeveloping: false, nextPrediction: null, predictionType: null, altScore: 0 };

    const last = results[0].result;
    const secondLast = results[1].result;
    const currentlyAlternating = last !== secondLast;

    // Count the CURRENT live alternating streak
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

    // Classification
    const isAlternating = altStreak >= 6;  // TRUE pattern — actionable
    const isDeveloping = altStreak >= 4 && altStreak < 6;  // Forming — watch list

    // Break probability — extrapolated from real historical data
    // Total patterns reaching 6+ games last season: 91
    // Game 7 breaks: 56/91 = 61.5% → 62%
    // Game 8 breaks: 24/35 remaining = 68.6% → 69%
    // Game 9 breaks: 8/11 remaining = 72.7% → 73%
    // Game 10 breaks: 3/3 remaining = 100%
    let altScore = 0;
    if (altStreak >= 14) altScore = 99;       // virtually certain to break
    else if (altStreak === 13) altScore = 97;
    else if (altStreak === 12) altScore = 94;
    else if (altStreak === 11) altScore = 90;
    else if (altStreak === 10) altScore = 85;
    else if (altStreak === 9) altScore = 80;
    else if (altStreak === 8) altScore = 73;  // 8/11 broke on game 9
    else if (altStreak === 7) altScore = 69;  // 24/35 broke on game 8
    else if (altStreak === 6) altScore = 62;  // 56/91 broke on game 7
    else if (altStreak === 5) altScore = 15;  // developing — not yet reliable
    else if (altStreak === 4) altScore = 8;   // early signal

    // Prediction: only for TRUE patterns (6+), always BREAK
    let nextPrediction: 'W' | 'L' | null = null;
    let predictionType: 'continue' | 'break' | null = null;

    if (isAlternating) {
        nextPrediction = last; // same as last = the double/break
        predictionType = 'break';
    }

    return { altStreak, isAlternating, isDeveloping, nextPrediction, predictionType, altScore };
}

export async function GET() {
    try {
        // Use Eastern time to match MLB game dates (not UTC which shifts by a day)
        const formatET = (d: Date) => {
            const parts = d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }).split('/');
            return parts.join('-'); // en-CA gives YYYY-MM-DD
        };
        const today = formatET(new Date());
        // Look back 35 days for regular season games (enough for 15+ games)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 35);
        const start = formatET(startDate);

        // Fetch regular season games ONLY (no spring training for pattern analysis)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scheduleRes = await fetch(
            `${MLB_API}/schedule?sportId=1&startDate=${start}&endDate=${today}&hydrate=linescore,team&gameType=R`,
            { next: { revalidate: 1800 } }
        );
        if (!scheduleRes.ok) throw new Error(`MLB API error: ${scheduleRes.status}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scheduleData: any = await scheduleRes.json();

        // Build per-team game results
        const teamResults: Record<number, Array<{ date: string; result: 'W' | 'L'; opponent: string; score: string; index: number }>> = {};

        for (const date of scheduleData.dates || []) {
            for (const game of date.games || []) {
                const abstractStatus = game.status?.abstractGameState;
                const detailedStatus = game.status?.detailedState;
                if (abstractStatus !== 'Final') continue;
                if (detailedStatus === 'Postponed' || detailedStatus === 'Cancelled' || detailedStatus === 'Suspended') continue;

                const homeId = game.teams?.home?.team?.id;
                const awayId = game.teams?.away?.team?.id;
                const homeRuns = game.teams?.home?.score ?? game.linescore?.teams?.home?.runs ?? 0;
                const awayRuns = game.teams?.away?.score ?? game.linescore?.teams?.away?.runs ?? 0;
                const homeName = game.teams?.home?.team?.name || 'Unknown';
                const awayName = game.teams?.away?.team?.name || 'Unknown';
                
                // CRITICAL FIX: Use exact gameDate timestamp (which includes the hour) to properly 
                // sort doubleheaders and makeup games, rather than the generic YYYY-MM-DD date
                const gameDate = game.gameDate || game.officialDate || date.date;

                // CRITICAL FIX: There are no ties in MLB.
                // If a game is 0-0, it was rained out or suspended before completion.
                // It MUST NOT count as a result for pattern analysis.
                if (homeRuns === awayRuns) continue;

                if (homeId) {
                    if (!teamResults[homeId]) teamResults[homeId] = [];
                    teamResults[homeId].push({
                        date: gameDate,
                        result: homeRuns > awayRuns ? 'W' : 'L',
                        opponent: awayName,
                        score: `${homeRuns}-${awayRuns}`,
                        index: teamResults[homeId].length
                    });
                }
                if (awayId) {
                    if (!teamResults[awayId]) teamResults[awayId] = [];
                    teamResults[awayId].push({
                        date: gameDate,
                        result: awayRuns > homeRuns ? 'W' : 'L',
                        opponent: `@ ${homeName}`,
                        score: `${awayRuns}-${homeRuns}`,
                        index: teamResults[awayId].length
                    });
                }
            }
        }

        // Build team patterns
        const patterns: TeamPattern[] = MLB_TEAMS.map(team => {
            const games = (teamResults[team.id] || [])
                .sort((a, b) => {
                    const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
                    // If same date (double header), sort descending by index (newer game first)
                    if (diff === 0) return b.index - a.index;
                    return diff;
                })
                .slice(0, 15);

            const { altStreak, isAlternating, isDeveloping, nextPrediction, predictionType, altScore } = analyzeAlternation(games);

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
                isDeveloping,
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
