'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, CheckCircle, ArrowRight, Loader2, Mail, Trophy, Users, Target, Bell, Gem, Star } from 'lucide-react';

const perks = [
    { icon: Target, title: 'Daily Expert Picks', desc: 'Data-driven college basketball picks with confidence ratings and detailed analysis.' },
    { icon: Users, title: 'Private Discord', desc: 'Exclusive community of sharp bettors — real-time alerts, discussions, and game breakdowns.' },
    { icon: Trophy, title: '65% Win Rate', desc: 'Fully documented, transparent record. No cherry-picking, no hiding losses.' },
    { icon: Bell, title: 'Instant Alerts', desc: 'Line movement notifications and last-minute picks delivered straight to your phone.' },
    { icon: Gem, title: 'VIP Tiers Coming', desc: 'Early access members get first priority for premium VIP tiers at discounted rates.' },
    { icon: Star, title: 'Founding Member Status', desc: 'Lock in the lowest price forever. Early supporters get grandfathered in when we launch.' },
];

export default function EarlyAccessPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (data.success) {
                setSuccess(true);
            } else {
                setError(data.error || 'Something went wrong');
            }
        } catch {
            setError('Network error — please try again');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ paddingTop: '32px', paddingBottom: '60px' }}>
            <div className="container-db" style={{ maxWidth: '740px' }}>
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: 'center', marginBottom: '36px' }}
                >
                    <span className="badge-emerald" style={{ padding: '7px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <span className="live-dot" />
                        Limited Early Access
                    </span>
                    <h1 className="font-display" style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: '14px' }}>
                        Be First to{' '}
                        <span className="gradient-text">Get In</span>
                    </h1>
                    <p style={{ color: '#d1d5db', fontSize: 'clamp(15px, 2vw, 17px)', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto' }}>
                        We&apos;re launching soon. Join the early access list to lock in founding member pricing
                        and get first access to our premium picks and Discord community.
                    </p>
                </motion.div>

                {/* Signup Card */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="glass-card"
                    style={{ padding: 'clamp(24px, 4vw, 36px)', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}
                >
                    {/* Glow behind card */}
                    <div style={{
                        position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)',
                        width: '400px', height: '400px',
                        background: 'radial-gradient(circle, rgba(0,229,155,0.06) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />

                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ textAlign: 'center', padding: '20px 0', position: 'relative' }}
                        >
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '50%',
                                background: 'rgba(0,229,155,0.1)', border: '2px solid rgba(0,229,155,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 16px',
                            }}>
                                <CheckCircle size={28} style={{ color: '#00e59b' }} />
                            </div>
                            <h2 className="font-display" style={{ fontSize: '24px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
                                You&apos;re In! 💎
                            </h2>
                            <p style={{ color: '#d1d5db', fontSize: '15px', maxWidth: '380px', margin: '0 auto' }}>
                                We&apos;ll email you as soon as Diamond Boys Advisory goes live.
                                Founding members get the best rates — guaranteed.
                            </p>
                        </motion.div>
                    ) : (
                        <div style={{ position: 'relative' }}>
                            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                <h2 className="font-display" style={{ fontSize: 'clamp(20px, 3vw, 24px)', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
                                    Join the Early Access List
                                </h2>
                                <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                                    No credit card required. Be the first to know when we launch.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
                                <div style={{ position: 'relative', flex: '1 1 240px' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(26,39,68,0.5)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            padding: '14px 14px 14px 42px',
                                            color: 'white',
                                            fontSize: '15px',
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                        }}
                                        placeholder="your@email.com"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-glow"
                                    style={{
                                        flex: '0 0 auto',
                                        padding: '14px 28px',
                                        fontSize: '15px',
                                        fontWeight: 700,
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        opacity: loading ? 0.7 : 1,
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        whiteSpace: 'nowrap' as const,
                                    }}
                                >
                                    {loading ? (
                                        <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Joining...</>
                                    ) : (
                                        <><Zap size={16} /> Get Early Access</>
                                    )}
                                </button>
                            </form>

                            {error && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    style={{ color: '#fca5a5', fontSize: '13px', marginTop: '10px', textAlign: 'center' }}
                                >
                                    ⚠ {error}
                                </motion.p>
                            )}

                            <p style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', marginTop: '12px' }}>
                                🔒 No spam, ever. Unsubscribe anytime.
                            </p>
                        </div>
                    )}
                </motion.div>

                {/* What you get */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h2 className="font-display" style={{ fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: '20px' }}>
                        What&apos;s Coming
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        {perks.map((perk, i) => (
                            <motion.div
                                key={perk.title}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 + i * 0.06 }}
                                className="glass-card"
                                style={{ padding: '20px' }}
                            >
                                <perk.icon size={20} style={{ color: '#00e59b', marginBottom: '10px' }} />
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
                    transition={{ delay: 0.6 }}
                    style={{ textAlign: 'center', marginTop: '28px' }}
                >
                    <p style={{ color: '#6b7280', fontSize: '13px' }}>
                        💎 Already trusted by 1,200+ sports bettors
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
