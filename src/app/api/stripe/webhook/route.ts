import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { handlePaymentSuccess, handlePaymentFailure, logToModChannel } from '@/lib/discord';

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
                const discordUsername = session.metadata?.discord_username;
                const tierName = session.metadata?.tier_name || 'Unknown Tier';
                const tierId = session.metadata?.tier_id;

                if (discordUsername) {
                    await handlePaymentSuccess(discordUsername, tierName, tierId);
                    await logToModChannel(
                        `💳 New subscription: **${discordUsername}** → ${tierName} | Email: ${session.customer_email || 'N/A'}`
                    );
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const invoice = event.data.object as any;
                const subscriptionId = typeof invoice.subscription === 'string'
                    ? invoice.subscription
                    : invoice.subscription?.id;

                if (subscriptionId) {
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                    const discordUsername = subscription.metadata?.discord_username;
                    const tierName = subscription.metadata?.tier_name || 'Unknown Tier';

                    if (discordUsername) {
                        await logToModChannel(`✅ Payment succeeded: **${discordUsername}** → ${tierName}`);
                    }
                }
                break;
            }

            case 'invoice.payment_failed': {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const invoice = event.data.object as any;
                const subscriptionId = typeof invoice.subscription === 'string'
                    ? invoice.subscription
                    : invoice.subscription?.id;

                if (subscriptionId) {
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                    const discordUsername = subscription.metadata?.discord_username;

                    if (discordUsername) {
                        await handlePaymentFailure(discordUsername);
                        await logToModChannel(
                            `🚫 Payment FAILED: **${discordUsername}** — KICKED from server`
                        );
                    }
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const discordUsername = subscription.metadata?.discord_username;

                if (discordUsername) {
                    await handlePaymentFailure(discordUsername);
                    await logToModChannel(
                        `❌ Subscription cancelled: **${discordUsername}** — KICKED from server`
                    );
                }
                break;
            }

            case 'charge.refunded': {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const charge = event.data.object as any;
                const customerId = typeof charge.customer === 'string' ? charge.customer : charge.customer?.id;

                if (customerId) {
                    // Look up subscriptions for this customer to find Discord username
                    const subscriptions = await stripe.subscriptions.list({ customer: customerId, limit: 1 });
                    const discordUsername = subscriptions.data[0]?.metadata?.discord_username;

                    if (discordUsername) {
                        await handlePaymentFailure(discordUsername);
                        await logToModChannel(
                            `💸 Charge REFUNDED / Chargeback: **${discordUsername}** — KICKED from server`
                        );
                    }
                }
                break;
            }

            default:
                // Unhandled event type
                console.log(`Unhandled event type: ${event.type}`);
        }
    } catch (error) {
        console.error(`Error processing webhook event ${event.type}:`, error);
        // Still return 200 to acknowledge receipt — we'll handle failures via cron
        await logToModChannel(`⚠️ Webhook processing error for event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
