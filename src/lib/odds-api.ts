// The Odds API v4 Client — with Supabase-backed persistent cache
// Docs: https://the-odds-api.com/liveapi/guides/v4/
//
// ARCHITECTURE: Users NEVER hit the live Odds API.
// A cron job (/api/cron/refresh-odds) refreshes data every 2-4 hours.
// All user-facing endpoints read from the Supabase `odds_cache` table.

import { createClient } from '@supabase/supabase-js';

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const BASE_URL = 'https://api.the-odds-api.com/v4';

// US Sports we support (active seasons only)
export const US_SPORTS = [
    { key: 'baseball_mlb', name: 'MLB', emoji: '⚾', color: '#00529b' },
    { key: 'basketball_nba', name: 'NBA', emoji: '🏀', color: '#f58426' },
    { key: 'icehockey_nhl', name: 'NHL', emoji: '🏒', color: '#000000' },
] as const;

export type SportKey = typeof US_SPORTS[number]['key'];

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface OddsOutcome {
    name: string;
    price: number;
    point?: number;
}

export interface OddsMarket {
    key: string; // h2h, spreads, totals
    last_update: string;
    outcomes: OddsOutcome[];
}

export interface OddsBookmaker {
    key: string;
    title: string;
    last_update: string;
    markets: OddsMarket[];
}

export interface OddsEvent {
    id: string;
    sport_key: string;
    sport_title: string;
    commence_time: string;
    home_team: string;
    away_team: string;
    bookmakers: OddsBookmaker[];
}

export interface SportInfo {
    key: string;
    group: string;
    title: string;
    description: string;
    active: boolean;
    has_outrights: boolean;
}

export interface ScoreEvent {
    id: string;
    sport_key: string;
    sport_title: string;
    commence_time: string;
    completed: boolean;
    home_team: string;
    away_team: string;
    scores: { name: string; score: string }[] | null;
}

// ═══════════════════════════════════════════
// Supabase cache client
// ═══════════════════════════════════════════

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
}

/** Read from Supabase odds_cache table */
async function readCache<T>(cacheKey: string): Promise<T | null> {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('odds_cache')
            .select('data, updated_at, expires_at')
            .eq('cache_key', cacheKey)
            .single();

        if (error || !data) return null;

        // Check if expired
        if (new Date(data.expires_at) < new Date()) return null;

        return data.data as T;
    } catch {
        return null;
    }
}

/** Write to Supabase odds_cache table */
async function writeCache<T>(cacheKey: string, data: T, ttlHours: number = 4): Promise<void> {
    try {
        const supabase = getSupabase();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

        await supabase
            .from('odds_cache')
            .upsert({
                cache_key: cacheKey,
                data,
                updated_at: now.toISOString(),
                expires_at: expiresAt.toISOString(),
            }, { onConflict: 'cache_key' });
    } catch (err) {
        console.error('[Odds Cache] Write error:', err);
    }
}

// ═══════════════════════════════════════════
// Direct API Fetcher (ONLY used by cron job)
// ═══════════════════════════════════════════

async function oddsFetchDirect<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    if (!ODDS_API_KEY) throw new Error('ODDS_API_KEY not configured');

    const url = new URL(`${BASE_URL}${path}`);
    url.searchParams.set('apiKey', ODDS_API_KEY);
    for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
    }

    const res = await fetch(url.toString());
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Odds API error ${res.status}: ${body}`);
    }

    // Log remaining quota
    const remaining = res.headers.get('x-requests-remaining');
    const used = res.headers.get('x-requests-used');
    if (remaining) console.log(`[Odds API] Quota: ${used} used / ${remaining} remaining`);

    return res.json();
}

// ═══════════════════════════════════════════
// Public Functions (read from cache ONLY)
// ═══════════════════════════════════════════

/** Get list of active sports */
export async function getActiveSports(): Promise<SportInfo[]> {
    const cached = await readCache<SportInfo[]>('sports-list');
    if (cached) return cached;
    // Fallback: return static list if cache is empty
    return US_SPORTS.map(s => ({
        key: s.key, group: 'Sports', title: s.name,
        description: s.name, active: true, has_outrights: false,
    }));
}

/** Get odds for a sport — reads from Supabase cache */
export async function getSportOdds(
    sportKey: string,
    markets: string = 'h2h,spreads,totals',
    regions: string = 'us'
): Promise<OddsEvent[]> {
    const cacheKey = `odds-${sportKey}-${markets}-${regions}`;
    const cached = await readCache<OddsEvent[]>(cacheKey);
    return cached || [];
}

/** Get scores for a sport — reads from Supabase cache */
export async function getSportScores(sportKey: string, daysFrom: number = 1): Promise<ScoreEvent[]> {
    const cacheKey = `scores-${sportKey}-${daysFrom}`;
    const cached = await readCache<ScoreEvent[]>(cacheKey);
    return cached || [];
}

// ═══════════════════════════════════════════
// Refresh Functions (called ONLY by cron job)
// ═══════════════════════════════════════════

/** Refresh odds for a sport from the live API and store in cache */
export async function refreshSportOdds(
    sportKey: string,
    markets: string = 'h2h,spreads,totals',
    regions: string = 'us'
): Promise<OddsEvent[]> {
    const data = await oddsFetchDirect<OddsEvent[]>(`/sports/${sportKey}/odds`, {
        regions,
        markets,
        oddsFormat: 'american',
    });
    const cacheKey = `odds-${sportKey}-${markets}-${regions}`;
    await writeCache(cacheKey, data, 4); // Cache for 4 hours
    return data;
}

/** Refresh scores for a sport from the live API and store in cache */
export async function refreshSportScores(sportKey: string, daysFrom: number = 1): Promise<ScoreEvent[]> {
    const data = await oddsFetchDirect<ScoreEvent[]>(`/sports/${sportKey}/scores`, {
        daysFrom: String(daysFrom),
    });
    const cacheKey = `scores-${sportKey}-${daysFrom}`;
    await writeCache(cacheKey, data, 2); // Cache for 2 hours (scores change more often)
    return data;
}

// ═══════════════════════════════════════════
// Derived Data (Magic Edge Detection)
// ═══════════════════════════════════════════

export interface TickerItem {
    id: string;
    type: 'odds' | 'edge' | 'streak' | 'score' | 'movement';
    sport: string;
    sportEmoji: string;
    headline: string;
    detail: string;
    urgency: 'low' | 'medium' | 'high';
    timestamp: string;
}

/** Extract best odds from bookmakers for a market */
export function getBestOdds(event: OddsEvent, marketKey: string = 'h2h') {
    const results: { team: string; bestPrice: number; book: string }[] = [];

    for (const bm of event.bookmakers) {
        const market = bm.markets.find(m => m.key === marketKey);
        if (!market) continue;

        for (const outcome of market.outcomes) {
            const existing = results.find(r => r.team === outcome.name);
            if (!existing) {
                results.push({ team: outcome.name, bestPrice: outcome.price, book: bm.title });
            } else if (outcome.price > existing.bestPrice) {
                existing.bestPrice = outcome.price;
                existing.book = bm.title;
            }
        }
    }

    return results;
}

/** Generate ticker items from odds data */
export function generateTickerItems(events: OddsEvent[], sportKey: string): TickerItem[] {
    const sport = US_SPORTS.find(s => s.key === sportKey);
    if (!sport) return [];

    const items: TickerItem[] = [];

    for (const event of events.slice(0, 12)) { // Limit to next 12 games
        const bestH2H = getBestOdds(event, 'h2h');
        const bestSpreads = getBestOdds(event, 'spreads');
        const bestTotals = getBestOdds(event, 'totals');

        // Main odds item
        if (bestH2H.length >= 2) {
            const fav = bestH2H.reduce((a, b) => Math.abs(a.bestPrice) < Math.abs(b.bestPrice) ? a : b);
            const dog = bestH2H.find(b => b.team !== fav.team);

            items.push({
                id: `${event.id}-h2h`,
                type: 'odds',
                sport: sport.name,
                sportEmoji: sport.emoji,
                headline: `${event.away_team} @ ${event.home_team}`,
                detail: `ML: ${fav.team.split(' ').pop()} ${fav.bestPrice > 0 ? '+' : ''}${fav.bestPrice} | ${dog?.team.split(' ').pop()} ${dog && dog.bestPrice > 0 ? '+' : ''}${dog?.bestPrice}`,
                urgency: Math.abs(fav.bestPrice) > 200 ? 'high' : 'medium',
                timestamp: event.commence_time,
            });
        }

        // Spread item
        if (bestSpreads.length >= 2) {
            const spread = bestSpreads.find(s => s.bestPrice < 0) || bestSpreads[0];
            const spreadLine = event.bookmakers[0]?.markets.find(m => m.key === 'spreads')?.outcomes[0]?.point;

            if (spreadLine !== undefined) {
                items.push({
                    id: `${event.id}-spread`,
                    type: 'movement',
                    sport: sport.name,
                    sportEmoji: sport.emoji,
                    headline: `${event.away_team} @ ${event.home_team}`,
                    detail: `Spread: ${event.home_team.split(' ').pop()} ${spreadLine > 0 ? '+' : ''}${spreadLine}`,
                    urgency: 'low',
                    timestamp: event.commence_time,
                });
            }
        }

        // Total item
        if (bestTotals.length >= 2) {
            const overUnder = event.bookmakers[0]?.markets.find(m => m.key === 'totals')?.outcomes[0]?.point;
            if (overUnder) {
                items.push({
                    id: `${event.id}-total`,
                    type: 'edge',
                    sport: sport.name,
                    sportEmoji: sport.emoji,
                    headline: `${event.away_team} @ ${event.home_team}`,
                    detail: `O/U: ${overUnder}`,
                    urgency: 'low',
                    timestamp: event.commence_time,
                });
            }
        }
    }

    return items;
}
