'use client';

import { useState, type ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
    text: string;
    children?: ReactNode;
}

export default function Tooltip({ text, children }: TooltipProps): ReactNode {
    const [show, setShow] = useState(false);

    return (
        <span
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
            onClick={() => setShow(!show)}
        >
            {children || <HelpCircle size={12} style={{ color: '#6b7280', cursor: 'pointer' }} />}
            {show && (
                <span style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: '6px',
                    padding: '8px 12px',
                    background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    lineHeight: '1.4',
                    color: '#d1d5db',
                    whiteSpace: 'normal',
                    width: '200px',
                    zIndex: 50,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    pointerEvents: 'none',
                    textAlign: 'left',
                }}>
                    {text}
                    <span style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderTop: '5px solid #1e293b',
                    }} />
                </span>
            )}
        </span>
    );
}
