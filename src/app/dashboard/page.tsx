'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Calendar, AlertTriangle, CheckCircle, RefreshCw, Shield, Gem, ExternalLink, MessageCircle, ArrowRight, Mail } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const MOCK_SUBSCRIPTION = {
    active: true,
    tier: 'Monthly Elite',
    price: 99,
    interval: 'month',
    renewalDate: '2026-03-26',
    discordUsername: 'user123',
    memberSince: '2026-01-15',
};

export default function DashboardPage() {
    const [email, setEmail] = useState('');
    const [loggedIn, setLoggedIn] = useState(false);
    const sub = MOCK_SUBSCRIPTION;

    if (!loggedIn) {
        return (
            <div style={{ paddingTop: '40px', paddingBottom: '60px', minHeight: 'calc(100vh - 96px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="container-db" style={{ maxWidth: '420px' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                            <Image src="/logo.png" alt="Diamond Boys" width={56} height={56} style={{ margin: '0 auto 16px', borderRadius: '12px' }} />
                            <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
                                Member Dashboard
                            </h1>
                            <p style={{ color: '#d1d5db', fontSize: '15px', lineHeight: 1.5 }}>
                                Enter your subscription email to manage your account and Discord access.
                            </p>
                        </div>

                        {/* Login card */}
                        <div className="glass-card" style={{ padding: '28px 24px', marginBottom: '20px' }}>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (email.trim()) setLoggedIn(true);
                                }}
                            >
                                <label htmlFor="dash-email" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                                    Email Address
                                </label>
                                <div style={{ position: 'relative', marginBottom: '16px' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                                    <input
                                        id="dash-email"
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
                                        }}
                                        placeholder="your@email.com"
                                    />
                                </div>
                                <button type="submit" className="btn-glow" style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 600, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    View My Subscription
                                    <ArrowRight size={16} />
                                </button>
                            </form>
                        </div>

                        {/* Quick info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                                { icon: Shield, text: 'Secure — powered by Stripe billing' },
                                { icon: MessageCircle, text: 'Manage your Discord access instantly' },
                                { icon: Gem, text: 'Upgrade or downgrade your tier anytime' },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.08 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#9ca3af', fontSize: '13px' }}
                                >
                                    <item.icon size={15} style={{ color: '#00e59b', flexShrink: 0 }} />
                                    <span>{item.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ paddingTop: '40px', paddingBottom: '60px' }}>
            <div className="container-db" style={{ maxWidth: '640px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                    <div>
                        <h1 className="font-display" style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 800, color: 'white', marginBottom: '4px' }}>
                            Dashboard
                        </h1>
                        <p style={{ color: '#9ca3af', fontSize: '14px' }}>{email}</p>
                    </div>
                    <button
                        onClick={() => setLoggedIn(false)}
                        style={{ color: '#9ca3af', fontSize: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer' }}
                    >
                        Sign out
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Status Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card"
                        style={{ padding: '24px' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2 style={{ color: 'white', fontWeight: 600, fontSize: '17px' }}>Subscription Status</h2>
                            {sub.active ? (
                                <span className="badge badge-success" style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckCircle size={12} />
                                    Active
                                </span>
                            ) : (
                                <span className="badge badge-danger" style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <AlertTriangle size={12} />
                                    Inactive
                                </span>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ background: 'rgba(26,39,68,0.3)', borderRadius: '12px', padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>
                                    <Gem size={13} />
                                    Current Tier
                                </div>
                                <p className="font-display" style={{ color: 'white', fontWeight: 800, fontSize: '18px', marginBottom: '2px' }}>{sub.tier}</p>
                                <p style={{ color: '#9ca3af', fontSize: '13px' }}>${sub.price}/{sub.interval}</p>
                            </div>
                            <div style={{ background: 'rgba(26,39,68,0.3)', borderRadius: '12px', padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>
                                    <Calendar size={13} />
                                    Next Renewal
                                </div>
                                <p className="font-display" style={{ color: 'white', fontWeight: 800, fontSize: '18px', marginBottom: '2px' }}>
                                    {new Date(sub.renewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                                <p style={{ color: '#9ca3af', fontSize: '13px' }}>Auto-renew on</p>
                            </div>
                        </div>

                        {!sub.active && (
                            <div style={{ marginTop: '16px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px', padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                    <AlertTriangle size={18} style={{ color: '#f87171', flexShrink: 0, marginTop: '2px' }} />
                                    <div>
                                        <p style={{ color: '#fca5a5', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>Subscription Inactive</p>
                                        <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '12px' }}>
                                            Your Discord access has been revoked. Renew to regain access.
                                        </p>
                                        <Link href="/pricing" className="btn-glow" style={{ fontSize: '13px', padding: '8px 16px', display: 'inline-flex', gap: '6px' }}>
                                            <RefreshCw size={13} />
                                            Renew Now
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Discord Access */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card"
                        style={{ padding: '24px' }}
                    >
                        <h2 style={{ color: 'white', fontWeight: 600, fontSize: '17px', marginBottom: '14px' }}>Discord Access</h2>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(26,39,68,0.3)', borderRadius: '12px', padding: '16px' }}>
                            <div>
                                <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>Connected as</p>
                                <p style={{ color: 'white', fontWeight: 600, fontSize: '16px' }}>@{sub.discordUsername}</p>
                            </div>
                            {sub.active && (
                                <span className="badge badge-success" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckCircle size={11} />
                                    Connected
                                </span>
                            )}
                        </div>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card"
                        style={{ padding: '24px' }}
                    >
                        <h2 style={{ color: 'white', fontWeight: 600, fontSize: '17px', marginBottom: '14px' }}>Quick Actions</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <a
                                href="https://discord.gg/your-server"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-outline"
                                style={{ width: '100%', padding: '12px', fontSize: '14px', justifyContent: 'center', gap: '8px' }}
                            >
                                <ExternalLink size={14} />
                                Open Discord
                            </a>
                            <a
                                href="https://billing.stripe.com/p/login/test"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    color: '#d1d5db',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    textDecoration: 'none',
                                    transition: 'background 0.15s',
                                }}
                            >
                                <CreditCard size={14} />
                                Manage Billing
                            </a>
                        </div>
                    </motion.div>

                    {/* Security note */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', color: '#6b7280', fontSize: '12px' }}>
                        <Shield size={12} />
                        <span>All billing managed securely through Stripe</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
