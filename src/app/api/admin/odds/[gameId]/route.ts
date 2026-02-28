import { NextRequest, NextResponse } from 'next/server';
import { getOdds } from '@/lib/api-sports';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ gameId: string }> }
) {
    try {
        const { gameId } = await params;
        const odds = await getOdds(Number(gameId));
        return NextResponse.json({ odds });
    } catch (error) {
        console.error('Admin odds API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch odds' },
            { status: 500 }
        );
    }
}
