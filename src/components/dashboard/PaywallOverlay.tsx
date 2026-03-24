'use client';

import { type ReactNode } from 'react';
import { Lock, Gem, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface PaywallOverlayProps {
    daysLeft?: number;
}

export default function PaywallOverlay({ daysLeft = 0 }: PaywallOverlayProps): ReactNode {
    return (
        <motion.div
            className="paywall-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div style={{ marginBottom: '16px' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(0,229,155,0.1)',
                    border: '2px solid rgba(0,229,155,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                }}>
                    <Lock size={20} style={{ color: '#00e59b' }} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'white', marginBottom: '6px' }}>
                    {daysLeft > 0 ? `${daysLeft} Day${daysLeft !== 1 ? 's' : ''} Left on Free Trial` : 'Your Free Trial Has Ended'}
                </h3>
                <p style={{ fontSize: '14px', color: '#9ca3af', maxWidth: '320px', lineHeight: 1.5 }}>
                    {daysLeft > 0
                        ? 'Upgrade now to lock in your access and never miss a pick.'
                        : 'Subscribe to unlock all picks, full stats, and the community — plans start at just $9.99/week.'
                    }
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '280px' }}>
                <Link
                    href="/pricing"
                    className="btn-glow"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '14px 24px',
                        fontSize: '15px',
                        fontWeight: 700,
                        width: '100%',
                    }}
                >
                    <Gem size={16} />
                    Unlock Full Access
                    <ArrowRight size={14} />
                </Link>
                <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                    Cancel anytime • 21+ only • Secure checkout via Stripe
                </p>
            </div>
        </motion.div>
    );
}
