'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Flame, ChevronLeft, ChevronRight, CheckCircle, Lock,
    BookOpen, Eye, Target, BarChart3, TrendingUp, Shield, Zap,
    ArrowRight, AlertTriangle
} from 'lucide-react';
import Module1 from './modules/Module1';
import Module2 from './modules/Module2';
import Module3 from './modules/Module3';
import Module4 from './modules/Module4';
import Module5 from './modules/Module5';
import Module6 from './modules/Module6';
import Module7 from './modules/Module7';
import './learn.css';

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

export default function LearnPage() {
    const router = useRouter();
    const [activeModule, setActiveModule] = useState(0);
    const [completed, setCompleted] = useState<Set<number>>(new Set());
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('fire_course_token');
        setHasAccess(!!token);
        const saved = localStorage.getItem('fire_course_progress');
        if (saved) {
            try { setCompleted(new Set(JSON.parse(saved))); } catch { /* ignore */ }
        }
    }, []);

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

    if (hasAccess === null) return null; // Loading

    if (!hasAccess) {
        return (
            <div className="fire-learn">
                <div className="learn-gate">
                    <div className="learn-gate-card">
                        <Lock size={48} style={{ color: '#6b7280', marginBottom: '20px' }} />
                        <h1 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '12px' }}>Course Access Required</h1>
                        <p style={{ color: '#9ca3af', fontSize: '15px', lineHeight: 1.7, marginBottom: '24px' }}>
                            You need to purchase The Fire Course to access these modules.
                        </p>
                        <button
                            onClick={() => router.push('/course')}
                            style={{
                                padding: '14px 28px', borderRadius: '12px', border: 'none',
                                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                color: 'white', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                            }}
                        >
                            <Flame size={16} /> Get The Fire Course <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const ActiveModule = MODULE_COMPONENTS[activeModule];
    const progress = Math.round((completed.size / 7) * 100);

    return (
        <div className="fire-learn">
            <div className="learn-header">
                <h1>🔥 The Fire Course</h1>
                <p>{completed.size}/7 modules completed</p>
                <div className="learn-progress-bar">
                    <div className="learn-progress-fill" style={{ width: `${progress}%` }} />
                </div>
            </div>

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
                            onClick={() => { markComplete(6); alert('🔥 Congratulations! You\'ve completed The Fire Course!'); }}
                        >
                            <Flame size={16} /> Complete Course
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
