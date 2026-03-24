'use client';

import { type ReactNode } from 'react';
import ConfidenceMeter from './ConfidenceMeter';
import UnitsBadge from './UnitsBadge';

export interface PickData {
    id: string;
    sport: string;
    game_date: string;
    matchup: string;
    pick_type: string;
    pick_value: string;
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

function formatTime(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' }) + ' ET';
    } catch {
        return '';
    }
}

export default function PickCard({ pick }: PickCardProps): ReactNode {
    const cardClass = `pick-card ${
        pick.status === 'live' ? 'pick-card--live' :
        pick.status === 'won' ? 'pick-card--won' :
        pick.status === 'lost' ? 'pick-card--lost' : ''
    }`;

    return (
        <div className={cardClass}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Top row: sport badge + time + status */}
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
                        {formatTime(pick.created_at)}
                    </span>
                    <StatusPill status={pick.status} score={pick.score} />
                </div>

                {/* Matchup + pick */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '4px' }}>
                            {pick.matchup}
                        </p>
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
                    </div>

                    {/* Right side: confidence + units */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        <ConfidenceMeter value={pick.confidence || pick.alt_score || 75} />
                        <UnitsBadge units={pick.units || 1} />
                    </div>
                </div>
            </div>
        </div>
    );
}
