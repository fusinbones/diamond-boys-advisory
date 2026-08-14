'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    Calendar,
    TrendingUp,
    Activity,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle,
    Target,
    Search,
} from 'lucide-react';
import type { Game } from '@/lib/api-sports-types';
import { adminFetch } from '@/lib/adminFetch';

export default function AdminDashboard() {
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [games, setGames] = useState<Game[]>([]);
    const [pitcherMap, setPitcherMap] = useState<Record<string, { id: number; fullName: string }>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchGames();
    }, [date]);

    const fetchGames = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await adminFetch(`/api/admin/games?date=${date}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setGames(data.games || []);
            setPitcherMap(data.pitcherMap || {});
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load games');
        } finally {
            setLoading(false);
        }
    };

    const shiftDate = (days: number) => {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        setDate(d.toISOString().split('T')[0]);
    };

    const isToday = date === new Date().toISOString().split('T')[0];

    // Filter games by search
    const filtered = useMemo(() => {
        if (!search.trim()) return games;
        const q = search.toLowerCase();
        return games.filter(g =>
            g.teams.home.name.toLowerCase().includes(q) ||
            g.teams.away.name.toLowerCase().includes(q)
        );
    }, [games, search]);

    // Categorize
    const liveGames = filtered.filter(g => g.status.short.startsWith('IN'));
    const upcomingGames = filtered.filter(g => g.status.short === 'NS');
    const finishedGames = filtered.filter(g => g.status.short === 'FT' || g.status.short === 'AOT');

    const formatDate = (d: string) => {
        return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>
                        ⚾ Dashboard
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '13px' }}>
                        {isToday ? "Today's" : formatDate(date)} MLB Games
                    </p>
                </div>

                {/* Date nav */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => shiftDate(-1)} className="admin-btn admin-btn-secondary" style={{ padding: '8px' }}>
                        <ChevronLeft size={16} />
                    </button>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="admin-input"
                        style={{ width: '160px', textAlign: 'center' }}
                    />
                    <button onClick={() => shiftDate(1)} className="admin-btn admin-btn-secondary" style={{ padding: '8px' }}>
                        <ChevronRight size={16} />
                    </button>
                    {!isToday && (
                        <button onClick={() => setDate(new Date().toISOString().split('T')[0])} className="admin-btn admin-btn-primary" style={{ fontSize: '12px' }}>
                            Today
                        </button>
                    )}
                </div>
            </div>

            {/* Search + Quick Stats Row */}
            <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'stretch' }}>
                {/* Search */}
                <div className="admin-search" style={{ flex: '1 1 280px' }}>
                    <Search size={16} className="admin-search-icon" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search teams... (e.g. Yankees)"
                        className="admin-search-input"
                    />
                </div>

                {/* Inline Stats */}
                <div style={{ display: 'flex', gap: '8px', flex: '0 0 auto', flexWrap: 'wrap' }}>
                    <div className="admin-stat-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 'auto' }}>
                        <Calendar size={14} style={{ color: '#FFC107' }} />
                        <span className="admin-stat-label" style={{ margin: 0 }}>Games</span>
                        <span style={{ color: 'white', fontWeight: 800, fontSize: '18px' }}>{loading ? '…' : games.length}</span>
                    </div>
                    <div className="admin-stat-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 'auto' }}>
                        <Activity size={14} style={{ color: '#fbbf24' }} />
                        <span className="admin-stat-label" style={{ margin: 0 }}>Live</span>
                        <span style={{ color: liveGames.length > 0 ? '#22c55e' : 'white', fontWeight: 800, fontSize: '18px' }}>{loading ? '…' : liveGames.length}</span>
                    </div>
                    <div className="admin-stat-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 'auto' }}>
                        <TrendingUp size={14} style={{ color: '#a78bfa' }} />
                        <span className="admin-stat-label" style={{ margin: 0 }}>Upcoming</span>
                        <span style={{ color: 'white', fontWeight: 800, fontSize: '18px' }}>{loading ? '…' : upcomingGames.length}</span>
                    </div>
                    <div className="admin-stat-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 'auto' }}>
                        <Target size={14} style={{ color: '#6b7280' }} />
                        <span className="admin-stat-label" style={{ margin: 0 }}>Final</span>
                        <span style={{ color: 'white', fontWeight: 800, fontSize: '18px' }}>{loading ? '…' : finishedGames.length}</span>
                    </div>
                </div>
            </div>

            {/* Search Active Indicator */}
            {search && (
                <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                        Showing {filtered.length} of {games.length} games matching &ldquo;<span style={{ color: '#FFC107' }}>{search}</span>&rdquo;
                    </span>
                    <button
                        onClick={() => setSearch('')}
                        style={{ background: 'rgba(239,68,68,0.12)', border: 'none', color: '#f87171', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Clear
                    </button>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="admin-loader">
                    <div className="admin-spinner" />
                    <span>Loading games...</span>
                </div>
            ) : error ? (
                <div className="admin-card" style={{ textAlign: 'center', padding: '32px' }}>
                    <AlertCircle size={24} style={{ color: '#f87171', marginBottom: '8px' }} />
                    <p style={{ color: '#f87171', fontSize: '14px', marginBottom: '12px' }}>{error}</p>
                    <button onClick={fetchGames} className="admin-btn admin-btn-secondary">Retry</button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="admin-empty">
                    <div className="admin-empty-icon">⚾</div>
                    <p style={{ fontSize: '14px' }}>
                        {search ? `No games matching "${search}"` : 'No games scheduled for this date.'}
                    </p>
                </div>
            ) : (
                <div>
                    {/* Live Games */}
                    {liveGames.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <h2 style={{ color: '#FFC107', fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div className="live-dot" /> LIVE ({liveGames.length})
                            </h2>
                            <div className="admin-game-grid">
                                {liveGames.map(game => <GameCard key={game.id} game={game} pitcherMap={pitcherMap} />)}
                            </div>
                        </div>
                    )}

                    {/* Upcoming */}
                    {upcomingGames.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <h2 style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
                                UPCOMING ({upcomingGames.length})
                            </h2>
                            <div className="admin-game-grid">
                                {upcomingGames.map(game => <GameCard key={game.id} game={game} pitcherMap={pitcherMap} />)}
                            </div>
                        </div>
                    )}

                    {/* Finished */}
                    {finishedGames.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <h2 style={{ color: '#6b7280', fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
                                FINAL ({finishedGames.length})
                            </h2>
                            <div className="admin-game-grid">
                                {finishedGames.map(game => <GameCard key={game.id} game={game} pitcherMap={pitcherMap} />)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Game Card ───────────────────────────────

function GameCard({ game, pitcherMap }: { game: Game; pitcherMap: Record<string, { id: number; fullName: string }> }) {
    const isLive = game.status.short.startsWith('IN');
    const isFinished = game.status.short === 'FT' || game.status.short === 'AOT';

    const statusClass = isLive ? 'live' : isFinished ? 'finished' : 'upcoming';
    const statusText = isLive ? game.status.long : isFinished ? 'Final' : game.time || 'TBD';

    const awayPitcher = pitcherMap[game.teams.away.name];
    const homePitcher = pitcherMap[game.teams.home.name];
    const leagueLabel = game.league?.name || 'MLB';
    const isSpring = leagueLabel.includes('Spring');

    return (
        <Link href={`/admin/analysis/${game.id}`} className={`admin-game-card ${isLive ? 'live-card' : ''}`}>
            {/* League badge + Status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span className={`admin-league-badge ${isSpring ? 'spring' : 'mlb'}`}>
                    {isSpring ? '🌴 Spring Training' : '⚾ MLB'}
                </span>
                <span className={`admin-game-status ${statusClass}`}>
                    {isLive && <div className="live-dot" style={{ width: '6px', height: '6px' }} />}
                    {statusText}
                </span>
            </div>

            {/* Teams + Scores */}
            <div className="admin-game-teams">
                <div className="admin-game-team">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={game.teams.away.logo} alt={game.teams.away.name} />
                    <span className="admin-game-team-name">{game.teams.away.name}</span>
                </div>
                {(isFinished || isLive) && (
                    <span className="admin-game-score">{game.scores.away.total ?? '-'}</span>
                )}
                <span className="admin-game-vs">@</span>
                {(isFinished || isLive) && (
                    <span className="admin-game-score">{game.scores.home.total ?? '-'}</span>
                )}
                <div className="admin-game-team" style={{ justifyContent: 'flex-end' }}>
                    <span className="admin-game-team-name" style={{ textAlign: 'right' }}>{game.teams.home.name}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={game.teams.home.logo} alt={game.teams.home.name} />
                </div>
            </div>

            {/* Probable Pitchers */}
            {(awayPitcher || homePitcher) && (
                <div className="admin-game-pitchers">
                    <span>🎯 {awayPitcher?.fullName || 'TBD'}</span>
                    <span style={{ color: '#374151', fontSize: '10px' }}>vs</span>
                    <span>🎯 {homePitcher?.fullName || 'TBD'}</span>
                </div>
            )}

            {/* Analyze CTA */}
            <div style={{ textAlign: 'right', marginTop: '8px' }}>
                <span style={{ color: '#FFC107', fontSize: '11px', fontWeight: 600 }}>Analyze →</span>
            </div>
        </Link>
    );
}
