'use client';

import { useState, type ReactNode } from 'react';
import {
    RefreshCw, Zap, TrendingUp, ChevronRight, ArrowUpDown,
    ArrowLeft, Search, Bell
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import '../patterns.css';

// ─── MOCK DATA — Realistic patterns for screen recording ───
const MOCK_PATTERNS = [
    {
        teamId: 1, teamName: 'Dodgers', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/mlb/500/lad.png&h=40&w=40',
        division: 'NL West',
        recentResults: [
            { date: '6/7', result: 'L' as const, opponent: 'vs MIL', score: '3-5' },
            { date: '6/6', result: 'W' as const, opponent: 'vs MIL', score: '7-2' },
            { date: '6/5', result: 'L' as const, opponent: '@ ARI', score: '2-4' },
            { date: '6/4', result: 'W' as const, opponent: '@ ARI', score: '6-1' },
            { date: '6/3', result: 'L' as const, opponent: '@ ARI', score: '3-5' },
            { date: '6/2', result: 'W' as const, opponent: '@ SF', score: '8-3' },
            { date: '6/1', result: 'L' as const, opponent: '@ SF', score: '1-4' },
            { date: '5/31', result: 'W' as const, opponent: '@ SF', score: '5-2' },
            { date: '5/30', result: 'W' as const, opponent: 'vs COL', score: '9-3' },
            { date: '5/29', result: 'L' as const, opponent: 'vs COL', score: '2-6' },
        ],
        pattern: 'LWLWLWLW', altStreak: 8, isAlternating: true, isDeveloping: false,
        nextPrediction: 'W' as const, predictionType: 'break' as const, altScore: 73,
    },
    {
        teamId: 2, teamName: 'Phillies', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/mlb/500/phi.png&h=40&w=40',
        division: 'NL East',
        recentResults: [
            { date: '6/7', result: 'W' as const, opponent: 'vs ATL', score: '5-3' },
            { date: '6/6', result: 'L' as const, opponent: 'vs ATL', score: '1-4' },
            { date: '6/5', result: 'W' as const, opponent: '@ NYM', score: '6-2' },
            { date: '6/4', result: 'L' as const, opponent: '@ NYM', score: '3-7' },
            { date: '6/3', result: 'W' as const, opponent: '@ NYM', score: '4-1' },
            { date: '6/2', result: 'L' as const, opponent: '@ WSH', score: '2-5' },
            { date: '6/1', result: 'W' as const, opponent: '@ WSH', score: '8-4' },
            { date: '5/31', result: 'L' as const, opponent: '@ WSH', score: '0-3' },
            { date: '5/30', result: 'W' as const, opponent: 'vs MIA', score: '7-1' },
            { date: '5/29', result: 'L' as const, opponent: 'vs MIA', score: '3-5' },
        ],
        pattern: 'WLWLWLWLWL', altStreak: 10, isAlternating: true, isDeveloping: false,
        nextPrediction: 'W' as const, predictionType: 'break' as const, altScore: 88,
    },
    {
        teamId: 3, teamName: 'Yankees', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/mlb/500/nyy.png&h=40&w=40',
        division: 'AL East',
        recentResults: [
            { date: '6/7', result: 'L' as const, opponent: '@ BOS', score: '2-5' },
            { date: '6/6', result: 'W' as const, opponent: '@ BOS', score: '6-3' },
            { date: '6/5', result: 'L' as const, opponent: 'vs TOR', score: '1-4' },
            { date: '6/4', result: 'W' as const, opponent: 'vs TOR', score: '5-2' },
            { date: '6/3', result: 'L' as const, opponent: 'vs TOR', score: '3-7' },
            { date: '6/2', result: 'W' as const, opponent: 'vs BAL', score: '4-1' },
            { date: '6/1', result: 'L' as const, opponent: 'vs BAL', score: '2-6' },
            { date: '5/31', result: 'W' as const, opponent: '@ TB', score: '8-5' },
            { date: '5/30', result: 'W' as const, opponent: '@ TB', score: '3-1' },
            { date: '5/29', result: 'L' as const, opponent: '@ TB', score: '0-4' },
        ],
        pattern: 'LWLWLWL', altStreak: 7, isAlternating: true, isDeveloping: false,
        nextPrediction: 'W' as const, predictionType: 'break' as const, altScore: 69,
    },
    {
        teamId: 4, teamName: 'Astros', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/mlb/500/hou.png&h=40&w=40',
        division: 'AL West',
        recentResults: [
            { date: '6/7', result: 'W' as const, opponent: 'vs SEA', score: '4-2' },
            { date: '6/6', result: 'L' as const, opponent: 'vs SEA', score: '1-3' },
            { date: '6/5', result: 'W' as const, opponent: '@ TEX', score: '7-5' },
            { date: '6/4', result: 'L' as const, opponent: '@ TEX', score: '2-6' },
            { date: '6/3', result: 'W' as const, opponent: '@ TEX', score: '5-1' },
            { date: '6/2', result: 'L' as const, opponent: '@ OAK', score: '3-4' },
            { date: '6/1', result: 'W' as const, opponent: '@ OAK', score: '6-2' },
            { date: '5/31', result: 'W' as const, opponent: '@ OAK', score: '9-1' },
            { date: '5/30', result: 'L' as const, opponent: 'vs LAA', score: '2-7' },
            { date: '5/29', result: 'W' as const, opponent: 'vs LAA', score: '5-3' },
        ],
        pattern: 'WLWLWLW', altStreak: 7, isAlternating: true, isDeveloping: false,
        nextPrediction: 'L' as const, predictionType: 'break' as const, altScore: 69,
    },
    {
        teamId: 5, teamName: 'Braves', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/mlb/500/atl.png&h=40&w=40',
        division: 'NL East',
        recentResults: [
            { date: '6/7', result: 'W' as const, opponent: '@ PHI', score: '4-3' },
            { date: '6/6', result: 'L' as const, opponent: '@ PHI', score: '2-5' },
            { date: '6/5', result: 'W' as const, opponent: 'vs MIA', score: '6-0' },
            { date: '6/4', result: 'L' as const, opponent: 'vs MIA', score: '1-3' },
            { date: '6/3', result: 'W' as const, opponent: 'vs MIA', score: '7-2' },
            { date: '6/2', result: 'W' as const, opponent: '@ CHC', score: '5-4' },
            { date: '6/1', result: 'L' as const, opponent: '@ CHC', score: '3-8' },
            { date: '5/31', result: 'W' as const, opponent: '@ CHC', score: '4-1' },
        ],
        pattern: 'WLWLW', altStreak: 5, isAlternating: false, isDeveloping: true,
        nextPrediction: 'L' as const, predictionType: 'continue' as const, altScore: 15,
    },
    {
        teamId: 6, teamName: 'Guardians', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/mlb/500/cle.png&h=40&w=40',
        division: 'AL Central',
        recentResults: [
            { date: '6/7', result: 'L' as const, opponent: 'vs MIN', score: '1-5' },
            { date: '6/6', result: 'W' as const, opponent: 'vs MIN', score: '3-2' },
            { date: '6/5', result: 'L' as const, opponent: '@ DET', score: '0-4' },
            { date: '6/4', result: 'W' as const, opponent: '@ DET', score: '5-3' },
            { date: '6/3', result: 'L' as const, opponent: '@ DET', score: '2-6' },
            { date: '6/2', result: 'W' as const, opponent: 'vs CWS', score: '7-1' },
            { date: '6/1', result: 'W' as const, opponent: 'vs CWS', score: '4-0' },
            { date: '5/31', result: 'L' as const, opponent: 'vs CWS', score: '1-3' },
        ],
        pattern: 'LWLWLW', altStreak: 6, isAlternating: true, isDeveloping: false,
        nextPrediction: 'W' as const, predictionType: 'break' as const, altScore: 62,
    },
    {
        teamId: 7, teamName: 'Padres', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/mlb/500/sd.png&h=40&w=40',
        division: 'NL West',
        recentResults: [
            { date: '6/7', result: 'W' as const, opponent: '@ COL', score: '6-3' },
            { date: '6/6', result: 'L' as const, opponent: '@ COL', score: '2-5' },
            { date: '6/5', result: 'W' as const, opponent: 'vs SF', score: '4-1' },
            { date: '6/4', result: 'L' as const, opponent: 'vs SF', score: '3-7' },
            { date: '6/3', result: 'W' as const, opponent: 'vs SF', score: '5-2' },
            { date: '6/2', result: 'L' as const, opponent: 'vs ARI', score: '1-4' },
            { date: '6/1', result: 'W' as const, opponent: 'vs ARI', score: '8-6' },
            { date: '5/31', result: 'L' as const, opponent: '@ LAD', score: '2-5' },
        ],
        pattern: 'WLWLWLWL', altStreak: 8, isAlternating: true, isDeveloping: false,
        nextPrediction: 'L' as const, predictionType: 'break' as const, altScore: 73,
    },
    {
        teamId: 8, teamName: 'Red Sox', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/mlb/500/bos.png&h=40&w=40',
        division: 'AL East',
        recentResults: [
            { date: '6/7', result: 'W' as const, opponent: 'vs NYY', score: '5-2' },
            { date: '6/6', result: 'L' as const, opponent: 'vs NYY', score: '3-6' },
            { date: '6/5', result: 'W' as const, opponent: '@ TB', score: '4-1' },
            { date: '6/4', result: 'L' as const, opponent: '@ TB', score: '2-8' },
            { date: '6/3', result: 'L' as const, opponent: '@ TB', score: '1-5' },
            { date: '6/2', result: 'W' as const, opponent: '@ BAL', score: '6-3' },
            { date: '6/1', result: 'L' as const, opponent: '@ BAL', score: '0-2' },
            { date: '5/31', result: 'W' as const, opponent: 'vs TOR', score: '7-4' },
        ],
        pattern: 'WLWL', altStreak: 4, isAlternating: false, isDeveloping: true,
        nextPrediction: 'L' as const, predictionType: 'continue' as const, altScore: 8,
    },
    {
        teamId: 9, teamName: 'Cubs', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/mlb/500/chc.png&h=40&w=40',
        division: 'NL Central',
        recentResults: [
            { date: '6/7', result: 'W' as const, opponent: 'vs STL', score: '4-2' },
            { date: '6/6', result: 'W' as const, opponent: 'vs STL', score: '6-1' },
            { date: '6/5', result: 'L' as const, opponent: '@ CIN', score: '2-5' },
            { date: '6/4', result: 'W' as const, opponent: '@ CIN', score: '3-1' },
            { date: '6/3', result: 'L' as const, opponent: '@ CIN', score: '1-7' },
            { date: '6/2', result: 'W' as const, opponent: 'vs ATL', score: '8-5' },
            { date: '6/1', result: 'L' as const, opponent: 'vs ATL', score: '3-4' },
            { date: '5/31', result: 'W' as const, opponent: 'vs ATL', score: '5-0' },
        ],
        pattern: 'WW', altStreak: 0, isAlternating: false, isDeveloping: false,
        nextPrediction: null, predictionType: null, altScore: 0,
    },
    {
        teamId: 10, teamName: 'Mets', logo: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/mlb/500/nym.png&h=40&w=40',
        division: 'NL East',
        recentResults: [
            { date: '6/7', result: 'L' as const, opponent: '@ MIA', score: '2-4' },
            { date: '6/6', result: 'W' as const, opponent: '@ MIA', score: '6-3' },
            { date: '6/5', result: 'L' as const, opponent: 'vs PHI', score: '2-6' },
            { date: '6/4', result: 'W' as const, opponent: 'vs PHI', score: '7-3' },
            { date: '6/3', result: 'L' as const, opponent: 'vs PHI', score: '1-4' },
            { date: '6/2', result: 'W' as const, opponent: 'vs WSH', score: '5-2' },
            { date: '6/1', result: 'L' as const, opponent: 'vs WSH', score: '3-7' },
            { date: '5/31', result: 'L' as const, opponent: '@ ATL', score: '0-4' },
        ],
        pattern: 'LWLWLWL', altStreak: 7, isAlternating: true, isDeveloping: false,
        nextPrediction: 'W' as const, predictionType: 'break' as const, altScore: 69,
    },
];

// Teams "playing today"
const TODAY_IDS = [1, 2, 3, 4, 5, 7, 10];

interface TeamPattern {
    teamId: number;
    teamName: string;
    logo: string;
    division: string;
    recentResults: { date: string; result: 'W' | 'L'; opponent: string; score: string }[];
    pattern: string;
    altStreak: number;
    isAlternating: boolean;
    isDeveloping: boolean;
    nextPrediction: 'W' | 'L' | null;
    predictionType: 'continue' | 'break' | null;
    altScore: number;
}

export default function DemoPatterns() {
    const [filter, setFilter] = useState<'all' | 'alternating' | 'developing' | 'today'>('all');
    const [sortBy, setSortBy] = useState<'altScore' | 'streak' | 'division'>('altScore');
    const [search, setSearch] = useState('');

    let displayed = [...MOCK_PATTERNS];
    if (search.trim()) {
        const q = search.toLowerCase();
        displayed = displayed.filter(t =>
            t.teamName.toLowerCase().includes(q) || t.division.toLowerCase().includes(q)
        );
    }
    if (filter === 'alternating') displayed = displayed.filter(t => t.isAlternating);
    if (filter === 'developing') displayed = displayed.filter(t => t.isDeveloping || t.isAlternating);
    if (filter === 'today') displayed = displayed.filter(t => TODAY_IDS.includes(t.teamId));

    if (sortBy === 'altScore') displayed.sort((a, b) => b.altScore - a.altScore);
    else if (sortBy === 'streak') displayed.sort((a, b) => b.altStreak - a.altStreak);
    else displayed.sort((a, b) => a.division.localeCompare(b.division));

    const altCount = MOCK_PATTERNS.filter(t => t.isAlternating).length;
    const devCount = MOCK_PATTERNS.filter(t => t.isDeveloping).length;
    const todayAltCount = MOCK_PATTERNS.filter(t => (t.isAlternating || t.isDeveloping) && TODAY_IDS.includes(t.teamId)).length;

    return (
        <div className="patterns-page">
            <div style={{ marginBottom: '16px' }}>
                <Link href="/dashboard" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    color: '#6b7280', fontSize: '12px', textDecoration: 'none',
                }}>
                    <ArrowLeft size={14} /> Back to Dashboard
                </Link>
            </div>

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="patterns-header">
                <div>
                    <h1 className="patterns-title">
                        <ArrowUpDown size={20} style={{ color: '#a78bfa' }} />
                        Pattern System
                    </h1>
                    <p className="patterns-subtitle">
                        W/L alternation analysis for all 30 MLB teams
                        <span> · Updated {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                    </p>
                </div>
                <button className="patterns-refresh-btn">
                    <RefreshCw size={14} />
                    Refresh
                </button>
            </motion.div>

            {/* Summary */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="patterns-summary">
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
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team or division..." className="patterns-search" />
            </div>

            {/* Filters */}
            <div className="patterns-controls">
                {[
                    { key: 'all' as const, label: 'All Teams' },
                    { key: 'alternating' as const, label: `🔥 True (${altCount})` },
                    { key: 'developing' as const, label: `👀 Dev (${devCount})` },
                    { key: 'today' as const, label: `⚾ Today` },
                ].map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)} className="patterns-filter-btn" style={{
                        background: filter === f.key ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
                        color: filter === f.key ? '#a78bfa' : '#6b7280',
                    }}>
                        {f.label}
                    </button>
                ))}
                <div className="patterns-sort-group">
                    {[
                        { key: 'altScore' as const, label: 'Break %' },
                        { key: 'streak' as const, label: 'Streak' },
                        { key: 'division' as const, label: 'Division' },
                    ].map(s => (
                        <button key={s.key} onClick={() => setSortBy(s.key)} className="patterns-sort-btn" style={{
                            background: sortBy === s.key ? 'rgba(255,255,255,0.08)' : 'transparent',
                            color: sortBy === s.key ? 'white' : '#4b5563',
                        }}>
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Team Cards */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="patterns-list">
                {displayed.map(team => (
                    <DemoTeamRow key={team.teamId} team={team} isPlayingToday={TODAY_IDS.includes(team.teamId)} />
                ))}
            </motion.div>
        </div>
    );
}

function DemoTeamRow({ team, isPlayingToday }: { team: TeamPattern; isPlayingToday: boolean }): ReactNode {
    const [expanded, setExpanded] = useState(false);
    const isBreak = team.predictionType === 'break';
    const accentColor = team.isAlternating ? '#fb923c' : team.isDeveloping ? '#fbbf24' : '#a78bfa';
    const isHighlighted = team.isAlternating || team.isDeveloping;

    return (
        <div className="pattern-row" style={{
            background: isHighlighted
                ? `linear-gradient(135deg, ${accentColor}08 0%, ${accentColor}04 100%)`
                : 'rgba(255,255,255,0.02)',
            border: `1px solid ${isHighlighted ? `${accentColor}25` : 'rgba(255,255,255,0.06)'}`,
        }}>
            <button className="pattern-row-btn" onClick={() => setExpanded(!expanded)}>
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
                                            {isStreakStart && i > 0 && <div className="pattern-streak-divider" />}
                                            {inStreak && !isStreakStart && (
                                                <div className="pattern-streak-connector"
                                                    style={{ background: g.result === 'W' ? 'rgba(0,229,155,0.4)' : 'rgba(239,68,68,0.4)' }}
                                                />
                                            )}
                                            <div className={dotClass}>{g.result}</div>
                                        </span>
                                    );
                                })}
                            </>
                        );
                    })()}
                </div>

                <div className="pattern-meta">
                    {team.isAlternating && (
                        <span className="pattern-badge true">🔥 TRUE ({team.altStreak})</span>
                    )}
                    {team.isDeveloping && !team.isAlternating && (
                        <span className="pattern-badge dev">👀 DEV ({team.altStreak})</span>
                    )}
                    {team.altScore > 0 && (
                        <span className="pattern-score" style={{
                            color: team.altScore >= 70 ? '#00e59b' : team.altScore >= 50 ? '#fbbf24' : '#6b7280',
                        }}>
                            {team.altScore}%
                        </span>
                    )}
                    <ChevronRight size={14} style={{
                        color: '#4b5563',
                        transform: expanded ? 'rotate(90deg)' : 'none',
                        transition: 'transform 0.2s',
                    }} />
                </div>
            </button>

            {expanded && (
                <div className="pattern-detail">
                    <div className="pattern-detail-section">
                        <h4>Recent Games</h4>
                        <div className="pattern-games-list">
                            {team.recentResults.map((g, i) => (
                                <div key={i} className="pattern-game-row">
                                    <span className="pattern-game-date">{g.date}</span>
                                    <span className={`pattern-game-result ${g.result === 'W' ? 'win' : 'loss'}`}>{g.result}</span>
                                    <span className="pattern-game-opp">{g.opponent}</span>
                                    <span className="pattern-game-score">{g.score}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {isBreak && (
                        <div className="pattern-detail-section">
                            <h4>Break Prediction</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                <span style={{ fontSize: '13px', color: '#9ca3af' }}>Next result predicted:</span>
                                <span style={{
                                    padding: '4px 12px', borderRadius: '6px', fontWeight: 800, fontSize: '13px',
                                    background: team.nextPrediction === 'W' ? 'rgba(0,229,155,0.12)' : 'rgba(239,68,68,0.12)',
                                    color: team.nextPrediction === 'W' ? '#00e59b' : '#ef4444',
                                    border: `1px solid ${team.nextPrediction === 'W' ? 'rgba(0,229,155,0.25)' : 'rgba(239,68,68,0.25)'}`,
                                }}>
                                    {team.nextPrediction} (Break)
                                </span>
                                <span style={{ fontSize: '13px', color: '#6b7280' }}>at {team.altScore}% probability</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
