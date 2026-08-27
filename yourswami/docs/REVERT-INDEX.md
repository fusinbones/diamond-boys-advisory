# Revert index

Every change from the 2026-08-25/27 session is its own commit **and** its own
tag, so any single one can be undone without touching the others.

All tags are pushed to `automationbytehreem/yourswami`. Verify with
`git fetch --tags yourswami && git tag -l 'ys*'`.

## How to revert

**Undo one change, keep everything after it.** This is almost always what you
want, because it creates a new commit rather than rewriting history:

```bash
cd d:/PSK/TriplePlayz
git revert <tag>            # e.g. git revert ys18-sms-text-dedupe
git push yourswami HEAD:master
VT=$(grep '^VERCEL_TOKEN=' .env.deploy | cut -d= -f2 | tr -d '\r "')
npx vercel deploy --prod --force --yes --token "$VT" --scope mejconsulting
```

**Roll the whole site back to a point in time.** Discards everything after it:

```bash
git reset --hard <tag>
git push yourswami HEAD:master --force
npx vercel deploy --prod --force --yes --token "$VT" --scope mejconsulting
```

**See exactly what a change did before undoing it:**

```bash
git show <tag>              # full diff and the reasoning in the commit message
git show --stat <tag>       # just the files touched
```

## The changes, oldest first

| # | Tag | What it changed |
|---|---|---|
| 1 | `ys01-admin-annual-label` | Admin tier label "Season Pass" to "Annual" (display only, the `season` key stays) |
| 2 | `ys02-retire-fire-course` | Deleted The Fire Course entirely: pages, 7 modules, API routes, Authorize.Net PaymentForm |
| 3 | `ys03-lifecycle-tags` | `ghlLifecycle.ts` + Stripe webhook emits `customer-active`, `payment-failed`, `churned`, `refunded`, `checkout-abandoned` |
| 4 | `ys04-sms-entitlement-filter` | `entitlement.ts`; SMS blast stops texting expired trials; dashboard shares the definition |
| 5 | `ys05-ghl-sync-backfill-on-load` | Signup to CRM sync made idempotent and called on dashboard load |
| 6 | `ys06-checkout-inline-price` | Weekly, Monthly and Annual purchasable again via Stripe inline `price_data` |
| 7 | `ys07-trial-banner` | Dashboard banner showing days left in the trial |
| 8 | `ys08-sms-delivery-reporting` | `confirmDelivery`; reports real carrier delivery instead of API acceptance |
| 9 | `ys09-ghl-backfill-endpoint` | `/api/admin/ghl-backfill` + Preview and Sync buttons |
| 10 | `ys10-admin-emails-extra` | Additive `ADMIN_EMAILS_EXTRA` on the server gates |
| 11 | `ys11-admin-client-gate` | `NEXT_PUBLIC_ADMIN_EMAILS_EXTRA` for the `/admin` page gate |
| 12 | `ys12-admin-users-route-gate` | `/api/admin/users` stops disagreeing with the middleware gate |
| 13 | `ys13-admin-rows-phone-consent` | User rows show phone and SMS consent; first layout pass |
| 14 | `ys14-admin-users-table` | User list becomes a real aligned grid with headers |
| 15 | `ys15-tier-tags` | `tier-daily/weekly/monthly/annual` on purchase, cleared on churn and refund |
| 16 | `ys16-backfill-tier-existing` | Backfill also tags contacts that already existed |
| 17 | `ys17-trial-can-see-picks` | Trial users can actually see the Fire Pick; prop renamed `isPaid` to `unlocked` |
| 18 | `ys18-sms-text-dedupe` | SMS stops repeating the pick three times |
| 19 | `ys19-admin-detail-grid` | Expanded user row uses its own classes; columns stop spreading |
| 20 | `ys20-security-cron-and-identity` | Cron routes fail closed; identity taken from the token in 4 routes |

## Milestone tags (roll back to a point in time)

| Tag | State it represents |
|---|---|
| `pre-course-removal` | before the course was retired |
| `pre-tier-tags` | before package tagging |
| `pre-admin-users-redesign` | before the admin table work |
| `pre-firepick-trial-fix` | before trial users could see picks |
| `pre-sms-text-fix` | before the SMS wording fix |
| `pre-football-sports` | before the (reverted) football attempt |
| `pre-security-fixes` | before the security work |
| `pre-sms-deploy` | pre-2026-08-23 baseline, from the earlier session |

## Things git cannot revert

A code rollback does **not** undo these. Each has to be reversed by hand.

| Change | How to undo |
|---|---|
| `CRON_SECRET` on Vercel | Delete the env var. **Warning:** `cronAuth.ts` fails closed, so with the var gone every cron route returns 503. Only remove it together with `ys20`. |
| `ADMIN_EMAILS_EXTRA`, `NEXT_PUBLIC_ADMIN_EMAILS_EXTRA` | Delete both in Vercel to revoke admin. No deploy needed for the server one. |
| Six published GHL workflows | `node ghl.mjs draft <id> --location sb8EJdIHmrQp0LEESgjf` from `d:/PSK/GHL-Automation/engine`. Ids are in the runbook. |
| GHL contacts and tags created by the backfill | Backfilled contacts carry `imported`. Remove tags by contact id, **never** delete by attribute; that once destroyed a real contact on this project. |
| Email template pushed into the workflows | Specs are versioned at `GHL-Automation/engine/specs/ys-w0*.json`; re-push with the draft, steps, publish cycle. |
| The email sending domain (SPF, DKIM, DMARC) | GoDaddy DNS and the GHL dedicated-domain setting. |

## Reverting a deploy without touching git

Vercel keeps every build. Promoting a previous deployment is the fastest
rollback of all and needs no code change:

```
vercel.com > yourswami project > Deployments > pick one > Promote to Production
```
