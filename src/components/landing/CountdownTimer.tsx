'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, Bell } from 'lucide-react';
import Link from 'next/link';

function getNextPickDrop(): Date {
    const now = new Date();
    // Next pick drop is always today at 10 AM ET (or tomorrow if past 10 AM)
    const etStr = now.toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false });
    const etParts = etStr.split(', ')[1]?.split(':') || [];
    const etHour = parseInt(etParts[0] || '0', 10);

    const targetET = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    if (etHour >= 10) {
        targetET.setDate(targetET.getDate() + 1);
    }
    targetET.setHours(10, 0, 0, 0);

    const offset = targetET.getTime() - new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })).getTime();
    const target = new Date(now.getTime() + offset);
    return target;
}

export default function CountdownTimer() {
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const target = getNextPickDrop();
        const tick = () => {
            const diff = Math.max(0, target.getTime() - Date.now());
            setTimeLeft({
                hours: Math.floor(diff / (1000 * 60 * 60)),
                minutes: Math.floor((diff / (1000 * 60)) % 60),
                seconds: Math.floor((diff / 1000) % 60),
            });
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!mounted) return null;

    const timeBlocks = [
        { value: timeLeft.hours, label: 'Hours' },
        { value: timeLeft.minutes, label: 'Mins' },
        { value: timeLeft.seconds, label: 'Secs' },
    ];

    const isUrgent = timeLeft.hours < 2;

    return (
        <section style={{ paddingTop: '40px', paddingBottom: '40px' }}>
            <div className="container-db" style={{ maxWidth: '600px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px' }}
                >
                    {/* Animated gradient border */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: isUrgent
                            ? 'linear-gradient(135deg, rgba(239,68,68,0.4), rgba(251,191,36,0.3), rgba(239,68,68,0.4))'
                            : 'linear-gradient(135deg, rgba(0,229,155,0.3), rgba(99,102,241,0.2), rgba(0,229,155,0.3))',
                        borderRadius: '16px',
                        animation: 'spin 6s linear infinite',
                        backgroundSize: '200% 200%',
                    }} />

                    <div style={{
                        position: 'relative', margin: '1px',
                        background: 'linear-gradient(135deg, #0a1020 0%, #0d1428 100%)',
                        borderRadius: '15px', padding: '32px 24px', textAlign: 'center',
                    }}>
                        {/* Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
                            <span style={{
                                background: isUrgent ? 'rgba(239,68,68,0.12)' : 'rgba(251,191,36,0.12)',
                                color: isUrgent ? '#ef4444' : '#fbbf24',
                                padding: '5px 14px', borderRadius: '20px',
                                fontSize: '12px', fontWeight: 800,
                                textTransform: 'uppercase', letterSpacing: '0.08em',
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                            }}>
                                {isUrgent && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />}
                                <Clock size={12} />
                                {isUrgent ? '🔥 Pick Drop Imminent' : 'Next Pick Drop'}
                            </span>
                        </div>

                        <h3 className="font-display" style={{
                            fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800,
                            color: 'white', marginBottom: '6px',
                        }}>
                            🎯 TriplePlayz Pick Incoming
                        </h3>
                        <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '22px', lineHeight: 1.5 }}>
                            Premium members get notified <span style={{ color: '#00e59b', fontWeight: 600 }}>30 minutes before</span> every pick drop
                        </p>

                        {/* Countdown blocks */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '22px' }}>
                            {timeBlocks.map((block) => (
                                <div key={block.label} style={{ textAlign: 'center' }}>
                                    <div style={{
                                        width: '64px', height: '64px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: '6px', borderRadius: '12px',
                                        background: isUrgent ? 'rgba(239,68,68,0.06)' : 'rgba(0,229,155,0.06)',
                                        border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.15)' : 'rgba(0,229,155,0.12)'}`,
                                    }}>
                                        <span className="font-display" style={{
                                            fontSize: '28px', fontWeight: 900,
                                            color: isUrgent ? '#fca5a5' : 'white',
                                            fontVariantNumeric: 'tabular-nums',
                                        }}>
                                            {String(block.value).padStart(2, '0')}
                                        </span>
                                    </div>
                                    <span style={{
                                        fontSize: '11px', color: '#6b7280',
                                        textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600,
                                    }}>
                                        {block.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* CTAs */}
                        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px', justifyContent: 'center' }}>
                            <Link href="/pricing" className="btn-glow" style={{
                                maxWidth: '240px', display: 'inline-flex', justifyContent: 'center', fontSize: '14px',
                            }}>
                                <Zap size={14} />
                                Subscribe & Never Miss a Pick
                            </Link>
                            <Link href="/pricing" style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                color: '#9ca3af', fontSize: '13px', fontWeight: 600,
                                textDecoration: 'none', padding: '8px 16px',
                                borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)',
                                background: 'rgba(255,255,255,0.02)',
                            }}>
                                <Bell size={13} />
                                Get Notified Free
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
