// GoHighLevel (LeadConnector) SMS broadcast for Fire Pick drops.
//
// The GHL chat widget is the SOLE SMS opt-in collector (A2P compliance), so
// opted-in visitors live as GHL Contacts carrying the opt-in tag, NOT in our
// Supabase DB. When staff post a Fire Pick we fetch every contact with that tag
// and send each an SMS via GHL's Conversations API over our A2P-approved number.
// GHL automatically honors STOP / DND, so opt-outs are respected on send.

import { filterEntitledEmails } from './entitlement';

const GHL_BASE = 'https://services.leadconnectorhq.com';

interface FirePickSms {
    matchup: string;
    pickTeam: string;
    pickValue: string;
    pickType: string;
    scheduledAt: string;
}

interface GhlContact {
    id: string;
    phone?: string | null;
    email?: string | null;
}

export interface GhlConfig {
    token: string;
    locationId: string;
    tag: string;
}

export function readGhlConfig(): GhlConfig | null {
    const token = process.env.GHL_API_TOKEN;
    const locationId = process.env.GHL_LOCATION_ID;
    const tag = process.env.GHL_OPTIN_TAG;
    if (!token || !locationId || !tag) return null;
    return { token, locationId, tag };
}

/**
 * The play, stated once.
 *
 * pick_value is normally already the whole human-readable play, e.g.
 * "Arizona Diamondbacks ML +165". The old copy prepended pick_team and
 * appended pick_type around it anyway, so a real text read:
 *
 *   "Arizona Diamondbacks Arizona Diamondbacks ML +165 (ML)"
 *
 * Each part is added only when it is not already present, so this reads
 * correctly whether pick_value carries the team and type or just the line.
 */
function pickSummary(pick: FirePickSms): string {
    const team = (pick.pickTeam || '').trim();
    const type = (pick.pickType || '').trim().toUpperCase();
    let out = (pick.pickValue || '').trim() || [team, type].filter(Boolean).join(' ');

    if (team && !out.toLowerCase().includes(team.toLowerCase())) out = `${team} ${out}`;
    if (type && !out.toUpperCase().includes(type)) out = `${out} (${type})`;
    return out;
}

// SMS copy. Kept short (one segment where possible) and free of em/en dashes.
function smsBody(pick: FirePickSms): string {
    const gameTime = new Date(pick.scheduledAt).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
    });
    // Wording tracks the sample message registered on the A2P campaign, so what
    // carriers vetted and what subscribers actually receive are the same text.
    // That means naming the registered entity, not just the consumer brand, and
    // carrying both required disclosures. It costs a second SMS segment (~245
    // chars vs ~150); at current volume that is noise, and a traffic-to-sample
    // mismatch is the expensive outcome.
    return [
        `Hi! This is TRIPLE PLAYZ INC (YourSwami). Today's FIRE PICK is live: ${pickSummary(pick)}, ${pick.matchup}, ${gameTime} ET.`,
        'See the full analysis at https://yourswami.com/dashboard.',
        'Reply STOP to unsubscribe. Message & data rates may apply.',
    ].join(' ');
}

// Fetch every contact carrying the opt-in tag, following searchAfter pagination.
//
// Timing caveat, measured against the live API: GHL's contact search index lags
// writes by roughly 5 to 8 seconds. A contact tagged moments ago does not appear
// here yet, which reads exactly like "nobody opted in". Harmless in production,
// where signups precede pick drops by minutes at least, but it will produce a
// false negative if you tag a test contact and blast immediately. Wait ~10s.
// The query shape itself is correct; do not rewrite it chasing this.
async function fetchOptedInContacts(cfg: GhlConfig): Promise<GhlContact[]> {
    const out: GhlContact[] = [];
    let searchAfter: unknown[] | undefined;

    // Hard cap the page loop so a bad response can never spin forever.
    for (let page = 0; page < 100; page++) {
        const body: Record<string, unknown> = {
            locationId: cfg.locationId,
            pageLimit: 100,
            filters: [{ field: 'tags', operator: 'contains', value: cfg.tag }],
        };
        if (searchAfter) body.searchAfter = searchAfter;

        const res = await fetch(`${GHL_BASE}/contacts/search`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cfg.token}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error('[GHL] contacts/search failed:', { status: res.status, body: errText });
            break;
        }

        const json = await res.json();
        const contacts: Array<Record<string, unknown>> = json.contacts || json.data || [];
        if (contacts.length === 0) break;

        for (const c of contacts) {
            const id = c.id as string;
            if (id) out.push({
                id,
                phone: (c.phone as string) ?? null,
                email: (c.email as string) ?? null,
            });
        }

        // Next page cursor = searchAfter of the last returned contact.
        const last = contacts[contacts.length - 1];
        const nextCursor = last?.searchAfter as unknown[] | undefined;
        if (!nextCursor || contacts.length < 100) break;
        searchAfter = nextCursor;
    }

    return out;
}

// Terminal delivery outcomes as GHL reports them.
const DELIVERED_STATUSES = new Set(['delivered', 'sent', 'read']);
const FAILED_STATUSES = new Set(['failed', 'undelivered', 'rejected']);

interface SendResult {
    accepted: boolean;
    messageId?: string;
}

// Read the real outcome of a message. Accepting the POST means GHL queued it,
// nothing more: a message rejected by the carrier fails a second or two later,
// asynchronously. Error 21408 (country not enabled) went unnoticed for three
// days precisely because only the POST was ever checked.
async function fetchMessageStatus(
    cfg: GhlConfig,
    messageId: string,
): Promise<{ status: string; error?: string }> {
    try {
        const res = await fetch(`${GHL_BASE}/conversations/messages/${messageId}`, {
            headers: {
                'Authorization': `Bearer ${cfg.token}`,
                'Version': '2021-04-15',
                'Accept': 'application/json',
            },
        });
        if (!res.ok) return { status: 'unknown' };
        const json = await res.json();
        const m = json.message || json;
        return { status: String(m.status || 'unknown'), error: m.error || undefined };
    } catch {
        return { status: 'unknown' };
    }
}

// Send one SMS to one contact. GHL routes it over the A2P-approved number and
// skips contacts who are DND/opted-out (surfaced as a non-2xx we swallow).
async function sendSmsToContact(cfg: GhlConfig, contactId: string, message: string): Promise<SendResult> {
    try {
        const res = await fetch(`${GHL_BASE}/conversations/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cfg.token}`,
                'Version': '2021-04-15',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ type: 'SMS', contactId, message }),
        });
        if (!res.ok) {
            const errText = await res.text();
            console.error('[GHL] send SMS rejected:', { contactId, status: res.status, body: errText });
            return { accepted: false };
        }
        const json = await res.json().catch(() => ({}));
        return { accepted: true, messageId: json.messageId || json.id };
    } catch (err) {
        console.error('[GHL] send SMS threw:', { contactId, err });
        return { accepted: false };
    }
}

// Runs contacts through the sender with a small concurrency cap so we stay well
// under GHL's burst rate limit (~100 req / 10s per location).
async function sendWithConcurrency(
    cfg: GhlConfig,
    contacts: GhlContact[],
    message: string,
    concurrency = 5,
): Promise<{ rejected: number; messageIds: string[] }> {
    let rejected = 0, i = 0;
    const messageIds: string[] = [];

    async function worker() {
        while (i < contacts.length) {
            const idx = i++;
            const r = await sendSmsToContact(cfg, contacts[idx].id, message);
            if (r.accepted && r.messageId) messageIds.push(r.messageId);
            else rejected++;
        }
    }

    const workers = Array.from({ length: Math.min(concurrency, contacts.length) }, () => worker());
    await Promise.all(workers);
    return { rejected, messageIds };
}

// Poll the queued messages until each reaches a terminal state, or we run out
// of patience. Carrier rejections land within a couple of seconds, so a few
// short rounds is enough; anything still pending is reported as pending rather
// than counted as a success.
async function confirmDelivery(
    cfg: GhlConfig,
    messageIds: string[],
): Promise<{ delivered: number; failed: number; pending: number; errors: Record<string, number> }> {
    const errors: Record<string, number> = {};
    let pendingIds = [...messageIds];
    let delivered = 0, failed = 0;

    for (const waitMs of [3000, 4000, 6000]) {
        if (pendingIds.length === 0) break;
        await new Promise((r) => setTimeout(r, waitMs));

        const results = await Promise.all(
            pendingIds.map((id) => fetchMessageStatus(cfg, id).then((s) => ({ id, ...s }))),
        );

        const stillPending: string[] = [];
        for (const r of results) {
            if (DELIVERED_STATUSES.has(r.status)) delivered++;
            else if (FAILED_STATUSES.has(r.status)) {
                failed++;
                const key = r.error || `status:${r.status}`;
                errors[key] = (errors[key] || 0) + 1;
            } else stillPending.push(r.id);
        }
        pendingIds = stillPending;
    }

    return { delivered, failed, pending: pendingIds.length, errors };
}

// Public entry point: text every opted-in subscriber about a new Fire Pick.
// Best-effort and self-contained; never throws to the caller.
export async function sendFirePickSms(pick: FirePickSms): Promise<{ sent: number; failed: number; total: number }> {
    const cfg = readGhlConfig();
    if (!cfg) {
        console.warn('[GHL] SMS skipped: GHL_API_TOKEN / GHL_LOCATION_ID / GHL_OPTIN_TAG not set');
        return { sent: 0, failed: 0, total: 0 };
    }

    try {
        const contacts = await fetchOptedInContacts(cfg);
        if (contacts.length === 0) {
            console.log('[GHL] SMS blast: no opted-in contacts found for tag', cfg.tag);
            return { sent: 0, failed: 0, total: 0 };
        }

        // Consent says we MAY text them. Entitlement says we SHOULD. The text
        // carries the whole pick (team, line, matchup, time), so texting an
        // expired trial hands over the product the paywall is protecting.
        // Contacts with no email cannot be matched to a subscription and are
        // dropped, same fail-closed rule as the lookup itself.
        const entitled = await filterEntitledEmails(
            contacts.map((c) => c.email).filter((e): e is string => !!e),
        );
        const recipients = contacts.filter(
            (c) => c.email && entitled.has(c.email.toLowerCase()),
        );

        const skipped = contacts.length - recipients.length;
        if (recipients.length === 0) {
            console.warn('[GHL] SMS blast: nobody entitled', {
                optedIn: contacts.length,
                skipped,
            });
            return { sent: 0, failed: 0, total: 0 };
        }

        const message = smsBody(pick);
        const { rejected, messageIds } = await sendWithConcurrency(cfg, recipients, message);

        // Confirm what actually reached a handset. Counting accepted POSTs as
        // "sent" is what hid error 21408 for three days: the admin saw
        // "3 sent, 0 failed" while every message was rejected by the carrier.
        const { delivered, failed, pending, errors } = await confirmDelivery(cfg, messageIds);
        const totalFailed = failed + rejected;

        const summary = {
            optedIn: contacts.length,
            entitled: recipients.length,
            skippedNotEntitled: skipped,
            delivered,
            failed: totalFailed,
            pending,
            errors,
        };

        if (totalFailed > 0) {
            console.error('[GHL] SMS blast had failures:', summary);
        } else {
            console.log('[GHL] SMS blast complete:', summary);
        }

        // sent now means confirmed delivered, not merely accepted.
        return { sent: delivered, failed: totalFailed, total: recipients.length };
    } catch (err) {
        console.error('[GHL] SMS blast failed:', err);
        return { sent: 0, failed: 0, total: 0 };
    }
}

// ── Contact sync ────────────────────────────────────────────────────────────
// Two paths write contacts into GHL: every confirmed signup mirrors into the CRM,
// and those who ticked the SMS consent box additionally carry the opt-in tag that
// the Fire Pick blast above searches on. Both go through upsertContact.

// Applied to every contact originating from the site, so CRM segmentation still
// works for the majority who never opt into SMS.
export const SIGNUP_TAG = 'website-signup';

interface GhlContactInput {
    email: string;
    phone?: string;
    tags: string[];
    // Free-text provenance shown on the contact in GHL. For SMS opt-ins this
    // carries the consent timestamp so a carrier audit can trace it.
    source: string;
}

interface OptInSignup {
    email: string;
    phone: string;
    consentAt: string;
}

// GHL wants E.164. The signup form is US-facing, so bare 10-digit and 1-prefixed
// 11-digit input are the two cases worth normalizing; anything already in +...
// form passes through. Returns null rather than guessing at junk input, so a bad
// number is dropped loudly instead of becoming an untextable contact.
export function toE164(raw: string): string | null {
    const trimmed = raw.trim();
    if (/^\+[1-9]\d{7,14}$/.test(trimmed)) return trimmed;

    const digits = trimmed.replace(/\D/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return null;
}

// Create or update a contact. GHL upserts on phone/email within the location, so
// a repeat call updates the existing contact rather than duplicating it. Best
// effort: never throws, so a CRM hiccup cannot break signup or checkout.
export async function upsertContact(input: GhlContactInput): Promise<boolean> {
    const cfg = readGhlConfig();
    if (!cfg) {
        console.warn('[GHL] contact upsert skipped: GHL_API_TOKEN / GHL_LOCATION_ID / GHL_OPTIN_TAG not set');
        return false;
    }

    // A phone is optional for a plain CRM sync, but an unparseable one is dropped
    // rather than stored, so we never hold a number we cannot actually text.
    let phone: string | undefined;
    if (input.phone) {
        phone = toE164(input.phone) ?? undefined;
        if (!phone) console.error('[GHL] dropping unparseable phone for', input.email);
    }

    try {
        const res = await fetch(`${GHL_BASE}/contacts/upsert`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cfg.token}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                locationId: cfg.locationId,
                email: input.email,
                ...(phone ? { phone } : {}),
                tags: input.tags,
                source: input.source,
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error('[GHL] contact upsert failed:', { status: res.status, body: errText });
            return false;
        }

        console.log('[GHL] contact upserted:', { email: input.email, tags: input.tags });
        return true;
    } catch (err) {
        console.error('[GHL] contact upsert threw:', err);
        return false;
    }
}

// Tag a paying subscriber who consented to SMS at signup so the Fire Pick blast
// picks them up. SIGNUP_TAG is resent alongside the opt-in tag deliberately: if
// GHL's upsert ever replaces the tag array rather than merging into it, the CRM
// tag survives either way.
export async function upsertOptInContact(signup: OptInSignup): Promise<boolean> {
    const cfg = readGhlConfig();
    if (!cfg) {
        console.warn('[GHL] opt-in upsert skipped: GHL env vars not set');
        return false;
    }
    return upsertContact({
        email: signup.email,
        phone: signup.phone,
        tags: [SIGNUP_TAG, cfg.tag],
        source: `YourSwami signup form (SMS consent ${signup.consentAt})`,
    });
}

// ── Opt-out ─────────────────────────────────────────────────────────────────
// Replying STOP is honored by GHL automatically, but a subscriber must also be
// able to turn alerts off from their account. Carriers check for this during A2P
// review, and someone who cannot find the off switch will report the message as
// spam instead, which costs far more than the unsubscribe.

// Look up a contact by email inside the location. Returns the id, or null.
export async function findContactIdByEmail(cfg: GhlConfig, email: string): Promise<string | null> {
    try {
        const res = await fetch(`${GHL_BASE}/contacts/search`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cfg.token}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                locationId: cfg.locationId,
                pageLimit: 20,
                filters: [{ field: 'email', operator: 'eq', value: email }],
            }),
        });
        if (!res.ok) {
            console.error('[GHL] contact lookup failed:', { status: res.status, body: await res.text() });
            return null;
        }
        const json = await res.json();
        const hit = (json.contacts || []).find(
            (c: { email?: string }) => (c.email || '').toLowerCase() === email.toLowerCase(),
        );
        return hit?.id ?? null;
    } catch (err) {
        console.error('[GHL] contact lookup threw:', err);
        return null;
    }
}

// Turn SMS alerts off for one subscriber by stripping the opt-in tag. The contact
// itself is kept: deleting it would lose the record that they once consented and
// then withdrew, which is exactly what an audit wants to see.
export async function revokeSmsOptIn(email: string): Promise<boolean> {
    const cfg = readGhlConfig();
    if (!cfg) {
        console.warn('[GHL] opt-out skipped: GHL env vars not set');
        return false;
    }

    const contactId = await findContactIdByEmail(cfg, email);
    if (!contactId) {
        // No contact means nothing to untag; the user is already not receiving SMS.
        console.log('[GHL] opt-out: no contact found for', email, '(already not subscribed)');
        return true;
    }

    try {
        const res = await fetch(`${GHL_BASE}/contacts/${contactId}/tags`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${cfg.token}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ tags: [cfg.tag] }),
        });
        if (!res.ok) {
            console.error('[GHL] opt-out failed:', { status: res.status, body: await res.text() });
            return false;
        }
        console.log('[GHL] SMS opt-out applied for', email);
        return true;
    } catch (err) {
        console.error('[GHL] opt-out threw:', err);
        return false;
    }
}

// Turn SMS alerts back on. Requires a phone and a fresh consent + age confirmation
// from the caller; this never resurrects an old consent on its own.
export async function grantSmsOptIn(email: string, phone: string, consentAt: string): Promise<boolean> {
    const cfg = readGhlConfig();
    if (!cfg) return false;
    return upsertContact({
        email,
        phone,
        tags: [SIGNUP_TAG, cfg.tag],
        source: `YourSwami account settings (SMS consent ${consentAt})`,
    });
}
