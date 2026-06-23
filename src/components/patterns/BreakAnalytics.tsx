'use client';

import { useState, useEffect, type ReactNode } from 'react';
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

/* ─── Component ─── */
export default function BreakAnalytics(): ReactNode {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchAnalytics = async () => {
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
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

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
                            <span className="ba-bar-label">Gm {g.game}</span>
                            <div className="ba-bar-track">
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

            {/* ── Home vs Away ── */}
            <div className="ba-location-section">
                <div className="ba-section-header">
                    <span className="ba-section-icon">🏟️</span>
                    Do patterns break more at Home or Away?
                </div>
                <div className="ba-location-grid">
                    {(['home', 'away'] as const).map(loc => {
                        const d = data.byLocation[loc];
                        const isWinner = data.topLocation === loc;
                        return (
                            <motion.div
                                key={loc}
                                className={`ba-location-card ${isWinner ? 'winner' : ''}`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <div
                                    className="ba-location-badge"
                                    style={{
                                        background: isWinner ? 'rgba(0,229,155,0.1)' : 'rgba(255,255,255,0.05)',
                                        color: isWinner ? '#00e59b' : '#6b7280',
                                    }}
                                >
                                    {loc === 'home' ? '🏠' : '✈️'} {loc.toUpperCase()}
                                </div>
                                <div
                                    className="ba-location-rate"
                                    style={{ color: isWinner ? '#00e59b' : '#d1d5db' }}
                                >
                                    {Math.round(d.rate)}%
                                </div>
                                <div className="ba-location-detail">
                                    {d.breaks} broke in {d.total} games
                                </div>
                                {isWinner && (
                                    <span className="ba-location-tag">↑ BREAKS MORE HERE</span>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
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
        </motion.div>
    );
}
