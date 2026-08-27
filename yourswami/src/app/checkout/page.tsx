'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { tiers } from '@/lib/tiers';
import { CreditCard, User, Mail, Shield, ArrowLeft, Check, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getStoredRefCode } from '@/components/RefTracker';

function CheckoutForm() {
    const searchParams = useSearchParams();
    const tierId = searchParams.get('tier') || 'monthly';
    const selectedTier = tiers.find((t) => t.id === tierId) || tiers[2];

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim() || !email.trim()) {
            setError('Name and email are required.');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tierId: selectedTier.id,
                    name,
                    email,
                    referralCode: getStoredRefCode(),
                }),
            });

            const data = await res.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                setError(data.error || 'Something went wrong. Please try again.');
            }
        } catch {
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ paddingTop: '24px', paddingBottom: '60px', minHeight: '100vh' }}>
            <div style={{ maxWidth: '520px', margin: '0 auto', padding: '0 16px' }}>
                {/* Back link */}
                <Link
                    href="/pricing"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        color: '#6b7280', fontSize: '14px', textDecoration: 'none',
                        marginBottom: '24px', transition: 'color 0.15s',
                    }}
                >
                    <ArrowLeft size={16} />
                    Back to Plans
                </Link>

                {/* Plan summary — compact on mobile */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(106,0,255,0.06), rgba(26,39,68,0.4))',
                    border: '1px solid rgba(106,0,255,0.12)',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '20px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                        <Image
                            src="/brand/logo-primary.png"
                            alt="YourSwami"
                            width={44}
                            height={44}
                            style={{ borderRadius: '10px', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>
                                {selectedTier.name}
                            </h2>
                            <p style={{ color: '#9ca3af', fontSize: '13px', margin: '2px 0 0' }}>
                                {selectedTier.description}
                            </p>
                        </div>
                    </div>

                    {/* Price highlight */}
                    <div style={{
                        display: 'flex', alignItems: 'baseline', gap: '6px',
                        marginBottom: '14px',
                    }}>
                        <span style={{
                            fontSize: '36px', fontWeight: 900, color: 'white',
                            fontFamily: 'var(--font-display)',
                        }}>
                            ${selectedTier.price}
                        </span>
                        <span style={{ color: '#6b7280', fontSize: '14px' }}>
                            {selectedTier.intervalLabel}
                        </span>
                    </div>

                    {/* Trial badge */}
                    {selectedTier.trialDays && (
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            background: 'rgba(106,0,255,0.1)', border: '1px solid rgba(106,0,255,0.2)',
                            borderRadius: '8px', padding: '6px 12px', marginBottom: '14px',
                        }}>
                            <Check size={14} style={{ color: '#FFC107' }} />
                            <span style={{ color: '#FFC107', fontSize: '13px', fontWeight: 600 }}>
                                {selectedTier.trialDays}-day free trial included
                            </span>
                        </div>
                    )}

                    {/* Top features */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {selectedTier.features.slice(0, 3).map((feat, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Check size={13} style={{ color: '#FFC107', flexShrink: 0 }} />
                                <span style={{ color: '#d1d5db', fontSize: '13px' }}>{feat}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form card */}
                <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '16px',
                    padding: '24px 20px',
                    marginBottom: '16px',
                }}>
                    <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
                        Your Information
                    </h3>

                    <form onSubmit={handleSubmit}>
                        {/* Name */}
                        <div style={{ marginBottom: '16px' }}>
                            <label htmlFor="name" style={{
                                display: 'block', color: '#d1d5db', fontSize: '13px',
                                fontWeight: 600, marginBottom: '6px',
                            }}>
                                Full Name
                            </label>
                            <div style={{ position: 'relative' }}>
                                <User size={16} style={{
                                    position: 'absolute', left: '12px', top: '50%',
                                    transform: 'translateY(-50%)', color: '#4b5563',
                                }} />
                                <input
                                    id="name"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your full name"
                                    style={{
                                        width: '100%', padding: '14px 14px 14px 40px',
                                        background: 'rgba(26,39,68,0.5)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px', color: 'white',
                                        fontSize: '15px', outline: 'none',
                                        transition: 'border-color 0.15s',
                                        boxSizing: 'border-box',
                                    }}
                                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(106,0,255,0.4)'}
                                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div style={{ marginBottom: '20px' }}>
                            <label htmlFor="email" style={{
                                display: 'block', color: '#d1d5db', fontSize: '13px',
                                fontWeight: 600, marginBottom: '6px',
                            }}>
                                Email Address
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{
                                    position: 'absolute', left: '12px', top: '50%',
                                    transform: 'translateY(-50%)', color: '#4b5563',
                                }} />
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    style={{
                                        width: '100%', padding: '14px 14px 14px 40px',
                                        background: 'rgba(26,39,68,0.5)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px', color: 'white',
                                        fontSize: '15px', outline: 'none',
                                        transition: 'border-color 0.15s',
                                        boxSizing: 'border-box',
                                    }}
                                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(106,0,255,0.4)'}
                                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.08)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: '10px', padding: '12px 14px',
                                color: '#fca5a5', fontSize: '13px',
                                marginBottom: '16px',
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '16px',
                                background: loading ? 'rgba(106,0,255,0.3)' : 'linear-gradient(135deg, #FFC107, #00b377)',
                                border: 'none', borderRadius: '12px',
                                color: '#0a0f1e', fontSize: '16px', fontWeight: 800,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '8px', transition: 'opacity 0.15s',
                                opacity: loading ? 0.6 : 1,
                            }}
                        >
                            {loading ? (
                                <>
                                    <div style={{
                                        width: '18px', height: '18px',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: 'white', borderRadius: '50%',
                                        animation: 'spin 0.8s linear infinite',
                                    }} />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Zap size={18} />
                                    Continue to Payment
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Security + Legal footer */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '6px', marginBottom: '8px',
                    }}>
                        <Shield size={14} style={{ color: 'rgba(106,0,255,0.5)' }} />
                        <span style={{ color: '#6b7280', fontSize: '12px' }}>
                            Secure checkout powered by Stripe
                        </span>
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '6px', marginBottom: '12px',
                    }}>
                        <CreditCard size={14} style={{ color: 'rgba(106,0,255,0.5)' }} />
                        <span style={{ color: '#6b7280', fontSize: '12px' }}>
                            Card details collected on next step — we never store them
                        </span>
                    </div>
                    <p style={{
                        color: '#4b5563', fontSize: '11px', lineHeight: 1.5,
                        maxWidth: '380px', margin: '0 auto',
                    }}>
                        By subscribing, you agree to our{' '}
                        <Link href="/tos" style={{ color: '#FFC107', textDecoration: 'none' }}>Terms</Link>,{' '}
                        <Link href="/privacy" style={{ color: '#FFC107', textDecoration: 'none' }}>Privacy</Link>, and{' '}
                        <Link href="/tos#ban-policy" style={{ color: '#FFC107', textDecoration: 'none' }}>Access Policy</Link>.
                        For entertainment purposes only. 21+. Not financial advice.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
                <div style={{
                    width: '32px', height: '32px',
                    border: '2px solid rgba(106,0,255,0.3)',
                    borderTopColor: '#FFC107', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto',
                }} />
            </div>
        }>
            <CheckoutForm />
        </Suspense>
    );
}
