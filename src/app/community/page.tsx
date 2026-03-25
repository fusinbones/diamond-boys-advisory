'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Send, Menu, Lock, Loader2, ChevronDown, Bold, Italic, Code, X, Trash2, Settings, Plus, Edit3, Zap, Megaphone, Search, ChevronLeft, Crown, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import './community.css';
import './game-panel.css';
import './team-search.css';
import StreakCounter from '@/components/StreakCounter';
import PremiumRevealFeed from '@/components/PremiumRevealFeed';

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

interface Channel {
    id: string;
    name: string;
    category: string;
    min_tier: string;
    description: string;
    sort_order: number;
    is_readonly: boolean;
    icon: string;
    welcome_message?: string;
}

interface Message {
    id: string;
    channel_id: string;
    user_id: string;
    content: string;
    display_name: string;
    avatar_color: string;
    is_bot: boolean;
    created_at: string;
}

interface UserProfile {
    subscription_tier: string | null;
    is_admin: boolean;
    display_name: string;
    avatar_color: string;
}

interface TickerGame {
    id: number;
    status: { long: string; short: string };
    away: { name: string; logo: string; score: number | null };
    home: { name: string; logo: string; score: number | null };
    time: string;
}

/* ═══════════════════════════════════════════════════════
   Tier System
   ═══════════════════════════════════════════════════════ */

const TIER_HIERARCHY: Record<string, number> = {
    free: 0,
    starter: 1,
    pro: 2,
    elite: 3,
};

function canAccessChannel(userTier: string, channelMinTier: string): boolean {
    const userLevel = TIER_HIERARCHY[userTier] ?? 0;
    const requiredLevel = TIER_HIERARCHY[channelMinTier] ?? 0;
    return userLevel >= requiredLevel;
}

const ANALYSIS_LIMIT = 5;
const ANALYSIS_STORAGE_KEY = 'db_analysis_usage';

function getAnalysisUsage(): { count: number; resetDate: string } {
    try {
        const raw = localStorage.getItem(ANALYSIS_STORAGE_KEY);
        if (!raw) return { count: 0, resetDate: getNextMonday() };
        const data = JSON.parse(raw);
        // Check if reset is due
        if (new Date() >= new Date(data.resetDate)) {
            const fresh = { count: 0, resetDate: getNextMonday() };
            localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(fresh));
            return fresh;
        }
        return data;
    } catch {
        return { count: 0, resetDate: getNextMonday() };
    }
}

function incrementAnalysisUsage(): number {
    const usage = getAnalysisUsage();
    usage.count += 1;
    localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(usage));
    return usage.count;
}

function getNextMonday(): string {
    const now = new Date();
    const day = now.getDay();
    const daysUntilMonday = day === 0 ? 1 : 8 - day;
    const next = new Date(now);
    next.setDate(now.getDate() + daysUntilMonday);
    next.setHours(0, 0, 0, 0);
    return next.toISOString();
}

/* ═══════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════ */

function formatTime(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
        ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function renderContent(raw: string): React.ReactNode {
    const text = raw.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'");
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index));
        if (match[2]) parts.push(<strong key={match.index}>{match[2]}</strong>);
        else if (match[3]) parts.push(<em key={match.index}>{match[3]}</em>);
        else if (match[4]) parts.push(<code key={match.index}>{match[4]}</code>);
        lastIdx = match.index + match[0].length;
    }
    if (lastIdx < text.length) parts.push(text.slice(lastIdx));
    return parts.length > 0 ? parts : text;
}

function shortName(name: string): string {
    const map: Record<string, string> = {
        'New York Yankees': 'NYY', 'New York Mets': 'NYM', 'Los Angeles Dodgers': 'LAD',
        'Los Angeles Angels': 'LAA', 'San Francisco Giants': 'SF', 'San Diego Padres': 'SD',
        'Tampa Bay Rays': 'TB', 'St. Louis Cardinals': 'STL', 'Kansas City Royals': 'KC',
        'Chicago White Sox': 'CWS', 'Chicago Cubs': 'CHC', 'Boston Red Sox': 'BOS',
        'Houston Astros': 'HOU', 'Atlanta Braves': 'ATL', 'Philadelphia Phillies': 'PHI',
        'Texas Rangers': 'TEX', 'Minnesota Twins': 'MIN', 'Milwaukee Brewers': 'MIL',
        'Seattle Mariners': 'SEA', 'Detroit Tigers': 'DET', 'Baltimore Orioles': 'BAL',
        'Cleveland Guardians': 'CLE', 'Arizona Diamondbacks': 'ARI', 'Pittsburgh Pirates': 'PIT',
        'Cincinnati Reds': 'CIN', 'Colorado Rockies': 'COL', 'Miami Marlins': 'MIA',
        'Oakland Athletics': 'OAK', 'Washington Nationals': 'WSH', 'Toronto Blue Jays': 'TOR',
    };
    return map[name] || name.split(' ').slice(-1)[0];
}

const TIER_OPTIONS = [
    { value: 'daily', label: 'Daily Pass ($24.99)' },
    { value: 'weekly', label: 'Weekly ($74.99/wk)' },
    { value: 'monthly', label: 'Monthly ($229.99/mo)' },
    { value: 'season', label: 'Season Pass ($699/6mo)' },
];

const CATEGORY_OPTIONS = ['GENERAL', 'PICKS', 'BOT', 'VIP', 'CUSTOM'];

const ICON_OPTIONS = ['💬', '📢', '👋', '⚾', '📊', '🔥', '👑', '🤖', '💎', '🏆', '📌', '🎯', '💰', '⚡', '🔔'];

/* ═══════════════════════════════════════════════════════
   Smart Ticker
   ═══════════════════════════════════════════════════════ */

function SmartTicker({ onGameClick, onSearchClick }: { onGameClick: (g: TickerGame) => void; onSearchClick: () => void }) {
    const [games, setGames] = useState<TickerGame[]>([]);

    useEffect(() => {
        const load = () => fetch('/api/games/public').then(r => r.json()).then(d => setGames(d.games || [])).catch(() => {});
        load();
        const iv = setInterval(load, 60000);
        return () => clearInterval(iv);
    }, []);

    if (games.length === 0) return null;
    const doubled = [...games, ...games];

    return (
        <div className="lounge-ticker">
            <div className="lounge-ticker-inner">
                <div className="lounge-ticker-track">
                    {doubled.map((g, i) => {
                        const isLive = g.status.short.startsWith('IN');
                        const isDone = g.status.short === 'FT';
                        const hasScore = isDone || isLive;
                        return (
                            <div key={`${g.id}-${i}`}
                                className={`lounge-ticker-card ${isLive ? 'live' : ''}`}
                                onClick={() => onGameClick(g)}
                                style={{ cursor: 'pointer' }}
                                title="Click for full analysis"
                            >
                                <div className="lounge-ticker-team">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={g.away.logo} alt={g.away.name} />
                                    <span className="lounge-ticker-name">{shortName(g.away.name)}</span>
                                    {hasScore && <span className="lounge-ticker-score">{g.away.score ?? 0}</span>}
                                </div>
                                <span className="lounge-ticker-vs">@</span>
                                <div className="lounge-ticker-team">
                                    {hasScore && <span className="lounge-ticker-score">{g.home.score ?? 0}</span>}
                                    <span className="lounge-ticker-name">{shortName(g.home.name)}</span>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={g.home.logo} alt={g.home.name} />
                                </div>
                                {isLive ? (
                                    <span className="lounge-ticker-badge live-badge"><span className="live-dot" /> LIVE</span>
                                ) : isDone ? (
                                    <span className="lounge-ticker-badge final-badge">FINAL</span>
                                ) : (
                                    <span className="lounge-ticker-badge time-badge">{g.time}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            <button className="lounge-ticker-search" onClick={onSearchClick} title="Search teams & schedules">
                <Search size={14} />
            </button>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   Game Analysis Panel — Premium Slide-Out
   ═══════════════════════════════════════════════════════ */

interface GameDetail {
    game: { id: number; date: string; time: string; status: { long: string; short: string }; homeTeam: { name: string; logo: string }; awayTeam: { name: string; logo: string }; homeScore: number | null; awayScore: number | null } | null;
    odds: Array<{ book: string; homeML: number | null; awayML: number | null; spread: number | null; spreadOdds: number | null; total: number | null; overOdds: number | null; underOdds: number | null }>;
    consensus: { home: number; away: number };
    homePitcher: { name: string; hand: string; era: string; whip: string; record: string; strikeouts: number; inningsPitched: string; gamesStarted: number; last3: Array<{ date: string; opponent: string; ip: string; k: number; er: number; hits: number }> } | null;
    awayPitcher: { name: string; hand: string; era: string; whip: string; record: string; strikeouts: number; inningsPitched: string; gamesStarted: number; last3: Array<{ date: string; opponent: string; ip: string; k: number; er: number; hits: number }> } | null;
    homeStats: { record: string; homeRecord: string; awayRecord: string; runsPerGame: string; runsAgainstPerGame: string } | null;
    awayStats: { record: string; homeRecord: string; awayRecord: string; runsPerGame: string; runsAgainstPerGame: string } | null;
    h2h: Array<{ date: string; homeScore: number; awayScore: number; winner: string }>;
    edge: { team: string; confidence: number; factors: string[]; bestHomeML: number | null; bestAwayML: number | null };
}

function GameAnalysisPanel({ game, onClose }: { game: TickerGame; onClose: () => void }) {
    const [detail, setDetail] = useState<GameDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const homeName = game.home.name.split(' ').slice(-1)[0];
        const awayName = game.away.name.split(' ').slice(-1)[0];
        fetch(`/api/community/game-detail?gameId=${game.id}&home=${encodeURIComponent(homeName)}&away=${encodeURIComponent(awayName)}`)
            .then(r => r.json())
            .then(d => { setDetail(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [game]);

    const fmtOdds = (v: number | null) => v === null ? '—' : (v > 0 ? `+${v}` : String(v));

    return (
        <>
            <div className="game-panel-overlay" onClick={onClose} />
            <div className="game-panel">
                <div className="game-panel-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: 'white' }}>📊 Game Analysis</span>
                        <span style={{ fontSize: '10px', color: '#00e59b', background: 'rgba(0,229,155,0.1)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>PREMIUM</span>
                    </div>
                    <button className="game-panel-close" onClick={onClose}><X size={16} /></button>
                </div>

                {loading ? (
                    <div className="gp-loading">
                        <div className="gp-spinner" />
                        <span style={{ fontSize: '13px' }}>Loading analysis...</span>
                    </div>
                ) : !detail ? (
                    <div className="gp-loading"><span>Failed to load data</span></div>
                ) : (
                    <>
                        {/* ── Matchup Header ── */}
                        <div className="gp-matchup">
                            <div className="gp-team">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img className="gp-team-logo" src={game.away.logo} alt={game.away.name} />
                                <span className="gp-team-name">{game.away.name}</span>
                                {detail.awayStats && <span className="gp-team-record">{detail.awayStats.record}</span>}
                            </div>
                            <div className="gp-vs">
                                <span className="gp-vs-badge">VS</span>
                                <span className="gp-vs-time">{game.time}</span>
                            </div>
                            <div className="gp-team">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img className="gp-team-logo" src={game.home.logo} alt={game.home.name} />
                                <span className="gp-team-name">{game.home.name}</span>
                                {detail.homeStats && <span className="gp-team-record">{detail.homeStats.record}</span>}
                            </div>
                        </div>

                        {/* ── TriplePlayz Edge ── */}
                        {detail.edge.team && (
                            <div className="gp-edge">
                                <div className="gp-edge-title">💎 TriplePlayz Edge</div>
                                <div className="gp-edge-team">{detail.edge.team}</div>
                                <div className="gp-edge-confidence">
                                    <div className="gp-edge-bar-bg">
                                        <div className="gp-edge-bar-fill" style={{ width: `${detail.edge.confidence}%` }} />
                                    </div>
                                    <span className="gp-edge-pct">{detail.edge.confidence}%</span>
                                </div>
                                <ul className="gp-edge-factors">
                                    {detail.edge.factors.map((f, i) => <li key={i}>{f}</li>)}
                                </ul>
                            </div>
                        )}

                        {/* ── Odds from ALL Books ── */}
                        {detail.odds.length > 0 && (
                            <div className="gp-section">
                                <div className="gp-section-title">📊 Odds — All Sportsbooks</div>
                                <table className="gp-odds-table">
                                    <thead>
                                        <tr>
                                            <th>Book</th>
                                            <th>Away ML</th>
                                            <th>Home ML</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detail.odds.map((o, i) => {
                                            const bestAway = Math.max(...detail.odds.filter(x => x.awayML !== null).map(x => x.awayML!));
                                            const bestHome = Math.max(...detail.odds.filter(x => x.homeML !== null).map(x => x.homeML!));
                                            return (
                                                <tr key={i}>
                                                    <td>{o.book}</td>
                                                    <td className={o.awayML === bestAway ? 'gp-odds-best' : ''}>{fmtOdds(o.awayML)}</td>
                                                    <td className={o.homeML === bestHome ? 'gp-odds-best' : ''}>{fmtOdds(o.homeML)}</td>
                                                    <td>{o.total !== null ? `${o.total} (${fmtOdds(o.overOdds)}/${fmtOdds(o.underOdds)})` : '—'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ── Betting Consensus ── */}
                        {(detail.consensus.home > 0 || detail.consensus.away > 0) && (
                            <div className="gp-section">
                                <div className="gp-section-title">📈 Betting Consensus</div>
                                <div className="gp-consensus">
                                    <div className="gp-consensus-labels">
                                        <span style={{ color: '#818cf8' }}>{game.away.name.split(' ').pop()} {detail.consensus.away}%</span>
                                        <span style={{ color: '#00e59b' }}>{game.home.name.split(' ').pop()} {detail.consensus.home}%</span>
                                    </div>
                                    <div className="gp-consensus-bar-bg">
                                        <div className="gp-consensus-bar-fill" style={{ width: `${detail.consensus.away}%`, background: '#818cf8' }} />
                                        <div className="gp-consensus-bar-fill" style={{ width: `${detail.consensus.home}%`, background: '#00e59b' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Probable Pitchers ── */}
                        {(detail.homePitcher || detail.awayPitcher) && (
                            <div className="gp-section">
                                <div className="gp-section-title">⚾ Probable Pitchers</div>
                                {[detail.awayPitcher, detail.homePitcher].filter(Boolean).map((p, i) => p && (
                                    <div key={i} className="gp-pitcher">
                                        <div className="gp-pitcher-header">
                                            <span className="gp-pitcher-name">{p.name}</span>
                                            <span className="gp-pitcher-hand">{p.hand}</span>
                                        </div>
                                        <div className="gp-pitcher-stats">
                                            <div className="gp-stat-box"><div className="gp-stat-value">{p.era}</div><div className="gp-stat-label">ERA</div></div>
                                            <div className="gp-stat-box"><div className="gp-stat-value">{p.whip}</div><div className="gp-stat-label">WHIP</div></div>
                                            <div className="gp-stat-box"><div className="gp-stat-value">{p.record}</div><div className="gp-stat-label">W-L</div></div>
                                            <div className="gp-stat-box"><div className="gp-stat-value">{p.strikeouts}</div><div className="gp-stat-label">K</div></div>
                                        </div>
                                        {p.last3.length > 0 && (
                                            <table className="gp-pitcher-log">
                                                <thead><tr><th>Last 3</th><th>IP</th><th>K</th><th>ER</th><th>H</th></tr></thead>
                                                <tbody>
                                                    {p.last3.map((g, j) => (
                                                        <tr key={j}><td>{g.opponent}</td><td>{g.ip}</td><td>{g.k}</td><td>{g.er}</td><td>{g.hits}</td></tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Team Stats ── */}
                        {(detail.homeStats || detail.awayStats) && (
                            <div className="gp-section">
                                <div className="gp-section-title">📋 Team Stats</div>
                                <div className="gp-team-stats">
                                    {[{ label: game.away.name.split(' ').pop() || 'Away', stats: detail.awayStats }, { label: game.home.name.split(' ').pop() || 'Home', stats: detail.homeStats }].map((t, i) => t.stats && (
                                        <div key={i} className="gp-team-stat-card">
                                            <div className="gp-team-stat-name">{t.label}</div>
                                            <div className="gp-team-stat-row"><span>Record</span><span>{t.stats.record}</span></div>
                                            <div className="gp-team-stat-row"><span>Home</span><span>{t.stats.homeRecord}</span></div>
                                            <div className="gp-team-stat-row"><span>Away</span><span>{t.stats.awayRecord}</span></div>
                                            <div className="gp-team-stat-row"><span>Runs/G</span><span>{t.stats.runsPerGame}</span></div>
                                            <div className="gp-team-stat-row"><span>RA/G</span><span>{t.stats.runsAgainstPerGame}</span></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── H2H History ── */}
                        {detail.h2h.length > 0 && (
                            <div className="gp-section">
                                <div className="gp-section-title">🤝 Head-to-Head (Last {detail.h2h.length})</div>
                                <div className="gp-h2h">
                                    {detail.h2h.map((h, i) => (
                                        <div key={i} className="gp-h2h-row">
                                            <span className="gp-h2h-date">{h.date}</span>
                                            <span className="gp-h2h-score">{h.awayScore} — {h.homeScore}</span>
                                            <span className="gp-h2h-winner">W: {h.winner.split(' ').pop()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ padding: '12px 16px 24px', textAlign: 'center' }}>
                            <p style={{ fontSize: '10px', color: '#374151' }}>Data from MLB Stats API & The Odds API • For entertainment only</p>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

/* ═══════════════════════════════════════════════════════
   Team Search Panel
   ═══════════════════════════════════════════════════════ */

interface TeamResult {
    id: number;
    name: string;
    abbr: string;
    city: string;
}

interface ScheduleGame {
    id: number;
    date: string;
    time: string;
    status: { long: string; short: string };
    home: { name: string; logo: string; score: number | null };
    away: { name: string; logo: string; score: number | null };
    isHome: boolean;
}

const MLB_LOGO_URL = (id: number) => `https://www.mlbstatic.com/team-logos/${id}.svg`;

function TeamSearchPanel({
    onClose,
    onSelectGame,
}: {
    onClose: () => void;
    onSelectGame: (g: TickerGame) => void;
}) {
    const [query, setQuery] = useState('');
    const [teams, setTeams] = useState<TeamResult[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<TeamResult | null>(null);
    const [recentResults, setRecentResults] = useState<ScheduleGame[]>([]);
    const [upcoming, setUpcoming] = useState<ScheduleGame[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingSchedule, setLoadingSchedule] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input on mount
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    // Fetch teams on search
    useEffect(() => {
        if (selectedTeam) return;
        const timer = setTimeout(() => {
            setLoading(true);
            const url = query.length >= 2 ? `/api/community/team-schedule?q=${encodeURIComponent(query)}` : '/api/community/team-schedule';
            fetch(url)
                .then(r => r.json())
                .then(d => { setTeams(d.teams || []); setLoading(false); })
                .catch(() => setLoading(false));
        }, query.length >= 2 ? 200 : 0);
        return () => clearTimeout(timer);
    }, [query, selectedTeam]);

    // Fetch schedule when team selected
    const selectTeam = (team: TeamResult) => {
        setSelectedTeam(team);
        setLoadingSchedule(true);
        fetch(`/api/community/team-schedule?teamId=${team.id}`)
            .then(r => r.json())
            .then(d => {
                setRecentResults(d.recentResults || []);
                setUpcoming(d.upcoming || []);
                setLoadingSchedule(false);
            })
            .catch(() => setLoadingSchedule(false));
    };

    const goBack = () => {
        setSelectedTeam(null);
        setRecentResults([]);
        setUpcoming([]);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleGameClick = (g: ScheduleGame) => {
        // Convert to TickerGame format for the analysis panel
        onSelectGame({
            id: g.id,
            status: g.status,
            away: g.away,
            home: g.home,
            time: g.time,
        });
        onClose();
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T12:00:00');
        return {
            day: d.getDate().toString(),
            month: d.toLocaleDateString('en-US', { month: 'short' }),
            weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
        };
    };

    return (
        <>
            <div className="team-search-overlay" onClick={onClose} />
            <div className="team-search-panel">
                <div className="ts-header">
                    <div className="ts-search-row">
                        <div className="ts-input-wrap">
                            <Search size={14} className="ts-input-icon" />
                            <input
                                ref={inputRef}
                                className="ts-input"
                                placeholder={selectedTeam ? selectedTeam.name : 'Search teams... (e.g. Yankees, LAD, Houston)'}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                disabled={!!selectedTeam}
                            />
                        </div>
                        <button className="ts-close" onClick={onClose}><X size={14} /></button>
                    </div>
                </div>

                {selectedTeam ? (
                    /* ── Schedule View ── */
                    <>
                        <button className="ts-back" onClick={goBack}>
                            <ChevronLeft size={14} /> All Teams
                        </button>

                        {loadingSchedule ? (
                            <div className="ts-loading">
                                <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                                Loading schedule...
                            </div>
                        ) : (
                            <div className="ts-schedule">
                                {upcoming.length > 0 && (
                                    <>
                                        <div className="ts-section-label upcoming">⚾ Upcoming Games</div>
                                        {upcoming.map(g => {
                                            const { day, month, weekday } = formatDate(g.date);
                                            const opp = g.isHome ? g.away : g.home;
                                            return (
                                                <div key={g.id} className="ts-game-card" onClick={() => handleGameClick(g)}>
                                                    <div className="ts-game-date">
                                                        <div className="ts-game-date-day">{day}</div>
                                                        <div className="ts-game-date-month">{month} {weekday}</div>
                                                    </div>
                                                    <div className="ts-game-matchup">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={opp.logo} alt={opp.name} />
                                                        <span className="ts-game-vs">{g.isHome ? 'vs' : '@'}</span>
                                                        <span className="ts-game-opp">{opp.name}</span>
                                                    </div>
                                                    <div className="ts-game-meta">
                                                        <div className="ts-game-time">{g.time}</div>
                                                        <span className="ts-game-analyze">📊 Analyze</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
                                )}

                                {recentResults.length > 0 && (
                                    <>
                                        <div className="ts-section-label">Recent Results</div>
                                        {recentResults.map(g => {
                                            const { day, month, weekday } = formatDate(g.date);
                                            const opp = g.isHome ? g.away : g.home;
                                            const myScore = g.isHome ? g.home.score : g.away.score;
                                            const oppScore = g.isHome ? g.away.score : g.home.score;
                                            const won = (myScore ?? 0) > (oppScore ?? 0);
                                            return (
                                                <div key={g.id} className="ts-game-card result" onClick={() => handleGameClick(g)}>
                                                    <div className="ts-game-date">
                                                        <div className="ts-game-date-day">{day}</div>
                                                        <div className="ts-game-date-month">{month} {weekday}</div>
                                                    </div>
                                                    <div className="ts-game-matchup">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={opp.logo} alt={opp.name} />
                                                        <span className="ts-game-vs">{g.isHome ? 'vs' : '@'}</span>
                                                        <span className="ts-game-opp">{opp.name}</span>
                                                    </div>
                                                    <div className="ts-game-meta">
                                                        <div className="ts-game-score">{myScore}-{oppScore}</div>
                                                        <div className={`ts-game-result ${won ? 'win' : 'loss'}`}>{won ? 'W' : 'L'}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
                                )}

                                {upcoming.length === 0 && recentResults.length === 0 && (
                                    <div className="ts-empty">No games found for this team yet.</div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    /* ── Team List ── */
                    <div className="ts-team-list">
                        {loading ? (
                            <div className="ts-loading">
                                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                Searching...
                            </div>
                        ) : teams.length === 0 ? (
                            <div className="ts-empty">
                                {query.length >= 2 ? `No teams match "${query}"` : 'Type to search for a team'}
                            </div>
                        ) : (
                            teams.map(t => (
                                <div key={t.id} className="ts-team-item" onClick={() => selectTeam(t)}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img className="ts-team-logo" src={MLB_LOGO_URL(t.id)} alt={t.name} />
                                    <div className="ts-team-info">
                                        <div className="ts-team-name">{t.name}</div>
                                        <div className="ts-team-abbr">{t.abbr} · {t.city}</div>
                                    </div>
                                    <ChevronDown size={14} className="ts-team-arrow" style={{ transform: 'rotate(-90deg)' }} />
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

/* ═══════════════════════════════════════════════════════
   Format Toolbar
   ═══════════════════════════════════════════════════════ */

function FormatToolbar({ onFormat }: { onFormat: (t: 'bold' | 'italic' | 'code') => void }) {
    return (
        <div className="lounge-compose-toolbar">
            <button className="lounge-fmt-btn" onClick={() => onFormat('bold')} title="Bold"><Bold size={14} /></button>
            <button className="lounge-fmt-btn" onClick={() => onFormat('italic')} title="Italic"><Italic size={14} /></button>
            <button className="lounge-fmt-btn" onClick={() => onFormat('code')} title="Code"><Code size={14} /></button>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   Admin Panel Modal
   ═══════════════════════════════════════════════════════ */

function AdminPanel({
    channels,
    onClose,
    onRefresh,
}: {
    channels: Channel[];
    onClose: () => void;
    onRefresh: () => void;
}) {
    const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
    const [editChannel, setEditChannel] = useState<Channel | null>(null);
    const [saving, setSaving] = useState(false);

    // ── Form state ──
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('💬');
    const [category, setCategory] = useState('GENERAL');
    const [minTier, setMinTier] = useState('daily');
    const [description, setDescription] = useState('');
    const [welcomeMessage, setWelcomeMessage] = useState('');
    const [isReadonly, setIsReadonly] = useState(false);
    const [sortOrder, setSortOrder] = useState(0);

    const resetForm = () => {
        setName(''); setIcon('💬'); setCategory('GENERAL'); setMinTier('daily');
        setDescription(''); setWelcomeMessage(''); setIsReadonly(false); setSortOrder(0);
    };

    const startEdit = (ch: Channel) => {
        setEditChannel(ch);
        setName(ch.name);
        setIcon(ch.icon);
        setCategory(ch.category);
        setMinTier(ch.min_tier);
        setDescription(ch.description || '');
        setWelcomeMessage(ch.welcome_message || '');
        setIsReadonly(ch.is_readonly);
        setSortOrder(ch.sort_order);
        setView('edit');
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        setSaving(true);

        try {
            if (view === 'add') {
                const { error } = await supabase.from('community_channels').insert({
                    name: name.trim().toLowerCase().replace(/\s+/g, '-'),
                    icon, category, min_tier: minTier,
                    description: description.trim(),
                    welcome_message: welcomeMessage.trim() || null,
                    is_readonly: isReadonly,
                    sort_order: sortOrder,
                });
                if (error) { alert(`Error: ${error.message}`); return; }
            } else if (view === 'edit' && editChannel) {
                const { error } = await supabase.from('community_channels')
                    .update({
                        name: name.trim().toLowerCase().replace(/\s+/g, '-'),
                        icon, category, min_tier: minTier,
                        description: description.trim(),
                        welcome_message: welcomeMessage.trim() || null,
                        is_readonly: isReadonly,
                        sort_order: sortOrder,
                    })
                    .eq('id', editChannel.id);
                if (error) { alert(`Error: ${error.message}`); return; }
            }

            resetForm();
            setView('list');
            onRefresh();
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (ch: Channel) => {
        if (!confirm(`Delete #${ch.name}? This will also delete all messages in this channel.`)) return;

        // Delete messages first, then channel
        await supabase.from('community_messages').delete().eq('channel_id', ch.id);
        const { error } = await supabase.from('community_channels').delete().eq('id', ch.id);
        if (error) { alert(`Error: ${error.message}`); return; }
        onRefresh();
    };

    return (
        <div className="lounge-modal-overlay" onClick={onClose}>
            <div className="lounge-modal" onClick={e => e.stopPropagation()}>
                <div className="lounge-modal-header">
                    <h3>
                        {view === 'list' ? '⚙️ Server Settings' : view === 'add' ? '➕ New Channel' : `✏️ Edit #${editChannel?.name}`}
                    </h3>
                    <button className="lounge-modal-close" onClick={view === 'list' ? onClose : () => { setView('list'); resetForm(); }}>
                        <X size={14} />
                    </button>
                </div>

                <div className="lounge-modal-body">
                    {view === 'list' ? (
                        <>
                            {/* Add channel button */}
                            <button
                                className="lounge-form-btn primary"
                                style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                onClick={() => { resetForm(); setSortOrder(channels.length); setView('add'); }}
                            >
                                <Plus size={14} /> Create Channel
                            </button>

                            {/* Channel list */}
                            {channels.map(ch => (
                                <div key={ch.id} className="lounge-admin-channel-row">
                                    <span style={{ fontSize: '16px', width: '22px', textAlign: 'center' }}>{ch.icon}</span>
                                    <div className="lounge-admin-channel-info">
                                        <div className="lounge-admin-channel-name">#{ch.name}</div>
                                        <div className="lounge-admin-channel-meta">
                                            {ch.category} · {ch.min_tier} tier{ch.is_readonly ? ' · 📌 read-only' : ''}
                                        </div>
                                    </div>
                                    <div className="lounge-admin-row-actions">
                                        <button className="lounge-admin-row-btn" onClick={() => startEdit(ch)} title="Edit">
                                            <Edit3 size={12} />
                                        </button>
                                        <button className="lounge-admin-row-btn delete" onClick={() => handleDelete(ch)} title="Delete">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        /* ── Add / Edit Form ── */
                        <>
                            <div className="lounge-form-group">
                                <label className="lounge-form-label">Channel Name</label>
                                <input className="lounge-form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. strategy-talk" />
                            </div>

                            <div className="lounge-form-row">
                                <div className="lounge-form-group">
                                    <label className="lounge-form-label">Icon</label>
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                        {ICON_OPTIONS.map(ic => (
                                            <button
                                                key={ic}
                                                onClick={() => setIcon(ic)}
                                                style={{
                                                    width: '32px', height: '32px', borderRadius: '6px',
                                                    border: ic === icon ? '2px solid #00e59b' : '1px solid rgba(255,255,255,0.06)',
                                                    background: ic === icon ? 'rgba(0,229,155,0.08)' : 'none',
                                                    fontSize: '16px', cursor: 'pointer', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center',
                                                }}
                                            >
                                                {ic}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="lounge-form-row">
                                <div className="lounge-form-group">
                                    <label className="lounge-form-label">Category</label>
                                    <select className="lounge-form-select" value={category} onChange={e => setCategory(e.target.value)}>
                                        {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="lounge-form-group">
                                    <label className="lounge-form-label">Min Tier</label>
                                    <select className="lounge-form-select" value={minTier} onChange={e => setMinTier(e.target.value)}>
                                        {TIER_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="lounge-form-group">
                                <label className="lounge-form-label">Description</label>
                                <input className="lounge-form-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Short channel description" />
                            </div>

                            <div className="lounge-form-group">
                                <label className="lounge-form-label">Welcome Message</label>
                                <input className="lounge-form-input" value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} placeholder="Shown at the top of the channel when users enter" />
                            </div>

                            <div className="lounge-form-row">
                                <div className="lounge-form-group">
                                    <label className="lounge-form-label">Sort Order</label>
                                    <input className="lounge-form-input" type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} />
                                </div>
                                <div className="lounge-form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
                                    <label className="lounge-form-check">
                                        <input type="checkbox" checked={isReadonly} onChange={e => setIsReadonly(e.target.checked)} />
                                        Read-only (admin/bot only)
                                    </label>
                                </div>
                            </div>

                            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                                <button className="lounge-form-btn primary" onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving...' : view === 'add' ? 'Create Channel' : 'Save Changes'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   Pick Composer Modal
   ═══════════════════════════════════════════════════════ */

const SPORTS: Record<string, { icon: string; teams: string[] }> = {
    MLB: {
        icon: '⚾',
        teams: [
            'Arizona Diamondbacks', 'Atlanta Braves', 'Baltimore Orioles', 'Boston Red Sox',
            'Chicago Cubs', 'Chicago White Sox', 'Cincinnati Reds', 'Cleveland Guardians',
            'Colorado Rockies', 'Detroit Tigers', 'Houston Astros', 'Kansas City Royals',
            'Los Angeles Angels', 'Los Angeles Dodgers', 'Miami Marlins', 'Milwaukee Brewers',
            'Minnesota Twins', 'New York Mets', 'New York Yankees', 'Oakland Athletics',
            'Philadelphia Phillies', 'Pittsburgh Pirates', 'San Diego Padres', 'San Francisco Giants',
            'Seattle Mariners', 'St. Louis Cardinals', 'Tampa Bay Rays', 'Texas Rangers',
            'Toronto Blue Jays', 'Washington Nationals',
        ],
    },
    NBA: {
        icon: '🏀',
        teams: ['Lakers', 'Celtics', 'Warriors', 'Bucks', 'Nuggets', 'Heat', 'Suns', '76ers', 'Nets', 'Knicks',
            'Mavericks', 'Clippers', 'Grizzlies', 'Cavaliers', 'Kings', 'Hawks', 'Bulls', 'Raptors', 'Pacers', 'Timberwolves'],
    },
    NFL: {
        icon: '🏈',
        teams: ['Chiefs', 'Eagles', '49ers', 'Cowboys', 'Bills', 'Ravens', 'Bengals', 'Lions', 'Dolphins', 'Jets',
            'Jaguars', 'Texans', 'Seahawks', 'Commanders', 'Steelers', 'Packers', 'Bears', 'Broncos', 'Raiders', 'Chargers'],
    },
    NHL: {
        icon: '🏒',
        teams: ['Oilers', 'Panthers', 'Rangers', 'Stars', 'Bruins', 'Avalanche', 'Hurricanes', 'Golden Knights',
            'Maple Leafs', 'Lightning', 'Devils', 'Islanders', 'Penguins', 'Jets', 'Wild', 'Kraken'],
    },
    Soccer: { icon: '⚽', teams: [] },
    MMA: { icon: '🥊', teams: [] },
};

const PICK_TYPES = ['Moneyline', 'Spread', 'Over', 'Under', 'Parlay', 'First 5', 'Prop', 'Live Bet'];
const CONFIDENCE_LEVELS = [
    { value: 'low', label: 'Low', emoji: '🔵', dots: 1 },
    { value: 'medium', label: 'Medium', emoji: '🟡', dots: 2 },
    { value: 'high', label: 'High', emoji: '🟠', dots: 3 },
    { value: 'lock', label: '🔒 LOCK', emoji: '🔴', dots: 4 },
];

function PickComposer({
    channels,
    onClose,
    onPost,
}: {
    channels: Channel[];
    onClose: () => void;
    onPost: (channelId: string, content: string) => Promise<void>;
}) {
    const [sport, setSport] = useState('MLB');
    const [awayTeam, setAwayTeam] = useState('');
    const [homeTeam, setHomeTeam] = useState('');
    const [pickType, setPickType] = useState('Moneyline');
    const [pickDetail, setPickDetail] = useState('');
    const [odds, setOdds] = useState('');
    const [units, setUnits] = useState(2);
    const [confidence, setConfidence] = useState('medium');
    const [analysis, setAnalysis] = useState('');
    const [targetChannelId, setTargetChannelId] = useState('');
    const [posting, setPosting] = useState(false);
    const [customTeam, setCustomTeam] = useState('');
    const [scheduleEnabled, setScheduleEnabled] = useState(false);
    const [scheduleTime, setScheduleTime] = useState('');
    const [hypeLevel, setHypeLevel] = useState<'normal' | 'hot' | 'nuclear'>('normal');
    const [notifySubscribers, setNotifySubscribers] = useState(false);

    const sportData = SPORTS[sport];
    const picksChannels = channels.filter(c => c.category === 'PICKS' || c.name.includes('pick'));
    const confLevel = CONFIDENCE_LEVELS.find(c => c.value === confidence) || CONFIDENCE_LEVELS[1];

    // Auto-select first picks channel
    useEffect(() => {
        if (picksChannels.length > 0 && !targetChannelId) {
            setTargetChannelId(picksChannels[0].id);
        }
    }, [picksChannels, targetChannelId]);

    const buildFormattedPick = (): string => {
        const divider = '━━━━━━━━━━━━━━━━━━━━━━━';
        const unitDots = '⬢'.repeat(units) + '⬡'.repeat(5 - units);
        const confEmoji = confidence === 'lock' ? '🔒 LOCK' : confidence === 'high' ? '🔥 HIGH' : confidence === 'medium' ? '⭐ MEDIUM' : '📘 LOW';
        const gameStr = awayTeam && homeTeam ? `${awayTeam} vs ${homeTeam}` : customTeam || 'TBD';
        const pickStr = pickDetail || `${awayTeam || 'TBD'} ${pickType}`;

        const hypePrefix = hypeLevel === 'nuclear' ? '🚨🚨🚨 **NUCLEAR PICK** 🚨🚨🚨' : hypeLevel === 'hot' ? '🔥🔥 **HOT PICK** 🔥🔥' : '🔥 **TRIPLEPLAYZ PICK** 🔥';

        return [
            hypePrefix,
            divider,
            `${sportData.icon} **${sport}** | ${gameStr}`,
            ``,
            `📍 **Pick:** ${pickStr}`,
            `💰 **Odds:** ${odds || 'TBD'}`,
            `⭐ **Units:** ${unitDots} (${units}/5)`,
            `🎯 **Confidence:** ${confEmoji}`,
            ``,
            analysis ? `📊 *${analysis}*` : '',
            divider,
            `💎 TriplePlayz - Sports Advisory`,
        ].filter(Boolean).join('\n');
    };

    const handlePost = async () => {
        if (!targetChannelId) return;
        setPosting(true);
        try {
            await onPost(targetChannelId, buildFormattedPick());
            onClose();
        } catch {
            alert('Failed to post pick');
        } finally {
            setPosting(false);
        }
    };

    return (
        <div className="lounge-modal-overlay" onClick={onClose}>
            <div className="lounge-modal" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
                <div className="lounge-modal-header">
                    <h3>📋 Post Pick</h3>
                    <button className="lounge-modal-close" onClick={onClose}><X size={14} /></button>
                </div>

                <div className="lounge-modal-body">
                    {/* Sport */}
                    <div className="lounge-form-group">
                        <label className="lounge-form-label">Sport</label>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {Object.entries(SPORTS).map(([key, s]) => (
                                <button key={key} className={`lounge-target-chip ${sport === key ? 'active' : ''}`}
                                    onClick={() => { setSport(key); setAwayTeam(''); setHomeTeam(''); }}>
                                    {s.icon} {key}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Teams */}
                    {sportData.teams.length > 0 ? (
                        <div className="lounge-form-row">
                            <div className="lounge-form-group">
                                <label className="lounge-form-label">Away Team</label>
                                <select className="lounge-form-select" value={awayTeam} onChange={e => setAwayTeam(e.target.value)}>
                                    <option value="">Select...</option>
                                    {sportData.teams.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="lounge-form-group">
                                <label className="lounge-form-label">Home Team</label>
                                <select className="lounge-form-select" value={homeTeam} onChange={e => setHomeTeam(e.target.value)}>
                                    <option value="">Select...</option>
                                    {sportData.teams.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="lounge-form-group">
                            <label className="lounge-form-label">Matchup / Event</label>
                            <input className="lounge-form-input" value={customTeam} onChange={e => setCustomTeam(e.target.value)} placeholder="e.g. Fighter A vs Fighter B" />
                        </div>
                    )}

                    {/* Pick Type + Detail */}
                    <div className="lounge-form-row">
                        <div className="lounge-form-group">
                            <label className="lounge-form-label">Pick Type</label>
                            <select className="lounge-form-select" value={pickType} onChange={e => setPickType(e.target.value)}>
                                {PICK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="lounge-form-group">
                            <label className="lounge-form-label">Odds</label>
                            <input className="lounge-form-input" value={odds} onChange={e => setOdds(e.target.value)} placeholder="-130, +150, etc." />
                        </div>
                    </div>

                    <div className="lounge-form-group">
                        <label className="lounge-form-label">Pick Detail (optional override)</label>
                        <input className="lounge-form-input" value={pickDetail} onChange={e => setPickDetail(e.target.value)}
                            placeholder={`e.g. "${awayTeam || 'Team'} ${pickType}", "Over 8.5", "Parlay: A + B"`} />
                    </div>

                    {/* Units */}
                    <div className="lounge-form-group">
                        <label className="lounge-form-label">Units ({units}/5)</label>
                        <div className="lounge-unit-bar">
                            {[1,2,3,4,5].map(u => (
                                <button key={u} className={`lounge-unit-pip ${u <= units ? 'filled' : ''}`}
                                    onClick={() => setUnits(u)}
                                    style={{ width: '100%', maxWidth: '60px', height: '12px', border: 'none', cursor: 'pointer', borderRadius: '3px' }} />
                            ))}
                        </div>
                    </div>

                    {/* Confidence */}
                    <div className="lounge-form-group">
                        <label className="lounge-form-label">Confidence</label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {CONFIDENCE_LEVELS.map(c => (
                                <button key={c.value} className={`lounge-target-chip ${confidence === c.value ? 'active' : ''}`}
                                    onClick={() => setConfidence(c.value)}
                                    style={confidence === c.value && c.value === 'lock' ? { borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444' } : {}}>
                                    {c.emoji} {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Analysis */}
                    <div className="lounge-form-group">
                        <label className="lounge-form-label">Analysis / Reasoning</label>
                        <textarea className="lounge-form-input" value={analysis} onChange={e => setAnalysis(e.target.value)}
                            placeholder="Quick breakdown of why this play..." rows={2} style={{ resize: 'vertical' }} />
                    </div>

                    {/* Target Channel */}
                    <div className="lounge-form-group">
                        <label className="lounge-form-label">Post To</label>
                        <div className="lounge-target-channel">
                            {picksChannels.length > 0 ? picksChannels.map(ch => (
                                <button key={ch.id} className={`lounge-target-chip ${targetChannelId === ch.id ? 'active' : ''}`}
                                    onClick={() => setTargetChannelId(ch.id)}>
                                    {ch.icon} #{ch.name}
                                </button>
                            )) : channels.map(ch => (
                                <button key={ch.id} className={`lounge-target-chip ${targetChannelId === ch.id ? 'active' : ''}`}
                                    onClick={() => setTargetChannelId(ch.id)}>
                                    {ch.icon} #{ch.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Schedule & Hype */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: scheduleEnabled ? '10px' : '0' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9ca3af', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                <input type="checkbox" checked={scheduleEnabled} onChange={e => setScheduleEnabled(e.target.checked)} />
                                ⏰ Schedule Pick
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9ca3af', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>
                                <input type="checkbox" checked={notifySubscribers} onChange={e => setNotifySubscribers(e.target.checked)} />
                                🔔 Notify Subscribers
                            </label>
                        </div>
                        {scheduleEnabled && (
                            <input type="datetime-local" className="lounge-form-input"
                                value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                                style={{ fontSize: '12px', padding: '6px 10px' }} />
                        )}
                        <div style={{ marginTop: '10px' }}>
                            <label className="lounge-form-label" style={{ marginBottom: '6px', fontSize: '11px' }}>Hype Level</label>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {([['normal', '📘 Normal', ''], ['hot', '🔥 Hot', 'rgba(251,191,36,0.08)'], ['nuclear', '🚨 NUCLEAR', 'rgba(239,68,68,0.08)']] as const).map(([val, label, bg]) => (
                                    <button key={val}
                                        className={`lounge-target-chip ${hypeLevel === val ? 'active' : ''}`}
                                        onClick={() => setHypeLevel(val)}
                                        style={hypeLevel === val ? {
                                            background: bg || undefined,
                                            borderColor: val === 'nuclear' ? 'rgba(239,68,68,0.3)' : val === 'hot' ? 'rgba(251,191,36,0.3)' : undefined,
                                            color: val === 'nuclear' ? '#ef4444' : val === 'hot' ? '#fbbf24' : undefined,
                                        } : {}}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lounge-form-divider" />

                    {/* Live Preview */}
                    <label className="lounge-form-label" style={{ marginBottom: '6px' }}>Preview</label>
                    <div className="lounge-pick-preview">
                        {buildFormattedPick().split('\n').map((line, i) => (
                            <div key={i}>{renderContent(line) || '\u00A0'}</div>
                        ))}
                    </div>

                    {/* Post */}
                    <button className="lounge-form-btn primary" style={{ marginTop: '14px' }} onClick={handlePost} disabled={posting || !targetChannelId}>
                        {posting ? 'Posting...' : scheduleEnabled && scheduleTime ? `⏰ Schedule for ${new Date(scheduleTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : `📋 Post Pick to #${channels.find(c => c.id === targetChannelId)?.name || '...'}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */

export default function CommunityPage() {
    const { user, loading: authLoading } = useAuth();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingChannels, setLoadingChannels] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [showPickComposer, setShowPickComposer] = useState(false);
    const [selectedGame, setSelectedGame] = useState<TickerGame | null>(null);
    const [showTeamSearch, setShowTeamSearch] = useState(false);
    const [analysisCount, setAnalysisCount] = useState(0);
    const [showAnalysisLimit, setShowAnalysisLimit] = useState(false);
    const [pickTeaseMsg, setPickTeaseMsg] = useState<string | null>(null);
    const [error, setError] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // ── Auth + Profile ──
    useEffect(() => {
        if (authLoading) return;
        if (!user) { setHasAccess(false); return; }

        const loadProfile = async () => {
            try {
                const { data } = await supabase
                    .from('user_profiles')
                    .select('subscription_tier, is_admin, display_name, avatar_color')
                    .eq('id', user.id)
                    .single();
                if (data) {
                    setProfile(data);
                    // All authenticated users get in — tier controls channel access
                    setHasAccess(true);
                } else {
                    // No profile yet — still allow in as free tier
                    setProfile({ subscription_tier: null, is_admin: false, display_name: user.email?.split('@')[0] || 'User', avatar_color: '#6b7280' });
                    setHasAccess(true);
                }
            } catch { setHasAccess(false); }
        };
        loadProfile();
    }, [user, authLoading]);

    // ── Fetch channels ──
    const loadChannels = useCallback(async () => {
        try {
            const { data, error: err } = await supabase
                .from('community_channels')
                .select('*')
                .order('sort_order', { ascending: true });
            if (err) { console.error('Channels:', err); return; }
            if (data && data.length > 0) {
                setChannels(data);
                // Only set active if none selected yet
                setActiveChannel(prev => {
                    if (prev && data.find((c: Channel) => c.id === prev.id)) return prev;
                    const first = data.find((c: Channel) => !c.is_readonly) || data[0];
                    return first || null;
                });
            }
        } catch (e) { console.error('Channels:', e); }
        finally { setLoadingChannels(false); }
    }, []);

    useEffect(() => {
        if (!hasAccess) return;
        loadChannels();
    }, [hasAccess, loadChannels]);

    // ── Fetch messages ──
    const fetchMessages = useCallback(async (channelId: string) => {
        setLoadingMessages(true);
        try {
            const { data, error: err } = await supabase
                .from('community_messages')
                .select('*')
                .eq('channel_id', channelId)
                .order('created_at', { ascending: true })
                .limit(100);
            if (err) { console.error('Messages:', err); return; }
            setMessages(data || []);
        } catch (e) { console.error('Messages:', e); }
        finally { setLoadingMessages(false); }
    }, []);

    useEffect(() => {
        if (!activeChannel) return;
        fetchMessages(activeChannel.id);
    }, [activeChannel, fetchMessages]);

    // ── Realtime ──
    useEffect(() => {
        if (!activeChannel) return;

        const chan = supabase
            .channel(`msgs:${activeChannel.id}`)
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'community_messages',
                filter: `channel_id=eq.${activeChannel.id}`,
            }, (payload) => {
                setMessages(prev => [...prev, payload.new as Message]);
            })
            .on('postgres_changes', {
                event: 'DELETE', schema: 'public', table: 'community_messages',
                filter: `channel_id=eq.${activeChannel.id}`,
            }, (payload) => {
                const deletedId = (payload.old as Message).id;
                setMessages(prev => prev.filter(m => m.id !== deletedId));
            })
            .subscribe();

        return () => { supabase.removeChannel(chan); };
    }, [activeChannel]);

    // ── Auto-scroll ──
    useEffect(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        if (isNearBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else {
            setShowScrollBtn(true);
        }
    }, [messages]);

    const handleScroll = () => {
        const el = messagesContainerRef.current;
        if (!el) return;
        setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setShowScrollBtn(false);
    };

    // ── Send message ──
    const handleSend = async () => {
        if (!newMessage.trim() || !activeChannel || sending || !user || !profile) return;
        setSending(true); setError('');

        try {
            const { error: insertErr } = await supabase
                .from('community_messages')
                .insert({
                    channel_id: activeChannel.id, user_id: user.id,
                    content: newMessage.trim().slice(0, 2000),
                    display_name: profile.display_name || user.email?.split('@')[0] || 'TriplePlayz Member',
                    avatar_color: profile.avatar_color || '#00e59b', is_bot: false,
                });
            if (insertErr) { setError(insertErr.message || 'Failed to send'); return; }
            setNewMessage('');
            inputRef.current?.focus();
        } catch { setError('Network error — try again'); }
        finally { setSending(false); }
    };

    // ── Delete message ──
    const deleteMessage = async (msgId: string) => {
        // Optimistic: remove from UI immediately
        setMessages(prev => prev.filter(m => m.id !== msgId));
        const { error: err } = await supabase.from('community_messages').delete().eq('id', msgId);
        if (err) console.error('Delete failed:', err);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    // ── Formatting ──
    const applyFormat = (type: 'bold' | 'italic' | 'code') => {
        const ta = inputRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = newMessage.slice(start, end);
        const wrap = type === 'bold' ? '**' : type === 'italic' ? '*' : '`';
        if (selected) {
            setNewMessage(`${newMessage.slice(0, start)}${wrap}${selected}${wrap}${newMessage.slice(end)}`);
        } else {
            setNewMessage(`${newMessage.slice(0, start)}${wrap}text${wrap}${newMessage.slice(start)}`);
            setTimeout(() => { ta.selectionStart = start + wrap.length; ta.selectionEnd = start + wrap.length + 4; ta.focus(); }, 0);
        }
    };

    // ── Post pick to any channel (admin) ──
    const postPickToChannel = async (channelId: string, content: string) => {
        if (!user || !profile) return;
        const { error: err } = await supabase
            .from('community_messages')
            .insert({
                channel_id: channelId, user_id: user.id,
                content, display_name: profile.display_name || 'TriplePlayz',
                avatar_color: '#fbbf24', is_bot: false,
            });
        if (err) throw err;
    };

    const isAdmin = profile?.is_admin ?? false;
    const userTier = profile?.is_admin ? 'elite' : (profile?.subscription_tier || 'free');
    const isPaid = userTier !== 'free';
    const canPost = activeChannel ? (!activeChannel.is_readonly || profile?.is_admin) && canAccessChannel(userTier, activeChannel.min_tier) : false;

    // Init analysis count on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setAnalysisCount(getAnalysisUsage().count);
        }
    }, []);

    // Pick tease auto-dismiss
    useEffect(() => {
        if (!pickTeaseMsg) return;
        const t = setTimeout(() => setPickTeaseMsg(null), 10000);
        return () => clearTimeout(t);
    }, [pickTeaseMsg]);

    // Metered game click handler
    const handleGameClickMetered = (g: TickerGame) => {
        if (isPaid || isAdmin) {
            setSelectedGame(g);
            return;
        }
        // Free user — check analysis quota
        const usage = getAnalysisUsage();
        if (usage.count >= ANALYSIS_LIMIT) {
            setShowAnalysisLimit(true);
            return;
        }
        const newCount = incrementAnalysisUsage();
        setAnalysisCount(newCount);
        setSelectedGame(g);
    };

    // ── Admin: Generate & post freebies ──
    const postFreebies = async () => {
        if (!user || !profile) return;
        try {
            const res = await fetch('/api/community/freebies');
            const data = await res.json();
            if (data.formattedPicks && data.formattedPicks.length > 0) {
                // Find daily-picks channel (or first picks channel)
                const picksCh = channels.find(c => c.name === 'daily-picks') || channels.find(c => c.category === 'PICKS');
                if (!picksCh) { alert('No picks channel found'); return; }
                for (const formatted of data.formattedPicks) {
                    await supabase.from('community_messages').insert({
                        channel_id: picksCh.id, user_id: user.id,
                        content: formatted,
                        display_name: '💎 TriplePlayz Algorithm',
                        avatar_color: '#00e59b', is_bot: true,
                    });
                }
                alert(`Posted ${data.formattedPicks.length} freebie picks to #${picksCh.name}!`);
            } else {
                alert('No strong freebie picks found today — algorithm needs clear edges.');
            }
        } catch { alert('Failed to generate freebies'); }
    };

    // ── Admin: Post daily schedule ──
    const postSchedule = async () => {
        if (!user || !profile) return;
        try {
            const res = await fetch('/api/community/freebies');
            const data = await res.json();
            if (data.announcement) {
                const annCh = channels.find(c => c.name === 'announcements') || channels.find(c => c.category === 'GENERAL');
                if (!annCh) { alert('No announcements channel found'); return; }
                await supabase.from('community_messages').insert({
                    channel_id: annCh.id, user_id: user.id,
                    content: data.announcement,
                    display_name: '💎 TriplePlayz',
                    avatar_color: '#fbbf24', is_bot: true,
                });
                alert(`Schedule posted to #${annCh.name}!`);
            }
        } catch { alert('Failed to post schedule'); }
    };

    /* ════════════════════════════════════════════════════
       Render
       ════════════════════════════════════════════════════ */

    if (authLoading || hasAccess === null) {
        return (
            <div className="lounge-paywall">
                <div style={{ textAlign: 'center' }}>
                    <Loader2 size={24} style={{ color: '#00e59b', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                    <p style={{ color: '#4b5563', fontSize: '13px' }}>Loading The Lounge...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="lounge-paywall">
                <div className="lounge-paywall-card">
                    <div className="lounge-paywall-icon">💎</div>
                    <Image src="/logo.png" alt="TriplePlayz" width={56} height={56} style={{ margin: '0 auto 16px', borderRadius: '12px' }} />
                    <h1 className="font-display" style={{ fontSize: '26px', fontWeight: 900, color: 'white', marginBottom: '8px' }}>The TriplePlayz Lounge</h1>
                    <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
                        Your exclusive community for MLB picks, expert analysis, and real-time chat with TriplePlayz.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                        <Link href="/dashboard?signup=free" className="btn-glow"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 700, borderRadius: '10px' }}>
                            <Sparkles size={14} />
                            Create Free Account
                        </Link>
                        <p style={{ color: '#6b7280', fontSize: '11px' }}>Free access to game analysis, community chat, and freebie picks</p>
                        <Link href="/pricing" style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                            <Crown size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                            Or subscribe for full access →
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const grouped = channels.reduce<Record<string, Channel[]>>((acc, ch) => {
        // Hide free-lobby from paid users, hide paid-only channels from free users' view
        // But show locked channels so free users can see activity
        const isFreeOnlyChannel = ch.name === 'free-lobby';
        if (isFreeOnlyChannel && isPaid) return acc; // Paid users don't see free-lobby
        if (!isFreeOnlyChannel && ch.min_tier === 'free' && ch.name === 'free-lobby') return acc;
        if (!acc[ch.category]) acc[ch.category] = [];
        acc[ch.category].push(ch);
        return acc;
    }, {});

    return (
        <div className="lounge-root">
            <SmartTicker onGameClick={handleGameClickMetered} onSearchClick={() => setShowTeamSearch(true)} />

            {/* Analysis counter for free users */}
            {!isPaid && !isAdmin && (
                <div className="analysis-counter" style={{
                    position: 'fixed', bottom: '20px', left: '20px', zIndex: 800,
                    background: analysisCount >= 4 ? 'rgba(239,68,68,0.15)' : analysisCount >= 3 ? 'rgba(251,191,36,0.12)' : 'rgba(0,229,155,0.1)',
                    border: `1px solid ${analysisCount >= 4 ? 'rgba(239,68,68,0.3)' : analysisCount >= 3 ? 'rgba(251,191,36,0.2)' : 'rgba(0,229,155,0.15)'}`,
                    borderRadius: '12px', padding: '8px 14px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    backdropFilter: 'blur(12px)', fontSize: '12px', fontWeight: 700,
                    color: analysisCount >= 4 ? '#fca5a5' : analysisCount >= 3 ? '#fbbf24' : '#00e59b',
                    animation: analysisCount >= 4 ? 'pulse 2s infinite' : 'none',
                }}>
                    📊 {ANALYSIS_LIMIT - analysisCount}/{ANALYSIS_LIMIT} free analyses
                    <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: 500 }}>this week</span>
                </div>
            )}

            {/* Pick tease banner */}
            {pickTeaseMsg && !isPaid && (
                <div style={{
                    position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)', zIndex: 850,
                    background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(239,68,68,0.12) 100%)',
                    border: '1px solid rgba(251,191,36,0.25)',
                    borderRadius: '12px', padding: '12px 20px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    backdropFilter: 'blur(12px)', maxWidth: '500px', width: '90vw',
                    animation: 'slideDown 0.3s ease, pulse 2s infinite',
                }}>
                    <span style={{ fontSize: '18px' }}>🔥</span>
                    <div style={{ flex: 1 }}>
                        <p style={{ color: '#fbbf24', fontSize: '13px', fontWeight: 700, margin: 0 }}>{pickTeaseMsg}</p>
                        <p style={{ color: '#9ca3af', fontSize: '11px', margin: '2px 0 0' }}>Upgrade to see exclusive picks</p>
                    </div>
                    <Link href="/pricing" style={{
                        background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)',
                        borderRadius: '8px', padding: '6px 12px', color: '#fbbf24',
                        fontSize: '11px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
                    }}>
                        <Crown size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                        Upgrade
                    </Link>
                    <button onClick={() => setPickTeaseMsg(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '2px' }}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Analysis limit modal */}
            {showAnalysisLimit && (
                <>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 900 }} onClick={() => setShowAnalysisLimit(false)} />
                    <div style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        zIndex: 901, background: 'linear-gradient(180deg, #1a1f2e 0%, #0d1220 100%)',
                        border: '1px solid rgba(251,191,36,0.15)', borderRadius: '16px',
                        padding: '32px', maxWidth: '400px', width: '90vw', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
                        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
                            Free Analyses Used Up!
                        </h2>
                        <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.6, marginBottom: '20px' }}>
                            You&apos;ve used all {ANALYSIS_LIMIT} free game analyses this week. Upgrade to get <strong style={{ color: '#fbbf24' }}>unlimited analyses</strong> plus exclusive picks, alerts, and VIP channels.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <Link href="/pricing" className="btn-glow" style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                padding: '12px', fontSize: '14px', fontWeight: 700, borderRadius: '10px',
                            }}>
                                <Crown size={14} /> Upgrade Now
                            </Link>
                            <button onClick={() => setShowAnalysisLimit(false)} style={{
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '10px', padding: '10px', color: '#6b7280',
                                fontSize: '13px', cursor: 'pointer',
                            }}>
                                Maybe Later
                            </button>
                        </div>
                        <p style={{ color: '#374151', fontSize: '10px', marginTop: '12px' }}>Resets every Monday • Unlimited for subscribers</p>
                    </div>
                </>
            )}

            <div className="lounge-body">
                {sidebarOpen && <div className="lounge-mobile-backdrop" onClick={() => setSidebarOpen(false)} />}

                {/* ═══ Sidebar ═══ */}
                <aside className={`lounge-sidebar ${sidebarOpen ? 'open' : ''}`}>
                    <div className="lounge-sidebar-header">
                        <h2>💎 TriplePlayz Lounge</h2>
                        <p>TriplePlayz - Sports Advisory</p>
                        <div className="lounge-online-badge"><span className="lounge-online-dot" /> Online</div>
                    </div>

                    {loadingChannels ? (
                        <div style={{ padding: '14px' }}>
                            {[1,2,3,4,5].map(i => <div key={i} className="lounge-skeleton" style={{ height: '30px', marginBottom: '3px' }} />)}
                        </div>
                    ) : (
                        Object.entries(grouped).map(([category, chs]) => (
                            <div key={category} className="lounge-category">
                                <p className="lounge-category-label">{category}</p>
                                {chs.map(ch => {
                                    const isLocked = !canAccessChannel(userTier, ch.min_tier) && !isAdmin;
                                    return (
                                        <button key={ch.id}
                                            className={`lounge-channel ${activeChannel?.id === ch.id ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                                            onClick={() => { setActiveChannel(ch); setSidebarOpen(false); }}>
                                            <span className="lounge-channel-icon">{ch.icon}</span>
                                            <span className="lounge-channel-name">{ch.name}</span>
                                            {isLocked && <Lock size={12} style={{ color: '#4b5563', marginLeft: 'auto', flexShrink: 0 }} />}
                                            {ch.is_readonly && !isLocked && <span className="lounge-channel-pin">📌</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}

                    {/* ═══ Conversion Widgets ═══ */}
                    <div style={{ padding: '8px 10px' }}>
                        <StreakCounter isPaid={(TIER_HIERARCHY[userTier] ?? 0) >= 1} />
                        <PremiumRevealFeed isPaid={(TIER_HIERARCHY[userTier] ?? 0) >= 1} />
                    </div>

                    {/* Admin settings button */}
                    {isAdmin && (
                        <button className="lounge-admin-btn" onClick={() => { setShowAdminPanel(true); setSidebarOpen(false); }}>
                            <Settings size={14} /> Server Settings
                        </button>
                    )}

                    {sidebarOpen && (
                        <button onClick={() => setSidebarOpen(false)}
                            style={{ margin: '8px 10px 10px', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <X size={14} /> Close
                        </button>
                    )}
                </aside>

                {/* ═══ Main Chat ═══ */}
                <div className="lounge-main" style={{ position: 'relative' }}>
                    {activeChannel && (
                        <div className="lounge-topbar">
                            <span className="lounge-topbar-icon">{activeChannel.icon}</span>
                            <span className="lounge-topbar-name">{activeChannel.name}</span>
                            <span className="lounge-topbar-divider" />
                            <span className="lounge-topbar-desc">{activeChannel.description}</span>
                            {!canAccessChannel(userTier, activeChannel.min_tier) && !isAdmin && (
                                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24', fontSize: '11px', fontWeight: 600 }}>
                                    <Lock size={11} /> Premium
                                </span>
                            )}
                        </div>
                    )}

                    {/* Locked channel overlay */}
                    {activeChannel && !canAccessChannel(userTier, activeChannel.min_tier) && !isAdmin ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                            {/* Blurred fake messages */}
                            <div style={{ flex: 1, padding: '16px', filter: 'blur(6px)', opacity: 0.3, pointerEvents: 'none' }}>
                                {[1,2,3,4,5,6].map(i => (
                                    <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'flex-start' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `hsl(${i * 60}, 50%, 40%)`, flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ width: `${60 + i * 5}px`, height: '11px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', marginBottom: '6px' }} />
                                            <div style={{ width: `${120 + i * 30}px`, height: '11px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
                                            {i % 2 === 0 && <div style={{ width: `${80 + i * 20}px`, height: '11px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', marginTop: '4px' }} />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Lock overlay */}
                            <div style={{
                                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                                background: 'radial-gradient(ellipse at center, rgba(10,15,26,0.95) 0%, rgba(10,15,26,0.8) 100%)',
                            }}>
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '16px',
                                    background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))',
                                    border: '1px solid rgba(251,191,36,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
                                }}>
                                    <Lock size={24} style={{ color: '#fbbf24' }} />
                                </div>
                                <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
                                    #{activeChannel.name} is Premium
                                </h3>
                                <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.5, maxWidth: '280px', marginBottom: '16px' }}>
                                    This channel is for {activeChannel.min_tier === 'pro' ? 'Pro & Elite' : 'Starter+'} members. Upgrade to join the conversation and see exclusive picks.
                                </p>
                                <Link href="/pricing" className="btn-glow" style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                    padding: '10px 24px', fontSize: '13px', fontWeight: 700, borderRadius: '10px',
                                }}>
                                    <Crown size={14} /> Upgrade to Unlock
                                </Link>
                            </div>
                        </div>
                    ) : (
                    <>
                    <div className="lounge-messages" ref={messagesContainerRef} onScroll={handleScroll}>
                        {/* Welcome banner */}
                        {activeChannel?.welcome_message && (
                            <div className="lounge-welcome-banner">
                                <span className="lounge-welcome-banner-icon">{activeChannel.icon}</span>
                                <span>{activeChannel.welcome_message}</span>
                            </div>
                        )}

                        {loadingMessages ? (
                            <div style={{ padding: '16px' }}>
                                {[1,2,3,4].map(i => (
                                    <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                                        <div className="lounge-skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                                        <div style={{ flex: 1 }}>
                                            <div className="lounge-skeleton" style={{ width: '100px', height: '12px', marginBottom: '5px' }} />
                                            <div className="lounge-skeleton" style={{ width: `${50 + Math.random() * 40}%`, height: '12px' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="lounge-empty">
                                <div className="lounge-empty-icon">{activeChannel?.icon || '💬'}</div>
                                <p style={{ fontSize: '15px', fontWeight: 600, color: '#6b7280' }}>Welcome to #{activeChannel?.name || 'channel'}!</p>
                                <p style={{ fontSize: '12px', color: '#374151' }}>
                                    {activeChannel?.is_readonly && !isAdmin ? 'Picks and announcements will appear here.' : 'Start the conversation — say something!'}
                                </p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                const prev = idx > 0 ? messages[idx - 1] : null;
                                const isGrouped = prev && prev.user_id === msg.user_id
                                    && prev.display_name === msg.display_name
                                    && (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) < 120000;
                                const canDelete = isAdmin || msg.user_id === user.id;

                                return (
                                    <div key={msg.id} className={`lounge-msg ${isGrouped ? 'grouped' : ''}`}>
                                        <div className="lounge-msg-avatar" style={{ background: msg.avatar_color }}>
                                            {msg.is_bot ? '💎' : msg.display_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="lounge-msg-body">
                                            <div className="lounge-msg-header">
                                                <span className={`lounge-msg-name ${msg.is_bot ? 'bot' : ''}`}>{msg.display_name}</span>
                                                {msg.is_bot && <span className="lounge-msg-badge bot-badge">BOT</span>}
                                                <span className="lounge-msg-time">{formatTime(msg.created_at)}</span>
                                                {/* Message actions */}
                                                {canDelete && (
                                                    <div className="lounge-msg-actions">
                                                        <button className="lounge-msg-action-btn delete" onClick={() => deleteMessage(msg.id)} title="Delete message">
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="lounge-msg-content">{renderContent(msg.content)}</div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {showScrollBtn && (
                        <button className="lounge-scroll-fab" onClick={scrollToBottom}><ChevronDown size={18} /></button>
                    )}

                    {canPost ? (
                        <div className="lounge-compose">
                            {isAdmin && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <FormatToolbar onFormat={applyFormat} />
                                    <button className="lounge-pick-btn" onClick={() => setShowPickComposer(true)}>
                                        📋 Post Pick
                                    </button>
                                    <button className="lounge-pick-btn" onClick={postFreebies} style={{ borderColor: 'rgba(0,229,155,0.15)', background: 'rgba(0,229,155,0.06)', color: '#00e59b' }}>
                                        <Zap size={12} /> Freebies
                                    </button>
                                    <button className="lounge-pick-btn" onClick={postSchedule} style={{ borderColor: 'rgba(99,102,241,0.15)', background: 'rgba(99,102,241,0.06)', color: '#818cf8' }}>
                                        <Megaphone size={12} /> Schedule
                                    </button>
                                </div>
                            )}
                            {error && <p style={{ color: '#fca5a5', fontSize: '11px', marginBottom: '4px', textAlign: 'center' }}>⚠ {error}</p>}
                            <div className="lounge-compose-row">
                                <textarea ref={inputRef} className="lounge-input" value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)} onKeyDown={handleKeyDown}
                                    placeholder={`Message #${activeChannel?.name}...`} rows={1} maxLength={2000} />
                                <button className="lounge-send-btn" onClick={handleSend} disabled={!newMessage.trim() || sending}>
                                    {sending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="lounge-readonly-bar">📌 This channel is read-only — picks and announcements appear here automatically.</div>
                    )}
                    </>
                    )}
                </div>
            </div>

            <button className="lounge-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu size={18} />
                <span>Chat Rooms</span>
            </button>

            {/* Admin Panel Modal */}
            {showAdminPanel && (
                <AdminPanel
                    channels={channels}
                    onClose={() => setShowAdminPanel(false)}
                    onRefresh={() => { loadChannels(); setShowAdminPanel(false); }}
                />
            )}

            {/* Pick Composer Modal */}
            {showPickComposer && (
                <PickComposer
                    channels={channels}
                    onClose={() => setShowPickComposer(false)}
                    onPost={postPickToChannel}
                />
            )}
            {/* Game Analysis Panel */}
            {selectedGame && (
                <GameAnalysisPanel
                    game={selectedGame}
                    onClose={() => setSelectedGame(null)}
                />
            )}
            {/* Team Search Panel */}
            {showTeamSearch && (
                <TeamSearchPanel
                    onClose={() => setShowTeamSearch(false)}
                    onSelectGame={(g) => { setSelectedGame(g); setShowTeamSearch(false); }}
                />
            )}
        </div>
    );
}
