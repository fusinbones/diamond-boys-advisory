'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Zap, TrendingUp, ChevronRight, ArrowUpDown, Lock, Gem, ArrowRight, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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

interface UserProfile {
    subscription_tier: string | null;
    trial_end: string | null;
    trial_bonus_days: number;
    course_purchaser?: boolean;
}

export default function MemberPatternsPage(): ReactNode {
    const { user, loading: authLoading } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [patterns, setPatterns] = useState<TeamPattern[]>([]);
    const [todayTeamIds, setTodayTeamIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState('');
    const [filter, setFilter] = useState<'all' | 'alternating' | 'developing' | 'today'>('all');
    const [sortBy, setSortBy] = useState<'altScore' | 'streak' | 'division'>('altScore');
    const [search, setSearch] = useState('');

    // Fetch profile for access check
    useEffect(() => {
        if (authLoading || !user) { setProfileLoading(false); return; }
        (async () => {
            const { data } = await supabase
                .from('user_profiles')
                .select('subscription_tier, trial_end, trial_bonus_days, course_purchaser')
                .eq('id', user.id)
                .single();
            if (data) setProfile(data);
            setProfileLoading(false);
        })();
    }, [user, authLoading]);

    // Access logic
    const isPaid = profile?.subscription_tier && ['starter', 'pro', 'elite', 'daily', 'weekly', 'monthly', 'season'].includes(profile.subscription_tier);
    const isCoursePurchaser = !!profile?.course_purchaser;
    const trialEnd = profile?.trial_end ? new Date(profile.trial_end) : (user ? new Date(new Date(user.created_at).getTime() + 7 * 86400000) : new Date());
    const bonusDays = profile?.trial_bonus_days || 0;
    const effectiveTrialEnd = new Date(trialEnd.getTime() + bonusDays * 86400000);
    const daysLeft = Math.max(0, Math.ceil((effectiveTrialEnd.getTime() - Date.now()) / 86400000));
    const trialActive = !isPaid && !isCoursePurchaser && daysLeft > 0;
    const hasAccess = isPaid || trialActive || isCoursePurchaser;

    const fetchPatterns = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/patterns');
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

    useEffect(() => {
        if (hasAccess) fetchPatterns();
        else setLoading(false);
    }, [hasAccess]);

    // Filtering & sorting
    let displayed = [...patterns];
    if (search.trim()) {
        const q = search.toLowerCase();
        displayed = displayed.filter(t =>
            t.teamName.toLowerCase().includes(q) ||
            t.division.toLowerCase().includes(q)
        );
    }
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

    // Loading state
    if (authLoading || profileLoading) {
        return (
            <div className="patterns-page">
                <div className="patterns-loading">
                    <div className="patterns-spinner" />
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    // Not logged in
    if (!user) {
        return (
            <div className="patterns-page">
                <div className="patterns-locked">
                    <Lock size={32} style={{ color: '#6b7280', marginBottom: '12px' }} />
                    <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Sign In Required</h2>
                    <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>Sign in to access the Pattern System</p>
                    <Link href="/dashboard" className="btn-glow" style={{ padding: '12px 28px', fontSize: '14px' }}>
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    // Paywall — no access
    if (!hasAccess) {
        return (
            <div className="patterns-page">
                <div className="patterns-paywall">
                    {/* Teaser header */}
                    <div className="patterns-paywall-header">
                        <ArrowUpDown size={28} style={{ color: '#a78bfa' }} />
                        <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800 }}>
                            Alternating Pattern System
                        </h1>
                        <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.6, maxWidth: '480px' }}>
                            Our proprietary W/L alternation algorithm scans all 30 MLB teams in real-time,
                            identifying high-probability break points backed by historical data.
                        </p>
                    </div>

                    {/* Blurred preview */}
                    <div className="patterns-preview-blur">
                        <div className="patterns-preview-row" />
                        <div className="patterns-preview-row" />
                        <div className="patterns-preview-row" />
                        <div className="patterns-preview-row" />
                        <div className="patterns-preview-row" />
                    </div>

                    {/* Lock overlay */}
                    <div className="patterns-paywall-overlay">
                        <div className="patterns-paywall-card">
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '50%',
                                background: 'rgba(0,229,155,0.1)', border: '2px solid rgba(0,229,155,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 16px',
                            }}>
                                <Lock size={24} style={{ color: '#00e59b' }} />
                            </div>
                            <h3 style={{ color: 'white', fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
                                {daysLeft > 0 ? `${daysLeft} Day${daysLeft !== 1 ? 's' : ''} Left` : 'Unlock Pattern System'}
                            </h3>
                            <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.5, marginBottom: '20px', maxWidth: '320px' }}>
                                Subscribe to access real-time alternation analysis, break probability scoring,
                                and next-game predictions for all 30 MLB teams.
                            </p>

                            {/* Feature bullets */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', textAlign: 'left' }}>
                                {[
                                    '30 MLB teams scanned in real-time',
                                    'Break probability scoring (62-99%)',
                                    'True Pattern & Developing alerts',
                                    'Today\'s games cross-referenced',
                                ].map((f, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Zap size={12} style={{ color: '#00e59b', flexShrink: 0 }} />
                                        <span style={{ color: '#d1d5db', fontSize: '12px' }}>{f}</span>
                                    </div>
                                ))}
                            </div>

                            <Link
                                href="/pricing"
                                className="btn-glow"
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: '8px', padding: '14px 28px', fontSize: '15px', fontWeight: 700, width: '100%',
                                }}
                            >
                                <Gem size={16} />
                                Unlock Full Access
                                <ArrowRight size={14} />
                            </Link>
                            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px' }}>
                                Plans start at $24.99/day · Cancel anytime
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Full access — Pattern System
    return (
        <div className="patterns-page">
            {/* Back nav */}
            <div style={{ marginBottom: '16px' }}>
                <Link href="/dashboard" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    color: '#6b7280', fontSize: '12px', textDecoration: 'none',
                }}>
                    <ArrowLeft size={14} /> Back to Dashboard
                </Link>
            </div>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="patterns-header"
            >
                <div>
                    <h1 className="patterns-title">
                        <ArrowUpDown size={20} style={{ color: '#a78bfa' }} />
                        Pattern System
                    </h1>
                    <p className="patterns-subtitle">
                        W/L alternation analysis for all 30 MLB teams
                        {lastUpdated && <span> · Updated {lastUpdated}</span>}
                    </p>
                </div>
                <button onClick={fetchPatterns} disabled={loading} className="patterns-refresh-btn">
                    <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    Refresh
                </button>
            </motion.div>

            {/* Summary Cards */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="patterns-summary"
            >
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
            </motion.div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search team or division..."
                    className="patterns-search"
                />
            </div>

            {/* Filters & Sort */}
            <div className="patterns-controls">
                {[
                    { key: 'all' as const, label: 'All Teams' },
                    { key: 'alternating' as const, label: `🔥 True (${altCount})` },
                    { key: 'developing' as const, label: `👀 Dev (${devCount})` },
                    { key: 'today' as const, label: `⚾ Today` },
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
                <div className="patterns-loading">
                    <div className="patterns-spinner" />
                    <span>Scanning all 30 teams...</span>
                </div>
            ) : displayed.length === 0 ? (
                <div className="patterns-empty">
                    <ArrowUpDown size={24} style={{ marginBottom: '8px', opacity: 0.3 }} />
                    <p>No teams match this filter.</p>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="patterns-list"
                >
                    {displayed.map(team => (
                        <TeamRow
                            key={team.teamId}
                            team={team}
                            isPlayingToday={todayTeamIds.includes(team.teamId)}
                        />
                    ))}
                </motion.div>
            )}
        </div>
    );
}

function TeamRow({ team, isPlayingToday }: { team: TeamPattern; isPlayingToday: boolean }): ReactNode {
    const [expanded, setExpanded] = useState(false);

    const isBreak = team.predictionType === 'break';
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

                {/* Pattern dots */}
                <div className="pattern-dots">
                    {(() => {
                        const results = team.recentResults.slice(0, 15);
                        const reversed = [...results].reverse();
                        const streakStart = reversed.length - team.altStreak;
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
                                            {isStreakStart && i > 0 && (
                                                <div className="pattern-streak-divider" />
                                            )}
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
                    <div className="pattern-alt-score">
                        <div className="value" style={{
                            color: team.altScore >= 70 ? '#a78bfa' : team.altScore >= 50 ? '#fbbf24' : '#4b5563',
                        }}>
                            {team.altScore}%
                        </div>
                        <div className="label">Break</div>
                    </div>

                    {team.altStreak >= 4 && (
                        <div className="pattern-streak-badge" style={{
                            background: `${accentColor}18`,
                            border: `1px solid ${accentColor}30`,
                        }}>
                            <Zap size={10} style={{ color: accentColor }} />
                            <span style={{ color: accentColor }}>{team.altStreak}</span>
                        </div>
                    )}

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
                </div>
            )}
        </div>
    );
}
