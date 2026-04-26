/**
 * TriplePlayz Statistical Edge Engine
 * ════════════════════════════════════
 * MIT-level sports betting mathematics.
 *
 * Components:
 * 1. ELO Ratings — Dynamic team strength (FiveThirtyEight method)
 * 2. Log5 Win Probability — Bill James' proven formula
 * 3. Kelly Criterion — Optimal bet sizing
 * 4. Expected Value — Identifies +EV plays
 * 5. Implied vs True Probability — Finds mispriced lines
 *
 * References:
 * - Bill James, "Log5" (1981), The Bill James Baseball Abstract
 * - J.L. Kelly Jr., "A New Interpretation of Information Rate" (1956), Bell System Technical Journal
 * - Arpad Elo, "The Rating of Chessplayers" (1978), adapted for sports
 * - FiveThirtyEight MLB ELO methodology (2015)
 */

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface TeamProfile {
    name: string;
    record: string;          // e.g. "15-8"
    wins: number;
    losses: number;
    recentForm: string[];    // last 10 results: ['W','L','W',...]
    isHome: boolean;
    pitcherERA?: number;
    pitcherWHIP?: number;
    pitcherName?: string;
}

export interface OddsInput {
    homeML: number;          // e.g. -150
    awayML: number;          // e.g. +130
    spreadLine?: number;     // e.g. -1.5
    spreadHomeOdds?: number;
    spreadAwayOdds?: number;
    totalLine?: number;      // e.g. 8.5
    overOdds?: number;
    underOdds?: number;
}

export interface EdgeReport {
    // Team Strength
    homeELO: number;
    awayELO: number;
    eloDelta: number;           // positive = home stronger

    // Win Probabilities
    homeTrueProb: number;       // our calculated probability (0-1)
    awayTrueProb: number;
    homeImpliedProb: number;    // sportsbook's implied probability
    awayImpliedProb: number;
    homeEdge: number;           // true - implied (positive = value)
    awayEdge: number;

    // Expected Value per $100 wagered
    homeEV: number;
    awayEV: number;

    // Kelly Criterion (fraction of bankroll)
    homeKelly: number;
    awayKelly: number;

    // Recommendation
    pick: 'home' | 'away' | 'pass';
    pickTeam: string;
    pickType: 'ML' | 'RL';
    confidence: number;         // 0-100
    edgePct: number;            // the edge percentage
    kellyUnits: number;         // suggested units (Kelly / 4 for quarter-Kelly)
    evPerUnit: number;          // expected value per unit

    // Run Line analysis
    runLineValue: boolean;      // true if RL offers better EV than ML
    runLineEV?: number;

    // Factors
    factors: string[];

    // Raw text summary
    summary: string;
}

// ═══════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════

const BASE_ELO = 1500;
const K_FACTOR = 6;                // How fast ELO adjusts (conservative)
const HOME_ADVANTAGE_MLB = 0.540;  // Historical MLB home win rate
const HOME_ELO_BOOST = 24;        // ELO points added for home field
const MIN_EDGE_THRESHOLD = 0.02;  // 2% minimum edge to recommend
const KELLY_FRACTION = 0.25;      // Quarter-Kelly (conservative)

// ═══════════════════════════════════════════
// Core Math Functions
// ═══════════════════════════════════════════

/**
 * Convert American odds to implied probability
 * -150 → 0.600 (60%)
 * +130 → 0.435 (43.5%)
 */
export function impliedProbability(americanOdds: number): number {
    if (americanOdds < 0) {
        return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
    }
    return 100 / (americanOdds + 100);
}

/**
 * Convert American odds to decimal odds
 * -150 → 1.667
 * +130 → 2.300
 */
export function toDecimalOdds(americanOdds: number): number {
    if (americanOdds < 0) {
        return 1 + (100 / Math.abs(americanOdds));
    }
    return 1 + (americanOdds / 100);
}

/**
 * Remove the vig (overround) from book probabilities to get "fair" implied probabilities
 * Books set lines so total implied probability > 100% (the juice/vig)
 */
export function removeVig(homeImplied: number, awayImplied: number): { home: number; away: number } {
    const total = homeImplied + awayImplied;
    return {
        home: homeImplied / total,
        away: awayImplied / total,
    };
}

/**
 * ELO Rating Calculation
 * Based on FiveThirtyEight's MLB methodology
 *
 * Formula: New ELO = Old ELO + K * (Actual - Expected)
 * Expected = 1 / (1 + 10^((OpponentELO - TeamELO) / 400))
 */
export function calculateELO(wins: number, losses: number, recentForm: string[]): number {
    let elo = BASE_ELO;

    // Adjust base ELO by win percentage (season-long signal)
    const totalGames = wins + losses;
    if (totalGames > 0) {
        const winPct = wins / totalGames;
        // Scale: .400 team → ~1440, .500 team → 1500, .600 team → 1560
        elo = BASE_ELO + (winPct - 0.5) * 200;
    }

    // Apply momentum from recent form (last 10 games)
    // More recent games weighted more heavily
    const formGames = recentForm.slice(0, 10);
    for (let i = 0; i < formGames.length; i++) {
        const weight = (10 - i) / 10; // 1.0 for most recent, 0.1 for oldest
        const actual = formGames[i] === 'W' ? 1 : 0;
        const expected = 0.5; // Neutral opponent assumption for form adjustment
        elo += K_FACTOR * weight * (actual - expected);
    }

    return Math.round(elo);
}

/**
 * Log5 Win Probability (Bill James)
 *
 * The gold standard for head-to-head probability in baseball.
 * Accounts for both teams' true strength relative to league average.
 *
 * Formula: P(A) = (pA - pA*pB) / (pA + pB - 2*pA*pB)
 * where pA = Team A true win rate, pB = Team B true win rate
 */
export function log5Probability(teamAWinRate: number, teamBWinRate: number): number {
    const pA = Math.max(0.01, Math.min(0.99, teamAWinRate));
    const pB = Math.max(0.01, Math.min(0.99, teamBWinRate));

    return (pA - pA * pB) / (pA + pB - 2 * pA * pB);
}

/**
 * ELO to Win Probability
 * Convert ELO difference to expected win probability
 *
 * Formula: P(A) = 1 / (1 + 10^((ELO_B - ELO_A) / 400))
 */
export function eloToWinProb(eloA: number, eloB: number): number {
    return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
}

/**
 * Blend multiple probability signals into a composite true probability
 *
 * Weights:
 * - Log5 (season record): 35%
 * - ELO (dynamic strength): 30%
 * - Home advantage: 15%
 * - Pitching matchup: 20%
 */
export function compositeProbability(
    log5Prob: number,
    eloProb: number,
    isHome: boolean,
    pitcherEdge: number,  // -1 to +1, where positive = pitcher advantage
): number {
    const homeBoost = isHome ? HOME_ADVANTAGE_MLB : (1 - HOME_ADVANTAGE_MLB);

    const composite =
        0.35 * log5Prob +
        0.30 * eloProb +
        0.15 * homeBoost +
        0.20 * (0.5 + pitcherEdge * 0.5);

    // Clamp to reasonable range (no team is truly >85% or <15%)
    return Math.max(0.15, Math.min(0.85, composite));
}

/**
 * Kelly Criterion — Optimal Bet Sizing
 *
 * f* = (bp - q) / b
 * where:
 *   b = decimal odds - 1 (net odds)
 *   p = true probability of winning
 *   q = 1 - p (probability of losing)
 *
 * We use quarter-Kelly for safety (f* / 4)
 */
export function kellyCriterion(trueProbability: number, americanOdds: number): number {
    const decimalOdds = toDecimalOdds(americanOdds);
    const b = decimalOdds - 1; // net payout per unit
    const p = trueProbability;
    const q = 1 - p;

    const kelly = (b * p - q) / b;

    // Negative Kelly = no edge, don't bet
    if (kelly <= 0) return 0;

    // Quarter-Kelly for conservative sizing
    return kelly * KELLY_FRACTION;
}

/**
 * Expected Value per $100 wagered
 *
 * EV = (P(win) × Payout) - (P(loss) × Stake)
 */
export function expectedValue(trueProbability: number, americanOdds: number): number {
    const decimalOdds = toDecimalOdds(americanOdds);
    const pWin = trueProbability;
    const pLoss = 1 - pWin;
    const payout = (decimalOdds - 1) * 100; // profit on $100 bet
    const stake = 100;

    return (pWin * payout) - (pLoss * stake);
}

/**
 * Calculate pitcher edge factor
 * Compares each pitcher's ERA to league average (4.30 in 2024)
 * Returns -1 to +1 where positive = home pitcher advantage
 */
export function pitcherEdgeFactor(homeERA: number | undefined, awayERA: number | undefined): number {
    const leagueAvgERA = 4.30;
    const homeAdj = homeERA !== undefined ? (leagueAvgERA - homeERA) / leagueAvgERA : 0;
    const awayAdj = awayERA !== undefined ? (leagueAvgERA - awayERA) / leagueAvgERA : 0;

    // Positive = home pitcher is better than away pitcher
    return Math.max(-1, Math.min(1, (homeAdj - awayAdj) * 0.8));
}

/**
 * Calculate Run Line value
 * Sometimes the ML is overpriced and the RL offers better EV
 * This is common for heavy favorites where ML is -200+ but RL -1.5 is -120
 */
function calculateRunLineEV(
    trueProbability: number,
    mlOdds: number,
    rlOdds: number | undefined,
): { isValueRL: boolean; rlEV: number | undefined } {
    if (rlOdds === undefined) return { isValueRL: false, rlEV: undefined };

    // For run line, adjust probability (covering -1.5 is harder)
    // Historical MLB data: favorites cover -1.5 about 60% of the time when they win
    const rlCoverRate = 0.60;
    const rlTrueProb = trueProbability * rlCoverRate;

    const mlEV = expectedValue(trueProbability, mlOdds);
    const rlEV = expectedValue(rlTrueProb, rlOdds);

    return {
        isValueRL: rlEV > mlEV && rlEV > 0,
        rlEV,
    };
}

// ═══════════════════════════════════════════
// Main Analysis Function
// ═══════════════════════════════════════════

/**
 * Full statistical edge analysis for a game
 */
export function analyzeEdge(
    home: TeamProfile,
    away: TeamProfile,
    odds: OddsInput,
): EdgeReport {
    const factors: string[] = [];

    // ── Step 1: Calculate ELO ratings ──
    const rawHomeELO = calculateELO(home.wins, home.losses, home.recentForm);
    const rawAwayELO = calculateELO(away.wins, away.losses, away.recentForm);
    const homeELO = rawHomeELO + HOME_ELO_BOOST; // home field advantage
    const awayELO = rawAwayELO;

    // ── Step 2: Calculate true probabilities ──
    const homeWinPct = home.wins / Math.max(1, home.wins + home.losses);
    const awayWinPct = away.wins / Math.max(1, away.wins + away.losses);

    const log5Prob = log5Probability(homeWinPct, awayWinPct);
    const eloProb = eloToWinProb(homeELO, awayELO);
    const pitcherEdge = pitcherEdgeFactor(home.pitcherERA, away.pitcherERA);

    const homeTrueProb = compositeProbability(log5Prob, eloProb, true, pitcherEdge);
    const awayTrueProb = 1 - homeTrueProb;

    // ── Step 3: Compare to implied probabilities ──
    const homeImpliedRaw = impliedProbability(odds.homeML);
    const awayImpliedRaw = impliedProbability(odds.awayML);
    const devigged = removeVig(homeImpliedRaw, awayImpliedRaw);

    const homeEdge = homeTrueProb - devigged.home;
    const awayEdge = awayTrueProb - devigged.away;

    // ── Step 4: Calculate EV and Kelly ──
    const homeEV = expectedValue(homeTrueProb, odds.homeML);
    const awayEV = expectedValue(awayTrueProb, odds.awayML);
    const homeKelly = kellyCriterion(homeTrueProb, odds.homeML);
    const awayKelly = kellyCriterion(awayTrueProb, odds.awayML);

    // ── Step 5: Run Line analysis ──
    const homeRLOdds = home.isHome ? odds.spreadHomeOdds : odds.spreadAwayOdds;
    const awayRLOdds = away.isHome ? odds.spreadHomeOdds : odds.spreadAwayOdds;
    const homeRL = calculateRunLineEV(homeTrueProb, odds.homeML, homeRLOdds);
    const awayRL = calculateRunLineEV(awayTrueProb, odds.awayML, awayRLOdds);

    // ── Step 6: Build recommendation ──
    let pick: 'home' | 'away' | 'pass' = 'pass';
    let pickTeam = '';
    let pickType: 'ML' | 'RL' = 'ML';
    let edgePct = 0;
    let kellyUnits = 0;
    let evPerUnit = 0;
    let confidence = 0;
    let runLineValue = false;
    let runLineEV: number | undefined;

    // Pick the side with the best edge
    if (homeEdge > awayEdge && homeEdge >= MIN_EDGE_THRESHOLD) {
        pick = 'home';
        pickTeam = home.name;
        edgePct = homeEdge;
        kellyUnits = Math.max(0.5, Math.min(5, Math.round(homeKelly * 20 * 2) / 2)); // 0.5u increments, max 5u
        evPerUnit = homeEV;

        if (homeRL.isValueRL) {
            pickType = 'RL';
            runLineValue = true;
            runLineEV = homeRL.rlEV;
            factors.push(`📐 Run Line (-1.5) offers better EV than Moneyline`);
        }
    } else if (awayEdge >= MIN_EDGE_THRESHOLD) {
        pick = 'away';
        pickTeam = away.name;
        edgePct = awayEdge;
        kellyUnits = Math.max(0.5, Math.min(5, Math.round(awayKelly * 20 * 2) / 2));
        evPerUnit = awayEV;

        if (awayRL.isValueRL) {
            pickType = 'RL';
            runLineValue = true;
            runLineEV = awayRL.rlEV;
            factors.push(`📐 Run Line (+1.5) offers better EV than Moneyline`);
        }
    }

    // Confidence: 0-100 based on edge size, ELO gap, and probability agreement
    if (pick !== 'pass') {
        const edgeConfidence = Math.min(40, edgePct * 400);        // max 40pts from edge
        const eloConfidence = Math.min(25, Math.abs(homeELO - awayELO) / 4); // max 25pts from ELO gap
        const probAgreement = 1 - Math.abs(log5Prob - eloProb);   // how much signals agree
        const agreementConfidence = probAgreement * 20;            // max 20pts
        const pitcherConfidence = Math.abs(pitcherEdge) * 15;     // max 15pts

        confidence = Math.min(95, Math.max(30, Math.round(
            edgeConfidence + eloConfidence + agreementConfidence + pitcherConfidence
        )));
    }

    // ── Step 7: Build factors list ──
    if (Math.abs(homeELO - awayELO) > 40) {
        const stronger = homeELO > awayELO ? home.name : away.name;
        factors.push(`🏆 ${stronger} has significant ELO advantage (${Math.abs(homeELO - awayELO)} pts)`);
    }

    const homeFormWins = home.recentForm.slice(0, 5).filter(r => r === 'W').length;
    const awayFormWins = away.recentForm.slice(0, 5).filter(r => r === 'W').length;
    if (Math.abs(homeFormWins - awayFormWins) >= 3) {
        const hotter = homeFormWins > awayFormWins ? home.name : away.name;
        const record = homeFormWins > awayFormWins ? homeFormWins : awayFormWins;
        factors.push(`🔥 ${hotter} is ${record}-${5 - record} in last 5 (momentum advantage)`);
    }

    if (Math.abs(pitcherEdge) > 0.3) {
        const betterArm = pitcherEdge > 0 ? home : away;
        if (betterArm.pitcherName && betterArm.pitcherERA) {
            factors.push(`⚾ Pitching edge: ${betterArm.pitcherName} (${betterArm.pitcherERA.toFixed(2)} ERA)`);
        }
    }

    if (pick !== 'pass' && edgePct > 0.05) {
        factors.push(`💰 ${(edgePct * 100).toFixed(1)}% edge over the sportsbook implied line`);
    }

    const vigPct = ((homeImpliedRaw + awayImpliedRaw - 1) * 100).toFixed(1);
    factors.push(`📊 Book vig: ${vigPct}% overround`);

    // ── Step 8: Generate summary ──
    const summary = generateSummary({
        pick, pickTeam, pickType, homeELO, awayELO,
        homeTrueProb, awayTrueProb, homeEdge, awayEdge,
        homeEV, awayEV, kellyUnits, edgePct, confidence,
        home, away, odds, runLineValue, runLineEV,
    });

    return {
        homeELO, awayELO, eloDelta: homeELO - awayELO,
        homeTrueProb, awayTrueProb,
        homeImpliedProb: devigged.home, awayImpliedProb: devigged.away,
        homeEdge, awayEdge,
        homeEV, awayEV,
        homeKelly, awayKelly,
        pick, pickTeam, pickType, confidence, edgePct, kellyUnits, evPerUnit,
        runLineValue, runLineEV,
        factors,
        summary,
    };
}

// ═══════════════════════════════════════════
// Summary Generator
// ═══════════════════════════════════════════

function generateSummary(data: {
    pick: string; pickTeam: string; pickType: string;
    homeELO: number; awayELO: number;
    homeTrueProb: number; awayTrueProb: number;
    homeEdge: number; awayEdge: number;
    homeEV: number; awayEV: number;
    kellyUnits: number; edgePct: number; confidence: number;
    home: TeamProfile; away: TeamProfile;
    odds: OddsInput;
    runLineValue: boolean; runLineEV?: number;
}): string {
    const lines: string[] = [];

    lines.push(`STATISTICAL EDGE REPORT`);
    lines.push(`═══════════════════════`);
    lines.push(``);

    // ELO
    lines.push(`ELO Ratings: ${data.home.name} ${data.homeELO} | ${data.away.name} ${data.awayELO}`);
    lines.push(``);

    // Probabilities
    lines.push(`True Probability:`);
    lines.push(`  ${data.home.name}: ${(data.homeTrueProb * 100).toFixed(1)}%`);
    lines.push(`  ${data.away.name}: ${(data.awayTrueProb * 100).toFixed(1)}%`);
    lines.push(``);

    // Book comparison
    const homeImp = impliedProbability(data.odds.homeML);
    const awayImp = impliedProbability(data.odds.awayML);
    lines.push(`Book Implied (with vig):`);
    lines.push(`  ${data.home.name}: ${(homeImp * 100).toFixed(1)}% (${data.odds.homeML > 0 ? '+' : ''}${data.odds.homeML})`);
    lines.push(`  ${data.away.name}: ${(awayImp * 100).toFixed(1)}% (${data.odds.awayML > 0 ? '+' : ''}${data.odds.awayML})`);
    lines.push(``);

    // Edge
    lines.push(`Edge Detection:`);
    lines.push(`  ${data.home.name}: ${data.homeEdge > 0 ? '+' : ''}${(data.homeEdge * 100).toFixed(1)}% ${data.homeEdge > MIN_EDGE_THRESHOLD ? '✅ VALUE' : '❌ No edge'}`);
    lines.push(`  ${data.away.name}: ${data.awayEdge > 0 ? '+' : ''}${(data.awayEdge * 100).toFixed(1)}% ${data.awayEdge > MIN_EDGE_THRESHOLD ? '✅ VALUE' : '❌ No edge'}`);
    lines.push(``);

    // EV
    lines.push(`Expected Value (per $100):`);
    lines.push(`  ${data.home.name} ML: ${data.homeEV > 0 ? '+' : ''}$${data.homeEV.toFixed(2)}`);
    lines.push(`  ${data.away.name} ML: ${data.awayEV > 0 ? '+' : ''}$${data.awayEV.toFixed(2)}`);
    if (data.runLineValue && data.runLineEV !== undefined) {
        lines.push(`  ${data.pickTeam} RL: +$${data.runLineEV.toFixed(2)} ⬆️ BETTER VALUE`);
    }
    lines.push(``);

    // Recommendation
    if (data.pick === 'pass') {
        lines.push(`RECOMMENDATION: PASS — No edge detected on either side.`);
    } else {
        lines.push(`RECOMMENDATION: ${data.pickTeam} ${data.pickType}`);
        lines.push(`  Edge: ${(data.edgePct * 100).toFixed(1)}%`);
        lines.push(`  Kelly Units: ${data.kellyUnits}u`);
        lines.push(`  Confidence: ${data.confidence}%`);
        lines.push(`  EV/unit: ${data.homeEV > data.awayEV ? '+' : ''}$${(data.pick === 'home' ? data.homeEV : data.awayEV).toFixed(2)}`);
    }

    return lines.join('\n');
}
