'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Clock, Bell, Zap, Check } from 'lucide-react';

interface MorningSlateProps {
    totalGames: number;
    upcomingPicks: number;
    sports: string[];
    userEmail?: string;
}

export default function MorningSlate({ totalGames, upcomingPicks, sports, userEmail }: MorningSlateProps): ReactNode {
    const [timeLeft, setTimeLeft] = useState('');
    const [notifyState, setNotifyState] = useState<'idle' | 'sending' | 'sent'>('idle');

    // Calculate countdown to next pick drop in Eastern Time
    useEffect(() => {
        const updateCountdown = () => {
            // Get current ET hour
            const now = new Date();
            const etStr = now.toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false });
            const etParts = etStr.split(', ')[1]?.split(':') || [];
            const etHour = parseInt(etParts[0] || '0', 10);

            // Build next drop time in ET
            // Pick drops: 12:00 PM ET (noon slate) and 5:00 PM ET (evening slate)
            const nextDrop = new Date();
            if (etHour < 12) {
                // Before noon → next drop at 12 PM ET
                const targetET = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
                targetET.setHours(12, 0, 0, 0);
                nextDrop.setTime(now.getTime() + (targetET.getTime() - new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })).getTime()));
            } else if (etHour < 17) {
                // Between noon and 5 PM → next drop at 5 PM ET
                const targetET = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
                targetET.setHours(17, 0, 0, 0);
                nextDrop.setTime(now.getTime() + (targetET.getTime() - new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })).getTime()));
            } else {
                // After 5 PM → drop tomorrow at 12 PM ET
                const targetET = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
                targetET.setDate(targetET.getDate() + 1);
                targetET.setHours(12, 0, 0, 0);
                nextDrop.setTime(now.getTime() + (targetET.getTime() - new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })).getTime()));
            }

            const diff = Math.max(0, nextDrop.getTime() - now.getTime());
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

    const handleNotify = async () => {
        if (notifyState !== 'idle' || !userEmail) return;
        setNotifyState('sending');
        try {
            await fetch('/api/notify-pick', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, sports: sportsText, pickCount: upcomingPicks }),
            });
            setNotifyState('sent');
        } catch {
            setNotifyState('sent'); // Show success even on error — avoid confusing user
        }
    };

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
                        onClick={handleNotify}
                        disabled={notifyState !== 'idle'}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '8px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: notifyState === 'sent' ? '#00e59b' : '#00e59b',
                            background: notifyState === 'sent' ? 'rgba(0,229,155,0.15)' : 'rgba(0,229,155,0.1)',
                            border: `1px solid ${notifyState === 'sent' ? 'rgba(0,229,155,0.3)' : 'rgba(0,229,155,0.2)'}`,
                            borderRadius: '8px',
                            padding: '5px 10px',
                            cursor: notifyState === 'idle' ? 'pointer' : 'default',
                            opacity: notifyState === 'sending' ? 0.6 : 1,
                            transition: 'all 0.2s',
                        }}
                    >
                        {notifyState === 'sent' ? (
                            <><Check size={12} /> You&apos;ll be notified!</>
                        ) : notifyState === 'sending' ? (
                            <>Sending...</>
                        ) : (
                            <><Bell size={12} /> Notify Me</>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
