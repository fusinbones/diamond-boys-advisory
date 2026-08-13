'use client';

import { useState } from 'react';

const CHECKLIST = [
    { id: 1, text: 'Open the Pattern System dashboard', time: '~30 seconds' },
    { id: 2, text: 'Filter: "True Patterns" only', time: '~10 seconds' },
    { id: 3, text: 'Filter: "Playing Today" only', time: '~10 seconds' },
    { id: 4, text: 'Sort by Break Score (highest first)', time: '~10 seconds' },
    { id: 5, text: 'Identify top 1-3 plays (Break Score 69%+)', time: '~1 minute' },
    { id: 6, text: 'Note the break direction (W or L) for each', time: '~30 seconds' },
    { id: 7, text: 'Place base unit bet on each break direction', time: '~2 minutes' },
    { id: 8, text: 'Set a reminder to check results after games end', time: '~10 seconds' },
    { id: 9, text: 'Log results in your tracker (W/L and P&L)', time: '~1 minute' },
    { id: 10, text: 'If any missed: note next day\'s double-up targets', time: '~30 seconds' },
];

export default function Module7() {
    const [checked, setChecked] = useState<Set<number>>(new Set());

    const toggle = (id: number) => {
        const next = new Set(checked);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setChecked(next);
    };

    return (
        <>
            <div className="module-header">
                <span className="module-num-label">Module 7 of 7</span>
                <h2 className="module-title">Your Daily System</h2>
                <p className="module-subtitle">
                    The exact step-by-step routine you follow every day. 5 minutes of work. That&apos;s it.
                </p>
            </div>

            <div className="learn-section">
                <h3>The 5-Minute Daily Routine</h3>
                <p>
                    This is where everything comes together. You&apos;ve learned the patterns, the scoring, 
                    the recovery system, and the bankroll rules. Now here&apos;s the exact process you follow 
                    every single day during baseball season.
                </p>
                <p>
                    <strong>Total time: 5 minutes.</strong> Seriously. The software does all the heavy lifting.
                    You just need to check the board, identify the plays, and place your bets.
                </p>
            </div>

            <div className="learn-widget">
                <h4 style={{ color: '#fbbf24' }}>📋 Daily Checklist — Try It Now</h4>
                <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '16px' }}>
                    Practice the routine by checking off each step. This is your daily workflow:
                </p>

                <div className="learn-checklist">
                    {CHECKLIST.map((item) => (
                        <div
                            key={item.id}
                            className={`learn-check-item ${checked.has(item.id) ? 'checked' : ''}`}
                            onClick={() => toggle(item.id)}
                        >
                            <div className="check-box">
                                {checked.has(item.id) && <span style={{ color: '#040810', fontSize: '12px', fontWeight: 900 }}>✓</span>}
                            </div>
                            <span style={{ flex: 1 }}>{item.text}</span>
                            <span style={{ fontSize: '11px', color: '#4b5563' }}>{item.time}</span>
                        </div>
                    ))}
                </div>

                {checked.size === CHECKLIST.length && (
                    <div style={{
                        marginTop: '16px', padding: '16px', borderRadius: '12px',
                        background: 'rgba(106,0,255,0.08)', border: '1px solid rgba(106,0,255,0.2)',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔥</div>
                        <div style={{ fontWeight: 800, color: '#FFC107', marginBottom: '4px' }}>Routine Complete!</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>This is your daily life now. 5 minutes. Every game day.</div>
                    </div>
                )}
            </div>

            <div className="learn-section">
                <h3>Timing Your Day</h3>
                <p>MLB games typically start between 1 PM and 7 PM ET. Here&apos;s the optimal daily schedule:</p>

                <div className="learn-widget">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {[
                            { time: '11:00 AM ET', task: 'Check the Pattern Dashboard', desc: 'Identify today\'s True Patterns playing today. Note your top 1-3 picks.', color: '#60a5fa' },
                            { time: '12:00 PM ET', task: 'Place Your Bets', desc: 'Lines are usually up by now. Place your base unit bets on each break direction.', color: '#FFC107' },
                            { time: '10:00 PM ET', task: 'Check Results', desc: 'Most games are finished. Log your wins and losses. Note any double-up targets for tomorrow.', color: '#fbbf24' },
                            { time: 'Sunday', task: 'Weekly Review', desc: 'Recalculate your base unit. Review your W/L record. Withdraw 50% of profits if end of month.', color: '#a78bfa' },
                        ].map((slot, i) => (
                            <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                                <div style={{
                                    padding: '6px 10px', borderRadius: '8px', fontSize: '11px',
                                    fontWeight: 700, color: slot.color, background: `${slot.color}12`,
                                    border: `1px solid ${slot.color}25`, whiteSpace: 'nowrap',
                                }}>
                                    {slot.time}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>{slot.task}</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>{slot.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="learn-section">
                <h3>Your First Week Game Plan</h3>
                <p>Here&apos;s exactly what your first week looks like:</p>

                <div className="learn-steps">
                    <div className="learn-step">
                        <div className="learn-step-num">1</div>
                        <div className="learn-step-content">
                            <h5>Days 1-2: Paper Trade</h5>
                            <p>Don&apos;t bet real money yet. Follow the daily routine but just track your picks on paper. Get comfortable with the dashboard and the process.</p>
                        </div>
                    </div>
                    <div className="learn-step">
                        <div className="learn-step-num">2</div>
                        <div className="learn-step-content">
                            <h5>Day 3: First Real Bet</h5>
                            <p>Place your first base unit bet on the highest Break Score play of the day. One bet. One base unit. Feel the system work.</p>
                        </div>
                    </div>
                    <div className="learn-step">
                        <div className="learn-step-num">3</div>
                        <div className="learn-step-content">
                            <h5>Days 4-5: Scale to 2-3 Plays</h5>
                            <p>Now take 2-3 of the top plays per day. Still base unit on each. Start tracking your cumulative W/L record.</p>
                        </div>
                    </div>
                    <div className="learn-step">
                        <div className="learn-step-num">4</div>
                        <div className="learn-step-content">
                            <h5>Days 6-7: Full System Active</h5>
                            <p>You&apos;re running the full system now. Double-Up Recovery is active. Bankroll rules are locked in. You&apos;re a pattern trader.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="learn-callout insight">
                <h4 style={{ color: '#fbbf24' }}>💡 The Compound Effect</h4>
                <p>
                    At 70%+ win rate with 1-3 plays per day, compound math works dramatically in your favor.
                    Even at 1 play per day, that&apos;s ~21 plays per month. At 70% hit rate = ~15 wins, ~6 losses.
                    With the Double-Up Recovery covering your losses, your net monthly gain is substantial — 
                    and it grows as your bankroll (and base unit) grows.
                </p>
            </div>

            <div className="learn-callout warning">
                <h4 style={{ color: '#ef4444' }}>⚠️ What NOT to Do</h4>
                <p>
                    <strong>Don&apos;t chase.</strong> If there are no True Patterns playing today, there are 
                    no plays today. That&apos;s fine. The system works because you&apos;re disciplined, not because 
                    you bet every day. Some of the best days are the ones where you don&apos;t bet at all.
                </p>
            </div>

            <div className="learn-takeaway" style={{ background: 'linear-gradient(135deg, rgba(106,0,255,0.08), rgba(251,191,36,0.06))' }}>
                <h4 style={{ color: '#FFC107' }}>🎓 Course Complete — Your System Summary</h4>
                <ul>
                    <li>Check the dashboard daily at 11 AM ET — filter True Patterns + Playing Today</li>
                    <li>Pick 1-3 highest Break Score plays (69%+ preferred)</li>
                    <li>Bet 1 base unit (2% of bankroll) per play on the break direction</li>
                    <li>If a break misses: double up on the next qualified break</li>
                    <li>Maximum 3 double-ups per day, then stop</li>
                    <li>Recalculate base unit every Sunday</li>
                    <li>Withdraw 50% of profits monthly</li>
                    <li>Paper trade days 1-2, then gradually scale to full system</li>
                </ul>
            </div>
        </>
    );
}
