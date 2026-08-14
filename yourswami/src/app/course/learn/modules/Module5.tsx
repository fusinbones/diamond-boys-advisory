'use client';

import { useState } from 'react';

export default function Module5() {
    const [baseUnit, setBaseUnit] = useState(50);

    const rounds = [
        { bet: baseUnit, result: 'loss', label: 'Bet 1: Break doesn\'t hit' },
        { bet: baseUnit * 2, result: 'win', label: 'Bet 2: Double up — break hits!' },
    ];

    const netProfit = rounds[1].bet - rounds[0].bet;

    return (
        <>
            <div className="module-header">
                <span className="module-num-label">Module 5 of 7</span>
                <h2 className="module-title">The Double-Up Recovery</h2>
                <p className="module-subtitle">
                    The mathematical safety net that means you never truly lose. This is the strategy that makes the entire system work.
                </p>
            </div>

            <div className="learn-section">
                <h3>Why This Changes Everything</h3>
                <p>
                    Here&apos;s the problem with most betting systems: one bad pick erases your previous wins. 
                    You&apos;re always one loss away from going backward.
                </p>
                <p>
                    <strong>The Double-Up Recovery eliminates this problem entirely.</strong> It&apos;s a 
                    structured, disciplined approach to bet sizing that ensures a single loss doesn&apos;t 
                    hurt you — and the recovery play actually puts you ahead.
                </p>
            </div>

            <div className="learn-section">
                <h3>The Core System</h3>
                <p>The Double-Up Recovery works in 5 simple steps:</p>

                <div className="learn-steps">
                    <div className="learn-step">
                        <div className="learn-step-num">1</div>
                        <div className="learn-step-content">
                            <h5>Set Your Base Unit</h5>
                            <p>Choose your standard bet size. This should be 1-2% of your total bankroll. If your bankroll is $5,000, your base unit is $50-$100.</p>
                        </div>
                    </div>
                    <div className="learn-step">
                        <div className="learn-step-num">2</div>
                        <div className="learn-step-content">
                            <h5>Bet One Base Unit on the Pattern Break</h5>
                            <p>Find a True Pattern (6+ games) on the dashboard. Bet one base unit on the break direction.</p>
                        </div>
                    </div>
                    <div className="learn-step">
                        <div className="learn-step-num">3</div>
                        <div className="learn-step-content">
                            <h5>If It Hits: Great. Reset and Repeat.</h5>
                            <p>You won one base unit. Go back to Step 2 for the next pattern break.</p>
                        </div>
                    </div>
                    <div className="learn-step">
                        <div className="learn-step-num">4</div>
                        <div className="learn-step-content">
                            <h5>If It Misses: Double Up</h5>
                            <p>The break didn&apos;t hit? No problem. Find the NEXT qualified True Pattern break and bet TWO base units. At 70%+ win rate, this usually hits.</p>
                        </div>
                    </div>
                    <div className="learn-step">
                        <div className="learn-step-num">5</div>
                        <div className="learn-step-content">
                            <h5>When the Double-Up Hits: Reset</h5>
                            <p>You just won 2 base units, which covers your 1 base unit loss plus gives you 1 base unit profit. Reset to Step 2.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="learn-widget">
                <h4 style={{ color: '#fbbf24' }}>🧮 Interactive Double-Up Simulator</h4>
                <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '16px' }}>
                    Set your base unit to see how the recovery works:
                </p>

                <div className="calc-row">
                    <span className="calc-label">Base unit ($):</span>
                    <input
                        type="number"
                        value={baseUnit}
                        onChange={e => setBaseUnit(Math.max(1, Number(e.target.value)))}
                        className="calc-input"
                        min={1}
                    />
                </div>

                <div style={{ marginTop: '16px' }}>
                    <div className="sim-round loss">
                        <span>❌</span>
                        <span style={{ flex: 1 }}>Bet 1: Pattern break doesn&apos;t hit</span>
                        <span className="sim-badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                            -${baseUnit}
                        </span>
                    </div>
                    <div className="sim-round win">
                        <span>✅</span>
                        <span style={{ flex: 1 }}>Bet 2: Double up — break hits!</span>
                        <span className="sim-badge" style={{ background: 'rgba(106,0,255,0.15)', color: '#FFC107' }}>
                            +${baseUnit * 2}
                        </span>
                    </div>
                </div>

                <div className="calc-result">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div className="calc-result-label">Net Result After Recovery</div>
                            <div className="calc-result-value">+${netProfit}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div className="calc-result-label">Total Risked</div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#d1d5db' }}>${baseUnit * 3}</div>
                        </div>
                    </div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                        Lost ${baseUnit} on Bet 1, won ${baseUnit * 2} on Bet 2. Net profit: ${netProfit}. You&apos;re back ahead.
                    </p>
                </div>
            </div>

            <div className="learn-section">
                <h3>The Extended Sequence</h3>
                <p>What if the double-up also misses? Here&apos;s the extended chain:</p>

                <div className="learn-widget">
                    <table className="score-table">
                        <thead>
                            <tr>
                                <th>Bet #</th>
                                <th>Size</th>
                                <th>If Loses</th>
                                <th>If Wins</th>
                                <th>Net Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { n: 1, size: 1, cumLoss: 1, winBack: 1, net: 0 },
                                { n: 2, size: 2, cumLoss: 3, winBack: 2, net: -1 },
                                { n: 3, size: 4, cumLoss: 7, winBack: 4, net: 1 },
                            ].map((row) => (
                                <tr key={row.n}>
                                    <td style={{ fontWeight: 700 }}>#{row.n}</td>
                                    <td>${row.size * baseUnit}</td>
                                    <td style={{ color: '#f87171' }}>-${row.cumLoss * baseUnit} total</td>
                                    <td style={{ color: '#FFC107' }}>+${row.winBack * baseUnit}</td>
                                    <td style={{ fontWeight: 700, color: row.net >= 0 ? '#22c55e' : '#f87171' }}>
                                        {row.net >= 0 ? '+' : ''}{row.net === 0 ? 'Even' : `$${row.net * baseUnit}`}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="learn-callout warning">
                <h4 style={{ color: '#ef4444' }}>⚠️ The Stop-Loss Rule</h4>
                <p>
                    <strong>Never go beyond 3 consecutive double-ups.</strong> If you miss 3 pattern breaks 
                    in a row (which is extremely rare at 70%+ accuracy), stop for the day. 
                    Reset to your base unit tomorrow. This protects you from the rare worst-case scenario 
                    and keeps your bankroll safe.
                </p>
            </div>

            <div className="learn-callout success">
                <h4 style={{ color: '#FFC107' }}>✅ Why It Works</h4>
                <p>
                    At a 70% win rate on pattern breaks, the probability of missing 3 in a row is 
                    only <strong>0.30 × 0.30 × 0.30 = 2.7%</strong>. That means 97.3% of the time, your 
                    recovery sequence works within 1-3 bets.
                </p>
            </div>

            <div className="learn-takeaway">
                <h4>🔥 Module 5 Key Takeaways</h4>
                <ul>
                    <li>Base unit = 1-2% of your bankroll. Never more.</li>
                    <li>Miss a break? Double up on the next one. Win = full recovery + profit.</li>
                    <li>Maximum 3 double-ups in a row, then stop for the day</li>
                    <li>The math: 70% win rate means only 2.7% chance of 3 consecutive misses</li>
                    <li>Always reset to base unit after a successful recovery</li>
                </ul>
            </div>
        </>
    );
}
