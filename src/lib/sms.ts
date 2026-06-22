const TWILIO_API = 'https://api.twilio.com/2010-04-01';

interface TwilioConfig {
    accountSid: string;
    authToken: string;
    fromNumber: string;
}

function getTwilioConfig(): TwilioConfig | null {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!accountSid || !authToken || !fromNumber) return null;
    return { accountSid, authToken, fromNumber };
}

async function sendSms(
    to: string,
    body: string
): Promise<{ success: boolean; error?: string }> {
    const config = getTwilioConfig();
    if (!config) return { success: false, error: 'Twilio not configured' };

    try {
        const params = new URLSearchParams({
            To: to,
            From: config.fromNumber,
            Body: body,
        });

        const res = await fetch(
            `${TWILIO_API}/Accounts/${config.accountSid}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            }
        );

        if (!res.ok) {
            const errorData = await res.text();
            console.error('[SMS] Twilio error:', { status: res.status, body: errorData });
            return { success: false, error: `Twilio ${res.status}` };
        }

        return { success: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'SMS send failed';
        console.error('[SMS] Twilio request failed:', { error: message });
        return { success: false, error: message };
    }
}

export async function sendPickAlertSms(
    phoneNumbers: string[],
    pick: { pickTeam: string; pickValue: string; matchup: string; confidence: number }
): Promise<{ success: boolean; sent: number; errors: number }> {
    if (phoneNumbers.length === 0) return { success: true, sent: 0, errors: 0 };

    const body = `🔥 FIRE PICK\n\n${pick.pickTeam} ${pick.pickValue}\n${pick.matchup}\nConfidence: ${pick.confidence}%\n\nView details: tripleplayz.com/dashboard`;

    let sent = 0;
    let errors = 0;
    for (const phone of phoneNumbers) {
        const result = await sendSms(phone, body);
        if (result.success) sent++;
        else errors++;
    }

    return { success: errors === 0, sent, errors };
}

export async function sendResultSms(
    phoneNumbers: string[],
    pick: { pickTeam: string; pickValue: string; result: 'win' | 'loss' | 'push'; record: { wins: number; losses: number } }
): Promise<{ success: boolean; sent: number; errors: number }> {
    if (phoneNumbers.length === 0) return { success: true, sent: 0, errors: 0 };

    const emoji = pick.result === 'win' ? '✅' : pick.result === 'push' ? '🔄' : '❌';
    const label = pick.result === 'win' ? 'WIN' : pick.result === 'push' ? 'PUSH' : 'LOSS';

    const body = `${emoji} ${label}: ${pick.pickTeam} ${pick.pickValue}\n\nSeason Record: ${pick.record.wins}-${pick.record.losses}\n\ntripleplayz.com/dashboard`;

    let sent = 0;
    let errors = 0;
    for (const phone of phoneNumbers) {
        const result = await sendSms(phone, body);
        if (result.success) sent++;
        else errors++;
    }

    return { success: errors === 0, sent, errors };
}
