'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    { key: 'all', label: 'All Sports', emoji: '🔥' },
    { key: 'MLB', label: 'MLB', emoji: '⚾' },
    { key: 'NBA', label: 'NBA', emoji: '🏀' },
    { key: 'NFL', label: 'NFL', emoji: '🏈' },
    { key: 'NHL', label: 'NHL', emoji: '🏒' },
];

const TYPE_COLORS: Record<string, string> = {
    edge: '#00e59b',
    movement: '#f59e0b',
    odds: '#6366f1',
    streak: '#ec4899',
    score: '#8b5cf6',
};

const TYPE_LABELS: Record<string, string> = {
    edge: '💎 EDGE',
    movement: '📊 LINE',
    odds: '🎯 ODDS',
    streak: '🔥 STREAK',
    score: '✅ FINAL',
};

const URGENCY_GLOW: Record<string, string> = {
    high: '0 0 20px rgba(0,229,155,0.3)',
    medium: '0 0 12px rgba(99,102,241,0.2)',
    low: 'none',
};

export default function MagicTicker() {
    const [items, setItems] = useState<TickerItem[]>([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState('');
    const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set());

    const fetchTicker = useCallback(async () => {
        try {
            const res = await fetch('/api/public/ticker');
            const data = await res.json();
            if (data.items) {
                // Detect new items
                const currentIds = new Set(items.map(i => i.id));
                const freshIds = new Set<string>();
                for (const item of data.items) {
                    if (!currentIds.has(item.id)) freshIds.add(item.id);
                }
                setNewItemIds(freshIds);
                setTimeout(() => setNewItemIds(new Set()), 3000);

                setItems(data.items);
                setLastUpdate(new Date().toLocaleTimeString());
            }
        } catch (err) {
            console.error('Ticker fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [items]);

    useEffect(() => {
        fetchTicker();
        const interval = setInterval(fetchTicker, 30000); // 30s auto-refresh
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = filter === 'all' ? items : items.filter(i => i.sport === filter);

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const diffMs = d.getTime() - now.getTime();
        const diffMin = Math.floor(diffMs / 60000);

        if (diffMin < 0 && diffMin > -180) return 'LIVE';
        if (diffMin >= 0 && diffMin < 60) return `${diffMin}min`;
        if (diffMin >= 60 && diffMin < 1440) return `${Math.floor(diffMin / 60)}hr`;

        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#00e59b',
                            boxShadow: '0 0 8px #00e59b',
                            animation: 'pulse 2s infinite',
                        }} />
                        <h2 style={{
                            fontSize: '18px',
                            fontWeight: 800,
                            color: 'white',
                            margin: 0,
                            letterSpacing: '-0.3px',
                        }}>
                            Magic Ticker
                        </h2>
                        <span style={{
                            fontSize: '10px',
                            color: '#00e59b',
                            background: 'rgba(0,229,155,0.1)',
                            padding: '2px 8px',
                            borderRadius: '20px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}>
                            LIVE
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {lastUpdate && (
                            <span style={{ fontSize: '10px', color: '#4b5563', marginRight: '8px' }}>
                                Updated {lastUpdate}
                            </span>
                        )}
                        {SPORT_FILTERS.map(sf => (
                            <button
                                key={sf.key}
                                onClick={() => setFilter(sf.key)}
                                style={{
                                    background: filter === sf.key
                                        ? 'rgba(0,229,155,0.15)'
                                        : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${filter === sf.key ? 'rgba(0,229,155,0.3)' : 'rgba(255,255,255,0.06)'}`,
                                    color: filter === sf.key ? '#00e59b' : '#6b7280',
                                    borderRadius: '20px',
                                    padding: '4px 12px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {sf.emoji} {sf.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Ticker Grid */}
                {loading ? (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '60px 20px',
                        color: '#4b5563',
                        gap: '10px',
                    }}>
                        <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid rgba(0,229,155,0.3)',
                            borderTopColor: '#00e59b',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                        }} />
                        <span style={{ fontSize: '13px' }}>Loading live intel...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        color: '#4b5563',
                        fontSize: '13px',
                    }}>
                        No live data for {filter} right now. Check back closer to game time!
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: '10px',
                    }}>
                        <AnimatePresence mode="popLayout">
                            {filtered.slice(0, 18).map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{
                                        duration: 0.35,
                                        delay: i * 0.03,
                                        ease: [0.25, 0.46, 0.45, 0.94],
                                    }}
                                    style={{
                                        background: newItemIds.has(item.id)
                                            ? 'rgba(0,229,155,0.06)'
                                            : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${newItemIds.has(item.id) ? 'rgba(0,229,155,0.2)' : 'rgba(255,255,255,0.05)'}`,
                                        borderRadius: '10px',
                                        padding: '14px 16px',
                                        cursor: 'pointer',
                                        transition: 'all 0.25s ease',
                                        boxShadow: URGENCY_GLOW[item.urgency],
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                                    whileHover={{
                                        scale: 1.01,
                                        borderColor: 'rgba(0,229,155,0.2)',
                                        backgroundColor: 'rgba(255,255,255,0.04)',
                                    }}
                                >
                                    {/* Urgency indicator bar */}
                                    {item.urgency === 'high' && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '2px',
                                            background: 'linear-gradient(90deg, #00e59b, #6366f1)',
                                        }} />
                                    )}

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        justifyContent: 'space-between',
                                        gap: '10px',
                                    }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            {/* Type badge + sport */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                marginBottom: '6px',
                                            }}>
                                                <span style={{
                                                    fontSize: '9px',
                                                    fontWeight: 800,
                                                    color: TYPE_COLORS[item.type] || '#6b7280',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.8px',
                                                }}>
                                                    {TYPE_LABELS[item.type] || item.type}
                                                </span>
                                                <span style={{
                                                    fontSize: '9px',
                                                    color: '#4b5563',
                                                    fontWeight: 600,
                                                }}>
                                                    {item.sportEmoji} {item.sport}
                                                </span>
                                            </div>

                                            {/* Headline */}
                                            <div style={{
                                                fontSize: '13px',
                                                fontWeight: 700,
                                                color: '#e5e7eb',
                                                marginBottom: '3px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}>
                                                {item.headline}
                                            </div>

                                            {/* Detail */}
                                            <div style={{
                                                fontSize: '12px',
                                                color: item.urgency === 'high' ? '#00e59b' : '#9ca3af',
                                                fontWeight: item.urgency === 'high' ? 700 : 500,
                                                fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                                            }}>
                                                {item.detail}
                                            </div>
                                        </div>

                                        {/* Time */}
                                        <div style={{
                                            fontSize: '10px',
                                            color: formatTime(item.timestamp) === 'LIVE' ? '#00e59b' : '#4b5563',
                                            fontWeight: formatTime(item.timestamp) === 'LIVE' ? 800 : 600,
                                            whiteSpace: 'nowrap',
                                            flexShrink: 0,
                                        }}>
                                            {formatTime(item.timestamp)}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* Bottom stats bar */}
                {!loading && filtered.length > 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '16px',
                        padding: '10px 14px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.04)',
                    }}>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            {Object.entries(
                                filtered.reduce((acc, item) => {
                                    acc[item.type] = (acc[item.type] || 0) + 1;
                                    return acc;
                                }, {} as Record<string, number>)
                            ).map(([type, count]) => (
                                <span key={type} style={{
                                    fontSize: '10px',
                                    color: TYPE_COLORS[type] || '#6b7280',
                                    fontWeight: 700,
                                }}>
                                    {TYPE_LABELS[type]?.split(' ')[0]} {count}
                                </span>
                            ))}
                        </div>
                        <span style={{ fontSize: '10px', color: '#374151' }}>
                            {filtered.length} items • Auto-refreshes every 30s
                        </span>
                    </div>
                )}
            </div>
        </section>
    );
}
