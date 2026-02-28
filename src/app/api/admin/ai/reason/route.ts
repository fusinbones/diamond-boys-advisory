import { NextRequest, NextResponse } from 'next/server';
import { generatePickReason } from '@/lib/gemini';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { awayTeam, homeTeam, pickTeam, pickType, gameDate, homeAltPct, awayAltPct, homeAlternating, awayAlternating } = body;

        if (!pickTeam) {
            return NextResponse.json({ error: 'pickTeam required' }, { status: 400 });
        }

        const reason = await generatePickReason({
            awayTeam: awayTeam || '',
            homeTeam: homeTeam || '',
            pickTeam,
            pickType: pickType || 'ML',
            gameDate: gameDate || new Date().toISOString().split('T')[0],
            homeAltPct,
            awayAltPct,
            homeAlternating,
            awayAlternating,
        });

        return NextResponse.json({ reason });
    } catch (error) {
        console.error('AI reason error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Generation failed' },
            { status: 500 }
        );
    }
}
