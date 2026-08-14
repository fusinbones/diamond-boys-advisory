import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/**
 * POST /api/subscribers/phone — Upsert phone number into pick_subscribers
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as { email?: string; phone?: string };
        const { email, phone } = body;

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
        }

        if (!phone || phone.trim().length < 7) {
            return NextResponse.json({ error: 'Valid phone number is required' }, { status: 400 });
        }

        // Upsert: if the email exists, update the phone; otherwise insert a new row
        const { error } = await supabaseAdmin
            .from('pick_subscribers')
            .upsert(
                {
                    email: email.toLowerCase().trim(),
                    phone: phone.trim(),
                    active: true,
                    source: 'dashboard_phone_popup',
                },
                { onConflict: 'email' }
            );

        if (error) {
            console.error('Supabase upsert error:', { module: 'subscribers/phone', action: 'upsert', error: error.message });
            return NextResponse.json({ error: 'Failed to save phone number' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Phone subscriber error:', { module: 'subscribers/phone', action: 'POST', error: err instanceof Error ? err.message : String(err) });
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
}
