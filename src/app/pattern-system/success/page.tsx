'use client';

import { Suspense, useEffect, useRef } from 'react';
import { ArrowUpDown, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  Inline canvas confetti — no external libraries                     */
/* ------------------------------------------------------------------ */
function ConfettiCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const resize = () => {
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.scale(dpr, dpr);
        };
        resize();
        window.addEventListener('resize', resize);

        interface Particle {
            x: number;
            y: number;
            w: number;
            h: number;
            color: string;
            vx: number;
            vy: number;
            rotation: number;
            rotationSpeed: number;
            opacity: number;
            decay: number;
        }

        const colors = ['#a78bfa', '#c4b5fd', '#FFC107', '#FFC107', '#fbbf24', '#f472b6', '#60a5fa'];
        const particles: Particle[] = [];
        const PARTICLE_COUNT = 120;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight * -1 - 20,
                w: Math.random() * 8 + 4,
                h: Math.random() * 6 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 2,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                opacity: 1,
                decay: Math.random() * 0.003 + 0.002,
            });
        }

        let frameId: number;
        const animate = () => {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            let alive = false;

            for (const p of particles) {
                if (p.opacity <= 0) continue;
                alive = true;

                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.04;
                p.rotation += p.rotationSpeed;
                p.opacity -= p.decay;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            }

            if (alive) {
                frameId = requestAnimationFrame(animate);
            }
        };

        frameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 50,
            }}
        />
    );
}

/* ------------------------------------------------------------------ */
/*  Success content                                                    */
/* ------------------------------------------------------------------ */
const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: 0.15 + i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
    }),
};

const unlockedFeatures = [
    { icon: ArrowUpDown, text: 'Real-time W/L alternation analysis' },
    { icon: Check, text: 'Break probability scoring (62–99%)' },
    { icon: Check, text: 'Pitcher milestone alerts & revenge detection' },
    { icon: Check, text: 'Advanced search, filter & sort tools' },
];

function PatternSuccessContent() {
    return (
        <div style={{
            minHeight: '100vh',
            background: '#040810',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 16px',
            position: 'relative',
        }}>
            <ConfettiCanvas />

            <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center', zIndex: 10 }}>
                {/* Glow ring behind emoji */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{
                        width: '88px',
                        height: '88px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(167,139,250,0.15), transparent 70%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        border: '2px solid rgba(167,139,250,0.2)',
                    }}
                >
                    <span style={{ fontSize: '40px' }}>🎉</span>
                </motion.div>

                {/* Heading */}
                <motion.h1
                    custom={0}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    style={{
                        color: 'white',
                        fontSize: '32px',
                        fontWeight: 900,
                        margin: '0 0 8px',
                        fontFamily: 'var(--font-display)',
                    }}
                >
                    You&apos;re In! 🎉
                </motion.h1>

                <motion.p
                    custom={1}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    style={{
                        color: '#9ca3af',
                        fontSize: '16px',
                        margin: '0 0 32px',
                        lineHeight: 1.5,
                    }}
                >
                    Your Pattern System access is now active.
                </motion.p>

                {/* Unlocked features card */}
                <motion.div
                    custom={2}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    style={{
                        background: 'linear-gradient(135deg, rgba(167,139,250,0.06), rgba(26,39,68,0.4))',
                        border: '1px solid rgba(167,139,250,0.12)',
                        borderRadius: '16px',
                        padding: '24px',
                        marginBottom: '28px',
                        textAlign: 'left',
                    }}
                >
                    <h3 style={{
                        color: '#c4b5fd',
                        fontSize: '13px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        margin: '0 0 16px',
                    }}>
                        Here&apos;s what you just unlocked:
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {unlockedFeatures.map((feat, i) => (
                            <motion.div
                                key={i}
                                custom={3 + i}
                                variants={fadeUp}
                                initial="hidden"
                                animate="visible"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                }}
                            >
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    background: 'rgba(106,0,255,0.1)',
                                    border: '1px solid rgba(106,0,255,0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <feat.icon size={14} style={{ color: '#FFC107' }} />
                                </div>
                                <span style={{ color: '#d1d5db', fontSize: '14px' }}>{feat.text}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Primary CTA */}
                <motion.div
                    custom={7}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                >
                    <Link
                        href="/patterns"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '16px 24px',
                            background: 'linear-gradient(135deg, #FFC107, #00b377)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#0a0f1e',
                            fontSize: '16px',
                            fontWeight: 800,
                            textDecoration: 'none',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                            boxShadow: '0 0 24px rgba(106,0,255,0.2)',
                        }}
                    >
                        Open Pattern System
                        <ArrowRight size={18} />
                    </Link>
                </motion.div>

                {/* Secondary text */}
                <motion.p
                    custom={8}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    style={{
                        color: '#6b7280',
                        fontSize: '13px',
                        marginTop: '20px',
                        lineHeight: 1.5,
                    }}
                >
                    Your subscription is $49.99/month. Cancel anytime from your account.
                </motion.p>
            </div>
        </div>
    );
}

export default function PatternSuccessPage() {
    return (
        <Suspense fallback={
            <div style={{
                padding: '80px 0',
                textAlign: 'center',
                background: '#040810',
                minHeight: '100vh',
            }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{
                    width: '32px', height: '32px',
                    border: '2px solid rgba(167,139,250,0.3)',
                    borderTopColor: '#a78bfa', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto',
                }} />
            </div>
        }>
            <PatternSuccessContent />
        </Suspense>
    );
}
