import { NextRequest, NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

async function getSupabase() {
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
}

const ADMIN_EMAILS = [
    'support@tripleplayz.com',
    'diamondboysadvisory@gmail.com',
];

function isSuperAdmin(email: string): boolean {
    return ADMIN_EMAILS.includes(email.toLowerCase());
}

// GET — list all users with their profiles + auth data
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('x-admin-email');
        if (!authHeader || !isAdminEmail(authHeader)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await getSupabase();

        // Fetch all user profiles
        const { data: profiles, error } = await supabase
            .from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Profiles fetch error:', error);
            throw error;
        }

        // Fetch auth users for email info
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) {
            console.error('Auth users fetch error:', authError);
            throw authError;
        }

        const authUsers = authData?.users || [];
        const emailMap = new Map(authUsers.map(u => [
            u.id,
            {
                email: u.email || '',
                email_confirmed: !!u.email_confirmed_at,
                last_sign_in: u.last_sign_in_at || null,
                created_at_auth: u.created_at,
            },
        ]));

        const now = new Date();

        interface ProfileRow {
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
            role?: string;
        }

        const users = (profiles || []).map((p: ProfileRow) => {
            const auth = emailMap.get(p.id);
            const trialEnd = p.trial_end ? new Date(p.trial_end) : new Date(new Date(p.created_at).getTime() + 7 * 86400000);
            const bonusDays = p.trial_bonus_days || 0;
            const effectiveEnd = new Date(trialEnd.getTime() + bonusDays * 86400000);
            const daysLeft = Math.max(0, Math.ceil((effectiveEnd.getTime() - now.getTime()) / 86400000));
            const paidTiers = ['daily', 'weekly', 'monthly', 'season'];
            const isPaid = !!p.subscription_tier && paidTiers.includes(p.subscription_tier);

            let status: string;
            if (isPaid) status = 'paid';
            else if (daysLeft > 0) status = daysLeft <= 2 ? 'expiring' : 'trial';
            else status = 'expired';

            // Determine role
            let role = p.role || 'member';
            if (p.is_admin || (auth?.email && isSuperAdmin(auth.email))) role = 'admin';

            return {
                id: p.id,
                email: auth?.email || 'unknown',
                emailConfirmed: auth?.email_confirmed || false,
                displayName: p.display_name || auth?.email?.split('@')[0] || 'User',
                tier: p.subscription_tier || 'free',
                trialEnd: effectiveEnd.toISOString(),
                trialDaysLeft: daysLeft,
                trialBonusDays: bonusDays,
                status,
                isPaid,
                isAdmin: role === 'admin',
                role,
                lastSeen: p.last_seen_at,
                lastSignIn: auth?.last_sign_in || null,
                notes: p.notes,
                createdAt: p.created_at,
                avatarColor: p.avatar_color || `hsl(${Math.abs(p.id.charCodeAt(0) * 37) % 360}, 60%, 45%)`,
            };
        });

        // Stats
        const totalUsers = users.length;
        const activeTrials = users.filter((u: { status: string }) => u.status === 'trial' || u.status === 'expiring').length;
        const expiredTrials = users.filter((u: { status: string }) => u.status === 'expired').length;
        const paidUsers = users.filter((u: { status: string }) => u.status === 'paid').length;
        const expiringToday = users.filter((u: { status: string }) => u.status === 'expiring').length;
        const staffCount = users.filter((u: { role: string }) => u.role === 'staff').length;

        return NextResponse.json({
            users,
            stats: { totalUsers, activeTrials, expiredTrials, paidUsers, expiringToday, staffCount },
        });
    } catch (error) {
        console.error('Admin users error:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// PATCH — update user actions
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

        const supabase = await getSupabase();
        const callerIsSuper = isSuperAdmin(authHeader);

        switch (action) {
            case 'grantBonusDays': {
                const days = Number(value);
                if (isNaN(days) || days <= 0) {
                    return NextResponse.json({ error: 'Invalid days value' }, { status: 400 });
                }
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
                const validTiers = ['free', 'daily', 'weekly', 'monthly', 'season'];
                if (!validTiers.includes(tier)) {
                    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
                }
                const { error } = await supabase
                    .from('user_profiles')
                    .update({ subscription_tier: tier })
                    .eq('id', userId);
                if (error) throw error;
                break;
            }

            case 'setRole': {
                // Only super admins can set roles
                if (!callerIsSuper) {
                    return NextResponse.json({ error: 'Only super admins can change roles' }, { status: 403 });
                }
                const role = String(value);
                const validRoles = ['member', 'staff', 'admin'];
                if (!validRoles.includes(role)) {
                    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
                }
                const updates: Record<string, boolean | string> = { role };
                if (role === 'admin') updates.is_admin = true;
                else updates.is_admin = false;

                const { error } = await supabase
                    .from('user_profiles')
                    .update(updates)
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

            case 'deleteUser': {
                // Only super admins can delete users
                if (!callerIsSuper) {
                    return NextResponse.json({ error: 'Only super admins can delete users' }, { status: 403 });
                }
                // Delete profile first, then auth user
                await supabase.from('user_profiles').delete().eq('id', userId);
                const { error } = await supabase.auth.admin.deleteUser(userId);
                if (error) throw error;
                break;
            }

            case 'resetTrial': {
                const { error } = await supabase
                    .from('user_profiles')
                    .update({
                        trial_end: new Date(Date.now() + 7 * 86400000).toISOString(),
                        trial_bonus_days: 0,
                    })
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
