'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Detects iOS Safari and shows a visual 3-step guide
 * for adding the site to home screen.
 * - Only shows on iOS Safari (not in-app browsers)
 * - Delays 4s so users see the app first
 * - Remembers dismissal for 7 days via localStorage
 * - Won't show if already running as installed PWA
 */
export default function IOSInstallPrompt() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Don't run on server
        if (typeof window === 'undefined') return;

        // Already installed as PWA (standalone mode)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone);
        if (isStandalone) return;

        // Check if iOS Safari
        const ua = navigator.userAgent;
        const isIOS = /iPhone|iPad|iPod/.test(ua);
        const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
        if (!isIOS || !isSafari) return;

        // Check if already dismissed (within 7 days)
        const dismissed = localStorage.getItem('db_ios_install_dismissed');
        if (dismissed) {
            const dismissedAt = parseInt(dismissed, 10);
            if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
        }

        // Show after delay
        const timer = setTimeout(() => setShow(true), 4000);
        return () => clearTimeout(timer);
    }, []);

    const dismiss = () => {
        setShow(false);
        localStorage.setItem('db_ios_install_dismissed', Date.now().toString());
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 80 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 80 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    style={{
                        position: 'fixed',
                        bottom: '16px',
                        left: '12px',
                        right: '12px',
                        zIndex: 9999,
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,229,155,0.15)',
                    }}
                >
                    {/* Glass background */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(4,8,16,0.97) 0%, rgba(10,22,40,0.97) 100%)',
                        backdropFilter: 'blur(20px)',
                        padding: '20px 16px 16px',
                    }}>
                        {/* Close button */}
                        <button
                            onClick={dismiss}
                            aria-label="Dismiss"
                            style={{
                                position: 'absolute', top: '12px', right: '12px',
                                background: 'rgba(255,255,255,0.06)', border: 'none',
                                borderRadius: '50%', width: '28px', height: '28px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#9ca3af',
                            }}
                        >
                            <X size={14} />
                        </button>

                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <Image src="/logo.png" alt="TriplePlayz" width={36} height={36} style={{ borderRadius: '10px' }} />
                            <div>
                                <p style={{ color: 'white', fontSize: '15px', fontWeight: 700, margin: 0 }}>
                                    Add TriplePlayz to Home Screen
                                </p>
                                <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>
                                    Get the app experience — instant access, anytime
                                </p>
                            </div>
                        </div>

                        {/* 3-Step Visual Guide */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '8px', padding: '14px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '14px',
                            marginBottom: '12px',
                        }}>
                            {/* Step 1: Share */}
                            <div style={{ textAlign: 'center', flex: 1 }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '12px',
                                    background: 'rgba(0,122,255,0.12)',
                                    border: '1px solid rgba(0,122,255,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 6px',
                                }}>
                                    {/* Safari Share Icon */}
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                        <polyline points="16 6 12 2 8 6" />
                                        <line x1="12" y1="2" x2="12" y2="15" />
                                    </svg>
                                </div>
                                <p style={{ color: 'white', fontSize: '11px', fontWeight: 700, margin: 0 }}>1. Tap Share</p>
                                <p style={{ color: '#6b7280', fontSize: '9px', margin: '2px 0 0' }}>Bottom of Safari</p>
                            </div>

                            {/* Arrow */}
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '18px', fontWeight: 300 }}>›</span>

                            {/* Step 2: Add to Home */}
                            <div style={{ textAlign: 'center', flex: 1 }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '12px',
                                    background: 'rgba(0,229,155,0.1)',
                                    border: '1px solid rgba(0,229,155,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 6px', fontSize: '18px',
                                }}>
                                    ➕
                                </div>
                                <p style={{ color: 'white', fontSize: '11px', fontWeight: 700, margin: 0 }}>2. Add to Home</p>
                                <p style={{ color: '#6b7280', fontSize: '9px', margin: '2px 0 0' }}>Scroll down in menu</p>
                            </div>

                            {/* Arrow */}
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '18px', fontWeight: 300 }}>›</span>

                            {/* Step 3: Tap Add */}
                            <div style={{ textAlign: 'center', flex: 1 }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '12px',
                                    background: 'rgba(52,211,153,0.1)',
                                    border: '1px solid rgba(52,211,153,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 6px', fontSize: '18px',
                                }}>
                                    ✅
                                </div>
                                <p style={{ color: 'white', fontSize: '11px', fontWeight: 700, margin: 0 }}>3. Tap &quot;Add&quot;</p>
                                <p style={{ color: '#6b7280', fontSize: '9px', margin: '2px 0 0' }}>Top right corner</p>
                            </div>
                        </div>

                        {/* Bottom hint with arrow pointing down */}
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ color: '#9ca3af', fontSize: '11px', margin: 0 }}>
                                Look for the <span style={{ color: '#007AFF', fontWeight: 700 }}>Share ↑</span> button at the bottom of Safari
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
