'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Lock, ArrowRight } from 'lucide-react';

interface TickerItem {
    id: string;
    type: 'odds' | 'edge' | 'streak' | 'score' | 'movement';
    sport: string;
    sportEmoji: string;
    headline: string;
    detail: string;
    urgency: 'low' | 'medium' | 'high';
    timestamp: string;
}

const SPORT_FILTERS = [
    { key: 'all', label: 'All', emoji: '🔥' },
    { key: 'MLB', label: 'MLB', emoji: '⚾' },
    { key: 'NBA', label: 'NBA', emoji: '🏀' },
    { key: 'NFL', label: 'NFL', emoji: '🏈' },
    { key: 'NHL', label: 'NHL', emoji: '🏒' },
];

export default function MagicTicker() {
    const [items, setItems] = useState<TickerItem[]>([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    const fetchTicker = useCallback(async () => {
        try {
            const res = await fetch('/api/public/ticker');
            const data = await res.json();
            if (data.items) setItems(data.items);
        } catch (err) {
            console.error('Ticker fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTicker();
        const interval = setInterval(fetchTicker, 60000); // 60s refresh
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = filter === 'all' ? items : items.filter(i => i.sport === filter);
    const teaserItems = filtered.slice(0, 6); // Max 6 teaser cards

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
    };

    return (
        <section style={{
            background: 'linear-gradient(180deg, rgba(0,229,155,0.03) 0%, rgba(10,10,15,0) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            padding: '24px 0 32px',
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '12px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: '#00e59b', boxShadow: '0 0 8px #00e59b',
                            animation: 'pulse 2s infinite',
                        }} />
                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.3px' }}>
                            Today&apos;s Board
                        </h2>
                        <span style={{
                            fontSize: '10px', color: '#00e59b',
                            background: 'rgba(0,229,155,0.1)', padding: '2px 8px',
                            borderRadius: '20px', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.5px',
                        }}>
                            LIVE
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {SPORT_FILTERS.map(sf => (
                            <button
                                key={sf.key}
                                onClick={() => setFilter(sf.key)}
                                style={{
                                    background: filter === sf.key ? 'rgba(0,229,155,0.15)' : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${filter === sf.key ? 'rgba(0,229,155,0.3)' : 'rgba(255,255,255,0.06)'}`,
                                    color: filter === sf.key ? '#00e59b' : '#6b7280',
                                    borderRadius: '20px', padding: '4px 12px',
                                    fontSize: '11px', fontWeight: 600,
                                    cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                                }}
                            >
                                {sf.emoji} {sf.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Ticker Grid — TEASER ONLY */}
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#4b5563', gap: '10px' }}>
                        <div style={{
                            width: '16px', height: '16px',
                            border: '2px solid rgba(0,229,155,0.3)', borderTopColor: '#00e59b',
                            borderRadius: '50%', animation: 'spin 1s linear infinite',
                        }} />
                        <span style={{ fontSize: '13px' }}>Loading live games...</span>
                    </div>
                ) : teaserItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#4b5563', fontSize: '13px' }}>
                        No games scheduled right now. Check back closer to game time!
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: '10px',
                    }}>
                        <AnimatePresence mode="popLayout">
                            {teaserItems.map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.35, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
                                    style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '10px',
                                        padding: '14px 16px',
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {/* Game info — VISIBLE */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#00e59b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                                    {item.sportEmoji} {item.sport}
                                                </span>
                                                <span style={{
                                                    fontSize: '9px', fontWeight: 700,
                                                    color: '#fbbf24', background: 'rgba(251,191,36,0.12)',
                                                    padding: '1px 6px', borderRadius: '4px',
                                                }}>
                                                    {formatTime(item.timestamp)} ET
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f3f4f6' }}>
                                                {item.headline}
                                            </div>
                                        </div>

                                        {/* Blurred odds — LOCKED */}
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '6px 12px', borderRadius: '8px',
                                            background: 'rgba(0,229,155,0.04)',
                                            border: '1px solid rgba(0,229,155,0.1)',
                                        }}>
                                            <span style={{
                                                fontSize: '12px', fontWeight: 700, color: '#9ca3af',
                                                filter: 'blur(4px)', userSelect: 'none', WebkitUserSelect: 'none',
                                            }}>
                                                -135 / +115
                                            </span>
                                            <Lock size={12} style={{ color: '#00e59b', flexShrink: 0 }} />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* CTA — Unlock full board */}
                {!loading && teaserItems.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        style={{ marginTop: '16px', textAlign: 'center' }}
                    >
                        <Link href="/pricing" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            color: '#00e59b', fontSize: '14px', fontWeight: 700,
                            textDecoration: 'none', padding: '10px 24px',
                            borderRadius: '10px', border: '1px solid rgba(0,229,155,0.15)',
                            background: 'rgba(0,229,155,0.04)',
                            transition: 'all 0.2s',
                        }}>
                            🔓 Unlock Full Odds, Analysis & Expert Picks
                            <ArrowRight size={14} />
                        </Link>
                        <p style={{ fontSize: '11px', color: '#4b5563', marginTop: '8px' }}>
                            {filtered.length} games on the board today • Members see live odds from 5+ sportsbooks
                        </p>
                    </motion.div>
                )}
            </div>
        </section>
    );
}
