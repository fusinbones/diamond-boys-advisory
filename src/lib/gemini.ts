import { GoogleGenAI } from '@google/genai';

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

export async function analyzeGame(context: GameContext): Promise<string> {
    const ai = getClient();

    const prompt = `You are an elite MLB sports analyst for Diamond Boys Advisory, a premium sports picks service. Analyze this game and provide actionable insights.

## Game Data
- **Matchup**: ${context.awayTeam} @ ${context.homeTeam}
- **Date**: ${context.gameDate}

${context.odds ? `## Odds
- Moneyline: Home ${context.odds.moneyline?.home || 'N/A'} / Away ${context.odds.moneyline?.away || 'N/A'}
- Spread: ${context.odds.spread?.line || 'N/A'}
- Total: ${context.odds.total?.line || 'N/A'}` : '## Odds\nNot available for this game.'}

## ${context.homeTeam} (Home)
${context.homeStats ? `- 13-Game Alt%: ${context.homeStats.altPct || 'N/A'}%
- Overall Alt%: ${context.homeStats.overallAltPct || 'N/A'}%
- Current Alt Streak: ${context.homeStats.currentAltStreak || 0}
- Longest Alt Run: ${context.homeStats.longestAltRun || 0}
- Currently Alternating: ${context.homeStats.isCurrentlyAlternating ? 'YES' : 'NO'}
- Pattern Predicts Next: ${context.homeStats.predictedNext || 'N/A'}
- Current Streak: ${context.homeStats.currentStreak || 'N/A'}
- Recent W/L: ${context.homeStats.recentSequence || 'N/A'}` : 'Stats not available.'}

## ${context.awayTeam} (Away)
${context.awayStats ? `- 13-Game Alt%: ${context.awayStats.altPct || 'N/A'}%
- Overall Alt%: ${context.awayStats.overallAltPct || 'N/A'}%
- Current Alt Streak: ${context.awayStats.currentAltStreak || 0}
- Longest Alt Run: ${context.awayStats.longestAltRun || 0}
- Currently Alternating: ${context.awayStats.isCurrentlyAlternating ? 'YES' : 'NO'}
- Pattern Predicts Next: ${context.awayStats.predictedNext || 'N/A'}
- Current Streak: ${context.awayStats.currentStreak || 'N/A'}
- Recent W/L: ${context.awayStats.recentSequence || 'N/A'}` : 'Stats not available.'}

${context.pitchers ? `## Starting Pitchers
- Home: ${context.pitchers.home?.name || 'TBD'} (ERA: ${context.pitchers.home?.era || 'N/A'}, WHIP: ${context.pitchers.home?.whip || 'N/A'})
- Away: ${context.pitchers.away?.name || 'TBD'} (ERA: ${context.pitchers.away?.era || 'N/A'}, WHIP: ${context.pitchers.away?.whip || 'N/A'})` : ''}

## Instructions
Provide a concise, structured analysis in this exact format:

**EDGE RATING**: [1-10, where 10 = strongest edge]

**RECOMMENDED PICK**: [team name] [pick type: ML/RL/O/U] [if applicable: line]

**KEY FACTORS**:
1. [Most important factor]
2. [Second factor]
3. [Third factor]

**ALTERNATION INSIGHT**: [1-2 sentences about how the W/L alternation pattern affects this pick]

**RISK ASSESSMENT**: [Low/Medium/High] — [1 sentence why]

**BOTTOM LINE**: [1-2 sentences of the final recommendation in confident, direct language]

Be direct and confident. No hedging. Diamond Boys gives SHARP picks, not wishy-washy takes.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text || 'Analysis unavailable.';
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

    const prompt = `You are the lead analyst for Diamond Boys Advisory. Write a concise, sharp 1-2 sentence reason for this pick.

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
        fullPrompt += msg.role === 'user' ? `User: ${msg.text}\n` : `Diamond: ${msg.text}\n`;
    }
    fullPrompt += `\nUser: ${userMessage}\n\nRespond as Diamond:`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
    });

    return response.text || "I'm having trouble processing that right now. Try again in a sec! ⚾";
}
