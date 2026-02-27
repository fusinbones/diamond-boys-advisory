'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';
import Link from 'next/link';

function getTargetDate(): Date {
    if (typeof window === 'undefined') return new Date(Date.now() + 48 * 60 * 60 * 1000);
    const stored = localStorage.getItem('db_countdown_target');
    if (stored) {
        const date = new Date(stored);
        if (date > new Date()) return date;
    }
    const target = new Date(Date.now() + 48 * 60 * 60 * 1000);
    localStorage.setItem('db_countdown_target', target.toISOString());
    return target;
}

export default function CountdownTimer() {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const target = getTargetDate();
        const tick = () => {
            const diff = Math.max(0, target.getTime() - Date.now());
            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
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
        { value: timeLeft.days, label: 'Days' },
        { value: timeLeft.hours, label: 'Hours' },
        { value: timeLeft.minutes, label: 'Mins' },
        { value: timeLeft.seconds, label: 'Secs' },
    ];

    return (
        <section style={{ paddingTop: '40px', paddingBottom: '40px' }}>
            <div className="container-db" style={{ maxWidth: '560px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ position: 'relative', overflow: 'hidden', borderRadius: '14px' }}
                >
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,229,155,0.3), rgba(0,212,170,0.1), rgba(0,229,155,0.3))', borderRadius: '14px' }} />
                    <div style={{ position: 'relative', margin: '1px', background: '#0a1020', borderRadius: '13px', padding: '28px 20px', textAlign: 'center' }}>
                        <span className="badge-gold" style={{ padding: '5px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '12px' }}>
                            <Clock size={12} />
                            Limited Time Offer
                        </span>

                        <h3 className="font-display" style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 700, color: 'white', marginBottom: '6px' }}>
                            ⚾ MLB Season Picks
                        </h3>
                        <p style={{ color: '#d1d5db', fontSize: '15px', marginBottom: '20px', lineHeight: 1.5 }}>
                            Lock in the <span style={{ color: '#fbbf24', fontWeight: 600 }}>Season Pass</span> — every pick through the World Series.
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                            {timeBlocks.map((block) => (
                                <div key={block.label} style={{ textAlign: 'center' }}>
                                    <div className="glass-card" style={{ width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px', borderColor: 'rgba(0,229,155,0.15)' }}>
                                        <span className="font-display" style={{ fontSize: '22px', fontWeight: 900, color: 'white', fontVariantNumeric: 'tabular-nums' }}>
                                            {String(block.value).padStart(2, '0')}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
                                        {block.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <Link href="/pricing" className="btn-glow" style={{ width: '100%', maxWidth: '240px', display: 'inline-flex', justifyContent: 'center', fontSize: '14px' }}>
                            <Zap size={14} />
                            Grab the Season Pass
                        </Link>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '10px' }}>
                            Sign up now — be first in line when we launch
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
