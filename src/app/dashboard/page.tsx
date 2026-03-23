'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Calendar, AlertTriangle, CheckCircle, RefreshCw, Shield, Gem, ExternalLink, MessageCircle, ArrowRight, Mail, Lock, UserPlus, LogIn, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useRouter } from 'next/navigation';

function DashboardContent() {
    const { user, loading: authLoading, signOut } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const isFreeSignup = searchParams.get('signup') === 'free';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Auto-select signup tab when coming from free CTA
    useEffect(() => {
        if (isFreeSignup) setIsSignUp(true);
    }, [isFreeSignup]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/community`,
                    },
                });
                if (error) throw error;
                setMessage('Check your email for a confirmation link!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Loading state
    if (authLoading) {
        return (
            <div style={{ paddingTop: '40px', paddingBottom: '60px', minHeight: 'calc(100vh - 96px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 size={28} style={{ color: '#00e59b', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                    <p style={{ color: '#9ca3af', fontSize: '14px' }}>Loading...</p>
                </div>
            </div>
        );
    }

    // Not logged in — Auth form
    if (!user) {
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
                            <Image src="/logo.png" alt="TriplePlayz" width={56} height={56} style={{ margin: '0 auto 16px', borderRadius: '12px' }} />
                            <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
                                {isSignUp && isFreeSignup ? 'Join the TriplePlayz Lounge — Free' : isSignUp ? 'Create Account' : 'Member Dashboard'}
                            </h1>
                            <p style={{ color: '#d1d5db', fontSize: '15px', lineHeight: 1.5 }}>
                                {isSignUp && isFreeSignup
                                    ? 'Get instant access to game analysis, community chat, and freebie picks. No credit card needed.'
                                    : isSignUp
                                        ? 'Sign up to join The TriplePlayz Lounge and track your picks.'
                                        : 'Sign in to manage your account and community access.'
                                }
                            </p>
                        </div>

                        {/* Auth tabs */}
                        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
                            <button
                                onClick={() => { setIsSignUp(false); setError(''); setMessage(''); }}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    borderRadius: '9px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    background: !isSignUp ? 'rgba(0,229,155,0.1)' : 'transparent',
                                    color: !isSignUp ? '#00e59b' : '#6b7280',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <LogIn size={14} />
                                Sign In
                            </button>
                            <button
                                onClick={() => { setIsSignUp(true); setError(''); setMessage(''); }}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    borderRadius: '9px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    background: isSignUp ? 'rgba(0,229,155,0.1)' : 'transparent',
                                    color: isSignUp ? '#00e59b' : '#6b7280',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <UserPlus size={14} />
                                Sign Up
                            </button>
                        </div>

                        {/* Login card */}
                        <div className="glass-card" style={{ padding: '28px 24px', marginBottom: '20px' }}>
                            <form onSubmit={handleAuth}>
                                <label htmlFor="dash-email" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                                    Email Address
                                </label>
                                <div style={{ position: 'relative', marginBottom: '14px' }}>
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
                                            boxSizing: 'border-box',
                                        }}
                                        placeholder="your@email.com"
                                    />
                                </div>

                                <label htmlFor="dash-password" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                                    Password
                                </label>
                                <div style={{ position: 'relative', marginBottom: '18px' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                                    <input
                                        id="dash-password"
                                        type="password"
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
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
                                        placeholder={isSignUp ? 'Create a password (min 6 chars)' : 'Your password'}
                                    />
                                </div>

                                {/* Error / Success messages */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px' }}
                                        >
                                            <p style={{ color: '#fca5a5', fontSize: '13px', margin: 0 }}>⚠ {error}</p>
                                        </motion.div>
                                    )}
                                    {message && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            style={{ background: 'rgba(0,229,155,0.08)', border: '1px solid rgba(0,229,155,0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px' }}
                                        >
                                            <p style={{ color: '#00e59b', fontSize: '13px', margin: 0 }}>✓ {message}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-glow"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        fontSize: '15px',
                                        fontWeight: 600,
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        opacity: loading ? 0.7 : 1,
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                            {isSignUp ? 'Creating Account...' : 'Signing In...'}
                                        </>
                                    ) : (
                                        <>
                                            {isSignUp ? <UserPlus size={16} /> : <ArrowRight size={16} />}
                                            {isSignUp ? 'Create Account' : 'Sign In'}
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Trust bullets */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                                { icon: Shield, text: 'Secure — powered by Supabase & Stripe' },
                                { icon: MessageCircle, text: 'Access The TriplePlayz Lounge community' },
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

    // Logged in — Dashboard
    return (
        <div style={{ paddingTop: '40px', paddingBottom: '60px' }}>
            <div className="container-db" style={{ maxWidth: '640px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                    <div>
                        <h1 className="font-display" style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 800, color: 'white', marginBottom: '4px' }}>
                            Dashboard
                        </h1>
                        <p style={{ color: '#9ca3af', fontSize: '14px' }}>{user.email}</p>
                    </div>
                    <button
                        onClick={signOut}
                        style={{ color: '#9ca3af', fontSize: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer' }}
                    >
                        Sign out
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Welcome Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card"
                        style={{ padding: '24px', textAlign: 'center' }}
                    >
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0,229,155,0.1)', border: '2px solid rgba(0,229,155,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                            <span style={{ fontSize: '20px' }}>💎</span>
                        </div>
                        <h2 style={{ color: 'white', fontWeight: 700, fontSize: '18px', marginBottom: '6px' }}>Welcome, TriplePlayz Member!</h2>
                        <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
                            Your account is active. Choose a subscription to unlock picks and Lounge access.
                        </p>
                        <Link href="/pricing" className="btn-glow" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '14px' }}>
                            <Gem size={15} />
                            View Subscription Plans
                        </Link>
                    </motion.div>

                    {/* Account Info Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card"
                        style={{ padding: '24px' }}
                    >
                        <h2 style={{ color: 'white', fontWeight: 600, fontSize: '17px', marginBottom: '14px' }}>Account Details</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(26,39,68,0.3)', borderRadius: '10px', padding: '14px 16px' }}>
                                <div>
                                    <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '2px' }}>Email</p>
                                    <p style={{ color: '#e5e7eb', fontSize: '14px', fontWeight: 500 }}>{user.email}</p>
                                </div>
                                <CheckCircle size={16} style={{ color: '#00e59b' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(26,39,68,0.3)', borderRadius: '10px', padding: '14px 16px' }}>
                                <div>
                                    <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '2px' }}>Member Since</p>
                                    <p style={{ color: '#e5e7eb', fontSize: '14px', fontWeight: 500 }}>
                                        {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                                <Calendar size={16} style={{ color: '#9ca3af' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(26,39,68,0.3)', borderRadius: '10px', padding: '14px 16px' }}>
                                <div>
                                    <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '2px' }}>Subscription</p>
                                    <p style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 500 }}>No active plan</p>
                                </div>
                                <AlertTriangle size={16} style={{ color: '#fbbf24' }} />
                            </div>
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
                            <Link
                                href="/pricing"
                                className="btn-outline"
                                style={{ width: '100%', padding: '12px', fontSize: '14px', justifyContent: 'center', gap: '8px' }}
                            >
                                <CreditCard size={14} />
                                Subscribe
                            </Link>
                            <Link
                                href="/community"
                                className="btn-glow"
                                style={{ width: '100%', padding: '12px', fontSize: '14px', justifyContent: 'center', gap: '8px' }}
                            >
                                <MessageCircle size={14} />
                                The TriplePlayz Lounge
                            </Link>
                        </div>
                    </motion.div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', color: '#6b7280', fontSize: '12px' }}>
                        <Shield size={12} />
                        <span>All billing managed securely through Stripe</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={28} style={{ color: '#00e59b', animation: 'spin 1s linear infinite' }} /></div>}>
            <DashboardContent />
        </Suspense>
    );
}
