import { NextRequest, NextResponse } from 'next/server';
import { getMLBGames } from '@/lib/mlb-stats';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

        // Fetch games + pitchers in one shot from MLB API
        const { games, pitcherMap } = await getMLBGames({ date });

        return NextResponse.json({ games, pitcherMap, date });
    } catch (error) {
        console.error('Admin games API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch games' },
            { status: 500 }
        );
    }
}
