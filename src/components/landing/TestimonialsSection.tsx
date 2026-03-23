'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
    {
        name: 'Mike R.',
        handle: '@mikeR_bets',
        avatar: '🏀',
        text: "Joined TriplePlayz 3 months ago and I'm up over 40 units. The daily picks are sharp and the TriplePlayz Lounge community is a goldmine.",
        rating: 5,
        tier: 'Monthly Elite',
        since: 'Member since Nov 2025',
    },
    {
        name: 'Jason T.',
        handle: '@jt_plays',
        avatar: '💎',
        text: "Best money I've spent on sports analysis. The weekly deep dives alone are worth it. These guys are the real deal.",
        rating: 5,
        tier: 'Weekly Package',
        since: 'Member since Oct 2025',
    },
    {
        name: 'Carlos D.',
        handle: '@carlos_wins',
        avatar: '🔥',
        text: "Started with the free trial and haven't looked back. Every single pick tracked, win or loss. That's integrity.",
        rating: 5,
        tier: 'Season Pass',
        since: 'Member since Sep 2025',
    },
];

export default function TestimonialsSection() {
    return (
        <section style={{ paddingTop: '40px', paddingBottom: '40px' }}>
            <div className="container-db">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ textAlign: 'center', marginBottom: '24px' }}
                >
                    <h2 className="font-display" style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
                        Hear From <span className="gradient-text">TriplePlayz</span>
                    </h2>
                    <p style={{ color: '#d1d5db', fontSize: '15px' }}>
                        Real feedback from verified subscribers.
                    </p>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.06 }}
                            className="glass-card"
                            style={{ padding: '20px', display: 'flex', flexDirection: 'column', textAlign: 'center', alignItems: 'center' }}
                        >
                            {/* Stars */}
                            <div style={{ display: 'flex', gap: '2px', marginBottom: '10px' }}>
                                {Array.from({ length: t.rating }).map((_, j) => (
                                    <Star key={j} size={14} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                                ))}
                            </div>

                            {/* Quote */}
                            <p style={{ color: '#e5e7eb', fontSize: '15px', lineHeight: 1.6, marginBottom: '14px', flex: 1 }}>
                                &ldquo;{t.text}&rdquo;
                            </p>

                            {/* Author */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '20px' }}>{t.avatar}</span>
                                <div style={{ textAlign: 'left' }}>
                                    <p style={{ color: 'white', fontSize: '14px', fontWeight: 600, margin: 0 }}>{t.name}</p>
                                    <p style={{ color: '#00e59b', fontSize: '12px', margin: 0, fontWeight: 500 }}>{t.tier}</p>
                                </div>
                            </div>
                            <p style={{ color: '#6b7280', fontSize: '11px', margin: 0 }}>{t.since}</p>
                        </motion.div>
                    ))}
                </div>

                <p style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', marginTop: '14px' }}>
                    * Individual results vary. Testimonials reflect personal experiences and are not guarantees.
                </p>
            </div>
        </section>
    );
}
