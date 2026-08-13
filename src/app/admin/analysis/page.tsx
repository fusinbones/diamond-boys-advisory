'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Calendar, ChevronLeft, ChevronRight, Filter, Loader2, AlertCircle } from 'lucide-react';
import type { Game } from '@/lib/api-sports-types';

export default function AnalysisHubPage() {
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [games, setGames] = useState<Game[]>([]);
    const [pitcherMap, setPitcherMap] = useState<Record<string, { id: number; fullName: string }>>({});
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchGames();
    }, [date]);

    const fetchGames = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/admin/games?date=${date}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setGames(data.games || []);
            setPitcherMap(data.pitcherMap || {});
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    };

    const filteredGames = games.filter(g => {
        // Search filter
        if (search) {
            const s = search.toLowerCase();
            if (!g.teams.home.name.toLowerCase().includes(s) && !g.teams.away.name.toLowerCase().includes(s)) return false;
        }
        // Status filter
        if (statusFilter === 'live') return g.status.short.startsWith('IN');
        if (statusFilter === 'upcoming') return g.status.short === 'NS';
        if (statusFilter === 'final') return g.status.short === 'FT' || g.status.short === 'AOT';
        return true;
    });

    const shiftDate = (days: number) => {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        setDate(d.toISOString().split('T')[0]);
    };

    const liveCount = games.filter(g => g.status.short.startsWith('IN')).length;
    const upcomingCount = games.filter(g => g.status.short === 'NS').length;
    const finalCount = games.filter(g => g.status.short === 'FT' || g.status.short === 'AOT').length;

    return (
        <div>
            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>
                🔍 Analysis Hub
            </h1>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '20px' }}>
                Select a game to drill into full analysis
            </p>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                    <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="admin-input"
                        style={{ paddingLeft: '36px' }}
                        placeholder="Search teams..."
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button onClick={() => shiftDate(-1)} className="admin-btn admin-btn-secondary" style={{ padding: '8px' }}>
                        <ChevronLeft size={16} />
                    </button>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="admin-input" style={{ width: '160px', textAlign: 'center' }} />
                    <button onClick={() => shiftDate(1)} className="admin-btn admin-btn-secondary" style={{ padding: '8px' }}>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Status Filter Pills */}
            <div className="admin-filter-pills" style={{ marginBottom: '20px' }}>
                {[
                    { key: 'all', label: `All (${games.length})` },
                    { key: 'live', label: `🔴 Live (${liveCount})` },
                    { key: 'upcoming', label: `Upcoming (${upcomingCount})` },
                    { key: 'final', label: `Final (${finalCount})` },
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setStatusFilter(f.key)}
                        className={`admin-filter-pill ${statusFilter === f.key ? 'active' : ''}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Games Grid */}
            {loading ? (
                <div className="admin-loader"><div className="admin-spinner" /> Loading games...</div>
            ) : error ? (
                <div className="admin-card" style={{ textAlign: 'center', padding: '32px' }}>
                    <AlertCircle size={24} style={{ color: '#f87171', marginBottom: '8px' }} />
                    <p style={{ color: '#f87171', fontSize: '14px' }}>{error}</p>
                    <button onClick={fetchGames} className="admin-btn admin-btn-secondary" style={{ marginTop: '12px' }}>Retry</button>
                </div>
            ) : filteredGames.length === 0 ? (
                <div className="admin-empty">
                    <Filter size={24} style={{ marginBottom: '8px', opacity: 0.3 }} />
                    <p>{search ? 'No games match your search.' : 'No games for this date.'}</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
                    {filteredGames.map(game => {
                        const isLive = game.status.short.startsWith('IN');
                        const isDone = game.status.short === 'FT' || game.status.short === 'AOT';
                        const leagueLabel = game.league?.name || 'MLB';
                        const isSpring = leagueLabel.includes('Spring');
                        const awayPitcher = pitcherMap[game.teams.away.name];
                        const homePitcher = pitcherMap[game.teams.home.name];

                        return (
                            <Link key={game.id} href={`/admin/analysis/${game.id}`} className={`admin-game-card ${isLive ? 'live-card' : ''}`}>
                                {/* League + Status */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span className={`admin-league-badge ${isSpring ? 'spring' : 'mlb'}`}>
                                        {isSpring ? '🌴 Spring' : '⚾ MLB'}
                                    </span>
                                    <span className={`admin-game-status ${isLive ? 'live' : isDone ? 'finished' : 'upcoming'}`}>
                                        {isLive && <div className="live-dot" style={{ width: '6px', height: '6px' }} />}
                                        {isLive ? game.status.short : isDone ? 'Final' : game.time || 'TBD'}
                                    </span>
                                </div>

                                {/* Teams */}
                                <div className="admin-game-teams">
                                    <div className="admin-game-team">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={game.teams.away.logo} alt={game.teams.away.name} />
                                        <span className="admin-game-team-name">{game.teams.away.name}</span>
                                    </div>
                                    {(isDone || isLive) && <span className="admin-game-score">{game.scores.away.total ?? '-'}</span>}
                                    <span className="admin-game-vs">@</span>
                                    {(isDone || isLive) && <span className="admin-game-score">{game.scores.home.total ?? '-'}</span>}
                                    <div className="admin-game-team" style={{ justifyContent: 'flex-end' }}>
                                        <span className="admin-game-team-name" style={{ textAlign: 'right' }}>{game.teams.home.name}</span>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={game.teams.home.logo} alt={game.teams.home.name} />
                                    </div>
                                </div>

                                {/* Pitchers */}
                                {(awayPitcher || homePitcher) && (
                                    <div className="admin-game-pitchers">
                                        <span>🎯 {awayPitcher?.fullName || 'TBD'}</span>
                                        <span style={{ color: '#374151', fontSize: '10px' }}>vs</span>
                                        <span>🎯 {homePitcher?.fullName || 'TBD'}</span>
                                    </div>
                                )}

                                <div style={{ textAlign: 'right', marginTop: '8px' }}>
                                    <span style={{ color: '#FFC107', fontSize: '11px', fontWeight: 600 }}>Analyze →</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
