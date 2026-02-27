'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { trackEvent } from '@/components/Analytics';

const recentWins = [
    { pick: 'Yankees -1.5', result: 'WON', odds: '-115', sport: 'MLB' },
    { pick: 'Dodgers ML', result: 'WON', odds: '+130', sport: 'MLB' },
    { pick: 'Braves -1.5', result: 'WON', odds: '-105', sport: 'MLB' },
    { pick: 'Astros Over 8.5', result: 'WON', odds: '-110', sport: 'MLB' },
    { pick: 'Mets ML', result: 'WON', odds: '+145', sport: 'MLB' },
    { pick: 'Padres -1.5', result: 'WON', odds: '+110', sport: 'MLB' },
    { pick: 'Phillies ML', result: 'WON', odds: '-120', sport: 'MLB' },
    { pick: 'Cubs Under 7.5', result: 'WON', odds: '-105', sport: 'MLB' },
];

function WinsTicker() {
    const doubled = [...recentWins, ...recentWins];
    return (
        <div style={{ width: '100%', overflow: 'hidden', marginBottom: '20px' }}>
            <p style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: '10px' }}>
                Recent Verified Picks
            </p>
            <div style={{ position: 'relative', overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)' }}>
                <motion.div
                    animate={{ x: ['0%', '-50%'] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'flex', gap: '10px', width: 'max-content' }}
                >
                    {doubled.map((w, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'rgba(0,229,155,0.06)',
                                border: '1px solid rgba(0,229,155,0.12)',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                            }}
                        >
                            <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>{w.sport}</span>
                            <span style={{ fontSize: '14px', color: '#e5e7eb', fontWeight: 600 }}>{w.pick}</span>
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>({w.odds})</span>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#00e59b',
                                background: 'rgba(0,229,155,0.2)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                letterSpacing: '0.05em',
                            }}>
                                ✓ {w.result}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}

export default function HeroSection() {
    return (
        <section
            className="relative overflow-hidden"
            style={{ paddingTop: '24px', paddingBottom: '40px' }}
        >
            {/* Subtle glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute rounded-full"
                    style={{
                        top: '30%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '500px',
                        height: '500px',
                        background: 'radial-gradient(circle, rgba(0,229,155,0.06) 0%, transparent 70%)',
                    }}
                />
            </div>

            <div
                style={{
                    width: '100%',
                    maxWidth: '720px',
                    margin: '0 auto',
                    padding: '0 24px',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    alignItems: 'center',
                    textAlign: 'center' as const,
                    position: 'relative' as const,
                }}
            >
                {/* Live wins ticker — fills dead space, instant social proof */}
                <WinsTicker />

                {/* Social proof badge */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ marginBottom: '20px' }}
                >
                    <span className="badge-emerald" style={{ padding: '7px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <span className="live-dot" />
                        Live Now — 1,200+ Active Members
                    </span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="font-display"
                    style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, lineHeight: 1.1, marginBottom: '18px', color: 'white' }}
                >
                    Unlock Winning{' '}
                    <span className="gradient-text">Baseball</span> Picks
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.6 }}
                    style={{ color: '#d1d5db', fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: 1.7, marginBottom: '22px', maxWidth: '520px' }}
                >
                    Daily expert analysis, proven picks with a{' '}
                    <span style={{ color: '#00e59b', fontWeight: 600 }}>65% documented win rate</span>,
                    and an exclusive Discord community.
                </motion.p>

                {/* Value props */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{ display: 'flex', flexWrap: 'wrap' as const, justifyContent: 'center', gap: '16px', marginBottom: '26px' }}
                >
                    {['Daily picks that beat the line', 'Private Discord community', 'Fully transparent record'].map((prop, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#e5e7eb', fontSize: '14px' }}>
                            <CheckCircle size={15} style={{ color: '#00e59b', flexShrink: 0 }} />
                            {prop}
                        </span>
                    ))}
                </motion.div>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '10px', justifyContent: 'center', width: '100%' }}
                >
                    <Link
                        href="/pricing"
                        className="btn-glow btn-glow-lg pulse-ring"
                        style={{ flex: '1 1 200px', maxWidth: '280px', textAlign: 'center' as const, justifyContent: 'center' }}
                        onClick={() => trackEvent('cta_click', { location: 'hero', label: 'early_access' })}
                    >
                        <Zap size={16} />
                        Get Early Access — Free
                    </Link>
                    <Link
                        href="/pricing"
                        className="btn-outline"
                        style={{ flex: '1 1 160px', maxWidth: '220px', textAlign: 'center' as const, justifyContent: 'center' }}
                        onClick={() => trackEvent('cta_click', { location: 'hero', label: 'whats_coming' })}
                    >
                        See What&apos;s Coming
                        <ArrowRight size={14} />
                    </Link>
                </motion.div>

                {/* Trust line */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{ fontSize: '13px', color: '#9ca3af', marginTop: '14px' }}
                >
                    ⚡ Launching soon • No credit card required • Be the first to know
                </motion.p>
            </div>
        </section>
    );
}
