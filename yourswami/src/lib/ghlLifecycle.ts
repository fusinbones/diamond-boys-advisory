// Lifecycle signalling into GoHighLevel.
//
// The growth sequences live in GHL, but the events that should start them
// (payment cleared, card declined, subscription cancelled, checkout abandoned)
// only exist in Stripe. This module is the bridge: it stamps a lifecycle tag on
// the GHL contact, and a GHL workflow triggers on that tag being added.
//
// Why POST /contacts/{id}/tags and not contacts/upsert: upsert REPLACES the tag
// array wholesale. Using it here would silently strip website-signup and, worse,
// sms-optin, which is a consent record we are legally required to keep. The
// dedicated tags endpoint is additive, so it is the only safe way to add a tag
// to a contact that already exists.
//
// Everything here is best effort and never throws. These calls sit inside the
// Stripe webhook, which must return 200 or Stripe retries the event forever; a
// CRM hiccup must not turn into a redelivery loop.

import { findContactIdByEmail, readGhlConfig } from './ghlSms';

const GHL_BASE = 'https://services.leadconnectorhq.com';

// The tag vocabulary the GHL workflows trigger on. Keep these strings in sync
// with the trigger conditions in GHL-Automation/engine/specs/ys-w*.json.
export const LIFECYCLE_TAGS = {
    customerActive: 'customer-active',
    paymentFailed: 'payment-failed',
    churned: 'churned',
    checkoutAbandoned: 'checkout-abandoned',
} as const;

// Which package someone is on, so GHL can segment by it. Without these a Daily
// Pass buyer and a $997 Annual holder both read as just 'customer-active' and
// cannot be marketed to differently.
//
// Keyed by the tier ids in src/lib/tiers.ts. Note 'season' IS Annual: the id was
// deliberately kept when Season Pass was renamed, because it is written into
// Supabase subscription_tier and Stripe metadata and renaming it would orphan
// existing subscribers.
export const TIER_TAGS: Record<string, string> = {
    daily: 'tier-daily',
    weekly: 'tier-weekly',
    monthly: 'tier-monthly',
    season: 'tier-annual',
};

export const ALL_TIER_TAGS = Object.values(TIER_TAGS);

/**
 * Add one or more tags to the GHL contact with this email, without disturbing
 * the tags already on it. Returns false when the contact does not exist or the
 * call fails; callers treat that as non-fatal.
 */
export async function addLifecycleTags(email: string, tags: string[]): Promise<boolean> {
    const cfg = readGhlConfig();
    if (!cfg) {
        console.warn('[GHL] lifecycle tag skipped: GHL env vars not set');
        return false;
    }
    if (!email || tags.length === 0) return false;

    const contactId = await findContactIdByEmail(cfg, email);
    if (!contactId) {
        // Someone can pay without ever having synced as a contact. There is
        // nothing to tag, and inventing a contact here would create a record
        // with no consent history attached to it.
        console.log('[GHL] lifecycle tag: no contact for', email, `(skipped ${tags.join(', ')})`);
        return false;
    }

    try {
        const res = await fetch(`${GHL_BASE}/contacts/${contactId}/tags`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cfg.token}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ tags }),
        });
        if (!res.ok) {
            console.error('[GHL] lifecycle tag failed:', {
                email, tags, status: res.status, body: await res.text(),
            });
            return false;
        }
        console.log('[GHL] lifecycle tag applied:', email, tags.join(', '));
        return true;
    } catch (err) {
        console.error('[GHL] lifecycle tag threw:', { email, tags, err });
        return false;
    }
}

/**
 * Put the contact on exactly one tier tag.
 *
 * Strips every other tier tag first. This is the whole point of the function:
 * somebody upgrading Weekly to Annual would otherwise carry both forever and
 * land in two contradictory segments, so an "upsell your Weekly users" campaign
 * would keep chasing people who already bought the most expensive plan.
 *
 * Pass null to clear the tier entirely, which is what churn and refunds want.
 */
export async function setTierTag(email: string, tierId: string | null): Promise<boolean> {
    const wanted = tierId ? TIER_TAGS[tierId] : null;
    if (tierId && !wanted) {
        // An unmapped tier is a code change nobody finished. Say so rather than
        // silently leaving the contact untagged and unsegmentable.
        console.error('[GHL] no tier tag mapped for tier id:', tierId);
    }

    const stale = ALL_TIER_TAGS.filter((t) => t !== wanted);
    if (stale.length) await removeLifecycleTags(email, stale);

    if (!wanted) return true;
    return addLifecycleTags(email, [wanted]);
}

/**
 * Remove lifecycle tags. Used to clear a stale state so the same tag can fire
 * its workflow again later: GHL triggers on the tag being ADDED, so a tag left
 * in place from last time means the next event is silently ignored.
 */
export async function removeLifecycleTags(email: string, tags: string[]): Promise<boolean> {
    const cfg = readGhlConfig();
    if (!cfg || !email || tags.length === 0) return false;

    const contactId = await findContactIdByEmail(cfg, email);
    if (!contactId) return false;

    try {
        const res = await fetch(`${GHL_BASE}/contacts/${contactId}/tags`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${cfg.token}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ tags }),
        });
        if (!res.ok) {
            console.error('[GHL] lifecycle untag failed:', {
                email, tags, status: res.status, body: await res.text(),
            });
            return false;
        }
        return true;
    } catch (err) {
        console.error('[GHL] lifecycle untag threw:', { email, tags, err });
        return false;
    }
}
