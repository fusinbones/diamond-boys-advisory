'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, TrendingUp, Target, Calendar, RefreshCw, Filter } from 'lucide-react';
import './FirePicksHistory.css';

// ── Types ──────────────────────────────────────────────
interface FirePick {
    id: string;
    matchup: string;
    sport: string;
    pick_type?: string;
    pick_team?: string;
    pick_value?: string;
    odds?: string;
    confidence?: number;
    units?: number;
    reasoning?: string;
    scheduled_at: string;
    status: string; // 'scheduled', 'revealed', 'won', 'lost', 'push'
    result?: string;
    pattern_break_game?: number;
    pattern_data?: Record<string, unknown>;
}

type ResultFilter = 'all' | 'won' | 'lost' | 'pending';

// ── Helpers ────────────────────────────────────────────
const SPORT_EMOJI: Record<string, string> = {
    MLB: '⚾',
    NBA: '🏀',
    NFL: '🏈',
    NHL: '🏒',
};

function getSportEmoji(sport: string): string {
    return SPORT_EMOJI[sport.toUpperCase()] || '⚾';
}

function getResultBadge(status: string): { label: string; emoji: string; color: string; bg: string; border: string } {
    switch (status) {
        case 'won':
            return { label: 'WON', emoji: '✅', color: '#FFC107', bg: 'rgba(106,0,255,0.1)', border: 'rgba(106,0,255,0.25)' };
        case 'lost':
            return { label: 'LOST', emoji: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' };
        case 'push':
            return { label: 'PUSH', emoji: '🔄', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)' };
        default:
            return { label: 'PENDING', emoji: '⏳', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)' };
    }
}

function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

function formatTime(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch {
        return '';
    }
}

function buildPickLabel(pick: FirePick): string {
    // Avoid showing "Yankees Yankees ML" — just show "Yankees ML"
    if (pick.pick_team && pick.pick_value) {
        const val = pick.pick_value.trim();
        // If pick_value already starts with the team name, just use pick_value
        if (val.toLowerCase().startsWith(pick.pick_team.toLowerCase())) {
            return val;
        }
        return `${pick.pick_team} ${val}`;
    }
    if (pick.pick_team) return pick.pick_team;
    if (pick.pick_value) return pick.pick_value;
    if (pick.pick_type) return pick.pick_type;
    return 'Pick';
}

function getHomeAway(matchup: string, pickTeam?: string): { label: string; emoji: string; color: string } | null {
    if (!pickTeam || !matchup) return null;
    // Matchup format: "Away Team @ Home Team"
    const parts = matchup.split('@').map(s => s.trim());
    if (parts.length !== 2) return null;
    const awayTeam = parts[0].toLowerCase();
    const homeTeam = parts[1].toLowerCase();
    const pick = pickTeam.toLowerCase();
    if (homeTeam.includes(pick) || pick.includes(homeTeam.split(' ').pop() || '')) {
        return { label: 'HOME', emoji: '🏠', color: '#FFC107' };
    }
    if (awayTeam.includes(pick) || pick.includes(awayTeam.split(' ').pop() || '')) {
        return { label: 'AWAY', emoji: '✈️', color: '#60a5fa' };
    }
    return null;
}

// ── Component ──────────────────────────────────────────
export default function FirePicksHistory(): ReactNode {
    const [picks, setPicks] = useState<FirePick[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resultFilter, setResultFilter] = useState<ResultFilter>('all');

    const fetchPicks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/fire-picks');
            if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);
            const data = await res.json();
            setPicks(data.firePicks || []);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to load picks';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPicks();
    }, [fetchPicks]);

    // ── Stats ──
    const won = picks.filter(p => p.status === 'won').length;
    const lost = picks.filter(p => p.status === 'lost').length;
    const push = picks.filter(p => p.status === 'push').length;
    const pending = picks.filter(p => !['won', 'lost', 'push'].includes(p.status)).length;
    const decided = won + lost;
    const winRate = decided > 0 ? Math.round((won / decided) * 100) : 0;

    // Current streak
    const decidedPicks = picks.filter(p => p.status === 'won' || p.status === 'lost');
    let streakCount = 0;
    let streakType: 'W' | 'L' | null = null;
    for (const p of decidedPicks) {
        if (streakType === null) {
            streakType = p.status === 'won' ? 'W' : 'L';
            streakCount = 1;
        } else if ((p.status === 'won' && streakType === 'W') || (p.status === 'lost' && streakType === 'L')) {
            streakCount++;
        } else {
            break;
        }
    }

    // ── Filtered list ──
    const filtered = picks.filter(p => {
        if (resultFilter === 'won') return p.status === 'won';
        if (resultFilter === 'lost') return p.status === 'lost';
        if (resultFilter === 'pending') return !['won', 'lost', 'push'].includes(p.status);
        return true;
    });

    // ── Loading state ──
    if (loading) {
        return (
            <div className="fph-loading">
                <div className="fph-spinner" />
                <span>Loading Fire Picks history...</span>
            </div>
        );
    }

    // ── Error state ──
    if (error) {
        return (
            <div className="fph-error">
                <Flame size={20} style={{ opacity: 0.4 }} />
                <p>{error}</p>
                <button onClick={fetchPicks} className="fph-retry-btn">
                    <RefreshCw size={12} /> Retry
                </button>
            </div>
        );
    }

    // ── Empty state ──
    if (picks.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="fph-empty"
            >
                <Flame size={28} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <p style={{ color: '#6b7280', fontSize: '14px' }}>No Fire Picks yet.</p>
                <p style={{ color: '#4b5563', fontSize: '12px' }}>When picks are made, they&apos;ll appear here with full results tracking.</p>
            </motion.div>
        );
    }

    return (
        <div className="fph-container">
            {/* ── Summary Cards ── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="fph-summary"
            >
                <div className="fph-stat-card">
                    <Target size={14} style={{ color: '#a78bfa' }} />
                    <div className="fph-stat-value" style={{ color: '#a78bfa' }}>
                        {won}-{lost}{push > 0 ? `-${push}` : ''}
                    </div>
                    <div className="fph-stat-label">Record</div>
                </div>

                <div className="fph-stat-card">
                    <TrendingUp size={14} style={{ color: winRate >= 60 ? '#22c55e' : winRate >= 50 ? '#fbbf24' : '#ef4444' }} />
                    <div className="fph-stat-value" style={{ color: winRate >= 60 ? '#22c55e' : winRate >= 50 ? '#fbbf24' : '#ef4444' }}>
                        {decided > 0 ? `${winRate}%` : '—'}
                    </div>
                    <div className="fph-stat-label">Win Rate</div>
                </div>

                <div className="fph-stat-card">
                    <Flame size={14} style={{ color: streakType === 'W' ? '#FFC107' : streakType === 'L' ? '#ef4444' : '#6b7280' }} />
                    <div className="fph-stat-value" style={{ color: streakType === 'W' ? '#FFC107' : streakType === 'L' ? '#ef4444' : '#6b7280' }}>
                        {streakCount > 0 ? `${streakCount}${streakType}` : '—'}
                    </div>
                    <div className="fph-stat-label">Streak</div>
                </div>

                <div className="fph-stat-card">
                    <Calendar size={14} style={{ color: '#6b7280' }} />
                    <div className="fph-stat-value" style={{ color: '#9ca3af' }}>
                        {pending}
                    </div>
                    <div className="fph-stat-label">Pending</div>
                </div>
            </motion.div>

            {/* ── Filter Tabs ── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="fph-filters"
            >
                <Filter size={12} style={{ color: '#4b5563', flexShrink: 0 }} />
                {([
                    { key: 'all' as const, label: `All (${picks.length})` },
                    { key: 'won' as const, label: `Won (${won})` },
                    { key: 'lost' as const, label: `Lost (${lost})` },
                    { key: 'pending' as const, label: `Pending (${pending})` },
                ] as const).map(f => (
                    <button
                        key={f.key}
                        onClick={() => setResultFilter(f.key)}
                        className="fph-filter-btn"
                        style={{
                            background: resultFilter === f.key ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
                            color: resultFilter === f.key ? '#a78bfa' : '#6b7280',
                            borderColor: resultFilter === f.key ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.06)',
                        }}
                    >
                        {f.label}
                    </button>
                ))}

                <button onClick={fetchPicks} className="fph-refresh-btn" title="Refresh">
                    <RefreshCw size={12} />
                </button>
            </motion.div>

            {/* ── Picks List ── */}
            <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                    <motion.div
                        key="empty-filter"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fph-empty-filter"
                    >
                        <p>No picks match this filter.</p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="picks-list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fph-picks-list"
                    >
                        {filtered.map((pick, idx) => (
                            <PickCard key={pick.id} pick={pick} index={idx} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Pick Card ──────────────────────────────────────────
function PickCard({ pick, index }: { pick: FirePick; index: number }): ReactNode {
    const badge = getResultBadge(pick.status);
    const pickLabel = buildPickLabel(pick);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ delay: Math.min(index * 0.03, 0.3) }}
            className="fph-pick-card"
        >
            {/* Left: Date + Sport */}
            <div className="fph-pick-date-col">
                <span className="fph-pick-sport">{getSportEmoji(pick.sport)}</span>
                <div className="fph-pick-date">
                    <span className="fph-pick-date-main">{formatDate(pick.scheduled_at)}</span>
                    <span className="fph-pick-date-time">{formatTime(pick.scheduled_at)}</span>
                </div>
            </div>

            {/* Center: Matchup + Pick */}
            <div className="fph-pick-info">
                <div className="fph-pick-matchup">{pick.matchup}</div>
                <div className="fph-pick-detail">
                    <span className="fph-pick-label">{pickLabel}</span>
                    {pick.odds && <span className="fph-pick-odds">({pick.odds})</span>}
                    {(() => {
                        const ha = getHomeAway(pick.matchup, pick.pick_team);
                        return ha ? (
                            <span style={{
                                fontSize: '10px', fontWeight: 600, padding: '1px 6px',
                                borderRadius: '4px', letterSpacing: '0.5px',
                                background: ha.color === '#FFC107' ? 'rgba(106,0,255,0.1)' : 'rgba(96,165,250,0.1)',
                                color: ha.color,
                                border: `1px solid ${ha.color === '#FFC107' ? 'rgba(106,0,255,0.2)' : 'rgba(96,165,250,0.2)'}`,
                            }}>
                                {ha.emoji} {ha.label}
                            </span>
                        ) : null;
                    })()}
                    {pick.pattern_break_game && (
                        <span className="fph-pick-break" title="Pattern break game #">
                            🔥 G#{pick.pattern_break_game}
                        </span>
                    )}
                </div>
                {pick.confidence && (
                    <div className="fph-pick-confidence">
                        <div className="fph-confidence-bar">
                            <div
                                className="fph-confidence-fill"
                                style={{
                                    width: `${pick.confidence}%`,
                                    background: pick.confidence >= 80 ? '#FFC107' : pick.confidence >= 60 ? '#fbbf24' : '#6b7280',
                                }}
                            />
                        </div>
                        <span className="fph-confidence-text">{pick.confidence}%</span>
                    </div>
                )}
            </div>

            {/* Right: Result Badge */}
            <div
                className="fph-pick-result"
                style={{
                    background: badge.bg,
                    borderColor: badge.border,
                    color: badge.color,
                }}
            >
                <span>{badge.emoji}</span>
                <span className="fph-result-text">{badge.label}</span>
            </div>
        </motion.div>
    );
}
