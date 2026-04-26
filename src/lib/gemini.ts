import { GoogleGenAI } from '@google/genai';
import type { EdgeReport } from '@/lib/stat-engine';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function getClient() {
    if (!GEMINI_API_KEY) throw new Error('Algorithm API key not configured');
    return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// ═══════════════════════════════════════════
// Odds Analysis
// ═══════════════════════════════════════════

interface GameContext {
    awayTeam: string;
    homeTeam: string;
    gameDate: string;
    odds?: {
        moneyline?: { home: number; away: number };
        spread?: { line: number; homeOdds: number; awayOdds: number };
        total?: { line: number; overOdds: number; underOdds: number };
    };
    homeStats?: {
        record?: string;
        altPct?: number;
        longestAltRun?: number;
        currentAltStreak?: number;
        isCurrentlyAlternating?: boolean;
        predictedNext?: string;
        overallAltPct?: number;
        currentStreak?: string;
        recentSequence?: string;
    };
    awayStats?: {
        record?: string;
        altPct?: number;
        longestAltRun?: number;
        currentAltStreak?: number;
        isCurrentlyAlternating?: boolean;
        predictedNext?: string;
        overallAltPct?: number;
        currentStreak?: string;
        recentSequence?: string;
    };
    pitchers?: {
        home?: { name: string; era?: number; whip?: number; record?: string };
        away?: { name: string; era?: number; whip?: number; record?: string };
    };
}

export async function analyzeGame(context: GameContext & { engine?: 'stats' | 'pattern'; edgeReport?: EdgeReport }): Promise<string> {
    if (context.engine === 'stats') {
        if (context.edgeReport) {
            return analyzeGameStats(context, context.edgeReport);
        }
        return 'Statistical analysis unavailable — edge report could not be generated.';
    }
    if (context.engine === 'pattern') {
        return analyzeGamePattern(context);
    }
    return analyzeGamePattern(context);
}

/**
 * ENGINE 1: Statistical Edge Analysis
 * NO pattern/alternation data — purely stats, odds, and math.
 */
async function analyzeGameStats(context: GameContext, edge: EdgeReport): Promise<string> {
    const ai = getClient();

    const homeForm = context.homeStats?.recentSequence || 'N/A';
    const awayForm = context.awayStats?.recentSequence || 'N/A';
    const homeStreak = context.homeStats?.currentStreak || 'N/A';
    const awayStreak = context.awayStats?.currentStreak || 'N/A';

    // Build factors list using concatenation (not nested template literals)
    const factorsList = edge.factors.map((f, i) => (i + 1) + '. ' + f).join('\n');

    // Build odds section
    let oddsSection = 'Odds not available — model used default -110/-110 pick-em lines.';
    if (context.odds) {
        const ml = context.odds.moneyline;
        const sp = context.odds.spread;
        const tot = context.odds.total;
        oddsSection = '- Moneyline: Home ' + (ml?.home || 'N/A') + ' / Away ' + (ml?.away || 'N/A');
        if (sp) oddsSection += '\n- Run Line: ' + (sp.line || 'N/A') + ' (Home ' + (sp.homeOdds || 'N/A') + ' / Away ' + (sp.awayOdds || 'N/A') + ')';
        if (tot) oddsSection += '\n- Total: O/U ' + (tot.line || 'N/A') + ' (Over ' + (tot.overOdds || 'N/A') + ' / Under ' + (tot.underOdds || 'N/A') + ')';
    }

    // Build pitcher section
    let pitcherSection = 'Starting pitchers not yet announced.';
    if (context.pitchers) {
        const hp = context.pitchers.home;
        const ap = context.pitchers.away;
        pitcherSection = '- Home: ' + (hp?.name || 'TBD') + ' (ERA: ' + (hp?.era || 'N/A') + ', WHIP: ' + (hp?.whip || 'N/A') + ')';
        pitcherSection += '\n- Away: ' + (ap?.name || 'TBD') + ' (ERA: ' + (ap?.era || 'N/A') + ', WHIP: ' + (ap?.whip || 'N/A') + ')';
    }

    // Run Line EV line
    const rlLine = edge.runLineValue && edge.runLineEV !== undefined
        ? '- Run Line: ' + edge.pickTeam + ' RL EV = $' + edge.runLineEV.toFixed(2) + ' BETTER VALUE'
        : '- Run Line: No additional value over ML';

    const prompt = `You are an elite quantitative sports analyst for TriplePlayz — a premium sports advisory that uses mathematics, not gut feelings. You have been given the complete output of our proprietary statistical model. Your job is to write a DEEP, DATA-RICH analysis.

CRITICAL RULE: Do NOT mention alternation patterns, W/L patterns, or pattern breaks. This is PURELY statistical and odds-based analysis. Focus on: team strength, pitcher matchups, odds value, momentum, home/away splits, and expected value.

## RAW STATISTICAL MODEL OUTPUT
${edge.summary}

## MODEL FACTORS
${factorsList}

## GAME CONTEXT
**Matchup**: ${context.awayTeam} @ ${context.homeTeam}
**Date**: ${context.gameDate}

### Team Records & Form
- ${context.homeTeam} (Home): Recent: ${homeForm} | Streak: ${homeStreak}
- ${context.awayTeam} (Away): Recent: ${awayForm} | Streak: ${awayStreak}

### Odds Market
${oddsSection}

### Starting Pitchers
${pitcherSection}

### Model Calculations
- Home ELO: ${edge.homeELO} | Away ELO: ${edge.awayELO} | Delta: ${edge.eloDelta > 0 ? '+' : ''}${edge.eloDelta}
- Home True Probability: ${(edge.homeTrueProb * 100).toFixed(1)}%
- Away True Probability: ${(edge.awayTrueProb * 100).toFixed(1)}%
- Home Book Implied: ${(edge.homeImpliedProb * 100).toFixed(1)}%
- Away Book Implied: ${(edge.awayImpliedProb * 100).toFixed(1)}%
- Home Edge: ${(edge.homeEdge * 100).toFixed(1)}% | Away Edge: ${(edge.awayEdge * 100).toFixed(1)}%
- Home EV per $100: $${edge.homeEV.toFixed(2)} | Away EV per $100: $${edge.awayEV.toFixed(2)}
- Kelly Home: ${(edge.homeKelly * 100).toFixed(2)}% | Kelly Away: ${(edge.awayKelly * 100).toFixed(2)}%
- Run Line Better Value: ${edge.runLineValue ? 'YES' : 'NO'}
- Model Pick: ${edge.pickTeam || 'PASS'} ${edge.pickType} | Confidence: ${edge.confidence}%

## ANALYSIS FORMAT
Write a comprehensive analysis using ALL of this data. Use this EXACT format:

**MODEL VERDICT**: [STRONG BET / LEAN / PASS] — [1 sentence summary]

**ELO BREAKDOWN**:
[Compare both teams ELO ratings. Explain what the delta means in terms of team quality. Reference their records and recent form. 2-3 sentences.]

**PITCHER MATCHUP ANALYSIS**:
[If pitchers are available, analyze the matchup. Compare ERAs, WHIPs, and how they affect the models probability calculations. If TBD, note the uncertainty factor. 2-3 sentences.]

**ODDS VALUE DETECTION**:
[Explain the gap between our true probability and the books implied probability. Show exactly where the book has it wrong and by how much. Reference the vig/overround. 2-3 sentences.]

**EXPECTED VALUE BREAKDOWN**:
- Moneyline: ${context.homeTeam} EV = $${edge.homeEV.toFixed(2)} | ${context.awayTeam} EV = $${edge.awayEV.toFixed(2)}
${rlLine}
[1-2 sentences interpreting what these EV numbers mean for the bettor]

**RECOMMENDED PLAY**: [Team] [ML/RL] at [odds] — [X]u
[1 sentence on why this specific play type (ML vs RL) is optimal]

**RISK FACTORS**:
1. [Biggest risk to this play]
2. [Secondary concern]
3. [Wild card factor]

**SHARP MONEY SIGNAL**: [Is the line likely to move? Based on the edge size, which direction should we expect line movement? 1-2 sentences.]

**BOTTOM LINE**: [2-3 sentences. Be confident, reference specific numbers. Tell the admin exactly what to do and why. No hedging.]

Be DATA-HEAVY. Every claim must reference a specific number from the model. This is a quant desk — we trade on math, not feelings.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text || 'Statistical analysis unavailable.';
}

/**
 * ENGINE 2: Pattern Break Analysis
 * Focuses exclusively on W/L alternation patterns and the fire pick break system.
 */
async function analyzeGamePattern(context: GameContext): Promise<string> {
    const ai = getClient();

    const prompt = `You are the pattern analysis specialist for TriplePlayz - Sports Advisory. Your ONLY focus is the W/L alternation pattern system. This is a proprietary system where teams that alternate Win-Loss for 6+ consecutive games are predicted to BREAK the pattern (double up on the same result).

The sweet spot is Game 7 — historically 62% of patterns break at game 7.

## Game Data
- **Matchup**: ${context.awayTeam} @ ${context.homeTeam}
- **Date**: ${context.gameDate}

## ${context.homeTeam} (Home) Pattern Data
${context.homeStats ? `- Recent W/L Sequence: ${context.homeStats.recentSequence || 'N/A'}
- Current Alt Streak: ${context.homeStats.currentAltStreak || 0} games
- Currently Alternating: ${context.homeStats.isCurrentlyAlternating ? 'YES' : 'NO'}
- Pattern Predicts Next: ${context.homeStats.predictedNext || 'N/A'}
- Alt Percentage (15-game): ${context.homeStats.altPct || 'N/A'}%
- Longest Alt Run: ${context.homeStats.longestAltRun || 0}
- Current Streak: ${context.homeStats.currentStreak || 'N/A'}` : 'No pattern data available.'}

## ${context.awayTeam} (Away) Pattern Data
${context.awayStats ? `- Recent W/L Sequence: ${context.awayStats.recentSequence || 'N/A'}
- Current Alt Streak: ${context.awayStats.currentAltStreak || 0} games
- Currently Alternating: ${context.awayStats.isCurrentlyAlternating ? 'YES' : 'NO'}
- Pattern Predicts Next: ${context.awayStats.predictedNext || 'N/A'}
- Alt Percentage (15-game): ${context.awayStats.altPct || 'N/A'}%
- Longest Alt Run: ${context.awayStats.longestAltRun || 0}
- Current Streak: ${context.awayStats.currentStreak || 'N/A'}` : 'No pattern data available.'}

## Historical Break Probability Table
| Game | Break Prob |
|------|------------|
| 7    | 62%        |
| 8    | 69%        |
| 9    | 73%        |
| 10   | 80%        |
| 11   | 85%        |
| 12   | 90%        |
| 13   | 94%        |
| 14   | 97%        |
| 15   | 99%        |

## Instructions
Provide a PATTERN-FOCUSED analysis in this exact format:

**PATTERN STATUS**: [ACTIVE PATTERN / DEVELOPING / NO PATTERN]

**PATTERN DETAIL**: [Which team has the pattern? What game are they on? What does the history say?]

**BREAK PREDICTION**: [Team] predicted to [WIN/LOSE] next — Game [X] break (Y% historical probability)

**CONFLICT CHECK**: [Do both teams patterns agree or conflict? If both are alternating, which pattern is stronger?]

**FIRE PICK VERDICT**: [Is this a Fire Pick candidate? YES/NO and why in 1-2 sentences]

**BOTTOM LINE**: [1 confident sentence on the pattern play]

Focus ONLY on patterns. Do NOT analyze odds, pitching matchups, or traditional stats. This is purely the alternation system.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text || 'Pattern analysis unavailable.';
}

// ═══════════════════════════════════════════
// Pick Reason Generator
// ═══════════════════════════════════════════

export async function generatePickReason(pick: {
    awayTeam: string;
    homeTeam: string;
    pickTeam: string;
    pickType: string;
    gameDate: string;
    homeAltPct?: number;
    awayAltPct?: number;
    homeAlternating?: boolean;
    awayAlternating?: boolean;
}): Promise<string> {
    const ai = getClient();

    const prompt = `You are the lead analyst for TriplePlayz - Sports Advisory. Write a concise, sharp 1-2 sentence reason for this pick.

Pick: ${pick.pickTeam} ${pick.pickType}
Game: ${pick.awayTeam} @ ${pick.homeTeam} (${pick.gameDate})
${pick.homeAltPct ? `Home Alt%: ${pick.homeAltPct}%` : ''}
${pick.awayAltPct ? `Away Alt%: ${pick.awayAltPct}%` : ''}
${pick.homeAlternating ? 'Home team currently in alternation pattern.' : ''}
${pick.awayAlternating ? 'Away team currently in alternation pattern.' : ''}

Write the reason in 1-2 SHORT sentences. Be confident and analytical. Reference the alternation pattern if relevant. No fluff.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text || '';
}

// ═══════════════════════════════════════════
// General Content Generation
// ═══════════════════════════════════════════

export async function generateContent(prompt: string): Promise<string> {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text || '';
}

// ═══════════════════════════════════════════
// Discord Chat (for the bot)
// ═══════════════════════════════════════════

export async function chatWithGemini(
    systemPrompt: string,
    conversationHistory: { role: 'user' | 'model'; text: string }[],
    userMessage: string
): Promise<string> {
    const ai = getClient();

    // Build a single prompt with system context + conversation history
    let fullPrompt = systemPrompt + '\n\n## CONVERSATION HISTORY\n';
    for (const msg of conversationHistory) {
        fullPrompt += msg.role === 'user' ? `User: ${msg.text}\n` : `TriplePlayz: ${msg.text}\n`;
    }
    fullPrompt += `\nUser: ${userMessage}\n\nRespond as TriplePlayz:`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
    });

    return response.text || "I'm having trouble processing that right now. Try again in a sec! ⚾";
}
