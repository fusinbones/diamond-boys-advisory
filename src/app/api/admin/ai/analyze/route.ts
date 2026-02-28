import { NextRequest, NextResponse } from 'next/server';
import { analyzeGame } from '@/lib/gemini';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { awayTeam, homeTeam, gameDate, odds, homeStats, awayStats, pitchers } = body;

        if (!awayTeam || !homeTeam) {
            return NextResponse.json({ error: 'awayTeam and homeTeam required' }, { status: 400 });
        }

        const analysis = await analyzeGame({
            awayTeam,
            homeTeam,
            gameDate: gameDate || new Date().toISOString().split('T')[0],
            odds,
            homeStats,
            awayStats,
            pitchers,
        });

        return NextResponse.json({ analysis });
    } catch (error) {
        console.error('AI analyze error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Analysis failed' },
            { status: 500 }
        );
    }
}
