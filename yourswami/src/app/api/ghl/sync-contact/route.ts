import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { upsertContact, SIGNUP_TAG, readGhlConfig, findContactIdByEmail } from '@/lib/ghlSms';

// Mirrors a confirmed signup into GoHighLevel as a CRM contact.
//
// Everything is derived from the caller's verified Supabase token, never from the
// request body, so a caller cannot create a contact for an address they do not
// control. This route is deliberately outside the /api/admin/* middleware gate
// (ordinary users call it for themselves), which is exactly why it authenticates
// itself rather than trusting anything the client sends.
//
// The SMS opt-in tag is applied only when the user actually ticked the consent
// box at signup. Everyone else syncs as a plain contact with no phone attached.

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );

        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const meta = (data.user.user_metadata || {}) as {
            phone?: string;
            sms_consent?: boolean;
            sms_consent_at?: string;
            sms_age_confirmed?: boolean;
        };
        // Age confirmation is part of consent, not an extra. The A2P campaign
        // declares age-gated content, so an unconfirmed opt-in is not actionable.
        const consented = Boolean(meta.sms_consent && meta.phone && meta.sms_age_confirmed);

        // Idempotency guard. This route is called on every authenticated
        // dashboard load, not just once at signup, because the old one-shot
        // call at OTP verification was fire and forget: if it failed, that
        // user never reached the CRM and never received a single email.
        //
        // If the contact already exists we do NOTHING. Two reasons, both of
        // which have bitten this project before:
        //   1. contacts/upsert REPLACES the tag array, so re-running it would
        //      strip customer-active and, far worse, sms-optin, which is a
        //      consent record.
        //   2. GHL workflows trigger on a tag being ADDED. Re-applying
        //      website-signup could restart the trial email sequence on every
        //      page load.
        const cfg = readGhlConfig();
        if (cfg) {
            const existingId = await findContactIdByEmail(cfg, data.user.email);
            if (existingId) {
                return NextResponse.json({ synced: true, existing: true, smsOptIn: consented });
            }
        }

        const ok = await upsertContact({
            email: data.user.email,
            // The phone is attached only alongside real consent. Holding a number
            // we are not permitted to text buys us nothing and costs us an audit.
            phone: consented ? meta.phone : undefined,
            tags: consented ? [SIGNUP_TAG, 'sms-optin'] : [SIGNUP_TAG],
            source: consented
                ? `YourSwami signup (SMS consent ${meta.sms_consent_at || 'unknown'})`
                : 'YourSwami signup',
        });

        return NextResponse.json({ synced: ok, smsOptIn: consented });
    } catch (err) {
        // Never surface CRM trouble to someone who just signed up successfully.
        console.error('[GHL] sync-contact failed:', err);
        return NextResponse.json({ synced: false }, { status: 200 });
    }
}
