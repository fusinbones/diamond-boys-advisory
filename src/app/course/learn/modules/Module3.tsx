'use client';

export default function Module3() {
    return (
        <>
            <div className="module-header">
                <span className="module-num-label">Module 3 of 7</span>
                <h2 className="module-title">True vs Developing</h2>
                <p className="module-subtitle">
                    The critical difference between a pattern you watch and a pattern you bet — this distinction is worth the entire course.
                </p>
            </div>

            <div className="learn-section">
                <h3>The Line Between Watching and Acting</h3>
                <p>
                    This is where most people get it wrong. They see a team alternating for 4-5 games and 
                    think &quot;I found a pattern!&quot; — then they bet on it and lose. Why? Because <strong>a developing 
                    pattern is NOT a true pattern.</strong>
                </p>
                <p>
                    The difference between 5 alternating games and 6 alternating games might seem small.
                    But statistically, it&apos;s massive. Here&apos;s the exact breakdown:
                </p>
            </div>

            <div className="learn-widget">
                <h4 style={{ color: '#fbbf24' }}>📊 The Break Probability Jump</h4>
                <table className="score-table">
                    <thead>
                        <tr>
                            <th>Alternation Streak</th>
                            <th>Status</th>
                            <th>Break Probability</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { streak: '4 games', status: 'Developing', prob: '8%', action: '❌ Skip', color: '#6b7280' },
                            { streak: '5 games', status: 'Developing', prob: '15%', action: '👀 Watch', color: '#60a5fa' },
                            { streak: '6 games', status: 'TRUE ✅', prob: '62%', action: '✅ Actionable', color: '#FFC107' },
                            { streak: '7 games', status: 'TRUE ✅', prob: '69%', action: '✅ Strong', color: '#FFC107' },
                            { streak: '8 games', status: 'TRUE ✅', prob: '73%', action: '🔥 Very Strong', color: '#fbbf24' },
                            { streak: '9 games', status: 'TRUE ✅', prob: '80%', action: '🔥 Excellent', color: '#fbbf24' },
                            { streak: '10 games', status: 'TRUE ✅', prob: '85%', action: '🔥🔥 Elite', color: '#ef4444' },
                            { streak: '11+ games', status: 'TRUE ✅', prob: '90-99%', action: '🔥🔥🔥 Rare Lock', color: '#ef4444' },
                        ].map((row, i) => (
                            <tr key={i}>
                                <td style={{ fontWeight: 700 }}>{row.streak}</td>
                                <td style={{ color: row.color, fontWeight: 600 }}>{row.status}</td>
                                <td style={{ color: row.color, fontWeight: 800 }}>{row.prob}</td>
                                <td style={{ fontSize: '12px' }}>{row.action}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="learn-callout warning">
                <h4 style={{ color: '#ef4444' }}>⚠️ The #1 Beginner Mistake</h4>
                <p>
                    Betting on 4-5 game &quot;patterns&quot; is the fastest way to lose money with this system.
                    Those aren&apos;t patterns — they&apos;re noise. <strong>Wait for 6+ games. Always.</strong> The discipline 
                    to wait is what separates profitable users from losing ones.
                </p>
            </div>

            <div className="learn-section">
                <h3>The 6-Game Threshold: Why It Matters</h3>
                <p>
                    At 4-5 alternating games, you&apos;re essentially flipping a coin. The pattern hasn&apos;t 
                    &quot;proven itself&quot; statistically. But at 6 games, something shifts:
                </p>
                <p>
                    The probability of a team naturally alternating 6+ times in a row purely by chance 
                    is roughly <strong>1 in 64</strong>. When it happens, it&apos;s not randomness — it&apos;s a structural 
                    pattern driven by the factors we covered in Module 1 (rotation, fatigue, regression).
                    And structural patterns <strong>break</strong>.
                </p>
            </div>

            <div className="learn-section">
                <h3>How to Use Developing Patterns</h3>
                <p>
                    Developing patterns aren&apos;t useless — they&apos;re your <strong>early warning system</strong>. 
                    Here&apos;s the workflow:
                </p>
                <div className="learn-steps">
                    <div className="learn-step">
                        <div className="learn-step-num">1</div>
                        <div className="learn-step-content">
                            <h5>Spot the Developing Pattern</h5>
                            <p>A team hits 4-5 alternating games. The dashboard labels it &quot;Developing.&quot; Add it to your watchlist.</p>
                        </div>
                    </div>
                    <div className="learn-step">
                        <div className="learn-step-num">2</div>
                        <div className="learn-step-content">
                            <h5>Wait for Confirmation</h5>
                            <p>Check the next day. Did the alternation continue? If the team is now at 6 games, it just became a True Pattern.</p>
                        </div>
                    </div>
                    <div className="learn-step">
                        <div className="learn-step-num">3</div>
                        <div className="learn-step-content">
                            <h5>Act on True Patterns Only</h5>
                            <p>Now (and only now) do you consider betting the break. The break score will show 62%+ and you can apply your strategy.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="learn-callout success">
                <h4 style={{ color: '#FFC107' }}>✅ The Golden Rule</h4>
                <p>
                    <strong>Developing = Watch. True = Act.</strong> This single rule will keep you profitable. 
                    Memorize it. Tattoo it. Never break it.
                </p>
            </div>

            <div className="learn-takeaway">
                <h4>🔥 Module 3 Key Takeaways</h4>
                <ul>
                    <li>4-5 games = Developing (8-15% break probability) → WATCH only</li>
                    <li>6+ games = True Pattern (62-99% break probability) → ACT</li>
                    <li>The jump from 5→6 games is the biggest statistical leap in the entire system</li>
                    <li>Use Developing patterns as your early warning radar for tomorrow&apos;s plays</li>
                    <li>Never bet a Developing pattern — discipline is your edge</li>
                </ul>
            </div>
        </>
    );
}
