'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, BarChart3, MessageCircle, Zap, ChevronRight, Gift, Lock, Star } from 'lucide-react';

const freePerks = [
    { icon: BarChart3, title: '5 Free Game Analyses / Week', desc: 'Tap any game on the ticker for full odds breakdown, matchup stats, and picks preview.' },
    { icon: MessageCircle, title: 'Community Chat Access', desc: 'Join the Diamond Lounge free lobby — connect with fellow sports fans in real time.' },
    { icon: Gift, title: 'Freebie Picks', desc: 'Get curated free picks every day, powered by our data-driven algorithm across multiple sportsbooks.' },
    { icon: Star, title: 'Live MLB Odds Ticker', desc: 'Real-time odds from 5+ sportsbooks, line movement alerts, and game schedules at your fingertips.' },
];

export default function FreeSignupSection() {
    return (
        <section style={{ position: 'relative', padding: '60px 0', overflow: 'hidden' }}>
            {/* Background accent */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '600px', height: '600px',
                background: 'radial-gradient(circle, rgba(0,229,155,0.06) 0%, transparent 60%)',
                pointerEvents: 'none',
            }} />

            <div className="container-db" style={{ maxWidth: '900px', position: 'relative' }}>
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ textAlign: 'center', marginBottom: '36px' }}
                >
                    <span className="badge-emerald" style={{
                        padding: '7px 18px', fontSize: '13px',
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        marginBottom: '16px',
                    }}>
                        <Sparkles size={13} />
                        100% Free — No Credit Card
                    </span>

                    <h2 className="font-display" style={{
                        fontSize: 'clamp(24px, 4vw, 40px)',
                        fontWeight: 900, color: 'white',
                        lineHeight: 1.1, marginBottom: '14px',
                    }}>
                        Start Winning{' '}
                        <span className="gradient-text">Before You Pay</span>
                    </h2>

                    <p style={{
                        color: '#d1d5db', fontSize: 'clamp(14px, 2vw, 17px)',
                        lineHeight: 1.65, maxWidth: '560px', margin: '0 auto',
                    }}>
                        Create a free Diamond Boys account and get instant access to game analysis,
                        community chat, and daily free picks. Upgrade only when you&apos;re ready.
                    </p>
                </motion.div>

                {/* Free perks grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '14px',
                    marginBottom: '32px',
                }}>
                    {freePerks.map((perk, i) => (
                        <motion.div
                            key={perk.title}
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                            className="glass-card"
                            style={{ padding: '22px 18px', textAlign: 'center' }}
                        >
                            <div style={{
                                width: '42px', height: '42px', borderRadius: '12px',
                                background: 'rgba(0,229,155,0.08)',
                                border: '1px solid rgba(0,229,155,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 12px',
                            }}>
                                <perk.icon size={20} style={{ color: '#00e59b' }} />
                            </div>
                            <h3 style={{ color: 'white', fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
                                {perk.title}
                            </h3>
                            <p style={{ color: '#9ca3af', fontSize: '12px', lineHeight: 1.5 }}>
                                {perk.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    style={{ textAlign: 'center' }}
                >
                    <Link
                        href="/dashboard?signup=free"
                        className="btn-glow btn-glow-lg pulse-ring"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '10px',
                            padding: '16px 40px', fontSize: '16px', fontWeight: 700,
                            borderRadius: '14px',
                        }}
                    >
                        <Sparkles size={18} />
                        Create Free Account — Takes 10 Seconds
                    </Link>

                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '20px', marginTop: '14px', flexWrap: 'wrap',
                    }}>
                        <span style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Lock size={10} />
                            No credit card needed
                        </span>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>•</span>
                        <span style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Zap size={10} />
                            Instant access
                        </span>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>•</span>
                        <span style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ChevronRight size={10} />
                            Upgrade anytime
                        </span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
