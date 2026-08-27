'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

const FIRST_NAMES = [
    'John', 'Mike', 'Jason', 'David', 'Chris', 'Matt', 'Ryan', 'James',
    'Tyler', 'Brian', 'Kevin', 'Anthony', 'Marcus', 'Derek', 'Brandon',
    'Alex', 'Nick', 'Tom', 'Eric', 'Steve', 'Dan', 'Rob', 'Jake', 'Sean',
];

const LAST_INITIALS = 'ABCDEFGHJKLMNPRSTW'.split('');

const PLANS = [
    { name: 'Annual', emoji: '🏆', color: '#fbbf24' },
    { name: 'Monthly Elite', emoji: '💎', color: '#a78bfa' },
    { name: 'Weekly Package', emoji: '⚡', color: '#FFC107' },
    { name: '6-Month Package', emoji: '🔥', color: '#f97316' },
];

const TIME_AGO = [
    '2 minutes ago', '5 minutes ago', '12 minutes ago', '18 minutes ago',
    '25 minutes ago', '34 minutes ago', '1 hour ago', '2 hours ago',
    '3 hours ago', '4 hours ago',
];

function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

interface ToastData {
    name: string;
    plan: typeof PLANS[number];
    timeAgo: string;
}

function generateToast(): ToastData {
    return {
        name: `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_INITIALS)}.`,
        plan: getRandomItem(PLANS),
        timeAgo: getRandomItem(TIME_AGO),
    };
}

export default function SocialProofToast() {
    const { user, loading } = useAuth();
    const [visible, setVisible] = useState(false);
    const [toast, setToast] = useState<ToastData | null>(null);
    const [dismissed, setDismissed] = useState(false);

    const showToast = useCallback(() => {
        if (dismissed) return;
        const data = generateToast();
        setToast(data);
        setVisible(true);

        // Auto-hide after 5s
        setTimeout(() => setVisible(false), 5000);
    }, [dismissed]);

    useEffect(() => {
        // Don't show for logged-in users or while loading
        if (loading || user || dismissed) return;

        // First toast after 8s
        const firstTimer = setTimeout(showToast, 8000);

        // Then every 20-35s
        const interval = setInterval(() => {
            showToast();
        }, 20000 + Math.random() * 15000);

        return () => {
            clearTimeout(firstTimer);
            clearInterval(interval);
        };
    }, [loading, user, dismissed, showToast]);

    // Don't render for logged-in users
    if (loading || user || dismissed) return null;

    return (
        <AnimatePresence>
            {visible && toast && (
                <motion.div
                    initial={{ opacity: 0, y: 60, x: 0 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: 60 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        left: '24px',
                        zIndex: 1000,
                        maxWidth: '340px',
                        width: 'calc(100vw - 48px)',
                        background: 'linear-gradient(135deg, rgba(10,16,30,0.95), rgba(15,23,42,0.95))',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(106,0,255,0.15)',
                        borderRadius: '14px',
                        padding: '14px 16px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(106,0,255,0.05)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        {/* Icon */}
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: `${toast.plan.color}15`,
                            border: `1px solid ${toast.plan.color}25`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <ShoppingBag size={16} style={{ color: toast.plan.color }} />
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ color: '#e5e7eb', fontSize: '13px', fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
                                <span style={{ color: 'white' }}>{toast.name}</span> joined the{' '}
                                <span style={{ color: toast.plan.color, fontWeight: 700 }}>
                                    {toast.plan.emoji} {toast.plan.name}
                                </span>
                            </p>
                            <p style={{ color: '#6b7280', fontSize: '11px', margin: '3px 0 0' }}>
                                {toast.timeAgo}
                            </p>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={() => { setVisible(false); setDismissed(true); }}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#4b5563', padding: '2px', flexShrink: 0,
                            }}
                            aria-label="Dismiss notification"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* Subtle progress bar */}
                    <div style={{
                        position: 'absolute', bottom: 0, left: '16px', right: '16px',
                        height: '2px', borderRadius: '1px', overflow: 'hidden',
                    }}>
                        <motion.div
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: 5, ease: 'linear' }}
                            style={{
                                height: '100%', borderRadius: '1px',
                                background: `linear-gradient(to right, ${toast.plan.color}, transparent)`,
                            }}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
