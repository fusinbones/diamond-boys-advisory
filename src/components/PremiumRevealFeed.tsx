'use client';

import { useState, useEffect } from 'react';
import { Lock, TrendingUp, ChevronRight, CheckCircle2, XCircle, Clock, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface RevealPick {
    id: string;
    pick_team: string;
    home_team: string;
    away_team: string;
    pick_type: string;
    pick_value: string | null;
    confidence: number;
    reason: string;
    result: 'hit' | 'miss' | 'push';
    game_date: string;
    created_at: string;
}

interface BlurredPick {
    id: string;
    home_team: string;
    away_team: string;
    confidence: number;
    game_date: string;
    pick_type: string;
}

/**
 * PremiumRevealFeed — the highest-converting component in sports advisory
 *
 * Shows two sections:
 * 1. REVEALED: Completed premium picks with full analysis (post-game) — free users can see results
 * 2. LOCKED: Upcoming premium picks, blurred — free users see team names + confidence badge only
 *
 * The "delayed reveal" triggers regret: "I would have won if I was subscribed"
 * The "locked" picks trigger FOMO: "There are picks I can't see right now"
 */
export default function PremiumRevealFeed({ isPaid = false }: { isPaid?: boolean }) {
    const [revealed, setRevealed] = useState<RevealPick[]>([]);
    const [locked, setLocked] = useState<BlurredPick[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'revealed' | 'locked'>('revealed');

    useEffect(() => {
        async function fetchPicks() {
            try {
                const res = await fetch('/api/public/premium-feed');
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setRevealed(data.revealed || []);
                setLocked(data.locked || []);
            } catch {
                // Silent fail
            } finally {
                setLoading(false);
            }
        }
        fetchPicks();
        const interval = setInterval(fetchPicks, 120000); // Refresh every 2 min
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ width: '24px', height: '24px', border: '2px solid rgba(106,0,255,0.2)', borderTopColor: '#FFC107', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            </div>
        );
    }

    if (revealed.length === 0 && locked.length === 0) return null;

    const confidenceLabel = (c: number) => {
        if (c >= 4) return { text: 'HIGH', color: '#FFC107', bg: 'rgba(106,0,255,0.1)' };
        if (c >= 3) return { text: 'MEDIUM', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' };
        return { text: 'LOW', color: '#f97316', bg: 'rgba(249,115,22,0.1)' };
    };

    const resultBadge = (result: string) => {
        switch (result) {
            case 'hit': return { icon: CheckCircle2, text: 'WIN', color: '#22c55e', bg: 'rgba(106,0,255,0.1)' };
            case 'miss': return { icon: XCircle, text: 'LOSS', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
            case 'push': return { icon: Clock, text: 'PUSH', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' };
            default: return { icon: Clock, text: 'PENDING', color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' };
        }
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(4,8,16,0.95) 0%, rgba(10,22,40,0.95) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            overflow: 'hidden',
            marginBottom: '12px',
        }}>
            {/* Header */}
            <div style={{ padding: '16px 16px 0', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Eye size={14} style={{ color: '#a78bfa' }} />
                    <span style={{ color: 'white', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Premium Picks Feed
                    </span>
                </div>
                <p style={{ color: '#6b7280', fontSize: '11px', margin: 0 }}>
                    {isPaid ? 'Your picks & results — updated after each game' : 'See what premium members are getting — results revealed after each game'}
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', padding: '0 16px', gap: '4px', marginBottom: '12px' }}>
                {[
                    { key: 'revealed' as const, label: `Results (${revealed.length})`, icon: '📊' },
                    { key: 'locked' as const, label: `Upcoming (${locked.length})`, icon: isPaid ? '📅' : '🔒' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                            background: activeTab === tab.key ? 'rgba(106,0,255,0.1)' : 'rgba(255,255,255,0.03)',
                            color: activeTab === tab.key ? '#FFC107' : '#6b7280',
                            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={{ padding: '0 16px 16px', maxHeight: '360px', overflowY: 'auto' }}>
                <AnimatePresence mode="wait">
                    {activeTab === 'revealed' ? (
                        <motion.div
                            key="revealed"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                        >
                            {revealed.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#4b5563', fontSize: '13px' }}>
                                    No completed picks yet today. Check back after games finish!
                                </div>
                            ) : (
                                revealed.map((pick) => {
                                    const result = resultBadge(pick.result);
                                    const conf = confidenceLabel(pick.confidence);
                                    const ResultIcon = result.icon;
                                    return (
                                        <motion.div
                                            key={pick.id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{
                                                background: 'rgba(255,255,255,0.02)',
                                                border: `1px solid ${result.color}20`,
                                                borderRadius: '10px', padding: '12px',
                                            }}
                                        >
                                            {/* Top row: result + confidence */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <ResultIcon size={14} style={{ color: result.color }} />
                                                    <span style={{
                                                        fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                                        color: result.color, background: result.bg,
                                                        padding: '2px 8px', borderRadius: '6px',
                                                    }}>
                                                        {result.text}
                                                    </span>
                                                    <span style={{ color: '#4b5563', fontSize: '10px' }}>
                                                        Premium Pick
                                                    </span>
                                                </div>
                                                <span style={{
                                                    fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                                                    color: conf.color, background: conf.bg,
                                                    padding: '2px 6px', borderRadius: '4px',
                                                }}>
                                                    {conf.text}
                                                </span>
                                            </div>

                                            {/* Pick details */}
                                            <div style={{ marginBottom: '6px' }}>
                                                <span style={{ color: 'white', fontSize: '14px', fontWeight: 700 }}>
                                                    {pick.pick_team} {pick.pick_type} {pick.pick_value || ''}
                                                </span>
                                                <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '2px' }}>
                                                    {pick.away_team} @ {pick.home_team}
                                                </div>
                                            </div>

                                            {/* Analysis preview */}
                                            <div style={{
                                                color: '#9ca3af', fontSize: '11px', lineHeight: 1.5,
                                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                                paddingTop: '6px',
                                            }}>
                                                {pick.reason.length > 120 ? pick.reason.slice(0, 120) + '...' : pick.reason}
                                            </div>

                                            {/* Timestamp */}
                                            <div style={{ color: '#374151', fontSize: '10px', marginTop: '6px' }}>
                                                Posted {new Date(pick.created_at).toLocaleString('en-US', {
                                                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                                                })} — revealed post-game
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="locked"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                        >
                            {locked.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#4b5563', fontSize: '13px' }}>
                                    No upcoming picks right now. New picks drop daily!
                                </div>
                            ) : (
                                locked.map((pick) => {
                                    const conf = confidenceLabel(pick.confidence);
                                    return (
                                        <div
                                            key={pick.id}
                                            style={{
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                borderRadius: '10px', padding: '12px',
                                                position: 'relative', overflow: 'hidden',
                                            }}
                                        >
                                            {/* Visible: teams + confidence */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                <span style={{ color: 'white', fontSize: '13px', fontWeight: 600 }}>
                                                    {pick.away_team} @ {pick.home_team}
                                                </span>
                                                <span style={{
                                                    fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                                                    color: conf.color, background: conf.bg,
                                                    padding: '2px 6px', borderRadius: '4px',
                                                }}>
                                                    {conf.text}
                                                </span>
                                            </div>

                                            {/* Blurred content */}
                                            <div style={{
                                                filter: isPaid ? 'none' : 'blur(6px)',
                                                WebkitFilter: isPaid ? 'none' : 'blur(6px)',
                                                userSelect: 'none',
                                                pointerEvents: 'none',
                                            }}>
                                                <div style={{ color: '#FFC107', fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>
                                                    {pick.pick_type} Pick Available
                                                </div>
                                                <div style={{ color: '#9ca3af', fontSize: '11px', lineHeight: 1.5 }}>
                                                    Full analysis with line value, pitching matchup breakdown, and unit recommendation...
                                                </div>
                                            </div>

                                            {/* Lock overlay for free users */}
                                            {!isPaid && (
                                                <div style={{
                                                    position: 'absolute', inset: 0,
                                                    background: 'linear-gradient(to bottom, transparent 20%, rgba(4,8,16,0.8) 100%)',
                                                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                                                    padding: '12px',
                                                }}>
                                                    <div style={{
                                                        display: 'flex', alignItems: 'center', gap: '6px',
                                                        color: '#a78bfa', fontSize: '11px', fontWeight: 600,
                                                    }}>
                                                        <Lock size={12} />
                                                        Premium members only
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}

                            {/* Upgrade CTA */}
                            {!isPaid && locked.length > 0 && (
                                <Link
                                    href="/pricing"
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        width: '100%', padding: '12px',
                                        background: 'linear-gradient(135deg, #FFC107, #00c98a)',
                                        borderRadius: '10px', border: 'none',
                                        color: '#080c15', fontSize: '13px', fontWeight: 700,
                                        cursor: 'pointer', textDecoration: 'none',
                                    }}
                                >
                                    <TrendingUp size={14} />
                                    Unlock All Picks — See Full Analysis
                                    <ChevronRight size={14} />
                                </Link>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
