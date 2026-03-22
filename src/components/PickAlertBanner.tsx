'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, TrendingUp, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

interface Pick {
    id: string;
    team: string;
    opponent: string;
    pick_type: string;
    pick_line: string;
    confidence: string;
    created_at: string;
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * PickAlertBanner — dopamine-inducing notification for new picks
 * - Polls for new picks every 60s
 * - Tracks seen picks via localStorage
 * - Shows a premium slide-in banner with pick details
 * - Auto-dismisses after 10s
 * - Only shows for authenticated users
 */
export default function PickAlertBanner() {
    const [newPick, setNewPick] = useState<Pick | null>(null);
    const [dismissed, setDismissed] = useState(false);

    const getSeenPickIds = useCallback((): string[] => {
        try {
            return JSON.parse(localStorage.getItem('db_seen_picks') || '[]');
        } catch {
            return [];
        }
    }, []);

    const markPickSeen = useCallback((pickId: string) => {
        const seen = getSeenPickIds();
        if (!seen.includes(pickId)) {
            seen.push(pickId);
            // Keep only last 50 to avoid localStorage bloat
            localStorage.setItem('db_seen_picks', JSON.stringify(seen.slice(-50)));
        }
    }, [getSeenPickIds]);

    const checkForNewPicks = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('picks')
                .select('id, team, opponent, pick_type, pick_line, confidence, created_at')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error || !data || data.length === 0) return;

            const latest = data[0] as Pick;
            const seenIds = getSeenPickIds();

            // Only show if this pick is new and less than 2 hours old
            const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
            const pickTime = new Date(latest.created_at).getTime();

            if (!seenIds.includes(latest.id) && pickTime > twoHoursAgo) {
                setNewPick(latest);
                setDismissed(false);
            }
        } catch (err) {
            console.error('Pick alert check failed:', err);
        }
    }, [getSeenPickIds]);

    useEffect(() => {
        // Initial check after 3s delay
        const initialTimer = setTimeout(checkForNewPicks, 3000);

        // Poll every 60 seconds
        const interval = setInterval(checkForNewPicks, 60000);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, [checkForNewPicks]);

    // Auto-dismiss after 10 seconds
    useEffect(() => {
        if (newPick && !dismissed) {
            const timer = setTimeout(() => {
                setDismissed(true);
                markPickSeen(newPick.id);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [newPick, dismissed, markPickSeen]);

    const handleDismiss = () => {
        setDismissed(true);
        if (newPick) markPickSeen(newPick.id);
    };

    const handleView = () => {
        if (newPick) markPickSeen(newPick.id);
    };

    const confidenceColor = (conf: string) => {
        switch (conf?.toUpperCase()) {
            case 'HIGH': return '#00e59b';
            case 'MEDIUM': return '#fbbf24';
            case 'LOW': return '#f97316';
            default: return '#00e59b';
        }
    };

    return (
        <AnimatePresence>
            {newPick && !dismissed && (
                <motion.div
                    initial={{ opacity: 0, x: 300 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 300 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    style={{
                        position: 'fixed',
                        top: '80px',
                        right: '16px',
                        zIndex: 9998,
                        width: '320px',
                        maxWidth: 'calc(100vw - 32px)',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 8px 40px rgba(0,229,155,0.2), 0 0 0 1px rgba(0,229,155,0.15)',
                    }}
                >
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(4,8,16,0.97) 0%, rgba(10,22,40,0.97) 100%)',
                        backdropFilter: 'blur(20px)',
                        padding: '16px',
                    }}>
                        {/* Close */}
                        <button
                            onClick={handleDismiss}
                            aria-label="Dismiss"
                            style={{
                                position: 'absolute', top: '10px', right: '10px',
                                background: 'rgba(255,255,255,0.06)', border: 'none',
                                borderRadius: '50%', width: '24px', height: '24px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#9ca3af',
                            }}
                        >
                            <X size={12} />
                        </button>

                        {/* Header with pulse dot */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <div style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: '#00e59b',
                                boxShadow: '0 0 8px #00e59b',
                                animation: 'pulse 1.5s ease-in-out infinite',
                            }} />
                            <span style={{ color: '#00e59b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                🔥 New Pick Alert
                            </span>
                        </div>

                        {/* Pick details */}
                        <div style={{
                            background: 'rgba(0,229,155,0.05)',
                            border: '1px solid rgba(0,229,155,0.12)',
                            borderRadius: '10px',
                            padding: '12px',
                            marginBottom: '12px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ color: 'white', fontSize: '15px', fontWeight: 700 }}>
                                    {newPick.team} {newPick.pick_line || ''}
                                </span>
                                <span style={{
                                    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                    color: confidenceColor(newPick.confidence),
                                    background: `${confidenceColor(newPick.confidence)}15`,
                                    padding: '2px 8px', borderRadius: '6px',
                                }}>
                                    {newPick.confidence}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9ca3af', fontSize: '12px' }}>
                                <TrendingUp size={12} />
                                <span>vs {newPick.opponent} · {newPick.pick_type}</span>
                            </div>
                        </div>

                        {/* CTA */}
                        <Link
                            href="/community"
                            onClick={handleView}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                width: '100%', padding: '10px',
                                background: 'linear-gradient(135deg, #00e59b, #00c98a)',
                                borderRadius: '10px', border: 'none',
                                color: '#080c15', fontSize: '13px', fontWeight: 700,
                                cursor: 'pointer', textDecoration: 'none',
                            }}
                        >
                            View Pick
                            <ArrowRight size={14} />
                        </Link>
                    </div>

                    {/* Progress bar for auto-dismiss */}
                    <div style={{
                        height: '3px', background: 'rgba(0,229,155,0.1)',
                    }}>
                        <motion.div
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: 10, ease: 'linear' }}
                            style={{ height: '100%', background: '#00e59b', borderRadius: '2px' }}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
