'use client';

import { type ReactNode } from 'react';
import { Clock, Zap, TrendingUp } from 'lucide-react';

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

function oddsColor(price: number | null): string {
    if (price === null) return '#6b7280';
    return price > 0 ? '#00e59b' : '#f87171';
}

function shortTeam(name: string): string {
    const parts = name.split(' ');
    return parts.length > 1 ? parts[parts.length - 1] : name;
}

function gameTimeStr(time: string, isLive: boolean, isCompleted: boolean): string {
    if (isLive) return 'LIVE';
    if (isCompleted) return 'Final';
    try {
        const d = new Date(time);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
    } catch {
        return 'TBD';
    }
}

export default function GameOddsCard({ game }: { game: GameData }): ReactNode {
    const isValue = game.oddsSpread > 30;

    return (
        <div className="game-odds-card" style={{
            background: game.isLive
                ? 'linear-gradient(135deg, rgba(0,229,155,0.04) 0%, rgba(10,15,30,0.95) 100%)'
                : 'rgba(255,255,255,0.02)',
            border: `1px solid ${game.isLive ? 'rgba(0,229,155,0.15)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '14px',
            padding: '14px 16px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Value badge */}
            {isValue && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#fbbf24',
                    background: 'rgba(251,191,36,0.1)',
                    border: '1px solid rgba(251,191,36,0.15)',
                    padding: '2px 8px',
                    borderRadius: '20px',
                }}>
                    <Zap size={9} /> BEST VALUE
                </div>
            )}

            {/* Header: Sport + Time */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#9ca3af',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                }}>
                    {game.sportEmoji} {game.sport}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {game.isLive && <span className="pulse-dot" style={{ width: '6px', height: '6px' }} />}
                    <Clock size={11} style={{ color: game.isLive ? '#00e59b' : '#6b7280' }} />
                    <span style={{
                        fontSize: '11px',
                        fontWeight: game.isLive ? 700 : 500,
                        color: game.isLive ? '#00e59b' : game.isCompleted ? '#a1a1aa' : '#d1d5db',
                    }}>
                        {gameTimeStr(game.gameTime, game.isLive, game.isCompleted)} ET
                    </span>
                </div>
            </div>

            {/* Matchup: Team names + scores */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {/* Away team */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>
                        {game.awayTeam}
                    </span>
                    {(game.isLive || game.isCompleted) && game.awayScore !== null && (
                        <span style={{ fontSize: '18px', fontWeight: 800, color: 'white', fontFamily: 'monospace' }}>
                            {game.awayScore}
                        </span>
                    )}
                </div>
                {/* Home team */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#d1d5db' }}>
                        @ {game.homeTeam}
                    </span>
                    {(game.isLive || game.isCompleted) && game.homeScore !== null && (
                        <span style={{ fontSize: '18px', fontWeight: 800, color: 'white', fontFamily: 'monospace' }}>
                            {game.homeScore}
                        </span>
                    )}
                </div>
            </div>

            {/* Odds Grid — 3 columns: ML | SPREAD | TOTAL */}
            {!game.isCompleted && game.moneyline && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '6px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    paddingTop: '10px',
                }}>
                    {/* Moneyline */}
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '9px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                            Moneyline
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: oddsColor(game.moneyline.away), fontFamily: 'monospace' }}>
                                {shortTeam(game.awayTeam)} {formatOdds(game.moneyline.away)}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: oddsColor(game.moneyline.home), fontFamily: 'monospace' }}>
                                {shortTeam(game.homeTeam)} {formatOdds(game.moneyline.home)}
                            </span>
                        </div>
                    </div>

                    {/* Spread */}
                    <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.04)', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
                        <p style={{ fontSize: '9px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                            Spread
                        </p>
                        {game.spread ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#e5e7eb', fontFamily: 'monospace' }}>
                                    {game.spread.line !== null ? (game.spread.line > 0 ? `+${game.spread.line}` : `${game.spread.line}`) : '—'}
                                </span>
                                <span style={{ fontSize: '10px', color: '#6b7280' }}>
                                    {formatOdds(game.spread.home)} / {formatOdds(game.spread.away)}
                                </span>
                            </div>
                        ) : (
                            <span style={{ fontSize: '12px', color: '#4b5563' }}>N/A</span>
                        )}
                    </div>

                    {/* Total */}
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '9px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                            O/U
                        </p>
                        {game.total ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#60a5fa', fontFamily: 'monospace' }}>
                                    {game.total.overUnder}
                                </span>
                                <span style={{ fontSize: '10px', color: '#6b7280' }}>
                                    O {formatOdds(game.total.overOdds)} / U {formatOdds(game.total.underOdds)}
                                </span>
                            </div>
                        ) : (
                            <span style={{ fontSize: '12px', color: '#4b5563' }}>N/A</span>
                        )}
                    </div>
                </div>
            )}

            {/* Best value detail */}
            {game.bestValue && !game.isCompleted && (
                <div style={{
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    color: '#fbbf24',
                }}>
                    <TrendingUp size={10} />
                    <span>{game.bestValue}</span>
                </div>
            )}
        </div>
    );
}
