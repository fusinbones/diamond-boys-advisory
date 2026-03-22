'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/lib/adminAuth';
import { Loader2, RefreshCw, Zap, TrendingUp, ChevronRight, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';

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
    const [filter, setFilter] = useState<'all' | 'alternating' | 'today'>('all');
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

    // Apply filters & sorting
    let displayed = [...patterns];
    if (filter === 'alternating') displayed = displayed.filter(t => t.isAlternating);
    if (filter === 'today') displayed = displayed.filter(t => todayTeamIds.includes(t.teamId));

    if (sortBy === 'streak') {
        displayed.sort((a, b) => b.altStreak - a.altStreak);
    } else if (sortBy === 'division') {
        displayed.sort((a, b) => a.division.localeCompare(b.division));
    }
    // default is already sorted by altScore from API

    const altCount = patterns.filter(t => t.isAlternating).length;
    const todayAltCount = patterns.filter(t => t.isAlternating && todayTeamIds.includes(t.teamId)).length;

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ArrowUpDown size={20} style={{ color: '#a78bfa' }} />
                        Alternating Pattern Master
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '13px' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                <div style={{
                    background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)',
                    borderRadius: '10px', padding: '14px', textAlign: 'center',
                }}>
                    <div style={{ color: '#a78bfa', fontSize: '28px', fontWeight: 800 }}>{altCount}</div>
                    <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alternating Teams</div>
                </div>
                <div style={{
                    background: 'rgba(0,229,155,0.06)', border: '1px solid rgba(0,229,155,0.15)',
                    borderRadius: '10px', padding: '14px', textAlign: 'center',
                }}>
                    <div style={{ color: '#00e59b', fontSize: '28px', fontWeight: 800 }}>{todayAltCount}</div>
                    <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Playing Today</div>
                </div>
                <div style={{
                    background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)',
                    borderRadius: '10px', padding: '14px', textAlign: 'center',
                }}>
                    <div style={{ color: '#fbbf24', fontSize: '28px', fontWeight: 800 }}>{patterns.length}</div>
                    <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Teams</div>
                </div>
            </div>

            {/* Filters & Sort */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {[
                    { key: 'all' as const, label: 'All Teams' },
                    { key: 'alternating' as const, label: `🔥 Alternating (${altCount})` },
                    { key: 'today' as const, label: `⚾ Playing Today` },
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        style={{
                            padding: '6px 14px', borderRadius: '8px', border: 'none',
                            background: filter === f.key ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
                            color: filter === f.key ? '#a78bfa' : '#6b7280',
                            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        {f.label}
                    </button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                    {[
                        { key: 'altScore' as const, label: 'Alt %' },
                        { key: 'streak' as const, label: 'Streak' },
                        { key: 'division' as const, label: 'Division' },
                    ].map(s => (
                        <button
                            key={s.key}
                            onClick={() => setSortBy(s.key)}
                            style={{
                                padding: '4px 10px', borderRadius: '6px', border: 'none',
                                background: sortBy === s.key ? 'rgba(255,255,255,0.08)' : 'transparent',
                                color: sortBy === s.key ? 'white' : '#4b5563',
                                fontSize: '11px', fontWeight: 600, cursor: 'pointer',
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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

    return (
        <div
            style={{
                background: team.isAlternating
                    ? 'linear-gradient(135deg, rgba(167,139,250,0.04) 0%, rgba(167,139,250,0.02) 100%)'
                    : 'rgba(255,255,255,0.02)',
                border: `1px solid ${team.isAlternating ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '10px',
                overflow: 'hidden',
                transition: 'border-color 0.2s',
            }}
        >
            {/* Main Row */}
            <button
                onClick={() => setExpanded(!expanded)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    width: '100%', padding: '12px 14px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left',
                }}
            >
                {/* Team logo + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '140px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={team.logo} alt={team.teamName} style={{ width: '28px', height: '28px' }} />
                    <div>
                        <div style={{ color: 'white', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {team.teamName}
                            {isPlayingToday && (
                                <span style={{
                                    fontSize: '9px', background: 'rgba(0,229,155,0.15)', color: '#00e59b',
                                    padding: '1px 6px', borderRadius: '4px', fontWeight: 700,
                                }}>
                                    TODAY
                                </span>
                            )}
                        </div>
                        <div style={{ color: '#4b5563', fontSize: '10px' }}>{team.division}</div>
                    </div>
                </div>

                {/* Pattern dots */}
                <div style={{ display: 'flex', gap: '3px', flex: 1, justifyContent: 'center', overflow: 'hidden' }}>
                    {team.recentResults.slice(0, 10).map((g, i) => (
                        <div
                            key={i}
                            title={`${g.result} ${g.score} ${g.opponent} (${g.date})`}
                            style={{
                                width: '24px', height: '24px', borderRadius: '6px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '10px', fontWeight: 800,
                                background: g.result === 'W' ? 'rgba(0,229,155,0.15)' : 'rgba(239,68,68,0.15)',
                                color: g.result === 'W' ? '#00e59b' : '#ef4444',
                                border: `1px solid ${g.result === 'W' ? 'rgba(0,229,155,0.25)' : 'rgba(239,68,68,0.25)'}`,
                            }}
                        >
                            {g.result}
                        </div>
                    ))}
                    {team.recentResults.length === 0 && (
                        <span style={{ color: '#374151', fontSize: '11px' }}>No recent games</span>
                    )}
                </div>

                {/* Alt Score + Streak */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '120px', justifyContent: 'flex-end' }}>
                    {/* Alt Score */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: '14px', fontWeight: 800,
                            color: team.altScore >= 70 ? '#a78bfa' : team.altScore >= 50 ? '#fbbf24' : '#4b5563',
                        }}>
                            {team.altScore}%
                        </div>
                        <div style={{ fontSize: '8px', color: '#4b5563', textTransform: 'uppercase' }}>Alt</div>
                    </div>

                    {/* Streak badge */}
                    {team.altStreak >= 4 && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            background: team.predictionType === 'break' ? 'rgba(251,146,60,0.1)' : 'rgba(167,139,250,0.1)',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: `1px solid ${team.predictionType === 'break' ? 'rgba(251,146,60,0.2)' : 'rgba(167,139,250,0.2)'}`,
                        }}>
                            <Zap size={10} style={{ color: team.predictionType === 'break' ? '#fb923c' : '#a78bfa' }} />
                            <span style={{ color: team.predictionType === 'break' ? '#fb923c' : '#a78bfa', fontSize: '11px', fontWeight: 700 }}>
                                {team.altStreak}
                            </span>
                        </div>
                    )}

                    {/* Prediction — HOLD (pattern continues) or BREAK (pattern due to snap) */}
                    {team.nextPrediction && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '10px', fontWeight: 800,
                                background: team.nextPrediction === 'W' ? 'rgba(0,229,155,0.15)' : 'rgba(239,68,68,0.15)',
                                color: team.nextPrediction === 'W' ? '#00e59b' : '#ef4444',
                                border: `2px dashed ${team.nextPrediction === 'W' ? 'rgba(0,229,155,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            }}>
                                {team.nextPrediction}?
                            </div>
                            <span style={{
                                fontSize: '7px', fontWeight: 800, textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: team.predictionType === 'break' ? '#fb923c' : '#a78bfa',
                            }}>
                                {team.predictionType === 'break' ? '⚡BREAK' : 'HOLD'}
                            </span>
                        </div>
                    )}

                    <ChevronRight
                        size={14}
                        style={{
                            color: '#4b5563',
                            transform: expanded ? 'rotate(90deg)' : 'none',
                            transition: 'transform 0.2s',
                        }}
                    />
                </div>
            </button>

            {/* Expanded Detail */}
            {expanded && (
                <div style={{
                    padding: '0 14px 14px',
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '10px' }}>
                        {team.recentResults.map((g, i) => (
                            <div
                                key={i}
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${g.result === 'W' ? 'rgba(0,229,155,0.12)' : 'rgba(239,68,68,0.12)'}`,
                                    borderRadius: '8px', padding: '8px 10px',
                                    minWidth: '120px',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{
                                        fontSize: '11px', fontWeight: 700,
                                        color: g.result === 'W' ? '#00e59b' : '#ef4444',
                                    }}>
                                        {g.result === 'W' ? '✅ WIN' : '❌ LOSS'}
                                    </span>
                                    <span style={{ color: '#4b5563', fontSize: '10px' }}>
                                        {new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                <div style={{ color: '#9ca3af', fontSize: '11px' }}>{g.opponent}</div>
                                <div style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>{g.score}</div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Pick Link */}
                    {isPlayingToday && team.isAlternating && (
                        <div style={{ marginTop: '10px' }}>
                            <Link
                                href={`/admin/analysis`}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    padding: '8px 14px',
                                    background: 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(167,139,250,0.05))',
                                    border: '1px solid rgba(167,139,250,0.2)',
                                    borderRadius: '8px', textDecoration: 'none',
                                    color: '#a78bfa', fontSize: '12px', fontWeight: 600,
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
