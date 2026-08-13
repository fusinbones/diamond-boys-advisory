'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import {
    ArrowUpDown,
    TrendingUp,
    Target,
    Flame,
    Filter,
    Bell,
    ChevronDown,
    Check,
    Zap,
    ScanSearch,
    Radar,
    BarChart3,
    Shield,
} from 'lucide-react';
import './pattern-system.css';

/* ── Animated Counter ─────────────────────────────────────────────────── */
function AnimatedStat({
    value,
    suffix,
    label,
    colorClass,
}: {
    value: number;
    suffix: string;
    label: string;
    colorClass: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        if (!isInView) return;

        let cancelled = false;
        const duration = 1600;
        const startTime = performance.now();

        const animate = (now: number) => {
            if (cancelled) return;
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(Math.floor(eased * value));
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setDisplayValue(value);
            }
        };

        requestAnimationFrame(animate);
        return () => {
            cancelled = true;
        };
    }, [isInView, value]);

    return (
        <motion.div
            ref={ref}
            className="ps-stat-card ps-glass"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
        >
            <div className={`ps-stat-value ${colorClass}`}>
                {displayValue}
                {suffix}
            </div>
            <div className="ps-stat-label">{label}</div>
        </motion.div>
    );
}

/* ── FAQ Item ─────────────────────────────────────────────────────────── */
function FaqItem({ question, answer }: { question: string; answer: string }) {
    const [open, setOpen] = useState(false);

    return (
        <div className={`ps-faq-item ${open ? 'open' : ''}`}>
            <button
                className="ps-faq-question"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
            >
                {question}
                <ChevronDown size={18} className="ps-faq-chevron" />
            </button>
            <div className="ps-faq-answer-wrapper">
                <div className="ps-faq-answer">
                    <div className="ps-faq-answer-inner">{answer}</div>
                </div>
            </div>
        </div>
    );
}

/* ── Preview Data ─────────────────────────────────────────────────────── */
const previewTeams = [
    {
        name: 'Yankees',
        pattern: ['W', 'L', 'W', 'L', 'W', 'L', 'W'],
        breakPct: 73,
        badges: [{ label: '🔥 TRUE PATTERN', type: 'true-pattern' }],
    },
    {
        name: 'Dodgers',
        pattern: ['W', 'L', 'W', 'L', 'W', 'L'],
        breakPct: 62,
        badges: [
            { label: '🔥 TRUE PATTERN', type: 'true-pattern' },
            { label: '🎯 W#10', type: 'milestone' },
        ],
    },
    {
        name: 'Red Sox',
        pattern: ['W', 'L', 'W', 'L', 'W'],
        breakPct: 15,
        badges: [
            { label: '👀 DEVELOPING', type: 'developing' },
            { label: '💣 REVENGE', type: 'revenge' },
        ],
    },
];

/* ── Feature Data ─────────────────────────────────────────────────────── */
const features = [
    {
        icon: ArrowUpDown,
        title: 'Real-Time Pattern Analysis',
        desc: 'All 30 MLB teams scanned continuously for W/L alternation patterns',
        iconBg: 'rgba(167, 139, 250, 0.1)',
        iconColor: '#a78bfa',
        accent: '#a78bfa44',
    },
    {
        icon: TrendingUp,
        title: 'Break Probability Scoring',
        desc: '62-99% accuracy scoring based on historical data across 91+ tracked patterns',
        iconBg: 'rgba(0, 229, 155, 0.1)',
        iconColor: '#00e59b',
        accent: '#00e59b44',
    },
    {
        icon: Target,
        title: 'Pitcher Milestone Alerts',
        desc: 'Know when a starting pitcher is going for Win #10 — a key situational edge',
        iconBg: 'rgba(34, 211, 238, 0.1)',
        iconColor: '#22d3ee',
        accent: '#22d3ee44',
    },
    {
        icon: Flame,
        title: 'Walk-Off Revenge Detection',
        desc: 'Automatic detection of revenge games after walk-off home runs',
        iconBg: 'rgba(251, 146, 60, 0.1)',
        iconColor: '#fb923c',
        accent: '#fb923c44',
    },
    {
        icon: Filter,
        title: 'Smart Filters & Search',
        desc: 'Filter by True Pattern, Developing, Today\'s Games, or Alerts. Sort by break %, streak, or division',
        iconBg: 'rgba(167, 139, 250, 0.1)',
        iconColor: '#a78bfa',
        accent: '#a78bfa44',
    },
    {
        icon: Bell,
        title: 'Situational Alerts',
        desc: 'High-priority alerts surface the most actionable games each day',
        iconBg: 'rgba(0, 229, 155, 0.1)',
        iconColor: '#00e59b',
        accent: '#00e59b44',
    },
];

/* ── Steps Data ───────────────────────────────────────────────────────── */
const steps = [
    {
        num: 1,
        icon: ScanSearch,
        title: 'Scan',
        desc: 'We monitor all 30 MLB teams for strict W-L-W-L alternating patterns',
    },
    {
        num: 2,
        icon: Radar,
        title: 'Detect',
        desc: 'When a team reaches 4+ consecutive alternations, we flag it as developing',
    },
    {
        num: 3,
        icon: BarChart3,
        title: 'Score',
        desc: 'At 6+ games, the algorithm calculates break probability (62-99%)',
    },
    {
        num: 4,
        icon: Zap,
        title: 'Alert',
        desc: 'You get the prediction before the pattern breaks — plus pitcher milestones & revenge games',
    },
];

/* ── FAQ Data ─────────────────────────────────────────────────────────── */
const faqItems = [
    {
        q: 'What is The .500 Method?',
        a: 'The .500 Method is based on the observation that MLB teams naturally regress toward a .500 winning percentage over time. Our Pattern System identifies when teams are in strict win-loss alternating patterns and predicts the most likely break point using historical probability data.',
    },
    {
        q: 'How accurate is the break prediction?',
        a: "Based on last season's data, 62% of true patterns (6+ alternating games) broke at Game 7. By Game 9, 73% had broken. By Game 12, 94% had broken. The break probability score reflects these historical rates.",
    },
    {
        q: 'Can I cancel anytime?',
        a: 'Yes. Your subscription is billed monthly at $49.99 and you can cancel at any time from your account settings. No long-term contracts or hidden fees.',
    },
    {
        q: 'What sports does this cover?',
        a: 'The Pattern System currently covers all 30 MLB teams during the regular season. We scan games daily and update in real-time.',
    },
    {
        q: 'Do I need an account?',
        a: "Yes — you'll create a free TriplePlayz account during checkout. This gives you immediate access to the Pattern System dashboard after payment.",
    },
];

/* ── Pricing Features ─────────────────────────────────────────────────── */
const pricingFeatures = [
    'Real-time pattern analysis for all 30 MLB teams',
    'Break probability scoring (62-99% accuracy)',
    'Pitcher milestone alerts (Win #10, etc.)',
    'Walk-off revenge game detection',
    'Smart filters, search & sorting',
    'High-priority situational alerts',
    'Full access to the Pattern System dashboard',
];

/* ── Motion Variants ──────────────────────────────────────────────────── */
const fadeUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true } as const,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
};

const stagger = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true } as const,
};

/* ── Page Component ───────────────────────────────────────────────────── */
export default function PatternSystemPage() {
    return (
        <div className="ps-page">
            {/* ─── Header ─────────────────────────────────────── */}
            <header className="ps-header">
                <Image
                    src="/brand/logo-primary.png"
                    alt="YourSwami"
                    width={36}
                    height={36}
                    className="ps-header-logo"
                />
                <span className="ps-header-name">TriplePlayz</span>
            </header>

            {/* ─── Hero ───────────────────────────────────────── */}
            <section className="ps-hero" id="hero">
                <div className="ps-hero-orb" />
                <motion.div
                    className="ps-hero-content"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    <div className="ps-hero-badge">
                        <Zap size={14} />
                        From The .500 Method
                    </div>
                    <h1 className="ps-hero-title ps-gradient-text">
                        The Pattern System
                    </h1>
                    <p className="ps-hero-subtitle">
                        Our proprietary W/L alternation algorithm scans all 30 MLB
                        teams in real-time, identifying high-probability break points
                        with 62-99% accuracy.
                    </p>
                    <Link href="/pattern-system/checkout" className="ps-cta-btn">
                        Get Access — $49.99/mo
                    </Link>
                    <p className="ps-hero-disclaimer">
                        Cancel anytime · No long-term commitment
                    </p>
                </motion.div>
            </section>

            {/* ─── Stats Bar ──────────────────────────────────── */}
            <section className="ps-stats">
                <div className="ps-stats-grid">
                    <AnimatedStat
                        value={62}
                        suffix="%"
                        label="Break rate at Game 7"
                        colorClass="ps-purple"
                    />
                    <AnimatedStat
                        value={91}
                        suffix=""
                        label="Patterns tracked last season"
                        colorClass="ps-green"
                    />
                    <AnimatedStat
                        value={30}
                        suffix=""
                        label="Teams scanned daily"
                        colorClass="ps-cyan"
                    />
                    <AnimatedStat
                        value={99}
                        suffix="%"
                        label="Max break probability"
                        colorClass="ps-orange"
                    />
                </div>
            </section>

            {/* ─── How It Works ───────────────────────────────── */}
            <section className="ps-section" id="how-it-works">
                <motion.div {...fadeUp}>
                    <p className="ps-section-label">The Algorithm</p>
                    <h2 className="ps-section-title ps-gradient-text">
                        How The .500 Method Works
                    </h2>
                    <p className="ps-section-subtitle">
                        Four steps from raw game data to actionable predictions
                    </p>
                </motion.div>
                <div className="ps-steps">
                    {steps.map((step, i) => {
                        const Icon = step.icon;
                        return (
                            <motion.div
                                key={step.num}
                                className="ps-step"
                                {...stagger}
                                transition={{
                                    duration: 0.5,
                                    delay: i * 0.15,
                                }}
                            >
                                <div className="ps-step-number">{step.num}</div>
                                <div className="ps-step-icon">
                                    <Icon size={24} />
                                </div>
                                <h3 className="ps-step-title">{step.title}</h3>
                                <p className="ps-step-desc">{step.desc}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* ─── Features ───────────────────────────────────── */}
            <section className="ps-section" id="features">
                <motion.div {...fadeUp}>
                    <p className="ps-section-label">Features</p>
                    <h2 className="ps-section-title ps-gradient-text">
                        Everything You Get
                    </h2>
                    <p className="ps-section-subtitle">
                        A complete toolkit for pattern-based MLB analysis
                    </p>
                </motion.div>
                <div className="ps-features-grid">
                    {features.map((feat, i) => {
                        const Icon = feat.icon;
                        return (
                            <motion.div
                                key={feat.title}
                                className="ps-feature-card ps-glass"
                                style={
                                    {
                                        '--icon-bg': feat.iconBg,
                                        '--icon-color': feat.iconColor,
                                        '--card-accent': feat.accent,
                                    } as React.CSSProperties
                                }
                                {...stagger}
                                transition={{
                                    duration: 0.5,
                                    delay: i * 0.1,
                                }}
                            >
                                <div className="ps-feature-icon">
                                    <Icon size={22} />
                                </div>
                                <h3 className="ps-feature-title">{feat.title}</h3>
                                <p className="ps-feature-desc">{feat.desc}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* ─── Preview ────────────────────────────────────── */}
            <section className="ps-section" id="preview">
                <motion.div {...fadeUp}>
                    <p className="ps-section-label">Preview</p>
                    <h2 className="ps-section-title ps-gradient-text">
                        See It In Action
                    </h2>
                    <p className="ps-section-subtitle">
                        Live pattern data from the dashboard — updated every game day
                    </p>
                </motion.div>
                <motion.div
                    className="ps-preview-wrapper"
                    {...fadeUp}
                    transition={{ duration: 0.7, delay: 0.2 }}
                >
                    <div className="ps-preview-blur" />
                    <div className="ps-preview-rows">
                        {previewTeams.map((team) => (
                            <div key={team.name} className="ps-preview-row">
                                <div className="ps-preview-team">
                                    <span className="ps-preview-team-name">
                                        {team.name}
                                    </span>
                                </div>
                                <div className="ps-preview-dots">
                                    {team.pattern.map((result, j) => (
                                        <span
                                            key={j}
                                            className={`ps-preview-dot ${
                                                result === 'W' ? 'win' : 'loss'
                                            }`}
                                        >
                                            {result}
                                        </span>
                                    ))}
                                </div>
                                <div className="ps-preview-right">
                                    <span className="ps-preview-pct">
                                        {team.breakPct}%
                                    </span>
                                    <div className="ps-preview-badges">
                                        {team.badges.map((badge, k) => (
                                            <span
                                                key={k}
                                                className={`ps-preview-badge ${badge.type}`}
                                            >
                                                {badge.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ─── Pricing ────────────────────────────────────── */}
            <section className="ps-section" id="pricing">
                <motion.div {...fadeUp}>
                    <p className="ps-section-label">Pricing</p>
                    <h2 className="ps-section-title ps-gradient-text">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="ps-section-subtitle">
                        One plan. Full access. Cancel anytime.
                    </p>
                </motion.div>
                <motion.div
                    className="ps-pricing-wrapper"
                    {...fadeUp}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className="ps-pricing-card">
                        <h3 className="ps-pricing-title">The .500 Method</h3>
                        <p className="ps-pricing-subtitle">
                            Pattern System — Full Access
                        </p>
                        <div className="ps-pricing-amount">
                            <span className="ps-pricing-dollar">$49.99</span>
                            <span className="ps-pricing-period">/month</span>
                        </div>
                        <p className="ps-pricing-billed">Billed monthly · Cancel anytime</p>
                        <ul className="ps-pricing-features">
                            {pricingFeatures.map((feat) => (
                                <li key={feat} className="ps-pricing-feature">
                                    <span className="ps-pricing-check">
                                        <Check size={12} />
                                    </span>
                                    {feat}
                                </li>
                            ))}
                        </ul>
                        <Link
                            href="/pattern-system/checkout"
                            className="ps-cta-btn"
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            Start Now
                        </Link>
                        <p className="ps-pricing-footer">
                            <Shield size={14} />
                            Secure checkout powered by Stripe · Cancel anytime
                        </p>
                    </div>
                </motion.div>
            </section>

            {/* ─── FAQ ─────────────────────────────────────────── */}
            <section className="ps-section" id="faq">
                <motion.div {...fadeUp}>
                    <p className="ps-section-label">Support</p>
                    <h2 className="ps-section-title ps-gradient-text">
                        Frequently Asked Questions
                    </h2>
                    <p className="ps-section-subtitle">
                        Everything you need to know before subscribing
                    </p>
                </motion.div>
                <motion.div
                    className="ps-faq-list"
                    {...fadeUp}
                    transition={{ duration: 0.6, delay: 0.15 }}
                >
                    {faqItems.map((item) => (
                        <FaqItem
                            key={item.q}
                            question={item.q}
                            answer={item.a}
                        />
                    ))}
                </motion.div>
            </section>

            {/* ─── Final CTA ──────────────────────────────────── */}
            <section className="ps-final-cta">
                <div className="ps-final-cta-bg" />
                <motion.div className="ps-final-cta-content" {...fadeUp}>
                    <h2 className="ps-final-cta-title ps-gradient-text">
                        Ready to See the Patterns?
                    </h2>
                    <p className="ps-final-cta-subtitle">
                        Join the system that turns win-loss streaks into predictions.
                    </p>
                    <Link href="/pattern-system/checkout" className="ps-cta-btn">
                        Get Access — $49.99/mo
                    </Link>
                </motion.div>
            </section>

            {/* ─── Footer ─────────────────────────────────────── */}
            <footer className="ps-footer">
                <p className="ps-footer-text">
                    © 2025 TriplePlayz. For entertainment purposes only. 21+.
                </p>
                <div className="ps-footer-links">
                    <Link href="/terms" className="ps-footer-link">
                        Terms
                    </Link>
                    <Link href="/privacy" className="ps-footer-link">
                        Privacy
                    </Link>
                </div>
            </footer>
        </div>
    );
}
