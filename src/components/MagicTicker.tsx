'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Lock, ArrowRight } from 'lucide-react';

interface GameData {
    id: string;
    sport: string;
    sportEmoji: string;
    homeTeam: string;
    awayTeam: string;
    gameTime: string;
    isLive: boolean;
    isCompleted: boolean;
    homeScore: string | null;
    awayScore: string | null;
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

/** A single sport ticker row — fetches its own data */
function SportTickerRow({ sport, delay }: { sport: SportConfig; delay: number }) {
    const [games, setGames] = useState<GameData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const res = await fetch(`/api/dashboard/games?sport=${sport.key}`);
                const data = await res.json();
                setGames((data.games || []) as GameData[]);
            } catch {
                /* skip */
            } finally {
                setLoading(false);
            }
        };
        fetchGames();
        const interval = setInterval(fetchGames, 90000); // refresh every 90s
        return () => clearInterval(interval);
    }, [sport.key]);

    if (loading) return null; // don't show loading spinners — rows appear as data arrives
    if (games.length === 0) return null; // hide sport with no games

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
                }}>{games.length} game{games.length !== 1 ? 's' : ''}</span>
                <div style={{
                    flex: 1, height: '1px',
                    background: `linear-gradient(90deg, ${sport.color}22, transparent)`,
                }} />
            </div>

            {/* Horizontal scrolling cards */}
            <div className={`ticker-scroll-${sport.key}`} style={{
                display: 'flex', gap: '8px',
                overflowX: 'auto',
                paddingBottom: '6px',
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
            }}>
                <style>{`.ticker-scroll-${sport.key}::-webkit-scrollbar { display: none; }`}</style>
                {games.map((game) => (
                    <div
                        key={game.id}
                        style={{
                            minWidth: '280px',
                            maxWidth: '360px',
                            flex: '0 0 auto',
                            scrollSnapAlign: 'start',
                            background: sport.gradient,
                            border: `1px solid ${sport.color}15`,
                            borderRadius: '10px',
                            padding: '12px 14px',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Top accent */}
                        <div style={{
                            position: 'absolute', top: 0, left: '15%', right: '15%', height: '2px',
                            background: `linear-gradient(90deg, transparent, ${sport.color}40, transparent)`,
                            borderRadius: '0 0 4px 4px',
                        }} />

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                                    {game.isLive && (
                                        <span style={{
                                            fontSize: '8px', fontWeight: 800, color: '#00e59b',
                                            background: 'rgba(0,229,155,0.12)', padding: '1px 5px',
                                            borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.5px',
                                        }}>LIVE</span>
                                    )}
                                    {game.isCompleted && (
                                        <span style={{
                                            fontSize: '8px', fontWeight: 800, color: '#6b7280',
                                            background: 'rgba(107,114,128,0.12)', padding: '1px 5px',
                                            borderRadius: '3px', textTransform: 'uppercase',
                                        }}>FINAL</span>
                                    )}
                                    {!game.isLive && !game.isCompleted && (
                                        <span style={{
                                            fontSize: '9px', fontWeight: 700,
                                            color: '#fbbf24', background: 'rgba(251,191,36,0.12)',
                                            padding: '1px 6px', borderRadius: '4px',
                                        }}>
                                            {formatTime(game.gameTime)} ET
                                        </span>
                                    )}
                                </div>
                                <div style={{
                                    fontSize: '13px', fontWeight: 700, color: '#f3f4f6',
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>
                                    {game.awayTeam} @ {game.homeTeam}
                                </div>
                                {(game.isLive || game.isCompleted) && game.homeScore && game.awayScore && (
                                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px', fontWeight: 600 }}>
                                        {game.awayScore} - {game.homeScore}
                                    </div>
                                )}
                            </div>

                            {/* Blurred odds — LOCKED teaser */}
                            {!game.isCompleted && (
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
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

export default function MagicTicker() {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => { setLoaded(true); }, []);

    if (!loaded) return null;

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
                </div>

                {/* Each sport fetches its own data — hidden if no games */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {SPORTS.map((sport, i) => (
                        <SportTickerRow key={sport.key} sport={sport} delay={i * 0.1} />
                    ))}
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
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
                        Members see live odds from 5+ sportsbooks
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
