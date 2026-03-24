'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { Loader2, RefreshCw, ChevronRight } from 'lucide-react';
import GameOddsCard, { type GameData } from './GameOddsCard';
import Tooltip from './Tooltip';

const SPORT_TABS = ['All', 'MLB', 'NBA', 'NHL'];

export default function GamesBoard(): ReactNode {
    const [games, setGames] = useState<GameData[]>([]);
    const [sportCounts, setSportCounts] = useState<Record<string, number>>({});
    const [activeSport, setActiveSport] = useState('All');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [showAll, setShowAll] = useState(false);

    const fetchGames = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const sportParam = activeSport !== 'All' ? `?sport=${activeSport}` : '';
            const res = await fetch(`/api/dashboard/games${sportParam}`);
            if (res.ok) {
                const data = await res.json();
                setGames(data.games || []);
                setSportCounts(data.sportCounts || {});
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error('Failed to fetch games:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeSport]);

    useEffect(() => { fetchGames(); }, [fetchGames]);
    useEffect(() => {
        const i = setInterval(() => fetchGames(true), 300000);
        return () => clearInterval(i);
    }, [fetchGames]);

    // Sort: live first, then best value, then by time
    const sortedGames = [...games].sort((a, b) => {
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;
        if (a.isCompleted && !b.isCompleted) return 1;
        if (!a.isCompleted && b.isCompleted) return -1;
        if (a.oddsSpread !== b.oddsSpread) return b.oddsSpread - a.oddsSpread; // best value first
        return new Date(a.gameTime).getTime() - new Date(b.gameTime).getTime();
    });

    const liveCount = games.filter(g => g.isLive).length;

    return (
        <div className="games-board">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', padding: '0 2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#e5e7eb', margin: 0 }}>
                        Today&apos;s Lines
                    </h3>
                    <Tooltip text="Live odds from sportsbooks. Green numbers mean underdog (higher payout). Red numbers mean favorite." />
                    {liveCount > 0 && (
                        <span style={{
                            fontSize: '9px', fontWeight: 700, color: '#00e59b',
                            background: 'rgba(0,229,155,0.12)', padding: '2px 6px', borderRadius: '4px',
                        }}>
                            {liveCount} LIVE
                        </span>
                    )}
                </div>
                <button
                    onClick={() => fetchGames(true)}
                    disabled={refreshing}
                    style={{
                        background: 'none', border: 'none', padding: '4px',
                        color: '#6b7280', cursor: 'pointer', display: 'flex',
                    }}
                    aria-label="Refresh games"
                >
                    <RefreshCw size={12} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
                </button>
            </div>

            {/* Sport filter pills */}
            <div style={{ display: 'flex', gap: '3px', marginBottom: '8px', flexWrap: 'wrap' }}>
                {SPORT_TABS.map(tab => {
                    const count = tab === 'All' ? games.length : (sportCounts[tab] || 0);
                    const active = activeSport === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => { setActiveSport(tab); setShowAll(false); }}
                            style={{
                                padding: '3px 10px', borderRadius: '12px',
                                fontSize: '10px', fontWeight: 600, cursor: 'pointer',
                                border: active ? '1px solid rgba(0,229,155,0.3)' : '1px solid rgba(255,255,255,0.06)',
                                background: active ? 'rgba(0,229,155,0.1)' : 'transparent',
                                color: active ? '#00e59b' : '#6b7280',
                            }}
                        >
                            {tab} <span style={{ opacity: 0.5 }}>{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Loading */}
            {loading ? (
                <div style={{ padding: '30px 0', textAlign: 'center' }}>
                    <Loader2 size={16} style={{ color: '#00e59b', animation: 'spin 1s linear infinite', margin: '0 auto 6px' }} />
                    <p style={{ color: '#6b7280', fontSize: '10px' }}>Loading lines...</p>
                </div>
            ) : games.length === 0 ? (
                <div style={{ padding: '24px 12px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: '24px', marginBottom: '4px' }}>🏟️</p>
                    <p style={{ fontSize: '11px', color: '#6b7280' }}>No games right now</p>
                </div>
            ) : (
                <>
                    {/* Game tiles — horizontal scroll on mobile, vertical list on desktop sidebar */}
                    <div className="games-scroll-container">
                        {(showAll ? sortedGames : sortedGames.slice(0, 8)).map(g => (
                            <GameOddsCard key={g.id} game={g} />
                        ))}
                        {/* "More" card */}
                        {!showAll && sortedGames.length > 8 && (
                            <button
                                onClick={() => setShowAll(true)}
                                className="game-tile"
                                style={{
                                    background: 'rgba(0,229,155,0.05)',
                                    border: '1px solid rgba(0,229,155,0.15)',
                                    borderRadius: '10px',
                                    padding: '10px 12px',
                                    minWidth: '100px',
                                    flex: '0 0 auto',
                                    cursor: 'pointer',
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center', gap: '4px',
                                    color: '#00e59b', fontSize: '11px', fontWeight: 600,
                                }}
                            >
                                <ChevronRight size={16} />
                                +{sortedGames.length - 8} more
                            </button>
                        )}
                    </div>

                    {/* Timestamp */}
                    {lastUpdated && (
                        <p style={{ fontSize: '9px', color: '#4b5563', marginTop: '6px', textAlign: 'right' }}>
                            Updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                    )}
                </>
            )}
        </div>
    );
}
