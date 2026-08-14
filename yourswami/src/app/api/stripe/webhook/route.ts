import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
}

/** Look up a Supabase user by email and update their subscription_tier */
async function updateUserTier(email: string, tier: string | null): Promise<boolean> {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
        const authUser = authUsers?.users?.find(
            (u) => u.email?.toLowerCase() === email.toLowerCase()
        );
        if (!authUser) {
            console.error(`[webhook] No Supabase user found for email: ${email}`);
            return false;
        }

        const { error } = await supabaseAdmin
            .from('user_profiles')
            .update({ subscription_tier: tier })
            .eq('id', authUser.id);

        if (error) {
            console.error(`[webhook] Failed to update tier for ${email}:`, error.message);
            return false;
        }

        console.log(`[webhook] Updated ${email} → subscription_tier: ${tier}`);
        return true;
    } catch (err) {
        console.error(`[webhook] updateUserTier error:`, err);
        return false;
    }
}

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET is not set');
        return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Webhook signature verification failed: ${message}`);
        return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const tierId = session.metadata?.tier_id;
                const tierName = session.metadata?.tier_name || 'Unknown';
                const customerEmail = session.customer_email || session.customer_details?.email;

                // Update Supabase subscription tier
                if (customerEmail && tierId) {
                    const success = await updateUserTier(customerEmail, tierId);
                    console.log(`[webhook] checkout.session.completed: ${customerEmail} → ${tierId} (${success ? 'OK' : 'FAILED'})`);
                } else {
                    console.error(`[webhook] checkout.session.completed: missing email (${customerEmail}) or tierId (${tierId})`);
                }

                console.log(`[webhook] 💳 New subscription: ${customerEmail || 'N/A'} → ${tierName} (${tierId})`);

                // ── Affiliate Referral Attribution ──
                const affiliateCode = session.metadata?.affiliate_code;
                if (affiliateCode && customerEmail) {
                    try {
                        const supabaseAdmin = getSupabaseAdmin();

                        // Look up the affiliate
                        const { data: affiliate } = await supabaseAdmin
                            .from('affiliates')
                            .select('id, commission_rate, status, total_earned')
                            .eq('affiliate_code', affiliateCode)
                            .single();

                        if (affiliate && affiliate.status === 'active') {
                            // Calculate commission from the session amount
                            const amountPaid = (session.amount_total || 0) / 100; // cents → dollars
                            const commission = Math.round(amountPaid * (affiliate.commission_rate / 100) * 100) / 100;

                            // Create referral record
                            await supabaseAdmin.from('referrals').insert({
                                affiliate_id: affiliate.id,
                                referred_email: customerEmail,
                                stripe_session_id: session.id,
                                stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
                                tier_id: tierId,
                                tier_price: amountPaid,
                                commission_amount: commission,
                                status: 'confirmed',
                            });

                            // Update affiliate total_earned
                            await supabaseAdmin
                                .from('affiliates')
                                .update({ total_earned: (affiliate.total_earned || 0) + commission, updated_at: new Date().toISOString() })
                                .eq('id', affiliate.id);

                            console.log(`[webhook] 🤝 Referral attributed: ${affiliateCode} → ${customerEmail} ($${commission} commission)`);
                        } else {
                            console.log(`[webhook] Affiliate ${affiliateCode} not found or not active`);
                        }
                    } catch (err) {
                        console.error(`[webhook] Affiliate attribution error:`, err);
                    }
                }

                break;
            }

            case 'invoice.payment_succeeded': {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const invoice = event.data.object as any;
                const subscriptionId = typeof invoice.subscription === 'string'
                    ? invoice.subscription
                    : (invoice.subscription as Stripe.Subscription | null)?.id;

                if (subscriptionId) {
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                    const tierId = subscription.metadata?.tier_id;
                    const customerEmail = invoice.customer_email;

                    // Re-confirm tier on renewal
                    if (customerEmail && tierId) {
                        await updateUserTier(customerEmail, tierId);
                    }

                    console.log(`[webhook] ✅ Payment succeeded: ${customerEmail} → ${tierId}`);
                }
                break;
            }

            case 'invoice.payment_failed': {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const invoice = event.data.object as any;
                const customerEmail = invoice.customer_email;

                // Revoke access on failed payment
                if (customerEmail) {
                    await updateUserTier(customerEmail, null);
                    console.log(`[webhook] 🚫 Payment FAILED: ${customerEmail} — access revoked`);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = typeof subscription.customer === 'string'
                    ? subscription.customer
                    : subscription.customer?.id;

                if (customerId) {
                    try {
                        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
                        if (customer.email) {
                            await updateUserTier(customer.email, null);
                            console.log(`[webhook] ❌ Subscription cancelled: ${customer.email} — access revoked`);
                        }
                    } catch (err) {
                        console.error(`[webhook] Could not retrieve customer ${customerId}:`, err);
                    }
                }
                break;
            }

            case 'charge.refunded': {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const charge = event.data.object as any;
                const customerId = typeof charge.customer === 'string' ? charge.customer : charge.customer?.id;

                if (customerId) {
                    try {
                        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
                        if (customer.email) {
                            await updateUserTier(customer.email, null);
                            console.log(`[webhook] 💸 Refund/chargeback: ${customer.email} — access revoked`);
                        }
                    } catch (err) {
                        console.error(`[webhook] Could not retrieve customer ${customerId}:`, err);
                    }
                }
                break;
            }

            default:
                console.log(`[webhook] Unhandled event type: ${event.type}`);
        }
    } catch (error) {
        console.error(`[webhook] Error processing ${event.type}:`, error);
    }

    return NextResponse.json({ received: true });
}
