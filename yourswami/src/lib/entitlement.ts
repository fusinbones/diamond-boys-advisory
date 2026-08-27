// Who is currently entitled to receive Fire Picks.
//
// This is the single definition of "allowed to see a pick": an active paid
// subscription, or a trial that has not run out yet. The dashboard already
// enforced it visually (picksLocked + PaywallOverlay), but the SMS blast did
// not, so an expired trial kept receiving the entire pick by text forever.
// Both paths now read this module, so they cannot drift apart.

// Legacy tier names are included deliberately. 'starter', 'pro' and 'elite'
// predate the current lineup and the dashboard still honours them, so a
// long-standing subscriber on an old row keeps their texts.
export const PAID_TIERS = [
    'starter', 'pro', 'elite',
    'daily', 'weekly', 'monthly', 'season',
];

// Trial length in days for accounts with no explicit trial_end on file. Kept
// here so changing 7 to 3 is one edit rather than a hunt through the app.
export const DEFAULT_TRIAL_DAYS = 7;

const DAY_MS = 86_400_000;

async function svc() {
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY ||
            process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
}

export interface EntitlementRow {
    email: string | null;
    subscription_tier: string | null;
    trial_end: string | null;
    trial_bonus_days: number | null;
    created_at: string;
}

/**
 * Mirrors the dashboard's access logic exactly: paid, or inside a trial that
 * falls back to created_at + DEFAULT_TRIAL_DAYS when no trial_end is set, plus
 * any bonus days an admin granted.
 */
export function isEntitled(row: EntitlementRow, now: Date = new Date()): boolean {
    const isPaid = !!row.subscription_tier && PAID_TIERS.includes(row.subscription_tier);
    if (isPaid) return true;

    const trialEnd = row.trial_end
        ? new Date(row.trial_end)
        : new Date(new Date(row.created_at).getTime() + DEFAULT_TRIAL_DAYS * DAY_MS);
    const effectiveEnd = new Date(trialEnd.getTime() + (row.trial_bonus_days || 0) * DAY_MS);
    return effectiveEnd.getTime() > now.getTime();
}

/**
 * Given a list of email addresses, return the lowercased subset currently
 * entitled to receive picks.
 *
 * Fails CLOSED. An address with no profile row, or a lookup that errors, is
 * left out rather than waved through: sending the product to someone who is
 * not entitled is the exact bug this exists to prevent, and it cannot be taken
 * back once the text has landed. A blast that under-sends is visible in the
 * returned counts and can be retried; a leaked pick cannot.
 */
export async function filterEntitledEmails(emails: string[]): Promise<Set<string>> {
    const wanted = emails
        .filter(Boolean)
        .map((e) => e.toLowerCase());
    if (wanted.length === 0) return new Set();

    try {
        const db = await svc();
        const { data, error } = await db
            .from('user_profiles')
            .select('email, subscription_tier, trial_end, trial_bonus_days, created_at')
            .in('email', wanted);

        if (error) {
            console.error('[entitlement] lookup failed, sending to nobody:', error.message);
            return new Set();
        }

        const now = new Date();
        const allowed = new Set<string>();
        for (const row of (data || []) as EntitlementRow[]) {
            if (row.email && isEntitled(row, now)) {
                allowed.add(row.email.toLowerCase());
            }
        }
        return allowed;
    } catch (err) {
        console.error('[entitlement] lookup threw, sending to nobody:', err);
        return new Set();
    }
}
