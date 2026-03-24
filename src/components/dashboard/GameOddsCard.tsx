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
        const d = new Date(time);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch { return 'TBD'; }
}

/**
 * Compact game card for the horizontal strip / sidebar.
 * Shows: sport emoji, abbreviated teams, moneyline, time.
 * Super clean, fits in ~150px wide on mobile strip.
 */
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
        }}>
            {/* Value badge */}
            {isValue && (
                <span style={{
                    position: 'absolute', top: '6px', right: '6px',
                    fontSize: '8px', fontWeight: 700, color: '#fbbf24',
                    background: 'rgba(251,191,36,0.15)', padding: '1px 4px', borderRadius: '3px',
                    display: 'flex', alignItems: 'center', gap: '2px',
                }}>
                    <Zap size={7} />
                </span>
            )}

            {/* Time + sport */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '9px', color: '#6b7280' }}>{game.sportEmoji}</span>
                <span style={{
                    fontSize: '9px', fontWeight: game.isLive ? 700 : 500,
                    color: game.isLive ? '#00e59b' : game.isCompleted ? '#6b7280' : '#9ca3af',
                    display: 'flex', alignItems: 'center', gap: '3px',
                }}>
                    {game.isLive && (
                        <span style={{
                            width: '4px', height: '4px', borderRadius: '50%',
                            background: '#00e59b', boxShadow: '0 0 4px #00e59b',
                            animation: 'pulse 2s infinite',
                        }} />
                    )}
                    {timeLabel(game.gameTime, game.isLive, game.isCompleted)}
                </span>
            </div>

            {/* Away team row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>
                    {shortName(game.awayTeam)}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {!game.isCompleted && game.moneyline && (
                        <span style={{
                            fontSize: '11px', fontWeight: 700,
                            color: game.moneyline.away !== null && game.moneyline.away > 0 ? '#00e59b' : '#f87171',
                        }}>
                            {fmtOdds(game.moneyline.away)}
                        </span>
                    )}
                    {(game.isLive || game.isCompleted) && game.awayScore !== null && (
                        <span style={{ fontSize: '14px', fontWeight: 800, color: 'white', fontVariantNumeric: 'tabular-nums' }}>
                            {game.awayScore}
                        </span>
                    )}
                </div>
            </div>

            {/* Home team row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>
                    {shortName(game.homeTeam)}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {!game.isCompleted && game.moneyline && (
                        <span style={{
                            fontSize: '11px', fontWeight: 700,
                            color: game.moneyline.home !== null && game.moneyline.home > 0 ? '#00e59b' : '#f87171',
                        }}>
                            {fmtOdds(game.moneyline.home)}
                        </span>
                    )}
                    {(game.isLive || game.isCompleted) && game.homeScore !== null && (
                        <span style={{ fontSize: '14px', fontWeight: 800, color: 'white', fontVariantNumeric: 'tabular-nums' }}>
                            {game.homeScore}
                        </span>
                    )}
                </div>
            </div>

            {/* O/U mini */}
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
