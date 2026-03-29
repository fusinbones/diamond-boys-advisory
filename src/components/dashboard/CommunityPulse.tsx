'use client';

import { type ReactNode } from 'react';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function CommunityPulse(): ReactNode {
    return (
        <div className="dash-sidebar-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageCircle size={14} style={{ color: '#00e59b' }} />
                    <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#e5e7eb' }}>The Lounge</h3>
                </div>
            </div>

            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '16px', lineHeight: 1.5 }}>
                Connect with the Diamond Boys team and other members to discuss today's slate, track live games, and more.
            </p>

            <Link
                href="/community"
                className="btn-glow"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: '100%',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                }}
            >
                <MessageCircle size={14} />
                Join the chat here!
            </Link>
        </div>
    );
}
