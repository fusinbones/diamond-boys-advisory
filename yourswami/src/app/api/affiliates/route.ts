import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/**
 * Generate a personal, catchy affiliate code from the user's identity.
 * Strategy: Take the user's name/nickname → uppercase → 3-5 chars + a digit
 * Examples: MIKE7, ANDY3, JSMITH, CHRIS
 * Falls back to a clean 5-char random code if no identity data.
 */
function generatePersonalCode(name: string | null, email: string): string {
    // Clean up the base: nickname > display_name > email prefix
    let base = '';

    if (name && name.trim().length >= 2) {
        // Use their name — strip non-alphanumeric, uppercase
        base = name.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    } else {
        // Fall back to email prefix (before @)
        const emailPrefix = email.split('@')[0] || '';
        base = emailPrefix.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    }

    // Trim to 5 chars max for the alpha part
    if (base.length > 5) base = base.slice(0, 5);
    if (base.length < 2) base = 'PLAY'; // absolute fallback

    return base;
}

/** Generate a fully random 5-char fallback code */
function generateRandomCode(): string {
    const chars = 'ABCDEFGHJKMNPQRSTVWXYZ'; // no I/L/O/U for clarity
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
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

        // Fetch user profile for personal code generation
        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('nickname, display_name')
            .eq('id', auth.userId)
            .single();

        const identity = profile?.nickname || profile?.display_name || null;
        const base = generatePersonalCode(identity, auth.email);

        // Try personal code variants: MIKE, MIKE1, MIKE2, etc.
        let code = base;
        let suffix = 0;
        let found = false;

        for (let attempt = 0; attempt < 20; attempt++) {
            const candidate = suffix === 0 ? base : `${base}${suffix}`;
            const { data: collision } = await supabaseAdmin
                .from('affiliates')
                .select('id')
                .eq('affiliate_code', candidate)
                .single();

            if (!collision) {
                code = candidate;
                found = true;
                break;
            }
            suffix++;
        }

        // If all personal variants taken, use random fallback
        if (!found) {
            code = generateRandomCode();
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
