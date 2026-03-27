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

interface SportConfig {
    key: string;
    emoji: string;
    label: string;
    color: string;
    gradient: string;
}

const SPORTS: SportConfig[] = [
    { key: 'MLB', emoji: '⚾', label: 'MLB', color: '#ef4444', gradient: 'rgba(239,68,68,0.08)' },
    { key: 'NBA', emoji: '🏀', label: 'NBA', color: '#f97316', gradient: 'rgba(249,115,22,0.08)' },
    { key: 'NHL', emoji: '🏒', label: 'NHL', color: '#3b82f6', gradient: 'rgba(59,130,246,0.08)' },
];

function formatTime(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
    } catch { return ''; }
}

/** A single horizontal scrolling ticker row for one sport */
function SportTickerRow({ sport, items, delay }: { sport: SportConfig; items: TickerItem[]; delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
        >
            {/* Sport label */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                marginBottom: '8px',
            }}>
                <span style={{ fontSize: '13px' }}>{sport.emoji}</span>
                <span style={{
                    fontSize: '11px', fontWeight: 800, color: sport.color,
                    letterSpacing: '0.5px', textTransform: 'uppercase',
                }}>{sport.label}</span>
                <span style={{
                    fontSize: '10px', color: '#4b5563', fontWeight: 600,
                }}>{items.length} game{items.length !== 1 ? 's' : ''}</span>
                <div style={{
                    flex: 1, height: '1px',
                    background: `linear-gradient(90deg, ${sport.color}22, transparent)`,
                }} />
            </div>

            {/* Horizontal scrolling cards */}
            <div style={{
                display: 'flex', gap: '8px',
                overflowX: 'auto',
                paddingBottom: '6px',
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
            }}>
                <style>{`
                    .ticker-row-${sport.key}::-webkit-scrollbar { display: none; }
                `}</style>
                <div className={`ticker-row-${sport.key}`} style={{
                    display: 'flex', gap: '8px',
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    scrollbarWidth: 'none',
                    width: '100%',
                }}>
                    {items.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                minWidth: '300px',
                                maxWidth: '380px',
                                flex: '0 0 auto',
                                scrollSnapAlign: 'start',
                                background: sport.gradient,
                                border: `1px solid ${sport.color}15`,
                                borderRadius: '10px',
                                padding: '12px 14px',
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'border-color 0.2s',
                            }}
                        >
                            {/* Top accent line */}
                            <div style={{
                                position: 'absolute', top: 0, left: '15%', right: '15%', height: '2px',
                                background: `linear-gradient(90deg, transparent, ${sport.color}40, transparent)`,
                                borderRadius: '0 0 4px 4px',
                            }} />

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                                        <span style={{
                                            fontSize: '9px', fontWeight: 700,
                                            color: '#fbbf24', background: 'rgba(251,191,36,0.12)',
                                            padding: '1px 6px', borderRadius: '4px',
                                        }}>
                                            {formatTime(item.timestamp)} ET
                                        </span>
                                        {item.urgency === 'high' && (
                                            <span style={{
                                                fontSize: '8px', fontWeight: 800,
                                                color: '#ef4444', background: 'rgba(239,68,68,0.1)',
                                                padding: '1px 5px', borderRadius: '3px',
                                                textTransform: 'uppercase', letterSpacing: '0.5px',
                                            }}>HOT</span>
                                        )}
                                    </div>
                                    <div style={{
                                        fontSize: '13px', fontWeight: 700, color: '#f3f4f6',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>
                                        {item.headline}
                                    </div>
                                </div>

                                {/* Blurred odds — LOCKED teaser */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '5px',
                                    padding: '5px 10px', borderRadius: '7px',
                                    background: `${sport.color}08`,
                                    border: `1px solid ${sport.color}15`,
                                    flexShrink: 0,
                                }}>
                                    <span style={{
                                        fontSize: '11px', fontWeight: 700, color: '#9ca3af',
                                        filter: 'blur(4px)', userSelect: 'none', WebkitUserSelect: 'none',
                                    }}>
                                        -135 / +115
                                    </span>
                                    <Lock size={11} style={{ color: sport.color, flexShrink: 0 }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

export default function MagicTicker() {
    const [items, setItems] = useState<TickerItem[]>([]);
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
        const interval = setInterval(fetchTicker, 60000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Group items by sport and filter to only sports with games
    const sportGroups = SPORTS
        .map(sport => ({
            sport,
            items: items.filter(i => i.sport === sport.key),
        }))
        .filter(g => g.items.length > 0);

    const totalGames = items.length;

    return (
        <section style={{
            background: 'linear-gradient(180deg, rgba(0,229,155,0.03) 0%, rgba(10,10,15,0) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            padding: '24px 0 28px',
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    marginBottom: '18px',
                }}>
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
                    {!loading && totalGames > 0 && (
                        <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: 'auto' }}>
                            {totalGames} games across {sportGroups.length} sport{sportGroups.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {/* Per-sport tickers stacked vertically */}
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '50px 20px', color: '#4b5563', gap: '10px' }}>
                        <div style={{
                            width: '16px', height: '16px',
                            border: '2px solid rgba(0,229,155,0.3)', borderTopColor: '#00e59b',
                            borderRadius: '50%', animation: 'spin 1s linear infinite',
                        }} />
                        <span style={{ fontSize: '13px' }}>Loading live games...</span>
                    </div>
                ) : sportGroups.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#4b5563', fontSize: '13px' }}>
                        No games scheduled right now. Check back closer to game time!
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {sportGroups.map((group, i) => (
                            <SportTickerRow
                                key={group.sport.key}
                                sport={group.sport}
                                items={group.items}
                                delay={i * 0.1}
                            />
                        ))}
                    </div>
                )}

                {/* CTA — Unlock full board */}
                {!loading && sportGroups.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        style={{ marginTop: '18px', textAlign: 'center' }}
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
                            {totalGames} games on the board today • Members see live odds from 5+ sportsbooks
                        </p>
                    </motion.div>
                )}
            </div>
        </section>
    );
}
