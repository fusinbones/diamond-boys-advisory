import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const API_LOGIN_ID = process.env.AUTHORIZE_NET_API_LOGIN_ID || '';
const TRANSACTION_KEY = process.env.AUTHORIZE_NET_TRANSACTION_KEY || '';
const API_URL = 'https://api.authorize.net/xml/v1/request.api';

interface PurchaseBody {
    dataDescriptor: string;
    dataValue: string;
    amount: number;
    name: string;
    email: string;
    product: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: PurchaseBody = await request.json();
        const { dataDescriptor, dataValue, amount, name, email, product } = body;

        if (!dataDescriptor || !dataValue || !amount || !name || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Build Authorize.net createTransactionRequest
        const transactionRequest = {
            createTransactionRequest: {
                merchantAuthentication: {
                    name: API_LOGIN_ID,
                    transactionKey: TRANSACTION_KEY,
                },
                transactionRequest: {
                    transactionType: 'authCaptureTransaction',
                    amount: amount.toFixed(2),
                    payment: {
                        opaqueData: {
                            dataDescriptor,
                            dataValue,
                        },
                    },
                    order: {
                        invoiceNumber: `FC-${Date.now().toString(36).toUpperCase()}`,
                        description: product || 'The Fire Course',
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

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transactionRequest),
        });

        const rawText = await response.text();
        // Authorize.net returns BOM sometimes — strip it
        const cleanText = rawText.replace(/^\uFEFF/, '');
        const result = JSON.parse(cleanText);

        const messages = result?.messages;
        const transResult = result?.transactionResponse;

        if (messages?.resultCode !== 'Ok' || !transResult) {
            const errorMsg = messages?.message?.[0]?.text
                || transResult?.errors?.[0]?.errorText
                || 'Payment processing failed';
            console.error('[course/purchase] Authorize.net error:', errorMsg);
            return NextResponse.json({ error: errorMsg }, { status: 400 });
        }

        if (transResult.responseCode !== '1') {
            const errorMsg = transResult.errors?.[0]?.errorText || 'Transaction declined';
            console.error('[course/purchase] Transaction declined:', errorMsg);
            return NextResponse.json({ error: errorMsg }, { status: 400 });
        }

        // Generate access token
        const accessToken = crypto.randomBytes(32).toString('hex');
        const transactionId = transResult.transId;

        // Store purchase in Supabase
        try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            );

            await supabaseAdmin.from('course_purchases').insert({
                user_email: email,
                user_name: name,
                transaction_id: transactionId,
                amount,
                auth_code: transResult.authCode || null,
                status: 'completed',
                access_token: accessToken,
            });
        } catch (dbErr) {
            console.error('[course/purchase] DB insert error (payment succeeded):', dbErr);
            // Payment went through — don't fail the user
        }

        console.log(`[course/purchase] ✅ $${amount} charged to ${email} (txn: ${transactionId})`);

        return NextResponse.json({
            success: true,
            transactionId,
            accessToken,
        });
    } catch (error) {
        console.error('[course/purchase] Unexpected error:', error);
        return NextResponse.json({ error: 'Payment processing failed. Please try again.' }, { status: 500 });
    }
}
