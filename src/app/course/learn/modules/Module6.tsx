'use client';

import { useState } from 'react';

export default function Module6() {
    const [bankroll, setBankroll] = useState(5000);
    const unitPct = 0.02;
    const baseUnit = Math.round(bankroll * unitPct);
    const maxDoubleUp = baseUnit * 4;
    const worstCase = baseUnit + baseUnit * 2 + baseUnit * 4; // 3 consecutive losses

    return (
        <>
            <div className="module-header">
                <span className="module-num-label">Module 6 of 7</span>
                <h2 className="module-title">Bankroll Management</h2>
                <p className="module-subtitle">
                    The unsexy module that saves your ass. Bankroll management is the difference between a hobby and a system.
                </p>
            </div>

            <div className="learn-section">
                <h3>Rule #1: Size Your Bets, Not Your Ego</h3>
                <p>
                    The Double-Up Recovery system only works if your base unit is small enough relative
                    to your bankroll that you can sustain the sequence. <strong>If your base unit is too large,
                    one bad day can wipe you out.</strong>
                </p>
                <p>
                    The iron rule: <strong>your base unit should be 1-2% of your total bankroll.</strong> We 
                    recommend starting at 2% and adjusting down if you&apos;re more conservative.
                </p>
            </div>

            <div className="learn-widget">
                <h4 style={{ color: '#fbbf24' }}>🧮 Bankroll Calculator</h4>
                <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '16px' }}>
                    Enter your starting bankroll to see your recommended bet sizes:
                </p>

                <div className="calc-row">
                    <span className="calc-label">Starting bankroll:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#6b7280' }}>$</span>
                        <input
                            type="number"
                            value={bankroll}
                            onChange={e => setBankroll(Math.max(100, Number(e.target.value)))}
                            className="calc-input"
                            min={100}
                            step={100}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginTop: '16px' }}>
                    <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(106,0,255,0.06)', border: '1px solid rgba(106,0,255,0.15)' }}>
                        <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Base Unit (2%)</div>
                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#FFC107' }}>${baseUnit}</div>
                    </div>
                    <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
                        <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Max Double-Up (Bet 3)</div>
                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#fbbf24' }}>${maxDoubleUp}</div>
                    </div>
                    <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                        <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Worst Case (3 misses)</div>
                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#ef4444' }}>${worstCase}</div>
                        <div style={{ fontSize: '10px', color: '#6b7280' }}>{((worstCase / bankroll) * 100).toFixed(1)}% of bankroll</div>
                    </div>
                </div>
            </div>

            <div className="learn-section">
                <h3>The 5 Rules of Bankroll Discipline</h3>

                <div className="learn-steps">
                    <div className="learn-step">
                        <div className="learn-step-num">1</div>
                        <div className="learn-step-content">
                            <h5>Separate Your Bankroll</h5>
                            <p>Your betting bankroll is NOT your rent money, savings, or grocery budget. It&apos;s a dedicated fund for this system. Never mix them.</p>
                        </div>
                    </div>
                    <div className="learn-step">
                        <div className="learn-step-num">2</div>
                        <div className="learn-step-content">
                            <h5>Never Exceed 2% Base Unit</h5>
                            <p>Even if you&apos;re on a hot streak and feel invincible. Especially then. The base unit protects you when the streak ends.</p>
                        </div>
                    </div>
                    <div className="learn-step">
                        <div className="learn-step-num">3</div>
                        <div className="learn-step-content">
                            <h5>3-Break Stop Loss Per Day</h5>
                            <p>If you miss 3 consecutive pattern breaks, you&apos;re done for the day. Close the app. Go outside. Tomorrow is a new day.</p>
                        </div>
                    </div>
                    <div className="learn-step">
                        <div className="learn-step-num">4</div>
                        <div className="learn-step-content">
                            <h5>Recalculate Weekly</h5>
                            <p>Every Sunday, recalculate your base unit based on your current bankroll. Won money? Your base unit goes up. Lost money? It goes down. The system self-corrects.</p>
                        </div>
                    </div>
                    <div className="learn-step">
                        <div className="learn-step-num">5</div>
                        <div className="learn-step-content">
                            <h5>Withdraw Profits Monthly</h5>
                            <p>Take out 50% of your profits at the end of each month. This locks in real gains and prevents you from over-sizing as your bankroll grows.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="learn-callout pro-tip">
                <h4 style={{ color: '#a78bfa' }}>🎯 Pro Tip: The Grow-and-Protect Method</h4>
                <p>
                    Start with a bankroll you&apos;re comfortable with. As you profit, let 50% compound 
                    (grows your base unit) and withdraw 50% (real money in your pocket). After 3 months, 
                    you&apos;ll be playing with house money — zero personal risk.
                </p>
            </div>

            <div className="learn-takeaway">
                <h4>🔥 Module 6 Key Takeaways</h4>
                <ul>
                    <li>Base unit = 2% of bankroll. No exceptions, no &quot;just this once.&quot;</li>
                    <li>Worst-case scenario (3 misses) = ~14% of bankroll — painful but survivable</li>
                    <li>3-break daily stop-loss is mandatory — protects against tilt and bad days</li>
                    <li>Recalculate base unit every Sunday based on current bankroll</li>
                    <li>Withdraw 50% of profits monthly — lock in real gains</li>
                </ul>
            </div>
        </>
    );
}
