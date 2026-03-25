import { NextRequest, NextResponse } from 'next/server';
import { getSportOdds, US_SPORTS } from '@/lib/odds-api';
import { analyzeAllGames } from '@/lib/pick-engine';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

/** Convert UTC timestamp to YYYY-MM-DD in US Eastern timezone */
function toEasternDate(utcTime: string): string {
    try {
        const d = new Date(utcTime);
        return d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); // en-CA = YYYY-MM-DD
    } catch {
        return new Date().toISOString().split('T')[0]; // fallback
    }
}

/**
 * AI Auto-Picks Generator
 *
 * Call this endpoint to generate AI consensus picks for today's games.
 * Can be triggered by:
 * - Vercel Cron (add to vercel.json)
 * - Manual admin call
 * - Button in admin panel
 *
 * GET /api/cron/auto-picks
 * Query params:
 *   - dry_run=1  → don't save, just return recommendations
 *   - secret=xxx → optional cron secret for security
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const dryRun = searchParams.get('dry_run') === '1';
        const cronSecret = searchParams.get('secret');

        // Optional secret check for cron security
        if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
            // Allow if no CRON_SECRET is set (dev mode)
            if (cronSecret) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // Fetch odds for all active sports
        const activeSports = US_SPORTS.filter(s => !s.key.includes('football'));
        const allEvents = [];

        for (const sport of activeSports) {
            try {
                const events = await getSportOdds(sport.key);
                allEvents.push(...events);
            } catch (err) {
                console.error(`Failed to fetch odds for ${sport.key}:`, err);
            }
        }

        if (allEvents.length === 0) {
            return NextResponse.json({
                message: 'No games found',
                picks: [],
                gamesAnalyzed: 0,
            });
        }

        // Run consensus engine
        const recommendations = analyzeAllGames(allEvents);

        if (dryRun) {
            return NextResponse.json({
                message: `Dry run: ${recommendations.length} picks from ${allEvents.length} games`,
                picks: recommendations,
                gamesAnalyzed: allEvents.length,
            });
        }

        // Save to Supabase
        const supabase = getSupabase();

        // Check for existing AI picks (avoid duplicates by game_id)
        const gameIds = recommendations.map(r => r.gameId);
        const { data: existing } = await supabase
            .from('picks')
            .select('game_id')
            .eq('source', 'ai_consensus')
            .in('game_id', gameIds);

        const existingGameIds = new Set((existing || []).map((p: { game_id: string }) => p.game_id));

        const newPicks = recommendations.filter(r => !existingGameIds.has(r.gameId));

        if (newPicks.length === 0) {
            return NextResponse.json({
                message: 'All AI picks for today already exist',
                picks: [],
                gamesAnalyzed: allEvents.length,
                existingCount: existing?.length || 0,
            });
        }

        const inserts = newPicks.map(pick => {
            // Use the game's actual date in US Eastern timezone
            const gameDate = toEasternDate(pick.gameTime);
            return {
                home_team: pick.homeTeam,
                away_team: pick.awayTeam,
                pick_type: pick.pickType,
                pick_team: pick.pickTeam,
                pick_value: pick.pickValue,
                confidence: pick.confidence,
                reason: pick.reasoning,
                notes: `Edge: ${pick.edge}% | Consensus: ${pick.consensusStrength}%`,
                game_date: gameDate,
                unit_size: pick.confidence >= 80 ? 2 : 1,
                created_by: 'AI Consensus Engine',
                game_id: pick.gameId,
                result: 'pending',
                source: 'ai_consensus',
                sport: pick.sport,
                odds_at_pick: pick.oddsAtPick,
            };
        });

        const { data: saved, error: insertError } = await supabase
            .from('picks')
            .insert(inserts)
            .select();

        if (insertError) {
            console.error('Failed to save AI picks:', insertError);
            return NextResponse.json({
                error: 'Failed to save picks',
                details: insertError.message,
            }, { status: 500 });
        }

        return NextResponse.json({
            message: `✅ Generated ${saved?.length || 0} AI picks from ${allEvents.length} games`,
            picks: saved,
            gamesAnalyzed: allEvents.length,
            recommendations: recommendations.length,
            saved: saved?.length || 0,
            skippedDuplicates: existingGameIds.size,
        });

    } catch (error) {
        console.error('Auto-picks error:', error);
        return NextResponse.json(
            { error: 'Failed to generate picks', details: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 }
        );
    }
}
