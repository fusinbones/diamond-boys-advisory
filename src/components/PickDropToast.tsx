'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Zap, X, ArrowRight } from 'lucide-react';

/**
 * Global PickDropToast — lives in the root layout, polls for new picks,
 * and shows a dopamine-inducing animated toast notification on any page.
 */
export default function PickDropToast() {
    const [toast, setToast] = useState<{ count: number; sports: string } | null>(null);
    const [lastKnownCount, setLastKnownCount] = useState<number | null>(null);
    const [dismissed, setDismissed] = useState(false);

    const checkForNewPicks = useCallback(async () => {
        try {
            const res = await fetch('/api/dashboard/picks');
            if (!res.ok) return;
            const data = await res.json();
            const picks = data.picks || [];
            const upcomingPicks = picks.filter((p: { status: string }) => p.status === 'upcoming');
            const count = upcomingPicks.length;

            // Only show toast if count increased (new picks dropped)
            if (lastKnownCount !== null && count > lastKnownCount && !dismissed) {
                const newCount = count - lastKnownCount;
                const sports = [...new Set(upcomingPicks.map((p: { sport: string }) => p.sport))].join(', ') || 'MLB';
                setToast({ count: newCount, sports });
                // Auto-dismiss after 12 seconds
                setTimeout(() => setToast(null), 12000);
            }
            setLastKnownCount(count);
        } catch {
            // Silent fail
        }
    }, [lastKnownCount, dismissed]);

    useEffect(() => {
        // Initial check
        checkForNewPicks();
        // Poll every 2 minutes
        const interval = setInterval(checkForNewPicks, 120000);
        return () => clearInterval(interval);
    }, [checkForNewPicks]);

    if (!toast || dismissed) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: '80px',
                right: '16px',
                zIndex: 9999,
                maxWidth: '340px',
                width: 'calc(100vw - 32px)',
                background: 'linear-gradient(135deg, rgba(106,0,255,0.12), rgba(59,130,246,0.08))',
                border: '1px solid rgba(106,0,255,0.25)',
                borderRadius: '14px',
                padding: '16px',
                backdropFilter: 'blur(16px)',
                animation: 'pickToastSlide 0.4s ease-out, pickToastGlow 2s ease-in-out infinite',
            }}
        >
            {/* Close button */}
            <button
                onClick={() => { setToast(null); setDismissed(true); }}
                style={{
                    position: 'absolute', top: '8px', right: '8px',
                    background: 'none', border: 'none',
                    color: '#6b7280', cursor: 'pointer', padding: '4px',
                }}
            >
                <X size={14} />
            </button>

            {/* Content */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(106,0,255,0.2), rgba(106,0,255,0.08))',
                    border: '1px solid rgba(106,0,255,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    animation: 'pulse 1.5s ease infinite',
                }}>
                    <span style={{ fontSize: '20px' }}>🔥</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'white', margin: 0 }}>
                        {toast.count} new {toast.sports} pick{toast.count > 1 ? 's' : ''} just dropped!
                    </p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0' }}>
                        Expert analysis is live — check it out now
                    </p>
                </div>
            </div>

            {/* CTA */}
            <Link
                href="/community"
                onClick={() => setToast(null)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: '12px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #FFC107, #00c98a)',
                    color: '#0a0e17',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    transition: 'transform 0.1s',
                }}
            >
                <Zap size={14} />
                View in Elite Picks Channel
                <ArrowRight size={12} />
            </Link>
        </div>
    );
}
