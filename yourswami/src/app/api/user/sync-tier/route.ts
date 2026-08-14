import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // Check if the user is in user_profiles
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('email', email)
            .single();

        let currentTier = profile?.subscription_tier;

        if (!profile) {
            // Find the auth user
            const { data: authUsers } = await supabase.auth.admin.listUsers();
            const authUser = authUsers?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

            if (authUser) {
                // The trigger failed to create the profile during signup, so we MUST heal it here
                const { error: insertError } = await supabase.from('user_profiles').insert({
                    id: authUser.id,
                    email: authUser.email,
                    display_name: authUser.user_metadata?.display_name || authUser.email?.split('@')[0],
                    avatar_color: '#' + Math.floor(Math.random()*16777215).toString(16),
                    subscription_tier: 'free',
                    trial_end: new Date(Date.now() + 7 * 86400000).toISOString()
                });

                if (insertError) {
                    console.error('Failed to heal profile:', insertError.message);
                } else {
                    currentTier = 'free';
                }
            } else {
                return NextResponse.json({ error: 'Supabase Auth user not found' }, { status: 404 });
            }
        }

        // Search Stripe for this email
        const customers = await stripe.customers.search({
            query: `email:"${email}"`,
            limit: 1,
        });

        if (customers.data.length > 0) {
            const customer = customers.data[0];
            const subscriptions = await stripe.subscriptions.list({
                customer: customer.id,
                status: 'active',
                limit: 1,
            });

            if (subscriptions.data.length > 0) {
                const sub = subscriptions.data[0];
                const activeTierId = sub.metadata?.tier_id;

                if (activeTierId && activeTierId !== currentTier) {
                    // Update user profile to match their real active Stripe subscription
                    await supabase
                        .from('user_profiles')
                        .update({ subscription_tier: activeTierId })
                        .eq('email', email);

                    return NextResponse.json({ success: true, healed: true, tier: activeTierId });
                }
            }
        }

        return NextResponse.json({ success: true, healed: false, tier: currentTier });
    } catch (err: any) {
        console.error('Sync Tier Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
