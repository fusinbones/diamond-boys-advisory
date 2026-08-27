---
name: yourswami
description: Operate the live YourSwami site (yourswami.com) - deploy and verify, roll back, run the GoHighLevel SMS and email systems (opt-in, entitlement, delivery confirmation, lifecycle and tier tags, the six published growth workflows, branded email template), fix checkout, work the admin panel, and keep the cron and identity gates closed. Use whenever the task touches yourswami.com, TriplePlayz, fire-pick alerts, the A2P 10DLC campaign, or GHL contacts for this store.
---

# YourSwami operations

Live sports-picks subscription site. Next.js 16 on Vercel, Supabase auth + DB,
Stripe billing, GoHighLevel for SMS. Background and history live in the memory
files [[project-yourswami-rebrand]] and [[yourswami-soul]]; this file is the
operational how-to.

**tripleplayz.com runs the same codebase in parallel and is deliberately NOT
maintained. Never touch it.**

## Coordinates

| | |
|---|---|
| Local repo | `d:/PSK/TriplePlayz` (branch `sms-signup-optin`, pushed to `yourswami/master`) |
| Deploy repo | `automationbytehreem/yourswami` (remote name `yourswami`) |
| Vercel project | `yourswami` / `prj_HhzxvKTRA2NTUO9GVRuzcNDO1rhc` |
| Vercel team | `mejconsulting` / `team_EAzw76Ae1sIlsn3bNGjnxuPF` |
| GHL location | `sb8EJdIHmrQp0LEESgjf` |
| Opt-in tag | `sms-optin` (CRM tag `website-signup` on every site signup) |
| Secrets | `.env.deploy` (VERCEL_TOKEN), `.env.local` (GHL_*). Both gitignored via `.env*`. |

Read tokens out of those files, never hardcode them:
```bash
VT=$(grep '^VERCEL_TOKEN=' .env.deploy | cut -d= -f2)
```
If `.env.deploy` is missing or the token expired, ask the user for a fresh one
from vercel.com/account/tokens **scoped to the mejconsulting team** (a personal
token authenticates fine and then reports the project does not exist).

## Deploy

Always from `d:/PSK/TriplePlayz`. Build locally first; a broken build must never
reach the live site.

```bash
npx tsc --noEmit                     # must exit 0
npm run build                        # must exit 0
git push yourswami <branch>:master
npx vercel deploy --prod --force --yes --token "$VT" --scope mejconsulting
```

Notes that cost time to learn:
- The project is pinned by `.vercel/project.json`, so a deploy cannot create a
  new project by accident. If that file is missing, recreate it with the
  projectId and orgId above rather than letting the CLI prompt.
- With a token you do NOT need the old `mv .git .git_off` dance. That was only
  needed for user-session deploys, which Vercel rejects when the commit author
  is not a team member.
- Turbopack sometimes throws a spurious `next/font/google` module-not-found on
  Vercel. Just re-run the deploy.

## Verify on the live domain, not localhost

A deploy reporting READY is not evidence the site works. Check the real domain:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://yourswami.com/
curl -s -o /dev/null -w "%{http_code}\n" https://yourswami.com/api/ghl/sms-preference   # 401 = shipped and gated; 404 = did not ship
```

For anything visual, measure it with Playwright rather than trusting a
screenshot: `getComputedStyle` for spacing, `elementFromPoint` for whether a
control is actually clickable, `document.documentElement.scrollWidth` for
overflow. Several real bugs here were invisible to the eye and obvious to a
measurement.

## Roll back

`ROLLBACK.md` in the repo holds the current pinned target. Rolling back is a
promote, not a rebuild:

```bash
npx vercel promote <deploymentId> --token "$VT" --scope mejconsulting
```

Or Vercel dashboard, Deployments, "Promote to Production". Tag `pre-sms-deploy`
marks the pre-SMS commit.

A rollback restores code only. It does NOT undo: the GHL env vars, contacts
already tagged in GHL (untag them or a later redeploy resumes texting them), or
consent stored in Supabase `user_metadata`. **Keep the consent metadata even on a
full revert**; deleting it destroys the audit trail.

## The SMS system

```
Signup form (phone + consent + 21+)  ->  /api/ghl/sync-contact  ->  GHL contact
                                                                     tag sms-optin
Staff post a fire pick               ->  after() in /api/admin/fire-picks
                                     ->  sendFirePickSms()
                                     ->  contacts/search by tag
                                     ->  filterEntitledEmails()  (paid OR live trial)
                                     ->  send 5 at a time, then confirmDelivery()
Subscriber turns it off              ->  /settings Text Alerts  ->  /api/ghl/sms-preference
                                     ->  revokeSmsOptIn (untag, keep contact)
```

All of it lives in `src/lib/ghlSms.ts`. Config comes from `GHL_API_TOKEN`,
`GHL_LOCATION_ID`, `GHL_OPTIN_TAG`; if any is missing every call logs and no-ops,
so the app is safe to run unconfigured.

### Checking who is subscribed

```bash
node -e "
const fs=require('fs');
const env=fs.readFileSync('.env.local','utf8');
const g=k=>(env.match(new RegExp('^'+k+'=(.*)\$','m'))||[])[1]?.trim();
const H={Authorization:'Bearer '+g('GHL_API_TOKEN'),Version:'2021-07-28','Content-Type':'application/json',Accept:'application/json'};
(async()=>{
  const r=await fetch('https://services.leadconnectorhq.com/contacts/search',{method:'POST',headers:H,
    body:JSON.stringify({locationId:g('GHL_LOCATION_ID'),pageLimit:100,
      filters:[{field:'tags',operator:'contains',value:g('GHL_OPTIN_TAG')}]})});
  const j=await r.json();
  console.log('opted in:',(j.contacts||[]).length);
  for(const c of (j.contacts||[])) console.log(' ',c.phone,'|',c.email,'| dnd:',c.dnd);
})();"
```

### Running a live test send

Use `npx tsx` from the project root so the real `ghlSms.ts` is exercised rather
than a copy. Load `.env.local` into `process.env` before the first call
(`readConfig` reads env at call time, not import time).

**Rules that exist because they were learned the hard way:**
1. **Snapshot the contact list first.** Anything already present is not yours to
   delete.
2. If a number you are testing **already exists**, only remove the tags you
   added. Never delete the contact. `upsert` matches on phone and will silently
   absorb a real record.
3. Delete only IDs you personally created in that run. A cleanup scoped by tag
   once destroyed a real customer contact here.
4. **Wait about 10 seconds** after tagging before searching, or you get a false
   "nobody opted in".

## GHL behaviours confirmed by measurement

- `contacts/upsert` **REPLACES the tag array, it does not merge**. Only ever use
  it to CREATE. For a contact that already exists use `addLifecycleTags`, which
  posts to `/contacts/{id}/tags` and is additive. See "GHL tagging rules" below.
- The contact **search index lags writes by 5 to 8 seconds**. The query shape is
  correct; do not rewrite it chasing this.
- There is **no broadcast endpoint**. Fetch tagged contacts, then loop, capped at
  5 concurrent to stay under roughly 100 requests per 10 seconds.
- Base URL `https://services.leadconnectorhq.com`. `contacts/search` 422s without
  `locationId`. Version header is `2021-07-28` for contacts, `2021-04-15` for
  `conversations/messages`.
- Remove tags: `DELETE /contacts/{id}/tags` with body `{tags:[...]}`.
- The PIT token is least-privilege: contacts and conversations only. It 401s on
  locations, users and workflows. Building GHL **workflows** needs the separate
  `ghl` skill, which drives the internal API with a Firebase JWT.

## A2P compliance

The **verified** campaign is `CKLGHFQ`, registered to **TRIPLE PLAYZ INC**,
use case **MARKETING**, age-gated. A later **MIXED** campaign for the web form
**failed** and was deleted, so the brand already carries one failure. See
"A2P: do not touch it" below before changing anything here.

Rules for changing anything user-facing:

- **Consent text must name the legal entity**, not just the YourSwami brand, and
  must describe the message class ("recurring automated marketing messages"), not
  just the product.
- **What `smsBody` sends must match the sample message registered on the
  campaign.** If you change one, change the other.
- The opt-in flow must keep: unchecked-by-default box, rates, frequency,
  STOP/HELP, "not a condition of purchase", Terms and Privacy links **inside the
  consent label**, and the required 21+ confirmation.
- LeadConnector's automated Compliance Review **matches literal strings**, not
  equivalent claims. If it fails an item, hover its tooltip for the exact
  sentence it wants.
- The site enforces **21+** everywhere. The checker asks for an 18+ sentence; the
  user has decided 21+ wins and that item may flag. Do not "fix" it back to 18+.
- Opt-in form URL for reviewers: `https://yourswami.com/dashboard?signup=free`
  (the homepage has no phone field).

## Traps in this codebase

- **`globals.css` has an unlayered-reset hazard.** The `*` reset MUST stay inside
  `@layer base`. Tailwind v4 puts utilities in `@layer utilities`, and unlayered
  CSS beats layered CSS regardless of specificity, so unwrapping it silently
  zeroes every `p-*`, `m-*` and `space-y-*` on the entire site. Symptom: a plain
  `<div class="p-4">` computes to 0px padding.
- **`.btn-glow` is defined after the Tailwind import** and sets `font-size` and
  `padding`, so `text-sm` and friends never apply to it. Use inline styles.
- **`src/app/favicon.ico` wins over the metadata config** in the App Router.
  Changing `public/favicon.ico` alone does nothing.
- **The GHL chat widget greeting is `position:fixed` at z-index 99999999 inside a
  shadow root** and will sit on top of form controls on narrow screens. It is
  suppressed on the auth view under 640px. If new forms appear elsewhere, check
  them with `elementFromPoint` on a phone-width viewport.
- **Inputs must be 16px or larger** or iOS Safari zooms the page on focus.
- The admin API is gated by `src/middleware.ts` on `/api/admin/*` only. Any new
  route outside that path must authenticate itself, and must take identity from
  the verified Supabase token rather than the request body.

## Admin access (2026-08-27)

**Vercel "sensitive" env vars are write-only.** `vercel env pull` returns the
literal string `"[SENSITIVE]"` for `SUPABASE_SERVICE_KEY`, `STRIPE_SECRET_KEY`,
`ADMIN_EMAILS`, even `NEXT_PUBLIC_SUPABASE_URL`. Only the `GHL_*` vars come back
real, because those were deliberately set as *encrypted* rather than *sensitive*.

Consequences you cannot work around: **no Supabase write is possible from here**
(no service key), and **no Stripe Price can be created from here**. Setting a
user's tier, or anything else that writes to the DB, requires an admin clicking
it in `/admin/users`.

`automationbytehreem@gmail.com` has admin, granted through two additive env vars
rather than overwriting `ADMIN_EMAILS` (which cannot be read back, so replacing
it would risk locking out whoever is in it):

| var | why both are needed |
|---|---|
| `ADMIN_EMAILS_EXTRA` | server gates: `middleware.ts`, `adminApiAuth.ts`, `api/admin/users` |
| `NEXT_PUBLIC_ADMIN_EMAILS_EXTRA` | the `/admin` page gate in `lib/adminAuth.ts` runs in the browser and cannot read server env |

**To revoke: delete both vars in Vercel. No code change needed.**

**This codebase checks admin status in SIX independent places.** Adding someone
to one does not add them to the others, and each failure looks different:
`/admin` says "Access Denied" (client gate), or the panel renders "No users
found" with every stat at 0 while other endpoints on the same page work (the
route's own gate). Four now share the env vars; **`api/admin/moderation` and
`api/admin/affiliates` still have their own hardcoded lists** and will refuse a
newly granted admin.

After any auth change, re-verify:
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://yourswami.com/api/admin/users            # 401
curl -s -o /dev/null -w "%{http_code}\n" https://yourswami.com/api/admin/users \
  -H "x-admin-email: automationbytehreem@gmail.com"                                       # 401
```
Both must be 401. The header alone must never authorise; only a real Supabase
Bearer token does.

## Entitlement: who may receive a pick

`src/lib/entitlement.ts` is the **single** definition, used by both the SMS blast
and the dashboard so they cannot drift:

```
isEntitled = paid tier  OR  trial_end (+ trial_bonus_days) still in the future
```

- `DEFAULT_TRIAL_DAYS = 7` lives here. **Changing the trial to 3 days is this one edit.**
- `PAID_TIERS` includes legacy `starter`/`pro`/`elite` so old rows keep access.
- **Fails closed**: no profile row, or a lookup error, means no send. An
  under-send shows in the counts and can be retried; a leaked pick cannot.
- Entitlement is judged **at the instant a pick drops**. Someone who subscribes
  an hour later gets nothing and there is no re-send.

## SMS: a 2xx does NOT mean delivered

**The most expensive lesson on this project.** GHL returns 201 when it *queues* a
message; the carrier rejects it asynchronously a second or two later. Code that
checked only `res.ok` reported "3 sent / 0 failed" for three days while **every
message failed**.

`sendFirePickSms` now polls each queued message to a terminal state and reports
`delivered` / `failed` / `pending` plus a per-carrier-error breakdown, logging at
error level when anything failed.

**Never report a GHL message POST as sent.** To check one by hand:
```bash
TOK=$(grep '^GHL_API_TOKEN=' .env.local | cut -d= -f2- | tr -d '\r "')
curl -s "https://services.leadconnectorhq.com/conversations/messages/<messageId>" \
  -H "Authorization: Bearer $TOK" -H "Version: 2021-04-15" | python -m json.tool
```
Terminal-good: `delivered|sent|read`. Terminal-bad: `failed|undelivered|rejected`.

**Error 21408 = "not allowed to send SMS to this country or region".** The
account is US-only. Any non-US destination fails silently at the carrier, no
matter how correct the A2P setup is. **A Pakistani (+92) test number cannot ever
receive these; test with a US number.**

## GHL tagging rules

**Use `POST /contacts/{id}/tags`. It is ADDITIVE.**
**Never `contacts/upsert` on a contact that already exists**: upsert REPLACES the
whole tag array and will strip `sms-optin`, which is a TCPA consent record. Use
`addLifecycleTags(email, tags)` from `src/lib/ghlLifecycle.ts`.

Other behaviours that have each cost time:
- **Tags must be cleared when their state resolves.** GHL triggers on a tag being
  ADDED, so a stale `payment-failed` means the next real failure is ignored.
- **`setTierTag` strips every other tier tag before applying one.** Otherwise an
  upgrade leaves someone in two contradictory segments.
- **Two contacts cannot share a phone number.** To move one, clear it on the old
  record with `PUT {"phone": null}`. An empty string `""` is **silently ignored**.
- **The contact search index lags writes by 5 to 8 seconds.** A freshly tagged
  contact reads as absent. Wait ~10s before concluding anything.
- **Adding a tag that fires a published workflow sends real messages.** Before
  bulk-tagging, check what triggers on it.

Tag vocabulary: `website-signup`, `sms-optin`, `customer-active`,
`payment-failed`, `churned`, `refunded`, `checkout-abandoned`, `imported`,
`tier-daily|weekly|monthly|annual` (tier id `season` maps to `tier-annual`).

## The published GHL workflows

Location `sb8EJdIHmrQp0LEESgjf` (account name **Triple Playz**), folder
**YourSwami Growth**. Specs are versioned at
`d:/PSK/GHL-Automation/engine/specs/ys-w0*.json`; drive them with the `ghl` skill.

| id | name | fires on |
|---|---|---|
| `40edc4da-50c5-4de8-bfe8-c6efe050a944` | YS 01 Free Trial Nurture | `website-signup` |
| `fa1cdd8e-eb06-4b14-bc59-8ef6c07a7804` | YS 02 New Customer Onboarding | `customer-active` |
| `1315e63c-319b-445e-baba-334759143096` | YS 03 Abandoned Checkout | `checkout-abandoned` |
| `197a9327-3054-4f65-9360-e09be54dbaab` | YS 04 Payment Failure Rescue | `payment-failed` |
| `a7f2a47c-46f7-45ef-af74-1a4f81f7292f` | YS 05 Cancellation Win-Back | `churned` |
| `a61ff52a-75c5-4838-933e-d1487557d846` | YS 06 SMS Opt-In Confirmation | `sms-optin` |

**Leave `SMS Opt-In Tagging (A2P)` (`6362e647-...`) as a DRAFT.** YS 06
supersedes it and running both double-texts people.

- **GHL sends email natively.** The dead SendGrid key blocks none of this.
- **Every marketing SMS step is gated behind an if/else on `sms-optin`.**
- **They never fire retroactively**, the trigger is a tag being ADDED.

**Editing a published workflow:** a `steps` push against a published workflow
fails with `Next is invalid`. It does not corrupt it. The cycle is:
```bash
cd d:/PSK/GHL-Automation/engine
node ghl.mjs draft   <id> --location sb8EJdIHmrQp0LEESgjf
node ghl.mjs steps   <id> specs/ys-wNN-....json --location sb8EJdIHmrQp0LEESgjf
node ghl.mjs publish <id> --location sb8EJdIHmrQp0LEESgjf
```
Also: **a branch that terminates on `add_contact_tag` is rejected deterministically**
(reorder so it ends on another action), and **a workflow whose first save failed
is permanently corrupt**, delete the shell and rebuild.

## Email template and deliverability

`d:/PSK/GHL-Automation/engine/tools/ys-email.mjs` is the branded template;
`tools/ys-restyle.mjs` applies it to every email in the specs by subject, then
push with the draft/steps/publish cycle above.

**Email HTML is not web HTML**: tables only (Outlook renders neither flex nor
grid), all styles inline plus `bgcolor` attributes (Outlook drops `background`
shorthand), **no `rgba()`**, **no WebP** (so `footer-banner.webp` is unusable,
use the wordmark PNG), CTAs as coloured table cells not styled anchors.

**Do not use merge fields.** `{{contact.first_name}}` is never populated: the
signup form collects no name and `GhlContactInput` has no name field, so every
send opened with "Hey ,". Greetings carry the message instead.

Sending domain is authenticated (SPF + DKIM at
`smtp._domainkey.mail.yourswami.com` + DMARC, MX to mailgun.org), sending as
`Your Swami <contact@yourswami.com>`. **The domain is in warmup Stage 1 with no
reputation: do not blast the dormant list.** Most accounts have not been seen in
46 to 154 days. Send to engaged recipients first and widen only if they land.

Check it any time:
```bash
curl -s "https://dns.google/resolve?name=mail.yourswami.com&type=TXT" | grep -o '"data":"[^"]*"'
```

## Checkout

All four plans work. **Weekly, Monthly and Annual have no `STRIPE_PRICE_*` env
var**, so `/api/checkout` falls back to Stripe **inline `price_data`** built from
`tiers.ts`. That is why no Stripe access was needed.

`/pricing` renders `${tier.price}` and checkout computes
`Math.round(tier.price * 100)` from the same object, so **displayed and charged
prices cannot disagree**. A recurring tier with an interval Stripe would not
accept returns an error rather than defaulting.

**This is a stopgap**: inline `price_data` makes Stripe create a throwaway
Product per session, cluttering reporting. Replace with real Price ids when
someone has Stripe access.

Test all four without spending anything:
```bash
for t in daily weekly monthly season; do printf "%-8s " "$t"
  curl -s -X POST https://yourswami.com/api/checkout -H "Content-Type: application/json" \
    -d "{\"tierId\":\"$t\",\"email\":\"t@example.com\",\"name\":\"T\"}" | head -c 90; echo; done
```
A real `cs_live_...` URL means it works. **Note the field is `tierId`, not `tier`.**

**Payments run entirely on Stripe.** "Zen Payments" is the merchant account
behind the **Authorize.Net** gateway, which only ever charged for The Fire
Course. That course is retired, so Authorize.Net is gone from the codebase.

## Fire pick stats

`/api/public/fire-pick` computes the record live from every decided row in
`fire_picks`, with no base or offset. The `history` list is capped at 10; the
stats query is not, which is why 10 visible picks can back a 199-85 record over
284 rows.

## College football and NFL cannot be posted

`US_SPORTS` in `src/lib/odds-api.ts` lists only `baseball_mlb`,
`basketball_nba`, `icehockey_nhl`. The Fire Picks admin screen builds its game
list from that array and `handleSave` refuses without a game selected from it,
with **no free-text entry**. So a CFB or NFL pick is impossible, and this is not
an admin permission problem.

Fix is adding `americanfootball_ncaaf` and `americanfootball_nfl`; the layer
below is generic (`h2h`/`spreads`/`totals` are universal). **But crons are
disabled on this project** (shared DB with tripleplayz would double-fire picks),
so the `odds_cache` for the new sports also needs populating once, or the list
stays empty.

## A2P: do not touch it

The **verified** campaign `CKLGHFQ` (MARKETING, messaging service
`MG392d1085...`) is the chat-widget one. A second MIXED campaign for the web form
**failed** and was deleted; **the brand already carries one failure, so do not
submit anything else.** The user cannot edit the verified campaign.

The signup-form phone field does **not** endanger it: A2P's Opt-In Method
dropdown has **no chat-widget option**, so the widget was always registered as
"Website Form", the same category the signup form falls under. Verification is
not continuously re-scanned; enforcement is complaint-driven and the defence is
the timestamped per-contact consent record this app stores.

## Verify before believing anything

This project has repeatedly looked healthy while being broken. Habits that
earned their keep:

- **A new API route returning 401 rather than 404** proves it shipped and is gated.
- **Read state back off the account**, not from the local spec, after any GHL write.
- **Poll async systems**; do not read once.
- **Grep for other copies of a check before writing a new one.** Admin auth had
  six; entitlement had two that disagreed.
- **A dry run's totals prove the code ran, not that it picked the right records.**
  The backfill returns 15 real sample rows for this reason.
- **Hard refresh after a CSS or client-component deploy**, or you will review
  cached JavaScript and conclude the fix failed.

## Security posture (fixed 2026-08-27, commit 064c641)

**Cron routes fail closed.** `src/lib/cronAuth.ts` denies everyone when
`CRON_SECRET` is unconfigured and treats a missing secret exactly like a wrong
one. Accepts `?secret=` or `Authorization: Bearer`. `CRON_SECRET` is set on
Vercel.

**Consequence you will hit:** `/api/cron/refresh-odds` now needs the secret.
This is the endpoint that populates the odds cache, and `vercel.json` is
`{"crons": []}`, so it must be called by hand:

```bash
curl "https://yourswami.com/api/cron/refresh-odds?secret=$CRON_SECRET"
```

Get the value from Vercel; it is stored sensitive and cannot be read back, so
if it is lost, set a new one.

**Identity always comes from the verified Supabase token, never the request
body.** That now holds in `user/sync-tier`, `nickname`, `notify-pick` and
`admin/moderation` as well as the admin gate. **If you add a route outside
`/api/admin/*`, it must authenticate itself the same way.** Taking an email or
userId from the body is how `nickname` let anyone rename any user.

**Known and accepted, not bugs to re-fix:**
- `/api/subscribe` is unauthenticated and has **no caller in the codebase**.
  Left alone because gating it could break an external form.
- The service key falls back to the anon key in 23 files. It never triggers
  while the key is set; changing all 23 is riskier than the exposure.
- `NEXT_PUBLIC_ADMIN_EMAILS_EXTRA` puts an admin email in the client bundle by
  necessity, since the `/admin` page gate runs in the browser.

**Verified sound, do not change:** Stripe webhook signature verification, the
`/api/admin/*` Bearer-token gate, `ghl/sync-contact`.

After any auth change, re-run the probes: unauthenticated cron and POST routes
must be 401, the correct secret must be 200, and the nine main pages must all
still be 200.

## Open items (2026-08-27)

1. **College football / NFL cannot be posted at all.** The only dated item.
2. **Email pick alerts dead**: no `SENDGRID_API_KEY` AND nothing ever writes to
   `pick_subscribers`. Clean fix is sending through GHL like the SMS.
3. **No card has ever been put through checkout end to end.**
4. **`checkout.session.expired` may not be enabled** on the Stripe webhook;
   without it YS 03 can never fire.
5. Real Stripe Price ids to replace the inline `price_data` stopgap.
6. `api/admin/moderation` and `api/admin/affiliates` allowlists still disagree.
7. `robots.txt` and `sitemap.xml` still point at **diamondboyssports.com**.
8. **Vercel deploy token expires ~2026-08-30.**
9. Fire pick record (284 rows) predates this site; confirm provenance with Mike.
10. No catch-up window for picks (see Entitlement).
