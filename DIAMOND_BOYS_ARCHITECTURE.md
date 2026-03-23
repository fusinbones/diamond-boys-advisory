# TriplePlayz - Sports Advisory — Complete Platform Architecture

> **Version**: March 2026 | **Stack**: Next.js 15 + TypeScript + Supabase + Stripe + Gemini AI
> **Domain**: [diamondboysadvisory.com](https://www.diamondboysadvisory.com)

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Tech Stack](#tech-stack)
3. [Subscription & Monetization](#subscription--monetization)
4. [The Alternation Break Algorithm](#the-alternation-break-algorithm)
5. [AI Engine (TriplePlayz' Algorithm)](#ai-engine-diamond-boys-algorithm)
6. [Data Sources & APIs](#data-sources--apis)
7. [Admin Panel](#admin-panel)
8. [Community System (The TriplePlayz Lounge)](#community-system-the-diamond-lounge)
9. [Discord Bot (Diamond 💎)](#discord-bot-diamond-)
10. [Landing Page & Marketing](#landing-page--marketing)
11. [Authentication & Security](#authentication--security)
12. [PWA & Mobile](#pwa--mobile)
13. [Cron Jobs & Automation](#cron-jobs--automation)
14. [Environment Variables](#environment-variables)
15. [File Structure](#file-structure)
16. [Open Items / Next Think-Tank](#open-items--next-think-tank)

---

## Platform Overview

TriplePlayz - Sports Advisory is a **premium MLB sports picks and analysis platform**. Members subscribe to receive:
- Daily AI-powered game analysis
- Expert picks with the proprietary W/L Alternation Break algorithm
- Access to the TriplePlayz Lounge community
- Real-time odds, scores, and live ticker

The platform positions itself as data-driven and algorithmic — never mentions "Gemini" or "AI" publicly. All analysis is branded as **"TriplePlayz' Algorithm."**

---

## Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Server components + API routes |
| **Language** | TypeScript (strict) | No `any` types policy |
| **Styling** | Vanilla CSS + globals.css | Dark theme (#040810 base), glassmorphism |
| **Database** | Supabase (PostgreSQL) | Auth, storage, RLS, migrations |
| **Payments** | Stripe | Subscriptions, webhooks, customer portal |
| **AI** | Google Gemini 2.5 Flash | Game analysis, pick reasoning, bot chat |
| **Hosting** | Render (render.yaml) | Server-side rendering |
| **Bot** | discord.js (separate Node process) | `bot/tripleplayz-bot.ts` |
| **Analytics** | Custom Analytics component | `src/components/Analytics.tsx` |

---

## Subscription & Monetization

### Tier Structure (`src/lib/tiers.ts`)

| Tier | Price | Billing | Trial | Stripe Price ID |
|---|---|---|---|---|
| **Weekly** | $29.99 | Weekly | 7 days free | `STRIPE_PRICE_WEEKLY` |
| **Monthly** | $79.99 | Monthly | — | `STRIPE_PRICE_MONTHLY` |
| **Season Pass** | $199 | One-time (full season) | — | `STRIPE_PRICE_SEASON` |

### Access Levels (`TIER_LEVELS`)
```
free: 0 → weekly: 1 → monthly: 2 → season: 3
```
Higher number = more access. Tier gating uses this numeric hierarchy.

### Features by Tier
- **Weekly**: All daily MLB analysis, TriplePlayz Lounge access, game-day alerts, real-time odds, weekly reports
- **Monthly**: Everything Weekly + priority alerts, VIP channels, expert chat, parlay picks, monthly reports
- **Season Pass**: Everything Monthly + full season, World Series picks, Diamond badge, NFL early access, strategy sessions

### Payment Flow
1. User clicks pricing → `/checkout` page
2. Stripe Checkout session created via `/api/checkout`
3. Stripe webhook (`/api/stripe/webhook`) processes:
   - `checkout.session.completed` → provision access
   - `customer.subscription.updated/deleted` → manage access
   - Payment failures → log and handle
4. Success redirect → `/success` page

### Stripe Configuration (`src/lib/stripe.ts`)
- Lazy-initialized with Proxy pattern (only connects on first use)
- API version: `2026-02-25.clover`
- Secret key from `STRIPE_SECRET_KEY` env var

---

## The Alternation Break Algorithm

> **File**: `src/app/api/admin/patterns/route.ts`
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

## AI Engine (TriplePlayz' Algorithm)

> **File**: `src/lib/gemini.ts` | **Model**: Gemini 2.5 Flash

### Functions

#### 1. `analyzeGame(context)` — Full Game Analysis
- Takes: teams, odds (ML/spread/total), team stats (alt%, streak), pitcher stats (ERA, WHIP)
- Returns: structured analysis with:
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
- Used for miscellaneous content generation

#### 4. `chatWithGemini(systemPrompt, history, message)` — Bot Chat
- Maintains conversation history
- Builds full context: system prompt + conversation history + new message
- Used by the Discord bot for interactive chat

---

## Data Sources & APIs

### 1. MLB Stats API (`src/lib/mlb-stats.ts`)
- **Base URL**: `https://statsapi.mlb.com/api/v1`
- **Auth**: None required (public API)
- **Rate limit**: Custom throttle — max 5 req/sec with queue (`MIN_GAP_MS = 200ms`)
- **Features**:
  - Team schedules and scores
  - Probable pitchers (name, ERA, WHIP, record)
  - Team stats and standings
  - Head-to-head matchup data
  - Alternation pattern analysis (W/L sequence extraction)
- **Logo source**: `https://www.mlbstatic.com/team-logos/{teamId}.svg`
- **Types**: Defined in `src/lib/api-sports-types.ts` (Game, GameTeam, GameScore, TeamStats, MLBPitcherStats, etc.)

### 2. The Odds API (`src/lib/odds-api.ts`)
- **Base URL**: `https://api.the-odds-api.com/v4`
- **Auth**: API key (`ODDS_API_KEY`)
- **Sports supported**: MLB, NBA, NFL, NHL
- **Markets**: h2h (moneyline), spreads, totals
- **Caching**: In-memory with TTLs:
  - Sports list: 1 hour
  - Odds: 5 minutes
  - Scores: 2 minutes
- **Features**:
  - `getActiveSports()` — list active sports
  - `getSportOdds()` — odds with bookmaker data
  - `getSportScores()` — live/recent scores
  - `getBestOdds()` — find best price across books
  - `generateTickerItems()` — create ticker feed items
- **Quota tracking**: Logs `x-requests-remaining` header

### 3. Supabase (`src/lib/supabase.ts`)
- Lazy-initialized with Proxy pattern
- Used for: user auth, subscription data, community content, pick storage
- Migrations in `supabase/migrations/`

---

## Admin Panel

> **Path**: `/admin/*` | **Auth**: Email whitelist (`diamondboysadvisory@gmail.com`)

### Admin Pages

| Page | Path | Description |
|---|---|---|
| **Dashboard** | `/admin` | Overview with key metrics (14,564 bytes — comprehensive) |
| **Analysis Hub** | `/admin/analysis` | AI-powered game analysis with odds + stats |
| **Analysis Detail** | `/admin/analysis/[gameId]` | Deep dive into specific game |
| **Patterns** | `/admin/patterns` | Alternating Pattern Master — all 30 teams |
| **Pick Entry** | `/admin/picks` | Compose and submit picks |
| **Pick Logs** | `/admin/logs` | History of posted picks |

### Admin API Routes

| Route | Description |
|---|---|
| `/api/admin/games` | Fetch today's MLB games |
| `/api/admin/ai/reason` | Generate AI pick reasoning |
| `/api/admin/discord/*` | Discord channel management, post picks |
| `/api/admin/h2h` | Head-to-head matchup data |
| `/api/admin/odds/[gameId]` | Odds for specific game |
| `/api/admin/patterns` | Alternation pattern analysis for all teams |
| `/api/admin/picks` | CRUD for picks |
| `/api/admin/picks/[id]` | Individual pick management |
| `/api/admin/pitchers/[id]` | Pitcher stats lookup |
| `/api/admin/teams/[id]/stats` | Team statistics |

### Admin Sidebar (`admin/layout.tsx`)
- Sections: **ANALYSIS** (Dashboard, Analysis Hub, Patterns, Pick Entry, Pick Logs)
- Collapsible sidebar with mobile responsiveness
- 23,930 bytes of dedicated admin CSS (`admin.css`)

---

## Community System (The TriplePlayz Lounge)

> **Path**: `/community` | **Replaced Discord** as the primary community platform

### Community API Routes

| Route | Description |
|---|---|
| `/api/community/channels` | Channel CRUD |
| `/api/community/messages` | Message posting and retrieval |
| `/api/community/freebies` | Free analysis posts (time-limited visibility) |
| `/api/community/game-detail` | Game detail cards for in-chat analysis |
| `/api/community/team-schedule` | Team schedule data for community |

### Freemium Strategy
- **Free tier** users get:
  - Access to community chat
  - The Magic Ticker (live odds feed)
  - Periodic free analysis posts from the algorithm (auto-posted, disappear after a few days)
- **Paid tier** users get:
  - All daily analysis
  - TriplePlayz Lounge VIP channels
  - Direct expert access
  - Pick alerts

---

## Discord Bot (Diamond 💎)

> **Path**: `bot/` | **Runtime**: Separate Node.js process | **Framework**: discord.js

### Files
- `bot/tripleplayz-bot.ts` — Main bot logic (8,112 bytes)
- `bot/system-prompt.ts` — Personality and rules (5,141 bytes)
- `bot/package.json` — Dependencies

### Personality
- Confident, analytical, sharp baseball analyst with swagger
- Uses baseball terminology naturally
- Treats members like family
- Never gives specific betting amounts — only analysis
- Celebrates wins, handles losses with class
- Redirects off-topic conversations smoothly

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

### Landing Page Components (`src/components/landing/`)

| Component | Description |
|---|---|
| `HeroSection.tsx` | Main hero with headline, CTAs, and value proposition (10,676 bytes) |
| `LiveGameTicker.tsx` | Real-time odds ticker from The Odds API (7,189 bytes) |
| `StatsBar.tsx` | Key metrics display (win rate, members, etc.) |
| `FeaturesSection.tsx` | Feature grid with icons and descriptions |
| `SocialProof.tsx` | Social proof / testimonials section (6,593 bytes) |
| `TestimonialsSection.tsx` | User testimonials carousel |
| `CountdownTimer.tsx` | Season countdown / urgency timer (7,839 bytes) |
| `FreeSignupSection.tsx` | Free tier signup CTA (7,062 bytes) |

### Global Components

| Component | Description |
|---|---|
| `Navbar.tsx` | Main navigation with mobile menu (22,391 bytes) |
| `Footer.tsx` | Footer with links and legal (6,437 bytes) |
| `MagicTicker.tsx` | Scrolling odds ticker (11,346 bytes) |
| `PickAlertBanner.tsx` | Pop-up alert for new picks (9,975 bytes) |
| `PremiumRevealFeed.tsx` | Premium content feed with blur/paywall (17,967 bytes) |
| `StreakCounter.tsx` | Win streak counter component (7,512 bytes) |
| `IOSInstallPrompt.tsx` | iOS PWA install guide (9,336 bytes) |

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
- Provides `user`, `loading`, `signOut`

### Admin Auth (`src/lib/adminAuth.ts`)
- **Email whitelist**: `diamondboysadvisory@gmail.com`
- `useAdminAuth()` hook — checks if current user email is in whitelist
- `isAdminEmail()` — server-side check
- Non-admin users see admin pages but can't access data

### Security Rules
- All Supabase tables use Row Level Security (RLS)
- Stripe webhook signature verification
- API keys stored in environment variables only
- No sensitive data in client-side code
- Rate limiting on user-facing endpoints

---

## PWA & Mobile

### Progressive Web App
- `manifest.json` — PWA manifest
- Apple-specific meta tags for iOS:
  - `apple-mobile-web-app-capable: yes`
  - `apple-mobile-web-app-status-bar-style: black-translucent`
  - `apple-mobile-web-app-title: TriplePlayz`
  - `theme-color: #040810`
- `IOSInstallPrompt.tsx` — Visual 3-step guide for iOS users to install as PWA

### Mobile Responsiveness
- All pages designed mobile-first
- Admin panel has dedicated mobile CSS with sidebar collapse
- Patterns page has 3 breakpoints: desktop, 768px, 480px
- Navbar has full mobile hamburger menu with logo

---

## Cron Jobs & Automation

### Auto-Post Picks (`/api/cron/post-picks`)
- Automated pick posting system
- Triggered on schedule (via Render cron or external trigger)
- Posts picks to community channels

### Community Freebies
- Free analysis auto-posted periodically
- Time-limited visibility (disappears after a few days)
- Designed to give value but drive upgrades

---

## Environment Variables

| Variable | Service | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Anon/public key |
| `STRIPE_SECRET_KEY` | Stripe | Server-side payments |
| `STRIPE_PRICE_WEEKLY` | Stripe | Weekly plan price ID |
| `STRIPE_PRICE_MONTHLY` | Stripe | Monthly plan price ID |
| `STRIPE_PRICE_SEASON` | Stripe | Season pass price ID |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Webhook verification |
| `GEMINI_API_KEY` | Google AI | Gemini 2.5 Flash |
| `ODDS_API_KEY` | The Odds API | Live odds data |
| `DISCORD_TOKEN` | Discord | Bot token |
| `DISCORD_CLIENT_ID` | Discord | Bot client ID |

---

## File Structure

```
diamond-boys-advisory/
├── bot/                          # Discord bot (separate Node.js process)
│   ├── tripleplayz-bot.ts            # Main bot logic
│   ├── system-prompt.ts          # Diamond 💎 personality
│   └── package.json
├── public/                       # Static assets
│   ├── logo.png
│   └── manifest.json
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout (auth, navbar, footer, PWA)
│   │   ├── page.tsx              # Landing page
│   │   ├── globals.css           # Global styles + design system
│   │   ├── admin/                # Admin panel
│   │   │   ├── layout.tsx        # Admin sidebar layout
│   │   │   ├── admin.css         # Admin-specific styles
│   │   │   ├── page.tsx          # Dashboard
│   │   │   ├── analysis/         # Analysis Hub + game detail
│   │   │   ├── patterns/         # Alternating Pattern Master
│   │   │   │   ├── page.tsx      # Pattern UI + streak visualization
│   │   │   │   └── patterns.css  # Mobile-responsive pattern styles
│   │   │   ├── picks/            # Pick entry
│   │   │   └── logs/             # Pick history
│   │   ├── api/
│   │   │   ├── admin/            # Admin API routes
│   │   │   │   ├── ai/reason/    # AI pick reasoning
│   │   │   │   ├── discord/      # Discord management
│   │   │   │   ├── games/        # Today's games
│   │   │   │   ├── h2h/          # Head-to-head
│   │   │   │   ├── odds/[gameId] # Game odds
│   │   │   │   ├── patterns/     # Alternation algorithm
│   │   │   │   ├── picks/        # Pick CRUD
│   │   │   │   ├── pitchers/[id] # Pitcher stats
│   │   │   │   └── teams/[id]    # Team stats
│   │   │   ├── checkout/         # Stripe checkout session
│   │   │   ├── community/        # Community APIs
│   │   │   │   ├── channels/
│   │   │   │   ├── freebies/
│   │   │   │   ├── game-detail/
│   │   │   │   ├── messages/
│   │   │   │   └── team-schedule/
│   │   │   ├── cron/post-picks/  # Auto-post picks
│   │   │   ├── games/public/     # Public game data
│   │   │   ├── public/           # Public APIs
│   │   │   │   ├── odds/         # Public odds feed
│   │   │   │   └── ticker/       # Magic Ticker data
│   │   │   ├── stripe/webhook/   # Stripe webhook handler
│   │   │   └── subscribe/        # Email subscription
│   │   ├── checkout/             # Checkout page
│   │   ├── community/            # Community page (TriplePlayz Lounge)
│   │   ├── dashboard/            # User dashboard
│   │   ├── pricing/              # Pricing page
│   │   ├── success/              # Post-payment success
│   │   └── tos/                  # Terms of Service
│   ├── components/
│   │   ├── AuthProvider.tsx       # Supabase auth context
│   │   ├── Navbar.tsx             # Main navigation + mobile
│   │   ├── Footer.tsx             # Site footer
│   │   ├── MagicTicker.tsx        # Live odds scrolling ticker
│   │   ├── PickAlertBanner.tsx    # New pick notification popup
│   │   ├── PremiumRevealFeed.tsx  # Premium content with paywall blur
│   │   ├── StreakCounter.tsx      # Win streak display
│   │   ├── IOSInstallPrompt.tsx   # PWA install guide for iOS
│   │   ├── Analytics.tsx          # Analytics tracking
│   │   ├── landing/               # Landing page sections
│   │   │   ├── HeroSection.tsx
│   │   │   ├── LiveGameTicker.tsx
│   │   │   ├── StatsBar.tsx
│   │   │   ├── FeaturesSection.tsx
│   │   │   ├── SocialProof.tsx
│   │   │   ├── TestimonialsSection.tsx
│   │   │   ├── CountdownTimer.tsx
│   │   │   └── FreeSignupSection.tsx
│   │   └── pricing/
│   │       └── PricingCards.tsx    # Pricing tier cards
│   └── lib/
│       ├── adminAuth.ts           # Admin email whitelist auth
│       ├── api-sports-types.ts    # MLB API TypeScript types
│       ├── api-sports.ts          # API-Sports client (legacy?)
│       ├── discord.ts             # Discord stubs (migrated to community)
│       ├── gemini.ts              # Gemini AI (4 functions)
│       ├── mlb-stats.ts           # MLB Stats API client (throttled)
│       ├── odds-api.ts            # The Odds API v4 client (cached)
│       ├── stripe.ts              # Stripe lazy-init with Proxy
│       ├── supabase.ts            # Supabase lazy-init with Proxy
│       └── tiers.ts               # Subscription tier definitions
├── supabase/
│   └── migrations/                # Database schema migrations
├── render.yaml                    # Render deployment config
├── package.json
└── tsconfig.json
```

---

## Open Items / Next Think-Tank

### 🟡 Active Decisions Needed
- **When to switch from spring training → regular season data?** Currently shows both; consider auto-switching based on MLB calendar
- **Community freebies cadence** — how often should free analysis appear? How long before it disappears?
- **Push notifications** — PWA push for pick alerts? Capacitor native app?
- **Additional sports** — NFL early access is marketed in Season Pass tier but not implemented yet

### 🔵 Feature Ideas
- **Leaderboard** — track pick performance over time, show win/loss record publicly
- **Parlay builder** — combine multiple picks into parlays with auto-calculated odds
- **Line movement alerts** — notify when odds shift significantly
- **Social sharing cards** — shareable pick result images for Twitter/Instagram
- **Backtesting engine** — run the alternation algorithm against historical seasons
- **Public results page** — transparent win rate tracker to build trust

### 🟢 Technical Improvements
- **Supabase Edge Functions** for server-side pick validation
- **Redis caching** instead of in-memory (for multi-instance deployments)
- **Webhook retry queue** for failed Stripe webhooks
- **Automated testing** — unit tests for the alternation algorithm
- **API rate limiting** middleware on public endpoints
- **Database indexes** on frequently queried columns

### 🔴 Known Considerations
- Discord integration is stubbed out (`src/lib/discord.ts`) — migrated to The TriplePlayz Lounge
- `api-sports.ts` may be legacy (superseded by `mlb-stats.ts`) — confirm and clean up
- No automated deployment pipeline beyond Render auto-deploy from `master`
- The Odds API quota is limited — monitor `x-requests-remaining` header in logs
