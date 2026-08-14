'use client';

import { useState, type ReactNode } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Eye, EyeOff, TrendingUp } from 'lucide-react';

interface DailyData {
    date: string;
    cumulative: number;
    record: string;
    units: number;
}

interface BankrollChartProps {
    data: DailyData[];
}

export default function BankrollChart({ data }: BankrollChartProps): ReactNode {
    const [visible, setVisible] = useState(true);

    const latestValue = data.length > 0 ? data[data.length - 1].cumulative : 0;
    const isPositive = latestValue >= 0;

    return (
        <div className="dash-sidebar-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <TrendingUp size={14} style={{ color: '#60a5fa' }} />
                        <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#e5e7eb' }}>Unit Growth</h3>
                    </div>
                    <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Cumulative performance</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={() => setVisible(!visible)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                    >
                        {visible
                            ? <Eye size={15} style={{ color: '#6b7280' }} />
                            : <EyeOff size={15} style={{ color: '#6b7280' }} />
                        }
                    </button>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '18px', fontWeight: 800, color: isPositive ? '#22c55e' : '#f87171' }}>
                            {visible ? `${isPositive ? '+' : ''}${latestValue}u` : '••••'}
                        </p>
                    </div>
                </div>
            </div>

            {data.length > 1 ? (
                <div style={{ height: '160px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="bankroll-grad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={isPositive ? '#22c55e' : '#f87171'} stopOpacity={0.15} />
                                    <stop offset="100%" stopColor={isPositive ? '#22c55e' : '#f87171'} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10, fill: '#52525b' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v: string) => {
                                    const parts = v.split('-');
                                    return parts.length >= 2 ? `${parts[1]}/${parts[2]}` : v;
                                }}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: '#52525b' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v: number) => visible ? `${v > 0 ? '+' : ''}${v}` : '••'}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#0f1629',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    color: '#e5e7eb',
                                }}
                                labelStyle={{ color: '#9ca3af' }}
                                formatter={(v) => [visible ? `${Number(v) > 0 ? '+' : ''}${v}u` : 'Hidden', 'Units']}
                            />
                            <Area
                                type="monotone"
                                dataKey="cumulative"
                                stroke={isPositive ? '#22c55e' : '#f87171'}
                                strokeWidth={2}
                                fill="url(#bankroll-grad)"
                                dot={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '13px' }}>
                    Performance data will appear after picks are graded
                </div>
            )}
        </div>
    );
}
