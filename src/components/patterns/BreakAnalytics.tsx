'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
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
}

interface SeasonBucket extends RateBucket {
    year: number;
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
}

/* ─── Helpers ─── */
function rateColor(rate: number): string {
    if (rate >= 55) return '#00e59b';
    if (rate >= 48) return '#fbbf24';
    return '#ef4444';
}

function barGradient(rate: number): string {
    if (rate >= 55) return 'linear-gradient(90deg, #00e59b, #34d399)';
    if (rate >= 48) return 'linear-gradient(90deg, #fbbf24, #f59e0b)';
    return 'linear-gradient(90deg, #ef4444, #f87171)';
}

function seasonBarColor(rate: number): string {
    if (rate >= 55) return '#00e59b';
    if (rate >= 48) return '#fbbf24';
    return '#a78bfa';
}

/** Plain english for a rate - "More often than not", "About half the time", etc */
function rateVibe(rate: number): string {
    if (rate >= 65) return 'Breaks most of the time';
    if (rate >= 58) return 'Breaks more often than not';
    if (rate >= 52) return 'Slightly favors breaking';
    if (rate >= 48) return 'About a coin flip';
    if (rate >= 40) return 'Usually holds the pattern';
    return 'Rarely breaks';
}

/* ─── SVG Donut Chart ─── */
function DonutChart({ home, away, topLocation }: {
    home: RateBucket;
    away: RateBucket;
    topLocation: 'home' | 'away';
}): ReactNode {
    const total = home.total + away.total;
    const homeBreaks = home.breaks;
    const awayBreaks = away.breaks;
    const totalBreaks = homeBreaks + awayBreaks;
    const homePct = totalBreaks > 0 ? (homeBreaks / totalBreaks) * 100 : 50;
    const awayPct = totalBreaks > 0 ? (awayBreaks / totalBreaks) * 100 : 50;

    const radius = 70;
    const strokeWidth = 18;
    const circumference = 2 * Math.PI * radius;
    const homeArc = (homePct / 100) * circumference;
    const awayArc = (awayPct / 100) * circumference;

    const winnerLabel = topLocation === 'home' ? 'HOME' : 'AWAY';
    const winnerPct = topLocation === 'home' ? Math.round(home.rate) : Math.round(away.rate);

    // Suppress hydration mismatch: total is data-driven, safe for both sides
    void total;

    return (
        <div className="ba-donut-wrapper">
            <svg viewBox="0 0 200 200" className="ba-donut-svg">
                {/* Away arc (bottom layer) */}
                <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    transform="rotate(-90 100 100)"
                    opacity={0.3}
                />
                {/* Home arc */}
                <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke="#00e59b"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${homeArc} ${circumference - homeArc}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    transform="rotate(-90 100 100)"
                />
                {/* Away arc */}
                <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${awayArc} ${circumference - awayArc}`}
                    strokeDashoffset={`${-homeArc}`}
                    strokeLinecap="round"
                    transform="rotate(-90 100 100)"
                />
                {/* Center text */}
                <text x="100" y="92" textAnchor="middle" fill={topLocation === 'home' ? '#00e59b' : '#60a5fa'} fontSize="28" fontWeight="700">
                    {winnerPct}%
                </text>
                <text x="100" y="115" textAnchor="middle" fill="#9ca3af" fontSize="13" fontWeight="600">
                    {winnerLabel}
                </text>
            </svg>
            <div className="ba-donut-legend">
                <div className="ba-donut-legend-item">
                    <span className="ba-donut-dot" style={{ background: '#00e59b' }} />
                    <span className="ba-donut-legend-label">🏠 HOME</span>
                    <span className="ba-donut-legend-value" style={{ color: '#00e59b' }}>
                        {Math.round(home.rate)}%
                    </span>
                    <span className="ba-donut-legend-sub">({home.breaks}/{home.total})</span>
                </div>
                <div className="ba-donut-legend-item">
                    <span className="ba-donut-dot" style={{ background: '#60a5fa' }} />
                    <span className="ba-donut-legend-label">✈️ AWAY</span>
                    <span className="ba-donut-legend-value" style={{ color: '#60a5fa' }}>
                        {Math.round(away.rate)}%
                    </span>
                    <span className="ba-donut-legend-sub">({away.breaks}/{away.total})</span>
                </div>
            </div>
        </div>
    );
}

/* ─── SVG Season Trend Line ─── */
function SeasonTrendLine({ seasons }: { seasons: SeasonBucket[] }): ReactNode {
    if (seasons.length < 2) return null;

    const sorted = [...seasons].sort((a, b) => a.year - b.year);
    const rates = sorted.map(s => s.rate);
    const minRate = Math.max(Math.min(...rates) - 10, 0);
    const maxRate = Math.min(Math.max(...rates) + 10, 100);
    const range = maxRate - minRate || 1;

    const padding = { top: 20, right: 30, bottom: 35, left: 40 };
    const width = 400;
    const height = 180;
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const points = sorted.map((s, i) => ({
        x: padding.left + (i / (sorted.length - 1)) * chartW,
        y: padding.top + chartH - ((s.rate - minRate) / range) * chartH,
        rate: s.rate,
        year: s.year,
    }));

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    // Determine overall trend
    const firstRate = sorted[0].rate;
    const lastRate = sorted[sorted.length - 1].rate;
    const trendColor = lastRate >= firstRate ? '#00e59b' : '#ef4444';

    // Y-axis grid lines (3 lines)
    const yGridValues = [minRate, minRate + range / 2, maxRate];
    const yGridLines = yGridValues.map(v => ({
        y: padding.top + chartH - ((v - minRate) / range) * chartH,
        label: `${Math.round(v)}%`,
    }));

    return (
        <div className="ba-trend-wrapper">
            <svg viewBox={`0 0 ${width} ${height}`} className="ba-trend-svg" preserveAspectRatio="xMidYMid meet">
                {/* Grid lines */}
                {yGridLines.map((g, i) => (
                    <g key={i}>
                        <line
                            x1={padding.left}
                            y1={g.y}
                            x2={width - padding.right}
                            y2={g.y}
                            stroke="rgba(255,255,255,0.06)"
                            strokeDasharray="4 4"
                        />
                        <text x={padding.left - 6} y={g.y + 4} textAnchor="end" fill="#4b5563" fontSize="10">
                            {g.label}
                        </text>
                    </g>
                ))}

                {/* Trend line */}
                <path d={pathD} fill="none" stroke={trendColor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

                {/* Glow effect */}
                <path d={pathD} fill="none" stroke={trendColor} strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" opacity="0.15" />

                {/* Data points and labels */}
                {points.map((p, i) => (
                    <g key={sorted[i].year}>
                        {/* Outer glow */}
                        <circle cx={p.x} cy={p.y} r="6" fill={trendColor} opacity="0.15" />
                        {/* Dot */}
                        <circle cx={p.x} cy={p.y} r="4" fill="#1a1a2e" stroke={trendColor} strokeWidth="2" />
                        {/* Rate label */}
                        <text x={p.x} y={p.y - 12} textAnchor="middle" fill="#d1d5db" fontSize="10" fontWeight="600">
                            {Math.round(p.rate)}%
                        </text>
                        {/* Year label */}
                        <text x={p.x} y={height - 8} textAnchor="middle" fill="#6b7280" fontSize="10">
                            {p.year}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
}

/* ─── CSV Export ─── */
function generateCsv(data: AnalyticsData): string {
    const rows: string[][] = [['Category', 'Metric', 'Value', 'Details']];

    // Overall stats
    rows.push(['Overall', 'Break Rate', `${Math.round(data.overallRate)}%`, `${data.totalEvents} total events`]);
    rows.push(['Overall', 'Top Break Game', `Game ${data.topBreakGame}`, '']);
    rows.push(['Overall', 'Top Location', data.topLocation.toUpperCase(), '']);

    // Game breakdown
    for (const g of data.byGame) {
        rows.push([
            'Game Breakdown',
            `Game ${g.game}`,
            `${Math.round(g.rate)}%`,
            `${g.breaks} breaks in ${g.total} games`,
        ]);
    }

    // Home/Away
    rows.push(['Location', 'Home', `${Math.round(data.byLocation.home.rate)}%`, `${data.byLocation.home.breaks} of ${data.byLocation.home.total}`]);
    rows.push(['Location', 'Away', `${Math.round(data.byLocation.away.rate)}%`, `${data.byLocation.away.breaks} of ${data.byLocation.away.total}`]);

    // Seasons
    for (const s of data.bySeason) {
        rows.push([
            'Season',
            `${s.year}`,
            `${Math.round(s.rate)}%`,
            `${s.breaks} of ${s.total} games`,
        ]);
    }

    // Current season
    rows.push([
        'Current Season',
        `${data.currentSeason.year}`,
        `${Math.round(data.currentSeason.rate)}%`,
        `${data.currentSeason.breaks} of ${data.currentSeason.total} games`,
    ]);

    return rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
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

/* ─── Component ─── */
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

    const maxBarRate = Math.max(...data.byGame.map(g => g.rate), 1);
    const topGameData = data.byGame.find(g => g.game === data.topBreakGame);

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

            {/* ── Hero Insight Cards ── */}
            <div className="ba-hero-grid">
                {/* Most breaks */}
                <motion.div
                    className="ba-hero-card highlighted"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <span className="ba-hero-emoji">🎯</span>
                    <div className="ba-hero-label">Breaks the most at</div>
                    <div className="ba-hero-value" style={{ color: '#a78bfa' }}>
                        Game {data.topBreakGame}
                    </div>
                    <div className="ba-hero-sub" style={{ color: '#9ca3af' }}>
                        {topGameData ? `${Math.round(topGameData.rate)}% — ${topGameData.breaks} of ${topGameData.total} games` : ''}
                    </div>
                </motion.div>

                {/* Home vs Away */}
                <motion.div
                    className="ba-hero-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <span className="ba-hero-emoji">{data.topLocation === 'home' ? '🏠' : '✈️'}</span>
                    <div className="ba-hero-label">Breaks more when</div>
                    <div className="ba-hero-value" style={{ color: '#00e59b' }}>
                        {data.topLocation === 'home' ? 'HOME' : 'AWAY'}
                    </div>
                    <div className="ba-hero-sub" style={{ color: '#9ca3af' }}>
                        {Math.round(data.byLocation[data.topLocation].rate)}% of the time
                    </div>
                </motion.div>

                {/* Overall rate */}
                <motion.div
                    className="ba-hero-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <span className="ba-hero-emoji">📊</span>
                    <div className="ba-hero-label">All-time break rate</div>
                    <div className="ba-hero-value" style={{ color: rateColor(data.overallRate) }}>
                        {Math.round(data.overallRate)}%
                    </div>
                    <div className="ba-hero-sub" style={{ color: '#9ca3af' }}>
                        {rateVibe(data.overallRate)}
                    </div>
                </motion.div>

                {/* This season */}
                <motion.div
                    className="ba-hero-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <span className="ba-hero-emoji">🔥</span>
                    <div className="ba-hero-label">This season ({data.currentSeason.year})</div>
                    <div className="ba-hero-value" style={{ color: rateColor(data.currentSeason.rate) }}>
                        {Math.round(data.currentSeason.rate)}%
                    </div>
                    <div className="ba-hero-sub" style={{ color: '#9ca3af' }}>
                        {data.currentSeason.breaks} broke in {data.currentSeason.total} games
                    </div>
                </motion.div>
            </div>

            {/* ── Break Rate by Game # ── */}
            <div className="ba-bar-section">
                <div className="ba-section-header">
                    <span className="ba-section-icon">📈</span>
                    How often does the pattern break at each game?
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px', lineHeight: 1.5 }}>
                    When a team goes W-L-W-L back and forth, this shows how often that streak finally breaks at each game.
                </div>
                <div className="ba-bar-list">
                    {data.byGame.map((g, i) => (
                        <motion.div
                            key={g.game}
                            className={`ba-bar-row ${g.game === data.topBreakGame ? 'top-game' : ''}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.04 }}
                        >
                            <span className="ba-bar-label">
                                {g.game === data.topBreakGame ? '👑 ' : ''}Gm {g.game}
                            </span>
                            <div className="ba-bar-track">
                                {/* 50% grid line */}
                                <div className="ba-bar-gridline" />
                                <div
                                    className="ba-bar-fill"
                                    style={{
                                        width: `${(g.rate / maxBarRate) * 100}%`,
                                        background: g.game === data.topBreakGame
                                            ? 'linear-gradient(90deg, #a78bfa, #c4b5fd)'
                                            : barGradient(g.rate),
                                    }}
                                />
                            </div>
                            <span className="ba-bar-stats">
                                <span className="ba-bar-rate" style={{ color: rateColor(g.rate) }}>
                                    {Math.round(g.rate)}%
                                </span>
                                {' '}
                                <span style={{ color: '#4b5563' }}>
                                    ({g.breaks} of {g.total})
                                </span>
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="ba-divider" />

            {/* ── Home vs Away — Donut Chart ── */}
            <div className="ba-location-section">
                <div className="ba-section-header">
                    <span className="ba-section-icon">🏟️</span>
                    Do patterns break more at Home or Away?
                </div>
                <DonutChart
                    home={data.byLocation.home}
                    away={data.byLocation.away}
                    topLocation={data.topLocation}
                />
            </div>

            <div className="ba-divider" />

            {/* ── Season Breakdown ── */}
            <div className="ba-season-section">
                <div className="ba-section-header">
                    <span className="ba-section-icon">📅</span>
                    Season by season
                </div>
                <div className="ba-season-grid">
                    {data.bySeason.map((s, i) => {
                        const isCurrent = s.year === data.currentSeason.year;
                        return (
                            <motion.div
                                key={s.year}
                                className={`ba-season-card ${isCurrent ? 'current' : ''}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + i * 0.05 }}
                            >
                                {isCurrent && <span className="ba-current-tag">LIVE</span>}
                                <div className="ba-season-year">{s.year}</div>
                                <div
                                    className="ba-season-rate"
                                    style={{ color: rateColor(s.rate) }}
                                >
                                    {Math.round(s.rate)}%
                                </div>
                                <div className="ba-season-detail">
                                    {s.breaks} of {s.total} games
                                </div>
                                <div className="ba-season-bar-track">
                                    <div
                                        className="ba-season-bar-fill"
                                        style={{
                                            width: `${s.rate}%`,
                                            background: seasonBarColor(s.rate),
                                        }}
                                    />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <div className="ba-divider" />

            {/* ── Season Trend Line ── */}
            <div className="ba-trend-section">
                <div className="ba-section-header">
                    <span className="ba-section-icon">📉</span>
                    Break rate trend across seasons
                </div>
                <SeasonTrendLine seasons={data.bySeason} />
            </div>
        </motion.div>
    );
}
