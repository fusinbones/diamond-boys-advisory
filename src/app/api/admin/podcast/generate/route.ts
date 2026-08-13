import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

function getAI() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY not configured');
    return new GoogleGenAI({ apiKey: key });
}

export async function POST() {
    try {
        // Get today's fire picks (scheduled or graded)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const { data: picks, error } = await supabaseAdmin
            .from('fire_picks')
            .select('*')
            .gte('scheduled_at', todayStart.toISOString())
            .lte('scheduled_at', todayEnd.toISOString())
            .order('scheduled_at', { ascending: true });

        if (error) throw error;
        if (!picks || picks.length === 0) {
            return NextResponse.json({ error: 'No fire picks found for today' }, { status: 404 });
        }

        // Get the overall fire pick record for context
        const { data: allPicks } = await supabaseAdmin
            .from('fire_picks')
            .select('result, status')
            .in('status', ['won', 'lost', 'push']);

        const wins = allPicks?.filter(p => p.status === 'won').length || 0;
        const losses = allPicks?.filter(p => p.status === 'lost').length || 0;
        const record = wins + '-' + losses;
        const winPct = (wins + losses) > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : '0';

        // Build pick summaries
        const pickSummaries = picks.map((p, i) => {
            const lines = [
                'Pick ' + (i + 1) + ':',
                '- Matchup: ' + p.matchup,
                '- Pick: ' + p.pick_team + ' ' + p.pick_type + ' ' + p.pick_value,
                '- Odds: ' + (p.odds || 'TBD'),
                '- Confidence: ' + (p.confidence || 85) + '%',
                '- Units: ' + (p.units || 3) + 'u',
            ];
            if (p.reasoning) lines.push('- Expert reasoning: ' + p.reasoning);
            return lines.join('\n');
        }).join('\n\n');

        const ai = getAI();

        const prompt = `You are a professional sports podcast writer for "The FirePick Podcast" by YourSwami Sports Advisory. Your job is to create a COMPREHENSIVE knowledge base document that a NotebookLM AI podcast host can use to generate an engaging 5-10 minute audio episode.

CRITICAL RULES:
1. Do NOT mention "alternation patterns," "W/L pattern systems," "pattern breaks," "game 7 sweet spot," or any algorithmic/pattern methodology. This is PROPRIETARY and must stay hidden.
2. Instead, frame all analysis around: team momentum, pitching matchups, statistical edges, odds value, historical trends, situational analysis, and expert conviction.
3. Make it sound like EXPERT sports analysis — think ESPN insider meets quant analyst.
4. Include personality, banter prompts, and storytelling angles to make it entertaining.
5. Write for a general audience of sports bettors who want sharp, actionable insights.

## TODAY'S SLATE
Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
Number of Fire Picks: ${picks.length}
Season Record: ${record} (${winPct}% win rate)

## PICKS DATA
${pickSummaries}

## DOCUMENT FORMAT
Create a knowledge base document with the following sections. Write it in a way that NotebookLM can turn into natural, conversational podcast content:

### 1. SHOW OPEN (100-150 words)
Write an energetic intro for the hosts. Reference the date, how many picks are on the slate, and the season record. Include a hook that makes listeners want to stay. Mention YourSwami by name.

### 2. SEASON MOMENTUM CHECK (100-150 words)
Talk about how the ${record} record translates to real results. Frame it as a track record segment. Reference the win percentage. Build credibility without revealing methodology.

### 3. PICK BREAKDOWNS (200-300 words per pick)
For EACH pick, write a detailed breakdown that includes:
- The matchup and what makes it interesting
- Why ${picks.map(p => p.pick_team).join(' / ')} is the play
- The odds value angle (are we getting a good price?)
- The confidence level and what it means for bet sizing
- A "gut check" — what could go wrong (shows honesty)
- A memorable one-liner the host can use

Frame the analysis around:
- Team form and momentum (hot/cold streaks)
- Pitching matchup advantages
- Statistical edges the market may be missing
- Situational factors (travel, rest, divisional rivalry, etc.)

### 4. BEST BET OF THE DAY (100-150 words)
Identify which pick has the highest confidence and explain why it's the "lock" of the day. Make it punchy and quotable.

### 5. RISK MANAGEMENT CORNER (100-150 words)
Quick segment on proper bankroll management. Reference the unit sizing for each pick. Remind listeners this is about long-term edge, not gambling. Professional tone.

### 6. SHOW CLOSE (75-100 words)
Wrap up with energy. Remind listeners about the picks, where to find YourSwami (tripleplayz.com), and tease tomorrow's slate.

Write the ENTIRE document now. Make it THOROUGH — NotebookLM needs density to create a great podcast. Target 1500-2500 words total.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const podcastContent = response.text || 'Failed to generate podcast content.';

        return NextResponse.json({
            content: podcastContent,
            picks: picks.map(p => ({
                id: p.id,
                matchup: p.matchup,
                pick_team: p.pick_team,
                pick_type: p.pick_type,
                pick_value: p.pick_value,
                odds: p.odds,
                confidence: p.confidence,
            })),
            record,
            winPct,
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Podcast generation error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Generation failed' },
            { status: 500 }
        );
    }
}
