import { NextResponse } from 'next/server';
import { getSportOdds, getSportScores, generateTickerItems, US_SPORTS, type TickerItem } from '@/lib/odds-api';

export async function GET() {
    try {
        const allItems: TickerItem[] = [];

        // Fetch odds + scores for all US sports in parallel
        const results = await Promise.allSettled(
            US_SPORTS.map(async sport => {
                const [odds, scores] = await Promise.allSettled([
                    getSportOdds(sport.key, 'h2h,spreads,totals'),
                    getSportScores(sport.key),
                ]);

                // Generate ticker items from odds
                if (odds.status === 'fulfilled') {
                    allItems.push(...generateTickerItems(odds.value, sport.key));
                }

                // Add score items
                if (scores.status === 'fulfilled') {
                    for (const game of scores.value.filter(g => g.scores && g.completed)) {
                        const home = game.scores?.find(s => s.name === game.home_team);
                        const away = game.scores?.find(s => s.name === game.away_team);
                        if (home && away) {
                            allItems.push({
                                id: `score-${game.id}`,
                                type: 'score',
                                sport: sport.name,
                                sportEmoji: sport.emoji,
                                headline: `${game.away_team} @ ${game.home_team}`,
                                detail: `Final: ${away.score} - ${home.score}`,
                                urgency: 'low',
                                timestamp: game.commence_time,
                            });
                        }
                    }
                }
            })
        );

        // Sort: edges first, then by time (soonest first)
        allItems.sort((a, b) => {
            const urgencyOrder = { high: 0, medium: 1, low: 2 };
            const typePriority = { edge: 0, movement: 1, odds: 2, streak: 3, score: 4 };
            const aDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
            if (aDiff !== 0) return aDiff;
            return (typePriority[a.type] || 3) - (typePriority[b.type] || 3);
        });

        return NextResponse.json({
            items: allItems,
            updated: new Date().toISOString(),
            count: allItems.length,
        });
    } catch (error) {
        console.error('Ticker API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to build ticker' },
            { status: 500 }
        );
    }
}
