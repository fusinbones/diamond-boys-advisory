'use client';

import { Flame } from 'lucide-react';
import { type ReactNode } from 'react';

interface UnitsBadgeProps {
    units: number;
}

export default function UnitsBadge({ units }: UnitsBadgeProps): ReactNode {
    const count = Math.ceil(units);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {[...Array(Math.min(count, 5))].map((_, i) => (
                <Flame
                    key={i}
                    size={13}
                    style={{
                        color: '#fb923c',
                        opacity: i < Math.floor(units) ? 1 : 0.35,
                    }}
                />
            ))}
            <span style={{ fontSize: '12px', color: '#fdba74', marginLeft: '4px', fontWeight: 600 }}>
                {units}u
            </span>
        </div>
    );
}
