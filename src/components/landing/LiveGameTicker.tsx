'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TickerGame {
    id: number;
    status: { long: string; short: string };
    away: { name: string; logo: string; score: number | null };
    home: { name: string; logo: string; score: number | null };
    league: string;
    time: string;
}

// Shorten full team names for compact ticker display
function shortName(name: string): string {
    // "New York Yankees" → "NY Yankees", "Los Angeles Dodgers" → "LA Dodgers", etc.
    const map: Record<string, string> = {
        'New York Yankees': 'NY Yankees',
        'New York Mets': 'NY Mets',
        'Los Angeles Dodgers': 'LA Dodgers',
        'Los Angeles Angels': 'LA Angels',
        'San Francisco Giants': 'SF Giants',
        'San Diego Padres': 'SD Padres',
        'Tampa Bay Rays': 'TB Rays',
        'St. Louis Cardinals': 'STL Cardinals',
        'Kansas City Royals': 'KC Royals',
        'Chicago White Sox': 'CHI White Sox',
        'Chicago Cubs': 'CHI Cubs',
    };
    return map[name] || name.split(' ').slice(-1)[0]; // Fallback: just the last word (team name)
}

export default function LiveGameTicker() {
    const [games, setGames] = useState<TickerGame[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        fetch('/api/games/public')
            .then(r => r.json())
            .then(data => {
                setGames(data.games || []);
                setLoaded(true);
            })
            .catch(() => setLoaded(true));
    }, []);

    if (!loaded || games.length === 0) return null;

    // Double the array for seamless infinite scroll
    const doubled = [...games, ...games];

    return (
        <div style={{ width: '100%', marginBottom: '22px' }}>
            <p style={{
                textAlign: 'center',
                fontSize: '10px',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                fontWeight: 700,
                marginBottom: '10px',
            }}>
                ⚾🏀🏒 Live Scores
            </p>
            <div style={{
                position: 'relative',
                overflow: 'hidden',
                maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
            }}>
                <motion.div
                    animate={{ x: ['0%', '-50%'] }}
                    transition={{ duration: Math.max(120, games.length * 15), repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'flex', gap: '10px', width: 'max-content' }}
                >
                    {doubled.map((g, i) => (
                        <TickerCard key={`${g.id}-${i}`} game={g} />
                    ))}
                </motion.div>
            </div>
        </div>
    );
}

function TickerCard({ game }: { game: TickerGame }) {
    const isLive = game.status.short.startsWith('IN');
    const isDone = game.status.short === 'FT';
    const hasScore = isDone || isLive;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: isLive
                ? 'rgba(0,229,155,0.08)'
                : 'rgba(255,255,255,0.03)',
            border: `1px solid ${isLive ? 'rgba(0,229,155,0.2)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '10px',
            padding: '8px 14px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            backdropFilter: 'blur(8px)',
            minWidth: '200px',
        }}>
            {/* Sport badge */}
            <span style={{
                fontSize: '10px', fontWeight: 700,
                color: game.league === 'MLB' ? '#00529b' : game.league === 'NBA' ? '#f58426' : '#888',
                background: 'rgba(255,255,255,0.06)', borderRadius: '4px',
                padding: '1px 5px', marginRight: '2px',
            }}>
                {game.league === 'MLB' ? '⚾' : game.league === 'NBA' ? '🏀' : '🏒'}
            </span>
            {/* Away team */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {game.away.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={game.away.logo}
                        alt={game.away.name}
                        style={{ width: '20px', height: '20px', borderRadius: '3px', objectFit: 'contain' }}
                    />
                )}
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f3f4f6' }}>
                    {shortName(game.away.name)}
                </span>
                {hasScore && (
                    <span style={{ fontSize: '15px', fontWeight: 800, color: 'white', minWidth: '16px', textAlign: 'center' }}>
                        {game.away.score ?? 0}
                    </span>
                )}
            </div>

            {/* Divider */}
            <span style={{ color: '#6b7280', fontSize: '10px', fontWeight: 800 }}>@</span>

            {/* Home team */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {hasScore && (
                    <span style={{ fontSize: '15px', fontWeight: 800, color: 'white', minWidth: '16px', textAlign: 'center' }}>
                        {game.home.score ?? 0}
                    </span>
                )}
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f3f4f6' }}>
                    {shortName(game.home.name)}
                </span>
                {game.home.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={game.home.logo}
                        alt={game.home.name}
                        style={{ width: '20px', height: '20px', borderRadius: '3px', objectFit: 'contain' }}
                    />
                )}
            </div>

            {/* Status badge */}
            {isLive ? (
                <span style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    color: '#00e59b',
                    background: 'rgba(0,229,155,0.2)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    letterSpacing: '0.06em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                }}>
                    <span className="live-dot" style={{ width: '5px', height: '5px' }} />
                    LIVE
                </span>
            ) : isDone ? (
                <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: '#6b7280',
                    background: 'rgba(107,114,128,0.15)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                }}>
                    FINAL
                </span>
            ) : (
                <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: '#fbbf24',
                    background: 'rgba(251,191,36,0.12)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                }}>
                    {game.time}
                </span>
            )}
        </div>
    );
}
