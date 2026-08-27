import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { tiers } from '@/lib/tiers';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tierId, name, email, referralCode } = body;

        // Validate inputs
        if (!tierId || !name || !email) {
            return NextResponse.json(
                { error: 'All fields are required (name, email).' },
                { status: 400 }
            );
        }

        // Find tier
        const tier = tiers.find((t) => t.id === tierId);
        if (!tier) {
            return NextResponse.json({ error: 'Invalid tier selected.' }, { status: 400 });
        }

        // Create Stripe Checkout Session
        const isOneTime = tier.isOneTime === true;

        // Weekly, Monthly and Annual have no STRIPE_PRICE_* env var on this
        // project, so tier.priceId resolves to '' and Stripe rejects the
        // session ("You passed an empty string for line_items[0][price]").
        // That is why only the Daily Pass, whose price id is hardcoded, has
        // been purchasable.
        //
        // When there is no Price object, build the line item inline instead.
        // Stripe accepts price_data and creates the price itself, so all four
        // plans charge the correct amount on the correct interval with no
        // dashboard access needed.
        //
        // This is a stopgap. Inline price_data makes Stripe create an ad-hoc
        // Product per session, which clutters reporting. Replace it by setting
        // real Price ids the way 'daily' already does.
        const STRIPE_INTERVALS = ['day', 'week', 'month', 'year'] as const;
        type StripeInterval = (typeof STRIPE_INTERVALS)[number];

        let lineItem: Stripe.Checkout.SessionCreateParams.LineItem;
        if (tier.priceId) {
            lineItem = { price: tier.priceId, quantity: 1 };
        } else {
            // Never guess an interval. Charging monthly for an annual plan is
            // worse than refusing the sale, and a wrong guess would be silent.
            if (!isOneTime && !STRIPE_INTERVALS.includes(tier.interval as StripeInterval)) {
                console.error(`[checkout] tier ${tier.id} has no priceId and an unusable interval:`, tier.interval);
                return NextResponse.json(
                    { error: 'This plan is not available right now. Please contact support.' },
                    { status: 500 },
                );
            }
            lineItem = {
                quantity: 1,
                price_data: {
                    currency: 'usd',
                    unit_amount: Math.round(tier.price * 100),
                    product_data: { name: `YourSwami ${tier.name}` },
                    ...(isOneTime
                        ? {}
                        : { recurring: { interval: tier.interval as StripeInterval } }),
                },
            };
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: isOneTime ? 'payment' : 'subscription',
            customer_email: email,
            line_items: [lineItem],
            metadata: {
                customer_name: name,
                tier_id: tierId,
                tier_name: tier.name,
                ...(referralCode ? { affiliate_code: referralCode } : {}),
            },
            ...(isOneTime
                ? {}
                : {
                      subscription_data: {
                          metadata: {
                              tier_id: tierId,
                              tier_name: tier.name,
                              ...(referralCode ? { affiliate_code: referralCode } : {}),
                          },
                          ...(tier.trialDays
                              ? { trial_period_days: tier.trialDays }
                              : {}),
                      },
                  }),
            success_url: `${request.nextUrl.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${request.nextUrl.origin}/pricing`,
            allow_promotion_codes: true,
        });

        return NextResponse.json({ url: session.url });
    } catch (error: unknown) {
        console.error('Checkout session error:', error);
        const message = error instanceof Error ? error.message : 'Failed to create checkout session';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
