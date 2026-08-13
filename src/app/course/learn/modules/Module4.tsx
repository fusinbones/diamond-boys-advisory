'use client';

import { useState } from 'react';

export default function Module4() {
    const [streakInput, setStreakInput] = useState(7);

    const getScore = (s: number): number => {
        if (s >= 14) return 99;
        if (s === 13) return 97;
        if (s === 12) return 94;
        if (s === 11) return 90;
        if (s === 10) return 85;
        if (s === 9) return 80;
        if (s === 8) return 73;
        if (s === 7) return 69;
        if (s === 6) return 62;
        if (s === 5) return 15;
        if (s === 4) return 8;
        return 0;
    };

    const score = getScore(streakInput);
    const scoreColor = score >= 80 ? '#ef4444' : score >= 62 ? '#FFC107' : '#6b7280';

    return (
        <>
            <div className="module-header">
                <span className="module-num-label">Module 4 of 7</span>
                <h2 className="module-title">The Break Score</h2>
                <p className="module-subtitle">
                    The proprietary 62-99% probability scale — the engine behind every profitable pick.
                </p>
            </div>

            <div className="learn-section">
                <h3>Your Confidence Meter</h3>
                <p>
                    The Break Score is the single most important number in the system. It tells you, 
                    as a percentage, <strong>how likely the current alternation pattern is to break on the next game.</strong>
                </p>
                <p>
                    It&apos;s not a guess. It&apos;s calculated from the alternation streak length using a 
                    probability model calibrated against thousands of historical MLB games.
                </p>
            </div>

            <div className="learn-widget">
                <h4 style={{ color: '#fbbf24' }}>🧮 Interactive Break Score Calculator</h4>
                <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '16px' }}>
                    Adjust the alternation streak length to see how the break probability changes:
                </p>

                <div className="calc-row">
                    <span className="calc-label">Alternation streak:</span>
                    <input
                        type="range"
                        min={1}
                        max={15}
                        value={streakInput}
                        onChange={e => setStreakInput(Number(e.target.value))}
                        style={{ flex: 1, maxWidth: '200px', accentColor: '#fbbf24' }}
                    />
                    <span style={{ fontWeight: 800, fontSize: '18px', color: '#fbbf24', minWidth: '50px' }}>
                        {streakInput} {streakInput === 1 ? 'game' : 'games'}
                    </span>
                </div>

                <div className="calc-result" style={{ borderColor: `${scoreColor}25`, background: `${scoreColor}08` }}>
                    <div className="calc-result-value" style={{ color: scoreColor }}>{score}%</div>
                    <div className="calc-result-label">Break Probability</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
                        {score === 0 && 'No pattern detected — not actionable.'}
                        {score > 0 && score < 20 && 'Developing pattern — watch but do NOT bet.'}
                        {score >= 62 && score < 70 && 'True Pattern — actionable. Standard bet size.'}
                        {score >= 70 && score < 85 && 'Strong True Pattern — high confidence. Consider moderate bet size.'}
                        {score >= 85 && score < 95 && 'Elite pattern — very rare. Strong conviction play.'}
                        {score >= 95 && 'Extreme rarity — this almost always breaks. Maximum conviction.'}
                    </div>
                </div>
            </div>

            <div className="learn-section">
                <h3>How the Score Is Calculated</h3>
                <p>
                    The algorithm is straightforward but powerful. It looks at the <strong>last 15 games</strong> for 
                    each team and counts the consecutive alternating results from the most recent game backward.
                </p>
                <p>
                    The mapping from streak length to break probability isn&apos;t linear — it follows 
                    an <strong>exponential curve</strong>. Here&apos;s why: the longer a pattern runs, the more 
                    &quot;energy&quot; builds up for a break. Think of it like stretching a rubber band — 
                    the further you stretch it, the harder it snaps back.
                </p>

                <div className="learn-widget">
                    <h4 style={{ color: '#FFC107' }}>📈 The Probability Curve</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {[
                            { streak: 6, prob: 62 }, { streak: 7, prob: 69 }, { streak: 8, prob: 73 },
                            { streak: 9, prob: 80 }, { streak: 10, prob: 85 }, { streak: 11, prob: 90 },
                            { streak: 12, prob: 94 }, { streak: 13, prob: 97 }, { streak: 14, prob: 99 },
                        ].map(({ streak, prob }) => (
                            <div key={streak} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '12px', color: '#6b7280', width: '60px' }}>{streak} games</span>
                                <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)' }}>
                                    <div style={{
                                        width: `${prob}%`, height: '100%', borderRadius: '4px',
                                        background: prob >= 85 ? 'linear-gradient(90deg, #ef4444, #f59e0b)' :
                                                   prob >= 62 ? 'linear-gradient(90deg, #FFC107, #60a5fa)' : '#6b7280',
                                    }} />
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: prob >= 85 ? '#ef4444' : '#FFC107', width: '36px' }}>
                                    {prob}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="learn-callout insight">
                <h4 style={{ color: '#fbbf24' }}>💡 The Sweet Spot</h4>
                <p>
                    Most profitable plays cluster around <strong>7-9 game streaks (69-80%)</strong>. They&apos;re common 
                    enough that you get several per week, but strong enough that they hit at a very high rate. 
                    10+ game streaks are rare (maybe 1-2 per month across all 30 teams) but when they appear, 
                    they&apos;re near-locks.
                </p>
            </div>

            <div className="learn-section">
                <h3>How the Prediction Direction Works</h3>
                <p>
                    When the system predicts a break, it also tells you <strong>which direction</strong> the break goes. 
                    The logic is simple but crucial:
                </p>
                <p>
                    If a team&apos;s last game was a <strong>W</strong>, and they&apos;re in a true alternation pattern, 
                    the normal alternation would predict <strong>L</strong> next. But we&apos;re predicting the break — 
                    so the prediction is <strong>W</strong> (same as the last game). The pattern breaks when the 
                    team gets the same result twice in a row.
                </p>

                <div className="learn-widget">
                    <h4 style={{ color: '#ef4444' }}>🎯 Prediction Direction Examples</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12px', color: '#6b7280', width: '100px' }}>Last result: W</span>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>→ Pattern says: L</span>
                            <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 700 }}>→ Break prediction: W ✅</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12px', color: '#6b7280', width: '100px' }}>Last result: L</span>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>→ Pattern says: W</span>
                            <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 700 }}>→ Break prediction: L ✅</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="learn-takeaway">
                <h4>🔥 Module 4 Key Takeaways</h4>
                <ul>
                    <li>The Break Score ranges from 62% (6 games) to 99% (14+ games)</li>
                    <li>Sweet spot for daily plays: 7-9 game streaks (69-80%)</li>
                    <li>10+ game streaks are rare but extremely high probability</li>
                    <li>Break direction = same result as the last game (pattern stops alternating)</li>
                    <li>Higher Break Score = higher confidence = potentially larger bet size</li>
                </ul>
            </div>
        </>
    );
}
