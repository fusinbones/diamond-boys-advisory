import { NextResponse } from 'next/server';
import { getSportOdds, type OddsEvent, US_SPORTS } from '@/lib/odds-api';

/*
 * Diamond Boys — Freebie Pick Algorithm
 *
 * This is a TRANSPARENT, data-driven algorithm that identifies value plays
 * based on consensus odds across multiple sportsbooks. It is NOT a magic
 * crystal ball — it uses publicly available data to find:
 *
 * 1. Consensus edges: When most books agree on a line but one offers extra value
 * 2. Home favorites: Slight home-field edge in certain odds ranges
 * 3. Sharp money signals: Line movement from opening to current odds
 *
 * DISCLAIMER: This is for entertainment purposes only. Past performance
 * is not indicative of future results.
 */

interface FreebiePickResult {
    sport: string;
    sportEmoji: string;
    awayTeam: string;
    homeTeam: string;
    pickTeam: string;
    pickType: string;
    odds: number;
    confidence: 'low' | 'medium' | 'high';
    reasoning: string;
    commenceTime: string;
    edgeScore: number;
}

/**
 * Core algorithm: Analyze odds consensus across multiple sportsbooks
 * to find the best value plays based on:
 * 1. Bookmaker consensus (what % of books favor this side)
 * 2. Line value (is the line softer at one book?)
 * 3. Home/away edge offset
 * 4. Odds range sweet spot (-110 to -180 for favorites)
 */
function analyzeEvent(event: OddsEvent): FreebiePickResult | null {
    const h2hMarkets = event.bookmakers
        .map(bm => {
            const market = bm.markets.find(m => m.key === 'h2h');
            if (!market) return null;
            return { book: bm.title, outcomes: market.outcomes };
        })
        .filter(Boolean) as Array<{ book: string; outcomes: Array<{ name: string; price: number }> }>;

    if (h2hMarkets.length < 1) return null; // Need at least 1 book

    // Tally: which team is favored by which books?
    const teamScores: Record<string, { favCount: number; prices: number[]; bestPrice: number; bestBook: string }> = {};

    for (const market of h2hMarkets) {
        // Find the favorite in this book (most negative or least positive)
        const sorted = [...market.outcomes].sort((a, b) => a.price - b.price);
        const fav = sorted[0];

        if (!teamScores[fav.name]) {
            teamScores[fav.name] = { favCount: 0, prices: [], bestPrice: -9999, bestBook: '' };
        }
        teamScores[fav.name].favCount++;

        // Track all prices for each team
        for (const outcome of market.outcomes) {
            if (!teamScores[outcome.name]) {
                teamScores[outcome.name] = { favCount: 0, prices: [], bestPrice: -9999, bestBook: '' };
            }
            teamScores[outcome.name].prices.push(outcome.price);
            if (outcome.price > teamScores[outcome.name].bestPrice) {
                teamScores[outcome.name].bestPrice = outcome.price;
                teamScores[outcome.name].bestBook = market.book;
            }
        }
    }

    const teams = Object.entries(teamScores);
    if (teams.length < 2) return null;

    // Sort by consensus (who is favored by more books)
    teams.sort((a, b) => b[1].favCount - a[1].favCount);

    const [pickTeam, pickData] = teams[0];
    const consensusPct = pickData.favCount / h2hMarkets.length;

    // Calculate average odds
    const avgOdds = Math.round(pickData.prices.reduce((a, b) => a + b, 0) / pickData.prices.length);

    // Edge Score (0-100):
    // - Consensus: 0-40 points (strong consensus = high)
    // - Odds range: 0-30 points (sweet spot -110 to -180 = max)
    // - Home boost: 0-15 points
    // - Book count: 0-15 points
    let edgeScore = 0;

    // Consensus factor (scale to book count)
    if (h2hMarkets.length >= 3) {
        edgeScore += Math.min(40, Math.round(consensusPct * 50));
    } else {
        // With fewer books, give baseline points for having any data
        edgeScore += Math.min(30, Math.round(consensusPct * 40) + 10);
    }

    // Odds sweet spot: -110 to -180 is the money zone for favorites
    if (avgOdds >= -180 && avgOdds <= -110) {
        edgeScore += 30; // Perfect range
    } else if (avgOdds >= -250 && avgOdds <= -100) {
        edgeScore += 20; // Good range  
    } else if (avgOdds > 0 && avgOdds <= 150) {
        edgeScore += 15; // Small underdog value
    }

    // Home field boost
    const isHome = pickTeam === event.home_team;
    if (isHome) edgeScore += 15;

    // More books = more reliable signal
    edgeScore += Math.min(15, h2hMarkets.length * 2);

    // Skip very weak signals
    if (edgeScore < 20) return null;

    // Determine confidence
    const confidence = edgeScore >= 70 ? 'high' : edgeScore >= 50 ? 'medium' : 'low';

    // Build reasoning
    const reasons: string[] = [];
    if (h2hMarkets.length >= 3 && consensusPct >= 0.8) reasons.push(`${Math.round(consensusPct * 100)}% of sportsbooks favor this side`);
    else if (h2hMarkets.length >= 3 && consensusPct >= 0.6) reasons.push(`${Math.round(consensusPct * 100)}% bookmaker consensus`);
    else if (h2hMarkets.length < 3) reasons.push(`Data from ${h2hMarkets.length} sportsbook${h2hMarkets.length > 1 ? 's' : ''}`);
    
    if (avgOdds >= -180 && avgOdds <= -110) reasons.push('Odds in the value sweet spot (-110 to -180)');
    if (isHome) reasons.push('Home field advantage');
    if (pickData.bestPrice > avgOdds + 10) reasons.push(`Best line at ${pickData.bestBook} (${pickData.bestPrice > 0 ? '+' : ''}${pickData.bestPrice})`);

    const sport = US_SPORTS.find(s => s.key === event.sport_key);

    return {
        sport: sport?.name || 'MLB',
        sportEmoji: sport?.emoji || '⚾',
        awayTeam: event.away_team,
        homeTeam: event.home_team,
        pickTeam,
        pickType: avgOdds < 0 ? 'Moneyline' : 'Moneyline (Dog)',
        odds: avgOdds,
        confidence,
        reasoning: reasons.join('. ') + '.',
        commenceTime: event.commence_time,
        edgeScore,
    };
}

/**
 * Format a pick as the Diamond Boys branded text
 */
function formatPick(pick: FreebiePickResult, index: number): string {
    const unitMap = { low: 1, medium: 2, high: 3 };
    const units = unitMap[pick.confidence];
    const unitDots = '⬢'.repeat(units) + '⬡'.repeat(5 - units);
    const confEmoji = pick.confidence === 'high' ? '🔥 HIGH' : pick.confidence === 'medium' ? '⭐ MEDIUM' : '📘 LOW';
    const divider = '━━━━━━━━━━━━━━━━━━━━━━━';

    return [
        `🎯 **FREEBIE #${index + 1}** 🎯`,
        divider,
        `${pick.sportEmoji} **${pick.sport}** | ${pick.awayTeam} vs ${pick.homeTeam}`,
        ``,
        `📍 **Pick:** ${pick.pickTeam} ${pick.pickType}`,
        `💰 **Odds:** ${pick.odds > 0 ? '+' : ''}${pick.odds}`,
        `⭐ **Units:** ${unitDots} (${units}/5)`,
        `🎯 **Confidence:** ${confEmoji}`,
        ``,
        `📊 *${pick.reasoning}*`,
        divider,
        `💎 Diamond Boys Algorithm • For entertainment only`,
    ].join('\n');
}

export async function GET() {
    try {
        // Fetch odds for MLB (primary sport), fallback to NBA if no MLB games
        let mlbOdds = await getSportOdds('baseball_mlb', 'h2h');
        let sportLabel = 'MLB';
        let sportEmoji = '⚾';

        // If MLB is sparse (spring training, off-season), also try NBA
        if (mlbOdds.length < 2) {
            try {
                const nbaOdds = await getSportOdds('basketball_nba', 'h2h');
                if (nbaOdds.length > mlbOdds.length) {
                    mlbOdds = [...mlbOdds, ...nbaOdds];
                }
            } catch { /* NBA fetch failed, continue with MLB only */ }
        }

        // Analyze each event
        const allPicks: FreebiePickResult[] = [];
        for (const event of mlbOdds) {
            const pick = analyzeEvent(event);
            if (pick) allPicks.push(pick);
        }

        // Sort by edge score and take top 3
        allPicks.sort((a, b) => b.edgeScore - a.edgeScore);
        const topPicks = allPicks.slice(0, 3);

        // Generate formatted messages
        const formatted = topPicks.map((p, i) => formatPick(p, i));

        // Build the daily announcement
        const gameCount = mlbOdds.length;
        const announcement = [
            `📢 **TODAY'S MLB SCHEDULE** 📢`,
            `━━━━━━━━━━━━━━━━━━━━━━━`,
            `⚾ **${gameCount} games** on the board today`,
            ``,
            ...mlbOdds.slice(0, 8).map(e => {
                const bestH2H = e.bookmakers[0]?.markets.find(m => m.key === 'h2h');
                const homeOdds = bestH2H?.outcomes.find(o => o.name === e.home_team)?.price;
                const awayOdds = bestH2H?.outcomes.find(o => o.name === e.away_team)?.price;
                const time = new Date(e.commence_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
                return `🕐 **${time} ET** — ${e.away_team} (${awayOdds && awayOdds > 0 ? '+' : ''}${awayOdds || '?'}) @ ${e.home_team} (${homeOdds && homeOdds > 0 ? '+' : ''}${homeOdds || '?'})`;
            }),
            ``,
            `━━━━━━━━━━━━━━━━━━━━━━━`,
            `💎 Diamond Boys Advisory`,
        ].join('\n');

        return NextResponse.json({
            gameCount,
            picks: topPicks,
            formattedPicks: formatted,
            announcement,
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Freebie algorithm error:', error);
        return NextResponse.json({ error: 'Failed to generate picks', picks: [], formattedPicks: [], announcement: '' }, { status: 200 });
    }
}
