import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());

async function isAdmin(request: NextRequest): Promise<boolean> {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return false;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user?.email) return false;
    return ADMIN_EMAILS.includes(user.email.toLowerCase());
}

/**
 * GET /api/admin/affiliates — List all affiliates with stats
 */
export async function GET(request: NextRequest) {
    if (!await isAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get all affiliates
        const { data: affiliates, error } = await supabaseAdmin
            .from('affiliates')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Get referral counts per affiliate
        const affiliateIds = (affiliates || []).map(a => a.id);
        let referralCounts: Record<string, number> = {};
        let totalCommission = 0;
        let totalPaidOut = 0;

        if (affiliateIds.length > 0) {
            const { data: referrals } = await supabaseAdmin
                .from('referrals')
                .select('affiliate_id, commission_amount')
                .in('affiliate_id', affiliateIds);

            if (referrals) {
                for (const ref of referrals) {
                    referralCounts[ref.affiliate_id] = (referralCounts[ref.affiliate_id] || 0) + 1;
                }
            }
        }

        // Enrich affiliates with referral count
        const enriched = (affiliates || []).map(a => {
            totalCommission += Number(a.total_earned) || 0;
            totalPaidOut += Number(a.total_paid) || 0;
            return {
                ...a,
                referral_count: referralCounts[a.id] || 0,
                balance: ((Number(a.total_earned) || 0) - (Number(a.total_paid) || 0)),
            };
        });

        return NextResponse.json({
            affiliates: enriched,
            summary: {
                total_affiliates: enriched.length,
                active_affiliates: enriched.filter(a => a.status === 'active').length,
                total_referrals: Object.values(referralCounts).reduce((sum, c) => sum + c, 0),
                total_commission: Math.round(totalCommission * 100) / 100,
                total_paid: Math.round(totalPaidOut * 100) / 100,
                total_owed: Math.round((totalCommission - totalPaidOut) * 100) / 100,
            },
        });
    } catch (error) {
        console.error('[admin/affiliates] GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/admin/affiliates — Update affiliate settings
 * Body: { affiliateId, commission_rate?, recurrence?, status? }
 */
export async function PUT(request: NextRequest) {
    if (!await isAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { affiliateId, commission_rate, recurrence, status } = body;

        if (!affiliateId) {
            return NextResponse.json({ error: 'affiliateId is required' }, { status: 400 });
        }

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (commission_rate !== undefined) {
            const rate = Number(commission_rate);
            if (rate < 1 || rate > 50) {
                return NextResponse.json({ error: 'Commission rate must be 1-50%' }, { status: 400 });
            }
            updates.commission_rate = rate;
        }
        if (recurrence !== undefined) {
            if (!['first_only', 'recurring', 'lifetime'].includes(recurrence)) {
                return NextResponse.json({ error: 'Invalid recurrence' }, { status: 400 });
            }
            updates.recurrence = recurrence;
        }
        if (status !== undefined) {
            if (!['active', 'paused', 'revoked'].includes(status)) {
                return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
            }
            updates.status = status;
        }

        const { data, error } = await supabaseAdmin
            .from('affiliates')
            .update(updates)
            .eq('id', affiliateId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ affiliate: data });
    } catch (error) {
        console.error('[admin/affiliates] PUT error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/admin/affiliates — Record a payout
 * Body: { affiliateId, amount, method, notes }
 */
export async function POST(request: NextRequest) {
    if (!await isAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { affiliateId, amount, method, notes } = body;

        if (!affiliateId || !amount || amount <= 0) {
            return NextResponse.json({ error: 'affiliateId and positive amount are required' }, { status: 400 });
        }

        // Get current affiliate
        const { data: affiliate } = await supabaseAdmin
            .from('affiliates')
            .select('id, total_paid, total_earned')
            .eq('id', affiliateId)
            .single();

        if (!affiliate) {
            return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
        }

        // Record payout
        const { error: payoutError } = await supabaseAdmin
            .from('affiliate_payouts')
            .insert({
                affiliate_id: affiliateId,
                amount: Number(amount),
                method: method || 'paypal',
                notes: notes || null,
                paid_by: 'admin',
            });

        if (payoutError) throw payoutError;

        // Update total_paid
        const newTotalPaid = (Number(affiliate.total_paid) || 0) + Number(amount);
        const { error: updateError } = await supabaseAdmin
            .from('affiliates')
            .update({ total_paid: newTotalPaid, updated_at: new Date().toISOString() })
            .eq('id', affiliateId);

        if (updateError) throw updateError;

        // Mark referrals as paid up to the payout amount
        await supabaseAdmin
            .from('referrals')
            .update({ status: 'paid' })
            .eq('affiliate_id', affiliateId)
            .eq('status', 'confirmed');

        return NextResponse.json({ success: true, total_paid: newTotalPaid });
    } catch (error) {
        console.error('[admin/affiliates] POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
