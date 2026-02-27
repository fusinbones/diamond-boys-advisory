'use client';

import { motion } from 'framer-motion';
import { BarChart3, MessageSquare, Target, Bell, Lock, Gem } from 'lucide-react';

const features = [
    { icon: Target, title: 'Expert Picks Daily', desc: 'Data-driven college basketball picks with detailed analysis and confidence ratings.', color: '#00e59b', bg: 'rgba(0,229,155,0.1)' },
    { icon: MessageSquare, title: 'Private Discord', desc: 'Real-time alerts, live game-day discussions, and direct expert Q&A sessions.', color: '#5865F2', bg: 'rgba(88,101,242,0.1)' },
    { icon: BarChart3, title: 'Transparent Record', desc: 'Every pick tracked publicly — wins and losses. Full accountability, no cherry-picking.', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    { icon: Bell, title: 'Real-Time Alerts', desc: 'Line movement alerts pushed via Discord notifications so you never miss value.', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
    { icon: Lock, title: 'Secure & Private', desc: 'All payments processed via Stripe. PCI-DSS compliant. Your data stays safe.', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    { icon: Gem, title: 'VIP Tiers', desc: 'Upgrade for expanded picks, exclusive parlay plays, and priority VIP channels.', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
];

export default function FeaturesSection() {
    return (
        <section style={{ paddingTop: '40px', paddingBottom: '40px' }}>
            <div className="container-db">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ textAlign: 'center', marginBottom: '28px' }}
                >
                    <h2 className="font-display" style={{ fontSize: 'clamp(20px, 3vw, 30px)', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
                        Why <span className="gradient-text">Diamond Boys</span>?
                    </h2>
                    <p style={{ color: '#6b7280', fontSize: '13px', maxWidth: '400px', margin: '0 auto' }}>
                        Deep analytics, expert insight, and community — all in one subscription.
                    </p>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                    {features.map((f, i) => (
                        <motion.div
                            key={f.title}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            className="glass-card glass-card-hover"
                            style={{ padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        >
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                                <f.icon size={18} style={{ color: f.color }} />
                            </div>
                            <h3 style={{ color: 'white', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>{f.title}</h3>
                            <p style={{ color: '#6b7280', fontSize: '12px', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
