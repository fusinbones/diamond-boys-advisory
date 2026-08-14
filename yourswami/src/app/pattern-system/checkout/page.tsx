'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { ArrowLeft, Check, CreditCard, Lock, Mail, Shield, User, Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Accept.js types
declare global {
    interface Window {
        Accept?: {
            dispatchData: (
                secureData: { authData: { clientKey: string; apiLoginID: string }; cardData: { cardNumber: string; month: string; year: string; cardCode: string } },
                handler: (response: AcceptResponse) => void
            ) => void;
        };
    }
}

interface AcceptResponse {
    messages: { resultCode: string; message: Array<{ code: string; text: string }> };
    opaqueData?: { dataDescriptor: string; dataValue: string };
}

const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
};

function PatternCheckoutForm() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expMonth, setExpMonth] = useState('');
    const [expYear, setExpYear] = useState('');
    const [cvv, setCvv] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [scriptLoaded, setScriptLoaded] = useState(false);

    // Load Accept.js script
    useEffect(() => {
        if (document.getElementById('authorizenet-acceptjs')) {
            setScriptLoaded(true);
            return;
        }
        const script = document.createElement('script');
        script.id = 'authorizenet-acceptjs';
        script.src = 'https://js.authorize.net/v1/Accept.js';
        script.charset = 'utf-8';
        script.onload = () => setScriptLoaded(true);
        document.head.appendChild(script);
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim() || !email.trim()) {
            setError('Name and email are required.');
            return;
        }
        if (!email.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }

        const rawCard = cardNumber.replace(/\s/g, '');
        if (rawCard.length < 13) {
            setError('Please enter a valid card number.');
            return;
        }
        if (!expMonth || !expYear || !cvv) {
            setError('Please complete all card fields.');
            return;
        }

        if (!window.Accept) {
            setError('Payment system is loading. Please try again in a moment.');
            return;
        }

        setLoading(true);

        const clientKey = process.env.NEXT_PUBLIC_AUTHORIZE_NET_PUBLIC_CLIENT_KEY || '';
        const apiLoginID = process.env.NEXT_PUBLIC_AUTHORIZE_NET_API_LOGIN_ID || '';

        // Step 1: Tokenize card via Accept.js
        window.Accept.dispatchData(
            {
                authData: { clientKey, apiLoginID },
                cardData: {
                    cardNumber: rawCard,
                    month: expMonth,
                    year: expYear,
                    cardCode: cvv,
                },
            },
            async (response: AcceptResponse) => {
                if (response.messages.resultCode === 'Error') {
                    setError(response.messages.message[0]?.text || 'Card validation failed.');
                    setLoading(false);
                    return;
                }

                if (!response.opaqueData) {
                    setError('Failed to tokenize card. Please try again.');
                    setLoading(false);
                    return;
                }

                // Step 2: Send opaque token to our API for ARB subscription
                try {
                    const res = await fetch('/api/pattern-system/checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            dataDescriptor: response.opaqueData.dataDescriptor,
                            dataValue: response.opaqueData.dataValue,
                            name: name.trim(),
                            email: email.trim(),
                        }),
                    });

                    const data = await res.json();

                    if (data.success) {
                        router.push('/pattern-system/success');
                    } else {
                        setError(data.error || 'Subscription failed. Please try again.');
                    }
                } catch {
                    setError('Network error. Please check your connection and try again.');
                } finally {
                    setLoading(false);
                }
            }
        );
    }, [name, email, cardNumber, expMonth, expYear, cvv, router]);

    const features = [
        { text: 'Real-time W/L alternation analysis for all 30 MLB teams' },
        { text: 'Break probability scoring from 62–99%' },
        { text: 'Pitcher milestone alerts & walk-off revenge detection' },
        { text: 'Advanced search, filter & sort tools' },
        { text: 'Cancel anytime — no lock-in commitment' },
    ];

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '14px 14px 14px 40px',
        background: 'rgba(26,39,68,0.5)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px', color: 'white',
        fontSize: '15px', outline: 'none',
        transition: 'border-color 0.15s',
        boxSizing: 'border-box',
    };

    const cardInputStyle: React.CSSProperties = {
        ...inputStyle,
        paddingLeft: '14px',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block', color: '#d1d5db', fontSize: '13px',
        fontWeight: 600, marginBottom: '6px',
    };

    const iconStyle: React.CSSProperties = {
        position: 'absolute', left: '12px', top: '50%',
        transform: 'translateY(-50%)', color: '#4b5563',
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        e.currentTarget.style.borderColor = 'rgba(167,139,250,0.5)';
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
    };

    return (
        <div style={{
            paddingTop: '24px',
            paddingBottom: '60px',
            minHeight: '100vh',
            background: '#040810',
        }}>
            {/* Keyframes */}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>

            <div style={{ maxWidth: '520px', margin: '0 auto', padding: '0 16px' }}>
                {/* Back link */}
                <Link
                    href="/pattern-system"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        color: '#6b7280', fontSize: '14px', textDecoration: 'none',
                        marginBottom: '24px', transition: 'color 0.15s',
                    }}
                >
                    <ArrowLeft size={16} />
                    Back to Pattern System
                </Link>

                {/* ── Plan summary card — purple gradient accent ── */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(26,39,68,0.4))',
                    border: '1px solid rgba(167,139,250,0.15)',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '20px',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Subtle shimmer accent bar */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent, #a78bfa, #c4b5fd, #a78bfa, transparent)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 3s ease-in-out infinite',
                    }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                        <Image
                            src="/brand/logo-primary.png"
                            alt="YourSwami"
                            width={44}
                            height={44}
                            style={{ borderRadius: '10px', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>
                                    The .500 Method
                                </h2>
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: '#a78bfa',
                                    background: 'rgba(167,139,250,0.12)',
                                    border: '1px solid rgba(167,139,250,0.2)',
                                    borderRadius: '4px',
                                    padding: '2px 6px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}>
                                    Pattern System
                                </span>
                            </div>
                            <p style={{ color: '#9ca3af', fontSize: '13px', margin: '2px 0 0' }}>
                                Full access to the .500 Method Pattern System
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
                            $49.99
                        </span>
                        <span style={{ color: '#6b7280', fontSize: '14px' }}>
                            /month
                        </span>
                    </div>

                    {/* Feature highlights */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {features.map((feat, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '6px',
                                    background: 'rgba(106,0,255,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <Check size={12} style={{ color: '#FFC107' }} />
                                </div>
                                <span style={{ color: '#d1d5db', fontSize: '13px' }}>{feat.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Form card ── */}
                <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '16px',
                    padding: '24px 20px',
                    marginBottom: '16px',
                }}>
                    <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
                        Payment Information
                    </h3>

                    <form onSubmit={handleSubmit}>
                        {/* Name */}
                        <div style={{ marginBottom: '16px' }}>
                            <label htmlFor="pattern-name" style={labelStyle}>
                                Full Name
                            </label>
                            <div style={{ position: 'relative' }}>
                                <User size={16} style={iconStyle} />
                                <input
                                    id="pattern-name"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your full name"
                                    style={inputStyle}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div style={{ marginBottom: '16px' }}>
                            <label htmlFor="pattern-email" style={labelStyle}>
                                Email Address
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={iconStyle} />
                                <input
                                    id="pattern-email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    style={inputStyle}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                />
                            </div>
                        </div>

                        {/* Card Number */}
                        <div style={{ marginBottom: '16px' }}>
                            <label htmlFor="pattern-card" style={labelStyle}>
                                Card Number
                            </label>
                            <div style={{ position: 'relative' }}>
                                <CreditCard size={16} style={iconStyle} />
                                <input
                                    id="pattern-card"
                                    type="text"
                                    required
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                    placeholder="4111 1111 1111 1111"
                                    style={inputStyle}
                                    maxLength={19}
                                    inputMode="numeric"
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                />
                            </div>
                        </div>

                        {/* Exp Month / Exp Year / CVV row */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <label htmlFor="pattern-exp-month" style={labelStyle}>
                                    Exp Month
                                </label>
                                <select
                                    id="pattern-exp-month"
                                    value={expMonth}
                                    onChange={(e) => setExpMonth(e.target.value)}
                                    required
                                    style={cardInputStyle}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                >
                                    <option value="">MM</option>
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const m = String(i + 1).padStart(2, '0');
                                        return <option key={m} value={m}>{m}</option>;
                                    })}
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label htmlFor="pattern-exp-year" style={labelStyle}>
                                    Exp Year
                                </label>
                                <select
                                    id="pattern-exp-year"
                                    value={expYear}
                                    onChange={(e) => setExpYear(e.target.value)}
                                    required
                                    style={cardInputStyle}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                >
                                    <option value="">YYYY</option>
                                    {Array.from({ length: 10 }, (_, i) => {
                                        const y = String(new Date().getFullYear() + i);
                                        return <option key={y} value={y}>{y}</option>;
                                    })}
                                </select>
                            </div>
                            <div style={{ flex: 0, minWidth: '90px' }}>
                                <label htmlFor="pattern-cvv" style={labelStyle}>
                                    CVV
                                </label>
                                <input
                                    id="pattern-cvv"
                                    type="text"
                                    required
                                    value={cvv}
                                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    placeholder="123"
                                    style={{ ...cardInputStyle, maxWidth: '100px' }}
                                    maxLength={4}
                                    inputMode="numeric"
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
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
                            disabled={loading || !scriptLoaded}
                            style={{
                                width: '100%', padding: '16px',
                                background: loading
                                    ? 'rgba(167,139,250,0.3)'
                                    : 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                                border: 'none', borderRadius: '12px',
                                color: 'white', fontSize: '16px', fontWeight: 800,
                                cursor: loading || !scriptLoaded ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '8px', transition: 'opacity 0.15s',
                                opacity: loading ? 0.6 : 1,
                            }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CreditCard size={18} />
                                    Subscribe Now — $49.99/mo
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* ── Security + Legal footer ── */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '16px', marginBottom: '12px',
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280', fontSize: '12px' }}>
                            <Lock size={12} /> 256-bit SSL
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280', fontSize: '12px' }}>
                            <Shield size={12} /> PCI Compliant
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280', fontSize: '12px' }}>
                            <Lock size={12} /> Secure Checkout
                        </span>
                    </div>
                    <p style={{
                        color: '#4b5563', fontSize: '11px', lineHeight: 1.5,
                        maxWidth: '380px', margin: '0 auto',
                    }}>
                        By subscribing, you agree to our{' '}
                        <Link href="/tos" style={{ color: '#a78bfa', textDecoration: 'none' }}>Terms</Link>,{' '}
                        <Link href="/tos#privacy" style={{ color: '#a78bfa', textDecoration: 'none' }}>Privacy</Link>, and{' '}
                        <Link href="/tos#ban-policy" style={{ color: '#a78bfa', textDecoration: 'none' }}>Access Policy</Link>.
                        For entertainment purposes only. 21+. Not financial advice.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function PatternCheckoutPage() {
    return (
        <Suspense fallback={
            <div style={{ padding: '80px 0', textAlign: 'center', background: '#040810', minHeight: '100vh' }}>
                <div style={{
                    width: '32px', height: '32px',
                    border: '2px solid rgba(167,139,250,0.3)',
                    borderTopColor: '#a78bfa', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        }>
            <PatternCheckoutForm />
        </Suspense>
    );
}
