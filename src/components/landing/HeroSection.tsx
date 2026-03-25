'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Zap, ArrowRight, CheckCircle, Lock, TrendingUp, Shield, Sparkles } from 'lucide-react';
import { trackEvent } from '@/components/Analytics';
import LiveGameTicker from './LiveGameTicker';

const ROTATING_PICKS = [
    { teams: 'NY Yankees @ LA Dodgers', detail: 'ML -135 ⬢⬢⬢⬡⬡', conf: 'HIGH' },
    { teams: 'Houston Astros @ Atlanta Braves', detail: 'Over 8.5 ⬢⬢⬢⬢⬡', conf: 'LOCK 🔒' },
    { teams: 'Philadelphia Phillies @ San Diego', detail: 'Spread -1.5 ⬢⬢⬡⬡⬡', conf: 'MEDIUM' },
    { teams: 'Chicago Cubs @ Boston Red Sox', detail: 'ML +120 ⬢⬢⬢⬡⬡', conf: 'HIGH' },
];

export default function HeroSection() {
    const [pickIdx, setPickIdx] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setPickIdx(i => (i + 1) % ROTATING_PICKS.length), 3500);
        return () => clearInterval(t);
    }, []);

    const pick = ROTATING_PICKS[pickIdx];

    return (
        <section className="relative overflow-hidden" style={{ paddingTop: '20px', paddingBottom: '36px' }}>
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'url(/baseball-hero.png)',
                    backgroundSize: 'cover', backgroundPosition: 'center 40%',
                    opacity: 0.06, filter: 'blur(1px)',
                }} />
                <div className="absolute" style={{
                    top: '20%', left: '50%', transform: 'translateX(-50%)',
                    width: '600px', height: '600px',
                    background: 'radial-gradient(circle, rgba(0,229,155,0.08) 0%, transparent 70%)',
                }} />
                {/* Subtle diamond sparkle accents */}
                <div style={{
                    position: 'absolute', top: '10%', left: '15%',
                    width: '3px', height: '3px', borderRadius: '50%',
                    background: '#00e59b', boxShadow: '0 0 8px rgba(0,229,155,0.5)',
                    animation: 'pulse 3s ease infinite',
                }} />
                <div style={{
                    position: 'absolute', top: '25%', right: '12%',
                    width: '2px', height: '2px', borderRadius: '50%',
                    background: '#fbbf24', boxShadow: '0 0 6px rgba(251,191,36,0.4)',
                    animation: 'pulse 4s ease infinite 1s',
                }} />
                <div style={{
                    position: 'absolute', bottom: '30%', left: '8%',
                    width: '2px', height: '2px', borderRadius: '50%',
                    background: '#818cf8', boxShadow: '0 0 6px rgba(129,140,248,0.4)',
                    animation: 'pulse 3.5s ease infinite 0.5s',
                }} />
            </div>

            <div style={{
                width: '100%', maxWidth: '760px', margin: '0 auto', padding: '0 20px',
                display: 'flex', flexDirection: 'column' as const,
                alignItems: 'center', textAlign: 'center' as const,
                position: 'relative' as const, zIndex: 1,
            }}>
                {/* Live games ticker */}
                <LiveGameTicker />

                {/* Rotating locked pick teaser */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                        width: '100%', maxWidth: '440px', marginBottom: '22px',
                        position: 'relative', overflow: 'hidden',
                        borderRadius: '14px',
                        border: '1px solid rgba(0,229,155,0.15)',
                        background: 'linear-gradient(135deg, rgba(0,229,155,0.05), rgba(251,191,36,0.03))',
                        padding: '14px 18px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#00e59b', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444', animation: 'pulse 1.5s infinite' }} />
                            🔒 Today&apos;s Premium Pick
                        </span>
                        <span style={{
                            fontSize: '9px', fontWeight: 700,
                            color: pick.conf === 'LOCK 🔒' ? '#ef4444' : '#fbbf24',
                            background: pick.conf === 'LOCK 🔒' ? 'rgba(239,68,68,0.12)' : 'rgba(251,191,36,0.12)',
                            padding: '2px 8px', borderRadius: '4px',
                        }}>
                            {pick.conf}
                        </span>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pickIdx}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{ color: '#e5e7eb', fontSize: '14px', fontWeight: 700, filter: 'blur(5px)', userSelect: 'none' }}>
                                    {pick.teams} — {pick.detail}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Subscribe overlay */}
                    <Link href="/pricing" style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(4,8,16,0.25)', backdropFilter: 'blur(1px)',
                        color: '#00e59b', fontSize: '13px', fontWeight: 700,
                        textDecoration: 'none', gap: '6px',
                        transition: 'background 0.2s',
                    }}>
                        <Lock size={14} />
                        Unlock Premium Picks
                    </Link>
                </motion.div>

                {/* Social proof badge */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ marginBottom: '18px' }}
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
                    style={{ fontSize: 'clamp(30px, 5vw, 54px)', fontWeight: 900, lineHeight: 1.08, marginBottom: '16px', color: 'white' }}
                >
                    The Picks That{' '}
                    <span className="gradient-text">Beat Vegas</span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.6 }}
                    style={{ color: '#d1d5db', fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: 1.7, marginBottom: '20px', maxWidth: '540px' }}
                >
                    Expert analysis, real-time odds from{' '}
                    <span style={{ color: '#fbbf24', fontWeight: 600 }}>11+ sportsbooks</span>,
                    and a premium community backed by{' '}
                    <span style={{ color: '#00e59b', fontWeight: 600 }}>30+ years of experience</span>.
                </motion.p>

                {/* Value props */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{ display: 'flex', flexWrap: 'wrap' as const, justifyContent: 'center', gap: '14px', marginBottom: '24px' }}
                >
                    {[
                        { icon: <TrendingUp size={14} style={{ color: '#00e59b' }} />, text: 'Live odds & analysis' },
                        { icon: <Shield size={14} style={{ color: '#00e59b' }} />, text: 'Transparent W/L record' },
                        { icon: <CheckCircle size={14} style={{ color: '#00e59b' }} />, text: 'Exclusive community' },
                    ].map((prop, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#e5e7eb', fontSize: '14px' }}>
                            {prop.icon}
                            {prop.text}
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
                        style={{ flex: '1 1 200px', maxWidth: '300px', textAlign: 'center' as const, justifyContent: 'center' }}
                        onClick={() => trackEvent('cta_click', { location: 'hero', label: 'join_now' })}
                    >
                        <Zap size={16} />
                        Join TriplePlayz — Get Picks Now
                    </Link>
                    <Link
                        href="/dashboard?signup=free"
                        className="btn-outline"
                        style={{ flex: '1 1 160px', maxWidth: '260px', textAlign: 'center' as const, justifyContent: 'center' }}
                        onClick={() => trackEvent('cta_click', { location: 'hero', label: 'free_account' })}
                    >
                        <Sparkles size={14} />
                        Try Free — No Card Required
                    </Link>
                </motion.div>

                {/* Trust line */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{ fontSize: '13px', color: '#9ca3af', marginTop: '14px' }}
                >
                    ⚡ Free game analysis • 1,200+ members • Cancel anytime • 21+ only
                </motion.p>
            </div>
        </section>
    );
}
