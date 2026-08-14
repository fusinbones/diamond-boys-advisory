import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const dateFrom = searchParams.get('from');
        const dateTo = searchParams.get('to');
        const result = searchParams.get('result');
        const limit = Number(searchParams.get('limit')) || 50;

        let query = getSupabase()
            .from('picks')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (dateFrom) query = query.gte('game_date', dateFrom);
        if (dateTo) query = query.lte('game_date', dateTo);
        if (result && result !== 'all') query = query.eq('result', result);

        const { data, error } = await query;

        if (error) throw error;
        return NextResponse.json({ picks: data || [] });
    } catch (error) {
        console.error('Picks GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch picks' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { data, error } = await getSupabase()
            .from('picks')
            .insert(body)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ pick: data });
    } catch (error) {
        console.error('Picks POST error:', error);
        return NextResponse.json({ error: 'Failed to save pick' }, { status: 500 });
    }
}
