'use client';

import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import './BreakAnalytics.css';

/* ─── Types ─── */
interface RateBucket {
    total: number;
    breaks: number;
    rate: number;
}

interface GameBucket extends RateBucket {
    game: number;
    homeBreaks: number;
    homeTotal: number;
    awayBreaks: number;
    awayTotal: number;
}

interface SeasonBucket extends RateBucket {
    year: number;
}

interface TeamBucket {
    teamName: string;
    breaks: number;
    total: number;
    rate: number;
    homeBreaks: number;
    awayBreaks: number;
}

interface SeasonEvent {
    date: string;
    teamName: string;
    opponent: string;
    isHome: boolean;
    streakLength: number;
    broke: boolean;
    result: 'W' | 'L';
}

interface AnalyticsData {
    byGame: GameBucket[];
    byLocation: { home: RateBucket; away: RateBucket };
    bySeason: SeasonBucket[];
    currentSeason: { year: number; total: number; breaks: number; rate: number; byGame: GameBucket[] };
    topBreakGame: number;
    topLocation: 'home' | 'away';
    totalEvents: number;
    overallRate: number;
    byTeam: TeamBucket[];
    seasonEvents: SeasonEvent[];
}

/* ─── Helpers ─── */
function rateColor(rate: number): string {
    if (rate >= 55) return '#FFC107';
    if (rate >= 48) return '#fbbf24';
    return '#ef4444';
}

function barGradient(rate: number): string {
    if (rate >= 55) return 'linear-gradient(90deg, #FFC107, #FFC107)';
    if (rate >= 48) return 'linear-gradient(90deg, #fbbf24, #f59e0b)';
    return 'linear-gradient(90deg, #ef4444, #f87171)';
}

function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
}

type EventFilter = 'all' | 'broke' | 'held';

const INITIAL_LOG_COUNT = 50;
const LOG_INCREMENT = 50;

/* ─── CSV Export ─── */
function generateCsv(data: AnalyticsData): string {
    const rows: string[][] = [['Category', 'Metric', 'Value', 'Details', 'Home Breaks', 'Away Breaks']];

    // Overall stats
    rows.push(['Overall', 'Break Rate', `${Math.round(data.overallRate)}%`, `${data.totalEvents} total events`, '', '']);
    rows.push(['Overall', 'Top Break Game', `Game ${data.topBreakGame}`, '', '', '']);
    rows.push(['Overall', 'Top Location', data.topLocation.toUpperCase(), '', '', '']);

    // Game breakdown with home/away
    for (const g of data.byGame) {
        rows.push([
            'Game Breakdown',
            `Game ${g.game}`,
            `${Math.round(g.rate)}%`,
            `${g.breaks} breaks in ${g.total} games`,
            String(g.homeBreaks),
            String(g.awayBreaks),
        ]);
    }

    // Home/Away
    rows.push(['Location', 'Home', `${Math.round(data.byLocation.home.rate)}%`, `${data.byLocation.home.breaks} of ${data.byLocation.home.total}`, '', '']);
    rows.push(['Location', 'Away', `${Math.round(data.byLocation.away.rate)}%`, `${data.byLocation.away.breaks} of ${data.byLocation.away.total}`, '', '']);

    // Seasons
    for (const s of data.bySeason) {
        rows.push([
            'Season',
            `${s.year}`,
            `${Math.round(s.rate)}%`,
            `${s.breaks} of ${s.total} games`,
            '',
            '',
        ]);
    }

    // Team leaderboard
    rows.push([]);
    rows.push(['Team Leaderboard', 'Team', 'Breaks', 'Total', 'Home Breaks', 'Away Breaks']);
    for (const t of data.byTeam) {
        rows.push([
            'Team',
            t.teamName,
            String(t.breaks),
            String(t.total),
            String(t.homeBreaks),
            String(t.awayBreaks),
        ]);
    }

    // Season events
    rows.push([]);
    rows.push(['Season Events', 'Date', 'Team', 'Opponent', 'Location', 'Streak', 'Broke', 'Result']);
    for (const e of data.seasonEvents) {
        rows.push([
            'Event',
            e.date,
            e.teamName,
            e.opponent,
            e.isHome ? 'Home' : 'Away',
            String(e.streakLength),
            e.broke ? 'Yes' : 'No',
            e.result,
        ]);
    }

    return rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}

function downloadCsv(data: AnalyticsData): void {
    const csv = generateCsv(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tripleplayz-pattern-analytics-${today}.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/* ─── Rank Medal ─── */
function RankBadge({ rank }: { rank: number }): ReactNode {
    if (rank === 1) return <span className="ba-team-rank">🥇</span>;
    if (rank === 2) return <span className="ba-team-rank">🥈</span>;
    if (rank === 3) return <span className="ba-team-rank">🥉</span>;
    return <span className="ba-team-rank-num">{rank}</span>;
}

/* ═══════════════════════════════════
   SECTION 1: Game Breakdown
   ═══════════════════════════════════ */
function GameBreakdown({ games, topGame }: { games: GameBucket[]; topGame: number }): ReactNode {
    const sorted = [...games].sort((a, b) => a.game - b.game);
    const maxRate = Math.max(...sorted.map(g => g.rate), 1);

    // Primary games 5-12, minor games 4, 13, 14
    const primary = sorted.filter(g => g.game >= 5 && g.game <= 12);
    const minor = sorted.filter(g => g.game < 5 || g.game > 12);

    return (
        <div className="ba-game-section">
            <div className="ba-section-header">
                <span className="ba-section-icon">📈</span>
                How often does the pattern break at each game?
            </div>
            <div className="ba-section-sub">
                When a team goes W-L-W-L back and forth, this shows how often that streak finally breaks.
            </div>
            <div className="ba-game-grid">
                {primary.map((g, i) => (
                    <GameCard key={g.game} game={g} isFeatured={g.game === topGame} maxRate={maxRate} delay={0.1 + i * 0.04} />
                ))}
                {minor.length > 0 && (
                    <>
                        {minor.map((g, i) => (
                            <GameCard key={g.game} game={g} isFeatured={false} maxRate={maxRate} delay={0.4 + i * 0.04} isMinor />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}

function GameCard({ game: g, isFeatured, maxRate, delay, isMinor }: {
    game: GameBucket;
    isFeatured: boolean;
    maxRate: number;
    delay: number;
    isMinor?: boolean;
}): ReactNode {
    const cardClass = `ba-game-card${isFeatured ? ' featured' : ''}${isMinor ? ' minor' : ''}`;

    return (
        <motion.div
            className={cardClass}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.35 }}
        >
            <div className="ba-game-top">
                <span className="ba-game-label">
                    {isFeatured && <span className="ba-game-crown">👑</span>}
                    Game {g.game}
                </span>
                <span className="ba-game-rate" style={{ color: isFeatured ? '#a78bfa' : rateColor(g.rate) }}>
                    {Math.round(g.rate)}%
                </span>
            </div>

            <div className="ba-game-bar-track">
                <div
                    className="ba-game-bar-fill"
                    style={{
                        width: `${(g.rate / maxRate) * 100}%`,
                        background: isFeatured
                            ? 'linear-gradient(90deg, #a78bfa, #c4b5fd)'
                            : barGradient(g.rate),
                    }}
                />
            </div>

            <div className="ba-game-locations">
                <span className="ba-game-loc">
                    <span className="ba-game-loc-emoji">🏠</span>
                    <span className="ba-game-loc-count" style={{ color: '#FFC107' }}>{g.homeBreaks}</span>
                    <span className="ba-game-loc-label">home</span>
                </span>
                <span className="ba-game-loc">
                    <span className="ba-game-loc-emoji">✈️</span>
                    <span className="ba-game-loc-count" style={{ color: '#60a5fa' }}>{g.awayBreaks}</span>
                    <span className="ba-game-loc-label">away</span>
                </span>
                <span className="ba-game-sample">
                    {g.breaks} of {g.total}
                </span>
            </div>
        </motion.div>
    );
}

/* ═══════════════════════════════════
   SECTION 2: Team Leaderboard
   ═══════════════════════════════════ */
function TeamLeaderboard({ teams }: { teams: TeamBucket[] }): ReactNode {
    const top10 = teams.slice(0, 10);
    const maxBreaks = Math.max(...top10.map(t => t.breaks), 1);

    return (
        <div className="ba-team-section">
            <div className="ba-section-header">
                <span className="ba-section-icon">🏆</span>
                Which teams broke the most this season?
            </div>
            <div className="ba-team-list">
                {top10.map((t, i) => (
                    <motion.div
                        key={t.teamName}
                        className="ba-team-row"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.04 }}
                    >
                        <RankBadge rank={i + 1} />
                        <span className="ba-team-name">{t.teamName}</span>
                        <span className="ba-team-breaks">{t.breaks}</span>
                        <span className="ba-team-split">
                            🏠 {t.homeBreaks} / ✈️ {t.awayBreaks}
                        </span>
                        <div className="ba-team-bar-track">
                            <div
                                className="ba-team-bar-fill"
                                style={{ width: `${(t.breaks / maxBreaks) * 100}%` }}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════
   SECTION 3: Season Game Log
   ═══════════════════════════════════ */
function SeasonGameLog({ events }: { events: SeasonEvent[] }): ReactNode {
    const [filter, setFilter] = useState<EventFilter>('all');
    const [visibleCount, setVisibleCount] = useState(INITIAL_LOG_COUNT);

    const filtered = useMemo(() => {
        if (filter === 'all') return events;
        if (filter === 'broke') return events.filter(e => e.broke);
        return events.filter(e => !e.broke);
    }, [events, filter]);

    const shown = filtered.slice(0, visibleCount);
    const hasMore = visibleCount < filtered.length;

    const handleShowMore = useCallback(() => {
        setVisibleCount(prev => prev + LOG_INCREMENT);
    }, []);

    // Reset visible count when filter changes
    useEffect(() => {
        setVisibleCount(INITIAL_LOG_COUNT);
    }, [filter]);

    const filterButtons: { key: EventFilter; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'broke', label: '✅ Broke' },
        { key: 'held', label: '❌ Held' },
    ];

    return (
        <div className="ba-log-section">
            <div className="ba-section-header">
                <span className="ba-section-icon">📋</span>
                Season game log
            </div>

            <div className="ba-log-header-row">
                <span className="ba-log-count">
                    <strong>{filtered.length}</strong> games{filter !== 'all' ? ` (${filter})` : ' this season'}
                </span>
                <div className="ba-log-filters">
                    {filterButtons.map(fb => (
                        <button
                            key={fb.key}
                            className={`ba-log-filter-btn${filter === fb.key ? ' active' : ''}`}
                            onClick={() => setFilter(fb.key)}
                        >
                            {fb.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="ba-log-scroll">
                <table className="ba-log-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Team</th>
                            <th>Opponent</th>
                            <th>Loc</th>
                            <th>Gm #</th>
                            <th>Status</th>
                            <th>Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shown.map((ev, i) => (
                            <motion.tr
                                key={`${ev.date}-${ev.teamName}-${i}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: Math.min(i * 0.015, 0.5) }}
                            >
                                <td className="ba-log-date">{formatDate(ev.date)}</td>
                                <td className="ba-log-team">{ev.teamName}</td>
                                <td className="ba-log-opponent">vs {ev.opponent}</td>
                                <td className="ba-log-loc">{ev.isHome ? '🏠' : '✈️'}</td>
                                <td>{ev.streakLength}</td>
                                <td>
                                    <span className={`ba-log-broke ${ev.broke ? 'yes' : 'no'}`}>
                                        {ev.broke ? '✅ Broke' : '❌ Held'}
                                    </span>
                                </td>
                                <td>
                                    <span className={`ba-log-result ${ev.result === 'W' ? 'win' : 'loss'}`}>
                                        {ev.result}
                                    </span>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {hasMore && (
                <div className="ba-log-more-row">
                    <button className="ba-log-more-btn" onClick={handleShowMore}>
                        Show {Math.min(LOG_INCREMENT, filtered.length - visibleCount)} more
                    </button>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════ */
export default function BreakAnalytics(): ReactNode {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const res = await fetch('/api/patterns/analytics');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json: AnalyticsData = await res.json();
            setData(json);
        } catch (err) {
            console.error('Analytics fetch error:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    if (loading) {
        return (
            <div className="ba-loading">
                <div className="ba-loading-spinner" />
                <span>Crunching 4 seasons of data…</span>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="ba-error">
                <p>Failed to load analytics.</p>
                <button onClick={fetchAnalytics}>Retry</button>
            </div>
        );
    }

    return (
        <motion.div
            className="ba-container"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            {/* ── Export Button ── */}
            <div className="ba-export-row">
                <button
                    className="ba-export-btn"
                    onClick={() => downloadCsv(data)}
                    title="Export analytics data as CSV"
                >
                    📥 Export Data
                </button>
            </div>

            {/* ── Section 1: Game Breakdown ── */}
            <GameBreakdown games={data.byGame} topGame={data.topBreakGame} />

            <div className="ba-divider" />

            {/* ── Section 2: Team Leaderboard ── */}
            {data.byTeam && data.byTeam.length > 0 && (
                <>
                    <TeamLeaderboard teams={data.byTeam} />
                    <div className="ba-divider" />
                </>
            )}

            {/* ── Section 3: Season Game Log ── */}
            {data.seasonEvents && data.seasonEvents.length > 0 && (
                <SeasonGameLog events={data.seasonEvents} />
            )}
        </motion.div>
    );
}
