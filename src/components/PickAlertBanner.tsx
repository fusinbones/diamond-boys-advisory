'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface AlertPick {
    id: string;
    pick_team: string;
    home_team: string;
    away_team: string;
    pick_type: string;
    pick_value: string | null;
    confidence: number;
    result: string;
    created_at: string;
}

type AlertType = 'new' | 'hit';

/**
 * PickAlertBanner — two types of dopamine-inducing notifications:
 *
 * 1. NEW PICK — a pending pick just dropped (for subscribers)
 * 2. PREMIUM HIT — a premium pick just won (for free users → regret trigger)
 *
 * Polls /api/public/pick-alerts every 60s. Tracks seen alerts via localStorage.
 */
export default function PickAlertBanner() {
    const [alert, setAlert] = useState<{ pick: AlertPick; type: AlertType } | null>(null);
    const [dismissed, setDismissed] = useState(false);

    const getSeenIds = useCallback((): string[] => {
        try {
            return JSON.parse(localStorage.getItem('db_seen_alerts') || '[]');
        } catch {
            return [];
        }
    }, []);

    const markSeen = useCallback((alertId: string) => {
        const seen = getSeenIds();
        if (!seen.includes(alertId)) {
            seen.push(alertId);
            localStorage.setItem('db_seen_alerts', JSON.stringify(seen.slice(-50)));
        }
    }, [getSeenIds]);

    const checkAlerts = useCallback(async () => {
        try {
            const res = await fetch('/api/public/pick-alerts');
            if (!res.ok) return;
            const data = await res.json();
            const seenIds = getSeenIds();

            // Priority 1: Recent hit (conversion trigger)
            if (data.recentHit && !seenIds.includes(`hit-${data.recentHit.id}`)) {
                setAlert({ pick: data.recentHit, type: 'hit' });
                setDismissed(false);
                return;
            }

            // Priority 2: New pick
            if (data.newPick && !seenIds.includes(`new-${data.newPick.id}`)) {
                setAlert({ pick: data.newPick, type: 'new' });
                setDismissed(false);
            }
        } catch {
            // Silent fail
        }
    }, [getSeenIds]);

    useEffect(() => {
        const initialTimer = setTimeout(checkAlerts, 3000);
        const interval = setInterval(checkAlerts, 60000);
        return () => { clearTimeout(initialTimer); clearInterval(interval); };
    }, [checkAlerts]);

    // Auto-dismiss after 10s
    useEffect(() => {
        if (alert && !dismissed) {
            const timer = setTimeout(() => {
                setDismissed(true);
                markSeen(`${alert.type}-${alert.pick.id}`);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [alert, dismissed, markSeen]);

    const handleDismiss = () => {
        setDismissed(true);
        if (alert) markSeen(`${alert.type}-${alert.pick.id}`);
    };

    const handleView = () => {
        if (alert) markSeen(`${alert.type}-${alert.pick.id}`);
    };

    const confidenceLabel = (c: number) => {
        if (c >= 4) return { text: 'HIGH', color: '#00e59b' };
        if (c >= 3) return { text: 'MEDIUM', color: '#fbbf24' };
        return { text: 'LOW', color: '#f97316' };
    };

    if (!alert || dismissed) return null;

    const isHit = alert.type === 'hit';
    const conf = confidenceLabel(alert.pick.confidence);
    const accentColor = isHit ? '#00e59b' : '#a78bfa';

    return (
        <AnimatePresence>
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
                    boxShadow: `0 8px 40px ${accentColor}33, 0 0 0 1px ${accentColor}25`,
                }}
            >
                <div style={{
                    background: 'linear-gradient(135deg, rgba(4,8,16,0.97) 0%, rgba(10,22,40,0.97) 100%)',
                    backdropFilter: 'blur(20px)',
                    padding: '16px',
                }}>
                    {/* Close */}
                    <button onClick={handleDismiss} aria-label="Dismiss" style={{
                        position: 'absolute', top: '10px', right: '10px',
                        background: 'rgba(255,255,255,0.06)', border: 'none',
                        borderRadius: '50%', width: '24px', height: '24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#9ca3af',
                    }}>
                        <X size={12} />
                    </button>

                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: accentColor,
                            boxShadow: `0 0 8px ${accentColor}`,
                            animation: 'pulse 1.5s ease-in-out infinite',
                        }} />
                        <span style={{ color: accentColor, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {isHit ? '✅ Premium Pick Just Hit!' : '🔥 New Pick Alert'}
                        </span>
                    </div>

                    {/* Pick card */}
                    <div style={{
                        background: `${accentColor}08`,
                        border: `1px solid ${accentColor}20`,
                        borderRadius: '10px',
                        padding: '12px',
                        marginBottom: '12px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {isHit && <CheckCircle2 size={14} style={{ color: '#00e59b' }} />}
                                <span style={{ color: 'white', fontSize: '15px', fontWeight: 700 }}>
                                    {alert.pick.pick_team} {alert.pick.pick_value || ''}
                                </span>
                            </div>
                            <span style={{
                                fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                color: conf.color, background: `${conf.color}15`,
                                padding: '2px 8px', borderRadius: '6px',
                            }}>
                                {conf.text}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9ca3af', fontSize: '12px' }}>
                            <TrendingUp size={12} />
                            <span>{alert.pick.away_team} @ {alert.pick.home_team} · {alert.pick.pick_type}</span>
                        </div>
                        {isHit && (
                            <div style={{
                                marginTop: '8px', paddingTop: '8px',
                                borderTop: '1px solid rgba(0,229,155,0.1)',
                                color: '#6b7280', fontSize: '11px',
                            }}>
                                Premium members locked this in {(() => {
                                    const hrs = Math.floor((Date.now() - new Date(alert.pick.created_at).getTime()) / 3600000);
                                    return hrs <= 1 ? 'earlier today' : `${hrs} hours ago`;
                                })()}
                            </div>
                        )}
                    </div>

                    {/* CTA */}
                    <Link
                        href={isHit ? '/pricing' : '/community'}
                        onClick={handleView}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            width: '100%', padding: '10px',
                            background: isHit
                                ? 'linear-gradient(135deg, #00e59b, #00c98a)'
                                : 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
                            borderRadius: '10px', border: 'none',
                            color: isHit ? '#080c15' : 'white',
                            fontSize: '13px', fontWeight: 700,
                            cursor: 'pointer', textDecoration: 'none',
                        }}
                    >
                        {isHit ? 'Get Premium — Never Miss Again' : 'View Pick'}
                        <ArrowRight size={14} />
                    </Link>
                </div>

                {/* Progress bar */}
                <div style={{ height: '3px', background: `${accentColor}15` }}>
                    <motion.div
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: 10, ease: 'linear' }}
                        style={{ height: '100%', background: accentColor, borderRadius: '2px' }}
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
