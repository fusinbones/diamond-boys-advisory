import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const now = new Date().toISOString();

        // Get the latest fire pick that is scheduled or revealed
        const { data, error } = await supabaseAdmin
            .from('fire_picks')
            .select('*')
            .in('status', ['scheduled', 'revealed'])
            .order('scheduled_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

        if (!data) {
            return NextResponse.json({ firePick: null });
        }

        const isRevealed = data.status === 'revealed' || new Date(data.scheduled_at) <= new Date(now);

        // If it should be revealed but status is still 'scheduled', auto-reveal it
        if (isRevealed && data.status === 'scheduled') {
            await supabaseAdmin
                .from('fire_picks')
                .update({ status: 'revealed', revealed_at: now })
                .eq('id', data.id);
            data.status = 'revealed';
            data.revealed_at = now;
        }

        // Return teaser for scheduled, full details for revealed
        if (!isRevealed) {
            return NextResponse.json({
                firePick: {
                    id: data.id,
                    matchup: data.matchup,
                    sport: data.sport,
                    scheduled_at: data.scheduled_at,
                    status: 'scheduled',
                    confidence: data.confidence,
                    units: data.units,
                },
            });
        }

        return NextResponse.json({ firePick: data });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message, firePick: null }, { status: 500 });
    }
}
