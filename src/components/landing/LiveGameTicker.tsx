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

interface SportConfig {
    key: string;
    emoji: string;
    label: string;
    color: string;
}

const SPORTS: SportConfig[] = [
    { key: 'MLB', emoji: '⚾', label: 'MLB', color: '#ef4444' },
    { key: 'NBA', emoji: '🏀', label: 'NBA', color: '#f97316' },
    { key: 'NHL', emoji: '🏒', label: 'NHL', color: '#3b82f6' },
];

function shortName(name: string): string {
    const map: Record<string, string> = {
        'New York Yankees': 'NY Yankees', 'New York Mets': 'NY Mets',
        'Los Angeles Dodgers': 'LA Dodgers', 'Los Angeles Angels': 'LA Angels',
        'San Francisco Giants': 'SF Giants', 'San Diego Padres': 'SD Padres',
        'Tampa Bay Rays': 'TB Rays', 'St. Louis Cardinals': 'STL Cardinals',
        'Kansas City Royals': 'KC Royals', 'Chicago White Sox': 'CHI White Sox',
        'Chicago Cubs': 'CHI Cubs',
        'Los Angeles Lakers': 'LA Lakers', 'Los Angeles Clippers': 'LA Clippers',
        'Golden State Warriors': 'GS Warriors', 'Oklahoma City Thunder': 'OKC Thunder',
        'San Antonio Spurs': 'SA Spurs', 'New Orleans Pelicans': 'NO Pelicans',
        'Portland Trail Blazers': 'POR Blazers', 'Minnesota Timberwolves': 'MIN Wolves',
    };
    return map[name] || name.split(' ').slice(-1)[0];
}

/** Single sport ticker row — infinitely scrolling */
function SportRow({ sport, games }: { sport: SportConfig; games: TickerGame[] }) {
    if (games.length === 0) return null;

    const doubled = [...games, ...games];
    const duration = Math.max(60, games.length * 12);

    return (
        <div style={{ width: '100%' }}>
            <div style={{
                position: 'relative', overflow: 'hidden',
                maskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
            }}>
                <motion.div
                    animate={{ x: ['0%', '-50%'] }}
                    transition={{ duration, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'flex', gap: '8px', width: 'max-content' }}
                >
                    {doubled.map((g, i) => (
                        <TickerCard key={`${g.id}-${i}`} game={g} sport={sport} />
                    ))}
                </motion.div>
            </div>
        </div>
    );
}

function TickerCard({ game, sport }: { game: TickerGame; sport: SportConfig }) {
    const isLive = game.status.short.startsWith('IN');
    const isDone = game.status.short === 'FT';
    const hasScore = isDone || isLive;

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: isLive ? 'rgba(0,229,155,0.08)' : `${sport.color}08`,
            border: `1px solid ${isLive ? 'rgba(0,229,155,0.2)' : `${sport.color}12`}`,
            borderRadius: '8px', padding: '6px 12px',
            whiteSpace: 'nowrap', flexShrink: 0,
            minWidth: '180px',
        }}>
            {/* Away */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {game.away.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={game.away.logo} alt={game.away.name}
                        style={{ width: '18px', height: '18px', borderRadius: '3px', objectFit: 'contain' }} />
                )}
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#f3f4f6' }}>
                    {shortName(game.away.name)}
                </span>
                {hasScore && (
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'white', minWidth: '14px', textAlign: 'center' }}>
                        {game.away.score ?? 0}
                    </span>
                )}
            </div>

            <span style={{ color: '#6b7280', fontSize: '9px', fontWeight: 800 }}>@</span>

            {/* Home */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {hasScore && (
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'white', minWidth: '14px', textAlign: 'center' }}>
                        {game.home.score ?? 0}
                    </span>
                )}
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#f3f4f6' }}>
                    {shortName(game.home.name)}
                </span>
                {game.home.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={game.home.logo} alt={game.home.name}
                        style={{ width: '18px', height: '18px', borderRadius: '3px', objectFit: 'contain' }} />
                )}
            </div>

            {/* Status */}
            {isLive ? (
                <span style={{
                    fontSize: '8px', fontWeight: 800, color: '#00e59b',
                    background: 'rgba(0,229,155,0.2)', padding: '1px 5px',
                    borderRadius: '3px', letterSpacing: '0.06em',
                    display: 'flex', alignItems: 'center', gap: '2px',
                }}>
                    <span className="live-dot" style={{ width: '4px', height: '4px' }} />
                    LIVE
                </span>
            ) : isDone ? (
                <span style={{
                    fontSize: '8px', fontWeight: 700, color: '#6b7280',
                    background: 'rgba(107,114,128,0.15)', padding: '1px 5px', borderRadius: '3px',
                }}>FINAL</span>
            ) : (
                <span style={{
                    fontSize: '8px', fontWeight: 700, color: '#fbbf24',
                    background: 'rgba(251,191,36,0.12)', padding: '1px 5px', borderRadius: '3px',
                }}>{game.time}</span>
            )}
        </div>
    );
}

export default function LiveGameTicker() {
    const [gamesBySport, setGamesBySport] = useState<Record<string, TickerGame[]>>({});
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        fetch('/api/games/public')
            .then(r => r.json())
            .then(data => {
                const allGames: TickerGame[] = data.games || [];
                // Group by league
                const grouped: Record<string, TickerGame[]> = {};
                for (const g of allGames) {
                    const league = g.league || 'Other';
                    if (!grouped[league]) grouped[league] = [];
                    grouped[league].push(g);
                }
                setGamesBySport(grouped);
                setLoaded(true);
            })
            .catch(() => setLoaded(true));
    }, []);

    if (!loaded) return null;

    const activeSports = SPORTS.filter(s => (gamesBySport[s.key] || []).length > 0);
    if (activeSports.length === 0) return null;

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {activeSports.map(sport => (
                <SportRow key={sport.key} sport={sport} games={gamesBySport[sport.key] || []} />
            ))}
        </div>
    );
}
