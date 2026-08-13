'use client';

import { Trophy, TrendingUp, Flame, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface KPICardProps {
    label: string;
    value: string;
    sub: string;
    trend?: string;
    icon: 'record' | 'roi' | 'streak' | 'edge';
    delay?: number;
}

const iconMap: Record<string, { Icon: React.ComponentType<{ size: number; className?: string }>; bg: string; color: string }> = {
    record: { Icon: Trophy, bg: 'rgba(106,0,255,0.1)', color: '#FFC107' },
    roi: { Icon: TrendingUp, bg: 'rgba(59,130,246,0.1)', color: '#60a5fa' },
    streak: { Icon: Flame, bg: 'rgba(251,146,60,0.1)', color: '#fb923c' },
    edge: { Icon: Target, bg: 'rgba(139,92,246,0.1)', color: '#a78bfa' },
};

export default function KPICard({ label, value, sub, trend, icon, delay = 0 }: KPICardProps): ReactNode {
    const { Icon, bg, color } = iconMap[icon] || iconMap.record;

    return (
        <motion.div
            className="kpi-card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
        >
            <div className="kpi-card__icon" style={{ background: bg }}>
                <span style={{ color, display: 'flex' }}>
                    <Icon size={16} />
                </span>
            </div>
            <p className="kpi-card__value">{value}</p>
            <p className="kpi-card__label">{sub}</p>
            {trend && <p className="kpi-card__trend">{trend}</p>}
        </motion.div>
    );
}
