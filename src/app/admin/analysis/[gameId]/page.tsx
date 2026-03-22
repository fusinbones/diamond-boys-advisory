'use client';

import { useState, useEffect, use } from 'react';
import {
    TrendingUp,
    BarChart3,
    DollarSign,
    ArrowLeft,
    Loader2,
    AlertCircle,
    Target,
    Users,
    Brain,
    Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import type { Game, TeamStats } from '@/lib/api-sports-types';

interface StreakGame {
    gameId: number;
    date: string;
    opponent: string;
    opponentLogo: string;
    isHome: boolean;
    teamScore: number;
    oppScore: number;
    result: string;
    season: number;
}

interface StreakInfo {
    sequence: string;
    altPercentage: number;
    currentStreak: number;
    currentResult: string;
    gamesAnalyzed: number;
    totalGamesAvailable: number;
    alternationWindow: number;
    longestAltRun: number;
    currentAltStreak: number;
    predictedNext: string;
    isCurrentlyAlternating: boolean;
    overallAltPct: number;
    recentSequence: string;
}

interface TeamData {
    stats: TeamStats | null;
    streakData: StreakGame[];
    streakInfo: StreakInfo;
    totalGames: number;
    seasonsIncluded?: number[];
    seasonBreakdown?: Record<number, { games: number; wins: number; losses: number; altPct: number }>;
}

interface PitcherData {
    info: { id: number; fullName: string; pitchHand?: { code: string; description: string } } | null;
    stats: {
        era: string; whip: string; wins: number; losses: number;
        inningsPitched: string; strikeOuts: number; baseOnBalls: number;
        gamesStarted: number; earnedRuns: number;
    } | null;
    gameLog: { date: string; opponent: string; era: string; inningsPitched: string; strikeOuts: number; hits: number; earnedRuns: number }[];
    restDays: number | null;
    last5Stats: { games: number; avgERA: string; totalK: number; totalIP: string } | null;
}

interface OddsData {
    odds: {
        bookmakers: {
            id: number;
            name: string;
            bets: { id: number; name: string; values: { value: string; odd: string }[] }[];
        }[];
    }[];
}

export default function GameAnalysisPage({ params }: { params: Promise<{ gameId: string }> }) {
    const { gameId } = use(params);
    const [activeTab, setActiveTab] = useState('streaks');
    const [game, setGame] = useState<Game | null>(null);
    const [homeData, setHomeData] = useState<TeamData | null>(null);
    const [awayData, setAwayData] = useState<TeamData | null>(null);
    const [homeP, setHomeP] = useState<PitcherData | null>(null);
    const [awayP, setAwayP] = useState<PitcherData | null>(null);
    const [oddsData, setOddsData] = useState<OddsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadGameData();
    }, [gameId]);

    const loadGameData = async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch today's games first
            const gamesRes = await fetch(`/api/admin/games`);
            const gamesData = await gamesRes.json();
            let g = (gamesData.games || []).find((g: Game) => g.id === Number(gameId));
            let pitcherMapData = gamesData.pitcherMap || {};

            // If not found in today's games, search nearby dates (±3 days)
            if (!g) {
                const today = new Date();
                for (let offset = -1; offset >= -3; offset--) {
                    const d = new Date(today);
                    d.setDate(d.getDate() + offset);
                    const dateStr = d.toISOString().split('T')[0];
                    const res = await fetch(`/api/admin/games?date=${dateStr}`);
                    const data = await res.json();
                    const found = (data.games || []).find((fg: Game) => fg.id === Number(gameId));
                    if (found) {
                        g = found;
                        pitcherMapData = data.pitcherMap || {};
                        break;
                    }
                }
            }

            if (!g) {
                setError('Game not found. It may not be available for this date.');
                setLoading(false);
                return;
            }

            setGame(g);
            const season = g.league.season;
            const leagueId = g.league.id || 1;

            // Fetch team data + odds in parallel (pass league so Spring Training works)
            const [homeRes, awayRes, oddsRes] = await Promise.all([
                fetch(`/api/admin/teams/${g.teams.home.id}/stats?season=${season}&league=${leagueId}`),
                fetch(`/api/admin/teams/${g.teams.away.id}/stats?season=${season}&league=${leagueId}`),
                fetch(`/api/admin/odds/${g.id}`),
            ]);

            const [hd, ad, od] = await Promise.all([homeRes.json(), awayRes.json(), oddsRes.json()]);
            setHomeData(hd);
            setAwayData(ad);
            setOddsData(od);

            // Try to get pitcher data from the pitcherMap
            const hPitcher = pitcherMapData?.[g.teams.home.name];
            const aPitcher = pitcherMapData?.[g.teams.away.name];
            // Pass gameType=S for Spring Training so pitcher stats load correctly
            const gameType = leagueId === 71 ? 'S' : 'R';

            if (hPitcher?.id) {
                const pRes = await fetch(`/api/admin/pitchers/${hPitcher.id}?gameType=${gameType}`);
                setHomeP(await pRes.json());
            }
            if (aPitcher?.id) {
                const pRes = await fetch(`/api/admin/pitchers/${aPitcher.id}?gameType=${gameType}`);
                setAwayP(await pRes.json());
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load game data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-loader" style={{ minHeight: '400px' }}>
                <div className="admin-spinner" />
                <span>Loading game analysis...</span>
            </div>
        );
    }

    if (error || !game) {
        return (
            <div>
                <Link href="/admin" style={{ color: '#6b7280', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '20px', textDecoration: 'none' }}>
                    <ArrowLeft size={14} /> Back to Dashboard
                </Link>
                <div className="admin-card" style={{ textAlign: 'center', padding: '32px' }}>
                    <AlertCircle size={24} style={{ color: '#f87171', marginBottom: '8px' }} />
                    <p style={{ color: '#f87171', fontSize: '14px' }}>{error || 'Game not found'}</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'streaks', label: 'Streaks & Patterns', icon: TrendingUp },
        { id: 'pitching', label: 'Pitching', icon: Target },
        { id: 'stats', label: 'Team Stats', icon: BarChart3 },
        { id: 'odds', label: 'Odds', icon: DollarSign },
        { id: 'ai', label: 'AI Analysis', icon: Brain },
    ];

    return (
        <div>
            {/* Back nav + Quick Pick */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <Link href="/admin" style={{ color: '#6b7280', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                    <ArrowLeft size={14} /> Back to Dashboard
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`admin-league-badge ${game.league.name === 'MLB' ? 'mlb' : 'spring'}`}>
                        {game.league.name}
                    </span>
                    <Link
                        href={`/admin/picks?away=${encodeURIComponent(game.teams.away.name)}&home=${encodeURIComponent(game.teams.home.name)}&date=${game.date?.split('T')[0] || ''}`}
                        className="admin-quick-pick"
                    >
                        📋 Quick Pick
                    </Link>
                </div>
            </div>

            {/* Game Header */}
            <div className="admin-card" style={{ marginBottom: '20px', padding: '24px' }}>
                <div className="admin-game-header-flex">
                    <div style={{ textAlign: 'center' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={game.teams.away.logo} alt="" width={48} height={48} style={{ borderRadius: '8px', marginBottom: '6px' }} />
                        <div style={{ color: 'white', fontWeight: 700, fontSize: '15px' }}>{game.teams.away.name}</div>
                        <div style={{ color: '#6b7280', fontSize: '11px' }}>Away</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        {game.status.short === 'FT' || game.status.short.startsWith('IN') ? (
                            <div style={{ fontSize: '32px', fontWeight: 900, color: 'white', fontFamily: 'var(--font-display)' }}>
                                {game.scores.away.total ?? 0} - {game.scores.home.total ?? 0}
                            </div>
                        ) : (
                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#fbbf24' }}>
                                {game.time || 'TBD'}
                            </div>
                        )}
                        <div style={{ color: '#4b5563', fontSize: '12px', marginTop: '4px' }}>
                            {game.status.long}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={game.teams.home.logo} alt="" width={48} height={48} style={{ borderRadius: '8px', marginBottom: '6px' }} />
                        <div style={{ color: 'white', fontWeight: 700, fontSize: '15px' }}>{game.teams.home.name}</div>
                        <div style={{ color: '#6b7280', fontSize: '11px' }}>Home</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="admin-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <tab.icon size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px' }} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'streaks' && <StreaksTab homeData={homeData} awayData={awayData} game={game} />}
            {activeTab === 'pitching' && <PitchingTab homeP={homeP} awayP={awayP} game={game} />}
            {activeTab === 'stats' && <StatsTab homeData={homeData} awayData={awayData} game={game} />}
            {activeTab === 'odds' && <OddsTab oddsData={oddsData} />}
            {activeTab === 'ai' && <AITab game={game} homeData={homeData} awayData={awayData} homeP={homeP} awayP={awayP} oddsData={oddsData} />}
        </div>
    );
}

// ═══════════════════════════════════════════
// TAB: Alternation Patterns (W-L-W-L System)
// ═══════════════════════════════════════════

function StreaksTab({ homeData, awayData, game }: { homeData: TeamData | null; awayData: TeamData | null; game: Game }) {
    return (
        <div>
            <TeamAlternation data={awayData} team={game.teams.away} label="Away" />
            <TeamAlternation data={homeData} team={game.teams.home} label="Home" />
        </div>
    );
}

function TeamAlternation({ data, team, label }: { data: TeamData | null; team: { name: string; logo: string }; label: string }) {
    const [selectedYear, setSelectedYear] = useState<number | null>(null); // null = "Recent 13"

    if (!data) return <div className="admin-loader"><div className="admin-spinner" /> Loading...</div>;

    const { streakInfo, streakData } = data;
    const hasData = streakData.length > 0;
    const allSeasons = data.seasonBreakdown
        ? Object.keys(data.seasonBreakdown).map(Number).sort((a, b) => b - a)
        : [...new Set(streakData.map(g => g.season))].sort((a, b) => b - a);

    // Filter games based on selected year
    const filteredGames = selectedYear
        ? streakData.filter(g => g.season === selectedYear)
        : streakData.slice(0, 13); // Recent 13

    // Compute alt stats for filtered games
    const filteredResults = [...filteredGames].reverse().map(g => g.result); // oldest → newest
    let fAltCount = 0;
    for (let i = 1; i < filteredResults.length; i++) {
        if (filteredResults[i] !== filteredResults[i - 1]) fAltCount++;
    }
    const fAltPct = filteredResults.length > 1 ? Math.round((fAltCount / (filteredResults.length - 1)) * 100) : 0;

    let fLongestAlt = 0;
    let fCurAltRun = 0;
    for (let i = 1; i < filteredResults.length; i++) {
        if (filteredResults[i] !== filteredResults[i - 1]) { fCurAltRun++; fLongestAlt = Math.max(fLongestAlt, fCurAltRun); }
        else { fCurAltRun = 0; }
    }

    const fWins = filteredResults.filter(r => r === 'W').length;
    const fLosses = filteredResults.filter(r => r === 'L').length;

    // Display sequence (capped for pattern viz)
    const displaySequence = selectedYear
        ? filteredResults.slice(-30) // last 30 of selected year
        : streakInfo.recentSequence.split('');

    // Game log (cap at 20 for compactness)
    const displayGames = filteredGames.slice(0, 20);

    return (
        <div className="admin-card" style={{ marginBottom: '16px' }}>
            {/* Header */}
            <div className="admin-card-header">
                <div className="admin-card-title">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={team.logo} alt="" width={24} height={24} style={{ borderRadius: '4px' }} />
                    {team.name} — {label}
                </div>
                <span style={{ color: '#6b7280', fontSize: '11px' }}>
                    {streakInfo.totalGamesAvailable} games analyzed
                </span>
            </div>

            {!hasData ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
                    <p style={{ color: '#6b7280', fontSize: '13px' }}>No completed games yet.</p>
                </div>
            ) : (
                <>
                    {/* ── YEAR FILTER TABS ── */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '14px' }}>
                        <button
                            onClick={() => setSelectedYear(null)}
                            style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: `1px solid ${!selectedYear ? 'rgba(0,229,155,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                background: !selectedYear ? 'rgba(0,229,155,0.12)' : 'rgba(255,255,255,0.03)',
                                color: !selectedYear ? '#00e59b' : '#6b7280',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            Recent 13
                        </button>
                        {allSeasons.map(yr => {
                            const isActive = selectedYear === yr;
                            const sb = data.seasonBreakdown?.[yr];
                            return (
                                <button
                                    key={yr}
                                    onClick={() => setSelectedYear(yr)}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        border: `1px solid ${isActive ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                        background: isActive ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.03)',
                                        color: isActive ? '#fbbf24' : '#6b7280',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                    }}
                                    title={sb ? `${sb.games}G ${sb.wins}W-${sb.losses}L` : ''}
                                >
                                    {yr}
                                </button>
                            );
                        })}
                    </div>

                    {/* ── PATTERN VISUALIZATION ── */}
                    <div style={{ marginBottom: '14px' }}>
                        <div className="admin-pattern-row" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            {displaySequence.map((r, i, arr) => {
                                const isAlt = i > 0 && r !== arr[i - 1];
                                return (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                                        {i > 0 && (
                                            <div style={{
                                                width: '8px',
                                                textAlign: 'center',
                                                fontSize: '7px',
                                                color: isAlt ? '#00e59b' : '#ef4444',
                                                fontWeight: 800,
                                            }}>
                                                {isAlt ? '↕' : '='}
                                            </div>
                                        )}
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '10px',
                                            fontWeight: 800,
                                            background: r === 'W' ? 'rgba(0,229,155,0.15)' : 'rgba(239,68,68,0.15)',
                                            color: r === 'W' ? '#00e59b' : '#f87171',
                                            border: `1px solid ${r === 'W' ? 'rgba(0,229,155,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                        }}>
                                            {r}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── COMPACT STATS ROW ── */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                        marginBottom: '14px',
                    }}>
                        {[
                            { label: 'Alt%', value: `${fAltPct}%`, color: fAltPct >= 55 ? '#fbbf24' : fAltPct >= 48 ? '#00e59b' : '#e5e7eb' },
                            { label: 'Best Run', value: `${fLongestAlt}`, color: '#a78bfa' },
                            { label: 'Record', value: `${fWins}W-${fLosses}L`, color: '#e5e7eb' },
                            { label: 'Games', value: `${filteredGames.length}`, color: '#e5e7eb' },
                            ...(selectedYear === null ? [
                                { label: 'Streak', value: `${streakInfo.currentStreak}${streakInfo.currentResult}`, color: streakInfo.currentResult === 'W' ? '#00e59b' : '#f87171' },
                                { label: 'All-Time', value: `${streakInfo.overallAltPct}%`, color: '#6b7280' },
                            ] : []),
                        ].map(stat => (
                            <div key={stat.label} className="admin-stat-card" style={{
                                padding: '8px 12px',
                                textAlign: 'center',
                                flex: '1 1 60px',
                                minWidth: '60px',
                            }}>
                                <div style={{ color: '#4b5563', fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>{stat.label}</div>
                                <div style={{ color: stat.color, fontSize: '18px', fontWeight: 800 }}>{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* ── PREDICTION (only on Recent 13) ── */}
                    {selectedYear === null && streakInfo.isCurrentlyAlternating && (
                        <div style={{
                            background: 'rgba(251,191,36,0.06)',
                            border: '1px solid rgba(251,191,36,0.2)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '12px',
                        }}>
                            <span style={{ fontSize: '20px' }}>🎯</span>
                            <div>
                                <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                                    Alt Active ({streakInfo.currentAltStreak})
                                </span>
                                {' → '}
                                <span style={{
                                    fontWeight: 800,
                                    color: streakInfo.predictedNext === 'W' ? '#00e59b' : '#f87171',
                                }}>
                                    {streakInfo.predictedNext === 'W' ? 'WIN' : 'LOSS'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* ── GAME LOG TABLE ── */}
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Date</th>
                                <th>Opponent</th>
                                <th>H/A</th>
                                <th>Score</th>
                                <th>W/L</th>
                                <th>Alt?</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayGames.map((g, idx) => {
                                const prevGame = idx < filteredGames.length - 1 ? filteredGames[idx + 1] : null;
                                const isAlt = prevGame ? g.result !== prevGame.result : false;
                                return (
                                    <tr key={g.gameId}>
                                        <td style={{ color: '#4b5563', fontSize: '10px' }}>{idx + 1}</td>
                                        <td style={{ fontSize: '11px' }}>{new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                                        <td style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={g.opponentLogo} alt="" width={14} height={14} style={{ borderRadius: '2px' }} />
                                            {g.opponent}
                                        </td>
                                        <td style={{ fontSize: '11px' }}>{g.isHome ? 'H' : 'A'}</td>
                                        <td style={{ fontSize: '11px' }}>{g.teamScore}-{g.oppScore}</td>
                                        <td>
                                            <span className={g.result === 'W' ? 'admin-badge-hit' : 'admin-badge-miss'} style={{ fontSize: '10px' }}>{g.result}</span>
                                        </td>
                                        <td>
                                            {prevGame && (
                                                <span style={{ fontSize: '10px', fontWeight: 700, color: isAlt ? '#00e59b' : '#ef4444' }}>
                                                    {isAlt ? '↕' : '='}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredGames.length > 20 && (
                        <div style={{ textAlign: 'center', color: '#4b5563', fontSize: '10px', marginTop: '6px' }}>
                            Showing 20 of {filteredGames.length} games
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════
// TAB: Pitching
// ═══════════════════════════════════════════

function PitchingTab({ homeP, awayP, game }: { homeP: PitcherData | null; awayP: PitcherData | null; game: Game }) {
    const renderPitcher = (data: PitcherData | null, team: { name: string; logo: string }, label: string) => {
        if (!data || !data.info) {
            return (
                <div className="admin-card" style={{ marginBottom: '16px' }}>
                    <div className="admin-card-title" style={{ marginBottom: '12px' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={team.logo} alt="" width={20} height={20} style={{ borderRadius: '4px' }} />
                        {team.name} — {label} Starter
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '13px' }}>Probable pitcher not announced yet.</p>
                </div>
            );
        }

        const { info, stats, gameLog, restDays, last5Stats } = data;

        return (
            <div className="admin-card" style={{ marginBottom: '16px' }}>
                <div className="admin-card-header">
                    <div className="admin-card-title">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={team.logo} alt="" width={20} height={20} style={{ borderRadius: '4px' }} />
                        {team.name} — {label}
                    </div>
                    {restDays !== null && (
                        <span className={restDays <= 3 ? 'admin-badge-miss' : 'admin-badge-hit'}>
                            {restDays}d rest
                        </span>
                    )}
                </div>

                {/* Pitcher name + hand */}
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ color: 'white', fontSize: '18px', fontWeight: 700 }}>{info.fullName}</div>
                    <div style={{ color: '#6b7280', fontSize: '12px' }}>
                        {info.pitchHand ? `${info.pitchHand.description} (${info.pitchHand.code}HP)` : 'Handedness unknown'}
                    </div>
                </div>

                {/* Season stats */}
                {stats ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
                        {[
                            { label: 'ERA', value: stats.era || '—', color: stats.era && parseFloat(stats.era) < 3.5 ? '#00e59b' : stats.era && parseFloat(stats.era) > 4.5 ? '#f87171' : '#e5e7eb' },
                            { label: 'WHIP', value: stats.whip || '—', color: stats.whip && parseFloat(stats.whip) < 1.2 ? '#00e59b' : stats.whip && parseFloat(stats.whip) > 1.4 ? '#f87171' : '#e5e7eb' },
                            { label: 'W-L', value: `${stats.wins || 0}-${stats.losses || 0}`, color: '#e5e7eb' },
                            { label: 'K', value: String(stats.strikeOuts || 0), color: '#a78bfa' },
                        ].map(s => (
                            <div key={s.label} className="admin-stat-card" style={{ padding: '10px', textAlign: 'center' }}>
                                <div style={{ color: '#6b7280', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                                <div style={{ color: s.color, fontSize: '20px', fontWeight: 800 }}>{s.value}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', textAlign: 'center' }}>
                        <span style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 600 }}>⚠️ No season stats available yet — early Spring Training</span>
                    </div>
                )}

                {/* Last 5 averages */}
                {last5Stats && (
                    <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px' }}>
                        <div style={{ color: '#fbbf24', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>LAST {last5Stats.games} STARTS</div>
                        <div style={{ color: '#e5e7eb', fontSize: '13px' }}>
                            Avg ERA: {last5Stats.avgERA} · K: {last5Stats.totalK} · IP: {last5Stats.totalIP}
                        </div>
                    </div>
                )}

                {/* Game log */}
                {gameLog.length > 0 && (
                    <div>
                        <div style={{ color: '#6b7280', fontSize: '11px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>Recent Starts</div>
                        <table className="admin-table">
                            <thead>
                                <tr><th>Date</th><th>vs</th><th>IP</th><th>ER</th><th>K</th><th>H</th></tr>
                            </thead>
                            <tbody>
                                {gameLog.slice(0, 5).map((g, i) => (
                                    <tr key={i}>
                                        <td>{new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                                        <td>{g.opponent}</td>
                                        <td>{g.inningsPitched}</td>
                                        <td>{g.earnedRuns}</td>
                                        <td style={{ color: '#a78bfa' }}>{g.strikeOuts}</td>
                                        <td>{g.hits}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {renderPitcher(awayP, game.teams.away, 'Away')}
            {renderPitcher(homeP, game.teams.home, 'Home')}
        </div>
    );
}

// ═══════════════════════════════════════════
// TAB: Team Stats
// ═══════════════════════════════════════════

function StatsTab({ homeData, awayData, game }: { homeData: TeamData | null; awayData: TeamData | null; game: Game }) {
    const renderStat = (label: string, awayVal: string, homeVal: string, highlight?: 'higher' | 'lower') => {
        const aN = parseFloat(awayVal);
        const hN = parseFloat(homeVal);
        const awayBetter = highlight === 'higher' ? aN > hN : highlight === 'lower' ? aN < hN : false;
        const homeBetter = highlight === 'higher' ? hN > aN : highlight === 'lower' ? hN < aN : false;

        return (
            <tr>
                <td style={{ color: awayBetter ? '#00e59b' : '#d1d5db', fontWeight: awayBetter ? 700 : 400, textAlign: 'right' }}>{awayVal}</td>
                <td style={{ color: '#6b7280', textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>{label}</td>
                <td style={{ color: homeBetter ? '#00e59b' : '#d1d5db', fontWeight: homeBetter ? 700 : 400 }}>{homeVal}</td>
            </tr>
        );
    };

    const hs = homeData?.stats;
    const as = awayData?.stats;

    if (!hs && !as) {
        return (
            <div className="admin-card" style={{ textAlign: 'center', padding: '32px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
                <p style={{ color: '#d1d5db', fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>No Team Stats Available Yet</p>
                <p style={{ color: '#6b7280', fontSize: '13px' }}>Stats will populate once teams have played enough games this season.</p>
            </div>
        );
    }

    // Check if stats are all zeros (early season placeholder data)
    const isZeroData = hs && as && Number(hs.games.played.all) === 0 && Number(as.games.played.all) === 0;
    const homeFallback = (homeData as TeamData & { fallbackSeason?: number })?.fallbackSeason;
    const awayFallback = (awayData as TeamData & { fallbackSeason?: number })?.fallbackSeason;
    const fallbackSeason = homeFallback || awayFallback;

    return (
        <div className="admin-card">
            {(isZeroData || fallbackSeason) && (
                <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', textAlign: 'center' }}>
                    <span style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 600 }}>
                        {isZeroData ? '⚠️ Early season — no stats accumulated yet' : `📊 Showing ${fallbackSeason} regular season stats`}
                    </span>
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={game.teams.away.logo} alt="" width={24} height={24} style={{ borderRadius: '4px' }} />
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>{game.teams.away.name}</span>
                </div>
                <Users size={16} style={{ color: '#4b5563' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>{game.teams.home.name}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={game.teams.home.logo} alt="" width={24} height={24} style={{ borderRadius: '4px' }} />
                </div>
            </div>

            {hs && as && (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'right', width: '35%' }}>Away</th>
                            <th style={{ textAlign: 'center', width: '30%' }}>Stat</th>
                            <th style={{ width: '35%' }}>Home</th>
                        </tr>
                    </thead>
                    <tbody>
                        {renderStat('Win %', as.games.wins.all.percentage || '—', hs.games.wins.all.percentage || '—', 'higher')}
                        {renderStat('Home Win %', as.games.wins.home.percentage || '—', hs.games.wins.home.percentage || '—', 'higher')}
                        {renderStat('Away Win %', as.games.wins.away.percentage || '—', hs.games.wins.away.percentage || '—', 'higher')}
                        {renderStat('GP', String(as.games.played.all || 0), String(hs.games.played.all || 0))}
                        {renderStat('Runs/G', as.points.for.average.all || '—', hs.points.for.average.all || '—', 'higher')}
                        {renderStat('Runs Allowed/G', as.points.against.average.all || '—', hs.points.against.average.all || '—', 'lower')}
                        {renderStat('Total Runs', String(as.points.for.total.all || 0), String(hs.points.for.total.all || 0), 'higher')}
                        {renderStat('Total Allowed', String(as.points.against.total.all || 0), String(hs.points.against.total.all || 0), 'lower')}
                        {renderStat('Run Diff', String((as.points.for.total.all || 0) - (as.points.against.total.all || 0)), String((hs.points.for.total.all || 0) - (hs.points.against.total.all || 0)), 'higher')}
                    </tbody>
                </table>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════
// TAB: Odds
// ═══════════════════════════════════════════

function OddsTab({ oddsData }: { oddsData: OddsData | null }) {
    if (!oddsData || !oddsData.odds || oddsData.odds.length === 0) {
        return (
            <div className="admin-empty">
                <DollarSign size={24} style={{ marginBottom: '8px', opacity: 0.3 }} />
                <p>No odds available for this game yet.</p>
            </div>
        );
    }

    const bookmakers = oddsData.odds[0]?.bookmakers || [];

    // Group by bet type
    const betTypes = new Map<string, { bookmaker: string; values: { value: string; odd: string }[] }[]>();
    for (const bm of bookmakers) {
        for (const bet of bm.bets) {
            if (!betTypes.has(bet.name)) betTypes.set(bet.name, []);
            betTypes.get(bet.name)!.push({ bookmaker: bm.name, values: bet.values });
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Array.from(betTypes.entries()).map(([betName, entries]) => (
                <div key={betName} className="admin-card">
                    <div className="admin-card-title" style={{ marginBottom: '12px' }}>
                        <DollarSign size={16} style={{ color: '#fbbf24' }} />
                        {betName}
                    </div>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Bookmaker</th>
                                {entries[0]?.values.map((v, i) => <th key={i}>{v.value}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600 }}>{entry.bookmaker}</td>
                                    {entry.values.map((v, j) => (
                                        <td key={j} style={{ color: parseFloat(v.odd) >= 2 ? '#00e59b' : '#d1d5db', fontWeight: 600 }}>
                                            {v.odd}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════
// TAB: AI Analysis (DB Algorithm)
// ═══════════════════════════════════════════

function AITab({ game, homeData, awayData, homeP, awayP, oddsData }: {
    game: Game;
    homeData: TeamData | null;
    awayData: TeamData | null;
    homeP: PitcherData | null;
    awayP: PitcherData | null;
    oddsData: OddsData | null;
}) {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const runAnalysis = async () => {
        setLoading(true);
        setError('');
        try {
            // Build context from all available data
            const body: Record<string, unknown> = {
                awayTeam: game.teams.away.name,
                homeTeam: game.teams.home.name,
                gameDate: game.date?.split('T')[0] || '',
            };

            if (homeData?.streakInfo) {
                body.homeStats = {
                    altPct: homeData.streakInfo.altPercentage,
                    longestAltRun: homeData.streakInfo.longestAltRun,
                    currentAltStreak: homeData.streakInfo.currentAltStreak,
                    isCurrentlyAlternating: homeData.streakInfo.isCurrentlyAlternating,
                    predictedNext: homeData.streakInfo.predictedNext,
                    overallAltPct: homeData.streakInfo.overallAltPct,
                    currentStreak: `${homeData.streakInfo.currentStreak}${homeData.streakInfo.currentResult}`,
                    recentSequence: homeData.streakInfo.recentSequence,
                };
            }

            if (awayData?.streakInfo) {
                body.awayStats = {
                    altPct: awayData.streakInfo.altPercentage,
                    longestAltRun: awayData.streakInfo.longestAltRun,
                    currentAltStreak: awayData.streakInfo.currentAltStreak,
                    isCurrentlyAlternating: awayData.streakInfo.isCurrentlyAlternating,
                    predictedNext: awayData.streakInfo.predictedNext,
                    overallAltPct: awayData.streakInfo.overallAltPct,
                    currentStreak: `${awayData.streakInfo.currentStreak}${awayData.streakInfo.currentResult}`,
                    recentSequence: awayData.streakInfo.recentSequence,
                };
            }

            if (homeP || awayP) {
                body.pitchers = {
                    home: homeP?.info ? { name: homeP.info.fullName || 'TBD' } : undefined,
                    away: awayP?.info ? { name: awayP.info.fullName || 'TBD' } : undefined,
                };
            }

            const res = await fetch('/api/admin/ai/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setAnalysis(data.analysis);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    // Auto-run on mount
    useEffect(() => {
        if (!analysis && !loading) runAnalysis();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="admin-card">
            <div className="admin-card-header">
                <div className="admin-card-title">
                    <Sparkles size={16} style={{ color: '#a78bfa' }} />
                    💎 Diamond Boys Algorithm
                </div>
                <button
                    onClick={runAnalysis}
                    disabled={loading}
                    className="admin-btn admin-btn-secondary"
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                    {loading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={12} />}
                    {loading ? 'Analyzing...' : 'Re-analyze'}
                </button>
            </div>

            {loading && (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'pulse 2s infinite' }}>🤖</div>
                    <div style={{ color: '#a78bfa', fontSize: '14px', fontWeight: 600 }}>Running Diamond Boys Algorithm...</div>
                    <div style={{ color: '#4b5563', fontSize: '11px', marginTop: '4px' }}>
                        Processing odds, alternation patterns, and team stats
                    </div>
                </div>
            )}

            {error && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={14} style={{ color: '#f87171' }} />
                    <span style={{ color: '#fca5a5', fontSize: '13px' }}>{error}</span>
                </div>
            )}

            {analysis && !loading && (
                <div style={{
                    background: 'rgba(167,139,250,0.04)',
                    border: '1px solid rgba(167,139,250,0.12)',
                    borderRadius: '10px',
                    padding: '18px',
                    fontSize: '13px',
                    lineHeight: '1.7',
                    color: '#d1d5db',
                    whiteSpace: 'pre-wrap',
                }}>
                    {analysis.split('\n').map((line, i) => {
                        // Bold headers
                        if (line.startsWith('**') && line.includes('**:')) {
                            const [label, ...rest] = line.split(':');
                            return (
                                <div key={i} style={{ marginBottom: '4px', marginTop: i > 0 ? '12px' : '0' }}>
                                    <span style={{ color: '#a78bfa', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase' }}>
                                        {label.replace(/\*\*/g, '')}
                                    </span>
                                    <span style={{ color: '#e5e7eb' }}>:{rest.join(':')}</span>
                                </div>
                            );
                        }
                        // Numbered items
                        if (/^\d+\./.test(line.trim())) {
                            return (
                                <div key={i} style={{ paddingLeft: '12px', color: '#d1d5db', marginBottom: '2px' }}>
                                    {line}
                                </div>
                            );
                        }
                        // Empty lines
                        if (!line.trim()) return <div key={i} style={{ height: '8px' }} />;
                        return <div key={i}>{line}</div>;
                    })}
                </div>
            )}
        </div>
    );
}

