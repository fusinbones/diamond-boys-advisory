'use client';

import { type ReactNode } from 'react';

interface ConfidenceMeterProps {
    value: number;
}

export default function ConfidenceMeter({ value }: ConfidenceMeterProps): ReactNode {
    const color = value >= 85 ? '#00e59b' : value >= 70 ? '#eab308' : '#f97316';

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="confidence-bar">
                <div
                    className="confidence-bar__fill"
                    style={{ width: `${value}%`, backgroundColor: color }}
                />
            </div>
            <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 600, color }}>
                {value}%
            </span>
        </div>
    );
}
