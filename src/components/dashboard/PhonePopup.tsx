'use client';

import { useState, useEffect } from 'react';
import { X, Phone, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';

const LS_KEY_ADDED = 'tripleplayz_phone_added';
const LS_KEY_SKIPPED = 'tripleplayz_phone_skipped';
const SKIP_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function PhonePopup() {
    const { user } = useAuth();
    const [visible, setVisible] = useState(false);
    const [phoneValue, setPhoneValue] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user?.email) return;

        // Already added phone — never show
        if (localStorage.getItem(LS_KEY_ADDED) === 'true') return;

        // Skipped recently — don't show for 7 days
        const skippedAt = localStorage.getItem(LS_KEY_SKIPPED);
        if (skippedAt) {
            const elapsed = Date.now() - Number(skippedAt);
            if (elapsed < SKIP_DURATION_MS) return;
        }

        // Short delay so popup doesn't flash immediately on page load
        const timer = setTimeout(() => setVisible(true), 3000);
        return () => clearTimeout(timer);
    }, [user?.email]);

    const handleSubmit = async () => {
        if (!phoneValue.trim() || !user?.email) return;
        setSubmitting(true);
        setError('');

        try {
            const res = await fetch('/api/subscribers/phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, phone: phoneValue.trim() }),
            });

            if (!res.ok) {
                const data = await res.json() as { error?: string };
                throw new Error(data.error || 'Failed to save');
            }

            localStorage.setItem(LS_KEY_ADDED, 'true');
            setSubmitted(true);
            setTimeout(() => setVisible(false), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSkip = () => {
        localStorage.setItem(LS_KEY_SKIPPED, String(Date.now()));
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    }}
                    onClick={handleSkip}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'rgba(15,15,25,0.95)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '16px',
                            padding: '28px 24px',
                            maxWidth: '380px',
                            width: '90%',
                            position: 'relative',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        }}
                    >
                        {/* Close button */}
                        <button
                            onClick={handleSkip}
                            style={{
                                position: 'absolute', top: '12px', right: '12px',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#6b7280', padding: '4px',
                            }}
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>

                        {submitted ? (
                            /* Success state */
                            <div style={{ textAlign: 'center', padding: '12px 0' }}>
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '50%',
                                    background: 'rgba(0,229,155,0.1)', border: '1px solid rgba(0,229,155,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 14px',
                                }}>
                                    <Phone size={24} style={{ color: '#00e59b' }} />
                                </div>
                                <p style={{ color: 'white', fontWeight: 700, fontSize: '16px', margin: 0 }}>
                                    You&apos;re all set! 🎉
                                </p>
                                <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '6px' }}>
                                    Text alerts are now enabled.
                                </p>
                            </div>
                        ) : (
                            /* Form state */
                            <>
                                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                    <div style={{
                                        width: '56px', height: '56px', borderRadius: '14px',
                                        background: 'rgba(0,229,155,0.1)', border: '1px solid rgba(0,229,155,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 14px',
                                    }}>
                                        <Smartphone size={26} style={{ color: '#00e59b' }} />
                                    </div>
                                    <h3 style={{ color: 'white', fontWeight: 700, fontSize: '18px', margin: '0 0 4px' }}>
                                        Never Miss a Pick
                                    </h3>
                                    <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                                        Get instant text alerts when new picks drop — straight to your phone.
                                    </p>
                                </div>

                                <div style={{ position: 'relative', marginBottom: '12px' }}>
                                    <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                                    <input
                                        type="tel"
                                        value={phoneValue}
                                        onChange={(e) => setPhoneValue(e.target.value)}
                                        style={{
                                            width: '100%', padding: '12px 12px 12px 40px',
                                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '10px', color: 'white', fontSize: '15px',
                                            outline: 'none', boxSizing: 'border-box',
                                        }}
                                        placeholder="(555) 123-4567"
                                    />
                                </div>

                                <p style={{ color: '#6b7280', fontSize: '11px', marginBottom: '16px', textAlign: 'center' }}>
                                    US/Canada numbers (+1). Msg &amp; data rates may apply.
                                </p>

                                {error && (
                                    <div style={{
                                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                        borderRadius: '8px', padding: '8px 12px', marginBottom: '12px',
                                        color: '#f87171', fontSize: '13px',
                                    }}>
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || !phoneValue.trim()}
                                    style={{
                                        width: '100%', padding: '12px',
                                        background: submitting || !phoneValue.trim()
                                            ? 'rgba(255,255,255,0.05)'
                                            : 'linear-gradient(135deg, #00e59b, #00c9ff)',
                                        color: submitting || !phoneValue.trim() ? '#6b7280' : '#0a0a0f',
                                        border: 'none', borderRadius: '10px',
                                        fontWeight: 700, fontSize: '14px',
                                        cursor: submitting || !phoneValue.trim() ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {submitting ? 'Saving...' : '📱 Enable Text Alerts'}
                                </button>

                                <button
                                    onClick={handleSkip}
                                    style={{
                                        width: '100%', padding: '10px',
                                        background: 'none', border: 'none',
                                        color: '#6b7280', fontSize: '13px',
                                        cursor: 'pointer', marginTop: '8px',
                                    }}
                                >
                                    Maybe Later
                                </button>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
