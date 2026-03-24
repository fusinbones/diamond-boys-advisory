'use client';

import { type ReactNode } from 'react';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function CommunityPulse(): ReactNode {
    // Static preview — in production this would pull from Supabase community_messages
    const recentMessages = [
        { initials: 'MT', text: 'Yankees ML looking solid tonight, tailing the pick 🔥', time: '2m ago' },
        { initials: 'JK', text: 'Already up 3u on the week. Best service I\'ve used', time: '8m ago' },
        { initials: 'RB', text: 'Anyone watching the Dodgers game? Line moved', time: '15m ago' },
    ];

    return (
        <div className="dash-sidebar-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageCircle size={14} style={{ color: '#00e59b' }} />
                    <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#e5e7eb' }}>The Lounge</h3>
                </div>
                <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#00e59b',
                    background: 'rgba(0,229,155,0.1)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                }}>
                    12 online
                </span>
            </div>

            <div>
                {recentMessages.map((msg, i) => (
                    <div key={i} className="community-msg">
                        <div className="community-avatar">{msg.initials}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                                fontSize: '12px',
                                color: '#d1d5db',
                                lineHeight: 1.4,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {msg.text}
                            </p>
                            <span style={{ fontSize: '10px', color: '#6b7280' }}>{msg.time}</span>
                        </div>
                    </div>
                ))}
            </div>

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
                    marginTop: '12px',
                }}
            >
                <MessageCircle size={14} />
                Join the Conversation
            </Link>
        </div>
    );
}
