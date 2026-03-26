'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Flame, Lock, Clock, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface FirePick {
    id: string;
    matchup: string;
    sport: string;
    pick_type?: string;
    pick_team?: string;
    pick_value?: string;
    odds?: string;
    confidence?: number;
    units?: number;
    reasoning?: string;
    scheduled_at: string;
    status: string;
}

interface FirePickCardProps {
    firePick: FirePick;
    isPaid: boolean;
}

const sportEmoji: Record<string, string> = {
    MLB: '⚾', NBA: '🏀', NFL: '🏈', NHL: '🏒',
};

function useCountdown(targetDate: string): string {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const update = () => {
            const diff = Math.max(0, new Date(targetDate).getTime() - Date.now());
            if (diff <= 0) { setTimeLeft('DROPPED'); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    return timeLeft;
}

export default function FirePickCard({ firePick, isPaid }: FirePickCardProps): ReactNode {
    const isScheduled = firePick.status === 'scheduled';
    const countdown = useCountdown(firePick.scheduled_at);
    const isDropped = countdown === 'DROPPED';

    return (
        <motion.div
            className="fire-pick-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
            {/* Flame border glow */}
            <div className="fire-pick-glow" />

            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="fire-badge">
                            <Flame size={14} />
                            FIRE PICK
                        </span>
                        <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                            {sportEmoji[firePick.sport] || '🔥'} {firePick.sport}
                        </span>
                    </div>
                    {isScheduled && !isDropped && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={13} style={{ color: '#fbbf24' }} />
                            <span className="fire-countdown">{countdown}</span>
                        </div>
                    )}
                </div>

                {/* Matchup */}
                <h3 style={{
                    fontSize: '16px', fontWeight: 700, color: 'white',
                    marginBottom: '8px', lineHeight: 1.3,
                }}>
                    {firePick.matchup}
                </h3>

                {/* Scheduled state — countdown hype */}
                {isScheduled && !isDropped && (
                    <div style={{
                        textAlign: 'center', padding: '16px 0',
                    }}>
                        <p style={{ fontSize: '13px', color: '#fbbf24', fontWeight: 600, marginBottom: '4px' }}>
                            🔥 FIRE PICK INCOMING
                        </p>
                        <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                            This rare pick drops soon. Stay tuned.
                        </p>
                    </div>
                )}

                {/* Revealed state — show the pick (or paywall) */}
                {(firePick.status === 'revealed' || isDropped) && (
                    isPaid ? (
                        <div>
                            {/* Pick details */}
                            <div style={{
                                background: 'rgba(251,191,36,0.06)',
                                border: '1px solid rgba(251,191,36,0.15)',
                                borderRadius: '10px',
                                padding: '14px',
                                marginBottom: '10px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#fbbf24' }}>
                                        {firePick.pick_value || 'Pick loading...'}
                                    </span>
                                    {firePick.odds && (
                                        <span style={{
                                            fontSize: '13px', fontWeight: 700,
                                            color: '#00e59b',
                                            background: 'rgba(0,229,155,0.1)',
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                        }}>
                                            {firePick.odds}
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#9ca3af' }}>
                                    <span>🎯 {firePick.confidence || 85}% confidence</span>
                                    <span>📊 {firePick.units || 3}u</span>
                                </div>
                            </div>

                            {/* Reasoning */}
                            {firePick.reasoning && (
                                <p style={{
                                    fontSize: '12px', color: '#d1d5db', lineHeight: 1.5,
                                    borderTop: '1px solid rgba(255,255,255,0.06)',
                                    paddingTop: '10px', marginTop: '6px',
                                }}>
                                    {firePick.reasoning}
                                </p>
                            )}
                        </div>
                    ) : (
                        /* Paywall for free/trial users */
                        <div style={{
                            textAlign: 'center', padding: '20px 0',
                        }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                background: 'rgba(251,191,36,0.1)',
                                border: '2px solid rgba(251,191,36,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 10px',
                            }}>
                                <Lock size={18} style={{ color: '#fbbf24' }} />
                            </div>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
                                🔥 This Fire Pick is for premium members only
                            </p>
                            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
                                Upgrade to see our rarest, highest-conviction picks.
                            </p>
                            <Link
                                href="/pricing"
                                className="btn-glow"
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    padding: '10px 20px', fontSize: '13px', fontWeight: 700,
                                }}
                            >
                                <Zap size={14} />
                                Unlock Fire Picks
                                <ArrowRight size={12} />
                            </Link>
                        </div>
                    )
                )}
            </div>
        </motion.div>
    );
}
