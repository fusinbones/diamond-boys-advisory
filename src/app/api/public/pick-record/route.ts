import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Public endpoint: returns the win/loss record and streak for premium picks.
 * No auth required — this data is intentionally public to drive conversions.
 */
export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Get all resolved picks (not pending) from the last 90 days
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const { data: picks, error } = await supabase
            .from('picks')
            .select('id, result, created_at')
            .neq('result', 'pending')
            .gte('game_date', ninetyDaysAgo.toISOString().split('T')[0])
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!picks || picks.length === 0) {
            return NextResponse.json({
                total: 0, wins: 0, losses: 0, pushes: 0,
                winPct: '0', streak: 0, streakType: 'none',
            });
        }

        const wins = picks.filter(p => p.result === 'hit').length;
        const losses = picks.filter(p => p.result === 'miss').length;
        const pushes = picks.filter(p => p.result === 'push').length;
        const total = wins + losses; // Pushes don't count for win %

        // Calculate current streak (most recent first)
        let streak = 0;
        let streakType: 'W' | 'L' | 'none' = 'none';
        for (const pick of picks) {
            if (pick.result === 'push') continue; // Skip pushes
            if (streakType === 'none') {
                streakType = pick.result === 'hit' ? 'W' : 'L';
                streak = 1;
            } else if ((pick.result === 'hit' && streakType === 'W') || (pick.result === 'miss' && streakType === 'L')) {
                streak++;
            } else {
                break; // Streak broken
            }
        }

        return NextResponse.json({
            total: picks.length,
            wins,
            losses,
            pushes,
            winPct: total > 0 ? ((wins / total) * 100).toFixed(1) : '0',
            streak,
            streakType,
        });
    } catch (error) {
        console.error('Pick record error:', error);
        return NextResponse.json({
            total: 0, wins: 0, losses: 0, pushes: 0,
            winPct: '0', streak: 0, streakType: 'none',
        });
    }
}
