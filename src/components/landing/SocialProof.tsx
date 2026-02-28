'use client';

import { motion } from 'framer-motion';
import { Users, Shield, ArrowRight, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function SocialProof() {
    return (
        <section style={{ paddingTop: '40px', paddingBottom: '40px' }}>
            <div className="container-db">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                    {/* Community card */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="glass-card"
                        style={{ padding: '24px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0,229,155,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                            <Users size={18} style={{ color: '#00e59b' }} />
                        </div>
                        <h3 style={{ color: 'white', fontWeight: 600, fontSize: '17px', marginBottom: '4px' }}>Join 1,200+ Members</h3>
                        <p style={{ color: '#c9cdd3', fontSize: '14px', marginBottom: '16px' }}>Growing daily — limited Elite tier spots remaining</p>

                        {/* Progress bar */}
                        <div style={{ width: '100%', maxWidth: '260px', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                                <span style={{ color: '#9ca3af' }}>Community capacity</span>
                                <span style={{ color: '#00e59b', fontWeight: 600 }}>82% Full</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: '#1a2744', borderRadius: '3px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: '82%' }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1.5, ease: 'easeOut' }}
                                    style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(to right, #00e59b, #00d4aa)' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <span className="badge badge-danger" style={{ fontSize: '12px' }}>🔥 50 Elite spots left</span>
                            <span className="badge badge-gold" style={{ fontSize: '12px' }}>⭐ 4.9/5 rating</span>
                        </div>
                    </motion.div>

                    {/* Discord preview card */}
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
                            <h3 style={{ color: 'white', fontWeight: 600, fontSize: '17px', marginBottom: '4px' }}>Exclusive Discord</h3>
                            <p style={{ color: '#c9cdd3', fontSize: '14px' }}>Real-time picks, alerts & expert chat</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px', flex: 1 }}>
                            {[
                                { user: 'DiamondBot', msg: '⚾ NEW PICK: Yankees -1.5 | HIGH', color: '#00e59b' },
                                { user: 'Coach_DB', msg: 'Line moving fast — lock it in', color: '#fbbf24' },
                                { user: 'Mike_R', msg: '💰 Already locked. LFG!', color: '#e5e7eb' },
                            ].map((m, i) => (
                                <div key={i} style={{ background: 'rgba(26,39,68,0.5)', borderRadius: '8px', padding: '8px 12px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: m.color }}>{m.user}</span>
                                    <p style={{ color: '#c9cdd3', fontSize: '14px', margin: '2px 0 0' }}>{m.msg}</p>
                                </div>
                            ))}
                        </div>

                        <Link href="/pricing" className="btn-outline" style={{ width: '100%', justifyContent: 'center', fontSize: '14px' }}>
                            Join Early Access
                            <ArrowRight size={14} />
                        </Link>
                    </motion.div>
                </div>

                {/* Trust indicators */}
                <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
                    {[
                        { icon: Shield, text: 'Launching Soon — Early Access Open' },
                        { icon: Users, text: '1,200+ Verified Members' },
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
