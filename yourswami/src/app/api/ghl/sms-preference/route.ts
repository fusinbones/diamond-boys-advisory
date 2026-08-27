import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revokeSmsOptIn, grantSmsOptIn, toE164 } from '@/lib/ghlSms';

// Read or change the caller's own SMS alert preference.
//
// Identity comes from the verified Supabase token, never the request body, so a
// caller can only ever change their own subscription. Sits outside the
// /api/admin/* middleware gate, hence the self-authentication.

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
}

async function requireUser(req: NextRequest) {
    const header = req.headers.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return null;
    const { data, error } = await getSupabase().auth.getUser(token);
    if (error || !data.user?.email) return null;
    return { user: data.user, token };
}

// Current state, so Settings can render the real status rather than a guess.
export async function GET(req: NextRequest) {
    const auth = await requireUser(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const meta = (auth.user.user_metadata || {}) as {
        phone?: string; sms_consent?: boolean; sms_age_confirmed?: boolean;
    };
    const optedIn = Boolean(meta.sms_consent && meta.phone && meta.sms_age_confirmed);
    return NextResponse.json({
        optedIn,
        // Last 4 only. There is no reason to echo a full phone number back to a
        // browser just to render a status line.
        phoneLast4: optedIn && meta.phone ? String(meta.phone).replace(/\D/g, '').slice(-4) : null,
    });
}

export async function POST(req: NextRequest) {
    const auth = await requireUser(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const email = auth.user.email!;
    let body: { optIn?: boolean; phone?: string; ageConfirmed?: boolean };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const supabase = getSupabase();

    // ── Opting out ──
    if (body.optIn === false) {
        const ok = await revokeSmsOptIn(email);
        // Clear the stored consent regardless of whether GHL answered: the user's
        // wish not to be texted must survive an upstream outage. The blast reads
        // the GHL tag, so a failed revoke is retried by the next opt-out attempt
        // and is logged loudly above.
        await supabase.auth.updateUser(
            { data: { sms_consent: false, sms_opted_out_at: new Date().toISOString() } },
        );
        return NextResponse.json({ optedIn: false, synced: ok });
    }

    // ── Opting back in ──
    // A fresh phone, consent and age confirmation are required every time. An old
    // consent that was withdrawn is not a consent we may act on again.
    if (body.optIn === true) {
        const phone = body.phone ? toE164(body.phone) : null;
        if (!phone) {
            return NextResponse.json({ error: 'A valid mobile number is required.' }, { status: 400 });
        }
        if (body.ageConfirmed !== true) {
            return NextResponse.json({ error: 'Age confirmation is required.' }, { status: 400 });
        }

        const consentAt = new Date().toISOString();
        const ok = await grantSmsOptIn(email, phone, consentAt);
        if (!ok) {
            return NextResponse.json({ error: 'Could not enable SMS alerts. Please try again.' }, { status: 502 });
        }
        await supabase.auth.updateUser({
            data: {
                phone,
                sms_consent: true,
                sms_consent_at: consentAt,
                sms_consent_source: 'account settings',
                sms_age_confirmed: true,
            },
        });
        return NextResponse.json({ optedIn: true });
    }

    return NextResponse.json({ error: 'optIn must be true or false' }, { status: 400 });
}
