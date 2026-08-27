---
name: project-yourswami-rebrand
description: "YourSwami: LIVE at yourswami.com. All 4 plans purchasable again, SMS+email both working, 6 GHL growth workflows published, trial access fixed. ROOT CAUSE of every failed SMS was Twilio 21408 (destination country), hidden behind a success counter. OPEN: college football/NFL cannot be posted at all."
metadata:
  node_type: memory
  type: project
  originSessionId: a064deb6-2b9c-4e57-8733-0f34e0469adb
  modified: 2026-08-27T05:30:00.000Z
---

**yourswami.com is LIVE.** Next.js 16 on Vercel (project `yourswami`, team `mejconsulting`), Supabase auth+DB, Stripe, GoHighLevel for SMS+email. Shares the SAME backend as tripleplayz.com, which stays untouched. Local clone **d:/PSK/TriplePlayz**, deploy repo `automationbytehreem/yourswami`. Operate with the **`yourswami`** skill. Full detail in [[yourswami-soul]] (43 sections); the 2026-08-27 session is §23 to §42.

## The one fact that explains three days of confusion

**Every SMS this project ever sent failed with Twilio `Error 21408 - Your account is not allowed to send SMS to this country or region`**, because the test number `+923418377987` is **Pakistani**. The A2P campaign, chat widget, signup form and messaging service were all fine the whole time.

It stayed invisible because `sendSmsToContact` returned true on `res.ok`: **GHL accepts the POST (201) and the carrier rejects it asynchronously a second later.** So 2026-08-23 logged "3 sent / 0 failed" with nothing arriving, and the return value was discarded at the callsite anyway. Now `confirmDelivery` polls each message to a terminal state and reports delivered/failed/pending plus the carrier error. **A 2xx on a GHL message POST means queued, not delivered.** Proven both ways: PK number -> failed/21408, Mike's US +19172252555 -> `sent`, the first message this project ever delivered.

## Working and verified (2026-08-27)

- **All 4 plans purchasable.** Weekly/Monthly/Annual had failed since go-live (`STRIPE_PRICE_*` env vars do not exist). Fixed with Stripe **inline `price_data`** built from `tiers.ts`, so no Stripe access was needed: daily 2499 one-time (real price id), weekly 7499/week, monthly 22999/month, season 99700/**year**. `/pricing` and checkout read the same object so displayed and charged prices cannot disagree. Stopgap: inline price_data spawns an ad-hoc Stripe Product per session.
- **`src/lib/entitlement.ts`** is the single definition of who may receive a pick: paid tier OR live trial + bonus days. **Fails closed.** The SMS blast filters through it AND the dashboard imports `PAID_TIERS`/`DEFAULT_TRIAL_DAYS` from it, so access and alerts cannot drift. `DEFAULT_TRIAL_DAYS` centralises 7-vs-3 days.
- **Signup reaches the CRM.** It had **never once worked**: it ran only at OTP verification, fire-and-forget, and the route returns 200 with `synced:false` on failure. Now idempotent + called on first dashboard load each session, which backfills.
- **6 GHL workflows PUBLISHED** in folder "YourSwami Growth", location `sb8EJdIHmrQp0LEESgjf` (account name **Triple Playz**): YS 01 Trial Nurture, YS 02 Onboarding, YS 03 Abandoned Checkout, YS 04 Payment Failure, YS 05 Win-Back, YS 06 SMS Opt-In Confirmation. **Old `SMS Opt-In Tagging (A2P)` left DRAFT on purpose** (YS 06 supersedes it; both would double-text). **GHL sends email natively, so the dead SendGrid key blocks none of it.** They never fire retroactively.
- **Trial finally works.** `trialActive` was computed and never rendered, AND `FirePickCard` got `isPaid` instead of `!picksLocked`, so a trial user saw "3 days left" above a pick blurred "Members Only". Both fixed; prop renamed `isPaid` -> `unlocked`.
- **Email deliverability fixed by the user**, verified in live DNS: SPF + DKIM (`smtp._domainkey.mail.yourswami.com`) + DMARC, MX to **mailgun.org**, sending as `Your Swami <contact@yourswami.com>`. Previously sent from GHL's shared `send.lcmsgndr.net` with no SPF/DMARC at all, which is why it hit spam. **Domain is warmup Stage 1: do not blast the dormant list.**

## Tag vocabulary (the app-to-GHL bridge)

`website-signup`, `sms-optin`, `customer-active`, `payment-failed`, `churned`, `refunded`, `checkout-abandoned`, `imported`, and `tier-daily|weekly|monthly|annual`.

**Use `POST /contacts/{id}/tags`, which is ADDITIVE. NEVER `contacts/upsert` on an existing contact: it REPLACES the tag array and strips `sms-optin`, a consent record.** (Walked into this anyway when tagging Mike, losing his `website-signup`.) **Tags are cleared when their state resolves**, because GHL triggers on a tag being ADDED, so a stale tag swallows the next real event. A refund tags `refunded` but deliberately NOT `churned`. **`setTierTag` strips every other tier tag first**, or an upgrade leaves someone in two contradictory segments. Tier id `season` maps to `tier-annual`.

## Admin access and the six disagreeing gates

**Vercel sensitive vars are write-only**: `vercel env pull` returns `"[SENSITIVE]"` for `SUPABASE_SERVICE_KEY`, `STRIPE_SECRET_KEY`, `ADMIN_EMAILS`, even `NEXT_PUBLIC_SUPABASE_URL`. Only `GHL_*` (set as *encrypted*) come back real. **So no DB write is possible from here.** Supabase project is `swbiwmmqsylwdzwjifpf.supabase.co`.

Granted via additive **`ADMIN_EMAILS_EXTRA`** + **`NEXT_PUBLIC_ADMIN_EMAILS_EXTRA`** = `automationbytehreem@gmail.com`. **To revoke: delete both env vars, no code change.** This codebase checks admin in **six** places; middleware, `adminApiAuth`, `adminAuth` (client), and `api/admin/users` now agree, but **`moderation` and `affiliates` still have their own lists**. Security re-verified after every deploy: no token -> 401, spoofed `x-admin-email` -> 401.

## A2P, settled

The **VERIFIED** campaign `CKLGHFQ` (MARKETING, service `MG392d1085...`) is the **chat widget** one. A second **MIXED** campaign for the web form **FAILED** and was deleted. **The user cannot edit the verified campaign.** The signup-form phone field does **not** endanger it: A2P's Opt-In Method dropdown has **no chat-widget option**, so the widget was always registered as "Website Form", the same category the form falls under. **Do not resubmit anything**, the brand already carries one failure.

## Payments, settled

Mike said "Zen Payments"; Zen is the merchant account, **Authorize.Net was the gateway**, and it only ever charged for The Fire Course. **The Fire Course is now RETIRED entirely** (it was still selling "Live Pattern System software access" plus a $49.99/mo upsell for deleted software), so **Authorize.Net is gone from the codebase** and everything runs on Stripe. Zen may still bill a fee for nothing.

## Fire pick stats are real

`/api/public/fire-pick` aggregates every decided row in `fire_picks` live: no base, no offset, no seed. **284 decided rows** = 199-85, 70.1%, +384u. They moved during the session, consistently. But those 284 predate this site, so **ask Mike to confirm provenance** before leaning on a public 70.1% claim.

## SECURITY (audited AND FIXED 2026-08-27, commit 064c641)

**Was: every `/api/cron/*` endpoint was callable by anyone.** `CRON_SECRET` was unset and the guard was `if (SECRET && mismatch)`, which never blocked. Worse, `auto-picks` and `grade-picks` only 401'd on a WRONG secret; **omitting it entirely fell through**, so setting the env var alone would not have fixed them. `auto-picks` INSERTS into `picks` and `grade-picks` emails subscribers, on a DB shared with tripleplayz.

**Now:** `src/lib/cronAuth.ts` **fails closed** (no secret configured denies everyone; missing is treated as wrong), accepts `?secret=` or Bearer, constant-time compare. `CRON_SECRET` set on Vercel. `cron/post-picks` turned out to be a **no-op stub**, left alone.

**Identity now comes from a verified token, never the body**, in `user/sync-tier`, `nickname` (POST took `userId` from the body with no auth, so anyone could rename any user; GET read admin from `?email=`), `notify-pick`, and `admin/moderation`. All four callers updated in the same commit.

**Verified live:** every hole returns **401**; the correct secret returns **200** on both query and Bearer; all 9 pages 200; checkout still returns a real `cs_live_` session.

**Still open by choice:** `/api/subscribe` (no caller in the codebase, so gating it risks breaking an external form) and the service-key-falls-back-to-anon-key pattern across 23 files (never triggers while the key is set; mass churn is riskier than the exposure). **Sound and untouched:** Stripe webhook signing, the `/api/admin/*` Bearer gate, `ghl/sync-contact`. Detail in [[yourswami-soul]] §43 to §44.

**Note:** `/api/cron/refresh-odds` now needs the secret, which matters for the college football task since crons are disabled and the odds cache must be refreshed by hand.

## OPEN, most urgent first

1. **College football and NFL CANNOT be posted at all.** `US_SPORTS` in `src/lib/odds-api.ts` is MLB/NBA/NHL only, and `/admin/fire-picks` refuses to save without a game selected from that list (no free-text entry). Chris wanted CFB live Saturday 2026-08-29. Fix = add `americanfootball_ncaaf` + `americanfootball_nfl`, **but crons are disabled here** so the `odds_cache` also needs populating once.
2. **Email pick alerts dead** for two reasons: no `SENDGRID_API_KEY` AND **nothing ever writes to `pick_subscribers`** (read-only in the codebase). Clean fix is sending through GHL like the SMS.
3. **No card has ever been put through checkout end to end.** Payment -> webhook -> tier grant -> unlock is unexercised.
4. **`checkout.session.expired` may not be enabled** on the Stripe webhook, without which YS 03 never fires.
5. Real Stripe Price ids to replace the inline `price_data` stopgap.
6. `moderation` + `affiliates` admin allowlists still disagree.
7. `robots.txt` + `sitemap.xml` still point at **diamondboyssports.com**.
8. **Vercel deploy token expires ~2026-08-30.**
9. No catch-up window: entitlement is judged at the instant a pick drops, so a later subscriber gets nothing (this is what happened to Mike).
10. **tripleplayz.com admin-auth hole** still open, user's informed choice. Do not touch tripleplayz.

## Backups and reverting

**Docs are versioned in the repo** at `d:/PSK/TriplePlayz/docs/`: `YOURSWAMI-SOUL.md`, `YOURSWAMI-OVERVIEW.md`, `YOURSWAMI-RUNBOOK.md` and `REVERT-INDEX.md`, pushed to `automationbytehreem/yourswami`. Keep them in step with the memory and skill files when either changes.

**Every change is an atomic commit AND a named tag** (`ys01-...` to `ys21-...`), all pushed. Undo one without disturbing the rest: `git revert <tag>`, push, deploy. Roll back to a point in time: `git reset --hard <tag>`. Full table plus what git CANNOT undo (Vercel env vars, published GHL workflows, CRM tags, DNS) is in `docs/REVERT-INDEX.md`.

**Fastest rollback of all** needs no git at all: Vercel dashboard, Deployments, Promote to Production on an earlier build.

## Standing rules

- **No em/en dashes anywhere**, in code, copy or emails.
- **Never `upsert` an existing GHL contact.**
- **A 2xx from GHL means queued, not delivered.**
- **Nav links are centred between the logo and the buttons, not the viewport. Do not "fix" it.**
- **The `*` reset in `globals.css` MUST stay inside `@layer base`** or every Tailwind padding/margin utility silently computes to 0.
- **Step edits fail on a PUBLISHED GHL workflow**; cycle is `draft` -> `steps` -> `publish`.
- Deploy: `git push yourswami <branch>:master` then `npx vercel deploy --prod --force --yes --token "$VT" --scope mejconsulting`, token in `.env.deploy`.

Related: [[yourswami-soul]], [[project-ghl-automation]], [[reference-github-repo]], [[feedback-shopify-api-publish]], [[feedback-silent-degradation]], [[feedback-test-that-cannot-fail]].
