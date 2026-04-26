'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/lib/adminAuth';
import { RefreshCw, Zap, TrendingUp, ChevronRight, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import './patterns.css';

interface GameResult {
    date: string;
    result: 'W' | 'L';
    opponent: string;
    score: string;
}

interface TeamPattern {
    teamId: number;
    teamName: string;
    logo: string;
    division: string;
    recentResults: GameResult[];
    pattern: string;
    altStreak: number;
    isAlternating: boolean;
    isDeveloping: boolean;
    nextPrediction: 'W' | 'L' | null;
    predictionType: 'continue' | 'break' | null;
    altScore: number;
}

export default function PatternsPage() {
    useAdminAuth();
    const [patterns, setPatterns] = useState<TeamPattern[]>([]);
    const [todayTeamIds, setTodayTeamIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState('');
    const [filter, setFilter] = useState<'all' | 'alternating' | 'developing' | 'today'>('all');
    const [sortBy, setSortBy] = useState<'altScore' | 'streak' | 'division'>('altScore');

    const fetchPatterns = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/patterns');
            const data = await res.json();
            setPatterns(data.patterns || []);
            setTodayTeamIds(data.todayTeamIds || []);
            setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
        } catch {
            // Silent
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPatterns(); }, []);

    let displayed = [...patterns];
    if (filter === 'alternating') displayed = displayed.filter(t => t.isAlternating);
    if (filter === 'developing') displayed = displayed.filter(t => t.isDeveloping || t.isAlternating);
    if (filter === 'today') displayed = displayed.filter(t => todayTeamIds.includes(t.teamId));

    if (sortBy === 'streak') {
        displayed.sort((a, b) => b.altStreak - a.altStreak);
    } else if (sortBy === 'division') {
        displayed.sort((a, b) => a.division.localeCompare(b.division));
    }

    const altCount = patterns.filter(t => t.isAlternating).length;
    const devCount = patterns.filter(t => t.isDeveloping).length;
    const todayAltCount = patterns.filter(t => (t.isAlternating || t.isDeveloping) && todayTeamIds.includes(t.teamId)).length;

    return (
        <div>
            {/* Header */}
            <div className="patterns-header">
                <div>
                    <h1 className="patterns-title">
                        <ArrowUpDown size={20} style={{ color: '#a78bfa' }} />
                        Alternating Pattern Master
                    </h1>
                    <p className="patterns-subtitle">
                        W/L alternation analysis for all 30 MLB teams
                        {lastUpdated && <span> · Updated {lastUpdated}</span>}
                    </p>
                </div>
                <button onClick={fetchPatterns} disabled={loading} className="admin-btn admin-btn-secondary" style={{ gap: '6px' }}>
                    <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="patterns-summary">
                <div className="patterns-summary-card" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)' }}>
                    <div className="value" style={{ color: '#a78bfa' }}>{altCount}</div>
                    <div className="label">🔥 True Pattern</div>
                </div>
                <div className="patterns-summary-card" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
                    <div className="value" style={{ color: '#fbbf24' }}>{devCount}</div>
                    <div className="label">👀 Developing</div>
                </div>
                <div className="patterns-summary-card" style={{ background: 'rgba(0,229,155,0.06)', border: '1px solid rgba(0,229,155,0.15)' }}>
                    <div className="value" style={{ color: '#00e59b' }}>{todayAltCount}</div>
                    <div className="label">⚾ Today</div>
                </div>
            </div>

            {/* Filters & Sort */}
            <div className="patterns-controls">
                {[
                    { key: 'all' as const, label: 'All Teams' },
                    { key: 'alternating' as const, label: `🔥 True Pattern (${altCount})` },
                    { key: 'developing' as const, label: `👀 Developing (${devCount})` },
                    { key: 'today' as const, label: `⚾ Playing Today` },
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className="patterns-filter-btn"
                        style={{
                            background: filter === f.key ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
                            color: filter === f.key ? '#a78bfa' : '#6b7280',
                        }}
                    >
                        {f.label}
                    </button>
                ))}
                <div className="patterns-sort-group">
                    {[
                        { key: 'altScore' as const, label: 'Break %' },
                        { key: 'streak' as const, label: 'Streak' },
                        { key: 'division' as const, label: 'Division' },
                    ].map(s => (
                        <button
                            key={s.key}
                            onClick={() => setSortBy(s.key)}
                            className="patterns-sort-btn"
                            style={{
                                background: sortBy === s.key ? 'rgba(255,255,255,0.08)' : 'transparent',
                                color: sortBy === s.key ? 'white' : '#4b5563',
                            }}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Team List */}
            {loading ? (
                <div className="admin-loader"><div className="admin-spinner" /> Scanning all 30 teams...</div>
            ) : displayed.length === 0 ? (
                <div className="admin-empty">
                    <ArrowUpDown size={24} style={{ marginBottom: '8px', opacity: 0.3 }} />
                    <p>No teams match this filter.</p>
                </div>
            ) : (
                <div className="patterns-list">
                    {displayed.map(team => (
                        <TeamRow
                            key={team.teamId}
                            team={team}
                            isPlayingToday={todayTeamIds.includes(team.teamId)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function TeamRow({ team, isPlayingToday }: { team: TeamPattern; isPlayingToday: boolean }) {
    const [expanded, setExpanded] = useState(false);

    const isBreak = team.predictionType === 'break';
    // Color tiers: TRUE pattern = orange, DEVELOPING = amber, none = default
    const accentColor = team.isAlternating ? '#fb923c' : team.isDeveloping ? '#fbbf24' : '#a78bfa';
    const isHighlighted = team.isAlternating || team.isDeveloping;

    return (
        <div
            className="pattern-row"
            style={{
                background: isHighlighted
                    ? `linear-gradient(135deg, ${accentColor}08 0%, ${accentColor}04 100%)`
                    : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isHighlighted ? `${accentColor}25` : 'rgba(255,255,255,0.06)'}`,
            }}
        >
            <button className="pattern-row-btn" onClick={() => setExpanded(!expanded)}>
                {/* Team logo + name */}
                <div className="pattern-team-info">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={team.logo} alt={team.teamName} className="pattern-team-logo" />
                    <div>
                        <div className="pattern-team-name">
                            {team.teamName}
                            {isPlayingToday && <span className="pattern-today-badge">TODAY</span>}
                        </div>
                        <div className="pattern-team-division">{team.division}</div>
                    </div>
                </div>

                {/* Pattern dots — oldest→newest (left→right), streak highlighted */}
                <div className="pattern-dots">
                    {(() => {
                        const results = team.recentResults.slice(0, 15);
                        const reversed = [...results].reverse(); // oldest first
                        const streakStart = reversed.length - team.altStreak; // index where streak begins
                        const hasStreak = team.altStreak >= 4;

                        return (
                            <>
                                {reversed.map((g, i) => {
                                    const inStreak = hasStreak && i >= streakStart;
                                    const isStreakStart = hasStreak && i === streakStart;
                                    const dotClass = [
                                        'pattern-dot',
                                        hasStreak && !inStreak ? 'dimmed' : '',
                                        inStreak ? 'streak' : '',
                                        inStreak ? (g.result === 'W' ? 'win' : 'loss') : '',
                                    ].filter(Boolean).join(' ');

                                    return (
                                        <span key={i} style={{ display: 'contents' }}>
                                            {/* Divider before streak starts */}
                                            {isStreakStart && i > 0 && (
                                                <div className="pattern-streak-divider" />
                                            )}
                                            {/* Connector between streak dots */}
                                            {inStreak && !isStreakStart && (
                                                <div
                                                    className="pattern-streak-connector"
                                                    style={{ background: g.result === 'W' ? 'rgba(0,229,155,0.4)' : 'rgba(239,68,68,0.4)' }}
                                                />
                                            )}
                                            <div
                                                className={dotClass}
                                                title={`${g.result} ${g.score} ${g.opponent} (${g.date})`}
                                                style={{
                                                    background: g.result === 'W' ? 'rgba(0,229,155,0.15)' : 'rgba(239,68,68,0.15)',
                                                    color: g.result === 'W' ? '#00e59b' : '#ef4444',
                                                    border: `1px solid ${g.result === 'W' ? 'rgba(0,229,155,0.25)' : 'rgba(239,68,68,0.25)'}`,
                                                }}
                                            >
                                                {g.result}
                                            </div>
                                        </span>
                                    );
                                })}
                                {/* Break point indicator */}
                                {hasStreak && team.nextPrediction && (
                                    <>
                                        <span className="pattern-break-arrow" style={{ color: isBreak ? '#fb923c' : '#a78bfa' }}>→</span>
                                        <div className="pattern-break-wrapper">
                                            <span className="pattern-break-label" style={{ color: isBreak ? '#fb923c' : '#a78bfa' }}>
                                                {isBreak ? '⚡BREAK' : 'NEXT'}
                                            </span>
                                            <div
                                                className={`pattern-break-dot ${isBreak ? 'break-mode' : ''}`}
                                                style={{
                                                    background: team.nextPrediction === 'W'
                                                        ? (isBreak ? 'rgba(0,229,155,0.25)' : 'rgba(0,229,155,0.15)')
                                                        : (isBreak ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.15)'),
                                                    color: team.nextPrediction === 'W' ? '#00e59b' : '#ef4444',
                                                    border: `2px dashed ${team.nextPrediction === 'W' ? 'rgba(0,229,155,0.4)' : 'rgba(239,68,68,0.4)'}`,
                                                }}
                                            >
                                                {team.nextPrediction}?
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        );
                    })()}
                    {team.recentResults.length === 0 && (
                        <span style={{ color: '#374151', fontSize: '11px' }}>No recent games</span>
                    )}
                </div>

                {/* Metrics */}
                <div className="pattern-metrics">
                    {/* Alt Score */}
                    <div className="pattern-alt-score">
                        <div className="value" style={{
                            color: team.altScore >= 70 ? '#a78bfa' : team.altScore >= 50 ? '#fbbf24' : '#4b5563',
                        }}>
                            {team.altScore}%
                        </div>
                        <div className="label">Break</div>
                    </div>

                    {/* Streak badge */}
                    {team.altStreak >= 4 && (
                        <div className="pattern-streak-badge" style={{
                            background: `${accentColor}18`,
                            border: `1px solid ${accentColor}30`,
                        }}>
                            <Zap size={10} style={{ color: accentColor }} />
                            <span style={{ color: accentColor }}>{team.altStreak}</span>
                        </div>
                    )}

                    {/* Prediction */}
                    {team.nextPrediction && (
                        <div className="pattern-prediction">
                            <div className="pattern-prediction-box" style={{
                                background: team.nextPrediction === 'W' ? 'rgba(0,229,155,0.15)' : 'rgba(239,68,68,0.15)',
                                color: team.nextPrediction === 'W' ? '#00e59b' : '#ef4444',
                                border: `2px dashed ${team.nextPrediction === 'W' ? 'rgba(0,229,155,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            }}>
                                {team.nextPrediction}?
                            </div>
                            <span className="pattern-prediction-label" style={{ color: accentColor }}>
                                {isBreak ? '⚡BREAK' : 'HOLD'}
                            </span>
                        </div>
                    )}

                    <ChevronRight
                        size={14}
                        style={{
                            color: '#4b5563',
                            transform: expanded ? 'rotate(90deg)' : 'none',
                            transition: 'transform 0.2s',
                            flexShrink: 0,
                        }}
                    />
                </div>
            </button>

            {/* Expanded Detail */}
            {expanded && (
                <div className="pattern-expanded">
                    <div className="pattern-games-grid">
                        {[...team.recentResults].reverse().map((g, i) => (
                            <div
                                key={i}
                                className="pattern-game-card"
                                style={{ border: `1px solid ${g.result === 'W' ? 'rgba(0,229,155,0.12)' : 'rgba(239,68,68,0.12)'}` }}
                            >
                                <div className="pattern-game-header">
                                    <span className="pattern-game-result" style={{
                                        color: g.result === 'W' ? '#00e59b' : '#ef4444',
                                    }}>
                                        {g.result === 'W' ? '✅ WIN' : '❌ LOSS'}
                                    </span>
                                    <span className="pattern-game-date">
                                        {new Date(g.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                <div className="pattern-game-opponent">{g.opponent}</div>
                                <div className="pattern-game-score">{g.score}</div>
                            </div>
                        ))}
                    </div>

                    {isPlayingToday && team.isAlternating && (
                        <div style={{ marginTop: '10px' }}>
                            <Link
                                href="/admin/analysis"
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    padding: '8px 14px',
                                    background: `linear-gradient(135deg, ${accentColor}18, ${accentColor}0a)`,
                                    border: `1px solid ${accentColor}30`,
                                    borderRadius: '8px', textDecoration: 'none',
                                    color: accentColor, fontSize: '12px', fontWeight: 600,
                                }}
                            >
                                <TrendingUp size={13} />
                                Analyze {team.teamName}&apos;s Game →
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
