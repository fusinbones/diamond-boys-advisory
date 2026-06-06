import { NextResponse } from 'next/server';

const MLB_API = 'https://statsapi.mlb.com/api/v1';
const MLB_LOGO = (id: number) => `https://www.mlbstatic.com/team-logos/${id}.svg`;

interface PitcherMilestone {
    pitcherName: string;
    currentWins: number;
    targetWin: number;
}

interface WalkoffRevenge {
    walkoffTeam: string;
    losingTeam: string;
    walkoffPlayer?: string;
    score: string;
    date: string;
    isWalkoffTeam: boolean;
}

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
    pitcherMilestone: PitcherMilestone | null;
    walkoffRevenge: WalkoffRevenge | null;
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
 * Same logic as the admin version — no degradation.
 */
function analyzeAlternation(results: Array<{ result: 'W' | 'L' }>): {
    altStreak: number;
    isAlternating: boolean;
    isDeveloping: boolean;
    nextPrediction: 'W' | 'L' | null;
    predictionType: 'continue' | 'break' | null;
    altScore: number;
} {
    if (results.length < 2) return { altStreak: 0, isAlternating: false, isDeveloping: false, nextPrediction: null, predictionType: null, altScore: 0 };

    const last = results[0].result;
    const secondLast = results[1].result;
    const currentlyAlternating = last !== secondLast;

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

    const isAlternating = altStreak >= 6;
    const isDeveloping = altStreak >= 4 && altStreak < 6;

    let altScore = 0;
    if (altStreak >= 14) altScore = 99;
    else if (altStreak === 13) altScore = 97;
    else if (altStreak === 12) altScore = 94;
    else if (altStreak === 11) altScore = 90;
    else if (altStreak === 10) altScore = 85;
    else if (altStreak === 9) altScore = 80;
    else if (altStreak === 8) altScore = 73;
    else if (altStreak === 7) altScore = 69;
    else if (altStreak === 6) altScore = 62;
    else if (altStreak === 5) altScore = 15;
    else if (altStreak === 4) altScore = 8;

    let nextPrediction: 'W' | 'L' | null = null;
    let predictionType: 'continue' | 'break' | null = null;

    if (isAlternating) {
        nextPrediction = last;
        predictionType = 'break';
    }

    return { altStreak, isAlternating, isDeveloping, nextPrediction, predictionType, altScore };
}

/**
 * GET /api/patterns — Public endpoint for the member-facing pattern system.
 * Returns the same data as /api/admin/patterns but without admin auth.
 * Access gating is done on the frontend (subscription check).
 */
export async function GET() {
    try {
        const formatET = (d: Date) => {
            const parts = d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }).split('/');
            return parts.join('-');
        };
        const today = formatET(new Date());
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 35);
        const start = formatET(startDate);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scheduleRes = await fetch(
            `${MLB_API}/schedule?sportId=1&startDate=${start}&endDate=${today}&hydrate=linescore,team&gameType=R`,
            { next: { revalidate: 1800 } }
        );
        if (!scheduleRes.ok) throw new Error(`MLB API error: ${scheduleRes.status}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scheduleData: any = await scheduleRes.json();

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
                const gameDate = game.gameDate || game.officialDate || date.date;

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

        const patterns = MLB_TEAMS.map(team => {
            const games = (teamResults[team.id] || [])
                .sort((a, b) => {
                    const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
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

        patterns.sort((a, b) => {
            if (a.isAlternating && !b.isAlternating) return -1;
            if (!a.isAlternating && b.isAlternating) return 1;
            return b.altScore - a.altScore;
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const todayRes = await fetch(
            `${MLB_API}/schedule?sportId=1&date=${today}&hydrate=probablePitcher,team`,
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

        // --- Pitcher Going for 10th Win detection ---
        const pitcherMilestones = new Map<number, PitcherMilestone>();
        for (const date of todayData.dates || []) {
            for (const game of date.games || []) {
                const sides: Array<{ teamId: number | undefined; pitcher: { id?: number; fullName?: string } | undefined }> = [
                    { teamId: game.teams?.home?.team?.id, pitcher: game.teams?.home?.probablePitcher },
                    { teamId: game.teams?.away?.team?.id, pitcher: game.teams?.away?.probablePitcher },
                ];
                for (const side of sides) {
                    const pitcherId = side.pitcher?.id;
                    const teamId = side.teamId;
                    if (!pitcherId || !teamId) continue;
                    try {
                        const pitcherRes = await fetch(
                            `${MLB_API}/people/${pitcherId}?hydrate=stats(group=[pitching],type=[season])`,
                            { next: { revalidate: 1800 } }
                        );
                        if (!pitcherRes.ok) continue;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const pitcherData: any = await pitcherRes.json();
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const person: any = pitcherData.people?.[0];
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const stat: any = person?.stats?.[0]?.splits?.[0]?.stat;
                        if (stat && stat.wins === 9) {
                            pitcherMilestones.set(teamId, {
                                pitcherName: person.fullName || side.pitcher?.fullName || 'Unknown',
                                currentWins: 9,
                                targetWin: 10,
                            });
                        }
                    } catch {
                        continue;
                    }
                }
            }
        }

        // --- Walk-off HR Revenge Game detection ---
        const walkoffRevengeMap = new Map<number, WalkoffRevenge>();
        const yesterday = formatET(new Date(Date.now() - 86400000));
        const todayMatchups: Array<{ homeId: number; awayId: number }> = [];
        for (const date of todayData.dates || []) {
            for (const game of date.games || []) {
                const hId = game.teams?.home?.team?.id as number | undefined;
                const aId = game.teams?.away?.team?.id as number | undefined;
                if (hId && aId) todayMatchups.push({ homeId: hId, awayId: aId });
            }
        }
        for (const date of scheduleData.dates || []) {
            if (date.date !== yesterday) continue;
            for (const game of date.games || []) {
                const abstractStatus = game.status?.abstractGameState;
                if (abstractStatus !== 'Final') continue;
                const homeId = game.teams?.home?.team?.id as number | undefined;
                const awayId = game.teams?.away?.team?.id as number | undefined;
                const homeRuns = game.teams?.home?.score ?? game.linescore?.teams?.home?.runs ?? 0;
                const awayRuns = game.teams?.away?.score ?? game.linescore?.teams?.away?.runs ?? 0;
                if (!homeId || !awayId || homeRuns <= awayRuns) continue;
                // Home team won — check if they play each other today
                const rematch = todayMatchups.find(
                    m => (m.homeId === homeId && m.awayId === awayId) ||
                         (m.homeId === awayId && m.awayId === homeId)
                );
                if (!rematch) continue;
                try {
                    const feedRes = await fetch(
                        `${MLB_API}/game/${game.gamePk}/feed/live`,
                        { next: { revalidate: 86400 } }
                    );
                    if (!feedRes.ok) continue;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const feedData: any = await feedRes.json();
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const allPlays: any[] = feedData.liveData?.plays?.allPlays || [];
                    const scoringPlays: number[] = feedData.liveData?.plays?.scoringPlays || [];
                    if (scoringPlays.length === 0) continue;
                    const lastScoringPlay = allPlays[scoringPlays[scoringPlays.length - 1]];
                    if (!lastScoringPlay) continue;
                    const event = lastScoringPlay.result?.event;
                    const halfInning = lastScoringPlay.about?.halfInning;
                    const inning = lastScoringPlay.about?.inning;
                    if (event === 'Home Run' && halfInning === 'bottom' && inning >= 9) {
                        const walkoffPlayerName = lastScoringPlay.matchup?.batter?.fullName;
                        const homeName = game.teams?.home?.team?.name || 'Unknown';
                        const awayName = game.teams?.away?.team?.name || 'Unknown';
                        const score = `${homeRuns}-${awayRuns}`;
                        walkoffRevengeMap.set(homeId, {
                            walkoffTeam: homeName,
                            losingTeam: awayName,
                            walkoffPlayer: walkoffPlayerName,
                            score,
                            date: yesterday,
                            isWalkoffTeam: true,
                        });
                        walkoffRevengeMap.set(awayId, {
                            walkoffTeam: homeName,
                            losingTeam: awayName,
                            walkoffPlayer: walkoffPlayerName,
                            score,
                            date: yesterday,
                            isWalkoffTeam: false,
                        });
                    }
                } catch {
                    continue;
                }
            }
        }

        const enhancedPatterns = patterns.map(team => ({
            ...team,
            pitcherMilestone: pitcherMilestones.get(team.teamId) || null,
            walkoffRevenge: walkoffRevengeMap.get(team.teamId) || null,
        }));

        return NextResponse.json({
            patterns: enhancedPatterns,
            todayTeamIds: Array.from(todayTeamIds),
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Patterns API error:', error);
        return NextResponse.json({ patterns: [], todayTeamIds: [], error: 'Failed to fetch patterns' }, { status: 500 });
    }
}
