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
    if (context.engine === 'stats' && context.edgeReport) {
        return analyzeGameStats(context, context.edgeReport);
    }
    if (context.engine === 'pattern') {
        return analyzeGamePattern(context);
    }
    // Default: run both and combine
    return analyzeGamePattern(context);
}

/**
 * ENGINE 1: Statistical Edge Analysis
 * Feeds stat-engine mathematical output into Gemini for natural language interpretation.
 */
async function analyzeGameStats(context: GameContext, edge: EdgeReport): Promise<string> {
    const ai = getClient();

    const prompt = `You are an elite quantitative sports analyst for TriplePlayz. You have been given the output of a statistical model that uses ELO ratings, Bill James' Log5 formula, Kelly Criterion, and Expected Value calculations. Your job is to interpret these numbers into a clear, actionable analysis.

## Raw Statistical Model Output
${edge.summary}

## Model Factors
${edge.factors.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## Game Context
- **Matchup**: ${context.awayTeam} @ ${context.homeTeam}
- **Date**: ${context.gameDate}
${context.odds ? `- Moneyline: Home ${context.odds.moneyline?.home || 'N/A'} / Away ${context.odds.moneyline?.away || 'N/A'}
- Run Line: ${context.odds.spread?.line || 'N/A'}
- Total: O/U ${context.odds.total?.line || 'N/A'}` : ''}
${context.pitchers ? `- Home SP: ${context.pitchers.home?.name || 'TBD'} (ERA: ${context.pitchers.home?.era || 'N/A'})
- Away SP: ${context.pitchers.away?.name || 'TBD'} (ERA: ${context.pitchers.away?.era || 'N/A'})` : ''}

## Instructions
Interpret the statistical model output into a clear analysis. Use this EXACT format:

**MODEL VERDICT**: [STRONG BET / LEAN / PASS]

**THE EDGE**: [1-2 sentences explaining WHERE the model found value and WHY the book has it wrong]

**RECOMMENDED PLAY**: [Team] [ML/RL] at [odds] — [units]u

**BY THE NUMBERS**:
- True Win Probability: [X]%
- Book Implied: [Y]%  
- Edge: [Z]%
- EV per $100: [+$X.XX]
- Kelly Optimal: [X]u

**RISK FACTOR**: [1 sentence on what could go wrong]

**BOTTOM LINE**: [1 confident sentence. No hedging.]

Be SHARP and DATA-DRIVEN. Reference specific numbers. This is a quant desk, not a talk show.`;

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
- Currently Alternating: ${context.homeStats.isCurrentlyAlternating ? 'YES ⚡' : 'NO'}
- Pattern Predicts Next: ${context.homeStats.predictedNext || 'N/A'}
- Alt Percentage (15-game): ${context.homeStats.altPct || 'N/A'}%
- Longest Alt Run: ${context.homeStats.longestAltRun || 0}
- Current Streak: ${context.homeStats.currentStreak || 'N/A'}` : 'No pattern data available.'}

## ${context.awayTeam} (Away) Pattern Data
${context.awayStats ? `- Recent W/L Sequence: ${context.awayStats.recentSequence || 'N/A'}
- Current Alt Streak: ${context.awayStats.currentAltStreak || 0} games
- Currently Alternating: ${context.awayStats.isCurrentlyAlternating ? 'YES ⚡' : 'NO'}
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

**PATTERN STATUS**: [🔥 ACTIVE PATTERN / 👀 DEVELOPING / ⚪ NO PATTERN]

**PATTERN DETAIL**: [Which team has the pattern? What game are they on? What does the history say?]

**BREAK PREDICTION**: [Team] predicted to [WIN/LOSE] next — Game [X] break (Y% historical probability)

**CONFLICT CHECK**: [Do both teams' patterns agree or conflict? If both are alternating, which pattern is stronger?]

**🔥 FIRE PICK VERDICT**: [Is this a Fire Pick candidate? YES/NO and why in 1-2 sentences]

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
