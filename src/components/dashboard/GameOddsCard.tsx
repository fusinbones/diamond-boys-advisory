'use client';

import { type ReactNode } from 'react';
import { Zap } from 'lucide-react';

export interface GameData {
    id: string;
    sport: string;
    sportEmoji: string;
    sportColor: string;
    homeTeam: string;
    awayTeam: string;
    gameTime: string;
    isLive: boolean;
    isCompleted: boolean;
    homeScore: string | null;
    awayScore: string | null;
    moneyline: { home: number | null; away: number | null; bestBook: string } | null;
    spread: { home: number | null; away: number | null; line: number | null; bestBook: string } | null;
    total: { overUnder: number | null; overOdds: number | null; underOdds: number | null; bestBook: string } | null;
    bestValue: string | null;
    oddsSpread: number;
}

function fmtOdds(p: number | null): string {
    if (p === null) return '—';
    return p > 0 ? `+${p}` : `${p}`;
}

function shortName(name: string): string {
    const parts = name.split(' ');
    return parts[parts.length - 1];
}

function timeLabel(time: string, live: boolean, done: boolean): string {
    if (live) return 'LIVE';
    if (done) return 'Final';
    try {
        const safeTime = time.length === 10 ? `${time}T12:00:00` : time;
        const d = new Date(safeTime);
        const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
        const t = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
        return `${date} · ${t}`;
    } catch { return 'TBD'; }
}

export default function GameOddsCard({ game }: { game: GameData }): ReactNode {
    const isValue = game.oddsSpread > 30;

    return (
        <div className="game-tile" style={{
            background: game.isLive
                ? 'linear-gradient(135deg, rgba(0,229,155,0.06) 0%, rgba(15,20,35,1) 100%)'
                : 'rgba(255,255,255,0.025)',
            border: `1px solid ${game.isLive ? 'rgba(0,229,155,0.18)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '10px',
            padding: '10px 12px',
            minWidth: '150px',
            flex: '0 0 auto',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Header: sport + time — single row, no overlap */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '8px', gap: '4px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                    <span style={{ fontSize: '9px', color: '#6b7280', flexShrink: 0 }}>{game.sportEmoji}</span>
                    {isValue && (
                        <span style={{
                            fontSize: '8px', fontWeight: 700, color: '#fbbf24',
                            background: 'rgba(251,191,36,0.15)', padding: '1px 4px', borderRadius: '3px',
                            display: 'inline-flex', alignItems: 'center', gap: '1px',
                            flexShrink: 0, lineHeight: 1,
                        }}>
                            <Zap size={7} /> VALUE
                        </span>
                    )}
                </div>
                <span style={{
                    fontSize: '9px', fontWeight: game.isLive ? 700 : 500,
                    color: game.isLive ? '#00e59b' : game.isCompleted ? '#6b7280' : '#9ca3af',
                    display: 'flex', alignItems: 'center', gap: '3px',
                    flexShrink: 0, whiteSpace: 'nowrap',
                }}>
                    {game.isLive && (
                        <span style={{
                            width: '4px', height: '4px', borderRadius: '50%',
                            background: '#00e59b', boxShadow: '0 0 4px #00e59b',
                            animation: 'pulse 2s infinite', flexShrink: 0,
                        }} />
                    )}
                    {timeLabel(game.gameTime, game.isLive, game.isCompleted)}
                </span>
            </div>

            {/* Away team row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', gap: '6px' }}>
                <span style={{
                    fontSize: '12px', fontWeight: 600, color: 'white',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    flex: 1, minWidth: 0,
                }}>
                    {shortName(game.awayTeam)}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {!game.isCompleted && game.moneyline && (
                        <span style={{
                            fontSize: '11px', fontWeight: 700,
                            color: game.moneyline.away !== null && game.moneyline.away > 0 ? '#00e59b' : '#f87171',
                        }}>
                            {fmtOdds(game.moneyline.away)}
                        </span>
                    )}
                    {(game.isLive || game.isCompleted) && game.awayScore !== null && (
                        <span style={{ fontSize: '14px', fontWeight: 800, color: 'white', fontVariantNumeric: 'tabular-nums', minWidth: '18px', textAlign: 'right' }}>
                            {game.awayScore}
                        </span>
                    )}
                </div>
            </div>

            {/* Home team row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{
                    fontSize: '12px', fontWeight: 600, color: '#9ca3af',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    flex: 1, minWidth: 0,
                }}>
                    {shortName(game.homeTeam)}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {!game.isCompleted && game.moneyline && (
                        <span style={{
                            fontSize: '11px', fontWeight: 700,
                            color: game.moneyline.home !== null && game.moneyline.home > 0 ? '#00e59b' : '#f87171',
                        }}>
                            {fmtOdds(game.moneyline.home)}
                        </span>
                    )}
                    {(game.isLive || game.isCompleted) && game.homeScore !== null && (
                        <span style={{ fontSize: '14px', fontWeight: 800, color: 'white', fontVariantNumeric: 'tabular-nums', minWidth: '18px', textAlign: 'right' }}>
                            {game.homeScore}
                        </span>
                    )}
                </div>
            </div>

            {/* O/U mini — only if space allows */}
            {!game.isCompleted && game.total?.overUnder && (
                <div style={{ marginTop: '6px', paddingTop: '5px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: '9px', color: '#4b5563' }}>
                        O/U <span style={{ color: '#60a5fa', fontWeight: 600 }}>{game.total.overUnder}</span>
                    </span>
                </div>
            )}
        </div>
    );
}
