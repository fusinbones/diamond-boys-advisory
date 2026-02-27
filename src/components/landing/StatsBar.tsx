'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Users, TrendingUp, Trophy, Flame } from 'lucide-react';

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
    { icon: Users, label: 'Active Members', value: 1247, suffix: '+', color: '#00e59b', bg: 'rgba(0,229,155,0.1)', detail: 'Growing daily' },
    { icon: TrendingUp, label: 'Win Rate', value: 65, suffix: '%', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', detail: 'Documented & verified' },
    { icon: Trophy, label: 'Units Profit', value: 187, suffix: '', prefix: '+', color: '#34d399', bg: 'rgba(52,211,153,0.1)', detail: 'This season' },
    { icon: Flame, label: 'Win Streak', value: 8, suffix: ' picks', color: '#f97316', bg: 'rgba(249,115,22,0.1)', detail: 'Current streak' },
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
                        Real Results. <span className="gradient-text">Real Transparency.</span>
                    </h2>
                    <p style={{ color: '#d1d5db', fontSize: '15px', maxWidth: '420px', margin: '0 auto' }}>
                        Every pick tracked and verified. No fluff — just documented performance.
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
                    * Statistics reflect current season. Past results ≠ future outcomes.
                </p>
            </div>
        </section>
    );
}
