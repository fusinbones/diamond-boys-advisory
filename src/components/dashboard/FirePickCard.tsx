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
                    <div style={{ position: 'relative' }}>
                        {/* Pick details (Blurred if unpaid) */}
                        <div style={{
                            background: 'rgba(251,191,36,0.06)',
                            border: '1px solid rgba(251,191,36,0.15)',
                            borderRadius: '10px',
                            padding: '14px',
                            marginBottom: '10px',
                            filter: isPaid ? 'none' : 'blur(6px)',
                            opacity: isPaid ? 1 : 0.6,
                            userSelect: isPaid ? 'auto' : 'none',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ fontSize: '18px', fontWeight: 800, color: '#fbbf24' }}>
                                    {isPaid ? (firePick.pick_value || 'Pick loading...') : '███████████'}
                                </span>
                                {(firePick.odds || !isPaid) && (
                                    <span style={{
                                        fontSize: '13px', fontWeight: 700,
                                        color: '#00e59b',
                                        background: 'rgba(0,229,155,0.1)',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                    }}>
                                        {isPaid ? firePick.odds : '-███'}
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#9ca3af' }}>
                                <span>🎯 {firePick.confidence || 85}% confidence</span>
                                <span>📊 {firePick.units || 3}u</span>
                            </div>
                            {isPaid && firePick.reasoning && (
                                <div style={{ 
                                    marginTop: '10px', paddingTop: '10px', 
                                    borderTop: '1px solid rgba(251,191,36,0.15)', 
                                    fontSize: '13px', color: '#d1d5db', lineHeight: 1.5 
                                }}>
                                    {firePick.reasoning}
                                </div>
                            )}
                        </div>

                        {/* Paywall Overlay for free/trial users */}
                        {!isPaid && (
                            <div style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                textAlign: 'center',
                                background: 'rgba(10, 10, 15, 0.4)',
                                borderRadius: '10px',
                                padding: '10px',
                            }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: 'rgba(251,191,36,0.1)',
                                    border: '2px solid rgba(251,191,36,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                }}>
                                    <Lock size={16} style={{ color: '#fbbf24' }} />
                                </div>
                                <p style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '3px', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                                    Members Only Fire Pick
                                </p>
                                <p style={{ fontSize: '11px', color: '#e5e7eb', marginBottom: '10px', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                                    Upgrade to see this rare pick
                                </p>
                                <Link
                                    href="/pricing"
                                    className="btn-glow"
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                        padding: '8px 16px', fontSize: '12px', fontWeight: 700,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                    }}
                                >
                                    <Zap size={12} />
                                    Unlock Fire Pick
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
