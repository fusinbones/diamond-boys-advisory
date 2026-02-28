// ═══════════════════════════════════════════
// api-sports.io v1 Baseball API Client
// ONLY used for ODDS — all other data comes
// from the free MLB Stats API.
// ═══════════════════════════════════════════

import type { OddsResponse } from './api-sports-types';

const API_BASE = 'https://v1.baseball.api-sports.io';
const API_KEY = process.env.APISPORTS_KEY || '';

// ── Cache (1h TTL) ─────────────────────────

interface CacheEntry<T> {
    data: T;
    expiry: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCached<T>(key: string): T | null {
    const entry = cache.get(key);
    if (entry && entry.expiry > Date.now()) {
        return entry.data as T;
    }
    cache.delete(key);
    return null;
}

function setCache<T>(key: string, data: T): void {
    cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

// ── Core Fetch ─────────────────────────────

interface ApiSportsResponse<T> {
    get: string;
    parameters: Record<string, string>;
    errors: Record<string, string> | string[];
    results: number;
    response: T;
}

async function apiFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${API_BASE}${endpoint}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const cacheKey = url.toString();
    const cached = getCached<T>(cacheKey);
    if (cached) return cached;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const res = await fetch(url.toString(), {
                headers: { 'x-apisports-key': API_KEY },
                next: { revalidate: 3600 },
            });

            if (!res.ok) {
                throw new Error(`API error: ${res.status} ${res.statusText}`);
            }

            const json: ApiSportsResponse<T> = await res.json();

            if (json.errors && (Array.isArray(json.errors) ? json.errors.length > 0 : Object.keys(json.errors).length > 0)) {
                const errMsg = Array.isArray(json.errors) ? json.errors.join(', ') : JSON.stringify(json.errors);
                throw new Error(`API returned errors: ${errMsg}`);
            }

            setCache(cacheKey, json.response);
            return json.response;
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
    }

    throw lastError || new Error('API fetch failed');
}

// ── Odds (only remaining api-sports function) ──

/** Get odds for a game. */
export async function getOdds(gameId: number): Promise<OddsResponse[]> {
    return apiFetch<OddsResponse[]>('/odds', { game: String(gameId) });
}
