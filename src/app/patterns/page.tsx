'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Zap, TrendingUp, ChevronRight, ArrowUpDown, Lock, Gem, ArrowRight, ArrowLeft, Search, Bell } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import './patterns.css';
import FirePicksHistory from '@/components/patterns/FirePicksHistory';
import BreakAnalytics from '@/components/patterns/BreakAnalytics';

interface GameResult {
    date: string;
    result: 'W' | 'L';
    opponent: string;
    score: string;
}

interface PitcherMilestone {
    pitcherName: string;
    currentWins: number;
    targetWin: number;
}

interface WalkoffRevenge {
    walkoffTeam: string;
    losingTeam: string;
    walkoffPlayer?: string;
    score: string;
    date: string;
    isWalkoffTeam: boolean;
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
    pitcherMilestone?: PitcherMilestone | null;
    walkoffRevenge?: WalkoffRevenge | null;
    nextGame?: {
        opponent: string;
        opponentLogo: string;
        gameTime: string;
        isHome: boolean;
    } | null;
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
    const [filter, setFilter] = useState<'all' | 'alternating' | 'developing' | 'today' | 'alerts' | 'history' | 'analytics'>('all');
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

    // Access logic — Pattern System is a standalone product ($49.99/mo)
    // Other tiers (daily/weekly/monthly/season) only get stats & fire picks
    const isPatternSubscriber = profile?.subscription_tier === 'pattern';
    const isCoursePurchaser = !!profile?.course_purchaser;
    const hasAccess = isPatternSubscriber || isCoursePurchaser;

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
    if (filter === 'alerts') displayed = displayed.filter(t => t.pitcherMilestone || t.walkoffRevenge);

    if (sortBy === 'streak') {
        displayed.sort((a, b) => b.altStreak - a.altStreak);
    } else if (sortBy === 'division') {
        displayed.sort((a, b) => a.division.localeCompare(b.division));
    }

    const altCount = patterns.filter(t => t.isAlternating).length;
    const devCount = patterns.filter(t => t.isDeveloping).length;
    const todayAltCount = patterns.filter(t => (t.isAlternating || t.isDeveloping) && todayTeamIds.includes(t.teamId)).length;
    const alertCount = patterns.filter(t => t.pitcherMilestone || t.walkoffRevenge).length;

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

    // No access — show paywall (logged out OR wrong tier)
    if (!hasAccess) {
        return (
            <div className="patterns-page">
                <div className="patterns-paywall">
                    {/* Urgency banner */}
                    <div className="pw-urgency-banner">
                        <span className="pw-urgency-dot" />
                        <span>LIVE — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} games are being scanned now</span>
                    </div>

                    {/* Hero */}
                    <div className="pw-hero">
                        <div className="pw-badge">
                            <Zap size={12} />
                            THE .500 METHOD
                        </div>
                        <h1 className="pw-title">
                            You&apos;re Missing Today&apos;s<br />
                            <span className="pw-title-accent">Pattern Breaks</span>
                        </h1>
                        <p className="pw-subtitle">
                            Our algorithm just scanned all 30 MLB teams. High-probability break points
                            have been identified — but you need access to see them.
                        </p>
                    </div>

                    {/* Live stats */}
                    <div className="pw-stats">
                        <div className="pw-stat">
                            <div className="pw-stat-value" style={{ color: '#a78bfa' }}>30</div>
                            <div className="pw-stat-label">Teams Scanned</div>
                        </div>
                        <div className="pw-stat">
                            <div className="pw-stat-value" style={{ color: '#FFC107' }}>62-99%</div>
                            <div className="pw-stat-label">Break Accuracy</div>
                        </div>
                        <div className="pw-stat">
                            <div className="pw-stat-value" style={{ color: '#fbbf24' }}>LIVE</div>
                            <div className="pw-stat-label">Updated Today</div>
                        </div>
                    </div>

                    {/* Blurred preview — looks like real data behind glass */}
                    <div className="pw-preview-section">
                        <p className="pw-preview-label">
                            <Lock size={12} />
                            Today&apos;s Pattern Data (Locked)
                        </p>
                        <div className="pw-preview-glass">
                            {[
                                { name: 'Yankees', dots: 'WLWLWLW', pct: '73%', badge: '\ud83d\udd25 TRUE' },
                                { name: 'Dodgers', dots: 'WLWLWL', pct: '62%', badge: '\ud83c\udfaf W#10' },
                                { name: 'Red Sox', dots: 'WLWLW', pct: '15%', badge: '\ud83d\udca3 REVENGE' },
                                { name: 'Astros', dots: 'WLWLWL', pct: '62%', badge: '\ud83d\udc40 DEV' },
                                { name: 'Phillies', dots: 'WLWLWLWL', pct: '88%', badge: '\ud83d\udd25 TRUE' },
                            ].map((team, i) => (
                                <div key={i} className="pw-preview-row">
                                    <span className="pw-preview-name">{team.name}</span>
                                    <span className="pw-preview-dots">{team.dots}</span>
                                    <span className="pw-preview-pct">{team.pct}</span>
                                    <span className="pw-preview-badge">{team.badge}</span>
                                </div>
                            ))}
                            <div className="pw-preview-fade" />
                        </div>
                    </div>

                    {/* CTA card */}
                    <div className="pw-cta-card">
                        <h3 className="pw-cta-title">Unlock the Pattern System</h3>
                        <div className="pw-price-row">
                            <span className="pw-price">$49.99</span>
                            <span className="pw-price-period">/month</span>
                        </div>

                        <div className="pw-features">
                            {[
                                'Real-time W/L alternation analysis',
                                'Break probability scoring (62-99%)',
                                'Pitcher milestone alerts (Win #10)',
                                'Walk-off HR revenge detection',
                                'Smart filters, search & sorting',
                                'Situational alerts dashboard',
                            ].map((f, i) => (
                                <div key={i} className="pw-feature">
                                    <Zap size={11} style={{ color: '#FFC107', flexShrink: 0 }} />
                                    <span>{f}</span>
                                </div>
                            ))}
                        </div>

                        <Link href="/pattern-system/checkout" className="pw-cta-btn">
                            <Gem size={18} />
                            Get Instant Access
                            <ArrowRight size={16} />
                        </Link>

                        <div className="pw-trust">
                            <span>🔒 256-bit SSL</span>
                            <span>·</span>
                            <span>Cancel anytime</span>
                            <span>·</span>
                            <span>Authorize.net secured</span>
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
                <div className="patterns-summary-card" style={{ background: 'rgba(106,0,255,0.06)', border: '1px solid rgba(106,0,255,0.15)' }}>
                    <div className="value" style={{ color: '#FFC107' }}>{todayAltCount}</div>
                    <div className="label">⚾ Today</div>
                </div>
            </motion.div>

            {/* Situational Alerts */}
            {alertCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="patterns-alerts"
                >
                    <div className="patterns-alerts-header">
                        <Bell size={14} />
                        Situational Alerts
                        <span className="patterns-alerts-count">{alertCount}</span>
                    </div>
                    {patterns.filter(t => t.pitcherMilestone).map(t => (
                        <div key={`milestone-${t.teamId}`} className="patterns-alert-item patterns-alert-milestone">
                            <span className="patterns-alert-icon">🎯</span>
                            <span className="patterns-alert-text">
                                <strong>{t.pitcherMilestone!.pitcherName}</strong> ({t.teamName}) going for <strong>Win #{t.pitcherMilestone!.targetWin}</strong> tonight
                            </span>
                        </div>
                    ))}
                    {patterns.filter(t => t.walkoffRevenge && !t.walkoffRevenge.isWalkoffTeam).map(t => (
                        <div key={`walkoff-${t.teamId}`} className="patterns-alert-item patterns-alert-walkoff">
                            <span className="patterns-alert-icon">💣</span>
                            <span className="patterns-alert-text">
                                <strong>{t.walkoffRevenge!.losingTeam}</strong> lost on a walk-off HR last night (<strong>{t.walkoffRevenge!.score}</strong>). Same matchup tonight — <strong>revenge game.</strong>
                            </span>
                        </div>
                    ))}
                </motion.div>
            )}

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
                    { key: 'alerts' as const, label: `🔔 Alerts (${alertCount})` },
                    { key: 'history' as const, label: '🔥 Fire Log' },
                    { key: 'analytics' as const, label: '📊 Insights' },
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

            {/* Team List / Fire Log / Analytics */}
            {filter === 'history' ? (
                <FirePicksHistory />
            ) : filter === 'analytics' ? (
                <BreakAnalytics />
            ) : loading ? (
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
                            {team.pitcherMilestone && (
                                <span className="pattern-milestone-badge">
                                    🎯 W#{team.pitcherMilestone.targetWin}
                                </span>
                            )}
                            {team.walkoffRevenge && (
                                <span className="pattern-walkoff-badge">
                                    💣 {team.walkoffRevenge.isWalkoffTeam ? 'WALKED OFF' : 'REVENGE'}
                                </span>
                            )}
                        </div>
                        <div className="pattern-team-division">{team.division}</div>
                        {team.nextGame && (
                            <div className="pattern-next-game">
                                {team.nextGame.isHome ? 'vs' : '@'} {team.nextGame.opponent} · {team.nextGame.gameTime} · {team.nextGame.isHome ? 'Home' : 'Away'}
                            </div>
                        )}
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
                                                    style={{ background: g.result === 'W' ? 'rgba(106,0,255,0.4)' : 'rgba(239,68,68,0.4)' }}
                                                />
                                            )}
                                            <div
                                                className={dotClass}
                                                title={`${g.result} ${g.score} ${g.opponent} (${g.date})`}
                                                style={{
                                                    background: g.result === 'W' ? 'rgba(106,0,255,0.15)' : 'rgba(239,68,68,0.15)',
                                                    color: g.result === 'W' ? '#FFC107' : '#ef4444',
                                                    border: `1px solid ${g.result === 'W' ? 'rgba(106,0,255,0.25)' : 'rgba(239,68,68,0.25)'}`,
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
                                                        ? (isBreak ? 'rgba(106,0,255,0.25)' : 'rgba(106,0,255,0.15)')
                                                        : (isBreak ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.15)'),
                                                    color: team.nextPrediction === 'W' ? '#FFC107' : '#ef4444',
                                                    border: `2px dashed ${team.nextPrediction === 'W' ? 'rgba(106,0,255,0.4)' : 'rgba(239,68,68,0.4)'}`,
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
                                background: team.nextPrediction === 'W' ? 'rgba(106,0,255,0.15)' : 'rgba(239,68,68,0.15)',
                                color: team.nextPrediction === 'W' ? '#FFC107' : '#ef4444',
                                border: `2px dashed ${team.nextPrediction === 'W' ? 'rgba(106,0,255,0.3)' : 'rgba(239,68,68,0.3)'}`,
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
                    {team.pitcherMilestone && (
                        <div className="pattern-alert-detail milestone" style={{ marginTop: '10px' }}>
                            <span style={{ fontSize: '16px', flexShrink: 0 }}>🎯</span>
                            <span>
                                <strong>{team.pitcherMilestone.pitcherName}</strong> is going for <strong>Win #{team.pitcherMilestone.targetWin}</strong> tonight ({team.pitcherMilestone.currentWins} wins on the season)
                            </span>
                        </div>
                    )}
                    {team.walkoffRevenge && (
                        <div className="pattern-alert-detail walkoff" style={{ marginTop: team.pitcherMilestone ? '0' : '10px' }}>
                            <span style={{ fontSize: '16px', flexShrink: 0 }}>💣</span>
                            <span>
                                {team.walkoffRevenge.isWalkoffTeam ? (
                                    <><strong>{team.teamName}</strong> won on a walk-off HR last night (<strong>{team.walkoffRevenge.score}</strong>){team.walkoffRevenge.walkoffPlayer ? ` — ${team.walkoffRevenge.walkoffPlayer} with the blast` : ''}. Same matchup tonight.</>
                                ) : (
                                    <><strong>{team.teamName}</strong> lost on a walk-off HR to <strong>{team.walkoffRevenge.walkoffTeam}</strong> last night (<strong>{team.walkoffRevenge.score}</strong>). <strong>Revenge game tonight.</strong></>
                                )}
                            </span>
                        </div>
                    )}
                    <div className="pattern-games-grid">
                        {[...team.recentResults].reverse().map((g, i) => (
                            <div
                                key={i}
                                className="pattern-game-card"
                                style={{ border: `1px solid ${g.result === 'W' ? 'rgba(106,0,255,0.12)' : 'rgba(239,68,68,0.12)'}` }}
                            >
                                <div className="pattern-game-header">
                                    <span className="pattern-game-result" style={{
                                        color: g.result === 'W' ? '#FFC107' : '#ef4444',
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
