'use client';

import { type ReactNode } from 'react';
import { Zap, TrendingUp } from 'lucide-react';

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

function formatOdds(price: number | null): string {
    if (price === null) return '—';
    return price > 0 ? `+${price}` : `${price}`;
}

function shortName(name: string): string {
    // Return last word (e.g., "New York Yankees" → "Yankees")
    const parts = name.split(' ');
    return parts[parts.length - 1];
}

function gameTimeStr(time: string, isLive: boolean, isCompleted: boolean): string {
    if (isLive) return 'LIVE';
    if (isCompleted) return 'Final';
    try {
        const d = new Date(time);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
        return 'TBD';
    }
}

export default function GameOddsCard({ game }: { game: GameData }): ReactNode {
    const isValue = game.oddsSpread > 30;

    return (
        <div className="game-card" style={{
            background: game.isLive
                ? 'linear-gradient(135deg, rgba(0,229,155,0.05) 0%, rgba(15,20,35,1) 100%)'
                : 'rgba(255,255,255,0.025)',
            border: `1px solid ${game.isLive ? 'rgba(0,229,155,0.18)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '10px',
            overflow: 'hidden',
        }}>
            {/* Header bar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 12px',
                background: 'rgba(0,0,0,0.25)',
            }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280' }}>
                    {game.sportEmoji} {game.sport}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isValue && (
                        <span style={{
                            fontSize: '9px', fontWeight: 700, color: '#fbbf24',
                            background: 'rgba(251,191,36,0.12)', padding: '1px 5px', borderRadius: '3px',
                            display: 'flex', alignItems: 'center', gap: '2px',
                        }}>
                            <Zap size={8} /> VALUE
                        </span>
                    )}
                    {game.isLive && (
                        <span style={{
                            width: '5px', height: '5px', borderRadius: '50%', background: '#00e59b',
                            boxShadow: '0 0 6px #00e59b',
                            animation: 'pulse 2s infinite',
                        }} />
                    )}
                    <span style={{
                        fontSize: '10px', fontWeight: game.isLive ? 700 : 500,
                        color: game.isLive ? '#00e59b' : game.isCompleted ? '#6b7280' : '#9ca3af',
                    }}>
                        {gameTimeStr(game.gameTime, game.isLive, game.isCompleted)}
                    </span>
                </div>
            </div>

            {/* Two team rows */}
            <div style={{ padding: '0' }}>
                {/* Away */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px',
                    gap: '8px',
                }}>
                    <span className="game-team-name" style={{
                        fontSize: '13px', fontWeight: 600, color: 'white',
                        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        <span className="game-team-full">{game.awayTeam}</span>
                        <span className="game-team-short">{shortName(game.awayTeam)}</span>
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                        {!game.isCompleted && game.moneyline && (
                            <span style={{
                                fontSize: '12px', fontWeight: 700, textAlign: 'center',
                                width: '52px',
                                color: game.moneyline.away !== null && game.moneyline.away > 0 ? '#00e59b' : '#f87171',
                            }}>
                                {formatOdds(game.moneyline.away)}
                            </span>
                        )}
                        {!game.isCompleted && game.spread && (
                            <span style={{
                                fontSize: '11px', fontWeight: 600, textAlign: 'center',
                                width: '44px', color: '#94a3b8',
                            }}>
                                {game.spread.line !== null ? (game.spread.line > 0 ? `+${game.spread.line}` : `${game.spread.line}`) : ''}
                            </span>
                        )}
                        {(game.isLive || game.isCompleted) && (
                            <span style={{
                                fontSize: '16px', fontWeight: 800, color: 'white', textAlign: 'center',
                                width: '30px', fontVariantNumeric: 'tabular-nums',
                            }}>
                                {game.awayScore ?? ''}
                            </span>
                        )}
                    </div>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)', margin: '0 12px' }} />

                {/* Home */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px',
                    gap: '8px',
                }}>
                    <span className="game-team-name" style={{
                        fontSize: '13px', fontWeight: 600, color: '#b0b8c4',
                        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        <span className="game-team-full">{game.homeTeam}</span>
                        <span className="game-team-short">{shortName(game.homeTeam)}</span>
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                        {!game.isCompleted && game.moneyline && (
                            <span style={{
                                fontSize: '12px', fontWeight: 700, textAlign: 'center',
                                width: '52px',
                                color: game.moneyline.home !== null && game.moneyline.home > 0 ? '#00e59b' : '#f87171',
                            }}>
                                {formatOdds(game.moneyline.home)}
                            </span>
                        )}
                        {!game.isCompleted && game.spread && (
                            <span style={{
                                fontSize: '11px', fontWeight: 600, textAlign: 'center',
                                width: '44px', color: '#94a3b8',
                            }}>
                                {game.spread.line !== null ? (-(game.spread.line) > 0 ? `+${-(game.spread.line)}` : `${-(game.spread.line)}`) : ''}
                            </span>
                        )}
                        {(game.isLive || game.isCompleted) && (
                            <span style={{
                                fontSize: '16px', fontWeight: 800, color: 'white', textAlign: 'center',
                                width: '30px', fontVariantNumeric: 'tabular-nums',
                            }}>
                                {game.homeScore ?? ''}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom: O/U + Value */}
            {!game.isCompleted && (game.total || game.bestValue) && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '5px 12px',
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    background: 'rgba(0,0,0,0.15)',
                }}>
                    {game.total ? (
                        <span style={{ fontSize: '10px', color: '#6b7280' }}>
                            O/U <span style={{ color: '#60a5fa', fontWeight: 700 }}>{game.total.overUnder}</span>
                        </span>
                    ) : <span />}
                    {game.bestValue ? (
                        <span style={{ fontSize: '9px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <TrendingUp size={9} /> {game.bestValue}
                        </span>
                    ) : null}
                </div>
            )}
        </div>
    );
}
