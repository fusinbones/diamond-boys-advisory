'use client';

import { motion } from 'framer-motion';
import { Shield, ArrowRight, MessageCircle, Clock, Award } from 'lucide-react';
import Link from 'next/link';

export default function SocialProof() {
    return (
        <section style={{ paddingTop: '40px', paddingBottom: '40px' }}>
            <div className="container-db">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                    {/* Trust & Experience card */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="glass-card"
                        style={{ padding: '24px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0,229,155,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                            <Award size={18} style={{ color: '#00e59b' }} />
                        </div>
                        <h3 style={{ color: 'white', fontWeight: 600, fontSize: '17px', marginBottom: '4px' }}>30+ Years of Expertise</h3>
                        <p style={{ color: '#c9cdd3', fontSize: '14px', marginBottom: '16px', lineHeight: 1.6 }}>
                            Decades of sports analysis experience distilled into proprietary models. Every game, every angle — analyzed with precision.
                        </p>

                        {/* Credential highlights */}
                        <div style={{ width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                            {[
                                { icon: Clock, text: 'Decades of documented analysis', color: '#fbbf24' },
                                { icon: Shield, text: 'Full transparency — every pick tracked', color: '#00e59b' },
                                { icon: Award, text: 'Proprietary data-driven models', color: '#a78bfa' },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    background: 'rgba(26,39,68,0.3)', borderRadius: '8px', padding: '10px 14px',
                                }}>
                                    <item.icon size={14} style={{ color: item.color, flexShrink: 0 }} />
                                    <span style={{ color: '#d1d5db', fontSize: '13px', textAlign: 'left' }}>{item.text}</span>
                                </div>
                            ))}
                        </div>

                        <Link href="/dashboard?signup=free" className="btn-outline" style={{ width: '100%', justifyContent: 'center', fontSize: '14px' }}>
                            Get Started Free
                            <ArrowRight size={14} />
                        </Link>
                    </motion.div>

                    {/* Community chat preview card */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.08 }}
                        className="glass-card"
                        style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column' }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(88,101,242,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                                <MessageCircle size={18} style={{ color: '#5865F2' }} />
                            </div>
                            <h3 style={{ color: 'white', fontWeight: 600, fontSize: '17px', marginBottom: '4px' }}>The TriplePlayz Lounge</h3>
                            <p style={{ color: '#c9cdd3', fontSize: '14px' }}>Real-time picks, alerts & expert chat</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px', flex: 1 }}>
                            {[
                                { user: 'TriplePlayzBot', msg: '⚾ NEW PICK: Yankees -1.5 | HIGH', color: '#00e59b' },
                                { user: 'Coach_DB', msg: 'Line moving fast — lock it in', color: '#fbbf24' },
                                { user: 'Mike_R', msg: '💰 Already locked. LFG!', color: '#e5e7eb' },
                            ].map((m, i) => (
                                <div key={i} style={{ background: 'rgba(26,39,68,0.5)', borderRadius: '8px', padding: '8px 12px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: m.color }}>{m.user}</span>
                                    <p style={{ color: '#c9cdd3', fontSize: '14px', margin: '2px 0 0' }}>{m.msg}</p>
                                </div>
                            ))}
                        </div>

                        <Link href="/dashboard?signup=free" className="btn-outline" style={{ width: '100%', justifyContent: 'center', fontSize: '14px' }}>
                            Join The Lounge Free
                            <ArrowRight size={14} />
                        </Link>
                    </motion.div>
                </div>

                {/* Trust indicators */}
                <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
                    {[
                        { icon: Shield, text: 'Stripe-secured payments' },
                        { icon: Award, text: 'Expert-curated analysis daily' },
                    ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9ca3af', fontSize: '14px' }}>
                            <item.icon size={14} style={{ color: 'rgba(0,229,155,0.5)' }} />
                            <span>{item.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
