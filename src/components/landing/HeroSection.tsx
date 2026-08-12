'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle, Lock, TrendingUp, Shield, Sparkles } from 'lucide-react';
import { trackEvent } from '@/components/Analytics';

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
            {/* Background, royal purple glow + throne character bleed */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(1000px 600px at 80% 45%, rgba(106,0,255,0.28), transparent 60%), radial-gradient(680px 460px at 8% 10%, rgba(106,0,255,0.14), transparent 60%)',
                }} />
                {/* Desktop throne character, bleeds off the right (desktop only) */}
                <div className="hidden lg:block" style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '48%' }}>
                    <Image src="/brand/hero-swami.webp" alt="Follow the Swami" fill priority sizes="48vw" style={{ objectFit: 'cover', objectPosition: 'left center' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #0a0512 0%, rgba(10,5,18,0.5) 34%, transparent 62%), linear-gradient(0deg, #0a0512 2%, transparent 20%)' }} />
                </div>
                {/* Sparkle accents */}
                <div style={{ position: 'absolute', top: '12%', left: '14%', width: '3px', height: '3px', borderRadius: '50%', background: '#FFC107', boxShadow: '0 0 8px rgba(255,193,7,0.6)', animation: 'pulse 3s ease infinite' }} />
                <div style={{ position: 'absolute', top: '25%', left: '42%', width: '2px', height: '2px', borderRadius: '50%', background: '#8B3BFF', boxShadow: '0 0 6px rgba(139,59,255,0.5)', animation: 'pulse 4s ease infinite 1s' }} />
                <div style={{ position: 'absolute', bottom: '28%', left: '8%', width: '2px', height: '2px', borderRadius: '50%', background: '#FFD54F', boxShadow: '0 0 6px rgba(255,213,79,0.5)', animation: 'pulse 3.5s ease infinite 0.5s' }} />
            </div>

            <div className="container-db" style={{ position: 'relative', zIndex: 1 }}>
                <div className="grid lg:grid-cols-2 items-center" style={{ gap: '32px', minHeight: '84vh', paddingTop: '12px' }}>
                    {/* Left column, content (unchanged copy, restyled) */}
                    <div className="flex flex-col items-center text-center lg:items-start lg:text-left" style={{ maxWidth: '620px' }}>
                        {/* Rotating locked pick teaser */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            style={{
                                width: '100%', maxWidth: '440px', marginBottom: '22px',
                                position: 'relative', overflow: 'hidden',
                                borderRadius: '14px',
                                border: '1px solid rgba(106,0,255,0.28)',
                                background: 'linear-gradient(135deg, rgba(106,0,255,0.12), rgba(255,193,7,0.05))',
                                padding: '14px 18px',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '10px', fontWeight: 800, color: '#FFC107', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '5px' }}>
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
                                            {pick.teams}, {pick.detail}
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Subscribe overlay */}
                            <Link href="/pricing" style={{
                                position: 'absolute', inset: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(10,5,18,0.25)', backdropFilter: 'blur(1px)',
                                color: '#FFC107', fontSize: '13px', fontWeight: 700,
                                textDecoration: 'none', gap: '6px',
                                transition: 'background 0.2s',
                            }}>
                                <Lock size={14} />
                                Unlock Premium Picks
                            </Link>
                        </motion.div>

                        {/* Trust badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            style={{ marginBottom: '18px' }}
                        >
                            <span className="badge-emerald" style={{ padding: '7px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <Shield size={13} style={{ color: '#FFC107' }} />
                                Backed by 30+ Years of Sports Analysis
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
                            Smarter Picks.{' '}
                            <span className="gradient-text">Sharper Edge.</span>
                        </motion.h1>

                        {/* Subheadline */}
                        <motion.p
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.6 }}
                            style={{ color: '#d1d5db', fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: 1.7, marginBottom: '20px', maxWidth: '540px' }}
                        >
                            Documented fire picks built on{' '}
                            <span style={{ color: '#FFC107', fontWeight: 600 }}>30+ years of experience</span>,
                            delivered before every game, with a premium community that gives you the edge.
                        </motion.p>

                        {/* Value props */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            style={{ display: 'flex', flexWrap: 'wrap' as const, justifyContent: 'center', gap: '14px', marginBottom: '24px' }}
                            className="lg:justify-start"
                        >
                            {[
                                { icon: <TrendingUp size={14} style={{ color: '#FFC107' }} />, text: 'Fire picks daily' },
                                { icon: <Shield size={14} style={{ color: '#FFC107' }} />, text: 'Every pick documented' },
                                { icon: <CheckCircle size={14} style={{ color: '#FFC107' }} />, text: 'Exclusive community' },
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
                            className="lg:justify-start"
                        >
                            <Link
                                href="/dashboard?signup=free"
                                className="btn-glow btn-glow-lg pulse-ring"
                                style={{ flex: '1 1 200px', maxWidth: '300px', textAlign: 'center' as const, justifyContent: 'center' }}
                                onClick={() => trackEvent('cta_click', { location: 'hero', label: 'signup_free' })}
                            >
                                <Sparkles size={16} />
                                Sign Up Free
                            </Link>
                            <Link
                                href="/dashboard"
                                className="btn-outline"
                                style={{ flex: '1 1 160px', maxWidth: '260px', textAlign: 'center' as const, justifyContent: 'center' }}
                                onClick={() => trackEvent('cta_click', { location: 'hero', label: 'login' })}
                            >
                                <ArrowRight size={14} />
                                Log In
                            </Link>
                        </motion.div>

                        {/* No credit card */}
                        <p style={{ fontSize: '12px', color: '#FFD54F', marginTop: '10px', fontWeight: 600 }}>
                            No credit card required
                        </p>

                        {/* Trust line */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            style={{ fontSize: '13px', color: '#9ca3af', marginTop: '14px' }}
                        >
                            ⚡ Documented record • Fire picks daily • Cancel anytime • 21+ only
                        </motion.p>
                    </div>

                    {/* Mobile throne character (mobile only) */}
                    <div className="flex lg:hidden justify-center">
                        <Image src="/brand/hero-swami.webp" alt="Follow the Swami" width={833} height={793} priority sizes="90vw" style={{ width: '100%', maxWidth: '420px', height: 'auto', borderRadius: '16px', border: '1px solid rgba(106,0,255,0.3)' }} />
                    </div>
                </div>
            </div>
        </section>
    );
}
