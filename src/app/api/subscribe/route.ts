import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
        }

        const API_KEY = process.env.MAILCHIMP_API_KEY;
        const SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX;
        const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;

        if (!API_KEY || !SERVER_PREFIX || !AUDIENCE_ID) {
            console.error('Mailchimp env vars not set');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const response = await fetch(
            `https://${SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${Buffer.from(`anystring:${API_KEY}`).toString('base64')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email_address: email,
                    status: 'subscribed',
                    tags: ['early-access', 'website-signup'],
                }),
            }
        );

        const data = await response.json();

        if (response.ok) {
            return NextResponse.json({ success: true, message: "You're on the list!" });
        }

        // Already subscribed is still a success
        if (data.title === 'Member Exists') {
            return NextResponse.json({ success: true, message: "You're already on the early access list!" });
        }

        console.error('Mailchimp error:', data);
        return NextResponse.json({ error: data.detail || 'Failed to subscribe' }, { status: 400 });
    } catch (error) {
        console.error('Subscribe error:', error);
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
}
