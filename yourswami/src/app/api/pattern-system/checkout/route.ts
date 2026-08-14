import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const API_LOGIN_ID = process.env.AUTHORIZE_NET_API_LOGIN_ID || '';
const TRANSACTION_KEY = process.env.AUTHORIZE_NET_TRANSACTION_KEY || '';
const API_URL = 'https://api.authorize.net/xml/v1/request.api';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface PurchaseBody {
    dataDescriptor: string;
    dataValue: string;
    name: string;
    email: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: PurchaseBody = await request.json();
        const { dataDescriptor, dataValue, name, email } = body;

        if (!dataDescriptor || !dataValue || !name || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Format today's date as YYYY-MM-DD for ARB startDate
        const today = new Date();
        const startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // Build Authorize.net ARBCreateSubscriptionRequest
        const subscriptionRequest = {
            ARBCreateSubscriptionRequest: {
                merchantAuthentication: {
                    name: API_LOGIN_ID,
                    transactionKey: TRANSACTION_KEY,
                },
                subscription: {
                    name: 'The .500 Method Pattern System',
                    paymentSchedule: {
                        interval: {
                            length: 1,
                            unit: 'months',
                        },
                        startDate,
                        totalOccurrences: 9999,
                    },
                    amount: '49.99',
                    payment: {
                        opaqueData: {
                            dataDescriptor,
                            dataValue,
                        },
                    },
                    order: {
                        invoiceNumber: `PS-${Date.now().toString(36).toUpperCase()}`,
                        description: 'The .500 Method - Pattern System',
                    },
                    customer: {
                        email,
                    },
                    billTo: {
                        firstName: name.split(' ')[0] || name,
                        lastName: name.split(' ').slice(1).join(' ') || '-',
                    },
                },
            },
        };

        console.log(`[pattern-system/checkout] Creating ARB subscription for ${email}`);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscriptionRequest),
        });

        const rawText = await response.text();
        // Authorize.net returns BOM sometimes — strip it
        const cleanText = rawText.replace(/^\uFEFF/, '');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = JSON.parse(cleanText);

        const messages = result?.messages;

        if (messages?.resultCode !== 'Ok') {
            const errorMsg = messages?.message?.[0]?.text || 'Subscription creation failed';
            console.error('[pattern-system/checkout] Authorize.net error:', errorMsg);
            return NextResponse.json({ error: errorMsg }, { status: 400 });
        }

        const subscriptionId = result?.subscriptionId || null;
        console.log(`[pattern-system/checkout] ✅ ARB subscription created: ${subscriptionId} for ${email}`);

        // ── Subscription successful — now provision the account ──
        const trimmedEmail = email.trim().toLowerCase();
        let userId: string | null = null;

        // 1. Create or find Supabase auth user
        try {
            const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
            const existing = existingUsers?.users?.find(
                (u: { email?: string }) => u.email?.toLowerCase() === trimmedEmail
            );

            if (existing) {
                userId = existing.id;
            } else {
                const tempPassword = crypto.randomBytes(24).toString('hex');
                const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
                    email: trimmedEmail,
                    password: tempPassword,
                    email_confirm: true,
                    user_metadata: { full_name: name, source: 'pattern_system' },
                });
                if (createErr) {
                    console.error('[pattern-system/checkout] User creation error:', createErr.message);
                } else {
                    userId = newUser?.user?.id || null;
                }
            }

            // 2. Upsert profile with subscription_tier = 'pattern'
            if (userId) {
                await supabaseAdmin.from('user_profiles').upsert({
                    id: userId,
                    subscription_tier: 'pattern',
                }, { onConflict: 'id' });
            }
        } catch (authErr) {
            console.error('[pattern-system/checkout] Auth provisioning error (subscription succeeded):', authErr);
        }

        // 3. Store subscription record
        try {
            await supabaseAdmin.from('pattern_subscriptions').insert({
                user_email: trimmedEmail,
                user_name: name,
                subscription_id: subscriptionId,
                amount: 49.99,
                status: 'active',
                user_id: userId,
            });
        } catch (dbErr) {
            console.error('[pattern-system/checkout] DB insert error (subscription succeeded):', dbErr);
        }

        // 4. Send magic link so they can log in immediately
        try {
            await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email: trimmedEmail,
            });
        } catch (linkErr) {
            console.error('[pattern-system/checkout] Magic link error:', linkErr);
        }

        console.log(`[pattern-system/checkout] ✅ Provisioned user ${trimmedEmail} (sub: ${subscriptionId}, user: ${userId})`);

        return NextResponse.json({
            success: true,
            subscriptionId,
            userId,
        });
    } catch (error) {
        console.error('[pattern-system/checkout] Unexpected error:', error);
        return NextResponse.json({ error: 'Subscription processing failed. Please try again.' }, { status: 500 });
    }
}
