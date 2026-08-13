'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import {
    Flame, ChevronLeft, ChevronRight, CheckCircle, Lock,
    BookOpen, Eye, Target, BarChart3, TrendingUp, Shield, Zap,
    ArrowRight, Megaphone, Rocket, X, AlertTriangle, Star
} from 'lucide-react';
import Module1 from './modules/Module1';
import Module2 from './modules/Module2';
import Module3 from './modules/Module3';
import Module4 from './modules/Module4';
import Module5 from './modules/Module5';
import Module6 from './modules/Module6';
import Module7 from './modules/Module7';
import './learn.css';

const PREVIEW_KEY = 'FIRE2025';

const MODULES = [
    { num: 1, title: 'The Hidden Pattern', icon: Eye },
    { num: 2, title: 'Reading the Board', icon: BookOpen },
    { num: 3, title: 'True vs Developing', icon: Target },
    { num: 4, title: 'The Break Score', icon: BarChart3 },
    { num: 5, title: 'The Double-Up Recovery', icon: TrendingUp },
    { num: 6, title: 'Bankroll Management', icon: Shield },
    { num: 7, title: 'Your Daily System', icon: Zap },
];

const MODULE_COMPONENTS = [Module1, Module2, Module3, Module4, Module5, Module6, Module7];

interface Announcement {
    id: string;
    title: string;
    body: string;
    type: string;
    created_at: string;
}

export default function LearnPage() {
    return (
        <Suspense fallback={
            <div className="fire-learn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="fire-loading-spinner" />
                    <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '12px' }}>Loading your course...</p>
                </div>
            </div>
        }>
            <LearnPageInner />
        </Suspense>
    );
}

function LearnPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();

    const [activeModule, setActiveModule] = useState(0);
    const [completed, setCompleted] = useState<Set<number>>(new Set());
    const [accessState, setAccessState] = useState<'loading' | 'granted' | 'denied'>('loading');
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());

    // ── Access check ──
    useEffect(() => {
        if (authLoading) return;

        const checkAccess = async () => {
            // 1. Preview mode
            const preview = searchParams.get('preview');
            if (preview === PREVIEW_KEY) {
                localStorage.setItem('fire_course_token', 'preview-access');
                setAccessState('granted');
                return;
            }

            // 2. Supabase auth — check course_purchaser flag
            if (user) {
                try {
                    const { data } = await supabase
                        .from('user_profiles')
                        .select('course_purchaser')
                        .eq('id', user.id)
                        .single();

                    if (data?.course_purchaser) {
                        setAccessState('granted');
                        return;
                    }
                } catch {
                    // Fall through to other checks
                }
            }

            // 3. localStorage fallback (for transition / preview)
            const token = localStorage.getItem('fire_course_token');
            if (token) {
                setAccessState('granted');
                return;
            }

            setAccessState('denied');
        };

        checkAccess();
    }, [user, authLoading, searchParams]);

    // ── Load progress ──
    useEffect(() => {
        const saved = localStorage.getItem('fire_course_progress');
        if (saved) {
            try { setCompleted(new Set(JSON.parse(saved))); } catch { /* ignore */ }
        }
    }, []);

    // ── Load announcements ──
    useEffect(() => {
        if (accessState !== 'granted') return;
        fetch('/api/course/announcements')
            .then(r => r.json())
            .then(d => setAnnouncements(d.announcements || []))
            .catch(() => {});

        const dismissed = localStorage.getItem('fire_dismissed_announcements');
        if (dismissed) {
            try { setDismissedAnnouncements(new Set(JSON.parse(dismissed))); } catch { /* ignore */ }
        }
    }, [accessState]);

    const dismissAnnouncement = (id: string) => {
        const next = new Set(dismissedAnnouncements);
        next.add(id);
        setDismissedAnnouncements(next);
        localStorage.setItem('fire_dismissed_announcements', JSON.stringify([...next]));
    };

    const markComplete = (idx: number) => {
        const next = new Set(completed);
        next.add(idx);
        setCompleted(next);
        localStorage.setItem('fire_course_progress', JSON.stringify([...next]));
    };

    const goNext = () => {
        markComplete(activeModule);
        if (activeModule < 6) setActiveModule(activeModule + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goPrev = () => {
        if (activeModule > 0) setActiveModule(activeModule - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ── Loading ──
    if (accessState === 'loading') {
        return (
            <div className="fire-learn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="fire-loading-spinner" />
                    <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '12px' }}>Loading your course...</p>
                </div>
            </div>
        );
    }

    // ── HIGH-CONVERTING PAYWALL ──
    if (accessState === 'denied') {
        return (
            <div className="fire-learn">
                <div className="fire-paywall">
                    <div className="fire-paywall-glow" />
                    <div className="fire-paywall-content">
                        <div className="fire-paywall-badge">
                            <Flame size={14} /> THE FIRE COURSE
                        </div>

                        <h1 className="fire-paywall-title">
                            You&apos;re <span style={{ color: '#ef4444' }}>This Close</span> to<br />
                            Seeing the System.
                        </h1>

                        <p style={{ color: '#9ca3af', fontSize: '15px', lineHeight: 1.7, marginBottom: '24px' }}>
                            7 modules. Interactive calculators. The exact pattern-breaking strategy that hits at 70%+.
                            It&apos;s all right behind this page — waiting for you.
                        </p>

                        {/* Blurred module peek */}
                        <div className="fire-paywall-peek">
                            <div className="peek-item">
                                <span className="peek-num">1</span>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '14px' }}>The Hidden Pattern</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Why MLB teams alternate W-L...</div>
                                </div>
                            </div>
                            <div className="peek-item">
                                <span className="peek-num">2</span>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '14px' }}>Reading the Board</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Master the live dashboard...</div>
                                </div>
                            </div>
                            <div className="peek-item locked">
                                <Lock size={14} style={{ color: '#6b7280' }} />
                                <span style={{ color: '#6b7280', fontSize: '13px' }}>5 more modules locked...</span>
                            </div>
                        </div>

                        <div className="fire-paywall-stats">
                            <div className="pw-stat">
                                <Star size={14} style={{ color: '#fbbf24' }} />
                                <span><strong style={{ color: '#fbbf24' }}>70%+</strong> documented win rate</span>
                            </div>
                            <div className="pw-stat">
                                <TrendingUp size={14} style={{ color: '#FFC107' }} />
                                <span><strong style={{ color: '#FFC107' }}>Pattern System</strong> access included</span>
                            </div>
                            <div className="pw-stat">
                                <Shield size={14} style={{ color: '#a78bfa' }} />
                                <span><strong style={{ color: '#a78bfa' }}>Double-Up Recovery</strong> — never truly lose</span>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push('/course')}
                            className="fire-paywall-cta"
                        >
                            <Flame size={18} />
                            Unlock The Fire Course — $497
                            <ArrowRight size={16} />
                        </button>

                        <p style={{ color: '#374151', fontSize: '11px', marginTop: '12px' }}>
                            One-time payment · Lifetime access · Pattern System included
                        </p>

                        {user && (
                            <p style={{ color: '#4b5563', fontSize: '11px', marginTop: '16px' }}>
                                Signed in as {user.email} — this account doesn&apos;t have course access yet.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── COURSE CONTENT (Access Granted) ──
    const ActiveModule = MODULE_COMPONENTS[activeModule];
    const progress = Math.round((completed.size / 7) * 100);
    const visibleAnnouncements = announcements.filter(a => !dismissedAnnouncements.has(a.id));

    return (
        <div className="fire-learn">
            {/* Header */}
            <div className="learn-header">
                <h1>🔥 The Fire Course</h1>
                <p>{completed.size}/7 modules completed</p>
                <div className="learn-progress-bar">
                    <div className="learn-progress-fill" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Announcements */}
            {visibleAnnouncements.length > 0 && (
                <div className="learn-announcements">
                    {visibleAnnouncements.map(a => (
                        <div key={a.id} className={`learn-announcement ${a.type}`}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <Megaphone size={16} style={{ color: a.type === 'alert' ? '#ef4444' : a.type === 'update' ? '#FFC107' : '#fbbf24', flexShrink: 0, marginTop: '2px' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>{a.title}</div>
                                    <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>{a.body}</div>
                                </div>
                                <button
                                    onClick={() => dismissAnnouncement(a.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#4b5563' }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Pattern System Launch Button ── */}
            <div className="learn-launch-bar">
                <button
                    onClick={() => router.push('/patterns')}
                    className="learn-launch-btn"
                >
                    <Rocket size={16} />
                    <span>Launch Pattern System — Live Dashboard</span>
                    <ArrowRight size={14} />
                </button>
            </div>

            {/* Module Navigation */}
            <nav className="learn-nav">
                {MODULES.map((mod, i) => (
                    <button
                        key={i}
                        className={`learn-nav-btn ${activeModule === i ? 'active' : ''} ${completed.has(i) ? 'completed' : ''}`}
                        onClick={() => { setActiveModule(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
                        {completed.has(i) ? <CheckCircle size={12} /> : <mod.icon size={12} />}
                        <span>{mod.num}. {mod.title}</span>
                    </button>
                ))}
            </nav>

            {/* Module Content */}
            <div className="learn-content">
                <ActiveModule />

                <div className="learn-nav-footer">
                    {activeModule > 0 ? (
                        <button className="learn-nav-btn-lg prev" onClick={goPrev}>
                            <ChevronLeft size={16} /> Previous Module
                        </button>
                    ) : <div />}

                    {activeModule < 6 ? (
                        <button className="learn-nav-btn-lg next" onClick={goNext}>
                            Next Module <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button
                            className="learn-nav-btn-lg next"
                            onClick={() => {
                                markComplete(6);
                                alert('🔥 Congratulations! You\'ve completed The Fire Course! Launch the Pattern System to start applying what you learned.');
                            }}
                        >
                            <Flame size={16} /> Complete Course
                        </button>
                    )}
                </div>
            </div>

            {/* Floating Pattern System Button */}
            <button
                onClick={() => router.push('/patterns')}
                className="learn-floating-btn"
                title="Open Live Pattern Dashboard"
            >
                <Rocket size={18} />
            </button>
        </div>
    );
}
