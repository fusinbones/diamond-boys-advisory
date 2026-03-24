import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminEmail } from '@/lib/adminAuth';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
    );
}

interface UserRow {
    id: string;
    display_name: string;
    subscription_tier: string | null;
    trial_end: string | null;
    trial_bonus_days: number;
    last_seen_at: string | null;
    notes: string | null;
    created_at: string;
    is_admin: boolean;
    avatar_color: string;
}

// GET — list all users with their profiles
export async function GET(request: NextRequest) {
    try {
        // Auth check — verify admin via header or cookie
        const authHeader = request.headers.get('x-admin-email');
        if (!authHeader || !isAdminEmail(authHeader)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabase();

        // Fetch all user profiles
        const { data: profiles, error } = await supabase
            .from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch auth users for email info (service role only)
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) throw authError;

        const authUsers = authData?.users || [];
        const emailMap = new Map(authUsers.map(u => [u.id, { email: u.email, email_confirmed: !!u.email_confirmed_at }]));

        const now = new Date();

        const users = (profiles || []).map((p: UserRow) => {
            const auth = emailMap.get(p.id);
            const trialEnd = p.trial_end ? new Date(p.trial_end) : new Date(new Date(p.created_at).getTime() + 7 * 86400000);
            const bonusDays = p.trial_bonus_days || 0;
            const effectiveEnd = new Date(trialEnd.getTime() + bonusDays * 86400000);
            const daysLeft = Math.max(0, Math.ceil((effectiveEnd.getTime() - now.getTime()) / 86400000));
            const isPaid = !!p.subscription_tier && ['starter', 'pro', 'elite', 'daily', 'weekly', 'monthly', 'season'].includes(p.subscription_tier);

            let status: string;
            if (isPaid) status = 'paid';
            else if (daysLeft > 0) status = daysLeft <= 2 ? 'expiring' : 'trial';
            else status = 'expired';

            return {
                id: p.id,
                email: auth?.email || 'unknown',
                emailConfirmed: auth?.email_confirmed || false,
                displayName: p.display_name,
                tier: p.subscription_tier || 'free',
                trialEnd: effectiveEnd.toISOString(),
                trialDaysLeft: daysLeft,
                trialBonusDays: bonusDays,
                status,
                isPaid,
                isAdmin: p.is_admin,
                lastSeen: p.last_seen_at,
                notes: p.notes,
                createdAt: p.created_at,
                avatarColor: p.avatar_color,
            };
        });

        // Stats
        const totalUsers = users.length;
        const activeTrials = users.filter(u => u.status === 'trial' || u.status === 'expiring').length;
        const expiredTrials = users.filter(u => u.status === 'expired').length;
        const paidUsers = users.filter(u => u.status === 'paid').length;
        const expiringToday = users.filter(u => u.status === 'expiring').length;

        return NextResponse.json({
            users,
            stats: { totalUsers, activeTrials, expiredTrials, paidUsers, expiringToday },
        });
    } catch (error) {
        console.error('Admin users error:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// PATCH — update user (grant bonus days, change tier, add notes)
export async function PATCH(request: NextRequest) {
    try {
        const authHeader = request.headers.get('x-admin-email');
        if (!authHeader || !isAdminEmail(authHeader)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { userId, action, value } = body as { userId: string; action: string; value: string | number };

        if (!userId || !action) {
            return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 });
        }

        const supabase = getSupabase();

        switch (action) {
            case 'grantBonusDays': {
                const days = Number(value);
                if (isNaN(days) || days <= 0) {
                    return NextResponse.json({ error: 'Invalid days value' }, { status: 400 });
                }
                // Add to existing bonus days
                const { data: current } = await supabase
                    .from('user_profiles')
                    .select('trial_bonus_days')
                    .eq('id', userId)
                    .single();

                const currentBonus = current?.trial_bonus_days || 0;
                const { error } = await supabase
                    .from('user_profiles')
                    .update({ trial_bonus_days: currentBonus + days })
                    .eq('id', userId);
                if (error) throw error;
                break;
            }

            case 'changeTier': {
                const tier = String(value);
                if (!['free', 'starter', 'pro', 'elite'].includes(tier)) {
                    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
                }
                const { error } = await supabase
                    .from('user_profiles')
                    .update({ subscription_tier: tier })
                    .eq('id', userId);
                if (error) throw error;
                break;
            }

            case 'addNote': {
                const note = String(value).trim();
                const { data: current } = await supabase
                    .from('user_profiles')
                    .select('notes')
                    .eq('id', userId)
                    .single();

                const existingNotes = current?.notes || '';
                const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const newNotes = existingNotes
                    ? `${existingNotes}\n[${timestamp}] ${note}`
                    : `[${timestamp}] ${note}`;

                const { error } = await supabase
                    .from('user_profiles')
                    .update({ notes: newNotes })
                    .eq('id', userId);
                if (error) throw error;
                break;
            }

            default:
                return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin users PATCH error:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
