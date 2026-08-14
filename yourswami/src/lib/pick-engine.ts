/**
 * Pick Consensus Engine
 * Analyzes odds across multiple sportsbooks to find value plays and generate AI picks.
 *
 * Algorithm:
 * 1. Collect moneyline odds from ALL bookmakers for each game
 * 2. Calculate consensus direction (which team most books favor)
 * 3. Identify value plays (where odds diverge significantly)
 * 4. Score edge based on divergence, consensus strength, and implied probability
 */

import type { OddsEvent } from '@/lib/odds-api';

export interface PickRecommendation {
    gameId: string;
    sport: string;
    homeTeam: string;
    awayTeam: string;
    gameTime: string;
    pickType: 'ML' | 'O/U';
    pickTeam: string;
    pickValue: string;
    confidence: number;
    edge: number;
    reasoning: string;
    consensusStrength: number; // 0-100, how many books agree
    oddsAtPick: {
        moneyline: { home: number | null; away: number | null };
        total: number | null;
    };
    source: 'ai_consensus';
}

interface BookmakerOdds {
    bookmaker: string;
    homePrice: number;
    awayPrice: number;
}

function impliedProb(odds: number): number {
    if (odds > 0) return 100 / (odds + 100);
    return Math.abs(odds) / (Math.abs(odds) + 100);
}

function averageOdds(prices: number[]): number {
    return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
}

export function analyzeConsensus(event: OddsEvent): PickRecommendation | null {
    const bookOdds: BookmakerOdds[] = [];

    for (const bm of event.bookmakers) {
        const h2h = bm.markets.find(m => m.key === 'h2h');
        if (!h2h || h2h.outcomes.length < 2) continue;

        const home = h2h.outcomes.find(o => o.name === event.home_team);
        const away = h2h.outcomes.find(o => o.name === event.away_team);
        if (!home || !away) continue;

        bookOdds.push({
            bookmaker: bm.title,
            homePrice: home.price,
            awayPrice: away.price,
        });
    }

    if (bookOdds.length < 3) return null; // Need 3+ books for consensus

    // Calculate consensus
    const homeUnderdogCount = bookOdds.filter(b => b.homePrice > 0).length;
    const awayUnderdogCount = bookOdds.filter(b => b.awayPrice > 0).length;
    const totalBooks = bookOdds.length;

    // Which team do most books see as the favorite?
    const homeFavPct = (totalBooks - homeUnderdogCount) / totalBooks;
    const awayFavPct = (totalBooks - awayUnderdogCount) / totalBooks;

    // Average odds across books
    const avgHome = averageOdds(bookOdds.map(b => b.homePrice));
    const avgAway = averageOdds(bookOdds.map(b => b.awayPrice));

    // Find best price for each team (highest payout = best for bettor)
    const bestHome = Math.max(...bookOdds.map(b => b.homePrice));
    const bestAway = Math.max(...bookOdds.map(b => b.awayPrice));

    // Edge = difference between consensus implied probability and best available odds
    const avgHomeProb = impliedProb(avgHome);
    const avgAwayProb = impliedProb(avgAway);
    const bestHomeProb = impliedProb(bestHome);
    const bestAwayProb = impliedProb(bestAway);

    // Value = when books disagree on who's the favorite, or when avg prob differs from best
    const homeEdge = Math.round((avgHomeProb - bestHomeProb) * 100);
    const awayEdge = Math.round((avgAwayProb - bestAwayProb) * 100);

    // Odds spread (how much books disagree)
    const homeSpread = Math.max(...bookOdds.map(b => b.homePrice)) - Math.min(...bookOdds.map(b => b.homePrice));
    const awaySpread = Math.max(...bookOdds.map(b => b.awayPrice)) - Math.min(...bookOdds.map(b => b.awayPrice));
    const maxSpread = Math.max(homeSpread, awaySpread);

    // Need meaningful divergence to make a pick
    if (maxSpread < 15) return null; // Books too aligned, no edge

    // Pick the side with better edge
    let pickTeam: string;
    let pickOdds: number;
    let edge: number;
    let consensusStrength: number;

    if (homeEdge >= awayEdge && homeSpread > 15) {
        pickTeam = event.home_team;
        pickOdds = bestHome;
        edge = homeEdge;
        consensusStrength = Math.round(homeFavPct * 100);
    } else if (awaySpread > 15) {
        pickTeam = event.away_team;
        pickOdds = bestAway;
        edge = awayEdge;
        consensusStrength = Math.round(awayFavPct * 100);
    } else {
        return null;
    }

    // Calculate confidence (30-95 range)
    const confidence = Math.min(95, Math.max(30,
        40 + // base
        Math.min(25, edge * 2) + // edge contribution
        Math.min(20, maxSpread / 3) + // divergence contribution
        Math.min(10, (totalBooks - 3) * 2) // more books = more confident
    ));

    if (confidence < 55) return null; // Too low confidence, skip

    const reasoning = generateAutoReasoning(
        event, pickTeam, pickOdds, edge, consensusStrength, totalBooks, maxSpread
    );

    return {
        gameId: event.id,
        sport: event.sport_key,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        gameTime: event.commence_time,
        pickType: 'ML',
        pickTeam,
        pickValue: pickOdds > 0 ? `+${pickOdds}` : `${pickOdds}`,
        confidence: Math.round(confidence),
        edge,
        reasoning,
        consensusStrength,
        oddsAtPick: {
            moneyline: { home: avgHome, away: avgAway },
            total: null,
        },
        source: 'ai_consensus',
    };
}

function generateAutoReasoning(
    event: OddsEvent,
    pickTeam: string,
    pickOdds: number,
    edge: number,
    consensus: number,
    bookCount: number,
    spread: number,
): string {
    const lines: string[] = [];

    lines.push(`📊 Consensus across ${bookCount} sportsbooks:`);

    if (pickOdds > 0) {
        lines.push(`${pickTeam} available at +${pickOdds} (underdog value play)`);
    } else {
        lines.push(`${pickTeam} at ${pickOdds} with ${edge}% edge vs consensus`);
    }

    if (spread > 30) {
        lines.push(`⚡ High odds divergence (${spread}pts) — books disagree here`);
    } else {
        lines.push(`Moderate divergence (${spread}pts) across books`);
    }

    if (consensus >= 70) {
        lines.push(`${consensus}% of books align on this direction`);
    }

    lines.push(`AI Confidence: ${Math.round(40 + edge * 2)}%`);

    return lines.join('\n');
}

export function analyzeAllGames(events: OddsEvent[]): PickRecommendation[] {
    const picks: PickRecommendation[] = [];

    for (const event of events) {
        const pick = analyzeConsensus(event);
        if (pick) {
            picks.push(pick);
        }
    }

    // Sort by confidence descending
    picks.sort((a, b) => b.confidence - a.confidence);

    return picks;
}
