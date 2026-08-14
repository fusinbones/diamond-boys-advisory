import { NextRequest, NextResponse } from 'next/server';
import { getPitcherStats, getPitcherInfo, getPitcherGameLog } from '@/lib/mlb-stats';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const playerId = Number(id);
        const { searchParams } = request.nextUrl;
        const gameType = searchParams.get('gameType') || 'R';

        const [info, stats, gameLog] = await Promise.all([
            getPitcherInfo(playerId),
            getPitcherStats(playerId, undefined, gameType),
            getPitcherGameLog(playerId, undefined, gameType),
        ]);

        // Calculate rest days from last game
        let restDays: number | null = null;
        if (gameLog.length > 0) {
            const lastGame = new Date(gameLog[gameLog.length - 1].date);
            const today = new Date();
            restDays = Math.floor((today.getTime() - lastGame.getTime()) / (1000 * 60 * 60 * 24));
        }

        // Last 5 games stats
        const last5 = gameLog.slice(-5);
        const last5Stats = last5.length > 0 ? {
            games: last5.length,
            avgERA: (last5.reduce((sum, g) => sum + parseFloat(g.era || '0'), 0) / last5.length).toFixed(2),
            totalK: last5.reduce((sum, g) => sum + g.strikeOuts, 0),
            totalIP: last5.reduce((sum, g) => sum + parseFloat(g.inningsPitched || '0'), 0).toFixed(1),
        } : null;

        return NextResponse.json({
            info,
            stats,
            gameLog: gameLog.slice(-10).reverse(), // Last 10 games, most recent first
            restDays,
            last5Stats,
        });
    } catch (error) {
        console.error('Admin pitcher API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch pitcher data' },
            { status: 500 }
        );
    }
}
