'use client';

import { type ReactNode } from 'react';
import { Lock } from 'lucide-react';
import ConfidenceMeter from './ConfidenceMeter';
import UnitsBadge from './UnitsBadge';

export interface PickData {
    id: string;
    sport: string;
    game_date: string;
    matchup: string;
    pick_type: string;
    pick_value: string;
    game_time?: string | null;
    confidence: number;
    units: number;
    edge: number | null;
    odds: string | null;
    status: string;
    score: string | null;
    reasoning: string | null;
    alt_score: number | null;
    created_at: string;
}

interface PickCardProps {
    pick: PickData;
    locked?: boolean;
}

const sportEmoji: Record<string, string> = {
    MLB: '⚾', NBA: '🏀', NFL: '🏈', NHL: '🏒',
};

function StatusPill({ status, score }: { status: string; score: string | null }): ReactNode {
    const labels: Record<string, string> = {
        live: 'LIVE', upcoming: 'Upcoming', won: 'Won', lost: 'Lost', push: 'Push',
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className={`status-pill status-pill--${status}`}>
                {status === 'live' && <span className="pulse-dot" />}
                {labels[status] || status}
            </span>
            {score && (
                <span style={{ fontSize: '12px', color: '#a1a1aa', fontFamily: 'monospace' }}>
                    {score}
                </span>
            )}
        </div>
    );
}

function formatTime(dateStr: string, timeStr?: string | null): string {
    try {
        if (!dateStr) return '';
        let baseDateStr = '';
        
        // If it's pure YYYY-MM-DD, only render the date part
        if (dateStr.length === 10 && dateStr.includes('-')) {
            const d = new Date(`${dateStr}T12:00:00`); // Force noon to prevent shifting
            baseDateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
        } else {
            // Otherwise it's a timestamp, render it
            const d = new Date(dateStr);
            baseDateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
        }

        if (timeStr) {
            const t = new Date(timeStr);
            const timeFormatted = t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
            return `${baseDateStr} · ${timeFormatted} ET`;
        }

        return baseDateStr;
    } catch {
        return '';
    }
}

export default function PickCard({ pick, locked = false }: PickCardProps): ReactNode {
    const cardClass = `pick-card ${
        pick.status === 'live' ? 'pick-card--live' :
        pick.status === 'won' ? 'pick-card--won' :
        pick.status === 'lost' ? 'pick-card--lost' : ''
    }`;

    return (
        <div className={cardClass} style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Top row: sport badge + time + status — always visible */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#9ca3af',
                        background: 'rgba(255,255,255,0.06)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                    }}>
                        {sportEmoji[pick.sport] || '🎯'} {pick.sport}
                    </span>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>
                        {formatTime(pick.game_date, pick.game_time)}
                    </span>
                    <StatusPill status={pick.status} score={locked ? null : pick.score} />
                </div>

                {/* Matchup + pick */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                        {/* Matchup always visible — this is the tease */}
                        <p style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '4px' }}>
                            {pick.matchup}
                        </p>

                        {locked ? (
                            /* Locked state — hide pick value, show lock */
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    background: 'rgba(251,146,60,0.08)',
                                    border: '1px solid rgba(251,146,60,0.15)',
                                    borderRadius: '8px',
                                }}>
                                    <Lock size={14} style={{ color: '#fb923c' }} />
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#fb923c' }}>
                                        Upgrade to see pick
                                    </span>
                                </div>
                            </div>
                        ) : (
                            /* Unlocked — show everything */
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>
                                    {pick.pick_value}
                                </span>
                                {pick.edge !== null && pick.edge !== undefined && (
                                    <span style={{
                                        fontSize: '11px',
                                        fontFamily: 'monospace',
                                        color: '#00e59b',
                                        background: 'rgba(0,229,155,0.1)',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                    }}>
                                        Edge: +{pick.edge}%
                                    </span>
                                )}
                                {pick.odds && (
                                    <span style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>
                                        ({pick.odds})
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right side: confidence + units — blurred for locked */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '6px',
                        ...(locked ? { filter: 'blur(6px)', pointerEvents: 'none' as const, opacity: 0.4 } : {}),
                    }}>
                        <ConfidenceMeter value={pick.confidence || pick.alt_score || 75} />
                        <UnitsBadge units={pick.units || 1} />
                    </div>
                </div>
            </div>

            {/* Lock overlay gradient for locked cards */}
            {locked && (
                <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '120px',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(10,15,30,0.6) 100%)',
                    pointerEvents: 'none',
                }} />
            )}
        </div>
    );
}
