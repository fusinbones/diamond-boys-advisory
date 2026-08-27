import { NextRequest, NextResponse } from 'next/server';
import { denyUnlessCron } from '@/lib/cronAuth';
import { refreshSportOdds, refreshSportScores, US_SPORTS } from '@/lib/odds-api';

/**
 * Refresh Odds Cache Cron
 *
 * This is the ONLY endpoint that calls the live Odds API.
 * It refreshes odds + scores for all sports and stores them in Supabase.
 *
 * Schedule: Every 2–4 hours via Vercel Cron or external scheduler.
 * API calls per run: 3 sports × 2 (odds + scores) = 6 calls
 * At 4x/day = 24 calls/day = ~720/month (well within free tier of 500/month if run 3x/day)
 *
 * GET /api/cron/refresh-odds?secret=YOUR_CRON_SECRET
 */
export async function GET(request: NextRequest) {
    try {
        // Auth check
        // Fails closed. Burns paid Odds API quota on every call.
        const denied = denyUnlessCron(request);
        if (denied) return denied;

        const results: { sport: string; odds: number; scores: number; error?: string }[] = [];

        for (const sport of US_SPORTS) {
            let oddsCount = 0;
            let scoresCount = 0;
            let sportError: string | undefined;

            try {
                const odds = await refreshSportOdds(sport.key);
                oddsCount = odds.length;
            } catch (err) {
                sportError = `Odds: ${err instanceof Error ? err.message : String(err)}`;
                console.error(`[Refresh Odds] ${sport.name} odds error:`, err);
            }

            try {
                // Fetch scores for last 2 days (for grade-picks)
                const scores = await refreshSportScores(sport.key, 2);
                scoresCount = scores.length;
            } catch (err) {
                const msg = `Scores: ${err instanceof Error ? err.message : String(err)}`;
                sportError = sportError ? `${sportError}; ${msg}` : msg;
                console.error(`[Refresh Odds] ${sport.name} scores error:`, err);
            }

            results.push({
                sport: sport.name,
                odds: oddsCount,
                scores: scoresCount,
                ...(sportError ? { error: sportError } : {}),
            });
        }

        const totalOdds = results.reduce((sum, r) => sum + r.odds, 0);
        const totalScores = results.reduce((sum, r) => sum + r.scores, 0);

        console.log(`[Refresh Odds] Done: ${totalOdds} odds events, ${totalScores} score events cached`);

        return NextResponse.json({
            message: `Refreshed ${totalOdds} odds + ${totalScores} scores`,
            results,
            refreshedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[Refresh Odds] Fatal error:', error);
        return NextResponse.json(
            { error: 'Failed to refresh odds cache', details: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 }
        );
    }
}
