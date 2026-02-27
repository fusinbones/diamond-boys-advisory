'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { trackEvent } from '@/components/Analytics';

export default function HeroSection() {
    return (
        <section
            className="relative flex items-center justify-center overflow-hidden"
            style={{ minHeight: 'calc(100vh - 96px)' }}
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
                    maxWidth: '680px',
                    margin: '0 auto',
                    padding: '40px 24px',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    alignItems: 'center',
                    textAlign: 'center' as const,
                }}
            >
                {/* Social proof badge */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ marginBottom: '24px' }}
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
                    style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, lineHeight: 1.1, marginBottom: '20px', color: 'white' }}
                >
                    Unlock Winning{' '}
                    <span className="gradient-text">College Basketball</span> Picks
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.6 }}
                    style={{ color: '#d1d5db', fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: 1.7, marginBottom: '24px', maxWidth: '520px' }}
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
                    style={{ display: 'flex', flexWrap: 'wrap' as const, justifyContent: 'center', gap: '16px', marginBottom: '28px' }}
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
                        onClick={() => trackEvent('cta_click', { location: 'hero', label: 'get_started' })}
                    >
                        <Zap size={16} />
                        Get Started — From $39/mo
                    </Link>
                    <Link
                        href="/pricing"
                        className="btn-outline"
                        style={{ flex: '1 1 160px', maxWidth: '220px', textAlign: 'center' as const, justifyContent: 'center' }}
                        onClick={() => trackEvent('cta_click', { location: 'hero', label: 'view_plans' })}
                    >
                        View All Plans
                        <ArrowRight size={14} />
                    </Link>
                </motion.div>

                {/* Trust line */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{ fontSize: '13px', color: '#9ca3af', marginTop: '16px' }}
                >
                    ⚡ 7-day free trial on Daily Picks • Cancel anytime • Secure Stripe payments
                </motion.p>
            </div>
        </section>
    );
}
