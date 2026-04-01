import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('fire_picks')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return NextResponse.json({ firePicks: data || [] });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

interface FirePickBody {
    game_id?: string;
    matchup: string;
    sport: string;
    pick_type: string;
    pick_team: string;
    pick_value: string;
    odds?: string;
    confidence?: number;
    units?: number;
    reasoning?: string;
    pattern_data?: Record<string, unknown>;
    pattern_break_game?: number;
    scheduled_at: string;
}

export async function POST(req: NextRequest) {
    try {
        const body: FirePickBody = await req.json();

        if (!body.matchup || !body.pick_type || !body.pick_team || !body.pick_value || !body.scheduled_at) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('fire_picks')
            .insert({
                game_id: body.game_id || null,
                matchup: body.matchup,
                sport: body.sport || 'MLB',
                pick_type: body.pick_type,
                pick_team: body.pick_team,
                pick_value: body.pick_value,
                odds: body.odds || null,
                confidence: body.confidence || 85,
                units: body.units || 3,
                reasoning: body.reasoning || null,
                pattern_data: body.pattern_data || null,
                pattern_break_game: body.pattern_break_game || 7,
                scheduled_at: body.scheduled_at,
                status: 'scheduled',
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ firePick: data });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing fire pick ID' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('fire_picks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ firePick: data });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        let id = searchParams.get('id');

        if (!id) {
            const body = await req.json().catch(() => ({}));
            id = body.id;
        }

        if (!id) {
            return NextResponse.json({ error: 'Missing fire pick ID' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('fire_picks')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
