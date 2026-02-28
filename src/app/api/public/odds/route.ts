import { NextRequest, NextResponse } from 'next/server';
import { getSportOdds, US_SPORTS, type SportKey, type OddsEvent } from '@/lib/odds-api';

export async function GET(request: NextRequest) {
    const sport = request.nextUrl.searchParams.get('sport') as SportKey | null;
    const markets = request.nextUrl.searchParams.get('markets') || 'h2h,spreads,totals';

    try {
        if (sport) {
            // Single sport
            const valid = US_SPORTS.find(s => s.key === sport);
            if (!valid) {
                return NextResponse.json({ error: 'Invalid sport key' }, { status: 400 });
            }
            const odds = await getSportOdds(sport, markets);
            return NextResponse.json({ sport: valid, events: odds });
        }

        // All US sports
        const allOdds = await Promise.allSettled(
            US_SPORTS.map(async s => ({
                sport: s,
                events: await getSportOdds(s.key, markets),
            }))
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results = allOdds
            .filter(r => r.status === 'fulfilled')
            .map(r => (r as PromiseFulfilledResult<{ sport: (typeof US_SPORTS)[number]; events: OddsEvent[] }>).value);

        return NextResponse.json({ sports: results });
    } catch (error) {
        console.error('Public odds API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch odds' },
            { status: 500 }
        );
    }
}
