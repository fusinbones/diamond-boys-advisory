'use client';

export default function Module1() {
    return (
        <>
            <div className="module-header">
                <span className="module-num-label">Module 1 of 7</span>
                <h2 className="module-title">The Hidden Pattern</h2>
                <p className="module-subtitle">
                    Why MLB teams secretly alternate wins and losses — and how to spot it before anyone else.
                </p>
            </div>

            <div className="learn-section">
                <h3>The Discovery That Changes Everything</h3>
                <p>
                    Here&apos;s something the sportsbooks don&apos;t want you to know: <strong>MLB teams alternate between wins and losses far more often than random chance would predict.</strong>
                </p>
                <p>
                    Think about it. A team wins Monday, loses Tuesday, wins Wednesday, loses Thursday. 
                    W-L-W-L-W-L. This isn&apos;t random. It&apos;s a pattern — and it happens across all 30 MLB teams, 
                    all season long.
                </p>
                <p>
                    We call this <em>alternation</em>. When a team&apos;s recent results follow this W-L-W-L sequence 
                    for 6 or more consecutive games, something powerful happens: the probability that the 
                    pattern will <strong>break</strong> (the team gets the same result twice in a row) starts climbing dramatically.
                </p>
            </div>

            <div className="learn-widget">
                <h4 style={{ color: '#00e59b' }}>🔬 Live Example — True Alternation</h4>
                <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '16px' }}>
                    Watch how a real alternation pattern builds over 8 games:
                </p>
                <div className="learn-pattern-row">
                    {['W','L','W','L','W','L','W','L'].map((r, i) => (
                        <div key={i} className={`learn-dot ${r === 'W' ? 'w' : 'l'}`}>{r}</div>
                    ))}
                    <span style={{ color: '#fbbf24', fontWeight: 800, margin: '0 4px' }}>→</span>
                    <div className="learn-dot predict">?</div>
                </div>
                <p style={{ color: '#d1d5db', fontSize: '13px', marginTop: '12px' }}>
                    After 8 alternating results, the break probability is <strong style={{ color: '#fbbf24' }}>73%</strong>. 
                    The next result is predicted to be <strong style={{ color: '#ef4444' }}>W</strong> (same as the last), breaking the pattern.
                </p>
            </div>

            <div className="learn-section">
                <h3>Why Does This Happen?</h3>
                <p>
                    Alternation patterns aren&apos;t magic — they&apos;re driven by real baseball dynamics:
                </p>

                <div className="learn-steps">
                    <div className="learn-step">
                        <div className="learn-step-num">1</div>
                        <div className="learn-step-content">
                            <h5>Pitching Rotation Cycles</h5>
                            <p>Teams cycle through their starting rotation. After their ace pitches (likely W), the next day they send their 4th or 5th starter (likely L), then their #2 comes back (likely W).</p>
                        </div>
                    </div>
                    <div className="learn-step">
                        <div className="learn-step-num">2</div>
                        <div className="learn-step-content">
                            <h5>Travel Fatigue</h5>
                            <p>Teams fly between cities mid-series. Day 1 they&apos;re fresh (W), day 2 the travel catches up (L), day 3 they adjust (W). This creates natural alternation.</p>
                        </div>
                    </div>
                    <div className="learn-step">
                        <div className="learn-step-num">3</div>
                        <div className="learn-step-content">
                            <h5>Regression to the Mean</h5>
                            <p>After a big win, teams often let off the gas. After a tough loss, they come back motivated. This psychological cycle drives alternation across the league.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="learn-callout insight">
                <h4 style={{ color: '#fbbf24' }}>💡 Key Insight</h4>
                <p>
                    Alternation isn&apos;t about any single team being predictable. It&apos;s about the <strong>statistical reality</strong> that 
                    across 30 teams playing 162 games each, alternation patterns form constantly — and when they stretch 
                    to 6+ games, the break becomes a high-probability event.
                </p>
            </div>

            <div className="learn-section">
                <h3>The Pattern Lifecycle</h3>
                <p>Every alternation pattern goes through three stages:</p>

                <div className="learn-widget">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '24px' }}>🌱</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '14px', color: '#60a5fa' }}>Developing (4-5 games)</div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>Pattern is forming but not actionable yet. Break probability: 8-15%</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '24px' }}>🔥</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '14px', color: '#00e59b' }}>True Pattern (6+ games)</div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>Pattern is mature and actionable. Break probability: 62-99%</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '24px' }}>⚡</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '14px', color: '#fbbf24' }}>Break Event</div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>The team gets the same result twice in a row, ending the alternation.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="learn-callout success">
                <h4 style={{ color: '#00e59b' }}>✅ What You Need to Remember</h4>
                <p>
                    You&apos;re not predicting who will win or lose. You&apos;re predicting that the <strong>alternation pattern 
                    will break</strong>. That&apos;s a fundamentally different (and more accurate) prediction than trying to 
                    pick game winners.
                </p>
            </div>

            <div className="learn-takeaway">
                <h4>🔥 Module 1 Key Takeaways</h4>
                <ul>
                    <li>MLB teams alternate W-L far more often than chance predicts</li>
                    <li>When alternation stretches to 6+ games, the break probability surges to 62%+</li>
                    <li>The break is driven by real factors: rotation cycles, fatigue, regression to the mean</li>
                    <li>You&apos;re not picking winners — you&apos;re predicting pattern breaks (much more reliable)</li>
                </ul>
            </div>
        </>
    );
}
