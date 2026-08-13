'use client';

export default function Module2() {
    return (
        <>
            <div className="module-header">
                <span className="module-num-label">Module 2 of 7</span>
                <h2 className="module-title">Reading the Board</h2>
                <p className="module-subtitle">
                    Master the live Pattern System dashboard — know exactly what every element means at a glance.
                </p>
            </div>

            <div className="learn-section">
                <h3>Your Command Center</h3>
                <p>
                    The Pattern System dashboard scans <strong>all 30 MLB teams in real-time</strong>. Every time you open it,
                    you see which teams are currently in alternation patterns, how long those patterns have been running,
                    and what the break probability is.
                </p>
                <p>
                    Think of it like a radar screen for profitable patterns. Instead of manually tracking 30 teams
                    across 162 games each, the software does it for you — and highlights exactly where the opportunities are.
                </p>
            </div>

            <div className="learn-widget">
                <h4 style={{ color: '#a78bfa' }}>📊 Dashboard Anatomy</h4>
                <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '16px' }}>
                    Here&apos;s what each element on the dashboard means:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[
                        { label: 'Team Card', desc: 'Each team gets a card showing their name, division, and current pattern status.', color: '#d1d5db' },
                        { label: 'Alt Streak Number', desc: 'Shows how many consecutive games the team has been alternating W-L. Higher = stronger pattern.', color: '#FFC107' },
                        { label: 'Break Score Badge', desc: 'The big percentage (62-99%) — this is your primary signal. Higher score = higher probability the pattern breaks next game.', color: '#fbbf24' },
                        { label: 'True Pattern / Developing Label', desc: '"True Pattern" (green) = 6+ games, actionable. "Developing" (blue) = 4-5 games, watch but don\'t bet yet.', color: '#60a5fa' },
                        { label: 'Next Prediction Arrow', desc: 'Shows whether the algorithm predicts a W or L for the team\'s next game based on the break direction.', color: '#ef4444' },
                        { label: 'Playing Today Indicator', desc: 'Teams with games today are highlighted — these are your actionable picks for the day.', color: '#a78bfa' },
                    ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: item.color, marginTop: '8px', flexShrink: 0 }} />
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: item.color }}>{item.label}</div>
                                <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>{item.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="learn-section">
                <h3>The Filters That Matter</h3>
                <p>Don&apos;t look at all 30 teams at once. Use the dashboard filters to focus on what matters:</p>

                <div className="learn-steps">
                    <div className="learn-step">
                        <div className="learn-step-num">🔥</div>
                        <div className="learn-step-content">
                            <h5>&quot;True Patterns Only&quot; Filter</h5>
                            <p>Shows only teams with 6+ alternating games. These are your actionable plays. Start here every day.</p>
                        </div>
                    </div>
                    <div className="learn-step">
                        <div className="learn-step-num">📅</div>
                        <div className="learn-step-content">
                            <h5>&quot;Playing Today&quot; Filter</h5>
                            <p>Cross-references true patterns with today&apos;s MLB schedule. If a team is in a true pattern AND playing today — that&apos;s your pick.</p>
                        </div>
                    </div>
                    <div className="learn-step">
                        <div className="learn-step-num">📊</div>
                        <div className="learn-step-content">
                            <h5>Sort by Break Score</h5>
                            <p>Always sort highest break score first. An 85% break score is a stronger signal than a 62%. Prioritize the highest probabilities.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="learn-callout pro-tip">
                <h4 style={{ color: '#a78bfa' }}>🎯 Pro Tip</h4>
                <p>
                    The sweet spot is when you find a team with a <strong>True Pattern (7+ games)</strong> that is 
                    <strong> playing today</strong> with a break score of <strong>69% or higher</strong>. 
                    That&apos;s your bread and butter play. On most game days, you&apos;ll find 1-3 of these setups.
                </p>
            </div>

            <div className="learn-section">
                <h3>Reading the Pattern Dots</h3>
                <p>
                    Each team card shows the last 15 game results as a sequence of dots.
                    Here&apos;s how to read them instantly:
                </p>

                <div className="learn-widget">
                    <h4 style={{ color: '#FFC107' }}>Perfect Alternation (8 games)</h4>
                    <div className="learn-pattern-row" style={{ marginBottom: '8px' }}>
                        {['W','L','W','L','W','L','W','L'].map((r, i) => (
                            <div key={i} className={`learn-dot ${r === 'W' ? 'w' : 'l'}`}>{r}</div>
                        ))}
                    </div>
                    <p style={{ color: '#FFC107', fontSize: '12px', fontWeight: 600 }}>Break Score: 73% — True Pattern ✅</p>
                </div>

                <div className="learn-widget" style={{ marginTop: '12px' }}>
                    <h4 style={{ color: '#60a5fa' }}>Developing Pattern (5 games)</h4>
                    <div className="learn-pattern-row" style={{ marginBottom: '8px' }}>
                        {['W','W','L','W','L','W','L','W'].map((r, i) => (
                            <div key={i} className={`learn-dot ${r === 'W' ? 'w' : 'l'}`}
                                 style={i < 3 ? { opacity: 0.3 } : {}}>{r}</div>
                        ))}
                    </div>
                    <p style={{ color: '#60a5fa', fontSize: '12px', fontWeight: 600 }}>Break Score: 15% — Developing 👀 (not yet actionable)</p>
                </div>

                <div className="learn-widget" style={{ marginTop: '12px' }}>
                    <h4 style={{ color: '#6b7280' }}>No Pattern</h4>
                    <div className="learn-pattern-row" style={{ marginBottom: '8px' }}>
                        {['W','W','L','L','W','L','L','W'].map((r, i) => (
                            <div key={i} className={`learn-dot ${r === 'W' ? 'w' : 'l'}`}>{r}</div>
                        ))}
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '12px', fontWeight: 600 }}>Break Score: 0% — No alternation detected. Skip this team.</p>
                </div>
            </div>

            <div className="learn-takeaway">
                <h4>🔥 Module 2 Key Takeaways</h4>
                <ul>
                    <li>The dashboard scans all 30 teams automatically — you don&apos;t need to track anything manually</li>
                    <li>Filter for &quot;True Patterns&quot; + &quot;Playing Today&quot; = your daily action list</li>
                    <li>Sort by Break Score (highest first) to find the strongest opportunities</li>
                    <li>Sweet spot: 7+ game alternation, playing today, break score 69%+</li>
                    <li>Ignore Developing patterns (4-5 games) — they&apos;re worth watching but not betting</li>
                </ul>
            </div>
        </>
    );
}
