'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Clock, TrendingUp, Target, Shield } from 'lucide-react';

function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (!isInView) return;
        const duration = 2000;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);
        return () => clearInterval(timer);
    }, [isInView, target]);

    return (
        <span ref={ref} className="font-display" style={{ fontWeight: 900, fontSize: 'clamp(24px, 3vw, 34px)', color: 'white', fontVariantNumeric: 'tabular-nums' }}>
            {prefix}{count.toLocaleString()}{suffix}
        </span>
    );
}

const stats = [
    { icon: Clock, label: 'Years Experience', value: 30, suffix: '+', prefix: '', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', detail: 'Combined expertise' },
    { icon: TrendingUp, label: 'Sportsbooks Tracked', value: 11, suffix: '+', prefix: '', color: '#FFC107', bg: 'rgba(106,0,255,0.1)', detail: 'Real-time odds' },
    { icon: Target, label: 'Picks Documented', value: 100, suffix: '%', prefix: '', color: '#FFC107', bg: 'rgba(106,0,255,0.1)', detail: 'Wins & losses' },
    { icon: Shield, label: 'Proprietary Models', value: 5, suffix: '+', prefix: '', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', detail: 'Analysis engines' },
];

export default function StatsBar() {
    return (
        <section style={{ paddingTop: '40px', paddingBottom: '40px' }}>
            <div className="container-db">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ textAlign: 'center', marginBottom: '28px' }}
                >
                    <h2 className="font-display" style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
                        Built on Experience. <span className="gradient-text">Backed by Data.</span>
                    </h2>
                    <p style={{ color: '#d1d5db', fontSize: '15px', maxWidth: '480px', margin: '0 auto' }}>
                        Proprietary analysis models refined over three decades. Every single pick documented, wins and losses alike.
                    </p>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                    {stats.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.06 }}
                            className="glass-card"
                            style={{ padding: '20px 14px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
                        >
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <stat.icon size={16} style={{ color: stat.color }} />
                            </div>
                            <AnimatedCounter target={stat.value} suffix={stat.suffix} prefix={stat.prefix || ''} />
                            <p style={{ color: '#e5e7eb', fontSize: '14px', fontWeight: 600, margin: 0 }}>{stat.label}</p>
                            <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>{stat.detail}</p>
                        </motion.div>
                    ))}
                </div>

                <p style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', marginTop: '14px' }}>
                    For entertainment purposes only. Past analysis ≠ future outcomes.
                </p>
            </div>
        </section>
    );
}
