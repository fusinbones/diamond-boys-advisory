import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSportScores, US_SPORTS, type ScoreEvent } from '@/lib/odds-api';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

/** Convert any date/timestamp to YYYY-MM-DD in US Eastern timezone */
function toETDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    // If it is already exactly YYYY-MM-DD, do NOT parse it as UTC midnight and shift it back 4 hours
    if (dateStr.length === 10 && dateStr.includes('-')) return dateStr;

    try {
        const d = new Date(dateStr);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            year: 'numeric', month: '2-digit', day: '2-digit' // MM/DD/YYYY
        });
        const parts = formatter.formatToParts(d);
        const y = parts.find(p => p.type === 'year')?.value;
        const m = parts.find(p => p.type === 'month')?.value;
        const day = parts.find(p => p.type === 'day')?.value;
        if (y && m && day) return `${y}-${m}-${day}`;
        return (dateStr || '').split('T')[0];
    } catch {
        return (dateStr || '').split('T')[0]; // fallback
    }
}

interface PickOutput {
    id: string;
    game_date: string;
    created_at: string;
    matchup: string;
    pick_type: string;
    pick_value: string;
    confidence: number;
    units: number;
    odds: string | null;
    edge: number | null;
    sport: string;
    status: string; // 'upcoming' | 'won' | 'lost' | 'push'
    score: string | null;
    result: string | null;
    reasoning: string | null;
    alt_score: number | null;
}

/**
 * Map the DB 'result' column to the UI 'status' for PickCard
 * DB uses: pending, hit, miss, push
 * UI uses: upcoming, won, lost, push
 */
function mapResultToStatus(result: string | null | undefined): string {
    if (!result || result === 'pending') return 'upcoming';
    if (result === 'hit') return 'won';
    if (result === 'miss') return 'lost';
    if (result === 'push') return 'push';
    return 'upcoming';
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const sport = searchParams.get('sport');
        const tab = searchParams.get('tab') || 'today';
        const limit = Number(searchParams.get('limit')) || 50;

        const supabase = getSupabase();
        // Use US Eastern date for today
        const nowET = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
        const today = nowET.toISOString().split('T')[0]; // YYYY-MM-DD
        const tomorrowDate = new Date(nowET);
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrow = tomorrowDate.toISOString().split('T')[0];
        const yesterdayDate = new Date(nowET);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = yesterdayDate.toISOString().split('T')[0];

        console.log('[Dashboard Picks] today=', today, 'tomorrow=', tomorrow);

        // ══ INLINE AUTO-GRADING ══
        // Grade any pending picks whose games have completed, so stats update
        // within 60s of game end (dashboard polls every 60s)
        await inlineGradePending(supabase);

        // ── Fetch picks based on tab ──
        let query = supabase
            .from('picks')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (tab === 'today') {
            // Fetch yesterday + today so we can show "Yesterday's Picks" section
            query = query.gte('game_date', yesterday).lt('game_date', tomorrow);
        } else if (tab === 'upcoming') {
            query = query.eq('result', 'pending');
        } else if (tab === 'results') {
            query = query.in('result', ['hit', 'miss', 'push']);
        }

        if (sport && sport !== 'All') {
            query = query.eq('sport', sport);
        }

        const { data: rawPicks, error } = await query;
        if (error) throw error;

        // ── Transform raw DB rows → PickCard format ──
        // Map Odds API sport keys to clean display names
        const sportKeyMap: Record<string, string> = {
            baseball_mlb: 'MLB', 'baseball_mlb_preseason': 'MLB',
            basketball_nba: 'NBA', 'basketball_nba_preseason': 'NBA',
            icehockey_nhl: 'NHL', 'icehockey_nhl_preseason': 'NHL',
            americanfootball_nfl: 'NFL', 'americanfootball_nfl_preseason': 'NFL',
        };

        const picks: PickOutput[] = ((rawPicks || []) as Record<string, unknown>[]).map(raw => {
            const cleanSport = sportKeyMap[(raw.sport as string) || ''] || (raw.sport as string) || 'MLB';
            const pickTeam = (raw.pick_team as string) || '';
            const pickType = (raw.pick_type as string) || 'ML';
            const rawOdds = (raw.pick_value as string) || (raw.odds as string) || '';

            // Build a clear pick_value: "Team Name ML +105"
            let displayValue = '';
            if (pickTeam) {
                displayValue = `${pickTeam} ${pickType} ${rawOdds}`.trim();
            } else if (raw.pick_value) {
                displayValue = raw.pick_value as string;
            } else {
                displayValue = `${pickType} ${rawOdds}`.trim();
            }

            return {
                id: raw.id as string,
                game_date: toETDate(raw.game_date as string),
                created_at: raw.created_at as string,
                matchup: (raw.matchup as string) || (raw.away_team && raw.home_team ? `${raw.away_team} @ ${raw.home_team}` : 'Unknown'),
                pick_type: pickType,
                pick_value: displayValue,
                confidence: (raw.confidence as number) || 75,
                units: Number(raw.units) || Number(raw.unit_size) || 1,
                edge: (raw.edge as number) || null,
                odds: rawOdds || null,
                sport: cleanSport,
                status: mapResultToStatus(raw.result as string),
                score: (raw.score as string) || null,
                result: (raw.result as string) || null,
                reasoning: (raw.reasoning as string) || (raw.reason as string) || null,
                alt_score: (raw.alt_score as number) || null,
            };
        });

        // ── Calculate KPIs from all graded picks ──
        const { data: allGraded, error: kpiError } = await supabase
            .from('picks')
            .select('*')
            .in('result', ['hit', 'miss', 'push']);

        if (kpiError) throw kpiError;

        const gradedPicks = (allGraded || []) as Record<string, unknown>[];
        const wins = gradedPicks.filter(p => p.result === 'hit').length;
        const losses = gradedPicks.filter(p => p.result === 'miss').length;
        const pushes = gradedPicks.filter(p => p.result === 'push').length;
        const totalGraded = wins + losses;
        const winRate = totalGraded > 0 ? ((wins / totalGraded) * 100).toFixed(1) : '0.0';

        // Units P&L
        const totalUnits = gradedPicks.reduce((acc, p) => {
            const u = Number(p.unit_size) || 1;
            if (p.result === 'hit') return acc + u;
            if (p.result === 'miss') return acc - u;
            return acc;
        }, 0);

        // Current streak
        const sortedGraded = [...gradedPicks]
            .sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime());
        let streak = 0;
        let streakType: 'W' | 'L' | '' = '';
        for (const p of sortedGraded) {
            if (p.result === 'push') continue;
            if (!streakType) {
                streakType = p.result === 'hit' ? 'W' : 'L';
                streak = 1;
            } else if ((p.result === 'hit' && streakType === 'W') || (p.result === 'miss' && streakType === 'L')) {
                streak++;
            } else {
                break;
            }
        }

        // Avg edge
        const edgePicks = gradedPicks.filter(p => p.edge !== null && p.edge !== undefined);
        const avgEdge = edgePicks.length > 0
            ? (edgePicks.reduce((acc, p) => acc + Number(p.edge), 0) / edgePicks.length).toFixed(1)
            : '0.0';

        // ── Morning Slate ──
        const { data: todayPicks } = await supabase
            .from('picks')
            .select('*')
            .gte('game_date', today)
            .lt('game_date', tomorrow);

        const todayCount = todayPicks?.length || 0;
        const upcomingToday = todayPicks?.filter(p => p.result === 'pending').length || 0;
        const sportsToday = [...new Set((todayPicks || []).map(p => sportKeyMap[(p.sport as string) || ''] || (p.sport as string) || 'MLB').filter(Boolean))];

        // If no graded picks yet, show industry averages so the dashboard doesn't look empty
        const hasGradedPicks = totalGraded > 0;
        return NextResponse.json({
            picks,
            kpis: hasGradedPicks ? {
                record: `${wins}-${losses}${pushes > 0 ? `-${pushes}` : ''}`,
                winRate: `${winRate}%`,
                totalUnits: totalUnits.toFixed(1),
                roi: ((totalUnits / totalGraded) * 100).toFixed(1) + '%',
                streak: streak > 0 ? `${streakType}${streak}` : 'N/A',
                avgEdge: `+${avgEdge}%`,
                isPreseason: false,
            } : {
                record: '0-0',
                winRate: '55.0%',
                totalUnits: '+0.0',
                roi: '8.5%',
                streak: 'N/A',
                avgEdge: '+3.2%',
                isPreseason: true,
            },
            morningSlate: {
                totalGames: todayCount,
                upcomingPicks: upcomingToday,
                sports: sportsToday,
            },
            todayStr: today,
        });
    } catch (error: unknown) {
        console.error('Dashboard picks error:', error);
        let msg = 'Unknown error';
        if (error && typeof error === 'object') {
            const e = error as Record<string, unknown>;
            msg = (e.message as string) || (e.code as string) || JSON.stringify(error);
        } else if (error instanceof Error) {
            msg = error.message;
        }
        return NextResponse.json({ error: 'Failed to fetch dashboard data', details: msg }, { status: 500 });
    }
}

// ═══════════════════════════════════════════
// Inline Auto-Grading (runs on every dashboard poll)
// ═══════════════════════════════════════════

let lastGradeCheck = 0;
const GRADE_COOLDOWN = 120_000; // 2 min cooldown between Odds API checks

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function inlineGradePending(supabase: any) {
    // Cooldown to avoid spamming Odds API (dashboard polls every 60s, but
    // multiple users could be polling simultaneously)
    if (Date.now() - lastGradeCheck < GRADE_COOLDOWN) return;
    lastGradeCheck = Date.now();

    try {
        // 1. Get pending picks that have a game_id
        const { data: pending } = await supabase
            .from('picks')
            .select('id, game_id, pick_type, pick_team, pick_value')
            .eq('result', 'pending')
            .not('game_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(50);

        if (!pending || pending.length === 0) return;

        // 2. Fetch completed scores for all sports
        const allScores: ScoreEvent[] = [];
        for (const sport of US_SPORTS) {
            try {
                const scores = await getSportScores(sport.key, 2);
                allScores.push(...scores.filter(s => s.completed && s.scores));
            } catch { /* skip sport */ }
        }

        const scoreMap = new Map(allScores.map(s => [s.id, s]));

        // 3. Grade matching picks
        let graded = 0;
        for (const pick of pending) {
            const score = scoreMap.get(pick.game_id as string);
            if (!score || !score.scores) continue;

            const homeScore = Number(score.scores.find(s => s.name === score.home_team)?.score || 0);
            const awayScore = Number(score.scores.find(s => s.name === score.away_team)?.score || 0);
            const finalScore = `${awayScore}-${homeScore}`;
            const pickType = ((pick.pick_type as string) || 'ML').toUpperCase();
            const pickTeam = (pick.pick_team as string) || '';
            let result: string = 'miss';

            if (pickType === 'ML' || pickType === 'MONEYLINE') {
                const isHome = isTeamMatch(pickTeam, score.home_team);
                const isAway = isTeamMatch(pickTeam, score.away_team);
                if (isHome) result = homeScore > awayScore ? 'hit' : homeScore === awayScore ? 'push' : 'miss';
                else if (isAway) result = awayScore > homeScore ? 'hit' : awayScore === homeScore ? 'push' : 'miss';
            } else if (pickType === 'SPREAD' || pickType === 'ATS') {
                const spreadMatch = ((pick.pick_value as string) || '').match(/([+-]?\d+\.?\d*)/);
                if (spreadMatch) {
                    const line = parseFloat(spreadMatch[1]);
                    const isHome = isTeamMatch(pickTeam, score.home_team);
                    const teamScore = isHome ? homeScore : awayScore;
                    const oppScore = isHome ? awayScore : homeScore;
                    const adj = teamScore + line;
                    result = adj > oppScore ? 'hit' : adj === oppScore ? 'push' : 'miss';
                }
            } else if (pickType === 'TOTAL' || pickType.includes('O/U') || pickType.includes('OVER')) {
                const totalMatch = ((pick.pick_value as string) || '').match(/(\d+\.?\d*)/);
                const isOver = ((pick.pick_value as string) || '').toLowerCase().includes('over') || ((pick.pick_value as string) || '').toLowerCase().includes(' o');
                if (totalMatch) {
                    const line = parseFloat(totalMatch[1]);
                    const total = homeScore + awayScore;
                    result = total === line ? 'push' : (isOver ? (total > line ? 'hit' : 'miss') : (total < line ? 'hit' : 'miss'));
                }
            }

            await supabase.from('picks').update({ result, score: finalScore }).eq('id', pick.id);
            graded++;
        }

        // 4. Also grade revealed fire picks
        const { data: pendingFire } = await supabase
            .from('fire_picks')
            .select('id, game_id, pick_team, pick_type, pick_value')
            .eq('status', 'revealed')
            .not('game_id', 'is', null);

        if (pendingFire) {
            for (const fp of pendingFire) {
                const score = scoreMap.get(fp.game_id as string);
                if (!score || !score.scores) continue;
                const homeScore = Number(score.scores.find(s => s.name === score.home_team)?.score || 0);
                const awayScore = Number(score.scores.find(s => s.name === score.away_team)?.score || 0);
                const isHome = isTeamMatch((fp.pick_team as string) || '', score.home_team);
                const isAway = isTeamMatch((fp.pick_team as string) || '', score.away_team);
                let fireResult = 'lost';
                if (isHome) fireResult = homeScore > awayScore ? 'won' : homeScore === awayScore ? 'push' : 'lost';
                else if (isAway) fireResult = awayScore > homeScore ? 'won' : awayScore === homeScore ? 'push' : 'lost';
                await supabase.from('fire_picks').update({ status: fireResult, result: fireResult }).eq('id', fp.id);
            }
        }

        if (graded > 0) console.log(`[Inline Grade] Auto-graded ${graded} picks`);
    } catch (err) {
        // Non-fatal — grading failures should never break the picks API
        console.error('[Inline Grade] Error (non-fatal):', err);
    }
}

/** Fuzzy team name matching — handles "Tigers" vs "Detroit Tigers" */
function isTeamMatch(pickTeam: string, apiTeam: string): boolean {
    const pick = pickTeam.toLowerCase().trim();
    const api = apiTeam.toLowerCase().trim();
    if (pick === api) return true;
    if (api.includes(pick) || pick.includes(api)) return true;
    const pickLast = pick.split(' ').pop() || '';
    const apiLast = api.split(' ').pop() || '';
    return pickLast === apiLast && pickLast.length > 2;
}
