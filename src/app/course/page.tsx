'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Flame, TrendingUp, Target, BookOpen, Shield, Zap, ChevronDown,
    CheckCircle, ArrowRight, BarChart3, Brain, DollarSign, Clock, Users,
    Award, Lock
} from 'lucide-react';
import PaymentForm from '@/components/course/PaymentForm';
import './course.css';

const COURSE_PRICE = 497;

const MODULES = [
    { num: 1, title: 'The Hidden Pattern', desc: 'Why MLB teams secretly alternate wins and losses — and how to spot it before anyone else.', tag: 'Foundation', tagColor: '#60a5fa' },
    { num: 2, title: 'Reading the Board', desc: 'Master the live Pattern System dashboard. Know exactly what every dot, score, and badge means.', tag: 'Software', tagColor: '#a78bfa' },
    { num: 3, title: 'True vs Developing', desc: 'The critical difference between a 4-game developing pattern and a 6+ game true pattern.', tag: 'Strategy', tagColor: '#fbbf24' },
    { num: 4, title: 'The Break Score', desc: 'How the 62-99% probability scale works, and why 8+ game streaks hit at 73%+.', tag: 'Data', tagColor: '#00e59b' },
    { num: 5, title: 'The Double-Up Recovery', desc: 'The exact system to recover from any missed break — double up, win it back, reset.', tag: '🔥 Core', tagColor: '#ef4444' },
    { num: 6, title: 'Bankroll Management', desc: '1-2% base units, 3-break stop-loss rules, and session discipline that protects your money.', tag: 'Protection', tagColor: '#f59e0b' },
    { num: 7, title: 'Your Daily System', desc: 'Step-by-step: open the dashboard, find today\'s breaks, size your bets, track results.', tag: 'Action', tagColor: '#00e59b' },
];

const FEATURES = [
    { icon: BookOpen, title: '7 In-Depth Modules', desc: 'From zero to expert — every concept explained with real examples and live data.', color: '#f59e0b' },
    { icon: BarChart3, title: 'Live Pattern Software', desc: 'Real-time dashboard scanning all 30 MLB teams for alternation patterns.', color: '#a78bfa' },
    { icon: Target, title: 'Break Probability Engine', desc: 'Proprietary scoring from 62-99% — know exactly when to strike.', color: '#ef4444' },
    { icon: DollarSign, title: 'Double-Up Recovery System', desc: 'Never truly lose — the math-backed strategy to recover and profit.', color: '#00e59b' },
    { icon: Brain, title: 'Bankroll Calculator', desc: 'Interactive tools to size your bets, set stop-losses, and protect capital.', color: '#60a5fa' },
    { icon: Clock, title: 'Lifetime Access', desc: 'Buy once, access forever. Including all future updates and improvements.', color: '#fbbf24' },
];

const FAQS = [
    { q: 'How long does it take to complete the course?', a: 'Most students finish all 7 modules in 2-3 hours. But the real learning happens when you start applying the system daily with the live Pattern Software. We recommend going through it in one sitting, then referring back to specific modules as you build experience.' },
    { q: 'Do I need sports betting experience?', a: 'Absolutely not. The Fire Course was designed to take someone with zero experience and turn them into a systematic bettor. Every concept is explained from the ground up — no jargon, no assumed knowledge. If you can read a W and an L, you can master this.' },
    { q: 'What is the Pattern System software?', a: 'It\'s proprietary software that scans all 30 MLB teams in real-time, analyzing their recent win/loss sequences for alternation patterns. When a team hits 6+ games of alternating W-L-W-L, the system flags it with a "break probability" score from 62-99%. You use these signals to make informed picks.' },
    { q: 'How does the Double-Up Recovery work?', a: 'If your first break prediction misses, you simply double your bet on the next qualified pattern break. When that hits (and at 70%+ win rate, it usually does), you recover your previous loss plus profit. Then you reset to your base unit. It\'s a mathematical safety net built into the system.' },
    { q: 'What\'s the win rate?', a: 'Documented pattern break predictions hit at 70%+ over thousands of data points. The Break Score ranges from 62% (6-game patterns) to 99% (14+ game patterns). Combined with the Double-Up Recovery system, the effective win rate on your bankroll is even higher.' },
    { q: 'Is this only for MLB?', a: 'Currently, the live Pattern System software covers all 30 MLB teams. The alternation pattern methodology works across sports, and we\'re expanding to NBA, NFL, and NHL. Course purchasers get access to all future sport expansions at no extra cost.' },
    { q: 'What if I want the live software too?', a: 'The course includes everything you need to understand and apply the system. For students who want the live Pattern System software to automate their daily scanning, we offer it as an optional add-on at $49.99/month — but it\'s not required. You can apply the methodology manually using free MLB data.' },
    { q: 'Can I get a refund?', a: 'Due to the digital nature of the course and the proprietary strategies revealed inside, all sales are final. We\'re confident the system speaks for itself — 70%+ documented accuracy.' },
];

export default function FireCourseLanding() {
    const router = useRouter();
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [purchased, setPurchased] = useState(false);

    const scrollToCheckout = () => {
        document.getElementById('fire-checkout')?.scrollIntoView({ behavior: 'smooth' });
    };

    if (purchased) {
        return (
            <div className="fire-funnel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '40px 20px' }}>
                <div style={{ textAlign: 'center', maxWidth: '480px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔥</div>
                    <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '12px' }}>You&apos;re In!</h1>
                    <p style={{ color: '#d1d5db', fontSize: '16px', lineHeight: 1.7, marginBottom: '28px' }}>
                        Welcome to <strong style={{ color: '#fbbf24' }}>The Fire Course</strong>. Check your email for access details,
                        or click below to start learning right now.
                    </p>
                    <button
                        onClick={() => router.push('/course/learn')}
                        className="fire-cta-primary"
                    >
                        <Flame size={18} /> Start Learning Now <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fire-funnel">
            {/* ═══ HERO ═══ */}
            <section className="fire-hero">
                <div className="fire-hero-inner">
                    <div className="fire-badge">
                        <span className="pulse-dot" />
                        LIMITED ENROLLMENT — THE FIRE COURSE
                    </div>

                    <h1 className="fire-headline">
                        70% of the Time,<br />
                        <span className="accent-fire">the Pattern Breaks.</span>
                    </h1>
                    <p className="fire-subheadline">
                        Learn the <strong>exact system</strong> that predicts when MLB teams will break their
                        win/loss pattern — backed by <strong>real data from 30 teams</strong>, a proprietary
                        algorithm, and a recovery strategy that means you never truly lose.
                    </p>

                    {/* Live pattern demo */}
                    <div className="fire-pattern-demo">
                        <div className="fire-pattern-label">Live Pattern Example — True Alternation</div>
                        <div className="fire-pattern-dots">
                            {['W','L','W','L','W','L','W','L'].map((r, i) => (
                                <div key={i} className={`fire-dot ${r === 'W' ? 'win' : 'loss'}`}
                                     style={{ animationDelay: `${i * 0.1}s`, animation: `fadeInUp 0.4s ease ${i * 0.08}s both` }}>
                                    {r}
                                </div>
                            ))}
                            <span className="fire-break-arrow">→</span>
                            <div style={{ textAlign: 'center' }}>
                                <span className="fire-break-label">⚡ BREAK</span>
                                <div className="fire-dot break-dot">W?</div>
                            </div>
                        </div>
                    </div>

                    <div className="fire-hero-stats">
                        <div className="fire-stat">
                            <span className="value">70%+</span>
                            <span className="label">Win Rate</span>
                        </div>
                        <div className="fire-stat">
                            <span className="value" style={{ color: '#fbbf24' }}>30</span>
                            <span className="label">Teams Scanned</span>
                        </div>
                        <div className="fire-stat">
                            <span className="value" style={{ color: '#a78bfa' }}>62-99%</span>
                            <span className="label">Break Accuracy</span>
                        </div>
                    </div>

                    <button onClick={scrollToCheckout} className="fire-cta-primary">
                        <Flame size={18} /> Get Instant Access <ArrowRight size={16} />
                    </button>
                </div>
            </section>

            <hr className="fire-divider" />

            {/* ═══ PROBLEM ═══ */}
            <section className="fire-problem">
                <div className="fire-problem-inner">
                    <span className="fire-section-label" style={{ color: '#f87171' }}>The Problem</span>
                    <h2 className="fire-section-title">
                        Most Bettors Are <span style={{ color: '#ef4444' }}>Guessing.</span><br />
                        You&apos;re About to Stop.
                    </h2>
                    <p style={{ color: '#9ca3af', fontSize: '15px', lineHeight: 1.7 }}>
                        95% of sports bettors lose money long-term. They chase hot streaks, bet on gut feelings,
                        and have zero system for recovery. The house always wins — unless you have an edge.
                    </p>

                    <div className="fire-pain-grid">
                        {[
                            { icon: '🎲', title: 'Emotional Betting', desc: 'Picking teams based on feelings, not data. The fastest way to drain your bankroll.' },
                            { icon: '📉', title: 'No Recovery Plan', desc: 'One bad beat spirals into chasing losses. No system to get back on track.' },
                            { icon: '😤', title: 'Information Overload', desc: 'Too many "experts", too many opinions. No clear signal in the noise.' },
                        ].map((pain, i) => (
                            <div key={i} className="fire-pain-card">
                                <span className="icon">{pain.icon}</span>
                                <h4>{pain.title}</h4>
                                <p>{pain.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <hr className="fire-divider" />

            {/* ═══ MODULES ═══ */}
            <section className="fire-modules">
                <div className="fire-modules-inner" style={{ textAlign: 'center' }}>
                    <span className="fire-section-label" style={{ color: '#fbbf24' }}>The Curriculum</span>
                    <h2 className="fire-section-title">
                        7 Modules. One <span style={{ color: '#fbbf24' }}>Unstoppable</span> System.
                    </h2>
                    <p style={{ color: '#9ca3af', fontSize: '15px', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto' }}>
                        From complete beginner to pattern-reading expert. Every module builds on the last,
                        giving you a complete system you can use starting today.
                    </p>

                    <div className="fire-module-list">
                        {MODULES.map((mod) => (
                            <div key={mod.num} className="fire-module-card">
                                <div className="fire-module-num">{mod.num}</div>
                                <div className="fire-module-content">
                                    <h4>{mod.title}</h4>
                                    <p>{mod.desc}</p>
                                </div>
                                <span className="fire-module-tag" style={{
                                    background: `${mod.tagColor}15`,
                                    color: mod.tagColor,
                                    border: `1px solid ${mod.tagColor}30`,
                                }}>
                                    {mod.tag}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <hr className="fire-divider" />

            {/* ═══ DOUBLE-UP RECOVERY ═══ */}
            <section className="fire-doubleup">
                <div className="fire-doubleup-inner">
                    <span className="fire-section-label" style={{ color: '#00e59b' }}>The Secret Weapon</span>
                    <h2 className="fire-section-title">
                        The <span style={{ color: '#00e59b' }}>Double-Up</span> Recovery System
                    </h2>
                    <p style={{ color: '#9ca3af', fontSize: '15px', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto' }}>
                        Even the best system has misses. That&apos;s why we built a mathematical safety net.
                        Miss a break? Double up on the next one. Win it back plus profit. Reset. Repeat.
                    </p>

                    <div className="fire-step-flow">
                        {[
                            { icon: '🎯', title: 'Bet $50 on Pattern Break', desc: 'System flags a 73% break probability', iconBg: 'rgba(0,229,155,0.12)', color: '#00e59b' },
                            { icon: '❌', title: 'Break Doesn\'t Hit', desc: 'No problem — it happens 30% of the time', iconBg: 'rgba(239,68,68,0.12)', color: '#f87171' },
                            { icon: '🔥', title: 'Double Up: $100 on Next Break', desc: 'New pattern flagged at 80% probability', iconBg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
                            { icon: '✅', title: 'Break Hits — You Win $100', desc: 'Recovered the $50 loss + $50 profit', iconBg: 'rgba(0,229,155,0.12)', color: '#00e59b' },
                            { icon: '♻️', title: 'Reset to Base: $50', desc: 'Back to your base unit. System continues.', iconBg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
                        ].map((step, i) => (
                            <div key={i} className="fire-step">
                                <div className="fire-step-icon" style={{ background: step.iconBg }}>
                                    {step.icon}
                                </div>
                                <div className="fire-step-text">
                                    <h4 style={{ color: step.color }}>{step.title}</h4>
                                    <p>{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <hr className="fire-divider" />

            {/* ═══ PROOF ═══ */}
            <section className="fire-proof">
                <div className="fire-proof-inner">
                    <span className="fire-section-label" style={{ color: '#00e59b' }}>The Numbers Don&apos;t Lie</span>
                    <h2 className="fire-section-title">
                        Backed by <span style={{ color: '#00e59b' }}>Real Data.</span> Not Hype.
                    </h2>
                    <p style={{ color: '#9ca3af', fontSize: '15px', lineHeight: 1.7 }}>
                        Every pattern break prediction is documented. Every win rate is calculated from
                        actual results across the entire MLB season.
                    </p>

                    <div className="fire-proof-card">
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#00e59b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            📊 Season Performance
                        </div>
                        <div className="fire-proof-stats">
                            <div className="fire-proof-stat">
                                <span className="value" style={{ color: '#00e59b' }}>70%+</span>
                                <span className="label">Break Win Rate</span>
                            </div>
                            <div className="fire-proof-stat">
                                <span className="value" style={{ color: '#fbbf24' }}>30</span>
                                <span className="label">Teams Monitored</span>
                            </div>
                            <div className="fire-proof-stat">
                                <span className="value" style={{ color: '#a78bfa' }}>24/7</span>
                                <span className="label">Live Scanning</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <hr className="fire-divider" />

            {/* ═══ FEATURES ═══ */}
            <section className="fire-features">
                <div className="fire-features-inner">
                    <span className="fire-section-label" style={{ color: '#fbbf24' }}>What You Get</span>
                    <h2 className="fire-section-title">
                        Everything You Need to <span style={{ color: '#fbbf24' }}>Win.</span>
                    </h2>

                    <div className="fire-features-grid">
                        {FEATURES.map((feat, i) => (
                            <div key={i} className="fire-feature-card">
                                <div className="feat-icon" style={{
                                    background: `${feat.color}12`,
                                    border: `1px solid ${feat.color}25`,
                                }}>
                                    <feat.icon size={20} style={{ color: feat.color }} />
                                </div>
                                <h4>{feat.title}</h4>
                                <p>{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <hr className="fire-divider" />

            {/* ═══ PRICING + CHECKOUT ═══ */}
            <section className="fire-pricing" id="fire-checkout">
                <div className="fire-pricing-inner">
                    <span className="fire-section-label" style={{ color: '#ef4444' }}>Get Started Now</span>
                    <h2 className="fire-section-title">
                        Invest in <span style={{ color: '#ef4444' }}>Your Edge.</span>
                    </h2>

                    <div className="fire-price-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                            <Flame size={22} style={{ color: '#ef4444' }} />
                            <span style={{ fontSize: '18px', fontWeight: 800, color: 'white' }}>The Fire Course</span>
                        </div>

                        <div className="fire-price-amount">
                            <span className="currency">$</span>497
                        </div>
                        <div className="fire-price-label">One-time payment · Lifetime access</div>

                        <div className="fire-price-includes">
                            {[
                                '7 in-depth video modules',
                                'Live Pattern System software access',
                                'Double-Up Recovery strategy',
                                'Bankroll management toolkit',
                                'All 30 MLB teams monitored in real-time',
                                'Lifetime access + future updates',
                                'Exclusive Fire Course community',
                            ].map((item, i) => (
                                <div key={i} className="fire-price-item">
                                    <span className="check">
                                        <CheckCircle size={12} style={{ color: '#00e59b' }} />
                                    </span>
                                    {item}
                                </div>
                            ))}
                        </div>

                        <PaymentForm
                            amount={COURSE_PRICE}
                            productName="The Fire Course"
                            onSuccess={(data) => {
                                if (data.accessToken) {
                                    localStorage.setItem('fire_course_token', data.accessToken);
                                }
                                setPurchased(true);
                            }}
                        />

                        <div className="fire-guarantee">
                            <h4>
                                <Shield size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                Secure Purchase
                            </h4>
                            <p>
                                Your payment is processed through Authorize.net with 256-bit encryption.
                                Card data never touches our servers.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <hr className="fire-divider" />

            {/* ═══ UPSELL: Pattern System Software ═══ */}
            <section className="fire-upsell">
                <div className="fire-upsell-inner">
                    <span className="fire-section-label" style={{ color: '#a78bfa' }}>Optional Add-On</span>
                    <h2 className="fire-section-title" style={{ fontSize: 'clamp(20px, 3vw, 28px)' }}>
                        Unlock the Live <span style={{ color: '#a78bfa' }}>Pattern System</span>
                    </h2>
                    <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.7, maxWidth: '440px', margin: '0 auto' }}>
                        The course teaches you the strategy. The software does the scanning for you — 
                        all 30 MLB teams, updated in real-time, with break probability scores and daily alerts.
                    </p>

                    <div className="fire-upsell-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '12px' }}>
                            <TrendingUp size={16} style={{ color: '#a78bfa' }} />
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#a78bfa' }}>Pattern System Pro</span>
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: 900, color: 'white' }}>
                            <span style={{ fontSize: '16px', color: '#6b7280' }}>$</span>49.99
                            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>/month</span>
                        </div>
                        <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', marginBottom: '16px' }}>
                            Cancel anytime · Available after course purchase
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                            {[
                                'Real-time dashboard for all 30 MLB teams',
                                'Break probability scoring (62-99%)',
                                'Today\'s games cross-referenced',
                                'True Pattern & Developing alerts',
                            ].map((f, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#d1d5db' }}>
                                    <Zap size={12} style={{ color: '#a78bfa', flexShrink: 0 }} />
                                    {f}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <hr className="fire-divider" />

            {/* ═══ FAQ ═══ */}
            <section className="fire-faq">
                <div className="fire-faq-inner">
                    <h2 className="fire-section-title" style={{ textAlign: 'center', marginBottom: '32px' }}>
                        Frequently Asked Questions
                    </h2>

                    {FAQS.map((faq, i) => (
                        <div key={i} className="fire-faq-item">
                            <button
                                className="fire-faq-question"
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                            >
                                {faq.q}
                                <ChevronDown size={16} style={{
                                    color: '#6b7280',
                                    transform: openFaq === i ? 'rotate(180deg)' : 'none',
                                    transition: 'transform 0.2s',
                                    flexShrink: 0,
                                }} />
                            </button>
                            {openFaq === i && (
                                <div className="fire-faq-answer">{faq.a}</div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <hr className="fire-divider" />

            {/* ═══ FINAL CTA ═══ */}
            <section className="fire-final-cta">
                <div className="fire-final-inner">
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔥</div>
                    <h2 className="fire-section-title">
                        Stop Guessing. <span style={{ color: '#ef4444' }}>Start Winning.</span>
                    </h2>
                    <p style={{ color: '#9ca3af', fontSize: '15px', lineHeight: 1.7, marginBottom: '28px' }}>
                        The pattern is real. The data is documented. The system works.
                        The only question is whether you&apos;re ready to use it.
                    </p>
                    <button onClick={scrollToCheckout} className="fire-cta-primary">
                        <Flame size={18} /> Get The Fire Course — $497 <ArrowRight size={16} />
                    </button>
                    <p style={{ color: '#4b5563', fontSize: '12px', marginTop: '12px' }}>
                        One-time payment · Lifetime access · 21+ only
                    </p>
                </div>
            </section>

            {/* Mini footer */}
            <div style={{
                padding: '24px 20px',
                borderTop: '1px solid rgba(255,255,255,0.04)',
                textAlign: 'center',
            }}>
                <p style={{ color: '#374151', fontSize: '11px', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}>
                    © {new Date().getFullYear()} TriplePlayz. For entertainment purposes only. Past performance
                    does not guarantee future results. Sports betting involves risk. Must be 21+ and located in
                    a jurisdiction where sports betting is legal. Please bet responsibly.
                </p>
            </div>
        </div>
    );
}
