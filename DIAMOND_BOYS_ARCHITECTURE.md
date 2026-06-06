# TriplePlayz - Sports Advisory — Complete Platform Architecture

> **Version**: May 2026 | **Stack**: Next.js 15 + TypeScript + Supabase + Stripe + Authorize.net + Gemini AI
> **Domain**: [tripleplayz.com](https://tripleplayz.com) / [diamondboysadvisory.com](https://www.diamondboysadvisory.com)
> **Hosting**: Vercel (web app + cron) · Render (Discord bot)
> **Scale**: 27 pages · 49 API routes · 38 components · 12 lib modules · 19 DB migrations

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Tech Stack](#tech-stack)
3. [Subscription & Monetization](#subscription--monetization)
4. [The Alternation Break Algorithm](#the-alternation-break-algorithm)
5. [The Stat Engine](#the-stat-engine)
6. [The Pick Engine](#the-pick-engine)
7. [AI Engine (TriplePlayz' Algorithm)](#ai-engine-tripleplayz-algorithm)
8. [Data Sources & APIs](#data-sources--apis)
9. [Pages & Layouts](#pages--layouts)
10. [Component Library](#component-library)
11. [API Routes](#api-routes)
12. [Admin Panel](#admin-panel)
13. [Community System (The TriplePlayz Lounge)](#community-system-the-tripleplayz-lounge)
14. [The Pattern System Masterclass (Course)](#the-pattern-system-masterclass-course)
15. [Affiliate System](#affiliate-system)
16. [Discord Bot (Diamond 💎)](#discord-bot-diamond-)
17. [Landing Page & Marketing](#landing-page--marketing)
18. [Authentication & Security](#authentication--security)
19. [Database Schema](#database-schema)
20. [PWA & Mobile](#pwa--mobile)
21. [Cron Jobs & Automation](#cron-jobs--automation)
22. [Deployment & Configuration](#deployment--configuration)
23. [Environment Variables](#environment-variables)
24. [File Structure](#file-structure)
25. [Open Items / Next Think-Tank](#open-items--next-think-tank)

---

## Platform Overview

TriplePlayz - Sports Advisory is a **premium MLB sports picks and analysis platform**. Members subscribe to receive:
- Daily AI-powered game analysis
- Expert picks with the proprietary W/L Alternation Break algorithm
- ELO-based statistical edge detection with Kelly Criterion bet sizing
- Automated consensus picks across multiple bookmakers
- Access to the TriplePlayz Lounge community
- Real-time odds, scores, and live ticker
- The Pattern System Masterclass educational course

The platform positions itself as data-driven and algorithmic — never mentions "Gemini" or "AI" publicly. All analysis is branded as **"TriplePlayz' Algorithm."**

---

## Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Framework** | Next.js 15.1.6 (App Router) | React 19.2.3, 4 server + 23 client components |
| **Language** | TypeScript (strict) | `noUncheckedIndexedAccess`, no `any` types |
| **Styling** | Vanilla CSS + Tailwind CSS v4 | Dark theme (#040810 base), glassmorphism, per-section CSS |
| **Database** | Supabase (PostgreSQL) | Auth, RLS, Storage, Realtime, 19 migrations |
| **Subscriptions** | Stripe v20.4.0 | 4-tier subscriptions, webhooks, customer portal |
| **Course Payments** | Authorize.net (Accept.js) | One-time course purchase ($24.97), tokenized client-side |
| **Email** | Mailchimp | Newsletter signup with tags |
| **AI** | Google Gemini 2.5 Flash (`@google/genai`) | Game analysis, pick reasoning, bot chat |
| **Charts** | Recharts | Bankroll tracking area chart |
| **Animations** | Framer Motion v12.34.3 | Used in 22 of 38 components |
| **Icons** | Lucide React v0.575.0 | Used in 30+ components |
| **Effects** | react-confetti v6.4.0 | Success page celebration |
| **Tables** | TanStack React Table v8.21.3 | Admin data tables |
| **Analytics** | Google Analytics 4 | Custom `trackEvent()` helper |
| **Bot** | discord.js (separate Node process) | `bot/tripleplayz-bot.ts` |
| **Deployment** | Vercel (web) + Render (bot) | Vercel cron jobs for automation |

---

## Subscription & Monetization

### Tier Structure (`src/lib/tiers.ts`)

| Tier | Price | Billing | Stripe Price ID | Level |
|---|---|---|---|---|
| **Daily Pass** | $24.99 | One-time | Hardcoded `price_1TEr5UD7hIjQfa8atrgwi3kL` | 1 |
| **Weekly** | $74.99 | Subscription | `STRIPE_PRICE_WEEKLY` env var | 2 |
| **Monthly** _(Most Popular)_ | $229.99 | Subscription | `STRIPE_PRICE_MONTHLY` env var | 3 |
| **Season Pass** _(Best Value)_ | $699 | 6-month subscription | `STRIPE_PRICE_SEASON` env var | 4 |

### Access Levels (`TIER_LEVELS`)
```
free: 0 → daily: 1 → weekly: 2 → monthly: 3 → season: 4
```
Higher number = more access. Tier gating uses this numeric hierarchy. New users automatically get a 7-day trial via the `handle_new_user()` database trigger.

### Features by Tier
- **Free**: Community chat, Magic Ticker (live odds feed), periodic free analysis posts
- **Daily Pass**: All daily MLB analysis for one day, game-day alerts, real-time odds
- **Weekly**: Everything Daily + TriplePlayz Lounge access, weekly reports
- **Monthly**: Everything Weekly + priority alerts, VIP channels, expert chat, parlay picks, monthly reports
- **Season Pass**: Everything Monthly + full season, World Series picks, Diamond badge, NFL early access, strategy sessions

### Payment Flow
1. User clicks pricing → `/pricing` page
2. Selects plan → redirected to `/checkout` page
3. Checkout creates Stripe session via `POST /api/checkout` (includes `referralCode` for affiliates)
4. Stripe Checkout session created with tier metadata
5. Stripe webhook (`/api/stripe/webhook`) processes:
   - `checkout.session.completed` → provision access in `user_profiles`
   - `customer.subscription.updated/deleted` → manage access
   - Payment failures → log and handle
6. Success redirect → `/success` page with confetti

### Stripe Configuration (`src/lib/stripe.ts`)
- Lazy-initialized with Proxy pattern (only connects on first use)
- API version: `2026-02-25.clover`
- Secret key from `STRIPE_SECRET_KEY` env var

### Tier Sync (`/api/user/sync-tier`)
- Heals missing `user_profiles` records
- Checks Stripe customer subscriptions to determine correct tier
- Called on dashboard load for consistency

---

## The Alternation Break Algorithm

> **File**: `src/app/api/admin/patterns/route.ts` (admin) / `src/app/api/patterns/route.ts` (public)
> **Core thesis**: Teams in strict W-L-W-L alternating patterns break by game 7.

### Historical Data (Last MLB Season)

| Break Point | Games | Frequency | Conditional Probability |
|---|---|---|---|
| Game 7 | 56 | 56/91 total | **62%** |
| Game 8 | 24 | 24/35 remaining | **69%** |
| Game 9 | 8 | 8/11 remaining | **73%** |
| Game 10 | 3 | 3/3 remaining | **100%** |

Out of **91 total patterns** that reached 6+ games of strict alternation last season, all broke by game 10.

### How It Works

1. **Streak counting**: Counts the current LIVE alternating streak from the team's most recent game backwards. Every consecutive game must flip (W→L→W→L).

2. **Classification**:
   - **TRUE Pattern** (🔥): 6+ strict alternating games → actionable
   - **DEVELOPING** (👀): 4-5 games → watch list, forming
   - **No pattern**: <4 games → noise

3. **Break probability** (the `altScore`):
   - Streak 4: 8%, Streak 5: 15%
   - Streak 6: **62%**, Streak 7: **69%**, Streak 8: **73%**, Streak 9+: **100%**

4. **Prediction** (only for TRUE patterns):
   - Always predicts **BREAK** — the last result doubles
   - Example: `LWLWLW` → predict `(W)` = `LWLWLW(W)`
   - Example: `WLWLWL` → predict `(L)` = `WLWLWL(L)`

### Visual System (`patterns.css`)
- **Streak dots glow** (green W / red L) with `streakPulse` animation
- **Non-streak dots dimmed** (30% opacity, 85% scale)
- **Streak divider** separates old games from live streak
- **Break-point indicator** — pulsing dot with `breakGlow` animation and "⚡BREAK" label
- **Connectors** between streak dots with colored lines
- Dots display **oldest → newest** (left to right) for natural pattern reading

### Data Source
- MLB Stats API (`statsapi.mlb.com/api/v1/schedule`)
- Fetches last 21 days of games (spring training + regular season)
- Dates formatted in Eastern time to match MLB official dates
- All 30 MLB teams hardcoded with IDs and divisions

---

## The Stat Engine

> **File**: `src/lib/stat-engine.ts` | **526 lines** | Zero external dependencies (pure math)

The core analytics engine implementing professional sports-betting mathematics:

### Algorithms

| Algorithm | Function | Description |
|---|---|---|
| **ELO Ratings** | `calculateELO()` | FiveThirtyEight method — Base 1500, adjusted by win%, momentum from last 10 games, K-factor 6 |
| **Log5 Win Probability** | `log5Probability()` | Bill James formula for head-to-head win probability |
| **Composite Probability** | `compositeProbability()` | Blends Log5 (35%), ELO (30%), home advantage (15%), pitching (20%) |
| **Implied Probability** | `impliedProbability()` | Converts American odds to probability |
| **Vig Removal** | `removeVig()` | Strips bookmaker overround from implied odds for true probability |
| **Kelly Criterion** | `kellyCriterion()` | Quarter-Kelly optimal bet sizing for safety |
| **Expected Value** | `expectedValue()` | EV per $100 wagered |
| **Pitcher Edge** | `pitcherEdgeFactor()` | ERA/WHIP-based pitching advantage factor |
| **Edge Analysis** | `analyzeEdge()` | Full pipeline: ELO → probabilities → compare to book → EV/Kelly → recommendation |

### Constants
```typescript
HOME_ADVANTAGE_MLB = 0.540  // Historical MLB home win rate
HOME_ELO_BOOST = 24         // ELO points added for home team
MIN_EDGE_THRESHOLD = 2%     // Minimum edge to recommend a bet
```

### Edge Analysis Pipeline
1. Calculate ELO ratings for both teams
2. Compute Log5 head-to-head probability
3. Blend into composite probability (Log5 35% + ELO 30% + home 15% + pitching 20%)
4. Compare composite probability to bookmaker implied probability (vig-removed)
5. Calculate expected value and Kelly criterion bet sizing
6. Compare moneyline vs run-line EV (60% historical RL cover rate)
7. Output: `EdgeReport` with recommendation, confidence, and risk assessment

### Exports
- Types: `TeamProfile`, `OddsInput`, `EdgeReport`
- Functions: `impliedProbability()`, `toDecimalOdds()`, `removeVig()`, `calculateELO()`, `log5Probability()`, `eloToWinProb()`, `compositeProbability()`, `kellyCriterion()`, `expectedValue()`, `pitcherEdgeFactor()`, `analyzeEdge()`

---

## The Pick Engine

> **File**: `src/lib/pick-engine.ts` | **208 lines**

Automated consensus analysis across multiple bookmakers for generating AI-driven picks:

### How It Works

1. **Collect** moneyline odds from ALL bookmakers for a given game
2. **Calculate consensus** — which direction the majority of books lean
3. **Detect value plays** — identify odds divergence ≥15 points between books
4. **Score edge** based on divergence magnitude, consensus strength, and implied probability
5. **Filter** — requires 3+ bookmakers and 55+ confidence score to recommend

### Exports
- `PickRecommendation` (interface)
- `analyzeConsensus(event)` — analyze a single game
- `analyzeAllGames(events)` — analyze all games, sorted by confidence descending

### Usage
Called by the `/api/cron/auto-picks` cron job to automatically generate daily picks using odds data from the Supabase `odds_cache`.

---

## AI Engine (TriplePlayz' Algorithm)

> **File**: `src/lib/gemini.ts` | **327 lines** | **Model**: Gemini 2.5 Flash

### Functions

#### 1. `analyzeGame(context)` — Full Game Analysis
Routes to one of two engines:
- **Engine 1: `analyzeGameStats()`** — ELO/odds-based statistical analysis using `EdgeReport` data from the stat engine. Outputs: MODEL VERDICT, ELO BREAKDOWN, PITCHER MATCHUP, ODDS VALUE, EV BREAKDOWN, RISK FACTORS.
- **Engine 2: `analyzeGamePattern()`** — W/L alternation pattern-focused analysis. References the proprietary alternation break system.

Takes: teams, odds (ML/spread/total), team stats (alt%, streak), pitcher stats (ERA, WHIP)
Returns structured analysis with:
  - **Edge Rating** (1-10)
  - **Recommended Pick** (team + type)
  - **Key Factors** (3 bullets)
  - **Alternation Insight**
  - **Risk Assessment** (Low/Medium/High)
  - **Bottom Line** (1-2 sentence recommendation)
- Personality: "sharp, confident, no hedging"

#### 2. `generatePickReason(pick)` — Quick Pick Justification
- 1-2 sentence sharp reason for a specific pick
- References alternation pattern if relevant
- Used when composing picks for posting

#### 3. `generateContent(prompt)` — General Content
- Generic prompt → response wrapper
- Used for miscellaneous content generation (e.g., podcast scripts)

#### 4. `chatWithGemini(systemPrompt, history, message)` — Bot Chat
- Maintains conversation history
- Builds full context: system prompt + conversation history + new message
- Used by the Discord bot for interactive chat

---

## Data Sources & APIs

### 1. MLB Stats API (`src/lib/mlb-stats.ts`) — **600 lines, largest lib file**
- **Base URL**: `https://statsapi.mlb.com/api/v1`
- **Auth**: None required (public API)
- **Rate limit**: Custom throttle — max 5 req/sec with queue (`MIN_GAP_MS = 200ms`)
- **Retry**: 3-attempt retry with delays
- **Cache**: In-memory with 1hr TTL
- **Features**:
  - `getMLBGames()` — Daily schedule with linescore, team, probable pitcher hydration
  - `getMLBTeamStats()` — Season hitting + pitching stats AND standings in parallel
  - `getMLBTeamGames()` — Team game history
  - `getMLBH2H()` — Head-to-head matchup data
  - `getPitcherStats()` — Season stats with fallback between regular/spring training
  - `getPitcherInfo()` — Pitcher biographical info
  - `getPitcherGameLog()` — Game-by-game log for rest days analysis
  - `getTeamRoster()` — Full team roster
  - `mapMLBGameToGame()` — Maps MLB API response to app's `Game` type. Handles all statuses (Final, Live, Postponed, Suspended, Delayed). Ghost game detection (0-0 finals = postponed).
  - `MLB_TO_APISPORTS` / `APISPORTS_TO_MLB` — Maps all 30 MLB team IDs for odds correlation
- **Logo source**: `https://www.mlbstatic.com/team-logos/{teamId}.svg`
- **Types**: Defined in `src/lib/api-sports-types.ts`

### 2. The Odds API (`src/lib/odds-api.ts`) — **322 lines, cron-driven architecture**
- **Base URL**: `https://api.the-odds-api.com/v4`
- **Auth**: API key (`ODDS_API_KEY`)
- **Architecture**: **Users NEVER hit the live Odds API.** A cron job (`/api/cron/refresh-odds`) refreshes data every 2-4 hours into a Supabase `odds_cache` table. All public functions read from cache only.
- **Sports supported**: MLB (⚾), NBA (🏀), NHL (🏒)
- **Markets**: h2h (moneyline), spreads, totals
- **Refresh functions** (cron-only):
  - `refreshSportOdds()` — Writes to Supabase cache
  - `refreshSportScores()` — Writes to Supabase cache
- **Read functions** (from cache):
  - `getActiveSports()` — List active sports
  - `getSportOdds()` — Odds with bookmaker data
  - `getSportScores()` — Live/recent scores
  - `getBestOdds()` — Find best price across books
  - `generateTickerItems()` — Create ticker feed items
- **Quota tracking**: Logs `x-requests-remaining` header
- **~6 API calls per cron run**

### 3. API-Sports (`src/lib/api-sports.ts`) — **Legacy, partially deprecated**
- Only `getOdds(gameId)` remains — all other data now comes from the free MLB Stats API
- In-memory cache with 1hr TTL
- 3-attempt retry with `x-apisports-key` header
- Uses `APISPORTS_KEY` env var

### 4. Supabase (`src/lib/supabase.ts`)
- Lazy-initialized with Proxy pattern (connects on first use)
- Client uses anon key (client-side safe)
- `odds-api.ts` creates its own client using the service key for server-side writes
- Used for: user auth, subscription data, community content, pick storage, odds cache, affiliates

### 5. Mailchimp (`/api/subscribe`)
- Newsletter signup with tags: `early-access`, `website-signup`, tier interest

---

## Pages & Layouts

### Layouts (3)

| Route | Type | Description |
|---|---|---|
| `/` (root) | Server | `AuthProvider` → `Analytics` → `LayoutShell` → `RefTracker`, dark mode, PWA manifest, SEO metadata |
| `/course` | Server | Minimal — strips navbar/footer for conversion-focused funnel |
| `/admin` | Client | Admin sidebar with 10 nav items, `useAdminAuth()` gating, loading spinner during auth |

### Public Pages (11)

| Route | Type | Size | Description |
|---|---|---|---|
| `/` | Server | — | Landing page — AuthRedirect, Hero, MagicTicker, StatsBar, Countdown, Features, FreeSignup, SocialProof, Testimonials, SocialProofToast |
| `/dashboard` | Client | **80KB, 1,366 lines** | Full auth flow (login/signup/OTP/magic link/reset) + KPIs, pick feed, bankroll chart, games board, paywall overlay |
| `/community` | Client | **130KB, 2,291 lines** | Discord-like chat — channels, real-time Supabase subscriptions, rich text, tier-gated access, nickname prompt |
| `/patterns` | Client | 553 lines | Public pattern system — all 30 MLB teams' W/L alternation streaks, search/sort/filter, tier-gated premium content |
| `/pricing` | Client | — | 4-tier pricing cards (Daily/Weekly/Monthly/Season) with feature lists, accent colors, CTAs |
| `/checkout` | Client | 325 lines | Collects name/email, creates Stripe session via `/api/checkout`, passes referral code |
| `/success` | Client | — | Post-payment confetti animation, links to community + dashboard |
| `/settings` | Client | 706 lines | Profile (nickname, avatar), password change, affiliate program dashboard (code, earnings, referrals) |
| `/privacy` | Server | — | Static privacy policy (GDPR, Stripe handling, last updated March 2026) |
| `/support` | Server | — | Contact info (support@tripleplayz.com), billing FAQ, response times |
| `/tos` | Server | — | Terms of service, ban policy, gambling disclaimer (last updated Feb 2026) |

### Course Pages (2, stripped layout — no navbar/footer)

| Route | Type | Description |
|---|---|---|
| `/course` | Client (475 lines) | Sales funnel for "Pattern System Masterclass" ($24.97) — 7 modules, testimonials, FAQ, Authorize.net PaymentForm |
| `/course/learn` | Client (359 lines) | Course viewer — 7 module navigation (Module1-Module7.tsx), access gating via `course_access` in Supabase, preview mode (key: `FIRE2025`) |

### Admin Pages (11, gated by email whitelist)

| Route | Description |
|---|---|
| `/admin` | Daily games view with date picker, team search, links to analysis |
| `/admin/analysis` | Analysis hub — game listing for analysis entry |
| `/admin/analysis/[gameId]` | **60KB, 1,100 lines** — 5 tabs: Streaks & Patterns, Pitching, Team Stats, Odds, AI Analysis |
| `/admin/patterns` | Alternating Pattern Master — all 30 teams visualization |
| `/admin/picks` | Quick Pick wizard with AI-generated reasoning |
| `/admin/fire-picks` | Fire Picks scheduler — CRUD for scheduled premium picks |
| `/admin/podcast` | Podcast content generator for NotebookLM |
| `/admin/logs` | Pick performance stats with CSV export |
| `/admin/users` | User CRM — roles, tiers, trial management |
| `/admin/moderation` | Report review, ban/warn workflows |
| `/admin/affiliates` | Affiliate management — codes, commissions, payout recording |

---

## Component Library

> **38 components total** (~242KB) | All use `'use client'` | Framer Motion in 22 | Lucide icons in 30+

### Global Components (14 files)

| Component | Size | Description |
|---|---|---|
| `AuthProvider.tsx` | 1.8KB | Supabase auth context — `user`, `session`, `loading`, `signOut` + `useAuth()` hook |
| `LayoutShell.tsx` | 1KB | Conditional layout — `/course` routes get clean funnel, others get Navbar + Footer + alerts |
| `Navbar.tsx` | **29KB** | Responsive nav — desktop links, live clock, mobile full-screen menu with staggered animations, first-visit hint arrow |
| `Footer.tsx` | 6.4KB | 4-column footer: brand, quick links, legal, contact. Gambling disclaimer, 21+ requirement |
| `MagicTicker.tsx` | 12KB | Multi-sport ticker (MLB/NBA/NHL), auto-refresh 90s, blurred odds as teaser |
| `PickAlertBanner.tsx` | 10KB | Polls `/api/public/pick-alerts` every 60s. "NEW PICK" + "PREMIUM HIT" alerts with progress bar |
| `PickDropToast.tsx` | 5KB | Polls `/api/dashboard/picks` every 2min, notifies on new pick drops |
| `PremiumRevealFeed.tsx` | **18KB** | Tabbed Results/Upcoming feed — blurred + locked for free users (delayed reveal as regret trigger) |
| `StreakCounter.tsx` | 7.5KB | W-L record, win%, "HOT STREAK" badge when 3+ consecutive wins |
| `NicknamePrompt.tsx` | 10KB | Modal for chat nickname — debounced availability check (400ms), 3-16 char validation |
| `IOSInstallPrompt.tsx` | 9.3KB | PWA install guide for iOS Safari — 7-day dismissal via localStorage |
| `RefTracker.tsx` | 2.2KB | Silent `?ref=CODE` capture → localStorage + 30-day cookie |
| `AuthRedirect.tsx` | 0.6KB | Redirects logged-in users from landing → `/dashboard` |
| `Analytics.tsx` | 1.2KB | Google Analytics 4 + `trackEvent()` helper |

### Landing Page Components (9 files in `components/landing/`)

| Component | Size | Description |
|---|---|---|
| `HeroSection.tsx` | **12KB** | Rotating blurred pick teasers (3.5s cycle), dual CTAs, embedded LiveGameTicker, event tracking |
| `LiveGameTicker.tsx` | 7.5KB | Infinite-scroll game cards by league, team logos, scores, status badges (LIVE/FINAL/time) |
| `StatsBar.tsx` | 4.6KB | Animated counters: 30+ Years Experience, 11+ Sportsbooks, 100% Documented, 5+ Models |
| `FeaturesSection.tsx` | 3.7KB | 6-feature grid with staggered scroll-in animations |
| `SocialProof.tsx` | 6.6KB | Expertise card + mock TriplePlayz Lounge chat preview |
| `SocialProofToast.tsx` | 6.6KB | Fake "[Name] joined [Plan]" toasts every 20-35s for non-authenticated users |
| `TestimonialsSection.tsx` | 4.4KB | 3-column testimonial cards with star ratings and membership dates |
| `CountdownTimer.tsx` | 8.3KB | Countdown to next pick drop (10 AM ET). Gradient border turns red at <2 hours |
| `FreeSignupSection.tsx` | 7.4KB | 4-perk grid + "Create Free Account — Takes 10 Seconds" CTA |

### Dashboard Components (14 files in `components/dashboard/`)

| Component | Size | Description |
|---|---|---|
| `BankrollChart.tsx` | 5.2KB | Recharts area chart — cumulative unit growth over time, toggle visibility |
| `GamesBoard.tsx` | 8KB | Sport filter pills (All/MLB/NBA/NHL), game tile grid, auto-refresh 5min, sort: live→value→time |
| `GameOddsCard.tsx` | 7.4KB | Game tile — teams, odds, scores, live indicator, "VALUE" badge when spread >30 |
| `FirePickCard.tsx` | 9.5KB | Premium pick card — countdown to drop, blurred for unpaid, "INCOMING" hype state |
| `PickCard.tsx` | 8.1KB | Pick card — sport badge, status pill (live/upcoming/won/lost/push), matchup, edge%, confidence meter, units badge |
| `MorningSlate.tsx` | 6.9KB | "Today's Slate" banner — pick count, sport breakdown, countdown to 10 AM ET drop, "Notify Me" button |
| `PickDropBanner.tsx` | 4.1KB | Animated pick drop announcement — green for paid, orange FOMO for free |
| `PaywallOverlay.tsx` | 2.8KB | Trial-aware paywall with lock icon and CTA (different messaging for active trial vs expired) |
| `KPICard.tsx` | 1.6KB | Animated stat card with icon, value, sub-label, trend |
| `TailTracker.tsx` | 4.8KB | "If You Tailed" calculator — select unit size ($10-$250), see week/season P&L |
| `ConfidenceMeter.tsx` | 0.8KB | Color-coded progress bar (green ≥85%, yellow ≥70%, orange <70%) |
| `UnitsBadge.tsx` | 0.9KB | 1-5 flame icons indicator + text label |
| `CommunityPulse.tsx` | 1.5KB | Sidebar CTA to join The TriplePlayz Lounge |
| `Tooltip.tsx` | 2KB | Hover/click tooltip with arrow positioning |

### Other Components

| Component | Size | Description |
|---|---|---|
| `course/PaymentForm.tsx` | 9.7KB | Authorize.net Accept.js — card number auto-formatting, tokenization, trust badges (SSL, PCI) |
| `pricing/PricingCards.tsx` | 5.6KB | 3-column tier cards from `tiers.ts`, analytics tracking, "Most Popular" glow effect |

### Key Patterns
- **Heavy polling**: Many components auto-refresh on 60s-5min intervals
- **localStorage**: Used extensively for state persistence (dismissals, hints, referral codes, seen alerts)
- **Paywall/FOMO pattern**: Multiple components implement blur + lock overlays for free users
- **Inline styles**: Most components use inline styles rather than Tailwind classes

---

## API Routes

### Admin APIs (20 routes, `/api/admin/*`)

| Route | Methods | Description |
|---|---|---|
| `/api/admin/games` | GET | Fetch MLB games for a given date with probable pitchers |
| `/api/admin/ai/analyze` | POST | AI-powered full game analysis via Gemini |
| `/api/admin/ai/reason` | POST | AI-generated pick reasoning |
| `/api/admin/discord/channels` | GET | List Discord channels (legacy) |
| `/api/admin/discord/post` | POST | Post to Discord (legacy) |
| `/api/admin/discord/setup` | GET, POST | Discord bot setup (legacy) |
| `/api/admin/fire-picks` | GET, POST, PATCH, DELETE | Full CRUD for fire pick scheduling |
| `/api/admin/fire-picks/delete` | POST | Alternative fire pick delete endpoint |
| `/api/admin/fix-picks` | GET | Data migration/fix utility |
| `/api/admin/h2h` | GET | Head-to-head matchup data |
| `/api/admin/moderation` | GET, POST | Reports listing + moderation actions (ban/warn/dismiss) |
| `/api/admin/odds/[gameId]` | GET | Odds for a specific game |
| `/api/admin/patterns` | GET | Alternation patterns for all 30 teams |
| `/api/admin/picks` | GET, POST | Pick listing + creation |
| `/api/admin/picks/[id]` | PATCH, DELETE | Individual pick update/delete |
| `/api/admin/pitchers/[id]` | GET | Pitcher stats, game log, rest days |
| `/api/admin/podcast/generate` | POST | Generate podcast content from picks |
| `/api/admin/teams/[id]/stats` | GET | Team season statistics |
| `/api/admin/users` | GET, PATCH | User listing + role/tier management |
| `/api/admin/affiliates` | GET, PUT, POST | Affiliate listing, settings update, payout recording |

### Dashboard APIs (3 routes)

| Route | Methods | Description |
|---|---|---|
| `/api/dashboard/games` | GET | Today's games across all sports (from odds cache) |
| `/api/dashboard/picks` | GET | Authenticated user's tier-gated picks |
| `/api/dashboard/stats` | GET | KPIs: record, winRate, ROI, bankroll chart data, sport breakdowns |

### Community APIs (5 routes)

| Route | Methods | Description |
|---|---|---|
| `/api/community/channels` | GET | Chat channels with categories and tier requirements |
| `/api/community/messages` | GET, POST | Message fetch + send |
| `/api/community/freebies` | GET | Free community pick reveals |
| `/api/community/game-detail` | GET | Game data for in-chat panels |
| `/api/community/team-schedule` | GET | Team schedule for chat search |

### Public APIs (6 routes)

| Route | Methods | Description |
|---|---|---|
| `/api/public/fire-pick` | GET | Current active fire pick for public display |
| `/api/public/odds` | GET | Public odds data |
| `/api/public/pick-alerts` | GET | Pick drop alert notifications for banner |
| `/api/public/pick-record` | GET | Overall pick record/stats for landing page |
| `/api/public/premium-feed` | GET | Premium pick results (blurred for non-subs) |
| `/api/public/ticker` | GET | Live game scores for ticker |

### Cron Jobs (4 routes, protected by `CRON_SECRET`)

| Route | Schedule | Description |
|---|---|---|
| `/api/cron/refresh-odds` | Every 3 hours (`0 */3 * * *`) | Refreshes odds + scores into Supabase `odds_cache` (~6 API calls/run) |
| `/api/cron/auto-picks` | Daily 2 PM UTC (`0 14 * * *`) | AI auto-pick via pick-engine consensus + odds data. Supports `dry_run=1` |
| `/api/cron/grade-picks` | Every 15 min (`*/15 * * * *`) | Auto-grades pending picks against completed scores (hit/miss/push) |
| `/api/cron/post-picks` | **DISABLED** | Legacy Discord posting — returns stub message |

### Payment & Subscription APIs (4 routes)

| Route | Methods | Description |
|---|---|---|
| `/api/checkout` | POST | Creates Stripe Checkout Session (tierId, name, email, referralCode) |
| `/api/stripe/webhook` | POST | Handles `checkout.session.completed` + subscription lifecycle → updates `user_profiles` |
| `/api/course/purchase` | POST | Authorize.net payment — tokenized card via Accept.js → `course_purchases` table |
| `/api/subscribe` | POST | Mailchimp email list with tags (early-access, website-signup, tier interest) |

### User APIs (4 routes)

| Route | Methods | Description |
|---|---|---|
| `/api/user/sync-tier` | POST | Syncs tier from Stripe, heals missing user profiles |
| `/api/nickname` | GET, POST | Nickname availability check + update (3-16 chars, alphanumeric + underscore, reserved word blocking) |
| `/api/notify-pick` | POST | Register for pick-drop email notifications (`pick_notifications` table) |
| `/api/affiliates` | GET, POST | User's own affiliate data + create affiliate account |

### Other APIs (3 routes)

| Route | Methods | Description |
|---|---|---|
| `/api/patterns` | GET | Public alternation patterns for all 30 MLB teams |
| `/api/games/public` | GET | Public game ticker — MLB (Stats API) + NBA/NHL (odds cache) |
| `/api/course/announcements` | GET, POST | Course announcements (admin key required for POST) |

---

## Admin Panel

> **Path**: `/admin/*` | **Auth**: Email whitelist (`support@tripleplayz.com`, `diamondboysadvisory@gmail.com`) + Supabase DB check (`user_profiles.is_admin` or `role = 'admin' | 'staff'`)

### Admin Sidebar (`admin/layout.tsx`)
- 10 navigation items across sections: Dashboard, Analysis Hub, Patterns, Pick Entry, Fire Picks, Podcast, Pick Logs, Users, Moderation, Affiliates
- Collapsible sidebar with mobile responsiveness
- 23,930 bytes of dedicated admin CSS (`admin.css`)

### Key Admin Pages

**Analysis Deep Dive** (`/admin/analysis/[gameId]`) — 1,100 lines, 5 tabs:
1. **Streaks & Patterns**: W/L alternation visualization, year filters, game log table, alt% stats
2. **Pitching**: Starter info (ERA, WHIP, K, W-L), rest days, last 5 starts, game log
3. **Team Stats**: Side-by-side comparison (Win%, Runs/G, Run Diff, etc.)
4. **Odds**: Multi-bookmaker odds display (moneyline, spread, totals)
5. **AI Analysis**: Full AI-powered game analysis via Gemini

**Users CRM** (`/admin/users`) — User listing with role management, tier assignment, trial settings

**Affiliate Management** (`/admin/affiliates`) — Summary cards, affiliate table, edit commission rates, pause/resume/revoke affiliates, record payouts

---

## Community System (The TriplePlayz Lounge)

> **Path**: `/community` | **Size**: 130KB, 2,291 lines (most complex page)

### Features
- Discord-like channel sidebar with categories and tier-gated access (`min_tier`)
- Real-time messaging via Supabase Realtime subscriptions
- Rich text formatting (bold, italic, code)
- Emoji reactions (JSONB storage)
- User roles with badges (admin/staff/member)
- Chat nickname system with availability checking
- Admin message deletion
- Read-only channels support

### CSS Files
- `community.css` — Main chat styles
- `game-panel.css` — In-chat game panels
- `team-search.css` — Team search feature

### Freemium Strategy
- **Free tier** users get:
  - Access to community chat (free-lobby channel)
  - The Magic Ticker (live odds feed)
  - Periodic free analysis posts (auto-posted, disappear after a few days)
- **Paid tier** users get:
  - All daily analysis
  - TriplePlayz Lounge VIP channels
  - Direct expert access
  - Pick alerts

### Community API Routes
| Route | Description |
|---|---|
| `/api/community/channels` | List channels with categories and tier requirements |
| `/api/community/messages` | GET: fetch messages. POST: send message |
| `/api/community/freebies` | Free pick reveals |
| `/api/community/game-detail` | Game data for in-chat panels |
| `/api/community/team-schedule` | Team schedule for search |

---

## The Pattern System Masterclass (Course)

> **Path**: `/course` + `/course/learn` | **Payment**: Authorize.net ($24.97 one-time)

### Sales Funnel (`/course`)
- Conversion-focused page with stripped layout (no navbar/footer)
- 7-module course outline with descriptions and tags
- Testimonials and FAQ sections
- Authorize.net `PaymentForm` component for card payment
- Trust badges: 256-bit SSL, PCI Compliant, Secure Checkout

### Course Viewer (`/course/learn`)
- 7 modules: `Module1.tsx` through `Module7.tsx`
- Access gating via `course_access` field in `user_profiles` (Supabase)
- Preview mode with secret key `FIRE2025`
- Module progress tracking and completion states

### Payment Flow
1. User fills card details on `/course` page
2. Accept.js tokenizes card client-side (never touches server)
3. Token sent to `POST /api/course/purchase`
4. Server processes payment via Authorize.net
5. Purchase recorded in `course_purchases` table
6. `course_access` field set on `user_profiles`
7. Course announcements via `/api/course/announcements`

---

## Affiliate System

### User-Facing (`/settings` page + `/api/affiliates`)
- Users can create an affiliate account with auto-generated personal code
- Code format: alphanumeric or `TP-XXXXXX`
- Referral tracking: `?ref=CODE` → captured by `RefTracker` component → stored in localStorage + 30-day cookie
- Passed to Stripe checkout via `referralCode` parameter
- View own referral stats and earnings

### Admin-Facing (`/admin/affiliates` + `/api/admin/affiliates`)
- Summary cards: total affiliates, active count, referrals, commission earned, paid, balance owed
- Affiliate table: email, code, commission rate, recurrence, referral count, earnings
- Actions: edit rate/recurrence, pause/resume/revoke affiliate, record payouts
- Payout modal: amount, method (PayPal/Venmo/CashApp/Zelle/Other), notes

### Database Tables
- `affiliates` — Codes, commission rates (default 15%)
- `referrals` — Stripe session/subscription IDs
- `affiliate_payouts` — Payout audit log

---

## Discord Bot (Diamond 💎)

> **Path**: `bot/` | **Runtime**: Separate Node.js process on Render | **Framework**: discord.js

### Files
- `bot/tripleplayz-bot.ts` — Main bot logic (8,112 bytes)
- `bot/system-prompt.ts` — Personality and rules (5,141 bytes)
- `bot/package.json` — Dependencies

### Standalone Bot Script (`scripts/discord-bot.js`)
- Auto-assigns "Pending" role on join
- DMs new members with 24h subscription warning
- Auto-kicks after 24h without valid subscription
- Daily Stripe ↔ Discord reconciliation

### Personality
- Confident, analytical, sharp baseball analyst with swagger
- Uses baseball terminology naturally
- Treats members like family
- Never gives specific betting amounts — only analysis
- Celebrates wins, handles losses with class

### Boundaries
- ❌ No politics, religion, personal drama, crypto, financials
- ❌ No specific dollar amounts or guarantees
- ❌ Never rude or dismissive
- ✅ References alternation pattern system
- ✅ Discusses pitching matchups, home/away splits, recent form

### Channel Configuration
- `BOT_CHANNELS_ALLOWLIST: string[]` — empty = respond in all channels
- Welcome message auto-sent to new members

---

## Landing Page & Marketing

> **Path**: `/` (root) | **Goal**: Convert visitors to subscribers

### Composition
The landing page is a Server Component that composes 10+ client sub-components:
1. `AuthRedirect` — Auto-redirect authenticated users to dashboard
2. `HeroSection` — Main hero with rotating pick teasers, CTAs
3. `MagicTicker` — Multi-sport live game ticker
4. `StatsBar` — Animated counter stats
5. `CountdownTimer` — Urgency timer to next pick drop
6. `FeaturesSection` — Feature grid
7. `FreeSignupSection` — Free tier signup CTA
8. `SocialProof` — Expertise + chat preview
9. `TestimonialsSection` — User testimonials
10. `SocialProofToast` — Fake "[Name] joined [Plan]" notifications
11. Final CTA section with "Create Free Account" and "Log In" buttons
12. Entertainment disclaimer (21+ responsible gambling)

### FOMO / Conversion Triggers
- **SocialProofToast**: Fake join notifications every 20-35s
- **PremiumRevealFeed**: Blurred premium content showing what free users miss
- **PickAlertBanner**: "PREMIUM HIT" alerts as regret triggers
- **CountdownTimer**: Gradient border turns red when <2 hours to next drop
- **FirePickCard**: Countdown timers on locked premium picks

### SEO Configuration (`layout.tsx`)
- **Title**: "TriplePlayz - Sports Advisory | Elite MLB Baseball Picks & Community"
- **Description**: Winning MLB picks, 65% win rate, TriplePlayz Lounge community
- **Keywords**: MLB picks, sports advisory, baseball analysis, sports betting
- **OpenGraph + Twitter cards** configured
- **Robots**: index, follow

---

## Authentication & Security

### Auth Provider (`src/components/AuthProvider.tsx`)
- Supabase Auth with session management
- Wraps entire app in auth context
- Provides `user`, `session`, `loading`, `signOut`
- Listens for auth state changes

### Dashboard Auth (`/dashboard`)
- Full auth flow: email/password login, signup, OTP verification, magic links, password reset
- All handled within the dashboard page itself (1,366 lines)

### Admin Auth (`src/lib/adminAuth.ts`)
- **Email whitelist**: `support@tripleplayz.com`, `diamondboysadvisory@gmail.com` (fast path)
- **DB fallback**: Checks `user_profiles.is_admin` or `role = 'admin' | 'staff'`
- `useAdminAuth()` hook — client-side check
- `isAdminEmail()` — server-side check
- Non-admin users see admin pages but can't access data

### Security Rules
- All Supabase tables use Row Level Security (RLS)
- Stripe webhook signature verification
- Cron jobs protected by `CRON_SECRET` env var
- API keys stored in environment variables only
- No sensitive data in client-side code
- Reserved word blocking on nicknames

---

## Database Schema

> **19 migrations in `supabase/migrations/`**

### Tables

| Table | Purpose |
|---|---|
| `user_profiles` | User data — subscription_tier, stripe_customer_id, is_admin, role, email, trial_end, course_purchaser, display_name, avatar_color, course_access |
| `picks` | Sports picks — result, confidence, units, odds, edge, sport, status, score |
| `fire_picks` | Premium scheduled picks — pattern_data, pattern_break_game, scheduled reveal |
| `community_channels` | Chat channels — tier gating (min_tier), categories, welcome messages |
| `community_messages` | Chat messages — RLS, reactions (JSONB), user_role badges, Realtime enabled |
| `odds_cache` | Persistent Odds API cache — cache_key → JSONB data |
| `affiliates` | Affiliate system — codes, commission rates (default 15%) |
| `referrals` | Referral tracking — Stripe session/subscription IDs |
| `affiliate_payouts` | Payout audit log — amount, method, notes |
| `course_announcements` | Course system announcements |
| `course_purchases` | Course payment records (Authorize.net) |
| `pick_notifications` | Pick-drop email notification preferences |

### Key Database Features
- **Auto user profile creation** via `handle_new_user()` trigger on `auth.users` INSERT — sets display_name, random avatar color, `free` tier, 7-day trial
- **Tier-level function** `tier_level(tier)` maps tier strings to integers (free=0, starter/daily=1, pro/weekly=2, elite/monthly=3, season=4)
- **Comprehensive RLS** on all tables — user isolation, admin overrides, service role policies
- **Realtime** enabled on `community_messages` for live chat
- **User roles** — admin/staff/member with chat badges and emoji reactions
- **Freemium model** — `free` tier, `free-lobby` channel, frontend handles content gating

---

## PWA & Mobile

### Progressive Web App
- `manifest.json` — PWA manifest, app name "TriplePlayz - Sports Advisory", standalone mode
- Theme color: `#00e59b` on background `#040810`
- Apple-specific meta tags for iOS:
  - `apple-mobile-web-app-capable: yes`
  - `apple-mobile-web-app-status-bar-style: black-translucent`
  - `apple-mobile-web-app-title: TriplePlayz`
- `IOSInstallPrompt.tsx` — Visual 3-step guide for iOS users to install as PWA, 7-day dismissal

### Mobile Responsiveness
- All pages designed mobile-first
- Admin panel has dedicated mobile CSS with sidebar collapse
- Navbar has full-screen mobile menu with staggered animations
- Patterns page has 3 breakpoints: desktop, 768px, 480px

### SEO
- `robots.txt` — Allows all, disallows `/api/` and `/dashboard/`
- `sitemap.xml` — 4 pages: `/`, `/pricing`, `/tos`, `/dashboard`

---

## Cron Jobs & Automation

### Configured in `vercel.json`

| Job | Schedule | Route | Description |
|---|---|---|---|
| **Refresh Odds** | Every 3 hours | `/api/cron/refresh-odds` | Refreshes odds + scores from live Odds API into Supabase `odds_cache`. ~6 API calls per run. Covers MLB, NBA, NHL. |
| **Auto Picks** | Daily 2 PM UTC | `/api/cron/auto-picks` | Uses `pick-engine.ts` consensus analysis + odds data to auto-generate daily picks. Supports `dry_run=1` for testing. |
| **Grade Picks** | Every 15 min | `/api/cron/grade-picks` | Compares pending picks against completed game scores. Marks as hit/miss/push. |
| **Post Picks** | DISABLED | `/api/cron/post-picks` | Legacy Discord posting — returns stub message |

### Authentication
All cron endpoints are protected by a `CRON_SECRET` env var that must be passed as a query parameter or header.

---

## Deployment & Configuration

### Vercel — Web App + Cron Jobs (Primary)
- `vercel.json` — 3 cron jobs configured (refresh-odds, auto-picks, grade-picks)
- Custom headers for cache control and security
- Auto-deploy from repository

### Render — Discord Bot Only
- `render.yaml` — Worker service named `diamond-boys-bot`
- Build: `cd bot && npm install && npm run build`
- Start: `cd bot && npm start`
- Env vars: `DISCORD_BOT_TOKEN`, `GEMINI_API_KEY`

### Configuration Files
- `next.config.ts` — Empty (no custom configuration)
- `eslint.config.mjs` — Flat config, extends `eslint-config-next/core-web-vitals` + TypeScript
- `postcss.config.mjs` — Uses `@tailwindcss/postcss` plugin (Tailwind CSS v4)
- `tsconfig.json` — Target ES2017, strict mode, path alias `@/*` → `./src/*`

---

## Environment Variables

| Variable | Service | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Project URL (client-safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Anon/public key (client-safe) |
| `SUPABASE_SERVICE_KEY` | Supabase | Service role key (server-only, for cache writes) |
| `STRIPE_SECRET_KEY` | Stripe | Server-side payments |
| `STRIPE_PRICE_WEEKLY` | Stripe | Weekly plan price ID |
| `STRIPE_PRICE_MONTHLY` | Stripe | Monthly plan price ID |
| `STRIPE_PRICE_SEASON` | Stripe | Season pass price ID |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Webhook verification |
| `GEMINI_API_KEY` | Google AI | Gemini 2.5 Flash |
| `ODDS_API_KEY` | The Odds API | Live odds data |
| `APISPORTS_KEY` | API-Sports | Legacy odds (partially deprecated) |
| `DISCORD_BOT_TOKEN` | Discord | Bot token (Render) |
| `DISCORD_GUILD_ID` | Discord | Server ID |
| `DISCORD_MOD_LOG_CHANNEL_ID` | Discord | Moderation log channel |
| `DISCORD_PENDING_ROLE_ID` | Discord | Pending member role |
| `CRON_SECRET` | Vercel | Cron job authentication |

---

## File Structure

```
diamond-boys-advisory/
├── bot/                          # Discord bot (separate Node.js process, deployed on Render)
│   ├── tripleplayz-bot.ts            # Main bot logic
│   ├── system-prompt.ts          # Diamond 💎 personality
│   └── package.json
├── public/                       # Static assets
│   ├── logo.png                  # App logo (2.4MB)
│   ├── baseball-hero.png         # Hero image (757KB)
│   ├── baseball-pitcher.png      # Pitcher image (650KB)
│   ├── manifest.json             # PWA manifest
│   ├── robots.txt                # SEO robots
│   └── sitemap.xml               # SEO sitemap
├── scripts/                      # Operational scripts (8 files)
│   ├── discord-bot.js            # Standalone Discord bot with auto-kick
│   ├── check-picks.ts            # Debug: pending vs graded picks
│   ├── fix_db_emails.ts          # Data fix: backfill emails
│   ├── fix_picks.js              # Data fix: game_date corrections
│   └── ...                       # Various debug/fix utilities
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout (auth, analytics, PWA, SEO)
│   │   ├── page.tsx              # Landing page (server component)
│   │   ├── globals.css           # Global styles + design system
│   │   ├── admin/                # Admin panel (11 pages)
│   │   │   ├── layout.tsx        # Admin sidebar layout (client)
│   │   │   ├── admin.css         # Admin-specific styles (24KB)
│   │   │   ├── page.tsx          # Dashboard — daily games
│   │   │   ├── analysis/         # Analysis Hub + [gameId] deep dive
│   │   │   ├── patterns/         # Alternating Pattern Master
│   │   │   ├── picks/            # Quick Pick wizard
│   │   │   ├── fire-picks/       # Fire Pick scheduler
│   │   │   ├── podcast/          # Podcast content generator
│   │   │   ├── logs/             # Pick performance logs
│   │   │   ├── users/            # User CRM
│   │   │   ├── moderation/       # Content moderation
│   │   │   └── affiliates/       # Affiliate management
│   │   ├── community/            # The TriplePlayz Lounge (130KB)
│   │   ├── course/               # Pattern System Masterclass
│   │   │   ├── layout.tsx        # Stripped layout (no navbar)
│   │   │   ├── page.tsx          # Sales funnel
│   │   │   └── learn/            # Course viewer + modules
│   │   ├── dashboard/            # User dashboard (80KB)
│   │   ├── patterns/             # Public pattern system
│   │   ├── pricing/              # Pricing page
│   │   ├── checkout/             # Stripe checkout
│   │   ├── success/              # Post-payment success
│   │   ├── settings/             # User settings + affiliate dashboard
│   │   ├── privacy/              # Privacy policy
│   │   ├── support/              # Support page
│   │   ├── tos/                  # Terms of service
│   │   └── api/                  # 49 API routes
│   │       ├── admin/            # Admin APIs (20 routes)
│   │       ├── dashboard/        # Dashboard APIs (3 routes)
│   │       ├── community/        # Community APIs (5 routes)
│   │       ├── public/           # Public APIs (6 routes)
│   │       ├── cron/             # Cron jobs (4 routes)
│   │       ├── checkout/         # Stripe checkout session
│   │       ├── stripe/webhook/   # Stripe webhook handler
│   │       ├── course/           # Course purchase + announcements
│   │       ├── subscribe/        # Mailchimp subscription
│   │       ├── user/             # User sync-tier
│   │       ├── nickname/         # Nickname management
│   │       ├── notify-pick/      # Pick notifications
│   │       ├── affiliates/       # User affiliate management
│   │       ├── patterns/         # Public patterns
│   │       └── games/public/     # Public game ticker
│   ├── components/               # 38 components (~242KB)
│   │   ├── AuthProvider.tsx      # Supabase auth context
│   │   ├── LayoutShell.tsx       # Conditional layout wrapper
│   │   ├── Navbar.tsx            # Main navigation (29KB)
│   │   ├── Footer.tsx            # Site footer
│   │   ├── MagicTicker.tsx       # Live odds ticker
│   │   ├── PickAlertBanner.tsx   # Pick notification popup
│   │   ├── PickDropToast.tsx     # Pick drop toast
│   │   ├── PremiumRevealFeed.tsx # Premium content with paywall (18KB)
│   │   ├── StreakCounter.tsx     # Win streak display
│   │   ├── NicknamePrompt.tsx    # Chat nickname modal
│   │   ├── IOSInstallPrompt.tsx  # PWA install guide
│   │   ├── RefTracker.tsx        # Referral code capture
│   │   ├── AuthRedirect.tsx      # Auth redirect
│   │   ├── Analytics.tsx         # GA4 tracking
│   │   ├── landing/              # Landing page sections (9 files)
│   │   ├── dashboard/            # Dashboard components (14 files)
│   │   ├── course/               # Course payment form
│   │   └── pricing/              # Pricing cards
│   └── lib/                      # 12 library modules
│       ├── supabase.ts           # Supabase lazy Proxy client
│       ├── stripe.ts             # Stripe lazy Proxy client
│       ├── gemini.ts             # Gemini AI (4 functions, 327 lines)
│       ├── mlb-stats.ts          # MLB Stats API (600 lines, largest lib)
│       ├── odds-api.ts           # Odds API v4 cron-cached (322 lines)
│       ├── stat-engine.ts        # ELO/Kelly/EV analytics (526 lines)
│       ├── pick-engine.ts        # Consensus engine (208 lines)
│       ├── tiers.ts              # Subscription tier definitions
│       ├── adminAuth.ts          # Admin email whitelist + DB check
│       ├── api-sports-types.ts   # Shared TypeScript types
│       ├── api-sports.ts         # Legacy API-Sports (only getOdds remains)
│       └── discord.ts            # Discord stubs (kept for webhook compat)
├── supabase/
│   └── migrations/               # 19 database schema migrations
├── render.yaml                   # Render config (Discord bot only)
├── vercel.json                   # Vercel config (web app + 3 cron jobs)
├── package.json
└── tsconfig.json
```

---

## Open Items / Next Think-Tank

### 🟡 Active Decisions Needed
- **Additional sports** — NFL early access is marketed in Season Pass tier but not implemented yet
- **Push notifications** — PWA push for pick alerts? Capacitor native app?
- **Community freebies cadence** — how often should free analysis appear? How long before it disappears?

### 🔵 Feature Ideas
- **Leaderboard** — track pick performance over time, show win/loss record publicly
- **Parlay builder** — combine multiple picks into parlays with auto-calculated odds
- **Line movement alerts** — notify when odds shift significantly
- **Social sharing cards** — shareable pick result images for Twitter/Instagram
- **Backtesting engine** — run the alternation algorithm against historical seasons
- **Public results page** — transparent win rate tracker to build trust

### 🟢 Technical Improvements
- **Redis caching** instead of in-memory for MLB Stats API (for multi-instance deployments)
- **Webhook retry queue** for failed Stripe webhooks
- **Automated testing** — unit tests for alternation algorithm, stat engine, pick engine
- **Database indexes** on frequently queried columns
- **Image optimization** — logo.png is 2.4MB, should be compressed
- **next.config.ts** — currently empty, should configure image domains at minimum
- **Consolidate utility scripts** — move root-level `.mjs` files into `scripts/` or remove
- **API rate limiting** middleware on public endpoints

### 🔴 Known Technical Debt
- `api-sports.ts` — Only `getOdds()` remains; rest superseded by `mlb-stats.ts`. Candidate for removal.
- `discord.ts` — Stubs kept only for Stripe webhook import compatibility
- Discord admin API routes (`/api/admin/discord/*`) — Legacy, community replaced Discord
- Root-level utility scripts — ~15 one-off `.mjs` files (operational debris)
- Mixed styling approach — Tailwind v4 installed but most components use inline CSS
- No automated tests — Core IP (alternation algorithm, stat engine) is untested
- `sitemap.xml` references `diamondboyssports.com` — may be stale domain
