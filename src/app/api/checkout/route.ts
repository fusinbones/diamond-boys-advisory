import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { tiers } from '@/lib/tiers';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tierId, name, email } = body;

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
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: isOneTime ? 'payment' : 'subscription',
            customer_email: email,
            line_items: [
                {
                    price: tier.priceId,
                    quantity: 1,
                },
            ],
            metadata: {
                customer_name: name,
                tier_id: tierId,
                tier_name: tier.name,
            },
            ...(isOneTime
                ? {}
                : {
                      subscription_data: {
                          metadata: {
                              tier_id: tierId,
                              tier_name: tier.name,
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
