import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: updated, error } = await supabase
        .from('picks')
        .update({ game_date: '2026-03-27' })
        .eq('source', 'ai_consensus')
        .eq('game_date', '2026-03-26')
        .select();

    return NextResponse.json({ fixedCount: updated?.length || 0, error });
}
