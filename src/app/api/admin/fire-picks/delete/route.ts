import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Admin endpoint to delete fire picks by ID.
 * POST body: { ids: string[] }
 */
export async function POST(request: NextRequest) {
    try {
        const { ids } = await request.json();
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'ids array required' }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { error, count } = await supabase
            .from('fire_picks')
            .delete()
            .in('id', ids);

        if (error) throw error;

        return NextResponse.json({ success: true, deleted: count || ids.length });
    } catch (error) {
        console.error('Fire pick delete error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Delete failed' },
            { status: 500 }
        );
    }
}
