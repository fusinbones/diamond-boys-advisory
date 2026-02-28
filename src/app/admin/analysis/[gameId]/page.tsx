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
}

interface StreakInfo {
    sequence: string;
    altPercentage: number;
    currentStreak: number;
    currentResult: string;
    gamesAnalyzed: number;
}

interface TeamData {
    stats: TeamStats | null;
    streakData: StreakGame[];
    streakInfo: StreakInfo;
    totalGames: number;
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
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
        </div>
    );
}

// ═══════════════════════════════════════════
// TAB: Streaks & Patterns
// ═══════════════════════════════════════════

function StreaksTab({ homeData, awayData, game }: { homeData: TeamData | null; awayData: TeamData | null; game: Game }) {
    const renderTeamStreak = (data: TeamData | null, team: { name: string; logo: string }, label: string) => {
        if (!data) return <div className="admin-loader"><div className="admin-spinner" /> Loading...</div>;

        const { streakInfo, streakData } = data;
        const hasData = streakData.length > 0;
        const fallbackSeason = (data as TeamData & { fallbackSeason?: number }).fallbackSeason;

        return (
            <div className="admin-card" style={{ marginBottom: '16px' }}>
                <div className="admin-card-header">
                    <div className="admin-card-title">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={team.logo} alt="" width={20} height={20} style={{ borderRadius: '4px' }} />
                        {team.name} — {label}
                    </div>
                    {fallbackSeason && (
                        <span className="admin-league-badge mlb" style={{ fontSize: '9px' }}>
                            {fallbackSeason} Season
                        </span>
                    )}
                </div>

                {!hasData ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
                        <p style={{ color: '#6b7280', fontSize: '13px' }}>No completed games yet this season.</p>
                        <p style={{ color: '#4b5563', fontSize: '11px', marginTop: '4px' }}>Streak data will populate as games finish.</p>
                    </div>
                ) : (
                    <>
                        {/* Streak sequence */}
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ color: '#6b7280', fontSize: '11px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>
                                Last {streakInfo.gamesAnalyzed} Games (L → R = oldest → newest)
                            </div>
                            <div className="admin-streak">
                                {streakInfo.sequence.split('').map((r, i) => (
                                    <div key={i} className={`admin-streak-dot ${r === 'W' ? 'win' : 'loss'}`}>{r}</div>
                                ))}
                            </div>
                        </div>

                        {/* Streak stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                            <div className="admin-stat-card" style={{ padding: '12px' }}>
                                <div style={{ color: '#6b7280', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>Current Streak</div>
                                <div style={{ color: streakInfo.currentResult === 'W' ? '#00e59b' : '#f87171', fontSize: '22px', fontWeight: 800 }}>
                                    {streakInfo.currentStreak}{streakInfo.currentResult}
                                </div>
                            </div>
                            <div className="admin-stat-card" style={{ padding: '12px' }}>
                                <div style={{ color: '#6b7280', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>Alt %</div>
                                <div style={{ color: streakInfo.altPercentage > 60 ? '#fbbf24' : '#e5e7eb', fontSize: '22px', fontWeight: 800 }}>
                                    {streakInfo.altPercentage}%
                                </div>
                            </div>
                            <div className="admin-stat-card" style={{ padding: '12px' }}>
                                <div style={{ color: '#6b7280', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>Games</div>
                                <div style={{ color: '#e5e7eb', fontSize: '22px', fontWeight: 800 }}>
                                    {streakInfo.gamesAnalyzed}
                                </div>
                            </div>
                        </div>

                        {/* Recent games list */}
                        <div style={{ marginTop: '14px' }}>
                            <div style={{ color: '#6b7280', fontSize: '11px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>Recent Games</div>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Opponent</th>
                                        <th>H/A</th>
                                        <th>Score</th>
                                        <th>Result</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {streakData.slice(0, 10).map((g) => (
                                        <tr key={g.gameId}>
                                            <td>{new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                                            <td style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={g.opponentLogo} alt="" width={16} height={16} style={{ borderRadius: '2px' }} />
                                                {g.opponent}
                                            </td>
                                            <td>{g.isHome ? 'H' : 'A'}</td>
                                            <td>{g.teamScore} - {g.oppScore}</td>
                                            <td>
                                                <span className={g.result === 'W' ? 'admin-badge-hit' : 'admin-badge-miss'}>{g.result}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div>
            {renderTeamStreak(awayData, game.teams.away, 'Away')}
            {renderTeamStreak(homeData, game.teams.home, 'Home')}
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
