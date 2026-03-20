'use client';

import { motion } from 'framer-motion';
import {
    Zap, Star, Crown, Gem, Check,
    Trophy, Users, Target, Bell,
} from 'lucide-react';
import Link from 'next/link';
import { tiers, Tier } from '@/lib/tiers';

const tierIcons: Record<string, React.ReactNode> = {
    weekly: <Star size={20} />,
    monthly: <Crown size={20} />,
    season: <Gem size={20} />,
};

const tierAccents: Record<string, { color: string; bg: string; border: string }> = {
    weekly: { color: '#00e59b', bg: 'rgba(0,229,155,0.08)', border: 'rgba(0,229,155,0.15)' },
    monthly: { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)' },
    season: { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.15)' },
};

const perks = [
    { icon: Target, title: 'Expert Picks Daily', desc: 'Data-driven MLB picks with confidence ratings.' },
    { icon: Users, title: 'Private Discord', desc: 'Real-time alerts, discussions, and game breakdowns.' },
    { icon: Trophy, title: '65% Win Rate', desc: 'Fully documented, transparent record.' },
    { icon: Bell, title: 'Instant Alerts', desc: 'Line movement notifications straight to your phone.' },
];

export default function PricingPage() {
    return (
        <div style={{ paddingTop: '32px', paddingBottom: '60px' }}>
            <div className="container-db" style={{ maxWidth: '1100px' }}>
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: 'center', marginBottom: '36px' }}
                >
                    <span className="badge-emerald" style={{ padding: '7px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <span className="live-dot" />
                        Early Access — Founding Member Pricing
                    </span>
                    <h1 className="font-display" style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: '14px' }}>
                        Choose Your{' '}
                        <span className="gradient-text">Game Plan</span>
                    </h1>
                    <p style={{ color: '#d1d5db', fontSize: 'clamp(15px, 2vw, 17px)', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto' }}>
                        Sign up for early access at your preferred tier. Lock in founding member pricing before we launch.
                    </p>
                </motion.div>

                {/* Pricing Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '14px',
                    marginBottom: '40px',
                }}>
                    {tiers.map((tier, i) => (
                        <motion.div
                            key={tier.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <TierCard tier={tier} />
                        </motion.div>
                    ))}
                </div>

                {/* What You Get */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <h2 className="font-display" style={{ fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: '20px' }}>
                        What Every Member Gets
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                        {perks.map((perk, i) => (
                            <motion.div
                                key={perk.title}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.55 + i * 0.06 }}
                                className="glass-card"
                                style={{ padding: '20px', textAlign: 'center' }}
                            >
                                <perk.icon size={20} style={{ color: '#00e59b', margin: '0 auto 10px' }} />
                                <h3 style={{ color: 'white', fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>{perk.title}</h3>
                                <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.5 }}>{perk.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Trust */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    style={{ textAlign: 'center', marginTop: '28px' }}
                >
                    <p style={{ color: '#6b7280', fontSize: '13px' }}>
                        💎 Already trusted by 1,200+ sports bettors • For entertainment purposes only • 21+
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

// ── Per-Tier Card with Email Signup ─────────────

function TierCard({ tier }: { tier: Tier }) {
    const accent = tierAccents[tier.id] || tierAccents.weekly;

    return (
        <div
            className="glass-card"
            style={{
                padding: '24px 20px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                borderColor: tier.popular ? accent.border : undefined,
                borderWidth: tier.popular ? '2px' : undefined,
            }}
        >
            {/* Popular glow */}
            {tier.popular && (
                <div style={{
                    position: 'absolute', top: '-60%', left: '50%', transform: 'translateX(-50%)',
                    width: '300px', height: '300px',
                    background: `radial-gradient(circle, ${accent.bg} 0%, transparent 70%)`,
                    pointerEvents: 'none',
                }} />
            )}

            <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Badge */}
                {tier.badge && (
                    <div style={{ marginBottom: '12px' }}>
                        <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: accent.color,
                            background: accent.bg,
                            border: `1px solid ${accent.border}`,
                            padding: '3px 10px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                        }}>
                            {tier.popular && <Star size={10} style={{ fill: accent.color }} />}
                            {tier.badge}
                        </span>
                    </div>
                )}

                {/* Icon + Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ color: accent.color }}>{tierIcons[tier.id]}</span>
                    <h3 style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>{tier.name}</h3>
                </div>

                {/* Price */}
                <div style={{ marginBottom: '10px' }}>
                    <span style={{ fontSize: '36px', fontWeight: 900, color: 'white', fontFamily: 'var(--font-display)' }}>${tier.price}</span>
                    <span style={{ color: '#6b7280', fontSize: '13px', marginLeft: '4px' }}>{tier.intervalLabel}</span>
                </div>

                {/* Description */}
                <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '16px', lineHeight: 1.5 }}>{tier.description}</p>

                {/* Features */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', flex: 1 }}>
                    {tier.features.map((feat, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                            <Check size={14} style={{ color: '#00e59b', marginTop: '2px', flexShrink: 0 }} />
                            <span style={{ color: '#d1d5db', fontSize: '13px' }}>{feat}</span>
                        </li>
                    ))}
                </ul>

                {/* Subscribe CTA */}
                <Link
                    href={`/checkout?tier=${tier.id}`}
                    className={tier.popular ? 'btn-glow' : 'btn-outline'}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px',
                        fontSize: '14px',
                        fontWeight: 700,
                        borderRadius: '12px',
                    }}
                >
                    <Zap size={14} />
                    {tier.trialDays ? `Start ${tier.trialDays}-Day Free Trial` : 'Subscribe Now'}
                </Link>
                <p style={{ textAlign: 'center', fontSize: '10px', color: '#4b5563', marginTop: '6px' }}>
                    🔒 Secure payment via Stripe. Cancel anytime.
                </p>
            </div>
        </div>
    );
}
