import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    const toNumber = '+19172252555';

    if (!accountSid || !authToken || !fromNumber) {
        return NextResponse.json({
            error: 'Missing env vars',
            has_sid: !!accountSid,
            has_token: !!authToken,
            has_from: !!fromNumber,
        });
    }

    try {
        const params = new URLSearchParams({
            To: toNumber,
            From: fromNumber,
            Body: '🔥 TriplePlayz Test: SMS notifications are working!',
        });

        const res = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            }
        );

        const data = await res.json();
        return NextResponse.json({ status: res.status, response: data });
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
}
