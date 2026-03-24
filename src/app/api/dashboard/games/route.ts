import { NextRequest, NextResponse } from 'next/server';
import { getSportOdds, getSportScores, US_SPORTS, getBestOdds, type OddsEvent, type ScoreEvent } from '@/lib/odds-api';

interface FormattedGame {
    id: string;
    sport: string;
    sportEmoji: string;
    sportColor: string;
    homeTeam: string;
    awayTeam: string;
    gameTime: string;
    isLive: boolean;
    isCompleted: boolean;
    homeScore: string | null;
    awayScore: string | null;
    moneyline: { home: number | null; away: number | null; bestBook: string } | null;
    spread: { home: number | null; away: number | null; line: number | null; bestBook: string } | null;
    total: { overUnder: number | null; overOdds: number | null; underOdds: number | null; bestBook: string } | null;
    bestValue: string | null; // e.g. "Best value on DraftKings"
    oddsSpread: number; // how much odds differ across books (0-100, higher = more divergence)
}

function formatOdds(price: number): string {
    return price > 0 ? `+${price}` : `${price}`;
}

function calcOddsSpread(event: OddsEvent, marketKey: string): number {
    const prices: number[] = [];
    for (const bm of event.bookmakers) {
        const market = bm.markets.find(m => m.key === marketKey);
        if (market) {
            for (const o of market.outcomes) {
                prices.push(o.price);
            }
        }
    }
    if (prices.length < 2) return 0;
    return Math.max(...prices) - Math.min(...prices);
}

function processEvent(
    event: OddsEvent,
    sportInfo: { name: string; emoji: string; color: string },
    scoreMap: Map<string, ScoreEvent>
): FormattedGame {
    const score = scoreMap.get(event.id);
    const isLive = score ? (!score.completed && score.scores !== null) : false;
    const isCompleted = score?.completed || false;

    // Best odds across books
    const bestH2H = getBestOdds(event, 'h2h');
    const homeH2H = bestH2H.find(b => b.team === event.home_team);
    const awayH2H = bestH2H.find(b => b.team === event.away_team);

    // Spreads
    let spreadData: FormattedGame['spread'] = null;
    const firstSpreadBook = event.bookmakers.find(bm => bm.markets.some(m => m.key === 'spreads'));
    if (firstSpreadBook) {
        const spreadMarket = firstSpreadBook.markets.find(m => m.key === 'spreads');
        if (spreadMarket && spreadMarket.outcomes.length >= 2) {
            const homeSpread = spreadMarket.outcomes.find(o => o.name === event.home_team);
            const awaySpread = spreadMarket.outcomes.find(o => o.name === event.away_team);
            spreadData = {
                home: homeSpread?.price || null,
                away: awaySpread?.price || null,
                line: homeSpread?.point || null,
                bestBook: firstSpreadBook.title,
            };
        }
    }

    // Totals
    let totalData: FormattedGame['total'] = null;
    const firstTotalBook = event.bookmakers.find(bm => bm.markets.some(m => m.key === 'totals'));
    if (firstTotalBook) {
        const totalMarket = firstTotalBook.markets.find(m => m.key === 'totals');
        if (totalMarket && totalMarket.outcomes.length >= 2) {
            const over = totalMarket.outcomes.find(o => o.name === 'Over');
            const under = totalMarket.outcomes.find(o => o.name === 'Under');
            totalData = {
                overUnder: over?.point || null,
                overOdds: over?.price || null,
                underOdds: under?.price || null,
                bestBook: firstTotalBook.title,
            };
        }
    }

    // Odds divergence — higher means more disagreement between books
    const oddsSpread = calcOddsSpread(event, 'h2h');

    // Best value indicator
    let bestValue: string | null = null;
    if (oddsSpread > 30) {
        const bestBook = homeH2H && awayH2H
            ? (homeH2H.bestPrice > Math.abs(awayH2H.bestPrice) ? homeH2H : awayH2H)
            : null;
        if (bestBook) {
            bestValue = `Best line on ${bestBook.book}`;
        }
    }

    return {
        id: event.id,
        sport: sportInfo.name,
        sportEmoji: sportInfo.emoji,
        sportColor: sportInfo.color,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        gameTime: event.commence_time,
        isLive,
        isCompleted,
        homeScore: score?.scores?.find(s => s.name === event.home_team)?.score || null,
        awayScore: score?.scores?.find(s => s.name === event.away_team)?.score || null,
        moneyline: homeH2H && awayH2H ? {
            home: homeH2H.bestPrice,
            away: awayH2H.bestPrice,
            bestBook: homeH2H.book,
        } : null,
        spread: spreadData,
        total: totalData,
        bestValue,
        oddsSpread,
    };
}

export async function GET(request: NextRequest) {
    const sportFilter = request.nextUrl.searchParams.get('sport'); // 'MLB', 'NBA', etc or null for all
    const debug = request.nextUrl.searchParams.get('debug') === '1';

    // Check API key
    if (!process.env.ODDS_API_KEY) {
        console.error('[Dashboard Games] ODDS_API_KEY not configured');
        return NextResponse.json({
            games: [], sportCounts: {}, totalGames: 0,
            ...(debug ? { error: 'ODDS_API_KEY not configured' } : {}),
        });
    }

    try {
        const sportsToFetch = sportFilter
            ? US_SPORTS.filter(s => s.name === sportFilter)
            : US_SPORTS;

        const errors: string[] = [];

        // Fetch odds + scores in parallel
        const results = await Promise.allSettled(
            sportsToFetch.map(async (s) => {
                const [odds, scores] = await Promise.all([
                    getSportOdds(s.key, 'h2h,spreads,totals').catch((err: Error) => {
                        errors.push(`${s.name} odds: ${err.message}`);
                        return [] as OddsEvent[];
                    }),
                    getSportScores(s.key, 1).catch((err: Error) => {
                        errors.push(`${s.name} scores: ${err.message}`);
                        return [] as ScoreEvent[];
                    }),
                ]);

                const scoreMap = new Map(scores.map(sc => [sc.id, sc]));
                const games = odds.map(e => processEvent(e, s, scoreMap));

                return { sport: s.name, games };
            })
        );

        const allGames: FormattedGame[] = [];
        const sportCounts: Record<string, number> = {};

        for (const r of results) {
            if (r.status === 'fulfilled') {
                allGames.push(...r.value.games);
                sportCounts[r.value.sport] = r.value.games.length;
            } else {
                errors.push(`Rejected: ${r.reason}`);
            }
        }

        if (errors.length > 0) {
            console.error('[Dashboard Games] Errors:', errors);
        }

        // Sort: live first, then by game time
        allGames.sort((a, b) => {
            if (a.isLive && !b.isLive) return -1;
            if (!a.isLive && b.isLive) return 1;
            if (a.isCompleted && !b.isCompleted) return 1;
            if (!a.isCompleted && b.isCompleted) return -1;
            return new Date(a.gameTime).getTime() - new Date(b.gameTime).getTime();
        });

        return NextResponse.json(
            {
                games: allGames,
                sportCounts,
                totalGames: allGames.length,
                ...(debug ? { errors, apiKeySet: true } : {}),
            },
            { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
        );
    } catch (error) {
        console.error('Dashboard games error:', error);
        return NextResponse.json({
            games: [], sportCounts: {}, totalGames: 0,
            ...(debug ? { error: String(error) } : {}),
        }, { status: 200 });
    }
}
