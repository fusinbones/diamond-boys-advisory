import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/** Generate a random 6-char alphanumeric affiliate code */
function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 for clarity
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `TP-${code}`;
}

/** Extract user ID from Supabase JWT */
async function getUserFromAuth(request: NextRequest): Promise<{ userId: string; email: string } | null> {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) return null;
    return { userId: user.id, email: user.email || '' };
}

/**
 * GET /api/affiliates — Get current user's affiliate data + referrals
 */
export async function GET(request: NextRequest) {
    try {
        const auth = await getUserFromAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get affiliate data
        const { data: affiliate } = await supabaseAdmin
            .from('affiliates')
            .select('*')
            .eq('user_id', auth.userId)
            .single();

        if (!affiliate) {
            return NextResponse.json({ affiliate: null, referrals: [] });
        }

        // Get referrals
        const { data: referrals } = await supabaseAdmin
            .from('referrals')
            .select('id, referred_email, tier_id, tier_price, commission_amount, status, converted_at')
            .eq('affiliate_id', affiliate.id)
            .order('converted_at', { ascending: false })
            .limit(50);

        // Get payouts
        const { data: payouts } = await supabaseAdmin
            .from('affiliate_payouts')
            .select('id, amount, method, notes, paid_at')
            .eq('affiliate_id', affiliate.id)
            .order('paid_at', { ascending: false })
            .limit(20);

        return NextResponse.json({
            affiliate,
            referrals: referrals || [],
            payouts: payouts || [],
        });
    } catch (error) {
        console.error('[affiliates] GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/affiliates — Activate affiliate account for current user
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await getUserFromAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if already an affiliate
        const { data: existing } = await supabaseAdmin
            .from('affiliates')
            .select('id, affiliate_code')
            .eq('user_id', auth.userId)
            .single();

        if (existing) {
            return NextResponse.json({ affiliate: existing, message: 'Already activated' });
        }

        // Generate unique code with retry
        let code = generateCode();
        let attempts = 0;
        while (attempts < 5) {
            const { data: collision } = await supabaseAdmin
                .from('affiliates')
                .select('id')
                .eq('affiliate_code', code)
                .single();

            if (!collision) break;
            code = generateCode();
            attempts++;
        }

        // Insert affiliate
        const { data: affiliate, error } = await supabaseAdmin
            .from('affiliates')
            .insert({
                user_id: auth.userId,
                email: auth.email,
                affiliate_code: code,
            })
            .select()
            .single();

        if (error) {
            console.error('[affiliates] Insert error:', error);
            return NextResponse.json({ error: 'Failed to activate affiliate account' }, { status: 500 });
        }

        return NextResponse.json({ affiliate, message: 'Affiliate account activated!' });
    } catch (error) {
        console.error('[affiliates] POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
