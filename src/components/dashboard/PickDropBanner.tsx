'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Zap, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PickDropBannerProps {
    pickCount: number;
    isPaid: boolean;
}

export default function PickDropBanner({ pickCount, isPaid }: PickDropBannerProps): ReactNode {
    if (pickCount <= 0) return null;

    // Paid users see the pick with a celebratory tone
    if (isPaid) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: 'linear-gradient(135deg, rgba(106,0,255,0.12) 0%, rgba(59,130,246,0.08) 100%)',
                    border: '1px solid rgba(106,0,255,0.2)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginBottom: '14px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>🔥</span>
                    <div>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>
                            {pickCount} new pick{pickCount > 1 ? 's' : ''} just dropped!
                        </p>
                        <p style={{ fontSize: '12px', color: '#9ca3af' }}>Scroll down to see the full analysis</p>
                    </div>
                </div>
                <Zap size={18} style={{ color: '#FFC107', flexShrink: 0 }} />
            </motion.div>
        );
    }

    // Trial/free users see FOMO — can't see the actual picks
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'linear-gradient(135deg, rgba(251,146,60,0.1) 0%, rgba(239,68,68,0.06) 100%)',
                border: '1px solid rgba(251,146,60,0.2)',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '14px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'rgba(251,146,60,0.15)',
                    border: '1px solid rgba(251,146,60,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'pulse-dot-anim 2s ease-in-out infinite',
                }}>
                    <Lock size={16} style={{ color: '#fb923c' }} />
                </div>
                <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>
                        🔥 {pickCount} pick{pickCount > 1 ? 's' : ''} just dropped!
                    </p>
                    <p style={{ fontSize: '12px', color: '#d1d5db' }}>
                        Upgrade to see today&apos;s picks and full analysis
                    </p>
                </div>
            </div>
            <Link
                href="/pricing"
                className="btn-glow"
                style={{
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                }}
            >
                Unlock <ArrowRight size={12} />
            </Link>
        </motion.div>
    );
}
