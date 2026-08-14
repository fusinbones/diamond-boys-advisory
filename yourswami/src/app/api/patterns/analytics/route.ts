import { NextResponse } from 'next/server';

const MLB_API = 'https://statsapi.mlb.com/api/v1';

// ── Interfaces ──────────────────────────────────────────

interface GameRecord {
    result: 'W' | 'L';
    isHome: boolean;
    date: string;
    teamId: number;
    teamName: string;
    opponent: string;
}

interface BreakEvent {
    altStreak: number;
    isHome: boolean;
    year: number;
    broke: boolean;
    teamId: number;
    teamName: string;
    opponent: string;
    date: string;
    result: 'W' | 'L';
}

interface RateBucket {
    total: number;
    breaks: number;
    rate: number;
}

interface GameBucket extends RateBucket {
    game: number;
    homeBreaks: number;
    homeTotal: number;
    awayBreaks: number;
    awayTotal: number;
}

interface SeasonBucket extends RateBucket {
    year: number;
}

interface TeamBucket {
    teamName: string;
    breaks: number;
    total: number;
    rate: number;
    homeBreaks: number;
    awayBreaks: number;
}

interface SeasonEvent {
    date: string;
    teamName: string;
    opponent: string;
    isHome: boolean;
    streakLength: number;
    broke: boolean;
    result: 'W' | 'L';
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
    byTeam: TeamBucket[];
    seasonEvents: SeasonEvent[];
}

// ── Fetch & Parse ───────────────────────────────────────

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

    const teamGames: Record<number, GameRecord[]> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const teamNames: Record<number, string> = {};

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
            const homeName = (game.teams?.home?.team?.name || 'Unknown') as string;
            const awayName = (game.teams?.away?.team?.name || 'Unknown') as string;
            const gameDate = (game.officialDate || dateEntry.date || game.gameDate || '') as string;

            if (homeRuns === awayRuns) continue;

            if (homeId) {
                teamNames[homeId] = homeName;
                if (!teamGames[homeId]) teamGames[homeId] = [];
                teamGames[homeId].push({
                    result: homeRuns > awayRuns ? 'W' : 'L',
                    isHome: true,
                    date: gameDate,
                    teamId: homeId,
                    teamName: homeName,
                    opponent: awayName,
                });
            }
            if (awayId) {
                teamNames[awayId] = awayName;
                if (!teamGames[awayId]) teamGames[awayId] = [];
                teamGames[awayId].push({
                    result: awayRuns > homeRuns ? 'W' : 'L',
                    isHome: false,
                    date: gameDate,
                    teamId: awayId,
                    teamName: awayName,
                    opponent: homeName,
                });
            }
        }
    }

    const events: BreakEvent[] = [];

    for (const teamId of Object.keys(teamGames)) {
        const games = teamGames[Number(teamId)].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        for (let i = 1; i < games.length - 1; i++) {
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

            const prediction = games[i].result;
            const nextGame = games[i + 1];
            const broke = prediction === nextGame.result;

            events.push({
                altStreak,
                isHome: nextGame.isHome,
                year,
                broke,
                teamId: Number(teamId),
                teamName: teamNames[Number(teamId)] || 'Unknown',
                opponent: nextGame.opponent,
                date: nextGame.date,
                result: nextGame.result,
            });
        }
    }

    return events;
}

function computeRate(total: number, breaks: number): number {
    return total === 0 ? 0 : Math.round((breaks / total) * 1000) / 10;
}

// ── GET ─────────────────────────────────────────────────

export async function GET(): Promise<NextResponse<AnalyticsResponse | { error: string }>> {
    try {
        const currentYear = new Date().getFullYear();
        const seasons = [2022, 2023, 2024, 2025, 2026].filter(y => y <= currentYear);

        const allSeasonEvents = await Promise.all(
            seasons.map(year => fetchSeasonBreakEvents(year))
        );

        const allEvents: BreakEvent[] = allSeasonEvents.flat();

        // ── By Game # with Home/Away split ──
        const byGameMap: Record<number, {
            total: number; breaks: number;
            homeBreaks: number; homeTotal: number;
            awayBreaks: number; awayTotal: number;
        }> = {};
        for (let g = 4; g <= 14; g++) {
            byGameMap[g] = { total: 0, breaks: 0, homeBreaks: 0, homeTotal: 0, awayBreaks: 0, awayTotal: 0 };
        }

        for (const ev of allEvents) {
            const clamped = Math.min(ev.altStreak, 14);
            if (clamped >= 4 && clamped <= 14) {
                byGameMap[clamped].total++;
                if (ev.isHome) {
                    byGameMap[clamped].homeTotal++;
                    if (ev.broke) { byGameMap[clamped].breaks++; byGameMap[clamped].homeBreaks++; }
                } else {
                    byGameMap[clamped].awayTotal++;
                    if (ev.broke) { byGameMap[clamped].breaks++; byGameMap[clamped].awayBreaks++; }
                }
            }
        }

        const byGame: GameBucket[] = [];
        for (let g = 4; g <= 14; g++) {
            const b = byGameMap[g];
            byGame.push({
                game: g, total: b.total, breaks: b.breaks,
                rate: computeRate(b.total, b.breaks),
                homeBreaks: b.homeBreaks, homeTotal: b.homeTotal,
                awayBreaks: b.awayBreaks, awayTotal: b.awayTotal,
            });
        }

        // ── By Location ──
        const homeStats = { total: 0, breaks: 0 };
        const awayStats = { total: 0, breaks: 0 };
        for (const ev of allEvents) {
            if (ev.isHome) { homeStats.total++; if (ev.broke) homeStats.breaks++; }
            else { awayStats.total++; if (ev.broke) awayStats.breaks++; }
        }

        const byLocation = {
            home: { ...homeStats, rate: computeRate(homeStats.total, homeStats.breaks) },
            away: { ...awayStats, rate: computeRate(awayStats.total, awayStats.breaks) },
        };

        // ── By Season ──
        const bySeason: SeasonBucket[] = seasons.map((year, idx) => {
            const seasonEvents = allSeasonEvents[idx];
            const total = seasonEvents.length;
            const breaks = seasonEvents.filter(e => e.broke).length;
            return { year, total, breaks, rate: computeRate(total, breaks) };
        });

        // ── Current Season ──
        const currentSeasonIdx = seasons.indexOf(currentYear);
        const currentSeasonEvents = currentSeasonIdx >= 0 ? allSeasonEvents[currentSeasonIdx] : [];
        const currentTotal = currentSeasonEvents.length;
        const currentBreaks = currentSeasonEvents.filter(e => e.broke).length;

        const currentByGameMap: Record<number, {
            total: number; breaks: number;
            homeBreaks: number; homeTotal: number;
            awayBreaks: number; awayTotal: number;
        }> = {};
        for (let g = 4; g <= 14; g++) {
            currentByGameMap[g] = { total: 0, breaks: 0, homeBreaks: 0, homeTotal: 0, awayBreaks: 0, awayTotal: 0 };
        }
        for (const ev of currentSeasonEvents) {
            const clamped = Math.min(ev.altStreak, 14);
            if (clamped >= 4 && clamped <= 14) {
                currentByGameMap[clamped].total++;
                if (ev.isHome) {
                    currentByGameMap[clamped].homeTotal++;
                    if (ev.broke) { currentByGameMap[clamped].breaks++; currentByGameMap[clamped].homeBreaks++; }
                } else {
                    currentByGameMap[clamped].awayTotal++;
                    if (ev.broke) { currentByGameMap[clamped].breaks++; currentByGameMap[clamped].awayBreaks++; }
                }
            }
        }

        const currentByGame: GameBucket[] = [];
        for (let g = 4; g <= 14; g++) {
            const b = currentByGameMap[g];
            currentByGame.push({
                game: g, total: b.total, breaks: b.breaks,
                rate: computeRate(b.total, b.breaks),
                homeBreaks: b.homeBreaks, homeTotal: b.homeTotal,
                awayBreaks: b.awayBreaks, awayTotal: b.awayTotal,
            });
        }

        const currentSeason: CurrentSeasonData = {
            year: currentYear, total: currentTotal, breaks: currentBreaks,
            rate: computeRate(currentTotal, currentBreaks), byGame: currentByGame,
        };

        // ── By Team (current season) ──
        const teamMap: Record<string, { breaks: number; total: number; homeBreaks: number; awayBreaks: number }> = {};
        for (const ev of currentSeasonEvents) {
            if (!teamMap[ev.teamName]) teamMap[ev.teamName] = { breaks: 0, total: 0, homeBreaks: 0, awayBreaks: 0 };
            teamMap[ev.teamName].total++;
            if (ev.broke) {
                teamMap[ev.teamName].breaks++;
                if (ev.isHome) teamMap[ev.teamName].homeBreaks++;
                else teamMap[ev.teamName].awayBreaks++;
            }
        }

        const byTeam: TeamBucket[] = Object.entries(teamMap)
            .map(([teamName, stats]) => ({
                teamName,
                breaks: stats.breaks,
                total: stats.total,
                rate: computeRate(stats.total, stats.breaks),
                homeBreaks: stats.homeBreaks,
                awayBreaks: stats.awayBreaks,
            }))
            .sort((a, b) => b.breaks - a.breaks);

        // ── Season Events (current season, detailed game log) ──
        const seasonEvents: SeasonEvent[] = currentSeasonEvents
            .map(ev => ({
                date: ev.date,
                teamName: ev.teamName,
                opponent: ev.opponent,
                isHome: ev.isHome,
                streakLength: ev.altStreak,
                broke: ev.broke,
                result: ev.result,
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // ── Summary ──
        const topGame = byGame.reduce((best, cur) =>
            (cur.rate > best.rate && cur.total >= 10) ? cur : best, byGame[0]);

        const topLocation: 'home' | 'away' = byLocation.home.rate >= byLocation.away.rate ? 'home' : 'away';

        const totalEvents = allEvents.length;
        const totalBreaks = allEvents.filter(e => e.broke).length;
        const overallRate = computeRate(totalEvents, totalBreaks);

        const response: AnalyticsResponse = {
            byGame, byLocation, bySeason, currentSeason,
            topBreakGame: topGame.game, topLocation,
            totalEvents, overallRate,
            byTeam, seasonEvents,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Pattern analytics error:', error);
        return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 });
    }
}
