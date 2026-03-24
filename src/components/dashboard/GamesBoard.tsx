'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { Loader2, RefreshCw, Wifi } from 'lucide-react';
import GameOddsCard, { type GameData } from './GameOddsCard';

const SPORT_TABS = ['All', 'MLB', 'NBA', 'NHL'];

export default function GamesBoard(): ReactNode {
    const [games, setGames] = useState<GameData[]>([]);
    const [sportCounts, setSportCounts] = useState<Record<string, number>>({});
    const [activeSport, setActiveSport] = useState('All');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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

    // Auto-refresh every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => fetchGames(true), 300000);
        return () => clearInterval(interval);
    }, [fetchGames]);

    const liveGames = games.filter(g => g.isLive);
    const upcomingGames = games.filter(g => !g.isLive && !g.isCompleted);
    const completedGames = games.filter(g => g.isCompleted);

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Wifi size={15} style={{ color: '#00e59b' }} />
                        Today&apos;s Games
                    </h2>
                    <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                        {games.length} games • {liveGames.length > 0 ? `${liveGames.length} live • ` : ''}
                        {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : ''}
                    </p>
                </div>
                <button
                    onClick={() => fetchGames(true)}
                    disabled={refreshing}
                    style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        color: '#9ca3af',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                    }}
                >
                    <RefreshCw size={12} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
                    Refresh
                </button>
            </div>

            {/* Sport Tabs — scrollable on mobile */}
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: '14px', paddingBottom: '2px' }}>
                {SPORT_TABS.map(tab => {
                    const count = tab === 'All' ? games.length : (sportCounts[tab] || 0);
                    const isActive = activeSport === tab;

                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveSport(tab)}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                border: isActive ? '1px solid rgba(0,229,155,0.3)' : '1px solid rgba(255,255,255,0.06)',
                                background: isActive ? 'rgba(0,229,155,0.1)' : 'rgba(255,255,255,0.03)',
                                color: isActive ? '#00e59b' : '#9ca3af',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            {tab} {count > 0 && <span style={{ opacity: 0.6, fontSize: '10px' }}>({count})</span>}
                        </button>
                    );
                })}
            </div>

            {/* Loading state */}
            {loading ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                    <Loader2 size={22} style={{ color: '#00e59b', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                    <p style={{ color: '#6b7280', fontSize: '12px' }}>Loading today&apos;s lines...</p>
                </div>
            ) : games.length === 0 ? (
                <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '14px',
                    padding: '40px 24px',
                    textAlign: 'center',
                }}>
                    <p style={{ fontSize: '36px', marginBottom: '8px' }}>🏟️</p>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#d1d5db' }}>No games on the board right now</p>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Check back when games are scheduled!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Live Games Section */}
                    {liveGames.length > 0 && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <span className="pulse-dot" style={{ width: '6px', height: '6px' }} />
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#00e59b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Live Now ({liveGames.length})
                                </span>
                            </div>
                            {liveGames.map(g => <GameOddsCard key={g.id} game={g} />)}
                        </>
                    )}

                    {/* Upcoming Games */}
                    {upcomingGames.length > 0 && (
                        <>
                            {liveGames.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '8px 0 4px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Upcoming ({upcomingGames.length})
                                    </span>
                                </div>
                            )}
                            {upcomingGames.map(g => <GameOddsCard key={g.id} game={g} />)}
                        </>
                    )}

                    {/* Completed Games */}
                    {completedGames.length > 0 && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '8px 0 4px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Final ({completedGames.length})
                                </span>
                            </div>
                            {completedGames.map(g => <GameOddsCard key={g.id} game={g} />)}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
