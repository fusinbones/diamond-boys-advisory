// ═══════════════════════════════════════════
// MLB Stats API Client (statsapi.mlb.com)
// Free, public, no auth required.
// Primary data source for all MLB data.
// ═══════════════════════════════════════════

import type {
    Game,
    GameTeam,
    GameScore,
    TeamStats,
    MLBPitcherStats,
    MLBProbablePitcher,
    MLBScheduleGame,
} from './api-sports-types';

const MLB_API = 'https://statsapi.mlb.com/api/v1';
const MLB_LOGO = (id: number) => `https://www.mlbstatic.com/team-logos/${id}.svg`;

// ═══════════════════════════════════════════
// Request Throttle — max 5 req/sec with queue
// ═══════════════════════════════════════════

const MIN_GAP_MS = 200;           // 200ms between requests = 5/sec max
let lastRequestTime = 0;
const requestQueue: (() => void)[] = [];
let processing = false;

async function processQueue() {
    if (processing) return;
    processing = true;
    while (requestQueue.length > 0) {
        const now = Date.now();
        const elapsed = now - lastRequestTime;
        if (elapsed < MIN_GAP_MS) {
            await new Promise(r => setTimeout(r, MIN_GAP_MS - elapsed));
        }
        lastRequestTime = Date.now();
        const next = requestQueue.shift();
        next?.();
    }
    processing = false;
}

function throttledRequest(): Promise<void> {
    return new Promise(resolve => {
        requestQueue.push(resolve);
        processQueue();
    });
}

// ═══════════════════════════════════════════
// Cache (1h TTL)
// ═══════════════════════════════════════════

interface CacheEntry<T> {
    data: T;
    expiry: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 60 * 60 * 1000;

function getCached<T>(key: string): T | null {
    const entry = cache.get(key);
    if (entry && entry.expiry > Date.now()) return entry.data as T;
    cache.delete(key);
    return null;
}

function setCache<T>(key: string, data: T): void {
    cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

// ═══════════════════════════════════════════
// Core Fetch (with throttle + retry)
// ═══════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function mlbFetch<T = any>(path: string): Promise<T> {
    const url = `${MLB_API}${path}`;
    const cached = getCached<T>(url);
    if (cached) return cached;

    await throttledRequest();

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const res = await fetch(url, { next: { revalidate: 3600 } });
            if (!res.ok) throw new Error(`MLB API ${res.status}: ${url}`);
            const data = await res.json();
            setCache(url, data);
            return data;
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (attempt < 2) await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        }
    }

    throw lastError || new Error(`MLB API fetch failed: ${url}`);
}

// ═══════════════════════════════════════════
// MLB → api-sports Team ID Map (for odds)
// ═══════════════════════════════════════════

export const MLB_TO_APISPORTS: Record<number, number> = {
    108: 34, // Angels
    109: 35, // Diamondbacks
    110: 36, // Orioles
    111: 37, // Red Sox
    112: 38, // Cubs
    113: 39, // Reds
    114: 40, // Guardians
    115: 41, // Rockies
    116: 42, // Tigers
    117: 43, // Astros
    118: 44, // Royals
    119: 45, // Dodgers
    120: 46, // Nationals
    121: 47, // Mets
    133: 48, // Athletics
    134: 49, // Pirates
    135: 50, // Padres
    136: 51, // Mariners
    137: 52, // Giants
    138: 53, // Cardinals
    139: 54, // Rays
    140: 55, // Rangers
    141: 56, // Blue Jays
    142: 57, // Twins
    143: 58, // Phillies
    144: 59, // Braves
    145: 60, // White Sox
    146: 61, // Marlins
    147: 62, // Yankees
    158: 63, // Brewers
};

export const APISPORTS_TO_MLB: Record<number, number> = Object.fromEntries(
    Object.entries(MLB_TO_APISPORTS).map(([mlb, api]) => [api, Number(mlb)])
);

// ═══════════════════════════════════════════
// Helpers — map MLB API data → our types
// ═══════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMLBGameToGame(g: any): Game {
    const linescore = g.linescore || {};
    const homeTeam = g.teams?.home?.team || {};
    const awayTeam = g.teams?.away?.team || {};

    // Map MLB status to api-sports style (frontend checks startsWith('IN') for live)
    const abstract = g.status?.abstractGameState || 'Preview';
    const detailed = g.status?.detailedState || '';
    let status: { long: string; short: string };

    if (abstract === 'Final') {
        status = { long: 'Finished', short: 'FT' };
    } else if (abstract === 'Live') {
        // Use IN prefix so frontend startsWith('IN') works
        const inning = linescore.currentInning || '';
        const half = linescore.inningHalf === 'Top' ? 'T' : 'B';
        status = {
            long: detailed || 'In Progress',
            short: inning ? `IN${half}${inning}` : 'IN',
        };
    } else if (detailed === 'Postponed') {
        status = { long: 'Postponed', short: 'PST' };
    } else if (detailed === 'Cancelled') {
        status = { long: 'Cancelled', short: 'CANC' };
    } else if (detailed === 'Delayed' || detailed === 'Delayed Start') {
        status = { long: detailed, short: 'DLY' };
    } else {
        status = { long: 'Not Started', short: 'NS' };
    }

    // Build inning-by-inning scores from linescore
    const homeInnings: Record<string, number | null> = {};
    const awayInnings: Record<string, number | null> = {};
    for (const inn of linescore.innings || []) {
        homeInnings[String(inn.num)] = inn.home?.runs ?? null;
        awayInnings[String(inn.num)] = inn.away?.runs ?? null;
    }

    const homeScore: GameScore = {
        hits: linescore.teams?.home?.hits ?? 0,
        errors: linescore.teams?.home?.errors ?? 0,
        innings: homeInnings,
        total: linescore.teams?.home?.runs ?? null,
    };

    const awayScore: GameScore = {
        hits: linescore.teams?.away?.hits ?? 0,
        errors: linescore.teams?.away?.errors ?? 0,
        innings: awayInnings,
        total: linescore.teams?.away?.runs ?? null,
    };

    const gameDate = new Date(g.gameDate || g.officialDate);
    const isSpringTraining = g.gameType === 'S';

    return {
        id: g.gamePk,
        date: (g.officialDate || gameDate.toISOString().split('T')[0]),
        time: gameDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        timestamp: Math.floor(gameDate.getTime() / 1000),
        timezone: 'UTC',
        week: null,
        status,
        country: { id: 1, name: 'USA', code: 'US', flag: 'https://media.api-sports.io/flags/us.svg' },
        league: {
            id: isSpringTraining ? 71 : 1,
            name: isSpringTraining ? 'Spring Training' : 'MLB',
            type: 'League',
            logo: 'https://media.api-sports.io/baseball/leagues/1.png',
            season: Number(g.season) || new Date().getFullYear(),
        },
        teams: {
            home: { id: homeTeam.id, name: homeTeam.name || 'TBD', logo: MLB_LOGO(homeTeam.id) },
            away: { id: awayTeam.id, name: awayTeam.name || 'TBD', logo: MLB_LOGO(awayTeam.id) },
        },
        scores: { home: homeScore, away: awayScore },
    };
}

// ═══════════════════════════════════════════
// PUBLIC: Games / Schedule
// ═══════════════════════════════════════════

/** Get games for a date. Fetches both regular + Spring Training. */
export async function getMLBGames(params: {
    date?: string;
    season?: number;
    team?: number;
    gameType?: string;  // 'R', 'S', or 'R,S' for both
} = {}): Promise<{ games: Game[]; pitcherMap: Record<string, { id: number; fullName: string }> }> {
    const d = params.date || new Date().toISOString().split('T')[0];
    const gt = params.gameType || 'R,S'; // Default: both regular + spring training

    let path = `/schedule?sportId=1&date=${d}&hydrate=probablePitcher,linescore,team&gameType=${gt}`;
    if (params.team) path += `&teamId=${params.team}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await mlbFetch(path);

    const games: Game[] = [];
    const pitcherMap: Record<string, { id: number; fullName: string }> = {};

    for (const dateEntry of data.dates || []) {
        for (const g of dateEntry.games || []) {
            games.push(mapMLBGameToGame(g));

            // Extract probable pitchers into map
            const hp = g.teams?.home?.probablePitcher;
            const ap = g.teams?.away?.probablePitcher;
            if (hp?.id) pitcherMap[g.teams.home.team.name] = { id: hp.id, fullName: hp.fullName };
            if (ap?.id) pitcherMap[g.teams.away.team.name] = { id: ap.id, fullName: ap.fullName };
        }
    }

    return { games, pitcherMap };
}

// ═══════════════════════════════════════════
// PUBLIC: Team Games (for streaks)
// ═══════════════════════════════════════════

/** Get all games for a team in a season. Used for streak calculation. */
export async function getMLBTeamGames(
    teamId: number,
    season?: number,
    gameType: string = 'R,S',
): Promise<Game[]> {
    const yr = season || new Date().getFullYear();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await mlbFetch(
        `/schedule?sportId=1&teamId=${teamId}&season=${yr}&hydrate=linescore,team&gameType=${gameType}`
    );

    const games: Game[] = [];
    for (const dateEntry of data.dates || []) {
        for (const g of dateEntry.games || []) {
            games.push(mapMLBGameToGame(g));
        }
    }
    return games;
}

// ═══════════════════════════════════════════
// PUBLIC: Team Stats
// ═══════════════════════════════════════════

/** Get team season stats mapped to our TeamStats type. */
export async function getMLBTeamStats(
    teamId: number,
    season?: number,
    gameType: string = 'R',
): Promise<TeamStats | null> {
    const yr = season || new Date().getFullYear();

    // Fetch hitting + pitching stats AND standings in parallel
    const [statsData, standingsData] = await Promise.all([
        mlbFetch(`/teams/${teamId}/stats?stats=season&season=${yr}&group=hitting,pitching&gameType=${gameType}`),
        mlbFetch(`/standings?leagueId=103,104&season=${yr}`).catch(() => null),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stats = statsData as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const standings = standingsData as any;

    // Parse hitting stats
    const hittingSplits = stats?.stats?.find((s: { group: { displayName: string } }) =>
        s.group?.displayName === 'hitting'
    )?.splits?.[0]?.stat;

    // Parse pitching stats
    const pitchingSplits = stats?.stats?.find((s: { group: { displayName: string } }) =>
        s.group?.displayName === 'pitching'
    )?.splits?.[0]?.stat;

    if (!hittingSplits && !pitchingSplits) return null;

    // Find team in standings for W/L breakdown
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let teamRecord: any = null;
    if (standings?.records) {
        for (const division of standings.records) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const found = division.teamRecords?.find((t: any) => t.team?.id === teamId);
            if (found) { teamRecord = found; break; }
        }
    }

    // Calculate W/L from standings or from stats
    const totalWins = teamRecord?.wins ?? pitchingSplits?.wins ?? 0;
    const totalLosses = teamRecord?.losses ?? pitchingSplits?.losses ?? 0;
    const totalGames = totalWins + totalLosses;

    // Home/away splits from standings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const homeRecord = teamRecord?.records?.overallRecords?.find((r: any) => r.type === 'home');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const awayRecord = teamRecord?.records?.overallRecords?.find((r: any) => r.type === 'away');

    const homeWins = homeRecord?.wins ?? Math.round(totalWins * 0.55);
    const homeLosses = homeRecord?.losses ?? Math.round(totalLosses * 0.45);
    const awayWins = awayRecord?.wins ?? (totalWins - homeWins);
    const awayLosses = awayRecord?.losses ?? (totalLosses - homeLosses);
    const homePlayed = homeWins + homeLosses;
    const awayPlayed = awayWins + awayLosses;

    const pct = (n: number, d: number) => d > 0 ? (n / d * 100).toFixed(1) : '0.0';

    const runsFor = teamRecord?.runsScored ?? hittingSplits?.runs ?? 0;
    const runsAgainst = teamRecord?.runsAllowed ?? pitchingSplits?.runs ?? 0;

    const avg = (total: number, games: number) => games > 0 ? (total / games).toFixed(1) : '0.0';

    // Estimate home/away run splits (MLB API standings don't split this)
    const homeRunsFor = Math.round(runsFor * (homePlayed / Math.max(totalGames, 1)));
    const awayRunsFor = runsFor - homeRunsFor;
    const homeRunsAgainst = Math.round(runsAgainst * (homePlayed / Math.max(totalGames, 1)));
    const awayRunsAgainst = runsAgainst - homeRunsAgainst;

    // Get team info for name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const teamInfo: any = await mlbFetch(`/teams/${teamId}`).catch(() => null);
    const teamName = teamInfo?.teams?.[0]?.name || `Team ${teamId}`;

    return {
        country: { id: 1, name: 'USA', code: 'US', flag: '' },
        league: {
            id: gameType === 'S' ? 71 : 1,
            name: gameType === 'S' ? 'Spring Training' : 'MLB',
            type: 'League',
            logo: '',
            season: yr,
        },
        team: { id: teamId, name: teamName, logo: MLB_LOGO(teamId) },
        games: {
            played: { home: homePlayed, away: awayPlayed, all: totalGames },
            wins: {
                home: { total: homeWins, percentage: pct(homeWins, homePlayed) },
                away: { total: awayWins, percentage: pct(awayWins, awayPlayed) },
                all: { total: totalWins, percentage: pct(totalWins, totalGames) },
            },
            loses: {
                home: { total: homeLosses, percentage: pct(homeLosses, homePlayed) },
                away: { total: awayLosses, percentage: pct(awayLosses, awayPlayed) },
                all: { total: totalLosses, percentage: pct(totalLosses, totalGames) },
            },
        },
        points: {
            for: {
                total: { home: homeRunsFor, away: awayRunsFor, all: runsFor },
                average: { home: avg(homeRunsFor, homePlayed), away: avg(awayRunsFor, awayPlayed), all: avg(runsFor, totalGames) },
            },
            against: {
                total: { home: homeRunsAgainst, away: awayRunsAgainst, all: runsAgainst },
                average: { home: avg(homeRunsAgainst, homePlayed), away: avg(awayRunsAgainst, awayPlayed), all: avg(runsAgainst, totalGames) },
            },
        },
    };
}

// ═══════════════════════════════════════════
// PUBLIC: Head-to-Head
// ═══════════════════════════════════════════

/** Get H2H games between two teams. Fetches team1's schedule and filters for team2. */
export async function getMLBH2H(
    team1Id: number,
    team2Id: number,
    season?: number,
): Promise<Game[]> {
    const yr = season || new Date().getFullYear();
    const games = await getMLBTeamGames(team1Id, yr, 'R,S');
    return games.filter(g =>
        (g.teams.home.id === team1Id && g.teams.away.id === team2Id) ||
        (g.teams.home.id === team2Id && g.teams.away.id === team1Id)
    );
}

// ═══════════════════════════════════════════
// PUBLIC: Pitcher Data (existing, enhanced)
// ═══════════════════════════════════════════

/** Get today's scheduled games with probable pitchers. */
export async function getMLBSchedule(date?: string): Promise<MLBScheduleGame[]> {
    const d = date || new Date().toISOString().split('T')[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await mlbFetch(`/schedule?sportId=1&date=${d}&hydrate=probablePitcher&gameType=R,S`);
    const games: MLBScheduleGame[] = [];

    for (const dateEntry of data.dates || []) {
        for (const game of dateEntry.games || []) {
            games.push({
                gamePk: game.gamePk,
                gameDate: game.gameDate,
                status: game.status,
                teams: {
                    away: {
                        team: game.teams.away.team,
                        probablePitcher: game.teams.away.probablePitcher || undefined,
                    },
                    home: {
                        team: game.teams.home.team,
                        probablePitcher: game.teams.home.probablePitcher || undefined,
                    },
                },
            });
        }
    }

    return games;
}

/** Get pitcher season stats. */
export async function getPitcherStats(playerId: number, season?: number, gameType?: string): Promise<MLBPitcherStats | null> {
    const yr = season || new Date().getFullYear();
    const gt = gameType || 'R';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await mlbFetch(
        `/people/${playerId}/stats?stats=season&season=${yr}&group=pitching&gameType=${gt}`
    );

    // If no data for this gameType, try the other type as fallback
    let splits = data.stats?.[0]?.splits;
    if ((!splits || splits.length === 0) && gt !== 'R') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fallback: any = await mlbFetch(
            `/people/${playerId}/stats?stats=season&season=${yr}&group=pitching&gameType=R`
        );
        splits = fallback.stats?.[0]?.splits;
    }
    if ((!splits || splits.length === 0) && gt !== 'S') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fallback: any = await mlbFetch(
            `/people/${playerId}/stats?stats=season&season=${yr}&group=pitching&gameType=S`
        );
        splits = fallback.stats?.[0]?.splits;
    }
    if (!splits || splits.length === 0) return null;

    const s = splits[0].stat;
    return {
        era: s.era || '0.00',
        whip: s.whip || '0.00',
        wins: s.wins || 0,
        losses: s.losses || 0,
        inningsPitched: s.inningsPitched || '0.0',
        strikeOuts: s.strikeOuts || 0,
        baseOnBalls: s.baseOnBalls || 0,
        homeRuns: s.homeRuns || 0,
        avg: s.avg || '.000',
        gamesPlayed: s.gamesPlayed || 0,
        gamesStarted: s.gamesStarted || 0,
        saves: s.saves || 0,
        hits: s.hits || 0,
        earnedRuns: s.earnedRuns || 0,
    };
}

/** Get pitcher info (handedness, etc). */
export async function getPitcherInfo(playerId: number): Promise<MLBProbablePitcher | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await mlbFetch(`/people/${playerId}`);
    const person = data.people?.[0];
    if (!person) return null;

    return {
        id: person.id,
        fullName: person.fullName,
        pitchHand: person.pitchHand,
    };
}

/** Get a pitcher's game log (for rest days / last 5 games). */
export async function getPitcherGameLog(playerId: number, season?: number, gameType?: string): Promise<{
    date: string;
    opponent: string;
    era: string;
    inningsPitched: string;
    strikeOuts: number;
    hits: number;
    earnedRuns: number;
    decision?: string;
}[]> {
    const yr = season || new Date().getFullYear();
    const gt = gameType || 'R';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = await mlbFetch(
        `/people/${playerId}/stats?stats=gameLog&season=${yr}&group=pitching&gameType=${gt}`
    );

    // If no data for this gameType, try the other type as fallback
    let splits = data.stats?.[0]?.splits || [];
    if (splits.length === 0 && gt !== 'R') {
        data = await mlbFetch(
            `/people/${playerId}/stats?stats=gameLog&season=${yr}&group=pitching&gameType=R`
        );
        splits = data.stats?.[0]?.splits || [];
    }
    if (splits.length === 0 && gt !== 'S') {
        data = await mlbFetch(
            `/people/${playerId}/stats?stats=gameLog&season=${yr}&group=pitching&gameType=S`
        );
        splits = data.stats?.[0]?.splits || [];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return splits.map((s: any) => ({
        date: s.date,
        opponent: s.opponent?.name || 'Unknown',
        era: s.stat?.era || '0.00',
        inningsPitched: s.stat?.inningsPitched || '0.0',
        strikeOuts: s.stat?.strikeOuts || 0,
        hits: s.stat?.hits || 0,
        earnedRuns: s.stat?.earnedRuns || 0,
        decision: s.stat?.note || undefined,
    }));
}

/** Get team roster (to find pitchers). */
export async function getTeamRoster(teamId: number, season?: number): Promise<{
    id: number;
    fullName: string;
    position: string;
    pitchHand?: string;
    status: string;
}[]> {
    const yr = season || new Date().getFullYear();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await mlbFetch(`/teams/${teamId}/roster?season=${yr}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.roster || []).map((p: any) => ({
        id: p.person.id,
        fullName: p.person.fullName,
        position: p.position?.abbreviation || 'Unknown',
        pitchHand: p.person.pitchHand?.code,
        status: p.status?.description || 'Active',
    }));
}
