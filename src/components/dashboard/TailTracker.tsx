'use client';

import { useState, type ReactNode } from 'react';
import { DollarSign, ChevronUp } from 'lucide-react';

interface TailTrackerProps {
    seasonUnits: number;
    weekUnits: number;
    totalPicks: number;
}

const unitSizes = [10, 25, 50, 100, 250];

export default function TailTracker({ seasonUnits, weekUnits, totalPicks }: TailTrackerProps): ReactNode {
    const [unitSize, setUnitSize] = useState(50);

    const seasonDollars = seasonUnits * unitSize;
    const weekDollars = weekUnits * unitSize;

    return (
        <div className="dash-sidebar-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                <DollarSign size={14} style={{ color: '#00e59b' }} />
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#e5e7eb' }}>If You Tailed</h3>
            </div>

            {/* Unit size selector */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                {unitSizes.map((s) => (
                    <button
                        key={s}
                        onClick={() => setUnitSize(s)}
                        style={{
                            flex: 1,
                            padding: '5px 0',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            border: '1px solid',
                            borderColor: unitSize === s ? 'rgba(0,229,155,0.3)' : 'rgba(255,255,255,0.06)',
                            background: unitSize === s ? 'rgba(0,229,155,0.1)' : 'transparent',
                            color: unitSize === s ? '#00e59b' : '#6b7280',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        ${s}
                    </button>
                ))}
            </div>

            {/* Results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>This week</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {weekUnits > 0 && <ChevronUp size={14} style={{ color: '#00e59b' }} />}
                        <span style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: weekUnits >= 0 ? '#00e59b' : '#f87171',
                        }}>
                            {weekUnits >= 0 ? '+' : ''}{weekUnits}u
                        </span>
                        <span style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: weekDollars >= 0 ? '#00e59b' : '#f87171',
                            marginLeft: '4px',
                            opacity: 0.8,
                        }}>
                            ({weekDollars >= 0 ? '+' : ''}${Math.abs(weekDollars).toLocaleString()})
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>All season</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: seasonUnits >= 0 ? '#00e59b' : '#f87171',
                        }}>
                            {seasonUnits >= 0 ? '+' : ''}{seasonUnits}u
                        </span>
                        <span style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: seasonDollars >= 0 ? '#00e59b' : '#f87171',
                            marginLeft: '4px',
                            opacity: 0.8,
                        }}>
                            ({seasonDollars >= 0 ? '+' : ''}${Math.abs(seasonDollars).toLocaleString()})
                        </span>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>
                        Based on {totalPicks} graded picks at ${unitSize}/unit
                    </span>
                </div>
            </div>
        </div>
    );
}
