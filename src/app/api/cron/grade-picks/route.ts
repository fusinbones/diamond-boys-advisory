import { NextRequest, NextResponse } from 'next/server';
import { getSportScores, US_SPORTS, type ScoreEvent } from '@/lib/odds-api';
import { createClient } from '@supabase/supabase-js';
import { sendResultEmail } from '@/lib/email';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

interface PendingPick {
    id: string;
    game_id: string;
    pick_type: string;
    pick_team: string;
    pick_value: string;
    unit_size: number;
    home_team: string;
    away_team: string;
    sport: string;
}

/**
 * Auto-Grade Cron
 *
 * Runs every 15 minutes. Checks all pending picks against completed game scores
 * and auto-grades them as hit/miss/push.
 *
 * GET /api/cron/grade-picks
 */
export async function GET(request: NextRequest) {
    try {
        const cronSecret = request.nextUrl.searchParams.get('secret');
        if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
            if (cronSecret) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const supabase = getSupabase();

        // 1. Get all pending picks
        const { data: pendingPicks, error: pickError } = await supabase
            .from('picks')
            .select('id, game_id, pick_type, pick_team, pick_value, unit_size, home_team, away_team, sport')
            .eq('result', 'pending')
            .not('game_id', 'is', null);

        if (pickError) throw pickError;
        if (!pendingPicks || pendingPicks.length === 0) {
            return NextResponse.json({ message: 'No pending picks to grade', graded: 0 });
        }

        // 2. Fetch scores for all active sports
        const allScores: ScoreEvent[] = [];
        for (const sport of US_SPORTS) {
            try {
                const scores = await getSportScores(sport.key, 2); // last 2 days
                allScores.push(...scores);
            } catch (err) {
                console.error(`[Auto-Grade] Failed to fetch scores for ${sport.key}:`, err);
            }
        }

        // Build score map by event ID
        const scoreMap = new Map<string, ScoreEvent>();
        for (const s of allScores) {
            if (s.completed && s.scores) {
                scoreMap.set(s.id, s);
            }
        }

        // 3. Grade each pending pick
        const graded: { id: string; result: string; score: string }[] = [];
        const updates: { id: string; result: string; score: string }[] = [];

        for (const pick of pendingPicks as PendingPick[]) {
            const score = scoreMap.get(pick.game_id);
            if (!score || !score.scores) continue; // game not finished yet

            const homeScore = Number(score.scores.find(s => s.name === score.home_team)?.score || 0);
            const awayScore = Number(score.scores.find(s => s.name === score.away_team)?.score || 0);
            const finalScore = `${awayScore}-${homeScore}`;

            const pickType = (pick.pick_type || 'ML').toUpperCase();
            const pickTeam = pick.pick_team || '';
            let result: 'hit' | 'miss' | 'push' = 'miss';

            if (pickType === 'ML' || pickType === 'MONEYLINE') {
                // Moneyline: did the picked team win?
                const isHome = isTeamMatch(pickTeam, score.home_team);
                const isAway = isTeamMatch(pickTeam, score.away_team);

                if (isHome) {
                    result = homeScore > awayScore ? 'hit' : homeScore === awayScore ? 'push' : 'miss';
                } else if (isAway) {
                    result = awayScore > homeScore ? 'hit' : awayScore === homeScore ? 'push' : 'miss';
                }
            } else if (pickType === 'SPREAD' || pickType === 'ATS') {
                // Spread: extract the line from pick_value
                const spreadMatch = pick.pick_value.match(/([+-]?\d+\.?\d*)/);
                if (spreadMatch) {
                    const spreadLine = parseFloat(spreadMatch[1]);
                    const isHome = isTeamMatch(pickTeam, score.home_team);
                    const teamScore = isHome ? homeScore : awayScore;
                    const oppScore = isHome ? awayScore : homeScore;
                    const adjusted = teamScore + spreadLine;

                    if (adjusted > oppScore) result = 'hit';
                    else if (adjusted === oppScore) result = 'push';
                    else result = 'miss';
                }
            } else if (pickType === 'TOTAL' || pickType === 'O/U' || pickType === 'OVER/UNDER') {
                // Total: did the combined score go over or under?
                const totalMatch = pick.pick_value.match(/(\d+\.?\d*)/);
                const isOver = pick.pick_value.toLowerCase().includes('over') || pick.pick_value.toLowerCase().includes('o');
                if (totalMatch) {
                    const line = parseFloat(totalMatch[1]);
                    const total = homeScore + awayScore;
                    if (total === line) result = 'push';
                    else if (isOver) result = total > line ? 'hit' : 'miss';
                    else result = total < line ? 'hit' : 'miss';
                }
            }

            updates.push({ id: pick.id, result, score: finalScore });
        }

        // 4. Batch update picks
        for (const u of updates) {
            const { error } = await supabase
                .from('picks')
                .update({ result: u.result, score: u.score })
                .eq('id', u.id);

            if (!error) {
                graded.push(u);
            } else {
                console.error(`[Auto-Grade] Failed to update pick ${u.id}:`, error);
            }
        }

        // 5. Also auto-grade fire picks
        const { data: pendingFire } = await supabase
            .from('fire_picks')
            .select('id, game_id, pick_team, pick_type, pick_value')
            .eq('status', 'revealed')
            .not('game_id', 'is', null);

        let fireGraded = 0;
        if (pendingFire) {
            for (const fp of pendingFire) {
                const score = scoreMap.get(fp.game_id as string);
                if (!score || !score.scores) continue;

                const homeScore = Number(score.scores.find(s => s.name === score.home_team)?.score || 0);
                const awayScore = Number(score.scores.find(s => s.name === score.away_team)?.score || 0);

                const isHome = isTeamMatch(fp.pick_team as string, score.home_team);
                const isAway = isTeamMatch(fp.pick_team as string, score.away_team);
                let fireResult: string = 'lost';

                if (isHome) fireResult = homeScore > awayScore ? 'won' : homeScore === awayScore ? 'push' : 'lost';
                else if (isAway) fireResult = awayScore > homeScore ? 'won' : awayScore === homeScore ? 'push' : 'lost';

                const { error } = await supabase
                    .from('fire_picks')
                    .update({ status: fireResult, result: fireResult })
                    .eq('id', fp.id);

                if (!error) fireGraded++;
            }
        }

        // Send result notifications for graded fire picks
        if (fireGraded > 0) {
            try {
                const { data: subscribers } = await supabase
                    .from('pick_subscribers')
                    .select('email, phone')
                    .eq('active', true);

                // Get updated record
                const { data: allFire } = await supabase
                    .from('fire_picks')
                    .select('status')
                    .in('status', ['win', 'won', 'loss', 'lost']);

                const wins = allFire?.filter(p => p.status === 'win' || p.status === 'won').length || 0;
                const losses = allFire?.filter(p => p.status === 'loss' || p.status === 'lost').length || 0;

                if (subscribers && subscribers.length > 0 && pendingFire) {
                    const emails = subscribers.map((s: { email: string }) => s.email).filter(Boolean);

                    for (const fp of pendingFire) {
                        const score = scoreMap.get(fp.game_id as string);
                        if (!score || !score.scores) continue;
                        const isHome = isTeamMatch(fp.pick_team as string, score.home_team);
                        const isAway = isTeamMatch(fp.pick_team as string, score.away_team);
                        if (!isHome && !isAway) continue;
                        const homeScore = Number(score.scores.find(s => s.name === score.home_team)?.score || 0);
                        const awayScore = Number(score.scores.find(s => s.name === score.away_team)?.score || 0);
                        let result: 'win' | 'loss' | 'push' = 'loss';
                        if (isHome) result = homeScore > awayScore ? 'win' : homeScore === awayScore ? 'push' : 'loss';
                        else if (isAway) result = awayScore > homeScore ? 'win' : awayScore === homeScore ? 'push' : 'loss';

                        const resultData = {
                            matchup: `${score.away_team} @ ${score.home_team}`,
                            pickTeam: fp.pick_team as string,
                            pickValue: fp.pick_value as string,
                            result,
                            record: { wins, losses },
                        };

                        // Email
                        if (emails.length > 0) {
                            sendResultEmail(emails, resultData)
                                .catch(err => console.error('[Email] Result email failed:', err));
                        }
                    }
                }
            } catch (notifyErr) {
                console.error('[Notify] Result notification failed:', notifyErr);
            }
        }

        return NextResponse.json({
            message: `Graded ${graded.length} picks, ${fireGraded} fire picks`,
            graded: graded.length,
            fireGraded,
            details: graded,
        });
    } catch (error) {
        console.error('[Auto-Grade] Error:', error);
        return NextResponse.json(
            { error: 'Failed to grade picks', details: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 }
        );
    }
}

/** Fuzzy team name matching — handles partial names like "Tigers" vs "Detroit Tigers" */
function isTeamMatch(pickTeam: string, apiTeam: string): boolean {
    const pick = pickTeam.toLowerCase().trim();
    const api = apiTeam.toLowerCase().trim();
    if (pick === api) return true;
    // Check if one contains the other
    if (api.includes(pick) || pick.includes(api)) return true;
    // Check last word (team name): "Detroit Tigers" → "tigers"
    const pickLast = pick.split(' ').pop() || '';
    const apiLast = api.split(' ').pop() || '';
    return pickLast === apiLast && pickLast.length > 2;
}
