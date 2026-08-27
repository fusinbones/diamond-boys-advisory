---
name: yourswami-soul
description: "Complete soul file for YourSwami (yourswami.com, LIVE). Full detail on the rebrand, A2P/SMS, the 2026-08-27 session (Twilio 21408 root cause, entitlement, lifecycle+tier tags, 6 published GHL workflows, email template + deliverability, checkout via inline price_data, admin gates, trial access), plus every open item. Read when working on YourSwami/TriplePlayz/diamond-boys."
metadata: 
  node_type: memory
  type: project
  originSessionId: a064deb6-2b9c-4e57-8733-0f34e0469adb
  modified: 2026-08-27T05:30:00.000Z
---

# YourSwami Rebrand: Soul File

Complete, detail-preserving record. Concise recall entry is [[project-yourswami-rebrand]]. Repo container context: [[reference-github-repo]].

## 1. Identity and access
- **Product:** rebranding **TriplePlayz to YourSwami**. Next.js sports "fire picks" subscription app (MLB, expandable). Fire picks = premium/high-confidence picks (fire_picks table).
- **Repo:** `fusinbones/diamond-boys-advisory` (GitHub, **public**, no license). Owner **fusinbones** is a personal User account (not an org). Default branch `master`.
- **Our account:** `automationbytehreem` (email 277547608+automationbytehreem@users.noreply.github.com). Access = collaborator with **pull/push/triage, NOT admin/maintain**. Cannot change repo settings, branch protection, or create repos under fusinbones. `read:org` scope present but member of no orgs.
- **Live site:** **tripleplayz.com**, deployed on **Vercel team "mejconsulting"**. Production deploys only from `master`.
- **Local working clone:** `d:/PSK/TriplePlayz` (full clone). Also a throwaway analysis clone was used in scratchpad.
- **Full private backup:** `automationbytehreem/diamond-boys-advisory-backup` (private, created this project; `master` pushed, HEAD matches origin). Local git remote alias `backup`.
- New brand domain **yourswami.com** owned at **GoDaddy** (NOT on either Hostinger account). **LIVE since 2026-08-15/16** via a PARALLEL deploy (see 9.5); tripleplayz.com stays untouched and running beside it. A2P registered against https://www.yourswami.com and **APPROVED** (§8).
- **Deploy repo:** `automationbytehreem/yourswami` (private, created 2026-08-15; `master` = the finished rebrand+A2P build with crons off). Local git remote alias `yourswami`. This is what the NEW Vercel project builds from - NOT the fusinbones repo.

## 2. Tech stack
Next.js 16.1.6 (App Router, Turbopack), React 19.2.3, Tailwind CSS v4 (`@theme` in globals.css), TypeScript 5, framer-motion, lucide-react, Supabase (@supabase/supabase-js, auth + DB), Stripe (+ react-stripe-js), Google Gemini (@google/genai) for AI analysis/podcast/community bot, Mailchimp (email list via /api/subscribe), SendGrid-style email (lib/email.ts), Twilio (SMS, **now retired** in favor of GoHighLevel). Fonts: Inter + Outfit self-hosted via `next/font/google`. Charts: chart.js/recharts + a custom BankrollChart.

## 3. Brand system
- **Name:** YourSwami. Character: muscular "swami" on a golden throne, sunglasses, dollar-chain, pointing.
- **Colors:** royal purple `#6A00FF` (glows/borders/bg tints), gold `#FFC107` (solid accents/buttons/text), near-black `#0a0512` bg. Gold variants: light `#FFD54F`, dark `#FFA000`, glow `#FFCE3A`. Purple light `#8B3BFF`.
- **Semantic colors (kept):** win/positive green `#22c55e`, success `#10b981`, loss/red `#ef4444`/`#f87171`, amber `#fbbf24`/`#f59e0b`.
- **Voice:** "I AM YOUR SWAMI", "Real Picks. Real Results. Real Cash.", "Follow the Swami", "No guesswork". Community = **"The Swami Lounge"**. Community AI bot = **"YourSwamiBot"**.
- **Global content rules:** NO em/en dashes anywhere (user standing rule). Self-hosted fonts. Keep existing homepage content (reskin, do not rewrite). Keep semantic win/loss greens. Single swami image per breakpoint. Use the primary logo, not the favicon, as the logo.

## 4. Assets (in `public/brand/`)
`logo-primary.png` (primary badge, character + "I AM YOUR SWAMI"), `wordmark.png` (raw "I AM YOUR SWAMI" lockup on black), `wordmark-clear.png` (**black bg removed locally with PIL/numpy luminance-alpha; Canva MCP could not ingest local file and has no bg-remover**), `avatar.png` (circular gold-ring portrait), `hero-swami.webp` + `hero-swami.png` (throne character cutout, 833x793), `footer-banner.webp` (wide "I AM YOUR SWAMI / REAL PICKS / yourswami.com" band), `icon-512.png` ($ shield), `og-image.png` (1200x630). Favicons in `public/` root: `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`. Source art (2 big PNGs: brand sheet 1536x1024 + hero banner 1983x793) in `d:/PSK/TriplePlayz/Graphic Assets/` = **untracked, never committed** (7.5MB). GHL chat widget in `layout.tsx` (next/script, afterInteractive): **current `data-widget-id="6a80d70ce5c16f984988cb55"` + `data-source="WEB_USER"` (2026-08-16; the id changed FOUR times this day: 6a7b90b7… → 6a7b8d81… → 6a80ddd7… → 6a80d70ce5c16f984988cb55, the GHL A2P "Chat Widget Compliance" check FAILS if the site's widget-id doesn't EXACTLY match the campaign's current widget; always confirm the live id equals what GHL shows). Rendering gotcha: the GHL loader appends `<chat-widget>` inside the site's fixed `.bg-glow` background layer, whose stacking context traps the bubble behind page content (bubble invisible/unclickable, "hides at top/bottom"). Fixed with an inline script in layout.tsx that keeps `<chat-widget>` as the LAST child of `<body>` (move once/keep-last; do NOT thrash-move it or the web component's layout breaks). Verified via Playwright: bubble renders bottom-right, is on top (elementFromPoint returns CHAT-WIDGET), and opens on click (data-active false→true). **Rendered as a RAW `<script async src=...>` tag in layout.tsx (NOT `next/script`)**, critical: GHL's A2P "Chat Widget Compliance" crawler fetches RAW server HTML with no JS, and `next/script` (afterInteractive AND beforeInteractive) only injects the tag client-side / via Next's loader, so the crawler saw nothing and failed the check. A plain `<script>` element (React renders it into SSR HTML, hoisted to head, still executes) is what makes it crawler-detectable. Verified live: `curl yourswami.com | grep 'src="https://widgets.leadconnectorhq.com/loader.js"'` returns the tag on every page. It is the SOLE SMS opt-in collector; user added a DOB field inside the GHL chatbox for age verification. A2P website = https://www.yourswami.com, use case Marketing/Promotional, age-gated = YES (content is sports-betting picks). The contacts this widget captures (with the `sms-optin` tag, once tagging is wired) are exactly who the automated SMS-on-drop system texts, see §13.

## 5. Branch map (as of this writing)
- `master` @ **da242eb** = untouched TriplePlayz (live). Also `origin/master`, `backup/master`.
- `a2p-compliance` @ **2ed1a8d** (off master, PUSHED) = original standalone A2P work on TriplePlayz. Superseded for the rebrand by `rebrand-yourswami-a2p`.
- `rebrand-yourswami` (off master, PUSHED): **78c9ffb** homepage rebrand, then **93d18eb** remove odds+stats.
- `rebrand-yourswami-pages` (off rebrand-yourswami@93d18eb, PUSHED): **f9e0c7c** logo swap non-nav pages, **9ce698d** text rebrand, **37407c2** support email, **a77ca77** green reskin.
- `rebrand-yourswami-a2p` (off rebrand-yourswami-pages@a77ca77): **0f76886** apply A2P. **This is the complete package: full rebrand + A2P.** (still local only on the fusinbones/origin side.)
- `yourswami-live` (off rebrand-yourswami-a2p@0f76886): **e65575c** = deploy prep. Pushed to the NEW repo `yourswami/master`. Changes vs a2p: `vercel.json` crons emptied (prevents duplicate picks + double subscriber emails against the shared DB - tripleplayz stays the worker); email-body / referral / pick-text / podcast links -> yourswami.com. Admin allowlists + FROM_EMAIL still tripleplayz.com (intentional, see 9).

## 6. Homepage rebrand (rebrand-yourswami) - every change
- `globals.css`: flipped `@theme` emerald vars to gold/purple (kept the variable NAMES like `--color-emerald` so all `var()` refs recolor); removed render-blocking Google Fonts `@import`, pointed `--font-*` at next/font vars; migrated all literal greens (hex + rgba, spaced and unspaced forms) to gold/purple. `.badge-success` text kept green.
- `layout.tsx`: `next/font` Inter+Outfit (variable, display swap), applied to `<html>` className; metadata title/desc/OG/twitter/icons all YourSwami; `metadataBase` = https://yourswami.com; theme-color `#0a0512`; apple-touch-icon + PWA title updated.
- `Navbar.tsx`: logo lockup = **circular avatar (gold ring, `ring-2 ring-[#FFC107]/50`) + transparent wordmark** (`wordmark-clear.png`). The wordmark uses a **wrapper `<span className="flex items-center">`** (was `hidden sm:block` on desktop, now shows on mobile too per user) because a responsive display class on the `next/image` element itself did not take (its height/sizing responsive classes DID work; only `display` failed) - fix = put responsive display on a wrapper span. "YourSwami" text removed per user. Mobile menu: close X raised to `z-[110]` (overlay is `z-[100]`) so it is visible; removed the menu's duplicate logo (header logo already shows).
- `HeroSection.tsx`: two-column throne layout. **One swami image per breakpoint** - desktop bleed (`absolute ... hidden lg:block`, next/image `fill priority`), mobile framed (`flex lg:hidden`, width/height + priority). Fixed a double-image bug (inline `display:flex` was overriding `lg:hidden`). Removed `LiveGameTicker`. Copy re-centered on fire picks (dropped "11+ sportsbooks"/odds). "No credit card required" line under CTAs. Single-line buttons.
- Removed **odds + stats** from the homepage: deleted `<StatsBar/>`, `<MagicTicker/>` (both live-game/odds tickers) and `LiveGameTicker`; reworked FreeSignupSection perks to fire-pick/community (Daily Freebie Pick, Community Chat, See the Track Record, Pick Drop Alerts).
- `Footer.tsx`: added `footer-banner.webp` full-width band above a readable links footer; Quick Links = Home/Pricing/The Lounge/Patterns/Dashboard; support email support@yourswami.com; text sizes bumped for readability.
- `page.tsx`: reverted an early mistake (I had replaced the whole homepage; user wanted content kept) then reskinned in place. Final CTA + toast retained.
- Grids balanced: FeaturesSection `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (6 cards = 3x2), FreeSignupSection `sm:grid-cols-2` (4 = 2x2). Fixed a stray `rgba(52,211,153)` (green) tile.
- CWV: next/font (no render-blocking import), next/image with priority for hero.
- Buttons: `.btn-outline` text set to white; labels shortened ("Sign Up Free", "Log In", "Get Pick Alerts").
- Em dashes scrubbed from homepage files.

## 7. Other-pages rebrand (rebrand-yourswami-pages) - every change
- **Logo swap** (`f9e0c7c`): `/logo.png` -> `/brand/logo-primary.png` (+ alt to YourSwami) on the 8 pages that render their own brand mark and bypass the global nav: admin (header + login), dashboard login, community, checkout, pattern-system, pattern-system/checkout, success, IOSInstallPrompt. Dynamic `game.teams.*.logo` (MLB team logos) left alone.
- **Text rebrand** (`9ce698d`): "TriplePlayz" -> "YourSwami" across **37 files** (pages, metadata, copy). "TriplePlayz Lounge" -> "**The Swami Lounge**"; "TriplePlayzBot" -> "YourSwamiBot"; Gemini + podcast prompts now identify the AI as YourSwami; tier feature strings (Lounge access, VIP channels, Season Pass badge); email sender FROM_NAME display. Homepage FeaturesSection "YourSwami Lounge" aligned to "Swami Lounge".
- **Support email** (`37407c2`): DISPLAY support email -> support@yourswami.com on tos, privacy, support, success ONLY. Deliberately LEFT the auth allowlists and email sender (see 9).
- **Green reskin** (`a77ca77`, 71 files): brand green `#00e59b` + rgba forms -> gold `#FFC107` (solids) / purple `#6A00FF` (glows/borders/tints). `#00e59b` now **0** in the codebase. **Semantic win/loss preserved**: 29 win/positive greens re-pointed to `#22c55e` first (patterns: `'won'/'win'/'hit' ? '#00e59b'`, `isPositive ? ...`, `>= 50/55/60 ? ...`, `> 0`/`>= 0`, `'WIN', color:`, StreakCounter `'W'`, settings `'success'`). Covers result badges, BankrollChart, StreakCounter, hit-rate coloring, PremiumRevealFeed, `.badge-success`. Course "Data/profit" tag accents left gold (decorative).

## 8. A2P / SMS compliance (rebrand-yourswami-a2p, commit 0f76886)
Re-applied the a2p-compliance work onto the full rebrand (merge would have conflicted, so re-applied by hand):
- `layout.tsx`: embed the **GoHighLevel (LeadConnector) chat widget** sitewide as the **sole SMS opt-in / consent collector**. (Originally a `next/script` afterInteractive loader + div; LATER rewritten to a raw `<script async>` + a relocate script, and the widget-id rotated several times, current widget-id + the full raw-script/bg-glow/crawler saga are in §4.)
- Removed the competing opt-in: deleted `components/dashboard/PhonePopup.tsx`, removed the dashboard signup phone field + `phone` state + the `/api/subscribers/phone` POST + the `Phone` lucide import + the `<PhonePopup/>` render. No `type=tel` collectors remain.
- **Retired custom Twilio**: deleted `lib/sms.ts`; removed `sendPickAlertSms` call in `api/admin/fire-picks` and `sendResultSms` (+ phones def) in `api/cron/grade-picks`. Email alerts untouched.
- Legal (YourSwami-branded, support@yourswami.com): Privacy "Mobile Information & SMS" clause (no third-party sharing of opt-in data); Terms "SMS / Text Messaging Terms" section (`id="sms"`, STOP/HELP, frequency, cost) + a mobile clause in the embedded privacy.
- **✅ A2P APPROVED (2026-08-16).** GHL shows **Brand status: Approved** AND **Campaign status: Approved** (TRIPLE PLAYZ INC brand + Marketing/Promotional campaign passed TCR + carrier vetting; SHAKEN/STIR voice registration also Approved). Despite sports-betting being a high-scrutiny vertical, it cleared on the first pass. **What got it approved:** site LIVE at https://www.yourswami.com showing business details (entity + address + phone + email, "Operated by TRIPLE PLAYZ INC"); the GHL chat widget working as the sole opt-in with a **DOB age-check field** added inside the chatbox (age-gated = YES); TOS + Privacy live; zero other phone/opt-in forms; and GHL's automated widget-compliance check + the 6-item website checklist all green after (a) matching the site widget-id EXACTLY to the campaign's, (b) making the widget a raw `<script>` so GHL's crawler detects it, and (c) fixing the widget rendering (see §4). **SMS can now be sent legitimately** to opted-in contacts. GHL provided the use-case/opt-in/sample-message fields itself (LeadConnector is the ISV; those fields are auto-generated and locked).

## 9. DOMAIN PHASE (deferred until yourswami.com is live)
Kept on tripleplayz.com because they are FUNCTIONAL identifiers tied to live infra (changing them breaks the live app):
- **Admin auth email allowlists** (login gates): `lib/adminAuth.ts`, `/api/admin/users`, `/api/admin/moderation`, `/api/nickname`, `community/page.tsx`, `admin/users/page.tsx` - contain `support@tripleplayz.com` + `diamondboysadvisory@gmail.com`. Changing locks out the real admin.
- **Email sender**: `lib/email.ts` `FROM_EMAIL = picks@tripleplayz.com` (needs SPF/DKIM verification for a new domain) and the in-email `https://tripleplayz.com/dashboard` CTAs.
- Affiliate referral share links (`settings/page.tsx`) and pick-text/podcast site URLs (`admin/analysis/[gameId]`, `api/admin/podcast/generate`) still point at tripleplayz.com (the live site).
- Note: `lib/sms.ts` (which had tripleplayz.com links) is DELETED on the -a2p branch.

## 10. Preview + go-live + reversibility
- **Preview:** push a branch -> Vercel builds a preview under **mejconsulting**. The public `*.vercel.app` URL is NOT in the GitHub API; the commit status `target_url` is the Vercel **dashboard** deploy page (click Visit). A PR would make the Vercel bot comment the clickable link. **Preview env must have `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`** or the auth-gated pages client-side-crash ("Application error"). Preview deployments do not run Vercel cron; do not touch production. Previews sit behind Vercel SSO (mejconsulting login) unless protection is off.
- **Go-live reversibility:** code = highly reversible (Vercel one-click rollback to a prior production deploy, `git revert`, master untouched, private backup). Data = untouched (same Supabase). DNS = reversible but TTL-delayed; go **additive** (add yourswami.com alongside tripleplayz.com). **Sticky/not-quickly-reversible:** SEO/301 redirects, email sender reputation, and **A2P registration** (carrier-vetted against the domain, slow, fees). Recommended order: finalize domain -> deploy rebrand + A2P widget/pages on yourswami.com -> register A2P there -> keep old SMS running until approved -> hold hard 301s until confident. Vercel/DNS are controlled by the owner (fusinbones), not us.

## 9.5 GO-LIVE DECISIONS (2026-08-15, in progress)
User chose: domain at **GoDaddy**, **SAME backend** as tripleplayz (shared Supabase + Stripe, so all existing users/subscriptions/payments carry over - true rebrand), and **user clicks Vercel** (I have no mejconsulting dashboard access; gh CLI is authed as automationbytehreem with repo scope).
- **Architecture:** a NEW, SEPARATE Vercel project built from `automationbytehreem/yourswami` (master), with yourswami.com attached. tripleplayz.com untouched because its production only builds from fusinbones `master`. Fully reversible: delete the new Vercel project + GoDaddy DNS records; nothing about tripleplayz changes.
- **Key code facts:** checkout `success_url`/`cancel_url` use `request.nextUrl.origin`; dashboard auth uses `window.location.origin`; `metadataBase` already yourswami.com -> redirects auto-resolve to the new domain, no site-URL env var needed.
- **Crons trap (handled):** shared backend means running the 3 crons (refresh-odds 3h, auto-picks daily 14:00, grade-picks */15) on BOTH deploys would duplicate picks and double-send result emails. New deploy ships `vercel.json` crons=[] so tripleplayz remains the sole worker. When tripleplayz is retired, restore crons on yourswami.
- **Stripe:** checkouts on yourswami record fine via the existing account-level webhook (writes to shared DB). Optional independence: add a 2nd Stripe webhook endpoint -> yourswami.com/api/stripe/webhook and set its signing secret as the new project's STRIPE_WEBHOOK_SECRET.
- **Supabase:** MUST add `https://yourswami.com` (and `/**`) to Auth Redirect URLs allowlist or logins from the new domain fail.
- **Env vars:** mirror the tripleplayz Vercel project 1:1 (same backend = identical values). Full key list in the handoff. CRON_SECRET still set even though crons are off (routes check it).
- **Deferred follow-ups (not blocking launch):** SendGrid domain-auth yourswami.com then flip FROM_EMAIL; switch admin allowlists once support@yourswami.com mailbox exists + admins log in with it; GHL A2P Brand+Campaign registration against yourswami.com.
- **Vercel import gotcha:** the mejconsulting Vercel GitHub app likely needs permission granted to the automationbytehreem/yourswami repo ("Adjust GitHub App Permissions") before it appears for import.

## 11. Security (read-only review, FLAGGED not fixed)
On the live TriplePlayz code: the **admin API is largely unauthenticated** - 18 of 20 `/api/admin/*` routes have no auth and use the Supabase **service-role key** (RLS-bypassing); the 2 that check trust a self-asserted `x-admin-email` header whose accepted values are hardcoded in this public repo. Service key falls back to the anon key silently if missing. Cron secret check is conditional (`dev mode` allows secret-less calls). `bot/node_modules` was committed in history (~most of repo size). Stripe webhook signature verification is correct. RLS policies exist but are bypassed by the service key. Owner confirmed no Google manual actions. Not this project's task to fix, but worth raising before/at go-live.

## 12. Open items / next steps (as of 2026-08-23)
DONE: go-live (§9.5), fire-picks-only dashboard, admin-API secured, A2P Brand+Campaign APPROVED (§8), **SMS-on-drop LIVE end to end (§14)**, signup SMS opt-in + 21+ age gate, account-level opt-out, GHL contact sync on every signup, A2P compliance review passed, site-wide CSS spacing bug fixed, favicon corrected.

Still OPEN:
- **Email pick-alerts**: still dead. `/api/admin/fire-picks` calls SendGrid but there is no `SENDGRID_API_KEY` in the yourswami Vercel env (confirmed 2026-08-23: the project has 13 env vars and that is not among them). Reuse tripleplayz's SendGrid account (sender picks@tripleplayz.com verified); make a fresh key, existing not viewable.
- **Opt-in confirmation SMS**: the A2P campaign registers an "Opt-in Message", but the app sends nothing when someone opts in. They hear nothing until the next pick drops. Registering a message never sent is the same class of mismatch fixed elsewhere. Small build: fire that text from `upsertContact` when the tag is first applied.
- **Did the three test texts arrive?** The API reported 3 sent / 0 failed to +19172252555, +16468588850, +15708572473 on 2026-08-23. Never confirmed on the handsets. Delivery is the one link unverified from this side.
- **Draft GHL workflow `SMS Opt-In Tagging (A2P)`** (id `6362e647-0ff2-43ff-a992-d7f02a6fba10`) still `draft`, the chat-widget opt-in path tags nobody. Signup form is now the primary collector so this is optional, but it is what the campaign describes.
- **Supabase redirect allowlist** `https://yourswami.com/**` (password-reset link domain only).
- **tripleplayz.com admin-auth hole**: still live there; user chose NOT to fix. Do not touch tripleplayz.
- **Git auto-deploy**: still not set up. Deploys are CLI-on-demand (§14 has the working command).
- **A2P campaign fields**: user was mid-edit 2026-08-23 with prepared text for Use Case Description, both sample messages, opt-in description, Opt-in Form URL and the two policy URLs. Confirm they were saved.

## 13. Automated SMS-on-drop (2026-08-20), the sender, now LIVE (see §14 for how it shipped)
Goal: the instant staff post a fire pick, text every opted-in subscriber. Opted-in phones live in **GoHighLevel** (the chat widget is the sole opt-in collector, §4/§8), NOT in our Supabase DB, so the app has to read them out of GHL and send through GHL over the A2P-approved number.

**Code (committed to `automationbytehreem/yourswami` private repo, branch/master; deployed = NO):**
- **`src/lib/ghlSms.ts`** (new). `sendFirePickSms(pick)` = (a) `fetchOptedInContacts` → `POST https://services.leadconnectorhq.com/contacts/search` with `{locationId, pageLimit:100, filters:[{field:'tags',operator:'contains',value:<tag>}]}`, header `Version: 2021-07-28`, follows per-contact `searchAfter` cursor (page loop hard-capped at 100); (b) `sendSmsToContact` → `POST /conversations/messages` with `{type:'SMS', contactId, message}`, header `Version: 2021-04-15`; (c) `sendWithConcurrency` runs the sends 5 at a time to stay under GHL's ~100-req/10s burst limit. Reads config from env `GHL_API_TOKEN` / `GHL_LOCATION_ID` / `GHL_OPTIN_TAG`; if any missing it logs and no-ops (safe to ship un-configured). Never throws to the caller. SMS copy is short, dash-free, ends "Reply STOP to opt out"; GHL also auto-honors STOP/DND on send.
- **`src/app/api/admin/fire-picks/route.ts`** (edited). Both email and SMS notification fan-out moved into Next's **`after()`** (imported from `next/server`) so they finish AFTER the response is returned, a plain fire-and-forget promise gets frozen/killed on Vercel once the function responds, which is why the pre-existing email was unreliable. Added `export const maxDuration = 60`. The email subscriber query was trimmed from `select('email, phone')` to `select('email')` (we never read a phone from our DB now, reinforces the A2P sole-collector attestation). SMS call is `await sendFirePickSms(pickData)` inside the same `after()`.

**Credentials (in hand):** GHL **Private Integration token** (string begins `pit-`; **value NOT stored in any memory file or the repo**, it is only in GHL Settings→Private Integrations and, once added, the yourswami Vercel env). Scopes granted: `contacts.readonly`, `contacts.write`, `conversations.readonly`, `conversations.write`, `conversations/message.readonly`, `conversations/message.write`, `conversations/reports.readonly`. Verified **least-privilege**: the token 401s ("not authorized for this scope") on `locations/search`, `oauth/installedLocations`, users, it can ONLY touch contacts + conversations. **Location ID = `sb8EJdIHmrQp0LEESgjf`** (read from the GHL app URL `.../location/<id>/...`).

**Env vars to add to the yourswami Vercel project (NOT done yet):** `GHL_API_TOKEN` (the pit- token), `GHL_LOCATION_ID` = `sb8EJdIHmrQp0LEESgjf`, `GHL_OPTIN_TAG` = `sms-optin`.

**Two blockers before it delivers:**
1. **Opt-in tag does not exist yet.** The sub-account has 6 contacts, all with generic CRM tags (follow-up / high priority / warm lead) plus one real untagged contact ("michael chierchio", +1 917 225 2555). Nothing carries an opt-in tag. User must make every chat-widget opt-in auto-apply **`sms-optin`**, either a "Tags"/"add tag" field in the chat-widget settings (simplest if present) OR a one-time GHL workflow: **Trigger** "Customer Replied" (Live Chat) or "Contact Created" → **Action** "Add Contact Tag" = `sms-optin`. (A `ghl` skill exists for building GHL workflows via the internal API if we want to script this.)
2. **Live test not run yet.** Plan: use the token's `contacts.write` to create ONE test contact (the user's own phone + `sms-optin`), run the exact search+send, confirm the text lands, THEN add env + deploy. Blocked only on the user supplying a test phone number (declined to text "michael" without confirmation).

**GHL API facts learned (save re-discovery):** base `https://services.leadconnectorhq.com`; `contacts/search` returns 422 `"locationId can't be undefined"` without a locationId; success shape `{contacts:[...], total, traceId}`; each contact carries `searchAfter:[epochMs, id]` used as the next-page cursor; there is **no bulk/broadcast SMS endpoint**, so the design is fetch-tagged-contacts-then-loop-send. The chat-widget public loader at `widgets.leadconnectorhq.com/chat-widget/loader.js` is 403-gated (can't scrape the widget config for the location).

**Access model:** there is NO persistent Claude↔GHL connector. All GHL access is direct REST calls using the PIT the user pasted; revocable anytime via GHL Settings→Private Integrations (kills both ad-hoc calls and the live app).

## 14. SMS opt-in shipped end to end (2026-08-23), LIVE
The session that took §13 from "built, not deployed" to working in production, plus the signup-side opt-in it turned out to need.

**Why §13 alone could never have worked.** The sender was fine. The problem was that nothing could ever carry the `sms-optin` tag: every phone field had been stripped from the site for the A2P attestation, so the app collected zero phone numbers. "Text our subscribers" required building the opt-in half.

**What shipped:**
- **Signup consent capture** (`src/app/dashboard/page.tsx`). Optional phone + an unchecked SMS consent checkbox carrying the full CTIA set (program name, rates, frequency, STOP/HELP, "not a condition of purchase", Terms + Privacy links). Ticking it reveals a **required 21+ checkbox** (the A2P campaign declares age-gated content, so an un-gated opt-in path would contradict the registration). Stored in Supabase `user_metadata`: `phone`, `sms_consent`, `sms_consent_at`, `sms_consent_source`, `sms_age_confirmed`. The timestamp is the TCPA proof.
- **`POST /api/ghl/sync-contact`** (new). Called after OTP confirmation. Self-authenticating because it sits outside the `/api/admin/*` middleware gate; identity comes from the verified Supabase bearer token, never the request body, so nobody can create a contact for an address they do not own. Everyone syncs tagged `website-signup`; only real consent adds `sms-optin`. Fire-and-forget so a CRM outage cannot block signup.
- **`GET/POST /api/ghl/sms-preference`** (new) + a **Text Alerts** section in `/settings`. Account-level opt-out, which is what carriers look for and what someone who cannot find the off switch replaces with a spam report. `revokeSmsOptIn` strips the tag but KEEPS the contact, preserving the record that consent was given then withdrawn. Opting out clears stored consent even if GHL errors. Opting back in demands a fresh phone + consent + age confirmation; a withdrawn consent is never silently reused. GET returns only the last 4 digits.
- **`upsertContact` / `toE164` / `revokeSmsOptIn` / `grantSmsOptIn`** added to `src/lib/ghlSms.ts`; `upsertOptInContact` now delegates to `upsertContact`.
- **Stripe webhook** (`checkout.session.completed`) reads stored consent after payment clears and pushes to GHL. Age flag enforced in BOTH server paths.
- **`smsBody` rewritten** to match the sample message registered on the campaign: opens "Hi! This is TRIPLE PLAYZ INC (YourSwami)", carries STOP + rates. Costs a second segment (~245 vs ~150 chars); a traffic-to-sample mismatch is the more expensive outcome.

**Env vars are LIVE on Vercel Production** (set 2026-08-23, verified by read-back): `GHL_API_TOKEN`, `GHL_LOCATION_ID=sb8EJdIHmrQp0LEESgjf`, `GHL_OPTIN_TAG=sms-optin`. Set as **`encrypted`, deliberately NOT `sensitive`**, sensitive vars are write-only and unrecoverable, which is exactly why `SENDGRID_API_KEY` was lost when this project was cloned. **Production target only, not Preview**, so a preview deploy can never text real subscribers.

**Live send test passed:** 3 sent / 0 failed over the real A2P number to three numbers the user supplied. Handset delivery still unconfirmed (§12).

**MISTAKE MADE, worth not repeating.** The first test's cleanup deleted every contact carrying `sms-optin`. One of the numbers already existed in GHL, so `upsert` matched it by phone, absorbed the real record, and the tag-scoped delete destroyed it (the real contact "michael chierchio"). Name and number were restorable from these notes; conversation history was not. Lesson saved as [[feedback-cleanup-by-identity-not-attribute]]: snapshot first, untag rather than delete anything pre-existing, delete only IDs you created in that run.

**GHL behaviours confirmed by measurement (do not re-derive):**
- **`contacts/upsert` REPLACES the tag array, it does not merge.** Upserting with `['sms-optin']` wiped an existing `website-signup`. This is why `upsertOptInContact` resends `SIGNUP_TAG` alongside the opt-in tag.
- **The contact search index lags writes by 5 to 8 seconds.** A freshly tagged contact returns nothing, which reads exactly like "nobody opted in". Harmless in production (signups precede drops by minutes) but it produces a false negative when testing. Wait ~10s. Every alternative query shape behaves identically once the index catches up; the shape is correct as written. Documented in the code so nobody rewrites a working query.
- Tag removal: `DELETE /contacts/{id}/tags` with body `{tags:[...]}`. Contact lookup by email: `contacts/search` with `filters:[{field:'email',operator:'eq',value}]`.

## 15. A2P compliance review, and what the checker actually wants (2026-08-23)
LeadConnector's automated Compliance Review flagged 4 failures across three sections; all fixed and live.
- **Opt-in Form 6/8 → 8/8.** "Business name displayed in consent text", the checkbox named only the consumer brand; now names **TRIPLE PLAYZ INC (YourSwami)**. "Message type disclosure", "fire pick alerts" describes the product, not the message class; now "recurring automated marketing messages (fire pick alerts, promotions, and updates)". Applied to BOTH opt-in surfaces (signup + settings) so they cannot drift.
- **Privacy Policy 6/7 → 7/7.** Added a **Cookies & Tracking Technologies** section (strictly necessary / analytics / payment, no third-party advertising, how to block, and that SMS consent is never collected via cookies). Analytics had been named only in passing under third parties.
- **Terms of Service 6/7 → 7/7.** The 21+ rule existed only under general Eligibility, not in the SMS terms. Added an **Age Restriction** clause inside the SMS section.

**The checker matches literal strings, not equivalent claims.** Writing "21+ exceeds the 18+ minimum" still failed; its tooltip wanted the exact sentence *"You must be 18 years of age or older to use this SMS service."* Stating it verbatim passed. **The user then reverted this to 21+ deliberately**, an 18+ line contradicts a sports-wagering product that requires 21+ everywhere else. The sentence keeps the checker's shape with the correct figure: *"You must be 21 years of age or older to use this SMS service."* Re-running the checker will flag the age item again; that is expected and accepted, and the campaign was already submitted.

**Opt-In Method dropdown offers:** Website Form, Paper Form, Facebook Lead Form, QR Code, Kiosk, Verbal. There is **no chat-widget option**, "Website Form" is the category both the widget and the signup form fall under, which is why adding the signup form contradicts nothing.

**Prepared field text** (scratchpad copies were session-local; regenerate if needed): Use Case Description naming both opt-in paths and the account-level opt-out; sample messages matching real traffic in the approved "Hi! This is TRIPLE PLAYZ INC" shape; **Opt-in Form URL must be `https://yourswami.com/dashboard?signup=free`**, not the homepage, the homepage has no phone field and a reviewer landing there sees no opt-in form. Policy URLs must be **yourswami.com/privacy** and **/tos**, not leadconnectorhq.com: the site's own privacy policy already carries the required verbatim clause ("No mobile information will be shared with third parties or affiliates...").

## 16. THE CSS BUG THAT MADE EVERYTHING LOOK STUFFED (2026-08-23)
`globals.css` had an **unlayered** `* { margin:0; padding:0; box-sizing:border-box }`. Tailwind v4 puts utilities in `@layer utilities`, and **unlayered CSS beats layered CSS regardless of specificity**, so every `p-*`, `m-*`, `mt-*`, `space-y-*` computed to **0 across the entire site**. Proof: a freshly created `<div class="p-4">` measured **0px** padding. `gap-*` and `text-*` survive, which is why it went unnoticed for so long.

Fixed by wrapping the reset in `@layer base` (comment in the file says do not unwrap it). After: `.p-4` = 16px, `/tos` sections 0px → 32px padding and 0px → 32px between sections, `/privacy` likewise. Checked `/`, `/pricing`, `/tos`, `/privacy`, `/dashboard`, `/community`, `/patterns`, `/settings` all 200 with no horizontal scroll before deploying.

Symptoms cured retroactively: the signup card was **292px wide on a 1440px screen** (`.container-db` adds 3rem padding per side at >=1024px, eating a 420px max-width); the footer banner butted at **0px** against the footer text; the disclaimer box had 0 padding and 0 gap to the copyright line. Those were patched inline before the root cause was found; the inline styles remain and still win.

**Related cascade trap in the same file:** `.btn-glow` sets `font-size` and `padding` and is defined AFTER the Tailwind import, so `text-sm` on a `.btn-glow` element never applied (computed 16px, not 14px). Inline styles are the reliable override for anything inside `.btn-glow`.

## 17. UI work (2026-08-23)
- **Mobile consent was impossible.** GHL's chat widget greeting (`.lc_text-widget`, `position:fixed`, **z-index 99999999**, inside a shadow root) landed on the consent disclosure and the 21+ checkbox on narrow screens; `elementFromPoint` over the checkbox returned `CHAT-WIDGET`, not the input. Most traffic is mobile, so this alone would have produced near-zero opt-ins. Suppressed on the auth view under 640px only (`<style>` in the auth branch); desktop unaffected, widget still runs everywhere else.
- **Signup form responsive pass:** inputs 15px → **16px** (under 16px iOS Safari zooms the page on focus), checkboxes 16 → 20px, disclosure 12 → 13px, card 292 → 440px on desktop, password placeholder shortened (was clipping at 375px). Verified at 320/375/1440.
- **Header:** signed-in state showed eleven items in one row; account actions now collapse into a dropdown (Dashboard / Account Settings / Admin / Sign Out) closing on outside click and Escape. Signup CTA was 43px at 16px beside 20px nav links (2.14x); now 36px at 13px (1.77x) with a restrained `cta-pulse` (2.8s, pauses on hover/focus, off under `prefers-reduced-motion`).
- **Footer banner replaced** from `Footer Image.jpg`. White-filled rounded corners removed by **flood-filling inward from the four corners**, a global white→transparent would have punched holes through the white "I AM" and "YOURSWAMI.COM" lettering. 5,618 corner pixels cleared, 23,729 interior white kept, 4px dilation to eat the anti-aliased fringe (safer than lowering the threshold, which would leak into the near-white stadium lights). 2.3MB JPG → **84KB WebP**, also 32% smaller than the banner it replaced.
- **Favicon was still the pre-rebrand mark** (black circle, white triangle, from diamond-boys). `src/app/favicon.ico` was dated Aug 12 03:49, before the YourSwami assets at 21:48, and **in the App Router that file wins over the metadata config**. Regenerated from `public/brand/avatar.png`: dark square backing flood-filled to transparent, contrast + unsharp at <=48px so the turban and gold ring survive a 16px tab. Written to `src/app/favicon.ico`, `public/favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`.
- **Privacy link was wrong in three places**, footer and both checkout pages pointed at `/tos#privacy` while a standalone `/privacy` page exists. All repointed.

## 18. Deploy + rollback, as actually performed (2026-08-23)
Vercel CLI auth finally exists via a user-supplied **token stored in `.env.deploy`** (gitignored via `.env*`; Next does not auto-load that filename). Project linked deterministically by writing `.vercel/project.json` with `projectId prj_HhzxvKTRA2NTUO9GVRuzcNDO1rhc` / `orgId team_EAzw76Ae1sIlsn3bNGjnxuPF`, so a deploy cannot accidentally create a new project.

Working command (ran cleanly ~7 times, no need to move `.git` aside with a token):
```
git push yourswami <branch>:master
npx vercel deploy --prod --force --yes --token "$VT" --scope mejconsulting
```
The GHL PIT also lives in `.env.local` now, so the SMS paths can be exercised locally.

**Rollback is pinned** in `ROLLBACK.md` (committed): pre-deploy production was `dpl_GXGU1YrVPjpv62gYmhscQPpWdMS1` (2026-08-16), commit `d7da171`, tagged **`pre-sms-deploy`** and pushed. Confirmed still READY and promotable, so recovery is a promote, not a rebuild. The file also records what a rollback does NOT undo: the GHL env vars, contacts already tagged in GHL (untag them or a later redeploy resumes texting), and Supabase consent metadata (KEEP it, deleting destroys the audit trail).

**Verification habit that earned its keep:** every deploy was checked against the live domain, not localhost, new API routes returning **401 rather than 404** proves they shipped and are auth-gated; the footer image byte count matched the built file exactly; `elementFromPoint` proved the mobile checkbox was reachable. A `toE164` unit test caught that the regex backslashes had been stripped during authoring (`/^+[1-9]d{7,14}$/`), which would have silently rejected every valid phone number.

## 19. REVENUE IS BROKEN: 4 of 5 tiers cannot be purchased (found 2026-08-23, UNRESOLVED)
Tested live against `POST /api/checkout` for every tier:

| tier | price | live checkout |
|---|---|---|
| daily | $24.99 | WORKS |
| pattern (.500) | $49.99 | broken (since deleted) |
| weekly | $74.99 | BROKEN |
| monthly | $229.99 | BROKEN |
| season/Annual | $997 | BROKEN |

Stripe returns `You passed an empty string for 'line_items[0][price]'`. Cause: `tiers.ts` reads `process.env.STRIPE_PRICE_WEEKLY` / `_MONTHLY` / `_SEASON` / `_PATTERN`, and **none of those env vars exist on the yourswami Vercel project** (confirmed by listing them: 13 vars, no `STRIPE_PRICE_*` at all). They fall back to `''` and Stripe rejects it. Only Daily Pass works because its priceId is hardcoded in the file. Almost certainly dates to the go-live env mirror in August.

**To fix:** get the Stripe Price IDs (`price_1ABC...`) from the Stripe dashboard (same account as tripleplayz, so the same IDs work) and set `STRIPE_PRICE_WEEKLY`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_SEASON` on Vercel Production, then re-test each tier. Annual also needs a Stripe price whose interval is actually yearly and whose amount is 997; the code says Annual but the underlying Stripe price is still whatever the old 6-month Season Pass used.

Note: `/api/pattern-system/checkout` used **Authorize.Net** (`ARBCreateSubscriptionRequest`), not Stripe, and its `AUTHORIZE_NET_*` vars are also absent. That route is now deleted.

The user was explicit that pricing work was NOT requested. This is recorded as a finding, not a task.

## 20. Product changes from Mike (2026-08-23) - all LIVE
- **The .500 Method is retired.** Removed from `tiers[]`, so it is gone from /pricing.
- **Season Pass is now Annual at $997/year.** The tier **id stays `season`** deliberately: it is written into Supabase `subscription_tier` and Stripe subscription metadata, so renaming the id would orphan every existing subscriber. Only the customer-facing name, interval and price changed. Five other places showed the old name and were updated (community filter, settings badge, social-proof toast, testimonial, terms). The terms page had cited Season Pass as an example of a ONE-TIME purchase that does not auto-renew; Annual is recurring, so that example now cites Daily Pass.
- **The Pattern System is DELETED, not gated.** First pass gated it to admin; Mike then said remove it and any references. Deleted: `/patterns`, `/patterns/demo`, `/pattern-system` (+ checkout, success, layout, css), `/api/patterns/*`, `/api/pattern-system/*`, `src/components/patterns/*` (BreakAnalytics, FirePicksHistory, imported only by the deleted dashboard), `/admin/patterns`, `/api/admin/patterns` and its admin-nav entry, and `src/components/AdminOnly.tsx` (existed only to gate those pages). Dropped `/api/patterns/*` from the middleware matcher. Removed the two "Launch Pattern System" buttons in the course that pushed to `/patterns` and would have 404'd. Verified live: all seven routes return 404.

**KEPT ON PURPOSE, these are NOT the retired product:**
- `pattern_break_game` on fire picks. A database column recording which game a pattern broke on, core to the fire picks being kept.
- `src/lib/stat-engine.ts`, the ELO / Log5 / Kelly Statistical Edge Engine, and the `engine: 'stats' | 'pattern'` mode in the admin AI analysis. Internal tooling. Its admin label read "Pattern System" and was renamed to **"Alternation Model"** so the retired name is gone without removing the feature.
- `pattern: 1` in `TIER_LEVELS`, as a legacy mapping only, so any Supabase row still reading `subscription_tier='pattern'` does not resolve to an undefined access level. Commented as safe to drop once no such rows remain.

**RESOLVED 2026-08-24: the course was RETIRED entirely.** Mike's instruction was that the Pattern System come off the site completely, and the course was where every surviving reference lived, so the whole product was removed rather than rewritten. Deleted `src/app/course` (landing, learn, Modules 1-7, course.css, learn.css, layout), `src/app/api/course/{purchase,announcements}`, `src/components/course/PaymentForm.tsx`, and the dead `/course` funnel branch in `LayoutShell.tsx`. The build cache had to be cleared (`rm -rf .next`) because stale `.next/dev/types/routes.ts` still listed `/course` and failed the TS route validator even though compilation succeeded. Verified live: /course, /course/learn, /api/course/purchase all 404, all real pages 200, and no served page contains Pattern System / Fire Course / .500 Method / Season Pass. Commit f154cc9, revert tag `pre-course-removal` (6e0d289) pushed. It was already unbuyable: it charged through Authorize.Net and no `AUTHORIZE_NET_*` vars exist on the yourswami project. Three internal Pattern references remain ON PURPOSE and are not the product: the Alternation Model prompt in `gemini.ts`, the podcast guard in `api/admin/podcast/generate` that stops the AI revealing the methodology, and the legacy tier-mapping comment in `tiers.ts`.

**Superseded, kept for context, the original open decision:** `/course`, `/course/learn` and all seven modules are built around teaching the Pattern System (**116 references**), and the course page sells "Pattern System access included, Lifetime access". It now teaches a tool that does not exist, and anyone who bought it for that reason has lost what they paid for. Deliberately not touched: gutting a separate paid product with existing buyers should not be inferred from "get rid of the pattern system". Mike needs to decide: rewrite, retire, or leave.

## 21. Nav layout (2026-08-23)
Three zones: logo left, links centred, Log In + Sign Up + clock pinned right. Reached in two passes and the second one matters.

First pass centred the links on the **viewport** by giving both side zones `flex-1`. That measured within 3px of true centre and looked wrong: the logo block is far narrower than Log In + CTA + clock, so all the slack collected on one side, leaving a **208px hole on the left against 36px on the right**.

Second pass centres the links **between the logo and the actions** instead (`flex-1` on the middle only), splitting the slack evenly: **106px and 106px, imbalance 0**. Link spacing also widened 24px to 32px at xl, taking the block from 377px to 409px. This sits slightly off true screen centre by design; even gaps read as deliberate, a lopsided one reads as a mistake. Do not "fix" it back to true centring.

Also in this pass: the signup CTA was 43px tall at 16px beside 20px nav links (2.14x); now 36px at 13px (1.77x) with a restrained `cta-pulse` (2.8s, pauses on hover/focus, off under `prefers-reduced-motion`). Sized **inline** because `.btn-glow` sets font-size and padding after the Tailwind import, so `text-sm` never applied.

## 22. Growth automation on GHL: there is none (checked 2026-08-23)
State of the sub-account: **1 workflow** (`SMS Opt-In Tagging (A2P)`, still a **draft**, so it runs on nobody), **7 contacts** of which 5 are GHL's stock "(Example)" demo records and 2 are real (the user and Mike), both untagged. **0 subscribers carry `sms-optin`.**

Everything built so far is reactive delivery, not growth: signup syncs a contact, consent gets a pick-drop text, opt-out works. The gaps, roughly by value:
- **Free-week trial has no sequence at all.** The site sells "Start Free Week" and nothing happens during or after it. No welcome, no mid-trial proof-of-record, no day-6 expiry warning, no post-expiry win-back. For a subscription business this is where most revenue is decided and it is currently silent.
- **Abandoned checkout**: no recovery.
- **Cancellation win-back**: `customer.subscription.deleted` already fires in the Stripe webhook and sends nothing.
- **Payment failure**: `invoice.payment_failed` fires and sends nothing, so a failed card silently becomes a lost customer.
- **Inactive re-engagement**: nothing tracks who stopped logging in.
- **Referral activation**: a full affiliate system with tracking and commissions exists and nothing ever asks a happy customer to use it.
- **Email**: still entirely dead (no `SENDGRID_API_KEY`), so every sequence above would be SMS-only today.

Building these is feasible: the `ghl` skill drives GHL's internal API and can create real workflows (that is how the draft one was made), and the Stripe webhook already receives every event the sequences would trigger on. Advice given: hold until there are real subscribers, since sequences tune better against real behaviour than against zero, and get Mike's input on messaging before anything goes to real people.

## 23. SESSION 2026-08-25/27: the big one. What actually happened

Nineteen commits, `7db7e71..b3f0c0f`, all deployed to production. Sections 24 to 36 cover each. The single most valuable finding is §25: **every SMS this project ever sent failed, for a reason nobody had looked at**, and the reason was hidden behind a success counter that could not fail.

Revert tags pushed to `automationbytehreem/yourswami`, each one `git reset --hard <tag>` plus a deploy:
`pre-course-removal` (6e0d289), `pre-tier-tags` (722f298), `pre-admin-users-redesign` (7d8ab5f), `pre-firepick-trial-fix` (c6e20c7), `pre-sms-text-fix` (2c7398d), `pre-football-sports` (25d875c).

## 24. The Fire Course is RETIRED (commit f154cc9)

Mike had said remove the Pattern System "and any references". The last references all lived in The Fire Course, and it was not merely referencing the dead product, it was **selling** it: a `Live Pattern System software access` bullet inside the $497 package and a whole upsell section offering **Pattern System Pro at $49.99/month** for software that 404s.

Deleted: `src/app/course` (landing, learn view, Modules 1-7, `course.css`, `learn.css`, layout), `src/app/api/course/{purchase,announcements}`, `src/components/course/PaymentForm.tsx`, and the now-dead `/course` funnel branch in `LayoutShell.tsx`. 4,263 deletions.

**Build gotcha:** stale `.next/dev/types/routes.ts` still listed `/course` and failed the TS route validator even though compilation succeeded. `rm -rf .next` fixes it.

Verified live: `/course`, `/course/learn`, `/api/course/purchase` all 404; every real page 200; no served page contains Pattern System / Fire Course / .500 Method / Season Pass.

**It was already unbuyable.** It charged through Authorize.Net and no `AUTHORIZE_NET_*` vars exist on this project, so nobody lost a purchase in the window.

**Three Pattern references remain ON PURPOSE**, none customer-facing: the Alternation Model prompt in `gemini.ts`, the guard in `api/admin/podcast/generate` that stops the AI revealing the methodology, and the legacy tier-mapping comment in `tiers.ts`.

## 25. ROOT CAUSE: every SMS failed with Twilio Error 21408 (commit 0477a31)

**The finding that reframed three days of work.** Test sends resolved to:

```
Error 21408 - Your account is not allowed to send SMS to this country or region.
to: +923418377987
```

The test number **+92 is Pakistani**. The Twilio account behind GHL has geo permissions that exclude Pakistan. **The A2P campaign, the chat widget, the signup form and the messaging service were all fine the entire time.** Every hour spent on those was chasing the wrong thing.

**Why it stayed invisible for days:** `sendSmsToContact` returned `true` on `res.ok`. GHL accepts the POST (201) and the carrier rejects it **asynchronously a second or two later**. So the 2026-08-23 test logged "3 sent / 0 failed" while nothing arrived. Worse, `sendFirePickSms`'s return value was **discarded entirely** at the callsite, so the counts only ever reached a console log nobody read.

**Proven in both directions on real sends:**
- `+923418377987` (PK) -> POST 201, then `failed`, error 21408
- `+19172252555` (Mike, US) -> POST 201, then **`sent`**. First message this project ever delivered.

**The fix:** `sendSmsToContact` now returns the message id; `confirmDelivery(cfg, messageIds)` polls each queued message to a terminal state over three rounds (3s, 4s, 6s), because carrier rejections land fast. Terminal-good = `delivered|sent|read`, terminal-bad = `failed|undelivered|rejected`, anything unresolved is reported as **pending, never as success**. The blast summary logs at error level when anything failed and breaks failures down by carrier error string. The fire-picks route no longer discards the result.

**Standing rule for this project: a 2xx on a GHL message POST means queued, not delivered. Never report it as sent.**

## 26. Entitlement: one definition of who may receive a pick (commit c26cc0a)

Before this, the SMS blast selected recipients **purely by the `sms-optin` tag**. No subscription check, no trial check. The text carries the whole pick (team, line, matchup, time), so **an expired trial kept receiving the entire product by SMS forever** while the dashboard paywall sat there doing nothing.

New **`src/lib/entitlement.ts`** is the single definition: `PAID_TIERS` (including legacy `starter`/`pro`/`elite`), `DEFAULT_TRIAL_DAYS = 7`, `isEntitled(row, now)` = paid tier OR trial not yet elapsed including `trial_bonus_days`, and `filterEntitledEmails(emails)` which joins against `user_profiles` by email.

**Fails closed on purpose.** An address with no profile row, or a lookup that errors, is dropped rather than waved through. An under-send shows in the returned counts and can be retried; a leaked pick cannot be taken back.

The module is **client-safe**: supabase is pulled in via `await import()` inside the function, so the dashboard can import `PAID_TIERS` and `DEFAULT_TRIAL_DAYS` without dragging the server client into the browser bundle. The dashboard now does exactly that, so access and alerts cannot drift apart again.

`DEFAULT_TRIAL_DAYS` also centralises the trial length: **changing 7 days to 3 is one edit here.**

Verified against nine cases: paid, trial with days left, trial in its final hours, trial expired yesterday, expired 30 days ago, expired with 5 admin bonus days (texts), no `trial_end` signed up today (texts), no `trial_end` signed up 10 days ago (silent), cancelled subscriber (silent).

## 27. The SMS text said the pick three times (commit 541757e)

Live copy prepended `pick_team` and appended `pick_type` around `pick_value`, but `pick_value` already contains both. Real subscribers received:

> Today's FIRE PICK is live: **Arizona Diamondbacks Arizona Diamondbacks ML +165 (ML)**, Chicago Cubs @ Arizona Diamondbacks...

`pickSummary(pick)` now adds the team and type **only when not already present**. Checked against five shapes: value with team and type, value as a bare price, a spread, a total with no team, and an empty value falling back to team plus type. The registered A2P prefix and both disclosures are untouched, so the vetted message class is unchanged.

## 28. Signup had NEVER reached the CRM (commit bf7c475)

The GHL location held the same 7 contacts from 2026-08-22, five of them GHL demo records, and **`website-signup` had never been applied to anybody**. Every published workflow triggers on that tag, so all six were pointed at an audience of zero.

Confirmed the GHL side worked by creating and deleting a contact by hand, so the fault was ours: `sync-contact` ran **once**, at OTP verification, fire and forget, and the route returns **200 with `synced:false`** when it fails. It could fail on every signup and look healthy.

Now idempotent, and the dashboard calls it on the first authenticated load of each session, which backfills existing accounts on their next visit. **When the contact already exists the route does NOTHING**, deliberately: `upsert` would strip `sms-optin` (a consent record) and re-adding `website-signup` could restart the trial emails on every page load.

## 29. Lifecycle and tier tags: the app-to-GHL bridge (commits 79cbf41, 25d875c, c6e20c7)

Growth sequences live in GHL; the events that start them only exist in Stripe. **`src/lib/ghlLifecycle.ts`** is the bridge.

**Uses `POST /contacts/{id}/tags`, which is ADDITIVE.** Verified live: adding a tag left the existing one intact. `contacts/upsert` REPLACES the whole array and would silently strip `sms-optin`. This distinction is the single most important thing in the file.

Tag vocabulary:

| tag | written when |
|---|---|
| `website-signup` | signup confirmed |
| `sms-optin` | real consent (box + phone + 21+) |
| `customer-active` | `checkout.session.completed` |
| `payment-failed` | `invoice.payment_failed` |
| `churned` | `customer.subscription.deleted` |
| `refunded` | `charge.refunded` |
| `checkout-abandoned` | `checkout.session.expired` (new case) |
| `imported` | backfill only |
| `tier-daily` / `tier-weekly` / `tier-monthly` / `tier-annual` | on purchase and on renewal |

**Tags are cleared when their state resolves**, because GHL triggers on a tag being ADDED: a stale `payment-failed` means the next real failure is silently swallowed. `invoice.payment_succeeded` clears `payment-failed`, which is the gate every dunning step in YS 04 reads.

**A refund tags `refunded` but NOT `churned`**, deliberately, so win-back never chases someone who just asked for their money back.

**`setTierTag(email, tierId)` strips every other tier tag before applying the new one.** That is the entire point: an upgrade from Weekly to Annual would otherwise leave the contact in both segments forever, so an "upsell your Weekly users" campaign would keep chasing people who already bought the top plan. Pass `null` to clear (churn, refund). An unmapped tier id logs an error rather than leaving the contact silently unsegmentable.

**Tier id `season` maps to `tier-annual`.** The id was kept when Season Pass was renamed because it is written into Supabase `subscription_tier` and Stripe metadata.

**`checkout.session.expired` must be enabled on the Stripe webhook endpoint** or YS 03 can never fire. Never verified, no Stripe key available.

## 30. GHL backfill endpoint (commits 649e5ef, c6e20c7)

`POST /api/admin/ghl-backfill` plus **Preview CRM sync** and **Sync users to CRM** buttons on `/admin/users`, called through `adminFetch` so the request carries a real admin token.

**Tags backfilled contacts `imported`, NOT `website-signup`.** YS 01 is published and fires on `website-signup`, so using it would send "Your free week just started" to paying customers and to people whose trial lapsed weeks ago.

**Never applies `customer-active` either**, for the same reason: YS 02 triggers on it and would email long-standing customers an onboarding message. The `tier-*` tag identifies a paying customer for segmentation without firing anything.

Other guarantees: existing contacts are never upserted; `sms-optin` only where real consent is on file; **dry run by default returning up to 15 real sample rows**, because totals prove the code ran, not that it picked the right records; 120ms between writes for GHL's burst limit.

**Create-only was a bug, now fixed.** The first sync created 15 contacts before tier tagging existed; re-running skipped all 15 because they existed. Existing contacts now get their tier tag added additively.

**Actual result:** 17 users scanned, 15 created, then 7 tier-tagged: `srmartin235` `sondoo2728` `pdimiceli1` `sharpshoot3r` `diamondboysadvisory` = `tier-annual`, `mchierch` = `tier-daily`, `profitprofession` (Mike) = `tier-weekly`. `withSmsConsent: 0`, correct, since the phone field only went live 2026-08-23.

## 31. Six GHL workflows, BUILT and PUBLISHED

Location `sb8EJdIHmrQp0LEESgjf` (account name **Triple Playz**), folder **YourSwami Growth**. Specs versioned at `d:/PSK/GHL-Automation/engine/specs/ys-w0*.json`.

| id | name | trigger |
|---|---|---|
| `40edc4da-50c5-4de8-bfe8-c6efe050a944` | YS 01 Free Trial Nurture | `website-signup` |
| `fa1cdd8e-eb06-4b14-bc59-8ef6c07a7804` | YS 02 New Customer Onboarding | `customer-active` |
| `1315e63c-319b-445e-baba-334759143096` | YS 03 Abandoned Checkout Recovery | `checkout-abandoned` |
| `197a9327-3054-4f65-9360-e09be54dbaab` | YS 04 Payment Failure Rescue | `payment-failed` |
| `a7f2a47c-46f7-45ef-af74-1a4f81f7292f` | YS 05 Cancellation Win-Back | `churned` |
| `a61ff52a-75c5-4838-933e-d1487557d846` | YS 06 SMS Opt-In Confirmation | `sms-optin` |

**The old `SMS Opt-In Tagging (A2P)` `6362e647-...` is left DRAFT on purpose.** YS 06 supersedes it and running both would double-text.

**YS 06 closes the long-open A2P gap** where the campaign declared a confirmation SMS the app never sent.

**Every marketing SMS step is gated behind an if/else on `sms-optin`.** Email is not SMS-gated.

**Correction to the old §22 note:** sequences are NOT SMS-only. **GHL sends email natively** (`email` action, needs `subject` + `html`), so the dead SendGrid key blocks none of this.

**They do not fire retroactively.** The trigger is a tag being ADDED, so publishing does nothing for contacts already tagged.

**Confirmed firing on a real contact:** Mike received the YS 01 welcome email at 21:28 on 2026-08-26.

## 32. GHL engine failure signatures found (added to GHL-Automation/PROJECT.md)

- **A branch that TERMINATES on `add_contact_tag` is rejected, deterministically.** Survived 18 attempts across three fresh builds. Reordering so the branch ends on a different action (`{tag},{email}` instead of `{email},{tag}`) saved first try. Confusingly the same shape saved fine in a sibling workflow, so the trigger is narrower than "tag is terminal", but the reorder is a reliable fix.
- **A failed steps-save leaves a newly created workflow permanently corrupt.** Every later `steps` call against that id fails, degrading until even a single-step payload is rejected. No repair. Delete the shell and build fresh.
- **Step edits FAIL on a published workflow** with the same `Next is invalid` signature. It does NOT corrupt the live workflow, verified. The working cycle is `draft` -> `steps` -> `publish`, a couple of seconds unpublished.

## 33. Email template and deliverability

**`d:/PSK/GHL-Automation/engine/tools/ys-email.mjs`** is the branded template; **`tools/ys-restyle.mjs`** applies it to every email in the specs by subject and rewrites the JSON. 19 emails restyled, then pushed to all five live workflows via the draft/steps/publish cycle. Verified by reading back off the account: wordmark and gold CTA present, zero `first_name`.

Design: ground `#0a0512`, card `#150a24`, border `#2a1246`, gold `#FFC107`, text `#d9d5e0`, muted `#8b8497`. Wordmark PNG at 210px. Footer carries "Real picks. Real results. Real cash.", TRIPLE PLAYZ INC, 99 Longfellow Dr Colonia NJ 07067, and a 21+ line, which is also a CAN-SPAM and deliverability win.

**Email HTML is not web HTML.** Tables only (Outlook renders neither flex nor grid), every style inline plus `bgcolor` attributes (Outlook drops `background` shorthand on tables), **no `rgba()`**, **no WebP** (several clients cannot decode it, which is why `footer-banner.webp` is unusable), CTAs as coloured table cells not styled anchors.

**The "Hey ," bug.** Emails used `{{contact.first_name}}` and **nothing populates it**: `GhlContactInput` has no name field and the signup form collects no name. Every send opened with "Hey ,". Merge field removed entirely rather than faking a name.

**Deliverability, root cause.** First real send landed in Gmail spam. From address was `contact+yourswami.com@send.lcmsgndr.net`, **GHL's shared sending domain**, and yourswami.com published no SPF, no DMARC, no MX. Gmail's own reason: "similar to messages that were identified as spam in the past", i.e. shared-domain reputation.

**FIXED by the user 2026-08-27**, verified in live DNS:
- SPF on `mail.yourswami.com`: `v=spf1 include:mailgun.org include:spf.leadconnectorhq.com ~all`
- DKIM at `smtp._domainkey.mail.yourswami.com`, RSA key present
- DMARC on root: `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net`
- MX: mailgun.org, so **GHL sends through Mailgun**
- Dedicated header: `Your Swami <contact@yourswami.com>`, warmup Stage 1

Note the DMARC is GoDaddy's default, so aggregate reports go to GoDaddy, not to us. `p=quarantine` is strict, but DKIM aligns under relaxed alignment so it passes.

**Preview artifact:** https://claude.ai/code/artifact/d095dc7c-da00-4177-a760-5c259b5b5f9c (built by `scratchpad/build-kit.mjs`). Artifacts run under a strict CSP that blocks external images, so the wordmark is inlined as a data URI there; that is a preview-only concern, real inboxes load it normally.

## 34. Checkout fixed without any Stripe access (commit 9c88843)

Weekly, Monthly and Annual had failed since the August go-live: `tiers.ts` reads `STRIPE_PRICE_WEEKLY/_MONTHLY/_SEASON`, none exist on this project, so `priceId` fell back to `''` and Stripe rejected the session.

**Solution: Stripe accepts inline `price_data`, no Price object needed.** When `tier.priceId` is empty the line item is built from the tier definition, which already carries amount, name and interval.

Verified live, all four returning real `cs_live_...` sessions:

| tier | unit_amount | mode | interval | source |
|---|---|---|---|---|
| daily | 2499 | payment | one time | real price id `price_1TEr5UD7hIjQfa8atrgwi3kL` |
| weekly | 7499 | subscription | every 1 week | inline |
| monthly | 22999 | subscription | every 1 month | inline |
| season (Annual) | 99700 | subscription | every 1 **year** | inline |

The Annual Stripe page renders "yearly", so the interval landed. **Refuses to guess**: a recurring tier with an interval Stripe would not accept returns an error rather than defaulting, because charging monthly for a $997 plan silently would be worse than refusing the sale.

**Price display cannot disagree with price charged**: `/pricing` renders `${tier.price}` and checkout computes `Math.round(tier.price * 100)` from the same object.

**Stopgap.** Inline `price_data` makes Stripe create a throwaway Product per session, cluttering reporting. Replace with real Price ids when someone has Stripe access.

**Payments, settled:** Mike said "Zen Payments". Zen is the merchant account, **Authorize.Net was the gateway**, and it only ever charged for The Fire Course. Since the course was deleted, **Authorize.Net is entirely gone from the codebase** and everything runs on Stripe. Price ids come from Stripe, not Zen. Zen may still be billing a monthly fee for nothing.

## 35. Trial was invisible AND locked (commits 189be95, 2c7398d)

**Two separate faults, both shipped since launch.**

**`trialActive` was computed and never rendered.** For the whole 7 days a trial user saw nothing telling them they were on a trial, how long was left, or that it was ending. The first signal was the paywall appearing on day 8. Added a dashboard banner: days remaining, what happens when it ends, and a "Keep my access" link, amber at 2 days or fewer.

**The pick was locked for trial users anyway.** The dashboard computed `picksLocked` correctly (`!isPaid && !trialActive`) and then handed `FirePickCard` **`isPaid`**. So only a paid tier ever unlocked a pick, and a trial user saw "3 days left in your free trial" directly above a blurred pick reading "Members Only, upgrade to see this rare pick". **The trial granted nothing it promised.**

Confirmed both directions live: Mike (paid) saw the pick, the trial account did not. Fixed to `unlocked={!picksLocked}`, and the prop **renamed from `isPaid` to `unlocked`**, because the misleading name is what caused it. It now matches `isEntitled`, so dashboard access and SMS agree.

## 36. Admin access, and the six disagreeing gates

The user had no admin access. **Vercel stores sensitive vars write-only**: `vercel env pull` returns the literal string `"[SENSITIVE]"` for `SUPABASE_SERVICE_KEY`, `STRIPE_SECRET_KEY`, `ADMIN_EMAILS`, even `NEXT_PUBLIC_SUPABASE_URL`. Only `GHL_*` came back real, because those were deliberately set as *encrypted* rather than *sensitive*. **So the service key is genuinely unobtainable and no DB write can be done from here.**

Solved with an **additive `ADMIN_EMAILS_EXTRA`** rather than overwriting `ADMIN_EMAILS` blind, which could have locked out whoever was in it. Value: `automationbytehreem@gmail.com`. **To revoke: delete `ADMIN_EMAILS_EXTRA` and `NEXT_PUBLIC_ADMIN_EMAILS_EXTRA` in Vercel. No code change.**

**This codebase checks admin status in SIX independent places**, and adding someone to one does not add them to the others. Fixing access needed three rounds because each gate failed in turn:

| where | what it is | fixed? |
|---|---|---|
| `src/middleware.ts` | the real API gate, Supabase Bearer token | yes, reads `ADMIN_EMAILS_EXTRA` |
| `src/lib/adminApiAuth.ts` | server helper | yes |
| `src/lib/adminAuth.ts` | **client** gate for `/admin` pages, hardcoded list, cannot read server env | yes, via `NEXT_PUBLIC_ADMIN_EMAILS_EXTRA` |
| `src/app/api/admin/users/route.ts` | its own `x-admin-email` check against a two-name list | yes |
| `src/app/api/admin/moderation/route.ts` | own hardcoded list | allowlist STILL disagrees (identity-from-body was separately fixed in §44) |
| `src/app/api/admin/affiliates/route.ts` | reads only `ADMIN_EMAILS`, **no hardcoded fallback at all** | allowlist STILL disagrees. Note it fails CLOSED if the var is unset, so it is a lockout risk, not a hole |

Symptoms this produced: `/admin` said "Access Denied" while the API would have accepted; then the API said 401 so the panel rendered "No users found" with every stat at 0 while the backfill on the same page could see all 17 accounts.

**Security is unchanged and was re-verified after every deploy:** admin API with no token -> 401; with only a spoofed `x-admin-email` header -> 401. The client gate only decides which UI to render, never what data returns.

**Supabase project is `swbiwmmqsylwdzwjifpf.supabase.co`**, recovered from the client bundle.

## 37. Admin users page rebuilt (commits b78f9d0, 722f298, b3f0c0f)

Took three passes, worth recording why.

**Pass 1 failed** because the meta fields were given fixed widths but left inside a flex row after a `flex:1` element, so each row's columns started wherever that element happened to end. Nothing aligned down the page.

**Pass 2** made the header and every row share one grid track list (`34px minmax(0,1fr) 110px 140px 84px 18px`). The stats wrapper uses **`display: contents` at 1024px and up** so its spans become cells of the row grid; below that it collapses to a flex line under the email with the header hidden. Added column headings.

**Pass 3 fixed the expanded row**, which had two faults: the `.admin-user-detail-field` classes were written into `admin.css` and **never applied**, so every field was still a bare inline-styled div with the email value wrapping and its confirmation tick stranded below it; and the grid used `repeat(auto-fit, minmax(210px, 1fr))` where **the `1fr` let four short fields absorb the whole card** and sit hundreds of pixels apart. Now `minmax(190px, 250px)` with `justify-content: start`, so columns physically cannot spread.

**Phone and SMS consent are now surfaced.** Both come from auth `user_metadata`. Consent is badged separately from the number, because holding a phone number is not permission to text it.

Also fixed the missed rename `season: 'Season Pass'` -> `'Annual'` in the admin tier labels (commit 6e0d289, display map only, the `season` key stays).

## 38. A2P reality, corrected

The **VERIFIED** campaign `CKLGHFQ` (MARKETING, messaging service `MG392d1085...`) is the **chat widget** campaign. A **second** campaign was later submitted for the **web form** as **MIXED** and **FAILED**, with no campaign id, meaning the carriers never provisioned it. The user deleted it.

**MIXED fails because carriers scrutinise it hardest**, especially for age-gated sports wagering, and a duplicate campaign on the same brand is a common rejection on its own. It says nothing bad about the signup form.

**The user CANNOT edit the verified campaign's description.** That settles the question: leave it.

**Does the signup-form phone field endanger the verified campaign? No.** A2P's Opt-In Method dropdown has **no chat-widget option** at all: it offers Website Form, Paper Form, Facebook Lead Form, QR Code, Kiosk, Verbal. The widget was always registered as a Website Form, which is the same category the signup form falls under. Verification is not continuously re-scanned; enforcement is complaint-driven, and the defence is the timestamped per-contact consent record, which this app has.

**The real risks were: the number being attached to the failed campaign's messaging service, and any further resubmission.** The number was confirmed attached to the MARKETING service. Do not resubmit anything, the brand already carries one failure.

## 39. Contacts of record

| contact | id | tags |
|---|---|---|
| Mike Chierchio, `profitprofession@gmail.com`, `+19172252555` | `rXKtiC4lrJFhcurI2uOm` | `sms-optin`, `tier-weekly` |
| Tehreem, `automationbytehreem@gmail.com`, `+923418377987` | `DYTz6Z2Lor7RK1Fc7Jl9` | `website-signup`, `sms-optin` |

**Mike had TWO records**, one email-only and one phone-only, because **GHL will not let two contacts share a phone number**. Consolidated by clearing the stub's phone with `PUT {"phone": null}` (an **empty string is silently ignored**, `null` works) and setting it on the real one. An empty stub remains.

**A mistake worth not repeating:** tagging Mike used `upsert`, which replaced his tag array and removed the `website-signup` he had from his own signup. YS 01 had already fired so nothing was lost, but that is exactly the trap documented in §29 and it was walked into anyway. **Use `addLifecycleTags` for tagging an existing contact, never `upsert`.**

## 40. Fire pick stats are real, not hardcoded

Asked whether the dashboard record is computed or fixed. **Computed.** `/api/public/fire-pick` queries every decided row in `fire_picks` and aggregates: wins, losses, pushes, win rate, and net units summed from each pick's own `units`. No base, no offset, no seed constant. The `history` list is capped at 10 for display; the **stats query has no limit**.

Live API confirms **284 decided rows** producing 199-85, 70.1%, +384u, W9. They moved during the session (196-85 / +375u / W6 -> 199-85 / +384u / W9), consistently: three wins, +9 units at 3 units each.

**Open question for Mike:** those 284 picks predate this site (live 2026-08-15, visible fire picks start 2026-08-23), so the record was carried over from the TriplePlayz era. Worth confirming the provenance, because a public 70.1% win rate on a paid picks service is exactly the claim that draws scrutiny, and the site presents it as the headline with "wins and losses both, nothing hidden" beneath.

## 41. College football CANNOT be posted (unresolved, has a date on it)

Chris wanted the site live for college football starting **Saturday 2026-08-29**.

**It is impossible right now, and it is not an admin permission problem.** Three things combine:
1. `US_SPORTS` in `src/lib/odds-api.ts` lists **only** `baseball_mlb`, `basketball_nba`, `icehockey_nhl`. No NCAAF, no NFL.
2. The Fire Picks admin screen builds its game list from that array.
3. `handleSave` refuses without a `selectedGame` ("Select a game and enter the pick value"), and every field (matchup, sport, teams, odds) is read off it. **There is no free-text entry.**

**Fix:** add `americanfootball_ncaaf` and `americanfootball_nfl` to that array. The layer underneath is fully generic (`h2h`/`spreads`/`totals` are universal) and everything downstream treats `sport` as a plain string.

**But it is not a two-line job.** Odds are served from a Supabase `odds_cache` refreshed by a cron, and **crons are DISABLED on yourswami** because it shares a database with tripleplayz and would double-fire picks and emails. The new sports also need their cache populated once, or the list stays empty.

This was prepared and then **reverted uncommitted**, because the user had asked a question, not requested the change.

## 42. Still open after this session

1. **College football and NFL cannot be posted at all** (§41). The only item with a deadline.
2. **Email pick alerts still dead**, now for two independent reasons: no `SENDGRID_API_KEY`, and **nothing ever writes to `pick_subscribers`**, which is read-only in the codebase, so the recipient list would be empty anyway. Clean fix is sending them through GHL like the SMS, reusing the entitlement filter.
3. **No card has ever been put through checkout end to end.** Payment -> webhook -> tier grant -> picks unlocking has never been exercised. Cheapest test is buying Daily Pass at $24.99 and refunding, or a 100% off Stripe promo code since `allow_promotion_codes` is on.
4. **`checkout.session.expired` may not be enabled** on the Stripe webhook endpoint; without it YS 03 can never fire.
5. **Real Stripe Price ids** should replace the inline `price_data` stopgap.
6. **`moderation` and `affiliates` admin routes** still have their own disagreeing allowlists (§36).
7. **`public/robots.txt` and `public/sitemap.xml` still point at diamondboyssports.com.**
8. **Vercel deploy token expires ~2026-08-30.**
9. **Warmup**: the sending domain is Stage 1 with no reputation. Do not blast the dormant list. Most of the 17 accounts have not been seen in 46 to 154 days, several never. Send to engaged recipients first.
10. **A catch-up window for picks**: entitlement is judged at the instant a pick drops, so someone who subscribes an hour later gets nothing and there is no re-send. This is what happened to Mike.
11. **tripleplayz.com admin-auth hole** still open, user's informed choice. Do not touch tripleplayz.

## 43. SECURITY AUDIT 2026-08-27 (MOSTLY FIXED, commit 064c641, see §44 for what shipped)

Full sweep of all 47 API routes. **`src/middleware.ts` matches only `/api/admin/:path*`, so 24 routes have no blanket gate.** Each finding below is the result of reading the route plus, where safe, probing it live.

### CRITICAL 1: every cron endpoint is unauthenticated

**`CRON_SECRET` is not set on the Vercel project** (verified: 0 occurrences in `vercel env ls production`). Every cron route guards with:

```js
if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) return 401
```

With the variable unset the condition **short-circuits to false and never blocks**. The guard is a no-op. `cron/post-picks` is worse: `export async function GET()` with **no check at all**.

**Proven, not theorised:** `GET https://yourswami.com/api/cron/refresh-odds` with no secret returned `200` and `"Refreshed 88 odds + 115 scores"`. All four routes share the identical pattern.

Impact, on a database **shared with tripleplayz.com**:
- `cron/auto-picks` **inserts into the `picks` table** (line 142)
- `cron/grade-picks` grades picks and reads `pick_subscribers` to send email
- `cron/post-picks` posts picks
- `cron/refresh-odds` burns Odds API quota on demand

So anyone on the internet can create, post and grade picks on the live site, and drain the odds quota.

**Immediate mitigation needs NO deploy:** set `CRON_SECRET` to a long random value in Vercel. That single change activates the guard on three of the four. **`post-picks` has no check at all and needs a code fix.**

`vercel.json` is `{"crons": []}`, so nothing legitimate calls these on a schedule today; whatever secret is chosen only needs to match whoever invokes them manually.

### HIGH 2: `/api/user/sync-tier` is an unauthenticated user-enumeration oracle

No auth, uses the **service-role key**, takes `email` straight from the body. It creates a `user_profiles` row for any auth user and returns a distinguishable `404 "Supabase Auth user not found"` when the email has no account, which confirms account existence for any address.

The tier it writes is read back from **Stripe**, so it cannot be used to grant a tier the customer has not paid for. The exposure is enumeration plus unauthenticated row creation, not privilege escalation.

Called from the dashboard on every load, so any fix must keep that path working (derive the email from the Supabase token instead of the body).

### MEDIUM 3 to 6

- **`/api/notify-pick`**: no auth, service-role client, upserts an arbitrary email into `pick_notifications`. Junk-data injection and a second enumeration surface.
- **`/api/subscribe`**: no auth, adds any address to the Mailchimp audience. List poisoning, and a way to burn sender reputation by proxy.
- **`/api/nickname`**: `isAdmin` is decided by an **`?email=` query parameter** (`searchParams.get('email')`). Appending a known admin address bypasses reserved-nickname validation. Trivially spoofed.
- **`/api/admin/moderation`**: takes `moderatorEmail` from the request **body** for its super-admin check. The middleware gate means a valid admin token is still required, so this is not an auth bypass, but one admin can act as, and be audit-logged as, another moderator. This route and `/api/admin/affiliates` also still carry their own allowlists that disagree with the other four (see §36).

### LOW / informational

- **`NEXT_PUBLIC_ADMIN_EMAILS_EXTRA` exposes an admin email in the client bundle.** Introduced deliberately this session because the `/admin` page gate runs in the browser. The other admin addresses were already hardcoded in that bundle, so it adds no new class of exposure, but it is information disclosure and should be weighed if the allowlist ever grows.
- **The service key silently falls back to the anon key** in several files: `process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`. If the service key were ever missing, those routes would quietly run with anon rights and mostly appear to work rather than failing loudly. Same silent-degradation pattern as the SMS counter in §25.

### Verified GOOD (do not "fix" these)

- **Stripe webhook signature verification is correct.** `stripe.webhooks.constructEvent(body, signature, webhookSecret)`, and it returns 400 when the `stripe-signature` header is absent.
- **The `/api/admin/*` gate is sound.** It requires a real Supabase Bearer token validated against Supabase Auth. Re-tested after every deploy today: no token gives 401, and a spoofed `x-admin-email` header gives 401.
- **`/api/ghl/sync-contact` derives identity from the verified token**, never from the request body, which is exactly right for a route that sits outside the admin gate.

### Suggested fix order

1. Set `CRON_SECRET` in Vercel (no deploy, fixes three of four immediately).
2. Add a real secret check to `cron/post-picks`.
3. Change the cron guard from `if (SECRET && mismatch)` to **fail closed**: reject when the secret is unset.
4. `user/sync-tier`: take the email from the Supabase token, not the body.
5. `nickname`: drop the `?email=` admin claim entirely.
6. Rate-limit or authenticate `notify-pick` and `subscribe`.
7. `moderation`: take the moderator identity from the token, not the body.
8. Replace the silent anon-key fallbacks with a hard failure.

**Nothing above was changed.** All findings are recorded here for a dedicated pass.

## 44. Security fixes shipped (commit 064c641, verified live)

Revert tag `pre-security-fixes` (b3f0c0f).

**Correction to §43 as written.** Two findings were worse and one was harmless:
- `cron/auto-picks` and `cron/grade-picks` only returned 401 when a **wrong**
  secret was supplied. **Omitting `?secret=` entirely fell through**, so setting
  `CRON_SECRET` alone would NOT have fixed them. They needed the code change.
- `cron/post-picks` is a **no-op stub** that returns a message and does nothing.
  Harmless; left alone.

**`src/lib/cronAuth.ts`** is the new shared gate: **fails closed** (no configured
secret denies everyone, a missing parameter is treated exactly like a wrong one),
accepts `?secret=` or `Authorization: Bearer`, constant-time compare.
`CRON_SECRET` is now set on Vercel (value in this session's scratchpad only).

**Identity now comes from a verified token, never the body, in four routes:**
`user/sync-tier`, `nickname` (both GET's `?email=` admin claim and POST's
body `userId`, which had let anyone rename any user), `notify-pick`, and
`admin/moderation`. **Every caller was updated in the same commit**: the
dashboard, `settings`, `NicknamePrompt`, and `MorningSlate` all now send the
session token.

**Verified live after deploy:**

| probe | result |
|---|---|
| `/api/cron/{refresh-odds,auto-picks,grade-picks}` no secret | **401** |
| `/api/cron/auto-picks?secret=wrong` | **401** |
| POST `sync-tier` / `notify-pick` / `nickname` unauthenticated | **401** |
| `/api/cron/refresh-odds?secret=<real>` | **200**, refreshed 88 odds |
| same via `Authorization: Bearer <real>` | **200** |
| `/`, `/pricing`, `/dashboard`, `/settings`, `/community`, `/admin/users`, `/tos`, `/privacy`, `/support` | all **200** |
| `/api/public/fire-pick` | serving, record 199-85 |
| POST `/api/checkout` weekly | real `cs_live_...` |

**Deliberately NOT changed, with reasons:**
- **`/api/subscribe`** has **no caller anywhere in the codebase**. Gating or
  deleting an endpoint with possible external callers risks breaking a live
  marketing form for a low-severity exposure. Still open, still documented.
- **The service-key-falls-back-to-anon-key pattern spans 23 files** and never
  triggers while the key is set. Churning all 23 carries more crash risk than
  the theoretical exposure it removes.
- **`NEXT_PUBLIC_ADMIN_EMAILS_EXTRA`** stays; the `/admin` gate runs in the
  browser and other admin emails were already hardcoded in that bundle.

**Operational consequence:** `/api/cron/refresh-odds` now needs the secret. That
matters for the college football task (§41), where the odds cache must be
refreshed manually because `vercel.json` is `{"crons": []}`.

**Also noticed:** `cron/auto-picks` filters `US_SPORTS.filter(s => !s.key.includes('football'))`,
so adding NCAAF and NFL will **not** cause auto-picks to generate football picks.
