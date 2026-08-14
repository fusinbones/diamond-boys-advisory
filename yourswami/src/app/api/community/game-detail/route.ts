import { NextRequest, NextResponse } from 'next/server';
import { getMLBGames, getPitcherStats, getPitcherInfo, getPitcherGameLog, getMLBTeamStats, getMLBH2H } from '@/lib/mlb-stats';
import { getSportOdds } from '@/lib/odds-api';

/**
 * Game Detail API — Returns EVERYTHING a bettor needs for a single game:
 * - Matchup info (teams, time, venue)
 * - Odds from ALL sportsbooks (ML, spread, O/U)
 * - Probable pitchers + full stats + last 3 starts
 * - Team season stats (home/away splits)
 * - H2H history (last 5 meetings)
 * - Betting consensus (% of books favoring each side)
 * - YourSwami Edge analysis
 */

interface PitcherDetail {
    name: string;
    hand: string;
    era: string;
    whip: string;
    record: string;
    strikeouts: number;
    inningsPitched: string;
    gamesStarted: number;
    last3: Array<{
        date: string;
        opponent: string;
        ip: string;
        k: number;
        er: number;
        hits: number;
    }>;
}

interface BookOdds {
    book: string;
    homeML: number | null;
    awayML: number | null;
    spread: number | null;
    spreadOdds: number | null;
    total: number | null;
    overOdds: number | null;
    underOdds: number | null;
}

export async function GET(req: NextRequest) {
    const gameId = req.nextUrl.searchParams.get('gameId');
    const homeTeam = req.nextUrl.searchParams.get('home');
    const awayTeam = req.nextUrl.searchParams.get('away');

    if (!homeTeam || !awayTeam) {
        return NextResponse.json({ error: 'Missing home/away team params' }, { status: 400 });
    }

    try {
        // Parallel fetch: today's games + odds + team stats
        const [gamesResult, mlbOdds] = await Promise.all([
            getMLBGames(),
            getSportOdds('baseball_mlb', 'h2h').catch(() => []),
        ]);

        // Find the specific game
        const game = gamesResult.games.find(g =>
            g.id === Number(gameId) ||
            (g.teams.home.name.includes(homeTeam) && g.teams.away.name.includes(awayTeam))
        );

        // Find odds for this game from all books
        const oddsEvent = mlbOdds.find(e =>
            e.home_team.includes(homeTeam) || e.away_team.includes(awayTeam) ||
            (homeTeam && e.home_team.toLowerCase().includes(homeTeam.toLowerCase()))
        );

        // Build multi-book odds
        const bookOdds: BookOdds[] = [];
        if (oddsEvent) {
            for (const bm of oddsEvent.bookmakers) {
                const h2h = bm.markets.find(m => m.key === 'h2h');
                const spreads = bm.markets.find(m => m.key === 'spreads');
                const totals = bm.markets.find(m => m.key === 'totals');

                bookOdds.push({
                    book: bm.title,
                    homeML: h2h?.outcomes.find(o => o.name === oddsEvent.home_team)?.price ?? null,
                    awayML: h2h?.outcomes.find(o => o.name === oddsEvent.away_team)?.price ?? null,
                    spread: spreads?.outcomes.find(o => o.name === oddsEvent.home_team)?.point ?? null,
                    spreadOdds: spreads?.outcomes.find(o => o.name === oddsEvent.home_team)?.price ?? null,
                    total: totals?.outcomes.find(o => o.name === 'Over')?.point ?? null,
                    overOdds: totals?.outcomes.find(o => o.name === 'Over')?.price ?? null,
                    underOdds: totals?.outcomes.find(o => o.name === 'Under')?.price ?? null,
                });
            }
        }

        // Betting consensus
        let homeConsensus = 0;
        let awayConsensus = 0;
        if (bookOdds.length > 0) {
            for (const bo of bookOdds) {
                if (bo.homeML !== null && bo.awayML !== null) {
                    if (bo.homeML < bo.awayML) homeConsensus++;
                    else awayConsensus++;
                }
            }
            const total = homeConsensus + awayConsensus;
            if (total > 0) {
                homeConsensus = Math.round((homeConsensus / total) * 100);
                awayConsensus = 100 - homeConsensus;
            }
        }

        // Pitcher stats (parallel)
        const homePitcherName = game ? gamesResult.pitcherMap[game.teams.home.name] : null;
        const awayPitcherName = game ? gamesResult.pitcherMap[game.teams.away.name] : null;

        const [homePitcherStats, awayPitcherStats, homePitcherInfo, awayPitcherInfo, homePitcherLog, awayPitcherLog] = await Promise.all([
            homePitcherName ? getPitcherStats(homePitcherName.id) : Promise.resolve(null),
            awayPitcherName ? getPitcherStats(awayPitcherName.id) : Promise.resolve(null),
            homePitcherName ? getPitcherInfo(homePitcherName.id) : Promise.resolve(null),
            awayPitcherName ? getPitcherInfo(awayPitcherName.id) : Promise.resolve(null),
            homePitcherName ? getPitcherGameLog(homePitcherName.id) : Promise.resolve([]),
            awayPitcherName ? getPitcherGameLog(awayPitcherName.id) : Promise.resolve([]),
        ]);

        function buildPitcher(name: string | undefined, stats: typeof homePitcherStats, info: typeof homePitcherInfo, log: typeof homePitcherLog): PitcherDetail | null {
            if (!name || !stats) return null;
            return {
                name,
                hand: info?.pitchHand?.code === 'L' ? 'LHP' : 'RHP',
                era: stats.era,
                whip: stats.whip,
                record: `${stats.wins}-${stats.losses}`,
                strikeouts: stats.strikeOuts,
                inningsPitched: stats.inningsPitched,
                gamesStarted: stats.gamesStarted,
                last3: log.slice(-3).reverse().map(g => ({
                    date: g.date,
                    opponent: g.opponent,
                    ip: g.inningsPitched,
                    k: g.strikeOuts,
                    er: g.earnedRuns,
                    hits: g.hits,
                })),
            };
        }

        const homePitcher = buildPitcher(homePitcherName?.fullName, homePitcherStats, homePitcherInfo, homePitcherLog);
        const awayPitcher = buildPitcher(awayPitcherName?.fullName, awayPitcherStats, awayPitcherInfo, awayPitcherLog);

        // Team stats (parallel)
        const [homeStats, awayStats] = await Promise.all([
            game ? getMLBTeamStats(game.teams.home.id).catch(() => null) : Promise.resolve(null),
            game ? getMLBTeamStats(game.teams.away.id).catch(() => null) : Promise.resolve(null),
        ]);

        // H2H history — ONLY completed past games (not future scheduled)
        const h2hGames = game ? await getMLBH2H(game.teams.home.id, game.teams.away.id).catch(() => []) : [];
        const today = new Date().toISOString().split('T')[0];
        const completedH2H = h2hGames.filter(g => {
            // Must be in the past
            if (g.date >= today) return false;
            // Must have actual scores (not 0-0 scheduled games)
            const homeScore = g.scores.home.total;
            const awayScore = g.scores.away.total;
            return homeScore !== null && awayScore !== null && (homeScore > 0 || awayScore > 0);
        });
        const h2h = completedH2H.slice(-5).reverse().map(g => ({
            date: g.date,
            homeScore: g.scores.home.total ?? 0,
            awayScore: g.scores.away.total ?? 0,
            winner: (g.scores.home.total ?? 0) > (g.scores.away.total ?? 0) ? g.teams.home.name : g.teams.away.name,
        }));

        // YourSwami Edge — our algorithm's analysis
        const bestHomeML = bookOdds.reduce((best, bo) => bo.homeML !== null && bo.homeML > (best ?? -9999) ? bo.homeML : best, null as number | null);
        const bestAwayML = bookOdds.reduce((best, bo) => bo.awayML !== null && bo.awayML > (best ?? -9999) ? bo.awayML : best, null as number | null);

        let edgeTeam = '';
        let edgeConfidence = 0;
        const edgeFactors: string[] = [];

        if (homeConsensus > 60) { edgeTeam = game?.teams.home.name ?? homeTeam; edgeConfidence += 25; edgeFactors.push(`${homeConsensus}% of books favor home`); }
        else if (awayConsensus > 60) { edgeTeam = game?.teams.away.name ?? awayTeam; edgeConfidence += 25; edgeFactors.push(`${awayConsensus}% of books favor away`); }

        if (homePitcher && awayPitcher) {
            const homeERA = parseFloat(homePitcher.era);
            const awayERA = parseFloat(awayPitcher.era);
            if (homeERA < awayERA && homeERA < 3.50) { edgeConfidence += 20; edgeFactors.push(`Home pitcher ERA ${homePitcher.era} vs ${awayPitcher.era}`); }
            if (awayERA < homeERA && awayERA < 3.50) { edgeConfidence += 20; edgeFactors.push(`Away pitcher ERA ${awayPitcher.era} vs ${homePitcher.era}`); }
        }

        if (homeStats && awayStats) {
            const homeWinPct = parseFloat(homeStats.games.wins.all.percentage);
            const awayWinPct = parseFloat(awayStats.games.wins.all.percentage);
            if (homeWinPct > awayWinPct + 10) { edgeConfidence += 15; edgeFactors.push('Home team has better record'); }
            if (awayWinPct > homeWinPct + 10) { edgeConfidence += 15; edgeFactors.push('Away team has better record'); }
        }

        // Home field (+10%)
        edgeConfidence += 10;
        edgeFactors.push('Home field advantage');

        return NextResponse.json({
            game: game ? {
                id: game.id,
                date: game.date,
                time: game.time,
                status: game.status,
                homeTeam: { name: game.teams.home.name, logo: game.teams.home.logo },
                awayTeam: { name: game.teams.away.name, logo: game.teams.away.logo },
                homeScore: game.scores.home.total,
                awayScore: game.scores.away.total,
            } : null,
            odds: bookOdds,
            consensus: { home: homeConsensus, away: awayConsensus },
            homePitcher,
            awayPitcher,
            homeStats: homeStats ? {
                record: `${homeStats.games.wins.all.total}-${homeStats.games.loses.all.total}`,
                homeRecord: `${homeStats.games.wins.home.total}-${homeStats.games.loses.home.total}`,
                awayRecord: `${homeStats.games.wins.away.total}-${homeStats.games.loses.away.total}`,
                runsPerGame: homeStats.points.for.average.all,
                runsAgainstPerGame: homeStats.points.against.average.all,
            } : null,
            awayStats: awayStats ? {
                record: `${awayStats.games.wins.all.total}-${awayStats.games.loses.all.total}`,
                homeRecord: `${awayStats.games.wins.home.total}-${awayStats.games.loses.home.total}`,
                awayRecord: `${awayStats.games.wins.away.total}-${awayStats.games.loses.away.total}`,
                runsPerGame: awayStats.points.for.average.all,
                runsAgainstPerGame: awayStats.points.against.average.all,
            } : null,
            h2h,
            edge: {
                team: edgeTeam,
                confidence: Math.min(100, edgeConfidence),
                factors: edgeFactors,
                bestHomeML,
                bestAwayML,
            },
        });
    } catch (error) {
        console.error('Game detail error:', error);
        return NextResponse.json({ error: 'Failed to fetch game details' }, { status: 500 });
    }
}
