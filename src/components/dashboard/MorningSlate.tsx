'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Clock, Bell, Zap } from 'lucide-react';

interface MorningSlateProps {
    totalGames: number;
    upcomingPicks: number;
    sports: string[];
}

export default function MorningSlate({ totalGames, upcomingPicks, sports }: MorningSlateProps): ReactNode {
    const [timeLeft, setTimeLeft] = useState('');

    // Calculate countdown to next pick (assumes picks drop at a regular cadence)
    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date();
            // Next pick time: find next game time or default to 1PM ET
            const nextDrop = new Date();
            nextDrop.setHours(13, 0, 0, 0); // 1 PM local as default
            if (nextDrop <= now) {
                nextDrop.setHours(19, 0, 0, 0); // 7 PM if past 1 PM
            }
            if (nextDrop <= now) {
                nextDrop.setDate(nextDrop.getDate() + 1);
                nextDrop.setHours(13, 0, 0, 0);
            }

            const diff = nextDrop.getTime() - now.getTime();
            const hours = Math.floor(diff / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${hours}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, []);

    const sportsText = sports.length > 0 ? sports.join(', ') : 'MLB';
    const hasUpcoming = upcomingPicks > 0;

    return (
        <motion.div
            className="morning-slate"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <Zap size={16} style={{ color: '#00e59b' }} />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#00e59b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Today&apos;s Slate
                        </span>
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
                        {totalGames > 0
                            ? `${totalGames} pick${totalGames !== 1 ? 's' : ''} across ${sportsText}`
                            : 'No picks yet today — check back soon'
                        }
                    </p>
                    {hasUpcoming && (
                        <p style={{ fontSize: '13px', color: '#9ca3af' }}>
                            {upcomingPicks} upcoming • Analysis dropping soon
                        </p>
                    )}
                </div>

                {/* Countdown */}
                <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', justifyContent: 'flex-end' }}>
                        <Clock size={13} style={{ color: '#6b7280' }} />
                        <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>Next pick drops in</span>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: 'white', letterSpacing: '0.02em' }}>
                        {timeLeft}
                    </div>
                    <button
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '8px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#00e59b',
                            background: 'rgba(0,229,155,0.1)',
                            border: '1px solid rgba(0,229,155,0.2)',
                            borderRadius: '8px',
                            padding: '5px 10px',
                            cursor: 'pointer',
                        }}
                    >
                        <Bell size={12} />
                        Notify Me
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
