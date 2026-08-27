import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUser } from '@/lib/adminApiAuth';
import { upsertContact, readGhlConfig, findContactIdByEmail } from '@/lib/ghlSms';
import { TIER_TAGS, addLifecycleTags } from '@/lib/ghlLifecycle';

export const maxDuration = 300;

// One-off backfill of existing accounts into GoHighLevel.
//
// The signup sync only ever ran at OTP verification and was fire and forget, so
// it never produced a single contact. Every account that predates the fix is
// therefore invisible to the CRM. This walks Supabase Auth and creates the
// missing contacts.
//
// IMPORTANT, the default tag is 'imported', not 'website-signup'. YS 01 (Free
// Trial Nurture) is published and triggers on website-signup being ADDED, so
// backfilling with that tag would send "Your free week just started" to paying
// customers and to people whose trial expired weeks ago. Existing users are not
// starting a trial, so they get a neutral tag and no sequence fires at them.
// Pass lifecycleTag explicitly only if you genuinely want that to happen.

interface BackfillBody {
    dryRun?: boolean;
    lifecycleTag?: string;
    limit?: number;
}

function svc() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

export async function POST(req: NextRequest) {
    const admin = await getAdminUser(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const cfg = readGhlConfig();
    if (!cfg) return NextResponse.json({ error: 'GHL env vars not set' }, { status: 500 });

    const body: BackfillBody = await req.json().catch(() => ({}));
    const dryRun = body.dryRun !== false;
    const baseTag = body.lifecycleTag || 'imported';
    const limit = body.limit ?? 1000;

    const supabase = svc();

    // Tier per email, so backfilled contacts carry their package and can be
    // segmented immediately rather than only future buyers being taggable.
    const tierByEmail = new Map<string, string>();
    {
        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('email, subscription_tier');
        for (const p of (profiles || []) as Array<{ email: string | null; subscription_tier: string | null }>) {
            if (p.email && p.subscription_tier) {
                tierByEmail.set(p.email.toLowerCase(), p.subscription_tier);
            }
        }
    }

    // Walk every auth user.
    const users: Array<{ email: string; meta: Record<string, unknown>; createdAt: string }> = [];
    for (let page = 1; page <= 20; page++) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
        if (error) {
            return NextResponse.json({ error: 'listUsers failed: ' + error.message }, { status: 500 });
        }
        const batch = data?.users || [];
        for (const u of batch) {
            if (u.email) {
                users.push({
                    email: u.email,
                    meta: (u.user_metadata || {}) as Record<string, unknown>,
                    createdAt: u.created_at,
                });
            }
        }
        if (batch.length < 200) break;
    }

    const sample: Array<Record<string, unknown>> = [];
    let alreadyInGhl = 0, created = 0, failed = 0, wouldCreate = 0, withConsent = 0, withTier = 0, tierTagged = 0;

    for (const u of users.slice(0, limit)) {
        const tier = tierByEmail.get(u.email.toLowerCase());
        const tierTag = tier ? TIER_TAGS[tier] : undefined;

        // Existing contacts are never upserted: that endpoint replaces the whole
        // tag array and would strip sms-optin, which is a consent record. But
        // they still need their tier, since anyone synced before tier tagging
        // existed carries only 'imported'. addLifecycleTags is additive, so it
        // adds the tier without touching anything already on the contact.
        //
        // Deliberately does NOT add customer-active here. YS 02 (New Customer
        // Onboarding) is published and triggers on that tag, so applying it
        // would email long-standing customers "You are locked in, here is how
        // to use it". The tier-* tag alone identifies a paying customer.
        const existing = await findContactIdByEmail(cfg, u.email);
        if (existing) {
            alreadyInGhl++;
            if (tierTag) {
                tierTagged++;
                if (sample.length < 15) {
                    sample.push({
                        email: u.email,
                        action: 'add tier tag to existing contact',
                        tier: tier || null,
                        addTags: [tierTag],
                    });
                }
                if (!dryRun) {
                    await addLifecycleTags(u.email, [tierTag]);
                    await new Promise((r) => setTimeout(r, 120));
                }
            }
            continue;
        }

        // Only carry the opt-in tag where real consent is on file: ticked box,
        // a phone number, and the 21+ confirmation the A2P campaign requires.
        const consented = Boolean(u.meta.sms_consent && u.meta.phone && u.meta.sms_age_confirmed);
        if (consented) withConsent++;

        const tags = consented ? [baseTag, cfg.tag] : [baseTag];

        // Paying accounts carry their package. customer-active is left off for
        // the same reason as above: it is a published workflow trigger, and a
        // backfilled customer is not a new purchase.
        if (tierTag) {
            tags.push(tierTag);
            withTier++;
        }

        wouldCreate++;

        if (sample.length < 15) {
            sample.push({
                email: u.email,
                tags,
                tier: tier || null,
                phone: consented ? String(u.meta.phone) : null,
                consentAt: (u.meta.sms_consent_at as string) || null,
                signedUp: u.createdAt?.slice(0, 10),
            });
        }

        if (dryRun) continue;

        const ok = await upsertContact({
            email: u.email,
            phone: consented ? String(u.meta.phone) : undefined,
            tags,
            source: consented
                ? `YourSwami backfill (SMS consent ${String(u.meta.sms_consent_at || 'unknown')})`
                : 'YourSwami backfill',
        });
        if (ok) created++; else failed++;

        // Stay under GHL's burst limit (~100 requests / 10s per location).
        await new Promise((r) => setTimeout(r, 120));
    }

    return NextResponse.json({
        dryRun,
        lifecycleTag: baseTag,
        scannedUsers: users.length,
        alreadyInGhl,
        wouldCreate,
        created: dryRun ? 0 : created,
        failed: dryRun ? 0 : failed,
        withSmsConsent: withConsent,
        withPaidTier: withTier,
        existingContactsTierTagged: tierTagged,
        sample,
        note: dryRun
            ? 'Dry run. Check the sample rows are right, then POST again with {"dryRun": false}.'
            : 'Backfill complete.',
    });
}
