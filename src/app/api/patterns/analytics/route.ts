import { NextResponse } from 'next/server';

const MLB_API = 'https://statsapi.mlb.com/api/v1';

interface GameRecord {
    result: 'W' | 'L';
    isHome: boolean;
    date: string;
}

interface BreakEvent {
    altStreak: number;
    isHome: boolean;
    year: number;
    broke: boolean;
}

interface RateBucket {
    total: number;
    breaks: number;
    rate: number;
}

interface GameBucket extends RateBucket {
    game: number;
}

interface SeasonBucket extends RateBucket {
    year: number;
}

interface CurrentSeasonData extends RateBucket {
    year: number;
    byGame: GameBucket[];
}

interface AnalyticsResponse {
    byGame: GameBucket[];
    byLocation: { home: RateBucket; away: RateBucket };
    bySeason: SeasonBucket[];
    currentSeason: CurrentSeasonData;
    topBreakGame: number;
    topLocation: 'home' | 'away';
    totalEvents: number;
    overallRate: number;
}

/**
 * Fetch one season of MLB data and extract all break events
 */
async function fetchSeasonBreakEvents(year: number): Promise<BreakEvent[]> {
    const startDate = `${year}-03-20`;
    const endDate = `${year}-10-01`;

    const res = await fetch(
        `${MLB_API}/schedule?sportId=1&startDate=${startDate}&endDate=${endDate}&hydrate=linescore,team&gameType=R`,
        { next: { revalidate: 86400 } }
    );

    if (!res.ok) {
        console.error(`MLB API error for ${year}: ${res.status}`);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();

    // Build per-team chronological game results
    const teamGames: Record<number, GameRecord[]> = {};

    for (const dateEntry of data.dates || []) {
        for (const game of dateEntry.games || []) {
            const abstractStatus = game.status?.abstractGameState;
            const detailedStatus = game.status?.detailedState;
            if (abstractStatus !== 'Final') continue;
            if (detailedStatus === 'Postponed' || detailedStatus === 'Cancelled' || detailedStatus === 'Suspended') continue;

            const homeId = game.teams?.home?.team?.id as number | undefined;
            const awayId = game.teams?.away?.team?.id as number | undefined;
            const homeRuns = game.teams?.home?.score ?? game.linescore?.teams?.home?.runs ?? 0;
            const awayRuns = game.teams?.away?.score ?? game.linescore?.teams?.away?.runs ?? 0;
            const gameDate = (game.officialDate || dateEntry.date || game.gameDate || '') as string;

            if (homeRuns === awayRuns) continue;

            if (homeId) {
                if (!teamGames[homeId]) teamGames[homeId] = [];
                teamGames[homeId].push({
                    result: homeRuns > awayRuns ? 'W' : 'L',
                    isHome: true,
                    date: gameDate,
                });
            }
            if (awayId) {
                if (!teamGames[awayId]) teamGames[awayId] = [];
                teamGames[awayId].push({
                    result: awayRuns > homeRuns ? 'W' : 'L',
                    isHome: false,
                    date: gameDate,
                });
            }
        }
    }

    // For each team, detect alternation streaks and break events
    const events: BreakEvent[] = [];

    for (const teamId of Object.keys(teamGames)) {
        const games = teamGames[Number(teamId)].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        for (let i = 1; i < games.length - 1; i++) {
            // Count alternation streak ending at position i
            let altStreak = 0;
            if (games[i].result !== games[i - 1].result) {
                altStreak = 1;
                for (let j = i; j >= 1; j--) {
                    if (games[j].result !== games[j - 1].result) {
                        altStreak++;
                    } else {
                        break;
                    }
                }
            }

            if (altStreak < 4) continue;

            // The prediction is: pattern breaks (same result as current)
            const prediction = games[i].result;
            const nextGame = games[i + 1];
            const broke = prediction === nextGame.result;

            events.push({
                altStreak,
                isHome: nextGame.isHome,
                year,
                broke,
            });
        }
    }

    return events;
}

function computeRate(total: number, breaks: number): number {
    return total === 0 ? 0 : Math.round((breaks / total) * 1000) / 10;
}

export async function GET(): Promise<NextResponse<AnalyticsResponse | { error: string }>> {
    try {
        const currentYear = new Date().getFullYear();
        const seasons = [2022, 2023, 2024, 2025, 2026].filter(y => y <= currentYear);

        // Fetch all seasons in parallel
        const allSeasonEvents = await Promise.all(
            seasons.map(year => fetchSeasonBreakEvents(year))
        );

        const allEvents: BreakEvent[] = allSeasonEvents.flat();

        // --- By Game # (streak length 4-14) ---
        const byGameMap: Record<number, { total: number; breaks: number }> = {};
        for (let g = 4; g <= 14; g++) {
            byGameMap[g] = { total: 0, breaks: 0 };
        }

        for (const ev of allEvents) {
            const clamped = Math.min(ev.altStreak, 14);
            if (clamped >= 4 && clamped <= 14) {
                byGameMap[clamped].total++;
                if (ev.broke) byGameMap[clamped].breaks++;
            }
        }

        const byGame: GameBucket[] = [];
        for (let g = 4; g <= 14; g++) {
            const bucket = byGameMap[g];
            byGame.push({
                game: g,
                total: bucket.total,
                breaks: bucket.breaks,
                rate: computeRate(bucket.total, bucket.breaks),
            });
        }

        // --- By Location ---
        const homeStats = { total: 0, breaks: 0 };
        const awayStats = { total: 0, breaks: 0 };
        for (const ev of allEvents) {
            if (ev.isHome) {
                homeStats.total++;
                if (ev.broke) homeStats.breaks++;
            } else {
                awayStats.total++;
                if (ev.broke) awayStats.breaks++;
            }
        }

        const byLocation = {
            home: { ...homeStats, rate: computeRate(homeStats.total, homeStats.breaks) },
            away: { ...awayStats, rate: computeRate(awayStats.total, awayStats.breaks) },
        };

        // --- By Season ---
        const bySeason: SeasonBucket[] = seasons.map((year, idx) => {
            const seasonEvents = allSeasonEvents[idx];
            const total = seasonEvents.length;
            const breaks = seasonEvents.filter(e => e.broke).length;
            return { year, total, breaks, rate: computeRate(total, breaks) };
        });

        // --- Current Season ---
        const currentSeasonIdx = seasons.indexOf(currentYear);
        const currentSeasonEvents = currentSeasonIdx >= 0 ? allSeasonEvents[currentSeasonIdx] : [];
        const currentTotal = currentSeasonEvents.length;
        const currentBreaks = currentSeasonEvents.filter(e => e.broke).length;

        const currentByGameMap: Record<number, { total: number; breaks: number }> = {};
        for (let g = 4; g <= 14; g++) {
            currentByGameMap[g] = { total: 0, breaks: 0 };
        }
        for (const ev of currentSeasonEvents) {
            const clamped = Math.min(ev.altStreak, 14);
            if (clamped >= 4 && clamped <= 14) {
                currentByGameMap[clamped].total++;
                if (ev.broke) currentByGameMap[clamped].breaks++;
            }
        }

        const currentByGame: GameBucket[] = [];
        for (let g = 4; g <= 14; g++) {
            const bucket = currentByGameMap[g];
            currentByGame.push({
                game: g,
                total: bucket.total,
                breaks: bucket.breaks,
                rate: computeRate(bucket.total, bucket.breaks),
            });
        }

        const currentSeason: CurrentSeasonData = {
            year: currentYear,
            total: currentTotal,
            breaks: currentBreaks,
            rate: computeRate(currentTotal, currentBreaks),
            byGame: currentByGame,
        };

        // --- Top break game ---
        const topGame = byGame.reduce((best, cur) =>
            (cur.rate > best.rate && cur.total >= 10) ? cur : best, byGame[0]);

        // --- Top location ---
        const topLocation: 'home' | 'away' = byLocation.home.rate >= byLocation.away.rate ? 'home' : 'away';

        // --- Overall ---
        const totalEvents = allEvents.length;
        const totalBreaks = allEvents.filter(e => e.broke).length;
        const overallRate = computeRate(totalEvents, totalBreaks);

        const response: AnalyticsResponse = {
            byGame,
            byLocation,
            bySeason,
            currentSeason,
            topBreakGame: topGame.game,
            topLocation,
            totalEvents,
            overallRate,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Pattern analytics error:', error);
        return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 });
    }
}
