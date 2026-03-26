import { NextResponse } from 'next/server';
import { getMLBGames } from '@/lib/mlb-stats';
import { getSportScores, US_SPORTS, type ScoreEvent } from '@/lib/odds-api';

// Public endpoint — no auth required
// Returns today's games across ALL sports for the landing page ticker
export async function GET() {
    try {
        const allTickerGames: {
            id: number | string;
            status: { long: string; short: string };
            away: { name: string; logo: string; score: number | null };
            home: { name: string; logo: string; score: number | null };
            league: string;
            time: string;
        }[] = [];

        // ── 1. MLB from MLB Stats API (best source for live scores + logos) ──
        try {
            const { games } = await getMLBGames();
            for (const g of games) {
                allTickerGames.push({
                    id: g.id,
                    status: g.status,
                    away: { name: g.teams.away.name, logo: g.teams.away.logo, score: g.scores.away.total },
                    home: { name: g.teams.home.name, logo: g.teams.home.logo, score: g.scores.home.total },
                    league: 'MLB',
                    time: g.time,
                });
            }
        } catch (e) {
            console.error('Ticker MLB fetch error:', e);
        }

        // ── 2. NBA & NHL from The Odds API (scores endpoint) ──
        const otherSports = US_SPORTS.filter(s => s.key !== 'baseball_mlb');
        const results = await Promise.allSettled(
            otherSports.map(async (sport) => {
                if (!process.env.ODDS_API_KEY) return [];
                const scores: ScoreEvent[] = await getSportScores(sport.key, 1);
                return scores.map(s => ({
                    sport: sport.name,
                    emoji: sport.emoji,
                    event: s,
                }));
            })
        );

        for (const r of results) {
            if (r.status !== 'fulfilled') continue;
            for (const item of r.value) {
                const ev = item.event;
                const isLive = !ev.completed && ev.scores !== null;
                const isCompleted = ev.completed;

                let statusObj: { long: string; short: string };
                if (isCompleted) {
                    statusObj = { long: 'Finished', short: 'FT' };
                } else if (isLive) {
                    statusObj = { long: 'In Progress', short: 'IN' };
                } else {
                    statusObj = { long: 'Not Started', short: 'NS' };
                }

                const homeScore = ev.scores?.find(sc => sc.name === ev.home_team);
                const awayScore = ev.scores?.find(sc => sc.name === ev.away_team);

                const gameTime = new Date(ev.commence_time);
                const dateStr = gameTime.toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric',
                    timeZone: 'America/New_York',
                });
                const time = gameTime.toLocaleTimeString('en-US', {
                    hour: 'numeric', minute: '2-digit', hour12: true,
                    timeZone: 'America/New_York',
                });

                allTickerGames.push({
                    id: ev.id,
                    status: statusObj,
                    away: {
                        name: ev.away_team,
                        logo: '',
                        score: awayScore ? Number(awayScore.score) : null,
                    },
                    home: {
                        name: ev.home_team,
                        logo: '',
                        score: homeScore ? Number(homeScore.score) : null,
                    },
                    league: item.sport,
                    time: `${dateStr} · ${time} ET`,
                });
            }
        }

        // Sort: live first, then by time
        allTickerGames.sort((a, b) => {
            if (a.status.short.startsWith('IN') && !b.status.short.startsWith('IN')) return -1;
            if (!a.status.short.startsWith('IN') && b.status.short.startsWith('IN')) return 1;
            return 0;
        });

        return NextResponse.json(
            { games: allTickerGames },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
                },
            }
        );
    } catch (error) {
        console.error('Public games API error:', error);
        return NextResponse.json({ games: [] }, { status: 200 });
    }
}
