'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Flame, Trophy, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface PickRecord {
    total: number;
    wins: number;
    losses: number;
    pushes: number;
    winPct: string;
    streak: number;
    streakType: 'W' | 'L' | 'none';
}

/**
 * StreakCounter — public-facing win record + streak widget
 * Shows premium picks performance to everyone (free + paid)
 * Displays: W-L record, win %, current streak, and upgrade CTA for free users
 */
export default function StreakCounter({ isPaid = false }: { isPaid?: boolean }) {
    const [record, setRecord] = useState<PickRecord | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRecord() {
            try {
                const res = await fetch('/api/public/pick-record');
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setRecord(data);
            } catch {
                // Silently fail — widget just doesn't show
            } finally {
                setLoading(false);
            }
        }
        fetchRecord();
        // Refresh every 5 minutes
        const interval = setInterval(fetchRecord, 300000);
        return () => clearInterval(interval);
    }, []);

    if (loading || !record || record.total === 0) return null;

    const isHotStreak = record.streakType === 'W' && record.streak >= 3;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'linear-gradient(135deg, rgba(4,8,16,0.95) 0%, rgba(10,22,40,0.95) 100%)',
                border: `1px solid ${isHotStreak ? 'rgba(0,229,155,0.25)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '12px',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Hot streak glow effect */}
            {isHotStreak && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                    background: 'linear-gradient(to right, transparent, #00e59b, transparent)',
                }} />
            )}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Trophy size={14} style={{ color: '#fbbf24' }} />
                    <span style={{ color: 'white', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Premium Track Record
                    </span>
                </div>
                {isHotStreak && (
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            background: 'rgba(0,229,155,0.1)', padding: '3px 10px',
                            borderRadius: '20px', border: '1px solid rgba(0,229,155,0.2)',
                        }}
                    >
                        <Flame size={12} style={{ color: '#00e59b' }} />
                        <span style={{ color: '#00e59b', fontSize: '11px', fontWeight: 700 }}>HOT STREAK</span>
                    </motion.div>
                )}
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                {/* Record */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px 8px',
                    textAlign: 'center',
                }}>
                    <div style={{ color: 'white', fontSize: '18px', fontWeight: 800, lineHeight: 1 }}>
                        {record.wins}-{record.losses}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '10px', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Record
                    </div>
                </div>

                {/* Win % */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px 8px',
                    textAlign: 'center',
                }}>
                    <div style={{ color: '#00e59b', fontSize: '18px', fontWeight: 800, lineHeight: 1 }}>
                        {record.winPct}%
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '10px', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Win Rate
                    </div>
                </div>

                {/* Streak */}
                <div style={{
                    background: record.streakType === 'W'
                        ? 'rgba(0,229,155,0.06)' : record.streakType === 'L'
                        ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
                    borderRadius: '10px', padding: '10px 8px', textAlign: 'center',
                    border: isHotStreak ? '1px solid rgba(0,229,155,0.15)' : 'none',
                }}>
                    <div style={{
                        color: record.streakType === 'W' ? '#00e59b' : record.streakType === 'L' ? '#ef4444' : '#9ca3af',
                        fontSize: '18px', fontWeight: 800, lineHeight: 1,
                    }}>
                        {record.streak}{record.streakType !== 'none' ? record.streakType : '-'}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '10px', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Streak
                    </div>
                </div>
            </div>

            {/* Recent results dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px', justifyContent: 'center' }}>
                <span style={{ color: '#4b5563', fontSize: '10px', marginRight: '4px' }}>Recent:</span>
                {/* This would be populated from recent picks data */}
            </div>

            {/* CTA for free users */}
            {!isPaid && (
                <Link
                    href="/pricing"
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        width: '100%', padding: '10px',
                        background: 'linear-gradient(135deg, rgba(0,229,155,0.1), rgba(0,229,155,0.05))',
                        border: '1px solid rgba(0,229,155,0.2)',
                        borderRadius: '10px', textDecoration: 'none',
                        color: '#00e59b', fontSize: '12px', fontWeight: 700,
                    }}
                >
                    <TrendingUp size={13} />
                    Get Premium Picks
                    <ChevronRight size={13} />
                </Link>
            )}
        </motion.div>
    );
}
