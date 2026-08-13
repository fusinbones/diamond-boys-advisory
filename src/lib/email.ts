const SENDGRID_API = 'https://api.sendgrid.com/v3/mail/send';
const FROM_EMAIL = 'picks@tripleplayz.com';
const FROM_NAME = 'YourSwami';

interface PickAlertEmail {
    matchup: string;
    pickTeam: string;
    pickValue: string;
    pickType: string;
    confidence: number;
    scheduledAt: string;
}

interface ResultEmail {
    matchup: string;
    pickTeam: string;
    pickValue: string;
    result: 'win' | 'loss' | 'push';
    record: { wins: number; losses: number };
}

async function sendViaSendGrid(
    to: string[],
    subject: string,
    html: string
): Promise<{ success: boolean; error?: string }> {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey || to.length === 0) {
        return { success: false, error: 'No API key or no recipients' };
    }

    try {
        // SendGrid supports up to 1000 personalizations per request
        const personalizations = to.map(email => ({ to: [{ email }] }));

        const res = await fetch(SENDGRID_API, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                personalizations,
                from: { email: FROM_EMAIL, name: FROM_NAME },
                subject,
                content: [{ type: 'text/html', value: html }],
            }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('[Email] SendGrid error:', { status: res.status, body: errorText });
            return { success: false, error: `SendGrid ${res.status}: ${errorText}` };
        }

        return { success: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Email send failed';
        console.error('[Email] SendGrid request failed:', { error: message });
        return { success: false, error: message };
    }
}

function pickAlertHtml(pick: PickAlertEmail): string {
    const gameTime = new Date(pick.scheduledAt).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
    });

    return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; color: #e5e7eb; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 24px 28px; text-align: center;">
            <div style="font-size: 28px; margin-bottom: 4px;">🔥</div>
            <h1 style="margin: 0; color: white; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">NEW FIRE PICK</h1>
            <p style="margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">${gameTime}</p>
        </div>
        <div style="padding: 28px;">
            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <div style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">THE PLAY</div>
                <div style="font-size: 22px; font-weight: 800; color: #fbbf24; margin-bottom: 4px;">${pick.pickTeam} ${pick.pickValue}</div>
                <div style="color: #6b7280; font-size: 13px;">${pick.matchup} · ${pick.pickType.toUpperCase()}</div>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                    <td width="48%" style="background: rgba(167,139,250,0.08); border: 1px solid rgba(167,139,250,0.15); border-radius: 10px; padding: 14px; text-align: center;">
                        <div style="font-size: 20px; font-weight: 800; color: #a78bfa;">${pick.confidence}%</div>
                        <div style="color: #6b7280; font-size: 11px; margin-top: 2px;">Confidence</div>
                    </td>
                    <td width="4%"></td>
                    <td width="48%" style="background: rgba(0,229,155,0.08); border: 1px solid rgba(0,229,155,0.15); border-radius: 10px; padding: 14px; text-align: center;">
                        <div style="font-size: 20px; font-weight: 800; color: #00e59b;">FIRE</div>
                        <div style="color: #6b7280; font-size: 11px; margin-top: 2px;">Rating</div>
                    </td>
                </tr>
            </table>
            <a href="https://tripleplayz.com/dashboard" style="display: block; text-align: center; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 14px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">
                View Full Analysis →
            </a>
        </div>
        <div style="padding: 16px 28px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
            <p style="margin: 0; color: #374151; font-size: 11px;">YourSwami Sports Advisory · You're receiving this because you subscribed to Fire Pick alerts.</p>
        </div>
    </div>`;
}

function resultHtml(pick: ResultEmail): string {
    const isWin = pick.result === 'win';
    const isPush = pick.result === 'push';
    const emoji = isWin ? '✅' : isPush ? '🔄' : '❌';
    const label = isWin ? 'WIN' : isPush ? 'PUSH' : 'LOSS';
    const gradientColor = isWin ? '#00e59b' : isPush ? '#fbbf24' : '#ef4444';

    return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; color: #e5e7eb; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, ${gradientColor} 0%, ${gradientColor}cc 100%); padding: 24px 28px; text-align: center;">
            <div style="font-size: 32px; margin-bottom: 4px;">${emoji}</div>
            <h1 style="margin: 0; color: ${isWin ? '#0a0a0a' : 'white'}; font-size: 22px; font-weight: 800;">${label}</h1>
        </div>
        <div style="padding: 28px;">
            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
                <div style="font-size: 20px; font-weight: 800; color: ${gradientColor}; margin-bottom: 4px;">${pick.pickTeam} ${pick.pickValue}</div>
                <div style="color: #6b7280; font-size: 13px;">${pick.matchup}</div>
            </div>
            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <div style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">SEASON RECORD</div>
                <div style="font-size: 28px; font-weight: 900; color: #00e59b;">${pick.record.wins}-${pick.record.losses}</div>
            </div>
            <a href="https://tripleplayz.com/dashboard" style="display: block; text-align: center; background: linear-gradient(135deg, ${gradientColor} 0%, ${gradientColor}cc 100%); color: ${isWin ? '#0a0a0a' : 'white'}; padding: 14px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">
                View Dashboard →
            </a>
        </div>
        <div style="padding: 16px 28px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
            <p style="margin: 0; color: #374151; font-size: 11px;">YourSwami Sports Advisory · Fire Pick Results</p>
        </div>
    </div>`;
}

export async function sendPickAlert(
    subscribers: string[],
    pick: PickAlertEmail
): Promise<{ success: boolean; error?: string }> {
    return sendViaSendGrid(
        subscribers,
        `🔥 Fire Pick: ${pick.pickTeam} ${pick.pickValue}`,
        pickAlertHtml(pick)
    );
}

export async function sendResultEmail(
    subscribers: string[],
    pick: ResultEmail
): Promise<{ success: boolean; error?: string }> {
    const emoji = pick.result === 'win' ? '✅' : pick.result === 'push' ? '🔄' : '❌';
    const label = pick.result === 'win' ? 'WIN' : pick.result === 'push' ? 'PUSH' : 'LOSS';

    return sendViaSendGrid(
        subscribers,
        `${emoji} ${label}: ${pick.pickTeam} ${pick.pickValue} | Record: ${pick.record.wins}-${pick.record.losses}`,
        resultHtml(pick)
    );
}
